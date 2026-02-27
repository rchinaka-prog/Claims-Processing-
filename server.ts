import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import * as db from "./db";
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

  // Stripe Client (Lazy)
  let stripeClient: Stripe | null = null;
  const getStripeClient = () => {
    if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
  };

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-claim", (claimId) => {
      socket.join(`claim-${claimId}`);
      console.log(`Socket ${socket.id} joined claim-${claimId}`);
    });

    socket.on("mobile-connected", (data) => {
      console.log(`Mobile connected for claim: ${data.claimId}`);
      io.to(`claim-${data.claimId}`).emit("mobile-synced", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/claims", async (req, res) => {
    const claims = await db.getClaims();
    res.json(claims);
  });

  app.get("/api/claims/:id", async (req, res) => {
    const claim = await db.getClaimById(req.params.id);
    if (claim) {
      res.json(claim);
    } else {
      res.status(404).json({ error: "Claim not found" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    const claims = await db.getClaims();
    const staff = await db.getStaff();
    
    const totalClaims = (claims as any[]).length;
    const pendingClaims = (claims as any[]).filter((c: any) => c.status === 'PENDING_INSPECTION').length;
    const settledClaims = (claims as any[]).filter((c: any) => c.status === 'SETTLED').length;
    const totalPayout = (claims as any[]).reduce((acc: number, c: any) => acc + (Number(c.coverage) || 0), 0);
    
    res.json({
      totalClaims,
      pendingClaims,
      settledClaims,
      totalPayout,
      staffCount: (staff as any[]).length,
      complianceScore: (staff as any[]).length > 0 ? Math.round(((staff as any[]).filter((s: any) => s.complianceStatus === 'COMPLIANT').length / (staff as any[]).length) * 100) : 0
    });
  });

  app.get("/api/staff", async (req, res) => {
    const staff = await db.getStaff();
    res.json(staff);
  });

  app.get("/api/audit", async (req, res) => {
    const logs = await db.getAuditLogs();
    res.json(logs);
  });

  app.post("/api/staff", async (req, res) => {
    const newNode = {
      id: req.body.id || `ST-${Math.floor(Math.random() * 1000)}`,
      name: req.body.name,
      role: req.body.role,
      email: req.body.email,
      avatar: req.body.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      rating: 5.0,
      totalClaims: 0,
      load: 0,
      complianceStatus: 'COMPLIANT',
      interventions: []
    };
    const saved = await db.addStaff(newNode);
    res.json(saved);
  });

  app.post("/api/staff/:id/interventions", async (req, res) => {
    const intervention = {
      id: `INT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: req.body.type,
      subject: req.body.subject
    };
    const saved = await db.addIntervention(req.params.id, intervention);
    if (saved) {
      res.json(saved);
    } else {
      res.status(404).json({ error: "Staff not found" });
    }
  });

  app.patch("/api/claims/:id", async (req, res) => {
    const updated = await db.updateClaim(req.params.id, req.body);
    if (updated) {
      await db.logAuditEntry('CLAIM_UPDATE', { id: req.params.id, updates: req.body });
      io.to(`claim-${req.params.id}`).emit("claim-updated", updated);
      res.json(updated);
    } else {
      res.status(404).json({ error: "Claim not found" });
    }
  });

  app.post("/api/claims/:id/notes", async (req, res) => {
    const newNote = {
      id: `note-${Date.now()}`,
      text: req.body.text,
      timestamp: new Date().toLocaleString(),
      visibleToRepairer: req.body.visibleToRepairer || false
    };
    const saved = await db.addNote(req.params.id, newNote);
    if (saved) {
      await db.logAuditEntry('NOTE_ADDED', { claimId: req.params.id, noteId: newNote.id });
      io.to(`claim-${req.params.id}`).emit("note-added", saved);
      res.json(saved);
    } else {
      res.status(404).json({ error: "Claim not found" });
    }
  });

  app.post("/api/claims/:id/evidence", async (req, res) => {
    const newEvidence = {
      id: req.body.id || `ev-${Date.now()}`,
      name: req.body.name,
      type: req.body.type,
      data: req.body.data,
      timestamp: new Date().toISOString()
    };
    const saved = await db.addEvidence(req.params.id, newEvidence);
    if (saved) {
      await db.logAuditEntry('EVIDENCE_ADDED', { claimId: req.params.id, evidenceId: saved.id, fileName: saved.name });
      io.to(`claim-${req.params.id}`).emit("evidence-added", saved);
      res.json(saved);
    } else {
      res.status(404).json({ error: "Claim not found" });
    }
  });

  // --- Payment Gateway Endpoints (Stripe) ---

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    const { amount, claimId, customerName } = req.body;
    const stripe = getStripeClient();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AIMS Claim Settlement: ${claimId}`,
              description: `Customer: ${customerName}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=success&claimId=${claimId}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=cancel&claimId=${claimId}`,
        metadata: { claimId }
      });

      res.json({ id: session.id, url: session.url });
    } catch (e: any) {
      console.error("Stripe Session Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/stripe/confirm-payment", async (req, res) => {
    const { sessionId, claimId } = req.body;
    const stripe = getStripeClient();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        const updates = {
          insurancePaid: true,
          status: 'Settled',
          paymentDetails: {
            sessionId: session.id,
            paymentIntentId: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            timestamp: new Date().toISOString()
          }
        };

        const updated = await db.updateClaim(claimId, updates);
        if (updated) {
          await db.logAuditEntry('PAYMENT_SUCCESS', { claimId, amount: updates.paymentDetails.amount, gateway: 'Stripe' });
          io.to(`claim-${claimId}`).emit("claim-updated", updated);
        }
        res.json({ status: "COMPLETED" });
      } else {
        res.status(400).json({ status: session.payment_status });
      }
    } catch (e: any) {
      console.error("Stripe Confirmation Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
