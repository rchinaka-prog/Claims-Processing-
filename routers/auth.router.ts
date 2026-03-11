import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const saved = await AuthService.register(req.body);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await AuthService.verifyCode(email, code);
    if (user) {
      res.json(user);
    } else {
      res.status(400).json({ error: "Invalid verification code" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/verify-link", async (req, res) => {
  const { email, code } = req.query;
  try {
    const success = await AuthService.verifyCode(email as string, code as string);
    if (success) {
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f4f4f4;">
            <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;">
              <h1 style="color: #10B981;">Verification Successful!</h1>
              <p>Your email has been verified. You can now close this window and return to the application.</p>
              <button onclick="window.close()" style="background: #000; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold;">CLOSE WINDOW</button>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(400).send("Invalid or expired verification link.");
    }
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  try {
    await AuthService.resendCode(email);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/send-sms-otp", async (req, res) => {
  const { phoneNumber, claimId } = req.body;
  try {
    const otp = await NotificationService.sendSmsOtp(phoneNumber, claimId);
    res.json({ success: true, otp }); // In production, don't return the OTP in the response
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email } = req.body;
  const user = await AuthService.login(email);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await AuthService.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
