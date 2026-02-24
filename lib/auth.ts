import { supabase } from './supabase';
import { UserRole, AuthSession, User } from '../types';

export async function signUpUser(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: UserRole
): Promise<{ session: AuthSession; error: null } | { session: null; error: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { session: null, error: authError?.message || 'Failed to create account' };
    }

    const userData: User = {
      id: authData.user.id,
      email,
      phone,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        full_name: userData.full_name,
        role: userData.role,
        created_at: userData.created_at,
      },
    ]);

    if (insertError) {
      return { session: null, error: 'Failed to create user profile' };
    }

    return {
      session: { user: userData },
      error: null,
    };
  } catch (error) {
    return { session: null, error: 'An unexpected error occurred' };
  }
}

export async function signInUser(
  email: string,
  password: string
): Promise<{ session: AuthSession; error: null } | { session: null; error: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { session: null, error: authError?.message || 'Invalid credentials' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError || !userData) {
      return { session: null, error: 'Failed to fetch user data' };
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      phone: userData.phone,
      full_name: userData.full_name,
      role: userData.role as UserRole,
      created_at: userData.created_at,
    };

    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    return {
      session: { user },
      error: null,
    };
  } catch (error) {
    return { session: null, error: 'An unexpected error occurred' };
  }
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}
