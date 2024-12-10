import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from './useAuth';

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session) {
        setAssets([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAssets();
    }
  }, [session]); // Re-fetch when session changes

  const refetch = async () => {
    await fetchAssets();
  };

  return { 
    assets: assets || [], 
    loading, 
    error, 
    refetch 
  };
};
