import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://tizlla-2-0.github.io/ui-screen/
const REPO_NAME = "ui-screen";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? `/${REPO_NAME}/` : "/",
  server: {
    port: 5173,
  },
}));
