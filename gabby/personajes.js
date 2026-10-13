// Personajes de La Casita de Gabby.
// Son figuras propias modeladas con formas de Three.js (no usan modelos ni
// imágenes oficiales), inspiradas en la forma y los colores de cada personaje.
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
// Rayas verticales (en un cuerpo de revolución quedan como gajos)
export function stripeTex(cols, n = 12) {
  return canvasTex(256, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(i * w / n, 0, w / n + 1, h); }
  });
}

/* ---------- Materiales y piezas ---------- */
const matCache = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o }));
  return matCache.get(key);
}
export const texM = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.6, ...o });
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
function lathe(profile, seg = 32) {
  const pts = new THREE.SplineCurve(profile.map(([r, y]) => new V2(r, y))).getPoints(profile.length * 8);
  return new THREE.LatheGeometry(pts, seg);
}
// Cápsula que se estrecha: la esfera de arriba está en y=0 y la de abajo en y=-len
function taper(rt, rb, len, seg = 20) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new V2(rb * Math.sin(a), -len - rb * Math.cos(a))); }
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

/* ---------- Corazones y medios corazones ---------- */
function heartShape(s = 0.5, side = 0) {
  // side 0: corazón entero · -1: mitad izquierda · 1: mitad derecha (el corte queda en x = 0)
  const h = new THREE.Shape();
  const L = side || -1;
  h.moveTo(0, -s * 0.9);
  h.bezierCurveTo(L * s * 0.2, -s * 0.6, L * s * 1.05, -s * 0.15, L * s * 0.95, s * 0.3);
  h.bezierCurveTo(L * s * 0.85, s * 0.8, L * s * 0.2, s * 0.85, 0, s * 0.4);
  if (side) { h.lineTo(0, -s * 0.9); return h; }
  h.bezierCurveTo(s * 0.2, s * 0.85, s * 0.85, s * 0.8, s * 0.95, s * 0.3);
  h.bezierCurveTo(s * 1.05, -s * 0.15, s * 0.2, -s * 0.6, 0, -s * 0.9);
  return h;
}
const HEART_OPTS = { depth: 0.16, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 3, curveSegments: 20 };
export const heartGeo = new THREE.ExtrudeGeometry(heartShape(0.5), HEART_OPTS);
heartGeo.computeBoundingBox();
const hc = heartGeo.boundingBox.getCenter(new V3());
heartGeo.translate(-hc.x, -hc.y, -hc.z);
export const halfHeartGeo = [-1, 1].map((side) => new THREE.ExtrudeGeometry(heartShape(0.5, side), { ...HEART_OPTS, bevelSize: 0.03 }).translate(0, -hc.y, -hc.z));
export const heartM = M(0xff5f9e, { roughness: 0.25, metalness: 0.1, emissive: 0xff2f7e, emissiveIntensity: 0.3 });

