# Legacy Code Audit - Eendraadschema React Migration

**Datum:** 7 januari 2026  
**Versie:** React 19 Migration  
**Status:** In transitie naar volledig React

## Overzicht

Dit document geeft een volledig overzicht van alle legacy code die nog aanwezig is in de applicatie na de migratie naar React 19. De migratie is grotendeels voltooid, maar bepaalde delen van de applicatie gebruiken nog legacy DOM-manipulatie en niet-React patronen.

---

## ✅ Volledig naar React gemigreerd

### Components (volledig React)

1. **StartScreen.tsx** - Startscherm met voorbeeldbestanden
2. **TopMenu.tsx** - Hoofdmenu navigatie
3. **ContactView.tsx** - Contact/info pagina
4. **DocumentationView.tsx** - Documentatie pagina (geen legacy dependencies)
5. **EditorView.tsx** - Wrapper voor SimpleHierarchyView
6. **AutoSaveIndicator.tsx** - Visuele save status indicator
7. **App.tsx** - Hoofdcomponent met routing
8. **AppContext.tsx** - React Context voor state management

---

## ⚠️ Hybrid: React wrapper met legacy functionaliteit

### 1. SimpleHierarchyView.tsx (Grote component: ~2000 lijnen)

**Status:** React component die legacy code oproept

**Legacy dependencies:**

- Roept `globalThis.HLRedrawTree()` aan voor SVG hertekenen
- Roept globale functies aan: `HLClone()`, `HLDelete()`, `HLMoveUp()`, `HLMoveDown()`
- Gebruikt `Hierarchical_List` class met directe DOM manipulatie
- Dependency op `globalThis.structure` voor state

**Specifieke legacy patronen:**

```typescript
// Roept legacy globale functies aan
globalThis.HLClone(id);
globalThis.HLDelete(id);
globalThis.HLMoveUp(id);

// Legacy state synchronisatie
if ((globalThis as any).structure) {
  setStructure((globalThis as any).structure);
}

// Direct DOM manipulatie via legacy class
structure.toHTML("edit");
```

**Opmerkingen:**

- Grootste component in de app (~2000 lijnen)
- Mengt React state met globalThis.structure
- Properties editor gebruikt React forms maar roept legacy update functies aan
- SVG rendering volledig legacy (Hierarchical_List.toSVG())

### 2. SitPlanView.tsx

**Status:** React component met legacy event handlers

**Legacy dependencies:**

- Gebruikt `SituationPlanView` class voor alle rendering
- Direct DOM manipulation in useEffect voor drag/drop
- `handleDragOverLegacy` en `handleDropLegacy` event handlers
- Dependency op `globalThis.structure.sitplanview`
- Verborgen buttons voor legacy compatibiliteit

**Specifieke legacy patronen:**

```typescript
// Legacy event handlers met direct DOM toegang
const handleDragOverLegacy = (e: DragEvent) => {
  e.preventDefault();
};

paperRef.current.addEventListener("dragover", handleDragOverLegacy as any);

// Legacy dialog check
if (structure.properties.legacySchakelaars == null) {
  const askLegacySchakelaar = new AskLegacySchakelaar();
  askLegacySchakelaar.show();
}
```

**Verborgen legacy buttons:**

```html
<!-- Hidden buttons for legacy code compatibility -->
<button id="btn_sitplan_edit" style="display:none"></button>
<button id="btn_sitplan_undoedit" style="display:none"></button>
```

### 3. FilePage.tsx

**Status:** React component die legacy functies oproept

**Legacy dependencies:**

- Roept `globalThis.exportjson()` aan voor save functionaliteit
- Roept `globalThis.loadClicked()` aan voor load functionaliteit
- Roept `globalThis.importToAppendClicked()` aan voor merge
- Roept `globalThis.HL_enterSettings()` aan voor settings
- Gebruikt `globalThis.structure` voor state

**Specifieke legacy patronen:**

```typescript
const handleSave = async (saveAs: boolean) => {
  if (typeof globalThis.exportjson === "function") {
    globalThis.exportjson(saveAs);
  }
};

const handleLoad = async () => {
  if (typeof globalThis.loadClicked === "function") {
    await globalThis.loadClicked();
  }
};
```

### 4. PrintView.tsx

**Status:** Dunne React wrapper

**Legacy dependencies:**

- Roept `globalThis.printsvg()` aan die volledig legacy is
- Rendering gebeurt in `#configsection` div via legacy code
- Component returned `null`, legacy code doet alles

**Specifieke legacy patronen:**

```typescript
// Component is slechts wrapper
useEffect(() => {
  if (structure && globalThis.printsvg && !initialized.current) {
    initialized.current = true;
    globalThis.printsvg(); // Volledige legacy functie
  }
}, [structure]);

return null; // Legacy code renders into #configsection directly
```

