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

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
}

/**
 * Delete an element by ID
 */
export function HLDelete(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;

  globalThis.structure.deleteById(my_id);
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
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

  globalThis.structure.insertItemBeforeId(
    new Electro_Item(globalThis.structure),
    my_id
  );
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
}

/**
 * Insert a new item after the specified ID
 */
export function HLInsertAfter(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;

  globalThis.structure.insertItemAfterId(
    new Electro_Item(globalThis.structure),
    my_id
  );
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
}

/**
 * Move an item down in the list
 */
export function HLMoveDown(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;

  globalThis.structure.moveDown(my_id);
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
}

/**
 * Move an item up in the list
 */
export function HLMoveUp(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;

  globalThis.structure.moveUp(my_id);
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
}

/**
 * Clone an item
 */
export function HLClone(my_id: number) {
  const electroItem = globalThis.structure.getElectroItemById(my_id);
  if (electroItem === null) return;

  globalThis.structure.clone(my_id);
  globalThis.undostruct.store();

  // In React mode, always use HLRedrawTree to trigger React refresh
  HLRedrawTree();
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

  let str: string = '<div id="EDS">' + flattenedSVG + "</div>";

  const right_col_inner = document.getElementById("right_col_inner");
  if (right_col_inner != null) {
    right_col_inner.innerHTML = str;
    // React components handle their own event handlers
  }
}

/**
 * Main redraw function - uses SimpleHierarchyView if available
 */
export function HLRedrawTree() {
  console.log("HLRedrawTree called");
  // Use React SimpleHierarchyView refresh if available
  if ((window as any).refreshSimpleHierarchyView) {
    console.log("Using React SimpleHierarchyView refresh");
    (window as any).refreshSimpleHierarchyView();
  } else if ((window as any).simpleHierarchyView) {
    console.log("Using legacy SimpleHierarchyView");
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
