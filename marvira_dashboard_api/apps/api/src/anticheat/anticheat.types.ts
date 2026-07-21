import { AnticheatCode } from './anticheat.constants';

export interface LocationInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface AnticheatContext {
  placeId: string;
  eventId: string;
  placeIndex: number;
  previousPlace?: {
    id: string;
    latitude: number;
    longitude: number;
    unlockedAt: Date;
  } | null;
}

export interface LocationWarning {
  code: AnticheatCode;
  message: string;
}

export type SuspendDuration = '1d' | '2d' | '1w' | '1m';
