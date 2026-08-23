import { existsSync } from "node:fs";

const pluginEntry = "tools/oxlint/anti-slop/index.ts";
const pluginConfig = "tools/oxlint/.oxlintrc.json";
const hasLocalPlugin = existsSync(pluginEntry) && existsSync(pluginConfig);

if (!hasLocalPlugin) {
  console.warn("oxlint: optional local plugin not found; running the committed rule set only.");
}

const args = hasLocalPlugin ? [".", "-c", pluginConfig] : ["."];
const result = Bun.spawnSync(["oxlint", ...args], {
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(result.exitCode);