/* ---------- Caras ---------- */
function blush(parent, x, y, z, r = 0.07) {
  mk(sphere(r, 16, 10), M(0xff9fbf, { roughness: 0.7, transparent: true, opacity: 0.85 }), parent, x, y, z).scale.set(1.3, 0.7, 0.3);
}
function smallSmile(parent, x, y, z, r = 0.05, color = 0x6a2030) {
  const m = mk(new THREE.TorusGeometry(r, r * 0.25, 6, 14, Math.PI), M(color), parent, x, y, z);
  m.rotation.z = Math.PI;
  return m;
}
// Ojo grande y brillante de gatito (estilo caricatura)
function catEye(parent, x, y, z, r, iris) {
  const g = pivot(parent, x, y, z);
  g.rotation.y = Math.sign(x) * 0.35;
  mk(sphere(r, 24, 18), M(0xffffff, { roughness: 0.15 }), g).scale.set(0.9, 1.15, 0.4);
  mk(sphere(r * 0.74, 20, 14), M(iris, { roughness: 0.2 }), g, 0, -r * 0.06, r * 0.16).scale.set(0.9, 1.1, 0.35);
  mk(sphere(r * 0.42, 16, 12), M(0x111111, { roughness: 0.15 }), g, 0, -r * 0.06, r * 0.26).scale.set(0.9, 1.1, 0.3);
  const shine = M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 });
  mk(sphere(r * 0.2, 8, 6), shine, g, r * 0.24, r * 0.3, r * 0.38);
  mk(sphere(r * 0.1, 8, 6), shine, g, -r * 0.22, -r * 0.32, r * 0.38);
  return g;
}
function whiskers(head, cy, cz, w, len = 0.28) {
  const m = M(0x3a2a33);
  for (const s of [-1, 1]) for (let k = -1; k <= 1; k += 2) {
    const wk = mk(new THREE.CapsuleGeometry(0.01, len, 3, 6), m, head, s * w, cy - k * 0.04, cz);
    wk.rotation.set(0, -s * 0.5, Math.PI / 2 + s * k * 0.12);
  }
}
// Cabeza de gatito: grande, redonda, con orejas, ojos brillantes, hocico y bigotes
function catHead(R, o) {
  const r = o.r ?? 0.58;
  const head = R.head = pivot(R.body, 0, o.y ?? 1.12, 0);
  const fur = o.fur;
  mk(sphere(r, 40, 30), fur, head, 0, r * 0.95, 0).scale.set(o.sx ?? 1.2, 0.95, 1.0);
  for (const s of [-1, 1]) {
    if (!o.noEars) {
      const ear = pivot(head, s * r * 0.78, r * 1.62, 0);
      ear.rotation.z = -s * 0.42;
      mk(cone(r * 0.36, r * 0.62, 24), o.earFur || fur, ear, 0, r * 0.2, 0);
      mk(cone(r * 0.22, r * 0.42, 20), M(o.inner ?? 0xffb6d0), ear, 0, r * 0.16, r * 0.14).scale.z = 0.45;
    }
    catEye(head, s * r * 0.42, r * 1.0, r * 0.86, r * 0.21, o.iris ?? 0x4aa3ff);
    blush(head, s * r * 0.72, r * 0.68, r * 0.74, r * 0.12);
  }
  mk(sphere(r * 0.3), M(o.muzzle ?? 0xffffff, { roughness: 0.6 }), head, 0, r * 0.66, r * 0.84).scale.set(1.35, 0.8, 0.6);
  mk(sphere(r * 0.09), M(o.nose ?? 0xff7aa8, { roughness: 0.3 }), head, 0, r * 0.78, r * 1.0).scale.set(1.3, 0.9, 0.8);
  smallSmile(head, 0, r * 0.62, r * 1.0, r * 0.08);
  whiskers(head, r * 0.7, r * 0.72, r * 1.05, r * 0.45);
  return head;
}

