// Personajes de Hello Kitty: El Jardín Mágico.
// Son figuras propias modeladas con formas de Three.js (no usan modelos ni
// imágenes oficiales), con la forma y los colores de cada personaje.
import * as THREE from './three.module.min.js';
const V2 = THREE.Vector2;
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;

/* ---------- Texturas ---------- */
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function blob(g, x, y, r, seed = 0) {
  g.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = i / 14 * TAU, rr = r * (0.85 + 0.15 * Math.sin(i * 1.7 + x * 0.1 + seed));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.78;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}
// Cuadros amarillos con rayas rojas y naranjas, como la camisa de Woody

/* ---------- Materiales y piezas ---------- */
const matCache = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o }));
  return matCache.get(key);
}
export const texM = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.75, ...o });
export const sphere = (r, w = 28, h = 20) => new THREE.SphereGeometry(r, w, h);
export const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
export const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
export const cone = (r, h, s = 16) => new THREE.ConeGeometry(r, h, s);
export function mk(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
export function pivot(parent, x = 0, y = 0, z = 0) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  parent.add(p);
  return p;
}
// Cuerpo de revolución a partir de un perfil [radio, altura], suavizado
function lathe(profile, seg = 32, phiStart = 0, phiLen = TAU) {
  const pts = new THREE.SplineCurve(profile.map(([r, y]) => new V2(r, y))).getPoints(profile.length * 8);
  return new THREE.LatheGeometry(pts, seg, phiStart, phiLen);
}
// Cápsula que se estrecha: la esfera de arriba está en y=0 y la de abajo en y=-len
function taper(rt, rb, len, seg = 20) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new V2(rb * Math.sin(a), -len - rb * Math.cos(a))); }
  // puntos intermedios para que las texturas no se estiren a lo largo
  for (let i = 1; i < 12; i++) { const t = i / 12; pts.push(new V2(rb + (rt - rb) * t, -len + len * t)); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new V2(rt * Math.sin(a), -rt * Math.cos(a))); }
  return new THREE.LatheGeometry(pts, seg);
}
// Dobla una figura plana para que siga la curva de la cara
function wrap(geo, R) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) - (x * x) / (2 * R)); }
  geo.computeVertexNormals();
  return geo;
}
function starShape(R = 0.5, r = 0.22) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + Math.PI / 2, rr = i % 2 ? r : R;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return s;
}
export const starGeo = new THREE.ExtrudeGeometry(starShape(), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
starGeo.center();
export const goldM = M(0xffcc33, { metalness: 0.45, roughness: 0.3, emissive: 0xff9900, emissiveIntensity: 0.35 });

/* ---------- Caras ---------- */
// Ojo con iris, pupila, brillo y párpado superior del color de la piel
function eye(parent, x, y, z, r, { iris = 0x5a3416, lid = null, lidTilt = 0.3, ry = 0, lashes = false } = {}) {
  const g = pivot(parent, x, y, z);
  g.rotation.y = ry;
  mk(sphere(r, 24, 18), M(0xffffff, { roughness: 0.15 }), g).scale.set(1, 1.08, 0.85);
  mk(sphere(r * 0.6, 20, 14), M(iris, { roughness: 0.2 }), g, 0, 0, r * 0.6).scale.set(1, 1, 0.45);
  mk(sphere(r * 0.34, 16, 12), M(0x0d0d0d, { roughness: 0.15 }), g, 0, 0, r * 0.75).scale.set(1, 1, 0.5);
  mk(sphere(r * 0.15, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, r * 0.2, r * 0.24, r * 0.9);
  if (lid) {
    const l = mk(new THREE.SphereGeometry(r * 1.1, 24, 10, 0, TAU, 0, Math.PI * 0.3), lid, g);
    l.rotation.x = lidTilt;
  }
  if (lashes) {
    for (let k = 0; k < 3; k++) {
      const s = Math.sign(x) || 1;
      const lash = mk(box(r * 0.12, r * 0.55, r * 0.12), M(0x1a0d08), g, s * r * (0.45 + k * 0.22), r * (0.95 - k * 0.12), r * 0.2);
      lash.rotation.z = -s * (0.5 + k * 0.35);
    }
  }
  return g;
}
// Boca sonriente con dientes, doblada sobre la cara
function mouth(parent, x, y, z, w, h, R, { teeth = true, tongue = true, color = 0x5c1512, lip = null } = {}) {
  const g = pivot(parent, x, y, z);
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.quadraticCurveTo(0, -h * 0.28, w / 2, 0);
  s.quadraticCurveTo(w * 0.1, -h * 1.9, -w / 2, 0);
  mk(wrap(new THREE.ShapeGeometry(s, 16), R), M(color, { roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), g);
  if (teeth) {
    const t = new THREE.Shape();
    t.moveTo(-w * 0.4, -h * 0.1);
    t.quadraticCurveTo(0, -h * 0.36, w * 0.4, -h * 0.1);
    t.quadraticCurveTo(0, -h * 0.7, -w * 0.4, -h * 0.1);
    mk(wrap(new THREE.ShapeGeometry(t, 16), R), M(0xffffff, { roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), g, 0, 0, 0.004);
  }
  if (tongue) {
    const tg = mk(wrap(new THREE.CircleGeometry(w * 0.2, 16), R), M(0xd65a5a, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), g, 0, -h * 0.72, 0.003);
    tg.scale.set(1.2, 0.45, 1);
  }
  if (lip) {
    const l = mk(new THREE.TorusGeometry(w * 0.52, h * 0.09, 6, 20, Math.PI * 0.8), lip, g, 0, h * 0.42, -0.01);
    l.rotation.z = Math.PI + Math.PI * 0.1;
  }
  return g;
}
// Mano tipo manopla con pulgar
function hand(parent, y, r, mat, s) {
  const h = pivot(parent, 0, y, 0);
  mk(sphere(r), mat, h, 0, -r * 0.4, 0).scale.set(0.75, 1.15, 0.95);
  const th = mk(new THREE.CapsuleGeometry(r * 0.32, r * 0.5, 4, 8), mat, h, -s * r * 0.15, -r * 0.1, r * 0.6);
  th.rotation.set(0.6, 0, -s * 0.4);
  return h;
}

/* ---------- Esqueleto común ---------- */
function rig(name) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { name, root, body, legs: [], knees: [], arms: [], elbows: [], head: null, h: 2.6, phase: 0, cheer: 0, stepRate: 9 };
}
// Pierna con rodilla: muslo + espinilla; devuelve el pivote del tobillo
function leg2(R, parent, x, y, { r1, r2, r3, l1, l2, mat1, mat2 = mat1 }) {
  const hip = pivot(parent, x, y, 0);
  mk(taper(r1, r2, l1), mat1, hip);
  const knee = pivot(hip, 0, -l1, 0);
  mk(taper(r2, r3, l2), mat2, knee);
  const ankle = pivot(knee, 0, -l2, 0);
  R.legs.push(hip); R.knees.push(knee);
  return { hip, knee, ankle };
}
// Brazo con codo: devuelve los pivotes
function arm2(R, parent, s, x, y, z, { r1, r2, r3, l1, l2, mat1, mat2 = mat1, spread = 0.16, bend = 0.25 }) {
  const sh = pivot(parent, s * x, y, z);
  mk(taper(r1, r2, l1), mat1, sh);
  const el = pivot(sh, 0, -l1, 0);
  mk(taper(r2, r3, l2), mat2, el);
  const wr = pivot(el, 0, -l2, 0);
  sh.rotation.z = sh.userData.bz = s * spread;
  el.rotation.x = el.userData.bx = -bend;
  R.arms.push(sh); R.elbows.push(el);
  return { sh, el, wr };
}

/* ---------- Piezas al estilo Sanrio ---------- */
function heartShape(s = 0.5) {
  const h = new THREE.Shape();
  h.moveTo(0, -s * 0.9);
  h.bezierCurveTo(-s * 0.2, -s * 0.6, -s * 1.05, -s * 0.15, -s * 0.95, s * 0.3);
  h.bezierCurveTo(-s * 0.85, s * 0.8, -s * 0.2, s * 0.85, 0, s * 0.4);
  h.bezierCurveTo(s * 0.2, s * 0.85, s * 0.85, s * 0.8, s * 0.95, s * 0.3);
  h.bezierCurveTo(s * 1.05, -s * 0.15, s * 0.2, -s * 0.6, 0, -s * 0.9);
  return h;
}
export const heartGeo = new THREE.ExtrudeGeometry(heartShape(0.5), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 3, curveSegments: 20 });
heartGeo.center();
export const heartM = M(0xff5f9e, { roughness: 0.25, metalness: 0.1, emissive: 0xff2f7e, emissiveIntensity: 0.3 });

const WHITE = () => M(0xffffff, { roughness: 0.5 });
// Ojo de punto negro ovalado con brillo
function dotEye(parent, x, y, z, r = 0.07, color = 0x111111) {
  const g = pivot(parent, x, y, z);
  mk(sphere(r, 20, 14), M(color, { roughness: 0.15 }), g).scale.set(0.8, 1.15, 0.5);
  mk(sphere(r * 0.28, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, r * 0.2, r * 0.4, r * 0.4);
  return g;
}
function blush(parent, x, y, z, r = 0.07) {
  mk(sphere(r, 16, 10), M(0xff9fbf, { roughness: 0.7, transparent: true, opacity: 0.85 }), parent, x, y, z).scale.set(1.3, 0.7, 0.3);
}
function smallSmile(parent, x, y, z, r = 0.05, color = 0x6a2030) {
  const m = mk(new THREE.TorusGeometry(r, r * 0.25, 6, 14, Math.PI), M(color), parent, x, y, z);
  m.rotation.z = Math.PI;
  return m;
}
// Moño de dos lazos
function bow(parent, x, y, z, color, size = 1, rz = 0) {
  const g = pivot(parent, x, y, z);
  g.rotation.z = rz;
  g.scale.setScalar(size);
  const m = M(color, { roughness: 0.4 });
  for (const s of [-1, 1]) {
    const loop = mk(sphere(0.17, 20, 14), m, g, s * 0.16, 0, 0);
    loop.scale.set(1.05, 0.8, 0.5);
    loop.rotation.z = s * 0.25;
  }
  mk(sphere(0.085), m, g, 0, 0, 0.03).scale.set(1, 1.1, 0.8);
  return g;
}
function flower(parent, x, y, z, petal = 0xffffff, center = 0xffd84a, size = 1) {
  const g = pivot(parent, x, y, z);
  g.scale.setScalar(size);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    mk(sphere(0.07, 12, 8), M(petal, { roughness: 0.5 }), g, Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0).scale.set(1, 1, 0.5);
  }
  mk(sphere(0.045, 10, 8), M(center), g, 0, 0, 0.02);
  return g;
}
function whiskers(head, cy, cz, w) {
  const m = M(0x1a1a1a);
  for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) {
    const wk = mk(new THREE.CapsuleGeometry(0.011, 0.3, 3, 6), m, head, s * w, cy - k * 0.07, cz);
    wk.rotation.set(0, -s * 0.55, Math.PI / 2 + s * k * 0.14);
  }
}
// Cuerpo pequeño con vestido, bracitos y patitas
function chibiBody(R, { fur, dress, collar = null, sleeve = null, footScale = 1 }) {
  const b = R.body;
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.16, 0.44, 0);
    mk(taper(0.105, 0.1, 0.26), fur, leg);
    const foot = mk(sphere(0.14), fur, leg, 0, -0.34, 0.05);
    foot.scale.set(1, 0.62, 1.35 * footScale);
    R.legs.push(leg);
  }
  mk(lathe([[0, 0.3], [0.4, 0.32], [0.41, 0.4], [0.33, 0.75], [0.26, 1.0], [0.17, 1.12], [0, 1.14]]), dress, b);
  if (collar) mk(new THREE.TorusGeometry(0.17, 0.05, 10, 24), collar, b, 0, 1.08, 0).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.25, 1.0, 0);
    mk(taper(0.085, 0.075, 0.28), sleeve || fur, a);
    mk(sphere(0.095), fur, a, 0, -0.36, 0);
    a.rotation.z = a.userData.bz = s * 0.5;
    R.arms.push(a);
  }
}

