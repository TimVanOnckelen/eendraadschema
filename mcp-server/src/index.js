#!/usr/bin/env node
/**
 * Eendraadschema MCP server.
 *
 * Runs the real Eendraadschema web app in headless Chromium and exposes the
 * schema tools defined in src/mcp/schemaTools.ts over MCP (stdio), plus a few
 * tools that need the local machine: opening/saving files and rendering a PNG.
 *
 * Usage: node src/index.js [--app <url or dist folder>] [--headed]
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SchemaApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = argv => {
  const options = {
    app: process.env.EDS_APP || path.resolve(here, '../../dist'),
    headed: process.env.EDS_HEADED === '1',
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--app') options.app = argv[++i];
    else if (argv[i] === '--headed') options.headed = true;
  }
  return options;
};

const SCHEMA_EXTENSIONS = ['.eds', '.json'];

const resolveSchemaPath = filePath => {
  if (!filePath) throw new Error('A file path is required.');
  const resolved = path.resolve(filePath);
  if (!SCHEMA_EXTENSIONS.includes(path.extname(resolved).toLowerCase())) {
    throw new Error('Only .eds and .json schema files are supported.');
  }
  return resolved;
};

/** Tools that only make sense outside the browser. */
const localTools = app => [
  {
    name: 'file_open',
    title: 'Open schema file',
    description: 'Open an .eds or .json schema file from disk, replacing the schema currently loaded in this server. Use an absolute path.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Absolute path of the .eds or .json file.' } },
      required: ['path'], additionalProperties: false,
    },
    annotations: { destructiveHint: true },
    execute: async ({ path: filePath }) => {
      const resolved = resolveSchemaPath(filePath);
      const content = await readFile(resolved, 'utf8');
      const result = await app.callTool('schema_import', { content, confirm: true });
      app.currentFile = resolved;
      return { ...result, path: resolved };
    },
  },
  {
    name: 'file_save',
    title: 'Save schema file',
    description: 'Save the current schema to disk. The format follows the extension: .eds (compressed, the app default) or .json. Defaults to the last opened or saved file. Overwrites existing files.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Absolute path of the .eds or .json file to write.' } },
      additionalProperties: false,
    },
    annotations: { destructiveHint: true },
    execute: async ({ path: filePath } = {}) => {
      const target = filePath || app.currentFile;
      if (!target) throw new Error('No file is open yet; pass a path.');
      const resolved = resolveSchemaPath(target);
      const format = path.extname(resolved).toLowerCase() === '.json' ? 'json' : 'eds';
      const { content } = await app.callTool('schema_export', { format });
      await writeFile(resolved, content, 'utf8');
      app.currentFile = resolved;
      return { success: true, path: resolved, format, bytes: Buffer.byteLength(content) };
    },
  },
  {
    name: 'schema_render',
    title: 'Render schema',
    description: 'Render the one-wire diagram as it appears in the editor and return it as a PNG image, to visually check the result.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => ({ image: await app.renderPng() }),
  },
];

const toContent = result => {
  if (result && result.image) {
    return [{ type: 'image', data: result.image.toString('base64'), mimeType: 'image/png' }];
  }
  return [{ type: 'text', text: JSON.stringify(result, null, 2) }];
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const app = new SchemaApp(options);
  await app.start();

  const appTools = await app.listTools();
  const extraTools = localTools(app);
  const allTools = [...appTools, ...extraTools.map(({ execute, ...tool }) => tool)];

  const server = new Server(
    { name: 'eendraadschema', version: '1.0.0' },
    {
      capabilities: { tools: {} },
      instructions:
        'Tools to read and edit Belgian one-wire electrical diagrams (AREI) with Eendraadschema. ' +
        'Open a file with file_open (or start with schema_new), inspect it with schema_get_tree, ' +
        'use schema_list_types/schema_describe_type before adding elements, run schema_validate, ' +
        'check the drawing with schema_render and write the result with file_save. ' +
        'Element types and property names are Dutch, as in the app.',
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args = {} } = request.params;
    try {
      const local = extraTools.find(tool => tool.name === name);
      const result = local ? await local.execute(args) : await app.callTool(name, args);
      return { content: toContent(result) };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] };
    }
  });

  const shutdown = async () => {
    await app.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.stdin.on('close', shutdown);

  await server.connect(new StdioServerTransport());
  console.error(`Eendraadschema MCP server ready (app: ${app.url}).`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
