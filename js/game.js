class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.world = null;
    this.flowers = null;
    this.clock = new THREE.Clock();
    this.stats = null;
    this.gameStarted = false;
    this.loadingManager = new THREE.LoadingManager();
    this.dayNightControlsAdded = false;

    // Loop system variables
    this.currentLoop = 1;
    this.maxLoops = 5;
    this.loopMemories = []; // Store memories from previous loops

    // Setup loading manager
    this.setupLoadingManager();

    // Initialize the game
    this.init();
  }

  setupLoadingManager() {
    // Setup loading progress tracking
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progressElement = document.querySelector(".progress");
      const progressPercent = (itemsLoaded / itemsTotal) * 100;
      progressElement.style.width = progressPercent + "%";
    };

    this.loadingManager.onLoad = () => {
      // Hide loading screen after a short delay to ensure everything is ready
      setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("instructions").style.display = "block";
      }, 500);
    };
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xafc5d3, 0.003); // More natural fog color and density

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.set(0, 15, 10); // Higher initial position to see the terrain

    // Create renderer with improved settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true, // Helps with z-fighting on large terrains
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb); // Sky blue background

    // Enable high-quality shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Enable tone mapping for more realistic lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Use physical lighting units
    this.renderer.physicallyCorrectLights = true;

    document
      .getElementById("game-container")
      .appendChild(this.renderer.domElement);

    // Add Stats (FPS counter)
    this.stats = new Stats();
    this.stats.domElement.style.position = "absolute";
    this.stats.domElement.style.top = "0px";
    this.stats.domElement.style.right = "0px";
    document
      .getElementById("game-container")
      .appendChild(this.stats.domElement);

    // Create world with loading manager
    this.world = new World(this.scene, this.loadingManager);

    // Create player
    this.player = new Player(this.camera, this.scene);

    // Create flowers with loading manager
    this.flowers = new Flowers(this.scene, this.world, this.loadingManager);

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize(), false);

    // Add day/night controls
    this.setupDayNightControls();

    // Start the animation loop
    this.animate();
  }

  setupDayNightControls() {
    // Add event listeners for day/night cycle controls
    document.addEventListener("keydown", (event) => {
      // Toggle day/night with 'L' key
      if (event.code === "KeyL" && this.gameStarted) {
        this.world.toggleDayNight();
        this.showMessage("Time of day changed");
      }

      // Toggle automatic day/night cycle with 'K' key
      if (event.code === "KeyK" && this.gameStarted) {
        const isActive = this.world.toggleDayNightCycle();
        this.showMessage(
          isActive ? "Day/night cycle activated" : "Day/night cycle paused"
        );
      }
    });

    // Create controls UI
    if (!this.dayNightControlsAdded) {
      const controlsDiv = document.createElement("div");
      controlsDiv.className = "day-night-controls";
      controlsDiv.innerHTML = `
        <div>Press <strong>L</strong> to toggle day/night</div>
        <div>Press <strong>K</strong> to toggle automatic cycle</div>
      `;
      document.getElementById("game-container").appendChild(controlsDiv);
      this.dayNightControlsAdded = true;
    }
  }

  startGame() {
    if (this.gameStarted) return;

    this.gameStarted = true;
    document.getElementById("instructions").style.display = "none";

    // Request pointer lock for mouse control
    document.body.requestPointerLock();

    // Reset the game state
    this.reset();

    // Show message about day/night controls
    setTimeout(() => {
      this.showMessage("L: Toggle day/night | K: Toggle automatic cycle");
    }, 2000);
  }

  reset() {
    // Reset player position to a higher spot above the terrain to better see it
    const centerX = 0;
    const centerZ = 0;
    const height = this.world.getHeightAt(centerX, centerZ) + 10; // Start higher up

    this.player.playerModel.position.set(centerX, height, centerZ);
    this.player.velocity.set(0, 0, 0);

    // Reset score
    document.getElementById("score").textContent = "0";
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Get delta time
    const deltaTime = this.clock.getDelta();

    // Update game components
    if (this.gameStarted) {
      // Update player
      this.player.update(deltaTime, this.world);

      // Update world
      this.world.update(deltaTime);

      // Update flowers
      this.flowers.update(deltaTime, this.player.getPosition());

      // Check win condition
      if (this.flowers.getRemainingFlowerCount() === 0) {
        this.showWinMessage();
      }
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);

    // Update stats
    if (this.stats) this.stats.update();
  }

  showWinMessage() {
    const messageElement = document.createElement("div");
    messageElement.className = "flower-collected-message";
    messageElement.style.fontSize = "36px";
    messageElement.style.padding = "20px 40px";

    if (this.currentLoop < this.maxLoops) {
      messageElement.textContent = `Loop ${this.currentLoop} Complete!`;

      // Create a dialog for continuing
      const continueDialog = document.createElement("div");
      continueDialog.className = "continue-dialog";
      continueDialog.innerHTML = `
        <p>Continue to iterate?</p>
        <div class="button-container">
          <button id="continue-yes">Yes</button>
          <button id="continue-no">No</button>
        </div>
      `;
      document.getElementById("game-container").appendChild(continueDialog);

      // Add event listeners for buttons
      document.getElementById("continue-yes").addEventListener("click", () => {
        continueDialog.remove();

        // Save a memory from this loop
        this.saveLoopMemory();

        // Advance to next loop
        this.currentLoop++;
        this.startNextLoop();

        // Remove the win message
        messageElement.style.opacity = "0";
        setTimeout(() => messageElement.remove(), 1000);
      });

      document.getElementById("continue-no").addEventListener("click", () => {
        continueDialog.remove();
        this.showFinalMessage();

        // Remove the win message
        messageElement.style.opacity = "0";
        setTimeout(() => messageElement.remove(), 1000);
      });
    } else {
      messageElement.textContent =
        "All Loops Complete! You've Mastered the Memory Loop!";

      // For the final loop, show the final message after a delay
      setTimeout(() => {
        messageElement.style.opacity = "0";
        setTimeout(() => {
          messageElement.remove();
          this.showFinalMessage();
        }, 1000);
      }, 3000);
    }

    document.getElementById("game-container").appendChild(messageElement);

    // Show message
    messageElement.style.opacity = "1";
  }

  saveLoopMemory() {
    // Save some aspect of the current play session as a "memory"
    const memory = {
      loop: this.currentLoop,
      playerPosition: this.player.getPosition().clone(),
      timeOfDay: this.world.timeOfDay,
      flowersCollected: this.flowers.getCollectedFlowerCount(),
      timestamp: new Date().toLocaleTimeString(),
    };

    this.loopMemories.push(memory);
    console.log("Memory saved:", memory);
  }

  startNextLoop() {
    // Increase difficulty
    this.increaseDifficulty();

    // Reset game state for new loop
    this.reset();

    // Display memories from previous loops
    this.showLoopMemories();

    // Update loop counter in UI
    this.updateLoopCounter();

    // Show message about the new loop
    this.showMessage(
      `Loop ${this.currentLoop} started. Difficulty increased!`,
      4000
    );
  }

  increaseDifficulty() {
    // Make each loop more challenging

    // 1. Speed up day/night cycle with each loop
    const newCycleDuration = Math.max(20, this.world.cycleDuration - 10);
    this.world.cycleDuration = newCycleDuration;

    // 2. Add more flowers to collect with each loop
    const additionalFlowers = this.currentLoop * 2;
    this.flowers.addFlowers(additionalFlowers);

    // 3. Make terrain more extreme with each loop
    this.world.increaseTerrain(this.currentLoop * 0.2);

    // 4. Add environmental challenge based on loop number
    switch (this.currentLoop) {
      case 2:
        this.world.addFog(0.001 * this.currentLoop);
        break;
      case 3:
        this.world.activateWeatherSystem();
        break;
      case 4:
        this.world.accelerateTimeFlow(1.5);
        break;
      case 5:
        this.world.addMysteriousElements();
        break;
    }
  }

  showLoopMemories() {
    // Only show memories after the first loop
    if (this.currentLoop <= 1) return;

    // Create memories UI
    const memoriesContainer = document.createElement("div");
    memoriesContainer.className = "memories-container";
    memoriesContainer.innerHTML = `<h3>Memories from Previous Loops</h3>`;

    // Add each memory
    this.loopMemories.forEach((memory) => {
      const memoryElement = document.createElement("div");
      memoryElement.className = "memory-item";
      memoryElement.textContent = `Loop ${memory.loop}: Collected ${memory.flowersCollected} flowers at ${memory.timestamp}`;
      memoriesContainer.appendChild(memoryElement);
    });

    document.getElementById("game-container").appendChild(memoriesContainer);

    // Fade in
    memoriesContainer.style.opacity = "1";

    // Fade out after a delay
    setTimeout(() => {
      memoriesContainer.style.opacity = "0";
      setTimeout(() => memoriesContainer.remove(), 1000);
    }, 5000);
  }

  updateLoopCounter() {
    // Create or update loop counter in UI
    let loopCounter = document.getElementById("loop-counter");

    if (!loopCounter) {
      loopCounter = document.createElement("div");
      loopCounter.id = "loop-counter";
      loopCounter.className = "game-ui";
      document.getElementById("game-container").appendChild(loopCounter);
    }

    loopCounter.textContent = `LOOP: ${this.currentLoop}/${this.maxLoops}`;
  }

  showFinalMessage() {
    const finalScreen = document.createElement("div");
    finalScreen.className = "final-screen";
    finalScreen.innerHTML = `
      <h1>Memory Loop Complete</h1>
      <p>You've successfully navigated all ${this.maxLoops} memory loops!</p>
      <h2>Your Journey:</h2>
      <ul id="memories-list"></ul>
      <button id="restart-game">Start New Journey</button>
    `;

    document.getElementById("game-container").appendChild(finalScreen);

    // Add memories to the list
    const memoriesList = document.getElementById("memories-list");
    this.loopMemories.forEach((memory) => {
      const listItem = document.createElement("li");
      listItem.textContent = `Loop ${memory.loop}: Collected ${memory.flowersCollected} flowers at ${memory.timestamp}`;
      memoriesList.appendChild(listItem);
    });

    // Add restart functionality
    document.getElementById("restart-game").addEventListener("click", () => {
      location.reload();
    });
  }
}

// Create and start the game when the DOM is ready
let game;
document.addEventListener("DOMContentLoaded", () => {
  game = new Game();
});
