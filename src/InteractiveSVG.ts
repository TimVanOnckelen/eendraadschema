/**
 * InteractiveSVG - Make the electrical schema SVG interactive
 *
 * This module adds click handlers to SVG elements so users can:
 * - Click on an element to edit its properties
 * - Right-click to show context menu with actions
 * - Double-click to add a child element
 */

interface ContextMenuOption {
  label: string;
  icon?: string;
  action: (id: number) => void;
  divider?: boolean;
}

class InteractiveSVG {
  private contextMenu: HTMLElement | null = null;
  private selectedElementId: number | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize interactive SVG functionality
   */
  initialize() {
    // Create context menu element
    this.createContextMenu();

    // Add global click listener to close context menu
    document.addEventListener("click", () => this.hideContextMenu());

    // Listen for SVG redraws to re-attach handlers
    this.observeSVGChanges();
  }

  /**
   * Attach interactive handlers to the SVG
   */
  attachHandlers() {
    const edsDiv = document.getElementById("EDS");
    if (!edsDiv) return;

    const svg = edsDiv.querySelector("svg");
    if (!svg) return;

    // Make the SVG clickable
    svg.style.cursor = "default";

    // Disable drag & drop on the SVG to prevent interference with clicks
    svg.setAttribute("draggable", "false");
    svg.style.userSelect = "none";

    // Prevent default drag behavior
    svg.addEventListener("dragstart", (e) => e.preventDefault());
    svg.addEventListener("drop", (e) => e.preventDefault());

    // Add event listeners to all SVG groups
    this.attachGroupHandlers(svg);
  }