/* ---------- Esqueleto común ---------- */
function rig(name) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  return { name, root, body, legs: [], knees: [], arms: [], elbows: [], hands: [], head: null, h: 2.4, waist: 0.72, phase: 0, cheer: 0, stepRate: 11, pose: [null, null], wings: [], tail: null };
}
function chibiLegs(R, fur, foot = fur, x = 0.16, y = 0.44) {
  for (const s of [-1, 1]) {
    const leg = pivot(R.body, s * x, y, 0);
    mk(taper(0.105, 0.1, y - 0.18), fur, leg);
    mk(sphere(0.14), foot, leg, 0, -y + 0.1, 0.05).scale.set(1, 0.62, 1.35);
    R.legs.push(leg);
  }
}
function chibiArms(R, fur, sleeve = fur, x = 0.25, y = 1.0) {
  for (const s of [-1, 1]) {
    const a = pivot(R.body, s * x, y, 0);
    mk(taper(0.085, 0.075, 0.28), sleeve, a);
    mk(sphere(0.095), fur, a, 0, -0.36, 0);
    a.rotation.z = a.userData.bz = s * 0.5;
    R.arms.push(a);
    R.hands.push(pivot(a, 0, -0.38, 0));
  }
}
// Cuerpo pequeño con vestido, bracitos y patitas
function chibiBody(R, { fur, dress, collar = null, sleeve = null, foot = fur }) {
  chibiLegs(R, fur, foot);
  mk(lathe([[0, 0.3], [0.4, 0.32], [0.41, 0.4], [0.33, 0.75], [0.26, 1.0], [0.17, 1.12], [0, 1.14]]), dress, R.body);
  if (collar) mk(new THREE.TorusGeometry(0.17, 0.05, 10, 24), collar, R.body, 0, 1.08, 0).rotation.x = Math.PI / 2;
  chibiArms(R, fur, sleeve || fur);
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

/* ============================================================
   Gabby: niña de pelo rizado oscuro con diadema de orejas de
   gato, camiseta rosa, falda morada y tenis rosas.
   ============================================================ */
export function makeGabby() {
  const R = rig('Gabby');
  const b = R.body;
  const skin = M(0xc98f6a, { roughness: 0.6 });
  const shirt = M(0xff6fb5, { roughness: 0.55 }), skirt = M(0x9b5de5, { roughness: 0.55 });
  const shoe = M(0xff3f8f, { roughness: 0.4 }), white = M(0xffffff, { roughness: 0.4 });
  const hair = M(0x3a2216, { roughness: 0.85 });
  for (const s of [-1, 1]) {
    const leg = pivot(b, s * 0.13, 0.62, 0);
    mk(taper(0.08, 0.072, 0.44), skin, leg);
    mk(sphere(0.13), shoe, leg, 0, -0.5, 0.05).scale.set(0.95, 0.62, 1.4);
    mk(cyl(0.12, 0.13, 0.05, 16), white, leg, 0, -0.56, 0.05).scale.set(1, 1, 1.35);
    R.legs.push(leg);
  }
  mk(lathe([[0, 0.46], [0.4, 0.48], [0.34, 0.6], [0.26, 0.76], [0, 0.8]]), skirt, b);
  mk(lathe([[0, 0.72], [0.26, 0.74], [0.28, 0.95], [0.24, 1.14], [0.12, 1.24], [0, 1.25]]), shirt, b);
  // Carita de gato en la camiseta
  const em = pivot(b, 0, 0.98, 0.265);
  mk(sphere(0.1, 20, 14), white, em).scale.set(1.15, 0.95, 0.25);
  for (const s of [-1, 1]) {
    mk(cone(0.045, 0.08, 10), white, em, s * 0.07, 0.1, 0).rotation.z = -s * 0.4;
    mk(sphere(0.018, 8, 6), M(0x222222), em, s * 0.04, 0.01, 0.025);
  }
  mk(sphere(0.016, 8, 6), M(0xff5f9e), em, 0, -0.025, 0.027);
  for (const s of [-1, 1]) {
    const a = pivot(b, s * 0.27, 1.14, 0);
    mk(taper(0.085, 0.08, 0.13), shirt, a);
    mk(taper(0.062, 0.056, 0.3), skin, a, 0, -0.12, 0);
    mk(sphere(0.078), skin, a, 0, -0.48, 0);
    a.rotation.z = a.userData.bz = s * 0.18;
    R.arms.push(a);
    R.hands.push(pivot(a, 0, -0.5, 0));
  }
  mk(cyl(0.07, 0.075, 0.16, 12), skin, b, 0, 1.3, 0);
  const head = R.head = pivot(b, 0, 1.34, 0);
  mk(sphere(0.46, 40, 30), skin, head, 0, 0.42, 0).scale.set(1.0, 1.02, 0.95);
  // Ojos grandes
  for (const s of [-1, 1]) {
    const g = pivot(head, s * 0.165, 0.43, 0.36);
    g.rotation.y = s * 0.32;
    mk(sphere(0.1, 24, 18), M(0xffffff, { roughness: 0.15 }), g).scale.set(0.82, 1.1, 0.45);
    mk(sphere(0.072, 20, 14), M(0x4a2a14, { roughness: 0.2 }), g, 0, -0.008, 0.02).scale.set(0.9, 1.08, 0.5);
    mk(sphere(0.04, 16, 12), M(0x110a05, { roughness: 0.15 }), g, 0, -0.008, 0.036).scale.set(0.9, 1.08, 0.4);
    mk(sphere(0.02, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, 0.024, 0.03, 0.05);
    const lash = mk(new THREE.TorusGeometry(0.085, 0.012, 6, 16, Math.PI * 0.8), M(0x1a0d08), g, 0, 0.01, 0.02);
    lash.rotation.z = Math.PI * 0.1;
    const brow = mk(new THREE.CapsuleGeometry(0.014, 0.08, 3, 6), hair, head, s * 0.17, 0.6, 0.38);
    brow.rotation.z = Math.PI / 2 + s * 0.15;
    blush(head, s * 0.27, 0.3, 0.33, 0.06);
  }
  mk(sphere(0.035, 12, 10), M(0xb57852), head, 0, 0.34, 0.43);
  // Sonrisa abierta
  const ms = new THREE.Shape();
  ms.moveTo(-0.09, 0); ms.quadraticCurveTo(0, -0.02, 0.09, 0); ms.quadraticCurveTo(0.01, -0.15, -0.09, 0);
  mk(wrap(new THREE.ShapeGeometry(ms, 16), 0.45), M(0x7a1e2a, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), head, 0, 0.25, 0.425);
  const tg = mk(new THREE.CircleGeometry(0.03, 12), M(0xe86a7a, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), head, 0, 0.205, 0.43);
  tg.scale.set(1.3, 0.6, 1);
  // Pelo rizado y abundante
  mk(sphere(0.5, 32, 24), hair, head, 0, 0.5, -0.1).scale.set(1.1, 1.06, 1.0);
  for (let i = 0; i < 11; i++) {
    const a = -1.35 + i / 10 * 2.7;
    mk(sphere(0.12, 12, 10), hair, head, Math.sin(a) * 0.4, 0.78 + Math.cos(a) * 0.1, 0.12 + Math.cos(a) * 0.2);
  }
  for (let i = 0; i < 26; i++) {
    const a = (i % 13) / 12 * 3.6 - 1.8 + Math.PI, row = i < 13 ? 0 : 1;
    const rr = 0.5 + row * 0.05;
    mk(sphere(0.15 + (i % 3) * 0.02, 12, 10), hair, head, Math.sin(a) * rr, 0.5 - row * 0.32, Math.cos(a) * rr * 0.9 - 0.05);
  }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) mk(sphere(0.13, 12, 10), hair, head, s * (0.46 + k * 0.03), 0.42 - k * 0.2, -0.05 - k * 0.04);
  // Diadema con orejas de gato
  const band = pivot(head, 0, 0.48, 0.02);
  band.rotation.x = -0.28;
  mk(new THREE.TorusGeometry(0.53, 0.035, 8, 32, Math.PI), M(0xff5fa2, { roughness: 0.4 }), band);
  for (const s of [-1, 1]) {
    const ear = pivot(band, s * 0.33, 0.43, 0);
    ear.rotation.z = -s * 0.55;
    mk(cone(0.15, 0.26, 20), M(0xff5fa2, { roughness: 0.4 }), ear, 0, 0.1, 0);
    mk(cone(0.09, 0.17, 16), M(0xffc4e0), ear, 0, 0.08, 0.06).scale.z = 0.5;
  }
  R.h = 2.45; R.waist = 0.86; R.stepRate = 10;
  return R;
}

/* ============================================================
   Pandy: osito panda de peluche, blanco y negro.
   ============================================================ */
export function makePandy() {
  const R = rig('Pandy');
  const white = M(0xf7f5ef, { roughness: 0.7 }), black = M(0x29252e, { roughness: 0.7 });
  chibiBody(R, { fur: black, dress: white });
  mk(sphere(0.2, 20, 14), M(0xffc4dc, { roughness: 0.7 }), R.body, 0, 0.62, 0.32).scale.set(1, 1, 0.35);
  const head = R.head = pivot(R.body, 0, 1.12, 0);
  const r = 0.58;
  mk(sphere(r, 40, 30), white, head, 0, r * 0.95, 0).scale.set(1.18, 0.95, 1.0);
  for (const s of [-1, 1]) {
    mk(sphere(0.2, 20, 14), black, head, s * 0.52, 0.98, -0.05).scale.set(1, 1, 0.7);
    const patch = mk(sphere(0.16, 20, 14), black, head, s * 0.24, 0.58, 0.47);
    patch.scale.set(0.85, 1.15, 0.45); patch.rotation.z = s * 0.5;
    catEye(head, s * 0.24, 0.6, 0.53, 0.1, 0x6a4a2a);
    blush(head, s * 0.42, 0.36, 0.46, 0.07);
  }
  mk(sphere(0.17), white, head, 0, 0.38, 0.5).scale.set(1.3, 0.8, 0.6);
  mk(sphere(0.055), black, head, 0, 0.44, 0.6).scale.set(1.4, 0.9, 0.8);
  smallSmile(head, 0, 0.33, 0.6, 0.045);
  R.h = 2.35;
  return R;
}

/* ============================================================
   Cakey: gatito pastelito, con el cuerpo de capacillo de rayas,
   betún rosa con chispitas y una cereza encima.
   ============================================================ */
export function makeCakey() {
  const R = rig('Cakey');
  const cream = M(0xfff3e4, { roughness: 0.6 });
  const wrapper = texM(stripeTex(['#6fd3cf', '#ffffff'], 16));
  chibiLegs(R, cream);
  mk(lathe([[0, 0.3], [0.33, 0.32], [0.36, 0.4], [0.45, 1.0], [0, 1.02]]), wrapper, R.body);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; mk(sphere(0.1, 12, 10), M(0xfff8ee), R.body, Math.cos(a) * 0.42, 1.02, Math.sin(a) * 0.42); }
  chibiArms(R, cream, cream, 0.38, 0.98);
  const head = catHead(R, { fur: cream, iris: 0x55c0ff, y: 1.08, r: 0.56 });
  const pinkF = M(0xff8fc8, { roughness: 0.35 });
  const cap = mk(new THREE.SphereGeometry(0.55, 32, 14, 0, TAU, 0, Math.PI / 2), pinkF, head, 0, 0.82, -0.04);
  cap.scale.set(1.18, 0.55, 1.0);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; mk(sphere(0.09, 10, 8), pinkF, head, Math.cos(a) * 0.62, 0.8 - (i % 2) * 0.05, Math.sin(a) * 0.5 - 0.04); }
  const sprCols = [0xffd23f, 0x7fd6ff, 0xffffff, 0x9b5de5, 0x6fe08a];
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 0.5;
    const sp = mk(new THREE.CapsuleGeometry(0.014, 0.05, 2, 5), M(sprCols[i % sprCols.length]), head, Math.cos(a) * d * 1.1, 0.82 + 0.3 * Math.sqrt(Math.max(0, 1 - d * d / 0.3)), Math.sin(a) * d * 0.9 - 0.04);
    sp.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  }
  mk(sphere(0.11, 16, 12), M(0xe8202e, { roughness: 0.2 }), head, 0, 1.16, 0);
  mk(cyl(0.012, 0.012, 0.16, 6), M(0x3f8a2a), head, 0.04, 1.3, 0).rotation.z = -0.4;
  R.h = 2.3;
  return R;
}

