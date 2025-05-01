// Story class - Handles the game's narrative, quests, and dialog system

class Story {
  constructor(game) {
    this.game = game;

    // Dialog system
    this.dialogBox = document.getElementById("dialog-box");
    this.dialogCharacterName = document.querySelector(".character-name");
    this.dialogText = document.querySelector(".dialog-text");
    this.dialogNextButton = document.querySelector(".dialog-next");

    // Current dialog state
    this.currentDialog = null;
    this.currentDialogIndex = 0;

    // Quest system
    this.quests = [];
    this.activeQuests = [];
    this.completedQuests = [];

    // Story state
    this.storyProgress = 0;
    this.hasCompletedIntro = false;

    // Initialize story content
    this.initializeStory();
  }

  initializeStory() {
    // Define the main storyline
    this.mainStory = [
      {
        id: "intro",
        title: "Awakening",
        description:
          "You awaken in a mysterious world with no memory of how you got here.",
        dialogSequences: [
          {
            character: "Inner Voice",
            text: "Where am I? What is this place?",
          },
          {
            character: "Inner Voice",
            text: "I need to find out what happened and how I got here.",
          },
          {
            character: "Inner Voice",
            text: "I should explore this area and see if I can find anyone who might help me.",
          },
        ],
        onComplete: () => {
          this.hasCompletedIntro = true;
          this.storyProgress = 1;
          this.startQuest("find_elder");
        },
      },
      {
        id: "chapter1",
        title: "The Lost Memories",
        description:
          "Discover the truth about your past and why you were brought to this world.",
        prerequisite: () => this.storyProgress >= 1,
        dialogSequences: [],
      },
      {
        id: "chapter2",
        title: "The Ancient Power",
        description:
          "Uncover the ancient power hidden within the world and learn to harness it.",
        prerequisite: () => this.storyProgress >= 2,
        dialogSequences: [],
      },
      {
        id: "chapter3",
        title: "The Gathering Storm",
        description:
          "Face the growing darkness threatening to consume the world.",
        prerequisite: () => this.storyProgress >= 3,
        dialogSequences: [],
      },
      {
        id: "finale",
        title: "The Final Confrontation",
        description:
          "Confront the ultimate evil and determine the fate of this world.",
        prerequisite: () => this.storyProgress >= 4,
        dialogSequences: [],
      },
    ];

    // Define quests
    this.defineQuests();

    // Define NPC dialogs
    this.defineNPCDialogs();
  }

  defineQuests() {
    this.quests = [
      {
        id: "find_elder",
        title: "Find the Village Elder",
        description:
          "Locate the elder of the nearby village to learn more about this world.",
        objectives: [
          {
            id: "reach_village",
            description: "Reach the village in the east",
            completed: false,
          },
          {
            id: "talk_to_elder",
            description: "Speak with the village elder",
            completed: false,
            requires: ["reach_village"],
          },
        ],
        reward: {
          experience: 100,
          items: ["basic_sword"],
        },
        onComplete: () => {
          this.storyProgress = 2;
          this.startQuest("ancient_ruins");
        },
      },
      {
        id: "ancient_ruins",
        title: "The Ancient Ruins",
        description:
          "Explore the ancient ruins to the north and discover their secrets.",
        objectives: [
          {
            id: "find_ruins",
            description: "Locate the ancient ruins",
            completed: false,
          },
          {
            id: "explore_ruins",
            description: "Explore the ruins and find the central chamber",
            completed: false,
            requires: ["find_ruins"],
          },
          {
            id: "retrieve_artifact",
            description: "Retrieve the ancient artifact",
            completed: false,
            requires: ["explore_ruins"],
          },
        ],
        reward: {
          experience: 250,
          items: ["magic_amulet"],
        },
        onComplete: () => {
          this.storyProgress = 3;
        },
      },
    ];
  }