  /**
   * Attach handlers to SVG groups
   */
  private attachGroupHandlers(svg: SVGElement) {
    // Find all groups with data-element-id attribute
    const groups = svg.querySelectorAll("g[data-element-id]");

    groups.forEach((group) => {
      const elementId = parseInt(
        (group as SVGElement).getAttribute("data-element-id") || "0"
      );
      if (elementId === 0) return;

      // Add visual feedback on hover
      (group as SVGElement).style.cursor = "pointer";

      // Single click - highlight and show quick actions
      group.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleElementClick(elementId, group as SVGElement);
      });

      // Double click - edit element
      group.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        this.handleElementDoubleClick(elementId);
      });

      // Right click - context menu
      group.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mouseEvent = e as MouseEvent;
        this.showContextMenu(elementId, mouseEvent.clientX, mouseEvent.clientY);
      });
    });
  }

  /**
   * Handle single click on element - show properties panel
   */
  private handleElementClick(elementId: number, element: SVGElement) {
    // Unhighlight previously selected element
    document.querySelectorAll("[data-element-id]").forEach((el) => {
      el.classList.remove("svg-selected");
      el.classList.remove("svg-highlighted");
    });

    this.selectedElementId = elementId;
    element.classList.add("svg-selected");
    element.classList.add("svg-highlighted");

    // Update SimpleHierarchyView selection if it exists
    if ((window as any).simpleHierarchyView) {
      // Directly update the selected ID and list item, without re-rendering
      (window as any).simpleHierarchyView.selectedElementId = elementId;

      // Update list selection visually
      document.querySelectorAll(".simple-hierarchy-item").forEach((item) => {
        item.classList.remove("selected");
      });
      const selectedItem = document.querySelector(
        `.simple-hierarchy-item[data-id="${elementId}"]`
      );
      if (selectedItem) {
        selectedItem.classList.add("selected");
      }

      // Render only the properties panel, preserving scroll position
      (window as any).simpleHierarchyView.renderPropertiesPanel(true);
    } else {
      // Fallback: Show properties panel
      this.showPropertiesPanel(elementId, element);
    }
  }

  /**
   * Handle double click on element - scroll to it in the list
   */
  private handleElementDoubleClick(elementId: number) {
    // Find the element in the left panel and scroll to it
    const listElement = document.getElementById(`id_elem_${elementId}`);
    if (listElement) {
      listElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Flash the element to show it
      listElement.style.backgroundColor = "#fffacd";
      setTimeout(() => {
        listElement.style.backgroundColor = "";
      }, 1000);
    }
  }

  /**
   * Highlight an SVG element
   */
  private highlightElement(element: SVGElement, selected: boolean = false) {
    const rect = (element as any).getBBox();
    const existingHighlight = element.querySelector(".svg-highlight");

    if (existingHighlight) existingHighlight.remove();

    const highlight = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    highlight.setAttribute("class", "svg-highlight");
    highlight.setAttribute("x", String(rect.x - 2));
    highlight.setAttribute("y", String(rect.y - 2));
    highlight.setAttribute("width", String(rect.width + 4));
    highlight.setAttribute("height", String(rect.height + 4));
    highlight.setAttribute("fill", "none");
    highlight.setAttribute("stroke", selected ? "#667eea" : "#adb5bd");
    highlight.setAttribute("stroke-width", selected ? "2" : "1");
    highlight.setAttribute("stroke-dasharray", selected ? "" : "4");
    highlight.setAttribute("rx", "4");
    highlight.style.pointerEvents = "none";

    element.insertBefore(highlight, element.firstChild);
  }

  /**
   * Remove highlight from an SVG element
   */
  private unhighlightElement(element: SVGElement) {
    const highlight = element.querySelector(".svg-highlight");
    if (highlight) highlight.remove();
  }

  /**
   * Show properties panel for editing
   */
  private showPropertiesPanel(elementId: number, element: SVGElement) {
    // Remove existing panel
    const existing = document.getElementById("svg-properties-panel");
    if (existing) existing.remove();

    const electroItem = (globalThis as any).structure.getElectroItemById(
      elementId
    );
    if (!electroItem) return;

    // Create panel
    const panel = document.createElement("div");
    panel.id = "svg-properties-panel";
    panel.className = "svg-properties-panel";

    // Get element info
    const elementType = electroItem.getType();
    const elementNr = electroItem.props.nr || "";

    panel.innerHTML = `
            <div class="svg-properties-header">
                <h3>${elementType} ${elementNr}</h3>
                <button class="svg-properties-close" onclick="document.getElementById('svg-properties-panel')?.remove();">✕</button>
            </div>
            <div class="svg-properties-content">
                <div class="svg-properties-info">
                    <strong>Type:</strong> ${elementType}<br>
                    ${
                      elementNr
                        ? `<strong>Nummer:</strong> ${elementNr}<br>`
                        : ""
                    }
                </div>
                <div class="svg-properties-actions">
                    <button class="svg-prop-btn svg-prop-edit" onclick="event.stopPropagation(); document.getElementById('id_elem_${elementId}')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('svg-properties-panel')?.remove();">
                        <span>✏️</span> Bewerk eigenschappen
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLInsertBefore(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>⬆️</span> Voeg toe voor
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLInsertAfter(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>⬇️</span> Voeg toe na
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLInsertChild(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>↳</span> Voeg kind toe
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLClone(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>📋</span> Dupliceer
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLMoveUp(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>⬆️</span> Verplaats omhoog
                    </button>
                    <button class="svg-prop-btn" onclick="event.stopPropagation(); HLMoveDown(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>⬇️</span> Verplaats omlaag
                    </button>
                    <button class="svg-prop-btn svg-prop-delete" onclick="event.stopPropagation(); window.deleteElementWithConfirm(${elementId}); document.getElementById('svg-properties-panel')?.remove();">
                        <span>🗑️</span> Verwijder
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(panel);

    // Position panel to the right of the diagram
    const rightCol = document.getElementById("right_col");
    if (rightCol) {
      const rect = rightCol.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.left = `${rect.right + 20}px`;
      panel.style.top = `${rect.top + 20}px`;
    }
  }

  /**
   * Show quick action toolbar (keep for backwards compatibility)
   */
  /**
   * Show quick action toolbar (keep for backwards compatibility)
   */
  private showQuickActions(elementId: number, element: SVGElement) {
    // Redirect to properties panel
    this.showPropertiesPanel(elementId, element);
  }

  /**
   * Create context menu
   */
  private createContextMenu() {
    this.contextMenu = document.createElement("div");
    this.contextMenu.id = "svg-context-menu";
    this.contextMenu.className = "svg-context-menu";
    this.contextMenu.style.display = "none";
    document.body.appendChild(this.contextMenu);
  }

  /**
   * Show context menu
   */
  private showContextMenu(elementId: number, x: number, y: number) {
    if (!this.contextMenu) return;

    const electroItem = (globalThis as any).structure.getElectroItemById(
      elementId
    );
    if (!electroItem) return;

    const gl = globalThis as any;

    const menuOptions: ContextMenuOption[] = [
      {
        label: "Bewerk eigenschappen",
        icon: "✏️",
        action: (id) => {
          const listElement = document.getElementById(`id_elem_${id}`);
          if (listElement)
            listElement.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
      { label: "", divider: true, action: () => {} },
      {
        label: "Voeg toe voor",
        icon: "⬆️",
        action: (id) => gl.HLInsertBefore(id),
      },
      {
        label: "Voeg toe na",
        icon: "⬇️",
        action: (id) => gl.HLInsertAfter(id),
      },
      {
        label: "Voeg kind toe",
        icon: "↳",
        action: (id) => gl.HLInsertChild(id),
      },
      { label: "", divider: true, action: () => {} },
      {
        label: "Dupliceer",
        icon: "📋",
        action: (id) => gl.HLClone(id),
      },
      {
        label: "Verplaats omhoog",
        icon: "⬆️",
        action: (id) => gl.HLMoveUp(id),
      },
      {
        label: "Verplaats omlaag",
        icon: "⬇️",
        action: (id) => gl.HLMoveDown(id),
      },
      { label: "", divider: true, action: () => {} },
      {
        label: "Verwijder",
        icon: "🗑️",
        action: (id) => {
          window.deleteElementWithConfirm(id);
        },
      },
    ];

    this.contextMenu.innerHTML = menuOptions
      .map((option) => {
        if (option.divider) {
          return '<div class="svg-context-menu-divider"></div>';
        }
        return `
                <div class="svg-context-menu-item" onclick="event.stopPropagation(); window.interactiveSVG.executeContextAction(${elementId}, '${
          option.label
        }')">
                    ${
                      option.icon
                        ? `<span class="menu-icon">${option.icon}</span>`
                        : ""
                    }
                    <span>${option.label}</span>
                </div>
            `;
      })
      .join("");

    // Store actions for execution
    (this.contextMenu as any).__actions = menuOptions;

    // Position menu
    this.contextMenu.style.display = "block";
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
  }

  /**
   * Execute context menu action
   */
  executeContextAction(elementId: number, label: string) {
    if (!this.contextMenu) return;
    const actions = (this.contextMenu as any).__actions as ContextMenuOption[];
    const action = actions.find((a) => a.label === label);
    if (action) {
      action.action(elementId);
    }
    this.hideContextMenu();
  }

  /**
   * Hide context menu
   */
  private hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = "none";
    }
  }

  /**
   * Observe SVG changes and re-attach handlers
   */
  private observeSVGChanges() {
    const observer = new MutationObserver(() => {
      // Debounce to avoid multiple calls
      setTimeout(() => this.attachHandlers(), 100);
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

export { InteractiveSVG };
