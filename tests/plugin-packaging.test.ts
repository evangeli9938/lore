import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("plugin packaging", () => {
  it("bundles MCP servers from the plugin manifest", async () => {
    const manifestPath = join(repoRoot, ".codex-plugin", "plugin.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      author?: { name?: string };
      homepage?: string;
      interface?: {
        capabilities?: string[];
        developerName?: string;
        displayName?: string;
        websiteURL?: string;
      };
      keywords?: string[];
      mcpServers?: string;
      repository?: string;
      skills?: string;
    };

    expect(manifest.skills).toBe("./skills/");
    expect(manifest.mcpServers).toBe("./.mcp.json");
    expect(manifest.author?.name).toBe("yimwoo");
    expect(manifest.homepage).toBe("https://github.com/yimwoo/lore");
    expect(manifest.repository).toBe("https://github.com/yimwoo/lore");
    expect(manifest.keywords).toContain("memory");
    expect(manifest.interface?.displayName).toBe("Lore");
    expect(manifest.interface?.developerName).toBe("Yiming Wu");
    expect(manifest.interface?.capabilities).toEqual([
      "Interactive",
      "Read",
      "Write",
    ]);
    expect(manifest.interface?.websiteURL).toBe(
      "https://github.com/yimwoo/lore",
    );
  });

  it("defines a stdio MCP server for the bundled plugin", async () => {
    const configPath = join(repoRoot, ".mcp.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      mcpServers?: Record<
        string,
        { command?: string; args?: string[]; transport?: string }
      >;
    };

    expect(config.mcpServers?.["lore"]).toEqual({
      command: "node",
      args: ["--import", "tsx", "./src/mcp/stdio-transport.ts"],
      transport: "stdio",
    });
  });

  it("registers the user-global Codex plugin with a relative source path", async () => {
    const installScriptPath = join(repoRoot, "install.sh");
    const installScript = await readFile(installScriptPath, "utf8");

    expect(installScript).toContain(
      'MARKETPLACE_PLUGIN_PATH="./.codex/plugins/lore-source"',
    );
    expect(installScript).toContain(
      'CODEX_PLUGIN_CACHE_ROOT="$HOME/.codex/plugins/cache/codex-plugins/lore"',
    );
    expect(installScript).toContain("refresh_codex_plugin_cache");
  });
});
