// Cachorros de Paw Patrol: ¡Misión al Mar!
// Son figuras propias modeladas con formas de Three.js (no usan modelos ni
// imágenes oficiales), con los colores, chalecos y cascos de cada cachorro.
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
function blob(g, x, y, r, seed = 0) {
  g.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = i / 14 * TAU, rr = r * (0.8 + 0.2 * Math.sin(i * 1.7 + x * 0.1 + seed));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.85;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}

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
// Cápsula que se estrecha: la esfera de arriba está en y=0 y la de abajo en y=-len
function taper(rt, rb, len, seg = 20) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new V2(rb * Math.sin(a), -len - rb * Math.cos(a))); }
  for (let i = 1; i < 12; i++) { const t = i / 12; pts.push(new V2(rb + (rt - rb) * t, -len + len * t)); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new V2(rt * Math.sin(a), -rt * Math.cos(a))); }
  return new THREE.LatheGeometry(pts, seg);
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

// Huella de perrito (almohadilla grande y cuatro deditos)
export function drawPaw(g, x, y, s, color) {
  g.fillStyle = color;
  g.beginPath(); g.ellipse(x, y + s * 0.18, s * 0.42, s * 0.34, 0, 0, TAU); g.fill();
  for (const [dx, dy] of [[-0.42, -0.22], [-0.15, -0.46], [0.15, -0.46], [0.42, -0.22]]) {
    g.beginPath(); g.ellipse(x + dx * s, y + dy * s, s * 0.14, s * 0.18, dx * 0.6, 0, TAU); g.fill();
  }
}

/* ---------- Placas de los collares ---------- */
function badgeTex(bg, ring, draw) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = ring; g.beginPath(); g.arc(64, 64, 64, 0, TAU); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.fill();
    draw(g);
  });
}
// Hélice de tres aspas
const skyeBadge = badgeTex('#ff5fae', '#ffffff', (g) => {
  g.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    g.save(); g.translate(64, 64); g.rotate(i / 3 * TAU);
    g.beginPath(); g.ellipse(0, -20, 11, 22, 0.35, 0, TAU); g.fill();
    g.restore();
  }
  g.beginPath(); g.arc(64, 64, 9, 0, TAU); g.fillStyle = '#c21f7a'; g.fill();
});
// Llama de fuego
const marshallBadge = badgeTex('#e02a2a', '#ffd23f', (g) => {
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.moveTo(64, 22); g.bezierCurveTo(98, 54, 92, 100, 64, 104); g.bezierCurveTo(34, 100, 30, 66, 50, 46); g.bezierCurveTo(50, 62, 58, 66, 62, 64); g.bezierCurveTo(56, 48, 60, 34, 64, 22); g.fill();
  g.fillStyle = '#ff8a1f';
  g.beginPath(); g.moveTo(64, 56); g.bezierCurveTo(82, 74, 78, 98, 64, 98); g.bezierCurveTo(50, 98, 48, 80, 64, 56); g.fill();
});
// Ancla
const zumaBadge = badgeTex('#ff8a1f', '#1e5aa8', (g) => {
  g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 34, 9, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(64, 44); g.lineTo(64, 100); g.stroke();
  g.beginPath(); g.moveTo(46, 58); g.lineTo(82, 58); g.stroke();
  g.beginPath(); g.arc(64, 70, 30, 0.25, Math.PI - 0.25); g.stroke();
});

/* ---------- Pelajes ---------- */
// Dálmata: blanco con manchitas negras
const spotsTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b1b1b';
  [[30, 40, 11], [110, 24, 8], [190, 60, 12], [70, 120, 9], [150, 140, 13], [226, 170, 8], [40, 200, 12], [120, 226, 9], [200, 236, 10], [90, 70, 6], [236, 100, 7], [16, 128, 7]].forEach(([x, y, r], i) => blob(g, x, y, r * 1.5, i));
});
const spotsHeadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b1b1b';
  // pocas manchas para que la carita quede limpia
  [[20, 60, 8], [236, 60, 8], [60, 30, 6], [196, 30, 6], [128, 20, 7], [100, 200, 7], [160, 210, 6]].forEach(([x, y, r], i) => blob(g, x, y, r, i));
});

