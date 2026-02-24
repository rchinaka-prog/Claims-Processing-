import { supabase } from './supabase';
import { ClaimStatus } from '../types';

export interface ClaimData {
  claim_number: string;
  customer_id: string;
  vehicle_info: string;
  registration_number: string;
  claim_type?: string;
  status: string;
  priority?: string;
  quote_amount?: number;
  policy_coverage?: number;
  policy_limit?: number;
}

export async function createClaim(data: ClaimData) {
  const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const { data: claim, error } = await supabase.from('claims').insert([
    {
      ...data,
      claim_number: claimNumber,
      status: data.status || 'submitted',
      progress: 0,
    },
  ]).select();

  if (error) throw error;
  return claim?.[0];
}

export async function getClaimsByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClaimById(claimId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id', claimId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateClaimStatus(claimId: string, status: string, progress?: number) {
  const updateData: any = { status };
  if (progress !== undefined) {
    updateData.progress = progress;
  }

  const { data, error } = await supabase
    .from('claims')
    .update(updateData)
    .eq('id', claimId)
    .select();

  if (error) throw error;

  if (data?.[0]) {
    await supabase.from('claim_timeline').insert([
      {
        claim_id: claimId,
        status,
        description: `Claim status updated to ${status}`,
        created_by: null,
      },
    ]);
  }

  return data?.[0];
}

export async function getClaimTimeline(claimId: string) {
  const { data, error } = await supabase
    .from('claim_timeline')
    .select('*')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAssessorClaims(assessorId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('assigned_assessor_id', assessorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function assignAssessor(claimId: string, assessorId: string) {
  const { data, error } = await supabase
    .from('claims')
    .update({ assigned_assessor_id: assessorId })
    .eq('id', claimId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getRepairerClaims(repairerId: string) {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('assigned_repairer_id', repairerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function assignRepairer(claimId: string, repairerId: string) {
  const { data, error } = await supabase
    .from('claims')
    .update({ assigned_repairer_id: repairerId })
    .eq('id', claimId)
    .select();

  if (error) throw error;
  return data?.[0];
}
