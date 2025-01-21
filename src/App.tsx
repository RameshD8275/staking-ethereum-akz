import React, { useState } from 'react';
import { Coins, Clock, Percent, Wallet, History, Award, Sparkles, TrendingUp, ChevronDown, Shield, Target } from 'lucide-react';
import StakingPlan from './components/StakingPlan';
import ConnectWallet from './components/ConnectWallet';
import StakingStats from './components/StakingStats';
import RewardsHistory from './components/RewardsHistory';

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('stake');

  const stakingPlans = [
    {
      name: 'Quick Rewards Plan',
      range: '10 AKZ - 100 AKZ',
      bonus: '1%',
      period: '15 minutes',
      duration: '30 minutes',
      totalBonus: '48%',
      theme: 'from-green-500 to-emerald-600',
      minStake: 10,
      maxStake: 100,
      schemeId: 4,
      icon: <Clock className="w-6 h-6" />
    },
    {
      name: 'Bronze Staking Plan',
      range: '20 AKZ - 1000 AKZ',
      bonus: '3%',
      period: 'Bi-Weekly (15 days)',
      duration: '180 days',
      totalBonus: '36%',
      theme: 'from-amber-600 to-amber-800',
      minStake: 20,
      maxStake: 1000,
      schemeId: 1,
      icon: <Shield className="w-6 h-6" />
    },
    {
      name: 'Silver Staking Plan',
      range: '1001 AKZ - 2000 AKZ',
      bonus: '8%',
      period: 'Monthly (30 days)',
      duration: '270 days',
      totalBonus: '72%',
      theme: 'from-blue-600 to-blue-800',
      minStake: 1001,
      maxStake: 2000,
      schemeId: 2,
      icon: <Target className="w-6 h-6" />
    },
    {
      name: 'Gold Staking Plan',
      range: '2001 AKZ - 5000 AKZ',
      bonus: '30%',
      period: 'Quarterly',
      duration: '365 days',
      totalBonus: '120%',
      theme: 'from-amber-500 to-yellow-600',
      minStake: 2001,
      maxStake: 5000,
      schemeId: 3,
      icon: <Sparkles className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900">
      {/* Animated Background Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/5 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmNTllMGIiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      </div>

      <div className="fixed top-0 right-0 p-4 z-50">
        <ConnectWallet 
          isConnected={isWalletConnected} 
          onConnect={() => setIsWalletConnected(true)}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Award className="w-16 h-16 text-amber-400 animate-float" />
              <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-xl"></div>
            </div>
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 ml-4">
              AKZ Token Staking
            </h1>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Stake your AKZ tokens and earn rewards through our flexible staking programs.
            Choose from multiple plans with different durations and rewards.
          </p>
          <div className="flex justify-center mt-8 space-x-6">
            <div className="flex items-center text-amber-400">
              <Shield className="w-5 h-5 mr-2" />
              <span>Secure Staking</span>
            </div>
            <div className="flex items-center text-amber-400">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span>High APY</span>
            </div>
            <div className="flex items-center text-amber-400">
              <Clock className="w-5 h-5 mr-2" />
              <span>Flexible Duration</span>
            </div>
          </div>
        </header>

        <StakingStats />

        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setActiveTab('stake')}
            className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'stake'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-navy-900 scale-105 shadow-lg shadow-amber-500/20'
                : 'bg-navy-800 text-gray-300 hover:bg-navy-700 hover:shadow-lg hover:shadow-amber-500/10'
            }`}
          >
            <div className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Stake Tokens
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-navy-900 scale-105 shadow-lg shadow-amber-500/20'
                : 'bg-navy-800 text-gray-300 hover:bg-navy-700 hover:shadow-lg hover:shadow-amber-500/10'
            }`}
          >
            <div className="flex items-center">
              <History className="w-5 h-5 mr-2" />
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

        <div className="mt-16 text-center">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-amber-400 hover:text-amber-300 transition-colors duration-200"
          >
            <ChevronDown className="w-8 h-8 mx-auto rotate-180 animate-bounce" />
            <span className="sr-only">Scroll to top</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;