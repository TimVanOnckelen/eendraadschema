import { SituationPlan } from "./SituationPlan";
import { SituationPlanElement } from "./SituationPlanElement";
import { AdresType, AdresLocation } from "./SituationPlanElement";
import { SituationPlanView_Selected } from "./SituationPlanView_Selected";
import { SituationPlanView_ChooseCustomElementPopup } from "./SituationPlanView_ChooseCustomElementPopup";
import { ContextMenu } from "./ContextMenu";
import { EventManager } from "../EventManager";
import { showSelectPopup, htmlspecialchars, randomId } from "../general";
import { getXYRectangleSize, getRotatedRectangleSize } from "./GeometricFunctions";
import { HelperTip } from "../documentation/HelperTip";
import { Dialog } from "../documentation/Dialog";
import { SituationPlanView_ElementPropertiesPopup } from "./SituationPlanView_ElementPropertiesPopup";
import { SituationPlanView_MultiElementPropertiesPopup } from "./SituationPlanView_MultiElementPropertiesPopup";
import { AskLegacySchakelaar } from "../importExport/AskLegacySchakelaar";
import { WallElement, WallType } from "./WallElement";
import { FreeformShapeType } from "./FreeformShapeElement";
import { LayerManager } from "./LayerManager";
import { dialogAlert } from "../utils/DialogHelpers";

enum MovableType {
  Movable,
  NotMovable,
  Mixed,
  Undefined,
}

/** Gereedschap om rechthoekige bouwelementen te tekenen */
export type SitPlanDrawingTool =
  | { kind: "wall"; wallType: WallType }
  | { kind: "window" }
  | { kind: "door" }
  | { kind: "shape"; shapeType: FreeformShapeType };

/** Bewaarde zoom- en scrollpositie zodat een nieuwe view (bvb na undo) dezelfde weergave toont */
interface ViewportState {
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
  fitMode: boolean;
}

/** Events die de React-laag gebruikt om zich te synchroniseren met deze view */
export const SITPLAN_EVENTS = {
  selectionChange: "sitplan-selection-change",
  viewChange: "sitplan-view-change",
  toolChange: "sitplan-tool-change",
} as const;

const DRAG_THRESHOLD_PX = 3; // Aantal schermpixels voor een klik als sleepbeweging telt
const AUTOSCROLL_EDGE_PX = 32; // Afstand tot de rand van het canvas waarbij automatisch gescrold wordt
const AUTOSCROLL_MAX_SPEED = 18; // Maximaal aantal pixels per frame bij automatisch scrollen
const MIN_DRAWN_SIZE = 4; // Minimale grootte (in papier-pixels) van een getekend bouwelement

/**
 * Deze class behandelt het tekenen van het situatieplan.
 *
 * Er wordt regelmatig de terminologie Box gebruikt in de code. Een box is een sleepbaar element en kan zowel
 * een eendraadschema symbool zijn als een ingelezen extern bestand.
 *
 * Coördinaten:
 *  - "client" coördinaten zijn schermcoördinaten (zoals in MouseEvent.clientX)
 *  - "paper" coördinaten zijn coördinaten op het papier in CSS-pixels bij zoomfactor 1.
 *  Alle omzettingen gebeuren via clientToPaper / paperToClient, die rechtstreeks de werkelijke
 *  positie van het papier op het scherm gebruiken. Daardoor zijn ze ongevoelig voor layout, scroll en zoom.
 */

export class SituationPlanView {
  /** Grootte van het raster in papier-pixels (gebruikt om te snappen als het raster aan staat) */
  public static readonly GRID_SIZE = 10;

  /** Laatst gekende weergave, wordt hergebruikt wanneer een nieuwe view wordt aangemaakt (bvb na undo/redo) */
  private static lastViewport: ViewportState | null = null;

  /** De view die op dit moment actief is. Er mag er maar één tegelijk naar de DOM luisteren. */
  private static activeView: SituationPlanView | null = null;

  private zoomfactor: number = 1;
  private fitMode = true;
  private disposed = false;
  private activeInteractionCleanup: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private spacePressed = false;
  private snapToGrid = false;

  /** Referentie naar meerdere DIV's waar het stuatieplan wordt weergegeven
   *   - paper: hieronder hangen de reële elementen en dit stelt het printable gedeelte van het schema voor
   *   - sizer: rond het papier, heeft de grootte van het gezoomde papier zodat het scrollgebied klopt
   *   - canvas: deze bevat paper en ook het niet printable gedeelte
   */
  private canvas: HTMLElement = null;
  private paper: HTMLElement = null;
  private sizer: HTMLElement | null = null;

  // Public getters for checking if DOM refs are still valid
  public get canvasRef(): HTMLElement {
    return this.canvas;
  }

  public get paperRef(): HTMLElement {
    return this.paper;
  }

  public layerManager: LayerManager | null = null;

  public contextMenu: ContextMenu = null;

  // Stub for backwards compatibility with undoRedo system
  public sideBar: any = {
    getUndoRedoOptions: () => ({}),
    render: () => {}, // No-op, rendering is handled by React now
  };

  private selected: SituationPlanView_Selected =
    new SituationPlanView_Selected();

  private sitplan: any; // SituationPlan (gebruikt ook interne velden zoals elements en numPages)

  private event_manager: EventManager;

  // Teken-gereedschap voor bouwelementen (muur, raam, deur, vorm) of null
  private drawingTool: SitPlanDrawingTool | null = null;

  constructor(canvas: HTMLElement, paper: HTMLElement, sitplan: SituationPlan) {
    // Er kan maar één view tegelijk actief zijn, anders worden events dubbel verwerkt
    if (SituationPlanView.activeView && SituationPlanView.activeView !== this)
      SituationPlanView.activeView.dispose();
    SituationPlanView.activeView = this;

    this.canvas = canvas;
    this.paper = paper;
    this.sizer =
      paper.parentElement && paper.parentElement !== canvas
        ? paper.parentElement
        : null;
    this.contextMenu = new ContextMenu();

    this.sitplan = sitplan;
    this.paper.style.transformOrigin = "top left"; // Keep the origin point consistent when scaling

    this.event_manager = new EventManager();

    // Initialize layer manager (initially hidden)
    this.layerManager = new LayerManager(sitplan, this);
    this.layerManager.hide();

    // Capture-fase: pannen (middelste muisknop of spatie + slepen) en tekenen van bouwelementen
    // hebben voorrang op het selecteren/slepen van boxes.
    this.event_manager.addEventListener(
      canvas,
      "pointerdown",
      this.onCanvasPointerDownCapture as EventListener,
      { capture: true }
    );

    // Bubble-fase: enkel bereikt wanneer niet op een box geklikt werd. Start een selectierechthoek.
    this.event_manager.addEventListener(
      canvas,
      "pointerdown",
      this.onCanvasPointerDown as EventListener
    );

    // Middelste muisknop mag geen autoscroll starten in de browser
    this.event_manager.addEventListener(canvas, "mousedown", (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    });

    // Control wieltje (of pinch op een trackpad) om te zoomen rond de muis
    this.event_manager.addEventListener(
      canvas,
      "wheel",
      (event: WheelEvent) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        let delta = event.deltaY;
        if (event.deltaMode === 1) delta *= 16; // lijnen
        else if (event.deltaMode === 2) delta *= 400; // pagina's
        delta = Math.max(-200, Math.min(200, delta));
        this.zoomAt(this.zoomfactor * Math.exp(-delta * 0.002), event.clientX, event.clientY);
      },
      { passive: false }
    );