/* ============================================================
   MerCat: gatita sirena lila con cola de pez turquesa.
   ============================================================ */
export function makeMerCat() {
  const R = rig('MerCat');
  const lilac = M(0xc9a7f0, { roughness: 0.5 }), teal = M(0x2fc4b6, { roughness: 0.35, metalness: 0.1 });
  mk(lathe([[0, 0.18], [0.36, 0.22], [0.4, 0.42], [0.32, 0.75], [0.25, 1.0], [0.16, 1.12], [0, 1.14]]), lilac, R.body);
  mk(lathe([[0, 0.16], [0.38, 0.2], [0.42, 0.4], [0.38, 0.62], [0, 0.64]]), teal, R.body);
  const tail = R.tail = pivot(R.body, 0, 0.3, -0.2);
  const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0.1), new V3(0, -0.1, -0.25), new V3(0, 0.05, -0.55), new V3(0, 0.3, -0.7)]);
  mk(new THREE.TubeGeometry(curve, 20, 0.13, 12), teal, tail);
  for (const s of [-1, 1]) {
    const fin = mk(sphere(0.2, 16, 12), M(0x7ff0e0, { roughness: 0.3 }), tail, s * 0.14, 0.42, -0.74);
    fin.scale.set(1.0, 0.35, 0.6); fin.rotation.z = s * 0.6;
  }
  chibiArms(R, lilac);
  const head = catHead(R, { fur: lilac, iris: 0x2fc49a, inner: 0xff9ad0 });
  const st = mk(starGeo, M(0xff8fb0, { roughness: 0.4 }), head, -0.42, 1.15, 0.25);
  st.scale.setScalar(0.36); st.rotation.z = 0.3;
  R.h = 2.3; R.waist = 0.62;
  return R;
}

