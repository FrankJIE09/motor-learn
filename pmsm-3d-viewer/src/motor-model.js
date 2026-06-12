/**
 * PMSM 3D Model - All motor parts with industrial-grade geometry
 */
import * as THREE from 'three';

// ─── Material Library ────────────────────────────────────────────────
export const Materials = {
  // Stator core: silicon steel laminations
  statorCore: new THREE.MeshStandardMaterial({
    color: 0x4a90d9,
    metalness: 0.7,
    roughness: 0.35,
  }),
  // Copper windings
  copper: new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.85,
    roughness: 0.2,
  }),
  // Rotor core: dark gray steel
  rotorCore: new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.75,
    roughness: 0.4,
  }),
  // Neodymium magnets
  magnet: new THREE.MeshStandardMaterial({
    color: 0xc0392b,
    metalness: 0.3,
    roughness: 0.5,
    emissive: 0x330000,
    emissiveIntensity: 0.1,
  }),
  // Shaft: polished steel
  shaft: new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    metalness: 0.9,
    roughness: 0.15,
  }),
  // Bearings
  bearing: new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.8,
    roughness: 0.25,
  }),
  bearingBall: new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.95,
    roughness: 0.1,
  }),
  // End caps: cast iron / dark gray
  endCap: new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.6,
    roughness: 0.5,
  }),
  // Terminal box
  terminalBox: new THREE.MeshStandardMaterial({
    color: 0xe67e22,
    metalness: 0.3,
    roughness: 0.6,
  }),
  terminalBoxLid: new THREE.MeshStandardMaterial({
    color: 0xd35400,
    metalness: 0.3,
    roughness: 0.5,
  }),
  // Insulation / slot liner (visible between windings)
  insulation: new THREE.MeshStandardMaterial({
    color: 0x8e44ad,
    metalness: 0.05,
    roughness: 0.8,
  }),
  // Housing / frame (outer)
  housing: new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    metalness: 0.5,
    roughness: 0.6,
  }),
  coolingRib: new THREE.MeshStandardMaterial({
    color: 0x2d2d44,
    metalness: 0.4,
    roughness: 0.7,
  }),
  // Fan (if included)
  fan: new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.3,
    roughness: 0.7,
  }),
  // Cable/terminal
  cable: new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.9,
  }),
};

// ─── Geometry Utilities ──────────────────────────────────────────────

/**
 * Create a rounded rectangle shape for stator teeth
 */
function createToothShape(innerR, outerR, arcAngle, segments = 12) {
  const shape = new THREE.Shape();
  const rInner = innerR;
  const rOuter = outerR;
  const halfAngle = arcAngle / 2;

  // Start at inner radius, one side
  shape.moveTo(rInner * Math.cos(-halfAngle), rInner * Math.sin(-halfAngle));
  // Arc along inner radius
  shape.absarc(0, 0, rInner, -halfAngle, halfAngle, false);
  // Line to outer radius
  shape.lineTo(rOuter * Math.cos(halfAngle), rOuter * Math.sin(halfAngle));
  // Arc along outer radius (reverse)
  shape.absarc(0, 0, rOuter, halfAngle, -halfAngle, true);
  // Close
  shape.lineTo(rInner * Math.cos(-halfAngle), rInner * Math.sin(-halfAngle));

  return shape;
}

// ─── Part Builders ───────────────────────────────────────────────────

/**
 * Build the stator assembly: housing + core + windings
 * @param {THREE.Group} group - parent group
 * @param {number} explodeFactor - 0..1 explosion offset
 */
