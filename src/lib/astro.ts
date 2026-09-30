/**
 * 天文坐标转换：仅使用 astronomy-engine 明确支持的转换
 * （J2000 赤道坐标 → 观测者视地平坐标，含大气折射修正）。
 * 不自行实现岁差/章动/恒星时推算。
 */
import { MakeTime, Observer, Horizon } from 'astronomy-engine';
import type { ObserverState } from '../types';

export interface AltAz {
  alt: number;
  az: number;
}

/**
 * 恒星 J2000 赤经/赤纬 → 视地平坐标（高度/方位）。
 * @param raHours 赤经（小时，J2000）
 * @param decDeg  赤纬（度，J2000）
 * @param obs     观测位置与 UTC 时刻
 */
export function starAltAz(raHours: number, decDeg: number, obs: ObserverState): AltAz {
  const time = MakeTime(new Date(obs.timeISO));
  const observer = new Observer(obs.lat, obs.lon, obs.elevationM);
  // refraction 'normal'：接近地平线的目标给出视高度（天文科普惯例）
  const h = Horizon(time, observer, raHours, decDeg, 'normal');
  return { alt: h.altitude, az: h.azimuth };
}
