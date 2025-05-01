// Character class - Handles the player character, animations, and stats

class Character {
  constructor(game) {
    this.game = game;
    this.model = null;
    this.mixer = null; // Animation mixer
    this.animations = {};
    this.currentAction = null;

    // Character stats
    this.stats = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
    };

    // Character position and movement
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0.1;
    this.jumpHeight = 1.0;
    this.isJumping = false;
    this.isGrounded = true;

    // Character state
    this.state = {
      isMoving: false,
      isRunning: false,
      isAttacking: false,
      isDead: false,
    };

    // Collision detection
    this.boundingBox = null;
  }

  loadModels() {
    console.log("Loading character models...");

    // In a real game, we would load a GLTF model with animations
    // For now, let's create a simple character representation
    this.createSimpleCharacter();
  }

  createSimpleCharacter() {
    // This is a placeholder for the actual character model
    // In a real game, we would load a detailed 3D model with proper animations

    // Create a group to hold all character parts
    this.model = new THREE.Group();

    // Check if CustomCapsuleGeometry is available, otherwise use CylinderGeometry as fallback
    let bodyGeometry, armGeometry, legGeometry;

    try {
      if (THREE.CustomCapsuleGeometry) {
        bodyGeometry = new THREE.CustomCapsuleGeometry(0.5, 1.5, 4, 8);
        armGeometry = new THREE.CustomCapsuleGeometry(0.2, 0.7, 4, 8);
        legGeometry = new THREE.CustomCapsuleGeometry(0.25, 0.8, 4, 8);
      } else {
        console.warn(
          "CustomCapsuleGeometry not available, using CylinderGeometry as fallback"
        );
        bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8);
        legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
      }
    } catch (error) {
      console.error("Error creating geometry:", error);
      // Fallback to basic geometries
      bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
      armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8);
      legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;

    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.7;
    head.castShadow = true;

    // Arms
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900 });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.8, 1.5, 0);
    leftArm.rotation.z = -Math.PI / 16;
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.8, 1.5, 0);
    rightArm.rotation.z = Math.PI / 16;
    rightArm.castShadow = true;

    // Legs
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.5, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.5, 0);
    rightLeg.castShadow = true;

    // Add all parts to the character model
    this.model.add(body);
    this.model.add(head);
    this.model.add(leftArm);
    this.model.add(rightArm);
    this.model.add(leftLeg);
    this.model.add(rightLeg);

    // Set up bounding box for collision detection
    this.boundingBox = new THREE.Box3().setFromObject(this.model);
  }

  init() {
    // Add character to the scene
    if (this.model) {
      this.game.world.scene.add(this.model);

      // Position the character
      this.model.position.set(0, 0, 0);

      // Set up camera to follow character
      this.setupCamera();
    }
  }

  setupCamera() {
    // Set up third-person camera
    this.game.world.camera.position.set(
      this.model.position.x,
      this.model.position.y + 3, // Camera height above character
      this.model.position.z + 5 // Camera distance behind character
    );

    this.game.world.camera.lookAt(this.model.position);
  }

  update() {
    if (!this.model) return;

    // Update animation mixer if we have one
    if (this.mixer) {
      this.mixer.update(this.game.utils.getDeltaTime());
    }

    // Apply movement based on controls
    this.applyMovement();

    // Update character state
    this.updateState();

    // Update animations based on state
    this.updateAnimations();

    // Update camera position to follow character
    this.updateCamera();

    // Update character stats UI
    this.updateUI();
  }

  applyMovement() {
    // Get movement input from controls
    const input = this.game.controls.getMovementInput();

    // Calculate movement direction (fixed direction calculation)
    const moveX = input.right - input.left;
    const moveZ = input.forward - input.backward; // Fixed: forward should be positive Z

    // Movement acceleration and deceleration parameters
    const acceleration = 0.015;
    const deceleration = 0.25;
    const maxWalkSpeed = this.speed;
    const maxRunSpeed = this.speed * 2.2; // Slightly faster running

    if (moveX !== 0 || moveZ !== 0) {
      // Calculate movement angle
      const angle = Math.atan2(moveZ, moveX);

      // Smoothly rotate character to face movement direction
      const targetRotation = angle + Math.PI / 2;
      const rotationDiff = targetRotation - this.model.rotation.y;

      // Normalize rotation difference to [-PI, PI]
      let normalizedDiff = rotationDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

      // Apply smooth rotation with faster turning
      this.model.rotation.y += normalizedDiff * 0.15;

      // Set character state to moving
      this.state.isMoving = true;

      // Determine target speed based on running state
      const targetSpeed = this.state.isRunning ? maxRunSpeed : maxWalkSpeed;

      // Calculate target velocity
      const targetVelocityX = Math.cos(angle) * targetSpeed;
      const targetVelocityZ = Math.sin(angle) * targetSpeed;

      // Smoothly accelerate toward target velocity
      this.velocity.x += (targetVelocityX - this.velocity.x) * acceleration;
      this.velocity.z += (targetVelocityZ - this.velocity.z) * acceleration;

      // Apply speed limit
      const currentSpeed = Math.sqrt(
        this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
      );
      if (currentSpeed > targetSpeed) {
        this.velocity.x = (this.velocity.x / currentSpeed) * targetSpeed;
        this.velocity.z = (this.velocity.z / currentSpeed) * targetSpeed;
      }
    } else {
      // Character is not moving - apply deceleration
      this.velocity.x *= 1 - deceleration;
      this.velocity.z *= 1 - deceleration;

      // If velocity is very small, set it to zero to prevent sliding
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

      // Update moving state based on actual velocity, not just input
      this.state.isMoving =
        Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.z) > 0.01;

      // Only zero out velocity if we've actually stopped
      if (!this.state.isMoving) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // Apply jumping with improved mechanics
    if (input.jump && this.isGrounded) {
      // More responsive jump with slightly higher initial velocity
      this.velocity.y = this.jumpHeight * 1.2;
      this.isJumping = true;
      this.isGrounded = false;

      // Add a small forward boost when jumping while moving
      if (this.state.isMoving) {
        const jumpBoost = 0.05;
        const currentSpeed = Math.sqrt(
          this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
        );
        if (currentSpeed > 0) {
          // Normalize and apply boost in movement direction
          this.velocity.x += (this.velocity.x / currentSpeed) * jumpBoost;
          this.velocity.z += (this.velocity.z / currentSpeed) * jumpBoost;
        }
      }
    }

    // Apply improved gravity with acceleration
    if (!this.isGrounded) {
      const gravity = 0.015; // Stronger gravity
      const terminalVelocity = -0.5; // Maximum falling speed

      // Apply gravity with acceleration
      this.velocity.y -= gravity;

      // Limit falling speed to terminal velocity
      if (this.velocity.y < terminalVelocity) {
        this.velocity.y = terminalVelocity;
      }
    }

    // Check if character has landed with improved landing detection
    if (this.model.position.y <= 0 && this.velocity.y < 0) {
      this.model.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.isJumping = false;

      // Add landing effect - slight slowdown when landing from a jump
      if (
        Math.abs(this.velocity.x) > 0.01 ||
        Math.abs(this.velocity.z) > 0.01
      ) {
        const landingFriction = 0.7; // Reduce horizontal velocity on landing
        this.velocity.x *= landingFriction;
        this.velocity.z *= landingFriction;
      }
    }

    // Apply velocity to position
    this.model.position.x += this.velocity.x;
    this.model.position.y += this.velocity.y;
    this.model.position.z += this.velocity.z;

    // Update bounding box position
    this.boundingBox.setFromObject(this.model);

    // Collision detection with world objects
    this.checkCollisions();
  }

  checkCollisions() {
    // Improved collision detection with world objects
    // In a real game, we would use a physics engine for this

    // Store original position to revert to if collision occurs
    const originalPosition = this.model.position.clone();

    // Keep character within world bounds with smoother boundary handling
    const worldBounds = 100;
    const boundsBuffer = 0.5; // Buffer zone for smoother boundary interaction

    // Check X-axis world boundary
    if (Math.abs(this.model.position.x) > worldBounds) {
      // Set position to boundary with slight buffer
      this.model.position.x =
        Math.sign(this.model.position.x) * (worldBounds - boundsBuffer);
      // Zero out velocity in this direction to prevent bouncing
      this.velocity.x = 0;
    }

    // Check Z-axis world boundary
    if (Math.abs(this.model.position.z) > worldBounds) {
      // Set position to boundary with slight buffer
      this.model.position.z =
        Math.sign(this.model.position.z) * (worldBounds - boundsBuffer);
      // Zero out velocity in this direction to prevent bouncing
      this.velocity.z = 0;
    }

    // Check for collisions with obstacles in the world
    // This is a simplified version - in a real game you'd use raycasting or a physics engine
    if (this.game.world && this.game.world.obstacles) {
      for (const obstacle of this.game.world.obstacles) {
        if (
          obstacle.boundingBox &&
          this.boundingBox.intersectsBox(obstacle.boundingBox)
        ) {
          // Collision detected - revert to previous position
          this.model.position.copy(originalPosition);

          // Calculate collision normal (simplified)
          const collisionNormal = new THREE.Vector3()
            .subVectors(this.model.position, obstacle.position)
            .normalize();

          // Reflect velocity along collision normal (bounce effect)
          const dot = this.velocity.dot(collisionNormal);
          this.velocity.x -= collisionNormal.x * dot * 1.5;
          this.velocity.z -= collisionNormal.z * dot * 1.5;

          // Apply friction to slow down along the obstacle
          const friction = 0.5;
          this.velocity.multiplyScalar(friction);

          break; // Handle one collision at a time for simplicity
        }
      }
    }

    // Update bounding box after position changes
    this.boundingBox.setFromObject(this.model);
  }

  updateState() {
    // Update character state based on input and environment
    const input = this.game.controls.getMovementInput();

    // Update running state
    this.state.isRunning = input.run && this.state.isMoving;

    // Update attacking state
    this.state.isAttacking = input.attack;
  }

  updateAnimations() {
    // Update character animations based on state
    // In a real game with loaded animations, we would transition between them

    // Simple animation for now - just move the legs when walking/running
    if (this.state.isMoving) {
      const legSpeed = this.state.isRunning ? 0.2 : 0.1;
      const legAmplitude = this.state.isRunning ? 0.3 : 0.2;

      // Get leg parts
      const leftLeg = this.model.children[4];
      const rightLeg = this.model.children[5];

      // Animate legs in opposite phases
      leftLeg.position.z = Math.sin(Date.now() * legSpeed) * legAmplitude;
      rightLeg.position.z =
        Math.sin(Date.now() * legSpeed + Math.PI) * legAmplitude;

      // Also animate arms
      const leftArm = this.model.children[2];
      const rightArm = this.model.children[3];

      leftArm.position.z =
        Math.sin(Date.now() * legSpeed + Math.PI) * legAmplitude;
      rightArm.position.z = Math.sin(Date.now() * legSpeed) * legAmplitude;
    } else {
      // Reset leg and arm positions when not moving
      const leftLeg = this.model.children[4];
      const rightLeg = this.model.children[5];
      const leftArm = this.model.children[2];
      const rightArm = this.model.children[3];

      leftLeg.position.z = 0;
      rightLeg.position.z = 0;
      leftArm.position.z = 0;
      rightArm.position.z = 0;
    }

    // Attack animation
    if (this.state.isAttacking) {
      // Simple attack animation - swing right arm
      const rightArm = this.model.children[3];
      rightArm.rotation.x = Math.sin(Date.now() * 0.01) * 1.5;
    } else {
      // Reset arm rotation
      const rightArm = this.model.children[3];
      rightArm.rotation.x = 0;
    }
  }

  updateCamera() {
    // Update camera to follow character with improved smoothness and responsiveness
    // Adjust these values to fine-tune camera behavior
    const cameraHeight = 3.5; // Slightly higher for better view
    const cameraDistance = 6; // Slightly further back for better field of view
    const cameraSmoothingFactor = 0.08; // Lower = smoother but less responsive
    const lookAtHeightOffset = 1.8; // Look slightly higher than before

    // Create camera offset vector
    const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
    const cameraTarget = new THREE.Vector3();

    // Calculate camera position based on character position and rotation
    // Apply character rotation to the camera offset
    cameraOffset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.model.rotation.y - Math.PI / 2
    );

    // Add velocity-based prediction to make camera anticipate movement
    const predictionFactor = 0.5; // How much to predict movement
    const velocityPrediction = new THREE.Vector3(
      this.velocity.x * predictionFactor,
      0,
      this.velocity.z * predictionFactor
    );

    // Calculate target camera position with prediction
    cameraTarget
      .copy(this.model.position)
      .add(velocityPrediction)
      .add(cameraOffset);

    // Smoothly move camera to target position with adjusted smoothing
    this.game.world.camera.position.lerp(cameraTarget, cameraSmoothingFactor);

    // Make camera look at character with improved targeting
    const lookAtPosition = new THREE.Vector3();
    lookAtPosition.copy(this.model.position);
    lookAtPosition.y += lookAtHeightOffset; // Look at character's head level

    // Add slight look-ahead based on velocity
    lookAtPosition.x += this.velocity.x * 0.5;
    lookAtPosition.z += this.velocity.z * 0.5;

    this.game.world.camera.lookAt(lookAtPosition);
  }

  updateUI() {
    // Update health bar
    const healthPercent = (this.stats.health / this.stats.maxHealth) * 100;
    document.querySelector(".health-fill").style.width = `${healthPercent}%`;
  }

  takeDamage(amount) {
    this.stats.health = Math.max(0, this.stats.health - amount);

    if (this.stats.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.stats.health = Math.min(
      this.stats.maxHealth,
      this.stats.health + amount
    );
  }

  gainExperience(amount) {
    this.stats.experience += amount;

    if (this.stats.experience >= this.stats.experienceToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.stats.level++;
    this.stats.experience -= this.stats.experienceToNextLevel;
    this.stats.experienceToNextLevel = Math.floor(
      this.stats.experienceToNextLevel * 1.5
    );

    // Increase stats
    this.stats.maxHealth += 10;
    this.stats.health = this.stats.maxHealth;
    this.stats.maxStamina += 5;
    this.stats.stamina = this.stats.maxStamina;

    // Show level up notification
    this.game.ui.showNotification(
      `Level Up! You are now level ${this.stats.level}`
    );
  }

  die() {
    this.state.isDead = true;

    // Play death animation
    // In a real game, we would transition to a death animation

    // Show game over screen after a delay
    setTimeout(() => {
      this.game.ui.showGameOver();
    }, 2000);
  }
}
