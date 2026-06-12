/**
 * pmsm-viewer.js — 永磁同步电机 (PMSM) 3D 交互展示
 * 场景搭建、模型构建、交互控制
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ═══ 1. 材质 ═══
const M = {};
function initMats() {
  const mks = (c, me, r, ex, ei) => new THREE.MeshStandardMaterial({ color:c, metalness:me, roughness:r, ...(ex?{emissive:ex,emissiveIntensity:ei||0}:{}) });
  M.statorCore = mks(0x4a90d9,.75,.3); M.statorCoreDark = mks(0x3a70a9,.7,.35);
  M.rotorCore = mks(0x666666,.75,.4); M.rotorCoreDark = mks(0x555555,.7,.45);
  M.magnet = mks(0xc0392b,.25,.55,0x440000,.08); M.magnetPole = mks(0xe74c3c,.2,.6,0x660000,.12);
  M.shaft = mks(0xbbbbbb,.92,.12); M.shaftKey = mks(0x999999,.85,.2);
  M.bOuter = mks(0x555555,.85,.2); M.bInner = mks(0x666666,.8,.25); M.bBall = mks(0xdddddd,.95,.08);
  M.endCap = mks(0x2c3e50,.55,.5); M.ecFace = mks(0x34495e,.5,.55); M.ecHub = mks(0x3d566e,.6,.45);
  M.tBox = mks(0xe67e22,.3,.55); M.tLid = mks(0xd35400,.3,.5); M.tLug = mks(0xcc8800,.8,.2);
  M.cable = mks(0x222222,.05,.9); M.housing = mks(0x1a1a2e,.5,.6); M.rib = mks(0x2d2d44,.4,.65);
  M.liner = mks(0x8e44ad,.02,.85); M.bolt = mks(0x555555,.8,.3); M.washer = mks(0x888888,.7,.35);
  M.retainer = mks(0x333355,.3,.7); M.ePlate = mks(0x777777,.6,.5); M.nameplate = mks(0xdddddd,.15,.7);
}

// ═══ 辅助：标记 partType ═══
function mk(geo, mat, type) { const m = new THREE.Mesh(geo, mat); m.userData.partType = type; return m; }

function buildStator(ef) {
  const g = new THREE.Group(); g.name = 'stator'; g.userData.partType = 'stator'; g.position.y = ef * 90;
  const S=36, L=130, OD=220, ID=140, SD=28, TW=(Math.PI*ID/S)-4;
  g.add(mk(new THREE.CylinderGeometry(OD/2,OD/2,L,64), M.statorCore, 'stator'));
  g.add(mk(new THREE.CylinderGeometry(ID/2-2,ID/2-2,L,48,1,true), M.statorCoreDark, 'stator'));
  for (const s of [-1,1]) {
    const r = new THREE.Mesh(new THREE.RingGeometry(ID/2-6,OD/2,64), M.statorCore);
    r.rotation.x = s>0 ? -Math.PI/2 : Math.PI/2; r.position.y = s*L/2; r.userData.partType = 'stator'; g.add(r);
  }
  for (let i=0; i<S; i++) {
    const a = i/S*Math.PI*2, mr = ID/2-SD/2;
    const t = mk(new THREE.BoxGeometry(TW,L,SD), M.statorCore, 'stator');
    t.position.set(mr*Math.cos(a),0,mr*Math.sin(a));
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-Math.cos(a),0,-Math.sin(a))); g.add(t);
    const tip = mk(new THREE.BoxGeometry(TW+2,L,3), M.statorCore, 'stator');
    tip.position.set((ID/2-SD+1.5)*Math.cos(a),0,(ID/2-SD+1.5)*Math.sin(a));
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-Math.cos(a),0,-Math.sin(a))); g.add(tip);
    const li = mk(new THREE.BoxGeometry(TW-1,L-6,0.3), M.liner, 'stator');
    li.position.set((ID/2-SD+3)*Math.cos(a),0,(ID/2-SD+3)*Math.sin(a));
    li.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-Math.cos(a),0,-Math.sin(a))); g.add(li);
  }
  for (const s of [-1,1]) {
    const rr = mk(new THREE.TorusGeometry(ID/2-4,4,12,48), M.retainer, 'stator');
    rr.position.y = s*(L/2+12); rr.rotation.x = Math.PI/2; g.add(rr);
  }
  return g;
}

function buildWindings(ef) {
  const g = new THREE.Group(); g.name = 'windings'; g.userData.partType = 'windings'; g.position.y = ef*90;
  const S=36, L=130, ID=140, SD=28, colors=[0xb87333,0x27ae60,0x2980b9];
  for (let ph=0; ph<3; ph++) {
    const mat = new THREE.MeshStandardMaterial({ color:colors[ph], metalness:.65, roughness:.25 });
    for (let coil=0; coil<S/3; coil++) {
      const si=(ph*(S/3)+coil)%S, a=si/S*Math.PI*2, sr=ID/2-SD/2;
      for (let w=0; w<3; w++) {
        const wi = mk(new THREE.BoxGeometry(2.5,L-15,2.5), mat, 'windings');
        const off=(w-1)*3, perp=new THREE.Vector3(-Math.sin(a),0,Math.cos(a));
        wi.position.set(sr*Math.cos(a)+perp.x*off,0,sr*Math.sin(a)+perp.z*off);
        wi.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-Math.cos(a),0,-Math.sin(a))); g.add(wi);
      }
      for (const side of [-1,1]) {
        const em = new THREE.MeshStandardMaterial({ color:colors[ph], metalness:.5, roughness:.4 });
        const e = mk(new THREE.TorusGeometry(ID/2-8,2.5,8,16), em, 'windings');
        e.position.set(sr*Math.cos(a), side*(L/2+6), sr*Math.sin(a));
        e.rotation.x = Math.PI/2; e.scale.set(1,1,.6); g.add(e);
      }
    }
  }
  return g;
}

function buildRotor(ef) {
  const g = new THREE.Group(); g.name = 'rotor'; g.userData.partType = 'rotor'; g.position.y = -ef*90;
  const RR=50, RS=120, SR=18, SL=300;
  g.add(mk(new THREE.CylinderGeometry(RR,RR,RS,48), M.rotorCore, 'rotor'));
  for (let i=-5; i<=5; i++) {
    const l = mk(new THREE.TorusGeometry(RR+0.3,0.3,6,48), M.rotorCoreDark, 'rotor');
    l.position.y = i*10.5; l.rotation.x = Math.PI/2; g.add(l);
  }
  for (const s of [-1,1]) {
    const p = mk(new THREE.RingGeometry(SR+2,RR-5,48), M.ePlate, 'rotor');
    p.rotation.x = s>0 ? -Math.PI/2 : Math.PI/2; p.position.y = s*(RS/2+2); g.add(p);
  }
  // 轴
  g.add(mk(new THREE.CylinderGeometry(SR,SR,SL,32), M.shaft, 'shaft'));
  const step = mk(new THREE.CylinderGeometry(SR+4,SR,25,32), M.shaft, 'shaft');
  step.position.y = SL/2-12; g.add(step);
  for (const e of [-1,1]) {
    const k = mk(new THREE.BoxGeometry(4,2,22), M.shaftKey, 'shaft');
    k.position.set(0,SR,e*(SL/2-14)); g.add(k);
  }
  for (const s of [-1,1]) {
    const ec = mk(new THREE.RingGeometry(5,SR-1,24), M.shaft, 'shaft');
    ec.rotation.x = s>0 ? -Math.PI/2 : Math.PI/2; ec.position.y = s*SL/2; g.add(ec);
  }
  // 永磁体
  const mW=14, mH=RS-10, mD=8;
  for (let i=0; i<8; i++) {
    const a=i/8*Math.PI*2, m=mk(new THREE.BoxGeometry(mW,mH,mD), i%2===0?M.magnetPole:M.magnet, 'magnets');
    const mr=RR+mD/2+0.5;
    m.position.set(mr*Math.cos(a),0,mr*Math.sin(a));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), new THREE.Vector3(-Math.cos(a),0,-Math.sin(a))); g.add(m);
    if (i%2===0) {
      const dot = mk(new THREE.SphereGeometry(2,8,8), new THREE.MeshStandardMaterial({ color:0xff3333, emissive:0xff0000, emissiveIntensity:.2 }), 'magnets');
      dot.position.set((mr+mD/2+1.5)*Math.cos(a),mH/4,(mr+mD/2+1.5)*Math.sin(a)); g.add(dot);
    }
  }
  return g;
}

function buildBearing(name) {
  const g = new THREE.Group(); g.name=name; g.userData.partType='bearings';
  const or = mk(new THREE.TorusGeometry(30,5,16,32), M.bOuter, 'bearings'); or.rotation.x=Math.PI/2; g.add(or);
  const ir = mk(new THREE.TorusGeometry(20,4.5,16,32), M.bInner, 'bearings'); ir.rotation.x=Math.PI/2; g.add(ir);
  for (let i=0; i<8; i++) {
    const a=i/8*Math.PI*2, b=mk(new THREE.SphereGeometry(3.5,12,12), M.bBall, 'bearings');
    b.position.set(24.5*Math.cos(a),0,24.5*Math.sin(a)); g.add(b);
  }
  const sm = new THREE.MeshStandardMaterial({ color:0x333333, metalness:.3, roughness:.7 });
  for (const s of [-1,1]) {
    const sh = mk(new THREE.RingGeometry(20,28,32), sm, 'bearings');
    sh.rotation.x = s>0 ? Math.PI/2 : -Math.PI/2; sh.position.y = s*3; g.add(sh);
  }
  return g;
}
function buildBearings(ef) {
  const g = new THREE.Group(); g.name='bearings'; g.userData.partType='bearings';
  const fb=buildBearing('fb'); fb.position.y=115+ef*25; g.add(fb);
  const bb=buildBearing('bb'); bb.position.y=-115-ef*25; g.add(bb);
  return g;
}

function buildEndCap(name) {
  const g = new THREE.Group(); g.name=name; g.userData.partType='endcaps';
  const isFront=name.includes('front'), fy=isFront?1:-1;
  g.add(mk(new THREE.CylinderGeometry(116,116,12,48), M.endCap, 'endcaps'));
  const face=mk(new THREE.CircleGeometry(116,48), M.ecFace, 'endcaps');
  face.rotation.x=fy>0?Math.PI/2:-Math.PI/2; face.position.y=fy*6; g.add(face);
  g.add(mk(new THREE.CylinderGeometry(35,35,18,32), M.ecHub, 'endcaps'));
  g.add(mk(new THREE.CylinderGeometry(17,17,18,24,1,true), new THREE.MeshStandardMaterial({ color:0x555555, metalness:.4, roughness:.6 }), 'endcaps'));
  for (let i=0; i<4; i++) {
    const a=i/4*Math.PI*2+Math.PI/4;
    const hole=mk(new THREE.TorusGeometry(5.5,2,8,12), new THREE.MeshStandardMaterial({ color:0x333333, metalness:.3, roughness:.7 }), 'endcaps');
    hole.position.set(90*Math.cos(a),0,90*Math.sin(a)); hole.rotation.x=Math.PI/2; g.add(hole);
    if (isFront) {
      const b=mk(new THREE.CylinderGeometry(8,8,4,6), M.bolt, 'endcaps');
      b.position.set(90*Math.cos(a),8,90*Math.sin(a)); g.add(b);
      const w=mk(new THREE.TorusGeometry(7,1.5,6,12), M.washer, 'endcaps');
      w.position.set(90*Math.cos(a),6,90*Math.sin(a)); w.rotation.x=Math.PI/2; g.add(w);
    }
  }
  for (let i=0; i<8; i++) {
    const a=i/8*Math.PI*2, rb=mk(new THREE.BoxGeometry(3,10,2), M.ecFace, 'endcaps');
    rb.position.set(108*Math.cos(a),fy*9,108*Math.sin(a)); rb.lookAt(0,fy*9,0); g.add(rb);
  }
  const nip=mk(new THREE.CylinderGeometry(2,3,6,8), new THREE.MeshStandardMaterial({ color:0x888888, metalness:.5, roughness:.4 }), 'endcaps');
  nip.position.set(0,fy*9,110); g.add(nip);
  return g;
}
function buildEndCaps(ef) {
  const g=new THREE.Group(); g.name='end-caps'; g.userData.partType='endcaps';
  const fc=buildEndCap('fec'); fc.position.y=130+ef*50; g.add(fc);
  const bc=buildEndCap('bec'); bc.position.y=-130-ef*50; g.add(bc);
  return g;
}

function buildTerminalBox(ef) {
  const g=new THREE.Group(); g.name='terminal-box'; g.userData.partType='terminalbox';
  const ox=170+ef*30;
  const b1=mk(new THREE.BoxGeometry(55,60,45), M.tBox, 'terminalbox'); b1.position.x=ox; g.add(b1);
  const b2=mk(new THREE.BoxGeometry(58,6,48), M.tLid, 'terminalbox'); b2.position.set(ox,33,0); g.add(b2);
  for (const sx of[-20,20]) for (const sz of[-15,15]) {
    const s=mk(new THREE.CylinderGeometry(2,2,3,6), M.bolt, 'terminalbox'); s.position.set(ox+sx,36,sz); g.add(s);
  }
  for (let i=0; i<3; i++) {
    const gm=new THREE.MeshStandardMaterial({ color:0x333333, metalness:.4, roughness:.5 });
    const gl=mk(new THREE.CylinderGeometry(6,8,8,12), gm, 'terminalbox'); gl.position.set(ox-14+i*14,36,0); g.add(gl);
    const nt=mk(new THREE.CylinderGeometry(7,7,3,6), gm, 'terminalbox'); nt.position.set(ox-14+i*14,40,0); g.add(nt);
  }
  for (let i=0; i<3; i++) {
    const st=mk(new THREE.CylinderGeometry(3,3,16,8), M.tLug, 'terminalbox');
    st.rotation.x=Math.PI/2; st.position.set(ox-12+i*12,10,12); g.add(st);
    const nt=mk(new THREE.CylinderGeometry(4.5,4.5,3,6), M.tLug, 'terminalbox');
    nt.position.set(ox-12+i*12,10,18); g.add(nt);
  }
  for (let i=0; i<3; i++) {
    const pts=[new THREE.Vector3(ox-14+i*14,40,0), new THREE.Vector3(ox-14+i*14+10,50,i===0?0:i===1?8:-8)];
    g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),8,3.5,6,false), M.cable, 'terminalbox'));
  }
  return g;
}

function buildHousing(ef) {
  const g=new THREE.Group(); g.name='housing'; g.userData.partType='housing'; g.position.y=ef*20;
  const shellMat=new THREE.MeshPhysicalMaterial({ color:0x1a1a2e, metalness:.2, roughness:.3, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false });
  g.add(mk(new THREE.CylinderGeometry(122,122,155,48), shellMat, 'housing'));
  g.add(mk(new THREE.CylinderGeometry(122,122,155,16,8), new THREE.MeshBasicMaterial({ color:0x2d2d44, wireframe:true, transparent:true, opacity:.12 }), 'housing'));
  for (const s of[-1,1]) {
    const ring=mk(new THREE.TorusGeometry(122,3,12,48), M.housing, 'housing');
    ring.position.y=s*77.5; ring.rotation.x=Math.PI/2; g.add(ring);
    for (let i=0; i<24; i++) {
      const a=i/24*Math.PI*2, rb=mk(new THREE.BoxGeometry(2,6,4), M.rib, 'housing');
      rb.position.set(124*Math.cos(a),s*78,124*Math.sin(a)); rb.lookAt(0,s*78,0); g.add(rb);
    }
  }
  for (let i=0; i<12; i++) {
    const a=i/12*Math.PI*2, rb=mk(new THREE.BoxGeometry(2.5,140,4), M.rib, 'housing');
    rb.position.set(124*Math.cos(a),0,124*Math.sin(a)); rb.lookAt(0,0,0); g.add(rb);
  }
  const np=mk(new THREE.BoxGeometry(40,0.5,20), M.nameplate, 'housing');
  np.position.y=78; g.add(np);
  return g;
}

function buildCutaway() {
  const g=new THREE.Group(); g.name='cutaway';
  for (const s of[-1,1]) {
    const r=new THREE.Mesh(new THREE.TorusGeometry(112,1.5,8,48), new THREE.MeshBasicMaterial({ color:0x88ccff, transparent:true, opacity:.15 }));
    r.position.y=s*72; r.rotation.x=Math.PI/2; g.add(r);
  }
  return g;
}

// ═══ 场景搭建 ═══
initMats();

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f6fa);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(28, container.clientWidth/container.clientHeight, 1, 2000);
const DEFAULT_POS = new THREE.Vector3(420, 130, 520);
camera.position.copy(DEFAULT_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 200;
controls.maxDistance = 1200;
controls.target.set(0, 0, 0);
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.ROTATE_PAN, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
pmrem.dispose();

// 灯光
const key = new THREE.DirectionalLight(0xffeedd, 3.0);
key.position.set(350,450,550); key.castShadow = true;
key.shadow.mapSize.set(2048,2048);
key.shadow.camera.near=100; key.shadow.camera.far=1200;
key.shadow.camera.left=-400; key.shadow.camera.right=400;
key.shadow.camera.top=400; key.shadow.camera.bottom=-400;
scene.add(key);
const d2=new THREE.DirectionalLight(0xccddff,1.0);d2.position.set(-400,200,350);scene.add(d2);
const d3=new THREE.DirectionalLight(0xffffff,.9);d3.position.set(-200,-100,-550);scene.add(d3);
const d4=new THREE.DirectionalLight(0xffffff,.6);d4.position.set(0,550,0);scene.add(d4);
const d5=new THREE.DirectionalLight(0x8899bb,.4);d5.position.set(0,-450,0);scene.add(d5);
scene.add(new THREE.AmbientLight(0xffffff,.4));

const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200,1200), new THREE.ShadowMaterial({ opacity:.06 }));
ground.rotation.x=-Math.PI/2; ground.position.y=-280; ground.receiveShadow=true;
scene.add(ground);

// ═══ 电机装配 ═══
const motorGroup = new THREE.Group(); motorGroup.name='pmsm-motor'; scene.add(motorGroup);
const partGroups = {};
const clickableMeshes = [];
let explodeFactor = 0;
let highlightMeshes = [];

const PART_INFO = {
  stator:{ name:'定子', desc:'硅钢片叠压铁芯，内圆36槽，三相通电产生旋转磁场。铁芯由0.35mm硅钢片叠压而成。' },
  rotor:{ name:'转子', desc:'叠片铁芯+转轴+表贴式永磁体。硅钢叠片构成，与定子同轴输出机械转矩。' },
  magnets:{ name:'永磁体', desc:'钕铁硼(NdFeB)，8极表贴式，相邻N/S交替，提供气隙励磁磁场。' },
  windings:{ name:'绕组', desc:'铜漆包线，三相星形(Y)连接，嵌放在36槽内，通电产生旋转磁场。' },
  endcaps:{ name:'端盖', desc:'铸铁/铝合金，前后各一。支撑轴承、封闭电机端部，带散热筋和安装孔。' },
  bearings:{ name:'轴承', desc:'深沟球滚动轴承，前后各一。承受径向和轴向载荷，保证转子平稳旋转。' },
  shaft:{ name:'电机轴', desc:'高强精磨合金钢轴，两端带键槽。传递电机输出扭矩到负载。' },
  terminalbox:{ name:'接线盒', desc:'铸铝接线盒，内置三相铜接线端子，引出电源电缆，带密封垫圈。' },
  housing:{ name:'外壳', desc:'铸铁机壳，轴向和径向散热筋。提供结构支撑和散热通道。' },
};

function disposeObj(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose()); else obj.material.dispose(); }
  if (obj.children) for (let i=obj.children.length-1; i>=0; i--) disposeObj(obj.children[i]);
}

function clearHighlight() {
  for (const m of highlightMeshes) {
    if (m._origEmissive!==undefined) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach(mat => { mat.emissive.setHex(m._origEmissive); mat.emissiveIntensity = m._origEmissiveInt||0; });
    }
  }
  highlightMeshes = [];
  document.getElementById('part-info').style.display = 'none';
}

function highlightPart(type) {
  clearHighlight();
  const meshes = [];
  motorGroup.traverse(child => {
    if (child.isMesh) {
      let t = child.userData.partType;
      if (!t) { let p = child.parent; while (p) { if (p.userData.partType) { t = p.userData.partType; break; } p = p.parent; } }
      if (t === type) meshes.push(child);
    }
  });
  for (const m of meshes) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    m._origEmissive = mats[0].emissive.getHex();
    m._origEmissiveInt = mats[0].emissiveIntensity;
    mats.forEach(mat => { mat.emissive.setHex(0x0088ff); mat.emissiveIntensity = 0.4; });
  }
  highlightMeshes = meshes;
  const info = PART_INFO[type];
  if (info) {
    document.getElementById('info-title').textContent = info.name;
    document.getElementById('info-desc').textContent = info.desc;
    document.getElementById('part-info').style.display = 'block';
  }
}

function rebuildMotor(explode) {
  while (motorGroup.children.length > 0) { const c = motorGroup.children[0]; motorGroup.remove(c); disposeObj(c); }
  Object.keys(partGroups).forEach(k => delete partGroups[k]);
  clickableMeshes.length = 0;

  const parts = [
    ['rotor', buildRotor(explode)], ['bearings', buildBearings(explode)],
    ['stator', buildStator(explode)], ['windings', buildWindings(explode)],
    ['endcaps', buildEndCaps(explode)], ['terminalbox', buildTerminalBox(explode)],
    ['housing', buildHousing(explode)], ['cutaway', buildCutaway()],
  ];
  for (const [key, grp] of parts) {
    motorGroup.add(grp); partGroups[key] = grp;
    grp.traverse(child => { if (child.isMesh) { clickableMeshes.push(child); if (!child.userData.partType) child.userData.partType = key; } });
  }
  motorGroup.position.y = 20;
  applyVisibility();
  clearHighlight();
}

function applyVisibility() {
  document.querySelectorAll('#part-list input[type=checkbox]').forEach(cb => {
    const li = cb.closest('li'), key = li.dataset.part;
    const grp = partGroups[key];
    if (grp) { grp.visible = cb.checked; return; }
    const subMap = { magnets:'magnets', windings:'windings', shaft:'shaft' };
    if (subMap[key]) {
      motorGroup.traverse(child => {
        if (child.isMesh && child.userData.partType === subMap[key]) child.visible = cb.checked;
      });
    }
  });
}

rebuildMotor(0);

// ═══ 射线拾取 ═══
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getPartType(obj) {
  while (obj) { if (obj.userData && obj.userData.partType) return obj.userData.partType; obj = obj.parent; }
  return null;
}

renderer.domElement.addEventListener('click', event => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (hits.length > 0) {
    const type = getPartType(hits[0].object);
    if (type && type !== 'cutaway') { highlightPart(type); return; }
  }
  clearHighlight();
});

// ═══ 控制面板 ═══
document.getElementById('btn-explode').addEventListener('click', () => { explodeFactor = 1; rebuildMotor(1); });
document.getElementById('btn-reset').addEventListener('click', () => { explodeFactor = 0; rebuildMotor(0); });

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const d = 620;
    const views = { front:[0,0,d], side:[d,0,0], top:[0,d,0.1], iso:[420,130,520] };
    const pos = views[btn.dataset.view] || views.iso;
    const start = { x:camera.position.x, y:camera.position.y, z:camera.position.z };
    const t0 = performance.now();
    function tick() {
      const t = Math.min((performance.now()-t0)/400, 1);
      const e = t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      camera.position.x = start.x + (pos[0]-start.x)*e;
      camera.position.y = start.y + (pos[1]-start.y)*e;
      camera.position.z = start.z + (pos[2]-start.z)*e;
      controls.update();
      if (t<1) requestAnimationFrame(tick);
    }
    controls.target.set(0,0,0);
    tick();
  });
});

document.querySelectorAll('#part-list input[type=checkbox]').forEach(cb => cb.addEventListener('change', applyVisibility));

window.addEventListener('resize', () => {
  const w=container.clientWidth, h=container.clientHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
});

// ═══ 动画循环 ═══
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); }
animate();
console.log('PMSM 3D 交互展示已加载 — 点击3D模型上的部件查看详情');
