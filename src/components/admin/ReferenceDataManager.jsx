import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import Table from '../shared/Table';
import Button from '../shared/Button';
import Card from '../shared/Card';
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/Tabs';

const ReferenceDataManager = () => {
  const [activeTab, setActiveTab] = useState('business_units');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const tableConfigs = {
    business_units: {
      title: 'Business Units',
      table: 'business_units',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'active', label: 'Active', type: 'checkbox' }
      ]
    },
    industries: {
      title: 'Industries',
      table: 'industries',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'sector', label: 'Sector', type: 'text' },
        { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High'] },
        { key: 'active', label: 'Active', type: 'checkbox' }
      ]
    },
    currencies: {
      title: 'Currencies',
      table: 'currencies',
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'symbol', label: 'Symbol', type: 'text' },
        { key: 'active', label: 'Active', type: 'checkbox' }
      ]
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from(activeTab)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const table = activeTab;
      const { error } = editItem
        ? await supabase
            .from(table)
            .update(formData)
            .eq('id', editItem.id)
        : await supabase
            .from(table)
            .insert(formData);

      if (error) throw error;
      
      setShowModal(false);
      setEditItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const exportData = async () => {
    try {
      const { data, error } = await supabase
        .from(activeTab)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0])
      .filter(key => !['id', 'created_at', 'updated_at'].includes(key))
      .join(',');
    
    const rows = data.map(item => 
      Object.keys(item)
        .filter(key => !['id', 'created_at', 'updated_at'].includes(key))
        .map(key => JSON.stringify(item[key]))
        .join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const renderForm = () => {
    const config = tableConfigs[activeTab];
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {config.fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                name={field.key}
                value={formData[field.key] || ''}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <select
                name={field.key}
                value={formData[field.key] || ''}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                name={field.key}
                checked={formData[field.key] || false}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            ) : (
              <input
                type={field.type}
                name={field.key}
                value={formData[field.key] || ''}
                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={field.required}
              />
            )}
          </div>
        ))}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              setEditItem(null);
              setFormData({});
            }}
          >
            Cancel
          </Button>
          <Button type="submit">
            {editItem ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reference Data Management</h1>
        <div className="flex space-x-4">
          <Button variant="secondary" onClick={exportData}>
            Export
          </Button>
          <Button onClick={() => setShowModal(true)}>
            Add New
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {Object.keys(tableConfigs).map(key => (
            <TabsTrigger key={key} value={key}>
              {tableConfigs[key].title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(tableConfigs).map(key => (
          <TabsContent key={key} value={key}>
            <Card>
              <Table
                data={data}
                columns={[
                  ...tableConfigs[key].fields.map(field => ({
                    key: field.key,
                    label: field.label,
                    render: row => {
                      if (field.type === 'checkbox') {
                        return row[field.key] ? 'Yes' : 'No';
                      }
                      return row[field.key];
                    }
                  })),
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (row) => (
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleEdit(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
                loading={loading}
                emptyMessage={`No ${tableConfigs[key].title.toLowerCase()} found`}
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog.Root open={showModal} onOpenChange={setShowModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {editItem ? `Edit ${tableConfigs[activeTab].title}` : `Add New ${tableConfigs[activeTab].title}`}
            </Dialog.Title>
            {renderForm()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default ReferenceDataManager;
