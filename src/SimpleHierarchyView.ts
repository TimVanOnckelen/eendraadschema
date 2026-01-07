/**
 * SimpleHierarchyView - Bridge to React component
 */

export class SimpleHierarchyView {
  private refreshCallback: (() => void) | null = null;

  constructor() {
    // Empty constructor
  }

  setRefreshCallback(callback: () => void) {
    this.refreshCallback = callback;
  }

  render() {
    if (this.refreshCallback) {
      this.refreshCallback();
    }
  }
}

export default SimpleHierarchyView;
