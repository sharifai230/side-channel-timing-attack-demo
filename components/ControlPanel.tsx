
import React from 'react';

interface ControlPanelProps {
  fileContent: string;
  setFileContent: (value: string) => void;
  secretKey: string;
  delay: number;
  setDelay: (value: number) => void;
  samples: number;
  setSamples: (value: number) => void;
  onStart: () => void;
  onReset: () => void;
  isAttacking: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  fileContent,
  setFileContent,
  secretKey,
  delay,
  setDelay,
  samples,
  setSamples,
  onStart,
  onReset,
  isAttacking,
}) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-lg">
      <div>
        <h2 className="text-xl font-bold text-cyan-400 mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="file-content" className="block text-sm font-medium text-gray-300 mb-1">
              File Content (Message)
            </label>
            <textarea
              id="file-content"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              disabled={isAttacking}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Secret Key (HMAC Key)
            </label>
            <div className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-400 font-mono">
              {secretKey}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-cyan-400 mb-4">Attack Parameters</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="delay" className="block text-sm font-medium text-gray-300 mb-1">
              Delay per Correct Byte: <span className="font-bold text-cyan-300">{delay}ms</span>
            </label>
            <input
              id="delay"
              type="range"
              min="5"
              max="100"
              step="5"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              disabled={isAttacking}
            />
          </div>
          <div>
            <label htmlFor="samples" className="block text-sm font-medium text-gray-300 mb-1">
              Samples per Byte: <span className="font-bold text-cyan-300">{samples}</span>
            </label>
            <input
              id="samples"
              type="range"
              min="1"
              max="20"
              step="1"
              value={samples}
              onChange={(e) => setSamples(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              disabled={isAttacking}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={onStart}
          disabled={isAttacking}
          className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isAttacking ? 'Attacking...' : 'Start Attack'}
        </button>
        <button
          onClick={onReset}
          disabled={isAttacking}
          className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