    // Opnieuw passend maken wanneer het beschikbare venster wijzigt (enkel indien in "passend" modus)
    if (typeof ResizeObserver !== "undefined") {
      // Gebundeld per animatieframe, en beveiligd tegen terugkoppellussen: als een herschaling de
      // layout rond het canvas wijzigt (bvb een toolbar die anders afbreekt) en het canvas daardoor
      // heen en weer springt tussen twee groottes, stoppen we na de eerste keer.
      let frame = 0;
      const recentSizes: string[] = [];
      this.resizeObserver = new ResizeObserver(() => {
        if (this.disposed || frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (this.disposed) return;
          const size = `${this.canvas.clientWidth}x${this.canvas.clientHeight}`;
          if (recentSizes[recentSizes.length - 1] === size) return; // niets gewijzigd
          const oscillating = recentSizes.length >= 2 && recentSizes[recentSizes.length - 2] === size;
          recentSizes.push(size);
          if (recentSizes.length > 4) recentSizes.shift();
          if (this.fitMode && !oscillating) this.zoomToFit();
          else this.updateSizer();
        });
      });
      this.resizeObserver.observe(canvas);
    }

    // Voegt event handlers toe voor de pijltjestoesten en andere sneltoetsen
    this.attachArrowKeys();

    // De ribbon knoppen bestaan reeds in de DOM (React). We koppelen ze één keer.
    this.attachRibbonEventHandlers();

    this.restoreViewport();
  }

  // ---------------------------------------------------------------------------
  // Coördinaten
  // ---------------------------------------------------------------------------

  /**
   * Zet een schermcoördinaat (clientX/clientY) om naar een coördinaat op het papier.
   */
  clientToPaper(clientX: number, clientY: number) {
    const rect = this.paper.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.zoomfactor - this.paper.clientLeft,
      y: (clientY - rect.top) / this.zoomfactor - this.paper.clientTop,
    };
  }

  /**
   * Zet een coördinaat op het papier om naar een schermcoördinaat.
   */
  paperToClient(paperx: number, papery: number) {
    const rect = this.paper.getBoundingClientRect();
    return {
      x: rect.left + (paperx + this.paper.clientLeft) * this.zoomfactor,
      y: rect.top + (papery + this.paper.clientTop) * this.zoomfactor,
    };
  }

  /**
   * Converteert een coördinaat van het zichtbare deel van het canvas (coördinaten die starten links boven het canvas)
   * naar een coördinaat op het papier.
   */
  canvasPosToPaperPos(canvasx: number, canvasy: number) {
    const rect = this.canvas.getBoundingClientRect();
    return this.clientToPaper(
      rect.left + this.canvas.clientLeft + canvasx,
      rect.top + this.canvas.clientTop + canvasy
    );
  }

  /**
   * Converteert een coördinaat op het papier naar een coördinaat op het canvas (omgekeerde van hierboven).
   */
  paperPosToCanvasPos(paperx: number, papery: number) {
    const rect = this.canvas.getBoundingClientRect();
    const client = this.paperToClient(paperx, papery);
    return {
      x: client.x - rect.left - this.canvas.clientLeft,
      y: client.y - rect.top - this.canvas.clientTop,
    };
  }

  /** Breedte van het papier in papier-pixels */
  getPaperWidth(): number {
    return this.paper.clientWidth;
  }

  /** Hoogte van het papier in papier-pixels */
  getPaperHeight(): number {
    return this.paper.clientHeight;
  }

  /**
   * Geeft het midden van het zichtbare deel van het papier terug, beperkt tot het papier.
   */
  getVisiblePaperCenter() {
    const p = this.canvasPosToPaperPos(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );
    return this.clampToPaper(p.x, p.y);
  }

  private clampToPaper(x: number, y: number) {
    return {
      x: Math.min(this.getPaperWidth(), Math.max(0, x)),
      y: Math.min(this.getPaperHeight(), Math.max(0, y)),
    };
  }

  private getPaperPadding(): number {
    const value = parseFloat(
      getComputedStyle(this.paper).getPropertyValue("--paperPadding")
    );
    return isFinite(value) ? value : 16;
  }

  // ---------------------------------------------------------------------------
  // Raster
  // ---------------------------------------------------------------------------

  /** Schakelt het snappen aan het raster in of uit (wordt gebruikt wanneer het raster zichtbaar is) */
  public setSnapToGrid(enabled: boolean) {
    this.snapToGrid = enabled;
  }

  public isSnapToGrid(): boolean {
    return this.snapToGrid;
  }

  /** Rondt een waarde af op het raster indien snappen aan staat (en Alt niet ingedrukt is) */
  private snap(value: number, event?: { altKey?: boolean }): number {
    if (!this.snapToGrid || event?.altKey) return value;
    const g = SituationPlanView.GRID_SIZE;
    return Math.round(value / g) * g;
  }

  // ---------------------------------------------------------------------------
  // Levenscyclus
  // ---------------------------------------------------------------------------

  /**
   * Maakt deze instance ongedaan en verwijderd alle door deze instance aangemaakte elementen uit de DOM.
   *
   * Verwijderd eerst de eventmanager en daarna alle elementen in het situatieplan.
   * Als een element een referentie naar een box heeft, wordt deze verwijderd uit de DOM.
   * Als een element een referentie naar een label heeft, wordt deze verwijderd uit de DOM.
   */
  dispose() {
    if (this.disposed) return;
    this.saveViewport();
    this.disposed = true;
    if (SituationPlanView.activeView === this) SituationPlanView.activeView = null;
    this.event_manager.dispose();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.cancelInteraction();
    this.drawingTool = null;
    this.layerManager?.destroy();
    this.contextMenu.dispose();
    this.paper
      .querySelectorAll(".sitplan-draw-preview, .sitplan-marquee")
      .forEach((e) => e.remove());
    for (const element of this.sitplan.elements) {
      element.boxref?.remove();
      element.boxlabelref?.remove();
      element.boxref = null;
      element.boxlabelref = null;
      element.needsViewUpdate = true;
    }
  }

  public isDisposed(): boolean {
    return this.disposed;
  }

  /** Start een interactie (slepen, tekenen, ...) en zorgt dat een eventuele vorige netjes wordt afgesloten */
  private beginInteraction(cleanup: () => void) {
    this.cancelInteraction();
    this.activeInteractionCleanup = cleanup;
  }

  private cancelInteraction() {
    const cleanup = this.activeInteractionCleanup;
    this.activeInteractionCleanup = null;
    cleanup?.();
  }

  private emit(eventName: string, detail: any = {}) {
    if (this.disposed) return;
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  /**
   * Zorgt ervoor dat alle elementen in het situatieplan een link hebben naar
   * het eendraadschema.
   *
   * Als een element in het situatieplan verwijst naar een symbool dat niet langer in
   * het eendraadschema zit, wordt het element verwijderd uit het situatieplan.
   *
   * Deze functie zorgt er niet voor dat ook elk element effectief een box heeft in de DOM.
   * Dit gebeurt pas in de redraw functie.
   */
  syncToSitPlan() {
    this.sitplan.syncToEendraadSchema();
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  private saveViewport() {
    if (this.disposed || !this.canvas) return;
    SituationPlanView.lastViewport = {
      zoom: this.zoomfactor,
      scrollLeft: this.canvas.scrollLeft,
      scrollTop: this.canvas.scrollTop,
      fitMode: this.fitMode,
    };
  }

  /**
   * Herstelt de laatst gekende zoom en scrollpositie, of maakt het papier passend als er geen is.
   */
  restoreViewport() {
    const state = SituationPlanView.lastViewport;
    if (state == null || state.fitMode) {
      this.zoomToFit();
      return;
    }
    this.setzoom(state.zoom);
    this.fitMode = false;
    this.canvas.scrollLeft = state.scrollLeft;
    this.canvas.scrollTop = state.scrollTop;
  }

  /**
   * Past de grootte van de sizer aan aan het gezoomde papier zodat het scrollgebied klopt.
   */
  private updateSizer() {
    if (!this.sizer) return;
    const pad = this.getPaperPadding();
    const width = this.paper.offsetWidth * this.zoomfactor + 2 * pad;
    const height = this.paper.offsetHeight * this.zoomfactor + 2 * pad;
    this.sizer.style.width = `${width}px`;
    this.sizer.style.height = `${height}px`;
  }

  /**
   * Stel de zoomfactor in zodat het paper-element volledig in het browser window wordt weergegeven
   */
  zoomToFit() {
    if (this.disposed) return;
    const pad = this.getPaperPadding();
    const availableWidth = this.canvas.clientWidth - 2 * pad;
    const availableHeight = this.canvas.clientHeight - 2 * pad;
    if (availableWidth <= 0 || availableHeight <= 0) return; // nog niet zichtbaar

    const scale = Math.min(
      availableWidth / this.paper.offsetWidth,
      availableHeight / this.paper.offsetHeight
    );

    const newZoom = Math.floor(scale * 1000) / 1000;
    if (newZoom !== this.zoomfactor) this.setzoom(newZoom);
    else this.updateSizer();
    this.fitMode = true;
    this.canvas.scrollLeft = 0;
    this.canvas.scrollTop = 0;
    this.emit(SITPLAN_EVENTS.viewChange);
  }

  /**
   * Geeft de huidige zoomfactor terug.
   * @returns De huidige zoomfactor.
   */
  getZoomFactor() {
    return this.zoomfactor;
  }

  /** Geeft true terug indien het papier momenteel automatisch passend gemaakt wordt */
  isFitMode() {
    return this.fitMode;
  }

  /**
   * Stel de zoomfactor in.
   * @param factor - De zoomfactor, standaard 1.
   */
  setzoom(factor: number = 1) {
    const min = globalThis.SITPLANVIEW_ZOOMINTERVAL?.MIN ?? 0.1;
    const max = globalThis.SITPLANVIEW_ZOOMINTERVAL?.MAX ?? 8;
    if (!isFinite(factor) || factor <= 0) factor = 1;
    factor = Math.min(max, Math.max(min, factor));
    this.zoomfactor = factor;
    this.paper.style.transform = `scale(${factor})`;
    // Handvatten en selectiekaders blijven even groot op het scherm, onafhankelijk van de zoom
    this.paper.style.setProperty("--sitplan-inverse-zoom", String(1 / factor));
    this.updateSizer();
    this.emit(SITPLAN_EVENTS.viewChange);
  }

  /**
   * Zoomt naar een nieuwe zoomfactor waarbij het punt onder (clientX, clientY) op dezelfde plaats blijft.
   */
  zoomAt(factor: number, clientX?: number, clientY?: number) {
    if (this.disposed) return;
    const canvasRect = this.canvas.getBoundingClientRect();
    if (clientX == null || clientY == null) {
      clientX = canvasRect.left + this.canvas.clientWidth / 2;
      clientY = canvasRect.top + this.canvas.clientHeight / 2;
    }
    const anchor = this.clientToPaper(clientX, clientY);
    this.fitMode = false;
    this.setzoom(factor);
    const now = this.paperToClient(anchor.x, anchor.y);
    this.canvas.scrollLeft += now.x - clientX;
    this.canvas.scrollTop += now.y - clientY;
    this.emit(SITPLAN_EVENTS.viewChange);
  }

  /** Zoomt in of uit met een vermenigvuldigingsfactor rond het midden van het zichtbare canvas */
  zoomBy(multiplier: number) {
    this.zoomAt(this.zoomfactor * multiplier);
  }

  /**
   * Verhoogt of verlaagt de zoomfactor met een bepaalde waarde.
   *
   * @param increment - De relatieve aanpassing van de zoomfactor (0.1 = 10% groter).
   * @param canvasx - Optioneel punt op het canvas dat op zijn plaats moet blijven.
   * @param canvasy - Optioneel punt op het canvas dat op zijn plaats moet blijven.
   */
  zoomIncrement(increment: number = 0, canvasx?: number, canvasy?: number) {
    const factor = this.zoomfactor * (1 + increment);
    if (canvasx == null || canvasy == null) {
      this.zoomAt(factor);
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.zoomAt(factor, rect.left + canvasx, rect.top + canvasy);
  }

  /** Scrollt het canvas zodat het gegeven punt op het papier zichtbaar is */
  scrollPaperPointIntoView(paperx: number, papery: number, margin: number = 40) {
    const rect = this.canvas.getBoundingClientRect();
    const p = this.paperToClient(paperx, papery);
    if (p.x < rect.left + margin) this.canvas.scrollLeft -= rect.left + margin - p.x;
    else if (p.x > rect.left + this.canvas.clientWidth - margin)
      this.canvas.scrollLeft += p.x - (rect.left + this.canvas.clientWidth - margin);
    if (p.y < rect.top + margin) this.canvas.scrollTop -= rect.top + margin - p.y;
    else if (p.y > rect.top + this.canvas.clientHeight - margin)
      this.canvas.scrollTop += p.y - (rect.top + this.canvas.clientHeight - margin);
  }

  private getSelectionMovability() {
    let situatie = MovableType.Undefined;
    for (let selectedBox of this.selected.getAllSelected()) {
      let sitPlanElement: SituationPlanElement = (selectedBox as any)
        .sitPlanElementRef;
      if (sitPlanElement != null) {
        switch (sitPlanElement.movable) {
          case true:
            if (
              situatie == MovableType.Undefined ||
              situatie == MovableType.Movable
            )
              situatie = MovableType.Movable;
            else if (situatie == MovableType.NotMovable)
              situatie = MovableType.Mixed;
            break;
          case false:
          default:
            if (
              situatie == MovableType.Undefined ||
              situatie == MovableType.NotMovable
            )
              situatie = MovableType.NotMovable;
            else if (situatie == MovableType.Movable)
              situatie = MovableType.Mixed;
            break;
        }
      }
    }
    return situatie;
  }

  /**
   * Verwisselt de movable property van de geselecteerde box-elementen.
   *
   * Alle boxen worden gewisseld, ook als ze niet allemaal dezelfde property hebben
   */
  private toggleSelectedBoxesMovable(desiredSituatie = MovableType.Undefined) {
    if (desiredSituatie == MovableType.Undefined) {
      let startSituatie = this.getSelectionMovability();
      desiredSituatie =
        startSituatie == MovableType.Movable ||
        startSituatie == MovableType.Mixed
          ? MovableType.NotMovable
          : MovableType.Movable;
    }

    for (let selectedBox of this.selected.getAllSelected()) {
      let sitPlanElement: SituationPlanElement = (selectedBox as any)
        .sitPlanElementRef;
      if (sitPlanElement != null) {
        let boxlabel = sitPlanElement.boxlabelref as HTMLElement | null;
        switch (desiredSituatie) {
          case MovableType.NotMovable:
            sitPlanElement.movable = false;
            selectedBox.setAttribute("movable", "false");
            if (boxlabel != null) boxlabel.setAttribute("movable", "false");
            break;
          case MovableType.Movable:
            sitPlanElement.movable = true;
            selectedBox.setAttribute("movable", "true");
            if (boxlabel != null) boxlabel.setAttribute("movable", "true");
            break;
          default:
          // do nothing
        }
      }
    }

    //if the above iteration had at least one element, store in globalThis.undostruct
    if (this.selected.length() > 0) globalThis.undostruct.store();
  }

  /**
   * Verandert de pagina van de geselecteerde box-elementen.
   *
   * Als er elementen geselecteerd zijn, wordt een popup getoond om de pagina te selecteren.
   * De pagina die reeds actief is, wordt niet getoond in de lijst.
   *
   * @fires showSelectPopup
   * @fires selectPage
   * @fires selectBox
   * @fires globalThis.undostruct.store
   */
  private changePageSelectedBoxes() {
    if (this.selected.length() > 0) {
      const pages = Array.from({ length: this.sitplan.numPages }, (_, i) =>
        String(i + 1)
      ).filter((page) => page !== String(this.sitplan.activePage));
      let selectedBoxes = this.selected
        .getAllSelected()
        .filter((e) => e != null);
      let selectedMovableBoxes = selectedBoxes.filter(
        (e) =>
          (e as any).sitPlanElementRef != null &&
          (e as any).sitPlanElementRef.movable
      );
      let selectedSitPlanElements = selectedBoxes
        .map((e) => (e as any).sitPlanElementRef)
        .filter((e) => e != null);
      let selectedMovableSitPlanElements = selectedSitPlanElements.filter(
        (e) => e.movable
      );
      (async () => {
        const result = await showSelectPopup("Nieuwe pagina:", pages);
        if (result !== null) {
          for (let element of selectedMovableSitPlanElements)
            element.changePage(+result);
          this.selectPage(+result);
          for (let box of selectedMovableBoxes) this.selectBox(box);
          globalThis.undostruct.store();
        } else {
          // Do nothing, selection canceled
        }
      })();
    }
  }

  /**
   * Toont het contextmenu op de locatie van de muis.
   *
   * @param event - De muisgebeurtenis die het menu opent (right click).
   */
  private showContextMenu = (event: MouseEvent) => {
    if (this.selected.length() < 1) return;

    let sitPlanElement: SituationPlanElement = (
      this.selected.getLastSelected() as any
    ).sitPlanElementRef;
    if (sitPlanElement == null) return;

    event.preventDefault();

    this.contextMenu.clearMenu();

    // Add rotation options for movable elements (including walls)
    if (sitPlanElement.movable) {
      this.contextMenu.addMenuItem(
        "Draai rechts",
        () => {
          this.rotateSelectedBoxes(90, true);
        },
        "Ctrl →"
      );
      this.contextMenu.addMenuItem(
        "Draai links",
        () => {
          this.rotateSelectedBoxes(-90, true);
        },
        "Ctrl ←"
      );
      this.contextMenu.addLine();
    }

    // Don't show edit for walls, windows, doors and freeform shapes (for now - they can just be deleted and redrawn)
    if (
      !sitPlanElement.isWall() &&
      !sitPlanElement.isWindow() &&
      !sitPlanElement.isDoor() &&
      !sitPlanElement.isFreeformShape()
    ) {
      this.contextMenu.addMenuItem(
        "Bewerk",
        this.editSelectedBox.bind(this),
        "Enter"
      );
      this.contextMenu.addLine();
    }

    switch (this.getSelectionMovability()) {
      case MovableType.Movable:
        this.contextMenu.addMenuItem(
          "Vergrendel",
          this.toggleSelectedBoxesMovable.bind(this),
          "Ctrl L"
        );
        break;
      case MovableType.NotMovable:
        this.contextMenu.addMenuItem(
          "Ontgrendel",
          this.toggleSelectedBoxesMovable.bind(this),
          "Ctrl L"
        );
        break;
      case MovableType.Mixed:
        this.contextMenu.addMenuItem(
          "Vergrendel",
          () => {
            this.toggleSelectedBoxesMovable.bind(this)(MovableType.NotMovable);
          },
          "Ctrl L"
        );
        this.contextMenu.addMenuItem(
          "Ontgrendel",
          () => {
            this.toggleSelectedBoxesMovable.bind(this)(MovableType.Movable);
          },
          ""
        );
        break;
    }

    if (sitPlanElement.movable) {
      this.contextMenu.addLine();

      this.contextMenu.addMenuItem(
        "Dupliceer",
        () => {
          this.duplicateSelectedBoxes();
          globalThis.undostruct.store();
        },
        "Ctrl D"
      );

      this.contextMenu.addMenuItem(
        "Verwijder",
        () => {
          this.deleteSelectedBoxes();
          globalThis.undostruct.store();
        },
        "Del"
      );

      if (this.sitplan.numPages > 1 && sitPlanElement.movable) {
        this.contextMenu.addLine();
        this.contextMenu.addMenuItem(
          "Naar pagina..",
          this.changePageSelectedBoxes.bind(this),
          "PgUp/PgDn"
        );
      }
    }

    this.contextMenu.show(event);
  };

  /**
   * Maakt een box en een label op de DOM of in een document-fragmentaan voor een element in het situatieplan.
   *
   * Een box is een sleepbaar element en kan zowel een symbool van het eendraadschema
   * zijn als een in te laden extern bestand.
   *
   * Event handlers voor het bewegen met muis of touch worden toegevoegd.
   *
   * Deze functie checkt om efficientie-redenen niet dat het situatieplanelement geldig is
   * en verwijst naar een bestaand element in het eendraadschema. Deze check dient op
   * voorhand te gebeuren, bijvoorbeeld door gebruik te maken van de functie syncToSitPlan.
   *
   * @param element - Het element in het situatieplan dat een box op de DOM nodig heeft.
   */
  private makeBox(
    element: SituationPlanElement,
    fragment: DocumentFragment = null
  ) {
    // Box aanmaken op de DOM voor het symbool of in te laden externe figuur
    // extra property sitPlanElementRef toegevoegd aan DOM zodat we later ons situatieplan element kunnen terugvinden
    let box = document.createElement("div");

    // Add wall class if this is a wall element
    // Add window class if this is a window element
    // Add door class if this is a door element
    // Add freeform shape class if this is a freeform shape element
    let className = "box";
    if (element.isWall()) {
      const wallElement = element.getWallElement();
      if (wallElement) {
        className += ` ${wallElement.getCSSClass()}`;
      }
    } else if (element.isWindow()) {
      className += " window-element";
    } else if (element.isDoor()) {
      className += " door-element";
    } else if (element.isFreeformShape()) {
      const freeformShapeElement = element.getFreeformShapeElement();
      if (freeformShapeElement) {
        className += ` ${freeformShapeElement.getCSSClass()}`;
      }
    }

    Object.assign(box, {
      id: element.id,
      className: className,
      sitPlanElementRef: element,
    });
    box.setAttribute("movable", element.movable ? "true" : "false");
    element.boxref = box;

    // Boxlabel aanmaken op de DOM voor de tekst bij het symbool
    // Walls, windows, doors and freeform shapes don't need labels
    let boxlabel = null;
    if (
      !element.isWall() &&
      !element.isWindow() &&
      !element.isDoor() &&
      !element.isFreeformShape()
    ) {
      boxlabel = document.createElement("div");
      Object.assign(boxlabel, {
        id: element.id + "_label",
        className: "boxlabel",
        sitPlanElementRef: element,
      });
      boxlabel.setAttribute("movable", element.movable ? "true" : "false");
      boxlabel.innerHTML = htmlspecialchars(element.getAdres()); // is deze nodig? Wellicht reeds onderdeel van updateContent
      element.boxlabelref = boxlabel;
    }

    // Content updaten en toevoegen aan de DOM
    this.updateBoxContent(element); //content moet eerst updated worden om te weten hoe groot de box is
    if (fragment) {
      fragment.append(box);
      if (boxlabel) fragment.append(boxlabel);
    } else {
      this.paper.append(box);
      if (boxlabel) this.paper.append(boxlabel);
    }
    //this.updateSymbolAndLabelPosition(element); //pas als alles op de DOM zit kunnen we berekenen waar het label hoort

    // Event handlers voor selecteren en slepen met muis, pen of touch
    box.addEventListener("pointerdown", this.onBoxPointerDown);
    if (boxlabel) {
      boxlabel.addEventListener("pointerdown", this.onBoxPointerDown);
      boxlabel.addEventListener("contextmenu", this.showContextMenu);
    }
    box.addEventListener("contextmenu", this.showContextMenu);
  }

  /**
   * Werk de content van het box-element en label-element van een situatieplanelement bij in de DOM.
   *
   * Deze functie controleert eerst of het box-element bestaat, zo-niet doet deze functie niets.
   * Daarna wordt de SVG van het symbool van het element gegenereerd.  Indien dit verschilt van wat reeds op de DOM zit wordt de innerHTML van het het box-element gewijzigd.
   * Daarnaast wordt de tekst van het label-element bijgewerkt en de fontsize ingesteld.
   *
   * TODO: de functie getScaledSVG wordt altijd uitgevoerd en is nodig om te weten of de DOM moet aangepast worden maar dit is minder efficient.
   *       er zijn mogelijk betere manieren om de parameter sitPlanElement.needsViewUpdate te bepalen dan de SVG effectief genereren en te vergelijken met de bestaande SVG op de DOM,
   *       bijvoorbeeld door een trigger op manipulatie in het ééndraadschema zelf.
   *
   * @param sitPlanElement - Het situatieplanelement dat aangepast moet worden.
   */
  private updateBoxContent(sitPlanElement: SituationPlanElement | null) {
    if (!sitPlanElement) return;

    const box = sitPlanElement.boxref;
    const boxlabel = sitPlanElement.boxlabelref;

    if (box == null) return;

    let svg = sitPlanElement.getScaledSVG(); // Deze call past ook viewUpdateNeeded aan en moet dus eerst gebeuren

    // Vergelijk met de laatst getekende SVG (niet met innerHTML: de browser serialiseert anders,
    // waardoor elk element bij elke redraw herschreven werd en afbeeldingen zichtbaar flitsten)
    if ((box as any).renderedSvg !== svg) {
      (box as any).renderedSvg = svg;
      sitPlanElement.needsViewUpdate = false;
      // Handvatten (bij een geselecteerd bouwelement) behouden wanneer de inhoud vernieuwd wordt
      const handles = Array.from(
        box.querySelectorAll(":scope > .wall-resize-handle, :scope > .wall-rotation-handle")
      );
      box.innerHTML = svg ?? "";
      handles.forEach((handle) => box.appendChild(handle));
    }

    if (boxlabel != null) {
      let adres = sitPlanElement.getAdres();
      if (sitPlanElement.labelfontsize != null)
        boxlabel.style.fontSize = String(sitPlanElement.labelfontsize) + "px";
      boxlabel.style.color = sitPlanElement.getKringColor() ?? "black";
      let newadres = adres != null ? htmlspecialchars(adres) : "";
      if (newadres != boxlabel.innerHTML) boxlabel.innerHTML = newadres;
    }
  }

  /**
   * Berekent de positie van het label van een situationplanelement in functie vna de grootte van het situationplanelement.
   * het situationplanelement moet daarvoor reeds een box hebben die aan de DOM werd toegevoegd om de grootte van deze box te kunnen bepalen.
   *
   * Wijzigt eveneens de grootte, en positie van het DIV-element dat het label van een situationplanelement bevat in de DOM.
   * Controleert ook of het label op een zichtbare pagina staat en maakt het onzichtbaar indien nodig.
   *
   * @param sitPlanElement - Het situatieplanelement waarvoor de positie van het label moet worden berekend.
   */

  private updateLabelPosition(sitPlanElement: SituationPlanElement | null) {
    if (!sitPlanElement) return;

    const boxlabel = sitPlanElement.boxlabelref as HTMLElement | null;
    if (!boxlabel) return;

    const scale = sitPlanElement.getscale();
    const forbiddenLabelZone = getXYRectangleSize(
      sitPlanElement.sizex * scale + globalThis.SITPLANVIEW_SELECT_PADDING,
      sitPlanElement.sizey * scale + globalThis.SITPLANVIEW_SELECT_PADDING,
      sitPlanElement.rotate
    );

    // Berekken de x/left positie van het label
    const adreslocation = sitPlanElement.getAdresLocation();
    switch (adreslocation) {
      case "links":
        sitPlanElement.labelposx =
          sitPlanElement.posx -
          forbiddenLabelZone.width / 2 -
          boxlabel.offsetWidth / 2;
        break;
      case "rechts":
        sitPlanElement.labelposx =
          sitPlanElement.posx +
          forbiddenLabelZone.width / 2 +
          boxlabel.offsetWidth / 2;
        break;
      default:
        sitPlanElement.labelposx = sitPlanElement.posx;
    }
    const left = `${sitPlanElement.labelposx - boxlabel.offsetWidth / 2}px`;
    if (boxlabel.style.left != left) boxlabel.style.left = left; // Vermijd aanpassingen DOM indien niet nodig

    // Bereken de y/top positie van het label
    // Deze bevat wat meer complexe trickery om alles min of meer overeen te doen komen tussen print en scherm
    let top: string;
    switch (adreslocation) {
      case "boven": {
        top = `${
          sitPlanElement.posy -
          forbiddenLabelZone.height / 2 -
          boxlabel.offsetHeight * 0.8
        }px`;
        sitPlanElement.labelposy =
          sitPlanElement.posy -
          forbiddenLabelZone.height / 2 -
          (boxlabel.offsetHeight * 0.5) / 2;
        break;
      }
      case "onder": {
        top = `${
          sitPlanElement.posy +
          forbiddenLabelZone.height / 2 -
          boxlabel.offsetHeight * 0.2
        }px`;
        sitPlanElement.labelposy =
          sitPlanElement.posy +
          forbiddenLabelZone.height / 2 +
          (boxlabel.offsetHeight * 0.7) / 2;
        break;
      }
      default:
        top = `${sitPlanElement.posy - boxlabel.offsetHeight / 2}px`;
        sitPlanElement.labelposy = sitPlanElement.posy + 1;
    }
    if (boxlabel.style.top != top) boxlabel.style.top = top; // Vermijd aanpassingen DOM indien niet nodig

    if (this.sitplan.activePage == sitPlanElement.page) {
      if (boxlabel.classList.contains("hidden"))
        boxlabel.classList.remove("hidden"); // Vermijd aanpassingen DOM indien niet nodig
    } else {
      if (!boxlabel.classList.contains("hidden"))
        boxlabel.classList.add("hidden"); // Vermijd aanpassingen DOM indien niet nodig
    }
  }

  /**
   * Wijzigt de grootte, positie en rotatietransformatie van het DIV-element dat een situationplanelement bevat in de DOM.
   * Controleert ook of het symbool op een zichtbare pagina staat en maakt het onzichtbaar indien nodig.
   *
   * @param sitPlanElement Het situationplanelement dat aangepast moet worden.
   */

  private updateSymbolPosition(sitPlanElement: SituationPlanElement | null) {
    function getRotationTransform(
      sitPlanElement: SituationPlanElement | null
    ): string {
      if (!sitPlanElement) return "";

      const [rotation, spiegel] =
        sitPlanElement.berekenAfbeeldingsRotatieEnSpiegeling();

      return `rotate(${rotation}deg)` + (spiegel ? " scaleX(-1)" : "");
    }

    if (!sitPlanElement) return;

    // Update wall element position if this is a wall
    if (sitPlanElement.isWall()) {
      const wallElement = sitPlanElement.getWallElement();
      if (wallElement) {
        wallElement.x = sitPlanElement.posx - wallElement.width / 2;
        wallElement.y = sitPlanElement.posy - wallElement.height / 2;
      }
    }

    // Update window element position if this is a window
    if (sitPlanElement.isWindow()) {
      const windowElement = sitPlanElement.getWindowElement();
      if (windowElement) {
        windowElement.x = sitPlanElement.posx - windowElement.width / 2;
        windowElement.y = sitPlanElement.posy - windowElement.height / 2;
      }
    }

    // Update door element position if this is a door
    if (sitPlanElement.isDoor()) {
      const doorElement = sitPlanElement.getDoorElement();
      if (doorElement) {
        doorElement.x = sitPlanElement.posx - doorElement.width / 2;
        doorElement.y = sitPlanElement.posy - doorElement.height / 2;
      }
    }

    // Update freeform shape element position if this is a freeform shape
    if (sitPlanElement.isFreeformShape()) {
      const freeformShapeElement = sitPlanElement.getFreeformShapeElement();
      if (freeformShapeElement) {
        freeformShapeElement.x =
          sitPlanElement.posx - freeformShapeElement.width / 2;
        freeformShapeElement.y =
          sitPlanElement.posy - freeformShapeElement.height / 2;
      }
    }

    const div = sitPlanElement.boxref as HTMLElement | null;
    if (!div) return;

    const scale = sitPlanElement.getscale();
    const contentwidth = sitPlanElement.sizex * scale;
    const contentheight = sitPlanElement.sizey * scale;

    const left =
      (
        sitPlanElement.posx -
        contentwidth / 2 -
        globalThis.SITPLANVIEW_SELECT_PADDING
      ).toString() + "px";
    if (div.style.left != left) div.style.left = left; // Vermijd aanpassingen DOM indien niet nodig

    const top =
      (
        sitPlanElement.posy -
        contentheight / 2 -
        globalThis.SITPLANVIEW_SELECT_PADDING
      ).toString() + "px";
    if (div.style.top != top) div.style.top = top; // Vermijd aanpassingen DOM indien niet nodig

    const width =
      (contentwidth + globalThis.SITPLANVIEW_SELECT_PADDING * 2).toString() +
      "px";
    if (div.style.width != width) div.style.width = width; // Vermijd aanpassingen DOM indien niet nodig

    const height =
      (contentheight + globalThis.SITPLANVIEW_SELECT_PADDING * 2).toString() +
      "px";
    if (div.style.height != height) div.style.height = height; // Vermijd aanpassingen DOM indien niet nodig

    const transform = getRotationTransform(sitPlanElement);
    if (div.style.transform != transform) div.style.transform = transform; // Vermijd aanpassingen DOM indien niet nodig

    if (this.sitplan.activePage == sitPlanElement.page) {
      if (div.classList.contains("hidden")) div.classList.remove("hidden"); // Vermijd aanpassingen DOM indien niet nodig
    } else {
      if (!div.classList.contains("hidden")) div.classList.add("hidden"); // Vermijd aanpassingen DOM indien niet nodig
    }
  }

  /**
   * Werkt de positie van het symbool bij op de DOM indien nodig.
   * Berekent de positie van het label en werkt deze bij op de DOM indien nodig
   *     *
   * @param sitPlanElement - Het situationplanelement
   */

  private updateSymbolAndLabelPosition(
    sitPlanElement: SituationPlanElement | null
  ) {
    if (!sitPlanElement) return;
    this.updateSymbolPosition(sitPlanElement); // Eerst content aanpassen anders kennen we de grootte van het symbool niet
    this.updateLabelPosition(sitPlanElement);
  }

  /**
   * Werkt de situatieplanweergave bij door elementen te synchroniseren met de onderliggende datastructuur.
   *
   * Deze functie zorgt er eerst voor dat alle elementen in het situatieplan een overeenkomstige box in de DOM hebben.
   * Het creëert ontbrekende boxes en voegt deze toe aan het document. Vervolgens werkt het de positie en
   * het label van elk symbool bij volgens de huidige staat. Daarna past het de weergave aan om de actieve pagina
   * weer te geven en werkt het de UI-ribbon bij.
   *
   * Deze methode meet en logt de tijd die nodig is om de redraw-operatie te voltooien.
   * Het gebruik van document fragments maakt de redraw aanzienlijk sneller in google chrome.
   * In Firefox is deze ook snel zonder document fragments.
   */

  redraw() {
    const start = performance.now();
    this.syncToSitPlan();

    const fragment: DocumentFragment = document.createDocumentFragment();

    let appendNeeded = false;
    for (let element of this.sitplan.elements) {
      if (!element.boxref) {
        this.makeBox(element, fragment);
        appendNeeded = true;
      }
    }
    if (appendNeeded) this.paper.append(fragment); // We moeten de boxes toevoegen aan de DOM alvorens de label positie te berekenen aangezien we de size van de labels moeten kennen

    this.showPage(this.sitplan.activePage);
    for (let element of this.sitplan.elements) {
      if (element.page == this.sitplan.activePage) {
        this.updateBoxContent(element);
        this.updateSymbolAndLabelPosition(element);
      }
    }

    this.refreshHandles();

    // Update layer manager if visible
    if (this.layerManager && this.layerManager.isVisible()) {
      this.layerManager.render();
    }

    this.emit(SITPLAN_EVENTS.viewChange);

    const end = performance.now();
    if (end - start > 50) console.log(`Redraw took ${end - start}ms`);
  }

  /**
   * Geeft de ordinal van het geselecteerde element terug in de array van het situatieplan.
   *
   * @returns {number | null} De id van de geselecteerde box, of null.
   */
  getLastSelectedBoxOrdinal(): number | null {
    if (this.selected.length() == 0) return null;

    return this.sitplan.elements.findIndex(
      (e) => e.boxref == this.selected.getLastSelected()
    );
  }

  /**
   * Geeft de ordinals van de geselecteerde elementen terug in de array van het situatieplan.
   *
   * @returns {number[] | null} De ordinals van de geselecteerde boxes, of null.
   */
  getSelectedBoxesOrdinals(): number[] {
    if (this.selected.length() == 0) return [];

    return this.sitplan.elements
      .filter((e) => this.selected.includes(e.boxref))
      .map((e) => this.sitplan.elements.indexOf(e));
  }

  /**
   * Moet opgeroepen worden telkens de selectie wijzigt: werkt handvatten, undo-informatie,
   * laagbeheer en de React-laag bij.
   */
  private selectionChanged() {
    if (this.disposed) return;
    this.refreshHandles();
    globalThis.undostruct?.updateSelectedBoxes();
    this.emit(SITPLAN_EVENTS.selectionChange);
    if (this.layerManager && this.layerManager.isVisible()) {
      this.layerManager.render();
    }
  }

  /**
   * Maakt de gegeven box de geselecteerde box.
   *
   * @param box - Het element dat geselecteerd moet worden.
   */
  public selectOneBox(box: HTMLElement | null) {
    if (!box) return;
    this.clearSelection(false);
    box.classList.add("selected");
    this.selected.selectOne(box);
    this.selectionChanged();
  }

  /**
   * Maakt de gegeven box geselecteerd als deze niet null is.
   *
   * @param box - Het element dat geselecteerd moet worden.
   */
  public selectBox(box: HTMLElement | null) {
    if (!box) return;
    box.classList.add("selected");
    this.selected.select(box);
    this.selectionChanged();
  }

  /**
   * Selecteert de gegeven box als deze niet al geselecteerd is, of deselecteert deze als deze al geselecteerd is.
   * De allerlaatste box in de selectie wordt nooit gedeselecteerd.
   *
   * @param box - Het element dat geselecteerd moet worden.
   */
  public selectToggleBox(box: HTMLElement | null) {
    if (!box) return;
    this.selected.toggleButNeverRemoveLast(box);
    if (this.selected.includes(box)) box.classList.add("selected");
    else box.classList.remove("selected");
    this.selectionChanged();
  }

  /**
   * Verwijdert de selectie van alle boxes.
   *
   * @param notify - Indien false wordt de rest van de applicatie niet verwittigd (omdat er onmiddellijk een nieuwe selectie volgt).
   */
  clearSelection(notify: boolean = true) {
    this.paper
      .querySelectorAll(".box.selected")
      .forEach((b) => b.classList.remove("selected"));
    const hadSelection = this.selected.length() > 0;
    this.selected.clear();
    this.removeAllWallResizeHandles();
    if (notify && hadSelection) this.selectionChanged();
  }

  /**
   * Verwijdert de geselecteerde boxen en verwijdert deze ook uit het situatieplan.
   * Verwijdert ook de bijhorende labels.
   */
  deleteSelectedBoxes() {
    if (this.selected.length() == 0) return;

    for (let selectedBox of this.selected.getAllSelected()) {
      let sitPlanElement = (selectedBox as any).sitPlanElementRef;
      if (sitPlanElement == null) continue;
      if (sitPlanElement.movable == false) continue;

      selectedBox.remove();
      if (sitPlanElement.boxlabelref != null)
        sitPlanElement.boxlabelref.remove();

      this.sitplan.removeElement(sitPlanElement);
    }
    this.selected.clear();
    this.selectionChanged();
  }

  /**
   * Dupliceert de geselecteerde boxen en positioneert ze een beetje rechtsonder van de originelen.
   */
  duplicateSelectedBoxes() {
    if (this.selected.length() == 0) return;

    const newSelectedBoxes: HTMLElement[] = [];
    const offset = 20; // Offset voor de gedupliceerde elementen

    for (let selectedBox of this.selected.getAllSelected()) {
      let sitPlanElement = (selectedBox as any).sitPlanElementRef;
      if (sitPlanElement == null) continue;
      if (sitPlanElement.movable == false) continue;

      // Create a deep copy of the element
      let newElement: SituationPlanElement;

      if (sitPlanElement.isWall()) {
        // Duplicate wall
        const wallElement = sitPlanElement.getWallElement();
        if (!wallElement) continue;

        // Create wall with original position
        newElement = this.sitplan.addWallElement(
          wallElement.type,
          sitPlanElement.page,
          wallElement.x,
          wallElement.y,
          wallElement.width,
          wallElement.height
        );

        // Copy rotation
        newElement.rotate = sitPlanElement.rotate || 0;

        // Apply offset to center position (posx/posy)
        newElement.posx = sitPlanElement.posx + offset;
        newElement.posy = sitPlanElement.posy + offset;

        // Update wall element coordinates to match new center
        const newWallElement = newElement.getWallElement();
        if (newWallElement) {
          newWallElement.x = newElement.posx - newWallElement.width / 2;
          newWallElement.y = newElement.posy - newWallElement.height / 2;
        }
      } else if (sitPlanElement.isWindow()) {
        // Duplicate window
        const windowElement = sitPlanElement.getWindowElement();
        if (!windowElement) continue;

        // Create window with original position
        newElement = this.sitplan.addWindowElement(
          sitPlanElement.page,
          windowElement.x,
          windowElement.y,
          windowElement.width,
          windowElement.height
        );

        // Copy rotation
        newElement.rotate = sitPlanElement.rotate || 0;

        // Apply offset to center position (posx/posy)
        newElement.posx = sitPlanElement.posx + offset;
        newElement.posy = sitPlanElement.posy + offset;

        // Update window element coordinates to match new center
        const newWindowElement = newElement.getWindowElement();
        if (newWindowElement) {
          newWindowElement.x = newElement.posx - newWindowElement.width / 2;
          newWindowElement.y = newElement.posy - newWindowElement.height / 2;
        }
      } else if (sitPlanElement.isDoor()) {
        // Duplicate door
        const doorElement = sitPlanElement.getDoorElement();
        if (!doorElement) continue;

        // Create door with original position
        newElement = this.sitplan.addDoorElement(
          sitPlanElement.page,
          doorElement.x,
          doorElement.y,
          doorElement.width,
          doorElement.height
        );

        // Copy rotation
        newElement.rotate = sitPlanElement.rotate || 0;

        // Apply offset to center position (posx/posy)
        newElement.posx = sitPlanElement.posx + offset;
        newElement.posy = sitPlanElement.posy + offset;

        // Update door element coordinates to match new center
        const newDoorElement = newElement.getDoorElement();
        if (newDoorElement) {
          newDoorElement.x = newElement.posx - newDoorElement.width / 2;
          newDoorElement.y = newElement.posy - newDoorElement.height / 2;
        }
      } else if (sitPlanElement.isFreeformShape()) {
        // Duplicate freeform shape
        const freeformShapeElement = sitPlanElement.getFreeformShapeElement();
        if (!freeformShapeElement) continue;

        // Create freeform shape with original position
        newElement = this.sitplan.addFreeformShapeElement(
          freeformShapeElement.type,
          sitPlanElement.page,
          freeformShapeElement.x,
          freeformShapeElement.y,
          freeformShapeElement.width,
          freeformShapeElement.height
        );

        // Copy rotation
        newElement.rotate = sitPlanElement.rotate || 0;

        // Apply offset to center position (posx/posy)
        newElement.posx = sitPlanElement.posx + offset;
        newElement.posy = sitPlanElement.posy + offset;

        // Update freeform shape element coordinates to match new center
        const newFreeformShapeElement = newElement.getFreeformShapeElement();
        if (newFreeformShapeElement) {
          newFreeformShapeElement.x =
            newElement.posx - newFreeformShapeElement.width / 2;
          newFreeformShapeElement.y =
            newElement.posy - newFreeformShapeElement.height / 2;
        }
      } else {
        // Duplicate regular element - create new instance and copy properties
        newElement = new SituationPlanElement();

        // Copy JSON representation to get all properties
        const json = sitPlanElement.toJsonObject();
        newElement.fromJsonObject(json);

        // Update position with offset
        newElement.posx = sitPlanElement.posx + offset;
        newElement.posy = sitPlanElement.posy + offset;
        newElement.labelposx = sitPlanElement.labelposx + offset;
        newElement.labelposy = sitPlanElement.labelposy + offset;

        // Generate new ID
        newElement.id = randomId("SP_");

        // Add to sitplan
        this.sitplan.elements.push(newElement);
      }

      // Create the box on the DOM
      this.makeBox(newElement);

      if (newElement.boxref) {
        newSelectedBoxes.push(newElement.boxref);
      }
    }

    // Clear old selection and select the new duplicated elements
    this.clearSelection();
    for (let box of newSelectedBoxes) {
      this.selectBox(box);
    }
  }

  /**
   * Send the selected box to the back of the z-index stack and reorder the elements of the situation plan accordingly
   * so that after saving or during printing the elements are drawn in the same order.
   *
   * @returns void
   */
  sendToBack() {
    if (this.selected.length() == 0) return;

    for (let element of this.sitplan.elements) {
      if (element.boxref != null) {
        let newzindex;

        if (this.selected.includes(element.boxref) && element.movable != false)
          newzindex = 0;
        else newzindex = (parseInt(element.boxref.style.zIndex) || 0) + 1;

        element.boxref.style.zIndex = newzindex.toString();
        if (element.boxlabelref != null) {
          element.boxlabelref.style.zIndex = newzindex.toString();
        }
      }
    }

    this.sitplan.orderByZIndex();
    globalThis.undostruct.store();
  }

  /**
   * Send the selected box to the front of the z-index stack and reorder the elements of the situation plan accordingly
   * so that after saving or during printing the elements are drawn in the same order.
   *
   * @returns void
   */
  bringToFront(undoStore: boolean = true) {
    if (this.selected.length() == 0) return;

    let newzindex = 0;
    for (let element of this.sitplan.elements) {
      if (element.boxref != null && !this.selected.includes(element.boxref)) {
        newzindex = Math.max(
          newzindex,
          parseInt(element.boxref.style.zIndex) || 0
        );
      }
    }
    newzindex += 1;

    for (let selected of this.selected.getAllSelected()) {
      let element = (selected as any).sitPlanElementRef;
      if (element == null) continue;
      if (element.movable == false) continue;
      selected.style.zIndex = newzindex.toString();
      if (element.boxlabelref != null)
        element.boxlabelref.style.zIndex = newzindex.toString();
    }

    this.sitplan.orderByZIndex();
    if (undoStore) globalThis.undostruct.store();
  }

  /**
   * De halo rond een SituationPlanElement is de ruimte die wordt mee gesleept rond het referentie-element.
   * Deze bevat de unie van alle geselecteerde en movable andere elementen.
   * Deze informatie is nodig om tijdens het slepen te bepalen of alle elementen nog op aanvaardbare plaatsen zitten.
   *
   * @param sitPlanReferenceElement - Het situatieplanelement in het midden van de geselecteerde boxen.
   * @returns {Object} Een object met de volgende properties:
   *   - left: de afstand links van het element in het midden tot de linker rand van de unie
   *   - right: de afstand rechts van het element in het midden tot de rechter rand van de unie
   *   - top: de afstand boven het element in het midden tot de boven rand van de unie
   *   - bottom: de afstand onder het element in het midden tot de onder rand van de unie
   */
  // ---------------------------------------------------------------------------
  // Pointer interacties: slepen, selectierechthoek, pannen
  // ---------------------------------------------------------------------------

  /** Begrenzende rechthoek (as-gealigneerd, in papier-coördinaten) van een element inclusief rotatie */
  private getElementBounds(element: SituationPlanElement) {
    const scale = element.getscale();
    const size = getRotatedRectangleSize(
      element.sizex * scale,
      element.sizey * scale,
      element.rotate || 0
    );
    return {
      left: element.posx - size.width / 2,
      top: element.posy - size.height / 2,
      right: element.posx + size.width / 2,
      bottom: element.posy + size.height / 2,
    };
  }

  private getSelectedMovableElements(): SituationPlanElement[] {
    return this.selected
      .getAllSelected()
      .map((box) => (box as any)?.sitPlanElementRef as SituationPlanElement)
      .filter((e) => e != null && e.movable !== false);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) return false;
    return (
      el.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
    );
  }

  /**
   * Automatisch scrollen wanneer de muis tijdens een sleepbeweging dicht bij de rand van het canvas komt.
   * Geeft een functie terug om de autoscroll te stoppen.
   */
  private startAutoScroll(
    getPointer: () => { x: number; y: number } | null,
    onScroll: () => void
  ): () => void {
    let frame = 0;
    const speed = (distance: number) =>
      Math.ceil(
        AUTOSCROLL_MAX_SPEED *
          Math.min(1, (AUTOSCROLL_EDGE_PX - distance) / AUTOSCROLL_EDGE_PX)
      );
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const pointer = getPointer();
      if (!pointer) return;
      const rect = this.canvas.getBoundingClientRect();
      const left = rect.left + this.canvas.clientLeft;
      const top = rect.top + this.canvas.clientTop;
      const right = left + this.canvas.clientWidth;
      const bottom = top + this.canvas.clientHeight;
      let dx = 0;
      let dy = 0;
      if (pointer.x < left + AUTOSCROLL_EDGE_PX) dx = -speed(pointer.x - left);
      else if (pointer.x > right - AUTOSCROLL_EDGE_PX) dx = speed(right - pointer.x);
      if (pointer.y < top + AUTOSCROLL_EDGE_PX) dy = -speed(pointer.y - top);
      else if (pointer.y > bottom - AUTOSCROLL_EDGE_PX) dy = speed(bottom - pointer.y);
      if (dx === 0 && dy === 0) return;
      const beforeLeft = this.canvas.scrollLeft;
      const beforeTop = this.canvas.scrollTop;
      this.canvas.scrollLeft += dx;
      this.canvas.scrollTop += dy;
      if (
        this.canvas.scrollLeft !== beforeLeft ||
        this.canvas.scrollTop !== beforeTop
      )
        onScroll();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }

  /**
   * Registreert move/up listeners op window voor een pointer interactie.
   * Geeft een cleanup functie terug.
   */
  private trackPointer(
    pointerId: number,
    onMove: (ev: PointerEvent) => void,
    onEnd: (ev: PointerEvent | null, cancelled: boolean) => void
  ): () => void {
    let finished = false;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      onMove(ev);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      finish(ev, ev.type === "pointercancel");
    };
    const blur = () => finish(null, true);
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", blur);
    };
    const finish = (ev: PointerEvent | null, cancelled: boolean) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (this.activeInteractionCleanup === interactionCleanup)
        this.activeInteractionCleanup = null;
      onEnd(ev, cancelled);
    };
    const interactionCleanup = () => finish(null, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", blur);
    this.beginInteraction(interactionCleanup);
    return interactionCleanup;
  }

  /**
   * Capture-fase pointerdown op het canvas.
   *  - middelste muisknop of spatie + linkermuisknop: pannen
   *  - linkermuisknop in tekenmodus: bouwelement tekenen (ook bovenop andere elementen zoals een plattegrond)
   */
  private onCanvasPointerDownCapture = (event: PointerEvent) => {
    if (this.disposed) return;
    const target = event.target as HTMLElement;
    if (target?.closest?.(".wall-resize-handle, .wall-rotation-handle")) return;

    if (event.button === 1 || (event.button === 0 && this.spacePressed)) {
      event.preventDefault();
      event.stopPropagation();
      this.startPan(event);
      return;
    }

    if (this.drawingTool && event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      this.startDrawing(event);
    }
  };

  /**
   * Bubble-fase pointerdown op het canvas: er werd niet op een box geklikt.
   */
  private onCanvasPointerDown = (event: PointerEvent) => {
    if (this.disposed) return;
    this.contextMenu.hide();
    if (event.button !== 0) {
      if (event.button === 2) this.clearSelection();
      return;
    }
    // Op aanraakschermen laten we het canvas scrollen, een tik wist de selectie
    if (event.pointerType === "touch") {
      this.clearSelection();
      return;
    }
    this.startMarquee(event, null);
  };

  /**
   * Pannen van het canvas door te slepen.
   */
  private startPan(event: PointerEvent) {
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = this.canvas.scrollLeft;
    const startTop = this.canvas.scrollTop;
    this.canvas.classList.add("panning");
    this.trackPointer(
      event.pointerId,
      (ev) => {
        this.canvas.scrollLeft = startLeft - (ev.clientX - startX);
        this.canvas.scrollTop = startTop - (ev.clientY - startY);
      },
      () => {
        this.canvas.classList.remove("panning");
      }
    );
  }

  /**
   * Selectierechthoek. Indien clickBox gegeven is en de muis niet beweegt, wordt die box geselecteerd
   * (wordt gebruikt voor vergrendelde elementen zoals een plattegrond waarop men een selectie wil trekken).
   */
  private startMarquee(event: PointerEvent, clickBox: HTMLElement | null) {
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    const startClient = { x: event.clientX, y: event.clientY };
    const start = this.clientToPaper(event.clientX, event.clientY);
    const initialSelection = additive ? [...this.selected.getAllSelected()] : [];
    let lastPointer: { x: number; y: number } | null = null;
    let moved = false;
    let marquee: HTMLDivElement | null = null;
    let hits: HTMLElement[] = [];
    let stopAutoScroll: (() => void) | null = null;

    const update = () => {
      if (!lastPointer || !marquee) return;
      const p = this.clientToPaper(lastPointer.x, lastPointer.y);
      const left = Math.min(start.x, p.x);
      const top = Math.min(start.y, p.y);
      const right = Math.max(start.x, p.x);
      const bottom = Math.max(start.y, p.y);
      marquee.style.left = `${left}px`;
      marquee.style.top = `${top}px`;
      marquee.style.width = `${right - left}px`;
      marquee.style.height = `${bottom - top}px`;

      hits = [];
      for (const element of this.sitplan.elements) {
        if (element.page !== this.sitplan.activePage || !element.boxref) continue;
        if (element.boxref.style.display === "none") continue; // verborgen via laagbeheer
        const b = this.getElementBounds(element);
        // Vergrendelde elementen (vaak een grote plattegrond) enkel indien volledig omsloten
        const hit =
          element.movable === false
            ? b.left >= left && b.right <= right && b.top >= top && b.bottom <= bottom
            : b.right >= left && b.left <= right && b.bottom >= top && b.top <= bottom;
        if (hit) hits.push(element.boxref);
      }
      const selection = new Set<HTMLElement>([...initialSelection, ...hits]);
      for (const element of this.sitplan.elements) {
        if (!element.boxref) continue;
        element.boxref.classList.toggle("selected", selection.has(element.boxref));
      }
    };

    this.trackPointer(
      event.pointerId,
      (ev) => {
        lastPointer = { x: ev.clientX, y: ev.clientY };
        if (!moved) {
          if (
            Math.hypot(ev.clientX - startClient.x, ev.clientY - startClient.y) <
            DRAG_THRESHOLD_PX
          )
            return;
          moved = true;
          marquee = document.createElement("div");
          marquee.className = "sitplan-marquee";
          this.paper.appendChild(marquee);
          stopAutoScroll = this.startAutoScroll(() => lastPointer, update);
        }
        update();
      },
      (_ev, cancelled) => {
        stopAutoScroll?.();
        marquee?.remove();
        if (!moved) {
          if (cancelled) return;
          if (clickBox) {
            if (additive) this.selectToggleBox(clickBox);
            else {
              this.clearSelection();
              this.selectBox(clickBox);
            }
          } else if (!additive) {
            this.clearSelection();
          }
          return;
        }
        const finalSelection = [...new Set<HTMLElement>([...initialSelection, ...hits])];
        this.clearSelection(false);
        for (const box of finalSelection) {
          box.classList.add("selected");
          this.selected.select(box);
        }
        this.selectionChanged();
      }
    );
  }

  /**
   * Pointerdown op een box of label: selecteren en eventueel slepen.
   */
  private onBoxPointerDown = (event: PointerEvent) => {
    if (this.disposed || event == null) return;
    if (event.button === 1) return; // pannen wordt in de capture-fase afgehandeld

    const target = event.target as HTMLElement;
    if (target?.closest?.(".wall-resize-handle, .wall-rotation-handle")) return;

    const sitPlanElement: SituationPlanElement = (event.currentTarget as any)
      ?.sitPlanElementRef;
    if (sitPlanElement == null) return;
    const box = sitPlanElement.boxref as HTMLElement | null;
    if (box == null) return;

    this.contextMenu.hide();
    event.stopPropagation();

    const additive = event.shiftKey || event.ctrlKey || event.metaKey;

    // Een vergrendeld element (bvb een plattegrond) gedraagt zich als achtergrond: slepen start een
    // selectierechthoek, een klik selecteert het element.
    if (
      event.button === 0 &&
      sitPlanElement.movable === false &&
      event.pointerType !== "touch" &&
      !this.selected.includes(box)
    ) {
      this.startMarquee(event, box);
      return;
    }

    // Selecteren. Dit moet zowel voor de linker als de rechter muisknop.
    if (additive) {
      this.selectToggleBox(box);
    } else if (!this.selected.includes(box)) {
      this.clearSelection(false);
      this.selectBox(box);
    } else {
      this.selectBox(box); // maakt van deze box de laatst geselecteerde (referentie)
    }

    if (event.button !== 0) return; // rechtermuisknop: enkel selecteren, het contextmenu volgt
    if (!box.classList.contains("selected")) return; // bvb gedeselecteerd met shift
    if (sitPlanElement.movable === false) return;

    event.preventDefault();
    this.startDrag(event, sitPlanElement);
  };

  /**
   * Verplaatst alle geselecteerde (en verplaatsbare) elementen mee met de muis.
   */
  private startDrag(event: PointerEvent, reference: SituationPlanElement) {
    const items = this.getSelectedMovableElements();
    if (items.length === 0) return;

    const startClient = { x: event.clientX, y: event.clientY };
    const startPaper = this.clientToPaper(event.clientX, event.clientY);
    const startPositions = items.map((e) => ({ e, x: e.posx, y: e.posy }));
    const refStart = { x: reference.posx, y: reference.posy };

    // Alle middelpunten moeten op het papier blijven
    const W = this.getPaperWidth();
    const H = this.getPaperHeight();
    let minDx = -Infinity,
      maxDx = Infinity,
      minDy = -Infinity,
      maxDy = Infinity;
    for (const { x, y } of startPositions) {
      minDx = Math.max(minDx, -x);
      maxDx = Math.min(maxDx, W - x);
      minDy = Math.max(minDy, -y);
      maxDy = Math.min(maxDy, H - y);
    }
    // Indien een element al buiten het papier stond, laten we het toch toe om het terug te slepen
    if (minDx > maxDx) [minDx, maxDx] = [-Infinity, Infinity];
    if (minDy > maxDy) [minDy, maxDy] = [-Infinity, Infinity];

    let moved = false;
    let lastPointer: { x: number; y: number; shiftKey: boolean; altKey: boolean } | null = null;
    let stopAutoScroll: (() => void) | null = null;

    const apply = () => {
      if (!lastPointer) return;
      const p = this.clientToPaper(lastPointer.x, lastPointer.y);
      let dx = p.x - startPaper.x;
      let dy = p.y - startPaper.y;
      if (lastPointer.shiftKey) {
        // Beperk tot horizontaal of verticaal
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      if (this.snapToGrid && !lastPointer.altKey) {
        dx = this.snap(refStart.x + dx) - refStart.x;
        dy = this.snap(refStart.y + dy) - refStart.y;
      }
      dx = Math.min(maxDx, Math.max(minDx, dx));
      dy = Math.min(maxDy, Math.max(minDy, dy));
      for (const { e, x, y } of startPositions) {
        e.posx = x + dx;
        e.posy = y + dy;
        this.updateSymbolAndLabelPosition(e);
      }
    };

    this.trackPointer(
      event.pointerId,
      (ev) => {
        lastPointer = { x: ev.clientX, y: ev.clientY, shiftKey: ev.shiftKey, altKey: ev.altKey };
        if (!moved) {
          if (
            Math.hypot(ev.clientX - startClient.x, ev.clientY - startClient.y) <
            DRAG_THRESHOLD_PX
          )
            return;
          moved = true;
          this.paper.classList.add("dragging");
          stopAutoScroll = this.startAutoScroll(() => lastPointer, apply);
        }
        ev.preventDefault();
        apply();
      },
      (_ev, cancelled) => {
        stopAutoScroll?.();
        this.paper.classList.remove("dragging");
        if (!moved) return;
        if (cancelled) {
          // Terugzetten naar de beginpositie
          for (const { e, x, y } of startPositions) {
            e.posx = x;
            e.posy = y;
            this.updateSymbolAndLabelPosition(e);
          }
          return;
        }
        globalThis.undostruct.store();
        this.emit(SITPLAN_EVENTS.selectionChange);
        const helperTip = new HelperTip(globalThis.appDocStorage);
        helperTip.show(
          "sitplan.arrowdrag",
          `<h3>Tip: Symbolen verplaatsen</h3>
            <p>Voor fijnere controle tijdens het verschuiven van symbolen kan u ook de pijltjes op het toetsenbord gebruiken (met Shift per 10 pixels).</p>`,
          true
        );
      }
    );
  }

  /**
   * Selecteer een pagina.
   *
   * @param page - Het nummer van de pagina die getoond moet worden.
   */
  selectPage(page: number) {
    this.sitplan.activePage = page;
    this.redraw();
  }

  /**
   * Toont enkel de elementen die op de pagina staan die als parameter wordt meegegeven.
   *
   * @param page - Het nummer van de pagina die getoond moet worden.
   */
  showPage(page: number) {
    // Elementen die niet op deze pagina staan kunnen niet geselecteerd blijven
    const selectionOnOtherPage = this.selected
      .getAllSelected()
      .some((box) => (box as any)?.sitPlanElementRef?.page !== page || !box.isConnected);
    if (selectionOnOtherPage) this.clearSelection();
    for (let element of this.sitplan.elements) {
      if (!element.boxref) continue;
      if (element.page != page) {
        element.boxref.classList.add("hidden");
        if (element.boxlabelref) element.boxlabelref.classList.add("hidden");
      } else {
        element.boxref.classList.remove("hidden");
        if (element.boxlabelref) element.boxlabelref.classList.remove("hidden");
      }
    }
  }

  /**
   * Roteert de geselecteerde box met het opgegeven aantal graden.
   * De box wordt geroteerd rond zijn middelpunt.
   * De rotatie wordt cumulatief uitgevoerd, d.w.z. de nieuwe rotatie wordt toegevoegd aan de vorige.
   * De rotatie is beperkt tot het bereik [0, 360) graden.
   * Deze functie slaat de status op, zodat het aanroepen van undo() deze actie ongedaan maakt.
   * @param degrees - Het aantal graden waarmee de box moet worden gedraaid.
   */
  rotateSelectedBoxes(degrees: number, rotateLabelToo: boolean = false) {
    /**
     * Roteert het label.
     *
     * Het label can de volgende locaties hebben, 'boven', 'rechts','onder', 'links'.
     *
     * @param cycle - Het aantal keren dat het label met 90 graden moet worden gedraaid.
     *                1 is een draaing van 90 graden naar rechts, -1 is een draaing van 90 graden naar links.
     */
    function rotateLabel(pic, cycle) {
      const locations = ["boven", "rechts", "onder", "links"];
      if (pic == null) return;
      const index = locations.indexOf(pic.getAdresLocation());
      pic.setAdresLocation(locations[(index + cycle + 4) % 4]);
    }

    for (let selected of this.selected.getAllSelected()) {
      let pic = (selected as any).sitPlanElementRef;
      if (pic == null) continue;
      if (pic.movable == false) continue;
      // Walls and freeform shapes can now rotate too!
      pic.rotate = (pic.rotate + degrees) % 360;
      if (rotateLabelToo && !pic.isWall() && !pic.isFreeformShape())
        rotateLabel.bind(this)(pic, Math.round(degrees / 90));
      this.updateBoxContent(pic);
      this.updateSymbolAndLabelPosition(pic);
    }

    if (this.selected.length() > 0) globalThis.undostruct.store();
  }

  /**
   * Tijdelijk de sneltoetsen uitschakelen (bvb terwijl een popup open staat).
   */
  private keyboardSuspended = false;

  unattachArrowKeys() {
    this.keyboardSuspended = true;
  }

  /**
   * Verschuift de geselecteerde verplaatsbare elementen. De middelpunten blijven op het papier.
   */
  private nudgeSelected(dx: number, dy: number) {
    const items = this.getSelectedMovableElements();
    if (items.length === 0) return;
    const W = this.getPaperWidth();
    const H = this.getPaperHeight();
    for (const e of items) {
      if (dx < 0) dx = Math.max(dx, Math.min(0, -e.posx));
      if (dx > 0) dx = Math.min(dx, Math.max(0, W - e.posx));
      if (dy < 0) dy = Math.max(dy, Math.min(0, -e.posy));
      if (dy > 0) dy = Math.min(dy, Math.max(0, H - e.posy));
    }
    if (dx === 0 && dy === 0) return;
    for (const e of items) {
      e.posx += dx;
      e.posy += dy;
      this.updateSymbolAndLabelPosition(e);
    }
    // Opeenvolgende pijltjes worden samengevoegd tot één undo-stap
    globalThis.undostruct.store(
      "arrowMove" + items.map((e) => e.id).join(",")
    );
    this.emit(SITPLAN_EVENTS.selectionChange);
  }

  /**
   * Verplaatst de geselecteerde elementen naar een andere pagina.
   */
  private moveSelectedToPage(newPage: number) {
    const boxes = this.selected
      .getAllSelected()
      .filter(
        (e) => e != null && (e as any).sitPlanElementRef?.movable !== false
      );
    if (boxes.length === 0) return;
    for (const box of boxes) (box as any).sitPlanElementRef.changePage(newPage);
    this.selectPage(newPage); // Naar de nieuwe pagina gaan
    this.clearSelection(false);
    for (const box of boxes) {
      box.classList.add("selected");
      this.selected.select(box);
    }
    this.selectionChanged();
    this.bringToFront(false); // breng de verplaatste elementen naar voren
    globalThis.undostruct.store();
  }

  /**
   * Voegt eventlisteners toe om pijltjestoetsen en andere sneltoetsen te hanteren.
   */
  attachArrowKeys() {
    this.keyboardSuspended = false;

    this.event_manager.addEventListener(document, "keyup", (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        this.spacePressed = false;
        this.canvas.classList.remove("space-pan");
      }
    });

    this.event_manager.addEventListener(window, "blur", () => {
      this.spacePressed = false;
      this.canvas.classList.remove("space-pan");
    });

    this.event_manager.addEventListener(document, "keydown", (event: KeyboardEvent) => {
      if (this.disposed || this.keyboardSuspended || !this.canvas.isConnected) return;
      if (document.getElementById("popupOverlay") != null) return; // We need the keys when editing symbol properties.
      if (document.querySelector(".editor-modal-overlay, [role='dialog'][aria-modal='true']")) return;
      if (this.isEditableTarget(event.target)) return; // Typen in een invoerveld (bvb de zijbalk)

      if (event.key !== "Shift" && event.key !== "Control" && event.key !== "Alt")
        this.contextMenu.hide();

      // Spatie ingedrukt houden om te pannen
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        if (!this.spacePressed) {
          this.spacePressed = true;
          this.canvas.classList.add("space-pan");
        }
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      const key = event.key;

      // Sneltoetsen die altijd werken. Ongedaan maken/opnieuw wordt centraal in App.tsx behandeld.
      if (ctrl) {
        switch (key.toLowerCase()) {
          case "r": {
            event.preventDefault();
            const helperTip = new HelperTip(globalThis.appDocStorage);
            helperTip.show(
              "sitplan.Ctrl_r_key",
              `<h3>Ctrl-r genegeerd</h3>
                        <p>Om te vermijden dat u per ongeluk de pagina ververst en uw werk verliest is de refresh sneltoets uitgeschakeld in het situatieschema.</p>`,
              true
            );
            return;
          }
          case "a":
            event.preventDefault();
            this.selectAllOnPage();
            return;
          case "0":
            event.preventDefault();
            this.zoomToFit();
            return;
          case "=":
          case "+":
            event.preventDefault();
            this.zoomBy(1.25);
            return;
          case "-":
            event.preventDefault();
            this.zoomBy(1 / 1.25);
            return;
        }
      }

      if (key === "Escape") {
        if (this.drawingTool) {
          this.setDrawingTool(null);
          return;
        }
        this.clearSelection();
        return;
      }

      if (this.selected.length() === 0) {
        if (key === "PageDown" || key === "PageUp") {
          event.preventDefault();
          let newPage = this.sitplan.activePage + (key === "PageDown" ? 1 : -1);
          if (newPage > this.sitplan.numPages) newPage = 1;
          if (newPage < 1) newPage = this.sitplan.numPages;
          if (newPage !== this.sitplan.activePage) {
            this.selectPage(newPage);
            globalThis.undostruct.store("changePage");
          }
        }
        return; // standaard browsergedrag (scrollen) voor andere toetsen
      }

      const step = event.shiftKey ? 10 : 1;

      if (ctrl) {
        switch (key) {
          case "ArrowLeft":
            event.preventDefault();
            this.rotateSelectedBoxes(-90, true);
            return;
          case "ArrowRight":
            event.preventDefault();
            this.rotateSelectedBoxes(90, true);
            return;
          case "l":
          case "L":
            event.preventDefault();
            this.toggleSelectedBoxesMovable();
            return;
          case "d":
          case "D":
            event.preventDefault();
            this.duplicateSelectedBoxes();
            globalThis.undostruct.store();
            return;
        }
        return;
      }

      switch (key) {
        case "ArrowLeft":
          event.preventDefault();
          this.nudgeSelected(-step, 0);
          return;
        case "ArrowRight":
          event.preventDefault();
          this.nudgeSelected(step, 0);
          return;
        case "ArrowUp":
          event.preventDefault();
          this.nudgeSelected(0, -step);
          return;
        case "ArrowDown":
          event.preventDefault();
          this.nudgeSelected(0, step);
          return;
        case "PageDown":
        case "PageUp": {
          event.preventDefault();
          if (this.sitplan.numPages <= 1) return;
          const reference = (this.selected.getLastSelected() as any)
            ?.sitPlanElementRef as SituationPlanElement;
          if (!reference) return;
          let newPage = reference.page + (key === "PageDown" ? 1 : -1);
          if (newPage > this.sitplan.numPages) newPage = 1;
          if (newPage < 1) newPage = this.sitplan.numPages;
          if (newPage !== reference.page) this.moveSelectedToPage(newPage);
          return;
        }
        case "Enter":
          event.preventDefault();
          this.editSelectedBox();
          return;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          this.deleteSelectedBoxes();
          globalThis.undostruct.store();
          return;
      }
    });
  }

  /** Selecteert alle zichtbare elementen op de actieve pagina */
  selectAllOnPage() {
    this.clearSelection(false);
    for (const element of this.sitplan.elements) {
      if (element.page !== this.sitplan.activePage || !element.boxref) continue;
      if (element.boxref.style.display === "none") continue;
      element.boxref.classList.add("selected");
      this.selected.select(element.boxref);
    }
    this.selectionChanged();
  }

  /**
   * Hangt een klik event listener aan het gegeven element met als doel de huidig geselecteerde box te verwijderen.
   *
   * @param elem - Het html element waar de listener wordt aan gehangen.
   */
  attachDeleteButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      if (this.selected.length() > 0) {
        this.deleteSelectedBoxes();
        const helperTip = new HelperTip(globalThis.appDocStorage);
        helperTip.show(
          "sitplan.deletekey",
          `<h3>Tip: Symbolen verwijderen</h3>
                <p>Bespaar tijd en gebruik de 'Delete' toets op het toetsenbord om symbolen te verwijderen.</p>`,
          true
        );
        globalThis.undostruct.store();
      }
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element met als doel de huidig geselecteerde box naar de achtergrond te sturen.
   *
   * @param elem - Het html element waar de listener wordt aan gehangen.
   */
  attachSendToBackButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      this.sendToBack();
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element met als doel de huidig geselecteerde box naar de voorgrond te brengen.
   *
   * @param elem - Het html element waar de listener wordt aan gehangen.
   */
  attachBringToFrontButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      this.bringToFront();
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element met als doel de zoomfactor aan te passen.
   *
   * @param elem - Het html element waar de listener wordt aan gehangen.
   * @param increment - De waarde waarmee de zoomfactor wordt aangepast. Een positieve waarde vergroot de zoom,
   *                    terwijl een negatieve waarde de zoom verkleint.
   */
  attachZoomButton(elem: HTMLElement, increment: number) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      this.zoomIncrement(increment);
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element met als doel het situatieplan
   * aan te passen aan de beschikbare ruimte in het browservenster.
   *
   * @param elem - Het html element waar de listener wordt aan gehangen.
   */
  attachZoomToFitButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      this.zoomToFit();
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element om een bestand te kiezen en een verandering event listener aan het invoerelement
   * om een nieuw element vanuit een bestand aan het situatieplan toe te voegen.
   *
   * @param elem - Het HTML-element dat bij een klik een bestand moet openen.
   * @param fileinput - Het invoerelement voor bestanden dat het bestand uploadt wanneer het verandert.
   */
  attachAddElementFromFileButton(elem: HTMLElement, fileinput: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      fileinput.click();
    });
    this.event_manager.addEventListener(fileinput, "change", (event) => {
      let element = this.sitplan.addElementFromFile(
        event,
        this.sitplan.activePage,
        this.paper.offsetWidth / 2,
        this.paper.offsetHeight / 2,
        (() => {
          this.syncToSitPlan();
          this.clearSelection();
          element.needsViewUpdate = true; // for an external SVG this is needed, for an electroItem it is automatically set (see next function)

          const lastscale = element.scale;
          element.scaleSelectedBoxToPaperIfNeeded(
            this.paper.offsetWidth * 0.995,
            this.paper.offsetHeight * 0.995,
            this.sitplan.defaults.scale
          );

          this.redraw();
          this.selectOneBox(element.boxref); // We moeten dit na redraw doen anders bestaat de box mogelijk nog niet

          (fileinput as HTMLInputElement).value = ""; // Zorgt ervoor dat hetzelfde bestand twee keer kan worden gekozen en dit nog steeds een change triggert

          if (element.sizex == 0 || element.sizey == 0) {
            //Use the built in help top to display a text that the image is invalid and remove it again
            this.deleteSelectedBoxes();
            const dialog = new Dialog(
              "Ongeldige afmetingen",
              "<p>Dit bestand wordt door de browser herkend als een afbeelding met hoogte of breedte gelijk aan 0.</p>" +
                "<p>Dit bestand kan bijgevolg niet geladen worden.</p>"
            );
            dialog.show();
            return;
          }

          if (element.svg && element.svg.length > 5000000) {
            //Use the built in help top to display a text that the image is rather large
            const dialog = new Dialog(
              "Zeer groot bestand",
              "<p>Dit bestand is met " +
                (((element.svg.length / 1000000) * 6) / 8).toFixed(0) +
                "MB behoorlijk groot en kan uw browser vertragen " +
                "of tot moeilijkheden leiden bij het opslaan en/of printen.</p><p>We raden aan het bestand te verkleinen tot beneden 5MB, bijvoorbeeld " +
                "door het gebruik van het jpeg-bestandsformaat en/of verlagen van de resolutie.</p>"
            );
            dialog.show();
          }

          this.bringToFront(); // Deze slaat ook automatisch undo informatie op dus we moeten geen globalThis.undostruct.store() meer doen.
          // We voeren deze om dezelfde reden pas uit na het checken dat het bestand geldig is.

          if (element.scale != lastscale) {
            //Use the built in help top to display a text that the image was scaled
            const helperTip = new HelperTip(globalThis.appDocStorage);
            helperTip.show(
              "sitplan.scaledImageToFit",
              "<h3>Mededeling</h3>" +
                "<p>Deze afbeelding werd automatisch verkleind om binnen de tekenzone te blijven.</p>" +
                '<p>Kies "Bewerk" in het menu om de schaalfactor verder aan te passen indien gewenst.</p>',
              true
            );
          }
        }).bind(this)
      );
    });
  }

  /**
   * Voegt een ElectroItem toe aan het situatieplan.
   *
   * @param id - Het ID van het ElectroItem dat moet worden toegevoegd.
   * @param adrestype - Het type adres van het ElectroItem.
   * @param adres - Het adres van het ElectroItem.
   * @param adreslocation - De locatie van het adres van het ElectroItem.
   * @param labelfontsize - De grootte van het lettertype van het label van het ElectroItem.
   * @param scale - De schaal van het ElectroItem.
   * @param rotate - De rotatie van het ElectroItem.
   */
  addElectroItem = (
    id: number | null,
    adrestype: AdresType,
    adres: string,
    adreslocation: AdresLocation,
    labelfontsize: number,
    scale: number,
    rotate: number,
    posx: number = null,
    posy: number = null,
    options: any = { undoStore: true }
  ) => {
    if (options.undoStore == undefined) options.undoStore = true; // default is to store the action in the undo stack

    // Standaard in het midden van het zichtbare deel van het papier
    let paperPos = this.getVisiblePaperCenter();

    if (posx == null) posx = paperPos.x;
    if (posy == null) posy = paperPos.y;

    if (id != null) {
      let element = this.sitplan.addElementFromElectroItem(
        id,
        this.sitplan.activePage,
        posx,
        posy,
        adrestype,
        adres,
        adreslocation,
        labelfontsize,
        scale,
        rotate
      );
      if (element != null) {
        this.syncToSitPlan();
        this.clearSelection();
        this.redraw();
        this.selectOneBox(element.boxref); // We moeten dit na redraw doen anders bestaat de box mogelijk nog niet
        this.bringToFront(options.undoStore); // Deze slaat ook automatisch undo informatie op dus we moeten geen globalThis.undostruct.store() meer doen.
      }
    } else {
      dialogAlert("Fout", "Geen geldig ID ingegeven!");
    }
  };

  /**
   * Hangt een klik event listener aan het gegeven element om een nieuw Electro_Item aan het situatieplan toe te voegen.
   *
   * @param elem - Het HTML-element dat bij een klik een nieuw element toevoegt.
   */
  attachAddElectroItemButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.contextMenu.hide();
      this.unattachArrowKeys();
      SituationPlanView_ElementPropertiesPopup(
        /* no element selected */
        null,
        /* OK button callback */
        (
          electroid,
          adrestype,
          adres,
          adreslocation,
          labelfontsize,
          scale,
          rotate
        ) => {
          this.attachArrowKeys();
          this.addElectroItem(
            electroid,
            adrestype as AdresType,
            adres,
            adreslocation as AdresLocation,
            labelfontsize,
            scale,
            rotate
          );
        },
        /* Cancel button callback */
        () => {
          this.attachArrowKeys();
        }
      );
    });
  }

  /**
   * Hangt een klik event listener aan het gegeven element om een custom Electro_Item aan het situatieplan toe te voegen.
   *
   * @param elem - Het HTML-element dat bij een klik een nieuw element toevoegt.
   */
  attachAddCustomItemButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      // Show popup to select item type
      SituationPlanView_ChooseCustomElementPopup.showItemTypeSelectionPopup(
        (itemType: string, scale: number, rotate: number) => {
          const container = globalThis.structure.createContainerIfNotExists();
          const electroItem = globalThis.structure.createItem(itemType);
          /*if (itemType === "Vrije tekst") {
                    electroItem.props.tekst = "Nieuw item -- laten we dit eens proberen";
                }*/
          globalThis.structure.insertChildAfterId(electroItem, container.id);

          let labelfontsize = globalThis.structure.sitplan.defaults.fontsize;
          this.addElectroItem(
            electroItem.id,
            "manueel",
            "",
            "rechts",
            labelfontsize,
            scale,
            rotate
          );
        }
      );
    });
  }

  /**
   * Toont een popup met de eigenschappen van het geselecteerde element en maakt het mogelijk om deze te bewerken.
   */
  editSelectedBox = (cancelCallback?: () => void) => {
    this.contextMenu.hide();
    this.unattachArrowKeys();
    if (this.selected.length() == 1) {
      const sitPlanElement = (this.selected.getLastSelected() as any)
        .sitPlanElementRef;
      if (!sitPlanElement) return;

      SituationPlanView_ElementPropertiesPopup(
        sitPlanElement,
        /* OK button callback */
        (
          electroid,
          adrestype,
          adres,
          adreslocation,
          labelfontsize,
          scale,
          rotate
        ) => {
          this.attachArrowKeys();
          if (electroid != null) {
            sitPlanElement.setElectroItemId(electroid);
            sitPlanElement.setAdres(adrestype, adres, adreslocation);
          }
          sitPlanElement.labelfontsize = labelfontsize;
          sitPlanElement.setscale(scale);
          sitPlanElement.rotate = rotate;

          this.updateBoxContent(sitPlanElement); //content needs to be updated first to know the size of the box
          this.updateSymbolAndLabelPosition(sitPlanElement);
          globalThis.undostruct.store();
        },
        /* Cancel button callback */
        () => {
          this.attachArrowKeys();
          if (cancelCallback) cancelCallback();
        },
        /* Opties */
        { toonElementZoeker: false } // opties
      );
    } else if (this.selected.length() > 1) {
      const elements: SituationPlanElement[] = [];
      for (let selected of this.selected.getAllSelected()) {
        const sitPlanElement = (selected as any).sitPlanElementRef;
        if (sitPlanElement == null) continue;
        elements.push(sitPlanElement);
      }
      SituationPlanView_MultiElementPropertiesPopup(
        elements,
        /* OK button callback */
        (labelfontsize, scale, rotate) => {
          this.attachArrowKeys();
          for (let sitPlanElement of elements) {
            if (labelfontsize != null)
              sitPlanElement.labelfontsize = labelfontsize;
            if (scale != null) sitPlanElement.setscale(scale);
            if (rotate != null) sitPlanElement.rotate = rotate;
            this.updateBoxContent(sitPlanElement); //content needs to be updated first to know the size of the box
            this.updateSymbolAndLabelPosition(sitPlanElement);
          }
          globalThis.undostruct.store();
        },
        /* Cancel button callback */
        () => {
          this.attachArrowKeys();
          if (cancelCallback) cancelCallback();
        }
      );
    }
  };

  /**
   * Hangt een klik event listener aan het gegeven element om een bestaand element in het situatieplan te bewerken.
   *
   * @param elem - Het HTML-element dat bij een klik een bestaand element in het situatieplan bewerkt.
   */
  attachEditButton(elem: HTMLElement) {
    this.event_manager.addEventListener(elem, "click", () => {
      this.editSelectedBox();
    });
  }

  /**
   * Verwijdert alle elementen van de pagina met het gegeven nummer.
   *
   * @param page - Het nummer van de pagina die leeg gemaakt moet worden.
   */
  wipePage(page: number) {
    let ElementsToWipe = this.sitplan.elements.filter(
      (element) => element.page == page
    );

    for (let element of ElementsToWipe) {
      if (element == null) continue;
      if (element.boxref != null) element.boxref.remove();
      if (element.boxlabelref != null) element.boxlabelref.remove();
      this.sitplan.removeElement(element);
    }
  }

  /**
   * Updates the ribbon UI. In React mode, this only attaches event handlers to existing buttons.
   * The React component is responsible for rendering the UI.
   */
  updateRibbon() {
    // De ribbon wordt door React gerenderd; event handlers worden één keer gekoppeld in de constructor.
  }

  /**
   * Attaches event handlers to ribbon buttons that already exist in the DOM (React mode)
   */
  private attachRibbonEventHandlers() {
    // -- Actions om elementen toe te voegen of verwijderen --
    const buttonAdd = document.getElementById("button_Add");
    const fileInput = document.getElementById("fileInput");
    if (buttonAdd && fileInput) {
      this.attachAddElementFromFileButton(buttonAdd, fileInput);
    }

    const buttonAddElectroItem = document.getElementById(
      "button_Add_electroItem"
    );
    if (buttonAddElectroItem) {
      this.attachAddElectroItemButton(buttonAddElectroItem);
    }

    const buttonAddCustomItem = document.getElementById(
      "button_Add_customItem"
    );
    if (buttonAddCustomItem) {
      this.attachAddCustomItemButton(buttonAddCustomItem);
    }

    const buttonDelete = document.getElementById("button_Delete");
    if (buttonDelete) {
      this.attachDeleteButton(buttonDelete);
    }

    // -- Actions om visuals te bewerken --
    const buttonEdit = document.getElementById("button_edit");
    if (buttonEdit) {
      this.attachEditButton(buttonEdit);
    }

    // -- Actions om naar achteren te sturen --
    const sendBack = document.getElementById("sendBack");
    if (sendBack) {
      this.attachSendToBackButton(sendBack);
    }

    const bringFront = document.getElementById("bringFront");
    if (bringFront) {
      this.attachBringToFrontButton(bringFront);
    }

    // -- Actions om pagina te zoomen --
    const buttonZoomIn = document.getElementById("button_zoomin");
    if (buttonZoomIn) {
      this.attachZoomButton(buttonZoomIn, 0.1);
    }

    const buttonZoomOut = document.getElementById("button_zoomout");
    if (buttonZoomOut) {
      this.attachZoomButton(buttonZoomOut, -0.1);
    }

    const buttonZoomToFit = document.getElementById("button_zoomToFit");
    if (buttonZoomToFit) {
      this.attachZoomToFitButton(buttonZoomToFit);
    }
  }

  /**
   * Public methods for React component integration
   */

  /**
   * Get the current page number
   */
  public getCurrentPage(): number {
    return this.sitplan.activePage;
  }

  /**
   * Get the total number of pages
   */
  public getNumPages(): number {
    return this.sitplan.getNumPages();
  }

  /**
   * Add a new page (only if on last page)
   */
  public addPage(): void {
    if (this.sitplan.activePage === this.sitplan.numPages) {
      this.sitplan.numPages++;
      this.selectPage(this.sitplan.numPages);
      globalThis.undostruct.store();
    }
  }

  /**
   * Delete the current page
   */
  public deletePage(callback?: () => void): void {
    if (this.sitplan.numPages <= 1) return;

    const dialog = new Dialog(
      "Pagina verwijderen",
      `Pagina ${this.sitplan.activePage} volledig verwijderen?`,
      [
        {
          text: "OK",
          callback: (() => {
            this.wipePage(this.sitplan.activePage);
            // Set page of all sitplan.elements with page > current page one lower
            this.sitplan.elements.forEach((element) => {
              if (element.page > this.sitplan.activePage) {
                element.page--;
              }
            });
            if (this.sitplan.numPages > 1) this.sitplan.numPages--;
            this.selectPage(
              Math.min(this.sitplan.activePage, this.sitplan.numPages)
            );
            globalThis.undostruct.store();
            if (callback) callback();
          }).bind(this),
        },
        { text: "Annuleren", callback: () => {} },
      ]
    );
    dialog.show();
  }

  /**
   * Change to a specific page
   */
  public changePage(pageNum: number): void {
    this.selectPage(pageNum);
    globalThis.undostruct.store("changePage");
  }

  // ---------------------------------------------------------------------------
  // Tekenen van bouwelementen (muren, ramen, deuren en vrije vormen)
  // ---------------------------------------------------------------------------

  /**
   * Activeert een tekengereedschap, of schakelt tekenen uit met null.
   */
  public setDrawingTool(tool: SitPlanDrawingTool | null): void {
    this.cancelInteraction();
    this.drawingTool = tool;
    this.canvas.classList.toggle("drawing", tool != null);
    if (tool) this.clearSelection();
    this.emit(SITPLAN_EVENTS.toolChange, { tool });
  }

  public getDrawingTool(): SitPlanDrawingTool | null {
    return this.drawingTool;
  }

  public enableWallDrawingMode(wallType: WallType): void {
    this.setDrawingTool({ kind: "wall", wallType });
  }

  public disableWallDrawingMode(): void {
    if (this.drawingTool?.kind === "wall") this.setDrawingTool(null);
  }

  public isWallDrawingMode(): boolean {
    return this.drawingTool?.kind === "wall";
  }

  public getWallDrawingType(): WallType | null {
    return this.drawingTool?.kind === "wall" ? this.drawingTool.wallType : null;
  }

  public enableFreeformShapeDrawingMode(shapeType: FreeformShapeType): void {
    this.setDrawingTool({ kind: "shape", shapeType });
  }

  public disableFreeformShapeDrawingMode(): void {
    if (this.drawingTool?.kind === "shape") this.setDrawingTool(null);
  }

  public isFreeformShapeDrawingMode(): boolean {
    return this.drawingTool?.kind === "shape";
  }

  public getFreeformShapeDrawingType(): FreeformShapeType | null {
    return this.drawingTool?.kind === "shape" ? this.drawingTool.shapeType : null;
  }

  public enableWindowDrawingMode(): void {
    this.setDrawingTool({ kind: "window" });
  }

  public disableWindowDrawingMode(): void {
    if (this.drawingTool?.kind === "window") this.setDrawingTool(null);
  }

  public isWindowDrawingMode(): boolean {
    return this.drawingTool?.kind === "window";
  }

  public enableDoorDrawingMode(): void {
    this.setDrawingTool({ kind: "door" });
  }

  public disableDoorDrawingMode(): void {
    if (this.drawingTool?.kind === "door") this.setDrawingTool(null);
  }

  public isDoorDrawingMode(): boolean {
    return this.drawingTool?.kind === "door";
  }

  /** Standaardgrootte wanneer met het gereedschap enkel geklikt wordt (zonder te slepen) */
  private getDefaultToolSize(tool: SitPlanDrawingTool) {
    switch (tool.kind) {
      case "wall": {
        const thickness =
          tool.wallType === "outer"
            ? WallElement.OUTER_WALL_THICKNESS
            : WallElement.INNER_WALL_THICKNESS;
        return { width: 150, height: thickness };
      }
      case "window":
        return { width: 80, height: 10 };
      case "door":
        return { width: 60, height: 60 };
      case "shape":
      default:
        return { width: 100, height: 100 };
    }
  }

  private getPreviewClass(tool: SitPlanDrawingTool) {
    switch (tool.kind) {
      case "wall":
        return tool.wallType === "outer" ? "wall-outer" : "wall-inner";
      case "window":
        return "window-preview";
      case "door":
        return "door-preview";
      case "shape":
        return `freeform-${tool.shapeType}`;
    }
  }

  private createBuildingElement(
    tool: SitPlanDrawingTool,
    x: number,
    y: number,
    width: number,
    height: number
  ): SituationPlanElement {
    const page = this.sitplan.activePage;
    switch (tool.kind) {
      case "wall":
        return this.sitplan.addWallElement(tool.wallType, page, x, y, width, height);
      case "window":
        return this.sitplan.addWindowElement(page, x, y, width, height);
      case "door":
        return this.sitplan.addDoorElement(page, x, y, width, height);
      case "shape":
        return this.sitplan.addFreeformShapeElement(tool.shapeType, page, x, y, width, height);
    }
  }

  /**
   * Tekent een rechthoekig bouwelement door te slepen. Een klik zonder slepen plaatst een element
   * met standaardafmetingen.
   */
  private startDrawing(event: PointerEvent) {
    const tool = this.drawingTool;
    if (!tool) return;

    const startClient = { x: event.clientX, y: event.clientY };
    const p0raw = this.clientToPaper(event.clientX, event.clientY);
    const p0 = this.clampToPaper(this.snap(p0raw.x, event), this.snap(p0raw.y, event));
    let rect = { x: p0.x, y: p0.y, width: 0, height: 0 };
    let moved = false;
    let lastPointer: { x: number; y: number; altKey: boolean; shiftKey: boolean } | null = null;
    let stopAutoScroll: (() => void) | null = null;

    const preview = document.createElement("div");
    preview.className = `sitplan-draw-preview ${this.getPreviewClass(tool)}`;
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "sitplan-draw-size";
    preview.appendChild(sizeLabel);

    const update = () => {
      if (!lastPointer) return;
      const raw = this.clientToPaper(lastPointer.x, lastPointer.y);
      const p = this.clampToPaper(this.snap(raw.x, lastPointer), this.snap(raw.y, lastPointer));
      let width = Math.abs(p.x - p0.x);
      let height = Math.abs(p.y - p0.y);
      if (lastPointer.shiftKey && tool.kind !== "wall" && tool.kind !== "window") {
        // Vierkant tekenen met Shift
        const size = Math.max(width, height);
        width = size;
        height = size;
      }
      rect = {
        x: p.x < p0.x ? p0.x - width : p0.x,
        y: p.y < p0.y ? p0.y - height : p0.y,
        width,
        height,
      };
      preview.style.left = `${rect.x}px`;
      preview.style.top = `${rect.y}px`;
      preview.style.width = `${rect.width}px`;
      preview.style.height = `${rect.height}px`;
      sizeLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    };

    this.trackPointer(
      event.pointerId,
      (ev) => {
        lastPointer = { x: ev.clientX, y: ev.clientY, altKey: ev.altKey, shiftKey: ev.shiftKey };
        if (!moved) {
          if (
            Math.hypot(ev.clientX - startClient.x, ev.clientY - startClient.y) <
            DRAG_THRESHOLD_PX
          )
            return;
          moved = true;
          this.paper.appendChild(preview);
          stopAutoScroll = this.startAutoScroll(() => lastPointer, update);
        }
        ev.preventDefault();
        update();
      },
      (_ev, cancelled) => {
        stopAutoScroll?.();
        preview.remove();
        if (cancelled || this.disposed) return;

        let element: SituationPlanElement | null = null;
        if (!moved) {
          const size = this.getDefaultToolSize(tool);
          element = this.createBuildingElement(
            tool,
            p0.x - size.width / 2,
            p0.y - size.height / 2,
            size.width,
            size.height
          );
        } else if (rect.width >= MIN_DRAWN_SIZE && rect.height >= MIN_DRAWN_SIZE) {
          element = this.createBuildingElement(tool, rect.x, rect.y, rect.width, rect.height);
        }
        if (!element) return;

        this.redraw();
        this.clearSelection(false);
        this.bringElementToFront(element);
        this.selectBox(element.boxref);
        globalThis.undostruct.store();
      }
    );
  }

  /** Zet een enkel element bovenaan de z-volgorde zonder undo-stap */
  private bringElementToFront(element: SituationPlanElement) {
    if (!element.boxref) return;
    let maxZ = 0;
    for (const e of this.sitplan.elements) {
      if (e !== element && e.boxref)
        maxZ = Math.max(maxZ, parseInt(e.boxref.style.zIndex) || 0);
    }
    element.boxref.style.zIndex = String(maxZ + 1);
    if (element.boxlabelref) element.boxlabelref.style.zIndex = String(maxZ + 1);
    this.sitplan.orderByZIndex();
  }

  // ---------------------------------------------------------------------------
  // Handvatten om bouwelementen te vergroten/verkleinen en te roteren
  // ---------------------------------------------------------------------------

  /**
   * Toont handvatten op het geselecteerde element als er precies één bouwelement geselecteerd is.
   */
  private refreshHandles() {
    this.removeAllWallResizeHandles();
    if (this.selected.length() !== 1) return;
    const box = this.selected.getLastSelected();
    const element = (box as any)?.sitPlanElementRef as SituationPlanElement;
    if (!box || !element || !element.isBuildingElement() || element.movable === false) return;
    this.addWallResizeHandles(box, element);
  }

  /**
   * Add resize handles to a selected building element
   */
  private addWallResizeHandles(
    box: HTMLElement,
    sitPlanElement: SituationPlanElement
  ): void {
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

    handles.forEach((position) => {
      const handle = document.createElement("div");
      handle.className = `wall-resize-handle ${position}`;
      handle.dataset.handlePosition = position;
      handle.dataset.wallId = sitPlanElement.id;
      handle.addEventListener("pointerdown", this.startWallResize);
      box.appendChild(handle);
    });

    // Add rotation handle
    const rotationHandle = document.createElement("div");
    rotationHandle.className = "wall-rotation-handle";
    rotationHandle.dataset.wallId = sitPlanElement.id;
    rotationHandle.title = "Roteren (Shift: per 15°)";
    rotationHandle.addEventListener("pointerdown", this.startWallRotation);
    box.appendChild(rotationHandle);
  }

  /**
   * Remove all wall resize handles
   */
  private removeAllWallResizeHandles(): void {
    this.paper
      .querySelectorAll(".wall-resize-handle, .wall-rotation-handle")
      .forEach((handle) => handle.remove());
  }

  private findElementForHandle(handle: HTMLElement): SituationPlanElement | null {
    const id = handle.dataset.wallId;
    const element = this.sitplan.getElements().find((el) => el.id === id);
    if (!element || !element.isBuildingElement()) return null;
    return element;
  }

  /**
   * Vergroten/verkleinen van een bouwelement. Werkt in het lokale (geroteerde) assenstelsel van het element:
   * de tegenoverliggende zijde blijft op zijn plaats.
   */
  private startWallResize = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();

    const handle = event.currentTarget as HTMLElement;
    const position = handle.dataset.handlePosition || "";
    const element = this.findElementForHandle(handle);
    if (!element) return;

    const sx = position.includes("e") ? 1 : position.includes("w") ? -1 : 0;
    const sy = position.includes("s") ? 1 : position.includes("n") ? -1 : 0;

    const theta = ((element.rotate || 0) * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const start = this.clientToPaper(event.clientX, event.clientY);
    const startW = element.sizex;
    const startH = element.sizey;
    const startCx = element.posx;
    const startCy = element.posy;
    const MIN = 2;
    let moved = false;

    this.trackPointer(
      event.pointerId,
      (ev) => {
        moved = true;
        const p = this.clientToPaper(ev.clientX, ev.clientY);
        const dxWorld = p.x - start.x;
        const dyWorld = p.y - start.y;
        // Naar lokale assen van het element
        const dxLocal = dxWorld * cos + dyWorld * sin;
        const dyLocal = -dxWorld * sin + dyWorld * cos;

        let newW = startW;
        let newH = startH;
        if (sx !== 0) newW = Math.max(MIN, startW + sx * dxLocal);
        if (sy !== 0) newH = Math.max(MIN, startH + sy * dyLocal);
        if (this.snapToGrid && !ev.altKey) {
          if (sx !== 0) newW = Math.max(MIN, this.snap(newW));
          if (sy !== 0) newH = Math.max(MIN, this.snap(newH));
        }
        if (ev.shiftKey && sx !== 0 && sy !== 0) {
          // Verhoudingen behouden
          const ratio = startW / startH;
          if (newW / newH > ratio) newH = newW / ratio;
          else newW = newH * ratio;
        }

        // Middelpunt verschuift met de helft van de groei, in de richting van het handvat
        const shiftLocalX = (sx * (newW - startW)) / 2;
        const shiftLocalY = (sy * (newH - startH)) / 2;
        element.setBuildingGeometry({
          posx: startCx + shiftLocalX * cos - shiftLocalY * sin,
          posy: startCy + shiftLocalX * sin + shiftLocalY * cos,
          width: newW,
          height: newH,
        });
        this.updateBoxContent(element);
        this.updateSymbolPosition(element);
      },
      (_ev, cancelled) => {
        if (!moved) return;
        if (cancelled) {
          element.setBuildingGeometry({ posx: startCx, posy: startCy, width: startW, height: startH });
          this.updateBoxContent(element);
          this.updateSymbolPosition(element);
          return;
        }
        globalThis.undostruct.store();
        this.emit(SITPLAN_EVENTS.selectionChange);
      }
    );
  };

  /**
   * Roteren van een bouwelement. Shift roteert per 15°, anders wordt er licht gesnapt op veelvouden van 90°.
   */
  private startWallRotation = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();

    const handle = event.currentTarget as HTMLElement;
    const element = this.findElementForHandle(handle);
    if (!element) return;

    const centerX = element.posx;
    const centerY = element.posy;
    const getAngle = (clientX: number, clientY: number) => {
      const p = this.clientToPaper(clientX, clientY);
      return (Math.atan2(p.y - centerY, p.x - centerX) * 180) / Math.PI;
    };

    const startAngle = getAngle(event.clientX, event.clientY);
    const startRotation = element.rotate || 0;
    let moved = false;

    this.trackPointer(
      event.pointerId,
      (ev) => {
        moved = true;
        let rotation = startRotation + (getAngle(ev.clientX, ev.clientY) - startAngle);
        rotation = ((rotation % 360) + 360) % 360;
        if (ev.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        } else {
          const nearest = Math.round(rotation / 90) * 90;
          if (Math.abs(rotation - nearest) < 3) rotation = nearest;
        }
        element.setBuildingGeometry({ rotate: rotation % 360 });
        this.updateSymbolPosition(element);
      },
      (_ev, cancelled) => {
        if (!moved) return;
        if (cancelled) {
          element.setBuildingGeometry({ rotate: startRotation });
          this.updateSymbolPosition(element);
          return;
        }
        globalThis.undostruct.store();
        this.emit(SITPLAN_EVENTS.selectionChange);
      }
    );
  };

  /**
   * Past de geometrie van een bouwelement aan (gebruikt door de eigenschappen in de zijbalk).
   */
  public updateBuildingElement(
    element: SituationPlanElement,
    geometry: { posx?: number; posy?: number; width?: number; height?: number; rotate?: number },
    undoKey: string | null = null
  ) {
    if (!element.isBuildingElement()) return;
    element.setBuildingGeometry(geometry);
    this.updateBoxContent(element);
    this.updateSymbolAndLabelPosition(element);
    globalThis.undostruct.store(undoKey);
  }

  /** Geeft het geselecteerde element terug indien er precies één geselecteerd is */
  public getSingleSelectedElement(): SituationPlanElement | null {
    if (this.selected.length() !== 1) return null;
    return ((this.selected.getLastSelected() as any)?.sitPlanElementRef as SituationPlanElement) ?? null;
  }

  public getSelectedCount(): number {
    return this.selected.length();
  }
} // *** END CLASS ***

