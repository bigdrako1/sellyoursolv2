import React, { useState, useCallback } from 'react';
import { TokenDetails } from '@/components/token';

/**
 * Hook for managing token details dialog
 * Provides a consistent way to view token details throughout the application
 */
export const useTokenDetails = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');

  const openTokenDetails = useCallback((address: string) => {
    setTokenAddress(address);
    setIsOpen(true);
  }, []);

  const closeTokenDetails = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Component to be used in the parent component's render method
  const TokenDetailsDialog = useCallback(() => {
    return (
      <TokenDetails
        tokenAddress={tokenAddress}
        isOpen={isOpen}
        onClose={closeTokenDetails}
      />
    );
  }, [tokenAddress, isOpen, closeTokenDetails]);

  return {
    openTokenDetails,
    closeTokenDetails,
    TokenDetailsDialog
  };
};

export default useTokenDetails;
