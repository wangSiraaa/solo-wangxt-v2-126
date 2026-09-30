import { useState } from 'react';
import type { Annotation, SavedView, StarWithAlt } from '../types';
import { angDistDeg, fmtDec, fmtRa } from '../lib/coords';

export interface InfoPanelProps {
  selected: StarWithAlt | null;
  previous: StarWithAlt | null;
  centerRaDeg: number;
  centerDecDeg: number;
  annotations: Annotation[];
  savedViews: SavedView[];
  onAddAnnotation: (text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onSaveView: (name: string) => void;
  onLoadView: (v: SavedView) => void;
  onDeleteView: (id: string) => void;
  onExport: () => void;
}

const TAG_LABEL: Record<string, string> = {
  polar: '极区',
  'ra-zero': '跨零赤经',
  horizon: '地平线附近',
  reference: '参考',
};

export function InfoPanel(props: InfoPanelProps) {
  const { selected, previous } = props;
  const [note, setNote] = useState('');
  const [viewName, setViewName] = useState('');

  const distToCenter =
    selected &&
    angDistDeg(selected.raHours * 15, selected.decDeg, props.centerRaDeg, props.centerDecDeg);
  const distToPrev =
    selected &&
    previous &&
    selected.id !== previous.id &&
    angDistDeg(
      selected.raHours * 15,
      selected.decDeg,
      previous.raHours * 15,
      previous.decDeg,
    );

  return (
    <div className="panel info-panel">
      <div className="info-columns">
        <section>
          <h3>选中目标</h3>
          {selected ? (
            <div className="star-card">
              <div className="star-name">
                {selected.name} <span className="star-name-en">{selected.nameEn}</span>
              </div>
              <table>
                <tbody>
                  <tr><td>星等</td><td>{selected.mag.toFixed(2)}</td></tr>
                  <tr><td>RA (J2000)</td><td>{fmtRa(selected.raHours * 15)}（{(selected.raHours * 15).toFixed(4)}°）</td></tr>
                  <tr><td>Dec (J2000)</td><td>{fmtDec(selected.decDeg)}（{selected.decDeg.toFixed(4)}°）</td></tr>
                  <tr><td>视高度</td><td>{selected.alt.toFixed(2)}°{selected.alt <= 0 ? '（地平线下）' : ''}</td></tr>
                  <tr><td>视方位角</td><td>{selected.az.toFixed(2)}°</td></tr>
                  <tr><td>样例类别</td><td>{selected.tags.map((t) => TAG_LABEL[t]).join('、')}</td></tr>
                </tbody>
              </table>
              <div className="angular-distances">
                <div>与视场中心的球面角距：<strong>{distToCenter!.toFixed(3)}°</strong></div>
                {distToPrev !== null && distToPrev !== false && previous && (
                  <div>
                    与「{previous.name}」的球面角距：<strong>{(distToPrev as number).toFixed(3)}°</strong>
                  </div>
                )}
                <div className="note-small">角距均按球面（大圆）计算，与任何投影图上的像素距离无关。</div>
              </div>
            </div>
          ) : (
            <p className="dim">在任一视图中点击恒星以选中（三个视图联动定位同一目标）。</p>
          )}
        </section>

        <section>
          <h3>批注（IndexedDB）</h3>
          <div className="row">
            <input
              type="text"
              placeholder={selected ? `给「${selected.name}」写批注…` : '先选中一颗星'}
              value={note}
              disabled={!selected}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              disabled={!selected || !note.trim()}
              onClick={() => {
                props.onAddAnnotation(note.trim());
                setNote('');
              }}
            >
              保存
            </button>
          </div>
          <ul className="anno-list">
            {props.annotations.length === 0 && <li className="dim">暂无批注</li>}
            {props.annotations.map((a) => (
              <li key={a.id}>
                <span className="anno-star">{a.starName}</span>
                <span className="anno-text">{a.text}</span>
                <span className="anno-time">{a.createdAtUTC.slice(0, 16).replace('T', ' ')}Z</span>
                <button type="button" className="link" onClick={() => props.onDeleteAnnotation(a.id)}>
                  删除
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>视场存档（IndexedDB）</h3>
          <div className="row">
            <input
              type="text"
              placeholder="视场名称"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
            />
            <button
              type="button"
              disabled={!viewName.trim()}
              onClick={() => {
                props.onSaveView(viewName.trim());
                setViewName('');
              }}
            >
              保存当前视场
            </button>
          </div>
          <ul className="anno-list">
            {props.savedViews.length === 0 && <li className="dim">暂无存档</li>}
            {props.savedViews.map((v) => (
              <li key={v.id}>
                <span className="anno-star">{v.name}</span>
                <span className="anno-time">{v.savedAtUTC.slice(0, 16).replace('T', ' ')}Z</span>
                <button type="button" className="link" onClick={() => props.onLoadView(v)}>载入</button>
                <button type="button" className="link" onClick={() => props.onDeleteView(v.id)}>删除</button>
              </li>
            ))}
          </ul>
          <h3>导出</h3>
          <button type="button" onClick={props.onExport}>导出当前视场 JSON</button>
          <div className="note-small">导出文件注明坐标系（J2000 赤道 / 视地平）与时间基准（UTC）。</div>
        </section>
      </div>
    </div>
  );
}
