import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../AppContext';
import { Hierarchical_List } from '../Hierarchical_List';

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
  const [svgPanX, setSvgPanX] = useState(0);
  const [svgPanY, setSvgPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [collapsedElements, setCollapsedElements] = useState<Set<number>>(new Set());
  
  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
  
  // Add element modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [insertionMode, setInsertionMode] = useState<'add' | 'insert-before' | 'insert-after' | 'insert-child'>('add');
  const [insertionTargetId, setInsertionTargetId] = useState<number | null>(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Column widths state (stored in localStorage)
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('editor-left-width');
    return saved ? parseInt(saved) : 300;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('editor-right-width');
    return saved ? parseInt(saved) : 300;
  });

  // Debug: Log width changes
  useEffect(() => {
    console.log('Left width changed to:', leftWidth);
  }, [leftWidth]);

  useEffect(() => {
    console.log('Right width changed to:', rightWidth);
  }, [rightWidth]);
  
  // Resize state
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Save to localStorage when widths change
  useEffect(() => {
    localStorage.setItem('editor-left-width', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('editor-right-width', rightWidth.toString());
  }, [rightWidth]);

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isResizingLeft) {
        const newWidth = Math.max(250, Math.min(600, e.clientX));
        console.log('Resizing left to:', newWidth);
        setLeftWidth(newWidth);
      } else if (isResizingRight) {
        const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
        console.log('Resizing right to:', newWidth);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      console.log('Mouse up - stopping resize');
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      console.log('Started resizing:', { isResizingLeft, isResizingRight });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingLeft, isResizingRight]);

  // Close add modal when clicking outside
  useEffect(() => {
    if (!showAddModal) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('add-element-modal-overlay')) {
        setShowAddModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAddModal]);

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

      // Check if element has children
      const hasChildren = structure.data.some((child: any, idx: number) => 
        structure.active[idx] && child && child.parent === id && !(child.isAttribuut && child.isAttribuut())
      );

      elements.push({ id, type, nr, naam, adres, level, item, hasChildren });
    }

    return elements;
  }, [structure]);

  // Filter elements by search term and collapsed state
  const filteredElements = getElementList().filter((el) => {
    // First apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matches = (
        el.type.toLowerCase().includes(searchLower) ||
        el.nr.toString().includes(searchLower) ||
        el.naam.toLowerCase().includes(searchLower) ||
        el.adres.toLowerCase().includes(searchLower)
      );
      if (!matches) return false;
    }
    
    // Then check if any parent is collapsed
    let currentParent = el.item.parent;
    while (currentParent !== 0) {
      if (collapsedElements.has(currentParent)) {
        return false; // Hide if any ancestor is collapsed
      }
      const parentIndex = structure?.id.indexOf(currentParent);
      if (parentIndex === -1 || !structure) break;
      currentParent = structure.data[parentIndex].parent;
    }
    
    return true;
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

  // Toggle collapse/expand for an element
  const toggleCollapse = (id: number) => {
    setCollapsedElements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
  const handleAddElement = (electroType: string = "") => {
    if (!structure) return;
    
    const targetId = insertionTargetId || selectedElementId;
    
    if (insertionMode === 'insert-before' && targetId) {
      // Insert before the target element
      const newItem = structure.createItem(electroType);
      structure.insertItemBeforeId(newItem, targetId);
    } else if (insertionMode === 'insert-after' && targetId) {
      // Insert after the target element
      const newItem = structure.createItem(electroType);
      structure.insertItemAfterId(newItem, targetId);
    } else if (insertionMode === 'insert-child' && targetId) {
      // Insert as child of the target element
      const newItem = structure.createItem(electroType);
      structure.insertChildAfterId(newItem, targetId);
    } else if (selectedElementId) {
      // Default: Add as child of selected element
      const newItem = structure.createItem(electroType);
      structure.insertChildAfterId(newItem, selectedElementId);
    } else {
      // Add at root level (bottom)
      structure.addItem(electroType);
    }
    
    if ((globalThis as any).undostruct) {
      (globalThis as any).undostruct.store();
    }
    
    if (typeof (globalThis as any).HLRedrawTree === 'function') {
      (globalThis as any).HLRedrawTree();
    }
    
    refresh();
    setShowAddModal(false);
    setModalSearchTerm('');
    setInsertionMode('add');
    setInsertionTargetId(null);
  };

  const toggleAddModal = () => {
    if (showAddModal) {
      // Closing modal
      setShowAddModal(false);
      setInsertionMode('add');
      setInsertionTargetId(null);
    } else {
      // Opening modal
      setShowAddModal(true);
      setInsertionMode('add');
      setInsertionTargetId(null);
    }
  };

  const handleChangeType = (newType: string) => {
    if (!selectedElementId || !structure) return;
    
    structure.adjustTypeById(selectedElementId, newType);
    structure.reNumber();
    
    if ((globalThis as any).undostruct) {
      (globalThis as any).undostruct.store();
    }
    
    refresh();
    setShowChangeTypeModal(false);
  };

  const toggleChangeTypeModal = () => {
    setShowChangeTypeModal(!showChangeTypeModal);
  };

  // Get allowed child types for selected element
  const getAllowedChildTypes = useCallback((): string[] => {
    if (!selectedElementId || !structure) {
      // If nothing selected, return most common root types
      return ['Aansluiting', 'Bord', 'Kring', 'Aansluitpunt'];
    }

    const electroItem = structure.getElectroItemById(selectedElementId);
    if (!electroItem || typeof electroItem.allowedChilds !== 'function') {
      return [];
    }

    const allowed = electroItem.allowedChilds();
    // Filter out empty strings and separators
    return allowed.filter((type: string) => type !== "" && type !== "---");
  }, [selectedElementId, structure]);

  // Get allowed types based on insertion mode
  const getAllowedTypesForInsertion = useCallback((): string[] => {
    if (!structure) return [];

    const targetId = insertionTargetId || selectedElementId;
    
    if (insertionMode === 'insert-child') {
      // For insert-child, get allowed children of the target
      if (!targetId) return [];
      const electroItem = structure.getElectroItemById(targetId);
      if (!electroItem || typeof electroItem.allowedChilds !== 'function') {
        return [];
      }
      const allowed = electroItem.allowedChilds();
      return allowed.filter((type: string) => type !== "" && type !== "---");
    } else if (insertionMode === 'insert-before' || insertionMode === 'insert-after') {
      // For insert-before/after, get allowed children of the parent
      if (!targetId) return [];
      const electroItem = structure.getElectroItemById(targetId);
      if (!electroItem) return [];
      const parent = electroItem.getParent();
      if (!parent || typeof parent.allowedChilds !== 'function') {
        // Root level elements
        return ['Aansluiting', 'Zekering/differentieel', 'Kring'];
      }
      const allowed = parent.allowedChilds();
      return allowed.filter((type: string) => type !== "" && type !== "---");
    } else {
      // Default 'add' mode - get allowed children of selected element
      if (!selectedElementId) {
        return ['Aansluiting', 'Bord', 'Kring', 'Aansluitpunt'];
      }
      const electroItem = structure.getElectroItemById(selectedElementId);
      if (!electroItem || typeof electroItem.allowedChilds !== 'function') {
        return [];
      }
      const allowed = electroItem.allowedChilds();
      return allowed.filter((type: string) => type !== "" && type !== "---");
    }
  }, [insertionMode, insertionTargetId, selectedElementId, structure]);

  // Get allowed types for changing the type of selected element
  const getAllowedTypesForChange = useCallback((): string[] => {
    if (!selectedElementId || !structure) {
      return [];
    }

    const electroItem = structure.getElectroItemById(selectedElementId);
    if (!electroItem) return [];

    const parent = electroItem.getParent();
    if (!parent || typeof parent.allowedChilds !== 'function') {
      // Root level elements
      return ['Aansluiting', 'Zekering/differentieel', 'Kring'];
    }

    const allowed = parent.allowedChilds();
    // Filter out empty strings and separators
    return allowed.filter((type: string) => type !== "" && type !== "---");
  }, [selectedElementId, structure]);

  // Element types grouped by category
  const elementTypes = {
    'Algemeen': [
      'Aansluiting',
      'Bord',
      'Kring',
      'Leiding',
      'Splitsing',
      'Zekering/differentieel',
    ],
    'Verbruikers': [
      'Lichtpunt',
      'Contactdoos',
      'Verbruiker',
      'Meerdere verbruikers',
    ],
    'Schakelaars': [
      'Schakelaars',
      'Drukknop',
      'Lichtcircuit',
    ],
    'Toestellen': [
      'Boiler',
      'Wasmachine',
      'Droogkast',
      'Vaatwasmachine',
      'Koelkast',
      'Diepvriezer',
      'Kookfornuis',
      'Elektrische oven',
      'Microgolfoven',
      'Stoomoven',
      'Ketel',
      'Verwarmingstoestel',
      'Warmtepomp/airco',
    ],
    'Speciale elementen': [
      'Zonnepaneel',
      'Omvormer',
      'Batterij',
      'EV lader',
      'Elektriciteitsmeter',
      'Transformator',
      'Motor',
      'Ventilator',
    ],
    'Domotica': [
      'Domotica',
      'Domotica module (verticaal)',
      'Domotica gestuurde verbruiker',
    ],
    'Overige': [
      'Aftakdoos',
      'Aardingsonderbreker',
      'Overspanningsbeveiliging',
      'USB lader',
      'Media',
      'Bel',
      'Zeldzame symbolen',
      'Vrije tekst',
      'Vrije ruimte',
    ],
  };


  const handleInsertBefore = () => {
    if (selectedElementId) {
      setInsertionMode('insert-before');
      setInsertionTargetId(selectedElementId);
      setShowAddModal(true);
    }
  };

  const handleInsertAfter = () => {
    if (selectedElementId) {
      setInsertionMode('insert-after');
      setInsertionTargetId(selectedElementId);
      setShowAddModal(true);
    }
  };

  const handleInsertChild = (parentId?: number) => {
    const id = parentId || selectedElementId;
    if (id) {
      setInsertionMode('insert-child');
      setInsertionTargetId(id);
      setShowAddModal(true);
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
    
    // Add a slight opacity to show it's being dragged
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the list item entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverItemId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItemId || draggedItemId === targetId) {
      setDragOverItemId(null);
      return;
    }

    if (!structure) return;

    // Find indices in the structure
    const draggedIndex = structure.id.indexOf(draggedItemId);
    const targetIndex = structure.id.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverItemId(null);
      return;
    }

    // Use the move functions to reorder
    // If moving down, we need to move multiple times
    if (draggedIndex < targetIndex) {
      for (let i = draggedIndex; i < targetIndex; i++) {
        if (typeof (globalThis as any).HLMoveDown === 'function') {
          (globalThis as any).HLMoveDown(draggedItemId);
        }
      }
    } else {
      // Moving up
      for (let i = draggedIndex; i > targetIndex; i--) {
        if (typeof (globalThis as any).HLMoveUp === 'function') {
          (globalThis as any).HLMoveUp(draggedItemId);
        }
      }
    }

    setDragOverItemId(null);
    setSelectedElementId(draggedItemId);
    refresh();
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
  const handleZoomReset = () => {
    setSvgZoom(1);
    setSvgPanX(0);
    setSvgPanY(0);
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      // Reset zoom and pan when entering fullscreen
      setSvgZoom(1);
      setSvgPanX(0);
      setSvgPanY(0);
    }
  };

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Pan handlers
  const handlePanStart = (e: React.MouseEvent) => {
    // Only start pan on middle mouse button or when space is held
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStartX(e.clientX - svgPanX);
      setPanStartY(e.clientY - svgPanY);
    }
  };

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      setSvgPanX(e.clientX - panStartX);
      setSvgPanY(e.clientY - panStartY);
    }
  }, [isPanning, panStartX, panStartY]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Setup pan event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  // Apply zoom and pan transform to fullscreen SVG
  useEffect(() => {
    if (isFullscreen) {
      const fullscreenEDS = document.getElementById('EDS-fullscreen');
      if (fullscreenEDS) {
        const svgElement = fullscreenEDS.querySelector('svg');
        if (svgElement) {
          svgElement.style.transform = `translate(${svgPanX}px, ${svgPanY}px) scale(${svgZoom})`;
          svgElement.style.transformOrigin = 'center center';
        }
      }
    }
  }, [isFullscreen, svgZoom, svgPanX, svgPanY]);

  // Get SVG content
  const getSVGContent = () => {
    if (!structure) return '';
    
    const svgData = structure.toSVG(0, 'horizontal').data;
    const flattenSVGfromString = (globalThis as any).flattenSVGfromString || ((str: string) => str);
    let svg = flattenSVGfromString(svgData, 10);
    
    // Extract original viewBox or width/height from SVG
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const widthMatch = svg.match(/width="([^"]+)"/);
    const heightMatch = svg.match(/height="([^"]+)"/);
    
    let viewBox = '';
    if (viewBoxMatch) {
      const [x, y, w, h] = viewBoxMatch[1].split(' ').map(Number);
      // Scale viewBox inversely to zoom (zoom in = smaller viewBox)
      const scaledW = w / svgZoom;
      const scaledH = h / svgZoom;
      viewBox = `0 0 ${scaledW} ${scaledH}`;
      svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${viewBox}"`);
    } else if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]);
      const h = parseFloat(heightMatch[1]);
      const scaledW = w / svgZoom;
      const scaledH = h / svgZoom;
      viewBox = `0 0 ${scaledW} ${scaledH}`;
      svg = svg.replace(/<svg/, `<svg viewBox="${viewBox}"`);
    }
    
    // Make SVG fill container
    svg = svg.replace(/width="[^"]+"/, 'width="100%"');
    svg = svg.replace(/height="[^"]+"/, 'height="100%"');
    
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
        
        // Get the actual clicked element
        const clickedElement = e.target as SVGElement;
        console.log(`SVG element clicked: ${elementId}, element:`, clickedElement);
        
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

      // Attach click and hover handlers only to leaf elements
      leafElements.forEach((element) => {
        const elementId = parseInt((element as SVGElement).getAttribute('data-element-id') || '0');
        if (elementId === 0) return;

        // All elements are clickable with pointer cursor
        (element as SVGElement).style.cursor = 'pointer';
        (element as SVGElement).style.transition = 'opacity 0.2s, filter 0.2s';
        
        // Add larger clickable area by wrapping element if it's not already a group
        if (element.tagName !== 'g') {
          try {
            const bbox = (element as SVGGraphicsElement).getBBox();
            const padding = 10; // Pixels of padding around element for easier clicking
            
            // Create invisible rect for larger click area
            const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            clickArea.setAttribute('x', String(bbox.x - padding));
            clickArea.setAttribute('y', String(bbox.y - padding));
            clickArea.setAttribute('width', String(bbox.width + padding * 2));
            clickArea.setAttribute('height', String(bbox.height + padding * 2));
            clickArea.setAttribute('fill', 'transparent');
            clickArea.setAttribute('stroke', 'none');
            clickArea.setAttribute('data-element-id', String(elementId));
            clickArea.style.cursor = 'pointer';
            clickArea.style.pointerEvents = 'all';
            
            // Insert click area before the element
            element.parentNode?.insertBefore(clickArea, element);
            
            // Add click handler to click area too
            const clickAreaHandler = (e: Event) => handleClick(e, elementId);
            clickArea.addEventListener('click', clickAreaHandler);
            (clickArea as any).__clickHandler = clickAreaHandler;
          } catch (error) {
            console.warn('Could not create click area for element', element, error);
          }
        }
        
        // Add click handler
        const clickHandler = (e: Event) => handleClick(e, elementId);
        element.addEventListener('click', clickHandler);
        (element as any).__clickHandler = clickHandler;
        
        // Add hover handlers
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

  // Attach event handlers to fullscreen SVG
  useEffect(() => {
    if (!isFullscreen || !structure) return;

    const timer = setTimeout(() => {
      const fullscreenEDS = document.getElementById('EDS-fullscreen');
      if (!fullscreenEDS) return;

      // Same logic as regular SVG
      const allElements = fullscreenEDS.querySelectorAll('[data-element-id]');
      const leafElements: Element[] = [];
      
      allElements.forEach((element) => {
        const hasNestedElements = element.querySelectorAll('[data-element-id]').length > 0;
        if (!hasNestedElements) {
          leafElements.push(element);
        }
      });

      const handleClick = (e: Event, elementId: number) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedElementId(elementId);
        
        const listElement = document.querySelector(`.simple-hierarchy-item[data-id="${elementId}"]`);
        if (listElement) {
          listElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };

      leafElements.forEach((element) => {
        const elementId = parseInt((element as SVGElement).getAttribute('data-element-id') || '0');
        if (elementId === 0) return;
        
        const clickHandler = (e: Event) => handleClick(e, elementId);
        element.addEventListener('click', clickHandler);
        (element as any).__clickHandler = clickHandler;
        
        element.setAttribute('style', (element.getAttribute('style') || '') + ';cursor:pointer;');
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isFullscreen, structure, selectedElementId]);

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


      {/* 3-column layout with resizable columns */}
      <div id="canvas_3col" style={{ display: 'flex', height: 'calc(100vh - 60px)', width: '100%' }}>
        {/* Left column: Element list */}
        <div 
          id="left_col_3" 
          style={{ 
            width: leftWidth,
            minWidth: 250,
            maxWidth: 600,
            overflowY: 'auto', 
            borderRight: '1px solid #ddd',
            flexShrink: 0,
            flexGrow: 0
          }}
        >
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
              <button className="simple-add-btn" onClick={toggleAddModal}>
                ➕ Nieuw element toevoegen
              </button>
            </div>
            
            <ul className="simple-hierarchy-list">
              {filteredElements.map((el) => (
                <li
                  key={el.id}
                  className={`simple-hierarchy-item ${selectedElementId === el.id ? 'selected' : ''} ${dragOverItemId === el.id ? 'drag-over' : ''} ${draggedItemId === el.id ? 'dragging' : ''}`}
                  data-id={el.id}
                  data-level={el.level}
                  style={{ paddingLeft: `${el.level * 20 + 12}px` }}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, el.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, el.id)}
                >
                  {/* Collapse/Expand button for elements with children */}
                  {el.hasChildren && (
                    <button
                      className="simple-collapse-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(el.id);
                      }}
                      title={collapsedElements.has(el.id) ? "Uitklappen" : "Inklappen"}
                    >
                      {collapsedElements.has(el.id) ? '▶' : '▼'}
                    </button>
                  )}
                  {!el.hasChildren && <span className="simple-collapse-spacer"></span>}
                  
                  <div className="simple-item-icon" onClick={() => selectElement(el.id)}>
                    {getTypeIcon(el.type)}
                  </div>
                  <div className="simple-item-content" onClick={() => selectElement(el.id)}>
                    <div className="simple-item-title">
                      {el.type} {el.nr ? `#${el.nr}` : ''}
                    </div>
                    <div className="simple-item-subtitle">{el.naam || el.adres || ''}</div>
                  </div>
                  <div className="simple-item-actions">
                    <button
                      className="simple-item-action-btn move-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp();
                        selectElement(el.id);
                      }}
                      title="Verplaats omhoog"
                    >
                      ↑
                    </button>
                    <button
                      className="simple-item-action-btn move-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown();
                        selectElement(el.id);
                      }}
                      title="Verplaats omlaag"
                    >
                      ↓
                    </button>
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
                      className="simple-item-action-btn clone-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectElement(el.id);
                        handleClone();
                      }}
                      title="Dupliceer element"
                    >
                      📋
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

        {/* Resize handle for left column */}
        <div 
          className="column-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            console.log('Left resize handle clicked');
            setIsResizingLeft(true);
          }}
          style={{
            width: '5px',
            cursor: 'col-resize',
            backgroundColor: isResizingLeft ? 'var(--primary-color)' : 'transparent',
            transition: 'background-color 0.2s',
            flexShrink: 0,
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={(e) => {
            if (!isResizingLeft) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3px',
            height: '40px',
            borderRadius: '2px',
            backgroundColor: isResizingLeft ? 'var(--primary-color)' : '#cbd5e1'
          }} />
        </div>

        {/* Middle column: SVG diagram - takes remaining space */}
        <div id="middle_col_3" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '12px', 
          overflow: 'hidden',
          minWidth: '400px'
        }}>
          <div id="middle_col_3_inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', padding: '12px', background: '#f8f9fa', borderRadius: '8px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📐 Tekening</span>
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>💡 Shift + klik en sleep om te pannen</span>
            </h3>
            
            <div 
              className="simple-svg-container"
              style={{ 
                flex: 1,
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: '#f5f5f5',
                marginTop: '12px',
                minHeight: 0,
                width: '100%',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Zoom controls - positioned absolutely inside container */}
              <div className="svg-zoom-controls">
                <button className="svg-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
                <button className="svg-zoom-btn" onClick={handleZoomOut} title="Zoom uit">−</button>
                <button className="svg-zoom-btn" onClick={handleZoomReset} title="Reset zoom">⊙</button>
                <button 
                  className="svg-zoom-btn" 
                  onClick={() => setHighlightEnabled(!highlightEnabled)}
                  title={highlightEnabled ? "Highlighting uitschakelen" : "Highlighting inschakelen"}
                  style={{ 
                    background: highlightEnabled ? 'var(--primary-color)' : '#e0e0e0',
                    color: highlightEnabled ? 'white' : '#666'
                  }}
                >
                  {highlightEnabled ? '🎨' : '⬜'}
                </button>
                <button 
                  className="svg-zoom-btn" 
                  onClick={toggleFullscreen}
                  title="Volledig scherm"
                >
                  ⛶
                </button>
              </div>

              {/* EDS SVG content */}
              <div 
                id="EDS" 
                onMouseDown={handlePanStart}
                style={{ 
                  width: '100%',
                  height: '100%',
                  cursor: isPanning ? 'grabbing' : 'grab',
                  transform: `translate(${svgPanX}px, ${svgPanY}px)`,
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
                dangerouslySetInnerHTML={{ __html: getSVGContent() }}
              />
            </div>
          </div>
        </div>

        {/* Resize handle for right column */}
        <div 
          className="column-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            console.log('Right resize handle clicked');
            setIsResizingRight(true);
          }}
          style={{
            width: '5px',
            cursor: 'col-resize',
            backgroundColor: isResizingRight ? 'var(--primary-color)' : 'transparent',
            transition: 'background-color 0.2s',
            flexShrink: 0,
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={(e) => {
            if (!isResizingRight) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3px',
            height: '40px',
            borderRadius: '2px',
            backgroundColor: isResizingRight ? 'var(--primary-color)' : '#cbd5e1'
          }} />
        </div>

        {/* Right column: Properties panel */}
        <div 
          id="right_col_3" 
          style={{ 
            width: rightWidth,
            minWidth: 250,
            maxWidth: 600,
            overflowY: 'auto',
            flexShrink: 0,
            flexGrow: 0
          }}
        >
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
                  <div>
                    <h2>
                      {selectedElement.getType()} {selectedElement.props.nr ? `#${selectedElement.props.nr}` : ''}
                    </h2>
                    <div className="element-type">ID: {selectedElementId}</div>
                  </div>
                  <button 
                    className="change-type-btn"
                    onClick={toggleChangeTypeModal}
                    title="Wijzig element type"
                  >
                    🔄 Type wijzigen
                  </button>
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

      {/* Add Element Modal */}
      {showAddModal && (() => {
        const allowedTypes = getAllowedTypesForInsertion();
        const filteredCategories = Object.entries(elementTypes)
          .map(([category, types]) => ({
            category,
            types: types.filter(type => 
              allowedTypes.includes(type) && 
              (!modalSearchTerm || type.toLowerCase().includes(modalSearchTerm.toLowerCase()))
            )
          }))
          .filter(({ types }) => types.length > 0);

        let modalTitle = '✨ Nieuw element toevoegen';
        if (insertionMode === 'insert-before') {
          modalTitle = '⬆️ Element invoegen ervoor';
        } else if (insertionMode === 'insert-after') {
          modalTitle = '⬇️ Element invoegen erna';
        } else if (insertionMode === 'insert-child') {
          modalTitle = '➕ Kind-element toevoegen';
        } else if (selectedElementId) {
          modalTitle = '✨ Element toevoegen aan geselecteerd item';
        }

        return (
          <div className="add-element-modal-overlay" onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('add-element-modal-overlay')) {
              setShowAddModal(false);
              setModalSearchTerm('');
              setInsertionMode('add');
              setInsertionTargetId(null);
            }
          }}>
            <div className="add-element-modal">
              <div className="add-element-modal-header">
                <h2>{modalTitle}</h2>
                <button 
                  className="add-element-modal-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalSearchTerm('');
                    setInsertionMode('add');
                    setInsertionTargetId(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="add-element-modal-search">
                <input
                  type="text"
                  placeholder="🔍 Zoek element type..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  autoFocus
                />
                {modalSearchTerm && (
                  <button 
                    className="modal-search-clear"
                    onClick={() => setModalSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="add-element-modal-content">
                {filteredCategories.length === 0 ? (
                  <div className="add-element-modal-empty">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      {modalSearchTerm ? '�' : '�🚫'}
                    </div>
                    <p>
                      {modalSearchTerm 
                        ? `Geen resultaten voor "${modalSearchTerm}"`
                        : 'Geen elementen kunnen worden toegevoegd aan dit item'}
                    </p>
                  </div>
                ) : (
                  filteredCategories.map(({ category, types }) => (
                    <div key={category} className="add-element-category">
                      <h3 className="add-element-category-title">{category}</h3>
                      <div className="add-element-cards">
                        {types.map((type) => (
                          <div
                            key={type}
                            className="add-element-card"
                            onClick={() => handleAddElement(type)}
                          >
                            <div className="add-element-card-preview">
                              {getElementPreviewSVG(type)}
                            </div>
                            <div className="add-element-card-name">{type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Change Type Modal */}
      {showChangeTypeModal && selectedElementId && (() => {
        const allowedTypes = getAllowedTypesForChange();
        const filteredCategories = Object.entries(elementTypes)
          .map(([category, types]) => ({
            category,
            types: types.filter(type => 
              allowedTypes.includes(type) && 
              (!modalSearchTerm || type.toLowerCase().includes(modalSearchTerm.toLowerCase()))
            )
          }))
          .filter(({ types }) => types.length > 0);

        return (
          <div className="add-element-modal-overlay" onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('add-element-modal-overlay')) {
              setShowChangeTypeModal(false);
              setModalSearchTerm('');
            }
          }}>
            <div className="add-element-modal">
              <div className="add-element-modal-header">
                <h2>
                  🔄 Wijzig element type
                </h2>
                <button 
                  className="add-element-modal-close"
                  onClick={() => {
                    setShowChangeTypeModal(false);
                    setModalSearchTerm('');
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="add-element-modal-search">
                <input
                  type="text"
                  placeholder="🔍 Zoek element type..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  autoFocus
                />
                {modalSearchTerm && (
                  <button 
                    className="modal-search-clear"
                    onClick={() => setModalSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="add-element-modal-content">
                {filteredCategories.length === 0 ? (
                  <div className="add-element-modal-empty">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      {modalSearchTerm ? '�' : '�🚫'}
                    </div>
                    <p>
                      {modalSearchTerm 
                        ? `Geen resultaten voor "${modalSearchTerm}"`
                        : 'Geen alternatieve types beschikbaar'}
                    </p>
                  </div>
                ) : (
                  filteredCategories.map(({ category, types }) => (
                    <div key={category} className="add-element-category">
                      <h3 className="add-element-category-title">{category}</h3>
                      <div className="add-element-cards">
                        {types.map((type) => (
                          <div
                            key={type}
                            className="add-element-card"
                            onClick={() => handleChangeType(type)}
                          >
                            <div className="add-element-card-preview">
                              {getElementPreviewSVG(type)}
                            </div>
                            <div className="add-element-card-name">{type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen SVG overlay */}
      {isFullscreen && (
        <div 
          className="svg-fullscreen-overlay"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains('svg-fullscreen-overlay')) {
              setIsFullscreen(false);
            }
          }}
        >
          <div className="svg-fullscreen-container">
            {/* Fullscreen controls */}
            <div className="svg-fullscreen-controls">
              <button className="svg-zoom-btn" onClick={handleZoomIn} title="Zoom in">+</button>
              <button className="svg-zoom-btn" onClick={handleZoomOut} title="Zoom uit">−</button>
              <button className="svg-zoom-btn" onClick={handleZoomReset} title="Reset zoom">⊙</button>
              <button 
                className="svg-zoom-btn" 
                onClick={() => setHighlightEnabled(!highlightEnabled)}
                title={highlightEnabled ? "Highlighting uitschakelen" : "Highlighting inschakelen"}
                style={{ 
                  background: highlightEnabled ? 'var(--primary-color)' : '#e0e0e0',
                  color: highlightEnabled ? 'white' : '#666'
                }}
              >
                {highlightEnabled ? '🎨' : '⬜'}
              </button>
              <button 
                className="svg-zoom-btn svg-fullscreen-close" 
                onClick={() => setIsFullscreen(false)}
                title="Volledig scherm sluiten (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Fullscreen SVG content */}
            <div 
              id="EDS-fullscreen" 
              onMouseDown={handlePanStart}
              style={{ 
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPanning ? 'grabbing' : 'grab'
              }}
              dangerouslySetInnerHTML={{ __html: getSVGContent() }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to generate SVG preview for element type
function getElementPreviewSVG(type: string): React.ReactElement {
  try {
    // Create a temporary structure to generate the SVG
    const tempStructure = new Hierarchical_List();
    const tempItem = tempStructure.createItem(type);
    
    if (!tempItem || typeof tempItem.toSVG !== 'function') {
      return <div className="add-element-card-fallback">{getElementIcon(type)}</div>;
    }

    // Generate the SVG
    const svgElement = tempItem.toSVG();
    
    if (!svgElement || !svgElement.data) {
      return <div className="add-element-card-fallback">{getElementIcon(type)}</div>;
    }

    // Calculate viewBox dimensions with proper bounds
    // SVG coordinates: xleft is to the left (positive), xright is to the right (positive)
    // yup is upwards (positive), ydown is downwards (positive)
    const totalWidth = (svgElement.xleft || 0) + (svgElement.xright || 0);
    const totalHeight = (svgElement.yup || 0) + (svgElement.ydown || 0);
    
    // ViewBox should start at negative xleft and negative yup
    const viewBoxX = -(svgElement.xleft || 0);
    const viewBoxY = -(svgElement.yup || 0);
    
    // Add padding (10%)
    const paddingX = totalWidth * 0.1;
    const paddingY = totalHeight * 0.1;
    
    const viewBox = `${viewBoxX - paddingX} ${viewBoxY - paddingY} ${totalWidth + paddingX * 2} ${totalHeight + paddingY * 2}`;
    
    console.log('SVG bounds for', type, ':', { 
      xleft: svgElement.xleft, 
      xright: svgElement.xright, 
      yup: svgElement.yup, 
      ydown: svgElement.ydown, 
      totalWidth, 
      totalHeight,
      viewBoxX,
      viewBoxY,
      viewBox 
    });

    return (
      <svg 
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="add-element-card-svg"
        dangerouslySetInnerHTML={{ __html: svgElement.data }}
      />
    );
  } catch (error) {
    console.error('Error generating SVG preview for', type, error);
    return <div className="add-element-card-fallback">{getElementIcon(type)}</div>;
  }
}

// Helper function to get icon for element type (fallback)
function getElementIcon(type: string): string {
  const iconMap: Record<string, string> = {
    'Aansluiting': '🔌',
    'Bord': '📋',
    'Kring': '⚡',
    'Leiding': '〰️',
    'Splitsing': '🔀',
    'Zekering/differentieel': '🛡️',
    'Lichtpunt': '💡',
    'Contactdoos': '🔌',
    'Verbruiker': '⚙️',
    'Meerdere verbruikers': '⚙️⚙️',
    'Schakelaars': '🎚️',
    'Drukknop': '🔘',
    'Lichtcircuit': '💡',
    'Boiler': '🔥',
    'Wasmachine': '🧺',
    'Droogkast': '🌀',
    'Vaatwasmachine': '🍽️',
    'Koelkast': '❄️',
    'Diepvriezer': '🧊',
    'Kookfornuis': '🍳',
    'Elektrische oven': '🔥',
    'Microgolfoven': '📻',
    'Stoomoven': '♨️',
    'Ketel': '☕',
    'Verwarmingstoestel': '🌡️',
    'Warmtepomp/airco': '❄️',
    'Zonnepaneel': '☀️',
    'Omvormer': '⚡',
    'Batterij': '🔋',
    'EV lader': '🚗',
    'Elektriciteitsmeter': '📊',
    'Transformator': '⚡',
    'Motor': '⚙️',
    'Ventilator': '💨',
    'Domotica': '🏠',
    'Domotica module (verticaal)': '🏠',
    'Domotica gestuurde verbruiker': '🏠',
    'Aftakdoos': '📦',
    'Aardingsonderbreker': '⚠️',
    'Overspanningsbeveiliging': '🛡️',
    'USB lader': '🔌',
    'Media': '📺',
    'Bel': '🔔',
    'Zeldzame symbolen': '🔣',
    'Vrije tekst': '📝',
    'Vrije ruimte': '⬜',
    'Aansluitpunt': '📍',
  };
  
  return iconMap[type] || '⚡';
}

export default SimpleHierarchyView;
