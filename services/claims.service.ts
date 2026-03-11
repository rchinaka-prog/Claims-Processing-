import * as db from '../db';
import { eventBus, AppEvents } from '../events/eventBus';

export class ClaimsService {
  static async getClaims() {
    return await db.getClaims();
  }

  static async getClaimById(id: string) {
    return await db.getClaimById(id);
  }

  static async createClaim(claimData: any) {
    const newClaim = {
      ...claimData,
      id: claimData.id || `CLM-${Math.floor(Math.random() * 10000)}`,
      status: claimData.status || 'PENDING_INSPECTION',
      submittedAt: new Date().toISOString(),
      repairEvidence: JSON.stringify([{
        id: `ev-${Date.now()}`,
        title: 'Claim Transmitted',
        description: 'Electronic claim file received and queued for audit.',
        date: new Date().toLocaleString()
      }])
    };
    const saved = await db.createClaim(newClaim);
    if (saved) {
      eventBus.emit(AppEvents.CLAIM_CREATED, { id: saved.id, owner: saved.owner });
    }
    return saved;
  }

  static async updateClaim(id: string, updates: any) {
    const updated = await db.updateClaim(id, updates);
    if (updated) {
      eventBus.emit(AppEvents.CLAIM_UPDATED, { id, updates, full: updated });
    }
    return updated;
  }

  static async assignAssessor(claimId: string, assessorId: string) {
    const updated = await db.assignAssessor(claimId, assessorId);
    if (updated) {
      eventBus.emit(AppEvents.ASSESSOR_ASSIGNED, { id: updated.id, assessor: updated.assignedAssessor, full: updated });
    }
    return updated;
  }

  static async addNote(claimId: string, noteData: any) {
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteData.text,
      timestamp: new Date().toLocaleString(),
      visibleToRepairer: noteData.visibleToRepairer || false
    };
    const saved = await db.addNote(claimId, newNote);
    if (saved) {
      eventBus.emit(AppEvents.NOTE_ADDED, { claimId, note: saved });
    }
    return saved;
  }

  static async addEvidence(claimId: string, evidenceData: any) {
    const newEvidence = {
      id: evidenceData.id || `ev-${Date.now()}`,
      name: evidenceData.name,
      type: evidenceData.type,
      data: evidenceData.data,
      timestamp: new Date().toISOString()
    };
    const saved = await db.addEvidence(claimId, newEvidence);
    if (saved) {
      eventBus.emit(AppEvents.EVIDENCE_ADDED, { claimId, evidence: saved });
    }
    return saved;
  }

  static async getStats() {
    const claims = await db.getClaims();
    const staff = await db.getStaff();
    
    const totalClaims = (claims as any[]).length;
    const pendingClaims = (claims as any[]).filter((c: any) => c.status === 'PENDING_INSPECTION').length;
    const settledClaims = (claims as any[]).filter((c: any) => c.status === 'SETTLED').length;
    const totalPayout = (claims as any[]).reduce((acc: number, c: any) => acc + (Number(c.coverage) || 0), 0);
    
    return {
      totalClaims,
      pendingClaims,
      settledClaims,
      totalPayout,
      staffCount: (staff as any[]).length,
      complianceScore: (staff as any[]).length > 0 ? Math.round(((staff as any[]).filter((s: any) => s.complianceStatus === 'COMPLIANT').length / (staff as any[]).length) * 100) : 0
    };
  }
}