/* ============================================================
   Gatita Hada: color crema, alitas brillantes y corona de flores.
   ============================================================ */
export function makeFairy() {
  const R = rig('Gatita Hada');
  const cream = M(0xf5e6d6, { roughness: 0.6 });
  chibiBody(R, { fur: cream, dress: M(0xffa6dc, { roughness: 0.45 }), collar: M(0x8fe0a8) });
  const wingM = new THREE.MeshStandardMaterial({ color: 0xc8f4ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, roughness: 0.2, emissive: 0x9fe8ff, emissiveIntensity: 0.25 });
  for (const s of [-1, 1]) {
    const w = pivot(R.body, s * 0.08, 0.95, -0.3);
    const top = mk(new THREE.CircleGeometry(0.42, 24), wingM, w, s * 0.38, 0.22, 0);
    top.scale.set(1, 0.62, 1); top.rotation.z = s * 0.5; top.castShadow = false;
    const bot = mk(new THREE.CircleGeometry(0.28, 20), wingM, w, s * 0.28, -0.16, 0);
    bot.scale.set(1, 0.7, 1); bot.rotation.z = -s * 0.4; bot.castShadow = false;
    w.userData.s = s;
    R.wings.push(w);
  }
  const head = catHead(R, { fur: cream, iris: 0x7a5ad8, inner: 0xffb6d0 });
  const cols = [0xff8fc8, 0xffffff, 0xffd84a, 0xc9a7ff];
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + i / 6 * 2.4;
    flower(head, Math.sin(a) * 0.5, 1.12 + Math.cos(a) * 0.12, Math.cos(a) * 0.3, cols[i % 4], 0xffd84a, 1.2);
  }
  R.h = 2.4;
  return R;
}

