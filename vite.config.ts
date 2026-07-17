import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Repo name for GitHub Pages project site:
// https://<user>.github.io/ui-screen-task-manager/
const REPO_NAME = "ui-screen-task-manager";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Absolute paths on github.io project pages; relative for local preview
  base: command === "build" ? `/${REPO_NAME}/` : "/",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
}));
