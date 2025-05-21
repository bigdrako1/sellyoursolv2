import { useState } from 'react';

/**
 * Hook for managing token details viewing
 * Provides state and handlers for showing token details
 */
export const useTokenDetails = () => {
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false);
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');

  const showTokenDetails = (tokenAddress: string) => {
    setSelectedTokenAddress(tokenAddress);
    setIsTokenDetailsOpen(true);
  };

  const hideTokenDetails = () => {
    setIsTokenDetailsOpen(false);
  };

  return {
    isTokenDetailsOpen,
    selectedTokenAddress,
    showTokenDetails,
    hideTokenDetails
  };
};

export default useTokenDetails;
