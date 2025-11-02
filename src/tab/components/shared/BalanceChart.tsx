import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType, BalanceHistory, BalanceHistoryPeriod } from '../../../shared/types';

interface BalanceChartProps {
  accountIndex: number;
  currentBalance: number;
  btcPrice: number | null;
}

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  date: string;
  btc: number;
}

const PERIOD_OPTIONS: { value: BalanceHistoryPeriod; label: string }[] = [
  { value: '7D', label: '7D' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

export const BalanceChart: React.FC<BalanceChartProps> = ({
  accountIndex,
  currentBalance,
  btcPrice,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const [period, setPeriod] = useState<BalanceHistoryPeriod>('7D');
  const [history, setHistory] = useState<BalanceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance history when period or account changes
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage<BalanceHistory>(
          MessageType.GET_BALANCE_HISTORY,
          { accountIndex, period }
        );

        setHistory(response);
      } catch (err) {
        console.error('Failed to fetch balance history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [accountIndex, period, sendMessage]);

  // Transform data for Recharts
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!history || history.points.length === 0) {
      return [];
    }

    return history.points.map((point) => ({
      timestamp: point.timestamp,
      balance: point.balance,
      btc: point.balance / 100000000,
      date: formatDate(point.timestamp, period),
    }));
  }, [history, period]);

  // Format BTC value
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(6);
  };

  // Format USD value
  const formatUSD = (satoshis: number): string => {
    if (!btcPrice) return '';
    const usdValue = (satoshis / 100000000) * btcPrice;
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date based on period
  function formatDate(timestamp: number, periodValue: BalanceHistoryPeriod): string {
    const date = new Date(timestamp * 1000);

    if (periodValue === '7D') {
      // Show day and time for 7 days
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      });
    } else if (periodValue === '1M') {
      // Show month and day
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } else {
      // Show month and year for longer periods
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
    }
  }

  // Format full date for tooltip
  const formatDateLong = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0].payload as ChartDataPoint;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-2">{formatDateLong(data.timestamp)}</p>
        <p className="text-sm font-semibold text-white mb-1">
          {formatBTC(data.balance)} BTC
        </p>
        {btcPrice && (
          <p className="text-xs text-gray-400">
            ≈ {formatUSD(data.balance)}
          </p>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Balance History</h3>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className="w-12 h-8 bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Balance History</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400 mb-2">Failed to load chart</p>
          <p className="text-xs text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!history || chartData.length === 0) {
    return (
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Balance History</h3>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  period === opt.value
                    ? 'bg-bitcoin text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-400 mb-2">No transaction history yet</p>
          <p className="text-xs text-gray-600 max-w-md">
            Your balance chart will appear after your first transaction
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary values for display
  const { summary } = history;
  const isPositiveChange = summary.periodChange >= 0;

  return (
    <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 h-full">
      {/* Header with period selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Balance History</h3>

        {/* Time period selector */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === opt.value
                  ? 'bg-bitcoin text-white font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[220px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#404040"
              vertical={false}
              opacity={0.3}
            />

            <XAxis
              dataKey="date"
              stroke="#737373"
              tick={{ fill: '#A3A3A3', fontSize: 12 }}
              tickLine={{ stroke: '#404040' }}
              axisLine={{ stroke: '#404040' }}
            />

            <YAxis
              tickFormatter={(value) => formatBTC(value)}
              stroke="#737373"
              tick={{ fill: '#A3A3A3', fontSize: 12 }}
              tickLine={{ stroke: '#404040' }}
              axisLine={{ stroke: '#404040' }}
              width={80}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#F7931A"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              animationDuration={500}
              activeDot={{ r: 6, fill: '#F7931A', stroke: '#FFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
        {/* Period Change */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Period Change</p>
          <p className={`text-sm font-semibold ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
            {isPositiveChange ? '+' : ''}{formatBTC(summary.periodChange)} BTC
          </p>
          <p className={`text-xs ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveChange ? '+' : ''}{summary.percentChange.toFixed(2)}%
          </p>
        </div>

        {/* Highest */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Highest</p>
          <p className="text-sm font-semibold text-white">
            {formatBTC(summary.highest)} BTC
          </p>
          <p className="text-xs text-gray-600">
            {new Date(summary.highestTimestamp * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Lowest */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Lowest</p>
          <p className="text-sm font-semibold text-white">
            {formatBTC(summary.lowest)} BTC
          </p>
          <p className="text-xs text-gray-600">
            {new Date(summary.lowestTimestamp * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
