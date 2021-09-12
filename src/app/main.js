import {
  generateShip,
  integerNumberBetween,
  createNumberGenerator,
  numberBetween,
} from "starshipwright";
import { createSprites, generateSpriteFinalState } from "./voronoi";
import {
  trimCanvas,
  createCanvas,
  obtainImageData,
  fillCircle,
  getContext,
} from "game-utils";
import * as sounds from "./sounds";

function drawImageInGameCanvas(image, x, y) {
  gameCtx.drawImage(image, Math.round(x), Math.round(y));
}

function gameCtxWrap(wrappedFunc) {
  gameCtx.save();
  wrappedFunc();
  gameCtx.restore();
}

function hitEffect(targetCanvas) {
  const [canvas, ctx] = createCanvas(targetCanvas.width, targetCanvas.height);
  const imageData = obtainImageData(targetCanvas);
  const data = imageData.data;
  for (let c = 0; c < data.length; c += 4) {
    const [r, g, b] = data.slice(c, c + 4);
    data.set(
      [
        255 - (0.39 * r + 0.77 * g + 0.19 * b),
        255 - (0.35 * r + 0.69 * g + 0.17 * b),
        255 - (0.27 * r + 0.53 * g + 0.13 * b),
      ],
      c
    );
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function generateThrusters() {
  return [
    generateFlame(5, 0, 4, "#f80", "#f00"),
    generateFlame(4, 0, 4, "#f80", "#f00"),
  ];
}

function generatePlayerBullet(radius, angle) {
  return generateFlame(radius, angle, 6, "#0ff", "#00f");
}

function generateFlame(radius, angle, factor, strokeStyleColor, shadowColor) {
  let [canvas, ctx] = createCanvas(radius * 9, radius * 9);
  ctx.translate(radius * 4, radius * 4);
  ctx.rotate(angle);
  // gold filled rect
  ctx.fillStyle = "#ff0";
  ctx.beginPath();
  ctx.moveTo(radius, radius * factor);
  ctx.lineTo(0, radius);
  ctx.arc(radius, radius, radius, Math.PI, 0);
  ctx.lineTo(radius, radius * factor);
  ctx.fill();

  // shadow
  ctx.strokeStyle = strokeStyleColor; // "#0ff";
  ctx.shadowColor = shadowColor; // "#00f";
  // restrict new draw to cover existing pixels
  ctx.globalCompositeOperation = "source-atop";
  // shadowed stroke
  // "source-atop" clips off the undesired outer shadow
  ctx.shadowBlur = Math.round(radius / 2);
  ctx.lineWidth = radius / 2;
  ctx.beginPath();
  ctx.moveTo(radius, radius * factor);
  ctx.lineTo(0, radius);
  ctx.arc(radius, radius, radius, Math.PI, 0);
  ctx.lineTo(radius, radius * factor);
  ctx.stroke();

  canvas = trimCanvas(canvas);
  return [canvas, obtainImageData(canvas).data];
}

function generateEnemyBulletFrame(size, colorStop) {
  const [canvas, ctx] = createCanvas(2 * size, 2 * size);
  const grd = ctx.createRadialGradient(size, size, 0, size, size, size);
  grd.addColorStop(colorStop, "#ff0");
  grd.addColorStop(1, "#f00");
  ctx.fillStyle = grd;
  fillCircle(ctx, size, size, size);

  return canvas;
}

function generateEnemyBullet(size) {
  let frames = [];
  for (let c = 9; c--; ) {
    frames.unshift(generateEnemyBulletFrame(size, c / 10));
    frames.push(generateEnemyBulletFrame(size, c / 10));
  }
  return [frames, obtainImageData(frames[0]).data];
}

function flipCanvas(targetCanvas) {
  const [canvas, ctx] = createCanvas(targetCanvas.width, targetCanvas.height);
  ctx.scale(1, -1);
  ctx.drawImage(targetCanvas, 0, 0, targetCanvas.width, -targetCanvas.height);
  return canvas;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 700;
const HALF_CANVAS_WIDTH = Math.floor(CANVAS_WIDTH / 2);
const HALF_CANVAS_HEIGHT = Math.floor(CANVAS_HEIGHT / 2);
const SHIP_SPEED = 0.6;
const STARS_WIDTH = 540;
const STAR_COLORS = ["#9af", "#abf", "#ccf", "#fef", "#fee", "#fc9", "#fc6"];
const ENEMY_EXPLOSION_DURATION = 500;
const BOSS_EXPLOSION_DURATION = 500;
const PLAYER_EXPLOSION_DURATION = 1500;
const BULLET_SPEED = 5 / 8;
const SMALL_BULLET_POWER = 10;
const LARGE_BULLET_POWER = 20;
const GAME_OVER_DURATION = 3500;
const GAME_INTRO_DURATION = 2500;
const COIN_SLOWDOWN_SPEED = 3;
const COIN_CREEPING_SPEED = 0.1;
const SHIP_INITIAL_BOTTOM_MARGIN = 20;
const BULLET_LEFT = 0;
const BULLET_STRAIGHT = 1;
const BULLET_RIGHT = 2;
const BASE_MAGNET_SPEED = 0.2;
const ADDITIONAL_MAGNET_SPEED = 0.1;

const gameCanvas = g;
const gameCtx = getContext(gameCanvas);

const BOMB_DURATION = 1000;
const shields = [];

// Keep refs and names in sync
const UPGRADE_GUN = 0;
const UPGRADE_SIDE = 1;
const UPGRADE_SHIELD = 2;
const UPGRADE_BOMBS = 3;
const UPGRADE_MAGNET = 4;
const UPGRADE_NAMES = ["Main Gun", "Side Cannon", "Shield", "Bombs", "Magnet"];
const MAX_UPGRADE = 4;

const LEVEL_ENDGAME = 4;
const LEVEL_SURVIVAL = 5;
const TOTAL_LEVELS = 6;

const LEVEL_NAMES = [
  "Andromeda",
  "Borealis",
  "Cygnus",
  "Draco",
  "Endgame",
  "Survival",
];

let enemyBlueprints;

const thrusters = generateThrusters();

const smallBullet = [
  generatePlayerBullet(5, -0.245),
  generatePlayerBullet(5, 0),
  generatePlayerBullet(5, 0.245),
];
const largeBullet = [
  generatePlayerBullet(8, -0.245),
  generatePlayerBullet(8, 0),
  generatePlayerBullet(8, 0.245),
];
const enemyBullets = [
  generateEnemyBullet(4),
  generateEnemyBullet(7),
  generateEnemyBullet(10),
  generateEnemyBullet(14),
];
const ENEMY_BULLET_S = 0;
const ENEMY_BULLET_M = 1;
const ENEMY_BULLET_L = 2;
const ENEMY_BULLET_XL = 3;
const STATE_MENU = 0;
const STATE_CUTSCENE = 1;
const STATE_LOADING = 2;
const STATE_INTRO = 3;
const STATE_GAME = 4;
const settings = JSON.parse(localStorage["Galaxy Raid"] || 0) || {
  l: 0, // Levels open
  s: 0, // Stars
  u: UPGRADE_NAMES.map(() => 0), // Upgrades
  // c: 0, // Ship color
  // f: 0, // Supporter free coins
  // h: false, // Played initial intro cutscene
};

let ship;
let destroyedShipSprites;

function generatePlayerShip() {
  ship = trimCanvas(generateShip(settings.c || 1301, 5, 114, 40));
  destroyedShipSprites = createSprites(ship);
}

generatePlayerShip();

const shipWidth = ship.width;
const shipHeight = ship.height;
const halfShipWidth = Math.floor(shipWidth / 2);
const halfShipHeight = Math.floor(shipHeight / 2);
const shipMask = obtainImageData(ship).data;

let touchPreviousX,
  touchPreviousY,
  didMultiTouch,
  currentTouchIdentifier,
  moveX,
  moveY,
  shipX,
  shipY,
  keysPressed = [],
  mousePressed;

let currentLevel;
let currentSurvivalLoaded;

let shipHitBox;
let shipDestroyed;
let shipVictory;
let gameOverTime;
let hasHighscore;
let bombEffect;
let shieldLevel;
let availableBombs;
let inhibitEnter;
let bulletRoundCount;
let lastBullet;
let showCutscene = 0;

let initialTime = performance.now();
let difficulty;
let score;
// Undefined is falsish, like 0
let state;
let hudElements;

const AXIS_THRESHOLD = 0.8;
let introInhibitDown;
let introInhibitUp;

// Cutscene
const CUTSCENE_TIME_PER_CHAR = 20;
const CUTSCENES_ACTORS = [
  "Captain",
  "Commander",
  "Pirate",
  "Galagan",
  "General",
  "President",
];
const CUTSCENES = [
  [
    //Intro
    [
      0,
      "Listen up! As everyone should",
      "be aware of by now, we are",
      "answering a distress call from",
      "the Tigris ship.",
    ],
    [
      1,
      "This is a Federation rescue ship,",
      "which means that you respond to",
      "my orders, and I, in turn, take",
      "orders from the Captain.",
    ],
    [
      0,
      "Precisely. You're to do exactly",
      "as we say, exactly how we say it.",
      "Lives are at stake, lives of",
      "fellow officers.",
    ],
    [
      1,
      "Remember, the war is over, but",
      "the Space is full of dangers.",
      "Is all of this clear?",
      "Good, let's start.",
    ],
  ],
  [
    // After andromeda
    [
      1,
      "Sir, we are approaching the",
      "distress call location.",
      "I've contacted the attackers;",
      "opening a channel.",
    ],
    [0, "What are you doing here?", "Where is the Federation ship!?"],
    [
      2,
      "We detected the distress call,",
      "and a stranded ship was too",
      "good to pass up.",
    ],
    [
      2,
      "When we arrived there was",
      "nothing but faint traces of",
      "warp engines heading to the",
      "Borealis sector.",
    ],
    [
      0,
      "The Federation will not tolerate",
      "pirates; if you attack another",
      "ship, I'll personally lock you in",
      "a prison and throw the key!",
    ],
  ],
  [
    // After Borealis
    [
      0,
      "Galagan ships, cease fire!",
      "We're in a rescue mission, and",
      "the last thing we want is to",
      "start another war. Do you copy?",
    ],
    [3, "If you didn't want war,", "then you shouldn't have", "attacked us!"],
    [
      0,
      "You attacked us as soon as",
      "we arrived without even a",
      "warning!",
      "What's going on?",
    ],
    [
      3,
      "A Federation fleet warped in",
      "and captured several of our",
      "ships before we could even react.",
      "It won't go unpunished!",
    ],
    [
      0,
      "They stole our ships and used",
      "them as a distraction. We will",
      "chase them and bring them down",
      "to prove our good faith.",
    ],
    [
      3,
      "Perhaps. We will see.",
      "We lost track of them, but",
      "they were heading",
      "to the Cygnus sector.",
    ],
  ],
  [
    // After Cygnus
    [
      1,
      "The rogue fleet just keeps",
      "raiding everything in their",
      "path, and we get blamed",
      "for it!",
    ],
    [
      0,
      "We will need all the help",
      "we can get to defeat them.",
      "Call the General.",
    ],
    [
      4,
      "Captain... it's been a while.",
      "We haven't talked since the",
      "war ended.",
    ],
    [
      0,
      "Things have been quiet.",
      "Until now. Someone is attacking",
      "our allies and trying to pin it",
      "on the Federation!!",
    ],
    [
      4,
      "I see. Playing hero, as usual.",
      "The Federation leadership is",
      "already on it; let the grown ups",
      "solve the real problems.",
    ],
    [
      4,
      "Play time is over.",
      "Return to Earth now, or you",
      "will face a court martial.",
      "-End of communication-",
    ],
    [
      0,
      "This is wrong.",
      "If we don't act now, nobody",
      "will be able to stop the war.",
    ],
    [1, "What are your orders, Captain?"],
    [
      0,
      "Maintain course, we'll engage",
      "the rogue fleet.",
      "I'll take full responsibility.",
    ],
  ],
  [
    // After draco
    [
      1,
      "Captain, we finally caught up",
      "with the rogue fleet.",
      "They're hailing us!",
    ],
    [0, "On screen."],
    [4, "You should have followed my", "orders, Captain."],
    [0, "What are you doing General!?", "Make the ships stand down.", "Now!"],
    [
      4,
      "The Federation has become weak",
      "and complacent. When we were",
      "about to win the war, those",
      "politicians decided to just stop it.",
    ],
    [0, "So that's what these ships", "are for?", "You're going to take over?"],
    [
      4,
      "We'll finish what we started",
      "and bring a new order to the",
      "galaxy, a new empire.",
      "Nobody can stop us!",
    ],
    [0, "We can, and we will.", "Battle stations!"],
  ],
  [
    // After endgame
    [1, "Call incoming; it's...", "the President of the Federation!"],
    [0, "On screen."],
    [
      5,
      "Words cannot express enough",
      "gratitude for what you did",
      "out there, Captain.",
    ],
    [
      5,
      "You stood for what is right,",
      "and prevented a war that would",
      "have killed millions.",
    ],
    [0, "We did nothing more than", "our duty, sir."],
    [
      5,
      "I need a person of principle",
      "such as yourself to stand by",
      "my side as my new General",
      "in Earth. Will you accept?",
    ],
    [
      0,
      "Thank you for the offer, sir,",
      "but my place is here, in Space,",
      "with my crew... This is where",
      "my heart is, and where I belong.",
    ],
  ],
];
let cutsceneLine;
let cutsceneChar;

const mainMenuOption = ["\u21e6 Main Menu", showMainMenu];

const TOTAL_SHIELDS = 5;

const UPGRADE_COST = [10, 50, 100, 500];

const getUpgradesHUD = () => [
  ...UPGRADE_NAMES.map((name, index) => [
    name +
      (settings.u[index]
        ? " (" + (settings.u[index] - 1 ? settings.u[index] : "") + "\u2b50)"
        : ""),
    () => showUpgradeHUD(name, index),
  ]),
  [
    "Refund All Upgrades",
    settings.u.some((upgrade) => !!upgrade)
      ? () => {
          settings.u = settings.u.map((upgradeAmount) => {
            for (let i = 0; i < upgradeAmount; i++) {
              updateStars(UPGRADE_COST[i]);
            }
            return 0;
          });
          setHUD("Upgrades", getUpgradesHUD(), 0);
        }
      : 0,
  ],
  mainMenuOption,
];

function showUpgradeHUD(name, index) {
  const cost = UPGRADE_COST[settings.u[index]];
  let options = [];
  if (!index || settings.u[index]) {
    options.push(
      "Quality: " +
        (settings.u[index] ? "\u2b50".repeat(settings.u[index]) : "Standard")
    );
  } else {
    options.push("Not Acquired");
  }
  if (settings.u[index] < MAX_UPGRADE) {
    options.push([
      (!index || settings.u[index] ? "Upgrade" : "Buy") +
        ": " +
        cost.toLocaleString() +
        " \u267a",
      cost <= settings.s &&
        (() => {
          settings.u[index]++;
          updateStars(-cost);
          showUpgradeHUD(name, index);
        }),
    ]);
  }
  options.push([
    "\u21e6 Back",
    () => setHUD("Upgrades", getUpgradesHUD(), index),
  ]);
  setHUD(name, options);
}

function showMainMenu() {
  const mainMenuOptions = [
    ["Play", showLevelSelectMenu],
    ["Upgrades", () => setHUD("Upgrades", getUpgradesHUD())],
    [
      "Top Scores",
      settings[0] ? () => setHUD("Top Scores", getTopScoresHUD()) : 0,
    ],
    ["Cutscenes", () => setHUD("Cutscenes", getCutscenesHUD())],
    [
      "Supporter Options",
      () => setHUD("Supporter Options", getSupporterOptionsHUD()),
    ],
  ];
  if (process.env.DEBUG) {
    // Add debug buttons
    mainMenuOptions.push([
      "\u26a0 Reset All",
      () => {
        localStorage.removeItem("Galaxy Raid");
        location.reload();
      },
    ]);
    mainMenuOptions.push([
      "\u26a0 +1M coins",
      () => {
        settings.s += 1000000;
        updateSettings();
        location.reload();
      },
    ]);
  }
  setHUD("Galaxy Raid", mainMenuOptions, 0, true);
}

if (settings.h) {
  showMainMenu();
} else {
  settings.h = true;
  updateSettings();
  playCutscene(showMainMenu);
}

function showLevelSelectMenu() {
  const options = [];
  for (let c = 0; c < TOTAL_LEVELS; c++) {
    const level = c;
    options.push(
      c <= settings.l
        ? [LEVEL_NAMES[level], () => newGame(level)]
        : ["\u{1f512} " + LEVEL_NAMES[level]]
    );
  }
  options.push(mainMenuOption);
  setHUD("Select Mission", options, settings.l);
}

function getTopScoresHUD() {
  const scores = [];
  for (let c = 0; settings[c]; c++) {
    scores.push(
      "\u{1f3c6} " +
        LEVEL_NAMES[c] +
        ": " +
        settings[c].toLocaleString() +
        " points"
    );
  }
  scores.push(mainMenuOption);
  return scores;
}

function playCutscene(nextScreen) {
  // TODO
  difficulty = cutsceneChar = 0;
  cutsceneLine = 1;
  lastBullet = performance.now();
  state = STATE_CUTSCENE;
  function goBack() {
    state = STATE_MENU;
    if (nextScreen) {
      nextScreen();
    } else {
      setHUD("Cutscenes", getCutscenesHUD(), showCutscene);
    }
  }

  function showCutsceneScreen() {
    const hudParts = [
      "\u00a0",
      "\u00a0",
      "\u00a0",
      "\u00a0",
      [
        "Next",
        () => {
          difficulty++;
          cutsceneChar = 0;
          cutsceneLine = 1;
          lastBullet = performance.now();
          if (difficulty - CUTSCENES[showCutscene].length) {
            showCutsceneScreen();
          } else {
            goBack();
          }
        },
      ],
    ];
    if (difficulty < CUTSCENES[showCutscene].length - 1) {
      hudParts.push(["Skip", goBack]);
    }

    setHUD(CUTSCENES_ACTORS[CUTSCENES[showCutscene][difficulty][0]], hudParts);
  }

  showCutsceneScreen();
}

function getCutscenesHUD() {
  const scenes = [
    [
      "Intro",
      () => {
        showCutscene = 0;
        playCutscene();
      },
    ],
  ];
  for (let c = 0; c < LEVEL_SURVIVAL; c++) {
    const level = c;
    scenes.push(
      c < settings.l
        ? [
            LEVEL_NAMES[level],
            () => {
              showCutscene = level + 1;
              playCutscene();
            },
          ]
        : ["\u{1f512} " + LEVEL_NAMES[level]]
    );
  }
  scenes.push(mainMenuOption);
  return scenes;
}

function getSupporterOptionsHUD() {
  const options = [];
  const monetized =
    process.env.DEBUG || document.monetization?.state == "started";
  if (!monetized) {
    options.push("Coil not detected");
  }
  options.push(
    [
      "Ship Color",
      monetized && (() => setHUD("Ship Color", getShipColorHUD())),
    ],
    [
      "Claim " + (1000).toLocaleString() + " \u267a",
      monetized &&
        !settings.f &&
        (() => {
          updateStars(1000);
          settings.f = true;
          updateSettings();
          setHUD("Supporter Options", getSupporterOptionsHUD());
        }),
    ],
    [
      "Unlock All Missions",
      monetized &&
        settings.l - LEVEL_SURVIVAL &&
        (() => {
          settings.l = LEVEL_SURVIVAL;
          updateSettings();
          setHUD("Supporter Options", getSupporterOptionsHUD());
        }),
    ],
    mainMenuOption
  );
  return options;
}

function getShipColorHUD() {
  const options = [
    ship,
    [
      "Randomize",
      () => {
        settings.c = integerNumberBetween(Math.random(), 0, 1e9);
        updateSettings();
        generatePlayerShip();
        setHUD("Ship Color", getShipColorHUD());
      },
    ],
    [
      "\u21e6 Back",
      () => setHUD("Supporter Options", getSupporterOptionsHUD()),
    ],
  ];
  return options;
}

function showGameOverMenu() {
  const options = [];
  options.push("You got " + score.toLocaleString() + " points");
  if (hasHighscore) {
    options.push("New Top Score!");
  }
  options.push(
    shipVictory
      ? [
          "Next, " + LEVEL_NAMES[currentLevel + 1],
          () => newGame(currentLevel + 1),
        ]
      : ["Try Again", () => newGame(currentLevel)],
    ["Upgrades", () => setHUD("Upgrades", getUpgradesHUD())],
    mainMenuOption
  );
  setHUD(
    currentLevel - LEVEL_SURVIVAL
      ? shipVictory
        ? "Victory"
        : "Defeat"
      : "Well Done",
    options
  );
}

function setHUD(title, buttons, selectedIndex = 0, bigTitle) {
  t.style.transition = "";
  t.className = bigTitle ? "b" : "";
  t.innerHTML = title;
  c.innerHTML = "";
  let selectedButton;
  let newElement;
  hudElements = [];
  buttons &&
    buttons.map((button, buttonIndex) => {
      if (button.map) {
        newElement = document.createElement("button");
        newElement.innerHTML = button[0];
        if (button[1]) {
          newElement.onpointerdown = (e) => {
            e?.preventDefault();
            button[1]();
          };
        } else {
          newElement.className = "d";
        }
      } else if (button.width) {
        newElement = document.createElement("div");
        newElement.appendChild(button);
      } else {
        newElement = document.createElement("p");
        if (state == STATE_CUTSCENE) {
          newElement.style.textAlign = "left";
        }
        newElement.innerHTML = button;
      }
      c.appendChild(newElement);
      hudElements.push(newElement);
      if (
        button.map &&
        !selectedButton &&
        selectedIndex <= buttonIndex &&
        newElement.className != "d"
      ) {
        // "none" is truish, and we save a little
        selectedButton = newElement.style.transition = "none";
        newElement.focus();
        newElement.offsetHeight;
        newElement.style.transition = "";
      }
    });
}

function updateStars(amount) {
  settings.s += amount;
  updateSettings();
  s.innerHTML = "\u267a: " + settings.s.toLocaleString();
}

updateStars(0);

function setTransformScale() {
  document.documentElement.style.setProperty(
    "--s",
    Math.min(innerWidth / CANVAS_WIDTH, innerHeight / CANVAS_HEIGHT)
  );
}

// Assign and run
(self.onorientationchange = self.onresize = setTransformScale)();

// Generate shields
for (let c = 0; c < TOTAL_SHIELDS + 5; c++) {
  const [shieldPhase, shieldPhaseCtx] = createCanvas(
    shipWidth + (TOTAL_SHIELDS + 5) * 2,
    shipHeight + (TOTAL_SHIELDS + 5) * 2
  );
  const displacement = c ? 0 : TOTAL_SHIELDS + 5;

  for (let offsetY = -1; offsetY < 2; offsetY++) {
    for (let offsetX = -1; offsetX < 2; offsetX++) {
      shieldPhaseCtx.drawImage(
        shields[0] || ship,
        offsetX + displacement,
        displacement + offsetY
      );
    }
  }
  shieldPhaseCtx.globalCompositeOperation = "source-in";
  // Solid cyan
  shieldPhaseCtx.fillStyle = c > 5 ? "#0ff" : "#00f";
  shieldPhaseCtx.fillRect(0, 0, 1e9, 1e9);
  shieldPhaseCtx.globalCompositeOperation = "source-over";
  if (c) {
    shieldPhaseCtx.drawImage(shields[0], 0, 0);
  }
  shields.unshift(shieldPhase);
}
// Remove original ship from processing
shields.map((phase) => {
  const phaseCtx = getContext(phase);
  phaseCtx.globalCompositeOperation = "destination-out";
  phaseCtx.globalAlpha = 0.2;
  for (let c = TOTAL_SHIELDS; c < TOTAL_SHIELDS + 4; c++) {
    phaseCtx.drawImage(shields[c], 0, 0);
  }
});
shields.length = TOTAL_SHIELDS;
// End of generate shields

// It's important for this function not to return any truish value
function addScore(points) {
  score += points;
  p.innerHTML = score.toLocaleString();
  // Update top scores if needed
  if (!settings[currentLevel] || score > settings[currentLevel]) {
    settings[currentLevel] = score;
    updateSettings();
    hasHighscore = true;
  }
  i.innerHTML = "TOP: " + settings[currentLevel].toLocaleString();
}

function updateBombs() {
  b.innerHTML = "\u{1f4a5} ".repeat(availableBombs);
}

function launchBomb(time) {
  if (availableBombs && bombEffect < time) {
    availableBombs--;
    updateBombs();
    sounds.explosion(1.5);
    bombEffect = time + BOMB_DURATION;
    nextEnemy += 1500;
    nextDifficulty += 1500;
  }
}

function updateNextEnemy() {
  nextEnemy +=
    Math.max(0, 1000 - difficulty * 50) + Math.round(enemyRandomizer() * 400);
}

function updateSettings() {
  localStorage["Galaxy Raid"] = JSON.stringify(settings);
}

let bossShips;
let bossHits;
let destroyedBossSprites;
const bossShipParams = [
  // Andromeda
  [34, 145, 300],
  // Borealis
  [141, 50, 200],
  // Cygnus
  [1905, 111, 220],
  // Draco
  [2514, 491, 220],
  // Endgame phase 1
  [2066, 334, 300],
  // Endgame phase 2
  [269, 101, 250],
];

const LEVEL_COLORS = [12, 255, 552, 589, 308, 8];

const enemyRandomizers = [
  // Andromeda
  1,
  // Borealis
  2000, // Temporary
  // Cygnus
  3000, // temporary
  // Draco
  4000, // temporary
  // Endgame
  0, // no enemies
  // Survival
  6000, // temporary
];
// Format: shipSeed, layoutSeed, colorSeed, shipSize, extraShips(amount, delay), health, speed, triggerDelay, triggerFunc, stopAt, deathBullets(size, amount, speed array), homingAngle
const enemyDefinitions = [
  // Andromeda
  [
    [34, 213, 0, 15, 0.35], // Just passing by
    [
      34,
      9,
      80,
      30,
      0.35,
      1000,
      (aimedBullet) => aimedBullet(ENEMY_BULLET_S, 0.3),
    ], // Just passing by and fire one shot
    [
      34,
      18,
      100,
      50,
      0.25,
      1000,
      (aimedBullet, circleBullet, totalBullets) => {
        aimedBullet(ENEMY_BULLET_S, 0.3);
        return totalBullets % 3 ? 250 : 1000;
      },
      150,
    ], // Turret style, 3 quick fire
    [34, 73, 310, 100, 0.15, 0, 0, 0, [ENEMY_BULLET_M, 8, 0.45]], // Slow big ship that throws bullets on death
  ],
  // Borealis
  [
    [
      20,
      18,
      40,
      30,
      0.35,
      700,
      (aimedBullet) => aimedBullet(ENEMY_BULLET_S, 0.3),
    ], // Just passing by and fire one shot
    [
      20,
      91,
      80,
      60,
      0.3,
      550,
      (aimedBullet, circleBullet, totalBullets) => {
        circleBullet(ENEMY_BULLET_S, 8, Math.PI / 8, 0.3);
        if (totalBullets < 3) {
          return 200;
        }
      },
    ], // Just passing by, larger and 3 circle shots at different angles
    [
      20,
      9,
      120,
      140,
      0.15,
      800,
      (aimedBullet, circleBullet, totalBullets) => {
        const sequence = totalBullets % 3;
        aimedBullet(ENEMY_BULLET_M, 0.3);
        return sequence ? 250 : 1000;
      },
    ], // Just passing by, even larger and 3 aimed shots
    [109, 203, 40, 80, 0.55, 0, 0, 0, 0, 0.002], // Homing
  ],
  // Cygnus
  [
    [51, 91, 120, 120, 0.15, 0, 0, 0, [ENEMY_BULLET_M, 11, 0.45]], // Slow big ship
    [
      51,
      9,
      60,
      30,
      0.4,
      800,
      (aimedBullet) => aimedBullet(ENEMY_BULLET_S, 0.3),
      0,
      0,
      0,
      1,
    ], // Wave, just passing by and fire one shot
    [
      51,
      156,
      100,
      120,
      0.35,
      800,
      (aimedBullet, circleBullet, totalBullets) => {
        const sequence = totalBullets % 4;
        aimedBullet(ENEMY_BULLET_M, 0.3 + 0.05 * ((totalBullets - 1) % 4));
        return sequence ? 50 : 800;
      },
    ], // Bigger, just passing by and firing 3 medium shots
    [
      51,
      11,
      100,
      80,
      0.35,
      800,
      (aimedBullet, circleBullet, totalBullets) => {
        const sequence = totalBullets % 4;
        if (sequence) {
          aimedBullet(ENEMY_BULLET_S, 0.3);
        } else {
          circleBullet(ENEMY_BULLET_S, 8, 0, 0.3);
        }
        return sequence ? 250 : 1000;
      },
      150,
    ], // Turret style, 3 quick fire, 1 circular
  ],
  // Draco
  [
    [
      89,
      218,
      60,
      40,
      0.4,
      600,
      (aimedBullet, circleBullet, totalBullets) => {
        aimedBullet(ENEMY_BULLET_S, 0.3, 1, Math.PI / 24);
        if (totalBullets < 3) {
          return 200;
        }
      },
    ], // Passing by, firing a lot
    [
      89,
      50,
      100,
      120,
      0.4,
      800,
      (aimedBullet, circleBullet, totalBullets) => {
        const sequence = totalBullets % 10;
        if (sequence < 4) {
          aimedBullet(ENEMY_BULLET_L, 0.4);
        } else {
          circleBullet(ENEMY_BULLET_S, 5, (sequence * Math.PI) / 12, 0.3);
        }
        if (sequence < 3) {
          return 200;
        } else if (sequence == 3) {
          return 500;
        } else if (sequence < 9) {
          return 100;
        }
        return 800;
      },
      150, // Turret style with bullet storm
    ],
    [1492, 43, 40, 40, 0.55, 0, 0, 0, 0, 0.002, 1], // Homing wave
    [
      320,
      397,
      120,
      200,
      0.15,
      1400,
      (aimedBullet, circleBullet, totalBullets) => {
        circleBullet(
          ENEMY_BULLET_S,
          12,
          totalBullets % 2 ? 0 : Math.PI / 12,
          0.3 + totalBullets * 0.1
        );
        if (totalBullets < 4) {
          return 100;
        }
      },
    ], // Slow big ship
  ],
  // Endgame
  [],
  // Survival
  [],
];

const BOSS_COMING = 0;
const BOSS_FIGHT = 1;
const DIRECTION_NONE = 0;
const DIRECTION_RIGHT = 1;
const DIRECTION_LEFT = 2;
const DIRECTION_UP = 1;
const DIRECTION_DOWN = 2;

const BOSS_HEALTH = [
  // Andromeda
  800,
  // Borealis
  2000,
  // Cygnus
  2000,
  // Draco
  3000,
  // Endgame
  4000,
];

const BOSS_SPEED = 0.1;

const EXPLOSION_COLORS = ["#710", "#a21", "#d42", "#e93", "#fa5"];

let entities;
let hitables;

let enemyRandomizer;
let nextEnemy;
let nextDifficulty;
let bossTime;

let lastTime;

function generateBoss() {
  const currentBossParams = [
    ...bossShipParams[
      currentLevel == LEVEL_ENDGAME ? bossShips.length : currentLevel
    ],
  ];
  const newBossShip = flipCanvas(
    trimCanvas(generateShip(LEVEL_COLORS[currentLevel], ...currentBossParams))
  );
  bossShips.push(newBossShip);
  bossHits.push(hitEffect(newBossShip));
  destroyedBossSprites.push(createSprites(newBossShip));
}

function generateEnemy([shipSeed, layoutSeed, shipSize, ...more]) {
  const enemyShip = trimCanvas(
    flipCanvas(
      generateShip(LEVEL_COLORS[currentLevel], shipSeed, layoutSeed, shipSize)
    )
  );
  return [
    enemyShip,
    obtainImageData(enemyShip).data,
    hitEffect(enemyShip),
    createSprites(enemyShip),
    ...more,
  ];
}

function render(now) {
  // Reset canvas
  gameCtx.fillStyle = "#002";
  gameCtx.fillRect(0, 0, 1e9, 1e9);

  if (state > STATE_LOADING) {
    // STATE_INTRO or STATE_GAME
    gameRender(now);
  } else {
    // STATE_MENU or STATE_LOADING
    introRender(now);
  }
  // Any key press detection should have been consumed now
  requestAnimationFrame(render);
}

function newGame(level) {
  // Set loading screen
  setHUD("Please wait\u2026");
  state = STATE_LOADING;
  enemyBlueprints = [];
  bossShips = [];
  bossHits = [];
  destroyedBossSprites = [];
  currentLevel = level;
  currentSurvivalLoaded = currentLevel - LEVEL_SURVIVAL ? level : 0;
}

function newGameStart() {
  transitionText("Good Luck");
  state = STATE_INTRO;
  enemyRandomizer = createNumberGenerator(enemyRandomizers[currentLevel]);
  nextEnemy = GAME_INTRO_DURATION + 1000;
  nextDifficulty = GAME_INTRO_DURATION + 5000;
  entities = [];
  hitables = [];
  lastTime = initialTime = performance.now();
  availableBombs = settings.u[UPGRADE_BOMBS];
  // In endgame, we are always in bosstime
  bossTime = currentLevel == LEVEL_ENDGAME;
  addScore(
    (shipDestroyed =
      shipVictory =
      lastBullet =
      bombEffect =
      score =
      gameOverTime =
      bulletRoundCount =
      hasHighscore =
      showCutscene =
        0)
  );
  updateBombs();
  moveX = shipX = HALF_CANVAS_WIDTH;
  shipY = CANVAS_HEIGHT + halfShipHeight;
  shieldLevel = settings.u[UPGRADE_SHIELD];
  difficulty = currentLevel - LEVEL_SURVIVAL ? 0 : 3;
}

function moveSelection(delta) {
  const buttons = [...c.children];
  let buttonIndex = buttons.indexOf(document.activeElement);
  do {
    buttonIndex += delta;
    if (!buttons[buttonIndex]) {
      buttonIndex = delta > 0 ? 0 : buttons.length - 1;
    }
  } while (buttons[buttonIndex].className == "d");
  buttons[buttonIndex].focus();
}

function introRender(now) {
  // Intro starfield
  for (let c = 100; c--; ) {
    gameCtx.fillStyle = STAR_COLORS[c % STAR_COLORS.length];
    const r = 100 / (4 - ((now / 1000 + c / 13) % 4));
    fillCircle(
      gameCtx,
      Math.cos(c) * r + HALF_CANVAS_WIDTH,
      Math.sin(c * c) * r + HALF_CANVAS_HEIGHT,
      r / 100
    );
  }

  const axisY = gamepadAxisValue(1);

  // Move cursor if needed
  // Up
  if (
    keysPressed[38] ||
    keysPressed[87] ||
    keysPressed[90] ||
    isGamepadButtonPressed(12) ||
    axisY < -AXIS_THRESHOLD
  ) {
    if (!introInhibitUp) {
      // Select previous
      moveSelection(-1);
      introInhibitUp = true;
    }
  } else {
    introInhibitUp = false;
  }
  // Down
  if (
    keysPressed[40] ||
    keysPressed[83] ||
    isGamepadButtonPressed(13) ||
    axisY > AXIS_THRESHOLD
  ) {
    if (!introInhibitDown) {
      // Select previous
      moveSelection(1);
      introInhibitDown = true;
    }
  } else {
    introInhibitDown = false;
  }
  // Enter
  if (
    keysPressed[13] ||
    keysPressed[32] ||
    isGamepadButtonPressed(0) ||
    isGamepadButtonPressed(1) ||
    isGamepadButtonPressed(2) ||
    isGamepadButtonPressed(3) ||
    isGamepadButtonPressed(9)
  ) {
    if (!inhibitEnter) {
      // Execute action
      document.activeElement.onpointerdown();
      inhibitEnter = true;
    }
  } else {
    inhibitEnter = false;
  }

  if (state == STATE_LOADING) {
    // Generate assets
    if (
      currentLevel - LEVEL_SURVIVAL &&
      (!bossShips.length ||
        (currentLevel == LEVEL_ENDGAME &&
          bossShips.length - bossShipParams.length))
    ) {
      generateBoss();
    } else if (
      currentSurvivalLoaded == currentLevel ||
      (currentLevel == LEVEL_SURVIVAL &&
        currentSurvivalLoaded < enemyDefinitions.length)
    ) {
      // We're loading ALL enemies!
      enemyBlueprints.push(
        ...enemyDefinitions[currentSurvivalLoaded++].map((def) =>
          generateEnemy(def)
        )
      );
    } else {
      newGameStart();
    }
  } else if (state) {
    // STATE_CUTSCENE
    for (
      ;
      now > lastBullet &&
      cutsceneLine < CUTSCENES[showCutscene][difficulty].length;

    ) {
      const revealChar =
        CUTSCENES[showCutscene][difficulty][cutsceneLine][cutsceneChar++];
      const newReveal = document.createElement("span");
      newReveal.className = "q";
      newReveal.innerHTML = revealChar;
      hudElements[cutsceneLine - 1].appendChild(newReveal);
      newReveal.offsetHeight;
      newReveal.style.top = 0;
      newReveal.style.opacity = 1;
      if (
        cutsceneChar >= CUTSCENES[showCutscene][difficulty][cutsceneLine].length
      ) {
        cutsceneLine++;
        cutsceneChar = 0;
      }
      lastBullet +=
        revealChar == "." || revealChar == "?" ? 500 : CUTSCENE_TIME_PER_CHAR;
    }
  }
}

function collide(o1, o2) {
  const o1Left = Math.round(o1[0] - o1[2] / 2);
  const o1Top = Math.round(o1[1] - o1[3] / 2);
  const o2Left = Math.round(o2[0] - o2[2] / 2);
  const o2Top = Math.round(o2[1] - o2[3] / 2);
  // Do bounding boxes collide
  if (
    o1Left < o2Left + o2[2] &&
    o1Left + o1[2] > o2Left &&
    o1Top < o2Top + o2[3] &&
    o1Top + o1[3] > o2Top
  ) {
    // Create the collision bounding box
    const collisionEndX = Math.min(o1Left + o1[2], o2Left + o2[2]);
    const collisionEndY = Math.min(o1Top + o1[3], o2Top + o2[3]);
    const [o1StartX, o2StartX, collisionWidth] =
      o1Left > o2Left
        ? [0, o1Left - o2Left, collisionEndX - o1Left]
        : [o2Left - o1Left, 0, collisionEndX - o2Left];
    const [o1StartY, o2StartY, collisionHeight] =
      o1Top > o2Top
        ? [0, o1Top - o2Top, collisionEndY - o1Top]
        : [o2Top - o1Top, 0, collisionEndY - o2Top];
    for (let c = 0; c < collisionHeight; c++) {
      for (let d = 0; d < collisionWidth; d++) {
        if (
          o1[4][((o1StartY + c) * o1[2] + o1StartX + d) * 4 + 3] > 0 &&
          o2[4][((o2StartY + c) * o2[2] + o2StartX + d) * 4 + 3] > 0
        ) {
          //Found common filled pixel!!
          return true;
        }
      }
    }
  }
  // Implicitly returns undefined, which is falsy
}

function hitShip(time, newAlwaysOnTopEntities) {
  if (shieldLevel) {
    shieldLevel--;
    sounds.shieldHit();
  } else {
    gameOver(time, newAlwaysOnTopEntities);
  }
}

function TimeSpacer(triggerTime, callback) {
  return (time, newEntities) => {
    if (time < triggerTime) {
      return true;
    }
    callback(time, newEntities);
  };
}

function ShipFragment(
  [
    spriteCenterX,
    spriteCenterY,
    spriteOffsetX,
    spriteOffsetY,
    spriteCanvas,
    spriteTranslateX,
    spriteTranslateY,
    spriteAngle,
  ],
  fragmentedShipX,
  fragmentedShipY,
  lastTime,
  explosionDuration
) {
  if (explosionDuration) {
    return (time) => {
      const progress = (time - lastTime) / explosionDuration;
      if (progress < 1) {
        gameCtxWrap(() => {
          gameCtx.globalAlpha = 1 - progress ** 2;
          gameCtx.translate(
            fragmentedShipX + spriteCenterX + spriteTranslateX * progress,
            fragmentedShipY + spriteCenterY + spriteTranslateY * progress
          );
          gameCtx.rotate(spriteAngle * progress);
          drawImageInGameCanvas(spriteCanvas, spriteOffsetX, spriteOffsetY);
        });
        return true;
      }
      // Returning undefined is falsy
    };
  }
  // Pickable ship frag
  let x = fragmentedShipX + spriteCenterX + spriteOffsetX;
  let y = fragmentedShipY + spriteCenterY + spriteOffsetY;
  const creation = lastTime;
  const initialAngle = Math.atan2(spriteTranslateY, spriteTranslateX);
  const maskData = obtainImageData(spriteCanvas).data;
  const magnetSpeed =
    BASE_MAGNET_SPEED + ADDITIONAL_MAGNET_SPEED * settings.u[UPGRADE_MAGNET];

  const highlightSprite = hitEffect(spriteCanvas);

  return (time) => {
    const progress = (time - creation) / ENEMY_EXPLOSION_DURATION;
    const ellapsed = time - lastTime;
    const distanceToShip = Math.hypot(shipX - x, shipY - y);
    // Magnet upgrade
    if (!shipDestroyed && distanceToShip < 60 * settings.u[UPGRADE_MAGNET]) {
      const angle = angleToPlayer(x, y);
      x += Math.sin(angle) * magnetSpeed * ellapsed;
      y += Math.cos(angle) * magnetSpeed * ellapsed;
    } else {
      if (progress < 1) {
        x += COIN_SLOWDOWN_SPEED * (1 - progress) * Math.cos(initialAngle);
        y += COIN_SLOWDOWN_SPEED * (1 - progress) * Math.sin(initialAngle);
        if (x < 0 || x > CANVAS_WIDTH - spriteCanvas.width) {
          initialAngle += Math.PI;
        }
      }
      y += COIN_CREEPING_SPEED * ellapsed;
    }

    // Check collision to ship
    if (
      !shipDestroyed &&
      collide(shipHitBox, [
        x,
        y,
        spriteCanvas.width,
        spriteCanvas.height,
        maskData,
      ])
    ) {
      updateStars(1);
      sounds.coin();
      // Returning undefined is falsish
    } else if (y < CANVAS_HEIGHT) {
      lastTime = time;
      drawImageInGameCanvas(
        spriteCanvas,
        x - spriteCanvas.width / 2,
        y - spriteCanvas.height / 2
      );
      gameCtxWrap(() => {
        gameCtx.globalAlpha = 0.5 + Math.sin(time / 100) / 2;
        drawImageInGameCanvas(
          highlightSprite,
          x - spriteCanvas.width / 2,
          y - spriteCanvas.height / 2
        );
      });
      return true;
    }
  };
}

function Bullet(x, y, bullets, bulletDirection, bulletPower, lastTime) {
  const [bullet, bulletMask] = bullets[bulletDirection];
  return (time) => {
    y -= BULLET_SPEED * (time - lastTime);
    x += ((bulletDirection - 1) * BULLET_SPEED * (time - lastTime)) / 4;

    const hitBox = [x, y, bullet.width, bullet.height, bulletMask];
    // Check collision with hitables
    for (let c = 0; c < hitables.length; c++) {
      if (hitables[c](hitBox, bulletPower, time)) {
        // We're done, get rid of bullet
        // Returning undefined is falsy
        return;
      }
    }

    if (y + bullet.height / 2 > 0) {
      lastTime = time;
      drawImageInGameCanvas(
        bullet,
        x - bullet.width / 2,
        y - bullet.height / 2
      );
      return true;
    }
    // Returning undefined is falsy
  };
}

function Particle(shipX, shipY, shipWidth, shipHeight, creation) {
  const radius = numberBetween(Math.random(), 10, 50);
  const color =
    EXPLOSION_COLORS[
      integerNumberBetween(Math.random(), 0, EXPLOSION_COLORS.length - 1)
    ];
  const posX =
    shipX + integerNumberBetween(Math.random(), -shipWidth / 2, shipWidth / 2);
  const posY =
    shipY +
    integerNumberBetween(Math.random(), -shipHeight / 2, shipHeight / 2);

  return (time) => {
    const progress = (time - creation) / 500;
    if (progress < 1) {
      gameCtxWrap(() => {
        gameCtx.globalCompositeOperation = "lighter";
        gameCtx.fillStyle = color;
        fillCircle(gameCtx, posX, posY, radius * (1 - progress));
      });

      return true;
    }
    // Returning undefined is falsy
  };
}

function angleToPlayer(x, y) {
  return Math.atan2(shipX - x, shipY - y);
}

function EnemyBullet(size, x, y, angle, bulletSpeed, lastTime) {
  const [enemyBulletFrames, enemyBulletMask] = enemyBullets[size];
  const w = enemyBulletFrames[0].width;
  const h = enemyBulletFrames[0].height;
  const xSpeed = bulletSpeed * Math.cos(angle);
  const ySpeed = bulletSpeed * Math.sin(angle);

  return (time, newEntities, newAlwaysOnTopEntities) => {
    // Destroy bullets if bomb time
    if (bombEffect > time) {
      // Returning undefined is falsy
      return;
    }
    const ellapsed = time - lastTime;
    y += ellapsed * xSpeed;
    x += ellapsed * ySpeed;

    // Check collision to ship
    if (collide(shipHitBox, [x, y, w, h, enemyBulletMask])) {
      hitShip(time, newAlwaysOnTopEntities);
      if (!shipDestroyed) {
        // Returning undefined is falsy
        return;
      }
    }

    // Make it disappear after it leaves the screen
    if (
      y - h / 2 > CANVAS_HEIGHT ||
      y + h / 2 < 0 ||
      x - w / 2 > CANVAS_WIDTH ||
      x + w / 2 < 0
    ) {
      // Returning undefined is falsy
      return;
    }

    lastTime = time;

    drawImageInGameCanvas(
      enemyBulletFrames[time % enemyBulletFrames.length | 0],
      x - w / 2,
      y - h / 2
    );
    return 2;
  };
}

function fireCircleBullets(
  newEntities,
  size,
  amount,
  x,
  y,
  initialAngle,
  speed,
  time
) {
  for (let c = 0; c < amount; c++) {
    newEntities.push(
      EnemyBullet(
        size,
        x,
        y,
        initialAngle + (2 * c * Math.PI) / amount,
        speed,
        time
      )
    );
  }
}

function drawEnemy(x, y, canvas, hitCanvas, time, hitTime) {
  const hitTint = 400 - time + hitTime;
  let finalX =
    x -
    canvas.width / 2 +
    (hitTint > 0 ? integerNumberBetween(Math.random(), -1, 1) : 0);
  let finalY =
    y -
    canvas.height / 2 +
    (hitTint > 0 ? integerNumberBetween(Math.random(), -1, 1) : 0);
  drawImageInGameCanvas(canvas, finalX, finalY);
  if (hitTint > 0) {
    gameCtxWrap(() => {
      gameCtx.globalAlpha = hitTint / 400;
      drawImageInGameCanvas(hitCanvas, finalX, finalY);
    });
  }
}

function Enemy(
  [
    canvas,
    mask,
    hitCanvas,
    destroyedSprites,
    health,
    speed,
    triggerDelay,
    triggerFunc,
    stopAt,
    deathBullets,
    homingAngle,
    waveInfo,
  ],
  x,
  killPoints,
  creationTime
) {
  const w = canvas.width;
  const h = canvas.height;
  let y = -h / 2;
  let hitTime = 0;
  let hitBox;
  let lastTime = creationTime;
  let nextTrigger = triggerDelay && creationTime + triggerDelay;
  let fireSequence = 0;
  let currentAngle = shipDestroyed ? 0 : angleToPlayer(x, y);
  const checkHit = (otherHitBox, power, now) => {
    if (collide(otherHitBox, hitBox)) {
      hitTime = now;
      health -= power;
      if (health > 0) {
        sounds.enemyHit();
      }
      return true;
    }
  };

  return (time, newEntities, newAlwaysOnTopEntities) => {
    const ellapsed = time - lastTime;
    let isDead = false;
    // Destroy enemies if no health or bomb time
    if (health <= 0 || bombEffect > time) {
      isDead = true;
    } else {
      if (homingAngle) {
        if (!shipDestroyed && y < shipY) {
          const angleDiff = angleToPlayer(x, y) - currentAngle;
          const minAngle = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          const angleSpeed = homingAngle * ellapsed;
          if (minAngle < 0) {
            currentAngle += Math.max(minAngle, -angleSpeed);
          } else {
            currentAngle += Math.min(minAngle, angleSpeed);
          }
        }
        x += ellapsed * speed * Math.sin(currentAngle);
        y += ellapsed * speed * Math.cos(currentAngle);
      } else {
        y += ellapsed * speed;
      }
      if (!shipDestroyed && stopAt) y = Math.min(y, stopAt);
      // Update hit box
      hitBox = [x, y, w, h, mask];

      // Check collision to ship
      if (collide(shipHitBox, hitBox)) {
        hitShip(time, newAlwaysOnTopEntities);
        if (!shipDestroyed) {
          isDead = true;
        }
      }
    }

    if (isDead) {
      sounds.explosion(w / 275);

      if (deathBullets) {
        fireCircleBullets(
          newEntities,
          deathBullets[0], // TODO: replace
          deathBullets[1],
          x,
          y + 17 * speed,
          (2 * Math.PI) / deathBullets[2],
          deathBullets[2],
          time
        );
      }

      // We previously sorted the fragments by size, and we want the pickup fragment to be on the big-ish side
      const replaceFragmentIndices = destroyedSprites.map(
        (i) => ENEMY_EXPLOSION_DURATION
      );
      const fragAmount =
        (deathBullets ? 2 : 1) *
        (currentLevel - LEVEL_SURVIVAL
          ? integerNumberBetween(Math.random(), 1, currentLevel + 1)
          : 0);
      for (let i = 0; i < fragAmount; i++) {
        replaceFragmentIndices[
          integerNumberBetween(Math.random(), 0, destroyedSprites.length / 2)
        ] = 0;
      }
      destroyedSprites.map((sprite, idx) =>
        newEntities.push(
          ShipFragment(
            generateSpriteFinalState(sprite, w, h),
            x - w / 2,
            y - h / 2,
            time,
            replaceFragmentIndices[idx]
          )
        )
      );

      for (let i = 0; i < Math.ceil((w * h) / 500); i++) {
        newEntities.push(Particle(x, y, w, h, time));
      }

      // Returning undefined is falsy
      return addScore(killPoints);
    }

    // Make it disappear after it leaves the screen
    if (y - h / 2 > CANVAS_HEIGHT) {
      // Returning undefined is falsy
      return;
    }

    drawEnemy(x, y, canvas, hitCanvas, time, hitTime);

    if (!shipDestroyed && nextTrigger && nextTrigger < time) {
      // Fire bullet spread, a bit forward as it looks better
      const fromY = y + 17 * speed;

      sounds.enemyFire();

      function circleBullets(size, amount, angle, speed) {
        fireCircleBullets(
          newEntities,
          size,
          amount,
          x,
          fromY,
          angle,
          speed,
          time
        );
      }
      function aimedBullet(size, speed, extraAmount, extraAngle) {
        // Fire single bullet targeted to the player ship
        const angle = angleToPlayer(x, fromY);
        newEntities.push(EnemyBullet(size, x, fromY, angle, speed, time));
        if (extraAmount) {
          for (let c = 0; c < extraAmount; c++) {
            newEntities.push(
              EnemyBullet(
                size,
                x,
                fromY,
                angle + (c + 1) * extraAngle,
                speed,
                time
              ),
              EnemyBullet(
                size,
                x,
                fromY,
                angle - (c + 1) * extraAngle,
                speed,
                time
              )
            );
          }
        }
      }
      const newTrigger = triggerFunc(
        aimedBullet,
        circleBullets,
        ++fireSequence
      );
      nextTrigger = newTrigger && nextTrigger + newTrigger;
    }

    lastTime = time;

    return checkHit;
  };
}

function Boss(time) {
  let bossType = currentLevel == LEVEL_ENDGAME ? difficulty : currentLevel;
  const bossResourceIndex = currentLevel == LEVEL_ENDGAME ? bossType : 0;
  let bossShip = bossShips[bossResourceIndex];
  let bossMask = obtainImageData(bossShip).data;
  let bossHit = bossHits[bossResourceIndex];
  let currentDestroyedBossSprites = destroyedBossSprites[bossResourceIndex];
  let w = bossShip.width;
  let h = bossShip.height;
  let phase = BOSS_COMING;
  // We want to be basically immortal until we start the fight
  let health = 1e9;
  let initialHealth = 1e9;
  let lastTime = time;
  let x = HALF_CANVAS_WIDTH;
  let y = -800;
  let moveDirectionX = DIRECTION_RIGHT;
  let moveDirectionY = bossType - 3 ? DIRECTION_NONE : DIRECTION_DOWN;
  let hitTime = 0;
  let hitBox;
  let bulletCount = 0;
  let nextBullet;
  let finalBossTriggerNextPhase = false;
  const checkHit = (otherHitBox, power, now) => {
    if (collide(otherHitBox, hitBox)) {
      if (
        bossType == LEVEL_ENDGAME &&
        health >= initialHealth / 2 &&
        health - power < initialHealth / 2
      ) {
        // Next phase!
        finalBossTriggerNextPhase = true;
      }
      hitTime = now;
      health -= power;
      l.style.width = (100 * health) / initialHealth + "%";
      if (health > 0) {
        sounds.enemyHit();
      }
      return true;
    }
  };

  // Show life bar
  e.style.opacity = 1;
  l.style.width = (100 * health) / initialHealth + "%";

  return (time, newEntities, newAlwaysOnTopEntities) => {
    let isDead = false;
    // Destroy enemies if no health or bomb time
    if (health <= 0) {
      isDead = true;
    } else if (finalBossTriggerNextPhase) {
      finalBossTriggerNextPhase = false;
      currentDestroyedBossSprites.map((sprite) =>
        newAlwaysOnTopEntities.push(
          ShipFragment(
            generateSpriteFinalState(sprite, w, h),
            x - w / 2,
            y - h / 2,
            time,
            BOSS_EXPLOSION_DURATION
          )
        )
      );
      bossType++;
      bossShip = bossShips[bossType];
      bossMask = obtainImageData(bossShip).data;
      bossHit = bossHits[bossType];
      currentDestroyedBossSprites = destroyedBossSprites[bossType];
      w = bossShip.width;
      h = bossShip.height;
      nextBullet = time + 1000;
      bulletCount = 0;
    } else {
      const ellapsed = time - lastTime;
      if (phase) {
        if (bossType > LEVEL_ENDGAME) {
          if (!shipDestroyed) {
            const angle = angleToPlayer(x, y);
            x += Math.sin(angle) * BOSS_SPEED * ellapsed;
            y += Math.cos(angle) * BOSS_SPEED * ellapsed;
          }
          // Level 0 and final one (first phase) don't move
        } else if (bossType) {
          // Update X
          if (moveDirectionX == DIRECTION_RIGHT) {
            x += ellapsed * BOSS_SPEED;
            if (x + w / 2 > CANVAS_WIDTH) {
              x = CANVAS_WIDTH - w / 2;
              moveDirectionX = DIRECTION_LEFT;
              if (bossType == 2) {
                moveDirectionX = DIRECTION_NONE;
                moveDirectionY = DIRECTION_DOWN;
              }
            }
          } else if (moveDirectionX == DIRECTION_LEFT) {
            x -= ellapsed * BOSS_SPEED;
            if (x - w / 2 < 0) {
              x = w / 2;
              moveDirectionX = DIRECTION_RIGHT;
              if (bossType == 2) {
                moveDirectionX = DIRECTION_NONE;
                moveDirectionY = DIRECTION_UP;
              }
            }
          }
          // Update Y
          if (moveDirectionY == DIRECTION_DOWN) {
            y += ellapsed * BOSS_SPEED;
            if (y + h / 2 > CANVAS_HEIGHT) {
              y = CANVAS_HEIGHT - h / 2;
              // CCheap else for current level == 3
              moveDirectionY = DIRECTION_UP;
              if (bossType == 2) {
                moveDirectionY = DIRECTION_NONE;
                moveDirectionX = DIRECTION_LEFT;
              }
            }
          } else if (moveDirectionY == DIRECTION_UP) {
            y -= ellapsed * BOSS_SPEED;
            if (y - h / 2 < 0) {
              y = h / 2;
              // Cheap else for current level == 3
              moveDirectionY = DIRECTION_DOWN;
              if (bossType == 2) {
                moveDirectionY = DIRECTION_NONE;
                moveDirectionX = DIRECTION_RIGHT;
              }
            }
          }
        }
      } else {
        // Boss coming
        y += ellapsed * 0.2;
        if (y > 150) {
          y = 150;
          // Give it normal health
          initialHealth = health = BOSS_HEALTH[bossType];
          phase = BOSS_FIGHT;
          nextBullet = time;
        }
      }
    }

    if (isDead) {
      // Make life bar disappear
      l.style.width = e.style.opacity = "";

      sounds.bossExplosion();
      addScore((bossType + 1) * 1000);

      currentDestroyedBossSprites.map((sprite) =>
        newEntities.push(
          ShipFragment(
            generateSpriteFinalState(sprite, w, h),
            x - w / 2,
            y - h / 2,
            time,
            BOSS_EXPLOSION_DURATION
          )
        )
      );
      for (let i = 0; i < Math.ceil((w * h) / 500); i++) {
        newEntities.push(Particle(x, y, w, h, time));
      }
      if (currentLevel - LEVEL_ENDGAME || difficulty == LEVEL_ENDGAME) {
        victory(time);
      } else {
        // Invoke next endgame boss
        difficulty++;
        newEntities.push(
          TimeSpacer(time + 3000, (callbackTime, newEntities) =>
            newEntities.push(Boss(callbackTime))
          )
        );
      }
      return;
    }

    // Update hit box
    hitBox = [x, y, w, h, bossMask];

    // Check collision to ship
    if (collide(shipHitBox, hitBox)) {
      gameOver(time, newAlwaysOnTopEntities);
    }

    lastTime = time;

    drawEnemy(x, y, bossShip, bossHit, time, hitTime);

    if (!shipDestroyed && phase == BOSS_FIGHT) {
      // Fire bullets if needed
      if (nextBullet < time) {
        sounds.enemyFire();
        if (bossType == 0) {
          // Andromeda
          if (bulletCount < 5) {
            const bulletY = y + 125;
            // Targeted bullets
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_S,
                x,
                bulletY,
                angleToPlayer(x, bulletY),
                0.3,
                time
              )
            );
          } else {
            fireCircleBullets(
              newEntities,
              ENEMY_BULLET_M,
              12,
              x,
              y,
              bulletCount - 5 ? 0 : Math.PI / 12,
              0.5,
              time
            );
          }
          bulletCount++;
          if (bulletCount > 6) {
            bulletCount = 0;
            nextBullet = time + 800;
          } else if (bulletCount > 4) {
            nextBullet = time + 100;
          } else {
            nextBullet = time + 200;
          }
        } else if (bossType == 1) {
          // Borealis
          if (bulletCount < 8) {
            const [offsetX, offsetY] = [
              [61, 75],
              [78, 66],
              [99, 76],
              [115, 65],
            ][Math.floor(bulletCount / 2)];

            // Side bullets
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_M,
                x - offsetX,
                y + offsetY,
                0,
                0.6,
                time
              ),
              EnemyBullet(
                ENEMY_BULLET_M,
                x + offsetX,
                y + offsetY,
                0,
                0.6,
                time
              )
            );
          } else {
            const fromY = y + 77;
            // Targeted bullets
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_XL,
                x,
                fromY,
                angleToPlayer(x, fromY),
                0.35 + (bulletCount - 8) * 0.1,
                time
              )
            );
          }
          bulletCount++;
          if (bulletCount > 16) {
            bulletCount = 0;
            nextBullet = time + 800;
          } else if (bulletCount > 8) {
            nextBullet = time + 100;
          } else if (bulletCount == 8) {
            nextBullet = time + 500;
          } else {
            if (bulletCount % 2) {
              nextBullet = time + 100;
            } else {
              nextBullet = time + 200;
            }
          }
        } else if (bossType == 2) {
          // Cygnus
          if (bulletCount < 8) {
            const angle = angleToPlayer(x, y);
            const fromX = x + Math.sin(angle) * 70;
            const fromY = y + Math.cos(angle) * 70;
            // Targeted bullets
            newEntities.push(
              EnemyBullet(ENEMY_BULLET_L, fromX, fromY, angle, 0.4, time)
            );
          } else {
            fireCircleBullets(
              newEntities,
              ENEMY_BULLET_M,
              3,
              x,
              y,
              (bulletCount * Math.PI) / 10,
              0.35,
              time
            );
          }
          bulletCount++;
          if (bulletCount > 30) {
            bulletCount = 0;
            nextBullet = time + 800;
          } else if (bulletCount < 9) {
            nextBullet = time + 300;
          } else {
            nextBullet = time + 50;
          }
        } else if (bossType == 3) {
          // Draco
          if (bulletCount < 20) {
            fireCircleBullets(
              newEntities,
              ENEMY_BULLET_L,
              2,
              x,
              y,
              Math.PI / 20 + (bulletCount * Math.PI) / 10,
              0.35,
              time
            );
            fireCircleBullets(
              newEntities,
              ENEMY_BULLET_L,
              2,
              x,
              y,
              -Math.PI / 20 - (bulletCount * Math.PI) / 10,
              0.35,
              time
            );
          } else {
            const angle = angleToPlayer(x, y);
            const fromX = x + Math.sin(angle) * 70;
            const fromY = y + Math.cos(angle) * 70;
            // Targeted bullets
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_M,
                fromX,
                fromY,
                angle - Math.PI / 8,
                0.5,
                time
              ),
              EnemyBullet(
                ENEMY_BULLET_M,
                fromX,
                fromY,
                angle + Math.PI / 8,
                0.5,
                time
              ),
              EnemyBullet(ENEMY_BULLET_XL, fromX, fromY, angle, 0.5, time)
            );
          }
          bulletCount++;
          if (bulletCount == 20) {
            nextBullet = time + 1500;
          } else if (bulletCount > 25) {
            bulletCount = 0;
            nextBullet = time + 1500;
          } else if (bulletCount > 20) {
            nextBullet = time + 150;
          } else {
            nextBullet = time + 60;
          }
        } else if (bossType == 4) {
          // Endgame phase 1
          if (bulletCount < 12) {
            const [offsetX, offsetY] = [
              [48, 113],
              [79, 107],
              [99, 108],
              [123, 102],
              [156, 86],
              [166, 59],
            ][bulletCount > 5 ? 11 - bulletCount : bulletCount];

            // Side bullets
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_L,
                x - offsetX,
                y + offsetY,
                0,
                0.6,
                time
              ),
              EnemyBullet(
                ENEMY_BULLET_L,
                x + offsetX,
                y + offsetY,
                0,
                0.6,
                time
              )
            );
          } else {
            const fromX = x + (bulletCount % 2 ? 21 : -21);
            const fromY = y + 112;
            const angle = angleToPlayer(fromX, fromY);
            // Targeted bullets
            newEntities.push(
              EnemyBullet(ENEMY_BULLET_XL, fromX, fromY, angle, 0.4, time)
            );
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_L,
                fromX,
                fromY,
                angle - Math.PI / 8,
                0.4,
                time
              )
            );
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_L,
                fromX,
                fromY,
                angle + Math.PI / 8,
                0.4,
                time
              )
            );
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_M,
                fromX,
                fromY,
                angle - Math.PI / 4,
                0.4,
                time
              )
            );
            newEntities.push(
              EnemyBullet(
                ENEMY_BULLET_M,
                fromX,
                fromY,
                angle + Math.PI / 4,
                0.4,
                time
              )
            );
          }
          bulletCount++;
          if (bulletCount > 16) {
            bulletCount = 0;
            nextBullet = time + 800;
          } else if (bulletCount > 12) {
            nextBullet = time + 150;
          } else {
            nextBullet = time + 100;
          }
        } else {
          // if (bossType == 5) {
          fireCircleBullets(
            newEntities,
            ENEMY_BULLET_XL,
            8,
            x,
            y,
            bulletCount % 2 ? 0 : Math.PI / 8,
            0.4,
            time
          );
          bulletCount++;
          if (bulletCount > 1) {
            bulletCount = 0;
            nextBullet = time + 800;
          } else {
            nextBullet = time + 200;
          }
        }
      }
    }

    return checkHit;
  };
}