  defineNPCDialogs() {
    this.npcDialogs = {
      NPC_1: [
        {
          text: "Hello, traveler. You seem lost. Are you new to these lands?",
          options: [
            {
              text: "Yes, I just arrived and I'm not sure where I am.",
              next: 1,
            },
            {
              text: "Who are you?",
              next: 2,
            },
          ],
        },
        {
          text: "I thought as much. Many have been appearing lately with no memory of how they got here. You should speak with the Elder in the village to the east.",
          next: 3,
        },
        {
          text: "I'm Elara, a scout for the village. I patrol these woods to keep an eye out for dangers... and lost travelers like yourself.",
          next: 3,
        },
        {
          text: "The village is just beyond those trees to the east. Follow the path and you'll find it. The Elder can help you understand what's happening.",
          onComplete: () => {
            this.completeObjective("find_elder", "reach_village");
          },
        },
      ],
      NPC_2: [
        {
          text: "Hmm, another outsider. The Elder has been expecting you.",
          next: 1,
        },
        {
          text: "I am Thorne, the village guardian. The Elder resides in the large building at the center of our village. He will explain everything.",
          onComplete: () => {
            // Mark objective as complete when dialog ends
            this.completeObjective("find_elder", "talk_to_elder");
          },
        },
      ],
      NPC_3: [
        {
          text: "The ancient ruins? They lie to the north, beyond the misty mountains. Few return from there unchanged.",
          next: 1,
        },
        {
          text: "If you seek the ruins, you'll need to be prepared. The path is treacherous and the ruins themselves are filled with dangers from a forgotten age.",
          next: 2,
        },
        {
          text: "Take this map. It will guide you through the safer paths. May the ancient spirits watch over you.",
          onComplete: () => {
            this.completeObjective("ancient_ruins", "find_ruins");
            this.game.ui.showNotification("Received: Map to the Ancient Ruins");
          },
        },
      ],
      NPC_4: [
        {
          text: "*The old man looks at you with eyes that seem to peer into your soul*",
          next: 1,
        },
        {
          text: "I am the Elder of this village. We have been expecting you, Traveler. The prophecy spoke of your arrival.",
          next: 2,
        },
        {
          text: "This world is in danger. An ancient darkness stirs, and you have been brought here to help us face it. Your lost memories are no accident.",
          next: 3,
        },
        {
          text: "To the north lie ancient ruins that hold the key to your past and our future. Seek the artifact hidden within, and you will begin to understand your purpose here.",
          onComplete: () => {
            this.completeQuest("find_elder");
          },
        },
      ],
    };
  }

  startIntro() {
    // Start the intro sequence
    setTimeout(() => {
      this.startDialog("intro");
    }, 3000);
  }

  startDialog(dialogId) {
    // Check if it's a story dialog or NPC dialog
    if (dialogId === "intro") {
      // Start intro dialog sequence
      this.currentDialog = this.mainStory.find(
        (chapter) => chapter.id === "intro"
      ).dialogSequences;
    } else if (this.npcDialogs[dialogId]) {
      // Start NPC dialog
      this.currentDialog = this.npcDialogs[dialogId];
    } else {
      console.error(`Dialog not found: ${dialogId}`);
      return;
    }

    this.currentDialogIndex = 0;
    this.showDialog();
  }

  showDialog() {
    if (
      !this.currentDialog ||
      this.currentDialogIndex >= this.currentDialog.length
    ) {
      this.endDialog();
      return;
    }

    const dialog = this.currentDialog[this.currentDialogIndex];

    // Show dialog box
    this.dialogBox.classList.remove("hidden");

    // Set character name and text
    if (dialog.character) {
      this.dialogCharacterName.textContent = dialog.character;
      this.dialogText.textContent = dialog.text;
    } else {
      this.dialogCharacterName.textContent = dialog.npc || "Stranger";
      this.dialogText.textContent = dialog.text;
    }

    // Handle dialog options if present
    if (dialog.options) {
      // Clear existing options
      const existingOptions = this.dialogBox.querySelectorAll(".dialog-option");
      existingOptions.forEach((option) => option.remove());

      // Create option buttons
      dialog.options.forEach((option) => {
        const optionButton = document.createElement("button");
        optionButton.classList.add("dialog-option");
        optionButton.textContent = option.text;
        optionButton.addEventListener("click", () => {
          this.currentDialogIndex = option.next;
          this.showDialog();
        });

        this.dialogBox
          .querySelector(".dialog-content")
          .appendChild(optionButton);
      });

      // Hide the next button when showing options
      this.dialogNextButton.style.display = "none";
    } else {
      // Show the next button for regular dialog
      this.dialogNextButton.style.display = "block";
    }
  }

