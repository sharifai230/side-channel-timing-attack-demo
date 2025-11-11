
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimingDataPoint } from '../types';

interface AttackVisualizerProps {
  data: TimingDataPoint[];
  loading: boolean;
  maxTimeByte: string | null;
}

const AttackVisualizer: React.FC<AttackVisualizerProps> = ({ data, loading, maxTimeByte }) => {
  return (
    <div className="h-96 w-full p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Response Time Analysis (Current Byte)</h2>
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Waiting for attack to start...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="byte" tick={{ fill: '#A0AEC0' }} tickFormatter={(value) => `0x${value}`} />
            <YAxis tick={{ fill: '#A0AEC0' }} label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
              labelStyle={{ color: '#E2E8F0' }}
              formatter={(value: number, name: string, props) => [`${value.toFixed(2)} ms`, `Byte: 0x${props.payload.byte}`]}
            />
            <Bar dataKey="time">
              {data.map((entry) => (
                <Cell key={`cell-${entry.byte}`} fill={entry.byte === maxTimeByte ? '#F56565' : '#2DD4BF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AttackVisualizer;
