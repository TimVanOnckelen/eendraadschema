# Eendraadschema

> Modern electrical diagram design tool for Belgian AREI standards

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE.md)

![Eendraadschema Screenshot](screenshot1.png)

## 📖 About

**Original Application:** Created by [Ivan Goethals](https://github.com/igoethal) (2019-2025)  
**React 19 Refactor & UI Improvements:** [Tim Van Onckelen](https://github.com/TimVanOnckelen) (2026)

This version is a modern refactor of the original eendraadschema application, migrated to React 19 with an improved user interface while maintaining all the original logic and functionality created by Ivan Goethals.

- 🔗 [Original repository](https://github.com/igoethal/eendraadschema)
- 🔗 [React version repository](https://github.com/TimVanOnckelen/eendraadschema)

## 🎯 Purpose

Design and draw one-wire electrical diagrams as enforced by the **Belgian AREI legislation**. The application runs entirely in the browser and is built with TypeScript.

## ✨ Features

### 🎨 User Interface

- Modern React 19 component architecture
- Ribbon-based interface with compact button layouts
- Responsive design with flexbox layouts
- Improved visual consistency

### ⚡ Schema Editor

- Full React implementation
- Maintained all original electrical schema functionality
- Improved rendering performance
- Interactive SVG diagrams

### 🗺️ Situation Plan (Situatieschema)

- Searchable SVG symbol library
- Filter symbols by category
- Drag-and-drop placement of electrical symbols
- Element selection and positioning tools
- Multi-page management
- Zoom controls (25%, 50%, 75%, 100%, 150%, 200%)

### 💾 File Management

- Auto-save every 5 seconds
- IndexedDB-based local storage
- Recovery dialog for unsaved changes
- Visual save status indicator
- Import/export .eds files
- PDF export functionality

### 📚 Documentation

- Integrated documentation viewer
- PDF manuals included

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
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

The application will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with the built application.

## 🛠️ Technical Stack

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **IndexedDB** - Client-side storage
- **jsPDF** - PDF generation
- **Modern CSS** - Component-based styling

## 🔄 Migration Status

This application is in an active migration phase from vanilla TypeScript to React 19. Approximately **30%** of the UI layer has been migrated to React components, with the remaining code consisting of core business logic and complex rendering systems.

📊 **Detailed Migration Report:** [LEGACY_CODE_AUDIT.md](./LEGACY_CODE_AUDIT.md)

The audit document provides:

- Complete inventory of React vs legacy code
- Detailed analysis of hybrid components
- Migration priorities and recommendations
- Technical debt assessment

## 🤝 Contributing

Contributions are welcome and appreciated!

### How to Contribute

1. 🍴 Fork the repository
2. 🔨 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✅ Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🎉 Open a Pull Request

### Guidelines

- Please open an issue first for major changes to discuss the approach
- Check [LEGACY_CODE_AUDIT.md](./LEGACY_CODE_AUDIT.md) to understand the current migration status
- Follow the existing code style and conventions
- Write clear commit messages

### For the Original Version

Contributions to the original vanilla TypeScript version: [igoethal/eendraadschema](https://github.com/igoethal/eendraadschema)

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see [LICENSE.md](LICENSE.md) for details.

**Copyright:**

- Original Application: © 2019-2025 Ivan Goethals
- React Refactor & UI Improvements: © 2025-2026 Tim Van Onckelen

## 🙏 Acknowledgments

All core functionality for drawing electrical diagrams according to Belgian AREI legislation was developed by **Ivan Goethals**. This React version is a modernization of the architecture and user interface, but the electrical schema logic remains completely the work of Ivan.

## 💬 Support

- 🐛 [Report bugs](https://github.com/TimVanOnckelen/eendraadschema/issues)
- 💡 [Request features](https://github.com/TimVanOnckelen/eendraadschema/issues)
- 📧 Questions? Open an issue or discussion

## ⚠️ Note

This is a hobby project maintained in free time. Commercial use is not planned to maintain the freedom to work on it as desired.

---

**Made with ❤️ in Belgium**

- Technical debt assessment
