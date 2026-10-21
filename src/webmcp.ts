import { schemaToolHost, schemaTools } from './mcp/schemaTools';

type ToolContext = {
  registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<void> | void;
};

const modelContext = (): ToolContext | null => {
  const documentContext = (document as Document & { modelContext?: ToolContext }).modelContext;
  const navigatorContext = (navigator as Navigator & { modelContext?: ToolContext }).modelContext;
  const context = documentContext || navigatorContext;
  return context && typeof context.registerTool === 'function' ? context : null;
};

/**
 * Expose the schema tools to agents.
 *
 * - Always publishes `globalThis.eendraadschemaMCP` (listTools/callTool), used by the
 *   headless MCP server in /mcp-server.
 * - Registers the same tools with WebMCP when the browser offers `modelContext`.
 */
export function installWebMCPTools(): () => void {
  const controller = new AbortController();
  let registered = false;
  let timer: number | undefined;
  let attempts = 0;

  (globalThis as any).eendraadschemaMCP = schemaToolHost;

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
      await Promise.all(schemaTools.map(tool => context.registerTool(tool, { signal: controller.signal })));
    } catch (registrationError) {
      registered = false;
      console.warn('WebMCP schema tools could not be registered.', registrationError);
    }
  };
  void register();

  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    controller.abort();
    if ((globalThis as any).eendraadschemaMCP === schemaToolHost) delete (globalThis as any).eendraadschemaMCP;
  };
}