/* ============================================================
   DJ Gatito: gato azul con sudadera y audífonos grandes.
   ============================================================ */
export function makeDJ() {
  const R = rig('DJ Gatito');
  const blue = M(0x6a7fe8, { roughness: 0.5 }), hoodie = M(0x2e2a44, { roughness: 0.6 }), neon = M(0xff4fa0, { roughness: 0.3, emissive: 0xff2f80, emissiveIntensity: 0.25 });
  chibiBody(R, { fur: blue, dress: hoodie, sleeve: hoodie, collar: neon });
  const head = catHead(R, { fur: blue, iris: 0xffd23f, inner: 0xff9ad0, muzzle: 0xdfe6ff });
  const band = pivot(head, 0, 0.55, -0.08);
  mk(new THREE.TorusGeometry(0.72, 0.05, 8, 32, Math.PI), neon, band);
  for (const s of [-1, 1]) {
    const cup = mk(cyl(0.2, 0.2, 0.14, 24), M(0x1f1c2e), band, s * 0.72, 0.0, 0);
    cup.rotation.z = Math.PI / 2;
    const pad = mk(cyl(0.16, 0.16, 0.03, 24), neon, band, s * 0.8, 0.0, 0);
    pad.rotation.z = Math.PI / 2;
  }
  R.h = 2.35;
  return R;
}

