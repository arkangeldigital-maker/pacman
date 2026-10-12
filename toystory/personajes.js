// Personajes de Toy Story: La Gran Aventura.
// Son figuras propias modeladas con formas de Three.js (no usan modelos ni
// imágenes de la película), con las proporciones, caras y trajes de cada uno.
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
const plaidTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f2bf2a'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.5; g.fillStyle = '#e0602a';
  for (let i = 0; i < 2; i++) { g.fillRect(i * 64 + 6, 0, 12, h); g.fillRect(0, i * 64 + 6, w, 12); }
  g.globalAlpha = 0.6; g.fillStyle = '#b8231c';
  for (let i = 0; i < 2; i++) { g.fillRect(i * 64 + 34, 0, 4, h); g.fillRect(0, i * 64 + 34, w, 4); }
  g.globalAlpha = 0.25; g.fillStyle = '#7a3a10';
  for (let i = 0; i < 4; i++) { g.fillRect(i * 32 + 24, 0, 2, h); g.fillRect(0, i * 32 + 24, w, 2); }
}, [4, 3]);
function cowTex(spot, repeat) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, w, h);
    g.fillStyle = spot;
    [[40, 50, 30], [160, 28, 22], [214, 124, 32], [92, 156, 28], [28, 226, 20], [176, 222, 26], [120, 92, 14], [240, 30, 12]].forEach(([x, y, r], i) => blob(g, x, y, r, i));
  }, repeat);
}
const cowVest = cowTex('#18130f', [2, 1]);
const cowChaps = cowTex('#18130f', [2, 1]);
const hairTex = (base, line) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.strokeStyle = line; g.globalAlpha = 0.35; g.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const x = (i * 37) % w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.6, x + 4, h); g.stroke(); }
}, [3, 2]);
const woodyHairTex = hairTex('#5e3417', '#2e1606');
const jessieHairTex = hairTex('#c43a22', '#7e1a0c');
export const frogScreenTex = canvasTex(256, 320, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#1d5c34'); grd.addColorStop(1, '#0d2e1a');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff8fb1'; g.globalAlpha = .7;
  g.beginPath(); g.arc(60, 150, 24, 0, TAU); g.fill();
  g.beginPath(); g.arc(196, 150, 24, 0, TAU); g.fill();
  g.globalAlpha = 1; g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.arc(128, 120, 64, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  ['#ffd23f', '#5ec4f2', '#ff6b5e', '#9b7ad8'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.roundRect(26 + i * 54, 248, 42, 42, 10); g.fill(); });
});

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
// Ala de sombrero vaquero: aro con los lados levantados
function brimGeo(rIn, rOut, curl = 0.16, dip = 0.03) {
  const g = new THREE.RingGeometry(rIn, rOut, 48, 4);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), t = Math.max(0, (Math.hypot(x, z) - rIn) / (rOut - rIn));
    const side = Math.pow(Math.abs(x) / rOut, 2);
    p.setY(i, curl * side * t * t - dip * (1 - side) * t);
  }
  g.computeVertexNormals();
  return g;
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
const shinyGold = M(0xf2c84b, { metalness: 0.7, roughness: 0.25 });

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
// Ceja arqueada
function brow(parent, x, y, z, w, thick, mat, rz = 0, arch = 0.6) {
  const m = mk(new THREE.TorusGeometry(w / 2, thick, 8, 16, arch * Math.PI), mat, parent, x, y, z);
  m.rotation.z = Math.PI / 2 - arch * Math.PI / 2 + rz;
  m.scale.set(1, 0.6, 1);
  return m;
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
function cowboyBoot(ankle, mat, s, { r = 0.115, h = 0.36, len = 0.27 } = {}) {
  mk(cyl(r * 1.18, r, h), mat, ankle, 0, -h / 2 + 0.06, 0);
  mk(new THREE.TorusGeometry(r * 1.12, 0.018, 6, 20), mat, ankle, 0, 0.06, 0).rotation.x = Math.PI / 2;
  const toe = mk(sphere(r * 1.05), mat, ankle, 0, -h + 0.1, len * 0.45);
  toe.scale.set(0.95, 0.75, 1.9);
  mk(box(r * 1.7, 0.05, len * 1.25), M(0x3a1d0c), ankle, 0, -h + 0.02, len * 0.32);
  mk(box(r * 1.5, 0.12, 0.14), M(0x3a1d0c), ankle, 0, -h + 0.06, -0.04);
}

/* ============================================================
   Woody: vaquero alto y delgado, sombrero café, camisa de cuadros,
   chaleco de vaca, paliacate rojo, estrella de sheriff y botas.
   ============================================================ */
export function makeWoody() {
  const R = rig('Woody');
  const b = R.body;
  const jeans = M(0x2f62b0, { roughness: 0.8 }), boot = M(0x7a4220, { roughness: 0.45 }), skin = M(0xf2c29a, { roughness: 0.5 });
  const plaid = texM(plaidTex, { roughness: 0.8 });
  const hair = texM(woodyHairTex, { roughness: 0.7 });
  const hatM = M(0xa0662f, { roughness: 0.7 }), hatBand = M(0x4b2a12);
  for (const s of [-1, 1]) {
    const L = leg2(R, b, s * 0.12, 1.25, { r1: 0.115, r2: 0.098, r3: 0.088, l1: 0.43, l2: 0.38, mat1: jeans });
    cowboyBoot(L.ankle, boot, s);
  }
  mk(lathe([[0.0, 1.12], [0.17, 1.14], [0.21, 1.22], [0.205, 1.34]]), jeans, b).scale.z = 0.8;
  mk(cyl(0.212, 0.212, 0.075), M(0x4a2610), b, 0, 1.33, 0).scale.z = 0.8;
  mk(box(0.13, 0.085, 0.03), shinyGold, b, 0, 1.33, 0.17);
  const torso = [[0.2, 1.3], [0.21, 1.45], [0.245, 1.66], [0.24, 1.82], [0.17, 1.95], [0.07, 2.0], [0.0, 2.0]];
  mk(lathe(torso), plaid, b).scale.z = 0.78;
  const vest = mk(lathe([[0.214, 1.4], [0.224, 1.5], [0.262, 1.68], [0.256, 1.82], [0.19, 1.93]], 32, 0.55, TAU - 1.1), texM(cowVest, { side: THREE.DoubleSide, roughness: 0.85 }), b);
  vest.scale.z = 0.8;
  const badge = mk(starGeo, shinyGold, b, 0.135, 1.7, 0.175);
  badge.scale.setScalar(0.13); badge.rotation.y = 0.5;
  mk(new THREE.TorusGeometry(0.035, 0.012, 6, 14), M(0xffffff), b, 0, 1.62, -0.2);
  // cuello, paliacate y cuello de la camisa
  mk(cyl(0.065, 0.07, 0.2), skin, b, 0, 2.05, 0.01);
  mk(new THREE.TorusGeometry(0.085, 0.035, 8, 20), M(0xd42d26), b, 0, 1.99, 0.01).rotation.x = Math.PI / 2;
  const knot = mk(cone(0.075, 0.13, 3), M(0xd42d26), b, 0, 1.92, 0.1);
  knot.rotation.set(Math.PI + 0.3, 0, 0);
  for (const s of [-1, 1]) {
    const col = mk(cone(0.06, 0.12, 3), plaid, b, s * 0.07, 1.97, 0.13);
    col.rotation.set(Math.PI - 0.6, 0, s * 0.5);
  }
  // brazos largos
  for (const s of [-1, 1]) {
    const A = arm2(R, b, s, 0.25, 1.9, 0, { r1: 0.078, r2: 0.066, r3: 0.058, l1: 0.37, l2: 0.33, mat1: plaid, spread: 0.2, bend: 0.3 });
    mk(cyl(0.065, 0.065, 0.06), plaid, A.wr, 0, 0.02, 0);
    hand(A.wr, -0.02, 0.075, skin, s);
  }
  // cabeza alargada
  const head = R.head = pivot(b, 0, 2.1, 0.01);
  mk(lathe([[0, 0.0], [0.11, 0.03], [0.175, 0.1], [0.215, 0.2], [0.25, 0.32], [0.258, 0.45], [0.235, 0.58], [0.17, 0.68], [0.08, 0.73], [0, 0.745]]), skin, head).scale.set(0.95, 1, 0.95);
  for (const s of [-1, 1]) {
    mk(sphere(0.075), skin, head, s * 0.24, 0.36, -0.02).scale.set(0.45, 1, 0.8);
    eye(head, s * 0.095, 0.42, 0.2, 0.066, { iris: 0x6b3a1a, lid: skin, lidTilt: 0.15, ry: s * 0.18 });
    brow(head, s * 0.1, 0.505, 0.235, 0.13, 0.017, M(0x4a240e), -s * 0.12);
  }
  mk(sphere(0.05), skin, head, 0, 0.33, 0.245).scale.set(0.85, 1.15, 1.2);
  mouth(head, 0, 0.215, 0.214, 0.19, 0.075, 0.2);
  // pelo
  const hr = mk(sphere(0.3), hair, head, 0, 0.46, -0.075);
  hr.scale.set(0.9, 1.1, 0.96);
  for (const s of [-1, 1]) mk(sphere(0.07), hair, head, s * 0.22, 0.42, -0.03).scale.set(0.5, 1.2, 1);
  // sombrero
  const hat = pivot(head, 0, 0.66, -0.02);
  hat.rotation.x = -0.14;
  mk(brimGeo(0.2, 0.52, 0.17, 0.04), M(0xa0662f, { roughness: 0.7, side: THREE.DoubleSide }), hat).scale.z = 0.92;
  const crown = mk(lathe([[0.235, 0.0], [0.245, 0.1], [0.225, 0.22], [0.17, 0.29], [0.08, 0.3], [0.0, 0.28]]), hatM, hat);
  crown.scale.set(0.92, 1, 1.05);
  mk(cyl(0.232, 0.24, 0.05), hatBand, hat, 0, 0.03, 0).scale.set(0.93, 1, 1.05);
  R.h = 3.0;
  return R;
}

/* ============================================================
   Buzz: guardián espacial de pecho ancho, traje blanco con verde
   y morado, capucha morada, barbilla grande, casco y alas.
   ============================================================ */
export function makeBuzz() {
  const R = rig('Buzz');
  const b = R.body;
  const white = M(0xf4f4ef, { roughness: 0.3 }), green = M(0x74c043, { roughness: 0.35 }), purple = M(0x6d43b3, { roughness: 0.4 });
  const lav = M(0x8c6bd0, { roughness: 0.5 }), skin = M(0xf0c09a, { roughness: 0.5 }), gray = M(0xc7ccd3, { metalness: 0.2, roughness: 0.3 });
  for (const s of [-1, 1]) {
    const L = leg2(R, b, s * 0.15, 1.2, { r1: 0.135, r2: 0.12, r3: 0.11, l1: 0.4, l2: 0.32, mat1: white });
    const plate = mk(new THREE.CylinderGeometry(0.15, 0.135, 0.24, 20, 1, false, -1.2, 2.4), green, L.hip, 0, -0.17, 0);
    plate.material = M(0x74c043, { roughness: 0.35, side: THREE.DoubleSide });
    mk(sphere(0.07), purple, L.knee, 0, 0, 0.09).scale.set(1.2, 1, 0.6);
    mk(cyl(0.13, 0.12, 0.28), white, L.ankle, 0, -0.1, 0);
    const foot = mk(sphere(0.15), white, L.ankle, 0, -0.32, 0.06);
    foot.scale.set(1, 0.65, 1.55);
    mk(box(0.26, 0.05, 0.44), purple, L.ankle, 0, -0.43, 0.06);
    mk(box(0.24, 0.04, 0.04), green, L.ankle, 0, -0.2, 0.13);
  }
  mk(lathe([[0.0, 1.08], [0.19, 1.1], [0.215, 1.2], [0.2, 1.32]]), white, b).scale.z = 0.8;
  mk(cyl(0.212, 0.218, 0.09), purple, b, 0, 1.27, 0).scale.z = 0.8;
  mk(lathe([[0.19, 1.3], [0.2, 1.38], [0.235, 1.46]]), white, b).scale.z = 0.78;
  const chest = [[0.23, 1.42], [0.34, 1.56], [0.39, 1.74], [0.36, 1.9], [0.25, 2.02], [0.12, 2.06], [0.0, 2.06]];
  mk(lathe(chest), white, b).scale.z = 0.72;
  mk(lathe([[0.378, 1.83], [0.37, 1.9], [0.258, 2.025], [0.124, 2.068], [0.0, 2.07]]), green, b).scale.z = 0.73;
  mk(new THREE.TorusGeometry(0.375, 0.018, 6, 40), purple, b, 0, 1.82, 0).rotation.x = Math.PI / 2;
  b.children[b.children.length - 1].scale.set(1, 0.72, 1);
  // panel de control del pecho
  const panel = pivot(b, 0, 1.64, 0.27);
  panel.rotation.x = -0.12;
  mk(box(0.24, 0.18, 0.04), gray, panel);
  [[0xe23b2e, -0.06, 0.035], [0x3fae49, 0.0, 0.035], [0x2f64c9, 0.06, 0.035], [0xe23b2e, -0.06, -0.035], [0xffffff, 0.03, -0.035]].forEach(([c, x, y]) => {
    const btn = mk(cyl(0.022, 0.022, 0.025, 12), M(c, { emissive: c, emissiveIntensity: 0.35 }), panel, x, y, 0.025);
    btn.rotation.x = Math.PI / 2;
  });
  mk(box(0.11, 0.06, 0.03), purple, b, -0.2, 1.78, 0.235).rotation.y = -0.5;
  // mochila y alas
  mk(box(0.4, 0.42, 0.16), white, b, 0, 1.72, -0.27);
  mk(cyl(0.035, 0.035, 0.03, 12), M(0xe23b2e), b, -0.1, 1.85, -0.36).rotation.x = Math.PI / 2;
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.04); wingShape.lineTo(0.7, 0.12); wingShape.lineTo(0.86, 0.1); wingShape.lineTo(0.86, -0.02);
  wingShape.lineTo(0.2, -0.14); wingShape.lineTo(0, -0.1); wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  const tipShape = new THREE.Shape();
  tipShape.moveTo(0.7, 0.12); tipShape.lineTo(0.86, 0.1); tipShape.lineTo(0.86, -0.02); tipShape.lineTo(0.66, -0.0); tipShape.closePath();
  const tipGeo = new THREE.ExtrudeGeometry(tipShape, { depth: 0.045, bevelEnabled: false });
  const stripeShape = new THREE.Shape();
  stripeShape.moveTo(0.1, 0.0); stripeShape.lineTo(0.55, 0.05); stripeShape.lineTo(0.55, 0.0); stripeShape.lineTo(0.1, -0.05); stripeShape.closePath();
  const stripeGeo = new THREE.ExtrudeGeometry(stripeShape, { depth: 0.045, bevelEnabled: false });
  for (const s of [-1, 1]) {
    const w = pivot(b, s * 0.17, 1.82, -0.36);
    w.scale.x = s;
    w.rotation.z = s * 0.45;
    mk(wingGeo, M(0xf4f4ef, { roughness: 0.3, side: THREE.DoubleSide }), w, 0, 0, -0.02);
    mk(tipGeo, M(0xe23b2e, { side: THREE.DoubleSide }), w, 0, 0, -0.025);
    mk(stripeGeo, M(0x74c043, { side: THREE.DoubleSide }), w, 0, 0, -0.025);
  }
  // brazos
  for (const s of [-1, 1]) {
    const A = arm2(R, b, s, 0.37, 1.86, 0, { r1: 0.1, r2: 0.088, r3: 0.085, l1: 0.33, l2: 0.27, mat1: white, spread: 0.24, bend: 0.3 });
    mk(sphere(0.135), white, A.sh, 0, 0.0, 0);
    mk(new THREE.SphereGeometry(0.14, 20, 10, 0, TAU, 0, Math.PI * 0.45), green, A.sh, 0, 0.0, 0);
    mk(cyl(0.105, 0.1, 0.12), green, A.wr, 0, 0.05, 0);
    if (s < 0) mk(box(0.06, 0.04, 0.08), M(0xe23b2e, { emissive: 0xe23b2e, emissiveIntensity: 0.4 }), A.wr, 0, 0.1, 0.1);
    hand(A.wr, -0.02, 0.085, lav, s);
  }
  mk(new THREE.TorusGeometry(0.15, 0.055, 10, 24), purple, b, 0, 2.06, 0.01).rotation.x = Math.PI / 2;
  // cabeza
  const head = R.head = pivot(b, 0, 2.06, 0.02);
  mk(sphere(0.28), purple, head, 0, 0.34, -0.04).scale.set(1, 1.12, 1);
  mk(lathe([[0, 0.05], [0.13, 0.07], [0.2, 0.14], [0.222, 0.24], [0.21, 0.36], [0.18, 0.46], [0.11, 0.53], [0, 0.56]]), skin, head, 0, 0, 0.09).scale.set(1, 1, 0.9);
  mk(box(0.006, 0.05, 0.02), M(0xc98d6c), head, 0, 0.13, 0.255);
  for (const s of [-1, 1]) {
    eye(head, s * 0.082, 0.39, 0.235, 0.058, { iris: 0x6b4fa0, lid: skin, lidTilt: 0.2, ry: s * 0.2 });
    const br = mk(new THREE.CapsuleGeometry(0.018, 0.08, 4, 8), M(0x1d140e), head, s * 0.088, 0.46, 0.255);
    br.rotation.z = Math.PI / 2 + s * 0.22;
    const ear = mk(cyl(0.085, 0.085, 0.07), purple, head, s * 0.27, 0.34, -0.02);
    ear.rotation.z = Math.PI / 2;
    mk(new THREE.TorusGeometry(0.075, 0.018, 8, 20), green, head, s * 0.305, 0.34, -0.02).rotation.y = Math.PI / 2;
  }
  mk(sphere(0.04), skin, head, 0, 0.32, 0.28).scale.set(0.9, 1.1, 1.1);
  mouth(head, 0.01, 0.225, 0.288, 0.14, 0.05, 0.2, { tongue: false });
  const helmet = new THREE.Mesh(sphere(0.42, 40, 28), new THREE.MeshStandardMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0.14, roughness: 0.02, metalness: 0.3, depthWrite: false }));
  helmet.position.set(0, 0.36, 0.05);
  head.add(helmet);
  R.h = 3.0;
  return R;
}

