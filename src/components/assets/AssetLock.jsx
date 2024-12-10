import React from 'react';
import { useLock } from '../../hooks/useLock';
import { useAuth } from '../../hooks/useAuth';

const AssetLock = ({ assetId, isLocked, lockedBy }) => {
  const { acquireLock, releaseLock } = useLock();
  const { session } = useAuth();

  const handleLock = async () => {
    if (isLocked) {
      await releaseLock(assetId, session.user.id);
    } else {
      await acquireLock(assetId, session.user.id);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleLock}
        className={`px-4 py-2 rounded-md ${
          isLocked ? 'bg-red-500' : 'bg-green-500'
        } text-white`}
      >
        {isLocked ? 'Release Lock' : 'Acquire Lock'}
      </button>
      {isLocked && (
        <span className="text-sm text-gray-500">
          Locked by: {lockedBy}
        </span>
      )}
    </div>
  );
};

export default AssetLock;
