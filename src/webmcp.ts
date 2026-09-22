import { Hierarchical_List } from './Hierarchical_List';

type ToolContext = {
  registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<void> | void;
};

const modelContext = (): ToolContext | null => {
  const documentContext = (document as Document & { modelContext?: ToolContext }).modelContext;
  const navigatorContext = (navigator as Navigator & { modelContext?: ToolContext }).modelContext;
  const context = documentContext || navigatorContext;
  return context && typeof context.registerTool === 'function' ? context : null;
};

const error = (message: string): never => {
  throw new Error(message);
};

const structureOrThrow = (): Hierarchical_List => {
  const structure = (globalThis as any).structure as Hierarchical_List | undefined;
  if (!structure) error('No schema is loaded.');
  return structure;
};

const elementSummary = (structure: Hierarchical_List, id: number) => {
  const ordinal = structure.getOrdinalById(id);
  if (ordinal === null || !structure.active[ordinal]) error(`No schema element exists with id ${id}.`);
  const item = structure.data[ordinal] as any;
  return {
    id,
    type: item.getType?.() || item.props?.type || '',
    parentId: item.parent || 0,
    name: item.props?.naam || '',
    address: item.props?.adres || '',
    number: item.props?.nr ?? null,
    properties: { ...item.props },
  };
};

const listElements = (limit = 100) => {
  const structure = structureOrThrow();
  const elements = [];
  const max = Math.max(1, Math.min(200, Math.floor(limit)));
  for (let i = 0; i < structure.length; i += 1) {
    if (structure.active[i]) {
      const item = elementSummary(structure, structure.id[i]);
      delete (item as any).properties;
      elements.push(item);
      if (elements.length >= max) break;
    }
  }
  return { filename: structure.properties.filename, elementCount: structure.id.filter((_, i) => structure.active[i]).length, elements };
};

const refreshSchema = (structure: Hierarchical_List, changedId?: number) => {
  structure.reNumber();
  structure.reSort();
  (globalThis as any).undostruct?.store();
  (globalThis as any).simpleHierarchyView?.render();
  return { success: true, changedId, element: changedId ? elementSummary(structure, changedId) : undefined };
};

const tools = (signal: AbortSignal) => [
  {
    name: 'schema.get',
    title: 'Read electrical schema',
    description: 'Read the current electrical schema structure, including element ids, types, parents and editable properties.',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', description: 'Maximum number of elements to return, from 1 to 200.' } }, additionalProperties: false },
    execute: ({ limit = 100 }: { limit?: number } = {}) => listElements(limit),
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema.get_element',
    title: 'Read schema element',
    description: 'Read one electrical schema element by its numeric id and return its editable properties.',
    inputSchema: {
      type: 'object', properties: { id: { type: 'integer', description: 'The schema element id.' } },
      required: ['id'], additionalProperties: false,
    },
    execute: ({ id }: { id: number }) => elementSummary(structureOrThrow(), id),
    annotations: { readOnlyHint: true },
  },
  {
    name: 'schema.add_element',
    title: 'Add schema element',
    description: 'Add an electrical element using a supported type, optionally as a child of an existing element.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Supported electrical element type, such as Contactdoos, Lichtpunt, Kring or Bord.' },
        parentId: { type: 'integer', description: 'Optional parent element id. Omit or use 0 for a root element.' },
      },
      required: ['type'], additionalProperties: false,
    },
    execute: ({ type, parentId = 0 }: { type: string; parentId?: number }) => {
      const structure = structureOrThrow();
      const probe = structure.createItem(type);
      if (!probe || probe.getType?.() === '') error(`Unsupported schema element type: ${type}.`);
      let item: any;
      if (parentId) {
        if (!structure.getElectroItemById(parentId)) error(`No parent element exists with id ${parentId}.`);
        item = probe;
        structure.insertChildAfterId(item, parentId);
      } else {
        item = structure.addItem(type);
      }
      return refreshSchema(structure, item.id);
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema.update_element',
    title: 'Update schema element',
    description: 'Update editable properties on one electrical schema element by id. Values must be strings, numbers or booleans.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'The schema element id.' },
        properties: { type: 'object', description: 'Property names and their new primitive values.' },
      },
      required: ['id', 'properties'], additionalProperties: false,
    },
    execute: ({ id, properties }: { id: number; properties: Record<string, unknown> }) => {
      const structure = structureOrThrow();
      const item = structure.getElectroItemById(id) as any;
      if (!item) error(`No schema element exists with id ${id}.`);
      for (const [key, value] of Object.entries(properties || {})) {
        if (!(key in item.props)) error(`Property ${key} is not available on element ${id}.`);
        if (!['string', 'number', 'boolean'].includes(typeof value)) error(`Property ${key} must be a string, number or boolean.`);
        item.props[key] = value;
      }
      return refreshSchema(structure, id);
    },
    annotations: { consequentialHint: true },
  },
  {
    name: 'schema.delete_element',
    title: 'Delete schema element',
    description: 'Delete one electrical schema element and its children. This requires confirm=true because it changes the document.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'The schema element id.' },
        confirm: { type: 'boolean', description: 'Must be true to confirm deletion.' },
      },
      required: ['id', 'confirm'], additionalProperties: false,
    },
    execute: ({ id, confirm }: { id: number; confirm: boolean }) => {
      if (confirm !== true) error('Deletion requires confirm=true.');
      const structure = structureOrThrow();
      if (!structure.getElectroItemById(id)) error(`No schema element exists with id ${id}.`);
      structure.deleteById(id);
      refreshSchema(structure);
      return { success: true, deletedId: id };
    },
    annotations: { consequentialHint: true },
  },
].map(tool => ({ ...tool, registrationSignal: signal }));

/** Register the schema editing surface when a WebMCP-capable browser exposes it. */
export function installWebMCPTools(): () => void {
  const controller = new AbortController();
  let registered = false;
  let timer: number | undefined;
  let attempts = 0;

  const register = async () => {
    if (registered || controller.signal.aborted) return;
    const context = modelContext();
    if (!context && attempts++ < 20) {
      timer = window.setTimeout(register, 500);
      return;
    }
    if (!context) return;
    registered = true;
    try {
      await Promise.all(tools(controller.signal).map(({ registrationSignal, ...tool }) =>
        context.registerTool(tool, { signal: registrationSignal as AbortSignal })
      ));
    } catch (registrationError) {
      registered = false;
      console.warn('WebMCP schema tools could not be registered.', registrationError);
    }
  };
  void register();

  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    controller.abort();
  };
}