/* ============================================================
   Jessie: vaquera con sombrero rojo, trenza pelirroja con moño
   amarillo, camisa blanca y amarilla, chaparreras de vaca.
   ============================================================ */
export function makeJessie() {
  const R = rig('Jessie');
  const b = R.body;
  const jeans = M(0x2f62b0, { roughness: 0.8 }), boot = M(0x7a4220, { roughness: 0.45 }), skin = M(0xf6c8a3, { roughness: 0.5 });
  const hair = texM(jessieHairTex, { roughness: 0.65 }), red = M(0xd8302a, { roughness: 0.55 });
  const white = M(0xfbf8f1, { roughness: 0.7 }), yellow = M(0xf4c22f, { roughness: 0.6 });
  const chaps = texM(cowChaps, { roughness: 0.85 });
  for (const s of [-1, 1]) {
    const L = leg2(R, b, s * 0.11, 1.22, { r1: 0.105, r2: 0.088, r3: 0.08, l1: 0.42, l2: 0.37, mat1: jeans });
    mk(taper(0.125, 0.105, 0.4), chaps, L.hip);
    mk(taper(0.108, 0.098, 0.3), chaps, L.knee);
    cowboyBoot(L.ankle, boot, s, { r: 0.1, h: 0.33, len: 0.24 });
  }
  mk(lathe([[0.0, 1.1], [0.16, 1.12], [0.2, 1.2], [0.195, 1.32]]), jeans, b).scale.z = 0.8;
  mk(cyl(0.2, 0.2, 0.07), M(0x4a2610), b, 0, 1.31, 0).scale.z = 0.8;
  mk(box(0.12, 0.08, 0.03), shinyGold, b, 0, 1.31, 0.16);
  const torso = [[0.19, 1.28], [0.19, 1.42], [0.23, 1.64], [0.225, 1.8], [0.16, 1.92], [0.07, 1.97], [0.0, 1.97]];
  mk(lathe(torso), white, b).scale.z = 0.78;
  mk(lathe([[0.233, 1.74], [0.23, 1.8], [0.166, 1.925], [0.074, 1.975], [0.0, 1.98]]), yellow, b).scale.z = 0.79;
  mk(new THREE.TorusGeometry(0.232, 0.014, 6, 40), red, b, 0, 1.74, 0).scale.set(1, 0.79, 1);
  b.children[b.children.length - 1].rotation.x = Math.PI / 2;
  for (let k = 0; k < 3; k++) mk(sphere(0.014), red, b, 0, 1.68 - k * 0.09, 0.185);
  for (const s of [-1, 1]) {
    const A = arm2(R, b, s, 0.23, 1.86, 0, { r1: 0.078, r2: 0.062, r3: 0.055, l1: 0.35, l2: 0.3, mat1: white, spread: 0.2, bend: 0.35 });
    mk(sphere(0.08), white, A.sh).scale.set(1, 0.9, 1);
    mk(cyl(0.068, 0.064, 0.09), yellow, A.wr, 0, 0.04, 0);
    mk(new THREE.TorusGeometry(0.066, 0.01, 6, 16), red, A.wr, 0, 0.085, 0).rotation.x = Math.PI / 2;
    hand(A.wr, -0.02, 0.068, skin, s);
  }
  mk(cyl(0.06, 0.065, 0.18), skin, b, 0, 2.02, 0.01);
  const head = R.head = pivot(b, 0, 2.05, 0.01);
  mk(lathe([[0, 0.0], [0.12, 0.04], [0.19, 0.12], [0.245, 0.25], [0.265, 0.4], [0.245, 0.55], [0.18, 0.65], [0.08, 0.7], [0, 0.71]]), skin, head).scale.set(1, 1, 0.95);
  for (const s of [-1, 1]) {
    mk(sphere(0.065), skin, head, s * 0.26, 0.33, -0.02).scale.set(0.45, 1, 0.8);
    eye(head, s * 0.1, 0.38, 0.198, 0.078, { iris: 0x2f9a48, lid: skin, lidTilt: -0.05, ry: s * 0.2, lashes: true });
    brow(head, s * 0.105, 0.475, 0.24, 0.12, 0.012, M(0x9a2a18), -s * 0.08);
    mk(sphere(0.04), M(0xf6b4a8, { roughness: 0.6 }), head, s * 0.16, 0.28, 0.2).scale.set(1, 0.6, 0.3);
  }
  mk(sphere(0.038), skin, head, 0, 0.3, 0.25).scale.set(0.9, 1, 1.1);
  mouth(head, 0, 0.205, 0.21, 0.17, 0.072, 0.21);
  // pelo, flequillo y trenza
  mk(sphere(0.3), hair, head, 0, 0.45, -0.085).scale.set(0.97, 1.08, 0.98);
  for (let k = -2; k <= 2; k++) {
    const bang = mk(sphere(0.075), hair, head, k * 0.07, 0.575, 0.205 - Math.abs(k) * 0.04);
    bang.scale.set(0.95, 0.6, 0.6);
  }
  for (const s of [-1, 1]) mk(sphere(0.08), hair, head, s * 0.24, 0.36, -0.04).scale.set(0.5, 1.4, 0.9);
  const braid = new THREE.CatmullRomCurve3([new V3(0, 0.3, -0.28), new V3(0.02, 0.05, -0.36), new V3(0.04, -0.25, -0.3), new V3(0.02, -0.55, -0.27)]);
  for (let k = 0; k <= 9; k++) {
    const p = braid.getPoint(k / 9);
    const seg = mk(sphere(0.07 - k * 0.0035), hair, head, p.x + (k % 2 ? 0.015 : -0.015), p.y, p.z);
    seg.scale.set(1, 1.35, 0.85);
    seg.rotation.z = k % 2 ? 0.4 : -0.4;
  }
  const end = braid.getPoint(1);
  for (const s of [-1, 1]) {
    const bow = mk(cone(0.06, 0.12, 12), yellow, head, end.x + s * 0.06, end.y - 0.02, end.z - 0.02);
    bow.rotation.z = s * Math.PI / 2;
  }
  mk(sphere(0.03), yellow, head, end.x, end.y - 0.02, end.z - 0.02);
  const tuft = mk(cone(0.05, 0.14, 10), hair, head, end.x, end.y - 0.12, end.z);
  tuft.rotation.x = Math.PI;
  // sombrero rojo echado hacia atrás
  const hat = pivot(head, 0, 0.6, -0.06);
  hat.rotation.set(-0.38, 0, 0.06);
  mk(brimGeo(0.19, 0.48, 0.14, 0.03), M(0xd8302a, { roughness: 0.55, side: THREE.DoubleSide }), hat).scale.z = 0.92;
  mk(lathe([[0.22, 0.0], [0.23, 0.1], [0.21, 0.21], [0.16, 0.27], [0.07, 0.28], [0.0, 0.26]]), red, hat).scale.set(0.92, 1, 1.05);
  mk(cyl(0.218, 0.225, 0.04), white, hat, 0, 0.03, 0).scale.set(0.93, 1, 1.05);
  R.h = 2.95;
  return R;
}