---

## 🔴 Volledig Legacy (geen React)

### Core Classes met DOM Manipulatie

#### 1. Hierarchical_List.ts

**Functionaliteit:** Kernclass voor schema data en rendering

**Legacy patronen:**

- `toHTML(mode)` - Genereert HTML strings
- `toSVG()` - Genereert SVG strings
- `updateHTMLinner(id)` - Direct DOM update via `innerHTML`
- `insertHTMLElement()` - Direct DOM insertion

**Code voorbeelden:**

```typescript
updateHTMLinner(id: number) {
  let div = document.getElementById('id_elem_'+id) as HTMLElement;
  div.innerHTML = this.toHTMLinner(ordinal);
}

toHTML(mode: string): string {
  // Genereert volledige HTML string
  return outputstr;
}
```

**Impact:** Hoog - centrale class gebruikt door hele applicatie

#### 2. SituationPlanView.ts (~1800 lijnen)

**Functionaliteit:** Alle rendering en interactie voor situatieschema

**Legacy patronen:**

- `updateRibbon()` - Genereert HTML met `innerHTML`
- `makeBox()` - Creëert DIV elements met DOM API
- Direct event handlers via `onclick` attributes
- `document.getElementById()` overal

**Code voorbeelden:**

```typescript
updateRibbon() {
  let outputleft = `<div>...</div>`; // HTML strings
  document.getElementById('ribbon')!.innerHTML = outputleft;

  // Direct event binding
  document.getElementById('id_sitplanpage')!.onchange = (event: Event) => {
    this.selectPage(Number(target.value));
  };
}

makeBox(element: SituationPlanElement): HTMLDivElement {
  let box = document.createElement('div');
  box.id = 'SP_' + element.id;
  // ... direct DOM manipulation
  return box;
}
```

**Impact:** Zeer hoog - ~1800 lijnen legacy code

#### 3. Print_Table.ts

**Functionaliteit:** Print configuratie en pagina setup

**Legacy patronen:**

- `insertHTMLposxTable()` - Genereert tables met `innerHTML`
- `insertHTMLcheckAutopage()` - Checkbox generation
- `insertHTMLselectPageRange()` - Select boxes via `innerHTML`
- Direct event handlers

**Code voorbeelden:**

```typescript
insertHTMLposxTable(div: HTMLElement, redrawCallBack: RedrawCallBackFunction): void {
  let outstr = '<table>...'; // HTML string generation
  outstr += '<input id="input_start_' + pagenum + '"...>';
  div.innerHTML = outstr;

  // Later: manual event binding
  (document.getElementById('input_start_' + pagenum) as HTMLInputElement)
    .addEventListener('change', ...);
}
```

**Impact:** Hoog - gebruikt in print functionaliteit

### Utility Classes met DOM Manipulatie

#### 4. InteractiveSVG.ts

**Functionaliteit:** Interactieve SVG voor schema klikken

**Legacy patronen:**

- `showPropertiesPanel()` - Creëert popup met `innerHTML`
- Inline onclick handlers in HTML strings
- Direct DOM queries

**Code voorbeelden:**

```typescript
showPropertiesPanel(elementId: number, x: number, y: number) {
  panel.innerHTML = `
    <div class="svg-properties-panel">
      <button onclick="document.getElementById('svg-properties-panel')?.remove();">✕</button>
      ...
    </div>
  `;
  document.body.appendChild(panel);
}
```

#### 5. Dialog.ts

**Functionaliteit:** Modal dialogen

**Legacy patronen:**

- Creëert dialogen met DOM API
- Gebruikt `.innerHTML` voor content
- Promise-based maar geen React

**Impact:** Gemiddeld - gebruikt in dialogen door hele app

#### 6. HelperTip.ts

**Functionaliteit:** Tooltip hints voor gebruikers

**Legacy patronen:**

- DOM creation met `createElement`
- `.innerHTML` voor content
- LocalStorage voor state

**Impact:** Laag - alleen voor hints

### Print Functionaliteit

#### 7. print.ts

**Functionaliteit:** Print preview en configuratie

**Legacy patronen:**

- Functie `printsvg()` genereert grote HTML strings
- Direct `innerHTML` in `configsection`
- Gebruikt `Print_Table.insertHTML*` methodes

**Code voorbeelden:**

```typescript
export function printsvg() {
  let strleft = "<table>..."; // Grote HTML strings
  if (configsection != null) configsection.innerHTML = strleft;

  // Roept legacy insert functies aan
  globalThis.structure.print_table.insertHTMLposxTable(
    document.getElementById("id_print_table") as HTMLElement,
    printsvg
  );
}
```

