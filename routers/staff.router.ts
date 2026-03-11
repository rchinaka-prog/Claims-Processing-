import { Router } from 'express';
import { StaffService } from '../services/staff.service';

const router = Router();

router.get("/", async (req, res) => {
  const staff = await StaffService.getStaff();
  res.json(staff);
});

router.post("/", async (req, res) => {
  const saved = await StaffService.addStaff(req.body);
  res.json(saved);
});

router.post("/:id/interventions", async (req, res) => {
  const saved = await StaffService.addIntervention(req.params.id, req.body);
  if (saved) {
    res.json(saved);
  } else {
    res.status(404).json({ error: "Staff not found" });
  }
});

export default router;
