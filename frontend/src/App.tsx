import React, { useState } from 'react';
import { Coins, Clock, Percent, Wallet, History, Award } from 'lucide-react';
import StakingPlan from './components/StakingPlan';
import ConnectWallet from './components/ConnectWallet';
import StakingStats from './components/StakingStats';
import RewardsHistory from './components/RewardsHistory';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('stake');

  const stakingPlans = [
    {
      name: 'Bronze Staking Plan',
      range: '100 AKZ - 1000 AKZ',
      bonus: '0.15%',
      period: 'Daily',
      duration: '52 weeks',
      totalBonus: '54.6%',
      theme: 'from-amber-600 to-amber-800',
      borderColor: 'border-amber-500',
      minStake: 100,
      maxStake: 1000,
      schemeId: 1
    },
    {
      name: 'Silver Staking Plan',
      range: '1001 AKZ - 2000 AKZ',
      bonus: '1.25%',
      period: 'Weekly',
      duration: '52 weeks',
      totalBonus: '65%',
      theme: 'from-blue-600 to-blue-800',
      borderColor: 'border-blue-500',
      minStake: 1001,
      maxStake: 2000,
      schemeId: 2
    },
    {
      name: 'Gold Staking Plan',
      range: '2001 AKZ - 5000 AKZ',
      bonus: '3%',
      period: 'Bi-Weekly(15 days)',
      duration: '52 weeks',
      totalBonus: '72%',
      theme: 'from-amber-500 to-yellow-600',
      borderColor: 'border-yellow-500',
      minStake: 2001,
      maxStake: 5000,
      schemeId: 3
    },
    {
      name: 'Diamond Staking Plan',
      range: '2001 AKZ - 5000 AKZ',
      bonus: '8%',
      period: 'Monthly',
      duration: '52 weeks',
      totalBonus: '96%',
      theme: 'from-white-500 to-blue-600',
      borderColor: 'border-blue-500',
      minStake: 2001,
      maxStake: 5000,
      schemeId: 4
    }
  ];

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900">
      <ToastContainer />
      <div className="fixed top-0 right-0 p-4 z-50">
        <ConnectWallet 
          isConnected={isWalletConnected} 
          onConnect={() => setIsWalletConnected(true)}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Award className="w-12 h-12 text-amber-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">AKZ Token Staking</h1>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Stake your AKZ tokens and earn rewards through our flexible staking programs.
            Choose from multiple plans with different durations and rewards.
          </p>
        </header>

        <StakingStats />

        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'stake'
                ? 'bg-amber-500 text-navy-900 scale-105'
                : 'bg-navy-800 text-gray-300 hover:bg-navy-700'
            }`}
          >
            <div className="flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Stake Tokens
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-navy-900 scale-105'
                : 'bg-navy-800 text-gray-300 hover:bg-navy-700'
            }`}
          >
            <div className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Rewards History
            </div>
          </button>
        </div>

        {activeTab === 'stake' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stakingPlans.map((plan, index) => (
              <StakingPlan 
                key={index} 
                {...plan} 
                isWalletConnected={isWalletConnected}
              />
            ))}
          </div>
        ) : (
          <RewardsHistory />
        )}
      </div>
    </div>
  );
}

export default App;