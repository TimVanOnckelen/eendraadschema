import { iconSvg } from "../utils/icons";
import { download_by_blob } from "../importExport/importExport";
import { SVGelement } from "../SVGelement";
import { flattenSVGfromString } from "../general";
import { printPDF } from "./printToJsPDF";

globalThis.HLDisplayPage = () => {
  globalThis.structure.print_table.displaypage =
    parseInt(
      (document.getElementById("id_select_page") as HTMLInputElement).value
    ) - 1;
  printsvg();
};

globalThis.dosvgdownload = () => {
  const printsvgarea = document.getElementById("printsvgarea");
  let filename: string;

  if (printsvgarea == null) return;
  let prtContent = printsvgarea.innerHTML;

  const dosvgname = document.getElementById("dosvgname") as HTMLInputElement;
  if (dosvgname == null) filename = "eendraadschema.svg";
  else
    filename = (document.getElementById("dosvgname") as HTMLInputElement).value;

  download_by_blob(prtContent, filename, "data:image/svg+xml;charset=utf-8"); //Was text/plain
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

export function printsvg() {
  function generatePdf() {
    if (typeof globalThis.structure.properties.dpi == "undefined")
      globalThis.structure.properties.dpi = 300;

    let svg = flattenSVGfromString(
      globalThis.structure.toSVG(0, "horizontal").data
    );

    let pages: (number | null)[];
    const totalPages =
      globalThis.structure.print_table.pages.length +
      (globalThis.structure.sitplan
        ? globalThis.structure.sitplan.getNumPages()
        : 0);

    const modeSelect = document.getElementById(
      "print_page_mode"
    ) as HTMLSelectElement | null;
    const rangeInput = document.getElementById(
      "print_page_range"
    ) as HTMLInputElement | null;
    if (!globalThis.structure.print_table.canPrint()) {
      modeSelect.value = "all";
      rangeInput.value = "";
      rangeInput.style.display = "none";
      let rangeError = document.getElementById("print_range_error");
      if (rangeError) {
        rangeError.style.display = "none";
      }
    }

    let pagerange = "1-" + totalPages; // Default to all pages

    if (
      modeSelect &&
      modeSelect.value === "custom" &&
      rangeInput &&
      rangeInput.value.trim() !== ""
    ) {
      pagerange = rangeInput.value.trim();
    }

    const sitplanprint = globalThis.structure.sitplan.toSitPlanPrint();

    // If autopage, overwrite the input fields
    if (globalThis.structure.print_table.enableAutopage) {
      const info = globalThis.structure.properties.info;
      for (let page of globalThis.structure.print_table.pages) {
        page.info = info;
      }
    }

    // Print everything

    printPDF(
      svg,
      globalThis.structure.print_table,
      globalThis.structure.properties,
      pagerange,
      (document.getElementById("dopdfname") as HTMLInputElement).value, //filename
      document.getElementById("progress_pdf"), //HTML element where callback status can be given
      sitplanprint
    );
  }

  function renderPrintSVG_EDS(outSVG: SVGelement) {
    const printarea = document.getElementById("printarea");
    if (printarea == null) return;
    printarea.innerHTML =
      '<div id="printsvgarea">' + getPrintSVGWithoutAddress(outSVG) + "</div>";
  }

  function renderPrintSVG_sitplan(page: number) {
    const outstruct = globalThis.structure.sitplan.toSitPlanPrint();
    const printarea = document.getElementById("printarea");
    if (printarea == null) return;
    printarea.innerHTML =
      '<div id="printsvgarea">' + outstruct.pages[page].svg + "</div>";
  }

  // First we generate an SVG image. We do this first because we need the size
  // We will display it at the end of this function

  var outSVG = new SVGelement();
  outSVG = globalThis.structure.toSVG(0, "horizontal");

  var height = outSVG.yup + outSVG.ydown;
  var width = outSVG.xleft + outSVG.xright;

  globalThis.structure.print_table.setHeight(height);
  globalThis.structure.print_table.setMaxWidth(width + 10);

  // Then we display all the print options

  let outstr: string = "";
  var strleft: string = "";

  const configsection = document.getElementById("configsection");
  if (configsection != null)
    configsection.innerHTML =
      '<header class="page-header">' +
      '<p class="page-eyebrow">Print</p>' +
      '<h1 class="page-title">Afdrukken</h1>' +
      '<p class="page-subtitle">Genereer een PDF of exporteer de tekening als SVG.</p>' +
      "</header>" +
      '<section class="card print-card"><div class="card-body">' +
      '<h2 class="card-title">' + iconSvg("file-text") + "PDF genereren</h2>" +
      '<div class="print-controls">' +
      '<span id="select_papersize"></span>' +
      '<span id="select_dpi"></span>' +
      '<span id="select_scale"></span>' +
      '<input id="dopdfname" size="20" value="eendraadschema_print.pdf">' +
      '<button id="button_pdfdownload" class="btn btn-primary">' + iconSvg("download") + "Genereer PDF</button>" +
      "</div>" +
      '<div id="progress_pdf" class="print-progress"></div>' +
      '<div id="select_page_range" class="print-controls" style="margin-top: 12px;"></div>' +
      "</div></section>";

  const button_pdfdownload = document.getElementById("button_pdfdownload");
  if (button_pdfdownload != null) button_pdfdownload.onclick = generatePdf;

  globalThis.structure.print_table.insertHTMLselectPaperSize(
    document.getElementById("select_papersize") as HTMLElement,
    printsvg
  );
  globalThis.structure.print_table.insertHTMLselectdpi(
    document.getElementById("select_dpi") as HTMLElement,
    printsvg
  );
  globalThis.structure.print_table.insertHTMLselectScale(
    document.getElementById("select_scale") as HTMLElement,
    printsvg
  );

  // Insert page range selector
  globalThis.structure.print_table.insertHTMLselectPageRange(
    document.getElementById("select_page_range") as HTMLElement,
    printsvg
  );

  outstr =
    '<section class="card print-card"><div class="card-body">' +
    '<h2 class="card-title">' + iconSvg("settings") + "Pagina-instellingen</h2>" +
    '<div class="print-controls">' +
    '<span id="check_autopage"></span>' +
    '<span id="id_verticals"></span>' +
    '<span id="id_suggest_xpos_button"></span>' +
    "</div>" +
    "</div></section>";

  if (configsection != null)
    configsection.insertAdjacentHTML("beforeend", outstr);

  globalThis.structure.print_table.insertHTMLcheckAutopage(
    document.getElementById("check_autopage") as HTMLElement,
    printsvg
  );
  if (!globalThis.structure.print_table.enableAutopage) {
    globalThis.structure.print_table.insertHTMLchooseVerticals(
      document.getElementById("id_verticals") as HTMLElement,
      printsvg
    );
    globalThis.structure.print_table.insertHTMLsuggestXposButton(
      document.getElementById("id_suggest_xpos_button") as HTMLElement,
      printsvg
    );
  }

  if (!globalThis.structure.print_table.enableAutopage) {
    outstr =
      '<section class="card print-card"><div class="card-body">' +
      '<h2 class="card-title">' + iconSvg("zoom-fit") + "Paginaverdeling</h2>" +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">' +
      '<div id="id_print_table"></div>' +
      '<div>' +
      '<p style="margin-bottom: 8px;">Klik op de + knop om het schema over meerdere pagina\'s te printen en kies voor elke pagina de start- en stop-positie in het schema (in pixels).</p>' +
      '<p style="margin-bottom: 8px;">Je kan eventueel ook de tekst (info) aanpassen die op elke pagina rechts onderaan komt te staan.</p>' +
      "<p>Onderaan kan je bekijken welk deel van het schema op welke pagina belandt.</p>" +
      "</div>" +
      "</div>" +
      "</div></section>";

    if (configsection != null)
      configsection.insertAdjacentHTML("beforeend", outstr);

    globalThis.structure.print_table.insertHTMLposxTable(
      document.getElementById("id_print_table") as HTMLElement,
      printsvg
    );
  }

  const numPages =
    globalThis.structure.print_table.pages.length +
    (globalThis.structure.sitplan
      ? globalThis.structure.sitplan.getNumPages()
      : 0);
  if (globalThis.structure.print_table.displaypage >= numPages) {
    globalThis.structure.print_table.displaypage = numPages - 1;
  }

  strleft +=
    '<section class="card print-card"><div class="card-body">' +
    '<h2 class="card-title">' + iconSvg("eye") + "Printvoorbeeld</h2>" +
    '<div class="print-controls" style="margin-bottom: 12px;">' +
    '<label for="id_select_page">Pagina</label>' +
    '<select onchange="HLDisplayPage()" id="id_select_page">';

  for (let i = 0; i < numPages; i++) {
    if (i == globalThis.structure.print_table.displaypage) {
      strleft +=
        "<option value=" + (i + 1) + " selected>" + (i + 1) + "</option>";
    } else {
      strleft += "<option value=" + (i + 1) + ">" + (i + 1) + "</option>";
    }
  }
  strleft +=
    "</select>" +
    '<span class="print-hint">Enkel tekening, kies "Genereer PDF" om ook de tekstuele gegevens te zien.</span>' +
    "</div>";

  strleft +=
    '<div class="print-svg-export">' +
    '<div class="print-controls">' +
    '<input id="dosvgname" size="20" value="eendraadschema_print.svg">' +
    '<button onclick="dosvgdownload()" class="btn">' + iconSvg("download") + "Opslaan als SVG</button>" +
    '<span class="print-hint">Converteer met een ander programma naar PDF (bv. Inkscape).</span>' +
    "</div>" +
    "</div>";

  strleft += globalThis.displayButtonPrintToPdf(); // This is only for the online version

  strleft +=
    '<div id="printarea" class="print-area"></div>';
  strleft += "</div></section>"; // Close card

  if (configsection != null)
    configsection.insertAdjacentHTML("beforeend", strleft);

  // Finally we show the actual SVG

  if (
    globalThis.structure.print_table.displaypage <
    globalThis.structure.print_table.pages.length
  ) {
    //displaypage starts counting at 0
    renderPrintSVG_EDS(outSVG);
  } else {
    renderPrintSVG_sitplan(
      globalThis.structure.print_table.displaypage -
        globalThis.structure.print_table.pages.length
    );
  }

  globalThis.toggleAppView("config");
}
