import React from 'react';
import Button from '../shared/Button';

const AssetLock = ({ assetId, isLocked, lockedBy }) => {
  const handleLockToggle = () => {
    console.log(isLocked ? 'Releasing Lock' : 'Acquiring Lock');
  };

  return (
    <div className="flex items-center space-x-4">
      <Button variant={isLocked ? 'danger' : 'primary'} onClick={handleLockToggle}>
        {isLocked ? 'Release Lock' : 'Acquire Lock'}
      </Button>
      {isLocked && <span>Locked by: {lockedBy}</span>}
    </div>
  );
};

export default AssetLock;
