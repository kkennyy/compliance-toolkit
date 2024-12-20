import React, { useState } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import AssetModal from '../components/assets/AssetModal';
import AssetList from '../components/assets/AssetList';
import { useAuth } from '../contexts/AuthContext';

const Assets = () => {
  const [showModal, setShowModal] = useState(false);
  const { session } = useAuth();

  const handleAddAsset = () => {
    setShowModal(true);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button onClick={handleAddAsset}>Add Asset</Button>
      </div>

      <AssetList />

      {showModal && (
        <AssetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </Card>
  );
};

export default Assets;