**Impact:** Hoog - hele print sectie is legacy

#### 8. printToJsPDF.ts

**Functionaliteit:** PDF generatie

**Legacy patronen:**

- Gebruikt legacy `print_table` data
- Genereert status updates via `innerHTML`
- Geen React dependency maar gebruikt legacy structures

### Situation Plan Popups

#### 9. SituationPlanView_ElementPropertiesPopup.ts

**Legacy patronen:**

- Creëert popup met `div.innerHTML`
- Select boxes via `innerHTML`
- Event handlers via DOM API

#### 10. SituationPlanView_ChooseCustomElementPopup.ts

**Legacy patronen:**

- Popup via `div.innerHTML`
- Genereert HTML strings

#### 11. SituationPlanView_MultiElementPropertiesPopup.ts

**Legacy patronen:**

- Popup via `div.innerHTML`
- Form elements in HTML strings

#### 12. SituationPlanView_SideBar.ts

**Legacy patronen:**

- Genereert sidebar met `this.div.innerHTML = html`
- Search input via `document.getElementById()`
- Drag handlers op DOM elements

### Import/Export

#### 13. importExport.ts

**Functionaliteit:** File laden/opslaan

**Legacy patronen:**

- Functie `showFilePage()` genereert HTML strings
- Gebruikt FileReader API (niet legacy, maar mengt met DOM)
- Globale functies zoals `exportjson()`

**Code voorbeelden:**

```typescript
export function showFilePage() {
  let strleft = `<table border="1px">...`; // HTML strings
  // Later in code:
  configsection.innerHTML = strleft;
}
```

#### 14. AskLegacySchakelaar.ts

**Functionaliteit:** Dialog voor legacy file migratie

**Legacy patronen:**

- Extends `Dialog` class (ook legacy)
- Creëert HTML content als string

### List Items met Legacy Key Conversion

Alle `List_Item/*.ts` classes hebben:

```typescript
convertLegacyKeys(mykeys: Array<[string,string,any]>) {
  this.props.type = this.getLegacyKey(mykeys,0);
  this.props.nr = this.getLegacyKey(mykeys,10);
  // ...
}
```

**Betrokken files (~50+ classes):**

- Aansluiting.ts, Aansluitpunt.ts, Aardingsonderbreker.ts
- Batterij.ts, Bel.ts, Boiler.ts, Bord.ts
- Contactdoos.ts, Diepvriezer.ts, Domotica.ts
- EV_lader.ts, Ketel.ts, Kring.ts, Lichtpunt.ts
- Motor.ts, Transformator.ts, Zekering.ts
- En ~40 andere...

**Impact:** Laag - alleen voor backward compatibility bij file import

---

## 📊 Legacy Code Statistieken

### Per Categorie

| Categorie                   | Aantal Files | Geschatte Lijnen | Status           |
| --------------------------- | ------------ | ---------------- | ---------------- |
| **Volledig React**          | 8            | ~1500            | ✅ Compleet      |
| **Hybrid (React + Legacy)** | 4            | ~3000            | ⚠️ Mixed         |
| **Core Legacy Classes**     | 3            | ~4000            | 🔴 Legacy        |
| **Print Functionaliteit**   | 3            | ~1500            | 🔴 Legacy        |
| **Popups & UI Helpers**     | 6            | ~1000            | 🔴 Legacy        |
| **Import/Export**           | 2            | ~800             | 🔴 Legacy        |
| **List Items**              | 50+          | ~3000            | 🔴 Legacy (keys) |

### Totaal Overzicht

- **Totaal React:** ~30% van UI code
- **Hybrid:** ~20% van UI code
- **Volledig Legacy:** ~50% van codebase

---

## 🎯 Belangrijkste Legacy Patronen

### 1. HTML String Generation

**Probleem:** Hele UI wordt gegenereerd als strings

```typescript
// Anti-pattern
let html = '<div><button onclick="doSomething()">Click</button></div>';
element.innerHTML = html;
```

**Locaties:**

- `Hierarchical_List.toHTML()`
- `SituationPlanView.updateRibbon()`
- `Print_Table.insertHTML*()` methodes
- `importExport.showFilePage()`

### 2. Global State via globalThis

**Probleem:** Geen state management, alles via global object

```typescript
globalThis.structure = new Hierarchical_List();
globalThis.HLRedrawTree();
```

**Locaties:**

- Overal waar `globalThis.structure` gebruikt wordt
- Alle `HL*` globale functies
- AutoSaver gebruikt globalThis voor save

### 3. Direct DOM Manipulation

**Probleem:** Omzeilt React's virtual DOM

```typescript
document.getElementById("someid")!.innerHTML = content;
```

**Locaties:**

