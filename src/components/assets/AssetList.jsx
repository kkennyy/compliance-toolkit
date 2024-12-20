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

const AssetList = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [columns, setColumns] = useState([
    { id: 'name', label: 'Name', visible: true },
    { id: 'codename', label: 'Codename', visible: true },
    { id: 'business_unit', label: 'Business Unit', visible: true },
    { id: 'ownership_type', label: 'Ownership Type', visible: true },
    { id: 'investment_type', label: 'Investment Type', visible: true },
    { id: 'industry', label: 'Industry', visible: true },
    { id: 'currency', label: 'Currency', visible: true },
    { 
      id: 'status', 
      label: 'Status', 
      visible: true,
      render: (value) => (
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === 'Invested'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value || 'Unknown'}
        </span>
      )
    }
  ]);

  useEffect(() => {
    if (session) {
      fetchAssets();

      // Set up real-time subscription
      const subscription = supabase
        .channel('assets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assets'
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            fetchAssets(); // Refresh the assets list when changes occur
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*');

      if (assetsError) {
        console.error('Assets query error:', assetsError);
        throw assetsError;
      }

      console.log('Assets data:', assetsData);
      setAssets(assetsData || []);
    } catch (error) {
      console.error('Error in fetchAssets:', error);
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

  const handleAssetClick = (asset) => {
    console.log('Navigating to asset:', asset.id);
    navigate('/assets/' + asset.id);
  };

  if (loading) {
    return <div>Loading assets...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Column Management UI */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">Manage Columns</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(col => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  toggleColumnVisibility={toggleColumnVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Assets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              {columns
                .filter(col => col.visible)
                .map(column => (
                  <th
                    key={column.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                {columns
                  .filter(col => col.visible)
                  .map(column => (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.id === 'codename' ? (
                        <a
                          href={`/assets/${asset.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAssetClick(asset);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {asset[column.id]}
                        </a>
                      ) : column.render ? (
                        column.render(asset[column.id])
                      ) : (
                        asset[column.id]
                      )}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetList;
