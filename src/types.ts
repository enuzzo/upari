import type {EarthStyle} from "./lib/earth-style";
import type { OMMJsonObject } from 'satellite.js';
export type Place = { id: string; name: string; latitude: number; longitude: number; height: number; horizon?:number[] };
export type RenderQuality = 'auto'|'high'|'battery';
export type Preferences = { activePlace: string; places: Place[]; theme: 'night'|'atlas'|'red'; minElevation: number; leadMinutes: number; quietFrom: number; quietUntil: number; maxDaily: number; issEnabled: boolean; renderQuality: RenderQuality; satelliteId?:number };
export type CameraView = { longitude: number; latitude: number; height: number; heading: number; pitch: number; roll: number };
export type SceneState = { layerKey: string; date: string; opacity: number; compare: boolean; compareDate: string; split: number; sunOffset: number; lighting: boolean; camera: CameraView; vectorKey?:"none"|"wind"|"currents";vectorMotion?:boolean;visualStyle?:EarthStyle;visualStrength?:number;rotationEnabled?:boolean;rotationSpeed?:number };
export type SaverConfig = { version: 1; scene: SceneState; place: Place; showClock: boolean; showWeather: boolean; rotationSpeed: number };
export type OrbitData = { omm: OMMJsonObject; epoch: string; fetched: string; source: string };
export type SkyPoint = { time: number; azimuth: number; elevation: number; latitude: number; longitude: number; altitude: number; sunElevation: number; sunlit: boolean };
export type Pass = { id: string; start: number; end: number; peak: number; maxElevation: number; startAzimuth: number; endAzimuth: number; points: SkyPoint[];satellite?:string };
export type Forecast = { passes: Pass[]; calculatedAt: number; expires: number; epoch: string; minElevation: number; place: Place; current: SkyPoint|null; satellite?:string;satelliteId:number };
export type Layer = { key: string; name: string; subtitle: string; id: string; matrix: string; maxLevel: number; format: string; date: string; earliest: string; period: string; resolution: string; unit: string; explanation: string; legend?: string; static?: boolean; ranges?: string[]; regional?:boolean; source?:string; template?:string; coverage?:[number,number,number,number]; catalogAt?:string; dataLabel?:string;sourceURL?:string };
export type NotificationSettings = { server: string; topic: string; token: string; bridge: string; bridgeToken: string };
export type QueueItem = { id: string; at: number; passId: string; message: string; channel: string; expires: number; supportsUpdates?: boolean; serverId?: string };

export type DiaryEntry={id:string;recordedAt:number;passStart:number;passEnd:number;satellite:string;placeName:string;latitude:number;longitude:number;epoch:string;maxElevation:number;outcome:"seen"|"not-seen"|"cloudy";notes:string};
