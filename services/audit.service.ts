import * as db from '../db';
import { eventBus, AppEvents } from '../events/eventBus';

export class AuditService {
  static async log(action: string, details: any) {
    return await db.logAuditEntry(action, details);
  }

  static async getLogs() {
    return await db.getAuditLogs();
  }

  static init() {
    eventBus.on(AppEvents.CLAIM_CREATED, (data) => this.log('CLAIM_CREATED', data));
    eventBus.on(AppEvents.CLAIM_UPDATED, (data) => this.log('CLAIM_UPDATE', data));
    eventBus.on(AppEvents.NOTE_ADDED, (data) => this.log('NOTE_ADDED', data));
    eventBus.on(AppEvents.EVIDENCE_ADDED, (data) => this.log('EVIDENCE_ADDED', data));
    eventBus.on(AppEvents.ASSESSOR_ASSIGNED, (data) => this.log('ASSESSOR_ASSIGNED', data));
    eventBus.on(AppEvents.STAFF_INTERVENTION, (data) => this.log('STAFF_INTERVENTION', data));
    eventBus.on(AppEvents.PAYMENT_SUCCESS, (data) => this.log('PAYMENT_SUCCESS', data));
  }
}
