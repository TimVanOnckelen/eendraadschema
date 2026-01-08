import { Hierarchical_List } from "../Hierarchical_List";
import { Electro_Item } from "../List_Item/Electro_Item";
import { SituationPlanElement } from "./SituationPlanElement";
import { WallType } from "./WallElement";

export class SituationPlanView_SideBar {
  private div: HTMLElement;
  private maxDepth: number = 20; // Maximum recursion depth
  private excludedTypes = [
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
  public selectedWallElement: SituationPlanElement | null = null;
  public selectedElement: SituationPlanElement | null = null;

  constructor(div: HTMLElement) {
    this.div = div;
  }

  public renderSymbols() {
    // Placeholder for future implementation
  }

  /**
   * Show wall properties in the sidebar
   */
  public showWallProperties(sitPlanElement: SituationPlanElement) {
    if (!sitPlanElement.isWall()) return;

    this.selectedWallElement = sitPlanElement;
    const wallElement = sitPlanElement.getWallElement();
    if (!wallElement) return;

    const html = `
      <div style="padding: 15px; height: 100%; overflow-y: auto; background-color: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px; color: #333;">Muur eigenschappen</h3>
          <button 
            id="close-wall-properties" 
            style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666; padding: 0; width: 24px; height: 24px;"
            title="Sluiten"
          >×</button>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Wall Type -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Muurtype
            </label>
            <select 
              id="wall-type" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white;"
            >
              <option value="inner" ${
                wallElement.type === "inner" ? "selected" : ""
              }>Binnenmuur</option>
              <option value="outer" ${
                wallElement.type === "outer" ? "selected" : ""
              }>Buitenmuur</option>
            </select>
          </div>

          <!-- Position -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Positie
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="display: block; font-size: 11px; color: #777; margin-bottom: 4px;">X (px)</label>
                <input 
                  type="number" 
                  id="wall-x" 
                  value="${Math.round(wallElement.x)}" 
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
                />
              </div>
              <div>
                <label style="display: block; font-size: 11px; color: #777; margin-bottom: 4px;">Y (px)</label>
                <input 
                  type="number" 
                  id="wall-y" 
                  value="${Math.round(wallElement.y)}" 
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
                />
              </div>
            </div>
          </div>

          <!-- Dimensions -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Afmetingen
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="display: block; font-size: 11px; color: #777; margin-bottom: 4px;">Breedte (px)</label>
                <input 
                  type="number" 
                  id="wall-width" 
                  value="${Math.round(wallElement.width)}" 
                  min="10"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
                />
              </div>
              <div>
                <label style="display: block; font-size: 11px; color: #777; margin-bottom: 4px;">Hoogte (px)</label>
                <input 
                  type="number" 
                  id="wall-height" 
                  value="${Math.round(wallElement.height)}" 
                  min="10"
                  style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
                />
              </div>
            </div>
          </div>

          <!-- Rotation -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Rotatie
            </label>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <input 
                type="number" 
                id="wall-rotation" 
                value="${Math.round(sitPlanElement.rotate || 0)}" 
                min="0"
                max="359"
                style="width: 70px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; text-align: center;"
              />
              <span style="font-size: 13px; color: #777;">°</span>
            </div>
            <input 
              type="range" 
              id="wall-rotation-slider" 
              value="${Math.round(sitPlanElement.rotate || 0)}" 
              min="0"
              max="359"
              style="width: 100%;"
            />
          </div>

        </div>

        <div style="margin-top: 15px; padding: 12px; background: white; border-radius: 8px; font-size: 12px; color: #666; line-height: 1.5;">
          <strong style="color: #333;">💡 Tip:</strong><br>
          Sleep de blauwe vierkantjes om de grootte aan te passen.<br>
          Sleep de groene cirkel om te roteren.
        </div>
      </div>
    `;

    this.div.innerHTML = html;
    this.attachWallPropertyHandlers();
  }

  /**
   * Attach event handlers for wall property inputs
   */
  private attachWallPropertyHandlers() {
    // Close button
    const closeBtn = document.getElementById("close-wall-properties");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.selectedWallElement = null;
        this.render();
      });
    }

    // Link rotation input and slider, apply changes immediately
    const rotationInput = document.getElementById(
      "wall-rotation"
    ) as HTMLInputElement;
    const rotationSlider = document.getElementById(
      "wall-rotation-slider"
    ) as HTMLInputElement;

    if (rotationInput && rotationSlider) {
      rotationInput.addEventListener("input", () => {
        rotationSlider.value = rotationInput.value;
        this.applyWallProperties();
      });

      rotationSlider.addEventListener("input", () => {
        rotationInput.value = rotationSlider.value;
        this.applyWallProperties();
      });
    }

    // Real-time updates on any input change
    ["wall-x", "wall-y", "wall-width", "wall-height", "wall-type"].forEach(
      (id) => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener("input", () => {
            this.applyWallProperties();
          });
        }
      }
    );
  }

  /**
   * Apply wall property changes
   */
  private applyWallProperties() {
    if (!this.selectedWallElement || !this.selectedWallElement.isWall()) return;

    const wallElement = this.selectedWallElement.getWallElement();
    if (!wallElement) return;

    const xInput = document.getElementById("wall-x") as HTMLInputElement;
    const yInput = document.getElementById("wall-y") as HTMLInputElement;
    const widthInput = document.getElementById(
      "wall-width"
    ) as HTMLInputElement;
    const heightInput = document.getElementById(
      "wall-height"
    ) as HTMLInputElement;
    const rotationInput = document.getElementById(
      "wall-rotation"
    ) as HTMLInputElement;
    const typeSelect = document.getElementById(
      "wall-type"
    ) as HTMLSelectElement;

    if (
      !xInput ||
      !yInput ||
      !widthInput ||
      !heightInput ||
      !rotationInput ||
      !typeSelect
    )
      return;

    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);
    const width = Math.max(10, parseFloat(widthInput.value));
    const height = Math.max(10, parseFloat(heightInput.value));
    let rotation = parseFloat(rotationInput.value);

    // Normalize rotation
    while (rotation < 0) rotation += 360;
    while (rotation >= 360) rotation -= 360;

    const wallType = typeSelect.value as WallType;

    // Update wall element
    wallElement.x = x;
    wallElement.y = y;
    wallElement.width = width;
    wallElement.height = height;
    wallElement.type = wallType;

    // Update situation plan element
    this.selectedWallElement.posx = x + width / 2;
    this.selectedWallElement.posy = y + height / 2;
    this.selectedWallElement.sizex = width;
    this.selectedWallElement.sizey = height;
    this.selectedWallElement.rotate = rotation;
    this.selectedWallElement.needsViewUpdate = true;

    // Trigger redraw
    if (globalThis.structure && globalThis.structure.sitplanview) {
      const sitplanview = globalThis.structure.sitplanview;
      sitplanview.updateBoxContent(this.selectedWallElement);
      sitplanview.updateSymbolPosition(this.selectedWallElement);

      // Re-add resize handles if the box is selected
      if (
        this.selectedWallElement.boxref &&
        this.selectedWallElement.boxref.classList.contains("selected")
      ) {
        const box = this.selectedWallElement.boxref;

        // Remove old handles
        sitplanview.removeAllWallResizeHandles();

        // Add new handles at updated positions
        sitplanview.addWallResizeHandles(box, this.selectedWallElement);
      }

      globalThis.undostruct.store();
    }
  }

  /**
   * Show element properties (for electroItems and images) in the sidebar
   */
  public showElementProperties(sitPlanElement: SituationPlanElement) {
    this.selectedElement = sitPlanElement;

    let elementName = "Element";
    let elementDetails = "";

    if (sitPlanElement.isEendraadschemaSymbool()) {
      const electroItem = globalThis.structure.getElectroItemById(
        sitPlanElement.getElectroItemId()
      );
      if (electroItem) {
        elementName = electroItem.getType() || "Symbool";
        try {
          const adres = electroItem.getReadableAdres();
          if (adres) elementDetails = adres;
        } catch (e) {
          // Ignore
        }
      }
    } else {
      elementName = "Afbeelding";
    }

    const html = `
      <div style="padding: 15px; height: 100%; overflow-y: auto; background-color: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 16px; color: #333;">${this.escapeHtml(
            elementName
          )}</h3>
          <button 
            id="close-element-properties" 
            style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666; padding: 0; width: 24px; height: 24px;"
            title="Sluiten"
          >×</button>
        </div>
        
        ${
          elementDetails
            ? `<div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 15px; font-size: 13px; color: #666;">${this.escapeHtml(
                elementDetails
              )}</div>`
            : ""
        }
        
        <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Label Type -->
          ${
            sitPlanElement.isEendraadschemaSymbool()
              ? `
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Label type
            </label>
            <select 
              id="element-adres-type" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white;"
            >
              <option value="auto" ${
                sitPlanElement.getAdresType() === "auto" ? "selected" : ""
              }>Automatisch</option>
              <option value="manueel" ${
                sitPlanElement.getAdresType() === "manueel" ? "selected" : ""
              }>Handmatig</option>
            </select>
          </div>

          <!-- Label Text -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Label tekst
            </label>
            <input 
              type="text" 
              id="element-adres" 
              value="${this.escapeHtml(sitPlanElement.getAdres() || "")}" 
              ${sitPlanElement.getAdresType() === "auto" ? "readonly" : ""}
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; ${
                sitPlanElement.getAdresType() === "auto"
                  ? "background: #f5f5f5;"
                  : ""
              }"
            />
          </div>

          <!-- Label Position -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Label positie
            </label>
            <select 
              id="element-adres-location" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white;"
            >
              <option value="links" ${
                sitPlanElement.getAdresLocation() === "links" ? "selected" : ""
              }>Links</option>
              <option value="rechts" ${
                sitPlanElement.getAdresLocation() === "rechts" ? "selected" : ""
              }>Rechts</option>
              <option value="boven" ${
                sitPlanElement.getAdresLocation() === "boven" ? "selected" : ""
              }>Boven</option>
              <option value="onder" ${
                sitPlanElement.getAdresLocation() === "onder" ? "selected" : ""
              }>Onder</option>
            </select>
          </div>

          <!-- Font Size -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Tekengrootte (px)
            </label>
            <input 
              type="number" 
              id="element-fontsize" 
              value="${sitPlanElement.labelfontsize || 11}" 
              min="6"
              max="72"
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
            />
          </div>
          `
              : ""
          }

          <!-- Scale -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Schaal (%)
            </label>
            <input 
              type="number" 
              id="element-scale" 
              value="${Math.round((sitPlanElement.getscale() || 1) * 100)}" 
              min="10"
              max="400"
              step="10"
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;"
            />
          </div>

          <!-- Rotation -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #555;">
              Rotatie
            </label>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <input 
                type="number" 
                id="element-rotation" 
                value="${Math.round(sitPlanElement.rotate || 0)}" 
                min="0"
                max="359"
                style="width: 70px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; text-align: center;"
              />
              <span style="font-size: 13px; color: #777;">°</span>
            </div>
            <input 
              type="range" 
              id="element-rotation-slider" 
              value="${Math.round(sitPlanElement.rotate || 0)}" 
              min="0"
              max="359"
              style="width: 100%;"
            />
          </div>

        </div>

        <div style="margin-top: 15px; padding: 12px; background: white; border-radius: 8px; font-size: 12px; color: #666; line-height: 1.5;">
          <strong style="color: #333;">💡 Tip:</strong><br>
          Gebruik de muis om het element te verslepen en positioneren.
        </div>
      </div>
    `;

    this.div.innerHTML = html;
    this.attachElementPropertyHandlers();
  }

  /**
   * Attach event handlers for element property inputs
   */
  private attachElementPropertyHandlers() {
    // Close button
    const closeBtn = document.getElementById("close-element-properties");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.selectedElement = null;
        this.render();
      });
    }

    // Adres type change
    const adresTypeSelect = document.getElementById(
      "element-adres-type"
    ) as HTMLSelectElement;
    const adresInput = document.getElementById(
      "element-adres"
    ) as HTMLInputElement;

    if (adresTypeSelect && adresInput) {
      adresTypeSelect.addEventListener("change", () => {
        const isAuto = adresTypeSelect.value === "auto";
        adresInput.readOnly = isAuto;
        adresInput.style.background = isAuto ? "#f5f5f5" : "";

        if (isAuto && this.selectedElement) {
          // Update to automatic address
          const electroItem = globalThis.structure.getElectroItemById(
            this.selectedElement.getElectroItemId()
          );
          if (electroItem) {
            try {
              adresInput.value = electroItem.getReadableAdres() || "";
            } catch (e) {
              adresInput.value = "";
            }
          }
        }

        this.applyElementProperties();
      });
    }

    // Link rotation input and slider
    const rotationInput = document.getElementById(
      "element-rotation"
    ) as HTMLInputElement;
    const rotationSlider = document.getElementById(
      "element-rotation-slider"
    ) as HTMLInputElement;

    if (rotationInput && rotationSlider) {
      rotationInput.addEventListener("input", () => {
        rotationSlider.value = rotationInput.value;
        this.applyElementProperties();
      });

      rotationSlider.addEventListener("input", () => {
        rotationInput.value = rotationSlider.value;
        this.applyElementProperties();
      });
    }

    // Real-time updates on any input change
    [
      "element-adres",
      "element-adres-location",
      "element-fontsize",
      "element-scale",
    ].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => {
          this.applyElementProperties();
        });
      }
    });
  }

  /**
   * Apply element property changes
   */
  private applyElementProperties() {
    if (!this.selectedElement) return;

    const adresTypeSelect = document.getElementById(
      "element-adres-type"
    ) as HTMLSelectElement;
    const adresInput = document.getElementById(
      "element-adres"
    ) as HTMLInputElement;
    const adresLocationSelect = document.getElementById(
      "element-adres-location"
    ) as HTMLSelectElement;
    const fontsizeInput = document.getElementById(
      "element-fontsize"
    ) as HTMLInputElement;
    const scaleInput = document.getElementById(
      "element-scale"
    ) as HTMLInputElement;
    const rotationInput = document.getElementById(
      "element-rotation"
    ) as HTMLInputElement;

    // Update properties
    if (this.selectedElement.isEendraadschemaSymbool()) {
      if (adresTypeSelect && adresInput && adresLocationSelect) {
        this.selectedElement.setAdres(
          adresTypeSelect.value as "auto" | "manueel",
          adresInput.value,
          adresLocationSelect.value as "links" | "rechts" | "boven" | "onder"
        );
      }

      if (fontsizeInput) {
        this.selectedElement.labelfontsize =
          parseInt(fontsizeInput.value) || 11;
      }
    }

    if (scaleInput) {
      const scale = parseFloat(scaleInput.value) / 100;
      this.selectedElement.setscale(scale);
    }

    if (rotationInput) {
      let rotation = parseFloat(rotationInput.value);
      while (rotation < 0) rotation += 360;
      while (rotation >= 360) rotation -= 360;
      this.selectedElement.rotate = rotation;
    }

    this.selectedElement.needsViewUpdate = true;

    // Trigger redraw
    if (globalThis.structure && globalThis.structure.sitplanview) {
      const sitplanview = globalThis.structure.sitplanview;
      sitplanview.updateBoxContent(this.selectedElement);
      sitplanview.updateSymbolAndLabelPosition(this.selectedElement);
      globalThis.undostruct.store();
    }
  }

  public render() {
    if (!this.div) return;
    if (!globalThis.structure) return;

    // If a wall is selected, show wall properties instead
    if (this.selectedWallElement && this.selectedWallElement.isWall()) {
      this.showWallProperties(this.selectedWallElement);
      return;
    }

    // If an element (symbol/image) is selected, show element properties
    if (this.selectedElement) {
      this.showElementProperties(this.selectedElement);
      return;
    }

    // Build the HTML for the sidebar showing items with SVG symbols
    let html = '<div style="padding: 10px;">';
    html +=
      '<h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">Snel toevoegen</h3>';
    html +=
      '<div style="font-size: 12px; color: #666; margin-bottom: 10px;">Sleep symbolen naar het canvas</div>';

    // Add search box
    html += `<div style="margin-bottom: 10px;">
            <input 
                type="text" 
                id="sitplan-sidebar-search" 
                placeholder="Zoek symbool..." 
                style="
                    width: 100%;
                    padding: 6px 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 12px;
                    box-sizing: border-box;
                "
            />
        </div>`;

    html += '<div id="sitplan-sidebar-items">';
    try {
      html += this.renderItems(globalThis.structure);
    } catch (error) {
      console.error("Error rendering sidebar:", error);
      html +=
        '<div style="color: red; font-size: 11px;">Fout bij laden van symbolen</div>';
    }
    html += "</div>";

    html += "</div>";

    this.div.innerHTML = html;

    // Attach search event listener
    const searchInput = document.getElementById(
      "sitplan-sidebar-search"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        this.filterItems(searchTerm);
      });
    }
  }

  private filterItems(searchTerm: string) {
    const itemsContainer = document.getElementById("sitplan-sidebar-items");
    if (!itemsContainer) return;

    const items = itemsContainer.querySelectorAll("[data-electroitem-id]");
    items.forEach((item) => {
      const element = item as HTMLElement;
      const text = element.textContent?.toLowerCase() || "";

      if (searchTerm === "" || text.includes(searchTerm)) {
        element.style.display = "flex";
      } else {
        element.style.display = "none";
      }
    });
  }

  private renderItems(list: Hierarchical_List): string {
    let html = "";

    if (!list || !list.data) return html;

    // Collect all items (flattened, no hierarchy)
    const items: Electro_Item[] = [];
    this.collectItems(list, items, new Set<number>());

    // Render each item with its SVG symbol
    for (const item of items) {
      try {
        const id = item.id;
        const type = item.getType();

        // Skip excluded types (Bord, Kring, etc.)
        if (this.excludedTypes.indexOf(type) !== -1) {
          continue;
        }

        // Skip if item is an attribute
        if (item.isAttribuut()) {
          continue;
        }

        // Check if this item can be added to sitplan (max not reached)
        const canAdd =
          item.maxSituationPlanElements() === null ||
          (globalThis.structure.sitplan?.countByElectroItemId(id) || 0) <
            item.maxSituationPlanElements();

        if (!canAdd) continue; // Only show items that can still be added

        // Safely get address with error handling
        let adres = "";
        try {
          adres = item.getReadableAdres() || "";
        } catch (e) {
          console.warn(`Error getting address for item ${id}:`, e);
          adres = "";
        }

        // Get the text/label if it exists
        let tekst = "";
        try {
          if (
            item.props &&
            item.props.adres &&
            typeof item.props.adres === "string"
          ) {
            tekst = item.props.adres.trim();
          }
        } catch (e) {
          console.warn(`Error getting tekst for item ${id}:`, e);
        }

        // Get the SVG for this item
        let svgContent = "";
        try {
          const svgElement = item.toSVG(true, false); // sitplan mode, no mirror
          if (svgElement && svgElement.data) {
            svgContent = svgElement.data;
          }
        } catch (e) {
          console.warn(`Error getting SVG for item ${id}:`, e);
        }

        const title = "Sleep naar het canvas om toe te voegen";

        html += `<div 
                    style="
                        padding: 8px; 
                        cursor: grab; 
                        border-radius: 4px;
                        margin-bottom: 4px;
                        font-size: 11px;
                        background: #f9f9f9;
                        border: 1px solid #e0e0e0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    "
                    draggable="true"
                    data-electroitem-id="${id}"
                    onmouseover="this.style.background='#e8f4ff'; this.style.borderColor='#0078d4';"
                    onmouseout="this.style.background='#f9f9f9'; this.style.borderColor='#e0e0e0';"
                    title="${title}"
                >
                    <div style="flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                        <svg width="40" height="40" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                            ${svgContent}
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(
                          type
                        )}</div>
                        ${
                          adres
                            ? `<div style="font-size: 10px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(
                                adres
                              )}</div>`
                            : ""
                        }
                        ${
                          tekst
                            ? `<div style="font-size: 9px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-style: italic;">"${this.escapeHtml(
                                tekst
                              )}"</div>`
                            : ""
                        }
                    </div>
                </div>`;
      } catch (error) {
        console.error(`Error rendering item ${item.id}:`, error);
      }
    }

    return html;
  }

  private collectItems(
    list: Hierarchical_List,
    items: Electro_Item[],
    visited: Set<number>,
    depth: number = 0
  ): void {
    // Prevent infinite recursion
    if (depth > this.maxDepth) {
      console.warn("Maximum recursion depth reached in collectItems");
      return;
    }

    if (!list || !list.data) return;

    for (let i = 0; i < list.data.length; i++) {
      const item = list.data[i];

      if (!(item instanceof Electro_Item)) continue;

      const id = item.id;

      // Skip if we've already visited this item (circular reference)
      if (visited.has(id)) {
        continue;
      }

      // Add to visited set
      visited.add(id);

      // Add this item to the list
      items.push(item);

      // Recursively collect children
      if (
        item.sourcelist &&
        item.sourcelist.data &&
        item.sourcelist.data.length > 0
      ) {
        this.collectItems(item.sourcelist, items, visited, depth + 1);
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global functions for legacy compatibility
globalThis.HLInsertAndEditSymbol = (event: MouseEvent, id: number) => {
  // This will be handled by React component via drag and drop
};

globalThis.HLExpandSitPlan = (my_id: number) => {
  // This will be handled by React component
};
