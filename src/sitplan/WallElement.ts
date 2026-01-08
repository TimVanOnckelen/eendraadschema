/**
 * WallElement - Represents a wall in the situation plan
 * Walls are rectangular elements that can be either inner or outer walls
 */

export type WallType = "inner" | "outer";

export interface WallProperties {
  type: WallType;
  x: number; // Top-left X coordinate
  y: number; // Top-left Y coordinate
  width: number; // Width of the wall
  height: number; // Height of the wall
  page: number; // Page number
  rotate?: number; // Rotation angle in degrees
}

/**
 * WallElement class handles the creation and properties of walls
 */
export class WallElement {
  public type: WallType;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public page: number;
  public rotate: number;

  // Wall thickness constants (in millimeters)
  public static readonly OUTER_WALL_THICKNESS = 30; // Buitenmuur: dikker
  public static readonly INNER_WALL_THICKNESS = 15; // Binnenmuur: dunner

  constructor(props: WallProperties) {
    this.type = props.type;
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.page = props.page;
    this.rotate = props.rotate || 0;
  }

  /**
   * Get the thickness of this wall in pixels
   */
  getThickness(): number {
    return this.type === "outer"
      ? WallElement.OUTER_WALL_THICKNESS
      : WallElement.INNER_WALL_THICKNESS;
  }

  /**
   * Get CSS class name for this wall type
   */
  getCSSClass(): string {
    return this.type === "outer" ? "wall-outer" : "wall-inner";
  }

  /**
   * Create SVG representation of the wall for rendering
   */
  toSVG(): string {
    const strokeColor = this.type === "outer" ? "#1a1a1a" : "#4d4d4d";

    if (this.type === "outer") {
      // Outer wall with diagonal line pattern
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
        <defs>
          <pattern id="outerWallPattern_${this.width}_${this.height}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <rect x="0" y="0" width="2" height="4" fill="#333333"/>
            <rect x="2" y="0" width="2" height="4" fill="#1a1a1a"/>
          </pattern>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="${this.width}" 
          height="${this.height}" 
          fill="url(#outerWallPattern_${this.width}_${this.height})" 
          stroke="${strokeColor}" 
          stroke-width="1"
        />
      </svg>`;
    } else {
      // Inner wall with solid color
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
        <rect 
          x="0" 
          y="0" 
          width="${this.width}" 
          height="${this.height}" 
          fill="#666666" 
          stroke="${strokeColor}" 
          stroke-width="1"
        />
      </svg>`;
    }
  }

  /**
   * Export wall data for serialization
   */
  toJSON(): any {
    return {
      type: "wall",
      wallType: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      page: this.page,
      rotate: this.rotate,
    };
  }

  /**
   * Create a WallElement from JSON data
   */
  static fromJSON(data: any): WallElement {
    return new WallElement({
      type: data.wallType,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      page: data.page,
      rotate: data.rotate || 0,
    });
  }
}
