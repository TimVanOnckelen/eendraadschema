import { SituationPlan } from "./SituationPlan";
import { SituationPlanElement } from "./SituationPlanElement";
import { SituationPlanView } from "./SituationPlanView";

/**
 * LayerManager - A draggable panel for managing layers/elements in the situation plan
 */
export class LayerManager {
  private container: HTMLDivElement;
  private header: HTMLDivElement;
  private content: HTMLDivElement;
  private sitplan: SituationPlan;
  private sitplanview: SituationPlanView;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private isCollapsed = false;
  private draggedLayerElement: HTMLElement | null = null;
  private draggedOverElement: HTMLElement | null = null;

  constructor(sitplan: SituationPlan, sitplanview: SituationPlanView) {
    this.sitplan = sitplan;
    this.sitplanview = sitplanview;
    this.createUI();
    this.attachEventListeners();
  }

  private createUI() {
    // Main container
    this.container = document.createElement("div");
    this.container.id = "layer-manager";
    this.container.style.cssText = `
      position: fixed;
      right: 20px;
      top: 100px;
      width: 300px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      max-height: 80vh;
    `;

    // Header (draggable)
    this.header = document.createElement("div");
    this.header.style.cssText = `
      padding: 12px;
      background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
      border-bottom: 1px solid #ccc;
      cursor: move;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px 8px 0 0;
    `;
    this.header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 600; font-size: 14px; color: #333;">🗂️ Lagen</span>
      </div>
      <div style="display: flex; gap: 4px;">
        <button id="layer-manager-collapse" style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 0 4px;" title="Inklappen">−</button>
        <button id="layer-manager-close" style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 0 4px; color: #666;" title="Sluiten">×</button>
      </div>
    `;

    // Content area
    this.content = document.createElement("div");
    this.content.style.cssText = `
      padding: 8px;
      overflow-y: auto;
      flex: 1;
      max-height: calc(80vh - 50px);
    `;

    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);

    this.render();
  }

  private attachEventListeners() {
    // Dragging functionality
    this.header.addEventListener("mousedown", (e) => {
      if ((e.target as HTMLElement).tagName === "BUTTON") return;
      this.isDragging = true;
      const rect = this.container.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      document.addEventListener("mousemove", this.handleDrag);
      document.addEventListener("mouseup", this.handleDragEnd);
    });

    // Close button
    const closeBtn = document.getElementById("layer-manager-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hide());
    }

    // Collapse button
    const collapseBtn = document.getElementById("layer-manager-collapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => this.toggleCollapse());
    }
  }

  private handleDrag = (e: MouseEvent) => {
    if (!this.isDragging) return;
    e.preventDefault();

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - this.container.offsetWidth;
    const maxY = window.innerHeight - this.container.offsetHeight;

    this.container.style.left = Math.max(0, Math.min(x, maxX)) + "px";
    this.container.style.top = Math.max(0, Math.min(y, maxY)) + "px";
    this.container.style.right = "auto";
  };

  private handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener("mousemove", this.handleDrag);
    document.removeEventListener("mouseup", this.handleDragEnd);
  };

  private toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    const collapseBtn = document.getElementById("layer-manager-collapse");

    if (this.isCollapsed) {
      this.content.style.display = "none";
      this.container.style.height = "auto";
      if (collapseBtn) collapseBtn.textContent = "+";
    } else {
      this.content.style.display = "block";
      if (collapseBtn) collapseBtn.textContent = "−";
    }
  }

  public render() {
    const elements = this.sitplan.getElements();

    if (!elements || elements.length === 0) {
      this.content.innerHTML =
        '<div style="padding: 20px; text-align: center; color: #999;">Geen lagen</div>';
      return;
    }

    // Get all elements on current page
    const currentPage = this.sitplan.activePage;
    const pageElements = elements.filter((e) => e.page === currentPage);

    // Sort by z-index (highest first)
    pageElements.sort((a, b) => {
      const zIndexA = a.boxref ? parseInt(a.boxref.style.zIndex || "0") : 0;
      const zIndexB = b.boxref ? parseInt(b.boxref.style.zIndex || "0") : 0;
      return zIndexB - zIndexA;
    });

    let html = `
      <div style="margin-bottom: 8px; padding: 6px; background: #f0f0f0; border-radius: 4px; font-size: 11px; color: #666;">
        Pagina ${currentPage} • ${pageElements.length} element${
      pageElements.length !== 1 ? "en" : ""
    }
      </div>
    `;

    if (pageElements.length === 0) {
      html +=
        '<div style="padding: 20px; text-align: center; color: #999;">Geen elementen op deze pagina</div>';
    } else {
      pageElements.forEach((element, index) => {
        html += this.renderLayerItem(element, index);
      });
    }

    this.content.innerHTML = html;
    this.attachLayerEventListeners();
  }

  private renderLayerItem(
    element: SituationPlanElement,
    index: number
  ): string {
    const isSelected = element.boxref?.classList.contains("selected") || false;
    const isVisible = element.boxref?.style.display !== "none";

    // Determine element type and name
    let icon = "📄";
    let name = "Element";
    let details = "";

    if (element.isWall()) {
      const wall = element.getWallElement();
      icon = "🧱";
      name = wall?.type === "outer" ? "Buitenmuur" : "Binnenmuur";
      details = `${Math.round(wall?.width || 0)} × ${Math.round(
        wall?.height || 0
      )} px`;
    } else if (element.isEendraadschemaSymbool()) {
      const electroItem = globalThis.structure.getElectroItemById(
        element.getElectroItemId()
      );
      if (electroItem) {
        icon = "⚡";
        name = electroItem.getType() || "Symbool";
        try {
          const adres = electroItem.getReadableAdres();
          if (adres) details = adres;
        } catch (e) {
          // Ignore
        }
      }
    } else {
      icon = "🖼️";
      name = "Afbeelding";
    }

    const zIndex = element.boxref
      ? parseInt(element.boxref.style.zIndex || "0")
      : 0;

    return `
      <div 
        class="layer-item" 
        data-element-id="${element.id}"
        draggable="true"
        style="
          padding: 8px;
          margin-bottom: 4px;
          background: ${isSelected ? "#e3f2fd" : "#f9f9f9"};
          border: 1px solid ${isSelected ? "#2196f3" : "#e0e0e0"};
          border-radius: 4px;
          cursor: move;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          transition: all 0.2s;
        "
        onmouseover="this.style.background='${
          isSelected ? "#bbdefb" : "#f0f0f0"
        }'"
        onmouseout="this.style.background='${
          isSelected ? "#e3f2fd" : "#f9f9f9"
        }'"
      >
        <span style="font-size: 16px; cursor: grab;">${icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.escapeHtml(name)}
          </div>
          ${
            details
              ? `<div style="font-size: 10px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(
                  details
                )}</div>`
              : ""
          }
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button 
            class="layer-visibility-btn" 
            data-element-id="${element.id}"
            style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px;"
            title="${isVisible ? "Verbergen" : "Tonen"}"
          >${isVisible ? "👁️" : "👁️‍🗨️"}</button>
          <span style="font-size: 10px; color: #999;" title="Z-index">${zIndex}</span>
        </div>
      </div>
    `;
  }

  private attachLayerEventListeners() {
    const elements = this.sitplan.getElements();

    // Layer item click - select element
    const layerItems = this.content.querySelectorAll(".layer-item");
    layerItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).classList.contains("layer-visibility-btn")
        )
          return;

        const elementId = (item as HTMLElement).dataset.elementId;
        const element = elements.find((el) => el.id === elementId);

        if (element && element.boxref) {
          // Clear previous selection if not holding shift
          if (!(e as MouseEvent).shiftKey) {
            this.sitplanview.clearSelection();
          }
          this.sitplanview.selectBox(element.boxref);
        }
      });

      // Drag and drop for reordering
      item.addEventListener("dragstart", (e: DragEvent) => {
        this.draggedLayerElement = item as HTMLElement;
        (item as HTMLElement).style.opacity = "0.5";
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
        }
      });

      item.addEventListener("dragend", (e: DragEvent) => {
        if (this.draggedLayerElement) {
          this.draggedLayerElement.style.opacity = "1";
          this.draggedLayerElement = null;
        }
        if (this.draggedOverElement) {
          this.draggedOverElement.style.borderTop = "";
          this.draggedOverElement.style.borderBottom = "";
          this.draggedOverElement = null;
        }
      });

      item.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        if (!this.draggedLayerElement) return;
        if (this.draggedLayerElement === item) return;

        // Visual feedback
        if (this.draggedOverElement && this.draggedOverElement !== item) {
          this.draggedOverElement.style.borderTop = "";
          this.draggedOverElement.style.borderBottom = "";
        }

        this.draggedOverElement = item as HTMLElement;
        const rect = (item as HTMLElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          (item as HTMLElement).style.borderTop = "2px solid #2196f3";
          (item as HTMLElement).style.borderBottom = "";
        } else {
          (item as HTMLElement).style.borderTop = "";
          (item as HTMLElement).style.borderBottom = "2px solid #2196f3";
        }
      });

      item.addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        if (!this.draggedLayerElement) return;
        if (this.draggedLayerElement === item) return;

        const draggedId = this.draggedLayerElement.dataset.elementId;
        const droppedOnId = (item as HTMLElement).dataset.elementId;

        if (!draggedId || !droppedOnId) return;

        const draggedElement = elements.find((el) => el.id === draggedId);
        const droppedOnElement = elements.find((el) => el.id === droppedOnId);

        if (
          !draggedElement ||
          !droppedOnElement ||
          !draggedElement.boxref ||
          !droppedOnElement.boxref
        )
          return;

        // Determine if we're dropping above or below
        const rect = (item as HTMLElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isAbove = e.clientY < midpoint;

        // Get current z-indices
        const draggedZIndex = parseInt(
          draggedElement.boxref.style.zIndex || "0"
        );
        const droppedOnZIndex = parseInt(
          droppedOnElement.boxref.style.zIndex || "0"
        );

        // Swap z-indices based on drop position
        if (isAbove) {
          // Drop above: dragged gets higher z-index
          if (draggedZIndex < droppedOnZIndex) {
            draggedElement.boxref.style.zIndex = (
              droppedOnZIndex + 1
            ).toString();
          } else {
            draggedElement.boxref.style.zIndex = droppedOnZIndex.toString();
            droppedOnElement.boxref.style.zIndex = (
              droppedOnZIndex - 1
            ).toString();
          }
        } else {
          // Drop below: dragged gets lower z-index
          if (draggedZIndex > droppedOnZIndex) {
            draggedElement.boxref.style.zIndex = (
              droppedOnZIndex - 1
            ).toString();
          } else {
            draggedElement.boxref.style.zIndex = droppedOnZIndex.toString();
            droppedOnElement.boxref.style.zIndex = (
              droppedOnZIndex + 1
            ).toString();
          }
        }

        // Clean up visual feedback
        if (this.draggedOverElement) {
          this.draggedOverElement.style.borderTop = "";
          this.draggedOverElement.style.borderBottom = "";
          this.draggedOverElement = null;
        }

        // Re-render and save
        this.render();
        globalThis.undostruct.store();
      });
    });

    // Visibility toggle buttons
    const visibilityBtns = this.content.querySelectorAll(
      ".layer-visibility-btn"
    );
    visibilityBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const elementId = (btn as HTMLElement).dataset.elementId;
        const element = elements.find((el) => el.id === elementId);

        if (element && element.boxref) {
          const isVisible = element.boxref.style.display !== "none";
          element.boxref.style.display = isVisible ? "none" : "";

          // Also hide/show label if present
          if (element.boxlabelref) {
            element.boxlabelref.style.display = isVisible ? "none" : "";
          }

          this.render();
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  public show() {
    this.container.style.display = "flex";
    this.render();
  }

  public hide() {
    this.container.style.display = "none";
  }

  public toggle() {
    if (this.container.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  public isVisible(): boolean {
    return this.container.style.display !== "none";
  }

  public destroy() {
    this.container.remove();
    document.removeEventListener("mousemove", this.handleDrag);
    document.removeEventListener("mouseup", this.handleDragEnd);
  }
}
