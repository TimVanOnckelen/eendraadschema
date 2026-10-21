# Eendraadschema MCP server

An [MCP](https://modelcontextprotocol.io) server that lets Claude Desktop, Claude Code and
other MCP clients open, edit, check, render and save Eendraadschema files (`.eds` / `.json`).

## How it works

```
MCP client ──stdio──▶ mcp-server (Node) ──Playwright──▶ headless Chromium
                                                         └─ Eendraadschema app (../dist)
                                                            └─ globalThis.eendraadschemaMCP
```

The server doesn't reimplement any schema logic. It loads the built web app in headless
Chromium and calls the tools the app publishes on `globalThis.eendraadschemaMCP`. The
in-browser WebMCP integration uses the same tools (`src/mcp/schemaTools.ts`), so both
paths apply the same rules and produce identical files.

Every run starts with a fresh browser profile, so the server never sees the autosave of
your normal browser and doesn't change it.

## Setup

Requires Node.js 20 or higher.

```bash
# 1. Build the web app (repository root)
npm ci
npm run build

# 2. Install the server and a browser for Playwright
cd mcp-server
npm ci
npx playwright install chromium

# 3. Optional: check that everything works
npm test
```

## Connecting a client

**Claude Code**

```bash
claude mcp add eendraadschema -- node /absolute/path/to/eendraadschema/mcp-server/src/index.js
```

**Claude Desktop** (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "eendraadschema": {
      "command": "node",
      "args": ["/absolute/path/to/eendraadschema/mcp-server/src/index.js"]
    }
  }
}
```

Other MCP clients that support stdio servers work the same way.

## Options

| Option | Environment variable | Default | Meaning |
|---|---|---|---|
| `--app <folder or url>` | `EDS_APP` | `../dist` | Built app folder, or the URL of a deployed version that includes the MCP tools |
| `--headed` | `EDS_HEADED=1` | off | Show the browser window, so you can watch the edits |
| | `EDS_CHROMIUM_PATH` | Playwright's Chromium | Use a specific Chromium/Chrome executable |

## Tools

All schema tools from the [main README](../README.md#ai-assistants-mcp) (`schema_get`,
`schema_get_tree`, `schema_add_element`, `schema_validate`, …), plus three that need
the local machine:

| Tool | Purpose |
|---|---|
| `file_open` | Open an `.eds` or `.json` file from disk (use an absolute path) |
| `file_save` | Save to `.eds` (compressed, the app default) or `.json`, based on the extension. Without a path, saves to the last opened or saved file |
| `schema_render` | Return the one-wire diagram as a PNG image |

`file_open` and `file_save` only accept `.eds` and `.json` files. `file_save`
overwrites existing files, so let your client ask for approval before running it.

## Typical session

1. `file_open` an existing file, or `schema_new` to start fresh.
2. `schema_get_tree` to see the structure and element ids.
3. `schema_list_types` / `schema_describe_type` to see which types and properties are allowed.
4. `schema_add_element` / `schema_update_element` to make changes.
5. `schema_validate` and `schema_render` to check the result.
6. `file_save`.

## Limitations

- `schema_validate` runs indicative checks only; it doesn't replace an AREI inspection.
- The situation plan (situatieschema) isn't editable through these tools. It is kept as-is
  when a file is opened and saved.
- The server holds one schema at a time, in memory, until you save it.
