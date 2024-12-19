import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Card from '../shared/Card';

const AssetHistory = ({ assetId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});

  useEffect(() => {
    fetchHistory();
  }, [assetId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_history')
        .select(`
          *,
          user:user_id (
            email
          )
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data);

      // Get unique user IDs
      const userIds = [...new Set(data.map(item => item.user_id))];
      
      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (userError) throw userError;

      // Create a map of user details
      const userMap = {};
      userData.forEach(user => {
        userMap[user.id] = user;
      });
      setUsers(userMap);
    } catch (error) {
      console.error('Error fetching asset history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChanges = (changes, changeType) => {
    switch (changeType) {
      case 'created':
        return 'Asset created';
      case 'deleted':
        return 'Asset deleted';
      case 'status_change':
        return `Status changed from "${changes.previous_status}" to "${changes.new_status}"`;
      case 'compliance_update':
        return 'Compliance information updated';
      case 'updated':
        const changedFields = [];
        const { previous, new: updated } = changes;
        
        Object.keys(updated).forEach(key => {
          if (previous[key] !== updated[key]) {
            changedFields.push({
              field: key,
              from: previous[key],
              to: updated[key]
            });
          }
        });

        return (
          <ul className="list-disc list-inside">
            {changedFields.map(({ field, from, to }) => (
              <li key={field} className="text-sm">
                Changed {field.replace(/_/g, ' ')} from "{from || 'empty'}" to "{to || 'empty'}"
              </li>
            ))}
          </ul>
        );
      default:
        return 'Unknown change';
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading history...</div>;
  }

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No history available
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-6 border-l-2 border-gray-200" />
          {history.map((item, index) => (
            <div key={item.id} className="relative pl-8 pb-8">
              <div className="absolute left-5 -ml-px h-4 w-4 rounded-full bg-white border-2 border-blue-600" />
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatChanges(item.changes, item.change_type)}
                  </p>
                  <p className="text-xs text-gray-500">
                    By {users[item.user_id]?.email || 'Unknown user'}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetHistory;
