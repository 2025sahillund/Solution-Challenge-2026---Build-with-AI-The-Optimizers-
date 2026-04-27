import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory "database"
let alerts: any[] = [];
let resources = { medical: 2, fire: 2, security: 2 };
let users: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start-up log
  console.log("Server logic pre-init...");

  app.use(express.json());
  
  // Request logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Track User Login
  app.post("/api/users/track", (req, res) => {
    const { uid, email, role, userName } = req.body;
    users.push({ uid, email, role, userName, lastLogin: new Date() });
    res.json({ success: true });
  });
  
  app.get("/api/resources", (req, res) => {
    res.json(resources);
  });

  app.patch("/api/resources", (req, res) => {
    const updates = req.body;
    resources = { ...resources, ...updates };
    res.json(resources);
  });

  app.post("/api/resources/replenish", (req, res) => {
    resources = { medical: 2, fire: 2, security: 2 };
    res.json(resources);
  });

  app.get("/api/alerts", (req, res) => {
    res.json(alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post("/api/alerts", (req, res) => {
    const { type } = req.body;
    
    // Initial deployment decrement - only once per alert
    const key = type === 'Medical' ? 'medical' : type === 'Fire' ? 'fire' : 'security';
    if (resources[key as keyof typeof resources] > 0) {
      resources[key as keyof typeof resources] -= 1;
    }

    const newAlert = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'Alerting Staff',
      eta: "4.2m", // Default mock ETA
      ...req.body
    };
    
    alerts.push(newAlert);
    res.status(201).json(newAlert);
  });

  app.patch("/api/alerts/:id", (req, res) => {
    const { id } = req.params;
    const index = alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      // Remove double decrement logic here - it's already handled in POST
      alerts[index] = { ...alerts[index], ...req.body };
      res.json(alerts[index]);
    } else {
      res.status(404).json({ error: "Alert not found" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
