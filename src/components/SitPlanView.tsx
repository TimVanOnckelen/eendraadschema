/**
 * SitPlanView - React component for situation plan/schema view
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { SituationPlan } from '../sitplan/SituationPlan';
import { SituationPlanView as SitPlanViewClass } from '../sitplan/SituationPlanView';
import { SituationPlanElement } from '../sitplan/SituationPlanElement';
import { AskLegacySchakelaar } from '../importExport/AskLegacySchakelaar';
import { HelperTip } from '../documentation/HelperTip';
import { SitPlanSidebar, BuildingGeometry } from './SitPlanSidebar';
import { useSitPlan } from '../hooks/useSitPlan';
import { Icon } from './Icon';
import { WallType } from '../sitplan/WallElement';

const GRID_STORAGE_KEY = 'sitplan.showGrid';

function readGridPreference(): boolean {
  try {
    return localStorage.getItem(GRID_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export const SitPlanView: React.FC = () => {
  const { structure, appDocStorage, undostruct } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  // Use the sitplan hook for state management
  const sitPlan = useSitPlan(structure?.sitplan || null, structure || null);

  const [buildingElementsMenuOpen, setBuildingElementsMenuOpen] = useState<boolean>(false);
  const [shapesMenuOpen, setShapesMenuOpen] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(readGridPreference);
  const [showKeysDialog, setShowKeysDialog] = useState<boolean>(false);

  const drawingMode = sitPlan.state.drawingMode;

  // Helper functions to check drawing modes from hook state
  const isWallDrawingMode = (type: WallType) =>
    drawingMode?.type === 'wall' && drawingMode.wallType === type;
  const isWindowDrawingMode = () => drawingMode?.type === 'window';
  const isDoorDrawingMode = () => drawingMode?.type === 'door';
  const isShapeDrawingMode = (type: 'white' | 'black' | 'gray' | 'darkgray') =>
    drawingMode?.type === 'shape' && drawingMode.shapeType === type;

  // Close dropdown menus when clicking outside
  useEffect(() => {
    if (!buildingElementsMenuOpen && !shapesMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (buildingElementsMenuOpen && !target.closest('[data-building-menu]')) {
        setBuildingElementsMenuOpen(false);
      }
      if (shapesMenuOpen && !target.closest('[data-shapes-menu]')) {
        setShapesMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [buildingElementsMenuOpen, shapesMenuOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowKeysDialog(true);
      } else if (e.key === 'Escape') {
        setShowKeysDialog(false);
        setBuildingElementsMenuOpen(false);
        setShapesMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The mounted React view owns exactly one legacy renderer.
  useEffect(() => {
    if (!structure || !canvasRef.current || !paperRef.current) return;
    if (!structure.sitplan) structure.sitplan = new SituationPlan();

    // Hergebruik een view die al aan deze DOM gekoppeld is (bvb aangemaakt door undo/redo),
    // anders maken we een nieuwe.
    let view = structure.sitplanview as SitPlanViewClass | null;
    if (
      !view ||
      view.isDisposed() ||
      view.canvasRef !== canvasRef.current ||
      view.paperRef !== paperRef.current
    ) {
      view?.dispose();
      view = new SitPlanViewClass(canvasRef.current, paperRef.current, structure.sitplan);
      structure.sitplanview = view;
    }
    view.setSnapToGrid(showGrid);

    let active = true;
    const cleanup = () => {
      active = false;
      // Bij een nieuwe structure (undo/redo, ander bestand) kan de view al vervangen zijn.
      if (structure.sitplanview === view) {
        view!.dispose();
        structure.sitplanview = null;
      }
    };

    // Check for legacy schakelaars
    if (structure.properties && structure.properties.legacySchakelaars == null) {
      if (structure.sitplan.heeftEenzameSchakelaars()) {
        const askLegacySchakelaar = new AskLegacySchakelaar();
        askLegacySchakelaar.show().then(() => {
          if (active) view!.redraw();
        });
        return cleanup;
      } else {
        structure.properties.legacySchakelaars = false;
      }
    }

    view.redraw();

    // Show helper tip (only if not shown before)
    if (!appDocStorage.get('sitplan.introductie.shown')) {
      const helperTip = new HelperTip(appDocStorage);
      helperTip.show(
        "sitplan.introductie",
        `<h3>Situatieschema tekenen</h3>
        <p>Op deze pagina kan u een situatieschema tekenen.</p>
        <p>Laad een plattegrond met de knop "Bestand" en sleep symbolen uit de zijbalk op het blad, of gebruik de knop "Schema".</p>
        <p>Zoomen doet u met Ctrl + scrollwiel, verschuiven met de middelste muisknop of spatie + slepen. Druk op <b>?</b> voor alle sneltoetsen.</p>
        <p>Klik <a href="Documentation/sitplandoc.pdf" target="_blank" rel="noopener noreferrer">hier</a> om in een nieuw venster de documentatie te bekijken.</p>`
      );
    }

    return cleanup;
    // showGrid wordt apart gesynchroniseerd hieronder
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure, appDocStorage]);

  // Raster tonen + snappen
  useEffect(() => {
    paperRef.current?.classList.toggle('show-grid', showGrid);
    sitPlan.setSnapToGrid(showGrid);
    try {
      localStorage.setItem(GRID_STORAGE_KEY, showGrid ? '1' : '0');
    } catch {
      /* geen opslag beschikbaar */
    }
  }, [showGrid, sitPlan.setSnapToGrid, structure]);

  // Drag and drop handlers (symbolen uit de zijbalk)
  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('text/plain')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const electroItemId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!electroItemId) return;

    const view = sitPlan.getView();
    if (!view) return;
    let { x, y } = sitPlan.getCoordinatesFromEvent(e);
    // Binnen het papier houden
    x = Math.min(view.getPaperWidth(), Math.max(0, x));
    y = Math.min(view.getPaperHeight(), Math.max(0, y));

    // addElement selecteert het nieuwe symbool, brengt het naar voor en bewaart een undo-stap
    sitPlan.addElement(electroItemId, x, y);
  };

  const handleUndo = () => {
    if (undostruct?.undoStackSize() > 0) {
      (globalThis as any).undoClicked();
    }
  };

  const handleRedo = () => {
    if (undostruct?.redoStackSize() > 0) {
      (globalThis as any).redoClicked();
    }
  };

  const clickHidden = (id: string) => {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    button?.click();
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    sitPlan.changePage(parseInt(e.target.value));
  };

  const toggleWall = (type: WallType) => {
    if (isWallDrawingMode(type)) sitPlan.disableDrawingMode();
    else sitPlan.enableWallDrawing(type);
  };

  const toggleWindow = () => {
    if (isWindowDrawingMode()) sitPlan.disableDrawingMode();
    else sitPlan.enableWindowDrawing();
  };

  const toggleDoor = () => {
    if (isDoorDrawingMode()) sitPlan.disableDrawingMode();
    else sitPlan.enableDoorDrawing();
  };

  const toggleShape = (type: 'white' | 'black' | 'gray' | 'darkgray') => {
    if (isShapeDrawingMode(type)) sitPlan.disableDrawingMode();
    else sitPlan.enableShapeDrawing(type);
  };

  const handleToggleLayerManager = () => {
    sitPlan.getView()?.layerManager?.toggle();
  };

  const handleUpdateBuilding = (element: SituationPlanElement, geometry: BuildingGeometry) => {
    const view = sitPlan.getView();
    if (!view) return;
    if (geometry.wallType && element.isWall()) {
      const wall = element.getWallElement();
      if (wall) wall.type = geometry.wallType;
    }
    view.updateBuildingElement(element, geometry, `sidebarGeometry_${element.id}`);
  };

  const handleUpdateKringColor = (kringId: number, color: string | null) => {
    structure?.sitplan?.setKringColor(kringId, color);
    sitPlan.redraw();
    undostruct?.store('updateKringColor');
  };

  const selectedBuildingElement =
    sitPlan.state.selectedElement?.isBuildingElement() ? sitPlan.state.selectedElement : null;

  const buildingModeActive = Boolean(
    drawingMode && (drawingMode.type === 'wall' || drawingMode.type === 'window' || drawingMode.type === 'door')
  );
  const shapeModeActive = drawingMode?.type === 'shape';
  const canUndo = Boolean(undostruct && undostruct.undoStackSize() > 0);
  const canRedo = Boolean(undostruct && undostruct.redoStackSize() > 0);
  const zoomPercent = Math.round(sitPlan.state.zoomFactor * 100);

  const menuItem = (
    label: string,
    icon: React.ReactNode,
    active: boolean,
    onSelect: () => void,
    close: () => void,
    hint?: string
  ) => (
    <button
      type="button"
      className={`tb-menu-item${active ? ' active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        close();
      }}
      title={hint}
    >
      {icon}
      <span>{label}</span>
      {active && <Icon name="check" size={14} className="tb-menu-check" />}
    </button>
  );

  const swatch = (color: string) => (
    <span className="tb-swatch" style={{ background: color }} />
  );

  const drawingHint = drawingMode
    ? 'Sleep op het blad om te tekenen, of klik om een standaardgrootte te plaatsen. Esc om te stoppen.'
    : null;

  return (
    <div className="sitplan-root">
      {/* Ribbon for sitplan controls */}
      <div id="ribbon" className="tb">
        <div className="tb-group-row">
          {/* Undo/Redo */}
          <div className="tb-group">
            <button type="button" className="tb-btn icon-only" onClick={handleUndo} disabled={!canUndo} title="Ongedaan maken (Ctrl+Z)" aria-label="Ongedaan maken">
              <Icon name="undo" />
            </button>
            <button type="button" className="tb-btn icon-only" onClick={handleRedo} disabled={!canRedo} title="Opnieuw (Ctrl+Y)" aria-label="Opnieuw">
              <Icon name="redo" />
            </button>
          </div>

          <span className="tb-sep" />

          {/* Add items */}
          <div className="tb-group">
            <span className="tb-label">Toevoegen</span>
            <button type="button" className="tb-btn" onClick={() => clickHidden('button_Add')} title="Achtergrondafbeelding of plattegrond toevoegen">
              <Icon name="image" />
              <span>Bestand</span>
            </button>
            <button type="button" className="tb-btn" onClick={() => clickHidden('button_Add_electroItem')} title="Symbool uit schema toevoegen">
              <Icon name="schema" />
              <span>Schema</span>
            </button>
            <button type="button" className="tb-btn" onClick={() => clickHidden('button_Add_customItem')} title="Los symbool toevoegen">
              <Icon name="plus" />
              <span>Los</span>
            </button>
          </div>

          <span className="tb-sep" />

          {/* Drawing tools group - Bouwelementen Dropdown */}
          <div className="tb-group">
            <div className="tb-dropdown" data-building-menu>
              <button
                type="button"
                className={`tb-btn${buildingModeActive ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShapesMenuOpen(false);
                  setBuildingElementsMenuOpen(!buildingElementsMenuOpen);
                }}
                title="Bouwelementen tekenen"
                aria-expanded={buildingElementsMenuOpen}
              >
                <Icon name="wall" />
                <span>
                  {isWallDrawingMode('inner') ? 'Binnenmuur' :
                   isWallDrawingMode('outer') ? 'Buitenmuur' :
                   isWindowDrawingMode() ? 'Raam' :
                   isDoorDrawingMode() ? 'Deur' :
                   'Bouwelementen'}
                </span>
                <Icon name="chevron-down" size={14} className="tb-caret" />
              </button>

              {buildingElementsMenuOpen && (
                <div className="tb-menu">
                  {menuItem('Binnenmuur', <Icon name="wall" />, isWallDrawingMode('inner'), () => toggleWall('inner'), () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Buitenmuur', <Icon name="wall" strokeWidth={2.5} />, isWallDrawingMode('outer'), () => toggleWall('outer'), () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Raam', <Icon name="window" />, isWindowDrawingMode(), toggleWindow, () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Deur', <Icon name="door" />, isDoorDrawingMode(), toggleDoor, () => setBuildingElementsMenuOpen(false))}
                </div>
              )}
            </div>

            {/* Shapes/Patterns Dropdown */}
            <div className="tb-dropdown" data-shapes-menu>
              <button
                type="button"
                className={`tb-btn${shapeModeActive ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBuildingElementsMenuOpen(false);
                  setShapesMenuOpen(!shapesMenuOpen);
                }}
                title="Vormen tekenen"
                aria-expanded={shapesMenuOpen}
              >
                <Icon name="shape" />
                <span>
                  {isShapeDrawingMode('white') ? 'Wit' :
                   isShapeDrawingMode('black') ? 'Zwart' :
                   isShapeDrawingMode('gray') ? 'Grijs' :
                   isShapeDrawingMode('darkgray') ? 'Donkergrijs' :
                   'Vormen'}
                </span>
                <Icon name="chevron-down" size={14} className="tb-caret" />
              </button>

              {shapesMenuOpen && (
                <div className="tb-menu">
                  {menuItem('Wit', swatch('#ffffff'), isShapeDrawingMode('white'), () => toggleShape('white'), () => setShapesMenuOpen(false))}
                  {menuItem('Zwart', swatch('#000000'), isShapeDrawingMode('black'), () => toggleShape('black'), () => setShapesMenuOpen(false))}
                  {menuItem('Grijs', swatch('#999999'), isShapeDrawingMode('gray'), () => toggleShape('gray'), () => setShapesMenuOpen(false))}
                  {menuItem('Donkergrijs', swatch('#555555'), isShapeDrawingMode('darkgray'), () => toggleShape('darkgray'), () => setShapesMenuOpen(false))}
                </div>
              )}
            </div>

            {drawingMode && (
              <button
                type="button"
                className="tb-btn icon-only"
                onClick={() => sitPlan.disableDrawingMode()}
                title="Stop met tekenen (Esc)"
                aria-label="Stop met tekenen"
              >
                <Icon name="x" />
              </button>
            )}
          </div>

          <span className="tb-sep" />

          {/* Arrange */}
          <div className="tb-group">
            <button type="button" className="tb-btn" onClick={handleToggleLayerManager} title="Laagbeheer tonen/verbergen">
              <Icon name="layers" />
              <span>Lagen</span>
            </button>
            <button type="button" className="tb-btn icon-only" onClick={() => clickHidden('sendBack')} disabled={sitPlan.state.selectedCount === 0} title="Naar achter verplaatsen" aria-label="Naar achter">
              <Icon name="send-back" />
            </button>
            <button type="button" className="tb-btn icon-only" onClick={() => clickHidden('bringFront')} disabled={sitPlan.state.selectedCount === 0} title="Naar voor verplaatsen" aria-label="Naar voor">
              <Icon name="bring-front" />
            </button>
            <button type="button" className="tb-btn icon-only danger" onClick={() => clickHidden('button_Delete')} disabled={sitPlan.state.selectedCount === 0} title="Selectie verwijderen (Del)" aria-label="Verwijder">
              <Icon name="trash" />
            </button>
          </div>
        </div>

        <div className="tb-group-row">
          {/* Grid toggle */}
          <button
            type="button"
            className={`tb-btn${showGrid ? ' active' : ''}`}
            onClick={() => setShowGrid((value) => !value)}
            title={showGrid ? 'Raster verbergen (elementen klikken niet meer vast)' : 'Raster tonen en elementen aan het raster laten vastklikken (Alt ingedrukt houden om tijdelijk vrij te plaatsen)'}
            aria-pressed={showGrid}
          >
            <Icon name="square" />
            <span>Raster</span>
          </button>

          {/* Page selector */}
          {sitPlan.state.numPages > 0 && (
            <>
              <span className="tb-sep" />
              <div className="tb-group">
                <span className="tb-label">Pagina</span>
                <select
                  id="id_sitplanpage"
                  className="tb-select"
                  value={sitPlan.state.currentPage}
                  onChange={handlePageChange}
                >
                  {Array.from({ length: sitPlan.state.numPages }, (_, i) => i + 1).map((page) => (
                    <option key={page} value={page}>
                      {page} / {sitPlan.state.numPages}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="tb-btn icon-only"
                  onClick={() => sitPlan.addPage()}
                  disabled={sitPlan.state.currentPage !== sitPlan.state.numPages}
                  title={sitPlan.state.currentPage !== sitPlan.state.numPages ? 'Ga naar de laatste pagina om een pagina toe te voegen' : 'Nieuwe pagina toevoegen'}
                  aria-label="Nieuwe pagina toevoegen"
                >
                  <Icon name="plus" />
                </button>
                <button
                  type="button"
                  className="tb-btn icon-only danger"
                  onClick={() => sitPlan.deletePage()}
                  disabled={sitPlan.state.numPages <= 1}
                  title="Huidige pagina verwijderen"
                  aria-label="Huidige pagina verwijderen"
                >
                  <Icon name="minus" />
                </button>
              </div>
            </>
          )}

          <span className="tb-sep" />

          {/* Zoom controls */}
          <div className="tb-group">
            <button type="button" className="tb-btn icon-only" onClick={sitPlan.zoomOut} title="Zoom uit (Ctrl + -)" aria-label="Zoom uit">
              <Icon name="zoom-out" />
            </button>
            <button
              type="button"
              className="tb-btn sitplan-zoom-label"
              onClick={() => sitPlan.setZoomFactor(1)}
              title="Zoomniveau — klik voor 100%"
              aria-label={`Zoomniveau ${zoomPercent}%, klik voor 100%`}
            >
              {zoomPercent}%
            </button>
            <button type="button" className="tb-btn icon-only" onClick={sitPlan.zoomIn} title="Zoom in (Ctrl + +)" aria-label="Zoom in">
              <Icon name="zoom-in" />
            </button>
            <button
              type="button"
              className={`tb-btn icon-only${sitPlan.state.fitMode ? ' active' : ''}`}
              onClick={sitPlan.zoomToFit}
              title="Passend maken (Ctrl + 0)"
              aria-label="Zoom om passend te maken"
            >
              <Icon name="zoom-fit" />
            </button>
          </div>

          <span className="tb-sep" />

          <button type="button" className="tb-btn icon-only" onClick={() => setShowKeysDialog(true)} title="Sneltoetsen (?)" aria-label="Sneltoetsen">
            <Icon name="keyboard" />
          </button>
        </div>
      </div>

      {/* Main sitplan area */}
      <div id="outerdiv">
        {/* React Sidebar Component */}
        <SitPlanSidebar
          selectedElement={selectedBuildingElement}
          selectionRevision={sitPlan.state.selectionRevision}
          onClose={sitPlan.clearSelection}
          onUpdateBuilding={handleUpdateBuilding}
          onUpdateKringColor={handleUpdateKringColor}
          structure={structure}
        />

        <div
          id="canvas"
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div id="paperSizer">
            <div id="paper" ref={paperRef}></div>
          </div>
        </div>

        {drawingHint && <div className="sitplan-hint" role="status">{drawingHint}</div>}
      </div>

      {/* Hidden buttons for legacy code compatibility */}
      <div style={{ display: 'none' }}>
        <button id="button_Add"></button>
        <button id="button_Add_electroItem"></button>
        <button id="button_Add_customItem"></button>
        <button id="button_Delete"></button>
        <button id="button_edit"></button>
        <button id="sendBack"></button>
        <button id="bringFront"></button>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {showKeysDialog && (
        <div
          className="keyboard-shortcuts-overlay editor-modal-overlay"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('keyboard-shortcuts-overlay')) {
              setShowKeysDialog(false);
            }
          }}
        >
          <div className="keyboard-shortcuts-dialog editor-modal" style={{ maxWidth: '600px' }}>
            <button className="editor-modal-close" onClick={() => setShowKeysDialog(false)} aria-label="Sluiten">
              <Icon name="x" />
            </button>

            <h2>Sneltoetsen</h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <h3>Selecteren en verplaatsen</h3>
                <div>
                  <div className="shortcut-row"><span>Klik / sleep</span><span>Element selecteren / verplaatsen</span></div>
                  <div className="shortcut-row"><span>Sleep op lege plek</span><span>Selectierechthoek</span></div>
                  <div className="shortcut-row"><span>Shift/Ctrl + klik</span><span>Selectie uitbreiden</span></div>
                  <div className="shortcut-row"><span>Shift + slepen</span><span>Enkel horizontaal of verticaal</span></div>
                  <div className="shortcut-row"><span>Pijltjes (+ Shift)</span><span>Verschuif 1 px (10 px)</span></div>
                  <div className="shortcut-row"><span>Ctrl + ← / →</span><span>Draai 90°</span></div>
                  <div className="shortcut-row"><span>Ctrl + A</span><span>Alles op deze pagina selecteren</span></div>
                  <div className="shortcut-row"><span>Ctrl + D</span><span>Dupliceren</span></div>
                  <div className="shortcut-row"><span>Ctrl + L</span><span>Vergrendelen / ontgrendelen</span></div>
                  <div className="shortcut-row"><span>Enter</span><span>Eigenschappen bewerken</span></div>
                  <div className="shortcut-row"><span>Delete / Backspace</span><span>Verwijderen</span></div>
                  <div className="shortcut-row"><span>PgUp / PgDn</span><span>Selectie naar andere pagina</span></div>
                  <div className="shortcut-row"><span>Esc</span><span>Selectie wissen / stop met tekenen</span></div>
                </div>
              </div>

              <div>
                <h3>Weergave</h3>
                <div>
                  <div className="shortcut-row"><span>Ctrl + scrollwiel</span><span>Zoom rond de muis</span></div>
                  <div className="shortcut-row"><span>Ctrl + + / − / 0</span><span>Zoom in / uit / passend</span></div>
                  <div className="shortcut-row"><span>Spatie + slepen</span><span>Verschuiven</span></div>
                  <div className="shortcut-row"><span>Middelste muisknop</span><span>Verschuiven</span></div>
                  <div className="shortcut-row"><span>Alt (tijdens slepen)</span><span>Niet aan raster vastklikken</span></div>
                  <div className="shortcut-row"><span>?</span><span>Toon dit scherm</span></div>
                </div>
              </div>

              <div>
                <h3>Bouwelementen</h3>
                <div>
                  <div className="shortcut-row"><span>Slepen</span><span>Muur, raam, deur of vorm tekenen</span></div>
                  <div className="shortcut-row"><span>Klik</span><span>Element met standaardgrootte plaatsen</span></div>
                  <div className="shortcut-row"><span>Handvatten</span><span>Afmetingen wijzigen (Shift: verhouding)</span></div>
                  <div className="shortcut-row"><span>Rond handvat</span><span>Roteren (Shift: per 15°)</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
