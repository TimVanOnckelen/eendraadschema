/**
 * useSitPlan - React hook for managing situation plan state
 *
 * This hook provides a modern React interface to the situation plan functionality,
 * gradually replacing the legacy SituationPlanView class.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { SituationPlan } from "../sitplan/SituationPlan";
import { SituationPlanElement } from "../sitplan/SituationPlanElement";
import { WallType } from "../sitplan/WallElement";
import { FreeformShapeType } from "../sitplan/FreeformShapeElement";
import { Hierarchical_List } from "../Hierarchical_List";

export interface SitPlanState {
  currentPage: number;
  numPages: number;
  zoomFactor: number;
  drawingMode: DrawingMode | null;
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

  // Utility
  redraw: () => void;
  getCoordinatesFromEvent: (e: React.MouseEvent | MouseEvent) => {
    x: number;
    y: number;
  };
}

export function useSitPlan(
  sitplan: SituationPlan | null,
  structure: Hierarchical_List | null,
  canvasRef: React.RefObject<HTMLElement>,
  paperRef: React.RefObject<HTMLElement>
): UseSitPlanResult {
  const [state, setState] = useState<SitPlanState>({
    currentPage: 1,
    numPages: 1,
    zoomFactor: 1,
    drawingMode: null,
  });

  // Sync state with legacy sitplanview when it changes
  useEffect(() => {
    if (!structure?.sitplanview) return;

    const updateState = () => {
      setState((prev) => ({
        ...prev,
        currentPage: structure.sitplanview.getCurrentPage(),
        numPages: structure.sitplanview.getNumPages(),
        zoomFactor: structure.sitplanview.getZoomFactor(),
      }));
    };

    updateState();
  }, [structure?.sitplanview, sitplan]);

  // Listen for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Selection changes are handled by the legacy system
      // Just force a state update to trigger UI refresh
      setState((prev) => ({ ...prev }));
    };

    window.addEventListener(
      "sitplan-selection-change",
      handleSelectionChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "sitplan-selection-change",
        handleSelectionChange as EventListener
      );
    };
  }, []);

  // Page management
  const changePage = useCallback(
    (pageNum: number) => {
      if (!structure?.sitplanview) return;
      structure.sitplanview.changePage(pageNum);
      setState((prev) => ({ ...prev, currentPage: pageNum }));
    },
    [structure]
  );

  const addPage = useCallback(() => {
    if (!structure?.sitplanview) return;
    structure.sitplanview.addPage();
    setState((prev) => ({ ...prev, numPages: prev.numPages + 1 }));
  }, [structure]);

  const deletePage = useCallback(
    (callback?: () => void) => {
      if (!structure?.sitplanview) return;
      structure.sitplanview.deletePage(() => {
        setState((prev) => ({ ...prev, numPages: prev.numPages - 1 }));
        callback?.();
      });
    },
    [structure]
  );

  // Zoom management
  const setZoomFactor = useCallback(
    (factor: number) => {
      if (!structure?.sitplanview) return;
      structure.sitplanview.setzoom(factor);
      setState((prev) => ({ ...prev, zoomFactor: factor }));
    },
    [structure]
  );

  const zoomIn = useCallback(() => {
    if (!structure?.sitplanview) return;
    const newZoom = Math.min(state.zoomFactor * 1.2, 5);
    setZoomFactor(newZoom);
  }, [structure, state.zoomFactor, setZoomFactor]);

  const zoomOut = useCallback(() => {
    if (!structure?.sitplanview) return;
    const newZoom = Math.max(state.zoomFactor / 1.2, 0.1);
    setZoomFactor(newZoom);
  }, [structure, state.zoomFactor, setZoomFactor]);

  const zoomToFit = useCallback(() => {
    if (!structure?.sitplanview) return;
    structure.sitplanview.zoomToFit();
    setState((prev) => ({
      ...prev,
      zoomFactor: structure.sitplanview.getZoomFactor(),
    }));
  }, [structure]);

  // Drawing modes
  const enableWallDrawing = useCallback(
    (wallType: WallType) => {
      if (!structure?.sitplanview) return;

      // Disable other modes
      structure.sitplanview.disableFreeformShapeDrawingMode();
      structure.sitplanview.disableWindowDrawingMode();
      structure.sitplanview.disableDoorDrawingMode();

      // Enable wall drawing
      structure.sitplanview.enableWallDrawingMode(wallType);
      setState((prev) => ({
        ...prev,
        drawingMode: { type: "wall", wallType },
      }));
    },
    [structure]
  );

  const enableWindowDrawing = useCallback(() => {
    if (!structure?.sitplanview) return;

    // Disable other modes
    structure.sitplanview.disableWallDrawingMode();
    structure.sitplanview.disableFreeformShapeDrawingMode();
    structure.sitplanview.disableDoorDrawingMode();

    // Enable window drawing
    structure.sitplanview.enableWindowDrawingMode();
    setState((prev) => ({ ...prev, drawingMode: { type: "window" } }));
  }, [structure]);

  const enableDoorDrawing = useCallback(() => {
    if (!structure?.sitplanview) return;

    // Disable other modes
    structure.sitplanview.disableWallDrawingMode();
    structure.sitplanview.disableFreeformShapeDrawingMode();
    structure.sitplanview.disableWindowDrawingMode();

    // Enable door drawing
    structure.sitplanview.enableDoorDrawingMode();
    setState((prev) => ({ ...prev, drawingMode: { type: "door" } }));
  }, [structure]);

  const enableShapeDrawing = useCallback(
    (shapeType: FreeformShapeType) => {
      if (!structure?.sitplanview) return;

      // Disable other modes
      structure.sitplanview.disableWallDrawingMode();
      structure.sitplanview.disableWindowDrawingMode();
      structure.sitplanview.disableDoorDrawingMode();

      // Enable shape drawing
      structure.sitplanview.enableFreeformShapeDrawingMode(shapeType);
      setState((prev) => ({
        ...prev,
        drawingMode: { type: "shape", shapeType },
      }));
    },
    [structure]
  );

  const disableDrawingMode = useCallback(() => {
    if (!structure?.sitplanview) return;

    structure.sitplanview.disableWallDrawingMode();
    structure.sitplanview.disableFreeformShapeDrawingMode();
    structure.sitplanview.disableWindowDrawingMode();
    structure.sitplanview.disableDoorDrawingMode();

    setState((prev) => ({ ...prev, drawingMode: null }));
  }, [structure]);

  // Element management
  const addElement = useCallback(
    (
      electroItemId: number,
      x: number,
      y: number
    ): SituationPlanElement | null => {
      if (!sitplan || !structure?.sitplanview) return null;

      const electroItem = structure.getElectroItemById(electroItemId);
      if (!electroItem) return null;

      const currentPage = structure.sitplanview.getCurrentPage();

      const element = sitplan.addElementFromElectroItem(
        electroItemId,
        currentPage,
        x,
        y,
        "auto",
        "",
        "onder",
        11,
        sitplan.defaults.scale,
        sitplan.defaults.rotate
      );

      if (element) {
        structure.sitplanview.redraw();
      }

      return element;
    },
    [sitplan, structure]
  );

  const updateElement = useCallback(
    (element: SituationPlanElement) => {
      if (!structure?.sitplanview) return;
      structure.sitplanview.redraw();
    },
    [structure]
  );

  const deleteElement = useCallback(
    (element: SituationPlanElement) => {
      if (!sitplan || !structure?.sitplanview) return;

      sitplan.removeElement(element);
      structure.sitplanview.redraw();
    },
    [sitplan, structure]
  );

  const selectElement = useCallback(
    (element: SituationPlanElement | null) => {
      if (!structure?.sitplanview) return;

      if (element) {
        const box = document.getElementById(`SP_${element.id}`);
        if (box) {
          structure.sitplanview.selectOneBox(box);
        }
      } else {
        structure.sitplanview.clearSelection();
      }
    },
    [structure]
  );

  const clearSelection = useCallback(() => {
    if (!structure?.sitplanview) return;
    structure.sitplanview.clearSelection();
  }, [structure]);

  const redraw = useCallback(() => {
    if (!structure?.sitplanview) return;
    structure.sitplanview.redraw();
  }, [structure]);

  const getCoordinatesFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
      if (!paperRef.current || !structure?.sitplanview) {
        return { x: 0, y: 0 };
      }

      const rect = paperRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / state.zoomFactor;
      const y = (e.clientY - rect.top) / state.zoomFactor;

      return { x, y };
    },
    [paperRef, structure, state.zoomFactor]
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
    redraw,
    getCoordinatesFromEvent,
  };
}
