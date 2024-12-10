import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import { formatDate } from '../utils/dateUtils';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const reportTypes = [
    {
      id: 'compliance',
      name: 'Compliance Summary',
      description: 'Overview of compliance status across all assets'
    },
    {
      id: 'risk',
      name: 'Risk Assessment',
      description: 'Detailed risk analysis by jurisdiction and category'
    },
    {
      id: 'transactions',
      name: 'Transaction Report',
      description: 'Summary of all transactions within date range'
    }
  ];

  const generateReport = async (reportType) => {
    setLoading(true);
    try {
      let data;
      switch (reportType) {
        case 'compliance':
          data = await generateComplianceReport();
          break;
        case 'risk':
          data = await generateRiskReport();
          break;
        case 'transactions':
          data = await generateTransactionReport();
          break;
        default:
          throw new Error('Invalid report type');
      }
      downloadReport(data, reportType);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (data, type) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${formatDate(new Date())}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card title="Generate Reports">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <h3 className="text-lg font-medium">{report.name}</h3>
                <p className="text-sm text-gray-500">{report.description}</p>
                <Button
                  variant="primary"
                  size="small"
                  className="mt-2"
                  onClick={() => generateReport(report.id)}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
