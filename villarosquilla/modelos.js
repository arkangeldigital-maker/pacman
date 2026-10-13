// Modelos de Villa Rosquilla: Choca y Corre.
// Personajes y coches propios, hechos con formas de Three.js en estilo de
// dibujo animado (sombreado plano por tonos y contorno negro). Cada modelo se
// "hornea" en una sola malla con colores por vértice para que la ciudad entera
// se dibuje rápido.
import * as THREE from './three.module.min.js';

export const TAU = Math.PI * 2;

/* ---------- Materiales de caricatura ---------- */
export const GRAD = new THREE.DataTexture(new Uint8Array([118, 118, 118, 255, 196, 196, 196, 255, 255, 255, 255, 255]), 3, 1);
GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
GRAD.generateMipmaps = false;
GRAD.needsUpdate = true;

export const VC = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD });
export const VC_DARK = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD, color: 0x3a3a3a });
export function toon(color, extra = {}) { return new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra }); }

// Contorno: la malla se dibuja otra vez por detrás, inflada a lo largo de
// normales suavizadas ("onormal"), en un solo color oscuro.
const olCache = new Map();
export function outlineMat(thick = 0.04, color = 0x231910) {
  const k = thick + ':' + color;
  if (olCache.has(k)) return olCache.get(k);
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { thick: { value: thick }, ocol: { value: new THREE.Color(color) } }]),
    vertexShader: `
      attribute vec3 onormal;
      uniform float thick;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        vec4 lp = vec4(position + onormal * thick, 1.0);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
        #endif
        vec4 mvPosition = modelViewMatrix * lp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 ocol;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(ocol, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    side: THREE.BackSide,
    fog: true,
  });
  olCache.set(k, m);
  return m;
}

/* ---------- Piezas ---------- */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(1, 14, 10),
  sphLo: new THREE.SphereGeometry(1, 8, 6),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 7),
  cone: new THREE.ConeGeometry(1, 1, 14),
  coneLo: new THREE.ConeGeometry(1, 1, 7),
  pyr: new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI / 4),
  prism: new THREE.CylinderGeometry(1, 1, 1, 3).rotateZ(Math.PI / 2).rotateX(Math.PI / 2),
  hemi: new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2),
  torus: new THREE.TorusGeometry(1, 0.38, 8, 20),
  octa: new THREE.OctahedronGeometry(1),
};
const DUMMY = new THREE.MeshBasicMaterial();

// Añade una pieza de color a "parent"
export function P(parent, geo, color, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, DUMMY);
  m.userData.c = color;
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

/* ---------- Horneado ---------- */
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _c = new THREE.Color();
export function bakeGeo(root, withUV = false) {
  root.updateMatrixWorld(true);
  _inv.copy(root.matrixWorld).invert();
  const Pa = [], Na = [], Ca = [], Oa = [], Ua = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    _m.multiplyMatrices(_inv, o.matrixWorld);
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(_m);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const uv = g.attributes.uv ? g.attributes.uv.array : null;
    _c.set(o.userData.c ?? 0xff00ff);
    const acc = new Map(), keys = [];
    for (let i = 0; i < p.length; i += 3) {
      const k = Math.round(p[i] * 300) + ',' + Math.round(p[i + 1] * 300) + ',' + Math.round(p[i + 2] * 300);
      keys.push(k);
      let a = acc.get(k);
      if (!a) { a = [0, 0, 0]; acc.set(k, a); }
      a[0] += n[i]; a[1] += n[i + 1]; a[2] += n[i + 2];
    }
    for (let i = 0, v = 0; i < p.length; i += 3, v++) {
      const a = acc.get(keys[v]);
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      Pa.push(p[i], p[i + 1], p[i + 2]);
      Na.push(n[i], n[i + 1], n[i + 2]);
      Oa.push(a[0] / l, a[1] / l, a[2] / l);
      Ca.push(_c.r, _c.g, _c.b);
      if (withUV) {
        if (uv && o.userData.tex) Ua.push(uv[v * 2], uv[v * 2 + 1]);
        else Ua.push(0.03, 0.03);
      }
    }
    g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(Pa, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Na, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(Ca, 3));
  geo.setAttribute('onormal', new THREE.Float32BufferAttribute(Oa, 3));
  if (withUV) geo.setAttribute('uv', new THREE.Float32BufferAttribute(Ua, 2));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

export function meshOf(geo, { thick = 0.04, mat = VC, shadow = true, outline = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (outline && thick > 0) {
    const o = new THREE.Mesh(geo, outlineMat(thick));
    o.raycast = () => {};
    m.add(o);
  }
  return m;
}
export function bake(root, opts = {}) { return meshOf(bakeGeo(root, opts.withUV), opts); }

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

/* ---------- Personajes ---------- */
// Piel amarilla, ojos saltones y hocico: el estilo de caricatura de la ciudad.
export const SKIN = 0xffd83a;

export function makePerson(o) {
  const skin = o.skin ?? SKIN;
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  const S = (o.kid ? 0.72 : 1) * (o.scale || 1);
  rig.scale.setScalar(S);
  const hipY = 0.92, belly = o.belly || 0, tr = 0.4 + belly * 0.16;
  const shY = hipY + 0.95, headY = hipY + 1.68;

  // Piernas
  const leg = side => {
    const pv = new THREE.Group();
    pv.position.set(side * 0.2, hipY, 0);
    const g = new THREE.Group();
    if (o.shorts) { P(g, G.cyl, o.pants, 0, -0.18, 0, 0.17, 0.36, 0.17); P(g, G.cyl, skin, 0, -0.58, 0, 0.11, 0.6, 0.11); }
    else if (o.dress) P(g, G.cyl, o.legs ?? skin, 0, -0.46, 0, 0.11, 0.9, 0.11);
    else P(g, G.cyl, o.pants, 0, -0.44, 0, 0.16, 0.86, 0.16);
    P(g, G.box, o.shoes ?? 0x3a2a1e, 0, -0.84, 0.07, 0.27, 0.15, 0.44);
    pv.add(bake(g, { thick: 0.03 }));
    rig.add(pv);
    return pv;
  };
  const legL = leg(1), legR = leg(-1);

  // Brazos
  const arm = side => {
    const pv = new THREE.Group();
    pv.position.set(side * (tr + 0.08), shY, 0);
    pv.rotation.z = side * 0.12;
    const g = new THREE.Group();
    const sleeve = o.sleeve ?? o.shirt;
    P(g, G.cyl, sleeve, 0, -0.18, 0, 0.13, 0.4, 0.13);
    P(g, G.cyl, o.longSleeve ? sleeve : skin, 0, -0.54, 0, 0.095, 0.42, 0.095);
    P(g, G.sph, o.gloves ?? skin, 0, -0.8, 0, 0.14);
    pv.add(bake(g, { thick: 0.03 }));
    rig.add(pv);
    return pv;
  };
  const armL = arm(1), armR = arm(-1);

  // Cuerpo y cabeza
  const g = new THREE.Group();
  if (o.dress) P(g, G.cone, o.dress, 0, hipY + 0.2, 0, 0.62, 1.1, 0.56);
  else P(g, G.cyl, o.pants, 0, hipY + 0.06, 0, tr * 0.95, 0.34, tr * 0.82);
  P(g, G.sph, o.shirt, 0, hipY + 0.55, 0, tr, 0.6, tr * 0.86);
  if (belly) P(g, G.sph, o.shirt, 0, hipY + 0.42, 0.12, tr * 1.04, 0.5, tr);
  if (o.coat) {
    P(g, G.cyl, o.coat, 0, hipY + 0.3, 0, tr + 0.05, 1.25, tr * 0.88 + 0.05);
    P(g, G.box, o.shirt, 0, hipY + 0.6, tr * 0.86, 0.22, 0.75, 0.04);
  }
  if (o.tie) P(g, G.box, o.tie, 0, hipY + 0.68, tr * 0.86 + 0.02, 0.1, 0.5, 0.04);
  if (o.collar) P(g, G.torus, o.collar, 0, hipY + 1.04, 0, 0.2, 0.2, 0.2, Math.PI / 2);
  if (o.apron) P(g, G.box, o.apron, 0, hipY + 0.4, tr * 0.8, 0.6, 0.9, 0.05);
  if (o.badge) P(g, G.octa, 0xffd23f, 0.18, hipY + 0.82, tr * 0.86 + 0.02, 0.07, 0.09, 0.03);
  if (o.necklace) for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225; P(g, G.sph, 0xff4d4d, Math.sin(a) * 0.24, hipY + 1.0 - Math.cos(a) * 0.08, Math.cos(a) * 0.22, 0.045); }
  P(g, G.cyl, skin, 0, hipY + 1.15, 0, 0.15, 0.3, 0.15);
  // Cabeza alta y redondeada
  P(g, G.cyl, skin, 0, headY + 0.05, 0, 0.42, 0.56, 0.42);
  P(g, G.sph, skin, 0, headY + 0.33, 0, 0.42);
  P(g, G.sph, skin, 0, headY - 0.22, 0, 0.42, 0.36, 0.42);
  // Ojos saltones
  for (const s of [-1, 1]) {
    P(g, G.sph, 0xffffff, s * 0.17, headY + 0.12, 0.36, 0.2, 0.2, 0.15);
    P(g, G.sph, 0x111111, s * 0.15, headY + 0.11, 0.51, 0.05);
    P(g, G.sph, skin, s * 0.43, headY - 0.02, 0, 0.08, 0.13, 0.08);
  }
  // Hocico, nariz y boca
  P(g, G.sph, o.muzzle ?? skin, 0, headY - 0.25, 0.2, 0.34, 0.25, 0.3);
  P(g, G.sph, skin, 0, headY - 0.03, 0.46, 0.09, 0.09, 0.14);
  P(g, G.box, 0x6b1f14, 0, headY - 0.3, 0.49, 0.24, 0.035, 0.03);
  if (o.mustache) P(g, G.sph, o.mustache, 0, headY - 0.15, 0.47, 0.22, 0.06, 0.07);
  if (o.glasses) for (const s of [-1, 1]) P(g, G.torus, o.glasses, s * 0.17, headY + 0.12, 0.5, 0.17, 0.17, 0.1);
  hair(g, o, headY);
  rig.add(bake(g, { thick: 0.035 }));

  return { root, rig, legL, legR, armL, armR, height: (headY + 0.8) * S, scale: S };
}

function hair(g, o, y) {
  const c = o.hairColor ?? 0x3b2414;
  switch (o.hair) {
    case 'gorra': // gorra al revés
      P(g, G.hemi, o.hatColor ?? 0xd8322b, 0, y + 0.38, 0, 0.45, 0.32, 0.45);
      P(g, G.box, o.hatColor ?? 0xd8322b, 0, y + 0.4, -0.45, 0.42, 0.06, 0.3);
      P(g, G.sph, c, 0, y + 0.2, -0.32, 0.36, 0.22, 0.2);
      break;
    case 'afro': // gran melena rizada
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU;
        P(g, G.sph, c, Math.cos(a) * 0.36, y + 0.48 + Math.sin(i * 2.1) * 0.08, Math.sin(a) * 0.32 - 0.08, 0.3);
      }
      P(g, G.sph, c, 0, y + 0.72, -0.05, 0.42);
      P(g, G.sph, c, 0, y + 0.25, -0.33, 0.36, 0.4, 0.22);
      break;
    case 'puntas': // pelo en picos
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU;
        P(g, G.cone, c, Math.cos(a) * 0.24, y + 0.75, Math.sin(a) * 0.24, 0.12, 0.34, 0.12, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      }
      P(g, G.hemi, c, 0, y + 0.42, 0, 0.43, 0.3, 0.43);
      break;
    case 'coletas':
      P(g, G.hemi, c, 0, y + 0.4, -0.02, 0.45, 0.4, 0.45);
      for (const s of [-1, 1]) {
        P(g, G.sph, c, s * 0.52, y + 0.15, -0.1, 0.18, 0.3, 0.18);
        P(g, G.octa, 0xffd23f, s * 0.45, y + 0.45, 0.05, 0.11);
      }
      break;
    case 'canoso': // científico despeinado
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) P(g, G.sph, c, s * (0.42 + i * 0.04), y + 0.28 - i * 0.18, -0.08, 0.16);
      P(g, G.sph, c, 0, y + 0.3, -0.36, 0.3, 0.28, 0.16);
      break;
    case 'policia':
      P(g, G.cyl, 0x223b7a, 0, y + 0.66, 0, 0.47, 0.2, 0.47);
      P(g, G.cyl, 0x223b7a, 0, y + 0.52, 0.04, 0.44, 0.12, 0.44);
      P(g, G.box, 0x111111, 0, y + 0.47, 0.42, 0.5, 0.04, 0.24);
      P(g, G.octa, 0xffd23f, 0, y + 0.62, 0.46, 0.08, 0.1, 0.03);
      break;
    case 'mono': // moño
      P(g, G.hemi, c, 0, y + 0.42, -0.02, 0.45, 0.32, 0.45);
      P(g, G.sph, c, 0, y + 0.82, -0.12, 0.24);
      break;
    case 'casco':
      P(g, G.sph, o.hatColor ?? 0xd8322b, 0, y + 0.3, -0.02, 0.5, 0.56, 0.5);
      P(g, G.box, 0x1d2b3a, 0, y + 0.18, 0.4, 0.62, 0.22, 0.2);
      P(g, G.box, 0xffffff, 0, y + 0.86, 0, 0.08, 0.02, 0.9);
      break;
    case 'chistera':
      P(g, G.cyl, 0x1d1d24, 0, y + 0.95, 0, 0.32, 0.8, 0.32);
      P(g, G.cyl, 0x1d1d24, 0, y + 0.57, 0, 0.55, 0.05, 0.55);
      P(g, G.cyl, 0x8a2b8a, 0, y + 0.66, 0, 0.33, 0.12, 0.33);
      break;
    case 'pelo':
      P(g, G.hemi, c, 0, y + 0.42, -0.02, 0.45, 0.3, 0.45);
      P(g, G.sph, c, 0, y + 0.22, -0.3, 0.38, 0.3, 0.2);
      break;
    case 'raya':
      P(g, G.hemi, c, 0, y + 0.42, -0.02, 0.45, 0.24, 0.45);
      P(g, G.sph, c, 0.18, y + 0.62, 0.2, 0.22, 0.1, 0.2);
      break;
    default: break; // calvo
  }
}

// Balanceo al caminar; "kick" estira la pierna hacia delante
export function animPerson(p, phase, amt, air, kick) {
  const s = Math.sin(phase) * 0.75 * amt;
  if (air) {
    p.legL.rotation.x = -0.5; p.legR.rotation.x = 0.35;
    p.armL.rotation.x = -2.4; p.armR.rotation.x = -2.4;
  } else {
    p.legL.rotation.x = s; p.legR.rotation.x = -s;
    p.armL.rotation.x = -s * 0.8; p.armR.rotation.x = s * 0.8;
  }
  if (kick > 0) { p.legR.rotation.x = -1.6; p.armL.rotation.x = 0.8; p.armR.rotation.x = -1.2; }
  p.rig.position.y = air ? 0 : Math.abs(Math.cos(phase)) * 0.09 * amt;
}

/* ---------- Coches ---------- */
export const CARS = {
  sedan: { w: 2.1, l: 4.4, max: 35, acc: 17, turn: 2.2, mass: 1, name: 'Sedán familiar' },
  compacto: { w: 1.9, l: 3.5, max: 31, acc: 16, turn: 2.6, mass: 0.85, name: 'Compacto' },
  helados: { w: 2.3, l: 5.2, max: 28, acc: 12, turn: 1.8, mass: 1.7, name: 'Camión de helados' },
  patrulla: { w: 2.1, l: 4.6, max: 41, acc: 20, turn: 2.35, mass: 1.3, name: 'Patrulla' },
  rayo: { w: 2.2, l: 4.4, max: 50, acc: 25, turn: 2.6, mass: 1, name: 'El Rayo' },
  pickup: { w: 2.2, l: 4.8, max: 33, acc: 15, turn: 2.1, mass: 1.3, name: 'Camioneta' },
  plata: { w: 2.2, l: 5.6, max: 38, acc: 15, turn: 1.9, mass: 1.6, name: 'Limusina de Plata' },
};

const WR = 0.42;
let WHEEL = null;
function wheelGeo() {
  if (WHEEL) return WHEEL;
  const g = new THREE.Group();
  P(g, G.cyl, 0x22232a, 0, 0, 0, WR, 0.36, WR, 0, 0, Math.PI / 2);
  P(g, G.cyl, 0xd4d8de, 0, 0, 0, WR * 0.52, 0.38, WR * 0.52, 0, 0, Math.PI / 2);
  WHEEL = bakeGeo(g);
  return WHEEL;
}

export function makeCar(type, color) {
  const s = CARS[type], W = s.w, L = s.l;
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const g = new THREE.Group();
  const dark = 0x2a2b33, glass = 0x9fd6f2, chrome = 0xd8dce2;
  P(g, G.box, dark, 0, 0.5, 0, W * 0.96, 0.3, L * 0.94);
  let cab = { l: 2.2, h: 0.62, z: -0.2 };
  if (type === 'helados') {
    P(g, G.box, 0xf8f4ea, 0, 1.6, -0.55, W, 2.1, L - 1.6);
    P(g, G.box, color, 0, 0.95, L / 2 - 0.8, W, 0.95, 1.6);
    P(g, G.box, glass, 0, 1.8, L / 2 - 1.1, W * 0.9, 0.75, 0.9);
    P(g, G.box, color, 0, 2.25, L / 2 - 1.05, W, 0.14, 1.0);
    P(g, G.box, color, 0, 1.15, -0.55, W + 0.02, 0.3, L - 1.6);
    P(g, G.box, 0x8fd6f0, W / 2, 1.85, -0.6, 0.04, 0.8, 2.0);
    P(g, G.cone, 0xd9a35a, 0, 3.15, -0.6, 0.5, 1.2, 0.5, Math.PI);
    P(g, G.sph, 0xff8fc0, 0, 3.85, -0.6, 0.55);
    P(g, G.sph, 0xff4f6b, 0, 4.4, -0.6, 0.14);
    cab = null;
  } else if (type === 'pickup') {
    P(g, G.box, color, 0, 0.92, 0, W, 0.62, L);
    P(g, G.box, color, W / 2 - 0.08, 1.4, -1.0, 0.16, 0.4, 2.4);
    P(g, G.box, color, -W / 2 + 0.08, 1.4, -1.0, 0.16, 0.4, 2.4);
    P(g, G.box, color, 0, 1.4, -L / 2 + 0.1, W, 0.4, 0.16);
    cab = { l: 1.6, h: 0.72, z: 0.6 };
  } else if (type === 'rayo') {
    P(g, G.box, color, 0, 0.82, 0, W, 0.5, L);
    P(g, G.box, color, 0, 0.78, L / 2 - 0.2, W * 0.95, 0.38, 0.5);
    P(g, G.box, 0xffffff, 0, 1.08, 0.2, 0.42, 0.03, L * 0.97);
    P(g, G.box, color, 0, 1.55, -L / 2 + 0.3, W * 0.98, 0.1, 0.55);
    for (const x of [-0.7, 0.7]) P(g, G.box, dark, x, 1.25, -L / 2 + 0.3, 0.1, 0.5, 0.2);
    cab = { l: 1.6, h: 0.46, z: -0.35 };
  } else if (type === 'plata') {
    P(g, G.box, color, 0, 0.9, 0, W, 0.62, L);
    P(g, G.box, chrome, 0, 0.92, L / 2 + 0.02, W * 0.6, 0.4, 0.06);
    cab = { l: 3.2, h: 0.6, z: -0.5 };
  } else {
    const comp = type === 'compacto';
    P(g, G.box, color, 0, 0.9, 0, W, 0.62, L);
    if (type === 'patrulla') P(g, G.box, 0xffffff, 0, 0.92, -0.1, W + 0.02, 0.44, L * 0.42);
    cab = comp ? { l: 1.9, h: 0.68, z: -0.05 } : type === 'patrulla' ? { l: 2.3, h: 0.62, z: -0.2 } : cab;
  }
  if (cab) {
    const base = type === 'rayo' ? 1.07 : 1.21;
    P(g, G.box, glass, 0, base + cab.h / 2, cab.z, W * 0.84, cab.h, cab.l);
    P(g, G.box, color, 0, base + cab.h + 0.05, cab.z, W * 0.88, 0.12, cab.l * 0.96);
    if (type === 'patrulla') {
      P(g, G.box, 0xffffff, 0, base + cab.h + 0.06, cab.z, W * 0.89, 0.12, cab.l * 0.9);
      P(g, G.box, dark, 0, base + cab.h + 0.18, cab.z, W * 0.7, 0.14, 0.4);
    }
  }
  // Defensas y luces
  const by = type === 'rayo' ? 0.6 : 0.62;
  P(g, G.box, chrome, 0, by, L / 2 + 0.04, W * 0.96, 0.22, 0.18);
  P(g, G.box, chrome, 0, by, -L / 2 - 0.04, W * 0.96, 0.22, 0.18);
  const ly = type === 'helados' ? 1.0 : type === 'rayo' ? 0.86 : 0.98;
  for (const sx of [-1, 1]) {
    P(g, G.sph, 0xfff6c8, sx * W * 0.32, ly, L / 2, 0.2, 0.14, 0.08);
    P(g, G.box, 0xd8262b, sx * W * 0.36, ly, -L / 2, 0.36, 0.16, 0.06);
  }
  body.add(bake(g, { thick: 0.05 }));

  let lights = null;
  if (type === 'patrulla') {
    const base = 1.21 + cab.h + 0.3;
    const red = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    red.scale.set(0.5, 0.16, 0.34); red.position.set(0.4, base, cab.z);
    const blue = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
    blue.scale.set(0.5, 0.16, 0.34); blue.position.set(-0.4, base, cab.z);
    body.add(red, blue);
    lights = { red, blue };
  }

  const wheels = [];
  const wg = wheelGeo();
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const pv = new THREE.Group();
    pv.position.set(sx * (W / 2 - 0.1), WR, sz * (L / 2 - 0.85));
    const wm = new THREE.Mesh(wg, VC);
    wm.castShadow = true;
    pv.add(wm);
    root.add(pv);
    wheels.push({ pv, m: wm, front: sz > 0 });
  }
  return { root, body, wheels, lights, height: type === 'helados' ? 4.6 : 2.2 };
}
export const WHEEL_R = WR;