/* ============================================================
   Rex: dinosaurio verde, cabezón y nervioso, con brazos cortitos.
   ============================================================ */
export function makeRex() {
  const R = rig('Rex');
  const b = R.body;
  const g = M(0x6dbd3c, { roughness: 0.4 }), belly = M(0xd3e58a, { roughness: 0.5 }), spike = M(0x8a5fc4, { roughness: 0.4 });
  for (const s of [-1, 1]) {
    const hip = pivot(b, s * 0.32, 1.0, -0.05);
    mk(sphere(0.3), g, hip, 0, -0.05, 0).scale.set(0.9, 1.15, 1.05);
    mk(taper(0.19, 0.15, 0.45), g, hip, 0, -0.2, 0.03);
    const foot = mk(sphere(0.18), g, hip, 0, -0.78, 0.1);
    foot.scale.set(1.05, 0.55, 1.5);
    for (let k = -1; k <= 1; k++) {
      const c = mk(cone(0.035, 0.08, 8), M(0xffffff), hip, k * 0.07, -0.82, 0.36);
      c.rotation.x = Math.PI / 2;
    }
    R.legs.push(hip);
  }
  mk(lathe([[0.0, 0.7], [0.42, 0.78], [0.6, 1.08], [0.58, 1.45], [0.44, 1.85], [0.3, 2.15], [0.25, 2.3]]), g, b).scale.z = 0.9;
  mk(lathe([[0.42, 0.82], [0.6, 1.08], [0.58, 1.45], [0.43, 1.85], [0.29, 2.12]].map(([r, y]) => [r + 0.025, y]), 24, -0.95, 1.9), belly, b).scale.z = 0.9;
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.42, 1.78, 0.32);
    mk(taper(0.065, 0.055, 0.16), g, a);
    const fa = pivot(a, 0, -0.16, 0);
    fa.rotation.x = -1.0;
    mk(taper(0.055, 0.045, 0.12), g, fa);
    for (let k = -1; k <= 1; k += 2) mk(cone(0.02, 0.06, 6), M(0xffffff), fa, k * 0.025, -0.2, 0).rotation.x = Math.PI;
    a.userData.bz = s * 0.25;
    R.arms.push(a);
  }
  // cola
  const tail = new THREE.CatmullRomCurve3([new V3(0, 1.0, -0.45), new V3(0, 0.75, -0.9), new V3(0, 0.55, -1.3), new V3(0, 0.5, -1.65)]);
  for (let k = 0; k <= 10; k++) {
    const p = tail.getPoint(k / 10);
    mk(sphere(0.36 - k * 0.03), g, b, p.x, p.y, p.z);
    if (k % 2 === 0 && k < 10) {
      const sp = mk(cone(0.08 - k * 0.005, 0.2, 8), spike, b, 0, p.y + 0.32 - k * 0.028, p.z);
      sp.rotation.x = -0.6;
    }
  }
  [[2.2, -0.25], [1.95, -0.42], [1.65, -0.55], [1.35, -0.6]].forEach(([y, z], i) => {
    const sp = mk(cone(0.1, 0.24, 8), spike, b, 0, y, z);
    sp.rotation.x = -0.4 - i * 0.2;
  });
  // cabeza grande con mandíbula
  const head = R.head = pivot(b, 0, 2.3, 0.18);
  mk(sphere(0.4), g, head, 0, 0.2, 0.3).scale.set(1, 0.8, 1.5);
  mk(sphere(0.36), g, head, 0, 0.0, 0.33).scale.set(0.97, 0.52, 1.45);
  for (const s of [-1, 1]) {
    mk(sphere(0.12), g, head, s * 0.19, 0.38, 0.38);
    eye(head, s * 0.19, 0.4, 0.44, 0.1, { iris: 0x3a2516, lid: g, lidTilt: -0.1, ry: s * 0.35 });
    const br = mk(new THREE.CapsuleGeometry(0.025, 0.1, 4, 8), M(0x3f8a22), head, s * 0.17, 0.53, 0.47);
    br.rotation.z = Math.PI / 2 - s * 0.35;
    mk(sphere(0.025), M(0x2a5a14), head, s * 0.08, 0.24, 0.87);
  }
  const m = mouth(head, 0, 0.1, 0.84, 0.4, 0.1, 0.32, { tongue: false, color: 0x7a1e18 });
  m.rotation.x = -0.5;
  R.h = 3.0; R.stepRate = 7;
  return R;
}

