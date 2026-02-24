/*
  # AIMS Claims Processing System - Core Schema

  ## Overview
  Complete database schema for the Vehicle Repair Claims Management System (AIMS) 
  for First Mutual Holdings / Nicoz Diamond Insurance.

  ## New Tables
  
  ### 1. `users`
  - Core user authentication and profile data
  - Columns: id, email, phone, full_name, role, profile_pic_url, last_login, created_at
  - Supports all user roles: customer, assessor, repair_partner, support_staff, manager
  
  ### 2. `customer_profiles`
  - Extended profile data for customers
  - Columns: id, user_id, policy_number, insurance_provider, preferred_contact_method, notification_enabled
  
  ### 3. `assessor_profiles`
  - Extended profile data for field assessors
  - Columns: id, user_id, employee_id, region, is_active, avg_inspection_time, total_inspections
  
  ### 4. `repair_partner_profiles`
  - Extended profile data for repair shop partners
  - Columns: id, user_id, business_name, registration_number, address, contact details, specialties, location, rating, stats
  
  ### 5. `claims`
  - Core claims lifecycle tracking
  - Columns: id, claim_number, customer_id, vehicle_info, reg_number, status, dates, assigned staff, financial data
  
  ### 6. `claim_timeline`
  - Audit trail for all claim status changes
  - Columns: id, claim_id, status, description, created_at, created_by
  
  ### 7. `claim_documents`
  - Document attachments for claims
  - Columns: id, claim_id, document_type, file_url, uploaded_by, uploaded_at
  
  ### 8. `claim_photos`
  - Photo evidence for claims (damage, completion, etc.)
  - Columns: id, claim_id, photo_type, file_url, uploaded_by, uploaded_at
  
  ### 9. `negotiations`
  - Financial negotiation tracking between parties
  - Columns: id, claim_id, original_amount, requested_amount, final_amount, status, messages
  
  ### 10. `notifications`
  - System notifications for all users
  - Columns: id, user_id, title, message, type, is_read, created_at

  ## Security
  - RLS enabled on all tables
  - Policies enforce role-based access control
  - Users can only access their own data or data relevant to their role
  - Support staff and managers have broader access for operations

  ## Important Notes
  - All timestamps use timestamptz for proper timezone handling
  - Foreign keys ensure referential integrity
  - Indexes added for performance on frequently queried columns
  - Default values provided where appropriate for better UX
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'assessor', 'repair_partner', 'support_staff', 'manager')),
  profile_pic_url text,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Support staff can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- CUSTOMER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  policy_number text UNIQUE NOT NULL,
  insurance_provider text DEFAULT 'Nicoz Diamond Insurance',
  preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'whatsapp', 'sms')),
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_policy_number ON customer_profiles(policy_number);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own profile"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = customer_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own profile"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = customer_profiles.user_id
      AND users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = customer_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Support staff can read customer profiles"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- ASSESSOR PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS assessor_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  employee_id text UNIQUE NOT NULL,
  region text NOT NULL,
  is_active boolean DEFAULT true,
  avg_inspection_time integer DEFAULT 0,
  total_inspections integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessor_profiles_user_id ON assessor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_assessor_profiles_region ON assessor_profiles(region);

ALTER TABLE assessor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assessors can read own profile"
  ON assessor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = assessor_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Assessors can update own profile"
  ON assessor_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = assessor_profiles.user_id
      AND users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = assessor_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Support staff can read assessor profiles"
  ON assessor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- REPAIR PARTNER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS repair_partner_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  address text NOT NULL,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  specialties text,
  latitude numeric,
  longitude numeric,
  service_area_radius numeric DEFAULT 50,
  rating numeric DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_jobs_completed integer DEFAULT 0,
  acceptance_rate numeric DEFAULT 100.0 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repair_partner_profiles_user_id ON repair_partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_partner_profiles_location ON repair_partner_profiles(latitude, longitude);

ALTER TABLE repair_partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Repair partners can read own profile"
  ON repair_partner_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = repair_partner_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Repair partners can update own profile"
  ON repair_partner_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = repair_partner_profiles.user_id
      AND users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = repair_partner_profiles.user_id
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Support staff can read repair partner profiles"
  ON repair_partner_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager', 'customer')
    )
  );

-- =============================================
-- CLAIMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES users(id) NOT NULL,
  vehicle_info text NOT NULL,
  registration_number text NOT NULL,
  claim_type text NOT NULL DEFAULT 'Accident',
  date_submitted timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'documents_pending', 'awaiting_inspection', 'inspection_scheduled',
    'inspection_completed', 'quote_generated', 'quote_sent', 'quote_approved',
    'quote_rejected', 'repair_assigned', 'repair_in_progress', 'repair_completed',
    'quality_check', 'claim_closed', 'rejected', 'stagnant'
  )),
  priority text DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  assigned_assessor_id uuid REFERENCES users(id),
  assigned_repairer_id uuid REFERENCES users(id),
  quote_amount numeric DEFAULT 0,
  policy_coverage numeric DEFAULT 0,
  policy_limit numeric DEFAULT 15000,
  policy_status text DEFAULT 'ACTIVE' CHECK (policy_status IN ('ACTIVE', 'EXPIRED', 'INACTIVE')),
  insurance_paid boolean DEFAULT false,
  bottleneck_reason text,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  consistency_index integer,
  assessor_findings text,
  private_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_customer_id ON claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_assessor ON claims(assigned_assessor_id);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_repairer ON claims(assigned_repairer_id);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own claims"
  ON claims FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Assessors can read assigned claims"
  ON claims FOR SELECT
  TO authenticated
  USING (assigned_assessor_id = auth.uid());

CREATE POLICY "Assessors can update assigned claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (assigned_assessor_id = auth.uid())
  WITH CHECK (assigned_assessor_id = auth.uid());

CREATE POLICY "Repair partners can read assigned claims"
  ON claims FOR SELECT
  TO authenticated
  USING (assigned_repairer_id = auth.uid());

CREATE POLICY "Repair partners can update assigned claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (assigned_repairer_id = auth.uid())
  WITH CHECK (assigned_repairer_id = auth.uid());

CREATE POLICY "Support staff can read all claims"
  ON claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

CREATE POLICY "Support staff can update all claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- CLAIM TIMELINE
-- =============================================
CREATE TABLE IF NOT EXISTS claim_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_timeline_claim_id ON claim_timeline(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_timeline_created_at ON claim_timeline(created_at);

ALTER TABLE claim_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read timeline for their claims"
  ON claim_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_timeline.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Support staff can read all timelines"
  ON claim_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

CREATE POLICY "Authorized users can create timeline entries"
  ON claim_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_timeline.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- CLAIM DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS claim_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);

ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read documents for their claims"
  ON claim_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_documents.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Support staff can read all documents"
  ON claim_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

CREATE POLICY "Authorized users can upload documents"
  ON claim_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_documents.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- CLAIM PHOTOS
-- =============================================
CREATE TABLE IF NOT EXISTS claim_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('damage', 'completion', 'inspection', 'other')),
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_photos_claim_id ON claim_photos(claim_id);

ALTER TABLE claim_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read photos for their claims"
  ON claim_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_photos.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Support staff can read all photos"
  ON claim_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

CREATE POLICY "Authorized users can upload photos"
  ON claim_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_photos.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- NEGOTIATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS negotiations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
  original_amount numeric NOT NULL,
  requested_amount numeric NOT NULL,
  final_amount numeric,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COUNTER')),
  repairer_message text,
  support_response text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_negotiations_claim_id ON negotiations(claim_id);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read negotiations for their claims"
  ON negotiations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = negotiations.claim_id
      AND (
        claims.customer_id = auth.uid()
        OR claims.assigned_assessor_id = auth.uid()
        OR claims.assigned_repairer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Support staff can read all negotiations"
  ON negotiations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

CREATE POLICY "Repair partners can create negotiations"
  ON negotiations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = negotiations.claim_id
      AND claims.assigned_repairer_id = auth.uid()
    )
  );

CREATE POLICY "Support staff can update negotiations"
  ON negotiations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('support_staff', 'manager')
    )
  );

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'critical', 'success', 'warning')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_profiles_updated_at') THEN
    CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assessor_profiles_updated_at') THEN
    CREATE TRIGGER update_assessor_profiles_updated_at BEFORE UPDATE ON assessor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_repair_partner_profiles_updated_at') THEN
    CREATE TRIGGER update_repair_partner_profiles_updated_at BEFORE UPDATE ON repair_partner_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_claims_updated_at') THEN
    CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;