/* ---------- Ojo grande con brillo ---------- */
function eye(parent, x, y, z, r, iris) {
  const g = pivot(parent, x, y, z);
  mk(sphere(r, 24, 18), M(0xffffff, { roughness: 0.15 }), g).scale.set(0.95, 1.12, 0.7);
  mk(sphere(r * 0.66, 20, 14), M(iris, { roughness: 0.2 }), g, 0, -r * 0.05, r * 0.5).scale.set(1, 1.1, 0.4);
  mk(sphere(r * 0.38, 16, 12), M(0x0d0d0d, { roughness: 0.15 }), g, 0, -r * 0.05, r * 0.62).scale.set(1, 1.1, 0.4);
  mk(sphere(r * 0.18, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, r * 0.22, r * 0.25, r * 0.72);
  mk(sphere(r * 0.08, 8, 6), M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), g, -r * 0.2, -r * 0.3, r * 0.72);
  return g;
}

/* ============================================================
   Cachorro genérico: cuerpo a cuatro patas, cabeza grande,
   chaleco con mochila, collar con placa y casco.
   ============================================================ */
function makePup(o) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const R = { name: o.name, root, body, legs: [], head: null, tail: null, h: 1.9, phase: 0, cheer: 0, chomp: 0, stepRate: 12 };
  const fur = o.furMat, light = o.lightMat || fur, vest = M(o.vest, { roughness: 0.45 }), vestDark = M(o.vestDark, { roughness: 0.45 });

  // Patitas
  for (const [x, z] of [[-0.21, 0.27], [0.21, 0.27], [-0.21, -0.3], [0.21, -0.3]]) {
    const hip = pivot(body, x, 0.47, z);
    mk(taper(0.11, 0.095, 0.32), fur, hip);
    mk(sphere(0.13, 18, 12), light, hip, 0, -0.4, 0.04).scale.set(1, 0.62, 1.25);
    R.legs.push(hip);
  }
  // Torso, pecho y chaleco
  mk(sphere(0.42, 32, 24), fur, body, 0, 0.66, 0).scale.set(0.82, 0.78, 1.18);
  mk(sphere(0.3, 24, 18), light, body, 0, 0.6, 0.28).scale.set(0.95, 1, 0.8);
  const v = mk(new THREE.SphereGeometry(0.445, 32, 16, 0, TAU, 0, Math.PI * 0.42), vest, body, 0, 0.68, 0);
  v.scale.set(0.85, 0.8, 1.2);
  // Mochila de rescate
  const pack = pivot(body, 0, 1.0, -0.08);
  mk(new THREE.CapsuleGeometry(0.16, 0.28, 6, 14), vest, pack).rotation.x = Math.PI / 2;
  mk(box(0.42, 0.06, 0.26), vestDark, pack, 0, -0.08, 0);
  o.pack && o.pack(pack, vest, vestDark);
  // Colita
  const tail = R.tail = pivot(body, 0, 0.78, -0.46);
  mk(taper(0.07, 0.04, 0.32), o.tailMat || fur, tail).rotation.x = Math.PI - 0.7;
  // Collar y placa
  mk(new THREE.TorusGeometry(0.21, 0.05, 10, 28), M(o.collar, { roughness: 0.4 }), body, 0, 0.94, 0.3).rotation.x = Math.PI / 2 - 0.5;
  const tag = mk(cyl(0.12, 0.12, 0.04, 28), M(0xffffff, { roughness: 0.3, metalness: 0.2 }), body, 0, 0.84, 0.47);
  tag.rotation.x = Math.PI / 2 - 0.3;
  const face = mk(new THREE.CircleGeometry(0.11, 28), new THREE.MeshStandardMaterial({ map: o.badge, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.12, emissiveMap: o.badge }), tag, 0, 0.022, 0);
  face.rotation.x = -Math.PI / 2;

  // Cabeza
  const head = R.head = pivot(body, 0, 1.02, 0.38);
  mk(sphere(0.43, 36, 28), o.headMat || fur, head, 0, 0.3, 0).scale.set(1.08, 0.95, 0.95);
  mk(sphere(0.21, 24, 18), o.muzzleMat || light, head, 0, 0.15, 0.33).scale.set(1.2, 0.82, 1);
  mk(sphere(0.075, 16, 12), M(0x1a1a1a, { roughness: 0.2 }), head, 0, 0.25, 0.53).scale.set(1.3, 0.9, 0.9);
  // Boquita sonriente con lengüita
  const smile = mk(new THREE.TorusGeometry(0.08, 0.016, 6, 16, Math.PI), M(0x3a1410), head, 0, 0.11, 0.49);
  smile.rotation.set(-0.3, 0, Math.PI);
  const tongue = mk(sphere(0.05, 12, 8), M(0xff7a8a, { roughness: 0.4 }), head, 0.02, 0.04, 0.5);
  tongue.scale.set(1, 0.6, 0.5);
  R.tongue = tongue;
  for (const s of [-1, 1]) {
    eye(head, s * 0.17, 0.38, 0.32, 0.11, o.iris).rotation.y = s * 0.28;
    // cejitas
    const brow = mk(new THREE.CapsuleGeometry(0.018, 0.07, 3, 6), M(o.brow), head, s * 0.17, 0.53, 0.35);
    brow.rotation.set(0.2, s * 0.25, Math.PI / 2 - s * 0.2);
  }
  // Orejas caídas
  R.ears = [];
  for (const s of [-1, 1]) {
    const ep = pivot(head, s * 0.38, 0.48, -0.02);
    const ear = mk(new THREE.CapsuleGeometry(0.12, 0.24, 8, 14), o.earMat || fur, ep, s * 0.06, -0.16, 0);
    ear.scale.set(0.95, 1, 0.45);
    ep.rotation.z = s * 0.35;
    ep.userData.bz = ep.rotation.z;
    R.ears.push(ep);
  }
  o.hat(head);
  o.extra && o.extra(R, head, body);
  return R;
}