/* ============================================================
   Hamm: cerdito alcancía rosa, con ranura y corcho.
   ============================================================ */
export function makeHamm() {
  const R = rig('Hamm');
  const b = R.body;
  const pink = M(0xf4a2b6, { roughness: 0.25, metalness: 0.05 }), dark = M(0xd5738e, { roughness: 0.3 });
  for (const [x, z] of [[-0.33, 0.45], [0.33, 0.45], [-0.33, -0.45], [0.33, -0.45]]) {
    const leg = pivot(b, x, 0.48, z);
    mk(taper(0.13, 0.12, 0.3), pink, leg);
    mk(cyl(0.12, 0.12, 0.06), dark, leg, 0, -0.39, 0);
    R.legs.push(leg);
  }
  mk(sphere(0.7, 40, 28), pink, b, 0, 0.98, 0).scale.set(1, 0.92, 1.25);
  const sn = mk(cyl(0.21, 0.24, 0.18, 28), pink, b, 0, 1.0, 0.9);
  sn.rotation.x = Math.PI / 2;
  const tip = mk(cyl(0.2, 0.2, 0.02, 28), M(0xf7b3c4, { roughness: 0.3 }), b, 0, 1.0, 0.99);
  tip.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    mk(sphere(0.045), M(0x7a3048), b, s * 0.075, 1.0, 1.0).scale.set(0.8, 1.2, 0.5);
    eye(b, s * 0.24, 1.32, 0.64, 0.085, { iris: 0x3a2516, lid: pink, lidTilt: 0.55, ry: s * 0.35 });
    const br = mk(new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), dark, b, s * 0.24, 1.44, 0.66);
    br.rotation.z = Math.PI / 2 + s * 0.3;
    const ear = mk(cone(0.15, 0.24, 14), pink, b, s * 0.32, 1.55, 0.38);
    ear.rotation.set(0.75, 0, -s * 0.35);
    ear.scale.z = 0.45;
  }
  const m = mouth(b, 0, 0.8, 0.86, 0.22, 0.06, 0.6, { teeth: false, tongue: false, color: 0x7a3048 });
  m.rotation.x = -0.5;
  mk(box(0.42, 0.04, 0.08), M(0x1c1c1c), b, 0, 1.6, -0.05);
  mk(cyl(0.12, 0.13, 0.08), M(0xd9b47a, { roughness: 0.9 }), b, 0, 0.36, 0);
  const tl = mk(new THREE.TorusGeometry(0.07, 0.025, 8, 20, Math.PI * 1.6), pink, b, 0, 1.05, -0.9);
  tl.rotation.y = Math.PI / 2;
  R.h = 1.7; R.stepRate = 12;
  return R;
}

