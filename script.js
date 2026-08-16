(function () {
  var STAGE_LABELS = ["Начинаем", "Хорошо идёт", "Для знатоков"];

  var PROVERBS = [
    { stage: 0, text: "Старый друг лучше новых двух.", parts: ["Старый друг", "лучше", "новых двух"] },
    { stage: 0, text: "Тише едешь — дальше будешь.", parts: ["Тише едешь", "дальше", "будешь"] },
    { stage: 0, text: "Что посеешь, то и пожнёшь.", parts: ["Что посеешь", "то и", "пожнёшь"] },
    { stage: 0, text: "Терпение и труд всё перетрут.", parts: ["Терпение и труд", "всё", "перетрут"] },
    { stage: 0, text: "Лучше поздно, чем никогда.", parts: ["Лучше поздно", "чем", "никогда"] },
    { stage: 0, text: "Кончил дело — гуляй смело.", parts: ["Кончил дело", "гуляй", "смело"] },
    { stage: 0, text: "Век живи — век учись.", parts: ["Век живи", "век", "учись"] },
    { stage: 0, text: "Яблоко от яблони недалеко падает.", parts: ["Яблоко от яблони", "недалеко", "падает"] },
    { stage: 0, text: "Делу время, потехе час.", parts: ["Делу время", "потехе", "час"] },
    { stage: 0, text: "В гостях хорошо, а дома лучше.", parts: ["В гостях хорошо", "а дома", "лучше"] },
    { stage: 0, text: "Не всё то золото, что блестит.", parts: ["Не всё то золото", "что", "блестит"] },
    { stage: 0, text: "Под лежачий камень вода не течёт.", parts: ["Под лежачий камень", "вода", "не течёт"] },
    { stage: 0, text: "Глаза боятся, а руки делают.", parts: ["Глаза боятся", "а руки", "делают"] },
    { stage: 0, text: "Слово не воробей: вылетит — не поймаешь.", parts: ["Слово не воробей", "вылетит", "не поймаешь"] },
    { stage: 0, text: "Кто рано встаёт, тому Бог подаёт.", parts: ["Кто рано встаёт", "тому Бог", "подаёт"] },
    { stage: 0, text: "Жизнь прожить — не поле перейти.", parts: ["Жизнь прожить", "не поле", "перейти"] },
    { stage: 0, text: "Старый конь борозды не испортит.", parts: ["Старый конь", "борозды", "не испортит"] },
    { stage: 0, text: "На Бога надейся, а сам не плошай.", parts: ["На Бога надейся", "а сам", "не плошай"] },
    { stage: 0, text: "Человек предполагает, а Бог располагает.", parts: ["Человек предполагает", "а Бог", "располагает"] },
    { stage: 0, text: "Куй железо, пока горячо.", parts: ["Куй железо", "пока", "горячо"] },
    { stage: 0, text: "Дарёному коню в зубы не смотрят.", parts: ["Дарёному коню", "в зубы", "не смотрят"] },
    { stage: 0, text: "Цыплят по осени считают.", parts: ["Цыплят", "по осени", "считают"] },
    { stage: 0, text: "Кашу маслом не испортишь.", parts: ["Кашу", "маслом", "не испортишь"] },
    { stage: 0, text: "Доброе слово и кошке приятно.", parts: ["Доброе слово", "и кошке", "приятно"] },
    { stage: 0, text: "Будет и на нашей улице праздник.", parts: ["Будет и", "на нашей улице", "праздник"] },
    { stage: 0, text: "Мир да лад — в семье клад.", parts: ["Мир да лад", "в семье", "клад"] },
    { stage: 0, text: "Большому кораблю — большое плавание.", parts: ["Большому кораблю", "большое", "плавание"] },
    { stage: 0, text: "Где родился, там и пригодился.", parts: ["Где родился", "там и", "пригодился"] },

    { stage: 1, text: "Семь раз отмерь — один раз отрежь.", parts: ["Семь раз", "отмерь", "один раз", "отрежь"] },
    { stage: 1, text: "Не имей сто рублей, а имей сто друзей.", parts: ["Не имей", "сто рублей", "а имей", "сто друзей"] },
    { stage: 1, text: "Без труда не вытащишь и рыбку из пруда.", parts: ["Без труда", "не вытащишь", "и рыбку", "из пруда"] },
    { stage: 1, text: "Не место красит человека, а человек красит место.", parts: ["Не место", "красит человека", "а человек", "красит место"] },
    { stage: 1, text: "Готовь сани летом, а телегу зимой.", parts: ["Готовь сани", "летом", "а телегу", "зимой"] },
    { stage: 1, text: "Не красна изба углами, а красна пирогами.", parts: ["Не красна изба", "углами", "а красна", "пирогами"] },
    { stage: 1, text: "Одна голова хорошо, а две лучше.", parts: ["Одна голова", "хорошо", "а две", "лучше"] },
    { stage: 1, text: "По одёжке встречают, по уму провожают.", parts: ["По одёжке", "встречают", "по уму", "провожают"] },
    { stage: 1, text: "Любишь кататься — люби и саночки возить.", parts: ["Любишь кататься", "люби", "и саночки", "возить"] },
    { stage: 1, text: "Береги платье снову, а честь смолоду.", parts: ["Береги платье", "снову", "а честь", "смолоду"] },
    { stage: 1, text: "За двумя зайцами погонишься — ни одного не поймаешь.", parts: ["За двумя зайцами", "погонишься", "ни одного", "не поймаешь"] },
    { stage: 1, text: "На вкус и цвет товарища нет.", parts: ["На вкус", "и цвет", "товарища", "нет"] },
    { stage: 1, text: "Сначала аз да буки, а там и науки.", parts: ["Сначала аз", "да буки", "а там", "и науки"] },
    { stage: 1, text: "В чужой монастырь со своим уставом не ходят.", parts: ["В чужой монастырь", "со своим", "уставом", "не ходят"] },
    { stage: 1, text: "Птицу видно по полёту, а человека — по делам.", parts: ["Птицу видно", "по полёту", "а человека", "по делам"] },

    { stage: 2, text: "Не откладывай на завтра то, что можно сделать сегодня.", parts: ["Не откладывай", "на завтра", "то, что", "можно сделать", "сегодня"] },
    { stage: 2, text: "Лучше один раз увидеть, чем сто раз услышать.", parts: ["Лучше один раз", "увидеть", "чем", "сто раз", "услышать"] },
    { stage: 2, text: "Не сули журавля в небе, а дай синицу в руки.", parts: ["Не сули журавля", "в небе", "а дай", "синицу", "в руки"] },
    { stage: 2, text: "Лучше синица в руках, чем журавль в небе.", parts: ["Лучше синица", "в руках", "чем", "журавль", "в небе"] },
    { stage: 2, text: "Кто хочет много знать, тому надо мало спать.", parts: ["Кто хочет", "много знать", "тому", "надо", "мало спать"] },
    { stage: 2, text: "Сколько ни говори халва — во рту слаще не станет.", parts: ["Сколько ни говори", "халва", "во рту", "слаще", "не станет"] }
  ];

  var STORAGE_PROGRESS = "vspominayka-progress";
  var STORAGE_A11Y = "vspominayka-a11y";
  var STORAGE_SOUND = "soundEnabled";

  var home = document.getElementById("screen-home");
  var game = document.getElementById("screen-game");
  var memoryScreen = document.getElementById("screen-memory");
  var oddScreen = document.getElementById("screen-odd");
  var gastroScreen = document.getElementById("screen-gastro");
  var piecesEl = document.getElementById("pieces");
  var answerEl = document.getElementById("answer-row");
  var placeholderEl = document.getElementById("answer-placeholder");
  var feedbackEl = document.getElementById("game-feedback");
  var successEl = document.getElementById("success-block");
  var successQuote = document.getElementById("success-quote");
  var successCount = document.getElementById("success-count");
  var progressEl = document.getElementById("daily-progress");
  var stageEl = document.getElementById("game-stage");
  var hintBtn = document.getElementById("hint-btn");
  var a11yToggle = document.getElementById("a11y-toggle");
  var a11yMenu = document.getElementById("a11y-menu");
  var soundToggle = document.getElementById("sound-toggle");
  var gardenSoundBtn = document.getElementById("garden-sound");

  var SOUND_FILES = {
    garden: "assets/sounds/garden.wav",
    click: "assets/sounds/click.wav",
    correct: "assets/sounds/correct.wav",
    "try-again": "assets/sounds/try-again.wav",
    page: "assets/sounds/page.wav",
    "cash-register": "assets/sounds/cash-register.wav"
  };
  var soundPlayers = {};
  var gardenPlayer = null;
  var activeSfx = null;
  var soundEnabled = false;

  function loadSoundEnabled() {
    try {
      return localStorage.getItem(STORAGE_SOUND) === "true";
    } catch (error) {
      return false;
    }
  }

  function saveSoundEnabled(value) {
    try {
      localStorage.setItem(STORAGE_SOUND, value ? "true" : "false");
    } catch (error) {}
  }

  function makeAudio(src) {
    try {
      var audio = new Audio(src);
      audio.preload = "auto";
      audio.addEventListener("error", function () {});
      return audio;
    } catch (error) {
      return null;
    }
  }

  function stopSfx() {
    if (!activeSfx) {
      return;
    }
    try {
      activeSfx.pause();
      activeSfx.currentTime = 0;
    } catch (error) {}
    activeSfx = null;
  }

  function playSound(name, volume) {
    if (!soundEnabled) {
      return;
    }
    stopSfx();
    if (!soundPlayers[name]) {
      soundPlayers[name] = makeAudio(SOUND_FILES[name]);
    }
    var audio = soundPlayers[name];
    if (!audio) {
      return;
    }
    try {
      audio.volume = volume;
      audio.currentTime = 0;
      activeSfx = audio;
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {});
      }
    } catch (error) {}
  }

  function stopGarden() {
    if (!gardenPlayer) {
      return;
    }
    try {
      gardenPlayer.pause();
      gardenPlayer.currentTime = 0;
    } catch (error) {}
  }

  function startGarden() {
    if (!soundEnabled || !home || home.hidden) {
      stopGarden();
      return;
    }
    if (!gardenPlayer) {
      gardenPlayer = makeAudio(SOUND_FILES.garden);
      if (gardenPlayer) {
        gardenPlayer.loop = true;
      }
    }
    if (!gardenPlayer) {
      return;
    }
    try {
      gardenPlayer.volume = 0.15;
      var playPromise = gardenPlayer.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {});
      }
    } catch (error) {}
  }

  function syncSoundButton() {
    var on = soundEnabled;
    if (soundToggle) {
      soundToggle.textContent = on ? "🔊 Звук" : "🔇 Звук";
      soundToggle.setAttribute("aria-pressed", on ? "true" : "false");
      soundToggle.setAttribute("aria-label", on ? "Выключить звук" : "Включить звук");
      soundToggle.classList.toggle("is-on", on);
    }
    if (gardenSoundBtn) {
      gardenSoundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      gardenSoundBtn.setAttribute("aria-label", on ? "Выключить звуки сада" : "Включить звуки сада");
      gardenSoundBtn.classList.toggle("is-on", on);
    }
  }

  function setSoundEnabled(value) {
    soundEnabled = !!value;
    saveSoundEnabled(soundEnabled);
    syncSoundButton();
    if (soundEnabled) {
      startGarden();
    } else {
      stopSfx();
      stopGarden();
    }
  }

  var current = [];
  var currentText = "";
  var currentId = -1;
  var nextIndex = 0;
  var usedByStage = { 0: [], 1: [], 2: [] };
  var feedbackTimer = 0;
  var hintTimer = 0;
  var roundActive = false;

  function todayKey() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function defaultProgress() {
    return { date: todayKey(), count: 0, stage: 0, stageWins: 0 };
  }

  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || "{}");
      var next = {
        date: saved.date || todayKey(),
        count: Number(saved.count) || 0,
        stage: Math.min(2, Math.max(0, Number(saved.stage) || 0)),
        stageWins: Number(saved.stageWins) || 0
      };
      if (next.date !== todayKey()) {
        next.date = todayKey();
        next.count = 0;
      }
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
      return next;
    } catch (error) {
      return defaultProgress();
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(data));
    } catch (error) {}
  }

  function renderProgress() {
    var saved = loadProgress();
    var text = "Сегодня собрано: " + saved.count;
    progressEl.textContent = text;
    successCount.textContent = text;
    stageEl.textContent = STAGE_LABELS[saved.stage];
  }

  function loadA11y() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_A11Y) || "{}");
    } catch (error) {
      return {};
    }
  }

  function applyA11y() {
    var settings = loadA11y();
    var size = settings.textSize || "normal";
    document.documentElement.setAttribute("data-text", size);
    document.documentElement.setAttribute(
      "data-contrast",
      settings.contrast ? "high" : "normal"
    );

    a11yMenu.querySelectorAll("[data-text-size]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-text-size") === size);
    });
    document.getElementById("contrast-toggle").classList.toggle("is-active", !!settings.contrast);
    document.getElementById("contrast-toggle").setAttribute("aria-pressed", settings.contrast ? "true" : "false");
  }

  function saveA11y(next) {
    try {
      localStorage.setItem(STORAGE_A11Y, JSON.stringify(next));
    } catch (error) {}
    applyA11y();
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function proverbIndexes(stage) {
    var list = [];
    for (var i = 0; i < PROVERBS.length; i += 1) {
      if (PROVERBS[i].stage === stage) {
        list.push(i);
      }
    }
    return list;
  }

  function pickProverb() {
    var saved = loadProgress();
    var stage = saved.stage;
    var used = usedByStage[stage];
    var available = proverbIndexes(stage).filter(function (index) {
      return used.indexOf(index) === -1;
    });

    if (!available.length) {
      usedByStage[stage] = [];
      available = proverbIndexes(stage).filter(function (index) {
        return index !== currentId;
      });
      if (!available.length) {
        available = proverbIndexes(stage);
      }
    }

    var index = available[Math.floor(Math.random() * available.length)];
    usedByStage[stage].push(index);
    currentId = index;
    currentText = PROVERBS[index].text.replace(/\.\s*$/, "");
    return PROVERBS[index].parts.slice();
  }

  function setFeedback(text) {
    window.clearTimeout(feedbackTimer);
    feedbackEl.textContent = text || "";
    if (text) {
      feedbackTimer = window.setTimeout(function () {
        feedbackEl.textContent = "";
      }, 2800);
    }
  }

  function showPlaceholder(show) {
    placeholderEl.hidden = !show;
  }

  function startRound() {
    current = pickProverb();
    nextIndex = 0;
    roundActive = true;
    answerEl.querySelectorAll(".answer-chip").forEach(function (chip) {
      chip.remove();
    });
    piecesEl.innerHTML = "";
    successEl.hidden = true;
    piecesEl.hidden = false;
    answerEl.hidden = false;
    hintBtn.disabled = false;
    showPlaceholder(true);
    setFeedback("");
    renderProgress();

    shuffle(
      current.map(function (text, index) {
        return { text: text, index: index };
      })
    ).forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "piece";
      button.textContent = item.text;
      button.dataset.index = String(item.index);
      button.addEventListener("click", function () {
        onPieceClick(button, item.index);
      });
      piecesEl.appendChild(button);
    });
  }

  function onPieceClick(button, index) {
    if (!roundActive || button.classList.contains("is-used")) {
      return;
    }

    playSound("click", 0.18);

    if (index === nextIndex) {
      button.classList.remove("is-hint");
      button.classList.add("is-used");
      button.disabled = true;
      showPlaceholder(false);
      var chip = document.createElement("span");
      chip.className = "answer-chip";
      chip.textContent = current[index];
      answerEl.appendChild(chip);
      nextIndex += 1;
      setFeedback("");

      if (nextIndex >= current.length) {
        finishRound();
      }
      return;
    }

    playSound("try-again", 0.22);
    button.classList.remove("is-shake");
    void button.offsetWidth;
    button.classList.add("is-shake");
    setFeedback("Почти получилось. Попробуйте другую часть 🌿");
  }

  function finishRound() {
    playSound("correct", 0.28);
    roundActive = false;
    hintBtn.disabled = true;
    var saved = loadProgress();
    saved.count += 1;
    saved.stageWins += 1;
    if (saved.stage < 2 && saved.stageWins >= 3) {
      saved.stage += 1;
      saved.stageWins = 0;
    }
    saveProgress(saved);
    renderProgress();

    successQuote.textContent = "«" + currentText + "»";
    piecesEl.hidden = true;
    answerEl.hidden = true;
    successEl.hidden = false;
  }

  function giveHint() {
    if (!roundActive) {
      return;
    }
    var next = piecesEl.querySelector('[data-index="' + nextIndex + '"]');
    if (!next || next.classList.contains("is-used")) {
      return;
    }
    piecesEl.querySelectorAll(".piece.is-hint").forEach(function (piece) {
      piece.classList.remove("is-hint");
    });
    next.classList.remove("is-hint");
    void next.offsetWidth;
    next.classList.add("is-hint");
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(function () {
      next.classList.remove("is-hint");
    }, 2000);
  }

  function showHome() {
    stopMemoryRound();
    game.hidden = true;
    memoryScreen.hidden = true;
    oddScreen.hidden = true;
    gastroScreen.hidden = true;
    home.hidden = false;
    startGarden();
  }

  function showGame() {
    stopGarden();
    stopMemoryRound();
    home.hidden = true;
    memoryScreen.hidden = true;
    oddScreen.hidden = true;
    gastroScreen.hidden = true;
    game.hidden = false;
    renderProgress();
    startRound();
  }

  document.getElementById("open-memories").addEventListener("click", showGame);
  document.getElementById("back-home").addEventListener("click", showHome);
  document.getElementById("next-proverb").addEventListener("click", function () {
    playSound("page", 0.22);
    startRound();
  });
  hintBtn.addEventListener("click", giveHint);

  var MEMORY_ITEMS = [
    { id: "apple", name: "яблоко", image: "assets/images/items/apple.jpg" },
    { id: "book", name: "книга", image: "assets/images/items/book.jpg" },
    { id: "camera", name: "фотоаппарат", image: "assets/images/items/camera.jpg" },
    { id: "candle", name: "свеча", image: "assets/images/items/candle.jpg" },
    { id: "clock", name: "часы", image: "assets/images/items/clock.jpg" },
    { id: "comb", name: "расчёска", image: "assets/images/items/comb.jpg" },
    { id: "cup", name: "чашка", image: "assets/images/items/cup.jpg" },
    { id: "flowers", name: "цветы", image: "assets/images/items/flowers.jpg" },
    { id: "glasses", name: "очки", image: "assets/images/items/glasses.jpg" },
    { id: "keys", name: "ключи", image: "assets/images/items/keys.jpg" },
    { id: "letter", name: "письмо", image: "assets/images/items/letter.jpg" },
    { id: "pencil", name: "карандаш", image: "assets/images/items/pencil.jpg" },
    { id: "plate", name: "тарелка", image: "assets/images/items/plate.jpg" },
    { id: "radio", name: "радиоприёмник", image: "assets/images/items/radio.jpg" },
    { id: "scarf", name: "шарф", image: "assets/images/items/scarf.jpg" },
    { id: "spoon", name: "ложка", image: "assets/images/items/spoon.jpg" },
    { id: "teapot", name: "чайник", image: "assets/images/items/teapot.jpg" },
    { id: "telephone", name: "телефон", image: "assets/images/items/telephone.jpg" },
    { id: "wallet", name: "кошелёк", image: "assets/images/items/wallet.jpg" },
    { id: "yarn", name: "клубок", image: "assets/images/items/yarn.jpg" }
  ];

  var STORAGE_MEMORY = "vspominayka-memory";
  var MEMORY_COUNTS = [5, 6, 7];
  var memoryGrid = document.getElementById("memory-grid");
  var memoryWait = document.getElementById("memory-wait");
  var memoryBarFill = document.getElementById("memory-bar-fill");
  var memoryQuestion = document.getElementById("memory-question");
  var memoryChoices = document.getElementById("memory-choices");
  var memorySuccess = document.getElementById("memory-success");
  var memoryFeedback = document.getElementById("memory-feedback");
  var memorySubtitle = document.getElementById("memory-subtitle");
  var memoryStageEl = document.getElementById("memory-stage");
  var memoryProgressEl = document.getElementById("memory-progress");
  var memoryLongerBtn = document.getElementById("memory-longer");
  var memoryTimer = 0;
  var memoryPauseTimer = 0;
  var memoryMissing = null;
  var memoryGuessing = false;

  function defaultMemory() {
    return { date: todayKey(), count: 0, stage: 0, stageWins: 0, longer: false };
  }

  function loadMemory() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_MEMORY) || "{}");
      var next = {
        date: saved.date || todayKey(),
        count: Number(saved.count) || 0,
        stage: Math.min(2, Math.max(0, Number(saved.stage) || 0)),
        stageWins: Number(saved.stageWins) || 0,
        longer: !!saved.longer
      };
      if (next.date !== todayKey()) {
        next.date = todayKey();
        next.count = 0;
      }
      localStorage.setItem(STORAGE_MEMORY, JSON.stringify(next));
      return next;
    } catch (error) {
      return defaultMemory();
    }
  }

  function saveMemory(data) {
    try {
      localStorage.setItem(STORAGE_MEMORY, JSON.stringify(data));
    } catch (error) {}
  }

  function renderMemoryProgress() {
    var saved = loadMemory();
    memoryProgressEl.textContent = "Сегодня сыграно: " + saved.count;
    memoryStageEl.textContent = STAGE_LABELS[saved.stage];
    memoryLongerBtn.classList.toggle("is-active", saved.longer);
  }

  function stopMemoryRound() {
    window.clearTimeout(memoryTimer);
    window.clearTimeout(memoryPauseTimer);
    memoryGuessing = false;
  }

  function appendItemVisual(parent, item) {
    var frame = document.createElement("span");
    frame.className = "memory-frame";
    var img = document.createElement("img");
    img.className = "memory-pic";
    img.alt = item.name;
    img.src = item.image;
    img.addEventListener("error", function () {
      img.hidden = true;
    });
    frame.appendChild(img);
    var name = document.createElement("span");
    name.className = "memory-name";
    name.textContent = item.name;
    parent.appendChild(frame);
    parent.appendChild(name);
  }

  function renderMemoryCards(list) {
    memoryGrid.innerHTML = "";
    list.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "memory-item";
      appendItemVisual(card, item);
      memoryGrid.appendChild(card);
    });
  }

  function startMemoryRound() {
    stopMemoryRound();
    var saved = loadMemory();
    var count = MEMORY_COUNTS[saved.stage];
    var shown = shuffle(MEMORY_ITEMS).slice(0, count);
    memoryMissing = shown[Math.floor(Math.random() * shown.length)];
    var waitMs = saved.longer ? 8000 : 5000;

    memorySubtitle.textContent = "Запомните предметы";
    memoryFeedback.textContent = "";
    memoryQuestion.hidden = true;
    memorySuccess.hidden = true;
    memoryWait.hidden = false;
    memoryChoices.innerHTML = "";
    renderMemoryProgress();
    renderMemoryCards(shown);

    memoryBarFill.style.animation = "none";
    void memoryBarFill.offsetWidth;
    memoryBarFill.style.animation = "memoryBar " + waitMs + "ms linear forwards";

    memoryTimer = window.setTimeout(function () {
      Array.prototype.forEach.call(memoryGrid.children, function (card) {
        card.classList.add("is-fading");
      });
      memoryWait.hidden = true;
      memoryPauseTimer = window.setTimeout(function () {
        showMemoryQuestion(shown);
      }, 550);
    }, waitMs);
  }

  function showMemoryQuestion(shown) {
    var remaining = shown.filter(function (item) {
      return item.id !== memoryMissing.id;
    });
    memorySubtitle.textContent = "";
    memoryFeedback.textContent = "";
    renderMemoryCards(remaining);
    Array.prototype.forEach.call(memoryGrid.children, function (card) {
      card.classList.add("is-fading");
    });
    window.setTimeout(function () {
      Array.prototype.forEach.call(memoryGrid.children, function (card) {
        card.classList.remove("is-fading");
      });
    }, 40);

    var shownIds = shown.map(function (item) {
      return item.id;
    });
    var others = MEMORY_ITEMS.filter(function (item) {
      return shownIds.indexOf(item.id) === -1;
    });
    var choices = shuffle(others).slice(0, 2).concat(memoryMissing);
    memoryChoices.innerHTML = "";
    shuffle(choices).forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "memory-choice";
      appendItemVisual(button, item);
      button.addEventListener("click", function () {
        onMemoryChoice(button, item);
      });
      memoryChoices.appendChild(button);
    });
    memoryQuestion.hidden = false;
    memoryGuessing = true;
  }

  function onMemoryChoice(button, item) {
    if (!memoryGuessing) {
      return;
    }
    playSound("click", 0.18);
    if (item.id === memoryMissing.id) {
      playSound("correct", 0.28);
      memoryGuessing = false;
      var saved = loadMemory();
      saved.count += 1;
      saved.stageWins += 1;
      if (saved.stage < 2 && saved.stageWins >= 3) {
        saved.stage += 1;
        saved.stageWins = 0;
      }
      saveMemory(saved);
      renderMemoryProgress();
      memoryQuestion.hidden = true;
      memorySuccess.hidden = false;
      return;
    }
    playSound("try-again", 0.22);
    button.classList.remove("is-shake");
    void button.offsetWidth;
    button.classList.add("is-shake");
    memoryFeedback.textContent = "Попробуйте ещё раз 🌿";
  }

  function showMemoryGame() {
    stopGarden();
    stopMemoryRound();
    home.hidden = true;
    game.hidden = true;
    oddScreen.hidden = true;
    gastroScreen.hidden = true;
    memoryScreen.hidden = false;
    startMemoryRound();
  }

  document.getElementById("open-memory").addEventListener("click", showMemoryGame);
  document.getElementById("memory-back").addEventListener("click", showHome);
  document.getElementById("memory-next").addEventListener("click", function () {
    playSound("page", 0.22);
    startMemoryRound();
  });
  memoryLongerBtn.addEventListener("click", function () {
    var saved = loadMemory();
    saved.longer = !saved.longer;
    saveMemory(saved);
    renderMemoryProgress();
  });

  var ODD_TASKS = [
    { stage: 0, category: "Посуда", items: ["cup", "teapot", "plate", "camera"], oddItem: "camera", hint: "Три предмета ставят на стол, когда накрывают к еде.", explanation: "Фотоаппарат лишний — остальные предметы относятся к посуде." },
    { stage: 0, category: "Чтение и письмо", items: ["book", "letter", "pencil", "apple"], oddItem: "apple", hint: "Три предмета связаны с книгами и письмами.", explanation: "Яблоко лишнее — остальные предметы нужны для чтения и письма." },
    { stage: 0, category: "Личные вещи", items: ["glasses", "wallet", "scarf", "spoon"], oddItem: "spoon", hint: "Три предмета обычно берут с собой, когда выходят из дома.", explanation: "Ложка лишняя — остальные предметы относятся к личным вещам." },
    { stage: 0, category: "Домашние приборы", items: ["clock", "radio", "telephone", "flowers"], oddItem: "flowers", hint: "Три предмета стоят дома и помогают узнать время или услышать голос и новости.", explanation: "Цветы лишние — остальные предметы относятся к домашним приборам." },
    { stage: 0, category: "Посуда", items: ["cup", "spoon", "plate", "keys"], oddItem: "keys", hint: "Три предмета нужны во время еды.", explanation: "Ключи лишние — остальные предметы относятся к посуде." },
    { stage: 0, category: "Чтение и письмо", items: ["book", "letter", "pencil", "yarn"], oddItem: "yarn", hint: "Три предмета связаны с чтением и письмом.", explanation: "Клубок лишний — остальные предметы нужны для чтения и письма." },
    { stage: 0, category: "Личные вещи", items: ["glasses", "wallet", "keys", "apple"], oddItem: "apple", hint: "Три предмета обычно лежат в сумке или кармане.", explanation: "Яблоко лишнее — остальные предметы носят с собой." },
    { stage: 0, category: "Чаепитие", items: ["teapot", "cup", "spoon", "comb"], oddItem: "comb", hint: "Три предмета нужны, когда пьют чай.", explanation: "Расчёска лишняя — остальные предметы относятся к чаепитию." },
    { stage: 0, category: "Домашние приборы", items: ["radio", "telephone", "clock", "scarf"], oddItem: "scarf", hint: "Три предмета стоят дома и ими пользуются каждый день для связи и времени.", explanation: "Шарф лишний — остальные предметы относятся к домашним приборам." },

    { stage: 1, category: "За столом", items: ["plate", "spoon", "cup", "wallet"], oddItem: "wallet", hint: "Три предмета ставят, когда садятся обедать.", explanation: "Кошелёк лишний — остальные предметы нужны за столом во время еды." },
    { stage: 1, category: "Чаепитие", items: ["cup", "teapot", "spoon", "pencil"], oddItem: "pencil", hint: "Три предмета нужны, чтобы заварить и выпить чай.", explanation: "Карандаш лишний — остальные предметы относятся к чаепитию." },
    { stage: 1, category: "С собой", items: ["keys", "wallet", "glasses", "plate"], oddItem: "plate", hint: "Три предмета часто берут с собой из дома.", explanation: "Тарелка лишняя — остальные предметы носят с собой." },
    { stage: 1, category: "Чтение и письмо", items: ["book", "glasses", "pencil", "spoon"], oddItem: "spoon", hint: "Три предмета помогают читать или делать записи.", explanation: "Ложка лишняя — остальные предметы связаны с чтением и письмом." },
    { stage: 1, category: "Домашние приборы", items: ["radio", "telephone", "clock", "comb"], oddItem: "comb", hint: "Три предмета стоят в комнате и служат для связи или времени.", explanation: "Расчёска лишняя — остальные предметы относятся к домашним приборам." },
    { stage: 1, category: "Кухонная посуда", items: ["teapot", "plate", "cup", "scarf"], oddItem: "scarf", hint: "Три предмета держат на кухне.", explanation: "Шарф лишний — остальные предметы относятся к кухонной посуде." },
    { stage: 1, category: "Личные вещи", items: ["scarf", "glasses", "wallet", "candle"], oddItem: "candle", hint: "Три предмета относятся к одежде и личным вещам.", explanation: "Свеча лишняя — остальные предметы носят на себе или с собой." },
    { stage: 1, category: "Чтение и письмо", items: ["letter", "pencil", "book", "telephone"], oddItem: "telephone", hint: "Три предмета связаны с бумагой и словами на бумаге.", explanation: "Телефон лишний — остальные предметы нужны для чтения и письма." },
    { stage: 1, category: "Посуда", items: ["plate", "teapot", "spoon", "flowers"], oddItem: "flowers", hint: "Три предмета ставят на стол к еде или чаю.", explanation: "Цветы лишние — остальные предметы относятся к посуде." },

    { stage: 2, category: "Связь", items: ["telephone", "letter", "radio", "clock"], oddItem: "clock", hint: "Три предмета помогают передать слово или новость другому человеку.", explanation: "Часы лишние — остальные предметы служат для связи и сообщений." },
    { stage: 2, category: "Техника", items: ["radio", "telephone", "camera", "candle"], oddItem: "candle", hint: "Три предмета работают от электричества или батареек.", explanation: "Свеча лишняя — остальные предметы относятся к технике." },
    { stage: 2, category: "Внешний вид", items: ["comb", "scarf", "glasses", "spoon"], oddItem: "spoon", hint: "Три предмета связаны с тем, как человек выглядит.", explanation: "Ложка лишняя — остальные предметы относятся к внешнему виду." },
    { stage: 2, category: "Кухня", items: ["teapot", "plate", "spoon", "glasses"], oddItem: "glasses", hint: "Три предмета используют на кухне, когда готовят или накрывают стол.", explanation: "Очки лишние — остальные предметы относятся к кухне." },
    { stage: 2, category: "Бумага и слова", items: ["book", "letter", "pencil", "keys"], oddItem: "keys", hint: "Три предмета связаны со словами на бумаге.", explanation: "Ключи лишние — остальные предметы нужны для чтения и письма." },
    { stage: 2, category: "Домашние приборы", items: ["clock", "radio", "telephone", "yarn"], oddItem: "yarn", hint: "Три предмета стоят дома и помогают узнать время или услышать новости и голос.", explanation: "Клубок лишний — остальные предметы относятся к домашним приборам." },
    { stage: 2, category: "Столовая посуда", items: ["cup", "plate", "spoon", "book"], oddItem: "book", hint: "Три предмета нужны во время еды.", explanation: "Книга лишняя — остальные предметы относятся к столовой посуде." },
    { stage: 2, category: "С собой", items: ["keys", "wallet", "glasses", "flowers"], oddItem: "flowers", hint: "Три предмета обычно кладут в сумку.", explanation: "Цветы лишние — остальные предметы носят с собой." },
    { stage: 2, category: "За столом", items: ["plate", "cup", "spoon", "candle"], oddItem: "candle", hint: "Три предмета нужны за обеденным столом.", explanation: "Свеча лишняя — остальные предметы относятся к посуде." }
  ];

  var STORAGE_ODD = "vspominayka-odd";
  var oddGrid = document.getElementById("odd-grid");
  var oddFeedback = document.getElementById("odd-feedback");
  var oddSuccess = document.getElementById("odd-success");
  var oddExplain = document.getElementById("odd-explain");
  var oddStageEl = document.getElementById("odd-stage");
  var oddProgressEl = document.getElementById("odd-progress");
  var oddHintBtn = document.getElementById("odd-hint");
  var oddCurrent = null;
  var oddGuessing = false;
  var oddUsed = { 0: [], 1: [], 2: [] };
  var oddLast = -1;

  function defaultOdd() {
    return { date: todayKey(), count: 0, stage: 0, stageWins: 0 };
  }

  function loadOdd() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_ODD) || "{}");
      var next = {
        date: saved.date || todayKey(),
        count: Number(saved.count) || 0,
        stage: Math.min(2, Math.max(0, Number(saved.stage) || 0)),
        stageWins: Number(saved.stageWins) || 0
      };
      if (next.date !== todayKey()) {
        next.date = todayKey();
        next.count = 0;
      }
      localStorage.setItem(STORAGE_ODD, JSON.stringify(next));
      return next;
    } catch (error) {
      return defaultOdd();
    }
  }

  function saveOdd(data) {
    try {
      localStorage.setItem(STORAGE_ODD, JSON.stringify(data));
    } catch (error) {}
  }

  function renderOddProgress() {
    var saved = loadOdd();
    oddProgressEl.textContent = "Сегодня найдено: " + saved.count;
    oddStageEl.textContent = STAGE_LABELS[saved.stage];
  }

  function getItemById(id) {
    for (var i = 0; i < MEMORY_ITEMS.length; i += 1) {
      if (MEMORY_ITEMS[i].id === id) {
        return MEMORY_ITEMS[i];
      }
    }
    return null;
  }

  function oddIndexes(stage) {
    var list = [];
    for (var i = 0; i < ODD_TASKS.length; i += 1) {
      if (ODD_TASKS[i].stage === stage) {
        list.push(i);
      }
    }
    return list;
  }

  function pickOddTask() {
    var saved = loadOdd();
    var stage = saved.stage;
    var used = oddUsed[stage];
    var available = oddIndexes(stage).filter(function (index) {
      return used.indexOf(index) === -1;
    });
    if (!available.length) {
      oddUsed[stage] = [];
      available = oddIndexes(stage).filter(function (index) {
        return index !== oddLast;
      });
      if (!available.length) {
        available = oddIndexes(stage);
      }
    }
    var index = available[Math.floor(Math.random() * available.length)];
    oddUsed[stage].push(index);
    oddLast = index;
    return ODD_TASKS[index];
  }

  function startOddRound() {
    oddCurrent = pickOddTask();
    oddGuessing = true;
    oddFeedback.textContent = "";
    oddSuccess.hidden = true;
    oddHintBtn.disabled = false;
    renderOddProgress();
    oddGrid.innerHTML = "";
    shuffle(oddCurrent.items.slice()).forEach(function (id) {
      var item = getItemById(id);
      if (!item) {
        return;
      }
      var button = document.createElement("button");
      button.type = "button";
      button.className = "odd-item";
      button.dataset.id = id;
      appendItemVisual(button, item);
      button.addEventListener("click", function () {
        onOddChoice(button, id);
      });
      oddGrid.appendChild(button);
    });
  }

  function onOddChoice(button, id) {
    if (!oddGuessing) {
      return;
    }
    playSound("click", 0.18);
    if (id === oddCurrent.oddItem) {
      playSound("correct", 0.28);
      oddGuessing = false;
      oddHintBtn.disabled = true;
      var saved = loadOdd();
      saved.count += 1;
      saved.stageWins += 1;
      if (saved.stage < 2 && saved.stageWins >= 4) {
        saved.stage += 1;
        saved.stageWins = 0;
      }
      saveOdd(saved);
      renderOddProgress();
      Array.prototype.forEach.call(oddGrid.children, function (card) {
        card.classList.add("is-done");
        if (card.dataset.id === oddCurrent.oddItem) {
          card.classList.add("is-odd");
        } else {
          card.classList.add("is-match");
        }
      });
      oddExplain.textContent = oddCurrent.explanation;
      oddSuccess.hidden = false;
      oddFeedback.textContent = "";
      return;
    }
    playSound("try-again", 0.22);
    button.classList.remove("is-shake");
    void button.offsetWidth;
    button.classList.add("is-shake");
    oddFeedback.textContent = "Посмотрите ещё раз 🌿";
  }

  function showOddHint() {
    if (!oddGuessing || !oddCurrent) {
      return;
    }
    oddFeedback.textContent = oddCurrent.hint;
  }

  function showOddGame() {
    stopGarden();
    stopMemoryRound();
    home.hidden = true;
    game.hidden = true;
    memoryScreen.hidden = true;
    gastroScreen.hidden = true;
    oddScreen.hidden = false;
    startOddRound();
  }

  document.getElementById("open-odd").addEventListener("click", showOddGame);
  document.getElementById("odd-back").addEventListener("click", showHome);
  document.getElementById("odd-next").addEventListener("click", function () {
    playSound("page", 0.22);
    startOddRound();
  });
  oddHintBtn.addEventListener("click", showOddHint);

  var GASTRO_ITEMS = [
    { id: "baton", name: "Батон", image: "assets/images/gastronom/baton.jpg", price: 25 },
    { id: "milk", name: "Молоко", image: "assets/images/gastronom/milk.jpg", price: 30 },
    { id: "kefir", name: "Кефир", image: "assets/images/gastronom/kefir.jpg", price: 28 },
    { id: "sour_cream", name: "Сметана", image: "assets/images/gastronom/sour_cream.jpg", price: 36 },
    { id: "butter", name: "Сливочное масло", image: "assets/images/gastronom/butter.jpg", price: 62 },
    { id: "cheese", name: "Сыр", image: "assets/images/gastronom/cheese.jpg", price: 90 },
    { id: "doctor_sausage", name: "Докторская колбаса", image: "assets/images/gastronom/doctor_sausage.jpg", price: 80 },
    { id: "sugar", name: "Сахар", image: "assets/images/gastronom/sugar.jpg", price: 78 },
    { id: "buckwheat", name: "Гречневая крупа", image: "assets/images/gastronom/buckwheat.jpg", price: 70 },
    { id: "rice", name: "Рис", image: "assets/images/gastronom/rice.jpg", price: 68 },
    { id: "sunflower_oil", name: "Подсолнечное масло", image: "assets/images/gastronom/sunflower_oil.jpg", price: 54 },
    { id: "green_peas", name: "Зелёный горошек", image: "assets/images/gastronom/green_peas.jpg", price: 42 },
    { id: "condensed_milk", name: "Сгущённое молоко", image: "assets/images/gastronom/condensed_milk.jpg", price: 55 },
    { id: "jam", name: "Варенье", image: "assets/images/gastronom/jam.jpg", price: 48 },
    { id: "tea", name: "Чай", image: "assets/images/gastronom/tea.jpg", price: 52 }
  ];

  var GASTRO_REMEMBER = [
    "Такие продукты можно было увидеть на прилавках гастрономов.",
    "Стеклянные бутылки и бумажная упаковка хорошо знакомы многим поколениям.",
    "Покупки часто считали спокойно, не торопясь.",
    "Хлеб, молоко и крупы были привычной частью домашней кухни."
  ];

  var STORAGE_GASTRO = "vspominayka-gastro";
  var gastroGivenEl = document.getElementById("gastro-given");
  var gastroProductsEl = document.getElementById("gastro-products");
  var gastroQuestionEl = document.getElementById("gastro-question");
  var gastroChoicesEl = document.getElementById("gastro-choices");
  var gastroSuccess = document.getElementById("gastro-success");
  var gastroCalc = document.getElementById("gastro-calc");
  var gastroRemember = document.getElementById("gastro-remember");
  var gastroFeedback = document.getElementById("gastro-feedback");
  var gastroStageEl = document.getElementById("gastro-stage");
  var gastroProgressEl = document.getElementById("gastro-progress");
  var gastroHintBtn = document.getElementById("gastro-hint");
  var gastroTask = null;
  var gastroGuessing = false;
  var gastroLastKey = "";

  function formatMoney(kop) {
    kop = kop | 0;
    var rub = (kop / 100) | 0;
    var coins = kop - rub * 100;
    if (rub === 0) {
      return coins + " коп.";
    }
    if (coins === 0) {
      return rub + " руб.";
    }
    return rub + " руб. " + coins + " коп.";
  }

  function givenPhrase(kop) {
    if (kop === 100) {
      return "1 рубля";
    }
    if (kop === 200) {
      return "2 рубля";
    }
    return formatMoney(kop);
  }

  function moneySum(items) {
    var total = 0;
    var i;
    for (i = 0; i < items.length; i += 1) {
      total += items[i].price;
    }
    return total;
  }

  function itemNames(items) {
    var names = items.map(function (item) {
      return item.name.toLowerCase();
    });
    if (names.length === 1) {
      return names[0];
    }
    if (names.length === 2) {
      return names[0] + " и " + names[1];
    }
    return names[0] + ", " + names[1] + " и " + names[2];
  }

  function moneyOptions(correct) {
    var used = {};
    used[correct] = true;
    var list = [correct];
    var deltas = [10, 20, 5, 15, 25, 30, 8, 12, 40, -10, -20, -5, -15, 50];
    var i;
    var value;
    for (i = 0; i < deltas.length && list.length < 3; i += 1) {
      value = correct + deltas[i];
      if (value > 0 && !used[value]) {
        used[value] = true;
        list.push(value);
      }
    }
    value = 1;
    while (list.length < 3) {
      var extra = correct + value * 7;
      if (extra > 0 && !used[extra]) {
        used[extra] = true;
        list.push(extra);
      }
      value += 1;
    }
    return shuffle(list);
  }

  function pickGastroItems(count, filterFn) {
    var pool = shuffle(GASTRO_ITEMS.slice());
    var picked = [];
    var i;
    for (i = 0; i < pool.length && picked.length < count; i += 1) {
      if (!filterFn || filterFn(pool[i], picked)) {
        picked.push(pool[i]);
      }
    }
    return picked;
  }

  function defaultGastro() {
    return { date: todayKey(), count: 0, stage: 0, stageWins: 0 };
  }

  function loadGastro() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_GASTRO) || "{}");
      var next = {
        date: saved.date || todayKey(),
        count: Number(saved.count) || 0,
        stage: Math.min(2, Math.max(0, Number(saved.stage) || 0)),
        stageWins: Number(saved.stageWins) || 0
      };
      if (next.date !== todayKey()) {
        next.date = todayKey();
        next.count = 0;
      }
      localStorage.setItem(STORAGE_GASTRO, JSON.stringify(next));
      return next;
    } catch (error) {
      return defaultGastro();
    }
  }

  function saveGastro(data) {
    try {
      localStorage.setItem(STORAGE_GASTRO, JSON.stringify(data));
    } catch (error) {}
  }

  function renderGastroProgress() {
    var saved = loadGastro();
    gastroProgressEl.textContent = "Сегодня покупок: " + saved.count;
    gastroStageEl.textContent = STAGE_LABELS[saved.stage];
  }

  function makeChangeTask(items, given) {
    var total = moneySum(items);
    var answer = given - total;
    return {
      type: "change",
      items: items,
      given: given,
      answer: answer,
      options: moneyOptions(answer),
      givenText: "Вы дали: " + formatMoney(given),
      question: "Сколько сдачи?",
      hint: "В одном рубле 100 копеек. Вычтите стоимость покупки.",
      calc: formatMoney(given) + " − " + formatMoney(total) + " = " + formatMoney(answer),
      key: "change:" + items.map(function (item) { return item.id; }).join("+")
    };
  }

  function makeSumTask(items) {
    var total = moneySum(items);
    var parts = items.map(function (item) {
      return formatMoney(item.price);
    });
    return {
      type: "sum",
      items: items,
      given: 0,
      answer: total,
      options: moneyOptions(total),
      givenText: "",
      question: "Сколько стоит покупка?",
      hint: items.length === 2 ? "Сначала сложите цены обоих товаров." : "Сложите цены всех товаров.",
      calc: parts.join(" + ") + " = " + formatMoney(total),
      key: "sum:" + items.map(function (item) { return item.id; }).join("+")
    };
  }

  function makeEnoughTask(items, given) {
    var total = moneySum(items);
    var ok = total <= given;
    return {
      type: "enough",
      items: items,
      given: given,
      answer: ok ? "yes" : "no",
      options: ["yes", "no"],
      givenText: "У вас " + (given === 100 ? "1 рубль" : formatMoney(given)),
      question: "Хватит ли на эту покупку?",
      hint: "Сравните стоимость покупки с суммой, которая у вас есть.",
      calc: "Покупка стоит " + formatMoney(total) + " — " + givenPhrase(given) + (ok ? " хватает." : " не хватает."),
      key: "enough:" + items.map(function (item) { return item.id; }).join("+") + ":" + given
    };
  }

  function makeRemainTask(items, given) {
    var total = moneySum(items);
    var left = given - total;
    var parts = items.map(function (item) {
      return formatMoney(item.price);
    });
    return {
      type: "remain",
      items: items,
      given: given,
      answer: left,
      options: moneyOptions(left),
      givenText: "Вы купили " + itemNames(items) + ". У вас было " + (given === 100 ? "1 рубль" : formatMoney(given)) + ".",
      question: "Сколько денег останется?",
      hint: "Сначала сложите цены, затем вычтите сумму из ваших денег.",
      calc: parts.join(" + ") + " = " + formatMoney(total) + "\n" + formatMoney(given) + " − " + formatMoney(total) + " = " + formatMoney(left),
      key: "remain:" + items.map(function (item) { return item.id; }).join("+")
    };
  }

  function buildGastroTask(stage) {
    var items;
    var total;
    var given;
    var task;
    var tries = 0;
    do {
      tries += 1;
      if (stage === 0) {
        items = pickGastroItems(1, function (item) {
          return item.price < 100;
        });
        task = makeChangeTask(items, 100);
      } else if (stage === 1) {
        items = pickGastroItems(2);
        total = moneySum(items);
        if ((tries % 2 === 0) && total < 200) {
          given = total < 100 ? 100 : 200;
          task = makeRemainTask(items, given);
        } else {
          task = makeSumTask(items);
        }
      } else if ((tries % 2 === 0)) {
        items = pickGastroItems(Math.random() < 0.5 ? 2 : 3);
        total = moneySum(items);
        if (total <= 100) {
          task = makeEnoughTask(items, 100);
        } else if (total <= 200 && Math.random() < 0.5) {
          task = makeEnoughTask(items, 200);
        } else {
          task = makeEnoughTask(items, 100);
        }
      } else {
        items = pickGastroItems(2);
        total = moneySum(items);
        given = total < 100 ? 100 : 200;
        if (given <= total) {
          task = makeSumTask(items);
        } else {
          task = makeRemainTask(items, given);
        }
      }
    } while (task.key === gastroLastKey && tries < 12);
    gastroLastKey = task.key;
    return task;
  }

  function renderGastroCard(item) {
    var card = document.createElement("article");
    card.className = "gastro-card";
    var frame = document.createElement("div");
    frame.className = "gastro-frame";
    var img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    img.addEventListener("error", function () {
      img.hidden = true;
    });
    frame.appendChild(img);
    var name = document.createElement("span");
    name.className = "gastro-card-name";
    name.textContent = item.name;
    var price = document.createElement("span");
    price.className = "gastro-card-price";
    price.textContent = formatMoney(item.price);
    card.appendChild(frame);
    card.appendChild(name);
    card.appendChild(price);
    return card;
  }

  function startGastroRound() {
    var saved = loadGastro();
    gastroTask = buildGastroTask(saved.stage);
    gastroGuessing = true;
    gastroFeedback.textContent = "";
    gastroSuccess.hidden = true;
    gastroHintBtn.disabled = false;
    renderGastroProgress();
    gastroGivenEl.textContent = gastroTask.givenText;
    gastroQuestionEl.textContent = gastroTask.question;
    gastroProductsEl.innerHTML = "";
    gastroTask.items.forEach(function (item) {
      gastroProductsEl.appendChild(renderGastroCard(item));
    });
    gastroChoicesEl.innerHTML = "";
    gastroTask.options.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "gastro-choice";
      if (gastroTask.type === "enough") {
        button.textContent = option === "yes" ? "Да" : "Нет";
        button.dataset.value = option;
      } else {
        button.textContent = formatMoney(option);
        button.dataset.value = String(option);
      }
      button.addEventListener("click", function () {
        onGastroChoice(button);
      });
      gastroChoicesEl.appendChild(button);
    });
  }

  function onGastroChoice(button) {
    if (!gastroGuessing) {
      return;
    }
    var value = gastroTask.type === "enough" ? button.dataset.value : Number(button.dataset.value);
    playSound("click", 0.18);
    if (value === gastroTask.answer) {
      playSound("cash-register", 0.28);
      gastroGuessing = false;
      gastroHintBtn.disabled = true;
      var saved = loadGastro();
      saved.count += 1;
      saved.stageWins += 1;
      if (saved.stage < 2 && saved.stageWins >= 4) {
        saved.stage += 1;
        saved.stageWins = 0;
      }
      saveGastro(saved);
      renderGastroProgress();
      gastroCalc.textContent = gastroTask.calc;
      if (saved.count % 2 === 0) {
        gastroRemember.hidden = false;
        gastroRemember.textContent = GASTRO_REMEMBER[(saved.count / 2 | 0) % GASTRO_REMEMBER.length];
      } else {
        gastroRemember.hidden = true;
        gastroRemember.textContent = "";
      }
      gastroChoicesEl.innerHTML = "";
      gastroSuccess.hidden = false;
      gastroFeedback.textContent = "";
      return;
    }
    playSound("try-again", 0.22);
    button.classList.remove("is-shake");
    void button.offsetWidth;
    button.classList.add("is-shake");
    gastroFeedback.textContent = "Посчитайте ещё раз 🌿";
  }

  function showGastroHint() {
    if (!gastroGuessing || !gastroTask) {
      return;
    }
    gastroFeedback.textContent = gastroTask.hint;
  }

  function showGastroGame() {
    stopGarden();
    stopMemoryRound();
    home.hidden = true;
    game.hidden = true;
    memoryScreen.hidden = true;
    oddScreen.hidden = true;
    gastroScreen.hidden = false;
    startGastroRound();
  }

  document.getElementById("open-gastro").addEventListener("click", showGastroGame);
  document.getElementById("gastro-back").addEventListener("click", showHome);
  document.getElementById("gastro-next").addEventListener("click", function () {
    playSound("page", 0.22);
    startGastroRound();
  });
  gastroHintBtn.addEventListener("click", showGastroHint);

  a11yToggle.addEventListener("click", function () {
    var open = a11yMenu.hasAttribute("hidden");
    a11yMenu.hidden = !open;
    a11yToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  a11yMenu.querySelectorAll("[data-text-size]").forEach(function (button) {
    button.addEventListener("click", function () {
      var settings = loadA11y();
      settings.textSize = button.getAttribute("data-text-size");
      saveA11y(settings);
    });
  });

  document.getElementById("contrast-toggle").addEventListener("click", function () {
    var settings = loadA11y();
    settings.contrast = !settings.contrast;
    saveA11y(settings);
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".a11y")) {
      a11yMenu.hidden = true;
      a11yToggle.setAttribute("aria-expanded", "false");
    }
  });

  applyA11y();
  soundEnabled = loadSoundEnabled();
  syncSoundButton();
  startGarden();
  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      setSoundEnabled(!soundEnabled);
    });
  }
  if (gardenSoundBtn) {
    gardenSoundBtn.addEventListener("click", function () {
      setSoundEnabled(!soundEnabled);
    });
  }
  document.addEventListener("click", function () {
    if (soundEnabled && home && !home.hidden) {
      startGarden();
    }
  });
})();
