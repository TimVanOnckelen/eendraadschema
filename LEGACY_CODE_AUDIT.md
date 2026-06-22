# Legacy Code Audit - Eendraadschema React Migration

**Date:** June 22, 2026  
**Version:** 1.1.0  
**Status:** Stable hybrid equilibrium

---

## Overview

This document provides a complete overview of all legacy code still present in the application after the migration to React 19. Since the previous audit (January 7, 2026), the React layer has been significantly expanded with new features, but the deepest rendering core remains largely untouched.

The application is in a **stable hybrid equilibrium**: the application shell, menus, dialogs, and new features are modern React, while the complex SVG/situation plan/print pipelines are deliberately kept as legacy classes.

---

## Changes Since January 7, 2026

Since the previous audit, **24 commits** have been made. The most important changes:

1. **Dark mode support** (`src/utils/theme.ts`)
2. **New React components:**
   - `FileLibraryView.tsx` - Browser library for EDS/JSON files (IndexedDB)
   - `SitPlanSidebar.tsx` - Replaces the legacy `SituationPlanView_SideBar.ts`
3. **JSON export format** alongside the existing EDS format
4. **`dialogAlert`/`dialogConfirm` helpers** replace native `alert()`/`confirm()` in many places
5. **`useSitPlan` hook** centralizes situation plan state management
6. **New situation plan features:** freeform shapes, layer manager, improved wall/window/door rendering
7. **`SitPlanView` ribbon** completely rewritten in React JSX
8. **Build workflow** added for CI/CD

---

## ✅ Fully Migrated to React

### Components (fully React)

| # | Component | Lines | Notes |
|---|-----------|-------|-------|
| 1 | **App.tsx** | 355 | Main component with routing, menu, file recovery |
| 2 | **AppContext.tsx** | 84 | React Context for state management |
| 3 | **StartScreen.tsx** | 607 | Start screen with example files |
| 4 | **TopMenu.tsx** | 137 | Main menu navigation with dark mode toggle |
| 5 | **ContactView.tsx** | 62 | Contact/info page |
| 6 | **DocumentationView.tsx** | 177 | Documentation page |
| 7 | **EditorView.tsx** | 12 | Thin wrapper for SimpleHierarchyView |
| 8 | **AutoSaveIndicator.tsx** | 121 | Visual save status indicator |
| 9 | **FileLibraryView.tsx** | 247 | Browser library for file management |
| 10 | **SitPlanSidebar.tsx** | 786 | React sidebar for situation plan properties |

**Total:** 10 components, ~2,588 lines of React UI code.

---

## ⚠️ Hybrid: React Wrapper with Legacy Functionality

### 1. SimpleHierarchyView.tsx (Large component: ~2,587 lines)

**Status:** React component that calls legacy code

**Legacy dependencies:**

- Calls `globalThis.HLRedrawTree()` for SVG redraw
- Calls global functions: `HLClone()`, `HLDelete()`, `HLMoveUp()`, `HLMoveDown()`
- SVG rendering via `structure.toSVG()` and `dangerouslySetInnerHTML`
- Direct SVG event handlers via `addEventListener` on rendered elements
- Dependency on `globalThis.structure` for state synchronization

**Specific legacy patterns:**

```typescript
// Calls legacy global functions
(globalThis as any).HLClone(selectedElementId);
(globalThis as any).HLDelete(elementId);
(globalThis as any).HLMoveUp(selectedElementId);

// Legacy state synchronization
if ((globalThis as any).structure) {
  setStructure((globalThis as any).structure);
}

// SVG injection via dangerouslySetInnerHTML
<div id="EDS" dangerouslySetInnerHTML={{ __html: getSVGContent() }} />

// Direct DOM event handlers on SVG elements
element.addEventListener('click', clickHandler);
element.addEventListener('mouseenter', mouseEnterHandler);
```

**Notes:**

- Largest component in the app (~2,587 lines, grown since previous audit)
- The properties editor and element list are fully React
- Drag & drop for elements is implemented in React
- SVG rendering remains fully legacy (`Hierarchical_List.toSVG()`)

### 2. SitPlanView.tsx (~1,325 lines)

**Status:** React component with legacy canvas rendering

**Legacy dependencies:**

