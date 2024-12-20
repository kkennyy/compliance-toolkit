import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Button from '../shared/Button';

const CounterpartyFiles = ({ counterparty }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (counterparty?.id) {
      fetchFiles();
    }
  }, [counterparty]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('counterparty_files')
        .select('*')
        .eq('counterparty_id', counterparty.id)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading files...</div>;
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
        <h2 className="text-lg font-medium text-gray-900">File Repository</h2>
        <Button>Upload File</Button>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">File Name</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Size</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploaded By</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploaded At</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  <a href="#" className="text-blue-600 hover:text-blue-900">
                    {file.name}
                  </a>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{file.type}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{file.size}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{file.uploaded_by}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{file.uploaded_at}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
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

export default CounterpartyFiles;
