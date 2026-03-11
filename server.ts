import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Services
import { AuthService } from "./services/auth.service";
import { AuditService } from "./services/audit.service";
import { SocketService } from "./services/socket.service";
import { NotificationService } from "./services/notification.service";

// Routers
import authRouter from "./routers/auth.router";
import claimsRouter from "./routers/claims.router";
import staffRouter from "./routers/staff.router";
import auditRouter from "./routers/audit.router";
import paymentRouter from "./routers/payment.router";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Services
  AuditService.init();
  SocketService.init(io);
  NotificationService.init();
  await AuthService.seedDemoUsers();

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/claims", claimsRouter);
  app.use("/api/staff", staffRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/payment", paymentRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Modular Monolith Server running on http://localhost:${PORT}`);
  });
}

startServer();
