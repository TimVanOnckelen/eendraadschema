/**
 * SimpleHierarchyView - Simplified list view with properties panel
 * Left side: Simple list of all elements
 * Right side: Properties editor for selected element
 */

class SimpleHierarchyView {
  private selectedElementId: number | null = null;

  constructor() {
    // Empty constructor - initialization happens when render is called
  }

  /**
   * Render the simple hierarchy view
   */
  render() {
    console.log("SimpleHierarchyView: Rendering...");

    // Make sure we're in 2col view
    if ((globalThis as any).toggleAppView) {
      (globalThis as any).toggleAppView("2col");
    }

    this.renderList();
    this.renderPropertiesPanel();
  }

  /**
   * Render the left side list
   */
  private renderList() {
    console.log("SimpleHierarchyView: renderList() called");
    const leftColInner = document.getElementById("left_col_inner");
    if (!leftColInner) {
      console.error("SimpleHierarchyView: left_col_inner not found!");
      return;
    }

    const structure = (globalThis as any).structure;
    if (!structure) {
      console.error("SimpleHierarchyView: structure not found!");
      return;
    }

    console.log("SimpleHierarchyView: Building list...");

    let html = '<div class="simple-hierarchy-search">';
    html +=
      '<input type="text" placeholder="🔍 Zoek element..." id="simple-search-input">';
    html += "</div>";
    html += '<div class="simple-hierarchy-add-section">';
    html +=
      '<button class="simple-add-btn" onclick="HLAdd(); simpleHierarchyView.render();">➕ Nieuw element toevoegen</button>';
    html += "</div>";
    html += '<ul class="simple-hierarchy-list">';

    console.log("SimpleHierarchyView: Structure length:", structure.length);

    // Iterate through all elements
    for (let i = 0; i < structure.length; i++) {
      if (!structure.active[i]) {
        console.log(
          `SimpleHierarchyView: Skipping inactive item at index ${i}`
        );
        continue;
      }

      const item = structure.data[i];
      if (!item) {
        console.log(`SimpleHierarchyView: No item at index ${i}`);
        continue;
      }

      if (item.isAttribuut && item.isAttribuut()) {
        console.log(`SimpleHierarchyView: Skipping attribuut at index ${i}`);
        continue;
      }

      console.log(`SimpleHierarchyView: Adding item ${i}:`, item);
      const id = structure.id[i];
      const type = item.getType
        ? item.getType()
        : item.props?.type || "Unknown";
      const nr = item.props?.nr || "";
      const naam = item.props?.naam || "";
      const adres = item.props?.adres || "";

      // Calculate indentation level
      const level = this.getElementLevel(structure, i);

      // Create subtitle
      let subtitle = type;
      if (nr) subtitle += ` #${nr}`;
      if (naam) subtitle += ` - ${naam}`;
      if (adres) subtitle += ` (${adres})`;

      // Get icon
      const icon = this.getTypeIcon(type);

      html += `<li class="simple-hierarchy-item" data-id="${id}" data-level="${level}" onclick="simpleHierarchyView.selectElement(${id})">`;
      html += `  <div class="simple-item-icon">${icon}</div>`;
      html += `  <div class="simple-item-content">`;
      html += `    <div class="simple-item-title">${type} ${
        nr ? "#" + nr : ""
      }</div>`;
      html += `    <div class="simple-item-subtitle">${
        naam || adres || ""
      }</div>`;
      html += `  </div>`;
      html += `</li>`;
    }

    html += "</ul>";
    leftColInner.innerHTML = html;

    console.log("SimpleHierarchyView: List HTML set");

    // Add search functionality
    const searchInput = document.getElementById(
      "simple-search-input"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.filterList((e.target as HTMLInputElement).value)
      );
    }
  }

  /**
   * Get element indentation level
   */
  private getElementLevel(structure: any, index: number): number {
    let level = 0;
    let currentParent = structure.data[index].parent;

    while (currentParent !== 0 && level < 10) {
      level++;
      const parentIndex = structure.id.indexOf(currentParent);
      if (parentIndex === -1) break;
      currentParent = structure.data[parentIndex].parent;
    }

    return level;
  }

  /**
   * Get icon for element type
   */
  private getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      Bord: "📋",
      Kring: "🔌",
      Lichtpunt: "💡",
      Contactdoos: "🔌",
      Schakelaar: "🎚️",
      Zekering: "⚡",
      Splitsing: "↔️",
      Aansluiting: "🔗",
      Domotica: "🏠",
      default: "📦",
    };
    return icons[type] || icons["default"];
  }

  /**
   * Filter list based on search term
   */
  private filterList(searchTerm: string) {
    const items = document.querySelectorAll(".simple-hierarchy-item");
    const term = searchTerm.toLowerCase();

    items.forEach((item) => {
      const text = item.textContent?.toLowerCase() || "";
      if (text.includes(term)) {
        (item as HTMLElement).style.display = "flex";
      } else {
        (item as HTMLElement).style.display = "none";
      }
    });
  }

  /**
   * Select an element
   */
  selectElement(id: number) {
    this.selectedElementId = id;

    // Update list selection
    document.querySelectorAll(".simple-hierarchy-item").forEach((item) => {
      item.classList.remove("selected");
    });
    const selectedItem = document.querySelector(
      `.simple-hierarchy-item[data-id="${id}"]`
    );
    if (selectedItem) {
      selectedItem.classList.add("selected");
    }

    // Highlight the element in SVG
    this.highlightSVGElement(id);

    // Render properties panel
    this.renderPropertiesPanel();
  }

  /**
   * Highlight an element in the SVG
   */
  private highlightSVGElement(id: number) {
    // Remove previous highlights
    document.querySelectorAll("[data-element-id]").forEach((el) => {
      el.classList.remove("svg-highlighted");
    });

    // Add highlight to selected element
    const svgElement = document.querySelector(`[data-element-id="${id}"]`);
    if (svgElement) {
      svgElement.classList.add("svg-highlighted");
    }
  }

  /**
   * Render the right side properties panel
   * Made public so InteractiveSVG can call it
   */
  renderPropertiesPanel() {
    console.log("SimpleHierarchyView: renderPropertiesPanel() called");
    const rightColInner = document.getElementById("right_col_inner");
    if (!rightColInner) {
      console.error("SimpleHierarchyView: right_col_inner not found!");
      return;
    }

    // First render SVG at the top
    const structure = (globalThis as any).structure;
    let html = '<div class="simple-svg-container">';
    html +=
      '<h3 style="margin: 0 0 12px 0; padding: 12px; background: #f8f9fa; border-radius: 8px;">📐 Tekening</h3>';

    // Add zoom controls
    html += '<div class="svg-zoom-controls">';
    html +=
      '<button class="svg-zoom-btn" id="svg-zoom-in" title="Zoom in">+</button>';
    html +=
      '<button class="svg-zoom-btn" id="svg-zoom-out" title="Zoom uit">−</button>';
    html +=
      '<button class="svg-zoom-btn" id="svg-zoom-reset" title="Reset zoom">⊙</button>';
    html += "</div>";

    html += '<div id="EDS">';
    if (structure) {
      const svgData = structure.toSVG(0, "horizontal").data;
      const flattenSVGfromString =
        (globalThis as any).flattenSVGfromString || ((str: string) => str);
      html += flattenSVGfromString(svgData, 10);
    }
    html += "</div>";
    html += "</div>";

    // Then add properties panel below
    html += '<div class="simple-properties-divider"></div>';

    if (this.selectedElementId === null) {
      html += `
                <div class="simple-properties-empty">
                    <div class="simple-properties-empty-icon">📝</div>
                    <div class="simple-properties-empty-text">Selecteer een element om te bewerken</div>
                </div>
            `;
      rightColInner.innerHTML = html;

      // Re-attach interactive SVG handlers
      if ((window as any).interactiveSVG) {
        (window as any).interactiveSVG.attachHandlers();
      }
      return;
    }

    const element = structure.getElectroItemById(this.selectedElementId);

    if (!element) {
      html +=
        '<div class="simple-properties-empty">Element niet gevonden</div>';
      rightColInner.innerHTML = html;

      // Re-attach interactive SVG handlers
      if ((window as any).interactiveSVG) {
        (window as any).interactiveSVG.attachHandlers();
      }
      return;
    }

    // Get element HTML and extract form fields
    let elementHTML = element.toHTML("edit");

    // Remove the action buttons that are in the HTML
    // They look like: <button class="button-insertBefore" onclick="..."></button>
    elementHTML = elementHTML.replace(
      /<button[^>]*class="button-[^"]*"[^>]*>.*?<\/button>/g,
      ""
    );

    // Create properties panel
    html += '<div class="simple-properties-panel">';
    html += '<div class="simple-properties-header">';
    html += `<h2>${element.getType()} ${
      element.props.nr ? "#" + element.props.nr : ""
    }</h2>`;
    html += `<div class="element-type">ID: ${this.selectedElementId}</div>`;
    html += "</div>";

    html += '<div class="simple-properties-form">';
    html += elementHTML; // Use existing HTML generation (without buttons)
    html += "</div>";

    // Add action buttons
    html += '<div class="simple-properties-actions">';
    html += `<button class="simple-action-btn" id="btn-insert-before">⬆️ Voeg toe voor</button>`;
    html += `<button class="simple-action-btn" id="btn-insert-after">⬇️ Voeg toe na</button>`;
    html += `<button class="simple-action-btn" id="btn-insert-child">↳ Voeg kind toe</button>`;
    html += `<button class="simple-action-btn" id="btn-clone">📋 Dupliceer</button>`;
    html += `<button class="simple-action-btn" id="btn-move-up">⬆️ Omhoog</button>`;
    html += `<button class="simple-action-btn" id="btn-move-down">⬇️ Omlaag</button>`;
    html += `<button class="simple-action-btn danger" id="btn-delete">🗑️ Verwijder</button>`;
    html += "</div>";

    html += "</div>";
    rightColInner.innerHTML = html;

    // Re-attach interactive SVG handlers after rendering
    if ((window as any).interactiveSVG) {
      (window as any).interactiveSVG.attachHandlers();
    }

    // Attach zoom button handlers
    this.attachZoomHandlers();

    // Attach action button handlers
    this.attachActionButtonHandlers();

    // Attach change handlers to all form inputs to auto-save
    this.attachPropertyChangeHandlers();
  }

  /**
   * Attach handlers to SVG zoom buttons
   */
  private attachZoomHandlers() {
    const edsContainer = document.getElementById("EDS");
    if (!edsContainer) return;

    const svg = edsContainer.querySelector("svg");
    if (!svg) return;

    // Get original viewBox or create one based on SVG dimensions
    let originalViewBox = svg.getAttribute("viewBox");
    if (!originalViewBox) {
      const width = svg.getAttribute("width") || "800";
      const height = svg.getAttribute("height") || "600";
      originalViewBox = `0 0 ${width} ${height}`;
      svg.setAttribute("viewBox", originalViewBox);
    }

    const [origX, origY, origWidth, origHeight] = originalViewBox
      .split(" ")
      .map(Number);
    let currentZoom = 1;

    const updateZoom = (zoom: number) => {
      // Calculate new viewBox dimensions based on zoom
      const newWidth = origWidth / zoom;
      const newHeight = origHeight / zoom;
      const newX = origX + (origWidth - newWidth) / 2;
      const newY = origY + (origHeight - newHeight) / 2;

      svg.setAttribute("viewBox", `${newX} ${newY} ${newWidth} ${newHeight}`);
    };

    const btnZoomIn = document.getElementById("svg-zoom-in");
    const btnZoomOut = document.getElementById("svg-zoom-out");
    const btnZoomReset = document.getElementById("svg-zoom-reset");

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", () => {
        currentZoom = Math.min(currentZoom + 0.2, 3);
        updateZoom(currentZoom);
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", () => {
        currentZoom = Math.max(currentZoom - 0.2, 0.5);
        updateZoom(currentZoom);
      });
    }

    if (btnZoomReset) {
      btnZoomReset.addEventListener("click", () => {
        currentZoom = 1;
        svg.setAttribute("viewBox", originalViewBox);
      });
    }

    // Mouse wheel zoom
    edsContainer.addEventListener("wheel", (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        currentZoom = Math.max(0.5, Math.min(3, currentZoom + delta));
        updateZoom(currentZoom);
      }
    });
  }

  /**
   * Attach handlers to action buttons
   */
  private attachActionButtonHandlers() {
    const elementId = this.selectedElementId;
    if (elementId === null) return;

    const btnInsertBefore = document.getElementById("btn-insert-before");
    const btnInsertAfter = document.getElementById("btn-insert-after");
    const btnInsertChild = document.getElementById("btn-insert-child");
    const btnClone = document.getElementById("btn-clone");
    const btnMoveUp = document.getElementById("btn-move-up");
    const btnMoveDown = document.getElementById("btn-move-down");
    const btnDelete = document.getElementById("btn-delete");

    if (btnInsertBefore) {
      btnInsertBefore.addEventListener("click", () => {
        (globalThis as any).HLInsertBefore(elementId);
        this.render();
      });
    }

    if (btnInsertAfter) {
      btnInsertAfter.addEventListener("click", () => {
        (globalThis as any).HLInsertAfter(elementId);
        this.render();
      });
    }

    if (btnInsertChild) {
      btnInsertChild.addEventListener("click", () => {
        (globalThis as any).HLInsertChild(elementId);
        this.render();
      });
    }

    if (btnClone) {
      btnClone.addEventListener("click", () => {
        (globalThis as any).HLClone(elementId);
        this.render();
      });
    }

    if (btnMoveUp) {
      btnMoveUp.addEventListener("click", () => {
        (globalThis as any).HLMoveUp(elementId);
        this.render();
      });
    }

    if (btnMoveDown) {
      btnMoveDown.addEventListener("click", () => {
        (globalThis as any).HLMoveDown(elementId);
        this.render();
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener("click", () => {
        if (confirm("Dit element en alle kinderen verwijderen?")) {
          (globalThis as any).HLDelete(elementId);
          this.selectedElementId = null;
          this.render();
        }
      });
    }
  }

  /**
   * Attach change handlers to property inputs
   */
  private attachPropertyChangeHandlers() {
    const propertyPanel = document.querySelector(".simple-properties-form");
    if (!propertyPanel) return;

    const structure = (globalThis as any).structure;
    if (!structure) return;

    const element = structure.getElectroItemById(this.selectedElementId);
    if (!element) return;

    // Find all inputs, selects, and checkboxes
    const inputs = propertyPanel.querySelectorAll("input, select");

    inputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        console.log("Property changed:", e.target);

        // Parse the input ID to get property name
        // ID format: HL_edit_{elementId}_{propertyName}
        const inputId = (input as HTMLElement).id;
        const match = inputId.match(/^HL_edit_(\d+)_(.+)$/);

        if (match) {
          const elementId = parseInt(match[1]);
          const propertyName = match[2];

          // Get the value based on input type
          let value: string | boolean;
          let inputType: string;

          if (input instanceof HTMLInputElement) {
            if (input.type === "checkbox") {
              value = input.checked;
              inputType = "checkbox";
            } else {
              value = input.value;
              inputType = "text";
            }
          } else if (input instanceof HTMLSelectElement) {
            value = input.value;
            inputType = "select-one";
          }

          console.log(
            `Updating ${propertyName} to ${value} for element ${elementId}`
          );

          // Use the same propUpdate logic as the original code
          const electroItem = structure.getElectroItemById(elementId);

          if (electroItem) {
            switch (inputType) {
              case "select-one":
                if (propertyName === "type") {
                  // Type changed - need special handling
                  structure.adjustTypeById(elementId, value as string);
                  structure.reNumber();
                  // Don't call updateHTMLinner - we'll update the list and SVG ourselves
                } else {
                  electroItem.props[propertyName] = value as string;
                  structure.reNumber();
                  // Don't call updateHTMLinner - we'll update the list and SVG ourselves
                }
                break;
              case "text":
                electroItem.props[propertyName] = value as string;
                structure.reNumber();
                break;
              case "checkbox":
                electroItem.props[propertyName] = value as boolean;
                structure.reNumber();
                break;
            }

            if (electroItem.getType() === "Domotica gestuurde verbruiker") {
              structure.voegAttributenToeAlsNodigEnReSort();
            }

            // Store for undo
            if ((globalThis as any).undostruct) {
              (globalThis as any).undostruct.store();
            }

            console.log(`Property ${propertyName} saved successfully`);
          }
        }

        // Update the list (without re-rendering properties panel)
        this.renderList();

        // Force a redraw of just the SVG after a short delay
        setTimeout(() => {
          // Only re-render SVG, not the properties panel
          const svgContainer = document.querySelector(
            ".simple-svg-container #EDS"
          );
          if (svgContainer) {
            const svgData = structure.toSVG(0, "horizontal").data;
            const flattenSVGfromString =
              (globalThis as any).flattenSVGfromString ||
              ((str: string) => str);
            svgContainer.innerHTML = flattenSVGfromString(svgData, 10);

            // Re-attach interactive SVG handlers
            if ((window as any).interactiveSVG) {
              (window as any).interactiveSVG.attachHandlers();
            }

            console.log("SVG updated with new values");
          }
        }, 50);
      });

      // Also listen to input events for immediate feedback on the SVG
      input.addEventListener("input", (e) => {
        // Parse the input ID to get property name
        const inputId = (input as HTMLElement).id;
        const match = inputId.match(/^HL_edit_(\d+)_(.+)$/);

        if (match) {
          const elementId = parseInt(match[1]);
          const propertyName = match[2];

          // Just save the value temporarily for input events
          const electroItem = structure.getElectroItemById(elementId);
          if (electroItem) {
            if (input instanceof HTMLInputElement) {
              if (input.type === "checkbox") {
                electroItem.props[propertyName] = input.checked;
              } else {
                electroItem.props[propertyName] = input.value;
              }
            } else if (input instanceof HTMLSelectElement) {
              electroItem.props[propertyName] = input.value;
            }
          }
        }
      });
    });
  }
}

// Export for global access - but don't auto-initialize
export { SimpleHierarchyView };
