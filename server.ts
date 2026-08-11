/**
 * Express Server Entry Point for Mockupify
 * Integrates Vite middleware in development & static serving in production
 */
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { renderWebsiteScreenshot } from "./services/renderer";
import { createBulkBatch, getBatchState, generateResultsCsv } from "./services/jobSystem";
import { validateUrl } from "./services/urlValidator";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", app: "Mockupify", timestamp: new Date().toISOString() });
  });

  // Single URL Screenshot Render Endpoint
  app.post("/api/render", async (req: Request, res: Response) => {
    try {
      const { url, viewportWidth, viewportHeight, fullPage, deviceScaleFactor, dismissCookies, forceRefresh } = req.body;

      if (!url) {
        res.status(400).json({ success: false, error: "Website URL is required" });
        return;
      }

      const result = await renderWebsiteScreenshot({
        url,
        viewportWidth: Number(viewportWidth) || 1440,
        viewportHeight: Number(viewportHeight) || 900,
        fullPage: Boolean(fullPage),
        deviceScaleFactor: Number(deviceScaleFactor) || 2,
        dismissCookies: dismissCookies !== false,
        forceRefresh: Boolean(forceRefresh),
      });

      if (!result.success) {
        res.status(422).json(result);
        return;
      }

      res.json(result);
    } catch (err: any) {
      console.error("Render API error:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error during rendering" });
    }
  });

  // Bulk Job Create Endpoint
  app.post("/api/bulk/create", (req: Request, res: Response) => {
    try {
      const { urls, settings, concurrency } = req.body;

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        res.status(400).json({ success: false, error: "Please provide an array of website URLs." });
        return;
      }

      const maxUrls = Number(process.env.MAX_BULK_URLS) || 100;
      if (urls.length > maxUrls) {
        res.status(400).json({
          success: false,
          error: `Bulk processing is capped at ${maxUrls} URLs per batch.`,
        });
        return;
      }

      const batch = createBulkBatch(urls, settings, concurrency);
      res.json({ success: true, batchId: batch.id, batch });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to create bulk job" });
    }
  });

  // Bulk Job Status Polling / Streaming Endpoint
  app.get("/api/bulk/status/:batchId", (req: Request, res: Response) => {
    const { batchId } = req.params;
    const batch = getBatchState(batchId);

    if (!batch) {
      res.status(404).json({ success: false, error: "Bulk job batch not found" });
      return;
    }

    res.json({ success: true, batch });
  });

  // Bulk CSV Results Download Endpoint
  app.get("/api/bulk/csv/:batchId", (req: Request, res: Response) => {
    const { batchId } = req.params;
    const batch = getBatchState(batchId);

    if (!batch) {
      res.status(404).send("Batch not found");
      return;
    }

    const csvData = generateResultsCsv(batch.jobs);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=mockupify-results-${batchId}.csv`);
    res.send(csvData);
  });

  // Mount Vite middleware in development or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mockupify Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
