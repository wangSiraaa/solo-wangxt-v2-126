import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Annotation, ObserverState, SavedView, StarWithAlt, ViewState } from './types';
import { CATALOG, ASTERISMS } from './lib/catalog';
import { starAltAz } from './lib/astro';
import { withinRegion } from './lib/coords';
import { buildExport, downloadJson } from './lib/export';
import * as db from './lib/db';
import { SphereView } from './components/SphereView';
import { ProjectionView } from './components/ProjectionView';
import { Controls } from './components/Controls';
import { InfoPanel } from './components/InfoPanel';

const DEFAULT_OBSERVER: ObserverState = {
  lat: 31.23,      // 上海附近：老人星、水委一等南天亮星贴近地平线
  lon: 121.47,
  elevationM: 10,
  timeISO: new Date().toISOString(),
};

const DEFAULT_VIEW: ViewState = {
  preset: '跨零赤经（飞马方框）',
  centerRaDeg: 354.6, // 23.64h：大四边形中心（跨 RA 0h）
  centerDecDeg: 22,
  radiusDeg: 13,
  magLimit: 6.5,
  horizonClip: false,
};

export default function App() {
  const [observer, setObserver] = useState<ObserverState>(DEFAULT_OBSERVER);
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // 载入 IndexedDB
  useEffect(() => {
    db.listAnnotations().then((a) =>
      setAnnotations(a.sort((x, y) => y.createdAtUTC.localeCompare(x.createdAtUTC))),
    );
    db.listViews().then((v) =>
      setSavedViews(v.sort((x, y) => y.savedAtUTC.localeCompare(x.savedAtUTC))),
    );
  }, []);

  // 全星表 + 当前观测条件下的视地平坐标（astronomy-engine）
  const starsWithAlt: StarWithAlt[] = useMemo(
    () =>
      CATALOG.map((s) => {
        const { alt, az } = starAltAz(s.raHours, s.decDeg, observer);
        return { ...s, alt, az };
      }),
    [observer],
  );

  // 星等筛选与地平线裁切：两个独立条件
  const filtered = useMemo(
    () =>
      starsWithAlt.filter(
        (s) => s.mag <= view.magLimit && (!view.horizonClip || s.alt > 0),
      ),
    [starsWithAlt, view.magLimit, view.horizonClip],
  );
  const visibleIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered]);

  const regionStars = useMemo(
    () =>
      filtered.filter((s) =>
        withinRegion(s.raHours * 15, s.decDeg, view.centerRaDeg, view.centerDecDeg, view.radiusDeg),
      ),
    [filtered, view.centerRaDeg, view.centerDecDeg, view.radiusDeg],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (id !== selectedId) {
        setPrevId(selectedId);
        setSelectedId(id);
      }
    },
    [selectedId],
  );

  const applyPreset = useCallback(
    (name: 'north-pole' | 'south-pole' | 'ra-zero' | 'horizon') => {
      if (name === 'north-pole') {
        setView((v) => ({ ...v, preset: '北天极区', centerRaDeg: 0, centerDecDeg: 90, radiusDeg: 30 }));
      } else if (name === 'south-pole') {
        setView((v) => ({ ...v, preset: '南天极区', centerRaDeg: 0, centerDecDeg: -90, radiusDeg: 30 }));
      } else if (name === 'ra-zero') {
        setView((v) => ({ ...v, preset: '跨零赤经（飞马方框）', centerRaDeg: 354.6, centerDecDeg: 22, radiusDeg: 13 }));
      } else {
        // 地平线附近：在当前时刻/地点选取高度 0–18° 内最接近 8° 的样例目标
        const candidates = starsWithAlt
          .filter((s) => s.tags.includes('horizon') && s.alt > 0 && s.alt < 18)
          .sort((a, b) => Math.abs(a.alt - 8) - Math.abs(b.alt - 8));
        const target = candidates[0] ?? [...starsWithAlt.filter((s) => s.tags.includes('horizon'))].sort(
          (a, b) => b.alt - a.alt,
        )[0];
        if (!target) return;
        setSelectedId(target.id);
        setView((v) => ({
          ...v,
          preset: `地平线附近（${target.name}，高度 ${target.alt.toFixed(1)}°）`,
          centerRaDeg: target.raHours * 15,
          centerDecDeg: target.decDeg,
          radiusDeg: 25,
        }));
      }
    },
    [starsWithAlt],
  );

  const handleAddAnnotation = useCallback(
    async (text: string) => {
      if (!selectedId) return;
      const star = CATALOG.find((s) => s.id === selectedId);
      if (!star) return;
      const a: Annotation = {
        id: crypto.randomUUID(),
        starId: star.id,
        starName: star.name,
        text,
        createdAtUTC: new Date().toISOString(),
      };
      await db.putAnnotation(a);
      setAnnotations((prev) => [a, ...prev]);
    },
    [selectedId],
  );

  const handleSaveView = useCallback(
    async (name: string) => {
      const v: SavedView = {
        id: crypto.randomUUID(),
        name,
        savedAtUTC: new Date().toISOString(),
        view,
        observer,
      };
      await db.putView(v);
      setSavedViews((prev) => [v, ...prev]);
    },
    [view, observer],
  );

  const handleExport = useCallback(() => {
    downloadJson(buildExport(regionStars, view, observer, annotations));
  }, [regionStars, view, observer, annotations]);

  const selected = starsWithAlt.find((s) => s.id === selectedId) ?? null;
  const previous = starsWithAlt.find((s) => s.id === prevId) ?? null;

  return (
    <div className="app">
      <header>
        <h1>本地星图 · 投影对比工具</h1>
        <span className="header-note">
          无后端 · 坐标：J2000 赤道（astronomy-engine 转视地平）· 时间基准：UTC · 角距一律球面计算
        </span>
      </header>

      <Controls
        observer={observer}
        view={view}
        onObserver={setObserver}
        onView={setView}
        onPreset={applyPreset}
      />

      <main className="views">
        <SphereView
          stars={CATALOG}
          visibleIds={visibleIds}
          centerRaDeg={view.centerRaDeg}
          centerDecDeg={view.centerDecDeg}
          radiusDeg={view.radiusDeg}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <ProjectionView
          kind="stereographic"
          title="立体投影（等角）"
          note="保角：局部形状真实；面积与离中心距离被放大。图上像素距离不代表角距。"
          stars={filtered}
          asterisms={ASTERISMS}
          centerRaDeg={view.centerRaDeg}
          centerDecDeg={view.centerDecDeg}
          radiusDeg={view.radiusDeg}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <ProjectionView
          kind="azimuthal-equidistant"
          title="等距方位投影"
          note="仅从投影中心出发的角距与方位保持真实比例；其余方向有变形。图上像素距离不代表角距。"
          stars={filtered}
          asterisms={ASTERISMS}
          centerRaDeg={view.centerRaDeg}
          centerDecDeg={view.centerDecDeg}
          radiusDeg={view.radiusDeg}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </main>

      <InfoPanel
        selected={selected}
        previous={previous}
        centerRaDeg={view.centerRaDeg}
        centerDecDeg={view.centerDecDeg}
        annotations={annotations}
        savedViews={savedViews}
        onAddAnnotation={handleAddAnnotation}
        onDeleteAnnotation={async (id) => {
          await db.deleteAnnotation(id);
          setAnnotations((prev) => prev.filter((a) => a.id !== id));
        }}
        onSaveView={handleSaveView}
        onLoadView={(v) => {
          setView(v.view);
          setObserver(v.observer);
        }}
        onDeleteView={async (id) => {
          await db.deleteView(id);
          setSavedViews((prev) => prev.filter((v) => v.id !== id));
        }}
        onExport={handleExport}
      />
    </div>
  );
}