- `updateHTMLinner()` in Hierarchical_List
- `makeBox()` in SituationPlanView
- Alle popup classes
- Print functionaliteit

### 4. Inline Event Handlers

**Probleem:** Event handlers in HTML strings

```typescript
html += '<button onclick="globalFunction()">Click</button>';
```

**Locaties:**

- InteractiveSVG popups
- SituationPlanView ribbon
- Print configuratie

### 5. String-based SVG Generation

**Probleem:** SVG als strings in plaats van React components

```typescript
toSVG(): string {
  return '<svg>...</svg>';
}
```

**Locaties:**

- `Hierarchical_List.toSVG()`
- `SVGelement.getSVG()`
- Print SVG generation

---

## 🔧 Migratie Overwegingen

### Hoge Prioriteit (Hybrid → React)

1. **SimpleHierarchyView voltooid migreren**

   - Herschrijf SVG rendering in React
   - Vervang globale HL\* functies door component methods
   - Verwijder globalThis.structure dependency

2. **SitPlanView event handlers**

   - Vervang direct DOM event listeners door React events
   - Verwijder verborgen legacy buttons
   - Migreer SituationPlanView.updateRibbon() naar React

3. **PrintView volledig opnieuw schrijven**
   - Vervang print.ts door React component
   - Herschrijf Print_Table logica
   - React forms voor configuratie

### Middellange Termijn

4. **Hierarchical_List refactor**

   - Splits data model van rendering
   - Data blijft in class, rendering naar React
   - `toHTML()` en `toSVG()` verwijderen

5. **SituationPlanView gedeeltelijke migratie**

   - Ribbon naar React component
   - Popups naar React modals
   - Behoud core rendering logica (te complex)

6. **Import/Export moderniseren**
   - Vervang showFilePage() door React
   - Behoud file logic, moderniseer UI

### Lage Prioriteit

7. **Legacy key conversion**

   - Behouden voor backward compatibility
   - Geen impact op nieuwe functionaliteit

8. **Utility classes**
   - Dialog → React modal component
   - HelperTip → React tooltip component

---

## 🚫 Niet Migreren (Rationeel)

### 1. Electro_Item en List_Item Classes

**Reden:** Complexe business logica, geen UI

Deze classes bevatten:

- Elektrische berekeningen
- AREI validatie regels
- Data transformaties
- Legacy key conversies (backward compatibility)

**Beslissing:** Behouden als TypeScript classes, geen React nodig

### 2. Core SVG Generation

**Reden:** Zeer complexe SVG generatie logica

- `SVGelement.ts` - Complexe SVG rendering
- `SVGSymbols.ts` - Symbool definities
- Elektrische symbolen volgens AREI normen

**Beslissing:** Behouden, te veel risico om te refactoren

### 3. Print/PDF Generation

**Reden:** Functioneert, heeft externe dependencies

- jsPDF library integratie
- Complexe PDF layout logica
- Weinig UI, vooral berekeningen

**Beslissing:** Lage prioriteit, werkt zoals het is

---

## 📝 Aanbevelingen

### Korte Termijn (1-2 maanden)

1. ✅ **Voltooi SimpleHierarchyView migratie** (hoogste impact)
2. ✅ **Moderniseer SitPlanView event handling**
3. ✅ **Verwijder globalThis dependencies waar mogelijk**

### Middellange Termijn (3-6 maanden)

4. 🔄 **Splits Hierarchical_List**: data vs rendering
5. 🔄 **Herschrijf Print UI** naar React
6. 🔄 **Vervang Dialog/HelperTip** door React components

### Lange Termijn (6+ maanden)

7. 🔮 **Overweeg volledige SituationPlanView refactor**
8. 🔮 **Evalueer SVG rendering alternatieven** (react-svg?)

### Niet Plannen

- ❌ Electro_Item classes herstructureren
- ❌ SVG generatie logica herschrijven
- ❌ Legacy key conversion verwijderen

---

## 🎓 Conclusie

De applicatie is voor **~30% naar React gemigreerd** (UI laag). De grootste winsten zijn:

- Modern component-based architecture
- React state management voor UI
- Type safety met TypeScript + React

**Resterende legacy code** is voornamelijk:

- Core business logica (Hierarchical_List, Electro_Items) → Niet nodig om te migreren
- Complexe rendering (SituationPlanView, SVG) → Hoog risico, lage ROI
- Print functionaliteit → Lage prioriteit, werkt zoals het is

**Aanbeveling:** Focus op het voltooien van de hybrid components (SimpleHierarchyView, SitPlanView) en laat de core logica met rust. De huidige staat is functioneel en maintainable.

---

**Laatste update:** 7 januari 2026  
**Auteur:** AI Audit Tool  
**Versie:** 1.0
