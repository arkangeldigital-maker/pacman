// Personajes de La Sirenita: ¡Vengan, pececitos!
// Son figuras propias modeladas con formas de Three.js (no usan modelos ni
// imágenes oficiales): una sirenita pelirroja con cola verde, un pez amarillo
// con rayas azules, pececitos de colores y un príncipe marinero.
import * as THREE from './three.module.min.js';
const V2 = THREE.Vector2;
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

/* ---------- Materiales y piezas ---------- */
const matCache = new Map();
export function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o }));
  return matCache.get(key);
}
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
// Cápsula que se estrecha: la esfera de arriba está en y=0 y la de abajo en y=-len
function taper(rt, rb, len, seg = 20) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new V2(rb * Math.sin(a), -len - rb * Math.cos(a))); }
  for (let i = 1; i < 12; i++) { const t = i / 12; pts.push(new V2(rb + (rt - rb) * t, -len + len * t)); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new V2(rt * Math.sin(a), -rt * Math.cos(a))); }
  return new THREE.LatheGeometry(pts, seg);
}
function starShape(R = 0.5, r = 0.24) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + Math.PI / 2, rr = i % 2 ? r : R;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return s;
}
export const starGeo = new THREE.ExtrudeGeometry(starShape(), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
starGeo.center();

/* ---------- Ojo grande con brillo ---------- */
function eye(parent, x, y, z, r, iris) {
  const g = pivot(parent, x, y, z);
  mk(sphere(r, 24, 18), M(0xffffff, { roughness: 0.15 }), g).scale.set(0.95, 1.12, 0.7);
  mk(sphere(r * 0.68, 20, 14), M(iris, { roughness: 0.2 }), g, 0, -r * 0.05, r * 0.5).scale.set(1, 1.1, 0.4);
  mk(sphere(r * 0.38, 16, 12), M(0x0d0d0d, { roughness: 0.15 }), g, 0, -r * 0.05, r * 0.62).scale.set(1, 1.1, 0.4);
  mk(sphere(r * 0.18, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, r * 0.22, r * 0.25, r * 0.72);
  mk(sphere(r * 0.08, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, -r * 0.2, -r * 0.3, r * 0.72);
  return g;
}
function smileOn(parent, x, y, z, r, color = 0x7a1f2a, tilt = -0.3) {
  const s = mk(new THREE.TorusGeometry(r, r * 0.22, 6, 16, Math.PI), M(color), parent, x, y, z);
  s.rotation.set(tilt, 0, Math.PI);
  return s;
}

/* ============================================================
   Ariel: sirenita pelirroja, cola verde y conchitas moradas.
   Origen en la cadera; mira hacia +z. Al nadar se inclina hacia
   adelante (body.rotation.x) y la cola patalea como delfín.
   ============================================================ */
export function makeAriel() {
  const root = new THREE.Group();
  const body = pivot(root);
  const skin = M(0xffd9c2, { roughness: 0.6 });
  const tailM = M(0x1fb36b, { roughness: 0.35, metalness: 0.1 });
  const finM = M(0x5fe3a6, { roughness: 0.3, metalness: 0.1 });
  const shellM = M(0x9b5de5, { roughness: 0.3, metalness: 0.15 });
  const hairM = M(0xe0281f, { roughness: 0.5 });
  const R = { kind: 'ariel', root, body, tail: [], arms: [], hair: [], phase: 0, cheer: 0, wave: 0, h: 0.3 };

  // Cola en tres partes y aleta
  mk(sphere(0.23, 28, 20), tailM, body, 0, 0.02, 0).scale.set(1.05, 0.85, 0.9);
  let parent = body, y = 0;
  [[0.21, 0.16, 0.38], [0.16, 0.1, 0.34], [0.1, 0.06, 0.22]].forEach(([rt, rb, len]) => {
    const p = pivot(parent, 0, y, 0);
    mk(taper(rt, rb, len), tailM, p).scale.set(1, 1, 0.82);
    R.tail.push(p);
    parent = p; y = -len;
  });
  const fin = pivot(parent, 0, y - 0.04, 0);
  for (const s of [-1, 1]) {
    const f = mk(sphere(0.2, 20, 14), finM, fin, s * 0.15, -0.1, 0);
    f.scale.set(1.25, 0.55, 0.22);
    f.rotation.z = s * 0.55;
  }
  // franjita de escamas en la cintura
  mk(new THREE.TorusGeometry(0.2, 0.035, 8, 28), finM, body, 0, 0.12, 0).rotation.x = Math.PI / 2;

  // Torso y conchitas
  mk(sphere(0.19, 24, 18), skin, body, 0, 0.32, 0).scale.set(0.95, 1.35, 0.78);
  for (const s of [-1, 1]) {
    const sh = mk(sphere(0.085, 16, 12), shellM, body, s * 0.08, 0.42, 0.11);
    sh.scale.set(1.05, 0.9, 0.62);
  }
  mk(cyl(0.06, 0.07, 0.14, 14), skin, body, 0, 0.6, 0);

  // Brazos
  for (const s of [-1, 1]) {
    const sh = pivot(body, s * 0.2, 0.48, 0);
    mk(new THREE.CapsuleGeometry(0.048, 0.3, 6, 10), skin, sh, 0, -0.2, 0);
    mk(sphere(0.055, 12, 10), skin, sh, 0, -0.39, 0.01);
    sh.rotation.z = s * 0.35;
    sh.userData.s = s;
    R.arms.push(sh);
  }

  // Cabeza
  const head = R.head = pivot(body, 0, 0.64, 0);
  mk(sphere(0.29, 32, 24), skin, head, 0, 0.25, 0).scale.set(1, 1.02, 0.95);
  for (const s of [-1, 1]) {
    eye(head, s * 0.105, 0.26, 0.225, 0.075, 0x1e8fd8).rotation.y = s * 0.3;
    // pestañas
    for (const k of [0, 1]) {
      const l = mk(new THREE.CapsuleGeometry(0.008, 0.045, 3, 5), M(0x1a1a1a), head, s * (0.14 + k * 0.025), 0.335 - k * 0.012, 0.22);
      l.rotation.z = -s * (0.9 + k * 0.4);
    }
    // cachetitos
    mk(sphere(0.045, 12, 8), M(0xff9fae, { roughness: 0.8 }), head, s * 0.17, 0.16, 0.2).scale.set(1, 0.6, 0.4);
  }
  mk(sphere(0.022, 10, 8), skin, head, 0, 0.2, 0.28);
  smileOn(head, 0, 0.125, 0.255, 0.05, 0xd8435a);
  // Pelo rojo: casco, copete y melena larga que flota
  mk(sphere(0.31, 32, 24), hairM, head, 0, 0.37, -0.08).scale.set(1.08, 0.95, 1);
  mk(sphere(0.14, 20, 14), hairM, head, 0.07, 0.53, 0.14).scale.set(1.5, 0.62, 0.85);
  mk(sphere(0.1, 16, 12), hairM, head, -0.2, 0.45, 0.12).scale.set(0.8, 0.6, 0.8);
  for (const s of [-1, 1]) mk(sphere(0.13, 16, 12), hairM, head, s * 0.26, 0.15, -0.05).scale.set(0.6, 1.35, 0.8);
  parent = pivot(head, 0, 0.3, -0.2);
  parent.rotation.x = 0.25;
  for (let i = 0; i < 3; i++) {
    const p = i ? pivot(parent, 0, -0.26, 0) : parent;
    mk(sphere(0.2 - i * 0.035, 18, 14), hairM, p, 0, -0.14, 0).scale.set(1.4, 1.1, 0.6);
    R.hair.push(p);
    parent = p;
  }
  // Lugar para la mochila (en la espalda)
  R.bagMount = pivot(body, 0, 0.36, -0.17);
  return R;
}

/* ============================================================
   Peces: cuerpo redondo, rayas, aletas y ojos grandes.
   Origen en el centro; miran hacia +z.
   ============================================================ */
export function makeFish({ color, stripe, fin, size = 1, lashes = false, bow = null }) {
  const root = new THREE.Group();
  const body = pivot(root);
  body.scale.setScalar(size);
  const bodyM = M(color, { roughness: 0.4 });
  const finM = M(fin, { roughness: 0.4 });
  const R = { kind: 'fish', root, body, size, phase: Math.random() * TAU, cheer: 0, h: Math.random(), fins: [] };
  const a = 0.36, b = 0.44, c = 0.52;
  mk(sphere(1, 32, 24), bodyM, body).scale.set(a, b, c);
  // rayas
  if (stripe != null) {
    const sm = M(stripe, { roughness: 0.4 });
    for (const z of [0.02, -0.24]) {
      const f = Math.sqrt(1 - (z / c) ** 2);
      const t = mk(new THREE.TorusGeometry(1, 0.075, 8, 36), sm, body, 0, 0, z);
      t.scale.set(a * f * 1.0, b * f * 1.0, 0.55);
    }
  }
  // cola
  const tail = R.tail = pivot(body, 0, 0, -c + 0.04);
  for (const s of [-1, 1]) {
    const f = mk(sphere(0.2, 18, 12), finM, tail, 0, s * 0.13, -0.17);
    f.scale.set(0.2, 1.0, 1.15);
    f.rotation.x = s * 0.6;
  }
  // aleta de arriba y aletitas de los lados
  const dorsal = mk(sphere(0.2, 18, 12), finM, body, 0, b - 0.02, -0.08);
  dorsal.scale.set(0.18, 0.75, 1.1);
  dorsal.rotation.x = -0.45;
  for (const s of [-1, 1]) {
    const p = pivot(body, s * (a - 0.03), -0.1, 0.05);
    const f = mk(sphere(0.12, 14, 10), finM, p, s * 0.05, 0, -0.06);
    f.scale.set(0.25, 0.7, 1.1);
    p.rotation.y = s * 0.5;
    R.fins.push(p);
  }
  // carita
  for (const s of [-1, 1]) {
    const e = eye(body, s * 0.2, 0.1, c - 0.18, 0.13, 0x1a5fb4);
    e.rotation.y = s * 0.55;
    if (lashes) for (const k of [0, 1]) {
      const l = mk(new THREE.CapsuleGeometry(0.012, 0.06, 3, 5), M(0x1a1a1a), body, s * (0.27 + k * 0.03), 0.24 - k * 0.02, c - 0.2);
      l.rotation.z = -s * (0.8 + k * 0.4);
    }
  }
  smileOn(body, 0, -0.1, c - 0.02, 0.06, 0x6b2a1a, 0.2);
  if (bow != null) {
    // moñito para las mamás
    const g = pivot(body, 0, b + 0.02, 0.15);
    for (const s of [-1, 1]) { const w = mk(sphere(0.09, 12, 10), M(bow), g, s * 0.09, 0, 0); w.scale.set(1.2, 0.8, 0.5); }
    mk(sphere(0.045, 10, 8), M(bow), g);
  }
  return R;
}

export const makeFlounder = () => {
  const R = makeFish({ color: 0xffd23f, stripe: 0x2f6fd6, fin: 0x2f6fd6, size: 0.95 });
  R.kind = 'flounder';
  return R;
};

/* ============================================================
   Príncipe Eric: camisa blanca, pantalón azul marino, fajín rojo
   y pelo negro. Origen en la cadera; mira hacia +z.
   ============================================================ */
export function makeEric() {
  const root = new THREE.Group();
  const body = pivot(root);
  const skin = M(0xf2c9a4, { roughness: 0.6 });
  const shirt = M(0xfbfbf6, { roughness: 0.7 });
  const pants = M(0x1d2b5a, { roughness: 0.6 });
  const hair = M(0x1a1410, { roughness: 0.5 });
  const R = { kind: 'eric', root, body, legs: [], arms: [], phase: 0, cheer: 0, wave: 0, h: 0.7 };
  for (const s of [-1, 1]) {
    const hip = pivot(body, s * 0.12, 0, 0);
    mk(new THREE.CapsuleGeometry(0.095, 0.58, 6, 12), pants, hip, 0, -0.38, 0);
    mk(sphere(0.085, 14, 10), skin, hip, 0, -0.78, 0.04).scale.set(1, 0.7, 1.5);
    R.legs.push(hip);
  }
  mk(sphere(0.22, 24, 16), pants, body, 0, 0.0, 0).scale.set(1.15, 0.7, 0.8);
  mk(new THREE.CapsuleGeometry(0.2, 0.32, 8, 18), shirt, body, 0, 0.36, 0).scale.set(1.1, 1, 0.75);
  mk(new THREE.TorusGeometry(0.205, 0.06, 8, 28), M(0xd6262b, { roughness: 0.5 }), body, 0, 0.1, 0).scale.set(1.1, 0.75, 1);
  mk(cyl(0.07, 0.08, 0.12, 14), skin, body, 0, 0.66, 0);
  // escote en V
  const v = mk(cone(0.07, 0.14, 3), skin, body, 0, 0.56, 0.135);
  v.rotation.set(Math.PI, 0, 0); v.scale.set(1, 1, 0.3);
  for (const s of [-1, 1]) {
    const sh = pivot(body, s * 0.27, 0.56, 0);
    mk(new THREE.CapsuleGeometry(0.07, 0.3, 6, 10), shirt, sh, 0, -0.2, 0);
    mk(sphere(0.06, 12, 10), skin, sh, 0, -0.42, 0.01);
    sh.rotation.z = s * 0.18;
    sh.userData.s = s;
    R.arms.push(sh);
  }
  const head = R.head = pivot(body, 0, 0.72, 0);
  mk(sphere(0.23, 28, 20), skin, head, 0, 0.2, 0).scale.set(0.95, 1.05, 0.95);
  for (const s of [-1, 1]) {
    eye(head, s * 0.08, 0.22, 0.18, 0.055, 0x2a6fd6).rotation.y = s * 0.3;
    const br = mk(new THREE.CapsuleGeometry(0.014, 0.06, 3, 6), hair, head, s * 0.085, 0.3, 0.2);
    br.rotation.set(0.2, 0, Math.PI / 2 + s * 0.15);
  }
  mk(sphere(0.025, 10, 8), skin, head, 0, 0.17, 0.225);
  smileOn(head, 0, 0.1, 0.2, 0.045, 0x7a2a22);
  mk(sphere(0.245, 28, 20), hair, head, 0, 0.3, -0.05).scale.set(1, 0.85, 1.02);
  mk(sphere(0.12, 16, 12), hair, head, -0.06, 0.4, 0.13).scale.set(1.5, 0.6, 0.9);
  for (const s of [-1, 1]) mk(sphere(0.08, 12, 10), hair, head, s * 0.2, 0.22, -0.02).scale.set(0.6, 1.2, 1);
  return R;
}

/* ---------- Mochila ---------- */
export function makeBackpack() {
  const g = new THREE.Group();
  const main = M(0xff6f91, { roughness: 0.55 }), dark = M(0xd2456c, { roughness: 0.55 });
  mk(new THREE.CapsuleGeometry(0.17, 0.18, 6, 14), main, g, 0, 0, -0.06).scale.set(1.2, 1, 0.7);
  mk(new THREE.CapsuleGeometry(0.1, 0.06, 6, 12), dark, g, 0, -0.07, -0.2).scale.set(1.3, 1, 0.6);
  mk(new THREE.TorusGeometry(0.08, 0.02, 6, 16, Math.PI), dark, g, 0, 0.21, -0.06).rotation.y = Math.PI / 2;
  const st = mk(starGeo, M(0xffd23f, { roughness: 0.4 }), g, 0, 0.05, -0.27);
  st.scale.setScalar(0.18);
  return g;
}
