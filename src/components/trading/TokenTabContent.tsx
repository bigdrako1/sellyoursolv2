
import React from 'react';
import { TokenList, TokenTracker } from '@/components/token';
import ApiUsageMonitor from '@/components/ApiUsageMonitor';

const TokenTabContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <TokenList />
      </div>
      <TokenTracker />
      <ApiUsageMonitor />
    </div>
  );
};

export default TokenTabContent;