/* ============================================================
   Hello Kitty: cabeza blanca ovalada, ojos de punto, nariz
   amarilla, bigotes, sin boca y moño rojo en la oreja.
   ============================================================ */
export function makeKitty() {
  const R = rig('Hello Kitty');
  const white = WHITE();
  chibiBody(R, { fur: white, dress: M(0xff7fb0, { roughness: 0.5 }), collar: white });
  const head = R.head = pivot(R.body, 0, 1.12, 0);
  mk(sphere(0.6, 40, 30), white, head, 0, 0.55, 0).scale.set(1.28, 0.95, 1.0);
  for (const s of [-1, 1]) {
    const ear = mk(cone(0.22, 0.36, 24), white, head, s * 0.56, 1.06, 0);
    ear.rotation.z = -s * 0.55;
    dotEye(head, s * 0.3, 0.56, 0.565, 0.075);
  }
  mk(sphere(0.06), M(0xffd23f, { roughness: 0.35 }), head, 0, 0.44, 0.6).scale.set(1.35, 0.9, 0.7);
  whiskers(head, 0.47, 0.32, 0.8);
  bow(head, 0.46, 1.0, 0.24, 0xe8202e, 1.25, -0.35);
  mk(sphere(0.06), M(0xffd23f), head, 0.46, 1.0, 0.31).scale.set(1, 1, 0.6);
  R.h = 2.35; R.stepRate = 11;
  return R;
}

