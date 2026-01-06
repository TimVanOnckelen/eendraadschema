# Interactive SVG Implementation

## Overview

This implementation makes the electrical schema diagram (SVG) interactive, allowing users to click directly on elements to edit, add, or delete them.

## Files Created/Modified

### New Files:

1. **`src/InteractiveSVG.ts`** - Main module for interactive SVG functionality
2. **`css/InteractiveSVG.css`** - Styling for interactive elements and menus

### Modified Files:

1. **`src/Hierarchical_List.ts`**

   - Added `inSVGIds` array to track element IDs during SVG generation
   - Modified `toSVG()` method to add `data-element-id` attributes to SVG elements
   - Both horizontal and vertical stacking now include element IDs

2. **`src/main.ts`**

   - Added import for `InteractiveSVG` module
   - Modified `HLRedrawTreeSVG()` to call `attachHandlers()` after SVG rendering

3. **`css/all.css`**
   - Added import for `InteractiveSVG.css`

## Features Implemented

### 1. Click Interaction

- **Single Click**: Highlights the element and shows a quick action toolbar
- **Double Click**: Scrolls to the element in the left panel (hierarchical list) and highlights it
- **Right Click**: Shows a context menu with all available actions

### 2. Quick Action Toolbar

Appears next to clicked elements with buttons for:

- ➕ **Na** - Add element after this one
- ➕ **Kind** - Add child element
- 📋 **Clone** - Duplicate this element
- 🗑️ **Verwijder** - Delete this element (with confirmation)

### 3. Context Menu

Right-click context menu with full range of options:

- Edit Properties (scrolls to element in list)
- Insert Before/After
- Insert Child
- Clone
- Move Up/Down
- Delete

### 4. Visual Feedback

- **Hover Effect**: Elements become slightly transparent and cursor changes to pointer
- **Selection Highlight**: Selected element gets a purple border
- **Hover Highlight**: Hovered elements get a dashed grey border

## Technical Details

### SVG Data Attributes

Each SVG element now has a `data-element-id` attribute:

```xml
<svg x="..." y="..." data-element-id="123">
  <!-- element content -->
</svg>
```

### Event Handling

- Uses event delegation on the `#EDS` container
- MutationObserver watches for SVG redraws and re-attaches handlers
- All interactions call existing global `HL*` functions (HLInsertAfter, HLDelete, etc.)

### Auto-Initialization

- InteractiveSVG initializes on `DOMContentLoaded`
- Handlers are re-attached after every call to `HLRedrawTreeSVG()`
- Window object stores the instance for access: `window.interactiveSVG`

## User Workflow

### Before (Old Way):

1. Find element in left hierarchical list
2. Click appropriate button (insert, delete, etc.)
3. SVG updates

### After (New Way):

1. Click directly on element in the diagram
2. Use quick toolbar or right-click menu
3. Element changes immediately

OR:

1. Double-click element in diagram
2. Scrolls to element in left panel
3. Edit properties there

## Benefits

1. **More Intuitive**: Direct manipulation of visual elements
2. **Faster**: No need to search through hierarchical list
3. **Visual Context**: See exactly which element you're editing
4. **Less Errors**: Visual feedback prevents mistakes
5. **Modern UX**: Follows common design patterns (right-click menus, hover states)

## Styling Highlights

- **Purple gradient** theme matching modern UI
- **Smooth animations** for all interactions
- **Box shadows** for depth
- **Responsive hover states**
- **Clean, minimal toolbar design**

## Next Steps (Optional Enhancements)

1. **Drag & Drop**: Reorder elements by dragging in SVG
2. **Inline Property Editing**: Edit properties in a popup without scrolling to list
3. **Multi-Select**: Select multiple elements for batch operations
4. **Keyboard Shortcuts**: Delete with keyboard, etc.
5. **Undo/Redo Visual Feedback**: Animate changes when undoing/redoing

## Testing Checklist

- [ ] Single click shows quick actions
- [ ] Double click scrolls to element in list
- [ ] Right click shows context menu
- [ ] All menu actions work correctly
- [ ] Hover shows visual feedback
- [ ] Selection highlight works
- [ ] Quick actions auto-hide after 5 seconds
- [ ] Context menu closes on click outside
- [ ] Works after undo/redo
- [ ] Works after inserting/deleting elements
- [ ] No console errors

## Browser Compatibility

Should work in all modern browsers:

- Chrome/Edge (Chromium)
- Firefox
- Safari

Uses standard APIs:

- MutationObserver
- SVG DOM manipulation
- CSS3 animations
- ES6+ JavaScript
