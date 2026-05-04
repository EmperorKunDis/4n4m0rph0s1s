/**
 * Scene Definitions Module
 *
 * Contains different 3D scenes that demonstrate the anamorphosis effect.
 * Each scene is designed to maximize the depth illusion when viewed with
 * head tracking enabled.
 */

import * as THREE from "three";

/**
 * Create the "Floating Cubes" scene - colorful cubes at varying depths
 */
export function createCubesScene(scene) {
  clearScene(scene);

  // Ambient light
  scene.add(new THREE.AmbientLight(0x404060, 0.6));

  // Directional light (sun-like)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(10, 20, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  scene.add(dirLight);

  // Point light for dramatic effect
  const pointLight = new THREE.PointLight(0x4488ff, 1.0, 60);
  pointLight.position.set(-5, 5, -10);
  scene.add(pointLight);

  // Floor plane (at screen level for best illusion)
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -16;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid on the floor
  const grid = new THREE.GridHelper(80, 40, 0x333355, 0x222244);
  grid.position.y = -15.9;
  grid.name = "grid";
  scene.add(grid);

  // Cubes at various depths - these create strong parallax
  const cubeData = [
    // Objects behind the screen (negative Z = deeper)
    { pos: [0, 0, -20], size: 6, color: 0xff4466, ry: 0.3 },
    { pos: [-12, 3, -35], size: 4, color: 0x44ff88, ry: 0.7 },
    { pos: [15, -2, -28], size: 5, color: 0x4488ff, ry: -0.4 },
    { pos: [-8, 8, -45], size: 3, color: 0xffaa22, ry: 1.2 },
    { pos: [10, 6, -50], size: 7, color: 0xaa44ff, ry: -0.8 },
    { pos: [0, -5, -15], size: 3, color: 0xff8844, ry: 0.5 },

    // Objects in front of screen (positive Z = popping out)
    { pos: [-6, 2, 8], size: 2.5, color: 0xff2288, ry: 0.9 },
    { pos: [8, -3, 12], size: 2, color: 0x22ffaa, ry: -1.1 },
    { pos: [0, 5, 6], size: 1.8, color: 0xffff44, ry: 0.2 },
  ];

  cubeData.forEach((data, i) => {
    const geo = new THREE.BoxGeometry(data.size, data.size, data.size);
    const mat = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.3,
      metalness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...data.pos);
    mesh.rotation.y = data.ry;
    mesh.rotation.x = data.ry * 0.3;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `cube_${i}`;
    mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.01;
    scene.add(mesh);
  });

  // Screen frame reference (wireframe rectangle at Z=0)
  const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(52, 32));
  const frameMat = new THREE.LineBasicMaterial({
    color: 0x666688,
    transparent: true,
    opacity: 0.3,
  });
  const frame = new THREE.LineSegments(frameGeo, frameMat);
  frame.name = "screenFrame";
  scene.add(frame);

  return {
    update(time) {
      scene.children.forEach((child) => {
        if (child.userData.rotSpeed) {
          child.rotation.y += child.userData.rotSpeed;
        }
      });
    },
  };
}

/**
 * Create the "Room Interior" scene - a room that extends behind the screen
 */
