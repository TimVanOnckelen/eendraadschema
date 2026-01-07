/**
 * Structure initialization utilities
 */

import { Hierarchical_List } from "../Hierarchical_List";
import { Bord } from "../List_Item/Bord";
import { Kring } from "../List_Item/Kring";
import { CONF_DEFAULTS } from "../constants/examples";

/**
 * Build a new structure with default configuration
 */
export function buildNewStructure(
  structure: Hierarchical_List,
  config = CONF_DEFAULTS
) {
  // Eerst het hoofddifferentieel maken
  let itemCounter: number = 0;
  structure.addItem("Aansluiting");
  structure.data[0].props.type = "Aansluiting";
  structure.data[0].props.naam = "";
  structure.data[0].props.bescherming = "differentieel";
  structure.data[0].props.aantal_polen = config.aantal_fazen_droog;
  structure.data[0].props.amperage = config.hoofdzekering;
  structure.data[0].props.type_kabel_na_teller =
    config.aantal_fazen_droog + "x16";
  structure.data[0].props.differentieel_delta_amperage =
    config.differentieel_droog;
  itemCounter++;

  // Dan het hoofdbord maken
  structure.insertChildAfterId(new Bord(structure), itemCounter);
  structure.data[itemCounter].props.type = "Bord";
  itemCounter++;

  // Nat bord voorzien
  structure.insertChildAfterId(new Kring(structure), itemCounter);
  structure.data[itemCounter].props.type = "Kring";
  structure.data[itemCounter].props.autoKringNaam = "manueel";
  structure.data[itemCounter].props.bescherming = "differentieel";
  structure.data[itemCounter].props.aantal_polen = config.aantal_fazen_nat;
  structure.data[itemCounter].props.amperage = config.hoofdzekering;
  structure.data[itemCounter].props.kabel_is_aanwezig = false;
  structure.data[itemCounter].props.differentieel_delta_amperage =
    config.differentieel_nat;
  itemCounter++;
  structure.insertChildAfterId(new Bord(structure), itemCounter);
  structure.data[itemCounter].props.type = "Bord";
  structure.data[itemCounter].props.is_geaard = false; // Geaard
  itemCounter++;

  // Pas info aan
  switch (config.aantal_fazen_droog) {
    case 2:
      structure.properties.info = "2 x 230V ~50 Hz";
      break;
    case 3:
      structure.properties.info = "3 x 230V ~50 Hz";
      break;
    case 4:
      structure.properties.info = "3 x 400V + N ~50 Hz";
  }
}

/**
 * Reset and create a new structure
 */
export function reset_all(config = CONF_DEFAULTS) {
  if (globalThis.structure != null) globalThis.structure.dispose();
  globalThis.structure = new Hierarchical_List();
  buildNewStructure(globalThis.structure, config);
  globalThis.undostruct.clear();
  globalThis.undostruct.store();
}

/**
 * Update address parameters from form fields
 */
export function changeAddressParams() {
  const ownerEl = document.getElementById("conf_owner") as HTMLElement;
  const installerEl = document.getElementById("conf_installer") as HTMLElement;
  const controlEl = document.getElementById("conf_control") as HTMLElement;
  const infoEl = document.getElementById("conf_info") as HTMLElement;

  if (ownerEl) globalThis.structure.properties.owner = ownerEl.innerHTML;
  if (installerEl)
    globalThis.structure.properties.installer = installerEl.innerHTML;
  if (controlEl) globalThis.structure.properties.control = controlEl.innerHTML;
  if (infoEl) globalThis.structure.properties.info = infoEl.innerHTML;
}

// Export to globalThis for backward compatibility
if (typeof window !== "undefined") {
  globalThis.changeAddressParams = changeAddressParams;
}