export function buildStator(group, explodeFactor) {
  const statorGroup = new THREE.Group();
  statorGroup.name = 'stator';

  const baseX = 0;
  const baseY = 0;
  const baseZ = explodeFactor * 80; // explode forward along Z

  // ── Stator core (silicon steel ring with teeth) ──
  const coreGroup = new THREE.Group();
  coreGroup.name = 'stator-core';

  // Outer ring
  const outerRingGeo = new THREE.CylinderGeometry(110, 110, 140, 64, 1, true);
  const outerRing = new THREE.Mesh(outerRingGeo, Materials.statorCore);
  outerRing.position.y = 0;
  coreGroup.add(outerRing);

  // Inner ring (yoke)
  const innerRingGeo = new THREE.CylinderGeometry(70, 70, 140, 64, 1, true);
  const innerRing = new THREE.Mesh(innerRingGeo, Materials.statorCore);
  innerRing.position.y = 0;
  coreGroup.add(innerRing);

  // Top and bottom rings to close the core
  const topRingGeo = new THREE.RingGeometry(70, 110, 64);
  const topRing = new THREE.Mesh(topRingGeo, Materials.statorCore);
  topRing.rotation.x = -Math.PI / 2;
  topRing.position.y = 70;
  coreGroup.add(topRing);

  const bottomRing = topRing.clone();
  bottomRing.position.y = -70;
  coreGroup.add(bottomRing);

  // Stator teeth (36 teeth)
  const numTeeth = 36;
  const toothInnerR = 52;
  const toothOuterR = 70;
  const toothArc = (2 * Math.PI / numTeeth) * 0.45;
  const toothHeight = 140;

  for (let i = 0; i < numTeeth; i++) {
    const angle = (i / numTeeth) * Math.PI * 2;
    const toothShape = createToothShape(toothInnerR, toothOuterR, toothArc);
    const extrudeSettings = { depth: toothHeight, bevelEnabled: false };
    const toothGeo = new THREE.ExtrudeGeometry(toothShape, extrudeSettings);
    const tooth = new THREE.Mesh(toothGeo, Materials.statorCore);
    tooth.rotation.x = Math.PI / 2;
    tooth.position.y = 0;
    tooth.position.x = 0;
    tooth.position.z = 0;
    tooth.rotation.z = angle;
    coreGroup.add(tooth);
  }

  statorGroup.add(coreGroup);

  // ── Copper Windings (36 coils) ──
  const windingGroup = new THREE.Group();
  windingGroup.name = 'windings';

  // Each winding sits around a tooth
  for (let i = 0; i < numTeeth; i++) {
    const angle = (i / numTeeth) * Math.PI * 2;
    const midR = (toothInnerR + toothOuterR) / 2 + 2;

    // Coil: torus shape wrapped around tooth
    const coilShape = new THREE.Shape();
    const cw = 8;
    const ch = 12;
    coilShape.moveTo(-cw / 2, -ch / 2);
    coilShape.lineTo(cw / 2, -ch / 2);
    coilShape.lineTo(cw / 2, ch / 2);
    coilShape.lineTo(-cw / 2, ch / 2);
    coilShape.closePath();

    const coilPath = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, -toothHeight / 2 + 6),
      new THREE.Vector3(0, 0, toothHeight / 2 - 6)
    );

    const tubeGeo = new THREE.TubeGeometry(coilPath, 1, 4, 8, false);
    const coil = new THREE.Mesh(tubeGeo, Materials.copper);
    // Rotate and position around stator
    coil.position.set(midR * Math.cos(angle), 0, 0);
    coil.rotation.z = angle;
    windingGroup.add(coil);

    // Top end-turn (arc)
    const endTurnGeo = new THREE.TorusGeometry(4, 3, 8, 12, Math.PI);
    const endTurn = new THREE.Mesh(endTurnGeo, Materials.copper);
    endTurn.position.set(
      midR * Math.cos(angle) + 4 * Math.cos(angle),
      toothHeight / 2 + 2,
      4 * Math.sin(angle)
    );
    endTurn.rotation.x = Math.PI / 2;
    endTurn.rotation.y = angle;
    windingGroup.add(endTurn);

    // Bottom end-turn
    const endTurn2 = endTurn.clone();
    endTurn2.position.y = -toothHeight / 2 - 2;
    windingGroup.add(endTurn2);
  }

  statorGroup.add(windingGroup);

  // ── Insulation slot liners (visible between windings) ──
  for (let i = 0; i < numTeeth; i++) {
    const angle = (i / numTeeth) * Math.PI * 2;
    const midSlotR = toothInnerR - 3;
    const linerGeo = new THREE.BoxGeometry(1.5, toothHeight - 10, 2);
    const liner = new THREE.Mesh(linerGeo, Materials.insulation);
    liner.position.set(midSlotR * Math.cos(angle), 0, midSlotR * Math.sin(angle));
    windingGroup.add(liner);
  }

  statorGroup.position.set(baseX, baseY, baseZ);
  group.add(statorGroup);

  return statorGroup;
}

