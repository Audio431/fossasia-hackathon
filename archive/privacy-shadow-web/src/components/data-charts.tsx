'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';

interface DataChartsProps {
  dataCategories: {
    location: number;
    identity: number;
    contacts: number;
    browsing: number;
    media: number;
  };
  shadowSize: number;
  history: Array<{
    id: string;
    timestamp: Date;
    type: 'add' | 'remove';
    category: string;
    amount: number;
    source: string;
  }>;
}

const COLORS = {
  location: '#EF4444',
  identity: '#8B5CF6',
  contacts: '#EC4899',
  browsing: '#F59E0B',
  media: '#10B981'
};

export function DataCharts({ dataCategories, shadowSize, history }: DataChartsProps) {
  // Prepare pie chart data
  const pieData = [
    { name: 'Location', value: dataCategories.location, color: COLORS.location },
    { name: 'Identity', value: dataCategories.identity, color: COLORS.identity },
    { name: 'Contacts', value: dataCategories.contacts, color: COLORS.contacts },
    { name: 'Browsing', value: dataCategories.browsing, color: COLORS.browsing },
    { name: 'Media', value: dataCategories.media, color: COLORS.media }
  ].filter(item => item.value > 0);

  // Prepare bar chart data
  const barData = Object.entries(dataCategories).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value),
    color: COLORS[name as keyof typeof COLORS]
  }));

  // Prepare timeline data (last 10 events)
  const timelineData = history.slice(-10).map((event, index) => ({
    event: `Event ${index + 1}`,
    amount: event.type === 'add' ? event.amount : -event.amount,
    type: event.type,
    category: event.category
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-slate-300 text-sm">Value: {data.value}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-slate-300 text-sm">Exposure: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PieChartIcon className="text-purple-400" />
            Data Visualization
          </h2>
          <p className="text-slate-400 text-sm mt-1">Visual breakdown of your digital footprint</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-400">{shadowSize.toFixed(0)}%</div>
          <div className="text-xs text-slate-400">Total Exposure</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - Data Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Data Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data yet</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bar Chart - Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Exposure by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#374151"
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#374151"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Timeline Chart - Data History */}
      {timelineData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 rounded-xl p-6 border border-slate-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Data Timeline (Last 10 Events)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="event"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                stroke="#374151"
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                stroke="#374151"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                        <p className="text-white text-sm font-medium">{data.category}</p>
                        <p className={`text-sm ${data.type === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                          {data.type === 'add' ? '+' : ''}{data.amount}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                animationBegin={0}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-4 border border-red-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-300">Location</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{dataCategories.location.toFixed(0)}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-4 border border-purple-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-slate-300">Identity</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{dataCategories.identity.toFixed(0)}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-pink-900/30 to-pink-800/20 rounded-lg p-4 border border-pink-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-xs text-slate-300">Contacts</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">{dataCategories.contacts.toFixed(0)}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-4 border border-orange-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-slate-300">Browsing</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{dataCategories.browsing.toFixed(0)}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-4 border border-blue-700/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-300">Media</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{dataCategories.media.toFixed(0)}%</div>
        </motion.div>
      </div>
    </div>
  );
}
