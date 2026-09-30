/**
 * 导出：JSON 文件，明确注明坐标系与时间基准。
 */
import type { Annotation, ObserverState, StarWithAlt, ViewState } from '../types';
import { fmtDec, fmtRa } from './coords';

export interface ExportPayload {
  meta: {
    tool: string;
    generatedAtUTC: string;
    timeStandard: string;
    coordinateSystems: {
      equatorial: string;
      horizontal: string;
    };
    angularDistances: string;
  };
  observer: ObserverState;
  field: ViewState & { centerRaHms: string; centerDecDms: string };
  filters: { magLimit: number; horizonClip: boolean; note: string };
  stars: Array<{
    id: string;
    name: string;
    nameEn: string;
    raHoursJ2000: number;
    raHms: string;
    decDegJ2000: number;
    decDms: string;
    mag: number;
    altDegApparent: number;
    azDegApparent: number;
  }>;
  annotations: Annotation[];
}

export function buildExport(
  stars: StarWithAlt[],
  view: ViewState,
  observer: ObserverState,
  annotations: Annotation[],
): ExportPayload {
  return {
    meta: {
      tool: 'local-star-atlas（本地星图 · 投影对比工具）',
      generatedAtUTC: new Date().toISOString(),
      timeStandard: 'UTC（ISO 8601）；观测时刻输入按 UTC 解释',
      coordinateSystems: {
        equatorial: 'J2000.0 赤道坐标系（ICRS 方向）：赤经 RA（小时/度）、赤纬 Dec（度）',
        horizontal:
          '视地平坐标系（topocentric apparent alt/az）：由 astronomy-engine Horizon() 计算，含正常大气折射修正；方位角北为 0°、向东增加',
      },
      angularDistances: '所有角距均为球面角距（大圆），非任何投影图上的像素距离',
    },
    observer,
    field: {
      ...view,
      centerRaHms: fmtRa(view.centerRaDeg),
      centerDecDms: fmtDec(view.centerDecDeg),
    },
    filters: {
      magLimit: view.magLimit,
      horizonClip: view.horizonClip,
      note: '星等筛选与地平线裁切相互独立，以下为两者共同作用后的星表',
    },
    stars: stars.map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: s.nameEn,
      raHoursJ2000: s.raHours,
      raHms: fmtRa(s.raHours * 15),
      decDegJ2000: s.decDeg,
      decDms: fmtDec(s.decDeg),
      mag: s.mag,
      altDegApparent: Math.round(s.alt * 1000) / 1000,
      azDegApparent: Math.round(s.az * 1000) / 1000,
    })),
    annotations,
  };
}

export function downloadJson(payload: ExportPayload): void {
  const stamp = payload.meta.generatedAtUTC.replace(/[:.]/g, '-').slice(0, 19) + 'Z';
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `star-atlas-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
