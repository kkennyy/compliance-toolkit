import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../shared/Card';

const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    if (!error) {
      setAsset(data);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <Card title={asset.name}>
      <p>Codename: {asset.codename}</p>
      <p>Business Unit: {asset.business_unit}</p>
      <p>Ownership Type: {asset.ownership_type}</p>
      <p>Investment Type: {asset.investment_type}</p>
      <p>Industry: {asset.industry}</p>
      <p>Status: {asset.status}</p>
    </Card>
  );
};

export default AssetDetail;
