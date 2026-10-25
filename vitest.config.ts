import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    exclude: [...configDefaults.exclude, ".local/**", ".worktrees/**", ".next/**", ".vercel/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
