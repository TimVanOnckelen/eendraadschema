# React Conversion Guide for Eendraadschema

## Overview

This document outlines the conversion of the Eendraadschema application from vanilla TypeScript to React 19.

## Changes Made

### 1. Package Configuration (`package.json`)

**Added Dependencies:**

- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `@types/react`: ^19.0.2
- `@types/react-dom`: ^19.0.2
- `@vitejs/plugin-react`: ^4.3.4

### 2. Vite Configuration (`vite.config.ts`)

**Changes:**

- Added React plugin import: `import react from "@vitejs/plugin-react"`
- Added plugin to config: `plugins: [react()]`

### 3. TypeScript Configuration (`tsconfig.json`)

**Added/Updated:**

- `jsx`: "react-jsx" - Enables React 19's new JSX transform
- `allowSyntheticDefaultImports`: true
- `esModuleInterop`: true
- `skipLibCheck`: true
- `strict`: false (can be enabled gradually)
- `resolveJsonModule`: true
- `isolatedModules`: true
- Updated `include` to cover all `src` files

### 4. Entry Point (`index.html`)

**Changes:**

- Changed container div from `id="container"` to `id="root"`
- Updated script reference from `/src/main.ts` to `/src/main.tsx`

### 5. New React Structure

#### `/src/main.tsx` (NEW)

- React application entry point
- Creates React root and renders the App component
- Wraps App in AppProvider for global state management

#### `/src/AppContext.tsx` (NEW)

- React Context for global state management
- Replaces global variables with React state
- Provides hook `useApp()` for accessing global state
- Contains:
  - `session`: Session instance
  - `appDocStorage`: MultiLevelStorage instance
  - `undostruct`: undoRedo instance
  - `fileAPIobj`: importExportUsingFileAPI instance
  - `interactiveSVG`: InteractiveSVG instance
  - `simpleHierarchyView`: SimpleHierarchyView instance
  - `structure`: Hierarchical_List state

#### `/src/App.tsx` (NEW)

- Main React component
- Initializes all global references (for backward compatibility)
- Sets up constants
- Provides placeholder for migrated UI components

## Next Steps

### 1. Install Dependencies

Run: `npm install`

### 2. Test Basic Setup

Run: `npm run dev`
This should start the development server with a basic React app.

### 3. Migrate UI Components

The following need to be converted to React components:

#### Priority Components:

1. **StartScreen Component** (from CONFIGPAGE_LEFT/RIGHT in main.ts)
   - Example selection interface
   - File loading buttons
2. **TopMenu Component** (from TopMenu.ts)
   - Main navigation menu
3. **DocumentationPage Component** (from documentation/documentation.ts)
   - Help and documentation view
4. **SituationPlanPage Component** (from sitplan/SituationPlanView.ts)
   - Situation plan editor
5. **HierarchyView Component** (from Hierarchical_List.ts)
   - Main schema hierarchy view

#### Component Migration Strategy:

```tsx
// Example: Converting StartScreen to React

import React, { useState } from "react";
import { useApp } from "./AppContext";

export const StartScreen: React.FC = () => {
  const { fileAPIobj } = useApp();

  const loadExample = (exampleNum: number) => {
    // Migration logic here
  };

  const loadClicked = () => {
    // File loading logic here
  };

  return (
    <div>
      <table
        border={1}
        style={{ borderCollapse: "collapse" }}
        align="center"
        width="100%"
      >
        <tbody>
          <tr>
            <td style={{ padding: "10px" }}>
              <h2>Welkom op ééndraadschema</h2>
              <p>Deze gratis tool laat toe...</p>
            </td>
          </tr>
        </tbody>
      </table>
      {/* More JSX here */}
    </div>
  );
};
```

### 4. Route Management (Optional)

Consider adding React Router for multi-page navigation:

```bash
npm install react-router-dom @types/react-router-dom
```

### 5. State Management Best Practices

#### Using the App Context:

```tsx
import { useApp } from "./AppContext";

const MyComponent: React.FC = () => {
  const { structure, setStructure, undostruct } = useApp();

  // Use state and methods
  const handleChange = () => {
    // Update structure
    setStructure(newStructure);
    // Store for undo
    undostruct.store();
  };

  return <div>...</div>;
};
```

#### Local Component State:

```tsx
const [localState, setLocalState] = useState(initialValue);
```

### 6. Event Handlers

Convert global functions to React event handlers:

**Before (Global):**

```typescript
globalThis.HLDelete = (my_id: number) => {
  // delete logic
};
```

**After (React):**

```tsx
const handleDelete = (id: number) => {
  // delete logic
};

<button onClick={() => handleDelete(itemId)}>Delete</button>;
```

### 7. Effects and Lifecycle

Use React hooks for lifecycle management:

```tsx
useEffect(() => {
  // componentDidMount logic

  return () => {
    // componentWillUnmount cleanup
  };
}, []); // Empty array = run once on mount
```

### 8. SVG Rendering

Convert SVG manipulation to React patterns:

```tsx
import { useRef, useEffect } from "react";

const SVGComponent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      // Manipulate SVG
    }
  }, []);

  return <svg ref={svgRef}>...</svg>;
};
```

## Backward Compatibility

The current setup maintains backward compatibility by:

1. Keeping global references in `window` and `globalThis`
2. Not removing existing TypeScript files
3. Allowing gradual migration

You can migrate components one at a time while keeping others working with the old approach.

## Testing Strategy

1. **Phase 1**: Basic React app renders
2. **Phase 2**: Migrate StartScreen component
3. **Phase 3**: Migrate TopMenu component
4. **Phase 4**: Migrate remaining components
5. **Phase 5**: Remove backward compatibility code
6. **Phase 6**: Full React optimization

## Common Patterns

### Converting DOM Manipulation to React:

**Before:**

```typescript
document.getElementById("container").innerHTML = html;
```

**After:**

```tsx
const [html, setHtml] = useState("");
return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

Or better:

```tsx
return <div>{/* JSX components */}</div>;
```

### Converting Event Listeners:

**Before:**

```typescript
element.addEventListener("click", handler);
```

**After:**

```tsx
<button onClick={handler}>Click</button>
```

### Converting Classes to Functional Components:

**Before:**

```typescript
class MyClass {
  constructor() {}
  render() {}
}
```

**After:**

```tsx
const MyComponent: React.FC<Props> = (props) => {
  return <div>...</div>;
};
```

## Troubleshooting

### Module Not Found Errors

Run: `npm install` to ensure all dependencies are installed.

### JSX Errors

Ensure `tsconfig.json` has `"jsx": "react-jsx"`.

### Type Errors

Add type assertions where needed: `as any` or define proper TypeScript interfaces.

### Build Errors

Check `vite.config.ts` has the React plugin enabled.

## Resources

- [React 19 Documentation](https://react.dev/)
- [Vite React Plugin](https://github.com/vitejs/vite-plugin-react)
- [TypeScript React](https://react-typescript-cheatsheet.netlify.app/)
- [React Hooks](https://react.dev/reference/react)

## Summary

The foundation for React conversion is now complete. The next major task is migrating the UI components to React, which should be done incrementally to maintain application stability. Start with the StartScreen component as it's the entry point users see first.
