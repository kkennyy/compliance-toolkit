import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AssetList from '../components/assets/AssetList';
import AssetDetail from '../components/assets/AssetDetail';

const Assets = () => {
  return (
    <Routes>
      <Route path="/" element={<AssetList />} />
      <Route path="/:id" element={<AssetDetail />} />
    </Routes>
  );
};

export default Assets;
