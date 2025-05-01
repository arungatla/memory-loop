// UI class - Handles the game's user interface elements, notifications, and menus

class UI {
  constructor(game) {
    this.game = game;

    // UI elements
    this.healthBar = document.querySelector(".health-fill");
    this.miniMap = document.getElementById("mini-map");
    this.inventoryButton = document.getElementById("inventory-button");
    this.questLogButton = document.getElementById("quest-log-button");

    // UI states
    this.isInventoryOpen = false;
    this.isQuestLogOpen = false;
    this.isMapOpen = false;

    // Create additional UI elements
    this.createInventoryPanel();
    this.createQuestLogPanel();
    this.createMapPanel();
    this.createNotificationSystem();
  }

  createInventoryPanel() {
    // Create inventory panel
    const inventoryPanel = document.createElement("div");
    inventoryPanel.id = "inventory-panel";
    inventoryPanel.className = "game-panel hidden";

    // Create inventory content
    inventoryPanel.innerHTML = `
            <div class="panel-header">
                <h2>Inventory</h2>
                <button class="close-button">×</button>
            </div>
            <div class="panel-content">
                <div class="inventory-grid"></div>
                <div class="item-details">
                    <h3>Select an item</h3>
                    <p class="item-description">Item details will appear here.</p>
                    <div class="item-actions">
                        <button class="use-item-button" disabled>Use</button>
                        <button class="drop-item-button" disabled>Drop</button>
                    </div>
                </div>
            </div>
        `;

    // Add to game container
    document.getElementById("game-container").appendChild(inventoryPanel);

    // Add event listeners
    inventoryPanel
      .querySelector(".close-button")
      .addEventListener("click", () => {
        this.toggleInventory();
      });
  }

  createQuestLogPanel() {
    // Create quest log panel
    const questLogPanel = document.createElement("div");
    questLogPanel.id = "quest-log-panel";
    questLogPanel.className = "game-panel hidden";

    // Create quest log content
    questLogPanel.innerHTML = `
            <div class="panel-header">
                <h2>Quest Log</h2>
                <button class="close-button">×</button>
            </div>
            <div class="panel-content">
                <div class="quest-list">
                    <h3>Active Quests</h3>
                    <ul class="active-quests"></ul>
                    <h3>Completed Quests</h3>
                    <ul class="completed-quests"></ul>
                </div>
                <div class="quest-details">
                    <h3 class="quest-title">Select a quest</h3>
                    <p class="quest-description">Quest details will appear here.</p>
                    <h4>Objectives:</h4>
                    <ul class="quest-objectives"></ul>
                    <div class="quest-rewards">
                        <h4>Rewards:</h4>
                        <p>Quest rewards will appear here.</p>
                    </div>
                </div>
            </div>
        `;

    // Add to game container
    document.getElementById("game-container").appendChild(questLogPanel);

    // Add event listeners
    questLogPanel
      .querySelector(".close-button")
      .addEventListener("click", () => {
        this.toggleQuestLog();
      });
  }

  createMapPanel() {
    // Create map panel
    const mapPanel = document.createElement("div");
    mapPanel.id = "map-panel";
    mapPanel.className = "game-panel hidden";

    // Create map content
    mapPanel.innerHTML = `
            <div class="panel-header">
                <h2>World Map</h2>
                <button class="close-button">×</button>
            </div>
            <div class="panel-content">
                <div class="world-map">
                    <div class="map-player-marker"></div>
                    <div class="map-location" data-location="village" style="left: 60%; top: 40%;">Village</div>
                    <div class="map-location" data-location="ruins" style="left: 30%; top: 20%;">Ancient Ruins</div>
                    <div class="map-location" data-location="forest" style="left: 20%; top: 60%;">Mystic Forest</div>
                    <div class="map-location" data-location="mountain" style="left: 80%; top: 30%;">Misty Mountains</div>
                </div>
                <div class="map-legend">
                    <div class="legend-item">
                        <div class="legend-marker player-marker"></div>
                        <span>Your Location</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-marker quest-marker"></div>
                        <span>Quest Location</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-marker poi-marker"></div>
                        <span>Point of Interest</span>
                    </div>
                </div>
            </div>
        `;

    // Add to game container
    document.getElementById("game-container").appendChild(mapPanel);

    // Add event listeners
    mapPanel.querySelector(".close-button").addEventListener("click", () => {
      this.toggleMap();
    });
  }