/**
 * Toon de pagina voor het situatieplan
 */
export function showSituationPlanPage() {
  globalThis.toggleAppView?.("draw");

  if (!globalThis.structure.sitplan) {
    globalThis.structure.sitplan = new SituationPlan();
  }

  const canvas = document.getElementById("canvas");
  const paper = document.getElementById("paper");
  if (!canvas || !paper) return;

  const existing: SituationPlanView | null = globalThis.structure.sitplanview;
  if (
    !existing ||
    existing.isDisposed() ||
    existing.canvasRef !== canvas ||
    existing.paperRef !== paper
  ) {
    existing?.dispose();
    //Verwijder eerst alle elementen op de DOM met id beginnend met "SP_" om eventuele wezen
    //uit eerdere oefeningen te voorkomen
    paper.querySelectorAll('[id^="SP_"]').forEach((e) => e.remove());
    //Maak dan de SituationPlanView
    globalThis.structure.sitplanview = new SituationPlanView(
      canvas,
      paper,
      globalThis.structure.sitplan
    );
  }
  if (globalThis.structure.properties.legacySchakelaars == null) {
    if (globalThis.structure.sitplan.heeftEenzameSchakelaars()) {
      let askLegacySchakelaar = new AskLegacySchakelaar();
      askLegacySchakelaar.show().then(() => {
        globalThis.structure.sitplanview?.redraw();
      });
      return;
    } else {
      globalThis.structure.properties.legacySchakelaars = false; // We gaan dadelijk naar de nieuwe situatie
    }
  }

  globalThis.structure.sitplanview.redraw();
}
