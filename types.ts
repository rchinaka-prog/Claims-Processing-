
export enum UserRole {
  CUSTOMER = 'customer',
  ASSESSOR = 'assessor',
  REPAIR_PARTNER = 'repair_partner',
  SUPPORT_STAFF = 'support_staff',
  MANAGER = 'manager'
}

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  DOCUMENTS_PENDING = 'documents_pending',
  AWAITING_INSPECTION = 'awaiting_inspection',
  INSPECTION_SCHEDULED = 'inspection_scheduled',
  INSPECTION_COMPLETED = 'inspection_completed',
  QUOTE_GENERATED = 'quote_generated',
  QUOTE_SENT = 'quote_sent',
  QUOTE_APPROVED = 'quote_approved',
  QUOTE_REJECTED = 'quote_rejected',
  REPAIR_ASSIGNMENT = 'repair_assigned',
  REPAIR_IN_PROGRESS = 'repair_in_progress',
  REPAIR_COMPLETED = 'repair_completed',
  QUALITY_CHECK = 'quality_check',
  CLAIM_CLOSED = 'claim_closed',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  verified: boolean;
  profile_pic_url?: string;
  last_login?: string;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  policy_number: string;
  insurance_provider: string;
  preferred_contact_method: 'email' | 'whatsapp' | 'sms';
  notification_enabled: boolean;
}

export interface AssessorProfile {
  id: string;
  user_id: string;
  employee_id: string;
  region: string;
  is_active: boolean;
  avg_inspection_time?: number;
  total_inspections?: number;
}

export interface RepairPartnerProfile {
  id: string;
  user_id: string;
  business_name: string;
  registration_number: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  specialties?: string;
  latitude?: number;
  longitude?: number;
  service_area_radius?: number;
  rating: number;
  total_jobs_completed?: number;
  acceptance_rate?: number;
  is_approved: boolean;
}

export interface AuthSession {
  user: User;
  profile?: CustomerProfile | AssessorProfile | RepairPartnerProfile;
}

export interface Claim {
  id: string;
  claim_number: string;
  customerId: string;
  vehicleInfo: string;
  registrationNumber: string;
  dateSubmitted: string;
  status: ClaimStatus;
  documents: string[];
  assignedAssessor?: string;
  assignedRepairer?: string;
  quoteAmount?: number;
  policyCoverage?: number;
  privateNotes?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  status: string;
  description: string;
}

declare global {
  interface Window {
    // Stripe is loaded via script or SDK
  }
}