  createNotificationSystem() {
    // Create notification container
    const notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";

    // Add to game container
    document
      .getElementById("game-container")
      .appendChild(notificationContainer);
  }

  update() {
    // Update health bar
    if (this.game.character && this.game.character.stats) {
      const healthPercent =
        (this.game.character.stats.health /
          this.game.character.stats.maxHealth) *
        100;
      this.healthBar.style.width = `${healthPercent}%`;
    }

    // Update mini-map
    this.updateMiniMap();
  }

  updateMiniMap() {
    // In a real game, we would update the mini-map with the player's position and nearby points of interest
    // For now, we'll just simulate a player marker
    if (!this.miniMapContext) {
      // Create a canvas for the mini-map
      const miniMapCanvas = document.createElement("canvas");
      miniMapCanvas.width = 150;
      miniMapCanvas.height = 150;
      this.miniMap.appendChild(miniMapCanvas);
      this.miniMapContext = miniMapCanvas.getContext("2d");
    }

    // Clear mini-map
    this.miniMapContext.clearRect(0, 0, 150, 150);

    // Draw background
    this.miniMapContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.miniMapContext.fillRect(0, 0, 150, 150);

    // Draw terrain (simplified)
    this.miniMapContext.fillStyle = "#33aa33";
    this.miniMapContext.fillRect(10, 10, 130, 130);

    // Draw player marker at center
    this.miniMapContext.fillStyle = "#ff9900";
    this.miniMapContext.beginPath();
    this.miniMapContext.arc(75, 75, 5, 0, Math.PI * 2);
    this.miniMapContext.fill();

    // Draw player direction
    if (this.game.character && this.game.character.model) {
      const angle = this.game.character.model.rotation.y;
      this.miniMapContext.strokeStyle = "#ff9900";
      this.miniMapContext.lineWidth = 2;
      this.miniMapContext.beginPath();
      this.miniMapContext.moveTo(75, 75);
      this.miniMapContext.lineTo(
        75 + Math.sin(angle) * 10,
        75 - Math.cos(angle) * 10
      );
      this.miniMapContext.stroke();
    }

    // Draw nearby points of interest
    // This would be based on actual game data in a real implementation
    this.miniMapContext.fillStyle = "#ffffff";
    this.miniMapContext.beginPath();
    this.miniMapContext.arc(100, 50, 3, 0, Math.PI * 2);
    this.miniMapContext.fill();

    this.miniMapContext.beginPath();
    this.miniMapContext.arc(40, 90, 3, 0, Math.PI * 2);
    this.miniMapContext.fill();
  }

  toggleInventory() {
    const inventoryPanel = document.getElementById("inventory-panel");

    if (this.isInventoryOpen) {
      inventoryPanel.classList.add("hidden");
      this.isInventoryOpen = false;
    } else {
      // Close other panels
      this.closeAllPanels();

      // Update inventory content
      this.updateInventory();

      // Show inventory panel
      inventoryPanel.classList.remove("hidden");
      this.isInventoryOpen = true;
    }
  }