- Uses `SituationPlanView` class for all canvas rendering (~3,381 lines of legacy)
- Hidden legacy buttons for backward compatibility
- `globalThis.undoClicked()` / `globalThis.redoClicked()` for undo/redo
- Direct DOM queries for cleaning up old canvas elements
- `structure.sitplanview` is directly manipulated

**Specific legacy patterns:**

```typescript
// Hidden buttons for legacy code compatibility
<div style={{ display: 'none' }}>
  <button id="button_Add"></button>
  <button id="button_Add_electroItem"></button>
  <button id="button_Delete"></button>
  <button id="button_zoomin"></button>
  ...
</div>

// Global undo/redo functions
(globalThis as any).undoClicked();
(globalThis as any).redoClicked();

// Legacy button clicks
const button = document.getElementById('button_Add') as HTMLButtonElement;
if (button) button.click();

// Direct DOM cleanup
const elements = document.querySelectorAll('[id^="SP_"]');
elements.forEach((e) => e.remove());
```

**What is modern:**

- The entire ribbon/toolbar is React JSX
- Page selector, zoom controls, drawing mode toggles are React state
- `useSitPlan` hook manages situation plan state
- `SitPlanSidebar` is a separate React component

### 3. FilePage.tsx (~470 lines)

**Status:** React component that calls legacy functions

**Legacy dependencies:**

- Calls `globalThis.exportjson()` for save functionality
- Calls `globalThis.loadClicked()` for load functionality
- Calls `globalThis.importToAppendClicked()` for merge
- Calls `globalThis.HL_enterSettings()` for name change in legacy mode

**Specific legacy patterns:**

```typescript
const handleSave = async (saveAs: boolean) => {
  if (typeof globalThis.exportjson === "function") {
    globalThis.exportjson(saveAs, saveFormat);
  }
};

const handleLoad = async () => {
  if (typeof globalThis.loadClicked === "function") {
    await globalThis.loadClicked();
  }
};
```

**What is modern:**

- Full React UI with modern styling
- JSON/EDS format choice via React state
- Compression checkbox via React state

### 4. PrintView.tsx (~41 lines)

**Status:** Thin React wrapper - unchanged legacy

**Legacy dependencies:**

- Calls `globalThis.printsvg()` which is fully legacy
- Rendering happens in `#configsection` div via legacy code
- Component returns `null`, legacy code does everything

**Specific legacy patterns:**

```typescript
useEffect(() => {
  if (structure && globalThis.printsvg && !initialized.current) {
    initialized.current = true;
    globalThis.printsvg(); // Fully legacy function
  }
}, [structure]);

return null; // Legacy code renders into #configsection directly
```

---

## 🔴 Fully Legacy (no React)

### Core Classes with DOM Manipulation

#### 1. Hierarchical_List.ts (~1,623 lines)

**Functionality:** Core class for schema data and rendering

**Legacy patterns:**

- `toHTML(mode)` - Generates HTML strings
- `toSVG()` - Generates SVG strings
- `updateHTMLinner(id)` - Direct DOM update via `innerHTML`
- `insertHTMLElement()` - Direct DOM insertion

**Impact:** High - central class used throughout the application

#### 2. SituationPlanView.ts (~3,381 lines)

**Functionality:** All rendering and interaction for the situation plan

**Legacy patterns:**

- `updateRibbon()` - Generates HTML with `innerHTML` (partially replaced by React ribbon)
- `makeBox()` - Creates DIV elements with DOM API
- Direct event handlers via `onclick` attributes
- `document.getElementById()` everywhere
- Drag & drop, selection, layer manager via direct DOM

**Code examples:**

```typescript
makeBox(element: SituationPlanElement): HTMLDivElement {
  let box = document.createElement('div');
  box.id = 'SP_' + element.id;
  // ... direct DOM manipulation
  return box;
}
```

**Impact:** Very high - ~3,381 lines of legacy code, grown since previous audit

#### 3. SimpleHierarchyView.ts (~23 lines)

**Functionality:** Bridge class for backward compatibility

**Legacy patterns:**

- Only a `setRefreshCallback` bridge remains
- Formerly the full editor UI, now reduced to callback registration

**Impact:** Low - almost completely replaced by React component

### Print Functionality

#### 4. print.ts (~313 lines)

**Functionality:** Print preview and configuration

**Legacy patterns:**

- `printsvg()` function generates large HTML strings
- Direct `innerHTML` in `configsection`
- Uses `Print_Table.insertHTML*` methods

