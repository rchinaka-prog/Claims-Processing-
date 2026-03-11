import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

export enum AppEvents {
  CLAIM_CREATED = 'claim:created',
  CLAIM_UPDATED = 'claim:updated',
  NOTE_ADDED = 'note:added',
  EVIDENCE_ADDED = 'evidence:added',
  ASSESSOR_ASSIGNED = 'assessor:assigned',
  STAFF_INTERVENTION = 'staff:intervention',
  PAYMENT_SUCCESS = 'payment:success',
}
