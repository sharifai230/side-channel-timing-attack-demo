
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AttackState, TimingDataPoint } from './types';
import { calculateHmac, vulnerableCompare } from './services/hmacService';
import ControlPanel from './components/ControlPanel';
import AttackVisualizer from './components/AttackVisualizer';

const HMAC_LENGTH_BYTES = 20; // SHA-1 HMAC is 20 bytes (40 hex chars)
const INITIAL_SECRET_KEY = 'my-super-secret-key-123';
const INITIAL_FILE_CONTENT = 'This is a test file for the timing attack.';

// Helper to get median from a list of numbers
const getMedian = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const App: React.FC = () => {
    const [secretKey, setSecretKey] = useState<string>(INITIAL_SECRET_KEY);
    const [fileContent, setFileContent] = useState<string>(INITIAL_FILE_CONTENT);
    const [delayPerByte, setDelayPerByte] = useState<number>(25);
    const [samplesPerByte, setSamplesPerByte] = useState<number>(5);

    const [correctSignature, setCorrectSignature] = useState<string>('');
    const [recoveredSignature, setRecoveredSignature] = useState<string>('');
    const [attackState, setAttackState] = useState<AttackState>('idle');
    const [attackProgress, setAttackProgress] = useState({ byte: 0, total: HMAC_LENGTH_BYTES });
    const [timingData, setTimingData] = useState<TimingDataPoint[]>([]);
    const [maxTimeByte, setMaxTimeByte] = useState<string | null>(null);
    const [showCorrectSignature, setShowCorrectSignature] = useState<boolean>(false);
    
    const isAttackingRef = useRef(false);

    const updateHmac = useCallback(async () => {
        const hmac = await calculateHmac(secretKey, fileContent);
        setCorrectSignature(hmac);
    }, [secretKey, fileContent]);

    useEffect(() => {
        updateHmac();
    }, [updateHmac]);

    const resetState = useCallback(() => {
        setAttackState('idle');
        setRecoveredSignature('');
        setTimingData([]);
        setMaxTimeByte(null);
        setAttackProgress({ byte: 0, total: HMAC_LENGTH_BYTES });
        setFileContent(INITIAL_FILE_CONTENT);
        setShowCorrectSignature(false);
    }, []);

    const runAttack = async () => {
        if (isAttackingRef.current) return;
        isAttackingRef.current = true;
        setAttackState('running');
        let knownSignature = '';

        for (let byteIndex = 0; byteIndex < HMAC_LENGTH_BYTES; byteIndex++) {
            setAttackProgress({ byte: byteIndex + 1, total: HMAC_LENGTH_BYTES });
            const byteTimings: { byte: number; medianTime: number }[] = [];
            let currentMaxTime = -1;
            let currentBestByte = -1;

            for (let candidateByte = 0; candidateByte < 256; candidateByte++) {
                if (!isAttackingRef.current) return; // Stop if reset was clicked

                const knownPart = knownSignature;
                const guessPart = candidateByte.toString(16).padStart(2, '0');
                const padding = '00'.repeat(HMAC_LENGTH_BYTES - byteIndex - 1);
                const testSignature = knownPart + guessPart + padding;
                
                const samples: number[] = [];
                for (let i = 0; i < samplesPerByte; i++) {
                    const startTime = performance.now();
                    await vulnerableCompare(correctSignature, testSignature, delayPerByte);
                    const endTime = performance.now();
                    samples.push(endTime - startTime);
                }
                const medianTime = getMedian(samples);
                byteTimings.push({ byte: candidateByte, medianTime });
                
                if (medianTime > currentMaxTime) {
                    currentMaxTime = medianTime;
                    currentBestByte = candidateByte;
                }

                // Update UI in real-time
                setTimingData(byteTimings.map(t => ({
                    byte: t.byte.toString(16).padStart(2, '0'),
                    time: t.medianTime,
                })));
                if(currentBestByte !== -1) {
                    setMaxTimeByte(currentBestByte.toString(16).padStart(2, '0'));
                }
            }

            const foundByteHex = currentBestByte.toString(16).padStart(2, '0');
            knownSignature += foundByteHex;
            setRecoveredSignature(knownSignature);
        }

        setAttackState('complete');
        isAttackingRef.current = false;
    };

    const handleStart = () => {
        resetState();
        // Use a timeout to allow state to reset before starting attack
        setTimeout(() => runAttack(), 100);
    };

    const handleReset = () => {
        isAttackingRef.current = false;
        resetState();
    };

    const isCompleteAndMatching = attackState === 'complete' && recoveredSignature === correctSignature;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-cyan-400">Side-Channel Timing Attack Demo</h1>
                    <p className="text-lg text-gray-400 mt-2">Visualizing HMAC signature recovery through response time analysis.</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                         <ControlPanel
                            fileContent={fileContent}
                            setFileContent={setFileContent}
                            secretKey={secretKey}
                            delay={delayPerByte}
                            setDelay={setDelayPerByte}
                            samples={samplesPerByte}
                            setSamples={setSamplesPerByte}
                            onStart={handleStart}
                            onReset={handleReset}
                            isAttacking={attackState === 'running'}
                        />
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <AttackVisualizer data={timingData} loading={attackState === 'idle'} maxTimeByte={maxTimeByte} />
                        
                        <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-cyan-400 mb-4">Attack Progress & Results</h2>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-300">Status: 
                                    <span className={`font-bold ml-2 ${
                                        attackState === 'idle' ? 'text-gray-400' : 
                                        attackState === 'running' ? 'text-yellow-400' :
                                        attackState === 'complete' ? 'text-green-400' : 'text-red-500'
                                    }`}>
                                        {attackState.toUpperCase()}
                                    </span>
                                </span>
                                {attackState === 'running' && (
                                    <span className="text-gray-400">
                                        Testing byte <span className="font-bold text-cyan-300">{attackProgress.byte}</span> of {attackProgress.total}
                                    </span>
                                )}
                            </div>
                            {attackState === 'running' && (
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                                    <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${(attackProgress.byte / attackProgress.total) * 100}%` }}></div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center">
                                     <p className="text-sm font-medium text-gray-300 w-40">Correct Signature:</p>
                                     <div className="flex-1 font-mono text-sm bg-gray-900 p-2 rounded-md break-all">
                                        {showCorrectSignature ? correctSignature : '∗'.repeat(HMAC_LENGTH_BYTES * 2)}
                                     </div>
                                     <button onClick={() => setShowCorrectSignature(!showCorrectSignature)} className="ml-2 p-1 text-gray-400 hover:text-white">
                                        {showCorrectSignature ? 'Hide' : 'Show'}
                                     </button>
                                </div>
                                <div className="flex items-center">
                                     <p className="text-sm font-medium text-gray-300 w-40">Recovered Signature:</p>
                                     <p className={`flex-1 font-mono text-sm p-2 rounded-md break-all ${
                                        attackState === 'idle' ? 'bg-gray-900 text-gray-500' : 
                                        isCompleteAndMatching ? 'bg-green-900/50 text-green-300' :
                                        attackState === 'complete' ? 'bg-red-900/50 text-red-300' : 'bg-gray-700 text-yellow-300'
                                     }`}>
                                        {recoveredSignature || '...'}
                                    </p>
                                </div>
                            </div>
                            
                            {attackState === 'complete' && (
                                <div className={`mt-4 p-3 rounded-md text-center font-bold ${isCompleteAndMatching ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {isCompleteAndMatching ? 'Attack Successful! Signature recovered.' : 'Attack Failed! Signature mismatch.'}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
