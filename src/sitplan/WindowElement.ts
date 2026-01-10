/**
 * WindowElement - Represents a window in the situation plan
 * Windows are rectangular elements typically placed in walls
 */

export interface WindowProperties {
  x: number; // Top-left X coordinate
  y: number; // Top-left Y coordinate
  width: number; // Width of the window
  height: number; // Height of the window
  page: number; // Page number
  rotate?: number; // Rotation angle in degrees
}

/**
 * WindowElement class handles the creation and properties of windows
 */
export class WindowElement {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public page: number;
  public rotate: number;

  // Window default dimensions
  public static readonly DEFAULT_WIDTH = 80;
  public static readonly DEFAULT_HEIGHT = 10;

  constructor(props: WindowProperties) {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.page = props.page;
    this.rotate = props.rotate || 0;
  }

  /**
   * Create SVG representation of the window for rendering
   * Professional architectural style with dashed border and center line
   */
  toSVG(): string {
    const centerY = this.height / 2;

    // Window with dashed border and thin center line (professional architectural style)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
      <!-- White background -->
      <rect 
        x="0" 
        y="0" 
        width="${this.width}" 
        height="${this.height}" 
        fill="white" 
        stroke="black" 
        stroke-width="2"
        stroke-dasharray="5,3"
      />
      <!-- Thin center line -->
      <line 
        x1="0" 
        y1="${centerY}" 
        x2="${this.width}" 
        y2="${centerY}" 
        stroke="black" 
        stroke-width="1"
      />
    </svg>`;
  }

  /**
   * Export window data for serialization
   */
  toJSON(): any {
    return {
      type: "window",
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      page: this.page,
      rotate: this.rotate,
    };
  }

  /**
   * Create a WindowElement from JSON data
   */
  static fromJSON(data: any): WindowElement {
    return new WindowElement({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      page: data.page,
      rotate: data.rotate || 0,
    });
  }
}
