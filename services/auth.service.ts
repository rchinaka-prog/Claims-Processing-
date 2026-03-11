import * as db from '../db';
import { NotificationService } from './notification.service';

export class AuthService {
  private static normalizeUser(user: any) {
    if (!user) return null;
    return { ...user, role: user.role.toLowerCase() };
  }

  static async register(userData: any) {
    const { email, full_name, role, phone } = userData;
    const existing = await db.getUserByEmail(email);
    if (existing) {
      throw new Error("User already exists");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = {
      id: `USR-${Date.now()}`,
      email,
      full_name,
      role,
      phone,
      verified: false,
      verificationCode,
      created_at: new Date().toISOString()
    };
    
    const saved = await db.createUser(newUser);
    const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/api/auth/verify-link?email=${encodeURIComponent(email)}&code=${verificationCode}`;
    
    // Send Real Email
    await NotificationService.sendEmail(
      email, 
      "Verify your AIMS Account", 
      `Welcome to AIMS, ${full_name}. Your verification code is: ${verificationCode}. Alternatively, click here to verify: ${verifyLink}`
    );

    // Send Real SMS if phone is provided
    if (phone) {
      await NotificationService.sendSms(phone, `AIMS: Your verification code is ${verificationCode}`);
    }

    console.log(`[AIMS] Verification dispatched to ${email}`);
    return this.normalizeUser(saved);
  }

  static async verifyCode(email: string, code: string) {
    const user = await db.getUserByEmail(email);
    if (!user) throw new Error("User not found");

    // Backdoor for testing as indicated in the UI
    if (user.verificationCode === code || code === '123456') {
      await db.updateUser(user.id, { verified: true, verificationCode: null });
      const updated = await db.getUserByEmail(email);
      return this.normalizeUser(updated);
    }
    return null;
  }

  static async resendCode(email: string) {
    const user = await db.getUserByEmail(email);
    if (!user) throw new Error("User not found");

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.updateUser(user.id, { verificationCode: newCode });
    
    const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/api/auth/verify-link?email=${encodeURIComponent(email)}&code=${newCode}`;
    
    await NotificationService.sendEmail(
      email, 
      "Your AIMS Verification Code", 
      `Your new verification code is: ${newCode}. Link: ${verifyLink}`
    );

    if (user.phone) {
      await NotificationService.sendSms(user.phone, `AIMS: Your verification code is ${newCode}`);
    }

    return true;
  }

  static async login(email: string) {
    const user = await db.getUserByEmail(email);
    if (!user) return null;

    // Normalize role for frontend
    const normalizedUser = this.normalizeUser(user);

    // If customer and NOT verified, or we want to force 2FA
    if (normalizedUser.role === 'customer' && !normalizedUser.verified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      await db.updateUser(normalizedUser.id, { verificationCode, verified: false });
      const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
      const verifyLink = `${baseUrl}/api/auth/verify-link?email=${encodeURIComponent(email)}&code=${verificationCode}`;
      
      await NotificationService.sendEmail(
        email, 
        "AIMS Login Verification", 
        `Your login verification code is: ${verificationCode}. Link: ${verifyLink}`
      );

      if (normalizedUser.phone) {
        await NotificationService.sendSms(normalizedUser.phone, `AIMS: Your login code is ${verificationCode}`);
      }

      return { ...normalizedUser, verified: false, verificationRequired: true };
    }

    return normalizedUser;
  }

  static async getUsers() {
    const users = await db.getUsers();
    return users.map((u: any) => this.normalizeUser(u));
  }

  static async seedDemoUsers() {
    const demoUsers = [
      { email: 'rchinaka@firstmutual.co.zw', full_name: 'TEST USER', role: 'CUSTOMER', phone: '+263770000000', verified: true },
      { email: 'customer@aims.com', full_name: 'DEMO CUSTOMER', role: 'CUSTOMER', phone: '0786413281', verified: true },
      { email: 'assessor@aims.com', full_name: 'DEMO ASSESSOR', role: 'ASSESSOR', phone: '0786413282', verified: true },
      { email: 'support@aims.com', full_name: 'DEMO SUPPORT', role: 'SUPPORT_STAFF', phone: '0786413283', verified: true },
      { email: 'repair@aims.com', full_name: 'DEMO REPAIR', role: 'REPAIR_PARTNER', phone: '0786413284', verified: true },
      { email: 'manager@aims.com', full_name: 'DEMO MANAGER', role: 'MANAGER', phone: '0786413285', verified: true },
    ];

    for (const user of demoUsers) {
      const existing = await db.getUserByEmail(user.email);
      if (!existing) {
        await db.createUser({
          id: `USR-DEMO-${user.role}`,
          ...user,
          created_at: new Date().toISOString()
        });
      }
    }
  }
}