/* ============================================================
   My Melody: conejita con capucha rosa de orejas largas y flor.
   ============================================================ */
export function makeMelody() {
  const R = rig('My Melody');
  const white = WHITE(), pink = M(0xffa3c8, { roughness: 0.5 });
  chibiBody(R, { fur: white, dress: M(0xffc2db, { roughness: 0.5 }), collar: pink });
  const head = R.head = pivot(R.body, 0, 1.12, 0);
  mk(sphere(0.6, 36, 28), pink, head, 0, 0.55, -0.06).scale.set(1.12, 1.0, 1.0);
  mk(sphere(0.5, 36, 28), white, head, 0, 0.5, 0.22).scale.set(1.1, 0.88, 0.75);
  for (const s of [-1, 1]) {
    const ear = pivot(head, s * 0.24, 1.0, -0.06);
    ear.rotation.z = -s * 0.12;
    mk(new THREE.CapsuleGeometry(0.15, 0.55, 8, 16), pink, ear, 0, 0.38, 0).scale.z = 0.75;
    mk(new THREE.CapsuleGeometry(0.075, 0.45, 6, 12), M(0xffe1ec), ear, 0, 0.38, 0.08).scale.z = 0.4;
    dotEye(head, s * 0.22, 0.52, 0.56, 0.065);
    blush(head, s * 0.34, 0.4, 0.5);
  }
  mk(sphere(0.05), M(0xffd23f, { roughness: 0.35 }), head, 0, 0.43, 0.59).scale.set(1.3, 0.9, 0.7);
  smallSmile(head, 0, 0.35, 0.57, 0.035);
  flower(head, -0.36, 1.05, 0.06, 0xffffff, 0xffd84a, 1.4);
  mk(sphere(0.07), pink, head, 0.0, 0.08, 0.32);
  for (const s of [-1, 1]) mk(cone(0.05, 0.16, 10), pink, head, s * 0.06, 0.02, 0.34).rotation.z = s * 2.6;
  R.h = 2.75; R.stepRate = 11;
  return R;
}

