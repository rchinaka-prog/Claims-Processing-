import * as db from '../db';
import { eventBus, AppEvents } from '../events/eventBus';

export class StaffService {
  static async getStaff() {
    return await db.getStaff();
  }

  static async addStaff(staffData: any) {
    const newNode = {
      id: staffData.id || `ST-${Math.floor(Math.random() * 1000)}`,
      name: staffData.name,
      role: staffData.role,
      email: staffData.email,
      avatar: staffData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      rating: 5.0,
      totalClaims: 0,
      load: 0,
      complianceStatus: 'COMPLIANT',
      interventions: []
    };
    return await db.addStaff(newNode);
  }

  static async addIntervention(staffId: string, interventionData: any) {
    const intervention = {
      id: `INT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: interventionData.type,
      subject: interventionData.subject
    };
    const saved = await db.addIntervention(staffId, intervention);
    if (saved) {
      eventBus.emit(AppEvents.STAFF_INTERVENTION, { staffId, type: intervention.type, subject: intervention.subject });
    }
    return saved;
  }
}
