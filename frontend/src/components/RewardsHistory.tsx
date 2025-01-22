import React from 'react';
import { Calendar, ArrowUpRight } from 'lucide-react';

const RewardsHistory = () => {
  const mockHistory = [
    {
      date: '2024-03-15',
      amount: '30 AKZ',
      plan: 'Bronze Plan',
      status: 'Claimed',
      txHash: '0x1234...5678'
    },
    {
      date: '2024-03-01',
      amount: '25 AKZ',
      plan: 'Bronze Plan',
      status: 'Claimed',
      txHash: '0x8765...4321'
    }
  ];

  return (
    <div className="bg-navy-800/50 backdrop-blur-sm rounded-xl border border-navy-700/50 overflow-hidden">
      <div className="p-6 border-b border-navy-700">
        <h2 className="text-xl font-bold text-white">Rewards History</h2>
      </div>
      <div className="p-6">
        {mockHistory.length > 0 ? (
          <div className="space-y-4">
            {mockHistory.map((reward, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-navy-700/30 rounded-lg hover:bg-navy-700/50 transition-all"
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-amber-400 mr-3" />
                  <div>
                    <p className="text-white font-medium">{reward.amount}</p>
                    <p className="text-sm text-gray-400">{reward.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300">{reward.plan}</p>
                  <a
                    href={`https://etherscan.io/tx/${reward.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 flex items-center"
                  >
                    View Transaction
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No rewards history available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsHistory;