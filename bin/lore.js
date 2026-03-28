#!/usr/bin/env -S node --import tsx

import { runCli } from "../src/cli.ts";

const exitCode = await runCli(process.argv.slice(2));
process.exitCode = exitCode;
