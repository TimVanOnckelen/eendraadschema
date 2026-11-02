import { jsPDF } from "jspdf";
import { flattenSVGfromString } from "../general";
import {
  buildPageSvg,
  contentFromSvg,
  fitScale,
  getPageLayout,
  PageLayout,
  PageSpec,
  PDF_FONT_FAMILY,
} from "./pdfPage";

/**
 * PDF export.
 *
 * Every page is built as one SVG (drawing + title block, see pdfPage.ts) and
 * converted to vector PDF with svg2pdf.js: sharp at any zoom level, small
 * files and selectable text. Should a page fail to convert (e.g. an image
 * format svg2pdf cannot handle), that page falls back to a high resolution
 * bitmap so the export always completes.
 */

export interface PrintDocument {
  layout: PageLayout;
  pages: PageSpec[];
  /** Number of eendraadschema pages; situatieschema pages follow. */
  edsPageCount: number;
}

/**
 * Collects all printable pages of the current structure.
 * Eendraadschema pages share one scale so symbols are equally large on every page.
 */
export function collectPrintDocument(structure: any = globalThis.structure): PrintDocument {
  const printTable = structure.print_table;
  const properties = structure.properties;
  const layout = getPageLayout(printTable.getPaperSize?.() ?? printTable.papersize);

  const eds = structure.toSVG(0, "horizontal");
  const edsMarkup = flattenSVGfromString(eds.data);
  const starty = printTable.getstarty();
  const height = printTable.getstopy() - starty;

  const edsContents = printTable.pages.map((page: any) => ({
    markup: edsMarkup,
    viewBox: { x: page.start, y: starty, w: page.stop - page.start, h: height },
  }));
  const edsScale = Math.min(...edsContents.map((c: any) => fitScale(layout, c.viewBox)));

  const sitplan = structure.sitplan ? structure.sitplan.toSitPlanPrint() : { numpages: 0, pages: [] };
  const sitContents = sitplan.pages.map((page: any) => contentFromSvg(page.svg));

  const pageCount = edsContents.length + sitContents.length;
  const date = new Date().toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const title = (kind: string, index: number, info: string) => ({
    control: properties.control,
    owner: properties.owner,
    installer: properties.installer,
    info,
    kind,
    pageNumber: index + 1,
    pageCount,
    date,
  });

  const pages: PageSpec[] = [
    ...edsContents.map((content: any, i: number) => ({
      content,
      scale: edsScale,
      align: (edsContents.length > 1 ? "left" : "center") as "left" | "center",
      title: title(
        "Eéndraadschema",
        i,
        printTable.enableAutopage ? properties.info : printTable.pages[i].info || properties.info
      ),
    })),
    ...sitContents.map((content: any, i: number) => ({
      content,
      scale: fitScale(layout, content.viewBox),
      align: "center" as const,
      title: title("Situatieschema", edsContents.length + i, properties.info),
    })),
  ];

  return { layout, pages, edsPageCount: edsContents.length };
}

/**
 * Parses a page range like "1-3, 5" into 0-based page indices.
 * An empty range selects all pages.
 */
export function parsePageRange(range: string, total: number): number[] {
  const selected = new Set<number>();
  const parts = range.split(",").map((r) => r.trim()).filter(Boolean);
  if (parts.length === 0) return Array.from({ length: total }, (_, i) => i);
  for (const part of parts) {
    const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
    const start = a;
    const end = Number.isFinite(b) ? b : a;
    for (let p = start; p <= end; p++) if (p >= 1 && p <= total) selected.add(p - 1);
  }
  return Array.from(selected).sort((x, y) => x - y);
}

export interface PdfProgress {
  done: number;
  total: number;
  pageNumber: number;
}

export interface PdfOptions {
  /** 0-based indices of the pages to export. */
  pageIndices: number[];
  /** Resolution for the bitmap fallback. */
  dpi: number;
  onProgress?: (progress: PdfProgress) => void;
}

export interface PdfResult {
  doc: jsPDF;
  /** Page numbers (1-based) that had to be rasterised. */
  rasterizedPages: number[];
}

