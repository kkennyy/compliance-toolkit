// CounterpartyDetail.jsx

import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import CounterpartyAdminDetails from './CounterpartyAdminDetails';
import CounterpartyKYC from './CounterpartyKYC';
import CounterpartyFiles from './CounterpartyFiles';
import CounterpartyRelationships from './CounterpartyRelationships';
import CounterpartyAssets from './CounterpartyAssets';
import CounterpartyTransactions from './CounterpartyTransactions';
import { Combobox, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CounterpartyDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counterparty, setCounterparty] = useState(null);
  const [formData, setFormData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [linkedAssets, setLinkedAssets] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalRelationships, setOriginalRelationships] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const transactionsRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef(null);
  const isNew = id === 'new' || !id;

  let activeTab = 'admin'; // default
  if (location.pathname.endsWith('relationships')) activeTab = 'relationships';
  else if (location.pathname.endsWith('transactions')) activeTab = 'transactions';
  else if (location.pathname.endsWith('linked-assets')) activeTab = 'linked-assets';
  else if (location.pathname.endsWith('kyc')) activeTab = 'kyc';
  else if (location.pathname.endsWith('files')) activeTab = 'files';

  const tabs = [
    { id: 'admin', name: 'Administrative Details', path: `/counterparties/${id}` },
    { id: 'relationships', name: 'Relationships', path: `/counterparties/${id}/relationships` },
    { id: 'transactions', name: 'Transactions', path: `/counterparties/${id}/transactions` },
    { id: 'linked-assets', name: 'Linked Assets', path: `/counterparties/${id}/linked-assets` },
    { id: 'kyc', name: 'KYC/AML', path: `/counterparties/${id}/kyc` },
    { id: 'files', name: 'Files', path: `/counterparties/${id}/files` }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCounterparties();
        if (!isNew && id !== 'new' && id !== undefined) {
          await fetchCounterparty();
          await fetchRelationships();
        }
        await fetchAssets();
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew]);

  useEffect(() => {
    if (counterparty) {
      setFormData(counterparty);
    }
  }, [counterparty]);

  const fetchCounterparty = async () => {
    if (isNew || !id || id === 'new') return;
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('counterparties')
        .select(`
          id,
          name,
          type,
          jurisdiction,
          registration_number,
          incorporation_date,
          description,
          regulated_status,
          regulated_reason,
          address,
          aml_profile_type,
          aml_risk_rating,
          asset_counterparties (
            id,
            asset_id,
            role,
            start_date,
            end_date,
            assets:asset_id (
              id,
              name,
              description
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching counterparty:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Counterparty not found');
      }

      setCounterparty(data);

      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, description');

      if (assetsError) {
        console.error('Error fetching assets:', assetsError);
      } else {
        setAssets(assetsData || []);
      }

      const linkedAssetIds = data.asset_counterparties?.map(ac => ac.asset_id) || [];
      setLinkedAssets(linkedAssetIds);

    } catch (error) {
      console.error('Error fetching counterparty:', error);
      setError('Failed to fetch counterparty details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, name, description');

      if (error) {
        console.error('Error fetching assets:', error);
      } else {
        setAssets(data || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchRelationships = async () => {
    if (isNew || !id || id === 'new') return;
    try {
      const { data: parentRelationships, error: parentError } = await supabase
        .from('counterparty_relationships')
        .select(`id, parent_id, child_id, role`)
        .eq('parent_id', id);

      const { data: childRelationships, error: childError } = await supabase
        .from('counterparty_relationships')
        .select(`id, parent_id, child_id, role`)
        .eq('child_id', id);

      if (parentError || childError) throw parentError || childError;

      const transformedParentRels = (parentRelationships || []).map(rel => ({
        id: rel.id,
        role: rel.role,
        counterparty: { id: rel.child_id, name: '' },
        isParent: false
      }));

      const transformedChildRels = (childRelationships || []).map(rel => ({
        id: rel.id,
        role: rel.role,
        counterparty: { id: rel.parent_id, name: '' },
        isParent: true
      }));

      const relatedIds = [...transformedParentRels, ...transformedChildRels].map(r => r.counterparty.id);
      let relatedNamesMap = {};
      if (relatedIds.length > 0) {
        const { data: relatedCps, error: relatedError } = await supabase
          .from('counterparties')
          .select('id, name')
          .in('id', relatedIds);

        if (relatedError) {
          console.error('Error fetching related counterparties:', relatedError);
        } else {
          relatedNamesMap = relatedCps.reduce((acc, cp) => {
            acc[cp.id] = cp.name;
            return acc;
          }, {});
        }
      }

      const allRelationships = [...transformedParentRels, ...transformedChildRels].map(rel => ({
        ...rel,
        counterparty: {
          id: rel.counterparty.id,
          name: relatedNamesMap[rel.counterparty.id] || ''
        }
      }));

      setOriginalRelationships(allRelationships);
      setRelationships(allRelationships);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setError('Failed to fetch relationships.');
    }
  };

  const fetchCounterparties = async () => {
    try {
      const { data, error } = await supabase
        .from('counterparties')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCounterparties(data || []);
    } catch (error) {
      console.error('Error fetching counterparties list:', error);
      setError('Failed to fetch counterparties list.');
    }
  };

  const addRelationship = (newRel) => {
    setRelationships((prev) => [...prev, newRel]);
  };

  const removeRelationship = (counterpartyId) => {
    setRelationships((prev) => prev.filter((rel) => rel.counterparty.id !== counterpartyId));
  };

  const updateRelationship = (counterpartyId, updates) => {
    setRelationships((prev) =>
      prev.map((rel) => {
        if (rel.counterparty.id === counterpartyId) {
          return { ...rel, ...updates };
        }
        return rel;
      })
    );
  };

  const linkAsset = (asset) => {
    setLinkedAssets((prev) => [...prev, asset.id]);
  };

  const unlinkAsset = (assetId) => {
    setLinkedAssets((prev) => prev.filter((a) => a !== assetId));
  };

  const saveRelationships = async () => {
    if (isNew || !id || id === 'new') return;

    const originalById = originalRelationships.reduce((acc, r) => {
      if (r.id) acc[r.id] = r;
      return acc;
    }, {});

    const currentById = relationships.reduce((acc, r) => {
      if (r.id) acc[r.id] = r;
      return acc;
    }, {});

    const toInsert = relationships.filter(r => !r.id);
    const toDelete = originalRelationships.filter(r => r.id && !currentById[r.id]);

    const toUpdate = [];
    for (const r of relationships) {
      if (r.id && originalById[r.id]) {
        const orig = originalById[r.id];
        if (orig.role !== r.role || orig.isParent !== r.isParent) {
          if (orig.isParent !== r.isParent) {
            toDelete.push(orig);
            toInsert.push({ ...r, id: undefined });
          } else {
            toUpdate.push({ original: orig, updated: r });
          }
        }
      }
    }

    for (const rel of toInsert) {
      const { error, data } = await supabase
        .from('counterparty_relationships')
        .insert({
          parent_id: rel.isParent ? rel.counterparty.id : id,
          child_id: rel.isParent ? id : rel.counterparty.id,
          role: rel.role
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding relationship:', error);
        throw error;
      }

      setRelationships((prev) =>
        prev.map((p) => {
          if (p === rel) {
            return { ...p, id: data.id };
          }
          return p;
        })
      );
    }

    for (const rel of toDelete) {
      const { error } = await supabase
        .from('counterparty_relationships')
        .delete()
        .eq('id', rel.id);

      if (error) {
        console.error('Error removing relationship:', error);
        throw error;
      }
    }

    for (const { original, updated } of toUpdate) {
      const { error } = await supabase
        .from('counterparty_relationships')
        .update({ role: updated.role })
        .eq('id', updated.id);

      if (error) {
        console.error('Error updating relationship:', error);
        throw error;
      }
    }

    setOriginalRelationships([...relationships]);
  };

  const handleSave = async (updatedData) => {
    try {
      setIsSaving(true);
      setError(null);

      if (!updatedData.id) {
        console.error('No ID provided for update');
        throw new Error('No ID provided for update');
      }

      const recordId = updatedData.id;

      const { data: existingRecord, error: fetchError } = await supabase
        .from('counterparties')
        .select('id')
        .eq('id', recordId)
        .single();

      if (fetchError) {
        console.error('Error verifying record:', fetchError);
        throw new Error('Could not verify record exists');
      }

      if (!existingRecord) {
        console.error('No record found with ID:', recordId);
        throw new Error('Record not found');
      }

      const { error: updateError } = await supabase
        .from('counterparties')
        .update({
          name: updatedData.name,
          type: updatedData.type,
          description: updatedData.description,
          regulated_status: updatedData.regulated_status,
          regulated_reason: updatedData.regulated_reason,
          jurisdiction: updatedData.jurisdiction,
          address: updatedData.address,
          aml_profile_type: updatedData.aml_profile_type,
          aml_risk_rating: updatedData.aml_risk_rating,
          registration_number: updatedData.registration_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      await saveRelationships();

      const { data: refreshedData, error: refreshError } = await supabase
        .from('counterparties')
        .select('*')
        .eq('id', recordId)
        .single();

      if (refreshError) {
        console.error('Error refreshing data:', refreshError);
        throw refreshError;
      }

      setCounterparty(refreshedData);
      setFormData(refreshedData);

      setShowSuccess(true);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving counterparty:', error);
      setError('Failed to save counterparty details: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(counterparty);
    setRelationships(originalRelationships);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Simple spinner or loading text */}
        <div className="text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 
              100-16 8 8 0 
              000 16zM8.707 7.293a1 1 0 
              00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 
              101.414 1.414L10 11.414l1.293 1.293a1 1 0 
              001.414-1.414L11.414 10l1.293-1.293a1 1 0 
              00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-2">
          <Link to="/counterparties" className="text-blue-600 hover:text-blue-800">
            Counterparties
          </Link>
          <span className="mx-1">/</span>
          {counterparty?.name || 'New Counterparty'}
        </nav>

        {/* Success message */}
        <div
          className={`fixed top-4 right-4 transform transition-transform duration-300 ease-in-out ${
            showSuccess ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4 flex items-center space-x-3">
            <svg
              className="h-5 w-5 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 
                100-16 8 8 0 
                000 16zm3.707-9.293a1 1 0 
                00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 
                00-1.414 1.414l2 2a1 1 0 
                001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-gray-800">Changes saved</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{counterparty?.name || 'New Counterparty'}</h1>
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Edit Details
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(formData)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 font-medium text-sm rounded-md`}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Tab panels */}
        <div className="bg-white rounded-xl shadow-sm">
          {activeTab === 'admin' && (
            <div className="p-6">
              <CounterpartyAdminDetails
                counterparty={counterparty}
                isNew={isNew}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          )}

          {activeTab === 'relationships' && (
            <CounterpartyRelationships
              relationships={relationships}
              addRelationship={addRelationship}
              removeRelationship={removeRelationship}
              updateRelationship={updateRelationship}
              counterparties={counterparties}
              currentCounterpartyId={id}
              isEditing={isEditing}
              disabled={loading}
              onError={setError}
            />
          )}

          {activeTab === 'transactions' && (
            <CounterpartyTransactions
              ref={transactionsRef}
              counterpartyId={id}
              isNew={isNew}
              disabled={loading}
            />
          )}

          {activeTab === 'linked-assets' && (
            <CounterpartyAssets
              assets={assets}
              linkedAssets={linkedAssets}
              onLinkAsset={linkAsset}
              onUnlinkAsset={unlinkAsset}
              disabled={loading}
            />
          )}

          {activeTab === 'kyc' && (
            <CounterpartyKYC
              counterpartyId={id}
              disabled={loading}
            />
          )}

          {activeTab === 'files' && (
            <CounterpartyFiles
              counterpartyId={id}
              disabled={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterpartyDetail;
