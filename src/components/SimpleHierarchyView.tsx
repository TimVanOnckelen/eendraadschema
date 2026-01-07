import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../AppContext';

/**
 * SimpleHierarchyView React Component
 * Left side: Simple list of all elements
 * Middle: SVG diagram
 * Right side: Properties editor for selected element
 */
const SimpleHierarchyView: React.FC = () => {
  const { structure, setStructure } = useApp();
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [svgZoom, setSvgZoom] = useState(1);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  // Re-render when structure changes
  const [, forceUpdate] = useState({});
  const refresh = useCallback(() => {
    // Sync globalThis.structure to React state to trigger re-render
    if ((globalThis as any).structure) {
      setStructure((globalThis as any).structure);
    }
    forceUpdate({});
  }, [setStructure]);

  // Expose refresh function globally so HL* functions can call it
  useEffect(() => {
    // Register refresh callback with the legacy SimpleHierarchyView class
    if ((window as any).simpleHierarchyView) {
      (window as any).simpleHierarchyView.setRefreshCallback(refresh);
    }
    return () => {
      if ((window as any).simpleHierarchyView) {
        (window as any).simpleHierarchyView.setRefreshCallback(null);
      }
    };
  }, [refresh]);

  // Get element list
  const getElementList = useCallback(() => {
    if (!structure) return [];

    const elements: any[] = [];
    for (let i = 0; i < structure.length; i++) {
      if (!structure.active[i]) continue;

      const item = structure.data[i];
      if (!item) continue;
      if ((item as any).isAttribuut && (item as any).isAttribuut()) continue;

      const id = structure.id[i];
      const type = (item as any).getType ? (item as any).getType() : item.props?.type || 'Unknown';
      const nr = item.props?.nr || '';
      const naam = item.props?.naam || '';
      const adres = item.props?.adres || '';

      // Calculate indentation level
      let level = 0;
      let currentParent = item.parent;
      while (currentParent !== 0 && level < 10) {
        level++;
        const parentIndex = structure.id.indexOf(currentParent);
        if (parentIndex === -1) break;
        currentParent = structure.data[parentIndex].parent;
      }

      elements.push({ id, type, nr, naam, adres, level, item });
    }

    return elements;
  }, [structure]);

  // Filter elements by search term
  const filteredElements = getElementList().filter((el) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      el.type.toLowerCase().includes(searchLower) ||
      el.nr.toString().includes(searchLower) ||
      el.naam.toLowerCase().includes(searchLower) ||
      el.adres.toLowerCase().includes(searchLower)
    );
  });

  // Get icon for element type
  const getTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      Bord: '📋',
      Kring: '🔌',
      Lichtpunt: '💡',
      Contactdoos: '🔌',
      Schakelaar: '🎚️',
      Zekering: '⚡',
      Splitsing: '↔️',
      Aansluiting: '🔗',
      Domotica: '🏠',
      default: '📦',
    };
    return icons[type] || icons['default'];
  };

  // Handle element selection
  const selectElement = (id: number) => {
    setSelectedElementId(id);
    
    // Highlight in SVG
    document.querySelectorAll('[data-element-id]').forEach((el) => {
      el.classList.remove('svg-highlighted');
    });
    const svgElement = document.querySelector(`[data-element-id="${id}"]`);
    if (svgElement) {
      svgElement.classList.add('svg-highlighted');
    }
  };

  // Handle property changes
  const handlePropertyChange = (propertyName: string, value: string | boolean, inputType: string) => {
    if (!structure || selectedElementId === null) return;

    const electroItem = structure.getElectroItemById(selectedElementId);
    if (!electroItem) return;

    switch (inputType) {
      case 'select-one':
        if (propertyName === 'type') {
          structure.adjustTypeById(selectedElementId, value as string);
          structure.reNumber();
        } else {
          electroItem.props[propertyName] = value as string;
          structure.reNumber();
        }
        break;
      case 'text':
        electroItem.props[propertyName] = value as string;
        structure.reNumber();
        break;
      case 'checkbox':
        electroItem.props[propertyName] = value as boolean;
        structure.reNumber();
        break;
    }

    if (electroItem.getType() === 'Domotica gestuurde verbruiker') {
      structure.voegAttributenToeAlsNodigEnReSort();
    }

    // Store for undo
    if ((globalThis as any).undostruct) {
      (globalThis as any).undostruct.store();
    }

    // Trigger re-render
    refresh();
  };

  // Action handlers
  const handleAddElement = () => {
    if (typeof (globalThis as any).HLAdd === 'function') {
      (globalThis as any).HLAdd();
      refresh();
    }
  };

  const handleInsertBefore = () => {
    if (selectedElementId && typeof (globalThis as any).HLInsertBefore === 'function') {
      (globalThis as any).HLInsertBefore(selectedElementId);
      refresh();
    }
  };

  const handleInsertAfter = () => {
    if (selectedElementId && typeof (globalThis as any).HLInsertAfter === 'function') {
      (globalThis as any).HLInsertAfter(selectedElementId);
      refresh();
    }
  };

  const handleInsertChild = (parentId?: number) => {
    const id = parentId || selectedElementId;
    if (id && typeof (globalThis as any).HLInsertChild === 'function') {
      (globalThis as any).HLInsertChild(id);
      refresh();
    }
  };

  const handleClone = () => {
    if (selectedElementId && typeof (globalThis as any).HLClone === 'function') {
      (globalThis as any).HLClone(selectedElementId);
      refresh();
    }
  };

  const handleMoveUp = () => {
    if (selectedElementId && typeof (globalThis as any).HLMoveUp === 'function') {
      (globalThis as any).HLMoveUp(selectedElementId);
      refresh();
    }
  };

  const handleMoveDown = () => {
    if (selectedElementId && typeof (globalThis as any).HLMoveDown === 'function') {
      (globalThis as any).HLMoveDown(selectedElementId);
      refresh();
    }
  };

  const handleDelete = (id?: number) => {
    const elementId = id || selectedElementId;
    if (!elementId) return;
    
    if (confirm('Weet je zeker dat je dit element wilt verwijderen?')) {
      if (typeof (globalThis as any).HLDelete === 'function') {
        (globalThis as any).HLDelete(elementId);
        setSelectedElementId(null);
        refresh();
      }
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsDialog(false);
  };

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (structure && structure.properties) {
      structure.properties.filename = formData.get('filename') as string || 'eendraadschema.eds';
      
      // Convert plain text to HTML (replace newlines with <br>)
      const ownerText = formData.get('owner') as string || '';
      structure.properties.owner = ownerText.replace(/\n/g, '<br>');
      
      const installerText = formData.get('installer') as string || '';
      structure.properties.installer = installerText.replace(/\n/g, '<br>');
      
      structure.properties.info = formData.get('info') as string || '';
      
      // Save to undo stack
      if ((globalThis as any).undostruct) {
        (globalThis as any).undostruct.store();
      }
    }
    
    setShowSettingsDialog(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setSvgZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setSvgZoom((z) => Math.max(z - 0.2, 0.5));
  const handleZoomReset = () => setSvgZoom(1);

  // Get SVG content
  const getSVGContent = () => {
    if (!structure) return '';
    
    const svgData = structure.toSVG(0, 'horizontal').data;
    const flattenSVGfromString = (globalThis as any).flattenSVGfromString || ((str: string) => str);
    let svg = flattenSVGfromString(svgData, 10);
    
    // Add data-element-id attributes to make SVG interactive
    // The SVG uses id attributes like "svg_p1_0" where the last number is the element ID
    // Also add to <g> tags that wrap elements
    svg = svg.replace(/(<g[^>]*id="svg_p\d+_(\d+)"[^>]*)>/g, (match, openTag, elementId) => {
      return `${openTag} data-element-id="${elementId}" class="svg-element">`;
    });
    
    // Also add to standalone elements with svg_p IDs
    svg = svg.replace(/(<(?:rect|circle|path|line|polyline|polygon|text|ellipse)[^>]*id="svg_p\d+_(\d+)"[^>]*)>/g, (match, openTag, elementId) => {
      if (!openTag.includes('data-element-id')) {
        return `${openTag} data-element-id="${elementId}" class="svg-element">`;
      }
      return match;
    });
    
    return svg;
  };

  // Attach SVG click handlers (React-native implementation)
  useEffect(() => {
    // Small delay to ensure SVG is fully rendered
    const timer = setTimeout(() => {
      const edsDiv = document.getElementById('EDS');
      if (!edsDiv) {
        console.log('EDS div not found');
        return;
      }

      const svg = edsDiv.querySelector('svg');
      if (!svg) {
        console.log('SVG not found');
        return;
      }

      // Find all elements with data-element-id attribute
      const elements = svg.querySelectorAll('[data-element-id]');
      console.log(`Found ${elements.length} clickable SVG elements`);
      
      // Filter to only get the "deepest" elements (not parent containers)
      const leafElements = Array.from(elements).filter((element) => {
        // Check if this element contains other elements with data-element-id
        const childrenWithId = element.querySelectorAll('[data-element-id]');
        // Only include if it has no children with data-element-id (it's a leaf)
        return childrenWithId.length === 0;
      });
      console.log(`Found ${leafElements.length} leaf elements for hover`);
      
      const handleClick = (e: Event, elementId: number) => {
        e.stopPropagation();
        e.preventDefault();
        console.log(`SVG element clicked: ${elementId}`);
        setSelectedElementId(elementId);
        
        // Scroll to element in list
        setTimeout(() => {
          const listElement = document.querySelector(`.simple-hierarchy-item[data-id="${elementId}"]`);
          if (listElement) {
            listElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 50);
      };

      const handleMouseEnter = (e: Event, element: Element) => {
        if (!highlightEnabled) return; // Skip if highlighting is disabled
        e.stopPropagation(); // Prevent parent elements from getting hover effect
        const svgElement = element as SVGElement;
        
        // Store original fill/stroke for restoration
        (element as any).__originalFill = svgElement.getAttribute('fill') || svgElement.style.fill;
        (element as any).__originalStroke = svgElement.getAttribute('stroke') || svgElement.style.stroke;
        
        // Apply red color
        svgElement.style.fill = 'red';
        svgElement.style.stroke = 'red';
      };

      const handleMouseLeave = (e: Event, element: Element) => {
        if (!highlightEnabled) return; // Skip if highlighting is disabled
        e.stopPropagation();
        const svgElement = element as SVGElement;
        
        // Restore original colors
        const originalFill = (element as any).__originalFill;
        const originalStroke = (element as any).__originalStroke;
        
        if (originalFill) {
          svgElement.style.fill = originalFill;
        } else {
          svgElement.style.fill = '';
        }
        
        if (originalStroke) {
          svgElement.style.stroke = originalStroke;
        } else {
          svgElement.style.stroke = '';
        }
      };

      // Attach click and hover handlers
      elements.forEach((element) => {
        const elementId = parseInt((element as SVGElement).getAttribute('data-element-id') || '0');
        if (elementId === 0) return;

        // All elements are clickable
        (element as SVGElement).style.cursor = 'pointer';
        
        const clickHandler = (e: Event) => handleClick(e, elementId);
        element.addEventListener('click', clickHandler);
        (element as any).__clickHandler = clickHandler;
      });

      // Only leaf elements get hover effects
      leafElements.forEach((element) => {
        (element as SVGElement).style.transition = 'opacity 0.2s, filter 0.2s';
        
        const mouseEnterHandler = (e: Event) => handleMouseEnter(e, element);
        const mouseLeaveHandler = (e: Event) => handleMouseLeave(e, element);
        
        element.addEventListener('mouseenter', mouseEnterHandler);
        element.addEventListener('mouseleave', mouseLeaveHandler);
        
        // Store handlers for cleanup
        (element as any).__mouseEnterHandler = mouseEnterHandler;
        (element as any).__mouseLeaveHandler = mouseLeaveHandler;
      });

      // Highlight the currently selected element in purple
      if (selectedElementId && highlightEnabled) {
        const selectedElements = svg.querySelectorAll(`[data-element-id="${selectedElementId}"]`);
        selectedElements.forEach((element) => {
          const svgElement = element as SVGElement;
          
          // Create a semi-transparent purple overlay using a rectangle
          const bbox = (element as any).getBBox?.();
          if (bbox) {
            // Remove any existing highlight
            const existingHighlight = svg.querySelector(`#highlight-${selectedElementId}`);
            if (existingHighlight) {
              existingHighlight.remove();
            }
            
            // Create highlight rectangle
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            highlight.setAttribute('id', `highlight-${selectedElementId}`);
            highlight.setAttribute('x', String(bbox.x - 2));
            highlight.setAttribute('y', String(bbox.y - 2));
            highlight.setAttribute('width', String(bbox.width + 4));
            highlight.setAttribute('height', String(bbox.height + 4));
            highlight.setAttribute('fill', '#667eea');
            highlight.setAttribute('fill-opacity', '0.2');
            highlight.setAttribute('stroke', '#667eea');
            highlight.setAttribute('stroke-width', '2');
            highlight.setAttribute('rx', '4');
            highlight.style.pointerEvents = 'none';
            
            // Insert before the element to not block it
            element.parentNode?.insertBefore(highlight, element);
          }
        });
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
    };
  }, [structure, selectedElementId, highlightEnabled]); // Re-attach when structure, selection, or highlight setting changes

  // Get selected element
  const selectedElement = selectedElementId && structure 
    ? structure.getElectroItemById(selectedElementId) 
    : null;

  // Get element HTML for properties
  const getElementPropertiesHTML = () => {
    if (!selectedElement) return '';
    
    let html = selectedElement.toHTML('edit');
    
    // Remove action buttons
    html = html.replace(/<button[^>]*class="button-[^"]*"[^>]*>.*?<\/button>/g, '');
    
    // Clean up formatting
    html = html.replace(/,\s*([A-Za-zΔ])/g, '<br>$1');
    html = html.replace(/,\s*<br>/g, '<br>');
    html = html.replace(/,\s*$/g, '');
    html = html.replace(/<br>/g, '<br><br>');
    html = html.replace(/(&nbsp;){2,}/g, '&nbsp;');
    
    return html;
  };

  // Attach change handlers to property form
  useEffect(() => {
    if (!selectedElement) return;

    const propertyForm = document.querySelector('.simple-properties-form');
    if (!propertyForm) return;

    const handleChange = (e: Event) => {
      const input = e.target as HTMLInputElement | HTMLSelectElement;
      if (!input.id.startsWith('HL_edit_')) return;

      const match = input.id.match(/^HL_edit_(\d+)_(.+)$/);
      if (!match) return;

      const propertyName = match[2];
      let value: string | boolean;
      let inputType: string;

      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox') {
          value = input.checked;
          inputType = 'checkbox';
        } else {
          value = input.value;
          inputType = 'text';
        }
      } else {
        value = input.value;
        inputType = 'select-one';
      }

      handlePropertyChange(propertyName, value, inputType);
    };

    propertyForm.addEventListener('change', handleChange);
    return () => propertyForm.removeEventListener('change', handleChange);
  }, [selectedElement, structure]);

  return (
    <>
      {/* SVG Definitions */}
      <svg id="svgdefs" style={{ position: 'absolute', width: 0, height: 0 }}>
        <pattern id="VerticalStripe" x="5" y="0" width="5" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke="black" />
        </pattern>
      </svg>


      {/* 3-column layout: 1/3/1 ratio (20% - 60% - 20%) */}
      <div id="canvas_3col" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Left column: Element list */}
        <div id="left_col_3" style={{ flex: '1', minWidth: '250px', maxWidth: '400px', overflowY: 'auto', borderRight: '1px solid #ddd' }}>
          <div id="left_col_3_inner">
            <div className="simple-hierarchy-header">
              <h3 style={{ margin: 0 }}>📋 Elementen</h3>
              <button 
                className="simple-settings-btn" 
                onClick={handleOpenSettings}
                title="Algemene instellingen"
              >
                ⚙️
              </button>
            </div>
            
            <div className="simple-hierarchy-search">
              <input
                type="text"
                placeholder="🔍 Zoek element..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="simple-hierarchy-add-section">
              <button className="simple-add-btn" onClick={handleAddElement}>
                ➕ Nieuw element toevoegen
              </button>
            </div>
            
            <ul className="simple-hierarchy-list">
              {filteredElements.map((el) => (
                <li
                  key={el.id}
                  className={`simple-hierarchy-item ${selectedElementId === el.id ? 'selected' : ''}`}
                  data-id={el.id}
                  data-level={el.level}
                  onClick={() => selectElement(el.id)}
                  style={{ paddingLeft: `${el.level * 20 + 12}px` }}
                >
                  <div className="simple-item-icon">{getTypeIcon(el.type)}</div>
                  <div className="simple-item-content">
                    <div className="simple-item-title">
                      {el.type} {el.nr ? `#${el.nr}` : ''}
                    </div>
                    <div className="simple-item-subtitle">{el.naam || el.adres || ''}</div>
                  </div>
                  <div className="simple-item-actions">
                    <button
                      className="simple-item-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertChild(el.id);
                      }}
                      title="Voeg kind toe"
                    >
                      ↳
                    </button>
                    <button
                      className="simple-item-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(el.id);
                      }}
                      title="Verwijder"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle column: SVG diagram - 3x the size of left/right */}
        <div id="middle_col_3" style={{ flex: 3, overflowY: 'auto', padding: '12px' }}>
          <div id="middle_col_3_inner">
            <div className="simple-svg-container">
              <h3 style={{ margin: '0 0 12px 0', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                📐 Tekening
              </h3>
              
              <div className="svg-zoom-controls">
                <button className="svg-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
                <button className="svg-zoom-btn" onClick={handleZoomOut} title="Zoom uit">−</button>
                <button className="svg-zoom-btn" onClick={handleZoomReset} title="Reset zoom">⊙</button>
                <button 
                  className="svg-zoom-btn" 
                  onClick={() => setHighlightEnabled(!highlightEnabled)}
                  title={highlightEnabled ? "Highlighting uitschakelen" : "Highlighting inschakelen"}
                  style={{ 
                    background: highlightEnabled ? '#667eea' : '#e0e0e0',
                    color: highlightEnabled ? 'white' : '#666'
                  }}
                >
                  {highlightEnabled ? '🎨' : '⬜'}
                </button>
              </div>
              
              <div 
                id="EDS" 
                style={{ transform: `scale(${svgZoom})`, transformOrigin: 'top left' }}
                dangerouslySetInnerHTML={{ __html: getSVGContent() }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Properties panel */}
        <div id="right_col_3" style={{ flex: '1', minWidth: '250px', maxWidth: '400px', overflowY: 'auto', borderLeft: '1px solid #ddd' }}>
          <div id="right_col_3_inner">
            {!selectedElement ? (
              <div className="simple-properties-empty">
                <div className="simple-properties-empty-icon">📝</div>
                <div className="simple-properties-empty-text">
                  Selecteer een element om te bewerken
                </div>
              </div>
            ) : (
              <div className="simple-properties-panel">
                <div className="simple-properties-header">
                  <h2>
                    {selectedElement.getType()} {selectedElement.props.nr ? `#${selectedElement.props.nr}` : ''}
                  </h2>
                  <div className="element-type">ID: {selectedElementId}</div>
                </div>

                <div 
                  className="simple-properties-form"
                  dangerouslySetInnerHTML={{ __html: getElementPropertiesHTML() }}
                />

                <div className="simple-properties-actions">
                  <button className="simple-action-btn" onClick={handleInsertBefore}>
                    ⬆️ Voeg toe voor
                  </button>
                  <button className="simple-action-btn" onClick={handleInsertAfter}>
                    ⬇️ Voeg toe na
                  </button>
                  <button className="simple-action-btn" onClick={() => handleInsertChild()}>
                    ↳ Voeg kind toe
                  </button>
                  <button className="simple-action-btn" onClick={handleClone}>
                    📋 Dupliceer
                  </button>
                  <button className="simple-action-btn" onClick={handleMoveUp}>
                    ⬆️ Omhoog
                  </button>
                  <button className="simple-action-btn" onClick={handleMoveDown}>
                    ⬇️ Omlaag
                  </button>
                  <button className="simple-action-btn danger" onClick={() => handleDelete()}>
                    🗑️ Verwijder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      {showSettingsDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#667eea' }}>⚙️ Algemene Instellingen</h2>
            
            <form onSubmit={handleSaveSettings}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Bestandsnaam:
                </label>
                <input
                  type="text"
                  name="filename"
                  defaultValue={structure?.properties?.filename || 'eendraadschema.eds'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Eigenaar/Klant:
                </label>
                <textarea
                  name="owner"
                  rows={5}
                  defaultValue={structure?.properties?.owner?.replace(/<br>/g, '\n') || ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Naam&#10;Straat & nr&#10;Postcode & gemeente&#10;Tel: ...&#10;e-mail: ..."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Installateur:
                </label>
                <textarea
                  name="installer"
                  rows={5}
                  defaultValue={structure?.properties?.installer?.replace(/<br>/g, '\n') || ''}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Naam&#10;Straat & nr&#10;Postcode & gemeente&#10;Tel: ...&#10;e-mail: ..."
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Installatie informatie:
                </label>
                <input
                  type="text"
                  name="info"
                  defaultValue={structure?.properties?.info || '1 x 230V + N ~50 Hz'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseSettings}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleHierarchyView;
