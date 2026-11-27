import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "sunrise-group",
    compatibilityDate: "2026-11-17",
    workersDev: true,
    previewUrls: false,
  },
});
