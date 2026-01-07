---
Eendraadschema Community edition
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

**Note from Tim Van Onckelen:** This React version is a fork and refactor of Ivan's original
vanilla TypeScript implementation. The migration to React 19 was completed in 2026,
providing a more modern architecture with improved UI/UX while preserving all of Ivan's
original logic and functionality. All core electrical schema logic remains Ivan's work.
