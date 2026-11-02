import { iconSvg } from "../utils/icons";
import { download_by_blob } from "../importExport/importExport";
import { SVGelement } from "../SVGelement";
import { flattenSVGfromString, htmlspecialchars } from "../general";
import {
  collectPrintDocument,
  generatePdf,
  parsePageRange,
  pdfFilename,
} from "./printToJsPDF";
import { buildPageSvg } from "./pdfPage";

/**
 * Print view: PDF export settings, page layout and a WYSIWYG page preview.
 * Rendered into #configsection (legacy, re-rendered by printsvg() on every change).
 */

type PdfStatus =
  | { kind: "idle" }
  | { kind: "busy"; done: number; total: number; pageNumber: number }
  | { kind: "done"; filename: string; pages: number; rasterized: number[] }
  | { kind: "error"; message: string };

// State that must survive the re-renders of printsvg().
let pdfStatus: PdfStatus = { kind: "idle" };
let pdfName: string | null = null;
let pdfNameSource = "";

const totalPageCount = () =>
  globalThis.structure.print_table.pages.length +
  (globalThis.structure.sitplan ? globalThis.structure.sitplan.getNumPages() : 0);

/** File name proposal derived from the open document, until the user edits it. */
function currentPdfName(): string {
  const source = globalThis.structure?.properties?.filename || "";
  if (pdfName === null || source !== pdfNameSource) {
    pdfName = pdfFilename(source);
    pdfNameSource = source;
  }
  return pdfName;
}

globalThis.HLDisplayPage = () => {
  globalThis.structure.print_table.displaypage =
    parseInt((document.getElementById("id_select_page") as HTMLInputElement).value) - 1;
  printsvg();
};

/** Downloads the drawing of the previewed page as SVG (without title block). */
globalThis.dosvgdownload = () => {
  const printTable = globalThis.structure.print_table;
  const page = printTable.displaypage;
  let svg: string;
  if (page < printTable.pages.length) {
    svg = getPrintSVGWithoutAddress(globalThis.structure.toSVG(0, "horizontal"), page);
  } else {
    svg = globalThis.structure.sitplan.toSitPlanPrint().pages[page - printTable.pages.length].svg;
  }
  const input = document.getElementById("dosvgname") as HTMLInputElement | null;
  const name = (input?.value || "eendraadschema").trim().replace(/\.svg$/i, "") + ".svg";
  download_by_blob(svg, name, "data:image/svg+xml;charset=utf-8");
};

