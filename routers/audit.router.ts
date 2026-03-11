import { Router } from 'express';
import { AuditService } from '../services/audit.service';

const router = Router();

router.get("/", async (req, res) => {
  const logs = await AuditService.getLogs();
  res.json(logs);
});

export default router;