/* ============================================================
   Slinky: perro salchicha con resorte en la panza.
   ============================================================ */
export function makeSlinky() {
  const R = rig('Slinky');
  const b = R.body;
  const tan = M(0xc98d4a, { roughness: 0.6 }), light = M(0xe9c18a, { roughness: 0.6 }), dark = M(0x4a2a14, { roughness: 0.6 });
  const metal = M(0xd2d7de, { metalness: 0.9, roughness: 0.22 });
  for (const [x, z] of [[-0.14, 0.55], [0.14, 0.55], [-0.14, -0.72], [0.14, -0.72]]) {
    const leg = pivot(b, x, 0.46, z);
    mk(taper(0.07, 0.065, 0.3), tan, leg);
    mk(sphere(0.08), tan, leg, 0, -0.36, 0.04).scale.set(1, 0.7, 1.3);
    R.legs.push(leg);
  }
  mk(sphere(0.3), tan, b, 0, 0.62, 0.48).scale.set(1, 0.95, 1.1);
  mk(sphere(0.3), tan, b, 0, 0.62, -0.72).scale.set(1, 0.95, 1.1);
  const coil = new THREE.Curve();
  coil.getPoint = (t, out = new V3()) => out.set(Math.cos(t * TAU * 9) * 0.25, 0.62 + Math.sin(t * TAU * 9) * 0.25, 0.25 - t * 0.75);
  mk(new THREE.TubeGeometry(coil, 400, 0.028, 6), metal, b);
  const tl = mk(taper(0.05, 0.02, 0.3), tan, b, 0, 0.82, -0.98);
  tl.rotation.x = -2.3;
  mk(new THREE.TorusGeometry(0.18, 0.035, 8, 20), M(0xe23b2e), b, 0, 0.8, 0.66).rotation.x = 1.2;
  const head = R.head = pivot(b, 0, 1.0, 0.78);
  mk(sphere(0.29), tan, head).scale.set(1, 0.95, 1.05);
  mk(sphere(0.17), light, head, 0, -0.08, 0.27).scale.set(1, 0.8, 1.3);
  mk(sphere(0.07), M(0x111111, { roughness: 0.2 }), head, 0, -0.01, 0.48).scale.set(1.2, 0.9, 1);
  for (const s of [-1, 1]) {
    const ear = mk(new THREE.CapsuleGeometry(0.075, 0.3, 4, 10), dark, head, s * 0.28, -0.08, -0.02);
    ear.rotation.z = s * 0.25;
    ear.scale.z = 0.5;
    eye(head, s * 0.11, 0.09, 0.24, 0.065, { iris: 0x3a2516, lid: tan, lidTilt: 0.05, ry: s * 0.2 });
  }
  const m = mouth(head, 0, -0.14, 0.38, 0.14, 0.05, 0.3, { teeth: false, color: 0x3a1a10 });
  m.rotation.x = -0.4;
  R.h = 1.4; R.stepRate = 13;
  return R;
}

