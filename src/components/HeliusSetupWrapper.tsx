
import React from 'react';
import HeliusSetup from '@/components/HeliusSetup';

const HeliusSetupWrapper = ({ onApiKeySet }: { onApiKeySet: (apiKey: string) => Promise<void> }) => {
  return <HeliusSetup />;
};

export default HeliusSetupWrapper;
