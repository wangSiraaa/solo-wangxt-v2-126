import { describe, it, expect } from 'vitest';
import { angDistDeg, norm360, signedDeltaDeg, raToLon, withinRegion } from './coords';
import { CATALOG, STAR_BY_ID } from './catalog';

describe('坐标归一化', () => {
  it('norm360 处理负值与超界', () => {
    expect(norm360(-10)).toBeCloseTo(350);
    expect(norm360(370)).toBeCloseTo(10);
    expect(norm360(0)).toBe(0);
  });

  it('signedDeltaDeg 取最短路径（跨零安全）', () => {
    expect(signedDeltaDeg(1)).toBeCloseTo(1);
    expect(signedDeltaDeg(359)).toBeCloseTo(-1);
    expect(signedDeltaDeg(-359)).toBeCloseTo(1);
    expect(signedDeltaDeg(180)).toBeCloseTo(-180);
  });

  it('raToLon 映射到 [-180, 180)', () => {
    expect(raToLon(0)).toBe(0);
    expect(raToLon(90)).toBe(90);
    expect(raToLon(270)).toBe(-90);
    expect(raToLon(359.9)).toBeCloseTo(-0.1);
  });
});

describe('球面角距', () => {
  it('极点到天赤道为 90°', () => {
    expect(angDistDeg(0, 90, 123, 0)).toBeCloseTo(90, 10);
    expect(angDistDeg(0, -90, 45, 0)).toBeCloseTo(90, 10);
  });

  it('同一点为 0', () => {
    expect(angDistDeg(200, 33, 200, 33)).toBeCloseTo(0, 12);
  });

  it('赤道上赤经差即角距（跨零取短边）', () => {
    expect(angDistDeg(359, 0, 1, 0)).toBeCloseTo(2, 10);
    expect(angDistDeg(1, 0, 359, 0)).toBeCloseTo(2, 10);
  });

  it('飞马方框跨零边 Scheat→Alpheratz 是约 16° 的短边，而非横贯全图', () => {
    const scheat = STAR_BY_ID.get('scheat')!;
    const alpheratz = STAR_BY_ID.get('alpheratz')!;
    const d = angDistDeg(
      scheat.raHours * 15,
      scheat.decDeg,
      alpheratz.raHours * 15,
      alpheratz.decDeg,
    );
    expect(d).toBeGreaterThan(14);
    expect(d).toBeLessThan(18);
  });
});

describe('视场包含判定（跨零安全）', () => {
  it('中心在 RA 354.6° 的视场同时容纳 23h 与 0h 的目标', () => {
    const scheat = STAR_BY_ID.get('scheat')!;
    const algenib = STAR_BY_ID.get('algenib')!;
    expect(withinRegion(scheat.raHours * 15, scheat.decDeg, 354.6, 22, 13)).toBe(true);
    expect(withinRegion(algenib.raHours * 15, algenib.decDeg, 354.6, 22, 13)).toBe(true);
  });

  it('远离区域的目标被排除', () => {
    const sirius = STAR_BY_ID.get('sirius')!;
    expect(withinRegion(sirius.raHours * 15, sirius.decDeg, 354.6, 22, 13)).toBe(false);
  });
});

describe('样例星表完整性', () => {
  it('包含极区、跨零赤经、地平线附近三类样例', () => {
    const tags = new Set(CATALOG.flatMap((s) => s.tags));
    expect(tags.has('polar')).toBe(true);
    expect(tags.has('ra-zero')).toBe(true);
    expect(tags.has('horizon')).toBe(true);
  });

  it('跨零样例确实分布在 RA 0h 两侧', () => {
    const raZero = CATALOG.filter((s) => s.tags.includes('ra-zero'));
    const ras = raZero.map((s) => s.raHours);
    expect(Math.min(...ras)).toBeLessThan(1); // 0h 附近
    expect(Math.max(...ras)).toBeGreaterThan(23); // 24h 附近
  });
});
