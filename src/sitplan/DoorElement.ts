/**
 * DoorElement - Represents a door in the situation plan
 * Doors are represented with a quarter circle arc
 */

export interface DoorProperties {
  x: number; // Top-left X coordinate
  y: number; // Top-left Y coordinate
  width: number; // Width of the door
  height: number; // Height of the door (typically same as width for square)
  page: number; // Page number
  rotate?: number; // Rotation angle in degrees
}

/**
 * DoorElement class handles the creation and properties of doors
 */
export class DoorElement {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public page: number;
  public rotate: number;

  // Door default dimensions
  public static readonly DEFAULT_SIZE = 80;

  constructor(props: DoorProperties) {
    this.x = props.x;
    this.y = props.y;
    this.width = props.width;
    this.height = props.height;
    this.page = props.page;
    this.rotate = props.rotate || 0;
  }

  /**
   * Create SVG representation of the door for rendering
   * Professional architectural style with quarter circle arc
   */
  toSVG(): string {
    // Door is represented as a quarter circle arc from bottom-left corner
    // The arc shows the door swing direction
    const radius = Math.min(this.width, this.height);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${
      this.width
    }" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
      <!-- Door swing arc (quarter circle) -->
      <path 
        d="M 0,${this.height} A ${radius},${radius} 0 0,1 ${radius},${
      this.height - radius
    }"
        fill="none"
        stroke="black"
        stroke-width="1.5"
      />
      <!-- Door position line (where door is when closed) -->
      <line 
        x1="0" 
        y1="${this.height}" 
        x2="${radius}" 
        y2="${this.height}" 
        stroke="black" 
        stroke-width="2"
      />
    </svg>`;
  }

  /**
   * Export door data for serialization
   */
  toJSON(): any {
    return {
      type: "door",
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      page: this.page,
      rotate: this.rotate,
    };
  }

  /**
   * Create a DoorElement from JSON data
   */
  static fromJSON(data: any): DoorElement {
    return new DoorElement({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      page: data.page,
      rotate: data.rotate || 0,
    });
  }
}
