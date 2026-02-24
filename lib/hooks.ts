import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useClaimSubscription(claimId: string) {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClaim = async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('id', claimId)
        .maybeSingle();

      if (data) setClaim(data);
      setLoading(false);
    };

    loadClaim();

    const channel = supabase
      .channel(`claim_${claimId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
          filter: `id=eq.${claimId}`
        },
        (payload) => {
          if (payload.new) setClaim(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [claimId]);

  return { claim, loading };
}

export function useNotificationSubscription(userId: string) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return notifications;
}
