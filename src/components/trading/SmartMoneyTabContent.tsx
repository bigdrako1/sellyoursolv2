
import React from 'react';
import SmartMoneyAlerts from '@/components/smart-money/SmartMoneyAlerts';

const SmartMoneyTabContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SmartMoneyAlerts />
    </div>
  );
};

export default SmartMoneyTabContent;
