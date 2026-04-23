/**
 * Scene Definitions Module
 *
 * Contains different 3D scenes that demonstrate the anamorphosis effect.
 * Each scene is designed to maximize the depth illusion when viewed with
 * head tracking enabled.
 */

import * as THREE from 'three';

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
    grid.name = 'grid';
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
    const frameGeo = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(52, 32)
    );
    const frameMat = new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.3 });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    frame.name = 'screenFrame';
    scene.add(frame);

    return {
        update(time) {
            scene.children.forEach(child => {
                if (child.userData.rotSpeed) {
                    child.rotation.y += child.userData.rotSpeed;
                }
            });
        }
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

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a3f35, roughness: 0.85 });

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
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 60),
        new THREE.MeshStandardMaterial({ color: 0x9a9a8a, roughness: 0.9 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 16, -20);
    scene.add(ceiling);

    // Checkerboard floor pattern
    const grid = new THREE.GridHelper(40, 20, 0x666655, 0x333322);
    grid.position.set(0, -15.9, -20);
    grid.name = 'grid';
    scene.add(grid);

    // Table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 8), tableMat);
    tableTop.position.set(0, -8, -25);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);

    // Table legs
    const legGeo = new THREE.BoxGeometry(0.5, 7.5, 0.5);
    [[-5, -12, -21], [5, -12, -21], [-5, -12, -29], [5, -12, -29]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(...pos);
        leg.castShadow = true;
        scene.add(leg);
    });

    // Objects on table
    const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const sphere = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({
        color: 0xcc3344, roughness: 0.2, metalness: 0.8,
    }));
    sphere.position.set(-3, -6.5, -24);
    sphere.castShadow = true;
    scene.add(sphere);

    const vaseGeo = new THREE.CylinderGeometry(0.8, 1.2, 4, 16);
    const vase = new THREE.Mesh(vaseGeo, new THREE.MeshStandardMaterial({
        color: 0x2255aa, roughness: 0.3, metalness: 0.5,
    }));
    vase.position.set(3, -5.7, -25);
    vase.castShadow = true;
    scene.add(vase);

    // Picture frame on back wall
    const frameGeo = new THREE.BoxGeometry(10, 7, 0.3);
    const frameMesh = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({
        color: 0x997744, roughness: 0.6,
    }));
    frameMesh.position.set(0, 4, -49.5);
    scene.add(frameMesh);

    // Picture "canvas"
    const canvasGeo = new THREE.PlaneGeometry(9, 6);
    const canvasMesh = new THREE.Mesh(canvasGeo, new THREE.MeshStandardMaterial({
        color: 0x334455, roughness: 1.0,
    }));
    canvasMesh.position.set(0, 4, -49.3);
    scene.add(canvasMesh);

    // Screen frame reference
    const screenFrameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(52, 32));
    const screenFrame = new THREE.LineSegments(screenFrameGeo,
        new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.2 }));
    screenFrame.name = 'screenFrame';
    scene.add(screenFrame);

    return {
        update(time) {
            lampLight.intensity = 1.5 + Math.sin(time * 2) * 0.1;
        }
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
    grid.name = 'grid';
    scene.add(grid);

    // Pillars in two rows receding into distance
    const pillarRadius = 1.5;
    const pillarHeight = 30;
    const pillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.1, pillarHeight, 16);
    const capGeo = new THREE.CylinderGeometry(pillarRadius * 1.5, pillarRadius * 1.5, 1.5, 16);

    for (let i = 0; i < 8; i++) {
        const z = -10 - i * 10;

        [-12, 12].forEach(x => {
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
    const statueMat = new THREE.MeshStandardMaterial({ color: 0xd4c8b0, roughness: 0.4 });

    const body = new THREE.Mesh(bodyGeo, statueMat);
    body.position.set(0, -10, -75);
    body.castShadow = true;
    scene.add(body);

    const head = new THREE.Mesh(headGeo, statueMat);
    head.position.set(0, -2, -75);
    head.castShadow = true;
    scene.add(head);

    // Screen frame
    const screenFrameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(52, 32));
    const screenFrame = new THREE.LineSegments(screenFrameGeo,
        new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.2 }));
    screenFrame.name = 'screenFrame';
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
            -10 - i * 12
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
        const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.6 });

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
    const grid = new THREE.GridHelper(tunnelWidth, tunnelWidth, 0x222266, 0x111144);
    grid.position.set(0, -tunnelHeight / 2 + 0.1, -60);
    grid.name = 'grid';
    scene.add(grid);

    // Screen frame
    const screenFrameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(52, 32));
    const screenFrame = new THREE.LineSegments(screenFrameGeo,
        new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.2 }));
    screenFrame.name = 'screenFrame';
    scene.add(screenFrame);

    return {
        update(time) {
            lights.forEach(l => {
                l.intensity = l.userData.baseIntensity *
                    (0.6 + 0.4 * Math.sin(time * 3 + l.userData.phase));
            });
        }
    };
}

/**
 * Remove all objects from scene (except camera)
 */
function clearScene(scene) {
    while (scene.children.length > 0) {
        const obj = scene.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
        scene.remove(obj);
    }
}
