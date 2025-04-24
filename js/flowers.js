class Flowers {
  constructor(scene, world, loadingManager) {
    this.scene = scene;
    this.world = world;
    this.loadingManager = loadingManager || new THREE.LoadingManager();
    this.flowers = [];
    this.flowerCount = 30; // Number of flowers to place in the world
    this.collectionDistance = 2; // Distance at which flowers can be collected
    this.minDistanceBetweenFlowers = 8; // Minimum distance between flowers

    // Create flowers in the world
    this.createFlowers();
  }

  createFlowers() {
    const flowerPositions = this.generateFlowerPositions();

    // Various flower colors for variety
    const colors = [
      0xff69b4, // Hot Pink
      0xff1493, // Deep Pink
      0xffd700, // Gold
      0xff4500, // Orange Red
      0x9370db, // Medium Purple
      0x00bfff, // Deep Sky Blue
    ];

    flowerPositions.forEach((position) => {
      // Create flower model
      const flowerGroup = new THREE.Group();

      // Flower stem
      const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 0.5;
      flowerGroup.add(stem);

      // Flower bloom
      const bloomGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const colorIndex = Math.floor(Math.random() * colors.length);
      const bloomMaterial = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        roughness: 0.5,
        metalness: 0.2,
      });
      const bloom = new THREE.Mesh(bloomGeometry, bloomMaterial);
      bloom.position.y = 1.1;
      bloom.scale.y = 0.6;
      flowerGroup.add(bloom);

      // Flower center
      const centerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const centerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
      });
      const center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.y = 1.2;
      flowerGroup.add(center);

      // Create petals
      const petalCount = 5 + Math.floor(Math.random() * 4); // 5-8 petals
      const petalGeometry = new THREE.CircleGeometry(0.2, 8);

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeometry, bloomMaterial.clone());
        petal.position.set(Math.cos(angle) * 0.3, 1.1, Math.sin(angle) * 0.3);
        petal.lookAt(petal.position.clone().add(new THREE.Vector3(0, 1, 0)));
        petal.rotation.z = (Math.random() * Math.PI) / 4;
        flowerGroup.add(petal);
      }

      // Position the flower in the world
      flowerGroup.position.set(position.x, position.y, position.z);

      // Add a small random rotation for variety
      flowerGroup.rotation.y = Math.random() * Math.PI * 2;

      // Create a simple animation for the flower
      const animationAmplitude = 0.05;
      const animationSpeed = 1 + Math.random() * 0.5;
      const startPhase = Math.random() * Math.PI * 2;

      // Store flower data
      this.flowers.push({
        mesh: flowerGroup,
        position: position,
        collected: false,
        animation: {
          amplitude: animationAmplitude,
          speed: animationSpeed,
          phase: startPhase,
        },
      });

      this.scene.add(flowerGroup);
    });
  }

  generateFlowerPositions() {
    const positions = [];
    const worldBounds = this.world.getBounds();
    const margin = 5; // Keep flowers away from the edges

    // Try to place flowers (with collision avoidance)
    let attempts = 0;
    const maxAttempts = 1000;

    while (positions.length < this.flowerCount && attempts < maxAttempts) {
      attempts++;

      // Generate random position within world bounds
      const x =
        Math.random() * (worldBounds.max - worldBounds.min - 2 * margin) +
        worldBounds.min +
        margin;
      const z =
        Math.random() * (worldBounds.max - worldBounds.min - 2 * margin) +
        worldBounds.min +
        margin;

      // Get y position from terrain height
      const y = this.world.getHeightAt(x, z);

      // Check if this position is far enough from existing flowers
      let tooClose = false;
      for (const pos of positions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        const distSquared = dx * dx + dz * dz;

        if (
          distSquared <
          this.minDistanceBetweenFlowers * this.minDistanceBetweenFlowers
        ) {
          tooClose = true;
          break;
        }
      }

      // If the position is valid, add it
      if (!tooClose) {
        positions.push(new THREE.Vector3(x, y, z));
      }
    }

    return positions;
  }

  update(deltaTime, playerPosition) {
    // Update animation and check for collection
    for (const flower of this.flowers) {
      if (flower.collected) continue;

      // Simple bobbing animation
      const time = performance.now() * 0.001;
      const animation = flower.animation;
      const offset =
        Math.sin(time * animation.speed + animation.phase) *
        animation.amplitude;
      flower.mesh.position.y = flower.position.y + offset;

      // Rotate slightly for a gentle sway
      flower.mesh.rotation.y += deltaTime * 0.2;

      // Check if player is close enough to collect the flower
      const dx = playerPosition.x - flower.position.x;
      const dz = playerPosition.z - flower.position.z;
      const distSquared = dx * dx + dz * dz;

      if (distSquared < this.collectionDistance * this.collectionDistance) {
        this.collectFlower(flower);
      }
    }
  }

  collectFlower(flower) {
    if (flower.collected) return;

    flower.collected = true;

    // Create collection animation
    const duration = 1.0; // seconds
    const startTime = performance.now() * 0.001; // Convert to seconds

    // Show collection message
    this.showCollectionMessage();

    // Update the flower score
    const scoreElement = document.getElementById("score");
    const currentScore = parseInt(scoreElement.textContent);
    scoreElement.textContent = (currentScore + 1).toString();

    // Animate the flower being collected (rising and fading out)
    const animate = () => {
      const currentTime = performance.now() * 0.001;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Move up and fade out
      flower.mesh.position.y = flower.position.y + progress * 3;
      flower.mesh.scale.set(1 - progress, 1 - progress, 1 - progress);

      // Apply material changes to all flower parts
      flower.mesh.traverse((child) => {
        if (child.isMesh) {
          if (!child.material.originalOpacity) {
            child.material.originalOpacity = child.material.opacity;
          }
          child.material.opacity =
            child.material.originalOpacity * (1 - progress);
          child.material.transparent = true;
        }
      });

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Remove flower from scene when animation is complete
        this.scene.remove(flower.mesh);
      }
    };

    // Start animation
    animate();
  }

  showCollectionMessage() {
    const messages = [
      "Flower collected!",
      "Beautiful flower!",
      "Added to collection!",
      "Nice find!",
      "Lovely specimen!",
    ];

    // Create or reuse message element
    let messageElement = document.querySelector(".flower-collected-message");
    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.className = "flower-collected-message";
      document.getElementById("game-container").appendChild(messageElement);
    }

    // Set random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    messageElement.textContent = randomMessage;

    // Show and fade out message
    messageElement.style.opacity = "1";

    // Clear any existing timeout
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      messageElement.style.opacity = "0";
    }, 1500);
  }

  getRemainingFlowerCount() {
    return this.flowers.filter((flower) => !flower.collected).length;
  }

  getTotalFlowerCount() {
    return this.flowerCount;
  }
}
