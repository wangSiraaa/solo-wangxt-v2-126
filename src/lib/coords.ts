/**
 * 球面坐标基础工具。
 * 原则：角距离一律在球面上计算（haversine / atan2 稳定形式），
 * 绝不使用任何投影平面上的像素距离冒充角距。
 */

export const DEG = Math.PI / 180;

/** 归一化到 [0, 360) */
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** 归一化到 (-180, 180]，用于跨零赤经的最短差值 */
export function signedDeltaDeg(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** 赤经（度）→ 地图经度 [-180, 180)，供 d3.geo 使用 */
export function raToLon(raDeg: number): number {
  const n = norm360(raDeg);
  return n > 180 ? n - 360 : n;
}

/**
 * 两点球面角距（度）。使用 atan2 形式，近距离与近距离极点均稳定。
 * 输入为赤经/赤纬（度），赤经差自动取最短路径（跨 0h 安全）。
 */
export function angDistDeg(
  ra1Deg: number,
  dec1Deg: number,
  ra2Deg: number,
  dec2Deg: number,
): number {
  const d1 = dec1Deg * DEG;
  const d2 = dec2Deg * DEG;
  const da = signedDeltaDeg(ra2Deg - ra1Deg) * DEG;
  const y = Math.sqrt(
    Math.pow(Math.cos(d2) * Math.sin(da), 2) +
      Math.pow(
        Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(da),
        2,
      ),
  );
  const x = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(da);
  return Math.atan2(y, x) / DEG;
}

/** 区域中心 (cRa, cDec) 半径 r 内是否包含点 (ra, dec)，跨零安全 */
export function withinRegion(
  raDeg: number,
  decDeg: number,
  cRaDeg: number,
  cDecDeg: number,
  rDeg: number,
): boolean {
  return angDistDeg(raDeg, decDeg, cRaDeg, cDecDeg) <= rDeg;
}

/** 赤经（度）格式化为 h m s */
export function fmtRa(raDeg: number): string {
  const totalHours = norm360(raDeg) / 15;
  const h = Math.floor(totalHours);
  const mFloat = (totalHours - h) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${s.toFixed(1).padStart(4, '0')}s`;
}

/** 赤纬（度）格式化为 ° ′ ″ */
export function fmtDec(decDeg: number): string {
  const sign = decDeg < 0 ? '−' : '+';
  const a = Math.abs(decDeg);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${sign}${d}° ${String(m).padStart(2, '0')}′ ${s.toFixed(0).padStart(2, '0')}″`;
}

/** 星等 → 投影图上的符号半径（仅视觉编码，不代表任何角量） */
export function magRadius(mag: number): number {
  return Math.min(7, Math.max(1.3, 5.6 - 1.05 * mag));
}
