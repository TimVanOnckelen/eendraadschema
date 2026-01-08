import { Dialog } from "../documentation/Dialog";
import { SituationPlanElement } from "./SituationPlanElement";
import { WallType } from "./WallElement";

/**
 * Toont een popup voor het bewerken van muur eigenschappen
 *
 * @param sitPlanElement Het situatieplan element (muur) dat bewerkt wordt
 * @param okCallback Callback functie die wordt aangeroepen wanneer de gebruiker op OK klikt
 * @param cancelCallback Callback functie die wordt aangeroepen wanneer de gebruiker op Annuleren klikt
 */
export function SituationPlanView_WallPropertiesPopup(
  sitPlanElement: SituationPlanElement,
  okCallback: (
    x: number,
    y: number,
    width: number,
    height: number,
    rotate: number,
    wallType: WallType
  ) => void,
  cancelCallback: () => void
) {
  if (!sitPlanElement.isWall()) {
    console.error("Element is geen muur");
    return;
  }

  const wallElement = sitPlanElement.getWallElement();
  if (!wallElement) {
    console.error("Kan muur element niet vinden");
    return;
  }

  // Get current values
  const currentX = Math.round(wallElement.x);
  const currentY = Math.round(wallElement.y);
  const currentWidth = Math.round(wallElement.width);
  const currentHeight = Math.round(wallElement.height);
  const currentRotate = Math.round(sitPlanElement.rotate || 0);
  const currentType = wallElement.type;

  const html = `
    <div style="padding: 20px; min-width: 400px;">
      <h3 style="margin-top: 0; margin-bottom: 20px; color: #333;">Muur eigenschappen</h3>
      
      <div style="display: grid; grid-template-columns: 140px 1fr; gap: 15px; align-items: center;">
        
        <!-- Wall Type -->
        <label style="font-weight: 500;">Muurtype:</label>
        <div>
          <select id="wallType" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
            <option value="inner" ${
              currentType === "inner" ? "selected" : ""
            }>Binnenmuur</option>
            <option value="outer" ${
              currentType === "outer" ? "selected" : ""
            }>Buitenmuur</option>
          </select>
        </div>

        <!-- Position X -->
        <label for="wallX" style="font-weight: 500;">X positie (px):</label>
        <input 
          type="number" 
          id="wallX" 
          value="${currentX}" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
        />

        <!-- Position Y -->
        <label for="wallY" style="font-weight: 500;">Y positie (px):</label>
        <input 
          type="number" 
          id="wallY" 
          value="${currentY}" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
        />

        <!-- Width -->
        <label for="wallWidth" style="font-weight: 500;">Breedte (px):</label>
        <input 
          type="number" 
          id="wallWidth" 
          value="${currentWidth}" 
          min="10"
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
        />

        <!-- Height -->
        <label for="wallHeight" style="font-weight: 500;">Hoogte (px):</label>
        <input 
          type="number" 
          id="wallHeight" 
          value="${currentHeight}" 
          min="10"
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
        />

        <!-- Rotation -->
        <label for="wallRotate" style="font-weight: 500;">Rotatie (°):</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input 
            type="number" 
            id="wallRotate" 
            value="${currentRotate}" 
            min="0"
            max="359"
            style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
          />
          <input 
            type="range" 
            id="wallRotateSlider" 
            value="${currentRotate}" 
            min="0"
            max="359"
            style="flex: 2;"
          />
        </div>

      </div>

      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #666;">
        <strong>Tip:</strong> Je kunt muren ook direct aanpassen met de resize handles (blauwe vierkantjes) 
        en de rotatie handle (groene cirkel) wanneer een muur geselecteerd is.
      </div>
    </div>
  `;

  const dialog = new Dialog("Muur bewerken", html, [
    {
      text: "OK",
      callback: () => {
        const xInput = document.getElementById("wallX") as HTMLInputElement;
        const yInput = document.getElementById("wallY") as HTMLInputElement;
        const widthInput = document.getElementById(
          "wallWidth"
        ) as HTMLInputElement;
        const heightInput = document.getElementById(
          "wallHeight"
        ) as HTMLInputElement;
        const rotateInput = document.getElementById(
          "wallRotate"
        ) as HTMLInputElement;
        const typeSelect = document.getElementById(
          "wallType"
        ) as HTMLSelectElement;

        if (
          xInput &&
          yInput &&
          widthInput &&
          heightInput &&
          rotateInput &&
          typeSelect
        ) {
          const x = parseFloat(xInput.value);
          const y = parseFloat(yInput.value);
          const width = Math.max(10, parseFloat(widthInput.value));
          const height = Math.max(10, parseFloat(heightInput.value));
          let rotate = parseFloat(rotateInput.value);

          // Normalize rotation
          while (rotate < 0) rotate += 360;
          while (rotate >= 360) rotate -= 360;

          const wallType = typeSelect.value as WallType;

          okCallback(x, y, width, height, rotate, wallType);
        }
      },
    },
    {
      text: "Annuleren",
      callback: cancelCallback,
    },
  ]);

  dialog.show();

  // Link the rotation slider and number input
  const rotateInput = document.getElementById("wallRotate") as HTMLInputElement;
  const rotateSlider = document.getElementById(
    "wallRotateSlider"
  ) as HTMLInputElement;

  if (rotateInput && rotateSlider) {
    rotateInput.addEventListener("input", () => {
      rotateSlider.value = rotateInput.value;
    });

    rotateSlider.addEventListener("input", () => {
      rotateInput.value = rotateSlider.value;
    });
  }
}
