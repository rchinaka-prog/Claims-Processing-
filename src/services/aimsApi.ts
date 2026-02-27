
/**
 * AIMS (AutoClaim Information Management System) API Service
 * Centralized service for all backend interactions.
 */

export interface Claim {
  id: string;
  owner: string;
  phone: string;
  car: string;
  vehicle?: string; // Alias for car
  repairer?: string;
  incidentDate: string;
  status: string;
  riskLevel: string;
  coverage: number;
  location: string;
  description: string;
  neuralSummary?: string;
  consistencyScore?: number;
  insurancePaid?: boolean;
  paymentDetails?: any;
  submittedAt?: string;
  notes?: any[];
  evidence?: any[];
  progress?: number;
  scratchpad?: string;
  damageReason?: string;
  damagedParts?: string[];
  statementAgreement?: Record<number, boolean>;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  rating: number;
  totalClaims: number;
  load: number;
  complianceStatus: string;
  interventions: any[];
}

export const aimsApi = {
  /**
   * Claims Management
   */
  claims: {
    getAll: async (): Promise<Claim[]> => {
      const res = await fetch('/api/claims');
      if (!res.ok) throw new Error('Failed to fetch claims');
      return res.json();
    },
    getById: async (id: string): Promise<Claim> => {
      const res = await fetch(`/api/claims/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch claim ${id}`);
      return res.json();
    },
    update: async (id: string, updates: Partial<Claim>): Promise<Claim> => {
      const res = await fetch(`/api/claims/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Failed to update claim ${id}`);
      return res.json();
    },
    addNote: async (id: string, note: { text: string, visibleToRepairer: boolean }): Promise<any> => {
      const res = await fetch(`/api/claims/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error(`Failed to add note to claim ${id}`);
      return res.json();
    },
    addEvidence: async (id: string, evidence: { name: string, type: string, data: string }): Promise<any> => {
      const res = await fetch(`/api/claims/${id}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidence),
      });
      if (!res.ok) throw new Error(`Failed to add evidence to claim ${id}`);
      return res.json();
    }
  },

  /**
   * Staff & Resource Management
   */
  staff: {
    getAll: async (): Promise<Staff[]> => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
    add: async (staff: Partial<Staff>): Promise<Staff> => {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staff),
      });
      if (!res.ok) throw new Error('Failed to add staff');
      return res.json();
    },
    addIntervention: async (id: string, intervention: { type: string, subject: string }): Promise<any> => {
      const res = await fetch(`/api/staff/${id}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervention),
      });
      if (!res.ok) throw new Error(`Failed to add intervention for staff ${id}`);
      return res.json();
    }
  },

  /**
   * System & Audit
   */
  system: {
    getStats: async (): Promise<any> => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    getAuditLogs: async (): Promise<any[]> => {
      const res = await fetch('/api/audit');
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    }
  },

  /**
   * Payments (Stripe)
   */
  payments: {
    createCheckoutSession: async (data: { amount: number, claimId: string, customerName: string }): Promise<any> => {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      return res.json();
    },
    confirmPayment: async (data: { sessionId: string, claimId: string }): Promise<any> => {
      const res = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to confirm payment');
      return res.json();
    }
  }
};
