import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const AssetForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    codename: initialData.codename || '',
    description: initialData.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card title="Asset Form">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Codename</label>
          <input
            type="text"
            value={formData.codename}
            onChange={(e) => setFormData({ ...formData, codename: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AssetForm;
