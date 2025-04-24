class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.moveSpeed = 10.0;
    this.jumpForce = 15;
    this.gravity = 30;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.canJump = true;
    this.height = 1.8; // Player height in units
    this.cameraDistance = 5; // Distance for third-person camera
    this.cameraHeight = 3; // Height offset for third-person camera
    this.cameraLookHeight = 1; // Where the camera is looking at in height

    // Movement states
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jumping = false;

    // Add mouse control variables
    this.mouseSensitivity = 0.003;
    this.cameraRotationY = 0; // Horizontal camera rotation
    this.isCameraControlEnabled = false; // Will be enabled on game start
    
    // Flashlight for night
    this.hasFlashlight = true;
    this.flashlightActive = false;
    this.flashlight = null;

    // Create player character
    this.createPlayerCharacter();
    
    // Create flashlight
    this.createFlashlight();

    // Setup camera and controls
    this.setupCameraAndControls();

    // Initial position
    this.playerModel.position.y = 10; // Start higher to see the terrain
    this.updateCameraPosition();
  }

  createPlayerCharacter() {
    // Create player model group
    this.playerModel = new THREE.Group();
    this.scene.add(this.playerModel);

    // Create a more interesting player character

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.3, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      roughness: 0.7,
      metalness: 0.2,
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.9;
    this.playerModel.add(this.body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.7;
    this.playerModel.add(this.head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(0.15, 1.75, 0.3);
    this.playerModel.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(-0.15, 1.75, 0.3);
    this.playerModel.add(this.rightEye);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      roughness: 0.7,
      metalness: 0.2,
    });

    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(0.7, 1.0, 0);
    this.leftArm.rotation.z = Math.PI / 4;
    this.playerModel.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(-0.7, 1.0, 0);
    this.rightArm.rotation.z = -Math.PI / 4;
    this.playerModel.add(this.rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.1, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(0.2, 0.2, 0);
    this.playerModel.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(-0.2, 0.2, 0);
    this.playerModel.add(this.rightLeg);

    // Cast shadows for all player parts
    this.playerModel.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Create player shadow
    const shadowGeometry = new THREE.CircleGeometry(0.5, 16);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2; // Flat on the ground
    this.scene.add(this.shadow);
  }

  createFlashlight() {
    // Create a spotlight that follows the player (flashlight)
    this.flashlight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 6, 0.5, 1);
    this.flashlight.position.set(0, 1.5, 0);
    this.flashlight.castShadow = true;
    
    // Configure flashlight shadows
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 1;
    this.flashlight.shadow.camera.far = 30;
    
    // Create a target for the spotlight to aim at
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -5);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    
    // Initially add the flashlight to the scene but disable it
    this.scene.add(this.flashlight);
    this.flashlight.visible = false;
    
    // Flashlight helper for debugging (uncomment if needed)
    // const flashlightHelper = new THREE.SpotLightHelper(this.flashlight);
    // this.scene.add(flashlightHelper);
  }

  setupCameraAndControls() {
    // Initial camera position for third-person view
    this.camera.position.set(0, this.cameraHeight, this.cameraDistance);

    // Add mouse movement handler for camera rotation
    document.addEventListener("mousemove", (event) => this.onMouseMove(event));

    // Add keyboard event listeners
    document.addEventListener("keydown", (event) => this.onKeyDown(event));
    document.addEventListener("keyup", (event) => this.onKeyUp(event));

    // Add mouse event for gamestart
    document.addEventListener("click", () => {
      if (!game.gameStarted) {
        game.startGame();
      } else {
        // Enable camera controls on click
        this.isCameraControlEnabled = true;
      }
    });

    // Handle pointer lock (similar to GTA where mouse is captured)
    document.addEventListener("pointerlockchange", () => {
      this.isCameraControlEnabled =
        document.pointerLockElement === document.body;
    });

    // Add escape key listener to release pointer lock
    document.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        this.isCameraControlEnabled = false;
        document.exitPointerLock();
      }
    });
  }

  onMouseMove(event) {
    // Only rotate camera if controls are enabled
    if (!this.isCameraControlEnabled) return;

    // Rotate camera horizontally based on mouse movement
    this.cameraRotationY -= event.movementX * this.mouseSensitivity;
  }

  onKeyDown(event) {
    if (!game.gameStarted) {
      game.startGame();
      return;
    }

    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = true;
        break;
      case "Space":
        if (this.canJump) {
          this.velocity.y = this.jumpForce;
          this.canJump = false;
        }
        break;
      case "KeyV": // Toggle camera view
        this.toggleCameraView();
        break;
      case "KeyF": // Toggle flashlight
        if (this.hasFlashlight) {
          this.flashlightActive = !this.flashlightActive;
          this.flashlight.visible = this.flashlightActive;
        }
        break;
      case "KeyL": // Toggle day/night (handled in Game class)
        break;
      case "KeyK": // Toggle day/night cycle (handled in Game class)
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.moveBackward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.moveRight = false;
        break;
    }
  }

  toggleCameraView() {
    this.cameraDistance = this.cameraDistance === 5 ? 10 : 5;
  }

  update(deltaTime, terrain) {
    // Update velocity with gravity
    this.velocity.y -= this.gravity * deltaTime;

    // Calculate movement direction based on camera orientation
    this.direction.set(0, 0, 0);

    // Convert WASD input to movement in camera direction (GTA 5 style)
    if (this.moveForward) {
      this.direction.z = -1; // Forward is negative Z in camera space
    }
    if (this.moveBackward) {
      this.direction.z = 1; // Backward is positive Z in camera space
    }
    if (this.moveLeft) {
      this.direction.x = -1; // Left is negative X in camera space
    }
    if (this.moveRight) {
      this.direction.x = 1; // Right is positive X in camera space
    }

    // Normalize to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();

      // Create a camera direction vector based on camera rotation
      const cameraDirection = new THREE.Vector3();

      // Calculate the movement vector in world coordinates based on camera rotation
      const moveZ = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.cameraRotationY
      );
      const moveX = new THREE.Vector3(1, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.cameraRotationY
      );

      // Combine the directional inputs
      const movementVector = new THREE.Vector3()
        .addScaledVector(moveZ, this.direction.z)
        .addScaledVector(moveX, this.direction.x);

      // Apply movement
      this.playerModel.position.x +=
        movementVector.x * this.moveSpeed * deltaTime;
      this.playerModel.position.z +=
        movementVector.z * this.moveSpeed * deltaTime;

      // Rotate player model to face movement direction
      if (movementVector.length() > 0) {
        const targetRotation = Math.atan2(movementVector.x, movementVector.z);

        // Smoothly rotate to the target direction
        const currentRotation = this.playerModel.rotation.y;
        const rotationDiff = targetRotation - currentRotation;

        // Handle crossing the -PI to PI boundary
        const shortestRotation =
          ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

        this.playerModel.rotation.y += shortestRotation * deltaTime * 10;

        // Animate legs while moving
        const legSpeed = 10;
        const legAmplitude = 0.3;
        this.leftLeg.rotation.x =
          Math.sin(Date.now() * 0.01 * legSpeed) * legAmplitude;
        this.rightLeg.rotation.x =
          Math.sin(Date.now() * 0.01 * legSpeed + Math.PI) * legAmplitude;
        this.leftArm.rotation.x =
          Math.sin(Date.now() * 0.01 * legSpeed + Math.PI) * legAmplitude;
        this.rightArm.rotation.x =
          Math.sin(Date.now() * 0.01 * legSpeed) * legAmplitude;
      }
    } else {
      // Reset animations when not moving
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Apply vertical velocity (jumping/falling)
    this.playerModel.position.y += this.velocity.y * deltaTime;

    // Ground check and collision
    const groundLevel = terrain
      ? terrain.getHeightAt(
          this.playerModel.position.x,
          this.playerModel.position.z
        )
      : 0;
    if (this.playerModel.position.y < groundLevel + 0.9) {
      // 0.9 is half of character height
      this.playerModel.position.y = groundLevel + 0.9;
      this.velocity.y = 0;
      this.canJump = true;
    }

    // Boundary checks
    const terrainBounds = terrain ? terrain.getBounds() : { min: -50, max: 50 };
    if (this.playerModel.position.x < terrainBounds.min)
      this.playerModel.position.x = terrainBounds.min;
    if (this.playerModel.position.x > terrainBounds.max)
      this.playerModel.position.x = terrainBounds.max;
    if (this.playerModel.position.z < terrainBounds.min)
      this.playerModel.position.z = terrainBounds.min;
    if (this.playerModel.position.z > terrainBounds.max)
      this.playerModel.position.z = terrainBounds.max;

    // Update shadow position
    this.shadow.position.set(
      this.playerModel.position.x,
      groundLevel + 0.01,
      this.playerModel.position.z
    );
    
    // Update flashlight position and direction
    if (this.flashlight) {
      // Position flashlight at player's head
      this.flashlight.position.copy(this.playerModel.position);
      this.flashlight.position.y += 1.6; // Head height
      
      // Point flashlight in the direction the player is facing
      const lookDirection = new THREE.Vector3(0, 0, -5).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.cameraRotationY
      );
      this.flashlightTarget.position.copy(this.playerModel.position);
      this.flashlightTarget.position.add(lookDirection);
    }

    // Update camera position
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    // Position the camera behind the player based on camera rotation
    const cameraOffset = new THREE.Vector3(
      0,
      this.cameraHeight,
      this.cameraDistance
    );

    // Apply camera rotation
    cameraOffset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.cameraRotationY
    );

    // Set camera position
    this.camera.position.set(
      this.playerModel.position.x + cameraOffset.x,
      this.playerModel.position.y + cameraOffset.y,
      this.playerModel.position.z + cameraOffset.z
    );

    // Make the camera look at the player
    this.camera.lookAt(
      this.playerModel.position.x,
      this.playerModel.position.y + this.cameraLookHeight,
      this.playerModel.position.z
    );
  }

  getPosition() {
    return this.playerModel.position.clone();
  }
}
