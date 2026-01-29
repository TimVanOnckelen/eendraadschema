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

  // Listen for selection changes from the legacy system
  useEffect(() => {
    const handleSelectionChange = () => {
      // Selection is handled by legacy code, we just need to refresh sidebar
      // The sidebar will query the selection when it needs to display it
    };

    window.addEventListener('sitplan-selection-change', handleSelectionChange as EventListener);
    return () => {
      window.removeEventListener('sitplan-selection-change', handleSelectionChange as EventListener);
    };
  }, []);

  const updatePageInfo = () => {
    // No longer needed - state is managed by the hook
  };

  // Initialize sitplan
  useEffect(() => {
    if (!structure) return;
    
    console.log('[SitPlanView] useEffect triggered, canvasRef.current:', !!canvasRef.current, 'paperRef.current:', !!paperRef.current);
    
    // Initialize sitplan if needed
    if (!structure.sitplan) {
      structure.sitplan = new SituationPlan();
    }

    // Always reinitialize if we don't have a sitplanview or if DOM refs changed
    const shouldReinit = !structure.sitplanview || 
                         !structure.sitplanview.canvasRef ||
                         !structure.sitplanview.paperRef ||
                         structure.sitplanview.canvasRef !== canvasRef.current ||
                         structure.sitplanview.paperRef !== paperRef.current;
    
    if (shouldReinit) {
      console.log('[SitPlanView] Reinitializing sitplanview');
      
      if (canvasRef.current && paperRef.current) {
        // Remove any old elements with id starting with "SP_" to prevent orphans
        const elements = document.querySelectorAll('[id^="SP_"]');
        elements.forEach((e) => e.remove());
        
        // Create the SituationPlanView
        structure.sitplanview = new SitPlanViewClass(
          canvasRef.current,
          paperRef.current,
          structure.sitplan
        );

        console.log('[SitPlanView] Created new sitplanview, calling zoomToFit');
        sitPlan.zoomToFit();
      }
    }

    // Check for legacy schakelaars
    if (structure.properties && structure.properties.legacySchakelaars == null) {
      if (structure.sitplan.heeftEenzameSchakelaars()) {
        const askLegacySchakelaar = new AskLegacySchakelaar();
        askLegacySchakelaar.show().then(() => {
          sitPlan.redraw();
        });
        return;
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

    // Cleanup: hide layer manager when leaving the sitplan view
    return () => {
      window.removeEventListener('sitplan-selection-change', () => {});
      if (structure?.sitplanview?.layerManager) {
        structure.sitplanview.layerManager.hide();
      }
    };
  }, [structure, appDocStorage, canvasRef.current, paperRef.current]);

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

  // Button styling constants
  const ribbonButtonStyle = {
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.25)',
    }
  };

  const accentButtonStyle = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#ff6b35',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#ff5722',
    }
  };

  const dropdownButtonStyle = {
    ...accentButtonStyle,
    backgroundColor: showGrid ? '#4caf50' : '#ff9800',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* Ribbon for sitplan controls */}
      <div id="ribbon" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'linear-gradient(to right, #0d47a1, #1565c0)',
        borderBottom: '2px solid #0d3a8c',
        alignItems: 'center',
        gap: '12px',
        minHeight: '56px',
        flexShrink: 0,
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'visible' }}>
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={!undostruct || undostruct.undoStackSize() === 0}
            style={{
              ...ribbonButtonStyle,
              opacity: undostruct?.undoStackSize() > 0 ? 1 : 0.5,
              cursor: undostruct?.undoStackSize() > 0 ? 'pointer' : 'not-allowed',
            } as React.CSSProperties}
            title="Ongedaan maken (Ctrl+Z)"
          >
            <span style={{ fontSize: '16px' }}>↶</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={!undostruct || undostruct.redoStackSize() === 0}
            style={{
              ...ribbonButtonStyle,
              opacity: undostruct?.redoStackSize() > 0 ? 1 : 0.5,
              cursor: undostruct?.redoStackSize() > 0 ? 'pointer' : 'not-allowed',
            } as React.CSSProperties}
            title="Opnieuw (Ctrl+Y)"
          >
            <span style={{ fontSize: '16px' }}>↷</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

          {/* Add items */}
          <button
            onClick={handleAddFromFile}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#cb997e',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a5a58d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#cb997e'}
            title="Achtergrondafbeelding toevoegen"
          >
            <span style={{ fontSize: '16px' }}>📁</span>
            <span>Bestand</span>
          </button>
          <button
            onClick={handleAddFromSchema}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#cb997e',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a5a58d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#cb997e'}
            title="Symbool uit schema toevoegen"
          >
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span>Schema</span>
          </button>
          <button
            onClick={handleAddCustom}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#cb997e',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00796b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009688'}
            title="Los symbool toevoegen"
          >
            <span style={{ fontSize: '16px' }}>➕</span>
            <span>Los</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

          {/* Drawing tools group - Bouwelementen Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }} data-building-menu>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Building menu clicked, current state:', buildingElementsMenuOpen);
                setBuildingElementsMenuOpen(!buildingElementsMenuOpen);
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: sitPlan.state.drawingMode && (sitPlan.state.drawingMode.type === 'wall' || sitPlan.state.drawingMode.type === 'window' || sitPlan.state.drawingMode.type === 'door') ? '#009688' : '#80cbc4',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              title="Bouwelementen"
            >
              <span style={{ fontSize: '16px' }}>🏗️</span>
              <span>
                {isWallDrawingMode('inner') ? 'Binnenmuur' : 
                 isWallDrawingMode('outer') ? 'Buitenmuur' :
                 isWindowDrawingMode() ? 'Raam' :
                 isDoorDrawingMode() ? 'Deur' :
                 'Bouwelementen'}
              </span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {buildingElementsMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '2px solid #adb5bd',
                borderRadius: '6px',
                zIndex: 9999,
                minWidth: '180px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleInnerWall();
                    setBuildingElementsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isWallDrawingMode('inner') ? '#e8f5e9' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isWallDrawingMode('inner') ? '#e8f5e9' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isWallDrawingMode('inner') ? '#e8f5e9' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🧱</span>
                  <span>Binnenmuur</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleOuterWall();
                    setBuildingElementsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isWallDrawingMode('outer') ? '#e8f5e9' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isWallDrawingMode('outer') ? '#e8f5e9' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isWallDrawingMode('outer') ? '#e8f5e9' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🧱</span>
                  <span>Buitenmuur</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleWindow();
                    setBuildingElementsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isWindowDrawingMode() ? '#e3f2fd' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isWindowDrawingMode() ? '#e3f2fd' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isWindowDrawingMode() ? '#e3f2fd' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🪟</span>
                  <span>Raam</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleDoor();
                    setBuildingElementsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isDoorDrawingMode() ? '#fff3e0' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDoorDrawingMode() ? '#fff3e0' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDoorDrawingMode() ? '#fff3e0' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                  <span>Deur</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Shapes/Patterns Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }} data-shapes-menu>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShapesMenuOpen(!shapesMenuOpen);
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: sitPlan.state.drawingMode?.type === 'shape' ? '#009688' : '#80cbc4',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              title="Vormen & Patronen"
            >
              <span style={{ fontSize: '16px' }}>🎨</span>
              <span>
                {isShapeDrawingMode('white') ? 'Wit' :
                 isShapeDrawingMode('black') ? 'Zwart' :
                 isShapeDrawingMode('gray') ? 'Grijs' :
                 isShapeDrawingMode('darkgray') ? 'Donkergrijs' :
                 'Vormen'}
              </span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {shapesMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '2px solid #adb5bd',
                borderRadius: '6px',
                zIndex: 9999,
                minWidth: '180px',
                overflow: 'hidden'
              }}>
                {/* White */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleWhiteShape();
                    setShapesMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isShapeDrawingMode('white') ? '#f5f5f5' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('white') ? '#f5f5f5' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('white') ? '#f5f5f5' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>⬜</span>
                  <span>Wit</span>
                </button>

                {/* Black */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleBlackShape();
                    setShapesMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isShapeDrawingMode('black') ? '#e8e8e8' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('black') ? '#e8e8e8' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('black') ? '#e8e8e8' : 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>⬛</span>
                  <span>Zwart</span>
                </button>

                {/* Gray */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleGrayShape();
                    setShapesMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isShapeDrawingMode('gray') ? '#e0e0e0' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('gray') ? '#e0e0e0' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('gray') ? '#e0e0e0' : 'transparent'}
                >
                  <span style={{ fontSize: '16px', backgroundColor: '#999999', borderRadius: '2px', padding: '2px' }}>◼️</span>
                  <span>Grijs</span>
                </button>

                {/* Dark Gray */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleDarkGrayShape();
                    setShapesMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: isShapeDrawingMode('darkgray') ? '#d0d0d0' : 'transparent',
                    color: '#333',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('darkgray') ? '#d0d0d0' : '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isShapeDrawingMode('darkgray') ? '#d0d0d0' : 'transparent'}
                >
                  <span style={{ fontSize: '16px', backgroundColor: '#555555', borderRadius: '2px', padding: '2px' }}>◼️</span>
                  <span>Donkergrijs</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

          {/* Layer Manager */}
          <button
            onClick={handleToggleLayerManager}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            title="Laagbeheer tonen/verbergen"
          >
            <span style={{ fontSize: '16px' }}>🗂️</span>
            <span>Lagen</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bb2d3b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
            title="Geselecteerde symbool verwijderen (Del)"
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
            <span>Verwijder</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>

          {/* Z-order */}
          <button
            onClick={handleSendBack}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            title="Naar achter verplaatsen"
          >
            <span style={{ fontSize: '16px' }}>⬇</span>
            <span>Achter</span>
          </button>
          <button
            onClick={handleBringFront}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            title="Naar voor verplaatsen"
          >
            <span style={{ fontSize: '16px' }}>⬆</span>
            <span>Voor</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Grid toggle */}
          <button
            onClick={handleToggleGrid}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: showGrid ? '#009688' : '#80cbc4',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title={showGrid ? 'Raster verbergen' : 'Raster tonen'}
          >
            <span style={{ fontSize: '16px' }}>⊞</span>
            <span>{showGrid ? 'Raster aan' : 'Raster uit'}</span>
          </button>

          {/* Page selector */}
          {sitPlan.state.numPages > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              color: 'white'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Pag.</span>
              <select 
                id="id_sitplanpage" 
                value={sitPlan.state.currentPage} 
                onChange={handlePageChange}
                style={{
                  padding: '4px 8px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {Array.from({ length: sitPlan.state.numPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page} style={{ color: '#333' }}>
                    {page}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleAddPage}
                disabled={sitPlan.state.currentPage !== sitPlan.state.numPages}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: sitPlan.state.currentPage === sitPlan.state.numPages ? '#009688' : '#ccc',
                  color: 'white',
                  cursor: sitPlan.state.currentPage === sitPlan.state.numPages ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (sitPlan.state.currentPage === sitPlan.state.numPages) {
                    e.currentTarget.style.backgroundColor = '#00796b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sitPlan.state.currentPage === sitPlan.state.numPages) {
                    e.currentTarget.style.backgroundColor = '#009688';
                  }
                }}
                title="Nieuwe pagina toevoegen"
              >
                +
              </button>
              <button 
                onClick={handleDeletePage}
                disabled={sitPlan.state.numPages <= 1}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: sitPlan.state.numPages > 1 ? '#e91e63' : '#ccc',
                  color: 'white',
                  cursor: sitPlan.state.numPages > 1 ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (sitPlan.state.numPages > 1) {
                    e.currentTarget.style.backgroundColor = '#c2185b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sitPlan.state.numPages > 1) {
                    e.currentTarget.style.backgroundColor = '#e91e63';
                  }
                }}
                title="Huidige pagina verwijderen"
              >
                −
              </button>
            </div>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6' }}></div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleZoomIn}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#673ab7',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5e35b1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#673ab7'}
              title="Zoom in"
            >
              🔍+
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#673ab7',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5e35b1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#673ab7'}
              title="Zoom uit"
            >
              🔍−
            </button>
            <button
              onClick={handleZoomToFit}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#673ab7',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5e35b1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#673ab7'}
              title="Zoom om passend te maken"
            >
              ⛶
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
          className="keyboard-shortcuts-overlay"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('keyboard-shortcuts-overlay')) {
              setShowKeysDialog(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="keyboard-shortcuts-dialog"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowKeysDialog(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px' }}>⌨️ Sneltoetsen</h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Situatieschema shortcuts */}
              <div>
                <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '12px', color: '#333' }}>
                  Situatieschema
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 500 }}>Klik en sleep</span>
                    <span style={{ color: '#666' }}>Symbolen toevoegen</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 500 }}>Shift + Klik</span>
                    <span style={{ color: '#666' }}>Selecteer element</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 500 }}>Delete / Backspace</span>
                    <span style={{ color: '#666' }}>Verwijder geselecteerd element</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 500 }}>Ctrl + Scroll</span>
                    <span style={{ color: '#666' }}>Zoom in/uit</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>?</span>
                    <span style={{ color: '#666' }}>Toon dit scherm</span>
                  </div>
                </div>
              </div>

              {/* General tips */}
              <div>
                <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '12px', color: '#333' }}>
                  Tips
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 500 }}>Sleep symbolen</span>
                    <span style={{ color: '#666' }}>van sidebar naar scherm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>Zoeken</span>
                    <span style={{ color: '#666' }}>in de linkerzijbalk</span>
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
