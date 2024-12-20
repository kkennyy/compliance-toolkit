// CounterpartyRelationships.jsx

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// Note: We no longer need to import Link from react-router-dom for the view icon
// import { Link } from 'react-router-dom';

const PREDEFINED_ROLES = [
  'Ultimate Beneficial Owner',
  'Parent',
  'Director',
  'Controller',
  'Key Management Personnel'
];

const CounterpartyRelationships = ({
  relationships,
  addRelationship,
  removeRelationship,
  updateRelationship,
  counterparties,
  currentCounterpartyId,
  isEditing = false,
  disabled = false,
  onError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounterparty, setSelectedCounterparty] = useState(null);
  const [relationshipRole, setRelationshipRole] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [isParentRelationship, setIsParentRelationship] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const nameInputRef = useRef(null);

  const relatedCounterpartyIds = relationships.map((r) => r.counterparty.id);

  const filteredCounterparties = counterparties.filter((cp) =>
    cp.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
    !relatedCounterpartyIds.includes(cp.id) &&
    cp.id !== currentCounterpartyId
  );

  const filteredRoles = PREDEFINED_ROLES.filter((role) =>
    role.toLowerCase().includes(roleSearchQuery.toLowerCase().trim())
  );

  const isDisabledField = disabled || !isEditing;

  const handleAddRelationship = () => {
    if (!selectedCounterparty || !relationshipRole || !currentCounterpartyId) return;

    if (relationships.some((r) => r.counterparty.id === selectedCounterparty.id)) {
      onError?.('This counterparty is already related.');
      return;
    }

    const newRel = {
      counterparty: { id: selectedCounterparty.id, name: selectedCounterparty.name },
      role: relationshipRole,
      isParent: isParentRelationship,
    };

    addRelationship(newRel);

    setSelectedCounterparty(null);
    setRelationshipRole('');
    setRoleSearchQuery('');
    setSearchQuery('');
    setIsParentRelationship(false);
    setResetKey((k) => k + 1);
  };

  const handleRemoveRelationship = (counterpartyId) => {
    removeRelationship(counterpartyId);
  };

  useEffect(() => {
    setSearchQuery('');
  }, [selectedCounterparty]);

  useEffect(() => {
    if (
      isEditing &&
      !selectedCounterparty &&
      relationshipRole === '' &&
      nameInputRef.current
    ) {
      Promise.resolve().then(() => {
        nameInputRef.current.focus();
      });
    }
  }, [isEditing, selectedCounterparty, relationshipRole, resetKey]);

  const handleRoleChange = (newRole) => {
    setRelationshipRole(newRole);
    handleAddRelationship();
  };

  const handleRoleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (filteredRoles.length === 0) {
        event.preventDefault();
        handleAddRelationship();
      }
    }
  };

  return (
    <div className="p-6">
      {isEditing && (
        <div className="mb-4 space-y-4" key={resetKey}>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Combobox
                value={selectedCounterparty}
                onChange={setSelectedCounterparty}
                disabled={isDisabledField}
              >
                <div className="relative">
                  <Combobox.Input
                    ref={nameInputRef}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 
                               shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 
                               focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    displayValue={(cp) => cp?.name || searchQuery}
                    placeholder="Search for a counterparty..."
                    autoComplete="off"
                    disabled={isDisabledField}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Combobox.Button>
                  <Transition as={Fragment}>
                    <Combobox.Options
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 
                                 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    >
                      {filteredCounterparties.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Nothing found.
                        </div>
                      ) : (
                        filteredCounterparties.map((cp) => (
                          <Combobox.Option
                            key={cp.id}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={cp}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                                  {cp.name}
                                </span>
                                {selected && (
                                  <span
                                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                      active ? 'text-white' : 'text-blue-600'
                                    }`}
                                  >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 
                                        010 1.414l-8 8a1 1 0 
                                        01-1.414 0l-4-4a1 1 0 
                                        011.414-1.414L8 12.586l7.293-7.293a1 
                                        1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>

            <div className="flex-1">
              <Combobox
                value={relationshipRole}
                onChange={handleRoleChange}
                disabled={isDisabledField}
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 
                               shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 
                               focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    onChange={(event) => {
                      setRoleSearchQuery(event.target.value);
                      setRelationshipRole(event.target.value);
                    }}
                    onKeyDown={handleRoleKeyDown}
                    displayValue={(role) => role}
                    placeholder="Enter role..."
                    autoComplete="off"
                    disabled={isDisabledField}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Combobox.Button>
                  <Transition as={Fragment}>
                    <Combobox.Options
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 
                                 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    >
                      {filteredRoles.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Type to add a custom role.
                        </div>
                      ) : (
                        filteredRoles.map((role) => (
                          <Combobox.Option
                            key={role}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={role}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                                  {role}
                                </span>
                                {selected && (
                                  <span
                                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                      active ? 'text-white' : 'text-blue-600'
                                    }`}
                                  >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 
                                        010 1.414l-8 8a1 1 0 
                                        01-1.414 0l-4-4a1 1 0 
                                        011.414-1.414L8 12.586l7.293-7.293a1 
                                        1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>

            <div className="flex-initial">
              <select
                value={isParentRelationship ? 'parent' : 'child'}
                onChange={(e) => setIsParentRelationship(e.target.value === 'parent')}
                disabled={isDisabledField}
                className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm 
                           focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm 
                           disabled:bg-gray-100"
              >
                <option value="parent">Related counterparty is the parent</option>
                <option value="child">Related counterparty is the child</option>
              </select>
            </div>

            <button
              onClick={handleAddRelationship}
              disabled={!selectedCounterparty || !relationshipRole || isDisabledField}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
                         rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Add Relationship
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Related Counterparty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Relationship
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                View
              </th>
              {isEditing && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unlink
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {relationships.map((rel) => (
              <tr key={rel.counterparty.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {rel.counterparty.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm"
                      value={rel.role}
                      onChange={(e) => {
                        updateRelationship(rel.counterparty.id, { role: e.target.value });
                      }}
                    />
                  ) : (
                    rel.role
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {isEditing ? (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={rel.isParent ? 'parent' : 'child'}
                      onChange={(e) => {
                        const newIsParent = e.target.value === 'parent';
                        updateRelationship(rel.counterparty.id, { isParent: newIsParent });
                      }}
                    >
                      <option value="parent">Related counterparty is the parent</option>
                      <option value="child">Related counterparty is the child</option>
                    </select>
                  ) : (
                    rel.isParent ? 'Related counterparty is the Parent' : 'Related counterparty is the Child'
                  )}
                </td>

                {/* Change Link to a tag with target="_blank" */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={`/counterparties/${rel.counterparty.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg
                      className="h-5 w-5 inline-block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12c1.5-4.5 5.1-7.5 9.75-7.5s8.25 3 
                         9.75 7.5-5.1 7.5-9.75 7.5-8.25-3-9.75-7.5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 
                         016 0z"
                      />
                    </svg>
                  </a>
                </td>

                {isEditing && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveRelationship(rel.counterparty.id)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {relationships.length === 0 && (
              <tr>
                <td
                  colSpan={isEditing ? 5 : 4}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No relationships added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CounterpartyRelationships;
