// Main Game Initialization and Loop

class Game {
  constructor() {
    // Game state
    this.isLoading = true;
    this.isPaused = false;
    this.isGameStarted = false;

    // Initialize components
    this.config = new Config();
    this.utils = new Utils();
    this.world = new World(this);
    this.character = new Character(this);
    this.controls = new Controls(this);
    this.ui = new UI(this);
    this.story = new Story(this);

    // Setup event listeners
    this.setupEventListeners();

    // Start loading assets
    this.loadAssets();
  }

  setupEventListeners() {
    // Menu buttons
    document
      .getElementById("start-game")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("options")
      .addEventListener("click", () => this.showOptions());
    document
      .getElementById("credits")
      .addEventListener("click", () => this.showCredits());

    // Game UI buttons
    document
      .getElementById("inventory-button")
      .addEventListener("click", () => this.ui.toggleInventory());
    document
      .getElementById("quest-log-button")
      .addEventListener("click", () => this.ui.toggleQuestLog());

    // Dialog controls
    document
      .querySelector(".dialog-next")
      .addEventListener("click", () => this.story.advanceDialog());

    // Window resize
    window.addEventListener("resize", () => this.handleResize());

    // Keyboard events for game controls are handled in Controls class
  }

  loadAssets() {
    // Simulate loading progress
    const progressBar = document.querySelector(".progress-fill");
    let progress = 0;

    // Hide game menu initially during loading
    document.getElementById("game-menu").classList.add("hidden");
    document.getElementById("loading-screen").classList.remove("hidden");

    const loadingInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        this.finishLoading();
      }
      progressBar.style.width = `${progress}%`;
      document.querySelector(
        ".loading-text"
      ).textContent = `Loading world... ${Math.floor(progress)}%`;
    }, 500);

    // In a real game, we would load models, textures, sounds, etc. here
    this.world.loadModels();
    this.character.loadModels();
  }

  finishLoading() {
    setTimeout(() => {
      this.isLoading = false;
      document.getElementById("loading-screen").classList.add("hidden");
      document.getElementById("game-menu").classList.remove("hidden");
      console.log("Loading finished, game menu should be visible now");
    }, 1000);

    // Ensure the game menu is visible after a longer timeout as a fallback
    setTimeout(() => {
      if (document.getElementById("game-menu").classList.contains("hidden")) {
        console.log("Fallback: forcing game menu to be visible");
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("game-menu").classList.remove("hidden");
        document.getElementById("game-menu").style.display = "block";
      }
    }, 3000);
  }

  startGame() {
    console.log("Starting game...");
    this.isGameStarted = true;
    document.getElementById("game-menu").classList.add("hidden");

    try {
      console.log("Initializing 3D world...");
      // Initialize the 3D world
      this.world.init();

      console.log("Initializing player character...");
      // Add player character to the world
      this.character.init();

      console.log("Initializing controls...");
      // Initialize controls
      this.controls.init();

      console.log("Starting game loop...");
      // Start the game loop
      this.gameLoop();

      // Start the intro sequence
      this.story.startIntro();
      console.log("Game started successfully!");
    } catch (error) {
      console.error("Error starting game:", error);
      alert(
        "An error occurred while starting the game. Please check the console for details."
      );
    }
  }

  gameLoop() {
    try {
      if (!this.isPaused && this.isGameStarted) {
        // Force a render on first frame to avoid black screen
        if (
          !this._firstFrameRendered &&
          this.world &&
          this.world.renderer &&
          this.world.scene &&
          this.world.camera
        ) {
          console.log("Forcing initial render...");
          this.world.renderer.clear();
          this.world.renderer.render(this.world.scene, this.world.camera);
          this._firstFrameRendered = true;
        }

        // Update world
        if (this.world) this.world.update();

        // Update character
        if (this.character) this.character.update();

        // Update UI
        if (this.ui) this.ui.update();
      }
    } catch (error) {
      console.error("Error in game loop:", error);
    }

    // Request next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  handleResize() {
    if (this.isGameStarted) {
      this.world.resize();
    }
  }

  showOptions() {
    console.log("Options menu would appear here");
    // Implement options menu
  }

  showCredits() {
    console.log("Credits would appear here");
    // Implement credits screen
  }

  pause() {
    this.isPaused = true;
    // Implement pause functionality
  }

  resume() {
    this.isPaused = false;
    // Implement resume functionality
  }
}

// Initialize the game when the window loads
window.addEventListener("load", () => {
  // Check if THREE.js is loaded
  if (typeof THREE === "undefined") {
    console.error("THREE.js is not loaded. Game cannot start.");
    alert(
      "Error: THREE.js library failed to load. Please check your internet connection and try again."
    );
    return;
  }

  // Check if custom geometry is available
  if (!THREE.CustomCapsuleGeometry) {
    console.warn(
      "CustomCapsuleGeometry not registered yet, registering now..."
    );
    // Make sure CustomCapsuleGeometry is registered
    if (typeof CustomCapsuleGeometry !== "undefined") {
      THREE.CustomCapsuleGeometry = CustomCapsuleGeometry;
    }
  }

  // Initialize game
  window.game = new Game();

  // Additional check to ensure loading screen and game menu are properly handled
  setTimeout(() => {
    if (
      document.getElementById("loading-screen") &&
      !document.getElementById("loading-screen").classList.contains("hidden")
    ) {
      console.log("Force hiding loading screen after page load");
      document.getElementById("loading-screen").classList.add("hidden");
    }

    if (
      document.getElementById("game-menu") &&
      document.getElementById("game-menu").classList.contains("hidden")
    ) {
      console.log("Force showing game menu after page load");
      document.getElementById("game-menu").classList.remove("hidden");
    }
  }, 5000);
});