**Impact:** High - entire print section is legacy

#### 5. Print_Table.ts (~946 lines)

**Functionality:** Print configuration and page setup

**Legacy patterns:**

- `insertHTMLposxTable()` - Generates tables with `innerHTML`
- `insertHTMLcheckAutopage()` - Checkbox generation
- `insertHTMLselectPageRange()` - Select boxes via `innerHTML`
- Direct event handlers

**Impact:** High - used in print functionality

#### 6. printToJsPDF.ts (~514 lines)

**Functionality:** PDF generation

**Legacy patterns:**

- Uses legacy `print_table` data
- Generates status updates via `innerHTML`
- No React dependency but uses legacy structures

**Impact:** Medium - functions well as-is

### Utility Classes with DOM Manipulation

#### 7. InteractiveSVG.ts (~430 lines)

**Functionality:** Interactive SVG for schema clicking

**Legacy patterns:**

- `showPropertiesPanel()` - Creates popup with `innerHTML`
- Inline onclick handlers in HTML strings
- Direct DOM queries

**Impact:** Medium - used by legacy editor path

#### 8. Dialog.ts (~61 lines)

**Functionality:** Modal dialogs

**Legacy patterns:**

- Creates dialogs with DOM API
- Uses `.innerHTML` for content
- Promise-based but no React

**Impact:** Medium - used in dialogs throughout the app

#### 9. HelperTip.ts (~88 lines)

**Functionality:** Tooltip hints for users

**Legacy patterns:**

- DOM creation with `createElement`
- `.innerHTML` for content
- LocalStorage for state

**Impact:** Low - only for hints

### Situation Plan Popups

#### 10. SituationPlanView_ElementPropertiesPopup.ts

**Legacy patterns:**

- Creates popup with `div.innerHTML`
- Select boxes via `innerHTML`
- Event handlers via DOM API

#### 11. SituationPlanView_ChooseCustomElementPopup.ts

**Legacy patterns:**

- Popup via `div.innerHTML`
- Generates HTML strings

#### 12. SituationPlanView_MultiElementPropertiesPopup.ts

**Legacy patterns:**

- Popup via `div.innerHTML`
- Form elements in HTML strings

#### 13. SituationPlanView_WallPropertiesPopup.ts

**Legacy patterns:**

- Popup via `div.innerHTML`
- Wall properties via HTML strings

### Import/Export

#### 14. importExport.ts (~984 lines)

**Functionality:** File load/save

**Legacy patterns:**

- Global functions: `exportjson()`, `loadClicked()`, `importToAppendClicked()`
- Direct DOM manipulation for file inputs
- Mixes FileReader API with legacy globals

**Code examples:**

```typescript
export function exportjson(saveas: boolean = true, format: 'eds' | 'json' = 'eds') {
  // ... global file save logic
}
```

**Impact:** High - central file I/O remains legacy

#### 15. AskLegacySchakelaar.ts (~137 lines)

**Functionality:** Dialog for legacy file migration

**Legacy patterns:**

- Extends `Dialog` class (also legacy)
- Creates HTML content as string

**Impact:** Low - only during migration of old files

### List Items with Legacy Key Conversion

All `List_Item/*.ts` classes have:

```typescript
convertLegacyKeys(mykeys: Array<[string,string,any]>) {
  this.props.type = this.getLegacyKey(mykeys,0);
  this.props.nr = this.getLegacyKey(mykeys,10);
  // ...
}
```

**Involved files (~52 classes, ~6,576 lines):**

- Aansluiting.ts, Aansluitpunt.ts, Aardingsonderbreker.ts
- Batterij.ts, Bel.ts, Boiler.ts, Bord.ts
- Contactdoos.ts, Diepvriezer.ts, Domotica.ts
- EV_lader.ts, Ketel.ts, Kring.ts, Lichtpunt.ts
- Motor.ts, Transformator.ts, Zekering.ts
- And ~40 others...

**Impact:** Low - only for backward compatibility during file import

---

## 🆕 New Modern Utilities (since previous audit)

