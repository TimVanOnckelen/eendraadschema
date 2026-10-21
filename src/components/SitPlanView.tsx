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
import { SitPlanSidebar } from './SitPlanSidebar';
import { useSitPlan } from '../hooks/useSitPlan';
import { Icon } from './Icon';

export const SitPlanView: React.FC = () => {
  const { structure, appDocStorage, undostruct } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  
  // Use the sitplan hook for state management
  const sitPlan = useSitPlan(
    structure?.sitplan || null,
    structure || null,
    canvasRef,
    paperRef
  );
  
  const [buildingElementsMenuOpen, setBuildingElementsMenuOpen] = useState<boolean>(false);
  const [shapesMenuOpen, setShapesMenuOpen] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<SituationPlanElement | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showKeysDialog, setShowKeysDialog] = useState<boolean>(false);

  // Helper functions to check drawing modes from hook state
  const isWallDrawingMode = (type: 'inner' | 'outer') => 
    sitPlan.state.drawingMode?.type === 'wall' && sitPlan.state.drawingMode.wallType === type;
  
  const isWindowDrawingMode = () => sitPlan.state.drawingMode?.type === 'window';
  const isDoorDrawingMode = () => sitPlan.state.drawingMode?.type === 'door';
  
  const isShapeDrawingMode = (type: 'white' | 'black' | 'gray' | 'darkgray') =>
    sitPlan.state.drawingMode?.type === 'shape' && sitPlan.state.drawingMode.shapeType === type;

  // Close dropdown menus when clicking outside
  useEffect(() => {
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [buildingElementsMenuOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show keyboard shortcuts on "?"
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeysDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The mounted React view owns exactly one legacy renderer.
  useEffect(() => {
    if (!structure || !canvasRef.current || !paperRef.current) return;
    if (!structure.sitplan) structure.sitplan = new SituationPlan();
    structure.sitplanview?.dispose();
    const view = new SitPlanViewClass(canvasRef.current, paperRef.current, structure.sitplan);
    structure.sitplanview = view;
    let active = true;
    const cleanup = () => {
      active = false;
      view.dispose();
      if (structure.sitplanview === view) structure.sitplanview = null;
    };
    sitPlan.zoomToFit();

    // Check for legacy schakelaars
    if (structure.properties && structure.properties.legacySchakelaars == null) {
      if (structure.sitplan.heeftEenzameSchakelaars()) {
        const askLegacySchakelaar = new AskLegacySchakelaar();
        askLegacySchakelaar.show().then(() => {
          if (active) view.redraw();
        });
        return cleanup;
      } else {
        structure.properties.legacySchakelaars = false;
      }
    }

    // Redraw the sitplan
    if (structure.sitplanview) {
      console.log('[SitPlanView] Calling redraw');
      sitPlan.redraw();
      
      // Show helper tip (only if not shown before)
      if (!appDocStorage.get('sitplan.introductie.shown')) {
        const helperTip = new HelperTip(appDocStorage);
        helperTip.show(
          "sitplan.introductie",
          `<h3>Situatieschema tekenen</h3>
          <p>Op deze pagina kan u een situatieschema tekenen.</p>
          <p>Laad een plattegrond met de knop "Uit bestand" en voeg symbolen toe met de knop "Uit schema".</p>
          <p>Klik <a href="Documentation/sitplandoc.pdf" target="_blank" rel="noopener noreferrer">hier</a> om in een nieuw venster de documentatie te bekijken.</p>
          <p>We werken elke dag om dit programma beter te maken. Opmerkingen en ideeën zijn welkom in het "contact"-formulier.</p>`
        );
      }
    }

    return cleanup;
  }, [structure, appDocStorage]);

  // Drag and drop handlers for React events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get the electroItemId from dataTransfer
    const dataTransferId = e.dataTransfer.getData('text/plain');
    if (!dataTransferId) {
      return;
    }
    
    const electroItemId = parseInt(dataTransferId);
    if (!electroItemId) {
      return;
    }

    // Get drop position using the hook
    const { x, y } = sitPlan.getCoordinatesFromEvent(e);

    // Add element using the hook
    const element = sitPlan.addElement(electroItemId, x, y);
    
    if (element && undostruct) {
      undostruct.store();
    }
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

  const handleAddFromFile = () => {
    const button = document.getElementById('button_Add') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleAddFromSchema = () => {
    const button = document.getElementById('button_Add_electroItem') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleAddCustom = () => {
    const button = document.getElementById('button_Add_customItem') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleDelete = () => {
    const button = document.getElementById('button_Delete') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleSendBack = () => {
    const button = document.getElementById('sendBack') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleBringFront = () => {
    const button = document.getElementById('bringFront') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleZoomIn = () => {
    const button = document.getElementById('button_zoomin') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleZoomOut = () => {
    const button = document.getElementById('button_zoomout') as HTMLButtonElement;
    if (button) button.click();
  };

  const handleZoomToFit = () => {
    const button = document.getElementById('button_zoomToFit') as HTMLButtonElement;
    if (button) button.click();
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pageNum = parseInt(e.target.value);
    sitPlan.changePage(pageNum);
  };

  const handleAddPage = () => {
    sitPlan.addPage();
  };

  const handleDeletePage = () => {
    sitPlan.deletePage();
  };

  const handleToggleInnerWall = () => {
    const wallType = sitPlan.state.drawingMode?.type === 'wall' && sitPlan.state.drawingMode.wallType;
    if (wallType === 'inner') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableWallDrawing('inner');
    }
  };

  const handleToggleOuterWall = () => {
    const wallType = sitPlan.state.drawingMode?.type === 'wall' && sitPlan.state.drawingMode.wallType;
    if (wallType === 'outer') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableWallDrawing('outer');
    }
  };

  const handleToggleWindow = () => {
    if (sitPlan.state.drawingMode?.type === 'window') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableWindowDrawing();
    }
  };

  const handleToggleDoor = () => {
    if (sitPlan.state.drawingMode?.type === 'door') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableDoorDrawing();
    }
  };

  const handleToggleLayerManager = () => {
    if (!structure?.sitplanview?.layerManager) return;
    structure.sitplanview.layerManager.toggle();
  };

  const handleToggleWhiteShape = () => {
    const shapeType = sitPlan.state.drawingMode?.type === 'shape' && sitPlan.state.drawingMode.shapeType;
    if (shapeType === 'white') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableShapeDrawing('white');
    }
  };

  const handleToggleBlackShape = () => {
    const shapeType = sitPlan.state.drawingMode?.type === 'shape' && sitPlan.state.drawingMode.shapeType;
    if (shapeType === 'black') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableShapeDrawing('black');
    }
  };

  const handleToggleGrayShape = () => {
    const shapeType = sitPlan.state.drawingMode?.type === 'shape' && sitPlan.state.drawingMode.shapeType;
    if (shapeType === 'gray') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableShapeDrawing('gray');
    }
  };

  const handleToggleDarkGrayShape = () => {
    const shapeType = sitPlan.state.drawingMode?.type === 'shape' && sitPlan.state.drawingMode.shapeType;
    if (shapeType === 'darkgray') {
      sitPlan.disableDrawingMode();
    } else {
      sitPlan.enableShapeDrawing('darkgray');
    }
  };

  const handleUpdateElement = (element: SituationPlanElement) => {
    sitPlan.updateElement(element);
    if (undostruct) {
      undostruct.store('updateElement');
    }
  };

  const handleUpdateKringColor = (kringId: number, color: string | null) => {
    structure?.sitplan?.setKringColor(kringId, color);
    sitPlan.redraw();
    if (undostruct) {
      undostruct.store('updateKringColor');
    }
  };

  const handleCloseSidebar = () => {
    setSelectedElement(null);
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    if (paperRef.current) {
      if (!showGrid) {
        paperRef.current.style.backgroundImage = 'linear-gradient(0deg, transparent 24%, rgba(150,150,150,.08) 25%, rgba(150,150,150,.08) 26%, transparent 27%, transparent 74%, rgba(150,150,150,.08) 75%, rgba(150,150,150,.08) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(150,150,150,.08) 25%, rgba(150,150,150,.08) 26%, transparent 27%, transparent 74%, rgba(150,150,150,.08) 75%, rgba(150,150,150,.08) 76%, transparent 77%, transparent)';
        paperRef.current.style.backgroundSize = '50px 50px';
      } else {
        paperRef.current.style.backgroundImage = 'none';
      }
    }
  };

  const buildingModeActive = Boolean(
    sitPlan.state.drawingMode &&
    (sitPlan.state.drawingMode.type === 'wall' || sitPlan.state.drawingMode.type === 'window' || sitPlan.state.drawingMode.type === 'door')
  );
  const shapeModeActive = sitPlan.state.drawingMode?.type === 'shape';
  const canUndo = Boolean(undostruct && undostruct.undoStackSize() > 0);
  const canRedo = Boolean(undostruct && undostruct.redoStackSize() > 0);

  const menuItem = (
    label: string,
    icon: React.ReactNode,
    active: boolean,
    onSelect: () => void,
    close: () => void
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
    >
      {icon}
      <span>{label}</span>
      {active && <Icon name="check" size={14} className="tb-menu-check" />}
    </button>
  );

  const swatch = (color: string) => (
    <span className="tb-swatch" style={{ background: color }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
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
            <button type="button" className="tb-btn" onClick={handleAddFromFile} title="Achtergrondafbeelding toevoegen">
              <Icon name="image" />
              <span>Bestand</span>
            </button>
            <button type="button" className="tb-btn" onClick={handleAddFromSchema} title="Symbool uit schema toevoegen">
              <Icon name="schema" />
              <span>Schema</span>
            </button>
            <button type="button" className="tb-btn" onClick={handleAddCustom} title="Los symbool toevoegen">
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
                  setBuildingElementsMenuOpen(!buildingElementsMenuOpen);
                }}
                title="Bouwelementen"
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
                  {menuItem('Binnenmuur', <Icon name="wall" />, isWallDrawingMode('inner'), handleToggleInnerWall, () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Buitenmuur', <Icon name="wall" strokeWidth={2.5} />, isWallDrawingMode('outer'), handleToggleOuterWall, () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Raam', <Icon name="window" />, isWindowDrawingMode(), handleToggleWindow, () => setBuildingElementsMenuOpen(false))}
                  {menuItem('Deur', <Icon name="door" />, isDoorDrawingMode(), handleToggleDoor, () => setBuildingElementsMenuOpen(false))}
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
                  setShapesMenuOpen(!shapesMenuOpen);
                }}
                title="Vormen & Patronen"
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
                  {menuItem('Wit', swatch('#ffffff'), isShapeDrawingMode('white'), handleToggleWhiteShape, () => setShapesMenuOpen(false))}
                  {menuItem('Zwart', swatch('#000000'), isShapeDrawingMode('black'), handleToggleBlackShape, () => setShapesMenuOpen(false))}
                  {menuItem('Grijs', swatch('#999999'), isShapeDrawingMode('gray'), handleToggleGrayShape, () => setShapesMenuOpen(false))}
                  {menuItem('Donkergrijs', swatch('#555555'), isShapeDrawingMode('darkgray'), handleToggleDarkGrayShape, () => setShapesMenuOpen(false))}
                </div>
              )}
            </div>
          </div>

          <span className="tb-sep" />

          {/* Arrange */}
          <div className="tb-group">
            <button type="button" className="tb-btn" onClick={handleToggleLayerManager} title="Laagbeheer tonen/verbergen">
              <Icon name="layers" />
              <span>Lagen</span>
            </button>
            <button type="button" className="tb-btn icon-only" onClick={handleSendBack} title="Naar achter verplaatsen" aria-label="Naar achter">
              <Icon name="send-back" />
            </button>
            <button type="button" className="tb-btn icon-only" onClick={handleBringFront} title="Naar voor verplaatsen" aria-label="Naar voor">
              <Icon name="bring-front" />
            </button>
            <button type="button" className="tb-btn icon-only danger" onClick={handleDelete} title="Geselecteerde symbool verwijderen (Del)" aria-label="Verwijder">
              <Icon name="trash" />
            </button>
          </div>
        </div>

        <div className="tb-group-row">
          {/* Grid toggle */}
          <button
            type="button"
            className={`tb-btn${showGrid ? ' active' : ''}`}
            onClick={handleToggleGrid}
            title={showGrid ? 'Raster verbergen' : 'Raster tonen'}
            aria-pressed={showGrid}
          >
            <Icon name="window" />
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
                  onClick={handleAddPage}
                  disabled={sitPlan.state.currentPage !== sitPlan.state.numPages}
                  title="Nieuwe pagina toevoegen"
                  aria-label="Nieuwe pagina toevoegen"
                >
                  <Icon name="plus" />
                </button>
                <button
                  type="button"
                  className="tb-btn icon-only danger"
                  onClick={handleDeletePage}
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
            <button type="button" className="tb-btn icon-only" onClick={handleZoomOut} title="Zoom uit" aria-label="Zoom uit">
              <Icon name="zoom-out" />
            </button>
            <button type="button" className="tb-btn icon-only" onClick={handleZoomIn} title="Zoom in" aria-label="Zoom in">
              <Icon name="zoom-in" />
            </button>
            <button type="button" className="tb-btn icon-only" onClick={handleZoomToFit} title="Zoom om passend te maken" aria-label="Zoom om passend te maken">
              <Icon name="zoom-fit" />
            </button>
          </div>
        </div>
      </div>

      {/* Main sitplan area */}
      <div id="outerdiv" ref={containerRef} style={{ 
        display: 'flex', 
        width: '100%', 
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
        margin: 0,
        padding: 0
      }}>
        {/* React Sidebar Component */}
        <SitPlanSidebar
          selectedElement={selectedElement}
          onClose={handleCloseSidebar}
          onUpdateElement={handleUpdateElement}
          onUpdateKringColor={handleUpdateKringColor}
          structure={structure}
        />
        
        <div 
          id="canvas" 
          ref={canvasRef}
        >
          <div 
            id="paper" 
            ref={paperRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          ></div>
        </div>
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
        <button id="button_zoomin"></button>
        <button id="button_zoomout"></button>
        <button id="button_zoomToFit"></button>
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
          <div className="keyboard-shortcuts-dialog editor-modal" style={{ maxWidth: '560px' }}>
            <button className="editor-modal-close" onClick={() => setShowKeysDialog(false)} aria-label="Sluiten">
              <Icon name="x" />
            </button>

            <h2>Sneltoetsen</h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Situatieschema shortcuts */}
              <div>
                <h3>
                  Situatieschema
                </h3>
                <div>
                  <div className="shortcut-row">
                    <span>Klik en sleep</span>
                    <span>Symbolen toevoegen</span>
                  </div>
                  <div className="shortcut-row">
                    <span>Shift + Klik</span>
                    <span>Selecteer element</span>
                  </div>
                  <div className="shortcut-row">
                    <span>Delete / Backspace</span>
                    <span>Verwijder geselecteerd element</span>
                  </div>
                  <div className="shortcut-row">
                    <span>Ctrl + Scroll</span>
                    <span>Zoom in/uit</span>
                  </div>
                  <div className="shortcut-row">
                    <span>?</span>
                    <span>Toon dit scherm</span>
                  </div>
                </div>
              </div>

              {/* General tips */}
              <div>
                <h3>
                  Tips
                </h3>
                <div>
                  <div className="shortcut-row">
                    <span>Sleep symbolen</span>
                    <span>van sidebar naar scherm</span>
                  </div>
                  <div className="shortcut-row">
                    <span>Zoeken</span>
                    <span>in de linkerzijbalk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