/**
 * Build the rotor assembly: core + magnets + shaft
 */
export function buildRotor(group, explodeFactor) {
  const rotorGroup = new THREE.Group();
  rotorGroup.name = 'rotor';

  const baseX = 0;
  const baseY = 0;
  const baseZ = -explodeFactor * 80;

  // ── Rotor core (laminated cylinder) ──
  const coreGeo = new THREE.CylinderGeometry(50, 50, 130, 48);
  const core = new THREE.Mesh(coreGeo, Materials.rotorCore);
  core.position.y = 0;
  rotorGroup.add(core);

  // Visible lamination lines
  for (let i = -6; i <= 6; i++) {
    const lineGeo = new THREE.TorusGeometry(50.5, 0.3, 8, 48);
    const line = new THREE.Mesh(lineGeo, Materials.rotorCore);
    line.position.y = i * 10;
    line.rotation.x = Math.PI / 2;
    rotorGroup.add(line);
  }

  // ── Neodymium magnets (8 poles, surface-mounted) ──
  const numMagnets = 8;
  const magnetW = 14;
  const magnetH = 100;
  const magnetD = 8;
  const magnetR = 53;

  for (let i = 0; i < numMagnets; i++) {
    const angle = (i / numMagnets) * Math.PI * 2;
    // Surface-mounted magnet with slight curvature
    const magnetGeo = new THREE.BoxGeometry(magnetW, magnetH, magnetD);
    const magnet = new THREE.Mesh(magnetGeo, Materials.magnet);

    // Position on rotor surface
    const r = magnetR + magnetD / 2;
    magnet.position.set(
      r * Math.cos(angle),
      0,
      r * Math.sin(angle)
    );
    magnet.rotation.y = -angle;
    rotorGroup.add(magnet);

    // Alternate polarity marking (N/S subtle indicator)
    if (i % 2 === 0) {
      const markerGeo = new THREE.BoxGeometry(magnetW * 0.6, 4, 1);
      const markerMat = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0xff2222,
        emissiveIntensity: 0.15,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(
        (r + magnetD / 2 + 1) * Math.cos(angle),
        magnetH / 2 + 2,
        (r + magnetD / 2 + 1) * Math.sin(angle)
      );
      marker.rotation.y = -angle;
      rotorGroup.add(marker);
    }
  }

  // ── Shaft ──
  const shaftGroup = new THREE.Group();
  shaftGroup.name = 'shaft';

  // Main shaft body
  const shaftGeo = new THREE.CylinderGeometry(18, 18, 220, 32);
  const shaftMesh = new THREE.Mesh(shaftGeo, Materials.shaft);
  shaftMesh.position.y = 0;
  shaftGroup.add(shaftMesh);

  // Shaft keyway (visible at ends)
  const keyGeo = new THREE.BoxGeometry(4, 2, 20);
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.8,
    roughness: 0.2,
  });
  const keyTop = new THREE.Mesh(keyGeo, keyMat);
  keyTop.position.set(0, 19, 105);
  shaftGroup.add(keyTop);

  const keyBottom = keyTop.clone();
  keyBottom.position.set(0, 19, -105);
  shaftGroup.add(keyBottom);

  rotorGroup.add(shaftGroup);

  rotorGroup.position.set(baseX, baseY, baseZ);
  group.add(rotorGroup);

  return rotorGroup;
}