/* ============================================================
   Forky: tenedor-cuchara con ojos saltones, cejas de plastilina
   azul, brazos de limpiapipas rojos y pies de palito.
   ============================================================ */
export function makeForky() {
  const R = rig('Forky');
  const b = R.body;
  const white = M(0xf8f8f4, { roughness: 0.25 }), red = M(0xd8342c, { roughness: 1 }), clay = M(0x3b6fd6, { roughness: 0.9 }), stick = M(0xdcb57a, { roughness: 0.8 });
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.09, 0.66, 0);
    const st = mk(box(0.12, 0.68, 0.035), stick, leg, s * 0.03, -0.32, 0);
    st.rotation.z = -s * 0.1;
    R.legs.push(leg);
  }
  mk(sphere(0.12), clay, b, 0, 0.66, 0).scale.set(1.25, 0.75, 0.75);
  const handle = new THREE.Shape();
  handle.moveTo(-0.08, 0); handle.lineTo(0.08, 0); handle.lineTo(0.06, 0.8); handle.lineTo(-0.06, 0.8); handle.closePath();
  mk(new THREE.ExtrudeGeometry(handle, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2 }), white, b, 0, 0.66, -0.02);
  mk(sphere(0.31, 32, 24), white, b, 0, 1.72, 0.0).scale.set(0.95, 1.15, 0.28);
  for (let i = -1; i <= 1; i++) mk(new THREE.CapsuleGeometry(0.04, 0.18, 4, 8), white, b, i * 0.15, 2.12, 0.0).scale.z = 0.7;
  for (const [x, y, r] of [[-0.12, 1.83, 0.11], [0.13, 1.8, 0.085]]) {
    const e = mk(cyl(r, r, 0.03, 24), M(0xffffff, { roughness: 0.1 }), b, x, y, 0.1);
    e.rotation.x = Math.PI / 2;
    const p = mk(cyl(r * 0.45, r * 0.45, 0.032, 16), M(0x111111), b, x + r * 0.3, y - r * 0.25, 0.112);
    p.rotation.x = Math.PI / 2;
  }
  const brw = mk(new THREE.CapsuleGeometry(0.03, 0.3, 4, 8), clay, b, 0, 1.98, 0.1);
  brw.rotation.z = Math.PI / 2 + 0.08;
  const m = mk(new THREE.TorusGeometry(0.075, 0.025, 8, 16, Math.PI), M(0xd8342c, { roughness: 0.9 }), b, 0, 1.6, 0.09);
  m.rotation.z = Math.PI;
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.08, 1.22, 0.03);
    const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(s * 0.22, 0.08, 0), new V3(s * 0.4, -0.08, 0.02), new V3(s * 0.52, 0.12, 0.04)]);
    mk(new THREE.TubeGeometry(curve, 24, 0.035, 8), red, a);
    a.userData.bz = 0;
    R.arms.push(a);
  }
  R.h = 2.3; R.stepRate = 11;
  return R;
}

