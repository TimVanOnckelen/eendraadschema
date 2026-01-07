import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const formatDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "resources",
          dest: ".",
        },
        {
          src: "examples",
          dest: ".",
        },
        {
          src: "gif",
          dest: ".",
        },
        {
          src: "Documentation",
          dest: ".",
        },
        {
          src: "prop",
          dest: ".",
        },
        {
          src: "css",
          dest: ".",
        },
      ],
    }),
  ],
  base: "./", // Use relative paths for flexible deployment
  define: {
    BUILD_DATE: JSON.stringify(formatDate()), // Injects current date/time
  },
  build: {
    target: "es2017", // Match your tsconfig.json
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },
});