  advanceDialog() {
    const currentDialog = this.currentDialog[this.currentDialogIndex];

    // Check if current dialog has a next index
    if (currentDialog.next !== undefined) {
      this.currentDialogIndex = currentDialog.next;
    } else {
      this.currentDialogIndex++;
    }

    // Check if current dialog has an onComplete callback
    if (currentDialog.onComplete) {
      currentDialog.onComplete();
    }

    // Show next dialog or end
    if (this.currentDialogIndex < this.currentDialog.length) {
      this.showDialog();
    } else {
      this.endDialog();
    }
  }

  endDialog() {
    // Hide dialog box
    this.dialogBox.classList.add("hidden");

    // Clear current dialog
    this.currentDialog = null;
    this.currentDialogIndex = 0;

    // Resume game if it was paused for dialog
    if (this.game.isPaused) {
      this.game.resume();
    }
  }

  startQuest(questId) {
    const quest = this.quests.find((q) => q.id === questId);

    if (!quest) {
      console.error(`Quest not found: ${questId}`);
      return;
    }

    // Check if quest is already active
    if (this.activeQuests.some((q) => q.id === questId)) {
      console.log(`Quest already active: ${questId}`);
      return;
    }

    // Add to active quests
    this.activeQuests.push(quest);

    // Show notification
    this.game.ui.showNotification(`New Quest: ${quest.title}`);

    // Update quest log
    this.game.ui.updateQuestLog();
  }

  completeObjective(questId, objectiveId) {
    const quest = this.activeQuests.find((q) => q.id === questId);

    if (!quest) {
      console.error(`Active quest not found: ${questId}`);
      return;
    }

    const objective = quest.objectives.find((o) => o.id === objectiveId);

    if (!objective) {
      console.error(`Objective not found: ${objectiveId} in quest ${questId}`);
      return;
    }

    // Check if objective has requirements
    if (objective.requires) {
      const allRequirementsMet = objective.requires.every((reqId) => {
        const reqObjective = quest.objectives.find((o) => o.id === reqId);
        return reqObjective && reqObjective.completed;
      });

      if (!allRequirementsMet) {
        console.log(`Requirements not met for objective: ${objectiveId}`);
        return;
      }
    }

    // Mark objective as complete
    objective.completed = true;

    // Show notification
    this.game.ui.showNotification(
      `Objective Completed: ${objective.description}`
    );

    // Check if all objectives are complete
    const allObjectivesComplete = quest.objectives.every((o) => o.completed);

    if (allObjectivesComplete) {
      this.completeQuest(questId);
    } else {
      // Update quest log
      this.game.ui.updateQuestLog();
    }
  }

  completeQuest(questId) {
    const questIndex = this.activeQuests.findIndex((q) => q.id === questId);

    if (questIndex === -1) {
      console.error(`Active quest not found: ${questId}`);
      return;
    }

    const quest = this.activeQuests[questIndex];

    // Remove from active quests
    this.activeQuests.splice(questIndex, 1);

    // Add to completed quests
    this.completedQuests.push(quest);

    // Award rewards
    if (quest.reward) {
      if (quest.reward.experience) {
        this.game.character.gainExperience(quest.reward.experience);
      }

      if (quest.reward.items) {
        // In a real game, we would add items to inventory
        quest.reward.items.forEach((itemId) => {
          console.log(`Awarded item: ${itemId}`);
          this.game.ui.showNotification(`Received: ${itemId}`);
        });
      }
    }

    // Show notification
    this.game.ui.showNotification(`Quest Completed: ${quest.title}`);

    // Call onComplete callback if it exists
    if (quest.onComplete) {
      quest.onComplete();
    }

    // Update quest log
    this.game.ui.updateQuestLog();
  }

  getActiveQuests() {
    return this.activeQuests;
  }

  getCompletedQuests() {
    return this.completedQuests;
  }

  getQuestById(questId) {
    return this.quests.find((q) => q.id === questId);
  }
}
