import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { bscTestnet, sepolia } from 'wagmi/chains';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';

import App from './App.tsx';
import './index.css';

const projectId = '95e0569d4d728cf790282a208164662e';

// Configure Ethereum Testnet
const bscTestnetCustom = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com']
      // http: ['https://data-seed-prebsc-1-s1.binance.org:8545/']
    },
    public: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com']
      // http: ['https://data-seed-prebsc-1-s1.binance.org:8545/']
    }
  }
};

const metadata = {
  name: 'AKZ Staking',
  description: 'AKZ Token Staking Platform',
  url: 'https://akz-staking.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [bscTestnetCustom];
const wagmiConfig = defaultWagmiConfig({ 
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
});

createWeb3Modal({ 
  wagmiConfig, 
  projectId, 
  chains,
  defaultChain: bscTestnetCustom,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#f59e0b',
    '--w3m-color-mix': '#f59e0b',
    '--w3m-color-mix-strength': '30'
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <App />
    </WagmiConfig>
  </StrictMode>
);