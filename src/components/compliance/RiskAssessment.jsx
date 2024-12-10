import React from 'react';

const RiskAssessment = ({ analysis }) => {
  const riskLevels = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium">Residual Risk Rating</span>
          <div className={`mt-1 px-2 py-1 rounded-md inline-block ${riskLevels[analysis?.residual_risk_rating]}`}>
            {analysis?.residual_risk_rating}
          </div>
        </div>
        <div>
          <span className="text-sm font-medium">Inherent Risk Rating</span>
          <div className={`mt-1 px-2 py-1 rounded-md inline-block ${riskLevels[analysis?.inherent_risk_rating]}`}>
            {analysis?.inherent_risk_rating}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;