/* ============================================================
   Kuromi: capucha negra de bufón con orejas puntiagudas,
   calavera rosa y colita de diablito.
   ============================================================ */
export function makeKuromi() {
  const R = rig('Kuromi');
  const white = WHITE(), black = M(0x2b2633, { roughness: 0.45 }), pinkK = M(0xff86b5, { roughness: 0.4 });
  chibiBody(R, { fur: white, dress: black, collar: white, sleeve: black });
  const tail = new THREE.CatmullRomCurve3([new V3(0, 0.55, -0.32), new V3(0, 0.45, -0.6), new V3(0, 0.7, -0.8), new V3(0, 0.95, -0.75)]);
  mk(new THREE.TubeGeometry(tail, 24, 0.03, 8), black, R.body);
  const tip = mk(cone(0.09, 0.16, 3), black, R.body, 0, 1.0, -0.74);
  tip.rotation.x = -0.2;
  const head = R.head = pivot(R.body, 0, 1.12, 0);
  mk(sphere(0.6, 36, 28), black, head, 0, 0.55, -0.06).scale.set(1.15, 1.0, 1.0);
  mk(sphere(0.5, 36, 28), white, head, 0, 0.5, 0.22).scale.set(1.1, 0.88, 0.75);
  for (const s of [-1, 1]) {
    const ear = pivot(head, s * 0.42, 0.95, -0.05);
    ear.rotation.z = -s * 0.7;
    mk(cone(0.17, 0.62, 20), black, ear, 0, 0.28, 0);
    mk(sphere(0.06), black, ear, 0, 0.6, 0);
    dotEye(head, s * 0.22, 0.52, 0.56, 0.07);
    blush(head, s * 0.34, 0.4, 0.5);
  }
  mk(sphere(0.045), M(0xffd23f, { roughness: 0.35 }), head, 0, 0.43, 0.59).scale.set(1.3, 0.9, 0.7);
  smallSmile(head, 0.03, 0.36, 0.57, 0.04).rotation.z = Math.PI + 0.25;
  const skull = pivot(head, 0, 0.92, 0.42);
  skull.rotation.x = -0.5;
  mk(sphere(0.1), pinkK, skull).scale.set(1, 0.9, 0.5);
  for (const s of [-1, 1]) mk(sphere(0.022), black, skull, s * 0.035, 0.0, 0.045);
  mk(box(0.07, 0.035, 0.03), pinkK, skull, 0, -0.08, 0);
  R.h = 2.6; R.stepRate = 11;
  return R;
}

