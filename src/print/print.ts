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
  var scale = 1;

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
      '<div class="modern-settings-container" style="padding: 20px;">' +
      '<div class="modern-settings-header" style="margin-bottom: 16px; padding-bottom: 12px;">' +
      "<h1 style='font-size: 22px;'>🖨️ Afdrukken</h1>" +
      "</div>" +
      '<div style="max-width: 1200px; margin: 0 auto;">' +
      '<div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 16px;">' +
      '<h2 style="color: var(--primary-color); font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">📄 PDF Genereren</h2>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">' +
      '<button id="button_pdfdownload" style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">🖨️ Genereer PDF</button>' +
      '<span id="select_papersize"></span>' +
      '<span id="select_dpi"></span>' +
      '<input id="dopdfname" size="20" value="eendraadschema_print.pdf" style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">' +
      "</div>" +
      '<div id="progress_pdf" style="margin-top: 10px; font-size: 13px; color: var(--text-secondary);"></div>' +
      '<div id="select_page_range" style="margin-top: 12px;"></div>' +
      "</div>" +
      "</div>" +
      "</div>";

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

  // Insert page range selector
  globalThis.structure.print_table.insertHTMLselectPageRange(
    document.getElementById("select_page_range") as HTMLElement,
    printsvg
  );

  outstr =
    '<div style="max-width: 1200px; margin: 0 auto;">' +
    '<div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 16px;">' +
    '<h2 style="color: var(--primary-color); font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">⚙️ Pagina Instellingen</h2>' +
    '<div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">' +
    '<span id="check_autopage"></span>' +
    '<span id="id_verticals"></span>' +
    '<span id="id_suggest_xpos_button"></span>' +
    "</div>" +
    "</div>" +
    "</div>";

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
      '<div style="max-width: 1200px; margin: 0 auto;">' +
      '<div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 16px;">' +
      '<h2 style="color: var(--primary-color); font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">📐 Pagina Verdeling</h2>' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">' +
      '<div id="id_print_table"></div>' +
      '<div style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">' +
      '<p style="margin-bottom: 8px;">Klik op de groene pijl om het schema over meerdere pagina\'s te printen en kies voor elke pagina de start- en stop-positie in het schema (in pixels).</p>' +
      '<p style="margin-bottom: 8px;">Je kan eventueel ook de tekst (info) aanpassen die op elke pagina rechts onderaan komt te staan.</p>' +
      "<p>Onderaan kan je bekijken welk deel van het schema op welke pagina belandt.</p>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    if (configsection != null)
      configsection.insertAdjacentHTML("beforeend", outstr);

    globalThis.structure.print_table.insertHTMLposxTable(
      document.getElementById("id_print_table") as HTMLElement,
      printsvg
    );
  }

  strleft +=
    '<div style="max-width: 1200px; margin: 0 auto;"><hr style="border: none; border-top: 1px solid var(--border); margin: 16px 0;"></div>';

  const numPages =
    globalThis.structure.print_table.pages.length +
    (globalThis.structure.sitplan
      ? globalThis.structure.sitplan.getNumPages()
      : 0);
  if (globalThis.structure.print_table.displaypage >= numPages) {
    globalThis.structure.print_table.displaypage = numPages - 1;
  }

  strleft +=
    '<div style="max-width: 1200px; margin: 0 auto;">' +
    '<div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 16px;">' +
    '<h2 style="color: var(--primary-color); font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">👁️ Printvoorbeeld</h2>' +
    '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">' +
    '<span style="font-weight: 500; color: var(--text-primary); font-size: 13px;">Pagina:</span>' +
    '<select onchange="HLDisplayPage()" id="id_select_page" style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; cursor: pointer;">';

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
    '<span style="color: var(--text-secondary); font-size: 12px;">(Enkel tekening, kies "Genereer PDF" om ook de tekstuele gegevens te zien)</span>' +
    "</div>";

  strleft +=
    '<div style="background: var(--background); border-radius: 6px; padding: 12px; margin-bottom: 12px;">' +
    '<div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">' +
    '<button onclick="dosvgdownload()" style="background: white; color: var(--primary-color); border: 2px solid var(--primary-color); padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;">💾 Opslaan als SVG</button>' +
    '<input id="dosvgname" size="20" value="eendraadschema_print.svg" style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">' +
    "</div>" +
    '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">Sla tekening hieronder op als SVG en converteer met een ander programma naar PDF (bvb Inkscape).</p>' +
    "</div>";

  strleft += globalThis.displayButtonPrintToPdf(); // This is only for the online version

  strleft +=
    '<div id="printarea" style="border: 1px solid var(--border); border-radius: 6px; padding: 12px; background: #f9fafb; overflow: auto; max-height: 500px;"></div>';
  strleft += "</div></div>"; // Close card and container

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