| File | Lines | Function |
|------|-------|----------|
| `src/utils/theme.ts` | 46 | Dark mode detection and application |
| `src/utils/DialogHelpers.ts` | 109 | `dialogAlert`, `dialogConfirm`, `dialogPrompt` |
| `src/utils/structureUtils.ts` | 95 | `buildNewStructure`, `reset_all` |
| `src/utils/hierarchyFunctions.ts` | 212 | Global HL* functions as module |
| `src/hooks/useSitPlan.ts` | 369 | React hook for situation plan state |
| `src/storage/IndexedDBStorage.ts` | 105 | IndexedDB wrapper |
| `src/storage/FileLibraryStorage.ts` | 321 | Browser file library |
| `src/storage/MultiLevelStorage.ts` | 114 | localStorage with nested paths |

**Total:** 8 files, ~1,371 lines of modern utility code.

---

## 📊 Legacy Code Statistics

### Per Category

| Category | Number of Files | Estimated Lines | Status |
| -------- | --------------- | --------------- | ------ |
| **Fully React** | 10 | ~2,588 | ✅ Complete |
| **Hybrid (React + Legacy)** | 4 | ~4,423 | ⚠️ Mixed |
| **Core Legacy Classes** | 15 | ~9,062 | 🔴 Legacy |
| **Print Functionality** | 3 | ~1,773 | 🔴 Legacy |
| **Popups & UI Helpers** | 7 | ~1,206 | 🔴 Legacy |
| **Import/Export** | 2 | ~1,121 | 🔴 Legacy |
| **List Items** | 52 | ~6,576 | 🔴 Legacy (keys) |
| **New utilities/storage** | 8 | ~1,371 | ✅ Modern |

### UI Layer Specifically (React vs Hybrid vs Legacy UI)

Only UI-related code considered:

| Type | Lines | Percentage |
| ---- | ----- | ---------- |
| Fully React UI | 2,588 | ~16% |
| Hybrid UI | 4,423 | ~28% |
| Legacy UI classes | 9,062 | ~56% |

### Overall Codebase Summary

- **Total src/ TypeScript files:** 118 (`.ts` + `.tsx`)
- **React/hybrid UI code:** ~44% of UI code
- **Fully Legacy UI code:** ~56% of UI code

**Important nuance:** The percentages appear to shift toward more legacy because the **codebase has grown** with new legacy features (freeform shapes, layer manager, improved situation plan), while the React layer has also expanded. The absolute amount of React code is larger than in January 2026, but the legacy core has also grown.

---

## 🎯 Main Legacy Patterns

### 1. HTML String Generation

**Problem:** Entire UI is generated as strings

```typescript
// Anti-pattern
let html = '<div><button onclick="doSomething()">Click</button></div>';
element.innerHTML = html;
```

**Locations:**

- `Hierarchical_List.toHTML()`
- `SituationPlanView.updateRibbon()` (partially deprecated)
- `Print_Table.insertHTML*()` methods
- `importExport.ts`
- All situation plan popups

### 2. Global State via globalThis

**Problem:** No state management, everything via global object

```typescript
globalThis.structure = new Hierarchical_List();
globalThis.HLRedrawTree();
(globalThis as any).undoClicked();
```

**Locations:**

- Everywhere `globalThis.structure` is used
- All `HL*` global functions
- `globalThis.exportjson`, `globalThis.loadClicked`
- `globalThis.undostruct`

### 3. Direct DOM Manipulation

**Problem:** Bypasses React's virtual DOM

```typescript
document.getElementById("someid")!.innerHTML = content;
document.querySelectorAll('[id^="SP_"]').forEach((e) => e.remove());
```

**Locations:**

- `SimpleHierarchyView.tsx` (SVG injection, event handlers)
- `SitPlanView.tsx` (canvas cleanup, hidden buttons)
- `Hierarchical_List.updateHTMLinner()`
- `SituationPlanView.makeBox()`
- All popup classes
- Print functionality

### 4. Inline Event Handlers

**Problem:** Event handlers in HTML strings

```typescript
html += '<button onclick="globalFunction()">Click</button>';
```

**Locations:**

- InteractiveSVG popups
- SituationPlanView (legacy path)
- Print configuration

### 5. String-based SVG Generation

**Problem:** SVG as strings instead of React components

```typescript
toSVG(): string {
  return '<svg>...</svg>';
}
```

**Locations:**

- `Hierarchical_List.toSVG()`
- `SVGelement.getSVG()`
- Print SVG generation
- `SimpleHierarchyView.tsx` via `dangerouslySetInnerHTML`

---