let fontsPromise: Promise<typeof import("./fonts/edsSans")> | null = null;

async function registerFonts(doc: jsPDF) {
  fontsPromise ??= import("./fonts/edsSans");
  const fonts = await fontsPromise;
  doc.addFileToVFS("EDSSans-Regular.ttf", fonts.EDS_SANS_REGULAR);
  doc.addFont("EDSSans-Regular.ttf", PDF_FONT_FAMILY, "normal");
  doc.addFileToVFS("EDSSans-Bold.ttf", fonts.EDS_SANS_BOLD);
  doc.addFont("EDSSans-Bold.ttf", PDF_FONT_FAMILY, "bold");
  doc.setFont(PDF_FONT_FAMILY, "normal");
}

/** Renders an SVG string to a PNG data URL. */
function svgToPng(svg: string, widthPx: number, heightPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => reject(new Error("Afbeelding laden duurde te lang.")), 30000);
    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(widthPx);
        canvas.height = Math.round(heightPx);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas wordt niet ondersteund.");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(
          new Error(
            "Een afbeelding in het situatieschema verwijst naar een andere website en kan daardoor niet in de PDF worden opgenomen. " +
              "Sla de plattegrond op in een ander formaat (bv. PNG) en voeg hem opnieuw toe."
          )
        );
      }
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("De pagina kon niet als afbeelding worden weergegeven."));
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

/**
 * Replaces every <use> by a copy of the element it references. svg2pdf.js
 * renders <use> as a clipped form object whose bounding box ignores stroke
 * widths, so e.g. a purely vertical earth bar (zero width) disappears.
 * Lookups stay inside the given root, so ids elsewhere on the page don't interfere.
 */
function inlineUses(root: Element) {
  const byId = new Map<string, Element>();
  root.querySelectorAll("[id]").forEach((el) => {
    if (!byId.has(el.id)) byId.set(el.id, el);
  });
  // Nested uses inside referenced symbols are resolved in later passes.
  for (let pass = 0; pass < 8; pass++) {
    const uses = Array.from(root.querySelectorAll("use"));
    if (uses.length === 0) break;
    for (const use of uses) {
      const href = use.getAttribute("href") || use.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
      const target = href.startsWith("#") ? byId.get(href.slice(1)) : undefined;
      if (!target || target.contains(use)) {
        use.remove();
        continue;
      }
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      for (const attr of Array.from(use.attributes)) {
        if (!["x", "y", "width", "height", "href", "xlink:href", "transform"].includes(attr.name)) {
          g.setAttribute(attr.name, attr.value);
        }
      }
      const x = parseFloat(use.getAttribute("x") || "0") || 0;
      const y = parseFloat(use.getAttribute("y") || "0") || 0;
      const transform = [use.getAttribute("transform") || "", x || y ? `translate(${x} ${y})` : ""]
        .filter(Boolean)
        .join(" ");
      if (transform) g.setAttribute("transform", transform);
      const clone = target.cloneNode(true) as Element;
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      g.appendChild(clone);
      use.replaceWith(g);
    }
  }
}

/**
 * svg2pdf.js ignores <line> elements when computing the bounding box of a
 * group referenced by <use>, and clips them away (e.g. the cross of a lamp).
 * An equivalent <path> is measured correctly.
 */
function linesToPaths(root: Element) {
  root.querySelectorAll("line").forEach((line) => {
    const num = (name: string) => parseFloat(line.getAttribute(name) || "0") || 0;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const attr of Array.from(line.attributes)) {
      if (!["x1", "y1", "x2", "y2"].includes(attr.name)) path.setAttribute(attr.name, attr.value);
    }
    path.setAttribute("d", `M${num("x1")} ${num("y1")}L${num("x2")} ${num("y2")}`);
    if (!path.hasAttribute("fill")) path.setAttribute("fill", "none");
    line.replaceWith(path);
  });
}

