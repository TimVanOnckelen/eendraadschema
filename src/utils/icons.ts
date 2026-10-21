/**
 * Monochrome line icon set.
 *
 * All icons are drawn on a 24x24 grid with a single stroke and use
 * `currentColor`, so they always follow the text colour of their context.
 * Shapes are adapted from the Lucide icon set (ISC licence).
 *
 * React code should use the <Icon /> component; legacy code that builds
 * HTML strings can use iconSvg().
 */

const c = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const r = (x: number, y: number, w: number, h: number, rx = 2) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const p = (...d: string[]) => d.map((x) => `<path d="${x}"/>`).join('');

const FILE = 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z';
const FILE_FOLD = 'M14 2v4a2 2 0 0 0 2 2h4';
const TRAY = 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4';
const CHEVRONS = {
  down: 'm6 9 6 6 6-6',
  up: 'm18 15-6-6-6 6',
  right: 'm9 18 6-6-6-6',
  left: 'm15 18-6-6 6-6',
};

export const ICONS = {
  // Navigation / application
  'schema': p('M3 12h4', 'M17 12h4', 'm7 12 7-5', 'M14 5v14') + c(17, 12, 0.01),
  'floorplan': p('M3 3h18v18H3z', 'M3 12h7', 'M14 12h7', 'M12 3v5', 'M12 13v8'),
  'printer': p('M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6') + r(6, 14, 12, 8, 1),
  'book': p('M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'),
  'info': c(12, 12, 10) + p('M12 16v-4', 'M12 8h.01'),
  'undo': p('M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'),
  'redo': p('m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'),
  'sun': c(12, 12, 4) + p('M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'),
  'moon': p('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'),
  'settings': p('M20 7h-9', 'M14 17H5') + c(17, 17, 3) + c(7, 7, 3),
  'keyboard': r(2, 4, 20, 16) + p('M6 8h.01', 'M10 8h.01', 'M14 8h.01', 'M18 8h.01', 'M8 12h.01', 'M12 12h.01', 'M16 12h.01', 'M7 16h10'),
  'mail': r(2, 4, 20, 16) + p('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'),
  'external-link': p('M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
  'scale': p('m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'm2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'M7 21h10', 'M12 3v18', 'M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2'),
  'sparkle': p('M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'm5.6 5.6 2.8 2.8', 'm15.6 15.6 2.8 2.8', 'm5.6 18.4 2.8-2.8', 'm15.6 8.4 2.8-2.8'),
  'heart': p('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'),

  // Files and storage
  'file': p(FILE, FILE_FOLD),
  'file-text': p(FILE, FILE_FOLD, 'M10 9H8', 'M16 13H8', 'M16 17H8'),
  'file-plus': p(FILE, FILE_FOLD, 'M9 15h6', 'M12 18v-6'),
  'folder': p('M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'),
  'folder-open': p('m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2'),
  'save': p('M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7', 'M7 3v4a1 1 0 0 0 1 1h7'),
  'download': p(TRAY, 'm7 10 5 5 5-5', 'M12 15V3'),
  'upload': p(TRAY, 'm17 8-5-5-5 5', 'M12 3v12'),
  'monitor': r(2, 3, 20, 14) + p('M8 21h8', 'M12 17v4'),
  'cloud': p('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'),
  'hard-drive': p('M22 12H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z', 'M6 16h.01', 'M10 16h.01'),
  'merge': p('m8 6 4-4 4 4', 'M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22', 'm20 22-5-5'),
  'clock': c(12, 12, 10) + p('M12 6v6l4 2'),

  // Generic actions
  'plus': p('M5 12h14', 'M12 5v14'),
  'minus': p('M5 12h14'),
  'x': p('M18 6 6 18', 'm6 6 12 12'),
  'check': p('M20 6 9 17l-5-5'),
  'search': c(11, 11, 8) + p('m21 21-4.3-4.3'),
  'pencil': p('M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'),
  'copy': r(8, 8, 14, 14) + p('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'),
  'trash': p('M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'),
  'refresh': p('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'),
  'chevron-down': p(CHEVRONS.down),
  'chevron-up': p(CHEVRONS.up),
  'chevron-right': p(CHEVRONS.right),
  'chevron-left': p(CHEVRONS.left),
  'arrow-up': p('m5 12 7-7 7 7', 'M12 19V5'),
  'arrow-down': p('M12 5v14', 'm19 12-7 7-7-7'),
  'insert-before': p('M5 3h14', 'm8 14 4-4 4 4', 'M12 10v11'),
  'insert-after': p('M12 3v11', 'm8 10 4 4 4-4', 'M5 21h14'),
  'insert-child': p('m15 10 5 5-5 5', 'M4 4v7a4 4 0 0 0 4 4h12'),
  'bring-front': p('M5 3h14', 'm18 13-6-6-6 6', 'M12 7v14'),
  'send-back': p('M12 17V3', 'm6 11 6 6 6-6', 'M19 21H5'),
  'ban': c(12, 12, 10) + p('m4.9 4.9 14.2 14.2'),
  'eye': p('M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0') + c(12, 12, 3),
  'eye-off': p('M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49', 'M14.084 14.158a3 3 0 0 1-4.242-4.242', 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143', 'm2 2 20 20'),
  'lightbulb': p('M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'),
  'alert': p('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'),
  'circle-check': c(12, 12, 10) + p('m9 12 2 2 4-4'),
  'circle': c(12, 12, 10),
  'list': p('M3 12h.01', 'M3 18h.01', 'M3 6h.01', 'M8 12h13', 'M8 18h13', 'M8 6h13'),

  // Canvas / view
  'zoom-in': c(11, 11, 8) + p('m21 21-4.35-4.35', 'M11 8v6', 'M8 11h6'),
  'zoom-out': c(11, 11, 8) + p('m21 21-4.35-4.35', 'M8 11h6'),
  'zoom-reset': c(12, 12, 10) + p('M22 12h-4', 'M6 12H2', 'M12 6V2', 'M12 22v-4'),
  'zoom-fit': p('M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'),
  'fullscreen': p('M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'),
  'highlight': p('m9 11-6 6v3h9l3-3', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'),
  'layers': p('M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z', 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12', 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17'),
  'image': r(3, 3, 18, 18) + c(9, 9, 2) + p('m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'),
  'wall': r(3, 3, 18, 18) + p('M12 9v6', 'M16 15v6', 'M16 3v6', 'M3 15h18', 'M3 9h18', 'M8 15v6', 'M8 3v6'),
  'window': r(3, 3, 18, 18) + p('M12 3v18', 'M3 12h18'),
  'door': p('M13 4h3a2 2 0 0 1 2 2v14', 'M2 20h3', 'M13 20h9', 'M10 12v.01', 'M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z'),
  'shape': p('M12 3 3 9l3 11h12l3-11z'),
  'palette': c(13.5, 6.5, 0.5) + c(17.5, 10.5, 0.5) + c(8.5, 7.5, 0.5) + c(6.5, 12.5, 0.5) + p('M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z'),
  'square': r(3, 3, 18, 18),
  'square-filled': `<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/>`,
  'move': p('M12 2v20', 'm15 19-3 3-3-3', 'm19 9 3 3-3 3', 'M2 12h20', 'm5 9-3 3 3 3', 'm9 5 3-3 3 3'),
  'type': p('M4 7V4h16v3', 'M9 20h6', 'M12 4v16'),

  // Electrical element categories (used in the element tree)
  'el-board': r(4, 3, 16, 18) + p('M8 7h8', 'M8 11h8', 'M8 15h8'),
  'el-circuit': p('M12 2v6', 'M12 16v6') + r(8, 8, 8, 8, 1),
  'el-supply': p('M12 22v-5', 'M9 8V2', 'M15 8V2', 'M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z'),
  'el-socket': c(12, 12, 9) + p('M9 10v2', 'M15 10v2', 'M12 15v1'),
  'el-light': c(12, 12, 6) + p('m7.8 7.8 8.4 8.4', 'm16.2 7.8-8.4 8.4'),
  'el-switch': c(5, 17, 2) + c(19, 17, 2) + p('M7 17h-.01', 'm6.5 15.5 11-7'),
  'el-split': p('M6 3v12', 'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M15 6a9 9 0 0 0-9 9'),
  'el-protection': p('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'),
  'el-load': c(12, 12, 9) + p('M8 12h8'),
  'el-motor': c(12, 12, 9) + p('M9 16V8l3 5 3-5v8'),
  'el-heat': p('M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z'),
  'el-cold': p('M12 2v20', 'm17 7-5 5-5-5', 'm17 17-5-5-5 5', 'M2 12h20', 'm7 7 5 5 5-5'),
  'el-meter': r(3, 4, 18, 16) + p('M7 15h2', 'M11 15h2', 'M15 15h2', 'M7 9h10'),
  'el-battery': r(2, 7, 16, 10) + p('M22 11v2', 'M6 11v2', 'M10 11v2'),
  'el-solar': r(3, 5, 18, 14, 1) + p('M3 12h18', 'M9 5v14', 'M15 5v14'),
  'el-ev': p('M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2') + c(6.5, 16, 2.5) + c(16.5, 16, 2.5),
  'el-domotics': r(4, 4, 16, 16) + r(9, 9, 6, 6, 1) + p('M9 2v2', 'M15 2v2', 'M9 20v2', 'M15 20v2', 'M2 9h2', 'M2 15h2', 'M20 9h2', 'M20 15h2'),
  'el-box': p('M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'M3.3 7 12 12l8.7-5', 'M12 22V12'),
  'el-earth': p('M12 2v10', 'M5 12h14', 'M8 16h8', 'M11 20h2'),
  'el-media': r(2, 4, 20, 13) + p('M8 21h8', 'M12 17v4'),
  'el-bell': p('M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'),
  'el-text': p('M4 7V4h16v3', 'M9 20h6', 'M12 4v16'),
  'el-space': r(3, 3, 18, 18) + p('M3 3l18 18'),
  'el-point': c(12, 10, 3) + p('M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'),
  'el-cable': p('M3 12c3-6 6 6 9 0s6 6 9 0'),
  'el-generic': c(12, 12, 9) + p('M12 8v8', 'M8 12h8'),
} as const;

export type IconName = keyof typeof ICONS;

/** Returns an inline SVG string for use in HTML templates. */
export function iconSvg(name: IconName, size = 16, strokeWidth = 1.75): string {
  return (
    `<svg class="ui-icon" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    ICONS[name] +
    `</svg>`
  );
}

/** Maps an element type name (as shown in the UI) to an icon. */
export function elementTypeIcon(type: string): IconName {
  const map: Record<string, IconName> = {
    'Aansluiting': 'el-supply',
    'Aansluitpunt': 'el-point',
    'Bord': 'el-board',
    'Kring': 'el-circuit',
    'Leiding': 'el-cable',
    'Splitsing': 'el-split',
    'Zekering': 'el-protection',
    'Zekering/differentieel': 'el-protection',
    'Overspanningsbeveiliging': 'el-protection',
    'Aardingsonderbreker': 'el-earth',
    'Lichtpunt': 'el-light',
    'Lichtcircuit': 'el-light',
    'Contactdoos': 'el-socket',
    'USB lader': 'el-socket',
    'Schakelaar': 'el-switch',
    'Schakelaars': 'el-switch',
    'Drukknop': 'el-switch',
    'Verbruiker': 'el-load',
    'Meerdere verbruikers': 'el-load',
    'Motor': 'el-motor',
    'Ventilator': 'el-motor',
    'Wasmachine': 'el-load',
    'Droogkast': 'el-load',
    'Vaatwasmachine': 'el-load',
    'Microgolfoven': 'el-load',
    'Boiler': 'el-heat',
    'Elektrische oven': 'el-heat',
    'Kookfornuis': 'el-heat',
    'Stoomoven': 'el-heat',
    'Ketel': 'el-heat',
    'Verwarmingstoestel': 'el-heat',
    'Koelkast': 'el-cold',
    'Diepvriezer': 'el-cold',
    'Warmtepomp/airco': 'el-cold',
    'Zonnepaneel': 'el-solar',
    'Omvormer': 'el-load',
    'Transformator': 'el-load',
    'Batterij': 'el-battery',
    'EV lader': 'el-ev',
    'Elektriciteitsmeter': 'el-meter',
    'Domotica': 'el-domotics',
    'Domotica module (verticaal)': 'el-domotics',
    'Domotica gestuurde verbruiker': 'el-domotics',
    'Aftakdoos': 'el-box',
    'Media': 'el-media',
    'Bel': 'el-bell',
    'Vrije tekst': 'el-text',
    'Vrije ruimte': 'el-space',
  };
  return map[type] ?? 'el-generic';
}
