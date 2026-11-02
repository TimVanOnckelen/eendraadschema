/**
 * Builds complete print pages (drawing + title block) as SVG.
 *
 * The same SVG is used for the on-screen print preview and for the PDF
 * (converted to vector PDF with svg2pdf.js), so the preview always matches
 * the exported document exactly.
 *
 * All page coordinates are in millimetres.
 */

export type PaperSize = "A4" | "A3";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageLayout {
  width: number;
  height: number;
  /** Area available for the drawing. */
  drawing: Rect;
  /** Title block (cartouche) at the bottom right. */
  titleBlock: Rect;
  /** Height of the footer row ("Getekend met ...") inside the title block. */
  footerHeight: number;
  /** Width of each of the three address columns. */
  columnWidth: number;
}

const MARGIN = 10;
const GAP_BELOW_DRAWING = 5;
const TITLE_HEIGHT = 30;
const FOOTER_HEIGHT = 5;
const COLUMN_WIDTH = 80;
/** The title block keeps its A4 width on larger paper and sticks to the right. */
const TITLE_WIDTH = 297 - 2 * MARGIN;

export const PDF_FONT_FAMILY = "EDS Sans";
const SCREEN_FONT_FAMILY = "Arial, Helvetica, sans-serif";

/**
 * Page geometry. The drawing area (A4: 277 x 150 mm, A3: 400 x 237 mm) is what
 * the automatic pagination in Print_Table is tuned for.
 */
export function getPageLayout(papersize: PaperSize | string): PageLayout {
  const [width, height] = papersize === "A3" ? [420, 297] : [297, 210];
  const titleHeight = TITLE_HEIGHT + FOOTER_HEIGHT;
  return {
    width,
    height,
    drawing: {
      x: MARGIN,
      y: MARGIN,
      w: width - 2 * MARGIN,
      h: height - 2 * MARGIN - titleHeight - GAP_BELOW_DRAWING,
    },
    titleBlock: {
      x: width - MARGIN - TITLE_WIDTH,
      y: height - MARGIN - titleHeight,
      w: TITLE_WIDTH,
      h: titleHeight,
    },
    footerHeight: FOOTER_HEIGHT,
    columnWidth: COLUMN_WIDTH,
  };
}

/** Drawing content of one page: an SVG fragment shown through a viewBox. */
export interface PageContent {
  /** Inner SVG markup (without the outer <svg> element). */
  markup: string;
  /** viewBox of the content in drawing pixels. */
  viewBox: { x: number; y: number; w: number; h: number };
}

export interface TitleBlockData {
  control: string; // Erkend organisme (HTML)
  owner: string; // Plaats van de installatie (HTML)
  installer: string; // Installateur (HTML)
  info: string; // Extra info (HTML)
  kind: string; // "Eéndraadschema" / "Situatieschema"
  pageNumber: number;
  pageCount: number;
  date: string;
}

export interface PageSpec {
  content: PageContent;
  /** Millimetres per drawing pixel. */
  scale: number;
  /** Horizontal placement within the drawing area. */
  align: "center" | "left";
  title: TitleBlockData;
}

/** Largest scale (mm per pixel) at which the content fits the drawing area. */
export function fitScale(layout: PageLayout, viewBox: { w: number; h: number }): number {
  if (viewBox.w <= 0 || viewBox.h <= 0) return 1;
  return Math.min(layout.drawing.w / viewBox.w, layout.drawing.h / viewBox.h);
}

/**
 * Splits a full <svg ...>...</svg> string into its inner markup and viewBox.
 */
export function contentFromSvg(svg: string): PageContent {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  const vb = (root.getAttribute("viewBox") || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  let viewBox = { x: 0, y: 0, w: 0, h: 0 };
  if (vb.length === 4 && vb.every((n) => Number.isFinite(n))) {
    viewBox = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
  } else {
    viewBox.w = parseFloat(root.getAttribute("width") || "0");
    viewBox.h = parseFloat(root.getAttribute("height") || "0");
  }
  const serializer = new XMLSerializer();
  const markup = Array.from(root.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join("");
  return { markup, viewBox };
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Converts the HTML used in the settings (with <br> and <div>) to text lines. */
export function htmlToLines(html: string | undefined | null): string[] {
  if (!html) return [];
  const normalized = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n")
    .replace(/<(div|p)[^>]*>/gi, "");
  const el = document.createElement("div");
  el.innerHTML = normalized;
  return (el.textContent || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, i, all) => line !== "" || (i > 0 && i < all.length - 1));
}

let measureCtx: CanvasRenderingContext2D | null = null;

/** Text width in mm for the given font size (mm). Arial metrics == EDS Sans metrics. */
function textWidth(text: string, sizeMm: number, bold = false): number {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * sizeMm * 0.5;
  measureCtx.font = `${bold ? "bold " : ""}100px Arial, Helvetica, sans-serif`;
  return (measureCtx.measureText(text).width / 100) * sizeMm;
}

/** Word-wraps lines to a maximum width; ellipsizes when maxLines is exceeded. */
function wrapLines(lines: string[], maxWidth: number, sizeMm: number, maxLines: number, bold = false): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const words = line.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (textWidth(candidate, sizeMm, bold) <= maxWidth || !current) {
        current = candidate;
      } else {
        out.push(current);
        current = word;
      }
    }
    out.push(current);
  }
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && textWidth(last + "…", sizeMm, bold) > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = last + "…";
    return kept;
  }
  return out;
}