export function createRoomScene(scene) {
  clearScene(scene);

  scene.add(new THREE.AmbientLight(0x606080, 0.4));

  const dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  dirLight.position.set(5, 15, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);

  // Warm point light (like a lamp)
  const lampLight = new THREE.PointLight(0xffaa44, 1.5, 40);
  lampLight.position.set(0, 8, -20);
  lampLight.castShadow = true;
  scene.add(lampLight);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x8b7d6b,
    roughness: 0.9,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x4a3f35,
    roughness: 0.85,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -16, -20);
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 32), wallMat);
  backWall.position.set(0, 0, -50);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 32), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-20, 0, -20);
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 32), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(20, 0, -20);
  scene.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 60),
    new THREE.MeshStandardMaterial({ color: 0x9a9a8a, roughness: 0.9 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 16, -20);
  scene.add(ceiling);

  // Checkerboard floor pattern
  const grid = new THREE.GridHelper(40, 20, 0x666655, 0x333322);
  grid.position.set(0, -15.9, -20);
  grid.name = "grid";
  scene.add(grid);

  // Table
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x654321,
    roughness: 0.7,
  });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 8), tableMat);
  tableTop.position.set(0, -8, -25);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  scene.add(tableTop);

  // Table legs
  const legGeo = new THREE.BoxGeometry(0.5, 7.5, 0.5);
  [
    [-5, -12, -21],
    [5, -12, -21],
    [-5, -12, -29],
    [5, -12, -29],
  ].forEach((pos) => {
    const leg = new THREE.Mesh(legGeo, tableMat);
    leg.position.set(...pos);
    leg.castShadow = true;
    scene.add(leg);
  });

  // Objects on table
  const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const sphere = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshStandardMaterial({
      color: 0xcc3344,
      roughness: 0.2,
      metalness: 0.8,
    }),
  );
  sphere.position.set(-3, -6.5, -24);
  sphere.castShadow = true;
  scene.add(sphere);

  const vaseGeo = new THREE.CylinderGeometry(0.8, 1.2, 4, 16);
  const vase = new THREE.Mesh(
    vaseGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2255aa,
      roughness: 0.3,
      metalness: 0.5,
    }),
  );
  vase.position.set(3, -5.7, -25);
  vase.castShadow = true;
  scene.add(vase);

  // Picture frame on back wall
  const frameGeo = new THREE.BoxGeometry(10, 7, 0.3);
  const frameMesh = new THREE.Mesh(
    frameGeo,
    new THREE.MeshStandardMaterial({
      color: 0x997744,
      roughness: 0.6,
    }),
  );
  frameMesh.position.set(0, 4, -49.5);
  scene.add(frameMesh);

  // Picture "canvas"
  const canvasGeo = new THREE.PlaneGeometry(9, 6);
  const canvasMesh = new THREE.Mesh(
    canvasGeo,
    new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 1.0,
    }),
  );
  canvasMesh.position.set(0, 4, -49.3);
  scene.add(canvasMesh);

  // Screen frame reference
  const screenFrameGeo = new THREE.EdgesGeometry(
    new THREE.PlaneGeometry(52, 32),
  );
  const screenFrame = new THREE.LineSegments(
    screenFrameGeo,
    new THREE.LineBasicMaterial({
      color: 0x666688,
      transparent: true,
      opacity: 0.2,
    }),
  );
  screenFrame.name = "screenFrame";
  scene.add(screenFrame);

  return {
    update(time) {
      lampLight.intensity = 1.5 + Math.sin(time * 2) * 0.1;
    },
  };
}

/**
 * Create the "Greek Pillars" scene - columns receding into depth
 */
export function createPillarsScene(scene) {
  clearScene(scene);

  scene.add(new THREE.AmbientLight(0x8899bb, 0.5));

  const sunLight = new THREE.DirectionalLight(0xffeebb, 1.2);
  sunLight.position.set(20, 30, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  scene.add(sunLight);

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc8,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 100), marbleMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -16, -30);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(60, 30, 0x998877, 0x776655);
  grid.position.set(0, -15.9, -30);
  grid.name = "grid";
  scene.add(grid);

  // Pillars in two rows receding into distance
  const pillarRadius = 1.5;
  const pillarHeight = 30;
  const pillarGeo = new THREE.CylinderGeometry(
    pillarRadius,
    pillarRadius * 1.1,
    pillarHeight,
    16,
  );
  const capGeo = new THREE.CylinderGeometry(
    pillarRadius * 1.5,
    pillarRadius * 1.5,
    1.5,
    16,
  );

  for (let i = 0; i < 8; i++) {
    const z = -10 - i * 10;

    [-12, 12].forEach((x) => {
      const pillar = new THREE.Mesh(pillarGeo, marbleMat);
      pillar.position.set(x, -1, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);

      // Capital (top)
      const topCap = new THREE.Mesh(capGeo, marbleMat);
      topCap.position.set(x, pillarHeight / 2 - 1, z);
      topCap.castShadow = true;
      scene.add(topCap);

      // Base
      const baseCap = new THREE.Mesh(capGeo, marbleMat);
      baseCap.position.set(x, -pillarHeight / 2, z);
      scene.add(baseCap);
    });
  }

  // Architrave (beam across top of pillars)
  const beamGeo = new THREE.BoxGeometry(28, 2, 80);
  const beam = new THREE.Mesh(beamGeo, marbleMat);
  beam.position.set(0, pillarHeight / 2 + 0.5, -40);
  beam.castShadow = true;
  scene.add(beam);

  // Statue at far end
  const bodyGeo = new THREE.CylinderGeometry(2, 3, 12, 16);
  const headGeo = new THREE.SphereGeometry(2, 16, 16);
  const statueMat = new THREE.MeshStandardMaterial({
    color: 0xd4c8b0,
    roughness: 0.4,
  });

  const body = new THREE.Mesh(bodyGeo, statueMat);
  body.position.set(0, -10, -75);
  body.castShadow = true;
  scene.add(body);

  const head = new THREE.Mesh(headGeo, statueMat);
  head.position.set(0, -2, -75);
  head.castShadow = true;
  scene.add(head);

  // Screen frame
  const screenFrameGeo = new THREE.EdgesGeometry(
    new THREE.PlaneGeometry(52, 32),
  );
  const screenFrame = new THREE.LineSegments(
    screenFrameGeo,
    new THREE.LineBasicMaterial({
      color: 0x666688,
      transparent: true,
      opacity: 0.2,
    }),
  );
  screenFrame.name = "screenFrame";
  scene.add(screenFrame);

  return { update(time) {} };
}

