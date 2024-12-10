import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AssetList from '../components/assets/AssetList';
import AssetDetail from '../components/assets/AssetDetail';

const Assets = () => {
  const location = useLocation();
  console.log('Assets component rendering, path:', location.pathname);

  return (
    <Routes>
      <Route index element={<AssetList />} />
      <Route path=":id" element={<AssetDetail />} />
    </Routes>
  );
};

export default Assets;