export function getPrintSVGWithoutAddress(
  outSVG: SVGelement,
  page: number = globalThis.structure.print_table.displaypage
) {
  var scale = globalThis.structure.print_table.scale || 1;

  var startx = globalThis.structure.print_table.pages[page].start;
  var width = globalThis.structure.print_table.pages[page].stop - startx;
  var starty = globalThis.structure.print_table.getstarty();
  var height = globalThis.structure.print_table.getstopy() - starty;

  var viewbox = "" + startx + " " + starty + " " + width + " " + height;

  var outstr =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" transform="scale(1,1)" style="border:1px solid white" ' +
    'height="' +
    height * scale +
    '" width="' +
    width * scale +
    '" viewBox="' +
    viewbox +
    '">' +
    flattenSVGfromString(outSVG.data) +
    "</svg>";

  return outstr;
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

function renderPdfStatus() {
  const el = document.getElementById("progress_pdf");
  const button = document.getElementById("button_pdfdownload") as HTMLButtonElement | null;
  if (button) {
    const busy = pdfStatus.kind === "busy";
    button.disabled = busy || !globalThis.structure.print_table.canPrint();
    button.innerHTML = busy
      ? '<span class="print-spinner" aria-hidden="true"></span>PDF maken…'
      : iconSvg("download") + "Download PDF";
  }
  if (!el) return;

  el.className = "print-progress";
  switch (pdfStatus.kind) {
    case "idle":
      el.innerHTML = "";
      break;
    case "busy": {
      const pct = Math.round((pdfStatus.done / Math.max(1, pdfStatus.total)) * 100);
      el.innerHTML =
        `<div class="print-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">` +
        `<span style="width:${Math.max(4, pct)}%"></span></div>` +
        `<span>Pagina ${pdfStatus.pageNumber} wordt verwerkt (${Math.min(pdfStatus.done + 1, pdfStatus.total)} van ${pdfStatus.total})…</span>`;
      break;
    }
    case "done":
      el.classList.add("is-success");
      el.innerHTML =
        iconSvg("check") +
        `<span><strong>${htmlspecialchars(pdfStatus.filename)}</strong> is gedownload (${pdfStatus.pages} ${
          pdfStatus.pages === 1 ? "pagina" : "pagina's"
        }).` +
        (pdfStatus.rasterized.length
          ? ` Pagina ${pdfStatus.rasterized.join(", ")} bevat elementen die als afbeelding zijn opgenomen.`
          : "") +
        `</span>`;
      break;
    case "error":
      el.classList.add("is-error");
      el.innerHTML = iconSvg("alert") + `<span>${htmlspecialchars(pdfStatus.message)}</span>`;
      break;
  }
}

async function downloadPdf() {
  if (pdfStatus.kind === "busy") return;
  const printTable = globalThis.structure.print_table;
  if (!printTable.canPrint()) return;

  if (typeof globalThis.structure.properties.dpi == "undefined") globalThis.structure.properties.dpi = 300;

  const filename = pdfFilename(currentPdfName());
  try {
    const printDoc = collectPrintDocument();
    const range = printTable.printPageMode === "custom" ? printTable.printPageRange || "" : "";
    const pageIndices = parsePageRange(range, printDoc.pages.length);

    pdfStatus = { kind: "busy", done: 0, total: pageIndices.length, pageNumber: pageIndices[0] + 1 };
    renderPdfStatus();

    const result = await generatePdf(printDoc, {
      pageIndices,
      dpi: globalThis.structure.properties.dpi,
      onProgress: (p) => {
        pdfStatus = { kind: "busy", ...p };
        renderPdfStatus();
      },
    });
    await result.doc.save(filename, { returnPromise: true });
    pdfStatus = { kind: "done", filename, pages: pageIndices.length, rasterized: result.rasterizedPages };
  } catch (error) {
    console.error("PDF genereren mislukt:", error);
    pdfStatus = {
      kind: "error",
      message: "De PDF kon niet worden gemaakt: " + (error instanceof Error ? error.message : String(error)),
    };
  }
  renderPdfStatus();
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

export function printsvg() {
  const structure = globalThis.structure;
  const printTable = structure.print_table;

  // Size of the eendraadschema drives the pagination.
  const outSVG: SVGelement = structure.toSVG(0, "horizontal");
  printTable.setHeight(outSVG.yup + outSVG.ydown);
  printTable.setMaxWidth(outSVG.xleft + outSVG.xright + 10);

  const configsection = document.getElementById("configsection");
  if (configsection == null) return;

  configsection.innerHTML =
    '<header class="page-header">' +
    '<p class="page-eyebrow">Print</p>' +
    '<h1 class="page-title">Afdrukken</h1>' +
    '<p class="page-subtitle">Exporteer het eéndraadschema en het situatieschema als PDF, klaar om af te drukken of te bezorgen.</p>' +
    "</header>" +
    '<section class="card print-card"><div class="card-body">' +
    '<h2 class="card-title">' + iconSvg("file-text") + "PDF exporteren</h2>" +
    '<div class="print-form">' +
    '<div class="print-field" id="select_papersize"></div>' +
    '<div class="print-field" id="select_scale"></div>' +
    '<div class="print-field print-field-range" id="select_page_range"></div>' +
    '<label class="print-field print-field-name"><span>Bestandsnaam</span>' +
    '<input id="dopdfname" type="text" autocomplete="off" spellcheck="false"></label>' +
    "</div>" +
    '<div class="print-actions">' +
    '<button id="button_pdfdownload" type="button" class="btn btn-primary"></button>' +
    '<span class="print-hint">Scherpe vectorkwaliteit, met titelblok op elke pagina.</span>' +
    "</div>" +
    '<div id="progress_pdf" class="print-progress" aria-live="polite"></div>' +
    "</div></section>";

  const nameInput = document.getElementById("dopdfname") as HTMLInputElement;
  nameInput.value = currentPdfName();
  nameInput.addEventListener("input", () => {
    pdfName = nameInput.value;
  });
  nameInput.addEventListener("change", () => {
    pdfName = pdfFilename(nameInput.value);
    nameInput.value = pdfName;
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void downloadPdf();
  });
  document.getElementById("button_pdfdownload")!.addEventListener("click", () => void downloadPdf());

  printTable.insertHTMLselectPaperSize(document.getElementById("select_papersize") as HTMLElement, printsvg);
  printTable.insertHTMLselectScale(document.getElementById("select_scale") as HTMLElement, printsvg);
  printTable.insertHTMLselectPageRange(document.getElementById("select_page_range") as HTMLElement, () => {
    renderPdfStatus();
  });
  // Re-validate the button whenever the page range changes.
  document.getElementById("select_page_range")!.addEventListener("input", renderPdfStatus);
  document.getElementById("select_page_range")!.addEventListener("change", renderPdfStatus);
  renderPdfStatus();

  // Page layout settings
  configsection.insertAdjacentHTML(
    "beforeend",
    '<section class="card print-card"><div class="card-body">' +
      '<h2 class="card-title">' + iconSvg("settings") + "Pagina-indeling</h2>" +
      '<div class="print-controls">' +
      '<span id="check_autopage"></span>' +
      '<span id="id_verticals"></span>' +
      '<span id="id_suggest_xpos_button"></span>' +
      "</div>" +
      "</div></section>"
  );

  printTable.insertHTMLcheckAutopage(document.getElementById("check_autopage") as HTMLElement, printsvg);
  if (!printTable.enableAutopage) {
    printTable.insertHTMLchooseVerticals(document.getElementById("id_verticals") as HTMLElement, printsvg);
    printTable.insertHTMLsuggestXposButton(document.getElementById("id_suggest_xpos_button") as HTMLElement, printsvg);

    configsection.insertAdjacentHTML(
      "beforeend",
      '<section class="card print-card"><div class="card-body">' +
        '<h2 class="card-title">' + iconSvg("zoom-fit") + "Paginaverdeling</h2>" +
        '<div class="print-split">' +
        '<div id="id_print_table"></div>' +
        "<div>" +
        '<p style="margin-bottom: 8px;">Klik op de + knop om het schema over meerdere pagina\'s te printen en kies voor elke pagina de start- en stop-positie in het schema (in pixels).</p>' +
        '<p style="margin-bottom: 8px;">Je kan eventueel ook de tekst (info) aanpassen die op elke pagina rechts onderaan komt te staan.</p>' +
        "<p>Onderaan kan je bekijken welk deel van het schema op welke pagina belandt.</p>" +
        "</div>" +
        "</div>" +
        "</div></section>"
    );
    printTable.insertHTMLposxTable(document.getElementById("id_print_table") as HTMLElement, printsvg);
  }

  // Preview
  const printDoc = collectPrintDocument(structure);
  const numPages = printDoc.pages.length;
  if (printTable.displaypage >= numPages) printTable.displaypage = numPages - 1;
  if (printTable.displaypage < 0) printTable.displaypage = 0;
  const current = printTable.displaypage;

  let options = "";
  printDoc.pages.forEach((page, i) => {
    options += `<option value="${i + 1}"${i === current ? " selected" : ""}>${i + 1} · ${page.title.kind}</option>`;
  });

  configsection.insertAdjacentHTML(
    "beforeend",
    '<section class="card print-card"><div class="card-body">' +
      '<h2 class="card-title">' + iconSvg("eye") + "Voorbeeld</h2>" +
      '<div class="print-preview-toolbar">' +
      '<div class="print-pager">' +
      `<button type="button" class="btn btn-icon" id="print_prev" aria-label="Vorige pagina"${current <= 0 ? " disabled" : ""}>${iconSvg("chevron-left")}</button>` +
      `<select id="id_select_page" aria-label="Pagina">${options}</select>` +
      `<span class="print-pager-count">van ${numPages}</span>` +
      `<button type="button" class="btn btn-icon" id="print_next" aria-label="Volgende pagina"${current >= numPages - 1 ? " disabled" : ""}>${iconSvg("chevron-right")}</button>` +
      "</div>" +
      '<div class="print-svg-export">' +
      '<input id="dosvgname" type="text" value="eendraadschema" aria-label="Bestandsnaam SVG">' +
      '<button id="button_svgdownload" type="button" class="btn">' + iconSvg("download") + "Tekening als SVG</button>" +
      "</div>" +
      "</div>" +
      '<div id="printarea" class="print-area"></div>' +
      '<p class="print-hint" style="margin-top: 8px;">Zo komt de pagina in de PDF. De SVG bevat enkel de tekening van deze pagina, zonder titelblok.</p>' +
      "</div></section>"
  );

  document.getElementById("id_select_page")!.addEventListener("change", globalThis.HLDisplayPage);
  document.getElementById("button_svgdownload")!.addEventListener("click", globalThis.dosvgdownload);
  const go = (delta: number) => {
    printTable.displaypage = Math.max(0, Math.min(numPages - 1, current + delta));
    printsvg();
  };
  document.getElementById("print_prev")!.addEventListener("click", () => go(-1));
  document.getElementById("print_next")!.addEventListener("click", () => go(1));

  const printarea = document.getElementById("printarea");
  if (printarea && printDoc.pages[current]) {
    printarea.innerHTML =
      '<div class="print-paper">' + buildPageSvg(printDoc.layout, printDoc.pages[current]) + "</div>";
  }

  globalThis.toggleAppView("config");
}