const PT = 0.352778; // 1pt in mm

function textBlock(
  lines: string[],
  x: number,
  y: number,
  sizePt: number,
  opts: { bold?: boolean; color?: string; lineHeight?: number } = {}
): string {
  const size = sizePt * PT;
  const lh = size * (opts.lineHeight ?? 1.25);
  return lines
    .map(
      (line, i) =>
        `<text x="${x.toFixed(2)}" y="${(y + i * lh).toFixed(2)}" font-size="${size.toFixed(3)}"` +
        ` font-family="${SCREEN_FONT_FAMILY}"${opts.bold ? ' font-weight="bold"' : ""}` +
        ` fill="${opts.color ?? "#000"}">${escapeXml(line)}</text>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Title block
// ---------------------------------------------------------------------------

function titleBlockSvg(layout: PageLayout, data: TitleBlockData): string {
  const { x, y, w, h } = layout.titleBlock;
  const bodyH = h - layout.footerHeight;
  const colW = layout.columnWidth;
  const lastX = x + 3 * colW;
  const lastW = w - 3 * colW;
  const pad = 2;
  const labelPt = 6.5;
  const valuePt = 8;
  const labelY = y + pad + labelPt * PT;
  const valueY = labelY + 3.6;
  const valueLines = Math.floor((bodyH - (valueY - y) - pad + valuePt * PT) / (valuePt * PT * 1.25));
  const grey = "#5f6670";
  const line = 'stroke="#000" stroke-width="0.25" fill="none"';

  let s = `<g class="title-block">`;
  // Frame and column separators
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" ${line}/>`;
  for (let i = 1; i <= 3; i++) {
    s += `<line x1="${x + i * colW}" y1="${y}" x2="${x + i * colW}" y2="${y + (i === 3 ? h : bodyH)}" ${line}/>`;
  }
  s += `<line x1="${x}" y1="${y + bodyH}" x2="${lastX}" y2="${y + bodyH}" ${line}/>`;

  const columns: [string, string][] = [
    ["ERKEND ORGANISME", data.control],
    ["PLAATS VAN DE ELEKTRISCHE INSTALLATIE", data.owner],
    ["INSTALLATEUR", data.installer],
  ];
  columns.forEach(([label, value], i) => {
    const cx = x + i * colW + pad;
    const maxW = colW - 2 * pad;
    s += textBlock(wrapLines([label], maxW, labelPt * PT, 1, true), cx, labelY, labelPt, { bold: true, color: grey });
    s += textBlock(wrapLines(htmlToLines(value), maxW, valuePt * PT, valueLines), cx, valueY, valuePt);
  });

  // Last column: document identification
  const lx = lastX + pad;
  const lMax = lastW - 2 * pad;
  s += textBlock([data.kind], lx, labelY + 0.6, 9.5, { bold: true });
  s += textBlock([`Pagina ${data.pageNumber} / ${data.pageCount}`], lx, labelY + 4.6, valuePt);
  s += textBlock([data.date], lx, labelY + 8.2, valuePt, { color: grey });
  const infoLines = wrapLines(htmlToLines(data.info), lMax, valuePt * PT, 4);
  s += textBlock(infoLines, lx, labelY + 13.4, valuePt);

  // Footer
  s += textBlock(
    ["Getekend met https://eendraadschema.xeweb.be"],
    x + pad,
    y + bodyH + layout.footerHeight / 2 + (7 * PT) * 0.35,
    7,
    { color: grey }
  );
  s += `</g>`;
  return s;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Returns a complete page as SVG (viewBox in mm). With `forPdf` all fonts are
 * mapped to the embedded PDF font so svg2pdf.js can render every glyph.
 */
export function buildPageSvg(layout: PageLayout, spec: PageSpec, forPdf = false): string {
  const { viewBox: vb } = spec.content;
  const drawW = vb.w * spec.scale;
  const drawH = vb.h * spec.scale;
  const dx = spec.align === "left" ? layout.drawing.x : layout.drawing.x + (layout.drawing.w - drawW) / 2;
  const dy = layout.drawing.y + (layout.drawing.h - drawH) / 2;

  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
    ` width="${layout.width}mm" height="${layout.height}mm" viewBox="0 0 ${layout.width} ${layout.height}"` +
    ` font-family="${SCREEN_FONT_FAMILY}">` +
    `<rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="#fff"/>`;

  if (drawW > 0 && drawH > 0) {
    svg +=
      `<svg x="${dx}" y="${dy}" width="${drawW}" height="${drawH}"` +
      ` viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" overflow="hidden">` +
      spec.content.markup +
      `</svg>`;
  }

  svg += titleBlockSvg(layout, spec.title) + `</svg>`;

  if (forPdf) {
    // svg2pdf.js only knows fonts registered in jsPDF; map every family to ours.
    svg = svg
      .replace(/font-family="[^"]*"/g, `font-family="${PDF_FONT_FAMILY}"`)
      .replace(/font-family='[^']*'/g, `font-family="${PDF_FONT_FAMILY}"`)
      .replace(/font-family:\s*[^;"']+/g, `font-family:${PDF_FONT_FAMILY}`)
      // No italic cut is embedded; without this svg2pdf falls back to Times.
      .replace(/\sfont-style="[^"]*"/g, "")
      .replace(/font-style:\s*[^;"']+;?/g, "");
  }
  return svg;
}
