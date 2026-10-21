/**
 * Transport-agnostic schema tools.
 *
 * The same definitions are registered with WebMCP (see ../webmcp.ts) and exposed
 * on `globalThis.eendraadschemaMCP` so the headless Node MCP server in
 * /mcp-server can call them through Playwright.
 *
 * Tool names only use [a-z0-9_] because several MCP clients (including the
 * Claude API) reject dots in tool names.
 */

import { Hierarchical_List } from '../Hierarchical_List';
import { Electro_Item } from '../List_Item/Electro_Item';
import { EDStoStructure, serializeCurrentStructure } from '../importExport/importExport';
import { buildNewStructure } from '../utils/structureUtils';
import { flattenSVGfromString } from '../general';

export type SchemaTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: any) => unknown | Promise<unknown>;
  annotations?: Record<string, boolean>;
};

/** Types the editor offers for elements without a parent. */
const ROOT_TYPES = ['Aansluiting', 'Zekering/differentieel', 'Kring'];

/** Highest breaker rating per conductor cross-section (mm²) for household circuits. */
const MAX_AMPERAGE_PER_SECTION: Array<[number, number]> = [
  [1.5, 16], [2.5, 20], [4, 25], [6, 32], [10, 40],
];

const MAX_SOCKETS_PER_CIRCUIT = 8;

const error = (message: string): never => {
  throw new Error(message);
};

const structureOrThrow = (): Hierarchical_List => {
  const structure = (globalThis as any).structure as Hierarchical_List | undefined;
  if (!structure) error('No schema is loaded.');
  return structure;
};

const itemOrThrow = (structure: Hierarchical_List, id: number): Electro_Item => {
  const item = structure.getElectroItemById(id);
  if (!item) error(`No schema element exists with id ${id}.`);
  return item;
};

const cleanTypeList = (types: string[]) => types.filter(type => type !== '' && type !== '---');

const allowedChildTypes = (structure: Hierarchical_List, parentId: number): string[] =>
  parentId ? cleanTypeList(itemOrThrow(structure, parentId).allowedChilds()) : ROOT_TYPES;

const activeIds = (structure: Hierarchical_List) => structure.id.filter((_, i) => structure.active[i]);

const childIds = (structure: Hierarchical_List, parentId: number) =>
  activeIds(structure).filter(id => structure.getElectroItemById(id)?.parent === parentId);

const isInsideKring = (item: Electro_Item | null) => {
  for (let current = item; current; current = current.getParent()) {
    if (current.getType() === 'Kring') return true;
  }
  return false;
};

const elementSummary = (structure: Hierarchical_List, id: number) => {
  const item = itemOrThrow(structure, id);
  return {
    id,
    type: item.getType(),
    parentId: item.parent || 0,
    depth: item.indent || 0,
    name: item.props?.naam || '',
    address: item.props?.adres || '',
    number: item.props?.nr ?? null,
    childCount: childIds(structure, id).length,
  };
};

const elementDetails = (structure: Hierarchical_List, id: number) => {
  const item = itemOrThrow(structure, id);
  return {
    ...elementSummary(structure, id),
    properties: { ...item.props },
    allowedChildTypes: cleanTypeList(item.allowedChilds()),
    canAddChild: item.checkInsertChild(),
  };
};

const treeNode = (structure: Hierarchical_List, id: number): Record<string, unknown> => {
  const { childCount, depth, ...summary } = elementSummary(structure, id);
  const children = childIds(structure, id).map(childId => treeNode(structure, childId));
  return children.length ? { ...summary, children } : summary;
};

const assignProperties = (item: Electro_Item, properties: Record<string, unknown> = {}) => {
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'type') error('Use schema_change_type to change the type of an element.');
    if (!(key in item.props)) error(`Property ${key} is not available on element type ${item.getType()}.`);
    if (!['string', 'number', 'boolean'].includes(typeof value)) error(`Property ${key} must be a string, number or boolean.`);
  }
  Object.assign(item.props, properties);
  // Circuits are named automatically (A, B, ...) unless naming is set to manual.
  if ('naam' in properties && !('autoKringNaam' in properties) && 'autoKringNaam' in item.props) {
    item.props.autoKringNaam = 'manueel';
  }
};

const refreshSchema = (structure: Hierarchical_List) => {
  structure.reSort();
  structure.reNumber();
  (globalThis as any).undostruct?.store();
  (globalThis as any).HLRedrawTree?.();
  (globalThis as any).simpleHierarchyView?.render();
};

const parseSection = (cable: string): number | null => {
  // Matches the conductor section in notations such as "XVB Cca 3G2,5" or "4x16".
  const match = /\d+\s*[GgXx×]\s*(\d+(?:[.,]\d+)?)/.exec(cable || '');
  return match ? parseFloat(match[1].replace(',', '.')) : null;
};