## 🔧 Migration Considerations

### High Priority (Hybrid → React)

1. **Rewrite PrintView**

   - Thinnest wrapper, biggest user impact
   - Replace `print.ts` with React component
   - Rewrite `Print_Table` logic
   - React forms for configuration

2. **Decouple SimpleHierarchyView SVG**

   - Replace `dangerouslySetInnerHTML` with React SVG components
   - Keep `Hierarchical_List.toSVG()` as fallback
   - Remove direct SVG event handlers

3. **Remove SitPlanView hidden buttons**

   - Replace button clicks with direct method calls on `SituationPlanView`
   - Modernize undo/redo calls

### Medium Term

4. **Replace FilePage globals**

   - Use direct imports instead of `globalThis.exportjson`
   - Modernize file I/O helpers

5. **Refactor Hierarchical_List**

   - Split data model from rendering
   - Data stays in class, rendering moves to React
   - `toHTML()` and `toSVG()` possibly kept for export

6. **Partial SituationPlanView migration**

   - Keep core canvas rendering (too complex)
   - Popups to React modals
   - Event handling to React events where possible

### Low Priority

7. **Legacy key conversion**

   - Keep for backward compatibility
   - No impact on new functionality

8. **Utility classes**

   - `Dialog` → React modal component
   - `HelperTip` → React tooltip component

---

## 🚫 Do Not Migrate (Rationale)

### 1. Electro_Item and List_Item Classes

**Reason:** Complex business logic, no UI

These classes contain:

- Electrical calculations
- AREI validation rules
- Data transformations
- Legacy key conversions (backward compatibility)

**Decision:** Keep as TypeScript classes, no React needed

### 2. Core SVG Generation

**Reason:** Very complex SVG generation logic

- `SVGelement.ts` - Complex SVG rendering
- `SVGSymbols.ts` - Symbol definitions
- Electrical symbols according to AREI standards

**Decision:** Keep, too risky to refactor

### 3. Situation Plan Core Rendering

**Reason:** Very complex canvas interaction

- `SituationPlanView.ts` - ~3,381 lines of direct DOM rendering
- `SituationPlanElement.ts` - Element logic
- `MouseDrag.ts`, `GeometricFunctions.ts` - Interaction logic

**Decision:** Only modernize the shell, keep core rendering

### 4. Print/PDF Generation

**Reason:** Works, has external dependencies

- jsPDF library integration
- Complex PDF layout logic
- Little UI, mostly calculations

**Decision:** Low priority, works as-is

---

## 📝 Recommendations

### Short Term (1-2 months)

1. ✅ **Rewrite PrintView** - small wrapper, biggest impact
2. ✅ **Remove SitPlanView hidden buttons** - replace with direct calls
3. ✅ **Modernize FilePage globals** - use direct imports

### Medium Term (3-6 months)

4. 🔄 **Decouple SimpleHierarchyView SVG** - React SVG components
5. 🔄 **Split Hierarchical_List**: data vs rendering
6. 🔄 **Replace Dialog/HelperTip** with React components

### Long Term (6+ months)

7. 🔮 **Consider full SituationPlanView refactor** (only if ROI is high enough)
8. 🔮 **Evaluate SVG rendering alternatives** (react-svg?)

### Not Planned

- ❌ Restructure Electro_Item classes
- ❌ Rewrite SVG generation logic
- ❌ Remove legacy key conversion
- ❌ Rewrite situation plan core rendering

---

## 🎓 Conclusion

The application is in a **stable hybrid equilibrium**. The biggest wins since January 2026:

- Modern application shell with routing and state management
- New features fully in React (FileLibraryView, SitPlanSidebar, dark mode)
- Improved user experience with `DialogHelpers` and theme support
- SitPlanView ribbon fully React

**Remaining legacy code** is mainly:

- Core business logic (`Hierarchical_List`, `Electro_Items`) → No need to migrate
- Complex rendering (`SituationPlanView`, SVG) → High risk, low ROI
- Print functionality → Low priority, works as-is
- Import/export globals → Medium term modernization

**Recommendation:** Focus on finishing the remaining hybrid wrappers (PrintView, hidden buttons, globals) and leave the core logic alone. The current state is functional, maintainable, and scalable for new features.

---

**Last updated:** June 22, 2026  
**Author:** AI Audit Tool  
**Version:** 2.0
