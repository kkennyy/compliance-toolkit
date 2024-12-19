import React, { useState, useEffect } from 'react';
import { checkDocumentExpiry, getExpiredDocuments } from '../../services/documentExpiryService';
import Card from '../shared/Card';
import Button from '../shared/Button';

const DocumentExpiryNotifications = () => {
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [expiredDocuments, setExpiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
    // Check every hour
    const interval = setInterval(fetchDocuments, 3600000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const [expiring, expired] = await Promise.all([
        checkDocumentExpiry(),
        getExpiredDocuments()
      ]);
      
      setExpiringDocuments(expiring);
      setExpiredDocuments(expired);
    } catch (error) {
      console.error('Error fetching document expiry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (expiringDocuments.length === 0 && expiredDocuments.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-6">
        {expiredDocuments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">
              Expired Documents ({expiredDocuments.length})
            </h3>
            <ul className="divide-y divide-gray-200">
              {expiredDocuments.map((doc) => (
                <li key={doc.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Asset: {doc.asset.name}
                        {doc.asset.codename && ` (${doc.asset.codename})`}
                      </p>
                      <p className="text-sm text-red-600">
                        Expired on {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        // TODO: Navigate to document
                        console.log('Navigate to document:', doc.id);
                      }}
                    >
                      View Document
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {expiringDocuments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-600">
              Documents Expiring Soon ({expiringDocuments.length})
            </h3>
            <ul className="divide-y divide-gray-200">
              {expiringDocuments.map((doc) => (
                <li key={doc.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Asset: {doc.asset.name}
                        {doc.asset.codename && ` (${doc.asset.codename})`}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Expires in {getDaysUntilExpiry(doc.expiry_date)} days
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        // TODO: Navigate to document
                        console.log('Navigate to document:', doc.id);
                      }}
                    >
                      View Document
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentExpiryNotifications;
