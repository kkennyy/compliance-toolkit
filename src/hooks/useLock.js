import { useState } from 'react';
import { supabase } from '../config/supabaseClient';

export const useLock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const acquireLock = async (assetId, userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('lock_asset', { p_asset_id: assetId, p_user_id: userId });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const releaseLock = async (assetId, userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('unlock_asset', { p_asset_id: assetId, p_user_id: userId });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { acquireLock, releaseLock, loading, error };
};
