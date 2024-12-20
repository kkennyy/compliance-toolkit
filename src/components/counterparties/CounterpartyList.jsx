import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../hooks/useAuth';
import { logSearch, logEntityView, ACTION_TYPES } from '../../utils/systemLogger';

function SortableColumn({ column, toggleColumnVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center bg-gray-100 rounded p-2 cursor-move"
    >
      <input
        type="checkbox"
        checked={column.visible}
        onChange={() => toggleColumnVisibility(column.id)}
        className="mr-2"
        onClick={(e) => e.stopPropagation()}
      />
      <span>{column.label}</span>
    </div>
  );
}

const CounterpartyList = () => {
  const navigate = useNavigate();
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    jurisdiction: '',
    regulated_status: ''
  });
  const { session } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [columns, setColumns] = useState([
    { id: 'name', label: 'Name', visible: true },
    { id: 'entity_type', label: 'Entity Type', visible: true },
    { id: 'type', label: 'Type', visible: true },
    { id: 'description', label: 'Description', visible: true }
  ]);

  useEffect(() => {
    if (session) {
      fetchCounterparties();

      // Set up real-time subscription
      const subscription = supabase
        .channel('counterparties_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'counterparties' }, 
          () => {
            fetchCounterparties();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session]);

  const fetchCounterparties = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('counterparties')
        .select('*');

      // Apply filters
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
      }
      if (filters.regulated_status) {
        query = query.eq('regulated_status', filters.regulated_status);
      }

      const { data, error: fetchError } = await query.order('name');

      if (fetchError) throw fetchError;
      setCounterparties(data || []);

      // Log search/filter activity if criteria are present
      if (searchTerm || Object.values(filters).some(v => v)) {
        await logSearch('counterparty', {
          search_term: searchTerm,
          filters,
          result_count: data?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching counterparties:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleAddCounterparty = () => {
    navigate('/counterparties/new');
  };

  const handleRowClick = async (counterparty) => {
    // Log the click before navigation
    await logEntityView('counterparty', counterparty.id, counterparty.name, {
      source: 'list_view',
      is_regulated: counterparty.regulated_status === 'Yes',
      jurisdiction: counterparty.jurisdiction
    });
    navigate(`/counterparties/${counterparty.id}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Counterparties</h1>
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search counterparties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {/* Filters */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporation">Corporation</option>
            <option value="Trust">Trust</option>
          </select>
          <button
            onClick={handleAddCounterparty}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Counterparty
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
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
      )}

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              {columns
                .filter(col => col.visible)
                .map(column => (
                  <th
                    key={column.id}
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {counterparties.map((counterparty) => (
              <tr 
                key={counterparty.id} 
                onClick={() => handleRowClick(counterparty)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                {columns
                  .filter(col => col.visible)
                  .map(column => (
                    <td
                      key={column.id}
                      className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6"
                    >
                      {counterparty[column.id]}
                    </td>
                  ))}
              </tr>
            ))}
            {counterparties.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={columns.filter(col => col.visible).length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No counterparties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CounterpartyList;