/** Descendants of a circuit, not descending into nested circuits. */
const circuitMembers = (structure: Hierarchical_List, kringId: number): Electro_Item[] => {
  const members: Electro_Item[] = [];
  for (const id of childIds(structure, kringId)) {
    const item = structure.getElectroItemById(id);
    if (!item || item.getType() === 'Kring') continue;
    members.push(item, ...circuitMembers(structure, id));
  }
  return members;
};

const validateSchema = () => {
  const structure = structureOrThrow();
  const issues: Array<{ severity: 'warning' | 'info'; elementId: number; message: string }> = [];

  for (const id of activeIds(structure)) {
    const item = structure.getElectroItemById(id);
    if (!item) continue;
    const type = item.getType();
    const label = item.props.naam ? `${type} ${item.props.naam}` : type || 'element';

    if (type === '') {
      issues.push({ severity: 'info', elementId: id, message: 'Element has no type yet.' });
      continue;
    }
    if (type !== 'Kring') continue;

    const members = circuitMembers(structure, id);
    const parentType = item.getParent()?.getType();
    const protection = item.props.bescherming;
    const amperage = parseFloat(String(item.props.amperage).replace(',', '.'));
    const section = item.props.kabel_is_aanwezig ? parseSection(item.props.type_kabel) : null;

    if (parentType === 'Bord' && (!item.props.naam || item.props.naam === '---')) {
      issues.push({ severity: 'warning', elementId: id, message: 'Circuit directly below a board has no name.' });
    }
    if (parentType === 'Bord' && protection === 'geen') {
      issues.push({ severity: 'warning', elementId: id, message: `${label} is directly below a board but has no protection.` });
    }
    if (members.length === 0) {
      issues.push({ severity: 'info', elementId: id, message: `${label} has no connected elements.` });
    }

    const sockets = members.filter(member => member.getType() === 'Contactdoos').length;
    if (sockets > MAX_SOCKETS_PER_CIRCUIT) {
      issues.push({
        severity: 'warning', elementId: id,
        message: `${label} has ${sockets} socket outlets; AREI allows at most ${MAX_SOCKETS_PER_CIRCUIT} single or multiple socket outlets per circuit.`,
      });
    }

    if (section !== null && !isNaN(amperage) && ['automatisch', 'differentieelautomaat'].includes(protection)) {
      const limit = MAX_AMPERAGE_PER_SECTION.find(([mm2]) => Math.abs(mm2 - section) < 0.01)?.[1];
      if (limit !== undefined && amperage > limit) {
        issues.push({
          severity: 'warning', elementId: id,
          message: `${label} is protected at ${amperage} A, but a ${String(section).replace('.', ',')} mm² cable allows at most ${limit} A.`,
        });
      }
    }
  }

  return {
    valid: !issues.some(issue => issue.severity === 'warning'),
    issues,
    note: 'Indicative checks only (circuit naming, protection, socket count, breaker vs cable section). This does not replace an AREI inspection.',
  };
};

const confirmOrThrow = (confirm: boolean, action: string) => {
  if (confirm !== true) error(`${action} requires confirm=true.`);
};

const idProperty = (description: string) => ({ type: 'integer', description });

