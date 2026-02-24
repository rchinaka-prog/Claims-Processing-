import { supabase } from './supabase';
import { User, CustomerProfile, AssessorProfile, RepairPartnerProfile } from '../types';

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCustomerProfile(profile: Omit<CustomerProfile, 'id'>) {
  const { data, error } = await supabase
    .from('customer_profiles')
    .insert([profile])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateCustomerProfile(userId: string, updates: Partial<CustomerProfile>) {
  const { data, error } = await supabase
    .from('customer_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getAssessorProfile(userId: string): Promise<AssessorProfile | null> {
  const { data, error } = await supabase
    .from('assessor_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAssessorProfile(profile: Omit<AssessorProfile, 'id'>) {
  const { data, error } = await supabase
    .from('assessor_profiles')
    .insert([profile])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getRepairPartnerProfile(userId: string): Promise<RepairPartnerProfile | null> {
  const { data, error } = await supabase
    .from('repair_partner_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createRepairPartnerProfile(profile: Omit<RepairPartnerProfile, 'id'>) {
  const { data, error } = await supabase
    .from('repair_partner_profiles')
    .insert([profile])
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function updateRepairPartnerProfile(userId: string, updates: Partial<RepairPartnerProfile>) {
  const { data, error } = await supabase
    .from('repair_partner_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getNearbyRepairPartners(latitude: number, longitude: number, radiusKm: number = 50) {
  const { data, error } = await supabase
    .from('repair_partner_profiles')
    .select('*')
    .eq('is_approved', true)
    .gte('latitude', latitude - (radiusKm / 111))
    .lte('latitude', latitude + (radiusKm / 111))
    .gte('longitude', longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
    .lte('longitude', longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))));

  if (error) throw error;
  return data || [];
}
