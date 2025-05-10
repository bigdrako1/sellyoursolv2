
import React from 'react';
import TokenList from '@/components/TokenList';
import TokenMonitor from '@/components/TokenMonitor';
import ApiUsageMonitor from '@/components/ApiUsageMonitor';

const TokenTabContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <TokenList />
      </div>
      <TokenMonitor />
      <ApiUsageMonitor />
    </div>
  );
};

export default TokenTabContent;