/* ============================================================
   Gatita Almohada: el cuerpo es una almohada suavecita y lleva
   un antifaz para dormir en la frente.
   ============================================================ */
export function makePillow() {
  const R = rig('Gatita Almohada');
  const fur = M(0xfff0f8, { roughness: 0.7 }), pillow = M(0xc8b4ff, { roughness: 0.8 });
  chibiLegs(R, fur);
  const p = mk(sphere(0.5, 32, 24), pillow, R.body, 0, 0.72, 0);
  p.scale.set(1.15, 0.95, 0.7);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) mk(sphere(0.07, 10, 8), M(0xffd23f), R.body, sx * 0.54, 0.72 + sy * 0.42, 0);
  mk(sphere(0.12, 16, 12), M(0xffffff), R.body, 0, 0.75, 0.34).scale.set(1, 1, 0.3);
  chibiArms(R, fur, fur, 0.48, 0.92);
  const head = catHead(R, { fur, iris: 0x8a6ae0, inner: 0xc8b4ff, y: 1.12 });
  const mask = pivot(head, 0, 0.92, 0.42);
  mask.rotation.x = -0.35;
  for (const s of [-1, 1]) mk(sphere(0.15, 16, 12), M(0x5aa0f0, { roughness: 0.5 }), mask, s * 0.17, 0, 0).scale.set(1.1, 0.7, 0.35);
  const strap = mk(new THREE.TorusGeometry(0.66, 0.025, 6, 32), M(0x5aa0f0), head, 0, 0.88, -0.05);
  strap.rotation.x = Math.PI / 2 - 0.25; strap.scale.set(1.0, 0.9, 1);
  R.h = 2.35;
  return R;
}

/* ============================================================
   Bebé Caja: gatito de cartón con solapas.
   ============================================================ */
export function makeBabyBox() {
  const R = rig('Bebé Caja');
  const card = M(0xd9a066, { roughness: 0.85 }), dark = M(0xb07a44, { roughness: 0.85 });
  chibiLegs(R, card, dark);
  mk(box(0.8, 0.72, 0.62), card, R.body, 0, 0.72, 0);
  mk(box(0.82, 0.05, 0.64), dark, R.body, 0, 0.72, 0);
  for (const s of [-1, 1]) {
    const fl = mk(box(0.4, 0.04, 0.6), card, R.body, s * 0.52, 1.1, 0);
    fl.rotation.z = s * 0.6;
  }
  chibiArms(R, card, card, 0.44, 0.95);
  const head = R.head = pivot(R.body, 0, 1.1, 0);
  mk(box(0.95, 0.78, 0.8), card, head, 0, 0.42, 0);
  for (const s of [-1, 1]) {
    const ear = mk(cone(0.2, 0.3, 4), card, head, s * 0.33, 0.95, 0);
    ear.rotation.y = Math.PI / 4; ear.rotation.z = -s * 0.2;
    catEye(head, s * 0.2, 0.48, 0.38, 0.12, 0x3a9ae8);
    blush(head, s * 0.33, 0.3, 0.41, 0.07);
  }
  mk(sphere(0.045), M(0xff7aa8), head, 0, 0.36, 0.42).scale.set(1.3, 0.9, 0.8);
  smallSmile(head, 0, 0.29, 0.41, 0.045);
  whiskers(head, 0.32, 0.4, 0.42, 0.25);
  mk(box(0.04, 0.3, 0.02), dark, head, 0, 0.62, 0.41);
  R.h = 2.2;
  return R;
}