/**
 * svg2pdf.js/jsPDF embed PNG and JPEG reliably; other formats (SVG plans,
 * WebP, GIF, ...) are converted to a high resolution PNG first so they are
 * never silently dropped from the PDF.
 */
async function normalizeImages(root: Element) {
  const images = Array.from(root.querySelectorAll("image"));
  for (const image of images) {
    const href = image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
    if (/^data:image\/(png|jpe?g);/i.test(href) || href === "") continue;
    const width = parseFloat(image.getAttribute("width") || "0") || 0;
    const height = parseFloat(image.getAttribute("height") || "0") || 0;
    const png = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = width || img.naturalWidth || 1000;
        const h = height || img.naturalHeight || 1000;
        const factor = Math.min(4, 4000 / Math.max(w, h)); // up to 4000 px on the long side
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * factor));
        canvas.height = Math.max(1, Math.round(h * factor));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas wordt niet ondersteund."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch {
          reject(
            new Error(
              "Een afbeelding in het situatieschema verwijst naar een andere website en kan daardoor niet in de PDF worden opgenomen. " +
                "Sla de plattegrond op in een ander formaat (bv. PNG) en voeg hem opnieuw toe."
            )
          );
        }
      };
      img.onerror = () => reject(new Error("Een afbeelding in het situatieschema kon niet worden geladen."));
      img.src = href;
    });
    image.setAttribute("href", png);
    image.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
  }
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export async function generatePdf(printDoc: PrintDocument, options: PdfOptions): Promise<PdfResult> {
  const { layout, pages } = printDoc;
  const indices = options.pageIndices.filter((i) => i >= 0 && i < pages.length);
  if (indices.length === 0) throw new Error("Er zijn geen pagina's geselecteerd om af te drukken.");

  const format = layout.width > 300 ? "a3" : "a4";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format, compress: true });
  await registerFonts(doc);
  const { svg2pdf } = await import("svg2pdf.js");

  // svg2pdf needs the element in the document for style resolution.
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:0;height:0;overflow:hidden;";
  document.body.appendChild(host);

  const rasterizedPages: number[] = [];
  try {
    for (let n = 0; n < indices.length; n++) {
      const index = indices[n];
      const spec = pages[index];
      options.onProgress?.({ done: n, total: indices.length, pageNumber: index + 1 });
      await nextFrame(); // let the progress indicator paint

      if (n > 0) doc.addPage(format, "landscape");

      try {
        host.innerHTML = buildPageSvg(layout, spec, true);
        const svgEl = host.firstElementChild as SVGSVGElement;
        inlineUses(svgEl);
        await normalizeImages(svgEl);
        linesToPaths(svgEl);
        await svg2pdf(svgEl, doc, { x: 0, y: 0, width: layout.width, height: layout.height });
      } catch (error) {
        console.warn(`Pagina ${index + 1}: vectorexport mislukt, terugval naar afbeelding.`, error);
        const pxPerMm = options.dpi / 25.4;
        const png = await svgToPng(buildPageSvg(layout, spec), layout.width * pxPerMm, layout.height * pxPerMm);
        // Cover anything svg2pdf may have drawn before failing.
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, layout.width, layout.height, "F");
        doc.addImage(png, "PNG", 0, 0, layout.width, layout.height, undefined, "FAST");
        rasterizedPages.push(index + 1);
      }
    }
  } finally {
    host.remove();
  }

  options.onProgress?.({ done: indices.length, total: indices.length, pageNumber: indices[indices.length - 1] + 1 });

  doc.setProperties({
    title: "Eéndraadschema",
    subject: "Eéndraadschema en situatieschema van de elektrische installatie",
    keywords: "eendraadschema, situatieschema, elektrische installatie",
    creator: "Eendraadschema",
  });

  return { doc, rasterizedPages };
}

/** Normalises a user supplied file name to "<name>.pdf". */
export function pdfFilename(name: string | undefined | null): string {
  let base = (name || "").trim().replace(/[\\/:*?"<>|]+/g, "_");
  base = base.replace(/\.(eds|json|pdf|svg)$/i, "");
  return (base || "eendraadschema") + ".pdf";
}
