import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { comlink } from "vite-plugin-comlink";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/compendium_website/",
  plugins: [comlink(), react(), svgr()],
  worker: {
    plugins: [comlink()],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
