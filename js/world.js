class World {
  constructor(scene, loadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager || new THREE.LoadingManager();
    this.worldSize = 200; // Increased world size for more exploration space
    this.heightMap = null;
    this.terrainMesh = null;
    this.waterMesh = null;

    // Sky objects
    this.skybox = null;
    this.stars = null;
    this.moon = null;
    this.sunLight = null;
    this.moonLight = null;
    this.skyboxDay = null;
    this.skyboxNight = null;
    this.ambientLight = null;
    this.hemisphereLight = null;

    // Material references for day/night transitions
    this.terrainMaterial = null;
    this.waterMaterial = null;

    // Night stars
    this.stars = null;
    
    // Day/night cycle properties
    this.isNightTime = false;
    this.autoCycleActive = false;
    this.cycleDuration = 60; // Shorter cycle for testing (1 minute)
    this.timeOfDay = 0; // 0 = full day, 1 = full night
    this.lastCycleUpdate = Date.now();
    this.currentWorld = "main"; // Track current world for portal system
    
    // NPC system
    this.npcs = [];
    this.animals = [];
    this.houses = [];
    this.portals = [];

    // Create the basic environment
    this.createTerrain();
    this.createWater();
    this.createDayNightSkybox();
    this.createLighting();
    this.createTrees();
    this.createRocks();
    this.createGrass();
    this.createStarsAndMoon();
    this.createHouses();
    this.createNPCs();
    this.createAnimals();
    this.createPortals();
  }

  createTerrain() {
    // Generate a height map for the terrain
    this.generateHeightMap();

    // Create ground geometry with many segments for better detail
    const geometry = new THREE.PlaneGeometry(
      this.worldSize,
      this.worldSize,
      200, // much more width segments for better detail
      200 // much more height segments for better detail
    );

    // Apply height map to geometry
    const positionAttribute = geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const z = positionAttribute.getZ(i);

      // Get height at this position
      const height = this.getHeightAt(x, z);
      positionAttribute.setY(i, height);
    }

    // Rotate plane to be horizontal
    geometry.rotateX(-Math.PI / 2);

    // Update geometry normals for lighting
    geometry.computeVertexNormals();

    // Create ground materials with multiple textures
    const textureLoader = new THREE.TextureLoader(this.loadingManager);

    // Load high-quality textures for different terrain types
    const grassTexture = textureLoader.load(
      "https://threejs.org/examples/textures/terrain/grasslight-big.jpg"
    );
    const rockTexture = textureLoader.load(
      "https://threejs.org/examples/textures/terrain/backgrounddetailed6.jpg"
    );
    const dirtTexture = textureLoader.load(
      "https://threejs.org/examples/textures/terrain/grasslight-small.jpg"
    );

    // Add normal maps for better detail
    const grassNormalMap = textureLoader.load(
      "https://threejs.org/examples/textures/water/Water_1_M_Normal.jpg"
    );
    const rockNormalMap = textureLoader.load(
      "https://threejs.org/examples/textures/water/Water_2_M_Normal.jpg"
    );

    // Configure texture wrapping and repeat
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
    grassNormalMap.wrapS = grassNormalMap.wrapT = THREE.RepeatWrapping;
    rockNormalMap.wrapS = rockNormalMap.wrapT = THREE.RepeatWrapping;

    grassTexture.repeat.set(16, 16);
    rockTexture.repeat.set(10, 10);
    dirtTexture.repeat.set(8, 8);
    grassNormalMap.repeat.set(8, 8);
    rockNormalMap.repeat.set(10, 10);

    // Create vertex colors for the terrain with more forest-green variations
    const colors = [];
    const color = new THREE.Color();

    // Generate colors for each vertex based on height and slope
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Get height at this vertex
      const height = y;

      // Calculate slope using nearby vertices (if available)
      let slope = 0;
      if (i < positionAttribute.count - 1) {
        const nextY = positionAttribute.getY(i + 1);
        slope = Math.abs(nextY - y);
      }

      // Set color based on height and slope - forest green variations
      if (height < -1) {
        // Underwater - darker blue/green
        color.setRGB(0.1, 0.2 + slope * 0.2, 0.5);
      } else if (height < 1) {
        // Shore area - sandy green
        color.setRGB(0.4, 0.55, 0.3);
      } else if (height < 5) {
        // Low ground - deeper forest green
        color.setRGB(0.15 + slope * 0.05, 0.35 - slope * 0.05, 0.1);
      } else if (height < 12) {
        // Hills - mix of forest green and darker green
        color.setRGB(0.2 + slope * 0.1, 0.3 - slope * 0.05, 0.1);
      } else {
        // Mountain - rocky gray with green to white peaks
        const snowAmount = Math.max(0, Math.min(1, (height - 15) / 10));
        color.setRGB(
          0.3 + slope * 0.05 + snowAmount * 0.5,
          0.35 + slope * 0.05 + snowAmount * 0.5,
          0.3 + slope * 0.05 + snowAmount * 0.5
        );
      }

      colors.push(color.r, color.g, color.b);
    }

    // Add the colors to the geometry
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // Create more realistic terrain material with normal mapping for depth
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
      normalMap: grassNormalMap,
      normalScale: new THREE.Vector2(1, 1),
      bumpMap: rockTexture,
      bumpScale: 0.8,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      vertexColors: true, // Use the vertex colors we created
    });

    // Create the terrain mesh
    this.terrainMesh = new THREE.Mesh(geometry, this.terrainMaterial);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);
  }

  createWater() {
    // Create water surface with a more realistic look
    const waterGeometry = new THREE.PlaneGeometry(
      this.worldSize * 2,
      this.worldSize * 2,
      32,
      32
    );

    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0077be,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      envMapIntensity: 1.0,
    });

    this.waterMesh = new THREE.Mesh(waterGeometry, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -2.5; // Lower the water level to better see the terrain
    this.scene.add(this.waterMesh);

    // Create subtle waves with vertex displacement (simulation)
    this.waterVertices = [];
    for (let i = 0; i < waterGeometry.attributes.position.count; i++) {
      const x = waterGeometry.attributes.position.getX(i);
      const y = waterGeometry.attributes.position.getY(i);
      this.waterVertices.push({
        x: x,
        y: y,
        z: 0,
        originalZ: 0,
        ang: Math.random() * Math.PI * 2,
        amp: 0.1 + Math.random() * 0.1,
        speed: 0.016 + Math.random() * 0.032,
      });
    }
  }

  generateHeightMap() {
    // Use Perlin noise to generate a height map
    const mapSize = 200; // Increased for better precision
    this.heightMap = [];

    // Initialize height map array
    for (let x = 0; x < mapSize; x++) {
      this.heightMap[x] = [];
      for (let z = 0; z < mapSize; z++) {
        // Generate height value based on coordinates
        // Use multiple noise function layers for varying heights
        const nx = x / mapSize - 0.5;
        const nz = z / mapSize - 0.5;

        // Enhanced terrain generation with multiple noise scales and higher amplitude
        // Base terrain (large features) - mountains and valleys
        let height = this.noise(nx * 1.5, nz * 1.5) * 20; // Much higher amplitude

        // Medium details - hills
        height += this.noise(nx * 3, nz * 3) * 10;

        // Fine details - small hills and bumps
        height += this.noise(nx * 8, nz * 8) * 5;

        // Extra fine details - surface roughness
        height += this.noise(nx * 20, nz * 20) * 1.5;

        // Create more pronounced terrain features
        height = Math.pow(Math.abs(height), 0.8) * Math.sign(height);

        // Add central flat area for player spawn with gradual slope
        const dist = Math.sqrt(nx * nx + nz * nz) * 2;
        if (dist < 0.2) {
          const blendFactor = Math.min(1.0, dist / 0.2);
          const flatHeight = 5; // Flat plateau height
          height = flatHeight + blendFactor * (height - flatHeight);
        }

        // Elevate the entire terrain to ensure it's visible
        height = Math.max(height, 0);

        this.heightMap[x][z] = height;
      }
    }
  }

  // Simple noise function for height generation
  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = this.randomGradient(X + 1, Y + 1);
    const topLeft = this.randomGradient(X, Y + 1);
    const bottomRight = this.randomGradient(X + 1, Y);
    const bottomLeft = this.randomGradient(X, Y);

    // Interpolate between the gradients
    const tx1 = xf * xf * (3 - 2 * xf);
    const tx2 = 1 - tx1;

    const w1 = tx2 * (1 - yf);
    const w2 = tx1 * (1 - yf);
    const w3 = tx2 * yf;
    const w4 = tx1 * yf;

    return this.cosineInterpolate(
      this.cosineInterpolate(bottomLeft, bottomRight, tx1),
      this.cosineInterpolate(topLeft, topRight, tx1),
      yf
    );
  }

  randomGradient(ix, iy) {
    // A deterministic noise function
    const w = 8 * 16;
    const s = w / 2;
    let a = ix,
      b = iy;
    a *= 3284157443;
    b ^= (a << s) | (a >> (w - s));
    b *= 1911520717;
    a ^= (b << s) | (b >> (w - s));
    a *= 2048419325;
    const random = a * (Math.PI / ~(~0 >>> 1));
    return Math.sin(random);
  }

  cosineInterpolate(a, b, t) {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  createDayNightSkybox() {
    // Create both day and night skyboxes with more dramatic difference
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const textureLoader = new THREE.TextureLoader(this.loadingManager);

    // Create a custom day sky (gradient blue)
    const daySkyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },  // Bright blue at top
        bottomColor: { value: new THREE.Color(0xffffff) }, // White at horizon
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });

    // Create a custom night sky (dark blue with stars)
    const nightSkyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x000010) },  // Very dark blue
        bottomColor: { value: new THREE.Color(0x0a1025) }, // Slightly lighter at horizon
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });

    // Create day skybox with custom material
    this.skyboxDay = new THREE.Mesh(skyGeometry, daySkyMaterial);
    this.scene.add(this.skyboxDay);

    // Create night skybox but hide it initially
    this.skyboxNight = new THREE.Mesh(skyGeometry, nightSkyMaterial);
    this.skyboxNight.visible = false;
    this.scene.add(this.skyboxNight);
  }

  createStarsAndMoon() {
    // Create a moon for night time
    const moonGeometry = new THREE.SphereGeometry(30, 32, 32);
    const moonTexture = new THREE.TextureLoader(this.loadingManager).load(
      "https://threejs.org/examples/textures/planets/moon_1024.jpg"
    );
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      emissive: 0xffffff,
      emissiveMap: moonTexture,
      emissiveIntensity: 0.8,
    });

    this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
    this.moon.position.set(200, 150, -300);
    this.moon.visible = false;
    this.scene.add(this.moon);

    // Create stars
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];

    for (let i = 0; i < starCount; i++) {
      // Place stars on a sphere around the scene
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 400 + Math.random() * 100;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      starPositions.push(x, y, z);

      // Random star colors (mostly white but some blue/yellow tints)
      const r = 0.9 + Math.random() * 0.1;
      const g = 0.9 + Math.random() * 0.1;
      const b = 0.9 + Math.random() * 0.1;

      starColors.push(r, g, b);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starColors, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  createLighting() {
    // Create realistic lighting with shadows
    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(0xd6e6ff, 0.5); // Daylight ambient color
    this.scene.add(this.ambientLight);

    // Add directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffaa, 1.2); // Brighter, warmer sun
    this.sunLight.position.set(100, 100, 50);
    this.sunLight.castShadow = true;

    // Configure better shadows
    const shadowMapSize = 4096;
    this.sunLight.shadow.mapSize.width = shadowMapSize;
    this.sunLight.shadow.mapSize.height = shadowMapSize;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.0001; // Reduce shadow acne

    this.scene.add(this.sunLight);

    // Add moon light (directional but less intense and blueish)
    this.moonLight = new THREE.DirectionalLight(0xb0c4de, 0.3);
    this.moonLight.position.set(-100, 100, 50);
    this.moonLight.castShadow = true;

    // Configure moon shadows
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 500;
    this.moonLight.shadow.camera.left = -150;
    this.moonLight.shadow.camera.right = 150;
    this.moonLight.shadow.camera.top = 150;
    this.moonLight.shadow.camera.bottom = -150;
    this.moonLight.shadow.bias = -0.0001;

    // Initially hide the moon light
    this.moonLight.visible = false;
    this.scene.add(this.moonLight);

    // Add hemisphere light for better ambient lighting from the sky
    this.hemisphereLight = new THREE.HemisphereLight(
      0x0088ff, // Sky color
      0x00ff88, // Ground color
      0.5 // Intensity
    );
    this.scene.add(this.hemisphereLight);
  }

  createTrees() {
    // Create realistic trees scattered around the terrain
    const treeCount = 100; // Many more trees for a forest feel

    // Create a few different tree models for variety
    const treeModels = this.createTreeModels();

    for (let i = 0; i < treeCount; i++) {
      // Random position within the world bounds
      const x = Math.random() * this.worldSize - this.worldSize / 2;
      const z = Math.random() * this.worldSize - this.worldSize / 2;

      // Skip trees in the center spawn area
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 15) continue;

      // Get the height at this position
      const y = this.getHeightAt(x, z);

      // Only place trees on land, not in water
      if (y < 0) continue;

      // Select a random tree model
      const treeIndex = Math.floor(Math.random() * treeModels.length);
      const treeClone = treeModels[treeIndex].clone();

      // Scale and position the tree
      const scale = 0.8 + Math.random() * 0.6;
      treeClone.scale.set(scale, scale, scale);
      treeClone.position.set(x, y, z);
      treeClone.rotation.y = Math.random() * Math.PI * 2; // Random rotation

      // Add tree to the scene
      this.scene.add(treeClone);
    }
  }

  createTreeModels() {
    // Create a few tree model variations to add visual interest
    const models = [];

    // Tree model 1 - Pine
    const pineTree = new THREE.Group();

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.4, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 1.0,
      metalness: 0.0,
    });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    pineTree.add(trunk);

    // Foliage layers
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x2d4c1e,
      roughness: 1.0,
      metalness: 0.0,
    });

    const layerCount = 4;
    for (let i = 0; i < layerCount; i++) {
      const ratio = 1 - i / (layerCount - 1);
      const radius = 2 - ratio * 1.3;
      const height = 2;
      const y = 3 + i * 1.2;

      const foliageGeom = new THREE.ConeGeometry(radius, height, 8);
      const foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.y = y;
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      pineTree.add(foliage);
    }

    models.push(pineTree);

    // Tree model 2 - Oak
    const oakTree = new THREE.Group();

    // Trunk
    const oakTrunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 8);
    const oakTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x6d4c41,
      roughness: 1.0,
      metalness: 0.0,
    });
    const oakTrunk = new THREE.Mesh(oakTrunkGeom, oakTrunkMat);
    oakTrunk.position.y = 1.75;
    oakTrunk.castShadow = true;
    oakTrunk.receiveShadow = true;
    oakTree.add(oakTrunk);

    // Foliage
    const oakFoliageGeom = new THREE.SphereGeometry(2, 8, 8);
    const oakFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      roughness: 1.0,
      metalness: 0.0,
    });
    const oakFoliage = new THREE.Mesh(oakFoliageGeom, oakFoliageMat);
    oakFoliage.position.y = 4.5;
    oakFoliage.castShadow = true;
    oakFoliage.receiveShadow = true;
    oakTree.add(oakFoliage);

    models.push(oakTree);

    return models;
  }

  createRocks() {
    // Add scattered rocks for more visual interest
    const rockCount = 60;
    const rockGeometries = [
      new THREE.DodecahedronGeometry(1, 0), // Simple rock shapes
      new THREE.DodecahedronGeometry(1, 1),
      new THREE.IcosahedronGeometry(1, 0),
    ];

    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < rockCount; i++) {
      // Choose random geometry
      const geomIndex = Math.floor(Math.random() * rockGeometries.length);
      const rock = new THREE.Mesh(rockGeometries[geomIndex], rockMaterial);

      // Random position
      const x = Math.random() * this.worldSize - this.worldSize / 2;
      const z = Math.random() * this.worldSize - this.worldSize / 2;
      const y = this.getHeightAt(x, z);

      // Set position and add some random rotation/scale
      rock.position.set(x, y, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Vary the rock size
      const scale = 0.3 + Math.random() * 1.5;
      rock.scale.set(scale, scale * 0.8, scale);

      rock.castShadow = true;
      rock.receiveShadow = true;

      this.scene.add(rock);
    }
  }

  createGrass() {
    // Add patches of grass using instanced meshes for performance
    const instanceCount = 10000; // Lots of grass!

    // Grass blade geometry (simple plane)
    const grassGeometry = new THREE.PlaneGeometry(0.2, 0.8);
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    // Use instanced mesh for better performance
    const grass = new THREE.InstancedMesh(
      grassGeometry,
      grassMaterial,
      instanceCount
    );

    // Create and apply transformations for each grass blade
    const dummy = new THREE.Object3D();
    let index = 0;

    // Add grass in clusters for a more natural look
    const clusterCount = 50;
    for (let c = 0; c < clusterCount; c++) {
      // Random cluster position
      const clusterX = Math.random() * this.worldSize - this.worldSize / 2;
      const clusterZ = Math.random() * this.worldSize - this.worldSize / 2;
      const clusterRadius = 5 + Math.random() * 10;

      // Skip clusters in the center spawn area
      const distFromCenter = Math.sqrt(
        clusterX * clusterX + clusterZ * clusterZ
      );
      if (distFromCenter < 15) continue;

      // Add grass blades to the cluster
      const bladesInCluster = Math.floor(instanceCount / clusterCount);
      for (let i = 0; i < bladesInCluster && index < instanceCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * clusterRadius;
        const x = clusterX + Math.cos(angle) * radius;
        const z = clusterZ + Math.sin(angle) * radius;

        // Get height at this position
        const y = this.getHeightAt(x, z);

        // Skip underwater positions
        if (y < -1) continue;

        // Position the grass blade
        dummy.position.set(x, y, z);

        // Random rotation around Y axis
        dummy.rotation.y = Math.random() * Math.PI;

        // Subtle random tilt
        dummy.rotation.x = (Math.random() - 0.5) * 0.2;
        dummy.rotation.z = (Math.random() - 0.5) * 0.2;

        // Random scale variation
        const scaleY = 0.7 + Math.random() * 0.6;
        dummy.scale.set(1, scaleY, 1);

        // Update the instanced mesh
        dummy.updateMatrix();
        grass.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }

    grass.instanceMatrix.needsUpdate = true;
    this.scene.add(grass);
  }

  getHeightAt(x, z) {
    // Convert world coordinates to height map indices
    const mapSize = this.heightMap ? this.heightMap.length : 100;

    // Normalize coordinates to [0, 1] range
    const nx = (x + this.worldSize / 2) / this.worldSize;
    const nz = (z + this.worldSize / 2) / this.worldSize;

    // Convert to height map indices
    const ix = Math.floor(nx * (mapSize - 1));
    const iz = Math.floor(nz * (mapSize - 1));

    // Get fractional part for interpolation
    const fx = nx * (mapSize - 1) - ix;
    const fz = nz * (mapSize - 1) - iz;

    // Bounds checking
    if (ix < 0 || ix >= mapSize - 1 || iz < 0 || iz >= mapSize - 1) {
      return 0;
    }

    // Bilinear interpolation of heights
    const h00 = this.heightMap[ix][iz];
    const h10 = this.heightMap[ix + 1][iz];
    const h01 = this.heightMap[ix][iz + 1];
    const h11 = this.heightMap[ix + 1][iz + 1];

    // Interpolate along x
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    // Interpolate along z
    return h0 * (1 - fz) + h1 * fz;
  }

  getBounds() {
    return {
      min: -this.worldSize / 2,
      max: this.worldSize / 2,
    };
  }

  setTimeOfDay(timeOfDay, transitionDuration = 0) {
    // timeOfDay: 0 = full day, 1 = full night
    // transitionDuration: time in seconds for the transition

    // If no transition, set immediately
    if (transitionDuration <= 0) {
      // Toggle skybox visibility with higher contrast
      this.skyboxDay.visible = timeOfDay < 0.5;
      this.skyboxNight.visible = timeOfDay >= 0.5;

      // Toggle lights with more dramatic changes
      this.sunLight.visible = timeOfDay < 0.5;
      this.sunLight.intensity = 1.5 - timeOfDay * 1.5; // Fade out sun more dramatically
      
      this.moonLight.visible = true; // Always have some moonlight
      this.moonLight.intensity = timeOfDay * 0.6; // Stronger moonlight at night

      // Make ambient light changes more dramatic
      const ambientIntensity = 0.7 - timeOfDay * 0.6; // Much darker at night
      this.ambientLight.intensity = ambientIntensity;
      
      // Change ambient light color for day/night
      if (timeOfDay < 0.5) {
        // Daytime - warm light
        this.ambientLight.color.setHex(0xd6e6ff);
      } else {
        // Nighttime - cool blue light
        this.ambientLight.color.setHex(0x102040);
      }

      // Adjust hemisphere light more dramatically
      const hemiIntensity = 0.5 - timeOfDay * 0.4; 
      this.hemisphereLight.intensity = hemiIntensity;

      // Show/hide moon and stars with more opacity
      this.moon.visible = true; // Always show moon but change brightness
      this.moon.material.emissiveIntensity = timeOfDay * 1.2;
      this.stars.material.opacity = timeOfDay * 1.5; // More visible stars at night

      // More dramatic fog changes
      if (timeOfDay < 0.5) {
        // Daytime fog - light blue
        this.scene.fog = new THREE.FogExp2(0xafc5d3, 0.003);
      } else {
        // Nighttime fog - darker blue
        this.scene.fog = new THREE.FogExp2(0x101824, 0.004); // Darker and denser fog
      }

      // More dramatic terrain and water color changes
      if (this.terrainMaterial) {
        // Adjust terrain color based on time
        if (timeOfDay < 0.5) {
          // Daytime colors - vibrant
          this.terrainMaterial.color = new THREE.Color(0x2a6b30); // Forest green
        } else {
          // Nighttime colors - muted
          this.terrainMaterial.color = new THREE.Color(0x0e2712); // Dark forest
        }
        
        this.terrainMaterial.roughness = 0.8 - timeOfDay * 0.3;
        this.terrainMaterial.envMapIntensity = timeOfDay < 0.5 ? 1.0 : 0.3;
      }

      if (this.waterMaterial) {
        // Make water more reflective at night
        this.waterMaterial.roughness = 0.1 - timeOfDay * 0.05;

        // Adjust water color more dramatically
        if (timeOfDay < 0.5) {
          // Day - blue
          this.waterMaterial.color.setRGB(0, 0.47, 0.75);
        } else {
          // Night - darker blue with moonlight reflection
          this.waterMaterial.color.setRGB(0.02, 0.05, 0.2);
        }
      }
    }

    // Return transition duration in milliseconds
    return transitionDuration * 1000;
  }

  toggleDayNight() {
    // Toggle between day and night immediately
    this.isNightTime = !this.isNightTime;
    this.timeOfDay = this.isNightTime ? 1.0 : 0.0;
    this.setTimeOfDay(this.timeOfDay, 1.0); // 1-second transition
    return this.isNightTime;
  }

  toggleDayNightCycle() {
    // Toggle automatic day/night cycle
    this.autoCycleActive = !this.autoCycleActive;
    this.lastCycleUpdate = Date.now();
    return this.autoCycleActive;
  }

  update(deltaTime) {
    // Handle day/night cycle
    if (this.autoCycleActive) {
      const now = Date.now();
      const elapsed = (now - this.lastCycleUpdate) / 1000; // seconds
      this.lastCycleUpdate = now;
      
      // Update time of day
      this.timeOfDay = (this.timeOfDay + elapsed / this.cycleDuration) % 1.0;
      
      // Apply the current time of day
      this.setTimeOfDay(this.timeOfDay);
      
      // Update isNightTime flag based on timeOfDay
      this.isNightTime = this.timeOfDay >= 0.5;
    }

    // Animate water surface
    if (this.waterMesh && this.waterVertices) {
      const positionAttribute = this.waterMesh.geometry.attributes.position;

      for (let i = 0; i < this.waterVertices.length; i++) {
        const vertex = this.waterVertices[i];

        // Update wave animation
        vertex.ang += vertex.speed * deltaTime;
        const z = Math.sin(vertex.ang) * vertex.amp;
        positionAttribute.setZ(i, vertex.originalZ + z);
      }

      positionAttribute.needsUpdate = true;

      // Animate water color
      const t = Date.now() * 0.0005;
      if (this.waterMaterial) {
        // Add subtle variations to water color
        if (this.skyboxDay.visible) {
          // Daytime water
          this.waterMaterial.color.r = 0.016 + Math.sin(t) * 0.01;
          this.waterMaterial.color.g = 0.47 + Math.sin(t * 0.8) * 0.02;
          this.waterMaterial.color.b = 0.65 + Math.sin(t * 0.6) * 0.05;
        } else {
          // Nighttime water - darker with moonlight reflections
          this.waterMaterial.color.r = 0.05 + Math.sin(t) * 0.01;
          this.waterMaterial.color.g = 0.1 + Math.sin(t * 0.8) * 0.01;
          this.waterMaterial.color.b = 0.3 + Math.sin(t * 0.6) * 0.03;
        }
      }
    }

    // Animate sun/moon light for more natural feeling
    const time = Date.now() * 0.00005;
    if (this.sunLight && this.sunLight.visible) {
      const intensity = 1.1 + Math.sin(time) * 0.1;
      this.sunLight.intensity = intensity;
    }

    if (this.moonLight && this.moonLight.visible) {
      const intensity = 0.3 + Math.sin(time * 0.5) * 0.05;
      this.moonLight.intensity = intensity;
    }

    // Animate stars twinkling at night
    if (this.stars && this.stars.material.opacity > 0) {
      const starVertices = this.stars.geometry.attributes.position;
      const starColors = this.stars.geometry.attributes.color;

      for (let i = 0; i < starVertices.count; i++) {
        if (Math.random() > 0.99) {
          // Only update a few stars each frame
          const twinkle = 0.7 + Math.random() * 0.3;
          starColors.setX(i, twinkle);
          starColors.setY(i, twinkle);
          starColors.setZ(i, twinkle);
        }
      }

      starColors.needsUpdate = true;
    }

    // Animate the moon's position if visible
    if (this.moon && this.moon.visible) {
      const moonTime = Date.now() * 0.00001;
      this.moon.position.x = 200 * Math.cos(moonTime);
      this.moon.position.z = -300 * Math.sin(moonTime);
    }

    // Animate NPCs
    this.npcs.forEach(npc => {
      if (npc.world === this.currentWorld) {
        // Simple idle animation
        npc.mesh.rotation.y += deltaTime * 0.2;
      }
    });
    
    // Animate animals
    this.animals.forEach(animal => {
      if (animal.world === this.currentWorld) {
        // Update wandering behavior
        animal.wanderTime += deltaTime;
        
        if (animal.wanderTime > 5) {
          // Generate new target position every 5 seconds
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * animal.wanderRadius;
          
          const newX = animal.startPosition.x + Math.cos(angle) * distance;
          const newZ = animal.startPosition.z + Math.sin(angle) * distance;
          const newY = this.getHeightAt(newX, newZ);
          
          animal.targetPosition.set(newX, newY, newZ);
          animal.wanderTime = 0;
        }
        
        // Move toward target position
        const directionX = animal.targetPosition.x - animal.mesh.position.x;
        const directionZ = animal.targetPosition.z - animal.mesh.position.z;
        const distance = Math.sqrt(directionX * directionX + directionZ * directionZ);
        
        if (distance > 0.1) {
          // Move towards target
          animal.mesh.position.x += directionX * animal.speed;
          animal.mesh.position.z += directionZ * animal.speed;
          
          // Update Y position based on terrain
          animal.mesh.position.y = this.getHeightAt(
            animal.mesh.position.x,
            animal.mesh.position.z
          );
          
          // Rotate to face movement direction
          const angle = Math.atan2(directionZ, directionX);
          animal.mesh.rotation.y = angle + Math.PI / 2;
        }
      }
    });
    
    // Animate portals
    this.portals.forEach(portal => {
      if (portal.sourceWorld === this.currentWorld) {
        // Rotate portal ring
        portal.mesh.children[0].rotation.z += deltaTime * 0.5;
        
        // Pulse portal light
        const time = Date.now() * 0.001;
        const pulseIntensity = 1.5 + Math.sin(time * 2) * 0.5;
        portal.mesh.children[3].intensity = pulseIntensity;
      }
    });
  }

  createNPCs() {
    // Define NPC types with different appearances and dialogues
    const npcTypes = [
      {
        type: "villager",
        color: 0x8d5524,
        height: 1.8,
        dialogues: [
          ["Hello there! Beautiful day, isn't it?", "Yes it is! Are you from around here?", "Born and raised. I know every tree in this forest."],
          ["Careful in the dark woods at night.", "Why? Is it dangerous?", "Let's just say not all creatures sleep when the sun sets."],
          ["Have you seen the portals? They say other worlds lie beyond.", "I've heard about them. Where are they?", "Look for the glowing circles. But be prepared before you step through!"]
        ]
      },
      {
        type: "trader",
        color: 0x3b5998,
        height: 1.9,
        dialogues: [
          ["Greetings, traveler! Looking to trade?", "What do you have?", "Rare items from other worlds. Things you wouldn't believe!"],
          ["The flowers you collect have special properties.", "Really? What kind?", "Some say they hold memories of past travelers. Quite valuable."],
          ["I've traveled through all the portals.", "What's on the other side?", "Each leads to a different realm with its own wonders and dangers."]
        ]
      },
      {
        type: "elder",
        color: 0x800080,
        height: 1.7,
        dialogues: [
          ["You have the look of someone searching for something.", "How did you know?", "The flowers call to certain people. You must be one of them."],
          ["Day and night cycle just as memories do.", "What do you mean?", "As light fades, old memories surface. As light returns, we make new ones."],
          ["The portals were created long ago by my ancestors.", "Why did they make them?", "To connect worlds that were once one. To remember what was lost."]
        ]
      }
    ];
    
    // Place NPCs around the world
    const npcLocations = [
      { x: 15, z: 15, type: "villager" },
      { x: -20, z: 25, type: "trader" },
      { x: 5, z: -15, type: "elder" },
      { x: -15, z: -20, type: "villager" },
      { x: 30, z: -5, type: "trader" },
      { x: -10, z: 40, type: "elder" }
    ];
    
    npcLocations.forEach(location => {
      // Find the NPC type definition
      const npcType = npcTypes.find(t => t.type === location.type);
      if (!npcType) return;
      
      // Create NPC group
      const npc = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.3, npcType.height * 0.6, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: npcType.color,
        roughness: 0.7,
        metalness: 0.2
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = npcType.height * 0.3;
      npc.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc99,
        roughness: 0.8,
        metalness: 0.1
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = npcType.height * 0.7;
      npc.add(head);
      
      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(0.15, npcType.height * 0.75, 0.3);
      npc.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(-0.15, npcType.height * 0.75, 0.3);
      npc.add(rightEye);
      
      // Arms
      const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, npcType.height * 0.4, 8);
      const armMaterial = new THREE.MeshStandardMaterial({
        color: npcType.color,
        roughness: 0.7,
        metalness: 0.2
      });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(0.6, npcType.height * 0.45, 0);
      leftArm.rotation.z = Math.PI / 4;
      npc.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(-0.6, npcType.height * 0.45, 0);
      rightArm.rotation.z = -Math.PI / 4;
      npc.add(rightArm);
      
      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.15, 0.1, npcType.height * 0.4, 8);
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(0.2, npcType.height * 0.2 - 0.4, 0);
      npc.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(-0.2, npcType.height * 0.2 - 0.4, 0);
      npc.add(rightLeg);
      
      // Position NPC in the world
      const x = location.x;
      const z = location.z;
      const y = this.getHeightAt(x, z);
      
      npc.position.set(x, y, z);
      npc.rotation.y = Math.random() * Math.PI * 2;
      
      // Add shadow casting
      npc.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      
      // Add NPC data
      this.npcs.push({
        mesh: npc,
        type: location.type,
        position: new THREE.Vector3(x, y, z),
        dialogues: npcType.dialogues,
        currentDialogue: null,
        interactionRadius: 5,
        world: "main" // Default world
      });
      
      this.scene.add(npc);
    });
  }
  
  createHouses() {
    const houseLocations = [
      { x: 20, z: 20, rotation: Math.PI * 0.25, scale: 1.2 },
      { x: -25, z: 30, rotation: Math.PI * 1.5, scale: 1.0 },
      { x: 5, z: -20, rotation: Math.PI * 0.8, scale: 1.3 },
      { x: -15, z: -25, rotation: Math.PI * 0.1, scale: 0.9 }
    ];
    
    houseLocations.forEach(location => {
      // Create a simple house
      const house = new THREE.Group();
      
      // House base/walls
      const baseGeometry = new THREE.BoxGeometry(5, 3, 4);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 1.0,
        metalness: 0.0
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 1.5;
      house.add(base);
      
      // Roof
      const roofGeometry = new THREE.ConeGeometry(4, 2, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B0000,
        roughness: 0.8,
        metalness: 0.1
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 4;
      roof.rotation.y = Math.PI / 4;
      house.add(roof);
      
      // Door
      const doorGeometry = new THREE.PlaneGeometry(1, 2);
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4d2600,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(0, 1, 2.01);
      house.add(door);
      
      // Windows
      const windowGeometry = new THREE.PlaneGeometry(1, 1);
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide
      });
      
      const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
      frontWindow1.position.set(1.5, 1.5, 2.01);
      house.add(frontWindow1);
      
      const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
      frontWindow2.position.set(-1.5, 1.5, 2.01);
      house.add(frontWindow2);
      
      const sideWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
      sideWindow1.position.set(2.51, 1.5, 1);
      sideWindow1.rotation.y = Math.PI / 2;
      house.add(sideWindow1);
      
      const sideWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
      sideWindow2.position.set(-2.51, 1.5, 1);
      sideWindow2.rotation.y = Math.PI / 2;
      house.add(sideWindow2);
      
      // Chimney
      const chimneyGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
      const chimneyMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 1.0,
        metalness: 0.1
      });
      const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
      chimney.position.set(1.5, 4, -1);
      house.add(chimney);
      
      // Position house in the world
      const x = location.x;
      const z = location.z;
      const y = this.getHeightAt(x, z);
      
      house.position.set(x, y, z);
      house.rotation.y = location.rotation;
      house.scale.set(location.scale, location.scale, location.scale);
      
      // Add shadow casting
      house.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      
      // Add house data
      this.houses.push({
        mesh: house,
        position: new THREE.Vector3(x, y, z),
        world: "main" // Default world
      });
      
      this.scene.add(house);
    });
  }
  
  createAnimals() {
    // Define animal types
    const animalTypes = [
      { 
        type: "deer", 
        color: 0x8B4513,
        speed: 0.02,
        wanderRadius: 10
      },
      { 
        type: "rabbit", 
        color: 0xA9A9A9,
        speed: 0.04,
        wanderRadius: 5
      },
      { 
        type: "fox", 
        color: 0xD2691E,
        speed: 0.03,
        wanderRadius: 15
      }
    ];
    
    // Animal spawn locations
    const animalLocations = [
      { x: 30, z: 30, type: "deer" },
      { x: -10, z: 15, type: "rabbit" },
      { x: 25, z: -20, type: "fox" },
      { x: -30, z: -25, type: "deer" },
      { x: 15, z: 40, type: "rabbit" },
      { x: -35, z: 10, type: "fox" }
    ];
    
    animalLocations.forEach(location => {
      // Find animal type
      const animalType = animalTypes.find(t => t.type === location.type);
      if (!animalType) return;
      
      // Create animal group
      const animal = new THREE.Group();
      
      if (animalType.type === "deer") {
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
        bodyGeometry.rotateZ(Math.PI / 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: animalType.color,
          roughness: 0.9,
          metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        animal.add(body);
        
        // Head
        const headGeometry = new THREE.ConeGeometry(0.4, 1, 8);
        const headMaterial = bodyMaterial.clone();
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(1.2, 1.9, 0);
        head.rotation.z = -Math.PI / 4;
        animal.add(head);
        
        // Antlers
        const antlerMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B7355,
          roughness: 0.9,
          metalness: 0.1
        });
        
        const antler1Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
        const antler1 = new THREE.Mesh(antler1Geometry, antlerMaterial);
        antler1.position.set(1.2, 2.2, 0.2);
        antler1.rotation.set(0, 0, Math.PI / 4);
        animal.add(antler1);
        
        const antler2Geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4);
        const antler2 = new THREE.Mesh(antler2Geometry, antlerMaterial);
        antler2.position.set(1.2, 2.2, -0.2);
        antler2.rotation.set(0, 0, Math.PI / 4);
        animal.add(antler2);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const legMaterial = bodyMaterial.clone();
        
        const frontLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg1.position.set(0.7, 0.75, 0.4);
        animal.add(frontLeg1);
        
        const frontLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg2.position.set(0.7, 0.75, -0.4);
        animal.add(frontLeg2);
        
        const backLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg1.position.set(-0.7, 0.75, 0.4);
        animal.add(backLeg1);
        
        const backLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg2.position.set(-0.7, 0.75, -0.4);
        animal.add(backLeg2);
        
        // Tail
        const tailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const tailMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.9,
          metalness: 0.1
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(-1.3, 1.5, 0);
        animal.add(tail);
      } 
      else if (animalType.type === "rabbit") {
        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: animalType.color,
          roughness: 0.9,
          metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.scale.set(1, 0.8, 1);
        animal.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = bodyMaterial.clone();
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.4, 0.7, 0);
        animal.add(head);
        
        // Ears
        const earGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.4, 8);
        const earMaterial = bodyMaterial.clone();
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(0.4, 1.0, 0.15);
        animal.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.4, 1.0, -0.15);
        animal.add(rightEar);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const legMaterial = bodyMaterial.clone();
        
        const frontLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg1.position.set(0.3, 0.15, 0.2);
        animal.add(frontLeg1);
        
        const frontLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg2.position.set(0.3, 0.15, -0.2);
        animal.add(frontLeg2);
        
        const backLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg1.position.set(-0.3, 0.15, 0.2);
        animal.add(backLeg1);
        
        const backLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg2.position.set(-0.3, 0.15, -0.2);
        animal.add(backLeg2);
        
        // Tail
        const tailGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const tailMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.9,
          metalness: 0.1
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(-0.6, 0.4, 0);
        animal.add(tail);
      }
      else if (animalType.type === "fox") {
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.2, 8);
        bodyGeometry.rotateZ(Math.PI / 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: animalType.color,
          roughness: 0.9,
          metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        animal.add(body);
        
        // Head
        const headGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const headMaterial = bodyMaterial.clone();
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.8, 1.0, 0);
        head.rotation.z = -Math.PI / 4;
        animal.add(head);
        
        // Ears
        const earGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const earMaterial = bodyMaterial.clone();
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(0.8, 1.2, 0.15);
        animal.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.8, 1.2, -0.15);
        animal.add(rightEar);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 8);
        const legMaterial = bodyMaterial.clone();
        
        const frontLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg1.position.set(0.5, 0.4, 0.3);
        animal.add(frontLeg1);
        
        const frontLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        frontLeg2.position.set(0.5, 0.4, -0.3);
        animal.add(frontLeg2);
        
        const backLeg1 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg1.position.set(-0.5, 0.4, 0.3);
        animal.add(backLeg1);
        
        const backLeg2 = new THREE.Mesh(legGeometry, legMaterial);
        backLeg2.position.set(-0.5, 0.4, -0.3);
        animal.add(backLeg2);
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.8, 8);
        tailGeometry.translate(0, -0.4, 0);
        const tailMaterial = new THREE.MeshStandardMaterial({
          color: animalType.color,
          roughness: 0.9,
          metalness: 0.1
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(-0.8, 0.9, 0);
        tail.rotation.z = Math.PI / 4;
        animal.add(tail);
      }
      
      // Position animal in the world
      const x = location.x;
      const z = location.z;
      const y = this.getHeightAt(x, z);
      
      animal.position.set(x, y, z);
      animal.rotation.y = Math.random() * Math.PI * 2;
      
      // Add shadow casting
      animal.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      
      // Add animal data for animation
      this.animals.push({
        mesh: animal,
        type: animalType.type,
        position: new THREE.Vector3(x, y, z),
        startPosition: new THREE.Vector3(x, y, z),
        targetPosition: new THREE.Vector3(x, y, z),
        speed: animalType.speed,
        wanderRadius: animalType.wanderRadius,
        wanderTime: 0,
        world: "main" // Default world
      });
      
      this.scene.add(animal);
    });
  }
  
  createPortals() {
    // Define portals to different worlds
    const portalLocations = [
      { 
        x: 50, z: 0, 
        targetWorld: "desert", 
        color: 0xffcc00,
        description: "A shimmering golden portal that radiates heat. Desert world awaits." 
      },
      { 
        x: 0, z: 50, 
        targetWorld: "snow", 
        color: 0x00ccff,
        description: "A cool blue portal with snowflakes hovering around it. Winter wonderland." 
      },
      { 
        x: -50, z: 0, 
        targetWorld: "lava", 
        color: 0xff3300,
        description: "A blazing red portal that pulses with heat. Volcanic landscape." 
      }
    ];
    
    portalLocations.forEach(location => {
      // Create portal
      const portalGroup = new THREE.Group();
      
      // Outer ring
      const ringGeometry = new THREE.TorusGeometry(2, 0.4, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: location.color,
        emissive: location.color,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      portalGroup.add(ring);
      
      // Portal center
      const centerGeometry = new THREE.CircleGeometry(1.8, 32);
      const centerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.z = 0.01;
      portalGroup.add(center);
      
      // Particle effects (simple mesh points)
      const particleCount = 50;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.8;
        particlePositions.push(
          Math.cos(angle) * radius, // x
          Math.sin(angle) * radius, // y
          (Math.random() - 0.5) * 0.5 // z
        );
      }
      
      particleGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(particlePositions, 3)
      );
      
      const particleMaterial = new THREE.PointsMaterial({
        color: location.color,
        size: 0.1,
        transparent: true,
        opacity: 0.8
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      portalGroup.add(particles);
      
      // Add portal light
      const portalLight = new THREE.PointLight(location.color, 2, 10);
      portalLight.position.set(0, 0, 0);
      portalGroup.add(portalLight);
      
      // Position portal in the world
      const x = location.x;
      const z = location.z;
      const y = this.getHeightAt(x, z) + 3; // Elevate portal
      
      portalGroup.position.set(x, y, z);
      portalGroup.rotation.x = Math.PI / 2; // Make portal vertical
      
      // Add portal data
      this.portals.push({
        mesh: portalGroup,
        position: new THREE.Vector3(x, y, z),
        targetWorld: location.targetWorld,
        sourceWorld: "main",
        color: location.color,
        description: location.description,
        interactionRadius: 3.5
      });
      
      this.scene.add(portalGroup);
    });
  }
  
  // NPC interaction
  getNPCAtPosition(position, radius) {
    for (const npc of this.npcs) {
      if (npc.world !== this.currentWorld) continue;
      
      const distance = position.distanceTo(npc.position);
      if (distance <= radius + npc.interactionRadius) {
        return npc;
      }
    }
    return null;
  }
  
  // Portal interaction
  getPortalAtPosition(position, radius) {
    for (const portal of this.portals) {
      if (portal.sourceWorld !== this.currentWorld) continue;
      
      const distance = position.distanceTo(portal.position);
      if (distance <= radius + portal.interactionRadius) {
        return portal;
      }
    }
    return null;
  }
  
  // Transport player to another world
  transportToWorld(worldName) {
    // Hide current world objects
    this.npcs.forEach(npc => {
      if (npc.world === this.currentWorld) {
        npc.mesh.visible = false;
      } else if (npc.world === worldName) {
        npc.mesh.visible = true;
      }
    });
    
    this.animals.forEach(animal => {
      if (animal.world === this.currentWorld) {
        animal.mesh.visible = false;
      } else if (animal.world === worldName) {
        animal.mesh.visible = true;
      }
    });
    
    this.houses.forEach(house => {
      if (house.world === this.currentWorld) {
        house.mesh.visible = false;
      } else if (house.world === worldName) {
        house.mesh.visible = true;
      }
    });
    
    this.portals.forEach(portal => {
      if (portal.sourceWorld === this.currentWorld) {
        portal.mesh.visible = false;
      } else if (portal.sourceWorld === worldName) {
        portal.mesh.visible = true;
      }
    });
    
    // Update current world
    this.currentWorld = worldName;
  }
}
