import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CounterpartyAssets = ({
  assets,
  linkedAssets,
  onLinkAsset,
  onUnlinkAsset,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div>
      <div className="mb-4">
        <Combobox
          onChange={(asset) => {
            if (asset && !linkedAssets.includes(asset.id)) {
              onLinkAsset(asset);
            }
          }}
          disabled={disabled}
        >
          <div className="relative">
            <Combobox.Input
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              onChange={(event) => setSearchQuery(event.target.value)}
              displayValue={() => ''}
              placeholder="Search for an asset..."
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Combobox.Button>
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredAssets.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <Combobox.Option
                    key={asset.id}
                    value={asset}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                    disabled={linkedAssets.includes(asset.id)}
                  >
                    {({ active, disabled }) => (
                      <span className={`block truncate ${disabled ? 'opacity-50' : ''}`}>
                        {asset.name} {disabled && '(Already linked)'}
                      </span>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>

      <div className="mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Name
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets
              .filter((asset) => linkedAssets.includes(asset.id))
              .map((asset) => (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onUnlinkAsset(asset.id)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
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

export default CounterpartyAssets;
