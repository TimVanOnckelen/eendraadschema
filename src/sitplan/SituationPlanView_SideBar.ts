import { Hierarchical_List } from "../Hierarchical_List";
import { Electro_Item } from "../List_Item/Electro_Item";

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

  constructor(div: HTMLElement) {
    this.div = div;
  }

  public renderSymbols() {
    // Placeholder for future implementation
  }

  public render() {
    if (!this.div) return;
    if (!globalThis.structure) return;

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
