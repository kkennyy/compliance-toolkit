import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useLock } from '../../hooks/useLock';
import { useAuth } from '../../hooks/useAuth';

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { acquireLock, releaseLock } = useLock();
  const { session } = useAuth();

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select(`
            *,
            counterparties (*),
            compliance_analysis (*),
            transactions (*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAsset(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  const handleLock = async () => {
    const locked = await acquireLock(id, session.user.id);
    if (locked) {
      // Refresh asset data
      // You might want to implement optimistic updates here
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Asset Details
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {asset.name}
            </dd>
          </div>
          {/* Add more fields as needed */}
        </dl>
      </div>
    </div>
  );
};

export default AssetDetail;