  updateInventory() {
    // In a real game, we would populate the inventory with actual items
    // For now, let's add some placeholder items
    const inventoryGrid = document.querySelector(".inventory-grid");
    inventoryGrid.innerHTML = "";

    const placeholderItems = [
      {
        id: "health_potion",
        name: "Health Potion",
        description: "Restores 50 health points.",
        icon: "🧪",
      },
      {
        id: "sword",
        name: "Iron Sword",
        description: "A basic sword that deals moderate damage.",
        icon: "⚔️",
      },
      {
        id: "shield",
        name: "Wooden Shield",
        description: "A basic shield that provides some protection.",
        icon: "🛡️",
      },
      {
        id: "bow",
        name: "Hunting Bow",
        description: "A bow for ranged attacks.",
        icon: "🏹",
      },
      {
        id: "map",
        name: "Map Fragment",
        description: "A torn piece of map showing part of the ancient ruins.",
        icon: "🗺️",
      },
    ];

    placeholderItems.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "inventory-item";
      itemElement.dataset.itemId = item.id;
      itemElement.innerHTML = `<span class="item-icon">${item.icon}</span>`;

      itemElement.addEventListener("click", () => {
        this.showItemDetails(item);
      });

      inventoryGrid.appendChild(itemElement);
    });
  }

  showItemDetails(item) {
    const itemDetails = document.querySelector(".item-details");
    itemDetails.querySelector("h3").textContent = item.name;
    itemDetails.querySelector(".item-description").textContent =
      item.description;

    const useButton = itemDetails.querySelector(".use-item-button");
    const dropButton = itemDetails.querySelector(".drop-item-button");

    useButton.disabled = false;
    dropButton.disabled = false;

    useButton.onclick = () => {
      this.useItem(item.id);
    };

    dropButton.onclick = () => {
      this.dropItem(item.id);
    };
  }

  useItem(itemId) {
    // In a real game, this would use the item and apply its effects
    console.log(`Using item: ${itemId}`);
    this.showNotification(`Used item: ${itemId}`);
  }

  dropItem(itemId) {
    // In a real game, this would remove the item from inventory and create it in the world
    console.log(`Dropped item: ${itemId}`);
    this.showNotification(`Dropped item: ${itemId}`);

    // Remove item from UI
    const itemElement = document.querySelector(
      `.inventory-item[data-item-id="${itemId}"]`
    );
    if (itemElement) {
      itemElement.remove();
    }

    // Reset item details
    const itemDetails = document.querySelector(".item-details");
    itemDetails.querySelector("h3").textContent = "Select an item";
    itemDetails.querySelector(".item-description").textContent =
      "Item details will appear here.";
    itemDetails.querySelector(".use-item-button").disabled = true;
    itemDetails.querySelector(".drop-item-button").disabled = true;
  }

  toggleQuestLog() {
    const questLogPanel = document.getElementById("quest-log-panel");

    if (this.isQuestLogOpen) {
      questLogPanel.classList.add("hidden");
      this.isQuestLogOpen = false;
    } else {
      // Close other panels
      this.closeAllPanels();

      // Update quest log content
      this.updateQuestLog();

      // Show quest log panel
      questLogPanel.classList.remove("hidden");
      this.isQuestLogOpen = true;
    }
  }

  updateQuestLog() {
    const activeQuestsList = document.querySelector(".active-quests");
    const completedQuestsList = document.querySelector(".completed-quests");

    // Clear lists
    activeQuestsList.innerHTML = "";
    completedQuestsList.innerHTML = "";

    // Add active quests
    const activeQuests = this.game.story.getActiveQuests();
    if (activeQuests.length === 0) {
      const listItem = document.createElement("li");
      listItem.textContent = "No active quests.";
      activeQuestsList.appendChild(listItem);
    } else {
      activeQuests.forEach((quest) => {
        const listItem = document.createElement("li");
        listItem.textContent = quest.title;
        listItem.dataset.questId = quest.id;

        listItem.addEventListener("click", () => {
          this.showQuestDetails(quest);
        });

        activeQuestsList.appendChild(listItem);
      });
    }

    // Add completed quests
    const completedQuests = this.game.story.getCompletedQuests();
    if (completedQuests.length === 0) {
      const listItem = document.createElement("li");
      listItem.textContent = "No completed quests.";
      completedQuestsList.appendChild(listItem);
    } else {
      completedQuests.forEach((quest) => {
        const listItem = document.createElement("li");
        listItem.textContent = quest.title;
        listItem.dataset.questId = quest.id;
        listItem.classList.add("completed");

        listItem.addEventListener("click", () => {
          this.showQuestDetails(quest);
        });

        completedQuestsList.appendChild(listItem);
      });
    }
  }

  showQuestDetails(quest) {
    const questDetails = document.querySelector(".quest-details");
    questDetails.querySelector(".quest-title").textContent = quest.title;
    questDetails.querySelector(".quest-description").textContent =
      quest.description;

    // Show objectives
    const objectivesList = questDetails.querySelector(".quest-objectives");
    objectivesList.innerHTML = "";

    quest.objectives.forEach((objective) => {
      const listItem = document.createElement("li");
      listItem.textContent = objective.description;

      if (objective.completed) {
        listItem.classList.add("completed");
        listItem.innerHTML = `✓ ${objective.description}`;
      }

      objectivesList.appendChild(listItem);
    });

    // Show rewards
    const rewardsText = [];
    if (quest.reward) {
      if (quest.reward.experience) {
        rewardsText.push(`${quest.reward.experience} XP`);
      }

      if (quest.reward.items && quest.reward.items.length > 0) {
        rewardsText.push(`Items: ${quest.reward.items.join(", ")}`);
      }
    }

    questDetails.querySelector(".quest-rewards p").textContent =
      rewardsText.length > 0 ? rewardsText.join(", ") : "No rewards";
  }

  toggleMap() {
    const mapPanel = document.getElementById("map-panel");

    if (this.isMapOpen) {
      mapPanel.classList.add("hidden");
      this.isMapOpen = false;
    } else {
      // Close other panels
      this.closeAllPanels();

      // Update map content
      this.updateMap();

      // Show map panel
      mapPanel.classList.remove("hidden");
      this.isMapOpen = true;
    }
  }

  updateMap() {
    // In a real game, we would update the map with discovered locations and quest markers
    // For now, we'll just update the player marker position
    const playerMarker = document.querySelector(".map-player-marker");

    // Position is based on character position in the world
    // For this demo, we'll just place it near the village
    playerMarker.style.left = "55%";
    playerMarker.style.top = "45%";
  }

  closeAllPanels() {
    // Hide all panels
    document.querySelectorAll(".game-panel").forEach((panel) => {
      panel.classList.add("hidden");
    });

    // Reset panel states
    this.isInventoryOpen = false;
    this.isQuestLogOpen = false;
    this.isMapOpen = false;
  }

  showNotification(message) {
    const notificationContainer = document.getElementById(
      "notification-container"
    );

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove("show");

      // Remove from DOM after fade out
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }

  showGameOver() {
    // Create game over screen
    const gameOverScreen = document.createElement("div");
    gameOverScreen.id = "game-over-screen";
    gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <h2>Game Over</h2>
                <p>You have fallen in battle.</p>
                <button id="respawn-button">Respawn</button>
                <button id="main-menu-button">Main Menu</button>
            </div>
        `;

    document.getElementById("game-container").appendChild(gameOverScreen);

    // Add event listeners
    document.getElementById("respawn-button").addEventListener("click", () => {
      this.respawnPlayer();
    });

    document
      .getElementById("main-menu-button")
      .addEventListener("click", () => {
        this.returnToMainMenu();
      });
  }

  respawnPlayer() {
    // Remove game over screen
    document.getElementById("game-over-screen").remove();

    // Reset player
    this.game.character.stats.health = this.game.character.stats.maxHealth;
    this.game.character.state.isDead = false;

    // Move player to a safe location
    this.game.character.model.position.set(0, 0, 0);

    // Resume game
    this.game.resume();
  }

  returnToMainMenu() {
    // Remove game over screen
    document.getElementById("game-over-screen").remove();

    // Reset game state
    this.game.isGameStarted = false;

    // Show main menu
    document.getElementById("game-menu").classList.remove("hidden");
  }
}