export const schemaTools: SchemaTool[] = [
  {
    name: 'schema_get',
    title: 'Read electrical schema',
    description: 'List the elements of the current one-wire schema (ids, types, parents, depth, names, numbers) in display order. Use offset/limit to page through large schemas.',
    inputSchema: {
      type: 'object',
      properties: {
        offset: { type: 'integer', description: 'Number of elements to skip. Defaults to 0.' },
        limit: { type: 'integer', description: 'Maximum number of elements to return, from 1 to 500. Defaults to 200.' },
      },
      additionalProperties: false,
    },
    execute: ({ offset = 0, limit = 200 }: { offset?: number; limit?: number } = {}) => {
      const structure = structureOrThrow();
      const ids = activeIds(structure);
      const start = Math.max(0, Math.floor(offset));
      const max = Math.max(1, Math.min(500, Math.floor(limit)));
      const elements = ids.slice(start, start + max).map(id => elementSummary(structure, id));
      return {
        filename: structure.properties.filename,
        elementCount: ids.length,
        offset: start,
        hasMore: start + elements.length < ids.length,
        elements,
      };
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_get_tree',
    title: 'Read schema as a tree',
    description: 'Return the full schema as a nested tree of elements (id, type, name, number, children), without properties.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => {
      const structure = structureOrThrow();
      return { filename: structure.properties.filename, tree: childIds(structure, 0).map(id => treeNode(structure, id)) };
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_get_element',
    title: 'Read schema element',
    description: 'Read one schema element by id, including all editable properties and the element types that may be added below it.',
    inputSchema: {
      type: 'object', properties: { id: idProperty('The schema element id.') },
      required: ['id'], additionalProperties: false,
    },
    execute: ({ id }: { id: number }) => elementDetails(structureOrThrow(), id),
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_list_types',
    title: 'List element types',
    description: 'List the element types that can be added at the root (omit parentId) or below a given parent element.',
    inputSchema: {
      type: 'object', properties: { parentId: idProperty('Optional parent element id. Omit or use 0 for the root.') },
      additionalProperties: false,
    },
    execute: ({ parentId = 0 }: { parentId?: number } = {}) => {
      const structure = structureOrThrow();
      return {
        parentId,
        canAddChild: parentId ? itemOrThrow(structure, parentId).checkInsertChild() : true,
        types: allowedChildTypes(structure, parentId),
      };
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_describe_type',
    title: 'Describe element type',
    description: 'Return the editable properties of an element type with their default values, so you know which properties schema_add_element and schema_update_element accept.',
    inputSchema: {
      type: 'object', properties: { type: { type: 'string', description: 'Element type, as returned by schema_list_types.' } },
      required: ['type'], additionalProperties: false,
    },
    execute: ({ type }: { type: string }) => {
      const probe = structureOrThrow().createItem(type);
      if (probe.getType() !== type) error(`Unsupported schema element type: ${type}.`);
      const { type: _type, nr: _nr, ...properties } = probe.props;
      return { type, properties };
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_add_element',
    title: 'Add schema element',
    description: 'Add an element. By default it becomes the last child of parentId (or a root element when parentId is omitted). Use afterId or beforeId to insert it as a sibling of an existing element instead. Initial properties can be set in the same call.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Element type, such as Kring, Bord, Contactdoos or Lichtpunt. See schema_list_types.' },
        parentId: idProperty('Parent element id. Omit or use 0 for a root element.'),
        afterId: idProperty('Insert as the next sibling of this element instead of below parentId.'),
        beforeId: idProperty('Insert as the previous sibling of this element instead of below parentId.'),
        properties: { type: 'object', description: 'Optional initial property values (strings, numbers or booleans). See schema_describe_type.' },
      },
      required: ['type'], additionalProperties: false,
    },
    execute: ({ type, parentId = 0, afterId, beforeId, properties }:
      { type: string; parentId?: number; afterId?: number; beforeId?: number; properties?: Record<string, unknown> }) => {
      const structure = structureOrThrow();
      if (afterId && beforeId) error('Use either afterId or beforeId, not both.');
      const siblingId = afterId || beforeId;
      const targetParentId = siblingId ? itemOrThrow(structure, siblingId).parent || 0 : parentId;
      const parent = targetParentId ? itemOrThrow(structure, targetParentId) : null;

      if (!allowedChildTypes(structure, targetParentId).includes(type)) {
        error(`${type} cannot be added ${parent ? `below ${parent.getType()} ${targetParentId}` : 'at the root'}. Allowed: ${allowedChildTypes(structure, targetParentId).join(', ')}.`);
      }
      if (parent && !parent.checkInsertChild()) {
        error(`${parent.getType()} ${targetParentId} cannot take more children (maximum ${parent.getMaxNumChilds()}).`);
      }
      if (type === 'Leiding' && !isInsideKring(parent)) error('A Leiding (cable change) must be added inside a Kring.');

      const siblings = childIds(structure, targetParentId);
      let item = structure.createItem(type);
      if (afterId) structure.insertItemAfterId(item, afterId);
      else if (beforeId) structure.insertItemBeforeId(item, beforeId);
      else if (siblings.length) structure.insertItemAfterId(item, siblings[siblings.length - 1]);
      else if (targetParentId) structure.insertChildAfterId(item, targetParentId);
      else item = structure.addItem(type);

      // Defaults of some types (e.g. Kring) depend on the parent, which is only known now.
      item.resetProps();
      assignProperties(item, properties);
      refreshSchema(structure);
      return { success: true, element: elementDetails(structure, item.id) };
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema_update_element',
    title: 'Update schema element',
    description: 'Update editable properties of one element. Values must be strings, numbers or booleans; use schema_change_type to change the type.',
    inputSchema: {
      type: 'object',
      properties: {
        id: idProperty('The schema element id.'),
        properties: { type: 'object', description: 'Property names and their new primitive values.' },
      },
      required: ['id', 'properties'], additionalProperties: false,
    },
    execute: ({ id, properties }: { id: number; properties: Record<string, unknown> }) => {
      const structure = structureOrThrow();
      assignProperties(itemOrThrow(structure, id), properties);
      refreshSchema(structure);
      return { success: true, element: elementDetails(structure, id) };
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema_change_type',
    title: 'Change element type',
    description: 'Change the type of an existing element. Its properties are reset to the defaults of the new type; children are kept.',
    inputSchema: {
      type: 'object',
      properties: {
        id: idProperty('The schema element id.'),
        type: { type: 'string', description: 'The new element type.' },
      },
      required: ['id', 'type'], additionalProperties: false,
    },
    execute: ({ id, type }: { id: number; type: string }) => {
      const structure = structureOrThrow();
      const item = itemOrThrow(structure, id);
      const allowed = allowedChildTypes(structure, item.parent || 0);
      if (!allowed.includes(type)) error(`${type} is not allowed at this position. Allowed: ${allowed.join(', ')}.`);
      structure.adjustTypeById(id, type);
      refreshSchema(structure);
      return { success: true, element: elementDetails(structure, id) };
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema_delete_element',
    title: 'Delete schema element',
    description: 'Delete one element and all of its children. Requires confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        id: idProperty('The schema element id.'),
        confirm: { type: 'boolean', description: 'Must be true to confirm deletion.' },
      },
      required: ['id', 'confirm'], additionalProperties: false,
    },
    execute: ({ id, confirm }: { id: number; confirm: boolean }) => {
      confirmOrThrow(confirm, 'Deletion');
      const structure = structureOrThrow();
      itemOrThrow(structure, id);
      structure.deleteById(id);
      refreshSchema(structure);
      return { success: true, deletedId: id };
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema_validate',
    title: 'Check schema',
    description: 'Run indicative AREI-oriented checks on the schema: unnamed or unprotected circuits below a board, more than 8 socket outlets per circuit, breaker rating too high for the cable section, and empty elements.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: validateSchema,
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_new',
    title: 'Start new schema',
    description: 'Replace the current schema with a new default one (connection, main board and wet-room board). Unsaved changes are lost. Requires confirm=true.',
    inputSchema: {
      type: 'object',
      properties: { confirm: { type: 'boolean', description: 'Must be true to replace the current schema.' } },
      required: ['confirm'], additionalProperties: false,
    },
    execute: ({ confirm }: { confirm: boolean }) => {
      confirmOrThrow(confirm, 'Starting a new schema');
      const fresh = new Hierarchical_List();
      buildNewStructure(fresh);
      const json = fresh.toJsonObject(true);
      fresh.dispose();
      EDStoStructure(json, true, true);
      return { success: true, tree: childIds(structureOrThrow(), 0).map(id => treeNode(structureOrThrow(), id)) };
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema_export',
    title: 'Export schema',
    description: 'Return the current schema as file content: "json" for readable JSON or "eds" for the compressed format the app saves by default.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['json', 'eds'], description: 'Output format. Defaults to json.' } },
      additionalProperties: false,
    },
    execute: ({ format = 'json' }: { format?: 'json' | 'eds' } = {}) => {
      structureOrThrow();
      const { filename, content } = serializeCurrentStructure(format);
      return { filename, format, content };
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema_import',
    title: 'Import schema',
    description: 'Replace the current schema with the content of an .eds or .json file. Unsaved changes are lost. Requires confirm=true.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Full file content of an .eds or .json schema file.' },
        confirm: { type: 'boolean', description: 'Must be true to replace the current schema.' },
      },
      required: ['content', 'confirm'], additionalProperties: false,
    },
    execute: ({ content, confirm }: { content: string; confirm: boolean }) => {
      confirmOrThrow(confirm, 'Importing a schema');
      if (!content?.trim()) error('The file content is empty.');
      EDStoStructure(content, true, true);
      const structure = structureOrThrow();
      return { success: true, filename: structure.properties.filename, elementCount: activeIds(structure).length };
    },
    annotations: { consequentialHint: true },
  },
];

/** Entry point for automation clients (used by the headless MCP server). */
export const schemaToolHost = {
  listTools: () => schemaTools.map(({ execute, ...tool }) => tool),
  callTool: async (name: string, args: Record<string, unknown> = {}) => {
    const tool = schemaTools.find(candidate => candidate.name === name);
    if (!tool) error(`Unknown tool: ${name}.`);
    return tool.execute(args);
  },
  /** The one-wire diagram as a standalone SVG string, as drawn in the editor. */
  renderSvg: () => flattenSVGfromString(structureOrThrow().toSVG(0, 'horizontal').data, 10),
};