/**
 * Create the "Tunnel" scene - a corridor that draws you in
 */
export function createTunnelScene(scene) {
  clearScene(scene);

  scene.add(new THREE.AmbientLight(0x222244, 0.3));

  // Neon lights along tunnel
  const colors = [0xff0066, 0x00ffcc, 0x4400ff, 0xff6600, 0x00ff66];
  const lights = [];

  for (let i = 0; i < 10; i++) {
    const color = colors[i % colors.length];
    const light = new THREE.PointLight(color, 2, 20);
    light.position.set(
      Math.sin(i * 0.8) * 6,
      Math.cos(i * 0.8) * 4 + 2,
      -10 - i * 12,
    );
    light.userData.baseIntensity = 2;
    light.userData.phase = i * 0.5;
    lights.push(light);
    scene.add(light);
  }

  // Tunnel walls using segments
  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.6,
    metalness: 0.8,
    side: THREE.DoubleSide,
  });

  const segmentLength = 12;
  const segmentCount = 12;
  const tunnelWidth = 14;
  const tunnelHeight = 14;

  for (let i = 0; i < segmentCount; i++) {
    const z = -4 - i * segmentLength;
    const twist = i * 0.05;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(tunnelWidth, segmentLength);
    const floorMesh = new THREE.Mesh(floorGeo, tunnelMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.rotation.z = twist;
    floorMesh.position.set(0, -tunnelHeight / 2, z - segmentLength / 2);
    scene.add(floorMesh);

    // Ceiling
    const ceilMesh = new THREE.Mesh(floorGeo.clone(), tunnelMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.rotation.z = -twist;
    ceilMesh.position.set(0, tunnelHeight / 2, z - segmentLength / 2);
    scene.add(ceilMesh);

    // Left wall
    const wallGeo = new THREE.PlaneGeometry(segmentLength, tunnelHeight);
    const leftWall = new THREE.Mesh(wallGeo, tunnelMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-tunnelWidth / 2, 0, z - segmentLength / 2);
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo.clone(), tunnelMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(tunnelWidth / 2, 0, z - segmentLength / 2);
    scene.add(rightWall);

    // Edge glow lines
    const edgeColor = colors[i % colors.length];
    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.6,
    });

    // Bottom edges
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-tunnelWidth / 2, -tunnelHeight / 2, z),
      new THREE.Vector3(-tunnelWidth / 2, -tunnelHeight / 2, z - segmentLength),
    ]);
    scene.add(new THREE.Line(lineGeo, edgeMat));

    const lineGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(tunnelWidth / 2, -tunnelHeight / 2, z),
      new THREE.Vector3(tunnelWidth / 2, -tunnelHeight / 2, z - segmentLength),
    ]);
    scene.add(new THREE.Line(lineGeo2, edgeMat));

    // Top edges
    const lineGeo3 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-tunnelWidth / 2, tunnelHeight / 2, z),
      new THREE.Vector3(-tunnelWidth / 2, tunnelHeight / 2, z - segmentLength),
    ]);
    scene.add(new THREE.Line(lineGeo3, edgeMat));

    const lineGeo4 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(tunnelWidth / 2, tunnelHeight / 2, z),
      new THREE.Vector3(tunnelWidth / 2, tunnelHeight / 2, z - segmentLength),
    ]);
    scene.add(new THREE.Line(lineGeo4, edgeMat));
  }

  // Grid
  const grid = new THREE.GridHelper(
    tunnelWidth,
    tunnelWidth,
    0x222266,
    0x111144,
  );
  grid.position.set(0, -tunnelHeight / 2 + 0.1, -60);
  grid.name = "grid";
  scene.add(grid);

  // Screen frame
  const screenFrameGeo = new THREE.EdgesGeometry(
    new THREE.PlaneGeometry(52, 32),
  );
  const screenFrame = new THREE.LineSegments(
    screenFrameGeo,
    new THREE.LineBasicMaterial({
      color: 0x666688,
      transparent: true,
      opacity: 0.2,
    }),
  );
  screenFrame.name = "screenFrame";
  scene.add(screenFrame);

  return {
    update(time) {
      lights.forEach((l) => {
        l.intensity =
          l.userData.baseIntensity *
          (0.6 + 0.4 * Math.sin(time * 3 + l.userData.phase));
      });
    },
  };
}

