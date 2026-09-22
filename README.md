# Eendraadschema

> Design and draw one-wire electrical diagrams for Belgian AREI legislation — entirely in the browser

[![Build](https://github.com/TimVanOnckelen/eendraadschema/actions/workflows/build.yml/badge.svg)](https://github.com/TimVanOnckelen/eendraadschema/actions/workflows/build.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE.md)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](package.json)

![Eendraadschema Screenshot](img/screenshot1.png)

## Live Demo

Try the application online: **[https://eendraadschema.xeweb.be](https://eendraadschema.xeweb.be)**

## Table of Contents

- [About](#about)
- [Features](#features)
- [Getting Started](#getting-started)
- [Technical Stack](#technical-stack)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About

Eendraadschema is a browser-based tool for designing one-wire electrical diagrams as required by the **Belgian AREI legislation**. No installation, no server — open the app and start drawing.

## Features

### User Interface

- Modern React 19 component architecture
- Ribbon-based interface with compact button layouts
- Dark mode support
- Responsive design with flexbox layouts

### Schema Editor

- Full React implementation of the electrical schema editor
- All original electrical schema functionality preserved
- Improved rendering performance
- Interactive SVG diagrams

### Situation Plan (Situatieschema)

- Searchable SVG symbol library
- Filter symbols by category
- Drag-and-drop placement of electrical symbols
- Element selection and positioning tools
- Multi-page management
- Zoom controls (25%, 50%, 75%, 100%, 150%, 200%)

### File Management

- Auto-save every 5 seconds
- IndexedDB-based local storage
- Recovery dialog for unsaved changes
- Visual save status indicator
- Import/export `.eds` and `.json` files
- PDF export functionality

### Documentation

- Integrated documentation viewer
- PDF manuals included

### WebMCP editing for Codex and ChatGPT

The editor exposes its current eendraadschema document as WebMCP tools. This
lets Codex or ChatGPT inspect and edit a schema through a supported browser
session, without sending the document to an application server.

The available tools are:

| Tool | Purpose |
|---|---|
| `schema.get` | List active schema elements with ids, types, parents and labels |
| `schema.get_element` | Read one element and all of its editable properties |
| `schema.add_element` | Add a supported element at the root or under a parent |
| `schema.update_element` | Change primitive properties on an existing element |
| `schema.delete_element` | Delete an element and its children after explicit confirmation |

In Codex or ChatGPT, open the app in the same WebMCP-enabled browser session
and ask for a concrete operation, for example:

> Find the element named `Keuken`, show its id and properties, then change its
> address to `Keuken gelijkvloers`.

The assistant should read the schema first, use the returned numeric id for an
edit, and describe consequential changes before applying them. Deletion always
requires `confirm: true`; an omitted or false confirmation is rejected by the
editor.

WebMCP is an experimental browser feature. Use a recent Chromium build with
the WebMCP testing flag enabled (`chrome://flags/#enable-webmcp-testing`) and
serve the app from a secure context (`https://` or local development). Browsers
without WebMCP continue to work normally; the tools simply are not registered.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/TimVanOnckelen/eendraadschema.git
cd eendraadschema

# Install dependencies
npm install

# Start development server
npm run dev
```

The application opens at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

Output is placed in the `dist/` folder.

### Google Drive configuration

Google Drive integration uses Google Identity Services with the narrow
`drive.file` OAuth scope. Browser code needs a public OAuth client ID, never a
client secret.

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Configure the OAuth consent screen.
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
5. Add authorized JavaScript origins, for example:
   - `http://localhost:5173`
   - `https://drskunk.github.io`
6. Copy `.env.example` to `.env.local` and set:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For GitHub Pages, add a repository **secret** named `VITE_GOOGLE_CLIENT_ID`
under **Settings → Secrets and variables → Actions → Secrets**. The deployment
workflow passes that secret to Vite during the build. The client ID is public in
the built browser application; using a secret here only avoids putting it in
repository configuration. The older repository variable `GOOGLE_CLIENT_ID` is
also accepted as a fallback.

Files remain in user's Drive. App requests access only to Drive files created
or opened through app.

## Technical Stack

| Tool | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5.8 | Type-safe development |
| Vite 6 | Build tool and dev server |
| IndexedDB | Client-side storage |
| jsPDF 4 | PDF generation |
| pako | Compression |

## Versioning

This project uses **[Semantic Versioning](https://semver.org/)** (`MAJOR.MINOR.PATCH`) driven automatically by [semantic-release](https://semantic-release.gitbook.io/semantic-release/). Releases are created when commits land on `master` — no manual version bumps needed.

The version bump is determined by commit message prefixes:

| Prefix | Example | Result |
|---|---|---|
| `fix:` | `fix: correct voltage label on diagram` | Patch (`1.0.1`) |
| `feat:` | `feat: add zoom to fit button` | Minor (`1.1.0`) |
| `feat!:` or `BREAKING CHANGE:` | `feat!: redesign file format` | Major (`2.0.0`) |

Prefixes like `docs:`, `chore:`, `refactor:`, `style:`, and `test:` do not trigger a release.

## Contributing

Contributions are welcome! Please follow these steps:

1. Open an issue first for any non-trivial change to align on the approach
2. Fork the repository and create a branch from `master`
3. Name your branch descriptively: `feat/zoom-to-fit`, `fix/pdf-export-crash`, etc.
4. Write commits using the [Conventional Commits](https://www.conventionalcommits.org/) format — this is required for the automated release pipeline to work correctly (see [Versioning](#versioning))
5. Open a Pull Request against `master` with a clear description of what changed and why

**Guidelines:**
- Keep pull requests focused — one feature or fix per PR
- Follow the existing TypeScript conventions and component structure
- Test your changes in the browser before opening a PR; CI only verifies the build passes

For contributions to the original vanilla TypeScript version, see [igoethal/eendraadschema](https://github.com/igoethal/eendraadschema).

## License

Licensed under the GNU General Public License v3.0 — see [LICENSE.md](LICENSE.md) for details.

**Copyright:**

- Original eendraadschema: © Ivan Goethals
- This version: © Tim Van Onckelen

## Acknowledgments

This project would not exist without **[Ivan Goethals](https://github.com/igoethal)**, who designed and built the original eendraadschema application. The electrical schema logic, symbol library, and AREI compliance rules all originate from his work.

The original application is available at [igoethal/eendraadschema](https://github.com/igoethal/eendraadschema).

## Support

- [Report bugs](https://github.com/TimVanOnckelen/eendraadschema/issues)
- [Request features](https://github.com/TimVanOnckelen/eendraadschema/issues)
- Questions? Open an issue or start a discussion


## Checks

Run `npm ci`, then `npm test` to build the production bundle.
