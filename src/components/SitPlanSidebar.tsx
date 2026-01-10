/**
 * SitPlanSidebar - React component for the situation plan sidebar
 * Replaces the legacy SituationPlanView_SideBar class with React state management
 */

import React, { useState, useEffect } from 'react';
import { SituationPlanElement } from '../sitplan/SituationPlanElement';
import { WallType } from '../sitplan/WallElement';
import { Electro_Item } from '../List_Item/Electro_Item';
import { Hierarchical_List } from '../Hierarchical_List';

interface SitPlanSidebarProps {
  selectedElement: SituationPlanElement | null;
  onClose: () => void;
  onUpdateElement: (element: SituationPlanElement) => void;
  structure: any; // TODO: Type this properly
}

export const SitPlanSidebar: React.FC<SitPlanSidebarProps> = ({
  selectedElement,
  onClose,
  onUpdateElement,
  structure,
}) => {
  const [wallType, setWallType] = useState<WallType>('inner');
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

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

  // Render symbols from the schema
  const renderSymbols = () => {
    if (!structure?.data) {
      return <div style={{ padding: '15px', color: '#999', fontSize: '12px' }}>
        Geen symbolen beschikbaar. Maak eerst een eendraadschema.
      </div>;
    }

    const items: React.ReactElement[] = [];
    const visited = new Set<number>();
    
    const collectItems = (list: any, depth: number = 0): any[] => {
      if (depth > 20) return [];
      
      // Handle both array and Hierarchical_List object
      let dataArray: any[];
      if (Array.isArray(list)) {
        dataArray = list;
      } else if (list?.data && Array.isArray(list.data)) {
        dataArray = list.data;
      } else {
        return [];
      }
      
      const collected: any[] = [];
      for (const item of dataArray) {
        if (!item || visited.has(item.id)) continue;
        visited.add(item.id);
        
        const type = item.getType?.() || '';
        
        // Skip excluded types, attributes, and items that can't be added
        if (excludedTypes.includes(type) || item.isAttribuut?.()) continue;
        
        const maxElements = item.maxSituationPlanElements?.();
        const currentCount = structure.sitplan?.countByElectroItemId?.(item.id) || 0;
        const canAdd = maxElements === null || currentCount < maxElements;
        
        if (!canAdd) continue;
        
        collected.push(item);
        
        // Process children recursively
        if (item.Parent_Item) {
          collected.push(...collectItems(item.Parent_Item, depth + 1));
        }
      }
      
      return collected;
    };
    
    const allItems = collectItems(structure.data);
    
    for (const item of allItems) {
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
        
        // Get SVG
        let svgContent = '';
        try {
          const svgElement = item.toSVG?.(true, false);
          if (svgElement?.data) {
            svgContent = svgElement.data;
          }
        } catch (e) {
          console.warn(`Error getting SVG for item ${item.id}:`, e);
        }
        
        items.push(
          <div
            key={item.id}
            draggable
            data-electroitem-id={item.id}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('text/plain', item.id.toString());
            }}
            onDragEnd={(e) => {
              // Drag ended
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8f4ff';
              e.currentTarget.style.borderColor = '#0078d4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
            title="Sleep naar het canvas om toe te voegen"
          >
            {svgContent && (
              <div style={{
                flexShrink: 0,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 60 60"
                  xmlns="http://www.w3.org/2000/svg"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
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
      }
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
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
        }}>
          {renderSymbols()}
        </div>
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
