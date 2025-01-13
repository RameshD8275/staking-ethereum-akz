import React from 'react';
import { Wallet } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';

interface ConnectWalletProps {
  isConnected: boolean;
  onConnect: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onConnect }) => {
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();

  React.useEffect(() => {
    if (isConnected) {
      onConnect();
    }
  }, [isConnected, onConnect]);

  return (
    <button
      onClick={() => open()}
      className={`
        px-8 py-4 rounded-lg font-semibold flex items-center space-x-2
        transform transition-all duration-200 hover:scale-105
        ${isConnected 
          ? 'bg-amber-500 text-navy-900 cursor-default'
          : 'bg-amber-500 hover:bg-amber-600 text-navy-900'}
      `}
    >
      <Wallet className="w-5 h-5" />
      <span>{isConnected ? 'Wallet Connected' : 'Connect Wallet'}</span>
    </button>
  );
};

export default ConnectWallet;