import { defineConfig } from "tsup";

export default defineConfig([
  // Browser entry: ESM + CJS for bundlers, IIFE for a plain <script> tag.
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs", "iife"],
    globalName: "Analyse",
    dts: true,
    minify: true,
    sourcemap: true,
    clean: true,
    target: "es2020",
  },
  // Server entry: Node-only, no IIFE/global.
  {
    entry: { server: "src/server.ts" },
    format: ["esm", "cjs"],
    dts: true,
    minify: true,
    sourcemap: true,
    clean: false,
    target: "node18",
    platform: "node",
  },
  // Standard lifecycle events: browser + server helpers, tree-shakeable subpath.
  {
    entry: { events: "src/events/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    minify: true,
    sourcemap: true,
    clean: false,
    target: "es2020",
  },
]);