/* ============================================================
   Keroppi: ranita verde con ojos grandes arriba y sonrisa ancha.
   ============================================================ */
export function makeKeroppi() {
  const R = rig('Keroppi');
  const b = R.body;
  const green = M(0x4fbf4f, { roughness: 0.4 });
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.2, 0.32, 0);
    mk(taper(0.1, 0.09, 0.15), green, leg);
    mk(sphere(0.15), green, leg, 0, -0.24, 0.07).scale.set(1.2, 0.5, 1.4);
    R.legs.push(leg);
  }
  mk(sphere(0.48), green, b, 0, 0.62, 0).scale.set(1.05, 0.95, 0.95);
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.42, 0.75, 0.05);
    mk(taper(0.07, 0.06, 0.22), green, a);
    mk(sphere(0.08), green, a, 0, -0.28, 0);
    a.rotation.z = a.userData.bz = s * 0.6;
    R.arms.push(a);
  }
  const head = R.head = pivot(b, 0, 1.0, 0);
  mk(sphere(0.55, 36, 28), green, head, 0, 0.32, 0).scale.set(1.3, 0.82, 1.0);
  for (const s of [-1, 1]) {
    mk(sphere(0.24), green, head, s * 0.3, 0.68, 0.05);
    mk(sphere(0.19), M(0xffffff, { roughness: 0.2 }), head, s * 0.3, 0.7, 0.14);
    dotEye(head, s * 0.3, 0.7, 0.31, 0.075);
    blush(head, s * 0.48, 0.25, 0.4, 0.08);
  }
  const sm = smallSmile(head, 0, 0.3, 0.555, 0.2, 0xd8302a);
  sm.scale.set(1, 0.5, 1);
  R.h = 2.0; R.stepRate = 12;
  return R;
}

/* ============================================================
   Pompompurin: perrito amarillo con boina café y orejas caídas.
   ============================================================ */