function getGamepads() {
  return (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter(
    (x) => !!x
  );
}

function isGamepadButtonPressed(buttonIndex) {
  const pads = getGamepads();
  for (let i = 0; i < pads.length; i++) {
    try {
      if (pads[i].buttons[buttonIndex].pressed) {
        return true;
      }
    } catch (e) {}
  }
}

function gamepadAxisValue(axisIndex) {
  const pads = getGamepads();
  const sum = 0;
  for (let i = 0; i < pads.length; i++) {
    try {
      sum += pads[i].axes[axisIndex];
    } catch (e) {}
  }
  // Round to two decimals to prevent drifting
  return Math.round(sum * 100) / 100;
}

function transitionText(text) {
  t.style.transition = "";
  t.style.opacity = 0;
  t.offsetHeight;
  t.innerHTML = text;
  t.style.transition = "3s";
  t.style.opacity = 1;
}

function gameOver(gameEllapsed, newAlwaysOnTopEntities) {
  if (!shipDestroyed && !shipVictory) {
    shipDestroyed = true;
    sounds.explosion(1);
    gameOverTime = gameEllapsed + GAME_OVER_DURATION;
    destroyedShipSprites.map((sprite) => {
      newAlwaysOnTopEntities.push(
        ShipFragment(
          generateSpriteFinalState(sprite, shipWidth, shipHeight),
          shipX - halfShipWidth,
          shipY - halfShipHeight,
          gameEllapsed,
          PLAYER_EXPLOSION_DURATION
        )
      );
    });
    transitionText("Signal Lost");
  }
}

function victory(gameEllapsed) {
  if (!shipDestroyed) {
    shipVictory = true;
    // Unlock next level
    if (currentLevel + 1 > settings.l) {
      settings.l = showCutscene = currentLevel + 1;
      updateSettings();
    }
    gameOverTime = gameEllapsed + GAME_OVER_DURATION;
    bombEffect = gameEllapsed + BOMB_DURATION;
    transitionText("Well Done");
  }
}

function gameRender(now) {
  let tickEllapsed = now - lastTime;
  lastTime = now;
  if (tickEllapsed > 200) {
    // First frame or detecting a pause
    initialTime += tickEllapsed - 40;
    // Treat it as only 1 tick has happened
    tickEllapsed = 40;
    // We don't want the controls to get stuck
    keysPressed = [];
    mousePressed = didMultiTouch = 0;
  }
  const gameEllapsed = now - initialTime;

  if (state == STATE_GAME && !shipDestroyed && !shipVictory) {
    // Check pressed keys
    let toTravel = SHIP_SPEED * tickEllapsed,
      axisX = gamepadAxisValue(0),
      axisY = gamepadAxisValue(1);
    if (
      keysPressed[38] ||
      keysPressed[87] ||
      keysPressed[90] ||
      isGamepadButtonPressed(12)
    ) {
      // Up
      axisY--;
    }
    if (keysPressed[40] || keysPressed[83] || isGamepadButtonPressed(13)) {
      // Down
      axisY++;
    }
    if (
      keysPressed[37] ||
      keysPressed[65] ||
      keysPressed[81] ||
      isGamepadButtonPressed(14)
    ) {
      // Left
      axisX--;
    }

    if (keysPressed[39] || keysPressed[68] || isGamepadButtonPressed(15)) {
      // Right
      axisX++;
    }
    if (
      keysPressed[13] ||
      keysPressed[32] ||
      isGamepadButtonPressed(0) ||
      isGamepadButtonPressed(1) ||
      isGamepadButtonPressed(2) ||
      isGamepadButtonPressed(3) ||
      isGamepadButtonPressed(9) ||
      mousePressed ||
      didMultiTouch
    ) {
      if (!inhibitEnter) {
        launchBomb(gameEllapsed);
        inhibitEnter = true;
      }
    } else {
      inhibitEnter = false;
    }

    if (axisX || axisY) {
      const divider = Math.max(Math.hypot(axisX, axisY), 1);
      shipX += (toTravel * axisX) / divider;
      shipY += (toTravel * axisY) / divider;
      // We don't want to move to the pointer position unless it's updated
      moveX = shipX;
      moveY = shipY;
    } else {
      // Move ship with pointer
      const vx = moveX - shipX,
        vy = moveY - shipY;
      const distance = Math.hypot(vx, vy);

      if (distance > toTravel) {
        shipX += (vx / distance) * toTravel;
        shipY += (vy / distance) * toTravel;
      } else {
        shipX = moveX;
        shipY = moveY;
      }
    }
    if (shipX < halfShipWidth) {
      shipX = halfShipWidth;
    } else if (shipX > CANVAS_WIDTH - halfShipWidth) {
      shipX = CANVAS_WIDTH - halfShipWidth;
    }
    if (shipY < halfShipHeight) {
      shipY = halfShipHeight;
    } else if (shipY > CANVAS_HEIGHT - halfShipHeight) {
      shipY = CANVAS_HEIGHT - halfShipHeight;
    }
    shipHitBox = [shipX, shipY, shipWidth, shipHeight, shipMask];
  }
  if (shipVictory && gameOverTime < gameEllapsed + 2500) {
    shipY +=
      (SHIP_SPEED * tickEllapsed * (gameOverTime - 3000 - gameEllapsed)) / 2000;
  }
  if (state == STATE_INTRO) {
    moveY = shipY =
      CANVAS_HEIGHT +
      halfShipHeight -
      Math.min(1, (2 * gameEllapsed) / GAME_INTRO_DURATION) *
        (shipHeight + SHIP_INITIAL_BOTTOM_MARGIN);
  }

  // Paint background stars
  for (
    let i = 100, s;
    i--;
    gameCtx.fillStyle = STAR_COLORS[i % STAR_COLORS.length],
      fillCircle(
        gameCtx,
        ((1 - i / 100) * (CANVAS_WIDTH - STARS_WIDTH) * shipX) /
          (CANVAS_WIDTH - shipWidth) +
          ((102797 * (1 + Math.sin(s)) * i) % STARS_WIDTH),
        (CANVAS_HEIGHT * (Math.tan(i / 9) + (s * gameEllapsed) / 3000)) %
          CANVAS_HEIGHT,
        (s - 0.3) * 3.3
      )
  )
    s = 150 / (i * 3 + 200);

  // Run entities
  const nextEntities = [],
    alwaysOnTop = [],
    nextHitables = [];
  function runEntity(entity) {
    const newEntities = [];
    const result = entity(gameEllapsed, newEntities, alwaysOnTop);
    if (result) {
      if (result == 2) {
        alwaysOnTop.push(entity);
      } else {
        nextEntities.push(entity);
      }
      if (result.call) {
        nextHitables.push(result);
      }
    }
    newEntities.map(runEntity);
  }
  entities.map(runEntity);

  entities = nextEntities.concat(alwaysOnTop);
  hitables = nextHitables;

  if (!shipDestroyed) {
    if (shieldLevel) {
      const shieldCanvas = shields[Math.max(0, shields.length - shieldLevel)];
      // Paint shield
      drawImageInGameCanvas(
        shieldCanvas,
        shipX - Math.floor(shieldCanvas.width / 2),
        shipY - Math.floor(shieldCanvas.height / 2)
      );
    }
    const thursterCanvas =
      thrusters[integerNumberBetween(Math.random(), 0, 1)][0];
    // Thruster
    drawImageInGameCanvas(
      thursterCanvas,
      shipX - thursterCanvas.width / 2,
      shipY + halfShipHeight - 1
    );
    // Paint ship
    drawImageInGameCanvas(ship, shipX - halfShipWidth, shipY - halfShipHeight);
  }

  // Paint bomb
  if (bombEffect > gameEllapsed) {
    gameCtxWrap(() => {
      // Fill style is already white
      gameCtx.globalAlpha = (bombEffect - gameEllapsed) / BOMB_DURATION;
      gameCtx.fillRect(0, 0, 1e9, 1e9);
    });
  }

  // Should we fire?
  if (
    state == STATE_GAME &&
    !shipDestroyed &&
    !shipVictory &&
    lastBullet + 200 < gameEllapsed
  ) {
    const [sideBullet, sideBulletPower] =
      settings.u[UPGRADE_SIDE] > 2
        ? [largeBullet, LARGE_BULLET_POWER]
        : [smallBullet, SMALL_BULLET_POWER];
    if (
      (settings.u[UPGRADE_SIDE] && !bulletRoundCount) ||
      (settings.u[UPGRADE_SIDE] > 1 && bulletRoundCount == 1) ||
      settings.u[UPGRADE_SIDE] > 3
    ) {
      entities.push(
        Bullet(
          shipX - 25,
          shipY - Math.floor(shipHeight / 2),
          sideBullet,
          BULLET_LEFT,
          sideBulletPower,
          gameEllapsed
        )
      );
      entities.push(
        Bullet(
          shipX + 25,
          shipY - Math.floor(shipHeight / 2),
          sideBullet,
          BULLET_RIGHT,
          sideBulletPower,
          gameEllapsed
        )
      );
    }

    const [mainBullet, mainBulletPower] =
      settings.u[UPGRADE_GUN] > 2
        ? [largeBullet, LARGE_BULLET_POWER]
        : [smallBullet, SMALL_BULLET_POWER];
    if (settings.u[UPGRADE_GUN]) {
      // 2 bullets
      entities.push(
        Bullet(
          shipX - 13,
          shipY - Math.floor(shipHeight / 2) + 7,
          mainBullet,
          BULLET_STRAIGHT,
          mainBulletPower,
          gameEllapsed
        )
      );
      entities.push(
        Bullet(
          shipX + 13,
          shipY - Math.floor(shipHeight / 2) + 7,
          mainBullet,
          BULLET_STRAIGHT,
          mainBulletPower,
          gameEllapsed
        )
      );
    }

    if (settings.u[UPGRADE_GUN] % 2 == 0) {
      // 1 bullets
      entities.push(
        Bullet(
          shipX,
          shipY - Math.floor(shipHeight / 2) - 8,
          mainBullet,
          BULLET_STRAIGHT,
          mainBulletPower,
          gameEllapsed
        )
      );
    }
    lastBullet = gameEllapsed;
    sounds.bullet();
    bulletRoundCount = (bulletRoundCount + 1) % 4;
  }

  if (nextDifficulty < gameEllapsed && !bossTime) {
    // Increase difficulty and check
    if (++difficulty % 6) {
      nextDifficulty = gameEllapsed + 10000;
    } else if (currentLevel - LEVEL_SURVIVAL) {
      bossTime = true;
      entities.push(Boss(gameEllapsed));
    }
  }

  if (!bossTime) {
    // Should we spawn enemy
    if (nextEnemy < gameEllapsed) {
      const enemyDifficulty = integerNumberBetween(
          enemyRandomizer(),
          0,
          Math.min(difficulty, enemyBlueprints.length - 1)
        ),
        enemyX = integerNumberBetween(enemyRandomizer(), 30, CANVAS_WIDTH - 30),
        enemyPoints = (enemyDifficulty + 1) * 50;

      const invoker = (triggerTime, newEntities) =>
        newEntities.push(
          Enemy(
            enemyBlueprints[enemyDifficulty],
            enemyX,
            enemyPoints,
            triggerTime
          )
        );
      if (enemyBlueprints[enemyDifficulty][11]) {
        // Invoke more
        for (let c = 0; c < 3; c++) {
          entities.push(TimeSpacer(gameEllapsed + (c + 1) * 300, invoker));
        }
      }
      invoker(gameEllapsed, entities);
      updateNextEnemy();
    }
  }

  if (gameOverTime && gameOverTime < gameEllapsed) {
    // Hide score and top score
    l.style.width =
      e.style.opacity =
      i.innerHTML =
      p.innerHTML =
      b.innerHTML =
        "";
    // Hide boss bar
    e.style.transition = "initial";
    e.offsetHeight;
    e.style.transition = "";

    if (showCutscene) {
      playCutscene(showGameOverMenu);
    } else {
      // Show level select
      state = STATE_MENU;
      showGameOverMenu();
    }
  }

  if (state == STATE_INTRO && gameEllapsed > GAME_INTRO_DURATION) {
    state = STATE_GAME;
    t.style.opacity = 0;
    t.style.transition = ".5s";
    // End game, invoke first boss
    if (currentLevel == LEVEL_ENDGAME) {
      entities.push(Boss(gameEllapsed));
    }
  }
}

/* Compute mouse / touch coordinates on the canvas */

function processPointerEvent(mouseEventOrTouch) {
  const rect = g.getBoundingClientRect();
  return [
    Math.floor(
      ((mouseEventOrTouch.pageX - rect.left) * CANVAS_WIDTH) / rect.width
    ),
    Math.floor(
      ((mouseEventOrTouch.pageY - rect.top) * CANVAS_HEIGHT) / rect.height
    ),
  ];
}

function processTouchEvent(e) {
  const touchList = e.touches;
  e.preventDefault();
  didMultiTouch = touchList.length > 1;
  if (currentTouchIdentifier != null) {
    for (let c = 0; c < touchList.length; c++) {
      if (touchList[c].identifier == currentTouchIdentifier) {
        const [current_x, current_y] = processPointerEvent(touchList[c]);
        moveX += current_x - touchPreviousX;
        moveY += current_y - touchPreviousY;
        touchPreviousX = current_x;
        touchPreviousY = current_y;
        return;
      }
    }
  }
  if (touchList.length > 0) {
    currentTouchIdentifier = touchList[0].identifier;
    [touchPreviousX, touchPreviousY] = processPointerEvent(touchList[0]);
    return;
  }
  currentTouchIdentifier = null;
}

// Self isn't needed for the keys and mouse events, but it's necessary for touch
// Keeping it all the same helps with zipping
/* Down */
self.onmousedown = (e) => {
  e.preventDefault();
  mousePressed = true;
};

self.onmouseup = (e) => {
  e.preventDefault();
  mousePressed = false;
};

self.ontouchcancel =
  self.ontouchend =
  self.ontouchmove =
  self.ontouchstart =
    processTouchEvent;

/* Move */
self.onmousemove = (e) => {
  e.preventDefault();
  [moveX, moveY] = processPointerEvent(e);
};

self.onkeydown = self.onkeyup = (e) => {
  e.preventDefault();
  // keydown will be truish, keyup undefined (falsish)
  keysPressed[e.keyCode] = e.type[5];
};

// Let's run the game
gameCanvas.width = CANVAS_WIDTH;
gameCanvas.height = CANVAS_HEIGHT;

render(initialTime);
