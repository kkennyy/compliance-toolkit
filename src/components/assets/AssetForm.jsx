import React, { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const AssetForm = ({ asset = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: asset.name || '',
    codename: asset.codename || '',
    business_unit: asset.business_unit || '',
    ownership_type: asset.ownership_type || 'Direct',
    investment_type: asset.investment_type || '',
    industry: asset.industry || '',
    status: asset.status || 'Pending'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card title="Asset Form">
      <form onSubmit={handleSubmit}>
        {/* Add fields dynamically */}
        {Object.keys(formData).map((field) => (
          <div key={field}>
            <label>{field}</label>
            <input
              type="text"
              value={formData[field]}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
            />
          </div>
        ))}
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </form>
    </Card>
  );
};

export default AssetForm;