/**
 * Build bearings (front and back)
 */
export function buildBearings(group, explodeFactor) {
  const bearingGroup = new THREE.Group();
  bearingGroup.name = 'bearings';

  const positions = [
    { z: 105 + explodeFactor * 30, name: 'front-bearing' },
    { z: -105 - explodeFactor * 30, name: 'back-bearing' },
  ];

  for (const pos of positions) {
    const bg = new THREE.Group();
    bg.name = pos.name;

    // Outer race
    const outerGeo = new THREE.TorusGeometry(30, 6, 16, 32);
    const outer = new THREE.Mesh(outerGeo, Materials.bearing);
    outer.rotation.x = Math.PI / 2;
    bg.add(outer);

    // Inner race
    const innerGeo = new THREE.TorusGeometry(20, 5, 16, 32);
    const inner = new THREE.Mesh(innerGeo, Materials.bearing);
    inner.rotation.x = Math.PI / 2;
    bg.add(inner);

    // Balls (8 balls)
    const numBalls = 8;
    for (let i = 0; i < numBalls; i++) {
      const ballAngle = (i / numBalls) * Math.PI * 2;
      const ballGeo = new THREE.SphereGeometry(4, 12, 12);
      const ball = new THREE.Mesh(ballGeo, Materials.bearingBall);
      ball.position.set(25 * Math.cos(ballAngle), 0, 25 * Math.sin(ballAngle));
      bg.add(ball);
    }

    bg.position.set(0, 0, pos.z);
    bearingGroup.add(bg);
  }

  group.add(bearingGroup);
  return bearingGroup;
}

/**
 * Build end caps (front and back)
 */
export function buildEndCaps(group, explodeFactor) {
  const capGroup = new THREE.Group();
  capGroup.name = 'end-caps';

  const frontZ = 130 + explodeFactor * 40;
  const backZ = -130 - explodeFactor * 40;

  // Front end cap
  const frontCap = buildSingleCap('front-end-cap');
  frontCap.position.z = frontZ;
  capGroup.add(frontCap);

  // Back end cap
  const backCap = buildSingleCap('back-end-cap');
  backCap.position.z = backZ;
  capGroup.add(backCap);

  group.add(capGroup);
  return capGroup;
}

function buildSingleCap(name) {
  const cap = new THREE.Group();
  cap.name = name;

  // Main disk
  const diskGeo = new THREE.CylinderGeometry(115, 115, 12, 48, 1, true);
  const disk = new THREE.Mesh(diskGeo, Materials.endCap);
  cap.add(disk);

  // Front face
  const faceGeo = new THREE.CircleGeometry(115, 48);
  const face = new THREE.Mesh(faceGeo, Materials.endCap);
  face.rotation.x = Math.PI / 2;
  face.position.y = 6;
  cap.add(face);

  // Center hub (bearing seat)
  const hubGeo = new THREE.CylinderGeometry(32, 32, 16, 32);
  const hub = new THREE.Mesh(hubGeo, Materials.endCap);
  hub.position.y = 0;
  cap.add(hub);

  // Mounting bolt holes (4 holes)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const holeGeo = new THREE.TorusGeometry(5, 2.5, 8, 12);
    const hole = new THREE.Mesh(holeGeo, new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.6,
      roughness: 0.4,
    }));
    hole.position.set(95 * Math.cos(angle), 0, 95 * Math.sin(angle));
    hole.rotation.x = Math.PI / 2;
    cap.add(hole);
  }

  // Cooling ribs on exterior
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(3, 14, 20);
    const rib = new THREE.Mesh(ribGeo, new THREE.MeshStandardMaterial({
      color: 0x34495e,
      metalness: 0.4,
      roughness: 0.6,
    }));
    rib.position.set(105 * Math.cos(angle), 7, 105 * Math.sin(angle));
    rib.lookAt(0, 7, 0);
    cap.add(rib);
  }

  return cap;
}

