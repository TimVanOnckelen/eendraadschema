---
Eendraadschema
---

## About

**Original Application:** Created by Ivan Goethals (2019-2025)  
**React 19 Refactor & UI Improvements:** Tim Van Onckelen (2026)

This version is a modern refactor of the original eendraadschema application,
migrated to React 19 with an improved user interface while maintaining all
the original logic and functionality created by Ivan Goethals.

- Original repository: https://github.com/igoethal/eendraadschema
- React version repository: https://github.com/TimVanOnckelen/eendraadschema

## Purpose

Design and draw a one-wire diagram as enforced by the Belgian AREI legislation.
Source code written in Typescript, transpiled to Javascript and run in a browser.

## Build

Ensure you have vite installed, usually this is done using
`npm install vite@latest`

Then run
`npm run dev`

Open the indicated url in a browser window.

A single file version can be built using
`npm run build`

This will create a single "`index.html`" file in the "`dist`"-folder
The "`index.html`"-file will still need all the resources in the root folder so must be renamed and
copied into the root-folder to get a working application.
The default build configuration is only provided as an example.

## License

See LICENSE.md

## Frequent questions

### Do you have commercial plans?

No.

For me this is 100% a hobby-activity that I work on when and how I see fit.
It helps me to learn new skills and keep the brain cells activated.
I prefer to manage this project with as little constraints as possible.

Any commercialisation would interfere with the freedom that I currently enjoy.
I therefore have no plans in that direction.

### Can I contribute?

Yes! Contributions are welcome and appreciated.

**For this React version:**

- Feel free to submit pull requests with bug fixes, improvements, or new features
- Please open an issue first for major changes to discuss the approach
- Check the [LEGACY_CODE_AUDIT.md](./LEGACY_CODE_AUDIT.md) to understand the current migration status
- Follow the existing code style and conventions

**For the original version:**

- See Ivan Goethals' repository: https://github.com/igoethal/eendraadschema

**Note from Tim Van Onckelen:** This React version is a fork and refactor of Ivan's original
vanilla TypeScript implementation. The migration to React 19 was completed in 2026,
providing a more modern architecture with improved UI/UX while preserving all of Ivan's
original logic and functionality. All core electrical schema logic remains Ivan's work.

## React Version Features

This refactored version includes the following improvements and updates:

### User Interface

- Migrated all views to React 19 components
- Modern ribbon-based interface with compact button layouts
- Improved visual consistency across the application
- Responsive design with flexbox layouts

### Schema Editor

- Full React implementation of the schema editor
- Maintained all original electrical schema functionality
- Improved rendering performance

### Situation Plan (Situatieschema)

- Complete React migration with modern UI
- Sidebar with searchable SVG symbol library
- Filter symbols by category
- Drag-and-drop placement of electrical symbols
- Element selection and positioning tools
- Page management (add, delete, navigate between pages)
- Zoom controls (25%, 50%, 75%, 100%, 150%, 200%)

### File Management

- Automatic save functionality every 5 seconds
- IndexedDB-based local storage
- Recovery dialog on application load if unsaved changes detected
- Visual save status indicator
- Import/export of .eds files
- PDF export functionality

### Documentation

- Integrated documentation viewer
- Access to PDF manuals (note: manuals are from the original version)

### Technical Stack

- React 19 with TypeScript
- Vite build system
- Modern CSS with component-based styling
- IndexedDB for local storage
- Maintained compatibility with original .eds file format

## Migration Status

This application is in an active migration phase from vanilla TypeScript to React 19.
Approximately 30% of the UI layer has been migrated to React components, with the remaining
code consisting of core business logic and complex rendering systems.

For a detailed breakdown of what has been migrated and what remains legacy code, see:
**[LEGACY_CODE_AUDIT.md](./LEGACY_CODE_AUDIT.md)**

The audit document provides:

- Complete inventory of React vs legacy code
- Detailed analysis of hybrid components
- Migration priorities and recommendations
- Technical debt assessment
