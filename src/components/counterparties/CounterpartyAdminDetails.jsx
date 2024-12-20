import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import cpiData from '../../lib/cpi.json'; // Import CPI data

const jurisdictions = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Côte d'Ivoire", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
  "Estonia", "Eswatini", "Ethiopia", "Federated States of Micronesia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala",
  "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger",
  "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Republic of the Congo",
  "Romania", "Russia", "Rwanda", "St Kitts and Nevis", "St Lucia", "St Vincent and the Grenadines",
  "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const entityTypes = ['Company', 'Partnership', 'Trust', 'Individual'];

const CounterpartyAdminDetails = ({
  counterparty,
  isNew = false,
  onSave,
  onCancel,
  isEditing,
  formData,
  setFormData
}) => {
  const [error, setError] = useState(null);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const [jurisdictionSearchQuery, setJurisdictionSearchQuery] = useState('');
  const [showRegulatedReason, setShowRegulatedReason] = useState(false);
  const [cpiDataForSelectedCountry, setCpiDataForSelectedCountry] = useState(null);

  useEffect(() => {
    if (counterparty) {
      const isRegulated = counterparty.regulated_status === 'Yes';
      setShowRegulatedReason(isRegulated);
      setFormData({
        id: counterparty.id,
        name: counterparty.name || '',
        type: counterparty.type || '',
        description: counterparty.description || '',
        regulated_status: counterparty.regulated_status || '',
        regulated_reason: counterparty.regulated_reason || '',
        jurisdiction: counterparty.jurisdiction || '',
        address: counterparty.address || '',
        aml_profile_type: counterparty.aml_profile_type || '',
        aml_risk_rating: counterparty.aml_risk_rating || '',
        registration_number: counterparty.registration_number || ''
      });
    }
  }, [counterparty, setFormData]);

  useEffect(() => {
    setShowRegulatedReason(formData?.regulated_status === 'Yes');
  }, [formData?.regulated_status]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredEntityTypes = useMemo(() => {
    const query = typeSearchQuery.toLowerCase().trim();
    return query === ''
      ? entityTypes
      : entityTypes.filter(et => et.toLowerCase().includes(query));
  }, [typeSearchQuery]);

  const filteredJurisdictions = useMemo(() => {
    const query = jurisdictionSearchQuery.toLowerCase().trim();
    return query === ''
      ? jurisdictions
      : jurisdictions.filter(j => j.toLowerCase().includes(query));
  }, [jurisdictionSearchQuery]);

  const latestYear = useMemo(() => {
    const years = Object.keys(cpiData).map(y => parseInt(y, 10));
    return Math.max(...years);
  }, []);

  useEffect(() => {
    if (formData?.jurisdiction) {
      const yearData = cpiData[latestYear] || [];
      const countryData = yearData.find(
        (item) => item.Country.toLowerCase() === formData.jurisdiction.toLowerCase()
      );
      if (countryData) {
        setCpiDataForSelectedCountry({
          score: countryData.Score,
          rank: countryData.Rank,
        });
      } else {
        setCpiDataForSelectedCountry(null);
      }
    } else {
      setCpiDataForSelectedCountry(null);
    }
  }, [formData.jurisdiction, latestYear]);

  return (
    <div className="px-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                id="name"
                value={formData?.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter counterparty name"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.name || 'Not specified'}</div>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            {isEditing ? (
              <Combobox value={formData?.type || ''} onChange={(value) => handleInputChange({ target: { name: 'type', value } })}>
                <div className="relative mt-1">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left shadow-sm focus:outline-none sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 leading-5 text-gray-900 focus:ring-0"
                      displayValue={(type) => type}
                      onChange={(event) => setTypeSearchQuery(event.target.value)}
                      placeholder="Search and select a type..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Combobox.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredEntityTypes.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Nothing found.
                        </div>
                      ) : (
                        filteredEntityTypes.map((et) => (
                          <Combobox.Option
                            key={et}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={et}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                                  {et}
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
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
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
            ) : (
              <div className="text-sm text-gray-900">{formData?.type || 'Not specified'}</div>
            )}
          </div>

          {/* Jurisdiction */}
          <div>
            <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
              Jurisdiction
            </label>
            {isEditing ? (
              <Combobox value={formData?.jurisdiction || ''} onChange={(value) => handleInputChange({ target: { name: 'jurisdiction', value } })}>
                <div className="relative mt-1">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left shadow-sm focus:outline-none sm:text-sm">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 leading-5 text-gray-900 focus:ring-0"
                      displayValue={(jurisdiction) => jurisdiction}
                      onChange={(event) => setJurisdictionSearchQuery(event.target.value)}
                      placeholder="Search and select a jurisdiction..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Combobox.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredJurisdictions.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                          Nothing found.
                        </div>
                      ) : (
                        filteredJurisdictions.map((j) => (
                          <Combobox.Option
                            key={j}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                            value={j}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                                  {j}
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
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
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
            ) : (
              <div className="text-sm text-gray-900">{formData?.jurisdiction || 'Not specified'}</div>
            )}

            {/* CPI Details should appear in both modes if data is present */}
            {cpiDataForSelectedCountry && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700">CPI Details ({latestYear})</h4>
                <p className="text-sm text-gray-800">
                  Score:{" "}
                  <span className={cpiDataForSelectedCountry.score <= 45 ? "text-red-600" : ""}>
                    {cpiDataForSelectedCountry.score}
                  </span>
                </p>
                <p className="text-sm text-gray-800">Rank: {cpiDataForSelectedCountry.rank}</p>
              </div>
            )}
          </div>

          {/* Registration Number */}
          <div>
            <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            {isEditing ? (
              <input
                type="text"
                name="registration_number"
                id="registration_number"
                value={formData?.registration_number || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter registration number"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.registration_number || 'Not specified'}</div>
            )}
          </div>

          {/* Regulated Status */}
          <div>
            <label htmlFor="regulated_status" className="block text-sm font-medium text-gray-700">
              Regulated Status
            </label>
            {isEditing ? (
              <select
                name="regulated_status"
                id="regulated_status"
                value={formData?.regulated_status || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            ) : (
              <div className="text-sm text-gray-900">{formData?.regulated_status || 'Not specified'}</div>
            )}
          </div>

          {/* Regulated Reason */}
          {showRegulatedReason && (
            <div>
              <label htmlFor="regulated_reason" className="block text-sm font-medium text-gray-700">
                Reason for Regulation
              </label>
              {isEditing ? (
                <textarea
                  name="regulated_reason"
                  id="regulated_reason"
                  value={formData?.regulated_reason || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Please explain the regulatory status..."
                />
              ) : (
                <div className="text-sm text-gray-900">{formData?.regulated_reason || 'Not specified'}</div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            {isEditing ? (
              <textarea
                name="address"
                id="address"
                value={formData?.address || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter address"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.address || 'Not specified'}</div>
            )}
          </div>

          {/* AML Profile Type */}
          <div>
            <label htmlFor="aml_profile_type" className="block text-sm font-medium text-gray-700">
              AML Profile Type
            </label>
            {isEditing ? (
              <input
                type="text"
                name="aml_profile_type"
                id="aml_profile_type"
                value={formData?.aml_profile_type || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter AML profile type"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.aml_profile_type || 'Not specified'}</div>
            )}
          </div>

          {/* AML Risk Rating */}
          <div>
            <label htmlFor="aml_risk_rating" className="block text-sm font-medium text-gray-700">
              AML Risk Rating
            </label>
            {isEditing ? (
              <input
                type="text"
                name="aml_risk_rating"
                id="aml_risk_rating"
                value={formData?.aml_risk_rating || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter AML risk rating"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.aml_risk_rating || 'Not specified'}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            {isEditing ? (
              <textarea
                name="description"
                id="description"
                value={formData?.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter description"
              />
            ) : (
              <div className="text-sm text-gray-900">{formData?.description || 'Not specified'}</div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex space-x-3">
          <button
            type="button"
            onClick={() => onCancel()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default CounterpartyAdminDetails;
