/**
 * D3 geo 投影视图：同一视场在 立体投影 / 等距方位投影 下的对比。
 * 关键正确性处理：
 * - 投影始终旋转到视场中心，RA 0h 反子午线切口被移到区域背面，
 *   跨零赤经的目标（如飞马座大四边形）不会被画成横贯全图的长线；
 * - clipAngle 限制在视场角半径附近，区域外的网格/连线一律裁掉；
 * - 图上像素距离不代表角距（面板中所有角距均按球面公式另算）。
 */
import { useMemo } from 'react';
import {
  geoAzimuthalEquidistant,
  geoStereographic,
  geoPath,
  geoGraticule,
  geoCircle,
  type GeoProjection,
} from 'd3-geo';
import type { Asterism, StarWithAlt } from '../types';
import { STAR_BY_ID } from '../lib/catalog';
import { angDistDeg, magRadius, raToLon } from '../lib/coords';

const W = 440;
const H = 440;

export type ProjectionKind = 'stereographic' | 'azimuthal-equidistant';

export interface ProjectionViewProps {
  kind: ProjectionKind;
  title: string;
  note: string;
  stars: StarWithAlt[];
  asterisms: Asterism[];
  centerRaDeg: number;
  centerDecDeg: number;
  radiusDeg: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectionView(props: ProjectionViewProps) {
  const { kind, stars, asterisms, centerRaDeg, centerDecDeg, radiusDeg } = props;

  const { projection, path } = useMemo(() => {
    const projection: GeoProjection = (kind === 'stereographic'
      ? geoStereographic()
      : geoAzimuthalEquidistant()
    )
      // 旋转到视场中心：经度取 RA 映射的地图经度
      .rotate([-raToLon(centerRaDeg), -centerDecDeg])
      .precision(0.5)
      // 只保留视场附近半球块，杜绝跨零区域被拉成横贯全图的线
      .clipAngle(Math.min(179, radiusDeg + 0.6));
    // 用视场小圆做 fitSize，使角半径恰好撑满画布
    const circle = geoCircle()
      .center([raToLon(centerRaDeg), centerDecDeg])
      .radius(radiusDeg)();
    projection.fitSize([W, H], circle);
    return { projection, path: geoPath(projection) };
  }, [kind, centerRaDeg, centerDecDeg, radiusDeg]);

  const graticuleStep = radiusDeg > 25 ? 10 : 5;
  const graticule = useMemo(() => {
    const g = geoGraticule().step([graticuleStep, graticuleStep]);
    return path(g()) ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, graticuleStep]);

  const outline = path({ type: 'Sphere' }) ?? undefined;
  // RA 0h 子午线（跨零参考线），被投影裁剪后仅显示可见段
  const raZeroMeridian =
    path({ type: 'LineString', coordinates: [[0, -89.9], [0, 89.9]] }) ?? undefined;

  const inRegion = stars.filter(
    (s) => angDistDeg(s.raHours * 15, s.decDeg, centerRaDeg, centerDecDeg) <= radiusDeg + 0.6,
  );

  const asterismPaths = useMemo(() => {
    const out: { name: string; d: string }[] = [];
    for (const a of asterisms) {
      for (const [idA, idB] of a.edges) {
        const sa = STAR_BY_ID.get(idA);
        const sb = STAR_BY_ID.get(idB);
        if (!sa || !sb) continue;
        const raA = sa.raHours * 15;
        const raB = sb.raHours * 15;
        // 两端都在视场附近才绘制；两点各自独立投影，d3 沿大圆插值，
        // 跨 RA 0h 的边（如 Scheat→Alpheratz）因投影已居中而是短边
        if (
          angDistDeg(raA, sa.decDeg, centerRaDeg, centerDecDeg) > radiusDeg + 2 ||
          angDistDeg(raB, sb.decDeg, centerRaDeg, centerDecDeg) > radiusDeg + 2
        )
          continue;
        const d = path({
          type: 'LineString',
          coordinates: [
            [raToLon(raA), sa.decDeg],
            [raToLon(raB), sb.decDeg],
          ],
        });
        if (d) out.push({ name: `${a.name}:${idA}-${idB}`, d });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asterisms, path, centerRaDeg, centerDecDeg, radiusDeg]);

  return (
    <div className="panel">
      <div className="panel-title">{props.title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="proj-svg" role="img">
        {outline && <path d={outline} className="proj-outline" />}
        {graticule && <path d={graticule} className="proj-graticule" />}
        {raZeroMeridian && <path d={raZeroMeridian} className="proj-razero" />}
        {asterismPaths.map((a) => (
          <path key={a.name} d={a.d} className="proj-asterism" />
        ))}
        {inRegion.map((s) => {
          const pt = projection([raToLon(s.raHours * 15), s.decDeg]);
          if (!pt) return null;
          const selected = s.id === props.selectedId;
          const r = magRadius(s.mag);
          return (
            <g key={s.id} transform={`translate(${pt[0]},${pt[1]})`}>
              {selected && <circle r={r + 5} className="proj-selected-ring" />}
              <circle
                r={r}
                className={`proj-star${selected ? ' selected' : ''}`}
                onClick={() => props.onSelect(s.id)}
              >
                <title>
                  {s.name} {s.nameEn} · 星等 {s.mag}
                </title>
              </circle>
              {(s.mag <= 2.5 || selected) && (
                <text x={r + 3} y={3} className="proj-label">
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="panel-note">{props.note}</div>
    </div>
  );
}
