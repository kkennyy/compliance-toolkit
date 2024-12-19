import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Card from '../shared/Card';

const DocumentHistory = ({ documentId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [documentId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('document_audit_logs')
        .select(`
          *,
          user:auth.users!user_id (
            email
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAction = (log) => {
    switch (log.action) {
      case 'upload':
        return 'Uploaded document';
      case 'download':
        return 'Downloaded document';
      case 'status_change':
        return `Changed status from ${log.changes.previous_status} to ${log.changes.new_status}`;
      default:
        return log.action;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Document History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flow-root">
          <ul className="-mb-8">
            {history.map((log, idx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {idx !== history.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <svg
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          {renderAction(log)}
                        </p>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {Object.entries(log.changes)
                              .filter(([key]) => !['previous_status', 'new_status'].includes(key))
                              .map(([key, value]) => (
                                <div key={key}>
                                  {key.replace(/_/g, ' ')}: {value}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <div>{new Date(log.created_at).toLocaleDateString()}</div>
                        <div>{log.user?.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default DocumentHistory;
