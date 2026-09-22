/**
 * SitPlanSidebar - React component for the situation plan sidebar
 * Replaces the legacy SituationPlanView_SideBar class with React state management
 */

import React, { useState, useEffect } from 'react';
import { SituationPlanElement } from '../sitplan/SituationPlanElement';
import { WallType } from '../sitplan/WallElement';

const PRINTABLE_KRING_COLORS: Array<{ color: string | null; label: string }> = [
  { color: null, label: 'Standaard (zwart)' },
  { color: '#005a9c', label: 'Blauw' },
  { color: '#b00020', label: 'Rood' },
  { color: '#006b3c', label: 'Groen' },
  { color: '#6a1b9a', label: 'Paars' },
  { color: '#a34700', label: 'Oranje' },
  { color: '#006064', label: 'Turkoois' },
  { color: '#455a64', label: 'Leigrijs' },
];

interface KringOption {
  id: number;
  name: string;
}

interface SitPlanSidebarProps {
  selectedElement: SituationPlanElement | null;
  onClose: () => void;
  onUpdateElement: (element: SituationPlanElement) => void;
  onUpdateKringColor: (kringId: number, color: string | null) => void;
  structure: any; // TODO: Type this properly
}

export const SitPlanSidebar: React.FC<SitPlanSidebarProps> = ({
  selectedElement,
  onClose,
  onUpdateElement,
  onUpdateKringColor,
  structure,
}) => {
  const [wallType, setWallType] = useState<WallType>('inner');
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [, setColorRevision] = useState<number>(0);
  const [colorEditor, setColorEditor] = useState<{
    kringId: number;
    kringName: string;
    draftColor: string | null;
  } | null>(null);

  // Excluded types for symbol rendering
  const excludedTypes = [
    "Bord",
    "Kring",
    "Domotica",
    "Domotica module (verticaal)",
    "Domotica gestuurde verbruiker",
    "Leiding",
    "Splitsing",
    "Verlenging",
    "Vrije ruimte",
    "Meerdere verbruikers",
  ];

  // Update state when selected element changes
  useEffect(() => {
    if (!selectedElement) return;

    if (selectedElement.isWall()) {
      const wallElement = selectedElement.getWallElement();
      if (wallElement) {
        setWallType(wallElement.type);
        setX(Math.round(wallElement.x));
        setY(Math.round(wallElement.y));
        setWidth(Math.round(wallElement.width));
        setHeight(Math.round(wallElement.height));
        setRotation(Math.round(wallElement.rotate || 0));
      }
    } else if (selectedElement.isWindow()) {
      const windowElement = selectedElement.getWindowElement();
      if (windowElement) {
        setX(Math.round(windowElement.x));
        setY(Math.round(windowElement.y));
        setWidth(Math.round(windowElement.width));
        setHeight(Math.round(windowElement.height));
        setRotation(Math.round(windowElement.rotate || 0));
      }
    } else if (selectedElement.isDoor()) {
      const doorElement = selectedElement.getDoorElement();
      if (doorElement) {
        setX(Math.round(doorElement.x));
        setY(Math.round(doorElement.y));
        setWidth(Math.round(doorElement.width));
        setHeight(Math.round(doorElement.height));
        setRotation(Math.round(doorElement.rotate || 0));
      }
    } else if (selectedElement.isFreeformShape()) {
      const shapeElement = selectedElement.getFreeformShapeElement();
      if (shapeElement) {
        setX(Math.round(shapeElement.x));
        setY(Math.round(shapeElement.y));
        setWidth(Math.round(shapeElement.width));
        setHeight(Math.round(shapeElement.height));
        setRotation(Math.round(shapeElement.rotate || 0));
      }
    }
  }, [selectedElement]);

  // Handle property updates
  const handleWallTypeChange = (newType: WallType) => {
    setWallType(newType);
    if (selectedElement?.isWall()) {
      const wallElement = selectedElement.getWallElement();
      if (wallElement) {
        wallElement.type = newType;
        onUpdateElement(selectedElement);
      }
    }
  };

  const handlePositionChange = (newX: number, newY: number) => {
    setX(newX);
    setY(newY);
    
    if (selectedElement?.isWall()) {
      const wallElement = selectedElement.getWallElement();
      if (wallElement) {
        wallElement.x = newX;
        wallElement.y = newY;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isWindow()) {
      const windowElement = selectedElement.getWindowElement();
      if (windowElement) {
        windowElement.x = newX;
        windowElement.y = newY;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isDoor()) {
      const doorElement = selectedElement.getDoorElement();
      if (doorElement) {
        doorElement.x = newX;
        doorElement.y = newY;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isFreeformShape()) {
      const shapeElement = selectedElement.getFreeformShapeElement();
      if (shapeElement) {
        shapeElement.x = newX;
        shapeElement.y = newY;
        onUpdateElement(selectedElement);
      }
    }
  };

  const handleDimensionChange = (newWidth: number, newHeight: number) => {
    setWidth(newWidth);
    setHeight(newHeight);
    
    if (selectedElement?.isWall()) {
      const wallElement = selectedElement.getWallElement();
      if (wallElement) {
        wallElement.width = newWidth;
        wallElement.height = newHeight;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isWindow()) {
      const windowElement = selectedElement.getWindowElement();
      if (windowElement) {
        windowElement.width = newWidth;
        windowElement.height = newHeight;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isDoor()) {
      const doorElement = selectedElement.getDoorElement();
      if (doorElement) {
        doorElement.width = newWidth;
        doorElement.height = newHeight;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isFreeformShape()) {
      const shapeElement = selectedElement.getFreeformShapeElement();
      if (shapeElement) {
        shapeElement.width = newWidth;
        shapeElement.height = newHeight;
        onUpdateElement(selectedElement);
      }
    }
  };

  const handleRotationChange = (newRotation: number) => {
    setRotation(newRotation);
    
    if (selectedElement?.isWall()) {
      const wallElement = selectedElement.getWallElement();
      if (wallElement) {
        wallElement.rotate = newRotation;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isWindow()) {
      const windowElement = selectedElement.getWindowElement();
      if (windowElement) {
        windowElement.rotate = newRotation;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isDoor()) {
      const doorElement = selectedElement.getDoorElement();
      if (doorElement) {
        doorElement.rotate = newRotation;
        onUpdateElement(selectedElement);
      }
    } else if (selectedElement?.isFreeformShape()) {
      const shapeElement = selectedElement.getFreeformShapeElement();
      if (shapeElement) {
        shapeElement.rotate = newRotation;
        onUpdateElement(selectedElement);
      }
    }
  };

  const getKringen = (): KringOption[] => {
    const kringen: KringOption[] = [];

    for (const [index, item] of (structure?.data || []).entries()) {
      if (structure.active?.[index] === false) continue;
      if (item?.getType?.() !== 'Kring') continue;
      kringen.push({
        id: item.id,
        name: String(item.props?.naam || '').trim() || `Kring ${item.id}`,
      });
    }

    return kringen.sort((a, b) =>
      a.name.localeCompare(b.name) || a.id - b.id
    );
  };

  const openKringColorEditor = (kring: KringOption) => {
    setColorEditor({
      kringId: kring.id,
      kringName: kring.name,
      draftColor: structure.sitplan?.getKringColor?.(kring.id) || null,
    });
  };

  const confirmKringColor = () => {
    if (!colorEditor) return;
    onUpdateKringColor(colorEditor.kringId, colorEditor.draftColor);
    setColorRevision((revision) => revision + 1);
    setColorEditor(null);
  };

  const renderKringColorButton = (kring: KringOption) => {
    const color = structure.sitplan?.getKringColor?.(kring.id) || '#000000';
    return (
      <button
        type="button"
        onClick={() => openKringColorEditor(kring)}
        title={`Kleur voor kring ${kring.name}`}
        aria-label={`Kleur voor kring ${kring.name}`}
        style={{ width: '27px', height: '22px', padding: '2px', border: '1px solid #aaa', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}
      >
        <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '1px', backgroundColor: color }} />
      </button>
    );
  };

  const renderColorEditor = () => {
    if (!colorEditor) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Kleur voor kring ${colorEditor.kringName}`}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setColorEditor(null);
        }}
      >
        <div style={{ width: '330px', padding: '18px', borderRadius: '8px', background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#222' }}>Kleur voor kring {colorEditor.kringName}</h3>
          <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#666' }}>Kies een contrastrijke printkleur of een eigen kleur.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            {PRINTABLE_KRING_COLORS.map((option) => {
              const selected = colorEditor.draftColor === option.color;
              return (
                <button
                  type="button"
                  key={option.label}
                  onClick={() => setColorEditor({ ...colorEditor, draftColor: option.color })}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px', border: selected ? '2px solid #1565c0' : '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}
                >
                  <span style={{ width: '22px', height: '22px', flexShrink: 0, border: '1px solid #888', borderRadius: '3px', backgroundColor: option.color || '#000000' }} />
                  {option.label}
                </button>
              );
            })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#444' }}>
            Eigen kleur
            <input
              type="color"
              value={colorEditor.draftColor || '#000000'}
              onChange={(event) => setColorEditor({ ...colorEditor, draftColor: event.target.value })}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={() => setColorEditor(null)} className="rounded-button">Annuleren</button>
            <button type="button" onClick={confirmKringColor} className="rounded-button">Bevestigen</button>
          </div>
        </div>
      </div>
    );
  };

  // Render symbols from the schema
  const renderSymbols = () => {
    if (!structure?.data) {
      return <div style={{ padding: '15px', color: '#999', fontSize: '12px' }}>
        Geen symbolen beschikbaar. Maak eerst een eendraadschema.
      </div>;
    }

    const visited = new Set<number>();
    const itemsByKring = new Map<number, { kring: KringOption; items: any[] }>();

    if (structure?.data && Array.isArray(structure.data)) {
      const kringenById = new Map(getKringen().map((kring) => [kring.id, kring]));

      // Iterate through all items and group them by stable kring-ID.
      for (const [index, item] of structure.data.entries()) {
        if (structure.active?.[index] === false) continue;
        if (!item || visited.has(item.id)) continue;
        visited.add(item.id);
        
        const type = item.getType?.() || '';
        
        // Skip excluded types and attributes
        if (excludedTypes.includes(type) || item.isAttribuut?.()) {
          console.log(`[SitPlanSidebar] Skipping excluded type: ${type}`);
          continue;
        }
        
        const maxElements = item.maxSituationPlanElements?.();
        const currentCount = structure.sitplan?.countByElectroItemId?.(item.id) || 0;
        const canAdd = maxElements === null || currentCount < maxElements;
        
        if (!canAdd) {
          console.log(`[SitPlanSidebar] Cannot add ${item.id} (${type}): max=${maxElements}, current=${currentCount}`);
          continue;
        }
        
        const kringId = structure.findKringId?.(item.id);
        if (kringId == null) continue;

        const kring = kringenById.get(kringId);
        if (!kring) continue;

        if (!itemsByKring.has(kringId)) {
          itemsByKring.set(kringId, { kring, items: [] });
        }
        itemsByKring.get(kringId)!.items.push(item);
      }
    }

    // Render grouped items
    const items: React.ReactElement[] = [];
    
    // Sort kringen alphabetically, but retain ID as identity.
    const sortedKringen = Array.from(itemsByKring.values()).sort((a, b) =>
      a.kring.name.localeCompare(b.kring.name) || a.kring.id - b.kring.id
    );

    for (const { kring, items: kringItems } of sortedKringen) {
      const kringName = kring.name;
      const kringId = kring.id;
      
      // Filter items based on search term
      const filteredItems = kringItems.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const type = (item.getType?.() || '').toLowerCase();
        let adres = '';
        try {
          adres = (item.getReadableAdres?.() || '').toLowerCase();
        } catch (e) {
          // ignore
        }
        let tekst = '';
        try {
          if (item.props?.adres && typeof item.props.adres === 'string') {
            tekst = item.props.adres.toLowerCase();
          }
        } catch (e) {
          // ignore
        }
        
        return type.includes(searchLower) || adres.includes(searchLower) || tekst.includes(searchLower);
      });
      
      // Only show group if it has matching items
      if (filteredItems.length === 0) continue;
      
      items.push(
        <div key={`kring-${kringId}`} style={{ marginBottom: '12px' }}>
          <div style={{
            padding: '8px 8px',
            backgroundColor: '#e3f2fd',
            borderLeft: `3px solid ${structure.sitplan?.getKringColor?.(kringId) || '#1565c0'}`,
            fontSize: '11px',
            fontWeight: '600',
            color: '#0d47a1',
            marginBottom: '6px',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <span>{kringName}</span>
            {renderKringColorButton(kring)}
          </div>
          
          {filteredItems.map((item) => {
            try {
              const type = item.getType?.() || 'Onbekend';
              let adres = '';
              try {
                adres = item.getReadableAdres?.() || '';
              } catch (e) {
                // Ignore
              }
              
              let tekst = '';
              try {
                if (item.props?.adres && typeof item.props.adres === 'string') {
                  tekst = item.props.adres.trim();
                }
              } catch (e) {
                // Ignore
              }
              
              // Gebruik exact dezelfde renderer als canvas en export. Deze voegt ook
              // lokale SVG-definities toe en voorkomt globale <use>/pattern-conflicten.
              let svgContent = '';
              try {
                const previewElement = item.toSituationPlanElement?.();
                previewElement?.setElectroItemId(item.id);
                svgContent = previewElement?.getScaledSVG(false) || '';
              } catch (e) {
                console.warn(`Error getting SVG for item ${item.id}:`, e);
              }
              
              return (
                <div
                  key={item.id}
                  draggable
                  data-electroitem-id={item.id}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', item.id.toString());
                  }}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'grab',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f4ff';
                    e.currentTarget.style.borderColor = '#0078d4';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="Sleep naar het canvas om toe te voegen"
                >
                  {svgContent ? (
                    <div style={{
                      flexShrink: 0,
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      borderRadius: '3px',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      padding: '2px',
                    }}>
                      <svg
                        viewBox="0 0 60 60"
                        xmlns="http://www.w3.org/2000/svg"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                        style={{
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'block',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      flexShrink: 0,
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '3px',
                      border: '1px solid #ddd',
                      color: '#999',
                      fontSize: '9px',
                      fontWeight: 'bold',
                    }}>
                      —
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500,
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {type}
                    </div>
                    {adres && (
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {adres}
                      </div>
                    )}
                    {tekst && (
                      <div style={{
                        fontSize: '9px',
                        color: '#888',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: 'italic',
                      }}>
                        "{tekst}"
                      </div>
                    )}
                  </div>
                </div>
              );
            } catch (error) {
              console.error(`Error rendering item ${item.id}:`, error);
              return null;
            }
          })}
        </div>
      );
    }

    return items;
  };

  // If no element is selected, show available symbols
  if (!selectedElement) {
    return (
      <div style={{
        width: '280px',
        height: '100%',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #dee2e6',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '15px',
          borderBottom: '1px solid #dee2e6',
          backgroundColor: 'white',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            Beschikbare symbolen
          </h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
            Sleep symbolen naar het canvas
          </p>
          {getKringen().length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginBottom: '5px' }}>
                Kringkleuren
              </div>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                {getKringen().map((kring) => (
                  <div
                    key={kring.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 7px', borderBottom: '1px solid #eee', fontSize: '11px' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kring.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {renderKringColorButton(kring)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="Zoeken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '8px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
        }}>
          {renderSymbols()}
        </div>
        {renderColorEditor()}
      </div>
    );
  }

  // Render properties for selected element
  return (
    <div style={{
      width: '280px',
      height: '100%',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #dee2e6',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
          {selectedElement.isWall() ? 'Muur eigenschappen' :
           selectedElement.isWindow() ? 'Raam eigenschappen' :
           selectedElement.isDoor() ? 'Deur eigenschappen' :
           selectedElement.isFreeformShape() ? 'Vorm eigenschappen' :
           'Element eigenschappen'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666',
            padding: 0,
            width: '24px',
            height: '24px',
          }}
          title="Sluiten"
        >
          ×
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          
          {/* Wall Type (only for walls) */}
          {selectedElement.isWall() && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '6px',
                fontSize: '13px',
                color: '#555',
              }}>
                Muurtype
              </label>
              <select
                value={wallType}
                onChange={(e) => handleWallTypeChange(e.target.value as WallType)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
              >
                <option value="inner">Binnenmuur</option>
                <option value="outer">Buitenmuur</option>
              </select>
            </div>
          )}

          {/* Position */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '6px',
              fontSize: '13px',
              color: '#555',
            }}>
              Positie
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#777',
                  marginBottom: '4px',
                }}>
                  X (px)
                </label>
                <input
                  type="number"
                  value={x}
                  onChange={(e) => handlePositionChange(Number(e.target.value), y)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#777',
                  marginBottom: '4px',
                }}>
                  Y (px)
                </label>
                <input
                  type="number"
                  value={y}
                  onChange={(e) => handlePositionChange(x, Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '6px',
              fontSize: '13px',
              color: '#555',
            }}>
              Afmetingen
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#777',
                  marginBottom: '4px',
                }}>
                  Breedte (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleDimensionChange(Number(e.target.value), height)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#777',
                  marginBottom: '4px',
                }}>
                  Hoogte (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleDimensionChange(width, Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '6px',
              fontSize: '13px',
              color: '#555',
            }}>
              Rotatie (°)
            </label>
            <input
              type="number"
              value={rotation}
              onChange={(e) => handleRotationChange(Number(e.target.value))}
              min="0"
              max="359"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
