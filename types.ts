
export type AttackState = 'idle' | 'running' | 'complete' | 'error';

export interface TimingDataPoint {
  byte: string;
  time: number;
}