/**
 * Build terminal box
 */
export function buildTerminalBox(group, explodeFactor) {
  const tbGroup = new THREE.Group();
  tbGroup.name = 'terminal-box';

  const offsetX = 160 + explodeFactor * 50;

  // Box body
  const boxGeo = new THREE.BoxGeometry(50, 60, 40);
  const box = new THREE.Mesh(boxGeo, Materials.terminalBox);
  box.position.set(offsetX, 30, 0);
  tbGroup.add(box);

  // Lid / cover
  const lidGeo = new THREE.BoxGeometry(54, 6, 44);
  const lid = new THREE.Mesh(lidGeo, Materials.terminalBoxLid);
  lid.position.set(offsetX, 63, 0);
  tbGroup.add(lid);

  // Cable gland holes on top
  for (let i = 0; i < 3; i++) {
    const glandGeo = new THREE.CylinderGeometry(4, 6, 8, 12);
    const gland = new THREE.Mesh(glandGeo, new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5,
    }));
    gland.position.set(offsetX - 12 + i * 12, 67, 0);
    tbGroup.add(gland);
  }

  // Terminal connections inside (visible from cutaway)
  for (let i = 0; i < 3; i++) {
    const termGeo = new THREE.CylinderGeometry(3, 3, 15, 8);
    const term = new THREE.Mesh(termGeo, new THREE.MeshStandardMaterial({
      color: 0xcc8800,
      metalness: 0.8,
      roughness: 0.2,
    }));
    term.position.set(offsetX - 10 + i * 10, 40, 10);
    tbGroup.add(term);
  }

  // Cable coming out
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(offsetX, 67, 0),
    new THREE.Vector3(offsetX + 20, 80, 0),
    new THREE.Vector3(offsetX + 40, 80, 0),
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 12, 4, 8, false);
  const cable = new THREE.Mesh(cableGeo, Materials.cable);
  tbGroup.add(cable);

  group.add(tbGroup);
  return tbGroup;
}

/**
 * Build outer housing with cooling ribs
 */
export function buildHousing(group, explodeFactor) {
  const housingGroup = new THREE.Group();
  housingGroup.name = 'housing';

  // Main cylinder
  const housingGeo = new THREE.CylinderGeometry(120, 120, 150, 48, 1, true);
  const housingMesh = new THREE.Mesh(housingGeo, Materials.housing);
  housingGroup.add(housingMesh);

  // Cooling ribs along the body
  const numRibs = 18;
  for (let i = 0; i < numRibs; i++) {
    const ribGeo = new THREE.BoxGeometry(124, 4, 4);
    const rib = new THREE.Mesh(ribGeo, Materials.coolingRib);
    const angle = (i / numRibs) * Math.PI * 2;
    rib.position.set(
      122 * Math.cos(angle),
      0,
      122 * Math.sin(angle)
    );
    rib.lookAt(0, 0, 0);
    housingGroup.add(rib);
  }

  // Axial cooling ribs
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(3, 130, 4);
    const rib = new THREE.Mesh(ribGeo, Materials.coolingRib);
    rib.position.set(
      118 * Math.cos(angle),
      0,
      118 * Math.sin(angle)
    );
    rib.lookAt(0, 0, 0);
    housingGroup.add(rib);
  }

  group.add(housingGroup);
  return housingGroup;
}

/**
 * Build a cutaway section showing internal structure
 */
export function buildCutaway(group) {
  const cutawayGroup = new THREE.Group();
  cutawayGroup.name = 'cutaway';

  // A semi-transparent slice to suggest the cutaway section
  const sliceGeo = new THREE.CylinderGeometry(110, 110, 140, 48, 1, true);
  const sliceMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slice = new THREE.Mesh(sliceGeo, sliceMat);
  cutawayGroup.add(slice);

  group.add(cutawayGroup);
  return cutawayGroup;
}
