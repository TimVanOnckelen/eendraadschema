import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../AppContext';

/**
 * SimpleHierarchyView React Component
 * Left side: Simple list of all elements
 * Middle: SVG diagram
 * Right side: Properties editor for selected element
 */
const SimpleHierarchyView: React.FC = () => {
  const { structure } = useApp();
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [svgZoom, setSvgZoom] = useState(1);

  // Re-render when structure changes
  const [, forceUpdate] = useState({});
  const refresh = useCallback(() => forceUpdate({}), []);

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
    if (typeof (globalThis as any).openSettings === 'function') {
      (globalThis as any).openSettings();
    }
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
    return flattenSVGfromString(svgData, 10);
  };

  // Re-attach interactive SVG handlers after SVG renders
  useEffect(() => {
    if ((window as any).interactiveSVG) {
      setTimeout(() => {
        (window as any).interactiveSVG.attachHandlers();
      }, 100);
    }
  }, [structure, selectedElementId]);

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

      {/* Ribbon (toolbar) */}
      <div id="ribbon" style={{ display: 'flex' }}>
        <div id="left-icons" className="left-icons"></div>
        <div id="right-icons" className="right-icons"></div>
      </div>

      {/* 3-column layout */}
      <div id="canvas_3col" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        {/* Left column: Element list */}
        <div id="left_col_3" style={{ width: '300px', overflowY: 'auto', borderRight: '1px solid #ddd' }}>
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

        {/* Middle column: SVG diagram */}
        <div id="middle_col_3" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div id="middle_col_3_inner">
            <div className="simple-svg-container">
              <h3 style={{ margin: '0 0 12px 0', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                📐 Tekening
              </h3>
              
              <div className="svg-zoom-controls">
                <button className="svg-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
                <button className="svg-zoom-btn" onClick={handleZoomOut} title="Zoom uit">−</button>
                <button className="svg-zoom-btn" onClick={handleZoomReset} title="Reset zoom">⊙</button>
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
        <div id="right_col_3" style={{ width: '350px', overflowY: 'auto', borderLeft: '1px solid #ddd' }}>
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
    </>
  );
};

export default SimpleHierarchyView;
