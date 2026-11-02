/**
 * useSitPlan - React hook for managing situation plan state
 *
 * Deze hook vormt de brug tussen React en de (imperatieve) SituationPlanView class.
 * De view verwittigt React via window events (zie SITPLAN_EVENTS) wanneer pagina, zoom,
 * tekengereedschap of selectie wijzigen.
 */

import { useState, useEffect, useCallback } from "react";
import { SituationPlan } from "../sitplan/SituationPlan";
import { SituationPlanElement } from "../sitplan/SituationPlanElement";
import {
  SituationPlanView,
  SitPlanDrawingTool,
  SITPLAN_EVENTS,
} from "../sitplan/SituationPlanView";
import { WallType } from "../sitplan/WallElement";
import { FreeformShapeType } from "../sitplan/FreeformShapeElement";
import { Hierarchical_List } from "../Hierarchical_List";

export interface SitPlanState {
  currentPage: number;
  numPages: number;
  zoomFactor: number;
  fitMode: boolean;
  drawingMode: DrawingMode | null;
  selectedCount: number;
  /** Het geselecteerde element indien er precies één geselecteerd is */
  selectedElement: SituationPlanElement | null;
  /** Wordt verhoogd telkens de selectie of de geselecteerde elementen wijzigen */
  selectionRevision: number;
}

export type DrawingMode =
  | { type: "wall"; wallType: WallType }
  | { type: "window" }
  | { type: "door" }
  | { type: "shape"; shapeType: FreeformShapeType };

export interface UseSitPlanResult {
  // State
  state: SitPlanState;

  // Page management
  changePage: (pageNum: number) => void;
  addPage: () => void;
  deletePage: (callback?: () => void) => void;

