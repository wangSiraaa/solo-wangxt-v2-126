import type { ObserverState, ViewState } from '../types';

export interface ControlsProps {
  observer: ObserverState;
  view: ViewState;
  onObserver: (o: ObserverState) => void;
  onView: (v: ViewState) => void;
  onPreset: (name: 'north-pole' | 'south-pole' | 'ra-zero' | 'horizon') => void;
}

/** 观测条件与视场控制。星等筛选与地平线裁切为两个独立开关。 */
export function Controls({ observer, view, onObserver, onView, onPreset }: ControlsProps) {
  const setObs = (patch: Partial<ObserverState>) => onObserver({ ...observer, ...patch });
  const setView = (patch: Partial<ViewState>) => onView({ ...view, ...patch, preset: 'custom' });

  return (
    <div className="panel controls">
      <div className="controls-row">
        <fieldset>
          <legend>观测位置</legend>
          <label>
            纬度°
            <input
              type="number"
              step="0.01"
              min={-90}
              max={90}
              value={observer.lat}
              onChange={(e) => setObs({ lat: Number(e.target.value) })}
            />
          </label>
          <label>
            经度°（东正）
            <input
              type="number"
              step="0.01"
              min={-180}
              max={180}
              value={observer.lon}
              onChange={(e) => setObs({ lon: Number(e.target.value) })}
            />
          </label>
          <label>
            海拔 m
            <input
              type="number"
              step="1"
              value={observer.elevationM}
              onChange={(e) => setObs({ elevationM: Number(e.target.value) })}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>观测时刻（时间基准：UTC）</legend>
          <label>
            UTC
            <input
              type="datetime-local"
              value={observer.timeISO.slice(0, 16)}
              onChange={(e) => {
                if (!e.target.value) return;
                setObs({ timeISO: new Date(e.target.value + ':00Z').toISOString() });
              }}
            />
          </label>
          <button type="button" onClick={() => setObs({ timeISO: new Date().toISOString() })}>
            设为现在
          </button>
        </fieldset>

        <fieldset>
          <legend>样例天区</legend>
          <div className="preset-buttons">
            <button type="button" onClick={() => onPreset('north-pole')}>北天极区</button>
            <button type="button" onClick={() => onPreset('south-pole')}>南天极区</button>
            <button type="button" onClick={() => onPreset('ra-zero')}>跨零赤经（飞马方框）</button>
            <button type="button" onClick={() => onPreset('horizon')}>地平线附近（按当前时刻）</button>
          </div>
        </fieldset>

        <fieldset>
          <legend>视场（{view.preset === 'custom' ? '自定义' : view.preset}）</legend>
          <label>
            中心 RA（小时）
            <input
              type="number"
              step="0.1"
              min={0}
              max={24}
              value={Math.round((view.centerRaDeg / 15) * 1000) / 1000}
              onChange={(e) => setView({ centerRaDeg: Number(e.target.value) * 15 })}
            />
          </label>
          <label>
            中心 Dec（度）
            <input
              type="number"
              step="0.5"
              min={-90}
              max={90}
              value={view.centerDecDeg}
              onChange={(e) => setView({ centerDecDeg: Number(e.target.value) })}
            />
          </label>
          <label>
            角半径（度）
            <input
              type="number"
              step="1"
              min={2}
              max={90}
              value={view.radiusDeg}
              onChange={(e) => setView({ radiusDeg: Number(e.target.value) })}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>筛选（两者独立）</legend>
          <label>
            极限星等 ≤ {view.magLimit.toFixed(1)}
            <input
              type="range"
              min={-2}
              max={6.5}
              step={0.1}
              value={view.magLimit}
              onChange={(e) => setView({ magLimit: Number(e.target.value) })}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={view.horizonClip}
              onChange={(e) => setView({ horizonClip: e.target.checked })}
            />
            地平线裁切（仅显示高度 &gt; 0°）
          </label>
        </fieldset>
      </div>
    </div>
  );
}
