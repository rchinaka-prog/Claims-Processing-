import { supabase } from './supabase';

export type NotificationType = 'info' | 'critical' | 'success' | 'warning';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info'
) {
  const { data, error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
    },
  ]).select();

  if (error) throw error;
  return data?.[0];
}

export async function getNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function markAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function markAllAsRead(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  if (error) throw error;
  return data || [];
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}
