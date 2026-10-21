/**
 * End-to-end smoke test: start the server over stdio with the MCP SDK client
 * and exercise the main tools against the built app (run `npm run build` in the
 * repository root first).
 */

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = await mkdtemp(path.join(os.tmpdir(), 'eds-mcp-'));

const client = new Client({ name: 'smoke-test', version: '1.0.0' });
await client.connect(new StdioClientTransport({
  command: process.execPath,
  args: [path.resolve(here, '../src/index.js')],
  env: process.env,
  stderr: 'inherit',
}));

const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) throw new Error(`${name}: ${result.content[0].text}`);
  return result.content[0].type === 'text' ? JSON.parse(result.content[0].text) : result.content[0];
};

const expectError = async (name, args, pattern) => {
  const result = await client.callTool({ name, arguments: args });
  assert.equal(result.isError, true, `${name} should fail`);
  assert.match(result.content[0].text, pattern);
};

try {
  const { tools } = await client.listTools();
  const names = tools.map(tool => tool.name);
  for (const name of ['schema_get_tree', 'schema_add_element', 'schema_validate', 'file_open', 'file_save', 'schema_render']) {
    assert.ok(names.includes(name), `missing tool ${name}`);
  }
  assert.ok(names.every(name => /^[a-zA-Z0-9_-]{1,64}$/.test(name)), 'tool names must be valid for all MCP clients');

  // Open an example file.
  const opened = await call('file_open', { path: path.resolve(here, '../../examples/example000.eds') });
  assert.ok(opened.elementCount > 0);

  // Start fresh and build a small installation.
  await call('schema_new', { confirm: true });
  const board = (await call('schema_get')).elements.find(element => element.type === 'Bord');
  assert.ok(board, 'default schema has a board');
  assert.ok((await call('schema_list_types', { parentId: board.id })).types.includes('Kring'));

  const kring = (await call('schema_add_element', {
    type: 'Kring', parentId: board.id, properties: { naam: 'K', amperage: '20', type_kabel: 'XVB Cca 3G1,5' },
  })).element;
  assert.equal(kring.properties.naam, 'K', 'explicit circuit names are kept');

  for (let i = 0; i < 9; i += 1) {
    await call('schema_add_element', { type: 'Contactdoos', parentId: kring.id });
  }
  const kringAfter = await call('schema_get_element', { id: kring.id });
  assert.equal(kringAfter.childCount, 9, 'children are appended to the circuit');

  const { issues } = await call('schema_validate');
  assert.ok(issues.some(issue => issue.elementId === kring.id && /socket outlets/.test(issue.message)));
  assert.ok(issues.some(issue => issue.elementId === kring.id && /1,5 mm²/.test(issue.message)));

  // Invalid operations are refused with a clear message.
  await expectError('schema_add_element', { type: 'Lichtpunt' }, /cannot be added at the root/);
  await expectError('schema_update_element', { id: kring.id, properties: { type: 'Bord' } }, /schema_change_type/);
  await expectError('schema_delete_element', { id: kring.id, confirm: false }, /confirm=true/);
  await expectError('file_save', { path: path.join(tmp, 'x.txt') }, /\.eds and \.json/);

  // Save as both formats and reopen.
  for (const file of ['out.eds', 'out.json']) {
    const target = path.join(tmp, file);
    await call('file_save', { path: target });
    assert.ok((await readFile(target, 'utf8')).length > 0);
    const reopened = await call('file_open', { path: target });
    assert.equal(reopened.elementCount, (await call('schema_get')).elementCount);
  }

  const image = await call('schema_render');
  assert.equal(image.mimeType, 'image/png');
  assert.ok(image.data.length > 1000);

  console.log(`Smoke test passed (${names.length} tools).`);
} finally {
  await client.close();
  await rm(tmp, { recursive: true, force: true });
}