// Casco redondo con visera y placa al frente
function helmet(head, color, dark, badge, { brim = 'front', scale = 1 } = {}) {
  const hm = M(color, { roughness: 0.3, metalness: 0.05 });
  const g = pivot(head, 0, 0.48, -0.03);
  g.scale.setScalar(scale);
  mk(new THREE.SphereGeometry(0.4, 32, 16, 0, TAU, 0, Math.PI * 0.5), hm, g).scale.set(1.06, 0.62, 1.04);
  mk(new THREE.TorusGeometry(0.405, 0.035, 8, 36), M(dark, { roughness: 0.4 }), g, 0, 0.01, 0).rotation.x = Math.PI / 2;
  if (brim === 'front') {
    const b = mk(new THREE.CylinderGeometry(0.42, 0.44, 0.03, 32, 1, false, -0.9, 1.8), hm, g, 0, -0.01, 0.03);
    b.rotation.x = -0.12;
  } else if (brim === 'all') {
    // ala ancha de bombero, más larga atrás
    const b = mk(cyl(0.5, 0.52, 0.03, 36), hm, g, 0, -0.01, -0.06);
    b.scale.set(1, 1, 1.15);
  }
  const plate = mk(new THREE.CircleGeometry(0.09, 24), new THREE.MeshStandardMaterial({ map: badge, roughness: 0.3 }), g, 0, 0.15, 0.4);
  plate.rotation.x = -0.45;
  return g;
}

/* ============================================================
   Skye: cachorrita color crema, chaleco y casco rosa con gafas
   de aviadora, ojos rosados. Mochila con alitas.
   ============================================================ */
export function makeSkye() {
  const furM = M(0xe9c993, { roughness: 0.75 }), creamM = M(0xfaebcc, { roughness: 0.75 }), earM = M(0xc9955a, { roughness: 0.8 });
  return makePup({
    name: 'Skye', furMat: furM, lightMat: creamM, earMat: earM, tailMat: creamM,
    vest: 0xff6fb5, vestDark: 0xd23a8c, collar: 0xff4fa3, iris: 0xc0307e, brow: 0xa0703a, badge: skyeBadge,
    hat(head) {
      helmet(head, 0xff79bd, 0xd23a8c, skyeBadge, { scale: 0.96 });
      // gafas de aviadora sobre el casco
      const gg = pivot(head, 0, 0.7, 0.22);
      gg.rotation.x = -1.0;
      for (const s of [-1, 1]) {
        mk(new THREE.TorusGeometry(0.075, 0.025, 8, 20), M(0xd23a8c), gg, s * 0.1, 0, 0);
        mk(new THREE.CircleGeometry(0.07, 20), M(0xb8e6ff, { roughness: 0.05, metalness: 0.3, emissive: 0x6fc8ff, emissiveIntensity: 0.25 }), gg, s * 0.1, 0, 0.005);
      }
      // mechón de pelo
      for (const [x, z] of [[-0.06, 0.32], [0.05, 0.34], [0, 0.3]]) mk(sphere(0.07, 12, 10), earM, head, x, 0.55, z);
    },
    pack(p, vest, dark) {
      // alitas plegadas
      for (const s of [-1, 1]) {
        const w = mk(sphere(0.2, 16, 10), M(0xf2f2f8, { roughness: 0.35, metalness: 0.3 }), p, s * 0.2, 0.02, -0.04);
        w.scale.set(0.35, 0.22, 1.2);
        w.rotation.z = s * 0.4;
      }
    },
    extra(R, head) { R.h = 1.95; },
  });
}

