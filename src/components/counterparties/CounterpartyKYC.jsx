import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Button from '../shared/Button';

const CounterpartyKYC = ({ counterparty }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kycData, setKycData] = useState([]);

  useEffect(() => {
    if (counterparty?.id) {
      fetchKYCData();
    }
  }, [counterparty]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('counterparty_kyc')
        .select('*')
        .eq('counterparty_id', counterparty.id)
        .order('date_reviewed', { ascending: false });

      if (fetchError) throw fetchError;
      setKycData(data || []);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading KYC data...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">KYC Documentation</h2>
        <Button>Add Item</Button>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Document</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Comments</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date Reviewed</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Scheduled Review</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachments</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {kycData.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.document}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.status}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.comments}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.date_reviewed}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.scheduled_review}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.attachments && (
                    <a href="#" className="text-blue-600 hover:text-blue-900">
                      View
                    </a>
                  )}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CounterpartyKYC;
