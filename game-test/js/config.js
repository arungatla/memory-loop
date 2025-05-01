// Config class - Stores game configuration settings and constants

class Config {
  constructor() {
    // Graphics settings
    this.graphicsQuality = "medium"; // low, medium, high
    this.shadowsEnabled = true;
    this.antialiasing = true;
    this.maxFPS = 60;
    this.showFPS = false;
    this.showStats = false; // For performance monitoring

    // Audio settings
    this.masterVolume = 0.8; // 0.0 to 1.0
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.dialogVolume = 1.0;

    // Gameplay settings
    this.difficulty = "normal"; // easy, normal, hard
    this.cameraDistance = 5;
    this.cameraHeight = 3;
    this.mouseSensitivity = 0.5;
    this.invertYAxis = false;
    this.autoSave = true;
    this.autoSaveInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

    // World settings
    this.worldSize = 1000;
    this.drawDistance = 500;
    this.dayNightCycleEnabled = true;
    this.dayNightCycleDuration = 20 * 60 * 1000; // 20 minutes in milliseconds

    // Debug settings
    this.debugMode = false;
    this.showColliders = false;
    this.godMode = false;

    // Load saved settings if available
    this.loadSettings();
  }

  loadSettings() {
    // In a real game, we would load settings from localStorage or a server
    try {
      const savedSettings = localStorage.getItem("gameSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        // Apply saved settings
        Object.assign(this, settings);
        console.log("Settings loaded successfully");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  saveSettings() {
    // In a real game, we would save settings to localStorage or a server
    try {
      localStorage.setItem(
        "gameSettings",
        JSON.stringify({
          graphicsQuality: this.graphicsQuality,
          shadowsEnabled: this.shadowsEnabled,
          antialiasing: this.antialiasing,
          maxFPS: this.maxFPS,
          masterVolume: this.masterVolume,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          dialogVolume: this.dialogVolume,
          difficulty: this.difficulty,
          mouseSensitivity: this.mouseSensitivity,
          invertYAxis: this.invertYAxis,
          autoSave: this.autoSave,
        })
      );
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  applyGraphicsSettings() {
    // Apply graphics settings to the renderer and scene
    // This would be called when settings are changed

    // Example implementation:
    if (window.game && window.game.world && window.game.world.renderer) {
      const renderer = window.game.world.renderer;

      // Apply antialiasing
      // Note: This would actually require recreating the renderer in a real implementation
      // renderer.antialias = this.antialiasing;

      // Apply shadows
      renderer.shadowMap.enabled = this.shadowsEnabled;

      // Apply quality settings
      switch (this.graphicsQuality) {
        case "low":
          renderer.setPixelRatio(1);
          break;
        case "medium":
          renderer.setPixelRatio(window.devicePixelRatio);
          break;
        case "high":
          renderer.setPixelRatio(window.devicePixelRatio);
          // Enable additional high-quality effects
          break;
      }
    }
  }

  resetToDefaults() {
    // Reset all settings to default values
    this.graphicsQuality = "medium";
    this.shadowsEnabled = true;
    this.antialiasing = true;
    this.maxFPS = 60;
    this.showFPS = false;

    this.masterVolume = 0.8;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.dialogVolume = 1.0;

    this.difficulty = "normal";
    this.mouseSensitivity = 0.5;
    this.invertYAxis = false;
    this.autoSave = true;

    // Save the default settings
    this.saveSettings();

    // Apply the default settings
    this.applyGraphicsSettings();

    console.log("Settings reset to defaults");
  }
}
