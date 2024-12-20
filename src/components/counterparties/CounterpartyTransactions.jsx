import React, { forwardRef, useImperativeHandle } from 'react';
import Transactions from '../../pages/Transactions';

const CounterpartyTransactions = forwardRef(({ 
  counterpartyId,
  isNew,
  disabled = false
}, ref) => {
  // Forward the ref to expose the saveChanges method
  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      // Implement if needed
    },
    linkPendingTransactions: async (newCounterpartyId) => {
      // Implement if needed
    }
  }));

  return (
    <div>
      <Transactions
        counterpartyId={counterpartyId}
        isNew={isNew}
        disabled={disabled}
      />
    </div>
  );
});

CounterpartyTransactions.displayName = 'CounterpartyTransactions';

export default CounterpartyTransactions;
