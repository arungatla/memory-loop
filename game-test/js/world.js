// World class - Handles the 3D environment, terrain, and scene setup

class World {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = [];
    this.terrain = null;
    this.skybox = null;
    this.objects = [];
    this.obstacles = []; // Array for obstacles that player can collide with
    this.npcs = [];
    this.stats = null; // For performance monitoring
  }

  loadModels() {
    // This would load terrain, buildings, vegetation, etc.
    console.log("Loading world models...");
    // In a real implementation, we would use GLTFLoader to load 3D models
  }

  init() {
    console.log("World init started...");
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x88ccee, 0.002);
    console.log("Scene created");

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.set(0, 2, 5); // Set initial camera position
    console.log("Camera created");

    try {
      // Create renderer with error handling
      console.log("Creating WebGL renderer...");
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      });

      // Check if renderer was created successfully
      if (!this.renderer) {
        throw new Error("Failed to create WebGL renderer");
      }

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      // Clear to a dark color initially to check if renderer is working
      this.renderer.setClearColor(0x020617, 1);

      // Get the game container element
      const container = document.getElementById("game-container");
      if (!container) {
        throw new Error("Game container element not found");
      }

      container.appendChild(this.renderer.domElement);
      console.log("Renderer created and attached to DOM");
    } catch (error) {
      console.error("Error creating renderer:", error);
      alert(
        "Failed to initialize 3D renderer. Your browser may not support WebGL."
      );
      throw error;
    }

    // Add lights
    this.setupLights();

    // Create skybox
    this.createSkybox();

    // Create terrain
    this.createTerrain();

    // Add environmental objects
    this.addEnvironmentalObjects();

    // Add obstacles for collision detection
    this.addObstacles();

    // Add NPCs
    this.addNPCs();

    // Setup stats for performance monitoring
    if (this.game.config.showStats) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }
  }

  setupLights() {
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffcc, 1);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);
    this.lights.push(sunLight);

    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Hemisphere light for realistic outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0x88ccff, 0x444422, 0.5);
    this.scene.add(hemisphereLight);
    this.lights.push(hemisphereLight);
  }

  createSkybox() {
    // Simple color-based sky for now
    // In a real game, we would use a skybox texture or a sky shader
    this.scene.background = new THREE.Color(0x88ccff);
  }

  createTerrain() {
    // Create a simple flat terrain for now
    const geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0x33aa33,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    // In a real game, we would use heightmaps and more complex terrain generation
  }

  addEnvironmentalObjects() {
    // Add trees, rocks, buildings, etc.
    // For now, let's add some simple placeholder objects

    // Add some trees
    for (let i = 0; i < 50; i++) {
      this.addTree(Math.random() * 200 - 100, 0, Math.random() * 200 - 100);
    }

    // Add some rocks
    for (let i = 0; i < 30; i++) {
      this.addRock(Math.random() * 200 - 100, 0, Math.random() * 200 - 100);
    }

    // Add a central structure
    this.addCentralStructure();
  }

  addTree(x, y, z) {
    // Simple tree representation
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 2.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, y + 7, z);
    leaves.castShadow = true;

    this.scene.add(trunk);
    this.scene.add(leaves);
    this.objects.push(trunk, leaves);
  }

  addRock(x, y, z) {
    // Simple rock representation
    const rockGeometry = new THREE.DodecahedronGeometry(
      Math.random() * 1.5 + 0.5,
      0
    );
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + rockGeometry.parameters.radius / 2, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.set(
      1 + Math.random() * 0.5,
      1 + Math.random() * 0.5,
      1 + Math.random() * 0.5
    );
    rock.castShadow = true;
    rock.receiveShadow = true;

    this.scene.add(rock);
    this.objects.push(rock);
  }

  addCentralStructure() {
    // Add a central temple/structure
    const baseGeometry = new THREE.BoxGeometry(20, 2, 20);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 1, 0);
    base.receiveShadow = true;
    base.castShadow = true;

    const columnGeometry = new THREE.CylinderGeometry(1, 1, 10, 16);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });

    // Add columns at the corners
    const columnPositions = [
      [-8, 0, -8],
      [8, 0, -8],
      [8, 0, 8],
      [-8, 0, 8],
    ];

    const columns = [];
    columnPositions.forEach((pos) => {
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos[0], 6, pos[1]);
      column.castShadow = true;
      column.receiveShadow = true;
      columns.push(column);
      this.scene.add(column);
    });

    const roofGeometry = new THREE.BoxGeometry(22, 2, 22);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xbb9977 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 12, 0);
    roof.castShadow = true;

    this.scene.add(base);
    this.scene.add(roof);
    this.objects.push(base, ...columns, roof);
  }

  addNPCs() {
    // Add non-player characters to the world
    // In a real game, we would load character models and animations
    console.log("Adding NPCs to the world...");

    // For now, let's add some simple placeholder NPCs
    const npcPositions = [
      [10, 0, 10],
      [-10, 0, -10],
      [15, 0, -15],
      [-15, 0, 15],
    ];

    npcPositions.forEach((pos, index) => {
      this.addNPC(pos[0], pos[1], pos[2], `NPC_${index + 1}`);
    });
  }

  addNPC(x, y, z, name) {
    // Simple NPC representation
    let bodyGeometry;

    try {
      if (THREE.CustomCapsuleGeometry) {
        bodyGeometry = new THREE.CustomCapsuleGeometry(0.5, 1.5, 4, 8);
      } else {
        console.warn(
          "CustomCapsuleGeometry not available for NPC, using CylinderGeometry as fallback"
        );
        bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
      }
    } catch (error) {
      console.error("Error creating NPC geometry:", error);
      // Fallback to basic geometry
      bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 1.5, z);
    body.castShadow = true;

    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, y + 2.7, z);
    head.castShadow = true;

    // Group the NPC parts
    const npcGroup = new THREE.Group();
    npcGroup.add(body);
    npcGroup.add(head);
    npcGroup.userData = { type: "npc", name: name };

    this.scene.add(npcGroup);
    this.npcs.push(npcGroup);
  }

  addObstacles() {
    // Add obstacles for collision detection
    // In a real game, these would be more complex and loaded from models

    // Create some obstacle boxes around the world
    const obstacleGeometry = new THREE.BoxGeometry(3, 3, 3);
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8844aa,
    });

    // Add a few obstacles in strategic locations
    const obstaclePositions = [
      { x: 15, z: 15 },
      { x: -15, z: 15 },
      { x: 15, z: -15 },
      { x: -15, z: -15 },
      { x: 0, z: 25 },
      { x: 25, z: 0 },
      { x: 0, z: -25 },
      { x: -25, z: 0 },
    ];

    obstaclePositions.forEach((pos) => {
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(pos.x, 1.5, pos.z);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;

      // Create a bounding box for collision detection
      obstacle.boundingBox = new THREE.Box3().setFromObject(obstacle);
      obstacle.userData.isObstacle = true;

      this.scene.add(obstacle);
      this.obstacles.push(obstacle);
      this.objects.push(obstacle); // Also add to general objects array
    });
  }

  update() {
    try {
      // Update the world state
      if (this.stats) this.stats.begin();

      // Update obstacle bounding boxes if they've moved
      this.obstacles.forEach((obstacle) => {
        if (obstacle.boundingBox) {
          obstacle.boundingBox.setFromObject(obstacle);
        }
      });

      // Animate NPCs
      this.npcs.forEach((npc) => {
        npc.rotation.y += 0.01; // Simple rotation for now
      });

      // Make sure we have a valid renderer and camera
      if (!this.renderer || !this.camera) {
        console.error("Renderer or camera not initialized");
        return;
      }

      // Clear the renderer to ensure we're not seeing a black screen
      this.renderer.clear();

      // Render the scene
      this.renderer.render(this.scene, this.camera);

      if (this.stats) this.stats.end();
    } catch (error) {
      console.error("Error in world update:", error);
    }
  }

  resize() {
    // Handle window resize
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
}
