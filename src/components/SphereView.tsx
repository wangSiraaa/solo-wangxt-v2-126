/**
 * Three.js 天球视图：J2000 赤道坐标下的天球（球面视角）。
 * - 恒星为精灵点，点击拾取（raycast）后与其他视图联动选中同一目标
 * - 经纬网格中 RA=0h 子午线以醒目颜色标出（跨零赤经参考）
 * - 当前视场以小圆（角半径严格按球面）标出
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Star } from '../types';
import { DEG } from '../lib/coords';

const R = 50;

function raDecToVec3(raDeg: number, decDeg: number, radius = R): THREE.Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.cos(dec) * Math.sin(ra),
    radius * Math.sin(dec),
  );
}

function makeDotTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeRingTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,196,0,1)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(32, 32, 26, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

function buildGraticule(): THREE.Group {
  const group = new THREE.Group();
  const matMinor = new THREE.LineBasicMaterial({ color: 0x2a3a5e, transparent: true, opacity: 0.55 });
  const matEquator = new THREE.LineBasicMaterial({ color: 0x3d5a8a, transparent: true, opacity: 0.9 });
  const matRaZero = new THREE.LineBasicMaterial({ color: 0xc07a2a, transparent: true, opacity: 0.95 });

  // 赤纬圈
  for (let dec = -75; dec <= 75; dec += 15) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) pts.push(raDecToVec3((i / 128) * 360, dec));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, dec === 0 ? matEquator : matMinor));
  }
  // 赤经子午线
  for (let ra = 0; ra < 360; ra += 30) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) pts.push(raDecToVec3(ra, -90 + (i / 128) * 180));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, ra === 0 ? matRaZero : matMinor));
  }
  return group;
}

export interface SphereViewProps {
  stars: Star[];
  visibleIds: ReadonlySet<string>;
  centerRaDeg: number;
  centerDecDeg: number;
  radiusDeg: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SphereView(props: SphereViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const starsGroupRef = useRef<THREE.Group | null>(null);
  const regionLineRef = useRef<THREE.LineLoop | null>(null);
  const ringRef = useRef<THREE.Sprite | null>(null);
  const spritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const propsRef = useRef(props);
  propsRef.current = props;

  // 初始化（一次）
  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(0, -40, 130);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 60;
    controls.maxDistance = 500;

    scene.add(buildGraticule());

    // 天球参考球面（极淡）
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.995, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x101a33, transparent: true, opacity: 0.35 }),
    );
    scene.add(sphere);

    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    // 视场小圆
    const regionGeo = new THREE.BufferGeometry();
    const regionLine = new THREE.LineLoop(
      regionGeo,
      new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.9 }),
    );
    scene.add(regionLine);

    // 选中标记
    const ring = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: makeRingTexture(), transparent: true, depthWrite: false }),
    );
    ring.visible = false;
    scene.add(ring);

    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    starsGroupRef.current = starsGroup;
    regionLineRef.current = regionLine;
    ringRef.current = ring;

    // 点击拾取
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // 拖拽不算点击
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...spritesRef.current.values()], false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.starId as string;
        propsRef.current.onSelect(id);
      }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    // 尺寸自适应
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // 恒星精灵（星表静态，只建一次）
  useEffect(() => {
    const group = starsGroupRef.current!;
    const dot = makeDotTexture();
    const sprites = spritesRef.current;
    for (const s of props.stars) {
      const mat = new THREE.SpriteMaterial({ map: dot, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      const pos = raDecToVec3(s.raHours * 15, s.decDeg);
      sprite.position.copy(pos);
      const scale = Math.max(1.4, 5.2 - 0.95 * s.mag) * 1.5;
      sprite.scale.set(scale, scale, 1);
      sprite.userData.starId = s.id;
      group.add(sprite);
      sprites.set(s.id, sprite);
    }
    return () => {
      for (const sp of sprites.values()) {
        (sp.material as THREE.SpriteMaterial).dispose();
        starsGroupRef.current?.remove(sp);
      }
      sprites.clear();
      dot.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选可见性：被滤掉的星仅调暗，不删除（便于理解筛选作用范围）
  useEffect(() => {
    for (const [id, sprite] of spritesRef.current) {
      (sprite.material as THREE.SpriteMaterial).opacity = props.visibleIds.has(id) ? 1 : 0.12;
    }
  }, [props.visibleIds]);

  // 视场小圆 + 相机对准区域中心
  useEffect(() => {
    const c = raDecToVec3(props.centerRaDeg, props.centerDecDeg, 1).normalize();
    const up = Math.abs(c.z) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const u = new THREE.Vector3().crossVectors(c, up).normalize();
    const v = new THREE.Vector3().crossVectors(c, u).normalize();
    const r = props.radiusDeg * DEG;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      const p = c
        .clone()
        .multiplyScalar(Math.cos(r))
        .addScaledVector(u, Math.sin(r) * Math.cos(t))
        .addScaledVector(v, Math.sin(r) * Math.sin(t))
        .multiplyScalar(R * 1.005);
      pts.push(p);
    }
    regionLineRef.current!.geometry.setFromPoints(pts);

    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    camera.position.copy(c.clone().multiplyScalar(150));
    controls.target.set(0, 0, 0);
    controls.update();
  }, [props.centerRaDeg, props.centerDecDeg, props.radiusDeg]);

  // 选中标记
  useEffect(() => {
    const ring = ringRef.current!;
    if (!props.selectedId) {
      ring.visible = false;
      return;
    }
    const star = props.stars.find((s) => s.id === props.selectedId);
    if (!star) {
      ring.visible = false;
      return;
    }
    ring.position.copy(raDecToVec3(star.raHours * 15, star.decDeg, R * 1.01));
    const scale = Math.max(1.4, 5.2 - 0.95 * star.mag) * 2.6;
    ring.scale.set(scale, scale, 1);
    ring.visible = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId]);

  return (
    <div className="panel sphere-panel">
      <div className="panel-title">天球（球面视角 · J2000 赤道坐标）</div>
      <div ref={mountRef} className="sphere-mount" />
      <div className="panel-note">
        拖拽旋转 · 橙色子午线为 RA 0h（跨零参考）· 蓝圈为当前视场 · 点击恒星选中
      </div>
    </div>
  );
}