export function makePurin() {
  const R = rig('Pompompurin');
  const b = R.body;
  const yellow = M(0xf8d870, { roughness: 0.55 }), brown = M(0x7a4a24, { roughness: 0.6 });
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.22, 0.32, 0);
    mk(taper(0.12, 0.11, 0.14), yellow, leg);
    mk(sphere(0.15), yellow, leg, 0, -0.24, 0.06).scale.set(1.1, 0.55, 1.3);
    R.legs.push(leg);
  }
  mk(sphere(0.52), yellow, b, 0, 0.65, 0).scale.set(1.08, 0.95, 1.0);
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.45, 0.8, 0.05);
    mk(taper(0.08, 0.07, 0.2), yellow, a);
    mk(sphere(0.09), yellow, a, 0, -0.27, 0);
    a.rotation.z = a.userData.bz = s * 0.55;
    R.arms.push(a);
  }
  const head = R.head = pivot(b, 0, 1.05, 0);
  mk(sphere(0.6, 36, 28), yellow, head, 0, 0.45, 0).scale.set(1.18, 0.92, 1.0);
  for (const s of [-1, 1]) {
    const ear = mk(sphere(0.24), brown, head, s * 0.66, 0.42, 0.05);
    ear.scale.set(0.45, 1.15, 0.75);
    ear.rotation.z = s * 0.25;
    dotEye(head, s * 0.2, 0.48, 0.55, 0.06);
  }
  mk(sphere(0.05), brown, head, 0, 0.38, 0.6).scale.set(1.3, 0.9, 0.7);
  smallSmile(head, 0, 0.3, 0.55, 0.05, 0x5a3014);
  const beret = pivot(head, 0.05, 0.98, 0.0);
  beret.rotation.z = -0.15;
  mk(sphere(0.34), brown, beret).scale.set(1.15, 0.35, 1.1);
  mk(cyl(0.025, 0.03, 0.1, 8), brown, beret, 0, 0.14, 0);
  R.h = 2.2; R.stepRate = 11;
  return R;
}

/* ============================================================
   Cinnamoroll: perrito blanco de orejas larguísimas, ojos azules
   y colita enrollada como un rollo de canela.
   ============================================================ */
export function makeCinna() {
  const R = rig('Cinnamoroll');
  const b = R.body;
  const white = WHITE();
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.17, 0.3, 0);
    mk(taper(0.1, 0.09, 0.14), white, leg);
    mk(sphere(0.13), white, leg, 0, -0.22, 0.05).scale.set(1.1, 0.55, 1.3);
    R.legs.push(leg);
  }
  mk(sphere(0.42), white, b, 0, 0.62, 0).scale.set(1, 1.0, 0.95);
  const curl = mk(new THREE.TorusGeometry(0.12, 0.06, 10, 24), white, b, 0, 0.75, -0.42);
  curl.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.36, 0.78, 0.05);
    mk(taper(0.07, 0.06, 0.18), white, a);
    mk(sphere(0.08), white, a, 0, -0.24, 0);
    a.rotation.z = a.userData.bz = s * 0.55;
    R.arms.push(a);
  }
  const head = R.head = pivot(b, 0, 0.98, 0);
  mk(sphere(0.55, 36, 28), white, head, 0, 0.42, 0).scale.set(1.18, 0.9, 1.0);
  for (const s of [-1, 1]) {
    const ear = pivot(head, s * 0.42, 0.72, 0.0);
    ear.rotation.z = -s * 2.3;
    const e = mk(new THREE.CapsuleGeometry(0.17, 0.75, 8, 16), white, ear, 0, 0.45, 0);
    e.scale.z = 0.45;
    dotEye(head, s * 0.2, 0.42, 0.5, 0.07, 0x3b6fd6);
    blush(head, s * 0.36, 0.3, 0.44);
  }
  smallSmile(head, 0, 0.3, 0.52, 0.045, 0x7a3040);
  R.h = 1.9; R.stepRate = 12;
  return R;
}

/* ============================================================
   Pochacco: perrito blanco con orejas negras caídas.
   ============================================================ */
export function makePochacco() {
  const R = rig('Pochacco');
  const white = WHITE(), black = M(0x222222, { roughness: 0.5 });
  chibiBody(R, { fur: white, dress: M(0x5ab0f0, { roughness: 0.5 }), collar: M(0xffd23f) });
  const head = R.head = pivot(R.body, 0, 1.1, 0);
  mk(sphere(0.55, 36, 28), white, head, 0, 0.48, 0).scale.set(1.1, 0.98, 1.0);
  for (const s of [-1, 1]) {
    const ear = mk(new THREE.CapsuleGeometry(0.15, 0.4, 8, 14), black, head, s * 0.56, 0.5, 0.0);
    ear.rotation.z = s * 0.25;
    ear.scale.z = 0.5;
    dotEye(head, s * 0.18, 0.52, 0.5, 0.06);
  }
  mk(sphere(0.06), black, head, 0, 0.4, 0.55).scale.set(1.3, 1, 0.8);
  smallSmile(head, 0, 0.3, 0.51, 0.05, 0x5a1a1a);
  R.h = 2.2; R.stepRate = 11;
  return R;
}
