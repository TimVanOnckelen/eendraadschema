/**
 * Global HL* (Hierarchical List) functions
 * These functions manipulate the structure and trigger UI updates
 */

import { Electro_Item } from "../List_Item/Electro_Item";
import { isFirefox, flattenSVGfromString } from "../general";

/**
 * Toggle collapse/expand state of an element
 */
export function HLCollapseExpand(my_id: number, state?: boolean) {
  let ordinal: number | null;
  ordinal = globalThis.structure.getOrdinalById(my_id);
  if (ordinal == null) return;

  if (state == undefined) {
    globalThis.structure.data[ordinal].collapsed =
      !globalThis.structure.data[ordinal].collapsed;
  } else {
    globalThis.structure.data[ordinal].collapsed = state;
  }
  globalThis.undostruct.store();

  // Use SimpleHierarchyView if available, otherwise fall back to old method
  if ((window as any).simpleHierarchyView) {
    HLRedrawTree();
  } else if (!isFirefox()) {
    globalThis.structure.updateHTMLinner(my_id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Delete an element by ID
 */
export function HLDelete(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.deleteById(my_id);
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Add a new item to the structure
 */
export function HLAdd() {
  globalThis.structure.addItem("");
  globalThis.undostruct.store();
  HLRedrawTree();
}

/**
 * Insert a new item before the specified ID
 */
export function HLInsertBefore(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.insertItemBeforeId(
    new Electro_Item(globalThis.structure),
    my_id
  );
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Insert a new item after the specified ID
 */
export function HLInsertAfter(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.insertItemAfterId(
    new Electro_Item(globalThis.structure),
    my_id
  );
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Move an item down in the list
 */
export function HLMoveDown(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.moveDown(my_id);
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Move an item up in the list
 */
export function HLMoveUp(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.moveUp(my_id);
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Clone an item
 */
export function HLClone(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;
  const parent = electroItem.getParent();

  globalThis.structure.clone(my_id);
  globalThis.undostruct.store();

  if (parent !== null && !isFirefox()) {
    globalThis.structure.reNumber();
    globalThis.structure.updateHTMLinner(parent.id);
    HLRedrawTreeSVG();
  } else {
    HLRedrawTree();
  }
}

/**
 * Insert a child element
 */
export function HLInsertChild(my_id: number) {
  globalThis.structure.insertChildAfterId(
    new Electro_Item(globalThis.structure),
    my_id
  );
  globalThis.structure.reNumber();
  HLCollapseExpand(my_id, false);
}

/**
 * Redraw the tree SVG
 */
export function HLRedrawTreeSVG() {
  const svgData = globalThis.structure.toSVG(0, "horizontal").data;
  const flattenedSVG = flattenSVGfromString(svgData, 10);

  let str: string =
    "<b>Tekening: </b>Ga naar het print-menu om de tekening af te printen of te exporteren als SVG vector graphics.<br><br>" +
    '<div id="EDS">' +
    flattenedSVG +
    "</div>" +
    "<h2>Legende:</h2>" +
    '<button class="button-insertBefore"></button> Item hierboven invoegen (zelfde niveau)<br>' +
    '<button class="button-insertAfter"></button> Item hieronder invoegen (zelfde niveau)<br>' +
    '<button class="button-insertChild"></button> Afhankelijk item hieronder toevoegen (niveau dieper)<br>' +
    '<button class="button-delete-garbage-can"></button> Item verwijderen<br>';

  const right_col_inner = document.getElementById("right_col_inner");
  if (right_col_inner != null) {
    right_col_inner.innerHTML = str;
    // Initialize interactive SVG handlers after SVG is rendered
    if ((window as any).interactiveSVG) {
      (window as any).interactiveSVG.attachHandlers();
    }
  }
}

/**
 * Main redraw function - uses SimpleHierarchyView if available
 */
export function HLRedrawTree() {
  console.log("HLRedrawTree called");
  // Use simple hierarchy view instead
  if ((window as any).simpleHierarchyView) {
    console.log("Using SimpleHierarchyView");
    (window as any).simpleHierarchyView.render();
  } else {
    console.log("SimpleHierarchyView not found, using fallback");
    // Fallback to old method
    HLRedrawTreeSVG();
  }
}

/**
 * Expand an element
 */
export function HLExpand(my_id: number) {
  let element: Electro_Item = globalThis.structure.getElectroItemById(
    my_id
  ) as Electro_Item;
  if (element !== null) {
    element.expand();
  }

  globalThis.structure.reSort();
  globalThis.undostruct.store();
  HLRedrawTree();
}

/**
 * Force undo store (used for contenteditable fields)
 */
export function forceUndoStore() {
  globalThis.undostruct.store();
}

// Export all functions to globalThis for backward compatibility
if (typeof window !== "undefined") {
  globalThis.HLCollapseExpand = HLCollapseExpand;
  globalThis.HLDelete = HLDelete;
  globalThis.HLAdd = HLAdd;
  globalThis.HLInsertBefore = HLInsertBefore;
  globalThis.HLInsertAfter = HLInsertAfter;
  globalThis.HLMoveDown = HLMoveDown;
  globalThis.HLMoveUp = HLMoveUp;
  globalThis.HLClone = HLClone;
  globalThis.HLInsertChild = HLInsertChild;
  globalThis.HLRedrawTree = HLRedrawTree;
  globalThis.HLExpand = HLExpand;
  globalThis.forceUndoStore = forceUndoStore;
}
