import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@web": resolve(__dirname, "src/web"),
    },
  },
});