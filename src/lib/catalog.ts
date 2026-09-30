import type { Star, Asterism } from '../types';

/**
 * 样例星表（J2000.0 赤道坐标）。
 * 覆盖三类交付样例：
 *  - polar   极区目标（北天极小熊座、南天极 σ Oct）
 *  - ra-zero 跨零赤经目标（飞马座大四边形，Scheat→Alpheratz 边跨越 RA 0h）
 *  - horizon 地平线附近目标（南天亮星，北半球中纬度低高度）
 *  - reference 其余亮星，充实天球显示
 */
export const CATALOG: Star[] = [
  // ── 北天极区 ─────────────────────────────────────────────
  { id: 'polaris',  name: '勾陈一',   nameEn: 'Polaris (α UMi)',  raHours: 2.5303,  decDeg:  89.264, mag: 1.98, tags: ['polar'] },
  { id: 'kochab',   name: '北极二',   nameEn: 'Kochab (β UMi)',   raHours: 14.8451, decDeg:  74.156, mag: 2.08, tags: ['polar'] },
  { id: 'pherkad',  name: '北极一',   nameEn: 'Pherkad (γ UMi)',  raHours: 15.3455, decDeg:  71.834, mag: 3.05, tags: ['polar'] },
  { id: 'yildun',   name: '勾陈二',   nameEn: 'Yildun (δ UMi)',   raHours: 17.5369, decDeg:  86.586, mag: 4.36, tags: ['polar'] },
  { id: 'eps-umi',  name: '勾陈三',   nameEn: 'ε UMi',            raHours: 16.7660, decDeg:  82.037, mag: 4.23, tags: ['polar'] },
  { id: 'zet-umi',  name: '勾陈四',   nameEn: 'ζ UMi',            raHours: 15.7343, decDeg:  77.794, mag: 4.32, tags: ['polar'] },
  { id: 'eta-umi',  name: '勾陈增九', nameEn: 'η UMi',            raHours: 16.2917, decDeg:  75.755, mag: 4.95, tags: ['polar'] },
  // ── 南天极区 ─────────────────────────────────────────────
  { id: 'sig-oct',  name: '南极星',   nameEn: 'σ Octantis',       raHours: 21.1464, decDeg: -88.957, mag: 5.47, tags: ['polar'] },
  { id: 'bet-hyi',  name: '蛇尾一',   nameEn: 'β Hyi',            raHours: 0.4290,  decDeg: -77.254, mag: 2.80, tags: ['polar'] },
  // ── 跨零赤经：飞马座大四边形 ─────────────────────────────
  { id: 'alpheratz', name: '壁宿二',  nameEn: 'Alpheratz (α And)', raHours: 0.1398,  decDeg:  29.091, mag: 2.06, tags: ['ra-zero'] },
  { id: 'algenib',   name: '壁宿一',  nameEn: 'Algenib (γ Peg)',   raHours: 0.2206,  decDeg:  15.184, mag: 2.84, tags: ['ra-zero'] },
  { id: 'markab',    name: '室宿一',  nameEn: 'Markab (α Peg)',    raHours: 23.0793, decDeg:  15.205, mag: 2.49, tags: ['ra-zero'] },
  { id: 'scheat',    name: '室宿二',  nameEn: 'Scheat (β Peg)',    raHours: 23.0629, decDeg:  28.083, mag: 2.42, tags: ['ra-zero'] },
  // ── 地平线附近（北半球中纬度低高度南天亮星）─────────────
  { id: 'canopus',  name: '老人星',   nameEn: 'Canopus (α Car)',  raHours: 6.3992,  decDeg: -52.696, mag: -0.74, tags: ['horizon'] },
  { id: 'achernar', name: '水委一',   nameEn: 'Achernar (α Eri)', raHours: 1.6286,  decDeg: -57.237, mag: 0.46, tags: ['horizon'] },
  { id: 'fomalhaut', name: '北落师门', nameEn: 'Fomalhaut (α PsA)', raHours: 22.9608, decDeg: -29.622, mag: 1.16, tags: ['horizon'] },
  { id: 'sirius',   name: '天狼星',   nameEn: 'Sirius (α CMa)',   raHours: 6.7525,  decDeg: -16.716, mag: -1.46, tags: ['horizon'] },
  { id: 'mirzam',   name: '军市一',   nameEn: 'Mirzam (β CMa)',   raHours: 6.3783,  decDeg: -17.956, mag: 1.98, tags: ['horizon'] },
  { id: 'adhara',   name: '弧矢七',   nameEn: 'Adhara (ε CMa)',   raHours: 6.9771,  decDeg: -28.972, mag: 1.50, tags: ['horizon'] },
  { id: 'wezen',    name: '弧矢一',   nameEn: 'Wezen (δ CMa)',    raHours: 7.1399,  decDeg: -26.393, mag: 1.84, tags: ['horizon'] },
  { id: 'aludra',   name: '弧矢二',   nameEn: 'Aludra (η CMa)',   raHours: 7.4016,  decDeg: -29.303, mag: 2.45, tags: ['horizon'] },
  // ── 参考亮星 ─────────────────────────────────────────────
  { id: 'betelgeuse', name: '参宿四', nameEn: 'Betelgeuse (α Ori)', raHours: 5.9195, decDeg:   7.407, mag: 0.42, tags: ['reference'] },
  { id: 'rigel',      name: '参宿七', nameEn: 'Rigel (β Ori)',      raHours: 5.2423, decDeg:  -8.202, mag: 0.13, tags: ['reference'] },
  { id: 'bellatrix',  name: '参宿五', nameEn: 'Bellatrix (γ Ori)',  raHours: 5.4189, decDeg:   6.350, mag: 1.64, tags: ['reference'] },
  { id: 'alnilam',    name: '参宿二', nameEn: 'Alnilam (ε Ori)',    raHours: 5.6036, decDeg:  -1.202, mag: 1.69, tags: ['reference'] },
  { id: 'alnitak',    name: '参宿一', nameEn: 'Alnitak (ζ Ori)',    raHours: 5.6793, decDeg:  -1.943, mag: 1.77, tags: ['reference'] },
  { id: 'mintaka',    name: '参宿三', nameEn: 'Mintaka (δ Ori)',    raHours: 5.5334, decDeg:  -0.299, mag: 2.23, tags: ['reference'] },
  { id: 'saiph',      name: '参宿六', nameEn: 'Saiph (κ Ori)',      raHours: 5.7959, decDeg:  -9.670, mag: 2.09, tags: ['reference'] },
  { id: 'procyon',    name: '南河三', nameEn: 'Procyon (α CMi)',    raHours: 7.6550, decDeg:   5.225, mag: 0.34, tags: ['reference'] },
  { id: 'aldebaran',  name: '毕宿五', nameEn: 'Aldebaran (α Tau)',  raHours: 4.5987, decDeg:  16.509, mag: 0.86, tags: ['reference'] },
  { id: 'capella',    name: '五车二', nameEn: 'Capella (α Aur)',    raHours: 5.2782, decDeg:  45.998, mag: 0.08, tags: ['reference'] },
  { id: 'vega',       name: '织女一', nameEn: 'Vega (α Lyr)',       raHours: 18.6156, decDeg: 38.784, mag: 0.03, tags: ['reference'] },
  { id: 'altair',     name: '河鼓二', nameEn: 'Altair (α Aql)',     raHours: 19.8464, decDeg:   8.868, mag: 0.76, tags: ['reference'] },
  { id: 'deneb',      name: '天津四', nameEn: 'Deneb (α Cyg)',      raHours: 20.6905, decDeg:  45.280, mag: 1.25, tags: ['reference'] },
  { id: 'antares',    name: '心宿二', nameEn: 'Antares (α Sco)',    raHours: 16.4901, decDeg: -26.432, mag: 0.96, tags: ['reference'] },
  { id: 'spica',      name: '角宿一', nameEn: 'Spica (α Vir)',      raHours: 13.4199, decDeg: -11.161, mag: 0.97, tags: ['reference'] },
  { id: 'arcturus',   name: '大角星', nameEn: 'Arcturus (α Boo)',   raHours: 14.2610, decDeg:  19.182, mag: -0.05, tags: ['reference'] },
  { id: 'regulus',    name: '轩辕十四', nameEn: 'Regulus (α Leo)',  raHours: 10.1395, decDeg:  11.967, mag: 1.35, tags: ['reference'] },
  { id: 'castor',     name: '北河二', nameEn: 'Castor (α Gem)',     raHours: 7.5766, decDeg:   31.888, mag: 1.57, tags: ['reference'] },
  { id: 'pollux',     name: '北河三', nameEn: 'Pollux (β Gem)',     raHours: 7.7553, decDeg:   28.026, mag: 1.14, tags: ['reference'] },
  { id: 'alhena',     name: '井宿三', nameEn: 'Alhena (γ Gem)',     raHours: 6.6285, decDeg:   16.399, mag: 1.92, tags: ['reference'] },
];

/** 样例连线：飞马座大四边形（Scheat→Alpheratz 边跨越 RA 0h，必须画成短边） */
export const ASTERISMS: Asterism[] = [
  {
    name: '飞马座大四边形',
    edges: [
      ['scheat', 'alpheratz'],
      ['alpheratz', 'algenib'],
      ['algenib', 'markab'],
      ['markab', 'scheat'],
    ],
  },
  {
    name: '小北斗（极区段）',
    edges: [
      ['polaris', 'yildun'],
      ['yildun', 'eps-umi'],
      ['eps-umi', 'zet-umi'],
      ['zet-umi', 'kochab'],
      ['kochab', 'pherkad'],
      ['pherkad', 'zet-umi'],
    ],
  },
  {
    name: '猎户腰带',
    edges: [
      ['alnitak', 'alnilam'],
      ['alnilam', 'mintaka'],
    ],
  },
];

export const STAR_BY_ID: ReadonlyMap<string, Star> = new Map(CATALOG.map((s) => [s.id, s]));
