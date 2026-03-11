import { Router } from 'express';
import { ClaimsService } from '../services/claims.service';

const router = Router();

router.get("/", async (req, res) => {
  const claims = await ClaimsService.getClaims();
  res.json(claims);
});

router.post("/", async (req, res) => {
  const saved = await ClaimsService.createClaim(req.body);
  if (saved) {
    res.status(201).json(saved);
  } else {
    res.status(500).json({ error: "Failed to create claim" });
  }
});

router.get("/stats", async (req, res) => {
  const stats = await ClaimsService.getStats();
  res.json(stats);
});

router.get("/:id", async (req, res) => {
  const claim = await ClaimsService.getClaimById(req.params.id);
  if (claim) {
    res.json(claim);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

router.patch("/:id", async (req, res) => {
  const updated = await ClaimsService.updateClaim(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

router.post("/:claimId/assign/:assessorId", async (req, res) => {
  const updated = await ClaimsService.assignAssessor(req.params.claimId, req.params.assessorId);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

router.post("/:id/notes", async (req, res) => {
  const saved = await ClaimsService.addNote(req.params.id, req.body);
  if (saved) {
    res.json(saved);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

router.post("/:id/evidence", async (req, res) => {
  const saved = await ClaimsService.addEvidence(req.params.id, req.body);
  if (saved) {
    res.json(saved);
  } else {
    res.status(404).json({ error: "Claim not found" });
  }
});

router.post("/send-sync-link", async (req, res) => {
  const { phone, url } = req.body;
  if (!phone || !url) {
    return res.status(400).json({ error: "Phone and URL are required" });
  }
  
  try {
    const { NotificationService } = await import('../services/notification.service');
    await NotificationService.sendSms(phone, `AIMS Secure Node Link: ${url}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send sync link:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

export default router;
