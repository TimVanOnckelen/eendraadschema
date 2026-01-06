/**
 * HierarchyUIHelper - Utilities for improving the hierarchical list UI
 *
 * This module provides functions to make the hierarchy list more user-friendly:
 * - Collapsible property panels
 * - Cleaner visual presentation
 * - Better action button placement
 */

/**
 * Wraps the properties of an element in a collapsible details section
 */
export function wrapPropertiesInCollapsible(
  elementId: number,
  properties: string,
  elementType: string
): string {
  // Extract summary information (first few key properties)
  const summary = extractSummary(properties, elementType);

  return `
        <div class="html_edit_item_wrapper">
            <div class="html_edit_item_summary" onclick="toggleDetails(${elementId})">
                <span class="html_edit_item_type">${elementType}</span>
                ${summary}
                <button class="toggle-details-btn" onclick="event.stopPropagation(); toggleDetails(${elementId})">
                    <span id="toggle-icon-${elementId}">▼ Details</span>
                </button>
            </div>
            <div class="html_edit_item_details" id="details-${elementId}">
                ${properties}
            </div>
        </div>
    `;
}

/**
 * Extract a summary string from the full properties HTML
 */
function extractSummary(properties: string, elementType: string): string {
  // Parse common patterns and extract key info
  let summary = "";

  // Extract number if present
  const nrMatch = properties.match(/Nr:\s*(?:<[^>]+>)*([^<,]+)/i);
  if (nrMatch && nrMatch[1].trim()) {
    summary += `<span class="summary-badge">Nr: ${nrMatch[1].trim()}</span>`;
  }

  // Extract address/text if present
  const adresMatch = properties.match(
    /Adres\/tekst:\s*(?:<[^>]+value=")([^"]+)/i
  );
  if (adresMatch && adresMatch[1].trim()) {
    summary += `<span class="summary-badge">${adresMatch[1].trim()}</span>`;
  }

  return summary;
}

/**
 * Toggle the visibility of element details
 */
(globalThis as any).toggleDetails = (elementId: number) => {
  const detailsDiv = document.getElementById(`details-${elementId}`);
  const toggleIcon = document.getElementById(`toggle-icon-${elementId}`);

  if (detailsDiv && toggleIcon) {
    if (detailsDiv.classList.contains("expanded")) {
      detailsDiv.classList.remove("expanded");
      toggleIcon.textContent = "▼ Details";
    } else {
      detailsDiv.classList.add("expanded");
      toggleIcon.textContent = "▲ Verberg";
    }
  }
};

/**
 * Wrap action buttons in a hover-activated container
 */
export function wrapActionButtons(buttons: string): string {
  return `<div class="html_edit_item_actions">${buttons}</div>`;
}

/**
 * Format a property in a cleaner way
 */
export function formatProperty(label: string, value: string): string {
  return `<span class="html_edit_property"><span class="html_edit_property_label">${label}:</span>${value}</span>`;
}

/**
 * Initialize enhanced UI for all existing hierarchy items
 */
export function enhanceHierarchyUI() {
  // Add event listeners for better interaction
  document.addEventListener("DOMContentLoaded", () => {
    // Add keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Close all expanded details
        document
          .querySelectorAll(".html_edit_item_details.expanded")
          .forEach((el) => {
            el.classList.remove("expanded");
          });
      }
    });
  });
}

/**
 * Create a compact element header with type and key info
 */
export function createElementHeader(
  elementId: number,
  elementType: string,
  nr: string,
  adres: string,
  mode: string
): string {
  let output = "";

  // Action buttons (move mode)
  if (mode === "move") {
    output += `<span class="html_edit_item_id">ID: ${elementId}</span>`;
    output += `<label style="font-size: 12px; color: #6c757d;">Moeder: <input id="id_parent_change_${elementId}" type="text" size="2" value="" onchange="HL_changeparent(${elementId})" style="width: 50px;"></label> `;
    output += `<button class="button-lightblue" onclick="HLMoveUp(${elementId})" title="Omhoog">&#9650;</button>`;
    output += `<button class="button-lightblue" onclick="HLMoveDown(${elementId})" title="Omlaag">&#9660;</button>`;
    output += `<button class="button-lightblue" onclick="HLClone(${elementId})" title="Clonen">Clone</button>`;
  }

  return output;
}

/**
 * Initialize the helper when imported
 */
if (typeof window !== "undefined") {
  enhanceHierarchyUI();
}