/**
 * Remove all objects from scene and reset background/fog to defaults
 */
function clearScene(scene) {
  scene.background = new THREE.Color(0x0a0a15);
  scene.fog = new THREE.Fog(0x0a0a15, 80, 200);

  while (scene.children.length > 0) {
    const obj = scene.children[0];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    scene.remove(obj);
  }
}

/**
 * Create the "Cheb" scene — real 3D city from OpenStreetMap data.
 * Buildings rendered with per-category facade canvas textures + separate
 * roof meshes, OSM-derived ground map texture, and Three.js Sky shader.
 *
 * @param {THREE.Scene} scene
 * @param {function(number, string): void} [onProgress] - callback(percent 0-100, message)
 */
export async function createChebScene(scene, onProgress) {
  clearScene(scene);
  scene.background = null;
  scene.fog = null;

  // ---- smoke-test: if this log appears, function is running ----
  console.log("[Cheb] createChebScene started");

  onProgress?.(0, "Načítám OSM data Chebu...");

  // --- Constants ---
  const CENTER_LAT = 50.0741;
  const CENTER_LON = 12.3701;
  const METERS_PER_DEG_LAT = 110540;
  const METERS_PER_DEG_LON = 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);
  const SCALE = 0.4; // 1 Three.js unit ≈ 2.5 m
  const GROUND_LEVEL = -5; // near-horizontal street-level view
  const CITY_Z_OFFSET = -15; // city behind the screen

  const BBOX = [50.065, 12.352, 50.086, 12.392]; // [minLat, minLon, maxLat, maxLon]
  const [minLat, minLon, maxLat, maxLon] = BBOX;

  function latLonToXY(lat, lon) {
    return {
      x: (lon - CENTER_LON) * METERS_PER_DEG_LON * SCALE,
      y: (lat - CENTER_LAT) * METERS_PER_DEG_LAT * SCALE,
    };
  }

  function signedArea(pts) {
    let a = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const j = (i + 1) % n;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return a * 0.5;
  }

  // --- Fetch OSM data — buildings + roads + parks (cached 24 h) ---
  const CACHE_KEY = "cheb_osm_v3";
  const CACHE_TTL = 86400000;
  let osmData = null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < CACHE_TTL) osmData = parsed.data;
    }
  } catch {
    /* storage unavailable */
  }

  if (!osmData) {
    const bboxStr = BBOX.join(",");
    const query = [
      "[out:json][timeout:30];",
      "(",
      `way["building"](${bboxStr});`,
      `way["highway"]["highway"!~"track|service|path"](${bboxStr});`,
      `way["landuse"~"park|grass|garden|cemetery|recreation_ground"](${bboxStr});`,
      `way["leisure"~"park|garden|pitch|playground"](${bboxStr});`,
      ");",
      "out body;>;out skel qt;",
    ].join("");
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    );
    if (!res.ok) throw new Error(`Overpass API ${res.status}`);
    osmData = await res.json();
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data: osmData }),
      );
    } catch {
      /* storage full */
    }
  }

  onProgress?.(30, "Načítám fotografie fasád...");

  // --- Real photo facade textures ---
  const PHOTO_PATHS = {
    historic: "textures/cheb/Cheb06.jpg",
    residential: "textures/cheb/Cheb07.jpg",
    commercial: "textures/cheb/Cheb04.jpg",
    other: "textures/cheb/Cheb08.jpeg",
  };

  const photoTextures = {};
  await Promise.all(
    Object.entries(PHOTO_PATHS).map(
      ([cat, path]) =>
        new Promise((res) => {
          new THREE.TextureLoader().load(
            path,
            (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              t.colorSpace = THREE.SRGBColorSpace;
              photoTextures[cat] = t;
              res();
            },
            undefined,
            () => {
              photoTextures[cat] = null;
              res();
            },
          );
        }),
    ),
  );

  onProgress?.(35, "Generuji textury...");

  const nodeMap = new Map();
  osmData.elements.forEach((el) => {
    if (el.type === "node") nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
  });

  // --- Ground canvas texture from OSM data ---
  function buildGroundCanvas() {
    const SIZE = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");

    function toPx(lat, lon) {
      const u = (lon - minLon) / (maxLon - minLon);
      const v = 1 - (lat - minLat) / (maxLat - minLat);
      return [u * SIZE, v * SIZE];
    }

    function drawWay(nodeIds, fillColor, strokeColor, lineWidth) {
      if (!nodeIds) return;
      const pts = nodeIds
        .map((id) => nodeMap.get(id))
        .filter(Boolean)
        .map((n) => toPx(n.lat, n.lon));
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (fillColor) {
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth || 1;
        ctx.stroke();
      }
    }

    // 1. Base — stone pavement
    ctx.fillStyle = "#e8e0d0";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const els = osmData.elements;

    // 2. Parks / greenery
    els.forEach((el) => {
      if (el.type !== "way") return;
      if (
        el.tags?.landuse?.match(
          /park|grass|garden|cemetery|recreation_ground/,
        ) ||
        el.tags?.leisure?.match(/park|garden|pitch|playground/)
      )
        drawWay(el.nodes, "#c8e4b8", null);
    });

    // 3. Building footprints (subtle darker fill)
    els.forEach((el) => {
      if (el.type === "way" && el.tags?.building)
        drawWay(el.nodes, "#d0c8b8", null);
    });

    // 4. Major roads
    els.forEach((el) => {
      if (el.type !== "way" || !el.tags?.highway) return;
      if (
        ["motorway", "trunk", "primary", "secondary"].includes(el.tags.highway)
      )
        drawWay(el.nodes, null, "#b8b0a8", 14);
    });

    // 5. Minor roads
    els.forEach((el) => {
      if (el.type !== "way" || !el.tags?.highway) return;
      if (
        ["tertiary", "residential", "unclassified", "living_street"].includes(
          el.tags.highway,
        )
      )
        drawWay(el.nodes, null, "#c8c0b8", 8);
    });

    // 6. Pedestrian / footway
    els.forEach((el) => {
      if (el.type !== "way" || !el.tags?.highway) return;
      if (
        ["pedestrian", "footway", "steps", "cycleway"].includes(el.tags.highway)
      )
        drawWay(el.nodes, null, "#d8d0c0", 4);
    });

    return canvas;
  }

  // --- Facade canvas textures (Cheb baroque colour palette) ---
  function shadeHex(hex, f) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + f))));
    return `rgb(${a(r)},${a(g)},${a(b)})`;
  }

  const FACADE_PALETTE = {
    historic: { wall: "#d4c090", win: "#7090c0" },
    residential: { wall: "#e8d870", win: "#88a8cc" },
    commercial: { wall: "#c0b8ac", win: "#9ab0c0" },
    industrial: { wall: "#a8a898", win: "#888880" },
    other: { wall: "#d4c8b0", win: "#7888a0" },
  };

  function buildFacadeTexture(category) {
    const { wall, win } = FACADE_PALETTE[category] || FACADE_PALETTE.other;
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");

    // Base wall
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, S, S);

    // Horizontal floor-separation lines
    ctx.strokeStyle = shadeHex(wall, -0.1);
    ctx.lineWidth = 1.5;
    for (let y = 64; y < S - 20; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(S, y);
      ctx.stroke();
    }

    // Darker socle at bottom
    ctx.fillStyle = shadeHex(wall, -0.15);
    ctx.fillRect(0, S - 20, S, 20);

    // Window grid
    const wW = 28,
      wH = 40,
      gX = 48,
      gY = 64;
    for (let wy = 14; wy + wH < S - 20; wy += gY) {
      for (let wx = 12; wx + wW < S; wx += gX) {
        ctx.fillStyle = "rgba(255,255,255,0.55)"; // white frame
        ctx.fillRect(wx - 2, wy - 2, wW + 4, wH + 4);
        ctx.fillStyle = win; // glass colour
        ctx.fillRect(wx, wy, wW, wH);
        ctx.fillStyle = "rgba(255,255,255,0.28)"; // glare
        ctx.fillRect(wx + 2, wy + 2, wW / 2 - 2, Math.floor(wH / 3));
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Roof material — terracotta tile
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x885540,
    roughness: 0.95,
  });

  // Per-category facade materials — use real photo if available, else canvas
  const facadeMats = {};
  const CATS = ["historic", "residential", "commercial", "industrial", "other"];
  for (const cat of CATS) {
    const photoTex = photoTextures[cat] ?? null;
    facadeMats[cat] = new THREE.MeshStandardMaterial({
      map: photoTex ?? buildFacadeTexture(cat),
      roughness: 0.85,
    });
    facadeMats[cat]._isPhoto = !!photoTex;
  }

  // --- Category / height helpers ---
  function categorize(tags) {
    const b = tags.building;
    if (
      tags.historic ||
      ["church", "cathedral", "castle", "chapel", "monastery"].includes(b)
    )
      return "historic";
    if (
      [
        "residential",
        "apartments",
        "house",
        "detached",
        "terrace",
        "dormitory",
      ].includes(b)
    )
      return "residential";
    if (
      [
        "commercial",
        "retail",
        "office",
        "supermarket",
        "shop",
        "hotel",
      ].includes(b)
    )
      return "commercial";
    if (["industrial", "warehouse", "factory", "storage_tank"].includes(b))
      return "industrial";
    return "other";
  }

  function buildingHeight(tags) {
    if (tags.height) return (parseFloat(tags.height) || 8) * SCALE;
    if (tags["building:levels"])
      return Math.max(1, parseFloat(tags["building:levels"])) * 3.5 * SCALE;
    const b = tags.building;
    if (["church", "cathedral", "chapel", "castle", "monastery"].includes(b))
      return 25 * SCALE;
    if (["commercial", "office", "hotel"].includes(b)) return 14 * SCALE;
    if (["industrial", "warehouse"].includes(b)) return 10 * SCALE;
    return 8 * SCALE;
  }

  onProgress?.(45, "Generuji budovy...");

  // Geometry buckets:
  //   facadeBuckets[cat] → full ExtrudeGeometry (walls + caps) with facade mat
  //   roofGeos           → flat ShapeGeometry at building top with roof mat
  const facadeBuckets = Object.fromEntries(CATS.map((c) => [c, []]));
  const roofGeos = [];
  let buildingCount = 0;

  osmData.elements
    .filter((el) => el.type === "way" && el.tags?.building)
    .forEach((way) => {
      const nodeIds = way.nodes?.slice(0, -1);
      if (!nodeIds || nodeIds.length < 3) return;

      const pts = nodeIds
        .map((id) => {
          const n = nodeMap.get(id);
          return n ? latLonToXY(n.lat, n.lon) : null;
        })
        .filter(Boolean);

      if (pts.length < 3) return;
      if (signedArea(pts) < 0) pts.reverse();

      try {
        const shape = new THREE.Shape(
          pts.map((p) => new THREE.Vector2(p.x, p.y)),
        );
        const height = buildingHeight(way.tags);

        // Full extrusion — walls + caps share the facade material.
        // ExtrudeGeometry's default WorldUVGenerator gives UVs in shape-space
        // units; with RepeatWrapping and repeat=0.5 the texture tiles every
        // 2 units ≈ 5 m, which gives a realistic window grid density.
        const extGeo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        });
        extGeo.rotateX(-Math.PI / 2);
        facadeBuckets[categorize(way.tags)].push(extGeo);

        // Flat roof polygon at building top
        const rGeo = new THREE.ShapeGeometry(shape);
        rGeo.rotateX(-Math.PI / 2);
        rGeo.translate(0, height, 0);
        roofGeos.push(rGeo);

        buildingCount++;
      } catch {
        /* skip degenerate polygon */
      }
    });

  console.log(`[Cheb] ${buildingCount} buildings built`);
  onProgress?.(75, "Optimalizuji mesh...");

  const { mergeGeometries } =
    await import("three/addons/utils/BufferGeometryUtils.js");

  const cityGroup = new THREE.Group();
  cityGroup.position.set(0, GROUND_LEVEL, CITY_Z_OFFSET);

  // Per-category facade meshes (full extrude: walls + base caps)
  for (const [cat, geos] of Object.entries(facadeBuckets)) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos);
    if (!merged) continue;
    // UV repeat: photo textures crop out sky/pavement; canvas textures tile windows
    if (facadeMats[cat]._isPhoto) {
      facadeMats[cat].map.repeat.set(1.5, 0.4);
      facadeMats[cat].map.offset.set(0, 0.15);
    } else {
      facadeMats[cat].map.repeat.set(0.5, 0.5);
    }
    const mesh = new THREE.Mesh(merged, facadeMats[cat]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);
  }

  // Single merged roof mesh for all buildings
  if (roofGeos.length) {
    const merged = mergeGeometries(roofGeos);
    if (merged) {
      const mesh = new THREE.Mesh(merged, roofMat);
      mesh.receiveShadow = true;
      cityGroup.add(mesh);
    }
  }

  scene.add(cityGroup);

  // --- Ground plane with OSM-derived canvas texture ---
  onProgress?.(85, "Generuji terén...");

  const groundTex = new THREE.CanvasTexture(buildGroundCanvas());

  // Exact bbox dimensions in Three.js units
  const bboxW = (maxLon - minLon) * METERS_PER_DEG_LON * SCALE;
  const bboxD = (maxLat - minLat) * METERS_PER_DEG_LAT * SCALE;
  // Bbox centre in cityGroup's local space (shape Y → world -Z after rotateX)
  const bcx = ((minLon + maxLon) / 2 - CENTER_LON) * METERS_PER_DEG_LON * SCALE;
  const bcy = ((minLat + maxLat) / 2 - CENTER_LAT) * METERS_PER_DEG_LAT * SCALE;

  const groundGeo = new THREE.PlaneGeometry(bboxW + 40, bboxD + 40);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1.0 }),
  );
  groundMesh.position.set(bcx, 0, -bcy);
  groundMesh.receiveShadow = true;
  cityGroup.add(groundMesh);

  // --- Atmospheric sky ---
  const { Sky } = await import("three/addons/objects/Sky.js");
  const sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  const sunVec = new THREE.Vector3();
  // Afternoon sun: elevation 35°, SW azimuth (typical Cheb afternoon light)
  sunVec.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - 35),
    THREE.MathUtils.degToRad(225),
  );
  sky.material.uniforms["sunPosition"].value.copy(sunVec);
  sky.material.uniforms["turbidity"].value = 4;
  sky.material.uniforms["rayleigh"].value = 1.5;
  sky.material.uniforms["mieCoefficient"].value = 0.003;
  sky.material.uniforms["mieDirectionalG"].value = 0.7;

  // Light haze to match horizon colour
  scene.fog = new THREE.FogExp2(0xc8dff0, 0.0025);

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0x8aaabb, 0.6));
  scene.add(new THREE.HemisphereLight(0x88aadd, 0x4a7a4a, 0.5));

  const sun = new THREE.DirectionalLight(0xfffcee, 1.2);
  sun.position.copy(sunVec).multiplyScalar(100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.far = 400;
  scene.add(sun);

  // Screen frame (subtle cyan tint for daytime)
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(52, 32)),
    new THREE.LineBasicMaterial({
      color: 0xaaccee,
      transparent: true,
      opacity: 0.3,
    }),
  );
  frame.name = "screenFrame";
  scene.add(frame);

  console.log(`[Cheb] ${buildingCount} budov`);
  onProgress?.(100, `Cheb načten — ${buildingCount} budov`);

  return {
    update(time) {
      sun.intensity = 1.15 + 0.07 * Math.sin(time * 0.12);
    },
    // Head movement rotates camera instead of translating eye position.
    // Prevents the "flying hundreds of meters" effect caused by SCALE mismatch.
    lookAroundMode: true,
    fovH: 80, // ±40° horizontal sweep on full head movement
    fovV: 40, // ±20° vertical
  };
}
