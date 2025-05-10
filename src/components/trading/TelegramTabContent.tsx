
import React from 'react';
import TelegramChannelMonitor from '@/components/TelegramChannelMonitor';

const TelegramTabContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TelegramChannelMonitor />
    </div>
  );
};

export default TelegramTabContent;
