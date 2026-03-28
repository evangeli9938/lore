#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const binPath = fileURLToPath(import.meta.url);
const packageRoot = dirname(dirname(binPath));
const loaderPath = resolve(packageRoot, "node_modules", "tsx", "dist", "loader.mjs");
const cliPath = resolve(packageRoot, "scripts", "cli.ts");

const child = spawn(
  process.execPath,
  ["--import", loaderPath, cliPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
