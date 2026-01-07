/**
 * Application initialization for React
 * This module handles all the initialization that was previously in legacy.ts
 */

import { EDStoStructure } from "./importExport/importExport";
import { AutoSaver } from "./importExport/AutoSaver";
import { showFilePage } from "./importExport/importExport";
import { showSituationPlanPage } from "./sitplan/SituationPlanView";
import { printsvg } from "./print/print";
import { showDocumentationPage } from "./documentation/documentation";
import { PROP_Contact_Text } from "../prop/prop_scripts";
import {
  EXAMPLE_DEFAULT,
  SITPLAN_CONFIG,
  CONF_DEFAULTS,
} from "./constants/examples";
import { trimString } from "./general";
import { reset_all } from "./utils/structureUtils";
import "../css/all.css";

// Import and register global functions
import "./utils/hierarchyFunctions";
import "./utils/structureUtils";

declare const BUILD_DATE: string;
console.log("Build date:", BUILD_DATE);

/**
 * Initialize global configuration
 */
function initializeGlobalConfig() {
  // Global constants for SitPlan view
  globalThis.SITPLANVIEW_SELECT_PADDING = parseInt(
    trimString(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--selectPadding"
      )
    )
  );
  globalThis.SITPLANVIEW_ZOOMINTERVAL = SITPLAN_CONFIG.ZOOMINTERVAL;
  globalThis.SITPLANVIEW_DEFAULT_SCALE = SITPLAN_CONFIG.DEFAULT_SCALE;
}

/**
 * Initialize file input elements
 */
function initializeFileInputs() {
  if (!document.getElementById("importfile")) {
    // Create elements using DOM methods instead of innerHTML to avoid breaking React
    const importFile = document.createElement("input");
    importFile.id = "importfile";
    importFile.type = "file";
    importFile.accept = ".eds";
    importFile.style.display = "none";
    importFile.setAttribute("onchange", "importjson(event)");
    document.body.appendChild(importFile);

    const appendFile = document.createElement("input");
    appendFile.id = "appendfile";
    appendFile.type = "file";
    appendFile.accept = ".eds";
    appendFile.style.display = "none";
    appendFile.setAttribute("onchange", "appendjson(event)");
    document.body.appendChild(appendFile);

    const fileInput = document.createElement("input");
    fileInput.id = "fileInput";
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
  }
}

/**
 * Export legacy view functions to globalThis
 */
function exportLegacyFunctions() {
  globalThis.showFilePage = showFilePage;
  globalThis.showSituationPlanPage = showSituationPlanPage;
  globalThis.printsvg = printsvg;
  globalThis.showDocumentationPage = showDocumentationPage;
  globalThis.openContactForm = openContactForm;
  globalThis.read_settings = read_settings;
}

/**
 * Open contact form (legacy function)
 */
function openContactForm() {
  var strleft: string = PROP_Contact_Text;
  strleft = strleft.replace(/Bewerken/g, "Eéndraadschema");
  const configsection = document.getElementById("configsection");
  if (configsection != null) configsection.innerHTML = strleft;
}

/**
 * Read settings and create new structure (legacy function)
 */
function read_settings() {
  // Use default values since the settings form is not rendered in React migration
  const config = { ...CONF_DEFAULTS };

  (globalThis as any).fileAPIobj?.clear();
  reset_all(config);
}

/**
 * Initialize the React app
 */
export async function initializeReactApp() {
  // Initialize global configuration
  initializeGlobalConfig();

  // Add file input elements
  initializeFileInputs();

  // Export legacy functions to globalThis
  exportLegacyFunctions();

  // Load default example if no structure exists yet
  if (!globalThis.structure) {
    EDStoStructure(EXAMPLE_DEFAULT, false);
  }

  // Create the autoSaver
  globalThis.autoSaver = new AutoSaver(5, () => {
    return globalThis.structure;
  });

  globalThis.autoSaver.setCallbackAfterSave(
    (() => {
      let lastSavedType = globalThis.autoSaver.getSavedType();
      function updateRibbons() {
        const currentSavedType = globalThis.autoSaver.getSavedType();
        if (lastSavedType === currentSavedType) return;
        lastSavedType = currentSavedType;
        globalThis.structure.updateRibbon();
        if (globalThis.structure.sitplanview)
          globalThis.structure.sitplanview.updateRibbon();
      }
      return updateRibbons;
    })()
  );

  // Start the autoSaver
  globalThis.autoSaver.start();

  // Return recovery information if available
  return await checkAutoSaveRecovery();
}

/**
 * Check if there's an autosaved structure to recover
 */
async function checkAutoSaveRecovery(): Promise<{
  recoveryAvailable: boolean;
  lastSavedStr: string | null;
  lastSavedInfo: any;
}> {
  let recoveryAvailable = false;
  let lastSavedStr: string | null = null;
  let lastSavedInfo: any = null;

  [lastSavedStr, lastSavedInfo] = await globalThis.autoSaver.loadLastSaved();
  if (lastSavedStr != null) {
    recoveryAvailable = true;
  }

  return { recoveryAvailable, lastSavedStr, lastSavedInfo };
}

/**
 * Global undo/redo functions
 */
export function undoClicked() {
  if (
    globalThis.structure.sitplanview != null &&
    globalThis.structure.sitplanview.contextMenu != null
  )
    globalThis.structure.sitplanview.contextMenu.hide();
  globalThis.undostruct.undo();
}

export function redoClicked() {
  if (
    globalThis.structure.sitplanview != null &&
    globalThis.structure.sitplanview.contextMenu != null
  )
    globalThis.structure.sitplanview.contextMenu.hide();
  globalThis.undostruct.redo();
}

// Export to globalThis
if (typeof window !== "undefined") {
  globalThis.undoClicked = undoClicked;
  globalThis.redoClicked = redoClicked;
}
