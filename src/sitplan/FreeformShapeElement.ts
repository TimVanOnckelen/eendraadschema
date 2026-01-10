/**
 * FreeformShapeElement - Represents a freeform shape in the situation plan
 * Freeform shapes are rectangular elements that can be white, black, gray, or dark gray
 */

export type FreeformShapeType = "white" | "black" | "gray" | "darkgray";

export interface FreeformShapeProperties {
  type: FreeformShapeType;
  x: number; // Top-left X coordinate
  y: number; // Top-left Y coordinate
  width: number; // Width of the shape
  height: number; // Height of the shape
  page: number; // Page number
  rotate?: number; // Rotation angle in degrees
}

/**
 * FreeformShapeElement class handles the creation and properties of freeform shapes
 */
export class FreeformShapeElement {
  public type: FreeformShapeType;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public page: number;
  public rotate: number;

  constructor(props: FreeformShapeProperties) {
    this.type = props.type;
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.page = props.page;
    this.rotate = props.rotate || 0;
  }

  /**
   * Get CSS class name for this freeform shape type
   */
  getCSSClass(): string {
    switch (this.type) {
      case "white":
        return "freeform-white";
      case "black":
        return "freeform-black";
      case "gray":
        return "freeform-gray";
      case "darkgray":
        return "freeform-darkgray";
      default:
        return "freeform-white";
    }
  }

  /**
   * Create SVG representation of the freeform shape for rendering
   */
  toSVG(): string {
    let fillColor: string;
    let strokeColor: string;

    switch (this.type) {
      case "white":
        fillColor = "#ffffff";
        strokeColor = "#cccccc";
        break;
      case "black":
        fillColor = "#000000";
        strokeColor = "#000000";
        break;
      case "gray":
        fillColor = "#999999";
        strokeColor = "#777777";
        break;
      case "darkgray":
        fillColor = "#555555";
        strokeColor = "#333333";
        break;
      default:
        fillColor = "#ffffff";
        strokeColor = "#cccccc";
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
      <rect 
        x="0" 
        y="0" 
        width="${this.width}" 
        height="${this.height}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="1"
      />
    </svg>`;
  }

  /**
   * Export freeform shape data for serialization
   */
  toJSON(): any {
    return {
      type: "freeform",
      shapeType: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      page: this.page,
      rotate: this.rotate,
    };
  }

  /**
   * Create a FreeformShapeElement from JSON data
   */
  static fromJSON(data: any): FreeformShapeElement {
    return new FreeformShapeElement({
      type: data.shapeType,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      page: data.page,
      rotate: data.rotate || 0,
    });
  }
}
