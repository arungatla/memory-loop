// Controls class - Handles user input for character movement and game interactions

class Controls {
  constructor(game) {
    this.game = game;

    // Movement input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      run: false,
      attack: false,
      interact: false,
    };

    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      isDown: false,
    };

    // Touch state for mobile devices
    this.touch = {
      joystickActive: false,
      joystickOrigin: { x: 0, y: 0 },
      joystickPosition: { x: 0, y: 0 },
    };

    // Controller state
    this.gamepad = null;

    // Pointer lock for mouse control
    this.isPointerLocked = false;
  }

  init() {
    // Set up keyboard event listeners
    this.setupKeyboardControls();

    // Set up mouse event listeners
    this.setupMouseControls();

    // Set up touch controls for mobile
    this.setupTouchControls();

    // Set up gamepad controls
    this.setupGamepadControls();
  }

  setupKeyboardControls() {
    // Keyboard down event
    document.addEventListener("keydown", (event) => {
      this.handleKeyDown(event.code);
    });

    // Keyboard up event
    document.addEventListener("keyup", (event) => {
      this.handleKeyUp(event.code);
    });
  }

  handleKeyDown(code) {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.keys.forward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.keys.backward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.keys.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.keys.right = true;
        break;
      case "Space":
        this.keys.jump = true;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.keys.run = true;
        break;
      case "KeyE":
        this.keys.interact = true;
        this.handleInteraction();
        break;
      case "Mouse0":
      case "KeyF":
        this.keys.attack = true;
        break;
      case "Escape":
        this.togglePause();
        break;
      case "KeyI":
        this.game.ui.toggleInventory();
        break;
      case "KeyQ":
        this.game.ui.toggleQuestLog();
        break;
      case "KeyM":
        this.game.ui.toggleMap();
        break;
    }
  }

  handleKeyUp(code) {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.keys.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.keys.backward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.keys.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.keys.right = false;
        break;
      case "Space":
        this.keys.jump = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.keys.run = false;
        break;
      case "KeyE":
        this.keys.interact = false;
        break;
      case "Mouse0":
      case "KeyF":
        this.keys.attack = false;
        break;
    }
  }

  setupMouseControls() {
    // Mouse move event
    document.addEventListener("mousemove", (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;

      if (this.isPointerLocked) {
        // Use movementX and movementY for camera rotation when pointer is locked
        this.handleCameraRotation(event.movementX, event.movementY);
      }
    });

    // Mouse down event
    document.addEventListener("mousedown", (event) => {
      this.mouse.isDown = true;

      if (event.button === 0) {
        // Left click
        this.keys.attack = true;
      }
    });

    // Mouse up event
    document.addEventListener("mouseup", (event) => {
      this.mouse.isDown = false;

      if (event.button === 0) {
        // Left click
        this.keys.attack = false;
      }
    });

    // Pointer lock for first-person camera control
    document.addEventListener("click", () => {
      if (this.game.isGameStarted && !this.isPointerLocked) {
        this.requestPointerLock();
      }
    });

    // Handle pointer lock change
    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  requestPointerLock() {
    const canvas = this.game.world.renderer.domElement;
    canvas.requestPointerLock =
      canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
  }

  handleCameraRotation(movementX, movementY) {
    // Rotate character based on mouse movement with improved sensitivity and smoothness
    if (this.game.character && this.game.character.model) {
      // Configurable sensitivity
      const horizontalSensitivity = 0.0015; // Reduced for smoother rotation
      const verticalSensitivity = 0.0015; // Reduced for smoother rotation

      // Apply smoothing factor
      const smoothingFactor = 0.8; // Higher value = smoother camera

      // Calculate target rotation with smoothing
      const targetHorizontalRotation =
        this.game.character.model.rotation.y -
        movementX * horizontalSensitivity;

      // Apply smoothed horizontal rotation (around Y axis)
      this.game.character.model.rotation.y =
        this.game.character.model.rotation.y * (1 - smoothingFactor) +
        targetHorizontalRotation * smoothingFactor;

      // Vertical rotation is handled by the camera with improved limits
      // Calculate target vertical rotation
      const targetVerticalRotation =
        this.game.world.camera.rotation.x + movementY * verticalSensitivity;

      // Apply smoothed vertical rotation with improved limits to prevent flipping
      const newVerticalRotation =
        this.game.world.camera.rotation.x * (1 - smoothingFactor) +
        targetVerticalRotation * smoothingFactor;

      // Apply limits to vertical rotation
      this.game.world.camera.rotation.x = Math.max(
        -Math.PI / 2.5, // Increased range for better looking up/down
        Math.min(Math.PI / 2.5, newVerticalRotation)
      );
    }
  }

  setupTouchControls() {
    // For mobile devices, we'll create a virtual joystick
    const canvas = this.game.world.renderer?.domElement;
    if (!canvas) return;

    // Touch start event
    canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();

      const touch = event.touches[0];

      // If touch is on the left side of the screen, it's the movement joystick
      if (touch.clientX < window.innerWidth / 2) {
        this.touch.joystickActive = true;
        this.touch.joystickOrigin = { x: touch.clientX, y: touch.clientY };
        this.touch.joystickPosition = { x: touch.clientX, y: touch.clientY };
      }
      // If touch is on the right side, it's an action button (attack)
      else {
        this.keys.attack = true;
      }
    });

    // Touch move event
    canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();

      // Update joystick position
      if (this.touch.joystickActive) {
        const touch = event.touches[0];
        this.touch.joystickPosition = { x: touch.clientX, y: touch.clientY };

        // Calculate joystick direction and magnitude
        const deltaX =
          this.touch.joystickPosition.x - this.touch.joystickOrigin.x;
        const deltaY =
          this.touch.joystickPosition.y - this.touch.joystickOrigin.y;

        // Convert to movement input
        const maxDistance = 50; // Maximum joystick distance
        const distance = Math.min(
          Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          maxDistance
        );
        const angle = Math.atan2(deltaY, deltaX);

        // Reset all movement keys
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;

        // Only register movement if joystick is moved beyond a threshold
        if (distance > 10) {
          // Determine which keys to press based on angle
          if (angle > (-Math.PI * 3) / 4 && angle < -Math.PI / 4) {
            this.keys.forward = true;
          } else if (angle > Math.PI / 4 && angle < (Math.PI * 3) / 4) {
            this.keys.backward = true;
          }

          if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
            this.keys.right = true;
          } else if (angle > (Math.PI * 3) / 4 || angle < (-Math.PI * 3) / 4) {
            this.keys.left = true;
          }

          // Enable running if joystick is pushed far enough
          this.keys.run = distance > maxDistance * 0.7;
        }
      }
    });

    // Touch end event
    canvas.addEventListener("touchend", (event) => {
      event.preventDefault();

      // Check if all touches have ended
      if (event.touches.length === 0) {
        // Reset joystick
        this.touch.joystickActive = false;

        // Reset movement keys
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
        this.keys.run = false;
        this.keys.attack = false;
      }
    });
  }

  setupGamepadControls() {
    // Check for gamepad support
    if ("getGamepads" in navigator) {
      // Listen for gamepad connection
      window.addEventListener("gamepadconnected", (event) => {
        console.log("Gamepad connected:", event.gamepad.id);
        this.gamepad = event.gamepad;
      });

      // Listen for gamepad disconnection
      window.addEventListener("gamepaddisconnected", (event) => {
        console.log("Gamepad disconnected:", event.gamepad.id);
        this.gamepad = null;
      });
    }
  }

  updateGamepadInput() {
    // Check if gamepad is connected
    if (!this.gamepad) {
      // Update gamepad object with the latest state
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepad = gamepads[i];
          break;
        }
      }

      if (!this.gamepad) return;
    }

    // Get fresh gamepad state
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[this.gamepad.index];

    if (!gamepad) return;

    // Left stick for movement
    const leftStickX = gamepad.axes[0]; // -1 (left) to 1 (right)
    const leftStickY = gamepad.axes[1]; // -1 (up) to 1 (down)

    // Apply deadzone
    const deadzone = 0.15;

    // Reset movement keys
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;

    // Set movement based on left stick
    if (Math.abs(leftStickY) > deadzone) {
      this.keys.forward = leftStickY < -deadzone;
      this.keys.backward = leftStickY > deadzone;
    }

    if (Math.abs(leftStickX) > deadzone) {
      this.keys.left = leftStickX < -deadzone;
      this.keys.right = leftStickX > deadzone;
    }

    // Right stick for camera
    const rightStickX = gamepad.axes[2]; // -1 (left) to 1 (right)
    const rightStickY = gamepad.axes[3]; // -1 (up) to 1 (down)

    // Apply camera rotation if right stick is moved beyond deadzone
    if (Math.abs(rightStickX) > deadzone || Math.abs(rightStickY) > deadzone) {
      this.handleCameraRotation(
        rightStickX * 5, // Scale for sensitivity
        rightStickY * 5
      );
    }

    // Buttons
    // Common gamepad mapping: 0=A, 1=B, 2=X, 3=Y, 4=LB, 5=RB, 6=LT, 7=RT, 8=Back, 9=Start
    this.keys.jump = gamepad.buttons[0].pressed; // A button
    this.keys.attack = gamepad.buttons[2].pressed; // X button
    this.keys.interact = gamepad.buttons[3].pressed; // Y button
    this.keys.run = gamepad.buttons[10].pressed || gamepad.buttons[1].pressed; // Left stick press or B

    // Handle other buttons
    if (gamepad.buttons[9].pressed && !this.startButtonWasPressed) {
      // Start button
      this.togglePause();
    }
    this.startButtonWasPressed = gamepad.buttons[9].pressed;

    if (gamepad.buttons[8].pressed && !this.backButtonWasPressed) {
      // Back button
      this.game.ui.toggleMap();
    }
    this.backButtonWasPressed = gamepad.buttons[8].pressed;
  }

  getMovementInput() {
    // Update gamepad input if available
    this.updateGamepadInput();

    // Return the current movement input state
    return {
      forward: this.keys.forward,
      backward: this.keys.backward,
      left: this.keys.left,
      right: this.keys.right,
      jump: this.keys.jump,
      run: this.keys.run,
      attack: this.keys.attack,
      interact: this.keys.interact,
    };
  }

  handleInteraction() {
    // Check for interactive objects near the player
    if (!this.game.character || !this.game.character.model) return;

    const playerPosition = this.game.character.model.position.clone();
    const interactionDistance = 2; // Maximum distance for interaction

    // Check NPCs
    for (const npc of this.game.world.npcs) {
      const distance = playerPosition.distanceTo(npc.position);

      if (distance <= interactionDistance) {
        // Interact with NPC
        this.game.story.startDialog(npc.userData.name);
        return;
      }
    }

    // Check other interactive objects
    // This would be expanded in a real game to handle items, doors, etc.
    console.log("No interactive objects nearby");
  }

  togglePause() {
    if (this.game.isGameStarted) {
      if (this.game.isPaused) {
        this.game.resume();
      } else {
        this.game.pause();
      }
    }
  }
}
