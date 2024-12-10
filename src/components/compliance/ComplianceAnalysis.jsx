import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import RiskAssessment from './RiskAssessment';

const ComplianceAnalysis = ({ assetId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [assetId]);

  const fetchAnalysis = async () => {
    const { data, error } = await supabase
      .from('compliance_analysis')
      .select('*')
      .eq('asset_id', assetId)
      .single();

    if (!error) {
      setAnalysis(data);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Compliance Analysis</h3>
      <RiskAssessment analysis={analysis} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Methodology</h4>
          <p className="text-gray-600">{analysis?.methodology}</p>
        </div>
        <div>
          <h4 className="font-medium">Summary</h4>
          <p className="text-gray-600">{analysis?.summary_analysis}</p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAnalysis;