  // Zoom management
  setZoomFactor: (factor: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;

  // Drawing modes
  enableWallDrawing: (wallType: WallType) => void;
  enableWindowDrawing: () => void;
  enableDoorDrawing: () => void;
  enableShapeDrawing: (shapeType: FreeformShapeType) => void;
  disableDrawingMode: () => void;

  // Element management
  addElement: (
    electroItemId: number,
    x: number,
    y: number
  ) => SituationPlanElement | null;
  updateElement: (element: SituationPlanElement) => void;
  deleteElement: (element: SituationPlanElement) => void;
  selectElement: (element: SituationPlanElement | null) => void;
  clearSelection: () => void;

  // Grid
  setSnapToGrid: (enabled: boolean) => void;

  // Utility
  redraw: () => void;
  getView: () => SituationPlanView | null;
  getCoordinatesFromEvent: (e: { clientX: number; clientY: number }) => {
    x: number;
    y: number;
  };
}

const ZOOM_STEP = 1.25;

function toolToDrawingMode(tool: SitPlanDrawingTool | null): DrawingMode | null {
  if (!tool) return null;
  switch (tool.kind) {
    case "wall":
      return { type: "wall", wallType: tool.wallType };
    case "window":
      return { type: "window" };
    case "door":
      return { type: "door" };
    case "shape":
      return { type: "shape", shapeType: tool.shapeType };
  }
}

export function useSitPlan(
  sitplan: SituationPlan | null,
  structure: Hierarchical_List | null
): UseSitPlanResult {
  const [state, setState] = useState<SitPlanState>({
    currentPage: 1,
    numPages: 1,
    zoomFactor: 1,
    fitMode: true,
    drawingMode: null,
    selectedCount: 0,
    selectedElement: null,
    selectionRevision: 0,
  });

  const getView = useCallback((): SituationPlanView | null => {
    const view = structure?.sitplanview as SituationPlanView | null | undefined;
    if (!view || view.isDisposed()) return null;
    return view;
  }, [structure]);

  const syncFromView = useCallback(
    (bumpSelection: boolean = false) => {
      const view = getView();
      if (!view) return;
      setState((prev) => ({
        ...prev,
        currentPage: view.getCurrentPage(),
        numPages: view.getNumPages(),
        zoomFactor: view.getZoomFactor(),
        fitMode: view.isFitMode(),
        drawingMode: toolToDrawingMode(view.getDrawingTool()),
        selectedCount: view.getSelectedCount(),
        selectedElement: view.getSingleSelectedElement(),
        selectionRevision: bumpSelection
          ? prev.selectionRevision + 1
          : prev.selectionRevision,
      }));
    },
    [getView]
  );

  // Luister naar wijzigingen in de view
  useEffect(() => {
    const onView = () => syncFromView(false);
    const onSelection = () => syncFromView(true);
    window.addEventListener(SITPLAN_EVENTS.viewChange, onView);
    window.addEventListener(SITPLAN_EVENTS.toolChange, onView);
    window.addEventListener(SITPLAN_EVENTS.selectionChange, onSelection);
    syncFromView(true);
    return () => {
      window.removeEventListener(SITPLAN_EVENTS.viewChange, onView);
      window.removeEventListener(SITPLAN_EVENTS.toolChange, onView);
      window.removeEventListener(SITPLAN_EVENTS.selectionChange, onSelection);
    };
  }, [syncFromView, sitplan]);

  // Page management
  const changePage = useCallback(
    (pageNum: number) => {
      getView()?.changePage(pageNum);
      syncFromView();
    },
    [getView, syncFromView]
  );

  const addPage = useCallback(() => {
    getView()?.addPage();
    syncFromView();
  }, [getView, syncFromView]);

  const deletePage = useCallback(
    (callback?: () => void) => {
      getView()?.deletePage(() => {
        syncFromView();
        callback?.();
      });
    },
    [getView, syncFromView]
  );

  // Zoom management
  const setZoomFactor = useCallback(
    (factor: number) => {
      getView()?.zoomAt(factor);
    },
    [getView]
  );

  const zoomIn = useCallback(() => {
    getView()?.zoomBy(ZOOM_STEP);
  }, [getView]);

  const zoomOut = useCallback(() => {
    getView()?.zoomBy(1 / ZOOM_STEP);
  }, [getView]);

  const zoomToFit = useCallback(() => {
    getView()?.zoomToFit();
  }, [getView]);

  // Drawing modes
  const enableWallDrawing = useCallback(
    (wallType: WallType) => getView()?.setDrawingTool({ kind: "wall", wallType }),
    [getView]
  );

  const enableWindowDrawing = useCallback(
    () => getView()?.setDrawingTool({ kind: "window" }),
    [getView]
  );

  const enableDoorDrawing = useCallback(
    () => getView()?.setDrawingTool({ kind: "door" }),
    [getView]
  );

  const enableShapeDrawing = useCallback(
    (shapeType: FreeformShapeType) =>
      getView()?.setDrawingTool({ kind: "shape", shapeType }),
    [getView]
  );

  const disableDrawingMode = useCallback(
    () => getView()?.setDrawingTool(null),
    [getView]
  );

  // Element management
  const addElement = useCallback(
    (
      electroItemId: number,
      x: number,
      y: number
    ): SituationPlanElement | null => {
      const view = getView();
      if (!sitplan || !view || !structure) return null;
      if (!structure.getElectroItemById(electroItemId)) return null;

      const before = new Set(sitplan.getElements());
      view.addElectroItem(
        electroItemId,
        "auto",
        "",
        "onder",
        sitplan.defaults?.fontsize ?? 11,
        sitplan.defaults.scale,
        sitplan.defaults.rotate,
        x,
        y
      );
      return sitplan.getElements().find((e) => !before.has(e)) ?? null;
    },
    [sitplan, structure, getView]
  );

  const updateElement = useCallback(
    (_element: SituationPlanElement) => {
      getView()?.redraw();
    },
    [getView]
  );

  const deleteElement = useCallback(
    (element: SituationPlanElement) => {
      const view = getView();
      if (!sitplan || !view) return;
      element.boxref?.remove();
      element.boxlabelref?.remove();
      sitplan.removeElement(element);
      view.clearSelection();
      view.redraw();
    },
    [sitplan, getView]
  );

  const selectElement = useCallback(
    (element: SituationPlanElement | null) => {
      const view = getView();
      if (!view) return;
      if (element?.boxref) view.selectOneBox(element.boxref);
      else view.clearSelection();
    },
    [getView]
  );

  const clearSelection = useCallback(() => {
    getView()?.clearSelection();
  }, [getView]);

  const setSnapToGrid = useCallback(
    (enabled: boolean) => {
      getView()?.setSnapToGrid(enabled);
    },
    [getView]
  );

  const redraw = useCallback(() => {
    getView()?.redraw();
  }, [getView]);

  const getCoordinatesFromEvent = useCallback(
    (e: { clientX: number; clientY: number }): { x: number; y: number } => {
      const view = getView();
      if (!view) return { x: 0, y: 0 };
      return view.clientToPaper(e.clientX, e.clientY);
    },
    [getView]
  );

  return {
    state,
    changePage,
    addPage,
    deletePage,
    setZoomFactor,
    zoomIn,
    zoomOut,
    zoomToFit,
    enableWallDrawing,
    enableWindowDrawing,
    enableDoorDrawing,
    enableShapeDrawing,
    disableDrawingMode,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    setSnapToGrid,
    redraw,
    getView,
    getCoordinatesFromEvent,
  };
}
