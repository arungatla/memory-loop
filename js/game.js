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
    messageElement.textContent = "All Flowers Collected! You Win!";
    document.getElementById("game-container").appendChild(messageElement);

    // Show and fade out message after a longer time
    messageElement.style.opacity = "1";

    setTimeout(() => {
      messageElement.style.opacity = "0";

      // Reset game after a delay
      setTimeout(() => {
        messageElement.remove();
        location.reload(); // Simple way to restart the game
      }, 1000);
    }, 5000);
  }

  showMessage(text, duration = 3000) {
    // Create or reuse message element
    let messageElement = document.querySelector(".game-message");
    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.className = "game-message";
      document.getElementById("game-container").appendChild(messageElement);
    }

    // Set message text
    messageElement.textContent = text;

    // Show message
    messageElement.style.opacity = "1";

    // Hide message after duration
    setTimeout(() => {
      messageElement.style.opacity = "0";
    }, duration);
  }
}

// Create and start the game when the DOM is ready
let game;
document.addEventListener("DOMContentLoaded", () => {
  game = new Game();
});
