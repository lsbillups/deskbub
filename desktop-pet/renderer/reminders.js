// ============================================================
// DeskBub — Health Reminder System
// ============================================================

const bubble = document.getElementById('bubble');

let config = {
  sitReminder: 50,    // minutes
  waterReminder: 90,  // minutes
  remindersPaused: false,
};

let sitTimer = 0;    // seconds since last sit reminder
let waterTimer = 0;  // seconds since last water reminder
let bubbleTimeout = null;

const messages = {
  sit: [
    "Hey! You've been sitting for a while. Time to stretch! 🧘",
    "Your legs called — they want a walk. Stand up for a minute? 🚶",
    "Quick stretch break! Your back will thank you later. 🙆",
  ],
  water: [
    "Psst... when was your last glass of water? 💧",
    "Hydration check! Go grab some water. Your skin will glow! ✨",
    "Water break! Even plants need watering. So do you! 🌿",
  ],
  eye: [
    "Look away from the screen for 20 seconds. Your eyes need a break! 👀",
    "Screen break! Blink a few times and focus on something far away. 🖼️",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showBubble(text) {
  bubble.textContent = text;
  bubble.classList.add('visible');

  // Position bubble above pet
  bubble.style.bottom = '210px';
  bubble.style.left = '50%';
  bubble.style.transform = 'translateX(-50%)';

  clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    bubble.classList.remove('visible');
  }, 8000);
}

function checkReminders() {
  if (config.remindersPaused) return;

  sitTimer += 1;
  waterTimer += 1;

  const sitSeconds = config.sitReminder * 60;
  const waterSeconds = config.waterReminder * 60;

  if (sitTimer >= sitSeconds) {
    sitTimer = 0;
    // Also show eye break every other sit reminder
    if (Math.random() > 0.5) {
      showBubble(pickRandom(messages.eye));
    } else {
      showBubble(pickRandom(messages.sit));
    }
  }

  if (waterTimer >= waterSeconds) {
    waterTimer = 0;
    showBubble(pickRandom(messages.water));
  }
}

function init() {
  // Load config
  if (window.deskBub) {
    window.deskBub.getConfig().then((cfg) => {
      config = { ...config, ...cfg };
    });
    window.deskBub.onConfigUpdated((newConfig) => {
      config = { ...config, ...newConfig };
    });
    window.deskBub.onRemindersToggled((enabled) => {
      config.remindersPaused = !enabled;
    });
  }

  // Check every second
  setInterval(checkReminders, 1000);
}

init();
