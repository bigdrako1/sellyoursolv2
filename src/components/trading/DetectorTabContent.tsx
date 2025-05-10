
import React from 'react';
import TokenDetector from '@/components/TokenDetector';
import TokenDetectionBotControl from '@/components/TokenDetectionBotControl';

const DetectorTabContent = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <TokenDetector />
      </div>
      <TokenDetectionBotControl />
    </div>
  );
};

export default DetectorTabContent;