/* ============================================================
   Marshall: dálmata con chaleco y casco rojo de bombero,
   ojos azules y orejas negras.
   ============================================================ */
export function makeMarshall() {
  const furM = new THREE.MeshStandardMaterial({ map: spotsTex, roughness: 0.75 });
  const headM = new THREE.MeshStandardMaterial({ map: spotsHeadTex, roughness: 0.75 });
  const white = M(0xfbfaf6, { roughness: 0.75 }), black = M(0x1f1f1f, { roughness: 0.75 });
  return makePup({
    name: 'Marshall', furMat: furM, headMat: headM, lightMat: white, muzzleMat: white, earMat: black, tailMat: white,
    vest: 0xe8302a, vestDark: 0xb01c18, collar: 0xe02a2a, iris: 0x3a86d8, brow: 0x1f1f1f, badge: marshallBadge,
    hat(head) {
      const g = helmet(head, 0xe8302a, 0xffd23f, marshallBadge, { brim: 'all' });
      // cresta del casco
      mk(box(0.05, 0.07, 0.42), M(0xffd23f, { roughness: 0.35 }), g, 0, 0.24, -0.04);
    },
    pack(p, vest, dark) {
      // cañones de agua
      for (const s of [-1, 1]) {
        const c = mk(cyl(0.05, 0.06, 0.32, 14), M(0xd8d8e0, { metalness: 0.5, roughness: 0.3 }), p, s * 0.13, 0.08, 0.05);
        c.rotation.x = Math.PI / 2 - 0.3;
      }
    },
    extra(R, head) {
      // un par de manchitas en la carita
      mk(sphere(0.05, 10, 8), M(0x1b1b1b), head, 0.22, 0.2, 0.3).scale.set(1, 0.8, 0.4);
      mk(sphere(0.04, 10, 8), M(0x1b1b1b), head, -0.2, 0.16, 0.32).scale.set(1, 0.8, 0.4);
      R.h = 1.95;
    },
  });
}

/* ============================================================
   Zuma: labrador color chocolate con chaleco y casco naranja,
   el cachorro del agua. Mochila con tanques de aire.
   ============================================================ */
export function makeZuma() {
  const furM = M(0x7a4a26, { roughness: 0.7 }), lightM = M(0x93603a, { roughness: 0.7 }), earM = M(0x5e3518, { roughness: 0.75 });
  return makePup({
    name: 'Zuma', furMat: furM, lightMat: lightM, earMat: earM,
    vest: 0xff8a1f, vestDark: 0xd8640a, collar: 0xff8a1f, iris: 0x6b3a14, brow: 0x3f220c, badge: zumaBadge,
    hat(head) {
      helmet(head, 0xff8a1f, 0x1e5aa8, zumaBadge);
      // visor de buceo levantado
      const vz = mk(new THREE.TorusGeometry(0.1, 0.025, 8, 24), M(0x1e5aa8), head, 0, 0.7, 0.2);
      vz.rotation.x = -1.0; vz.scale.set(1.6, 1, 1);
      const lens = mk(new THREE.CircleGeometry(0.1, 24), M(0x9fe0ff, { roughness: 0.05, metalness: 0.3, emissive: 0x5fc0ff, emissiveIntensity: 0.25 }), head, 0, 0.7, 0.205);
      lens.rotation.x = -1.0; lens.scale.set(1.6, 1, 1);
    },
    pack(p) {
      // tanques de aire
      for (const s of [-1, 1]) {
        const t = mk(new THREE.CapsuleGeometry(0.07, 0.26, 6, 12), M(0xffd23f, { roughness: 0.3, metalness: 0.3 }), p, s * 0.1, 0.1, 0);
        t.rotation.x = Math.PI / 2;
      }
    },
    extra(R) { R.h = 1.95; },
  });
}
