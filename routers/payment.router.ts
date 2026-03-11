import { Router } from 'express';
import { PaymentService } from '../services/payment.service';

const router = Router();

router.post("/initiate-paynow", async (req, res) => {
  try {
    const response = await PaymentService.initiatePaynow(req.body);
    res.json(response);
  } catch (e: any) {
    console.error("Paynow Initiation Error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/check-paynow-status", async (req, res) => {
  const { pollUrl, claimId } = req.body;
  try {
    const result = await PaymentService.checkPaynowStatus(pollUrl, claimId);
    if (result.status === 'COMPLETED') {
        res.json({ status: "COMPLETED" });
    } else {
        res.status(400).json(result);
    }
  } catch (e: any) {
    console.error("Paynow Status Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Paynow update endpoint (webhook)
router.post("/paynow-update", async (req, res) => {
  // Paynow sends status updates here. 
  // For simplicity in this demo, we'll rely on polling from the client,
  // but a production app would handle the POST update here.
  res.status(200).send("OK");
});

export default router;
