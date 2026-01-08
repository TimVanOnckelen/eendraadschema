/**
 * SitPlanView - React component for situation plan/schema view
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { SituationPlan } from '../sitplan/SituationPlan';
import { SituationPlanView as SitPlanViewClass } from '../sitplan/SituationPlanView';
import { AskLegacySchakelaar } from '../importExport/AskLegacySchakelaar';
import { HelperTip } from '../documentation/HelperTip';

export const SitPlanView: React.FC = () => {
  const { structure, appDocStorage, undostruct } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const draggedElectroItemId = useRef<number | null>(null);
  const [wallDrawingMode, setWallDrawingMode] = useState<'inner' | 'outer' | null>(null);
  const [freeformShapeDrawingMode, setFreeformShapeDrawingMode] = useState<'white' | 'black' | null>(null);

  const updatePageInfo = () => {
    if (structure?.sitplanview) {
      setCurrentPage(structure.sitplanview.getCurrentPage());
      setNumPages(structure.sitplanview.getNumPages());
    }
  };

  // Initialize sitplan
  useEffect(() => {
    if (!structure || initialized.current) return;
    
    // Initialize sitplan if needed
    if (!structure.sitplan) {
      structure.sitplan = new SituationPlan();
    }

    // Initialize sitplanview if needed
    if (!structure.sitplanview && canvasRef.current && paperRef.current) {
      // Remove any old elements with id starting with "SP_" to prevent orphans
      const elements = document.querySelectorAll('[id^="SP_"]');
      elements.forEach((e) => e.remove());
      
      // Create the SituationPlanView
      structure.sitplanview = new SitPlanViewClass(
        canvasRef.current,
        paperRef.current,
        structure.sitplan
      );

      structure.sitplanview.zoomToFit();
      initialized.current = true;
    }

    // Check for legacy schakelaars
    if (structure.properties.legacySchakelaars == null) {
      if (structure.sitplan.heeftEenzameSchakelaars()) {
        const askLegacySchakelaar = new AskLegacySchakelaar();
        askLegacySchakelaar.show().then(() => {
          if (structure.sitplanview) {
            structure.sitplanview.redraw();
            updatePageInfo();
          }
        });
        return;
      } else {
        structure.properties.legacySchakelaars = false;
      }
    }

    // Redraw the sitplan
    if (structure.sitplanview) {
      console.log('About to redraw sitplan. Paper element:', paperRef.current);
      console.log('Paper element dimensions:', paperRef.current?.getBoundingClientRect());
      structure.sitplanview.redraw();
      updatePageInfo();
      
      // Show helper tip
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

    // Cleanup: hide layer manager when leaving the sitplan view
    return () => {
      if (structure?.sitplanview?.layerManager) {
        structure.sitplanview.layerManager.hide();
      }
    };
  }, [structure, appDocStorage]);

  // Setup drag and drop handlers for sidebar
  useEffect(() => {
    if (!sidebarRef.current || !paperRef.current) return;

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const electroItemId = target.getAttribute('data-electroitem-id');
      if (electroItemId) {
        draggedElectroItemId.current = parseInt(electroItemId);
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'copy';
        }
      }
    };

    const handleDragEnd = () => {
      draggedElectroItemId.current = null;
    };

    // Attach to dynamically created elements
    sidebarRef.current.addEventListener('dragstart', handleDragStart as any);
    sidebarRef.current.addEventListener('dragend', handleDragEnd as any);

    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('dragstart', handleDragStart as any);
        sidebarRef.current.removeEventListener('dragend', handleDragEnd as any);
      }
    };
  }, [sidebarRef.current]);

  // Drag and drop handlers for React events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedElectroItemId.current || !structure?.sitplanview) return;

    // Get drop position relative to paper
    const rect = paperRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / structure.sitplanview.getZoomFactor();
    const y = (e.clientY - rect.top) / structure.sitplanview.getZoomFactor();

    // Add element to sitplan
    const electroItem = structure.getElectroItemById(draggedElectroItemId.current);
    if (electroItem) {
      const element = structure.sitplan.addElementFromElectroItem(
        draggedElectroItemId.current,
        currentPage,
        x,
        y,
        'auto',
        '',
        'onder',
        11,
        structure.sitplan.defaults.scale,
        structure.sitplan.defaults.rotate
      );
      
      if (element) {
        structure.sitplanview.redraw();
        globalThis.undostruct.store();
        updatePageInfo();
      }
    }

    draggedElectroItemId.current = null;
  };

  // Setup drop handler for paper (for legacy DOM manipulation)
  useEffect(() => {
    if (!paperRef.current || !structure?.sitplanview) return;

    const handleDragOverLegacy = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDropLegacy = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedElectroItemId.current || !structure?.sitplanview) return;

      // Get drop position relative to paper
      const rect = paperRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / structure.sitplanview.getZoomFactor();
      const y = (e.clientY - rect.top) / structure.sitplanview.getZoomFactor();

      // Add element to sitplan
      const electroItem = structure.getElectroItemById(draggedElectroItemId.current);
      if (electroItem) {
        const element = structure.sitplan.addElementFromElectroItem(
          draggedElectroItemId.current,
          currentPage,
          x,
          y,
          'auto',
          '',
          'onder',
          11,
          structure.sitplan.defaults.scale,
          structure.sitplan.defaults.rotate
        );
        
        if (element) {
          structure.sitplanview.redraw();
          globalThis.undostruct.store();
          updatePageInfo();
        }
      }

      draggedElectroItemId.current = null;
    };

    paperRef.current.addEventListener('dragover', handleDragOverLegacy as any);
    paperRef.current.addEventListener('drop', handleDropLegacy as any);

    return () => {
      if (paperRef.current) {
        paperRef.current.removeEventListener('dragover', handleDragOverLegacy as any);
        paperRef.current.removeEventListener('drop', handleDropLegacy as any);
      }
    };
  }, [paperRef.current, structure, currentPage]);

  const handleUndo = () => {
    if (undostruct?.undoStackSize() > 0) {
      (globalThis as any).undoClicked();
      updatePageInfo();
    }
  };

  const handleRedo = () => {
    if (undostruct?.redoStackSize() > 0) {
      (globalThis as any).redoClicked();
      updatePageInfo();
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
    if (structure?.sitplanview) {
      structure.sitplanview.changePage(pageNum);
      updatePageInfo();
    }
  };

  const handleAddPage = () => {
    if (structure?.sitplanview) {
      structure.sitplanview.addPage();
      updatePageInfo();
    }
  };

  const handleDeletePage = () => {
    if (structure?.sitplanview) {
      structure.sitplanview.deletePage(() => {
        updatePageInfo();
      });
    }
  };

  const handleToggleInnerWall = () => {
    if (!structure?.sitplanview) return;
    
    if (wallDrawingMode === 'inner') {
      // Disable wall drawing mode
      structure.sitplanview.disableWallDrawingMode();
      setWallDrawingMode(null);
    } else {
      // Enable inner wall drawing mode
      structure.sitplanview.disableWallDrawingMode(); // Disable any existing mode first
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setFreeformShapeDrawingMode(null);
      structure.sitplanview.enableWallDrawingMode('inner');
      setWallDrawingMode('inner');
    }
  };

  const handleToggleOuterWall = () => {
    if (!structure?.sitplanview) return;
    
    if (wallDrawingMode === 'outer') {
      // Disable wall drawing mode
      structure.sitplanview.disableWallDrawingMode();
      setWallDrawingMode(null);
    } else {
      // Enable outer wall drawing mode
      structure.sitplanview.disableWallDrawingMode(); // Disable any existing mode first
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setFreeformShapeDrawingMode(null);
      structure.sitplanview.enableWallDrawingMode('outer');
      setWallDrawingMode('outer');
    }
  };

  const handleToggleLayerManager = () => {
    if (!structure?.sitplanview?.layerManager) return;
    structure.sitplanview.layerManager.toggle();
  };

  const handleToggleWhiteShape = () => {
    if (!structure?.sitplanview) return;
    
    if (freeformShapeDrawingMode === 'white') {
      // Disable freeform shape drawing mode
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setFreeformShapeDrawingMode(null);
    } else {
      // Disable any existing modes first
      structure.sitplanview.disableWallDrawingMode();
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setWallDrawingMode(null);
      // Enable white shape drawing mode
      structure.sitplanview.enableFreeformShapeDrawingMode('white');
      setFreeformShapeDrawingMode('white');
    }
  };

  const handleToggleBlackShape = () => {
    if (!structure?.sitplanview) return;
    
    if (freeformShapeDrawingMode === 'black') {
      // Disable freeform shape drawing mode
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setFreeformShapeDrawingMode(null);
    } else {
      // Disable any existing modes first
      structure.sitplanview.disableWallDrawingMode();
      structure.sitplanview.disableFreeformShapeDrawingMode();
      setWallDrawingMode(null);
      // Enable black shape drawing mode
      structure.sitplanview.enableFreeformShapeDrawingMode('black');
      setFreeformShapeDrawingMode('black');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* Ribbon for sitplan controls */}
      <div id="ribbon" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        alignItems: 'center',
        gap: '12px',
        minHeight: '48px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'auto' }}>
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={!undostruct || undostruct.undoStackSize() === 0}
            style={{
              padding: '6px 10px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: undostruct?.undoStackSize() > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              opacity: undostruct?.undoStackSize() > 0 ? 1 : 0.5,
              whiteSpace: 'nowrap'
            }}
            title="Ongedaan maken (Ctrl+Z)"
          >
            <span style={{ fontSize: '16px' }}>↶</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={!undostruct || undostruct.redoStackSize() === 0}
            style={{
              padding: '6px 10px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: undostruct?.redoStackSize() > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              opacity: undostruct?.redoStackSize() > 0 ? 1 : 0.5,
              whiteSpace: 'nowrap'
            }}
            title="Opnieuw (Ctrl+Y)"
          >
            <span style={{ fontSize: '16px' }}>↷</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Add items */}
          <button
            onClick={handleAddFromFile}
            style={{
              padding: '6px 10px',
              border: '1px solid #0d6efd',
              borderRadius: '4px',
              backgroundColor: '#0d6efd',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            title="Achtergrondafbeelding toevoegen"
          >
            <span style={{ fontSize: '16px' }}>📁</span>
            <span>Bestand</span>
          </button>
          <button
            onClick={handleAddFromSchema}
            style={{
              padding: '6px 10px',
              border: '1px solid #0d6efd',
              borderRadius: '4px',
              backgroundColor: '#0d6efd',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            title="Symbool uit schema toevoegen"
          >
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span>Schema</span>
          </button>
          <button
            onClick={handleAddCustom}
            style={{
              padding: '6px 10px',
              border: '1px solid #0d6efd',
              borderRadius: '4px',
              backgroundColor: '#0d6efd',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            title="Los symbool toevoegen"
          >
            <span style={{ fontSize: '16px' }}>➕</span>
            <span>Los</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Drawing tools group - Muren en Vormen */}
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            padding: '4px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            {/* Wall drawing buttons */}
            <button
              onClick={handleToggleInnerWall}
              style={{
                padding: '6px 10px',
                border: `2px solid ${wallDrawingMode === 'inner' ? '#28a745' : '#6c757d'}`,
                borderRadius: '4px',
                backgroundColor: wallDrawingMode === 'inner' ? '#28a745' : 'white',
                color: wallDrawingMode === 'inner' ? 'white' : '#6c757d',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
              title="Binnenmuur tekenen"
            >
              <span style={{ fontSize: '16px' }}>🧱</span>
              <span>Binnen</span>
            </button>
            <button
              onClick={handleToggleOuterWall}
              style={{
                padding: '6px 10px',
                border: `2px solid ${wallDrawingMode === 'outer' ? '#28a745' : '#495057'}`,
                borderRadius: '4px',
                backgroundColor: wallDrawingMode === 'outer' ? '#28a745' : 'white',
                color: wallDrawingMode === 'outer' ? 'white' : '#495057',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
              title="Buitenmuur tekenen"
            >
              <span style={{ fontSize: '16px' }}>🧱</span>
              <span>Buiten</span>
            </button>

            <div style={{ width: '1px', height: '100%', backgroundColor: '#ced4da', margin: '0 2px' }}></div>

            {/* Freeform shape drawing buttons */}
            <button
              onClick={handleToggleWhiteShape}
              style={{
                padding: '6px 10px',
                border: `2px solid ${freeformShapeDrawingMode === 'white' ? '#28a745' : '#6c757d'}`,
                borderRadius: '4px',
                backgroundColor: freeformShapeDrawingMode === 'white' ? '#28a745' : 'white',
                color: freeformShapeDrawingMode === 'white' ? 'white' : '#6c757d',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
              title="Witte vrije vorm tekenen"
            >
              <span style={{ fontSize: '16px' }}>⬜</span>
              <span>Wit</span>
            </button>
            <button
              onClick={handleToggleBlackShape}
              style={{
                padding: '6px 10px',
                border: `2px solid ${freeformShapeDrawingMode === 'black' ? '#28a745' : '#495057'}`,
                borderRadius: '4px',
                backgroundColor: freeformShapeDrawingMode === 'black' ? '#28a745' : 'white',
                color: freeformShapeDrawingMode === 'black' ? 'white' : '#495057',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
              title="Zwarte vrije vorm tekenen"
            >
              <span style={{ fontSize: '16px' }}>⬛</span>
              <span>Zwart</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Layer Manager */}
          <button
            onClick={handleToggleLayerManager}
            style={{
              padding: '6px 10px',
              border: '1px solid #6c757d',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#6c757d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            title="Laagbeheer tonen/verbergen"
          >
            <span style={{ fontSize: '16px' }}>🗂️</span>
            <span>Lagen</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            style={{
              padding: '6px 10px',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#dc3545',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
            title="Geselecteerde symbool verwijderen (Del)"
          >
            <span style={{ fontSize: '16px' }}>🗑️</span>
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 4px' }}></div>

          {/* Z-order */}
          <button
            onClick={handleSendBack}
            style={{
              padding: '6px 10px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
            title="Naar achter verplaatsen"
          >
            <span style={{ fontSize: '16px' }}>⬇</span>
          </button>
          <button
            onClick={handleBringFront}
            style={{
              padding: '6px 10px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
            title="Naar voor verplaatsen"
          >
            <span style={{ fontSize: '16px' }}>⬆</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Page selector */}
          {numPages > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '13px', color: '#495057' }}>Pag.</span>
              <select 
                id="id_sitplanpage" 
                value={currentPage} 
                onChange={handlePageChange}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #ced4da',
                  borderRadius: '3px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleAddPage}
                disabled={currentPage !== numPages}
                style={{
                  padding: '3px 8px',
                  border: '1px solid #28a745',
                  borderRadius: '3px',
                  backgroundColor: currentPage === numPages ? '#28a745' : '#e9ecef',
                  color: currentPage === numPages ? 'white' : '#6c757d',
                  cursor: currentPage === numPages ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                title="Nieuwe pagina toevoegen"
              >
                +
              </button>
              <button 
                onClick={handleDeletePage}
                disabled={numPages <= 1}
                style={{
                  padding: '3px 8px',
                  border: '1px solid #dc3545',
                  borderRadius: '3px',
                  backgroundColor: numPages > 1 ? '#dc3545' : '#e9ecef',
                  color: numPages > 1 ? 'white' : '#6c757d',
                  cursor: numPages > 1 ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
                title="Huidige pagina verwijderen"
              >
                🗑
              </button>
            </div>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6' }}></div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleZoomIn}
              style={{
                padding: '6px 10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap'
              }}
              title="Zoom in"
            >
              🔍+
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: '6px 10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap'
              }}
              title="Zoom uit"
            >
              🔍−
            </button>
            <button
              onClick={handleZoomToFit}
              style={{
                padding: '6px 10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px',
                whiteSpace: 'nowrap'
              }}
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
        <div id="sidebar" ref={sidebarRef}></div>
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
    </div>
  );
};
