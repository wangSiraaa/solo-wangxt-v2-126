export type Tag = 'polar' | 'ra-zero' | 'horizon' | 'reference';

export interface Star {
  id: string;
  name: string;      // 中文名
  nameEn: string;    // 西名
  raHours: number;   // J2000 赤经，小时
  decDeg: number;    // J2000 赤纬，度
  mag: number;
  tags: Tag[];
}

export interface StarWithAlt extends Star {
  alt: number; // 地平高度，度（当前观测者/时刻）
  az: number;  // 方位角，度（北为 0，向东）
}

export interface ObserverState {
  lat: number;        // 地理纬度，度（北正）
  lon: number;        // 地理经度，度（东正）
  elevationM: number; // 海拔，米
  timeISO: string;    // UTC 时刻，ISO 8601
}

export interface ViewState {
  preset: string;
  centerRaDeg: number;
  centerDecDeg: number;
  radiusDeg: number;
  magLimit: number;
  horizonClip: boolean;
}

export interface Annotation {
  id: string;
  starId: string;
  starName: string;
  text: string;
  createdAtUTC: string;
}

export interface SavedView {
  id: string;
  name: string;
  savedAtUTC: string;
  view: ViewState;
  observer: ObserverState;
}

export interface Asterism {
  name: string;
  edges: [string, string][]; // star id 对
}