/* ============================================================
   Lilypad: tableta con forma de rana.
   ============================================================ */
export function makeLilypad() {
  const R = rig('Lilypad');
  const b = R.body;
  const green = M(0x58c46a, { roughness: 0.35 }), dark = M(0x3a9a50);
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.25, 0.42, 0);
    mk(taper(0.08, 0.075, 0.3), dark, leg);
    mk(sphere(0.12), green, leg, 0, -0.38, 0.08).scale.set(1.3, 0.5, 1.6);
    R.legs.push(leg);
  }
  mk(new THREE.CapsuleGeometry(0.12, 1.0, 6, 12), green, b, -0.43, 1.05, 0);
  mk(new THREE.CapsuleGeometry(0.12, 1.0, 6, 12), green, b, 0.43, 1.05, 0);
  mk(box(0.86, 1.24, 0.24), green, b, 0, 1.05, 0);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.98), new THREE.MeshStandardMaterial({ map: frogScreenTex, emissive: 0xffffff, emissiveMap: frogScreenTex, emissiveIntensity: 0.6, roughness: 0.2 }));
  scr.position.set(0, 1.04, 0.125);
  b.add(scr);
  for (const s of [-1, 1]) {
    mk(sphere(0.2), green, b, s * 0.28, 1.7, 0.02);
    eye(b, s * 0.28, 1.74, 0.15, 0.11, { iris: 0x2a1d14, lid: green, lidTilt: -0.2 });
    const A = arm2(R, b, s, 0.55, 1.3, 0, { r1: 0.06, r2: 0.055, r3: 0.05, l1: 0.2, l2: 0.18, mat1: dark, spread: 0.3, bend: 0.3 });
    hand(A.wr, 0, 0.07, green, s);
  }
  R.h = 2.0; R.stepRate = 10;
  return R;
}
