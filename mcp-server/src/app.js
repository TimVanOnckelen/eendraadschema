/**
 * Headless copy of the Eendraadschema web app, driven through Playwright.
 *
 * All schema logic stays in the app itself; this class only loads it and calls
 * `globalThis.eendraadschemaMCP` (see src/mcp/schemaTools.ts).
 */

import { createServer } from 'node:http';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/** Serve a built dist folder on 127.0.0.1; ES modules do not load from file:// URLs. */
const serveFolder = root => new Promise((resolve, reject) => {
  const server = createServer(async (request, response) => {
    try {
      const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let filePath = path.join(root, urlPath);
      if (filePath !== root && !filePath.startsWith(root + path.sep)) throw new Error('outside root');
      if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      const body = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server));
});

export class SchemaApp {
  constructor({ app, headed = false }) {
    this.app = app;
    this.headed = headed;
    this.currentFile = null;
  }

  async start() {
    if (/^https?:\/\//.test(this.app)) {
      this.url = this.app;
    } else {
      const root = path.resolve(this.app);
      if (!existsSync(path.join(root, 'index.html'))) {
        throw new Error(`No built app found in ${root}. Run "npm run build" in the repository root, or pass --app <url>.`);
      }
      this.httpServer = await serveFolder(root);
      this.url = `http://127.0.0.1:${this.httpServer.address().port}/`;
    }

    this.browser = await chromium.launch({
      headless: !this.headed,
      executablePath: process.env.EDS_CHROMIUM_PATH || undefined,
    });
    // A fresh context per run: no autosave from a previous session, no recovery prompt.
    this.context = await this.browser.newContext({ viewport: { width: 1400, height: 900 } });
    this.page = await this.context.newPage();
    this.page.on('dialog', dialog => void dialog.dismiss());
    this.page.on('pageerror', error => console.error(`[app] ${error.message}`));

    await this.page.goto(this.url);
    await this.page.waitForFunction(
      () => globalThis.eendraadschemaMCP && globalThis.structure && globalThis.undostruct,
      null,
      { timeout: 30000 },
    ).catch(() => {
      throw new Error(`${this.url} did not expose the Eendraadschema MCP tools. Is it a build that includes src/mcp/schemaTools.ts?`);
    });
  }

  listTools() {
    return this.page.evaluate(() => globalThis.eendraadschemaMCP.listTools());
  }

  async callTool(name, args) {
    const outcome = await this.page.evaluate(async ({ name, args }) => {
      try {
        return { ok: true, value: await globalThis.eendraadschemaMCP.callTool(name, args) };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    }, { name, args });
    if (!outcome.ok) throw new Error(outcome.message);
    return outcome.value;
  }

  async renderPng() {
    const svg = await this.page.evaluate(() => globalThis.eendraadschemaMCP.renderSvg());
    const page = await this.context.newPage();
    try {
      await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">${svg}</body></html>`);
      return await page.locator('svg').first().screenshot({ type: 'png' });
    } finally {
      await page.close();
    }
  }

  async stop() {
    await this.browser?.close().catch(() => {});
    this.httpServer?.close();
  }
}
