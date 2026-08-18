(function () {
  var STAGE_LABELS = ["Начинаем", "Хорошо идёт", "Для знатоков"];

  var STORAGE_A11Y = "vspominayka-a11y";
  var STORAGE_SOUND = "soundEnabled";

  var home = document.getElementById("screen-home");
  var game = document.getElementById("screen-game");
  var memoryScreen = document.getElementById("screen-memory");
  var oddScreen = document.getElementById("screen-odd");
  var gastroScreen = document.getElementById("screen-gastro");
  var puzzleScreen = document.getElementById("screen-puzzle");
  var assembleScreen = document.getElementById("screen-assemble");
  var memoriesHub = document.getElementById("screen-memories");
  var rememberHub = document.getElementById("screen-remember-hub");
  var attentionHub = document.getElementById("screen-attention-hub");
  var photoHub = document.getElementById("screen-photo-hub");
  var quotesScreen = document.getElementById("screen-quotes");
  var datesScreen = document.getElementById("screen-dates");
  var myImportantHub = document.getElementById("screen-my-important");
  var recipesScreen = document.getElementById("screen-recipes");
  var ussrScreen = document.getElementById("screen-ussr");
  var importantScreen = document.getElementById("screen-important");
  var a11yToggle = document.getElementById("a11y-toggle");
  var a11yMenu = document.getElementById("a11y-menu");
  var soundToggle = document.getElementById("sound-toggle");
  var gardenSoundBtn = document.getElementById("garden-sound");
  var puzzlePreviewTimer = null;
  var assemblePreviewTimer = null;
  var puzzleHintTimer = null;
  var puzzleMoveTimer = null;
  var puzzleAnimating = false;

  function stopPuzzlePreviewTimer() {
    if (puzzlePreviewTimer) {
      clearTimeout(puzzlePreviewTimer);
      puzzlePreviewTimer = null;
    }
  }

  function stopAssemblePreviewTimer() {
    if (assemblePreviewTimer) {
      clearTimeout(assemblePreviewTimer);
      assemblePreviewTimer = null;
    }
  }

  function leavePuzzleScreen() {
    stopPuzzlePreviewTimer();
    if (puzzleHintTimer) {
      clearTimeout(puzzleHintTimer);
      puzzleHintTimer = null;
    }
    if (puzzleMoveTimer) {
      clearTimeout(puzzleMoveTimer);
      puzzleMoveTimer = null;
    }
    puzzleAnimating = false;
    if (puzzleScreen) {
      puzzleScreen.hidden = true;
    }
  }

  var SOUND_FILES = {
    garden: "assets/audio/mixkit-forest-birds-ambience-1210.wav",
    click: "assets/sounds/click.wav",
    correct: "assets/sounds/correct.wav",
    "try-again": "assets/sounds/try-again.wav",
    page: "assets/sounds/page.wav",
    "cash-register": "assets/sounds/cash-register.wav"
  };
  var soundPlayers = {};
  var gardenPlayer = null;
  var gardenFadeTimer = null;
  var gardenStartPending = false;
  var gardenStopRequested = false;
  var GARDEN_VOLUME = 0.18;
  var GARDEN_FADE_MS = 450;
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

  function clearGardenFade() {
    if (gardenFadeTimer) {
      clearInterval(gardenFadeTimer);
      gardenFadeTimer = null;
    }
  }

  function fadeGardenVolume(targetVolume, onDone) {
    if (!gardenPlayer) {
      if (onDone) {
        onDone();
      }
      return;
    }
    clearGardenFade();
    var startVolume = gardenPlayer.volume;
    var startTime = Date.now();
    if (Math.abs(startVolume - targetVolume) < 0.01) {
      gardenPlayer.volume = targetVolume;
      if (onDone) {
        onDone();
      }
      return;
    }
    gardenFadeTimer = setInterval(function () {
      if (!gardenPlayer) {
        clearGardenFade();
        if (onDone) {
          onDone();
        }
        return;
      }
      var progress = Math.min(1, (Date.now() - startTime) / GARDEN_FADE_MS);
      var nextVolume = startVolume + (targetVolume - startVolume) * progress;
      gardenPlayer.volume = nextVolume < 0 ? 0 : nextVolume > 1 ? 1 : nextVolume;
      if (progress >= 1) {
        gardenPlayer.volume = targetVolume;
        clearGardenFade();
        if (onDone) {
          onDone();
        }
      }
    }, 16);
  }

  function pauseGardenNow() {
    clearGardenFade();
    gardenStartPending = false;
    if (!gardenPlayer) {
      return;
    }
    try {
      gardenPlayer.pause();
      gardenPlayer.currentTime = 0;
      gardenPlayer.volume = 0;
    } catch (error) {}
  }

  function stopGarden() {
    gardenStopRequested = true;
    if (!gardenPlayer) {
      return;
    }
    if (gardenPlayer.paused && !gardenStartPending) {
      pauseGardenNow();
      return;
    }
    fadeGardenVolume(0, function () {
      if (gardenStopRequested) {
        pauseGardenNow();
      }
    });
  }

  function getGardenPlayer() {
    if (!gardenPlayer) {
      gardenPlayer = makeAudio(SOUND_FILES.garden);
      if (gardenPlayer) {
        gardenPlayer.loop = true;
        gardenPlayer.volume = 0;
      }
    }
    return gardenPlayer;
  }

  function startGarden() {
    if (!soundEnabled || !home || home.hidden) {
      stopGarden();
      return;
    }
    gardenStopRequested = false;
    var audio = getGardenPlayer();
    if (!audio) {
      return;
    }
    var alreadyPlaying = !audio.paused && !audio.ended;
    if (alreadyPlaying || gardenStartPending) {
      fadeGardenVolume(GARDEN_VOLUME);
      return;
    }
    gardenStartPending = true;
    try {
      audio.volume = 0;
      var playPromise = audio.play();
      if (playPromise && playPromise.then) {
        playPromise
          .then(function () {
            gardenStartPending = false;
            if (gardenStopRequested) {
              stopGarden();
              return;
            }
            fadeGardenVolume(GARDEN_VOLUME);
          })
          .catch(function () {
            gardenStartPending = false;
          });
      } else {
        gardenStartPending = false;
        fadeGardenVolume(GARDEN_VOLUME);
      }
    } catch (error) {
      gardenStartPending = false;
    }
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

  function todayKey() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function notifyRoom(type, detail) {
    if (window.VspominaykaRoom && typeof window.VspominaykaRoom.record === "function") {
      window.VspominaykaRoom.record(type, detail || {});
    }
  }

  function hideRoomScreen() {
    var roomScreen = document.getElementById("screen-room");
    if (roomScreen) {
      roomScreen.hidden = true;
    }
    var intro = document.getElementById("room-intro-dialog");
    if (intro) {
      intro.hidden = true;
    }
    var itemDialog = document.getElementById("room-item-dialog");
    if (itemDialog) {
      itemDialog.hidden = true;
    }
    var rewardsDialog = document.getElementById("room-rewards-dialog");
    if (rewardsDialog) {
      rewardsDialog.hidden = true;
    }
  }

  function hideContentPages() {
    hideRoomScreen();
    leavePuzzleScreen();
    leaveAssembleScreen();
    Array.prototype.forEach.call(document.querySelectorAll(".page"), function (page) {
      page.hidden = true;
    });
  }

  var CONTINUE_TOTAL = 10;
  var BUILD_TOTAL = 5;
  var PAIR_COUNT = 4;
  var proverbsAll = [];
  var proverbsWaiters = [];
  var proverbsLoaded = false;
  var proverbsLoading = false;
  var proverbMode = "";
  var proverbDeck = [];
  var proverbIndex = 0;
  var proverbScore = 0;
  var continueAnswered = false;
  var continueCurrent = null;
  var pairItems = [];
  var pairMatched = {};
  var pairGameRecorded = false;
  var pairPickedId = "";
  var pairStartOrder = [];
  var pairEndOrder = [];
  var buildParts = [];
  var buildChosen = [];
  var buildCurrent = null;
  var buildLocked = false;
  var proverbHubEl = document.getElementById("proverb-hub");
  var proverbContinueEl = document.getElementById("proverb-continue");
  var proverbPairEl = document.getElementById("proverb-pair");
  var proverbBuildEl = document.getElementById("proverb-build");
  var proverbResultEl = document.getElementById("proverb-result");
  var proverbStageEl = document.getElementById("proverb-stage");
  var proverbProgressEl = document.getElementById("proverb-progress");
  var proverbHubNote = document.getElementById("proverb-hub-note");
  var continueLead = document.getElementById("continue-lead");
  var continueFeedback = document.getElementById("continue-feedback");
  var continueChoicesEl = document.getElementById("continue-choices");
  var continueReveal = document.getElementById("continue-reveal");
  var continueRevealTitle = document.getElementById("continue-reveal-title");
  var continueRevealText = document.getElementById("continue-reveal-text");
  var pairFeedback = document.getElementById("pair-feedback");
  var pairPickedEl = document.getElementById("pair-picked");
  var pairBoard = document.getElementById("pair-board");
  var pairLeftEl = document.getElementById("pair-left");
  var pairRightEl = document.getElementById("pair-right");
  var pairSuccess = document.getElementById("pair-success");
  var buildFeedback = document.getElementById("build-feedback");
  var buildAnswerEl = document.getElementById("build-answer");
  var buildPlaceholder = document.getElementById("build-placeholder");
  var buildPiecesEl = document.getElementById("build-pieces");
  var buildUndoBtn = document.getElementById("build-undo");
  var buildSuccess = document.getElementById("build-success");
  var buildQuote = document.getElementById("build-quote");
  var proverbResultTitle = document.getElementById("proverb-result-title");
  var proverbResultText = document.getElementById("proverb-result-text");

  function notifyProverbWaiters() {
    var waiters = proverbsWaiters.slice();
    proverbsWaiters = [];
    waiters.forEach(function (fn) {
      fn(proverbsAll);
    });
  }

  function finishProverbsLoad(list) {
    proverbsAll = (list || []).filter(function (item) {
      return item && item.id && item.text && item.first && item.second;
    });
    proverbsLoaded = proverbsAll.length > 0;
    proverbsLoading = false;
  }

  function loadProverbsScriptFallback(callback) {
    if (window.VSPOMINAYKA_PROVERBS && Array.isArray(window.VSPOMINAYKA_PROVERBS)) {
      callback(window.VSPOMINAYKA_PROVERBS);
      return;
    }
    var script = document.createElement("script");
    script.src = "data/proverbs.js";
    script.onload = function () {
      callback(Array.isArray(window.VSPOMINAYKA_PROVERBS) ? window.VSPOMINAYKA_PROVERBS : []);
    };
    script.onerror = function () {
      callback([]);
    };
    document.head.appendChild(script);
  }

  function loadProverbs(callback) {
    callback = callback || function () {};
    if (proverbsLoaded) {
      callback(proverbsAll);
      return;
    }
    proverbsWaiters.push(callback);
    if (proverbsLoading) {
      return;
    }
    proverbsLoading = true;
    if (window.VSPOMINAYKA_PROVERBS && Array.isArray(window.VSPOMINAYKA_PROVERBS) && window.VSPOMINAYKA_PROVERBS.length) {
      finishProverbsLoad(window.VSPOMINAYKA_PROVERBS);
      notifyProverbWaiters();
      return;
    }
    var url = "data/proverbs.json";
    try {
      url = new URL("data/proverbs.json", document.baseURI).href;
    } catch (error) {}
    if (typeof fetch !== "function") {
      loadProverbsScriptFallback(function (list) {
        finishProverbsLoad(list);
        notifyProverbWaiters();
      });
      return;
    }
    fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("fetch failed");
        }
        return response.json();
      })
      .then(function (data) {
        finishProverbsLoad(Array.isArray(data) ? data : []);
        if (!proverbsLoaded) {
          throw new Error("empty");
        }
        notifyProverbWaiters();
      })
      .catch(function () {
        loadProverbsScriptFallback(function (list) {
          finishProverbsLoad(list);
          notifyProverbWaiters();
        });
      });
  }

  function uniqueBy(list, keyFn) {
    var seen = {};
    var out = [];
    list.forEach(function (item) {
      var key = keyFn(item);
      if (!key || seen[key]) {
        return;
      }
      seen[key] = true;
      out.push(item);
    });
    return out;
  }

  function pickUnique(list, count, avoidIds) {
    avoidIds = avoidIds || {};
    var pool = shuffle(list.filter(function (item) {
      return !avoidIds[item.id];
    }));
    var picked = [];
    var usedSecond = {};
    var usedFirst = {};
    var i;
    for (i = 0; i < pool.length && picked.length < count; i += 1) {
      var item = pool[i];
      if (usedFirst[item.first] || usedSecond[item.second]) {
        continue;
      }
      usedFirst[item.first] = true;
      usedSecond[item.second] = true;
      picked.push(item);
    }
    if (picked.length < count) {
      var have = {};
      picked.forEach(function (item) {
        have[item.id] = true;
      });
      for (i = 0; i < pool.length && picked.length < count; i += 1) {
        if (!have[pool[i].id]) {
          picked.push(pool[i]);
          have[pool[i].id] = true;
        }
      }
    }
    return picked;
  }

  function continueOptions(item) {
    var options = [item.second];
    var pool = shuffle(proverbsAll.filter(function (other) {
      return other.id !== item.id && other.second && other.second !== item.second;
    }));
    var i;
    for (i = 0; i < pool.length && options.length < 4; i += 1) {
      if (options.indexOf(pool[i].second) === -1) {
        options.push(pool[i].second);
      }
    }
    return shuffle(options);
  }

  function hideProverbViews() {
    if (proverbHubEl) {
      proverbHubEl.hidden = true;
    }
    if (proverbContinueEl) {
      proverbContinueEl.hidden = true;
    }
    if (proverbPairEl) {
      proverbPairEl.hidden = true;
    }
    if (proverbBuildEl) {
      proverbBuildEl.hidden = true;
    }
    if (proverbResultEl) {
      proverbResultEl.hidden = true;
    }
  }

  function renderProverbHeader() {
    var playing = (proverbContinueEl && !proverbContinueEl.hidden) || (proverbBuildEl && !proverbBuildEl.hidden);
    if (proverbStageEl) {
      proverbStageEl.hidden = !playing;
      if (playing && proverbMode === "continue") {
        proverbStageEl.textContent = "Пословица " + (proverbIndex + 1) + " из " + CONTINUE_TOTAL;
      }
      if (playing && proverbMode === "build") {
        proverbStageEl.textContent = "Пословица " + (proverbIndex + 1) + " из " + BUILD_TOTAL;
      }
    }
    if (proverbProgressEl) {
      proverbProgressEl.hidden = !(playing && proverbMode === "continue");
      if (!proverbProgressEl.hidden) {
        proverbProgressEl.textContent = "Вспомнили: " + proverbScore;
      }
    }
    var proverbBackBtn = document.getElementById("back-home");
    if (proverbBackBtn) {
      proverbBackBtn.textContent = proverbHubEl && !proverbHubEl.hidden
        ? "← Назад"
        : "← К народной мудрости";
    }
  }

  function showProverbHub() {
    proverbMode = "";
    hideProverbViews();
    if (proverbHubEl) {
      proverbHubEl.hidden = false;
    }
    renderProverbHeader();
    loadProverbs(function (list) {
      if (proverbHubNote) {
        if (!list.length) {
          proverbHubNote.hidden = false;
          proverbHubNote.textContent = "Не удалось загрузить пословицы. Откройте проект через локальный просмотр.";
        } else {
          proverbHubNote.hidden = true;
          proverbHubNote.textContent = "";
        }
      }
    });
  }

  function showProverbResult() {
    hideProverbViews();
    if (proverbResultEl) {
      proverbResultEl.hidden = false;
    }
    if (proverbResultTitle) {
      proverbResultTitle.textContent = "Отличная память!";
    }
    if (proverbResultText) {
      proverbResultText.textContent = "Вы вспомнили " + proverbScore + " из " + CONTINUE_TOTAL + " пословиц";
    }
    renderProverbHeader();
    notifyRoom("gameCompleted", { game: "proverb" });
  }

  function startContinueRound() {
    continueCurrent = proverbDeck[proverbIndex];
    continueAnswered = false;
    continueFeedback.textContent = "";
    continueReveal.hidden = true;
    continueChoicesEl.innerHTML = "";
    continueLead.textContent = continueCurrent.first + " …";
    continueOptions(continueCurrent).forEach(function (text) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "proverb-choice";
      button.textContent = text;
      button.addEventListener("click", function () {
        answerContinue(button, text);
      });
      continueChoicesEl.appendChild(button);
    });
    renderProverbHeader();
  }

  function startContinueGame() {
    loadProverbs(function (list) {
      var unique = uniqueBy(list, function (item) { return item.id; });
      if (unique.length < 4) {
        showProverbHub();
        return;
      }
      proverbMode = "continue";
      proverbDeck = pickUnique(unique, CONTINUE_TOTAL, {});
      proverbIndex = 0;
      proverbScore = 0;
      hideProverbViews();
      proverbContinueEl.hidden = false;
      startContinueRound();
    });
  }

  function answerContinue(button, text) {
    if (continueAnswered || !continueCurrent) {
      return;
    }
    continueAnswered = true;
    var correct = text === continueCurrent.second;
    Array.prototype.forEach.call(continueChoicesEl.querySelectorAll(".proverb-choice"), function (choice) {
      choice.disabled = true;
      if (choice.textContent === continueCurrent.second) {
        choice.classList.add("is-right");
      } else if (choice === button) {
        choice.classList.add("is-miss");
      }
    });
    if (correct) {
      proverbScore += 1;
      playSound("correct", 0.22);
      continueRevealTitle.textContent = "Точно! ❤️";
      notifyRoom("proverbTask", { mode: "continue" });
      notifyRoom("correctAnswer", { source: "phrase" });
    } else {
      continueRevealTitle.textContent = "Почти! Правильно так:";
      notifyRoom("proverbTask", { mode: "continue" });
    }
    continueRevealText.textContent = continueCurrent.text;
    continueReveal.hidden = false;
    renderProverbHeader();
  }

  function goContinueNext() {
    if (proverbIndex + 1 >= proverbDeck.length) {
      showProverbResult();
      return;
    }
    playSound("page", 0.22);
    proverbIndex += 1;
    startContinueRound();
  }

  function pairMobile() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function renderPairBoard() {
    pairLeftEl.innerHTML = "";
    pairRightEl.innerHTML = "";
    var matchedCount = 0;
    pairItems.forEach(function (item) {
      if (pairMatched[item.id]) {
        matchedCount += 1;
      }
    });
    pairStartOrder.forEach(function (item) {
      if (pairMatched[item.id]) {
        return;
      }
      var startBtn = document.createElement("button");
      startBtn.type = "button";
      startBtn.className = "pair-item" + (pairPickedId === item.id ? " is-on" : "");
      startBtn.textContent = item.first;
      startBtn.addEventListener("click", function () {
        pickPairStart(item.id);
      });
      pairLeftEl.appendChild(startBtn);
    });
    pairEndOrder.forEach(function (item) {
      if (pairMatched[item.id]) {
        return;
      }
      var endBtn = document.createElement("button");
      endBtn.type = "button";
      endBtn.className = "pair-item";
      endBtn.textContent = item.second;
      endBtn.addEventListener("click", function () {
        pickPairEnd(item.id);
      });
      pairRightEl.appendChild(endBtn);
    });
    if (pairPickedId && pairPickedEl) {
      var picked = pairItems.filter(function (item) {
        return item.id === pairPickedId;
      })[0];
      pairPickedEl.hidden = !pairMobile();
      pairPickedEl.textContent = picked ? "Начало: " + picked.first : "";
    } else if (pairPickedEl) {
      pairPickedEl.hidden = true;
      pairPickedEl.textContent = "";
    }
    if (pairBoard) {
      pairBoard.classList.toggle("is-pick-start", pairMobile() && !pairPickedId);
      pairBoard.classList.toggle("is-pick-end", pairMobile() && !!pairPickedId);
    }
    if (matchedCount >= pairItems.length && pairItems.length) {
      pairSuccess.hidden = false;
      pairBoard.hidden = true;
      if (pairPickedEl) {
        pairPickedEl.hidden = true;
      }
      if (!pairGameRecorded) {
        pairGameRecorded = true;
        notifyRoom("gameCompleted", { game: "proverb" });
      }
    }
  }

  function startPairRound() {
    loadProverbs(function (list) {
      var unique = uniqueBy(list, function (item) { return item.id; });
      pairItems = pickUnique(unique, PAIR_COUNT, {});
      if (pairItems.length < PAIR_COUNT) {
        showProverbHub();
        return;
      }
      pairStartOrder = shuffle(pairItems.slice());
      pairEndOrder = shuffle(pairItems.slice());
      proverbMode = "pair";
      pairMatched = {};
      pairGameRecorded = false;
      pairPickedId = "";
      pairFeedback.textContent = "";
      pairSuccess.hidden = true;
      pairBoard.hidden = false;
      hideProverbViews();
      proverbPairEl.hidden = false;
      renderProverbHeader();
      renderPairBoard();
    });
  }

  function pickPairStart(id) {
    if (pairMatched[id]) {
      return;
    }
    pairPickedId = id;
    pairFeedback.textContent = "";
    renderPairBoard();
  }

  function pickPairEnd(id) {
    if (!pairPickedId || pairMatched[id]) {
      return;
    }
    if (pairPickedId === id) {
      pairMatched[id] = true;
      pairPickedId = "";
      playSound("correct", 0.22);
      pairFeedback.textContent = "";
      notifyRoom("proverbTask", { mode: "pair" });
      notifyRoom("correctAnswer", { source: "proverb" });
      renderPairBoard();
      return;
    }
    pairPickedId = "";
    pairFeedback.textContent = "Попробуем ещё раз";
    renderPairBoard();
  }

  function mergeParts(parts, max) {
    var copy = parts.slice();
    while (copy.length > max) {
      var best = 0;
      var bestLen = copy[0].length + copy[1].length;
      var i;
      for (i = 1; i < copy.length - 1; i += 1) {
        var len = copy[i].length + copy[i + 1].length;
        if (len < bestLen) {
          bestLen = len;
          best = i;
        }
      }
      copy.splice(best, 2, (copy[best] + " " + copy[best + 1]).replace(/\s+/g, " ").trim());
    }
    return copy;
  }

  function groupWords(text, count) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) {
      return [text];
    }
    if (words.length <= count) {
      return words;
    }
    var parts = [];
    var base = Math.floor(words.length / count);
    var extra = words.length % count;
    var i = 0;
    var p;
    for (p = 0; p < count; p += 1) {
      var n = base + (p < extra ? 1 : 0);
      parts.push(words.slice(i, i + n).join(" "));
      i += n;
    }
    return parts.filter(Boolean);
  }

  function splitProverbParts(item) {
    var text = String(item.text || "").replace(/\.\s*$/, "").trim();
    var chunks = [];
    if (item.first && item.second) {
      chunks = [String(item.first).trim(), String(item.second).replace(/\.\s*$/, "").trim()];
    }
    function explode(list) {
      var out = [];
      list.forEach(function (part) {
        var bits = String(part).split(/\s*[—–]\s*|:\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
        if (bits.length > 1) {
          out = out.concat(bits);
        } else {
          var comma = String(part).split(/,\s+/).map(function (x) { return x.trim(); }).filter(function (x) {
            return x && x.split(/\s+/).length >= 1;
          });
          if (comma.length > 1) {
            out = out.concat(comma);
          } else {
            out.push(part);
          }
        }
      });
      return out;
    }
    chunks = explode(chunks.length ? chunks : [text]);
    if (chunks.length < 3) {
      chunks = groupWords(text, 3);
    }
    if (chunks.length > 5) {
      chunks = mergeParts(chunks, 5);
    }
    chunks = chunks.filter(function (part) { return part && String(part).trim() && String(part).indexOf(" ") !== -1 || String(part).length > 1; });
    if (chunks.length < 3) {
      chunks = groupWords(text, Math.min(5, Math.max(3, text.split(/\s+/).length)));
    }
    if (chunks.length > 5) {
      chunks = mergeParts(chunks, 5);
    }
    return chunks.map(function (part) { return String(part).trim(); }).filter(Boolean);
  }

  function renderBuildAnswer() {
    Array.prototype.forEach.call(buildAnswerEl.querySelectorAll(".answer-chip"), function (chip) {
      chip.remove();
    });
    if (!buildChosen.length) {
      buildPlaceholder.hidden = false;
      return;
    }
    buildPlaceholder.hidden = true;
    buildChosen.forEach(function (index) {
      var chip = document.createElement("span");
      chip.className = "answer-chip";
      chip.textContent = buildParts[index];
      buildAnswerEl.appendChild(chip);
    });
  }

  function startBuildRound() {
    buildCurrent = proverbDeck[proverbIndex];
    buildParts = splitProverbParts(buildCurrent);
    buildChosen = [];
    buildLocked = false;
    buildFeedback.textContent = "";
    buildSuccess.hidden = true;
    buildPiecesEl.hidden = false;
    buildUndoBtn.hidden = false;
    buildPiecesEl.innerHTML = "";
    renderBuildAnswer();
    shuffle(buildParts.map(function (text, index) {
      return { text: text, index: index };
    })).forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "piece";
      button.textContent = item.text;
      button.dataset.index = String(item.index);
      button.addEventListener("click", function () {
        onBuildPiece(button, item.index);
      });
      buildPiecesEl.appendChild(button);
    });
    renderProverbHeader();
  }

  function startBuildGame() {
    loadProverbs(function (list) {
      var unique = uniqueBy(list, function (item) { return item.id; });
      if (unique.length < BUILD_TOTAL) {
        showProverbHub();
        return;
      }
      proverbMode = "build";
      proverbDeck = pickUnique(unique, BUILD_TOTAL, {});
      proverbIndex = 0;
      proverbScore = 0;
      hideProverbViews();
      proverbBuildEl.hidden = false;
      startBuildRound();
    });
  }

  function onBuildPiece(button, index) {
    if (buildLocked || button.classList.contains("is-used")) {
      return;
    }
    playSound("click", 0.18);
    button.classList.add("is-used");
    button.disabled = true;
    buildChosen.push(index);
    renderBuildAnswer();
    if (buildChosen.length < buildParts.length) {
      return;
    }
    buildLocked = true;
    var ok = buildChosen.every(function (partIndex, i) {
      return partIndex === i;
    });
    if (ok) {
      playSound("correct", 0.22);
      proverbScore += 1;
      buildFeedback.textContent = "";
      buildPiecesEl.hidden = true;
      buildUndoBtn.hidden = true;
      buildQuote.textContent = buildCurrent.text;
      buildSuccess.hidden = false;
      notifyRoom("proverbTask", { mode: "build" });
      notifyRoom("correctAnswer", { source: "proverb" });
    } else {
      buildFeedback.textContent = "Почти получилось. Попробуем ещё раз?";
      startBuildRound();
      buildFeedback.textContent = "Почти получилось. Попробуем ещё раз?";
    }
  }

  function undoBuild() {
    if (buildLocked || !buildChosen.length) {
      return;
    }
    var index = buildChosen.pop();
    var button = buildPiecesEl.querySelector('[data-index="' + index + '"]');
    if (button) {
      button.classList.remove("is-used");
      button.disabled = false;
    }
    renderBuildAnswer();
  }

  function goBuildNext() {
    if (proverbIndex + 1 >= proverbDeck.length) {
      hideProverbViews();
      proverbResultEl.hidden = false;
      proverbResultTitle.textContent = "Отличная память!";
      proverbResultText.textContent = "Вы вспомнили " + proverbScore + " из " + BUILD_TOTAL + " пословиц";
      renderProverbHeader();
      notifyRoom("gameCompleted", { game: "proverb" });
      return;
    }
    playSound("page", 0.22);
    proverbIndex += 1;
    startBuildRound();
  }

  function proverbBack() {
    if (proverbHubEl && !proverbHubEl.hidden) {
      showMemoriesHub();
      return;
    }
    showProverbHub();
  }

  function showHome() {
    stopMemoryRound();
    hideContentPages();
    home.hidden = false;
    startGarden();
  }

  function showGame() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    game.hidden = false;
    showProverbHub();
    notifyRoom("sectionVisited", { section: "proverbs" });
  }

  function showMemoriesHub() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    memoriesHub.hidden = false;
    notifyRoom("sectionVisited", { section: "memories" });
  }

  function showRememberHub() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    rememberHub.hidden = false;
    notifyRoom("sectionVisited", { section: "remember" });
  }

  function showAttentionHub() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    attentionHub.hidden = false;
    notifyRoom("sectionVisited", { section: "attention" });
  }

  function showPhotoHub() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    photoHub.hidden = false;
    notifyRoom("sectionVisited", { section: "photo-games" });
  }

  function showMyImportantHub() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    myImportantHub.hidden = false;
    notifyRoom("sectionVisited", { section: "my-important" });
  }

  document.getElementById("open-memories").addEventListener("click", showMemoriesHub);
  document.getElementById("open-remember-hub").addEventListener("click", showRememberHub);
  document.getElementById("open-attention-hub").addEventListener("click", showAttentionHub);
  document.getElementById("open-photo-hub").addEventListener("click", showPhotoHub);
  document.getElementById("remember-hub-back").addEventListener("click", showMemoriesHub);
  document.getElementById("attention-hub-back").addEventListener("click", showMemoriesHub);
  document.getElementById("photo-hub-back").addEventListener("click", showMemoriesHub);
  document.getElementById("open-my-important").addEventListener("click", showMyImportantHub);
  document.getElementById("life-back").addEventListener("click", showHome);
  document.getElementById("back-home").addEventListener("click", proverbBack);
  var openRoomBtn = document.getElementById("open-room");
  if (openRoomBtn) {
    openRoomBtn.addEventListener("click", function () {
      if (window.VspominaykaRoom && typeof window.VspominaykaRoom.show === "function") {
        window.VspominaykaRoom.show();
      }
    });
  }
  var openTipsBtn = document.getElementById("open-tips");
  function openTipsScreen() {
    if (window.VspominaykaTips && typeof window.VspominaykaTips.show === "function") {
      window.VspominaykaTips.show();
    }
  }
  if (openTipsBtn) {
    openTipsBtn.addEventListener("click", function (event) {
      if (event.target.closest("#open-tips-notebook")) {
        return;
      }
      openTipsScreen();
    });
    openTipsBtn.addEventListener("keydown", function (event) {
      if (event.target !== openTipsBtn) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTipsScreen();
      }
    });
  }
  var openTipsNotebook = document.getElementById("open-tips-notebook");
  if (openTipsNotebook) {
    openTipsNotebook.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (window.VspominaykaTips && typeof window.VspominaykaTips.showNotebook === "function") {
        window.VspominaykaTips.showNotebook();
      }
    });
  }
  var roomBackBtn = document.getElementById("room-back");
  if (roomBackBtn) {
    roomBackBtn.addEventListener("click", showHome);
  }
  var tipsBackBtn = document.getElementById("tips-back");
  if (tipsBackBtn) {
    tipsBackBtn.addEventListener("click", function () {
      if (window.VspominaykaTips && typeof window.VspominaykaTips.back === "function") {
        if (window.VspominaykaTips.back()) {
          return;
        }
      }
      showHome();
    });
  }

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
    memoryGrid.setAttribute("data-count", String(list.length));
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
      notifyRoom("gameCompleted", { game: "memory" });
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
    hideContentPages();
    memoryScreen.hidden = false;
    startMemoryRound();
    notifyRoom("sectionVisited", { section: "memory" });
  }

  document.getElementById("open-memory").addEventListener("click", showMemoryGame);
  document.getElementById("memory-back").addEventListener("click", showAttentionHub);
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
      notifyRoom("gameCompleted", { game: "odd" });
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
    hideContentPages();
    oddScreen.hidden = false;
    startOddRound();
    notifyRoom("sectionVisited", { section: "odd" });
  }

  document.getElementById("open-odd").addEventListener("click", showOddGame);
  document.getElementById("odd-back").addEventListener("click", showAttentionHub);
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
      notifyRoom("gameCompleted", { game: "gastro" });
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
    hideContentPages();
    gastroScreen.hidden = false;
    startGastroRound();
    notifyRoom("sectionVisited", { section: "gastro" });
  }

  document.getElementById("open-gastro").addEventListener("click", showGastroGame);
  document.getElementById("gastro-back").addEventListener("click", showMemoriesHub);
  document.getElementById("gastro-next").addEventListener("click", function () {
    playSound("page", 0.22);
    startGastroRound();
  });
  gastroHintBtn.addEventListener("click", showGastroHint);

  var PUZZLE_STORAGE_DIFF = "vspominayka_puzzle_difficulty";
  var PUZZLE_SHUFFLE_MOVES = { 3: 80, 4: 150, 5: 250 };
  var puzzleItems = [];
  var puzzleItemsLoaded = false;
  var puzzleItemsFailed = false;
  var puzzleLoading = false;
  var puzzleWaiters = [];
  var puzzleSize = 3;
  var puzzleTiles = [];
  var puzzleMoves = 0;
  var puzzlePlaying = false;
  var puzzleCurrent = null;
  var puzzleLastId = "";
  var puzzlePhase = "";

  var puzzleError = document.getElementById("puzzle-error");
  var puzzleHowto = document.getElementById("puzzle-howto");
  var puzzleHowtoBtn = document.getElementById("puzzle-howto-btn");
  var puzzleDifficulty = document.getElementById("puzzle-difficulty");
  var puzzleStage = document.getElementById("puzzle-stage");
  var puzzlePreview = document.getElementById("puzzle-preview");
  var puzzlePreviewImg = document.getElementById("puzzle-preview-img");
  var puzzleBoard = document.getElementById("puzzle-board");
  var puzzleSuccess = document.getElementById("puzzle-success");
  var puzzleMovesEl = document.getElementById("puzzle-moves");
  var puzzlePeekBtn = document.getElementById("puzzle-peek");
  var puzzleOtherBtn = document.getElementById("puzzle-other");
  var puzzleModal = document.getElementById("puzzle-modal");
  var puzzleModalImg = document.getElementById("puzzle-modal-img");
  var puzzleWinMoves = document.getElementById("puzzle-win-moves");
  var puzzleWinCaption = document.getElementById("puzzle-win-caption");
  var puzzleResizeTimer = null;

  function prefersReducedPuzzleMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function loadPuzzleDifficulty() {
    try {
      var saved = parseInt(localStorage.getItem(PUZZLE_STORAGE_DIFF), 10);
      if (saved === 3 || saved === 4 || saved === 5) {
        return saved;
      }
    } catch (error) {}
    return 3;
  }

  function savePuzzleDifficulty(size) {
    puzzleSize = size;
    try {
      localStorage.setItem(PUZZLE_STORAGE_DIFF, String(size));
    } catch (error) {}
    Array.prototype.forEach.call(document.querySelectorAll("#puzzle-difficulty .puzzle-diff-btn"), function (button) {
      var on = parseInt(button.getAttribute("data-size"), 10) === size;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function notifyPuzzleWaiters() {
    var waiters = puzzleWaiters.slice();
    puzzleWaiters = [];
    waiters.forEach(function (fn) {
      fn();
    });
  }

  function finishPuzzleLoad(list) {
    puzzleItems = (list || []).filter(function (item) {
      return item && item.image;
    });
    puzzleLoading = false;
    puzzleItemsLoaded = puzzleItems.length > 0;
    puzzleItemsFailed = !puzzleItemsLoaded;
  }

  function loadPuzzleScriptFallback(callback) {
    if (window.VSPOMINAYKA_PUZZLES && Array.isArray(window.VSPOMINAYKA_PUZZLES)) {
      callback(window.VSPOMINAYKA_PUZZLES);
      return;
    }
    var script = document.createElement("script");
    script.src = "data/puzzles.js";
    script.onload = function () {
      callback(Array.isArray(window.VSPOMINAYKA_PUZZLES) ? window.VSPOMINAYKA_PUZZLES : []);
    };
    script.onerror = function () {
      callback([]);
    };
    document.head.appendChild(script);
  }

  function loadPuzzleItems(callback) {
    callback = callback || function () {};
    if (puzzleItemsLoaded) {
      callback();
      return;
    }
    puzzleWaiters.push(callback);
    if (puzzleLoading) {
      return;
    }
    puzzleLoading = true;
    puzzleItemsFailed = false;
    if (window.VSPOMINAYKA_PUZZLES && Array.isArray(window.VSPOMINAYKA_PUZZLES) && window.VSPOMINAYKA_PUZZLES.length) {
      finishPuzzleLoad(window.VSPOMINAYKA_PUZZLES);
      notifyPuzzleWaiters();
      return;
    }
    if (typeof fetch !== "function") {
      loadPuzzleScriptFallback(function (list) {
        finishPuzzleLoad(list);
        notifyPuzzleWaiters();
      });
      return;
    }
    var url = "data/puzzles.json";
    try {
      url = new URL("data/puzzles.json", document.baseURI).href;
    } catch (error) {}
    fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("fetch failed");
        }
        return response.json();
      })
      .then(function (data) {
        finishPuzzleLoad(Array.isArray(data) ? data : []);
        if (!puzzleItemsLoaded) {
          throw new Error("empty");
        }
        notifyPuzzleWaiters();
      })
      .catch(function () {
        loadPuzzleScriptFallback(function (list) {
          finishPuzzleLoad(list);
          notifyPuzzleWaiters();
        });
      });
  }

  function pickPuzzleItem() {
    var pool = puzzleItems.filter(function (item) {
      return item.id !== puzzleLastId;
    });
    if (!pool.length) {
      pool = puzzleItems.slice();
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function puzzleIsSolved(tiles) {
    var last = tiles.length - 1;
    if (tiles[last] !== -1) {
      return false;
    }
    for (var i = 0; i < last; i += 1) {
      if (tiles[i] !== i) {
        return false;
      }
    }
    return true;
  }

  function ruPuzzleMovesWord(count) {
    var n10 = count % 10;
    var n100 = count % 100;
    if (n10 === 1 && n100 !== 11) {
      return "ход";
    }
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) {
      return "хода";
    }
    return "ходов";
  }

  function puzzleEmptyIndex(tiles) {
    return tiles.indexOf(-1);
  }

  function puzzleNeighbors(empty, size) {
    var row = Math.floor(empty / size);
    var col = empty % size;
    var out = [];
    if (row > 0) {
      out.push({ index: empty - size, dir: 0 });
    }
    if (row < size - 1) {
      out.push({ index: empty + size, dir: 1 });
    }
    if (col > 0) {
      out.push({ index: empty - 1, dir: 2 });
    }
    if (col < size - 1) {
      out.push({ index: empty + 1, dir: 3 });
    }
    return out;
  }

  function shufflePuzzleTiles(size) {
    var count = size * size;
    var tiles = [];
    var i;
    for (i = 0; i < count - 1; i += 1) {
      tiles.push(i);
    }
    tiles.push(-1);
    var empty = count - 1;
    var lastDir = -1;
    var steps = PUZZLE_SHUFFLE_MOVES[size] || 80;
    var extra = 0;
    while (extra < 40) {
      var s;
      for (s = 0; s < steps; s += 1) {
        var opts = puzzleNeighbors(empty, size);
        var reverse = lastDir === 0 ? 1 : lastDir === 1 ? 0 : lastDir === 2 ? 3 : lastDir === 3 ? 2 : -1;
        var filtered = opts.filter(function (item) {
          return item.dir !== reverse;
        });
        if (!filtered.length) {
          filtered = opts;
        }
        var pick = filtered[Math.floor(Math.random() * filtered.length)];
        tiles[empty] = tiles[pick.index];
        tiles[pick.index] = -1;
        empty = pick.index;
        lastDir = pick.dir;
      }
      if (!puzzleIsSolved(tiles)) {
        return tiles;
      }
      extra += 1;
      steps = 12;
    }
    return tiles;
  }

  function puzzleCanMove(fromIndex) {
    var empty = puzzleEmptyIndex(puzzleTiles);
    if (fromIndex < 0 || fromIndex >= puzzleTiles.length || fromIndex === empty) {
      return false;
    }
    var size = puzzleSize;
    var r1 = Math.floor(fromIndex / size);
    var c1 = fromIndex % size;
    var r2 = Math.floor(empty / size);
    var c2 = empty % size;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  function puzzlePieceStyle(piece, size) {
    var col = piece % size;
    var row = Math.floor(piece / size);
    var posX = size === 1 ? "0%" : (col * 100) / (size - 1) + "%";
    var posY = size === 1 ? "0%" : (row * 100) / (size - 1) + "%";
    return {
      backgroundImage: "url(\"" + puzzleCurrent.image + "\")",
      backgroundRepeat: "no-repeat",
      backgroundSize: size * 100 + "% " + size * 100 + "%",
      backgroundPosition: posX + " " + posY
    };
  }

  function updatePuzzleMoves() {
    puzzleMovesEl.textContent = "Ходов: " + puzzleMoves;
  }

  function clearPuzzleHint() {
    if (puzzleHintTimer) {
      clearTimeout(puzzleHintTimer);
      puzzleHintTimer = null;
    }
    if (!puzzleBoard) {
      return;
    }
    Array.prototype.forEach.call(puzzleBoard.querySelectorAll(".is-movable-hint"), function (cell) {
      cell.classList.remove("is-movable-hint");
    });
  }

  function clearPuzzleBoardComplete() {
    if (!puzzleBoard) {
      return;
    }
    puzzleBoard.classList.remove("is-complete");
    puzzleBoard.style.backgroundImage = "";
    puzzleBoard.style.backgroundSize = "";
    puzzleBoard.style.backgroundRepeat = "";
    puzzleBoard.style.backgroundPosition = "";
  }

  function puzzleElementIsShown(el) {
    return !!(el && !el.hidden && window.getComputedStyle(el).display !== "none");
  }

  function puzzleOuterHeight(el) {
    if (!puzzleElementIsShown(el)) {
      return 0;
    }
    var cs = window.getComputedStyle(el);
    return el.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
  }

  function puzzleChromeHeight() {
    var used = 0;
    if (!puzzleScreen) {
      return used;
    }
    var screenCs = window.getComputedStyle(puzzleScreen);
    used += (parseFloat(screenCs.paddingTop) || 0) + (parseFloat(screenCs.paddingBottom) || 0);
    used += puzzleOuterHeight(puzzleScreen.querySelector(".game-top"));
    var game = puzzleScreen.querySelector(".puzzle-game");
    if (!game) {
      return used + 16;
    }
    Array.prototype.forEach.call(game.children, function (child) {
      if (child.id === "puzzle-stage") {
        var visible = 0;
        Array.prototype.forEach.call(child.children, function (block) {
          if (!puzzleElementIsShown(block)) {
            return;
          }
          visible += 1;
          if (block === puzzleBoard) {
            return;
          }
          if (block === puzzlePreview) {
            var previewVisible = 0;
            Array.prototype.forEach.call(block.children, function (inner) {
              if (!puzzleElementIsShown(inner)) {
                return;
              }
              previewVisible += 1;
              if (inner.classList.contains("puzzle-frame")) {
                return;
              }
              used += puzzleOuterHeight(inner);
            });
            var previewGap = parseFloat(window.getComputedStyle(block).gap) || 0;
            if (previewVisible > 1) {
              used += previewGap * (previewVisible - 1);
            }
            return;
          }
          used += puzzleOuterHeight(block);
        });
        var gap = parseFloat(window.getComputedStyle(child).gap) || 0;
        if (visible > 1) {
          used += gap * (visible - 1);
        }
        return;
      }
      used += puzzleOuterHeight(child);
    });
    return used + 8;
  }

  function applyPuzzlePhotoLayout(nw, nh) {
    if (!(nw > 0 && nh > 0) || !puzzleScreen || puzzleScreen.hidden) {
      return;
    }
    if (puzzleCurrent) {
      puzzleCurrent._nw = nw;
      puzzleCurrent._nh = nh;
    }
    puzzleScreen.style.setProperty("--puzzle-ar", nw + " / " + nh);
    var ar = nw / nh;
    var maxW = Math.max(160, puzzleScreen.clientWidth);
    var game = puzzleScreen.querySelector(".puzzle-game");
    if (game && game.clientWidth > 0) {
      maxW = game.clientWidth;
    }
    var maxH = Math.max(180, window.innerHeight - puzzleChromeHeight());
    var fitW = maxW;
    var fitH = fitW / ar;
    if (fitH > maxH) {
      fitH = maxH;
      fitW = fitH * ar;
    }
    if (fitW > maxW) {
      fitW = maxW;
    }
    puzzleScreen.style.setProperty("--puzzle-fit-w", Math.floor(fitW) + "px");
  }

  function syncPuzzlePhotoLayout() {
    var nw = puzzleCurrent && puzzleCurrent._nw;
    var nh = puzzleCurrent && puzzleCurrent._nh;
    var img = puzzlePreviewImg;
    if (!(nw > 0 && nh > 0) && img && img.naturalWidth > 0) {
      var src = img.currentSrc || img.src || "";
      if (puzzleCurrent && puzzleCurrent.image && src.indexOf(puzzleCurrent.image.replace(/^\.\//, "")) !== -1) {
        nw = img.naturalWidth;
        nh = img.naturalHeight;
      }
    }
    if (nw > 0 && nh > 0) {
      applyPuzzlePhotoLayout(nw, nh);
    }
  }

  function whenPuzzleImageReady(img, done) {
    if (!img) {
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      done(img);
      return;
    }
    img.addEventListener(
      "load",
      function () {
        done(img);
      },
      { once: true }
    );
  }

  function nudgePuzzleCell(cell) {
    if (!cell) {
      return;
    }
    cell.classList.remove("is-nudge");
    void cell.offsetWidth;
    cell.classList.add("is-nudge");
  }

  function flashMovablePuzzleTiles() {
    clearPuzzleHint();
    if (!puzzlePlaying || !puzzleBoard) {
      return;
    }
    var empty = puzzleEmptyIndex(puzzleTiles);
    puzzleNeighbors(empty, puzzleSize).forEach(function (item) {
      var cell = puzzleBoard.querySelector('[data-index="' + item.index + '"]');
      if (cell) {
        cell.classList.add("is-movable-hint");
      }
    });
    puzzleHintTimer = setTimeout(function () {
      clearPuzzleHint();
    }, prefersReducedPuzzleMotion() ? 700 : 1800);
  }

  function replayPuzzleHowTo() {
    if (puzzleHowto) {
      puzzleHowto.classList.remove("is-recall");
      void puzzleHowto.offsetWidth;
      puzzleHowto.classList.add("is-recall");
    }
    flashMovablePuzzleTiles();
  }

  function renderPuzzleBoard(options) {
    var complete = options && options.complete;
    puzzleBoard.innerHTML = "";
    puzzleBoard.style.gridTemplateColumns = "repeat(" + puzzleSize + ", minmax(0, 1fr))";
    puzzleBoard.style.gridTemplateRows = "repeat(" + puzzleSize + ", minmax(0, 1fr))";
    puzzleBoard.classList.toggle("is-easy", puzzleSize === 3);
    puzzleBoard.classList.toggle("is-complete", !!complete);
    if (complete && puzzleCurrent) {
      puzzleBoard.style.backgroundImage = "url(\"" + puzzleCurrent.image + "\")";
      puzzleBoard.style.backgroundRepeat = "no-repeat";
      puzzleBoard.style.backgroundSize = "100% 100%";
      puzzleBoard.style.backgroundPosition = "center";
    } else {
      clearPuzzleBoardComplete();
    }
    puzzleTiles.forEach(function (piece, index) {
      var cell;
      var row = Math.floor(index / puzzleSize) + 1;
      var col = (index % puzzleSize) + 1;
      var displayPiece = piece;
      if (piece === -1 && complete) {
        displayPiece = puzzleSize * puzzleSize - 1;
      }
      if (displayPiece === -1) {
        cell = document.createElement("div");
        cell.className = "puzzle-cell puzzle-empty";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", "Пустое место, ряд " + row + ", столбец " + col);
        cell.setAttribute("data-index", String(index));
        cell.setAttribute("data-piece", "empty");
      } else {
        cell = complete ? document.createElement("div") : document.createElement("button");
        if (!complete) {
          cell.type = "button";
        }
        cell.className = "puzzle-cell";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("data-index", String(index));
        cell.setAttribute("data-piece", String(displayPiece));
        var canMove = !complete && puzzleCanMove(index);
        cell.setAttribute(
          "aria-label",
          canMove
            ? "Фрагмент рядом с пустым местом, ряд " + row + ", столбец " + col + ". Нажмите, чтобы передвинуть"
            : "Фрагмент картинки, ряд " + row + ", столбец " + col
        );
        var style = puzzlePieceStyle(displayPiece, puzzleSize);
        cell.style.backgroundImage = style.backgroundImage;
        cell.style.backgroundRepeat = style.backgroundRepeat;
        cell.style.backgroundSize = style.backgroundSize;
        cell.style.backgroundPosition = style.backgroundPosition;
      }
      puzzleBoard.appendChild(cell);
    });
  }

  function showPuzzleError() {
    puzzleError.hidden = false;
    puzzleDifficulty.hidden = true;
    puzzleStage.hidden = true;
    puzzleMovesEl.hidden = true;
    puzzlePeekBtn.hidden = true;
    puzzleOtherBtn.hidden = true;
    if (puzzleHowto) {
      puzzleHowto.hidden = true;
    }
    if (puzzleHowtoBtn) {
      puzzleHowtoBtn.hidden = true;
    }
  }

  function setPuzzlePhase(phase) {
    puzzlePhase = phase;
    puzzleError.hidden = true;
    puzzleStage.hidden = false;
    puzzleDifficulty.hidden = phase !== "preview";
    puzzlePreview.hidden = phase !== "preview";
    puzzleBoard.hidden = phase !== "play" && phase !== "win";
    puzzleSuccess.hidden = phase !== "win";
    puzzleMovesEl.hidden = phase !== "play";
    puzzlePeekBtn.hidden = phase !== "play";
    puzzleOtherBtn.hidden = phase !== "play" && phase !== "preview";
    puzzlePlaying = phase === "play";
    if (puzzleHowto) {
      puzzleHowto.hidden = phase === "win";
    }
    if (puzzleHowtoBtn) {
      puzzleHowtoBtn.hidden = phase !== "play";
    }
    if (puzzleModal) {
      puzzleModal.hidden = true;
    }
    syncPuzzlePhotoLayout();
  }

  function startPuzzlePlay() {
    stopPuzzlePreviewTimer();
    clearPuzzleHint();
    if (!puzzleCurrent) {
      return;
    }
    puzzleTiles = shufflePuzzleTiles(puzzleSize);
    puzzleMoves = 0;
    puzzleAnimating = false;
    updatePuzzleMoves();
    setPuzzlePhase("play");
    renderPuzzleBoard();
    flashMovablePuzzleTiles();
    puzzleBoard.focus();
    syncPuzzlePhotoLayout();
  }

  function showPuzzlePreview(item) {
    stopPuzzlePreviewTimer();
    puzzleCurrent = item;
    puzzleLastId = item.id;
    puzzlePreviewImg.src = item.image;
    puzzlePreviewImg.alt = item.title || "Фотография для сборки";
    puzzleModalImg.src = item.image;
    setPuzzlePhase("preview");
    whenPuzzleImageReady(puzzlePreviewImg, function (img) {
      applyPuzzlePhotoLayout(img.naturalWidth, img.naturalHeight);
    });
    var wait = prefersReducedPuzzleMotion() ? 400 : 3000;
    puzzlePreviewTimer = setTimeout(startPuzzlePlay, wait);
  }

  function beginPuzzleRound(keepPhoto) {
    if (puzzleItemsFailed || !puzzleItems.length) {
      showPuzzleError();
      return;
    }
    var item = keepPhoto && puzzleCurrent ? puzzleCurrent : pickPuzzleItem();
    showPuzzlePreview(item);
  }

  function finishPuzzleWin() {
    if (!puzzleIsSolved(puzzleTiles)) {
      return;
    }
    puzzlePlaying = false;
    puzzleAnimating = false;
    clearPuzzleHint();
    var caption = "";
    if (puzzleCurrent) {
      caption = puzzleCurrent.caption || puzzleCurrent.title || "";
    }
    puzzleWinMoves.textContent = "Вы собрали картинку за " + puzzleMoves + " " + ruPuzzleMovesWord(puzzleMoves);
    if (caption) {
      puzzleWinCaption.hidden = false;
      puzzleWinCaption.textContent = caption;
    } else {
      puzzleWinCaption.hidden = true;
    }
    renderPuzzleBoard({ complete: true });
    setPuzzlePhase("win");
    syncPuzzlePhotoLayout();
    playSound("correct", 0.28);
    notifyRoom("puzzleCompleted", { game: "puzzle" });
    notifyRoom("gameCompleted", { game: "puzzle" });
  }

  function applyPuzzleMove(fromIndex) {
    var empty = puzzleEmptyIndex(puzzleTiles);
    puzzleTiles[empty] = puzzleTiles[fromIndex];
    puzzleTiles[fromIndex] = -1;
    puzzleMoves += 1;
    updatePuzzleMoves();
    playSound("click", 0.16);
    if (puzzleIsSolved(puzzleTiles)) {
      finishPuzzleWin();
      return;
    }
    puzzleAnimating = false;
    renderPuzzleBoard();
  }

  function tryPuzzleMove(fromIndex) {
    if (!puzzlePlaying || puzzleAnimating) {
      return false;
    }
    var cell = puzzleBoard.querySelector('.puzzle-cell[data-index="' + fromIndex + '"]');
    if (!puzzleCanMove(fromIndex)) {
      nudgePuzzleCell(cell);
      return false;
    }
    var empty = puzzleEmptyIndex(puzzleTiles);
    var emptyCell = puzzleBoard.querySelector('.puzzle-cell[data-index="' + empty + '"]');
    if (!cell || !emptyCell) {
      applyPuzzleMove(fromIndex);
      return true;
    }
    if (prefersReducedPuzzleMotion()) {
      applyPuzzleMove(fromIndex);
      return true;
    }
    var fromRect = cell.getBoundingClientRect();
    var emptyRect = emptyCell.getBoundingClientRect();
    var dx = emptyRect.left - fromRect.left;
    var dy = emptyRect.top - fromRect.top;
    puzzleAnimating = true;
    clearPuzzleHint();
    if (puzzleMoveTimer) {
      clearTimeout(puzzleMoveTimer);
      puzzleMoveTimer = null;
    }
    cell.classList.add("is-sliding");
    cell.style.transform = "translate(" + dx + "px, " + dy + "px)";
    var finished = false;
    function finishMove() {
      if (finished) {
        return;
      }
      finished = true;
      if (puzzleMoveTimer) {
        clearTimeout(puzzleMoveTimer);
        puzzleMoveTimer = null;
      }
      applyPuzzleMove(fromIndex);
    }
    cell.addEventListener(
      "transitionend",
      function (event) {
        if (event.propertyName && event.propertyName !== "transform") {
          return;
        }
        finishMove();
      },
      { once: true }
    );
    puzzleMoveTimer = setTimeout(finishMove, 280);
    return true;
  }

  function showPuzzleScreen() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    puzzleScreen.hidden = false;
    savePuzzleDifficulty(loadPuzzleDifficulty());
    notifyRoom("sectionVisited", { section: "puzzle" });
    loadPuzzleItems(function () {
      if (puzzleScreen.hidden) {
        return;
      }
      beginPuzzleRound(false);
    });
  }

  document.getElementById("open-pyatnashki").addEventListener("click", showPuzzleScreen);
  document.getElementById("puzzle-back").addEventListener("click", showPhotoHub);
  document.getElementById("puzzle-win-back").addEventListener("click", showPhotoHub);
  document.getElementById("puzzle-start-now").addEventListener("click", startPuzzlePlay);
  document.getElementById("puzzle-again").addEventListener("click", function () {
    startPuzzlePlay();
  });
  document.getElementById("puzzle-other").addEventListener("click", function () {
    beginPuzzleRound(false);
  });
  document.getElementById("puzzle-win-other").addEventListener("click", function () {
    beginPuzzleRound(false);
  });
  if (puzzleHowtoBtn) {
    puzzleHowtoBtn.addEventListener("click", function () {
      replayPuzzleHowTo();
    });
  }
  document.getElementById("puzzle-peek").addEventListener("click", function () {
    if (!puzzlePlaying || !puzzleCurrent) {
      return;
    }
    puzzleModal.hidden = false;
    document.getElementById("puzzle-modal-continue").focus();
  });
  document.getElementById("puzzle-modal-continue").addEventListener("click", function () {
    puzzleModal.hidden = true;
    puzzleBoard.focus();
  });
  window.addEventListener("resize", function () {
    if (!puzzleScreen || puzzleScreen.hidden) {
      return;
    }
    if (puzzleResizeTimer) {
      clearTimeout(puzzleResizeTimer);
    }
    puzzleResizeTimer = setTimeout(syncPuzzlePhotoLayout, 50);
  });
  Array.prototype.forEach.call(document.querySelectorAll("#puzzle-difficulty .puzzle-diff-btn"), function (button) {
    button.addEventListener("click", function () {
      savePuzzleDifficulty(parseInt(button.getAttribute("data-size"), 10));
    });
  });
  puzzleBoard.addEventListener("click", function (event) {
    var cell = event.target.closest(".puzzle-cell");
    if (!cell || !puzzlePlaying || puzzleAnimating) {
      return;
    }
    if (cell.classList.contains("puzzle-empty")) {
      nudgePuzzleCell(cell);
      return;
    }
    tryPuzzleMove(parseInt(cell.getAttribute("data-index"), 10));
  });
  puzzleBoard.addEventListener("keydown", function (event) {
    if (!puzzlePlaying) {
      return;
    }
    var empty = puzzleEmptyIndex(puzzleTiles);
    var size = puzzleSize;
    var tile = -1;
    if (event.key === "ArrowLeft") {
      tile = empty + 1;
      if (Math.floor(empty / size) !== Math.floor(tile / size)) {
        tile = -1;
      }
    } else if (event.key === "ArrowRight") {
      tile = empty - 1;
      if (Math.floor(empty / size) !== Math.floor(tile / size)) {
        tile = -1;
      }
    } else if (event.key === "ArrowUp") {
      tile = empty + size;
    } else if (event.key === "ArrowDown") {
      tile = empty - size;
    } else {
      return;
    }
    event.preventDefault();
    tryPuzzleMove(tile);
  });

  var ASSEMBLE_STORAGE_DIFF = "vspominayka_assemble_difficulty";
  var assembleCount = 6;
  var assembleTiles = [];
  var assembleMoves = 0;
  var assemblePlaying = false;
  var assembleCurrent = null;
  var assembleLastId = "";
  var assemblePhase = "";
  var assembleSelected = -1;
  var assembleDrag = null;
  var assembleResizeTimer = null;

  var assembleError = document.getElementById("assemble-error");
  var assembleHowto = document.getElementById("assemble-howto");
  var assembleHowtoBtn = document.getElementById("assemble-howto-btn");
  var assembleDifficulty = document.getElementById("assemble-difficulty");
  var assembleStage = document.getElementById("assemble-stage");
  var assemblePreview = document.getElementById("assemble-preview");
  var assemblePreviewImg = document.getElementById("assemble-preview-img");
  var assembleBoard = document.getElementById("assemble-board");
  var assembleSuccess = document.getElementById("assemble-success");
  var assembleMovesEl = document.getElementById("assemble-moves");
  var assemblePeekBtn = document.getElementById("assemble-peek");
  var assembleOtherBtn = document.getElementById("assemble-other");
  var assembleModal = document.getElementById("assemble-modal");
  var assembleModalImg = document.getElementById("assemble-modal-img");
  var assembleWinMoves = document.getElementById("assemble-win-moves");
  var assembleWinCaption = document.getElementById("assemble-win-caption");

  function leaveAssembleScreen() {
    stopAssemblePreviewTimer();
    clearAssembleDrag();
    assemblePlaying = false;
    if (assembleScreen) {
      assembleScreen.hidden = true;
    }
  }

  function assembleGrid() {
    if (assembleCount === 9) {
      return { cols: 3, rows: 3 };
    }
    return { cols: 3, rows: 2 };
  }

  function loadAssembleDifficulty() {
    try {
      var saved = parseInt(localStorage.getItem(ASSEMBLE_STORAGE_DIFF), 10);
      if (saved === 6 || saved === 9) {
        return saved;
      }
    } catch (error) {}
    return 6;
  }

  function saveAssembleDifficulty(count) {
    assembleCount = count === 9 ? 9 : 6;
    try {
      localStorage.setItem(ASSEMBLE_STORAGE_DIFF, String(assembleCount));
    } catch (error) {}
    Array.prototype.forEach.call(document.querySelectorAll("#assemble-difficulty .assemble-diff-btn"), function (button) {
      var on = parseInt(button.getAttribute("data-count"), 10) === assembleCount;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function pickAssembleItem() {
    var pool = puzzleItems.filter(function (item) {
      return item.id !== assembleLastId;
    });
    if (!pool.length) {
      pool = puzzleItems.slice();
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function assembleIsSolved(tiles) {
    var list = tiles || assembleTiles;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] !== i) {
        return false;
      }
    }
    return list.length > 0;
  }

  function shuffleAssembleTiles(count) {
    var tiles = [];
    var i;
    for (i = 0; i < count; i += 1) {
      tiles.push(i);
    }
    var extra = 0;
    while (extra < 40) {
      tiles = shuffle(tiles);
      if (!assembleIsSolved(tiles)) {
        return tiles;
      }
      extra += 1;
    }
    var swap = tiles[0];
    tiles[0] = tiles[1];
    tiles[1] = swap;
    return tiles;
  }

  function assemblePieceStyle(piece) {
    var grid = assembleGrid();
    var col = piece % grid.cols;
    var row = Math.floor(piece / grid.cols);
    var posX = grid.cols === 1 ? "0%" : (col * 100) / (grid.cols - 1) + "%";
    var posY = grid.rows === 1 ? "0%" : (row * 100) / (grid.rows - 1) + "%";
    return {
      backgroundImage: "url(\"" + assembleCurrent.image + "\")",
      backgroundRepeat: "no-repeat",
      backgroundSize: grid.cols * 100 + "% " + grid.rows * 100 + "%",
      backgroundPosition: posX + " " + posY
    };
  }

  function updateAssembleMoves() {
    assembleMovesEl.textContent = "Перестановок: " + assembleMoves;
  }

  function assembleChromeHeight() {
    var used = 0;
    if (!assembleScreen) {
      return used;
    }
    var screenCs = window.getComputedStyle(assembleScreen);
    used += (parseFloat(screenCs.paddingTop) || 0) + (parseFloat(screenCs.paddingBottom) || 0);
    used += puzzleOuterHeight(assembleScreen.querySelector(".game-top"));
    var game = assembleScreen.querySelector(".assemble-game");
    if (!game) {
      return used + 16;
    }
    Array.prototype.forEach.call(game.children, function (child) {
      if (child.id === "assemble-stage") {
        var visible = 0;
        Array.prototype.forEach.call(child.children, function (block) {
          if (!puzzleElementIsShown(block)) {
            return;
          }
          visible += 1;
          if (block === assembleBoard) {
            return;
          }
          if (block === assemblePreview) {
            var previewVisible = 0;
            Array.prototype.forEach.call(block.children, function (inner) {
              if (!puzzleElementIsShown(inner)) {
                return;
              }
              previewVisible += 1;
              if (inner.classList.contains("puzzle-frame")) {
                return;
              }
              used += puzzleOuterHeight(inner);
            });
            var previewGap = parseFloat(window.getComputedStyle(block).gap) || 0;
            if (previewVisible > 1) {
              used += previewGap * (previewVisible - 1);
            }
            return;
          }
          used += puzzleOuterHeight(block);
        });
        var gap = parseFloat(window.getComputedStyle(child).gap) || 0;
        if (visible > 1) {
          used += gap * (visible - 1);
        }
        return;
      }
      used += puzzleOuterHeight(child);
    });
    return used + 8;
  }

  function applyAssemblePhotoLayout(nw, nh) {
    if (!(nw > 0 && nh > 0) || !assembleScreen || assembleScreen.hidden) {
      return;
    }
    if (assembleCurrent) {
      assembleCurrent._nw = nw;
      assembleCurrent._nh = nh;
    }
    assembleScreen.style.setProperty("--puzzle-ar", nw + " / " + nh);
    var ar = nw / nh;
    var maxW = Math.max(160, assembleScreen.clientWidth);
    var game = assembleScreen.querySelector(".assemble-game");
    if (game && game.clientWidth > 0) {
      maxW = game.clientWidth;
    }
    var maxH = Math.max(180, window.innerHeight - assembleChromeHeight());
    var fitW = maxW;
    var fitH = fitW / ar;
    if (fitH > maxH) {
      fitH = maxH;
      fitW = fitH * ar;
    }
    if (fitW > maxW) {
      fitW = maxW;
    }
    assembleScreen.style.setProperty("--puzzle-fit-w", Math.floor(fitW) + "px");
  }

  function syncAssemblePhotoLayout() {
    var nw = assembleCurrent && assembleCurrent._nw;
    var nh = assembleCurrent && assembleCurrent._nh;
    var img = assemblePreviewImg;
    if (!(nw > 0 && nh > 0) && img && img.naturalWidth > 0) {
      var src = img.currentSrc || img.src || "";
      if (assembleCurrent && assembleCurrent.image && src.indexOf(assembleCurrent.image.replace(/^\.\//, "")) !== -1) {
        nw = img.naturalWidth;
        nh = img.naturalHeight;
      }
    }
    if (nw > 0 && nh > 0) {
      applyAssemblePhotoLayout(nw, nh);
    }
  }

  function clearAssembleDrag() {
    if (assembleDrag && assembleDrag.ghost && assembleDrag.ghost.parentNode) {
      assembleDrag.ghost.parentNode.removeChild(assembleDrag.ghost);
    }
    assembleDrag = null;
    if (assembleBoard) {
      Array.prototype.forEach.call(assembleBoard.querySelectorAll(".is-lifted, .is-target"), function (el) {
        el.classList.remove("is-lifted");
        el.classList.remove("is-target");
      });
    }
  }

  function renderAssembleBoard(options) {
    var complete = options && options.complete;
    var grid = assembleGrid();
    assembleBoard.innerHTML = "";
    assembleBoard.style.gridTemplateColumns = "repeat(" + grid.cols + ", minmax(0, 1fr))";
    assembleBoard.style.gridTemplateRows = "repeat(" + grid.rows + ", minmax(0, 1fr))";
    assembleBoard.classList.toggle("is-complete", !!complete);
    if (assembleCurrent) {
      assembleBoard.style.backgroundImage = "url(\"" + assembleCurrent.image + "\")";
    }
    assembleTiles.forEach(function (piece, index) {
      var slot = document.createElement("div");
      slot.className = "assemble-slot";
      slot.setAttribute("role", "listitem");
      slot.setAttribute("data-index", String(index));
      slot.setAttribute("data-piece", String(piece));
      var row = Math.floor(index / grid.cols) + 1;
      var col = (index % grid.cols) + 1;
      slot.setAttribute("aria-label", "Место " + row + " ряд, " + col + " столбец");
      if (!complete) {
        var pieceEl = document.createElement("button");
        pieceEl.type = "button";
        pieceEl.className = "assemble-piece";
        if (index === assembleSelected) {
          pieceEl.classList.add("is-selected");
        }
        pieceEl.setAttribute("data-index", String(index));
        pieceEl.setAttribute("data-piece", String(piece));
        pieceEl.setAttribute("aria-label", "Фрагмент картинки. Перетащите на нужное место");
        var style = assemblePieceStyle(piece);
        pieceEl.style.backgroundImage = style.backgroundImage;
        pieceEl.style.backgroundRepeat = style.backgroundRepeat;
        pieceEl.style.backgroundSize = style.backgroundSize;
        pieceEl.style.backgroundPosition = style.backgroundPosition;
        slot.appendChild(pieceEl);
      }
      assembleBoard.appendChild(slot);
    });
  }

  function showAssembleError() {
    assembleError.hidden = false;
    assembleDifficulty.hidden = true;
    assembleStage.hidden = true;
    assembleMovesEl.hidden = true;
    assemblePeekBtn.hidden = true;
    assembleOtherBtn.hidden = true;
    if (assembleHowto) {
      assembleHowto.hidden = true;
    }
    if (assembleHowtoBtn) {
      assembleHowtoBtn.hidden = true;
    }
  }

  function setAssemblePhase(phase) {
    assemblePhase = phase;
    assembleError.hidden = true;
    assembleStage.hidden = false;
    assembleDifficulty.hidden = phase !== "preview";
    assemblePreview.hidden = phase !== "preview";
    assembleBoard.hidden = phase !== "play" && phase !== "win";
    assembleSuccess.hidden = phase !== "win";
    assembleMovesEl.hidden = phase !== "play";
    assemblePeekBtn.hidden = phase !== "play";
    assembleOtherBtn.hidden = phase !== "play" && phase !== "preview";
    assemblePlaying = phase === "play";
    if (assembleHowto) {
      assembleHowto.hidden = phase === "win";
    }
    if (assembleHowtoBtn) {
      assembleHowtoBtn.hidden = phase !== "play";
    }
    if (assembleModal) {
      assembleModal.hidden = true;
    }
    syncAssemblePhotoLayout();
  }

  function startAssemblePlay() {
    stopAssemblePreviewTimer();
    clearAssembleDrag();
    if (!assembleCurrent) {
      return;
    }
    assembleTiles = shuffleAssembleTiles(assembleCount);
    assembleMoves = 0;
    assembleSelected = -1;
    updateAssembleMoves();
    setAssemblePhase("play");
    renderAssembleBoard();
    syncAssemblePhotoLayout();
  }

  function showAssemblePreview(item) {
    stopAssemblePreviewTimer();
    assembleCurrent = item;
    assembleLastId = item.id;
    assemblePreviewImg.src = item.image;
    assemblePreviewImg.alt = item.title || "Фотография для сборки";
    assembleModalImg.src = item.image;
    setAssemblePhase("preview");
    whenPuzzleImageReady(assemblePreviewImg, function (img) {
      applyAssemblePhotoLayout(img.naturalWidth, img.naturalHeight);
    });
    var wait = prefersReducedPuzzleMotion() ? 400 : 3000;
    assemblePreviewTimer = setTimeout(startAssemblePlay, wait);
  }

  function beginAssembleRound(keepPhoto) {
    if (puzzleItemsFailed || !puzzleItems.length) {
      showAssembleError();
      return;
    }
    var item = keepPhoto && assembleCurrent ? assembleCurrent : pickAssembleItem();
    showAssemblePreview(item);
  }

  function finishAssembleWin() {
    if (!assembleIsSolved(assembleTiles)) {
      return;
    }
    assemblePlaying = false;
    clearAssembleDrag();
    assembleSelected = -1;
    var caption = "";
    if (assembleCurrent) {
      caption = assembleCurrent.caption || assembleCurrent.title || "";
    }
    assembleWinMoves.textContent = "Вы собрали картинку за " + assembleMoves + " " + ruPuzzleMovesWord(assembleMoves);
    if (caption) {
      assembleWinCaption.hidden = false;
      assembleWinCaption.textContent = caption;
    } else {
      assembleWinCaption.hidden = true;
    }
    renderAssembleBoard({ complete: true });
    setAssemblePhase("win");
    syncAssemblePhotoLayout();
    playSound("correct", 0.28);
    notifyRoom("puzzleCompleted", { game: "assemble" });
    notifyRoom("gameCompleted", { game: "assemble" });
  }

  function swapAssembleSlots(fromIndex, toIndex) {
    if (!assemblePlaying || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }
    if (fromIndex >= assembleTiles.length || toIndex >= assembleTiles.length) {
      return;
    }
    var temp = assembleTiles[fromIndex];
    assembleTiles[fromIndex] = assembleTiles[toIndex];
    assembleTiles[toIndex] = temp;
    assembleMoves += 1;
    assembleSelected = -1;
    updateAssembleMoves();
    playSound("click", 0.16);
    if (assembleIsSolved(assembleTiles)) {
      finishAssembleWin();
      return;
    }
    renderAssembleBoard();
  }

  function assembleIndexFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) {
      return -1;
    }
    var slot = el.closest ? el.closest(".assemble-slot") : null;
    if (!slot || !assembleBoard.contains(slot)) {
      return -1;
    }
    return parseInt(slot.getAttribute("data-index"), 10);
  }

  function startAssembleDrag(event, index) {
    if (!assemblePlaying || event.button) {
      return;
    }
    var pieceEl = event.target.closest(".assemble-piece");
    if (!pieceEl) {
      return;
    }
    event.preventDefault();
    var rect = pieceEl.getBoundingClientRect();
    assembleDrag = {
      from: index,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
      ghost: null,
      pointerId: event.pointerId
    };
    if (assembleBoard.setPointerCapture) {
      try {
        assembleBoard.setPointerCapture(event.pointerId);
      } catch (error) {}
    }
  }

  function moveAssembleDrag(event) {
    if (!assembleDrag) {
      return;
    }
    var dx = event.clientX - assembleDrag.startX;
    var dy = event.clientY - assembleDrag.startY;
    if (!assembleDrag.moved && dx * dx + dy * dy < 64) {
      return;
    }
    assembleDrag.moved = true;
    assembleSelected = -1;
    if (!assembleDrag.ghost) {
      var ghost = document.createElement("div");
      ghost.className = "assemble-ghost";
      ghost.style.width = assembleDrag.width + "px";
      ghost.style.height = assembleDrag.height + "px";
      var style = assemblePieceStyle(assembleTiles[assembleDrag.from]);
      ghost.style.backgroundImage = style.backgroundImage;
      ghost.style.backgroundRepeat = style.backgroundRepeat;
      ghost.style.backgroundSize = style.backgroundSize;
      ghost.style.backgroundPosition = style.backgroundPosition;
      document.body.appendChild(ghost);
      assembleDrag.ghost = ghost;
      var source = assembleBoard.querySelector('.assemble-piece[data-index="' + assembleDrag.from + '"]');
      if (source) {
        source.classList.add("is-lifted");
      }
    }
    assembleDrag.ghost.style.left = event.clientX - assembleDrag.offsetX + "px";
    assembleDrag.ghost.style.top = event.clientY - assembleDrag.offsetY + "px";
    var over = assembleIndexFromPoint(event.clientX, event.clientY);
    Array.prototype.forEach.call(assembleBoard.querySelectorAll(".assemble-slot"), function (slot) {
      slot.classList.toggle("is-target", parseInt(slot.getAttribute("data-index"), 10) === over && over !== assembleDrag.from);
    });
  }

  function endAssembleDrag(event) {
    if (!assembleDrag) {
      return;
    }
    var from = assembleDrag.from;
    var moved = assembleDrag.moved;
    var x = event.clientX;
    var y = event.clientY;
    if (assembleBoard.releasePointerCapture && assembleDrag.pointerId != null) {
      try {
        assembleBoard.releasePointerCapture(assembleDrag.pointerId);
      } catch (error) {}
    }
    clearAssembleDrag();
    if (!assemblePlaying) {
      return;
    }
    if (!moved) {
      if (assembleSelected === from) {
        assembleSelected = -1;
        renderAssembleBoard();
        return;
      }
      if (assembleSelected >= 0 && assembleSelected !== from) {
        swapAssembleSlots(assembleSelected, from);
        return;
      }
      assembleSelected = from;
      renderAssembleBoard();
      return;
    }
    var to = assembleIndexFromPoint(x, y);
    if (to >= 0 && to !== from) {
      swapAssembleSlots(from, to);
    }
  }

  function showAssembleScreen() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    assembleScreen.hidden = false;
    saveAssembleDifficulty(loadAssembleDifficulty());
    notifyRoom("sectionVisited", { section: "assemble" });
    loadPuzzleItems(function () {
      if (assembleScreen.hidden) {
        return;
      }
      beginAssembleRound(false);
    });
  }

  document.getElementById("open-puzzle").addEventListener("click", showAssembleScreen);
  document.getElementById("assemble-back").addEventListener("click", showPhotoHub);
  document.getElementById("assemble-win-back").addEventListener("click", showPhotoHub);
  document.getElementById("assemble-start-now").addEventListener("click", startAssemblePlay);
  document.getElementById("assemble-again").addEventListener("click", function () {
    startAssemblePlay();
  });
  document.getElementById("assemble-other").addEventListener("click", function () {
    beginAssembleRound(false);
  });
  document.getElementById("assemble-win-other").addEventListener("click", function () {
    beginAssembleRound(false);
  });
  if (assembleHowtoBtn) {
    assembleHowtoBtn.addEventListener("click", function () {
      if (assembleHowto) {
        assembleHowto.classList.remove("is-recall");
        void assembleHowto.offsetWidth;
        assembleHowto.classList.add("is-recall");
      }
    });
  }
  document.getElementById("assemble-peek").addEventListener("click", function () {
    if (!assemblePlaying || !assembleCurrent) {
      return;
    }
    assembleModal.hidden = false;
    document.getElementById("assemble-modal-continue").focus();
  });
  document.getElementById("assemble-modal-continue").addEventListener("click", function () {
    assembleModal.hidden = true;
  });
  window.addEventListener("resize", function () {
    if (!assembleScreen || assembleScreen.hidden) {
      return;
    }
    if (assembleResizeTimer) {
      clearTimeout(assembleResizeTimer);
    }
    assembleResizeTimer = setTimeout(syncAssemblePhotoLayout, 50);
  });
  Array.prototype.forEach.call(document.querySelectorAll("#assemble-difficulty .assemble-diff-btn"), function (button) {
    button.addEventListener("click", function () {
      saveAssembleDifficulty(parseInt(button.getAttribute("data-count"), 10));
    });
  });
  assembleBoard.addEventListener("pointerdown", function (event) {
    var piece = event.target.closest(".assemble-piece");
    if (!piece || !assemblePlaying) {
      return;
    }
    startAssembleDrag(event, parseInt(piece.getAttribute("data-index"), 10));
  }, { passive: false });
  assembleBoard.addEventListener("pointermove", moveAssembleDrag);
  assembleBoard.addEventListener("pointerup", endAssembleDrag);
  assembleBoard.addEventListener("pointercancel", function () {
    clearAssembleDrag();
  });
  assembleBoard.addEventListener("dragstart", function (event) {
    event.preventDefault();
  });

  var RECIPE_STORAGE = "vspominaykaRecipes";
  var RECIPE_CATEGORIES = [
    "Супы",
    "Салаты",
    "Выпечка",
    "Вторые блюда",
    "Заготовки",
    "Десерты",
    "Напитки",
    "Другое"
  ];
  var RECIPE_FILTERS = ["Все", "Супы", "Выпечка", "Заготовки", "Десерты"];
  var RECIPE_UNITS = ["г", "кг", "мл", "л", "шт.", "ст. л.", "ч. л.", "стакан", "по вкусу"];
  var RECIPE_INGREDIENTS = [
    { name: "картофель", icon: "🥔" },
    { name: "морковь", icon: "🥕" },
    { name: "лук", icon: "🧅" },
    { name: "капуста", icon: "🥬" },
    { name: "свёкла", icon: "🟣" },
    { name: "яйца", icon: "🥚" },
    { name: "молоко", icon: "🥛" },
    { name: "сметана", icon: "🥣" },
    { name: "масло", icon: "🧈" },
    { name: "мука", icon: "🌾" },
    { name: "сахар", icon: "🍬" },
    { name: "соль", icon: "🧂" },
    { name: "мясо", icon: "🥩" },
    { name: "курица", icon: "🍗" },
    { name: "рыба", icon: "🐟" },
    { name: "рис", icon: "🍚" },
    { name: "гречка", icon: "🌾" },
    { name: "яблоки", icon: "🍎" },
    { name: "ягоды", icon: "🍓" },
    { name: "творог", icon: "🧀" }
  ];

  var recipeListView = document.getElementById("recipe-list-view");
  var recipeDetailView = document.getElementById("recipe-detail-view");
  var recipeFormView = document.getElementById("recipe-form-view");
  var recipeListEl = document.getElementById("recipe-list");
  var recipeEmptyEl = document.getElementById("recipe-empty");
  var recipeNoneEl = document.getElementById("recipe-none");
  var recipeSavedEl = document.getElementById("recipe-saved");
  var recipeSearchEl = document.getElementById("recipe-search");
  var recipeFiltersEl = document.getElementById("recipe-filters");
  var recipeFilterSelect = document.getElementById("recipe-filter-select");
  var recipeForm = document.getElementById("recipe-form");
  var recipeTitleInput = document.getElementById("recipe-title");
  var recipeAuthorInput = document.getElementById("recipe-author");
  var recipeCategorySelect = document.getElementById("recipe-category");
  var recipeInstructions = document.getElementById("recipe-instructions");
  var recipeFormTitle = document.getElementById("recipe-form-title");
  var ingGridEl = document.getElementById("ing-grid");
  var ingSelectedEl = document.getElementById("ing-selected");
  var recipeCustomIng = document.getElementById("recipe-custom-ing");
  var recipeVoiceStatus = document.getElementById("recipe-voice-status");
  var recipeVoiceNote = document.getElementById("recipe-voice-note");
  var recipeDialog = document.getElementById("recipe-dialog");
  var recipeFilter = "Все";
  var recipeDraftIngs = [];
  var recipeEditId = "";
  var recipePendingDelete = "";
  var recipeSpeech = null;
  var recipeListening = false;
  var recipeVoiceTimer = 0;
  var recipeSavedTimer = 0;
  var recipeHighlightId = "";
  var recipeMode = "mine";
  var libraryRecipes = [];
  var libraryCategories = ["Все"];
  var libraryLoaded = false;
  var libraryLoading = false;
  var libraryLoadFailed = false;
  var currentLibDetailId = "";
  var recipeAddBtn = document.getElementById("recipe-add");
  var recipeModeMineBtn = document.getElementById("recipe-mode-mine");
  var recipeModeLibraryBtn = document.getElementById("recipe-mode-library");
  var recipeLibraryNote = document.getElementById("recipe-library-note");
  var recipeLibDetailView = document.getElementById("recipe-lib-detail-view");
  var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

  function formatIngredientLine(item) {
    var name = capitalizeName(item.name);
    if (item.unit === "по вкусу" || !item.amount) {
      if (item.unit === "по вкусу") {
        return name + " — по вкусу";
      }
      return name;
    }
    return name + " — " + item.amount + " " + item.unit;
  }

  function formatRecipeDate(iso) {
    if (!iso) {
      return "";
    }
    try {
      return new Date(iso).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return "";
    }
  }

  function appendVoiceText(field, text) {
    if (!field || !text) {
      return;
    }
    text = String(text).trim();
    if (!text) {
      return;
    }
    if (field.value && !/\s$/.test(field.value)) {
      field.value += " ";
    }
    field.value += text;
  }

  function showRecipeSavedMessage(id, text) {
    recipeHighlightId = id || "";
    if (recipeSavedEl) {
      recipeSavedEl.textContent = text || "Рецепт сохранён 🌷";
      recipeSavedEl.hidden = false;
      window.clearTimeout(recipeSavedTimer);
      recipeSavedTimer = window.setTimeout(function () {
        recipeSavedEl.hidden = true;
        recipeSavedEl.textContent = "Рецепт сохранён 🌷";
      }, 3200);
    }
  }

  function formatLibraryInstructionsText(instructions) {
    if (Array.isArray(instructions)) {
      return instructions.map(function (step, index) {
        return (index + 1) + ". " + step;
      }).join("\n");
    }
    return instructions || "";
  }

  function isLibrarySaved(libId) {
    return loadRecipes().some(function (item) {
      return item.sourceLibId === libId;
    });
  }

  function showLibraryNote(text) {
    if (!recipeLibraryNote) {
      return;
    }
    if (text) {
      recipeLibraryNote.textContent = text;
      recipeLibraryNote.hidden = false;
    } else {
      recipeLibraryNote.textContent = "";
      recipeLibraryNote.hidden = true;
    }
  }

  function loadLibraryScriptFallback(callback) {
    if (window.VSPOMINAYKA_LIBRARY && Array.isArray(window.VSPOMINAYKA_LIBRARY)) {
      callback(window.VSPOMINAYKA_LIBRARY);
      return;
    }
    var script = document.createElement("script");
    script.src = "data/recipes.js";
    script.onload = function () {
      if (window.VSPOMINAYKA_LIBRARY && Array.isArray(window.VSPOMINAYKA_LIBRARY)) {
        callback(window.VSPOMINAYKA_LIBRARY);
      } else {
        libraryLoadFailed = true;
        libraryLoading = false;
        showLibraryNote("Не удалось загрузить книгу рецептов. Можно открыть проект через локальный просмотр или использовать файл data/recipes.js.");
        callback([]);
      }
    };
    script.onerror = function () {
      libraryLoadFailed = true;
      libraryLoading = false;
      showLibraryNote("Не удалось загрузить книгу рецептов. Можно открыть проект через локальный просмотр или использовать файл data/recipes.js.");
      callback([]);
    };
    document.head.appendChild(script);
  }

  function finishLibraryLoad(list) {
    libraryRecipes = list || [];
    libraryCategories = ["Все"];
    libraryRecipes.forEach(function (item) {
      if (item.category && libraryCategories.indexOf(item.category) === -1) {
        libraryCategories.push(item.category);
      }
    });
    libraryCategories.sort(function (a, b) {
      if (a === "Все") {
        return -1;
      }
      if (b === "Все") {
        return 1;
      }
      return a.localeCompare(b, "ru");
    });
    libraryLoaded = true;
    libraryLoading = false;
    if (libraryRecipes.length) {
      showLibraryNote("");
    }
  }

  function loadLibraryRecipes(callback) {
    if (libraryLoaded) {
      callback(libraryRecipes);
      return;
    }
    if (libraryLoading) {
      return;
    }
    libraryLoading = true;
    libraryLoadFailed = false;
    showLibraryNote("");

    if (window.VSPOMINAYKA_LIBRARY && Array.isArray(window.VSPOMINAYKA_LIBRARY)) {
      finishLibraryLoad(window.VSPOMINAYKA_LIBRARY);
      callback(libraryRecipes);
      return;
    }

    if (typeof fetch !== "function") {
      loadLibraryScriptFallback(function (list) {
        finishLibraryLoad(list);
        callback(libraryRecipes);
      });
      return;
    }

    fetch("data/recipes.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("fetch failed");
        }
        return response.json();
      })
      .then(function (data) {
        finishLibraryLoad(data);
        callback(libraryRecipes);
      })
      .catch(function () {
        loadLibraryScriptFallback(function (list) {
          finishLibraryLoad(list);
          callback(libraryRecipes);
        });
      });
  }

  function setRecipeMode(mode) {
    recipeMode = mode;
    recipeFilter = "Все";
    if (recipeModeMineBtn) {
      recipeModeMineBtn.classList.toggle("is-on", mode === "mine");
      recipeModeMineBtn.setAttribute("aria-selected", mode === "mine" ? "true" : "false");
    }
    if (recipeModeLibraryBtn) {
      recipeModeLibraryBtn.classList.toggle("is-on", mode === "library");
      recipeModeLibraryBtn.setAttribute("aria-selected", mode === "library" ? "true" : "false");
    }
    if (recipeAddBtn) {
      recipeAddBtn.hidden = mode === "library";
    }
    renderRecipeFilters();
    if (mode === "library") {
      loadLibraryRecipes(function () {
        renderRecipeFilters();
        renderRecipeList();
      });
    } else {
      renderRecipeList();
    }
  }

  function updateLibrarySaveButtons(libId) {
    var saved = isLibrarySaved(libId);
    var buttons = document.querySelectorAll('[data-lib-save="' + libId + '"]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.textContent = saved ? "♡ Уже сохранено" : "♡ Сохранить себе";
      button.disabled = saved;
      button.classList.toggle("is-saved", saved);
    });
  }

  function saveLibraryToMine(libId) {
    if (isLibrarySaved(libId)) {
      showRecipeSavedMessage("", "Этот рецепт уже в вашей книге 🌿");
      updateLibrarySaveButtons(libId);
      return;
    }
    var lib = null;
    var i;
    for (i = 0; i < libraryRecipes.length; i += 1) {
      if (libraryRecipes[i].id === libId) {
        lib = libraryRecipes[i];
        break;
      }
    }
    if (!lib) {
      return;
    }
    var now = new Date().toISOString();
    var copy = {
      id: "recipe-" + Date.now(),
      sourceLibId: lib.id,
      title: lib.title,
      author: "Книга рецептов",
      category: lib.category,
      ingredients: (lib.ingredients || []).map(function (item) {
        return {
          name: item.name,
          amount: String(item.amount || "").trim(),
          unit: item.unit || ""
        };
      }),
      instructions: formatLibraryInstructionsText(lib.instructions),
      createdAt: now,
      updatedAt: now
    };
    var list = loadRecipes();
    list.unshift(copy);
    saveRecipes(list);
    updateLibrarySaveButtons(libId);
    showRecipeSavedMessage(copy.id, "Рецепт добавлен в вашу книгу 🌿");
  }
  function capitalizeName(name) {
    if (!name) {
      return "";
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function ingredientIcon(name) {
    var lower = String(name).toLowerCase();
    var i;
    for (i = 0; i < RECIPE_INGREDIENTS.length; i += 1) {
      if (RECIPE_INGREDIENTS[i].name === lower) {
        return RECIPE_INGREDIENTS[i].icon;
      }
    }
    return "🌿";
  }

  function loadRecipes() {
    try {
      var saved = JSON.parse(localStorage.getItem(RECIPE_STORAGE) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveRecipes(list) {
    try {
      localStorage.setItem(RECIPE_STORAGE, JSON.stringify(list));
    } catch (error) {}
  }

  function stopRecipeVoice() {
    recipeListening = false;
    if (recipeSpeech) {
      try {
        recipeSpeech.onresult = null;
        recipeSpeech.onerror = null;
        recipeSpeech.onend = null;
        recipeSpeech.stop();
      } catch (error) {}
      recipeSpeech = null;
    }
  }

  function setVoiceStatus(text) {
    window.clearTimeout(recipeVoiceTimer);
    recipeVoiceStatus.textContent = text || "";
    if (text === "Готово") {
      recipeVoiceTimer = window.setTimeout(function () {
        recipeVoiceStatus.textContent = "";
      }, 1800);
    }
  }

  function startRecipeVoice(fieldId) {
    var field = document.getElementById(fieldId);
    if (!field || !SpeechRecognitionAPI) {
      return;
    }
    stopRecipeVoice();
    try {
      recipeSpeech = new SpeechRecognitionAPI();
      recipeSpeech.lang = "ru-RU";
      recipeSpeech.continuous = fieldId === "recipe-instructions";
      recipeSpeech.interimResults = false;
      recipeListening = true;
      setVoiceStatus("Слушаю…");
      recipeSpeech.onresult = function (event) {
        var text = "";
        var i;
        for (i = event.resultIndex; i < event.results.length; i += 1) {
          if (event.results[i].isFinal) {
            text += event.results[i][0].transcript;
          }
        }
        text = text.trim();
        if (!text) {
          return;
        }
        if (fieldId === "recipe-custom-ing") {
          addDraftIngredient(text);
          field.value = "";
        } else {
          appendVoiceText(field, text);
        }
        setVoiceStatus("Готово");
      };
      recipeSpeech.onerror = function () {
        recipeListening = false;
        setVoiceStatus("Готово");
      };
      recipeSpeech.onend = function () {
        recipeListening = false;
        if (recipeVoiceStatus.textContent === "Слушаю…") {
          setVoiceStatus("Готово");
        }
      };
      recipeSpeech.start();
    } catch (error) {
      recipeListening = false;
      setVoiceStatus("");
    }
  }

  function showRecipesScreen() {
    stopGarden();
    stopMemoryRound();
    stopRecipeVoice();
    hideContentPages();
    recipesScreen.hidden = false;
    recipeDialog.hidden = true;
    notifyRoom("sectionVisited", { section: "recipes" });
    recipeMode = "mine";
    recipeFilter = "Все";
    if (recipeModeMineBtn) {
      recipeModeMineBtn.classList.add("is-on");
      recipeModeMineBtn.setAttribute("aria-selected", "true");
    }
    if (recipeModeLibraryBtn) {
      recipeModeLibraryBtn.classList.remove("is-on");
      recipeModeLibraryBtn.setAttribute("aria-selected", "false");
    }
    if (recipeAddBtn) {
      recipeAddBtn.hidden = false;
    }
    showRecipeList();
  }

  function setRecipesBackLabel() {
    var recipesBackBtn = document.getElementById("recipes-back");
    if (!recipesBackBtn) {
      return;
    }
    recipesBackBtn.textContent = recipeListView && !recipeListView.hidden
      ? "← К Моему важному"
      : "← К книге";
  }

  function showRecipeList() {
    stopRecipeVoice();
    recipeListView.hidden = false;
    recipeDetailView.hidden = true;
    recipeFormView.hidden = true;
    if (recipeLibDetailView) {
      recipeLibDetailView.hidden = true;
    }
    setRecipesBackLabel();
    renderRecipeList();
    if (recipeHighlightId) {
      window.requestAnimationFrame(function () {
        var card = recipeListEl.querySelector('[data-id="' + recipeHighlightId + '"]');
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  }

  function matchesRecipe(recipe, query, category) {
    if (category && category !== "Все" && recipe.category !== category) {
      return false;
    }
    if (!query) {
      return true;
    }
    var hay = [
      recipe.title,
      recipe.author,
      recipe.category,
      (recipe.ingredients || []).map(function (item) {
        return item.name;
      }).join(" ")
    ].join(" ").toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function matchesLibraryRecipe(recipe, query, category) {
    if (category && category !== "Все" && recipe.category !== category) {
      return false;
    }
    if (!query) {
      return true;
    }
    var hay = [
      recipe.title,
      recipe.category,
      recipe.description,
      (recipe.searchTags || []).join(" "),
      (recipe.ingredients || []).map(function (item) {
        return item.name;
      }).join(" ")
    ].join(" ").toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function renderRecipeList() {
    if (recipeMode === "library") {
      renderLibraryList();
      return;
    }
    var recipes = loadRecipes();
    var query = (recipeSearchEl.value || "").trim().toLowerCase();
    var visible = recipes.filter(function (recipe) {
      return matchesRecipe(recipe, query, recipeFilter);
    });
    recipeListEl.innerHTML = "";
    recipeEmptyEl.hidden = recipes.length > 0;
    recipeNoneEl.hidden = recipes.length === 0 || visible.length > 0;
    visible.forEach(function (recipe) {
      recipeListEl.appendChild(renderRecipeCard(recipe));
    });
  }

  function renderLibraryList() {
    var query = (recipeSearchEl.value || "").trim().toLowerCase();
    recipeListEl.innerHTML = "";
    recipeEmptyEl.hidden = true;

    if (libraryLoading && !libraryLoaded) {
      recipeNoneEl.hidden = false;
      recipeNoneEl.textContent = "Загружаем книгу рецептов…";
      return;
    }

    if (libraryLoadFailed || !libraryRecipes.length) {
      recipeNoneEl.hidden = false;
      recipeNoneEl.textContent = "Не удалось загрузить книгу рецептов 🌿";
      return;
    }

    var visible = libraryRecipes.filter(function (recipe) {
      return matchesLibraryRecipe(recipe, query, recipeFilter);
    });
    recipeNoneEl.hidden = visible.length > 0;
    recipeNoneEl.textContent = "Ничего не найдено 🌿";
    visible.forEach(function (recipe) {
      recipeListEl.appendChild(renderLibraryCard(recipe));
    });
  }

  function renderLibraryCard(recipe) {
    var card = document.createElement("article");
    card.className = "recipe-card";
    card.dataset.id = recipe.id;
    var title = document.createElement("h2");
    title.textContent = recipe.title;
    var category = document.createElement("p");
    category.className = "recipe-category";
    category.textContent = recipe.category || "Другое";
    var desc = document.createElement("p");
    desc.className = "recipe-desc";
    desc.textContent = recipe.description || "";
    var time = document.createElement("p");
    time.className = "recipe-time";
    time.textContent = "⏱ " + (recipe.cookingTime || "—");
    var ings = document.createElement("ul");
    ings.className = "recipe-ing-preview";
    (recipe.ingredients || []).slice(0, 5).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = ingredientIcon(item.name) + " " + formatIngredientLine(item);
      ings.appendChild(li);
    });
    var actions = document.createElement("div");
    actions.className = "recipe-card-actions";
    var openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "next-btn";
    openBtn.textContent = "Открыть";
    openBtn.addEventListener("click", function () {
      openLibraryDetail(recipe.id);
    });
    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "hint-btn recipe-save-btn";
    saveBtn.dataset.libSave = recipe.id;
    saveBtn.textContent = isLibrarySaved(recipe.id) ? "♡ Уже сохранено" : "♡ Сохранить себе";
    saveBtn.disabled = isLibrarySaved(recipe.id);
    if (saveBtn.disabled) {
      saveBtn.classList.add("is-saved");
    }
    saveBtn.addEventListener("click", function () {
      saveLibraryToMine(recipe.id);
    });
    actions.appendChild(openBtn);
    actions.appendChild(saveBtn);
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(desc);
    card.appendChild(time);
    card.appendChild(ings);
    card.appendChild(actions);
    return card;
  }

  function openLibraryDetail(id) {
    var recipe = null;
    var i;
    for (i = 0; i < libraryRecipes.length; i += 1) {
      if (libraryRecipes[i].id === id) {
        recipe = libraryRecipes[i];
        break;
      }
    }
    if (!recipe) {
      return;
    }
    currentLibDetailId = id;
    recipeListView.hidden = true;
    recipeDetailView.hidden = true;
    recipeFormView.hidden = true;
    recipeLibDetailView.hidden = false;
    setRecipesBackLabel();
    document.getElementById("recipe-lib-detail-title").textContent = recipe.title;
    document.getElementById("recipe-lib-detail-desc").textContent = recipe.description || "";
    document.getElementById("recipe-lib-detail-category").textContent = recipe.category || "Другое";
    document.getElementById("recipe-lib-detail-time").textContent = "⏱ Время приготовления: " + (recipe.cookingTime || "—");
    document.getElementById("recipe-lib-detail-servings").textContent = "🍽 Количество порций: " + (recipe.servings || "—");
    var list = document.getElementById("recipe-lib-detail-ings");
    list.innerHTML = "";
    (recipe.ingredients || []).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = ingredientIcon(item.name) + " " + formatIngredientLine(item);
      list.appendChild(li);
    });
    var steps = document.getElementById("recipe-lib-detail-steps");
    steps.innerHTML = "";
    (recipe.instructions || []).forEach(function (step) {
      var li = document.createElement("li");
      li.textContent = step;
      steps.appendChild(li);
    });
    var saveBtn = document.getElementById("recipe-lib-save");
    saveBtn.dataset.libSave = recipe.id;
    updateLibrarySaveButtons(recipe.id);
    saveBtn.onclick = function () {
      saveLibraryToMine(recipe.id);
    };
  }

  function renderRecipeCard(recipe) {
    var card = document.createElement("article");
    card.className = "recipe-card";
    if (recipe.id === recipeHighlightId) {
      card.classList.add("is-highlight");
    }
    card.dataset.id = recipe.id;
    var title = document.createElement("h2");
    title.textContent = recipe.title;
    var author = document.createElement("p");
    author.className = "recipe-meta";
    author.textContent = "Автор: " + (recipe.author || "Мой рецепт");
    var category = document.createElement("p");
    category.className = "recipe-category";
    category.textContent = recipe.category || "Другое";
    var date = document.createElement("p");
    date.className = "recipe-date";
    var dateText = formatRecipeDate(recipe.createdAt);
    if (dateText) {
      date.textContent = "Добавлен: " + dateText;
    }
    var ings = document.createElement("ul");
    ings.className = "recipe-ing-preview";
    (recipe.ingredients || []).slice(0, 5).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = ingredientIcon(item.name) + " " + formatIngredientLine(item);
      ings.appendChild(li);
    });
    var actions = document.createElement("div");
    actions.className = "recipe-card-actions";
    var openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "next-btn";
    openBtn.textContent = "Открыть";
    openBtn.addEventListener("click", function () {
      openRecipeDetail(recipe.id);
    });
    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "hint-btn";
    editBtn.textContent = "Изменить";
    editBtn.addEventListener("click", function () {
      openRecipeForm(recipe.id);
    });
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "hint-btn";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", function () {
      askDeleteRecipe(recipe.id);
    });
    actions.appendChild(openBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(category);
    if (dateText) {
      card.appendChild(date);
    }
    card.appendChild(ings);
    card.appendChild(actions);
    return card;
  }

  function openRecipeDetail(id) {
    var recipe = loadRecipes().filter(function (item) {
      return item.id === id;
    })[0];
    if (!recipe) {
      return;
    }
    recipeListView.hidden = true;
    recipeFormView.hidden = true;
    recipeDetailView.hidden = false;
    setRecipesBackLabel();
    document.getElementById("recipe-detail-title").textContent = recipe.title;
    document.getElementById("recipe-detail-meta").textContent =
      "Рецепт от: " + (recipe.author || "Мой рецепт") + " · " + (recipe.category || "Другое");
    var list = document.getElementById("recipe-detail-ings");
    list.innerHTML = "";
    (recipe.ingredients || []).forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = ingredientIcon(item.name) + " " + formatIngredientLine(item);
      list.appendChild(li);
    });
    document.getElementById("recipe-detail-text").textContent = recipe.instructions || "";
    document.getElementById("recipe-detail-edit").onclick = function () {
      openRecipeForm(recipe.id);
    };
  }

  function defaultUnit(name) {
    var lower = String(name).toLowerCase();
    if (lower === "яйца" || lower === "яблоки") {
      return "шт.";
    }
    if (lower === "молоко" || lower === "сметана") {
      return "мл";
    }
    if (lower === "соль" || lower === "сахар") {
      return "по вкусу";
    }
    return "г";
  }

  function addDraftIngredient(name) {
    var clean = String(name || "").trim();
    if (!clean) {
      return;
    }
    var exists = recipeDraftIngs.some(function (item) {
      return item.name.toLowerCase() === clean.toLowerCase();
    });
    if (exists) {
      return;
    }
    recipeDraftIngs.push({
      name: clean,
      amount: "",
      unit: defaultUnit(clean)
    });
    renderDraftIngredients();
  }

  function renderDraftIngredients() {
    ingSelectedEl.innerHTML = "";
    recipeDraftIngs.forEach(function (item, index) {
      var row = document.createElement("div");
      row.className = "ing-row";
      var summary = document.createElement("p");
      summary.className = "ing-row-summary";
      function updateSummary() {
        summary.textContent = ingredientIcon(item.name) + " " + formatIngredientLine(item);
      }
      updateSummary();
      var controls = document.createElement("div");
      controls.className = "ing-row-controls";
      var amount = document.createElement("input");
      amount.type = "text";
      amount.inputMode = "decimal";
      amount.placeholder = "Количество";
      amount.value = item.amount;
      amount.setAttribute("aria-label", "Количество: " + item.name);
      amount.addEventListener("input", function () {
        recipeDraftIngs[index].amount = amount.value;
        updateSummary();
      });
      var unit = document.createElement("select");
      unit.setAttribute("aria-label", "Единица: " + item.name);
      RECIPE_UNITS.forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if (value === item.unit) {
          option.selected = true;
        }
        unit.appendChild(option);
      });
      unit.addEventListener("change", function () {
        recipeDraftIngs[index].unit = unit.value;
        updateSummary();
      });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "hint-btn";
      remove.textContent = "Убрать";
      remove.addEventListener("click", function () {
        recipeDraftIngs.splice(index, 1);
        renderDraftIngredients();
        markIngredientButtons();
      });
      controls.appendChild(amount);
      controls.appendChild(unit);
      controls.appendChild(remove);
      row.appendChild(summary);
      row.appendChild(controls);
      ingSelectedEl.appendChild(row);
    });
    markIngredientButtons();
  }

  function markIngredientButtons() {
    var names = recipeDraftIngs.map(function (item) {
      return item.name.toLowerCase();
    });
    Array.prototype.forEach.call(ingGridEl.children, function (button) {
      var name = button.getAttribute("data-name");
      button.classList.toggle("is-on", names.indexOf(name) !== -1);
    });
  }

  function openRecipeForm(id) {
    var recipe = null;
    recipeEditId = id || "";
    recipeListView.hidden = true;
    recipeDetailView.hidden = true;
    recipeFormView.hidden = false;
    if (recipeLibDetailView) {
      recipeLibDetailView.hidden = true;
    }
    setRecipesBackLabel();
    recipeFormTitle.textContent = id ? "Изменить рецепт" : "Новый рецепт";
    setVoiceStatus("");
    if (recipeSavedEl) {
      recipeSavedEl.hidden = true;
    }
    if (id) {
      recipe = loadRecipes().filter(function (item) {
        return item.id === id;
      })[0];
    }
    recipeTitleInput.value = recipe ? recipe.title : "";
    recipeAuthorInput.value = recipe ? recipe.author : "";
    recipeCategorySelect.value = recipe && recipe.category ? recipe.category : RECIPE_CATEGORIES[0];
    recipeInstructions.value = recipe ? recipe.instructions : "";
    recipeDraftIngs = recipe && recipe.ingredients
      ? recipe.ingredients.map(function (item) {
        return { name: item.name, amount: item.amount || "", unit: item.unit || "г" };
      })
      : [];
    renderDraftIngredients();
    recipeTitleInput.focus();
  }

  function askDeleteRecipe(id) {
    recipePendingDelete = id;
    recipeDialog.hidden = false;
  }

  function confirmDeleteRecipe() {
    if (!recipePendingDelete) {
      recipeDialog.hidden = true;
      return;
    }
    saveRecipes(loadRecipes().filter(function (item) {
      return item.id !== recipePendingDelete;
    }));
    recipePendingDelete = "";
    recipeDialog.hidden = true;
    showRecipeList();
  }

  function renderRecipeFilters() {
    var filters = recipeMode === "library" ? libraryCategories : ["Все"].concat(RECIPE_CATEGORIES);
    var quickFilters = recipeMode === "library" ? libraryCategories : RECIPE_FILTERS;
    recipeFiltersEl.innerHTML = "";
    recipeFilterSelect.innerHTML = "";
    quickFilters.forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "recipe-filter-btn" + (recipeFilter === name ? " is-on" : "");
      button.textContent = name;
      button.addEventListener("click", function () {
        recipeFilter = name;
        recipeFilterSelect.value = name;
        renderRecipeFilters();
        renderRecipeList();
      });
      recipeFiltersEl.appendChild(button);
    });
    filters.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === recipeFilter) {
        option.selected = true;
      }
      recipeFilterSelect.appendChild(option);
    });
  }

  function setupRecipeUi() {
    RECIPE_CATEGORIES.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      recipeCategorySelect.appendChild(option);
    });
    RECIPE_INGREDIENTS.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ing-chip";
      button.setAttribute("data-name", item.name);
      button.textContent = item.icon + " " + capitalizeName(item.name);
      button.addEventListener("click", function () {
        addDraftIngredient(item.name);
      });
      ingGridEl.appendChild(button);
    });
    renderRecipeFilters();
    recipeVoiceNote.hidden = !!SpeechRecognitionAPI;
    Array.prototype.forEach.call(document.querySelectorAll("[data-voice]"), function (button) {
      if (!SpeechRecognitionAPI) {
        button.disabled = true;
        return;
      }
      button.addEventListener("click", function () {
        startRecipeVoice(button.getAttribute("data-voice"));
      });
    });
  }

  var USSR_TOTAL = 10;
  var ussrItems = [];
  var ussrWaiters = [];
  var ussrLoaded = false;
  var ussrLoading = false;
  var ussrLoadFailed = false;
  var ussrDeck = [];
  var ussrIndex = 0;
  var ussrScore = 0;
  var ussrAnswered = false;
  var ussrCurrent = null;
  var ussrPlayEl = document.getElementById("ussr-play");
  var ussrResultEl = document.getElementById("ussr-result");
  var ussrStageEl = document.getElementById("ussr-stage");
  var ussrProgressEl = document.getElementById("ussr-progress");
  var ussrNote = document.getElementById("ussr-note");
  var ussrImg = document.getElementById("ussr-img");
  var ussrQuestionEl = document.getElementById("ussr-question");
  var ussrFeedback = document.getElementById("ussr-feedback");
  var ussrChoicesEl = document.getElementById("ussr-choices");
  var ussrStory = document.getElementById("ussr-story");
  var ussrMemoryEl = document.getElementById("ussr-memory");
  var ussrUseEl = document.getElementById("ussr-use");
  var ussrResultText = document.getElementById("ussr-result-text");

  if (ussrImg) {
    ussrImg.addEventListener("error", function () {
      if (!ussrImg.getAttribute("src")) {
        return;
      }
      if (ussrNote) {
        ussrNote.hidden = false;
        ussrNote.textContent = "Картинку этой вещи сейчас не удалось показать.";
      }
    });
  }

  function resolveProjectUrl(relativePath) {
    try {
      return new URL(relativePath, document.baseURI).href;
    } catch (error) {
      return relativePath;
    }
  }

  function notifyUssrWaiters() {
    var waiters = ussrWaiters.slice();
    ussrWaiters = [];
    waiters.forEach(function (fn) {
      fn(ussrItems);
    });
  }

  function finishUssrLoad(list) {
    ussrItems = (list || []).filter(function (item) {
      return item && item.name && item.image && Array.isArray(item.wrongAnswers) && item.wrongAnswers.length >= 3;
    });
    ussrLoaded = ussrItems.length > 0;
    ussrLoading = false;
    ussrLoadFailed = !ussrItems.length;
  }

  function loadUssrScriptFallback(callback) {
    if (window.VSPOMINAYKA_USSR_ITEMS && Array.isArray(window.VSPOMINAYKA_USSR_ITEMS)) {
      callback(window.VSPOMINAYKA_USSR_ITEMS);
      return;
    }
    var script = document.createElement("script");
    script.src = resolveProjectUrl("data/ussr_items.js");
    script.onload = function () {
      if (window.VSPOMINAYKA_USSR_ITEMS && Array.isArray(window.VSPOMINAYKA_USSR_ITEMS)) {
        callback(window.VSPOMINAYKA_USSR_ITEMS);
      } else {
        callback([]);
      }
    };
    script.onerror = function () {
      callback([]);
    };
    document.head.appendChild(script);
  }

  function loadUssrItems(callback) {
    callback = callback || function () {};
    if (ussrLoaded) {
      callback(ussrItems);
      return;
    }
    ussrWaiters.push(callback);
    if (ussrLoading) {
      return;
    }
    ussrLoading = true;
    ussrLoadFailed = false;

    if (window.VSPOMINAYKA_USSR_ITEMS && Array.isArray(window.VSPOMINAYKA_USSR_ITEMS)) {
      finishUssrLoad(window.VSPOMINAYKA_USSR_ITEMS);
      notifyUssrWaiters();
      return;
    }

    function failToFallback() {
      loadUssrScriptFallback(function (list) {
        finishUssrLoad(list);
        notifyUssrWaiters();
      });
    }

    if (typeof fetch !== "function") {
      failToFallback();
      return;
    }

    fetch(resolveProjectUrl("data/ussr_items.json"), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("fetch failed");
        }
        return response.json();
      })
      .then(function (data) {
        finishUssrLoad(Array.isArray(data) ? data : []);
        if (!ussrItems.length) {
          failToFallback();
          return;
        }
        notifyUssrWaiters();
      })
      .catch(function () {
        failToFallback();
      });
  }

  function ussrOptions(item) {
    var options = [item.name];
    var wrong = item.wrongAnswers || [];
    var i;
    for (i = 0; i < wrong.length; i += 1) {
      if (wrong[i] && wrong[i] !== item.name && options.indexOf(wrong[i]) === -1) {
        options.push(wrong[i]);
      }
      if (options.length === 4) {
        break;
      }
    }
    return shuffle(options);
  }

  function renderUssrHeader() {
    var playing = ussrPlayEl && !ussrPlayEl.hidden;
    if (ussrStageEl) {
      ussrStageEl.hidden = !playing;
      if (playing) {
        ussrStageEl.textContent = "Вещь " + (ussrIndex + 1) + " из " + USSR_TOTAL;
      }
    }
    if (ussrProgressEl) {
      ussrProgressEl.hidden = !playing;
      if (playing) {
        ussrProgressEl.textContent = "Угадано: " + ussrScore;
      }
    }
  }

  function showUssrResult() {
    if (ussrPlayEl) {
      ussrPlayEl.hidden = true;
    }
    if (ussrResultEl) {
      ussrResultEl.hidden = false;
    }
    if (ussrImg) {
      ussrImg.removeAttribute("src");
    }
    if (ussrResultText) {
      ussrResultText.textContent = "Вы узнали " + ussrScore + " из " + USSR_TOTAL + " вещей";
    }
    renderUssrHeader();
    notifyRoom("gameCompleted", { game: "ussr" });
  }

  function startUssrRound() {
    ussrCurrent = ussrDeck[ussrIndex];
    ussrAnswered = false;
    if (ussrNote) {
      ussrNote.hidden = true;
      ussrNote.textContent = "";
    }
    ussrFeedback.textContent = "";
    ussrStory.hidden = true;
    ussrChoicesEl.innerHTML = "";
    ussrQuestionEl.textContent = ussrCurrent.question || "Что это?";
    ussrImg.alt = "Знакомая вещь";
    ussrImg.src = resolveProjectUrl(ussrCurrent.image);
    ussrOptions(ussrCurrent).forEach(function (title) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ussr-choice";
      button.textContent = title;
      button.addEventListener("click", function () {
        answerUssr(button, title);
      });
      ussrChoicesEl.appendChild(button);
    });
    renderUssrHeader();
  }

  function startUssrGame() {
    loadUssrItems(function (list) {
      if (!list.length) {
        if (ussrPlayEl) {
          ussrPlayEl.hidden = false;
        }
        if (ussrResultEl) {
          ussrResultEl.hidden = true;
        }
        if (ussrNote) {
          ussrNote.hidden = false;
          ussrNote.textContent = "Не удалось загрузить вещи. Откройте проект через локальный просмотр.";
        }
        renderUssrHeader();
        return;
      }
      ussrDeck = shuffle(list).slice(0, Math.min(USSR_TOTAL, list.length));
      ussrIndex = 0;
      ussrScore = 0;
      if (ussrPlayEl) {
        ussrPlayEl.hidden = false;
      }
      if (ussrResultEl) {
        ussrResultEl.hidden = true;
      }
      startUssrRound();
    });
  }

  function answerUssr(button, title) {
    if (ussrAnswered || !ussrCurrent) {
      return;
    }
    ussrAnswered = true;
    var item = ussrCurrent;
    var correct = title === item.name;
    Array.prototype.forEach.call(ussrChoicesEl.querySelectorAll(".ussr-choice"), function (choice) {
      choice.disabled = true;
      if (choice.textContent === item.name) {
        choice.classList.add("is-right");
      } else if (choice === button) {
        choice.classList.add("is-miss");
      }
    });
    if (correct) {
      ussrScore += 1;
      playSound("correct", 0.22);
      ussrFeedback.textContent = "Точно! ❤️ Это — " + item.name;
      notifyRoom("correctAnswer", { source: "ussr" });
      notifyRoom("memorySaved", { source: "ussr" });
    } else {
      ussrFeedback.textContent = "Почти! Это — " + item.name;
    }
    ussrMemoryEl.textContent = item.memory || "";
    ussrUseEl.textContent = item.use || "";
    ussrStory.hidden = false;
    renderUssrHeader();
  }

  function goUssrNext() {
    if (ussrIndex + 1 >= ussrDeck.length) {
      showUssrResult();
      return;
    }
    playSound("page", 0.22);
    ussrIndex += 1;
    startUssrRound();
  }

  function showUssrScreen() {
    stopGarden();
    stopMemoryRound();
    hideContentPages();
    ussrScreen.hidden = false;
    startUssrGame();
    notifyRoom("sectionVisited", { section: "ussr" });
  }

  document.getElementById("open-proverb").addEventListener("click", showGame);
  document.getElementById("proverb-mode-continue").addEventListener("click", startContinueGame);
  document.getElementById("proverb-mode-pair").addEventListener("click", startPairRound);
  document.getElementById("proverb-mode-build").addEventListener("click", startBuildGame);
  document.getElementById("continue-next").addEventListener("click", goContinueNext);
  document.getElementById("pair-again").addEventListener("click", startPairRound);
  document.getElementById("build-undo").addEventListener("click", undoBuild);
  document.getElementById("build-next").addEventListener("click", goBuildNext);
  document.getElementById("proverb-again").addEventListener("click", function () {
    if (proverbMode === "build") {
      startBuildGame();
    } else {
      startContinueGame();
    }
  });
  document.getElementById("proverb-other").addEventListener("click", showProverbHub);
  document.getElementById("open-recipes").addEventListener("click", showRecipesScreen);
  document.getElementById("open-ussr").addEventListener("click", showUssrScreen);
  document.getElementById("memories-back").addEventListener("click", showHome);
  document.getElementById("ussr-back").addEventListener("click", showRememberHub);
  document.getElementById("ussr-next").addEventListener("click", goUssrNext);
  document.getElementById("ussr-again").addEventListener("click", startUssrGame);
  document.getElementById("ussr-home").addEventListener("click", showRememberHub);

  var RECALL_SESSION_SIZE = 10;
  var RECALL_RECENT_MAX = 30;

  function loadRecallRecentIds(key) {
    try {
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function saveRecallRecentIds(key, ids) {
    var prev = loadRecallRecentIds(key);
    var seen = {};
    var next = [];
    ids.concat(prev).forEach(function (id) {
      if (!id || seen[id]) {
        return;
      }
      seen[id] = true;
      next.push(id);
    });
    if (next.length > RECALL_RECENT_MAX) {
      next = next.slice(0, RECALL_RECENT_MAX);
    }
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {}
  }

  function filterRecallTasks(list) {
    return (list || []).filter(function (task) {
      return task &&
        task.id &&
        task.question &&
        Array.isArray(task.options) &&
        task.options.length >= 2 &&
        task.correctAnswer &&
        task.options.indexOf(task.correctAnswer) !== -1;
    });
  }

  function pickRecallSession(tasks, recentKey, count) {
    var list = filterRecallTasks(tasks);
    count = Math.min(count, list.length);
    if (!count) {
      return [];
    }
    var recent = loadRecallRecentIds(recentKey);
    var fresh = [];
    var used = [];
    list.forEach(function (task) {
      if (recent.indexOf(task.id) === -1) {
        fresh.push(task);
      } else {
        used.push(task);
      }
    });
    used.sort(function (a, b) {
      return recent.indexOf(b.id) - recent.indexOf(a.id);
    });
    var picked = shuffle(fresh);
    if (picked.length < count) {
      picked = picked.concat(shuffle(used));
    }
    picked = picked.slice(0, count);
    saveRecallRecentIds(recentKey, picked.map(function (task) {
      return task.id;
    }));
    return picked;
  }

  function bindRecallQuiz(config) {
    var index = 0;
    var score = 0;
    var locked = false;
    var deck = [];
    var playEl = document.getElementById(config.playId);
    var resultEl = document.getElementById(config.resultId);
    var promptEl = document.getElementById(config.promptId);
    var choicesEl = document.getElementById(config.choicesId);
    var feedbackEl = document.getElementById(config.feedbackId);
    var storyEl = document.getElementById(config.storyId);
    var memoryEl = document.getElementById(config.memoryId);
    var nextBtn = document.getElementById(config.nextId);
    var stageEl = document.getElementById(config.stageId);
    var progressEl = document.getElementById(config.progressId);
    var resultText = document.getElementById(config.resultTextId);
    var instructionEl = document.getElementById(config.instructionId);

    function sessionTotal() {
      return deck.length;
    }

    function renderHeader() {
      var total = sessionTotal() || RECALL_SESSION_SIZE;
      if (stageEl) {
        stageEl.textContent = config.stageLabel + " " + (index + 1) + " из " + total;
      }
      if (progressEl) {
        progressEl.textContent = "Вспомнили: " + score;
      }
    }

    function showResult() {
      playEl.hidden = true;
      resultEl.hidden = false;
      resultText.textContent = "Вы вспомнили " + score + " из " + sessionTotal();
      notifyRoom("gameCompleted", { game: config.game });
    }

    function startRound() {
      var task = deck[index];
      var options = shuffle((task.options || []).slice());
      locked = false;
      playEl.hidden = false;
      resultEl.hidden = true;
      storyEl.hidden = true;
      feedbackEl.textContent = "";
      if (instructionEl) {
        instructionEl.textContent = task.instruction || config.defaultInstruction || "Выберите ответ";
      }
      promptEl.textContent = task.question;
      choicesEl.innerHTML = "";
      renderHeader();
      options.forEach(function (label) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "ussr-choice";
        button.textContent = label;
        button.addEventListener("click", function () {
          if (locked) {
            return;
          }
          locked = true;
          var correct = label === task.correctAnswer;
          Array.prototype.forEach.call(choicesEl.querySelectorAll(".ussr-choice"), function (choice) {
            choice.disabled = true;
            if (choice.textContent === task.correctAnswer) {
              choice.classList.add("is-right");
            } else if (choice === button) {
              choice.classList.add("is-miss");
            }
          });
          if (correct) {
            score += 1;
            renderHeader();
            feedbackEl.textContent = "Точно! ❤️";
            playSound("correct", 0.28);
            notifyRoom("correctAnswer", { source: config.source });
          } else {
            feedbackEl.textContent = "Не совсем так";
            playSound("try-again", 0.22);
          }
          memoryEl.textContent = "Правильный ответ: " + task.correctAnswer + ". " + (task.explanation || "");
          storyEl.hidden = false;
        });
        choicesEl.appendChild(button);
      });
    }

    function startGame() {
      deck = pickRecallSession(config.tasks, config.recentKey, RECALL_SESSION_SIZE);
      index = 0;
      score = 0;
      if (!deck.length) {
        playEl.hidden = false;
        resultEl.hidden = true;
        storyEl.hidden = true;
        promptEl.textContent = "Не удалось загрузить задания.";
        choicesEl.innerHTML = "";
        feedbackEl.textContent = "";
        return;
      }
      startRound();
    }

    function goNext() {
      if (index + 1 >= sessionTotal()) {
        showResult();
        return;
      }
      playSound("page", 0.22);
      index += 1;
      startRound();
    }

    function showScreen() {
      stopGarden();
      stopMemoryRound();
      hideContentPages();
      document.getElementById(config.screenId).hidden = false;
      startGame();
      notifyRoom("sectionVisited", { section: config.section });
    }

    document.getElementById(config.openId).addEventListener("click", showScreen);
    document.getElementById(config.backId).addEventListener("click", showRememberHub);
    document.getElementById(config.homeId).addEventListener("click", showRememberHub);
    nextBtn.addEventListener("click", goNext);
    document.getElementById(config.againId).addEventListener("click", startGame);
    return showScreen;
  }

  bindRecallQuiz({
    screenId: "screen-quotes",
    openId: "open-quotes",
    backId: "quotes-back",
    homeId: "quotes-home",
    againId: "quotes-again",
    playId: "quotes-play",
    resultId: "quotes-result",
    promptId: "quotes-prompt",
    choicesId: "quotes-choices",
    feedbackId: "quotes-feedback",
    storyId: "quotes-story",
    memoryId: "quotes-memory",
    nextId: "quotes-next",
    stageId: "quotes-stage",
    progressId: "quotes-progress",
    resultTextId: "quotes-result-text",
    instructionId: "quotes-instruction",
    tasks: window.VSPOMINAYKA_QUOTES || [],
    recentKey: "vspominayka_quotes_recent",
    game: "quotes",
    source: "phrase",
    section: "quotes",
    stageLabel: "Фраза",
    defaultInstruction: "Выберите ответ"
  });

  bindRecallQuiz({
    screenId: "screen-dates",
    openId: "open-dates",
    backId: "dates-back",
    homeId: "dates-home",
    againId: "dates-again",
    playId: "dates-play",
    resultId: "dates-result",
    promptId: "dates-prompt",
    choicesId: "dates-choices",
    feedbackId: "dates-feedback",
    storyId: "dates-story",
    memoryId: "dates-memory",
    nextId: "dates-next",
    stageId: "dates-stage",
    progressId: "dates-progress",
    resultTextId: "dates-result-text",
    instructionId: "dates-instruction",
    tasks: window.VSPOMINAYKA_DATES || [],
    recentKey: "vspominayka_dates_recent",
    game: "dates",
    source: "date",
    section: "dates",
    stageLabel: "Дата",
    defaultInstruction: "Выберите ответ"
  });
  document.getElementById("recipes-back").addEventListener("click", function () {
    stopRecipeVoice();
    if (recipeListView && !recipeListView.hidden) {
      showMyImportantHub();
      return;
    }
    showRecipeList();
  });
  document.getElementById("recipe-add").addEventListener("click", function () {
    openRecipeForm("");
  });
  document.getElementById("recipe-empty-add").addEventListener("click", function () {
    openRecipeForm("");
  });
  document.getElementById("recipe-form-cancel").addEventListener("click", function () {
    stopRecipeVoice();
    showRecipeList();
  });
  document.getElementById("recipe-detail-back").addEventListener("click", showRecipeList);
  document.getElementById("recipe-lib-detail-back").addEventListener("click", showRecipeList);
  if (recipeModeMineBtn) {
    recipeModeMineBtn.addEventListener("click", function () {
      setRecipeMode("mine");
    });
  }
  if (recipeModeLibraryBtn) {
    recipeModeLibraryBtn.addEventListener("click", function () {
      setRecipeMode("library");
    });
  }
  document.getElementById("recipe-custom-add").addEventListener("click", function () {
    addDraftIngredient(recipeCustomIng.value);
    recipeCustomIng.value = "";
  });
  recipeCustomIng.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addDraftIngredient(recipeCustomIng.value);
      recipeCustomIng.value = "";
    }
  });
  recipeSearchEl.addEventListener("input", renderRecipeList);
  recipeFilterSelect.addEventListener("change", function () {
    recipeFilter = recipeFilterSelect.value;
    renderRecipeFilters();
    renderRecipeList();
  });
  recipeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var title = recipeTitleInput.value.trim();
    if (!title) {
      recipeTitleInput.focus();
      return;
    }
    var now = new Date().toISOString();
    var list = loadRecipes();
    var payload = {
      id: recipeEditId || "recipe-" + Date.now(),
      title: title,
      author: recipeAuthorInput.value.trim() || "Мой рецепт",
      category: recipeCategorySelect.value,
      ingredients: recipeDraftIngs.map(function (item) {
        return {
          name: item.name,
          amount: String(item.amount || "").trim(),
          unit: item.unit || "по вкусу"
        };
      }),
      instructions: recipeInstructions.value.trim(),
      createdAt: now,
      updatedAt: now
    };
    if (recipeEditId) {
      list = list.map(function (item) {
        if (item.id !== recipeEditId) {
          return item;
        }
        payload.createdAt = item.createdAt || now;
        payload.updatedAt = now;
        if (item.sourceLibId) {
          payload.sourceLibId = item.sourceLibId;
        }
        return payload;
      });
    } else {
      list.unshift(payload);
    }
    saveRecipes(list);
    if (!recipeEditId) {
      notifyRoom("recipeSaved");
    }
    stopRecipeVoice();
    showRecipeSavedMessage(payload.id);
    showRecipeList();
  });
  document.getElementById("recipe-dialog-cancel").addEventListener("click", function () {
    recipePendingDelete = "";
    recipeDialog.hidden = true;
  });
  document.getElementById("recipe-dialog-ok").addEventListener("click", confirmDeleteRecipe);
  setupRecipeUi();

  function initImportantSection() {
    if (!importantScreen) {
      return;
    }

    var STORAGE_NOTES = "vspominayka_notes";
    var STORAGE_REMINDERS = "vspominayka_reminders";
    var STORAGE_CONTACTS = "vspominayka_contacts";
    var STORAGE_BP = "vspominayka_blood_pressure";
    var STORAGE_WEIGHT = "vspominayka_weight";
    var STORAGE_GLUCOSE = "vspominayka_glucose";
    var STORAGE_GOALS = "vspominayka_measure_goals";
    var GLUCOSE_CONTEXT_LABELS = {
      fasting: "Натощак",
      before_meal: "До еды",
      after_meal: "Через 1–2 часа после еды",
      before_sleep: "Перед сном",
      other: "Другое"
    };
    var GLUCOSE_CONTEXT_KEYS = ["fasting", "before_meal", "after_meal", "before_sleep", "other"];

    var importantBack = document.getElementById("important-back");
    var impHub = document.getElementById("imp-hub");
    var impNotes = document.getElementById("imp-notes");
    var impReminders = document.getElementById("imp-reminders");
    var impPhones = document.getElementById("imp-phones");
    var impMeasures = document.getElementById("imp-measures");
    var impBp = document.getElementById("imp-bp");
    var impWeight = document.getElementById("imp-weight");
    var impGlucose = document.getElementById("imp-glucose");
    var impHistory = document.getElementById("imp-measure-history");
    var impHistoryPrint = document.getElementById("imp-history-print");
    var impMeasureRemind = document.getElementById("imp-measure-remind");
    var impGoals = document.getElementById("imp-measure-goals");
    var impDialog = document.getElementById("imp-dialog");
    var impDialogCancel = document.getElementById("imp-dialog-cancel");
    var impDialogOk = document.getElementById("imp-dialog-ok");

    var noteForm = document.getElementById("note-form");
    var noteTitle = document.getElementById("note-title");
    var noteText = document.getElementById("note-text");
    var notesEmpty = document.getElementById("notes-empty");
    var notesList = document.getElementById("notes-list");

    var reminderForm = document.getElementById("reminder-form");
    var reminderText = document.getElementById("reminder-text");
    var reminderDate = document.getElementById("reminder-date");
    var reminderTime = document.getElementById("reminder-time");
    var remindersEmpty = document.getElementById("reminders-empty");
    var remindersList = document.getElementById("reminders-list");
    var remindersDoneEmpty = document.getElementById("reminders-done-empty");
    var remindersDoneList = document.getElementById("reminders-done-list");

    var phoneForm = document.getElementById("phone-form");
    var phoneName = document.getElementById("phone-name");
    var phoneDesc = document.getElementById("phone-desc");
    var phoneNumber = document.getElementById("phone-number");
    var phonesEmpty = document.getElementById("phones-empty");
    var phonesList = document.getElementById("phones-list");

    var bpForm = document.getElementById("bp-form");
    var bpSystolic = document.getElementById("bp-systolic");
    var bpDiastolic = document.getElementById("bp-diastolic");
    var bpPulse = document.getElementById("bp-pulse");
    var bpDate = document.getElementById("bp-date");
    var bpTime = document.getElementById("bp-time");
    var bpNote = document.getElementById("bp-note");
    var weightForm = document.getElementById("weight-form");
    var weightKg = document.getElementById("weight-kg");
    var weightDate = document.getElementById("weight-date");
    var weightTime = document.getElementById("weight-time");
    var weightNote = document.getElementById("weight-note");
    var glucoseForm = document.getElementById("glucose-form");
    var glucoseValue = document.getElementById("glucose-value");
    var glucoseCondition = document.getElementById("glucose-condition");
    var glucoseDate = document.getElementById("glucose-date");
    var glucoseTime = document.getElementById("glucose-time");
    var glucoseNote = document.getElementById("glucose-note");

    var currentView = "hub";
    var noteEditId = "";
    var reminderEditId = "";
    var phoneEditId = "";
    var bpEditId = "";
    var weightEditId = "";
    var glucoseEditId = "";
    var pendingDelete = null;
    var measureRemindType = "";
    var measureRemindEditId = "";
    var chartKind = "bp";
    var chartRange = 7;
    var chartPulse = false;
    var chartGlucoseFilter = "all";
    var historyKind = "all";
    var historyRange = 7;
    var historyGlucoseFilter = "all";
    var MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    var impSpeech = null;
    var impVoiceButton = null;
    var VOICE_IDLE = "🎙️ Надиктовать";
    var VOICE_FILL_IDLE = "🎙️ Заполнить голосом";
    var VOICE_LISTEN = "🎙️ Слушаю…";

    function pad2(value) {
      return value < 10 ? "0" + value : String(value);
    }

    function todayDateValue() {
      var now = new Date();
      return now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate());
    }

    function nowTimeValue() {
      var now = new Date();
      return pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    }

    function formatDateRu(dateStr) {
      var parts = String(dateStr || "").split("-");
      if (parts.length !== 3) {
        return dateStr || "";
      }
      return parts[2] + "." + parts[1] + "." + parts[0];
    }

    function formatDateTimeRu(dateStr, timeStr) {
      var dateText = formatDateRu(dateStr);
      if (!dateText) {
        return timeStr || "";
      }
      return timeStr ? dateText + ", " + timeStr : dateText;
    }

    function formatDecimal(value) {
      return String(value).replace(".", ",");
    }

    function loadList(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) {
          return [];
        }
        var data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    }

    function saveList(key, list) {
      try {
        localStorage.setItem(key, JSON.stringify(list));
      } catch (error) {}
    }

    function newId(prefix) {
      return prefix + Date.now() + "-" + Math.floor(Math.random() * 1000);
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function telHref(phone) {
      var cleaned = String(phone || "").replace(/[^\d+]/g, "");
      if (!cleaned) {
        return "";
      }
      return "tel:" + cleaned;
    }

    function compareDateTime(aDate, aTime, bDate, bTime) {
      var a = String(aDate || "") + "T" + String(aTime || "00:00");
      var b = String(bDate || "") + "T" + String(bTime || "00:00");
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    }

    function hideImpViews() {
      stopImportantDictation();
      impHub.hidden = true;
      impNotes.hidden = true;
      impReminders.hidden = true;
      impPhones.hidden = true;
      impMeasures.hidden = true;
      impBp.hidden = true;
      impWeight.hidden = true;
      impGlucose.hidden = true;
      if (impHistory) {
        impHistory.hidden = true;
      }
      if (impHistoryPrint) {
        impHistoryPrint.hidden = true;
      }
      if (impMeasureRemind) {
        impMeasureRemind.hidden = true;
      }
      if (impGoals) {
        impGoals.hidden = true;
      }
    }

    function setImpBackLabel() {
      if (!importantBack) {
        return;
      }
      if (currentView === "hub" || currentView === "phones" || currentView === "measures") {
        importantBack.textContent = "← К Моему важному";
      } else if (currentView === "notes" || currentView === "reminders") {
        importantBack.textContent = "← К заметкам и напоминаниям";
      } else if (currentView === "history-print") {
        importantBack.textContent = "← К истории";
      } else if (
        currentView === "bp" ||
        currentView === "weight" ||
        currentView === "glucose" ||
        currentView === "history" ||
        currentView === "measure-remind" ||
        currentView === "goals"
      ) {
        importantBack.textContent = "← К измерениям";
      } else {
        importantBack.textContent = "← Назад";
      }
    }

    function showImpHub() {
      currentView = "hub";
      hideImpViews();
      impHub.hidden = false;
      setImpBackLabel();
      renderTodayBlock();
    }

    function showNotesView() {
      currentView = "notes";
      hideImpViews();
      impNotes.hidden = false;
      setImpBackLabel();
      renderNotes();
      notifyRoom("sectionVisited", { section: "notes" });
    }

    function showRemindersView() {
      currentView = "reminders";
      hideImpViews();
      impReminders.hidden = false;
      setImpBackLabel();
      if (!reminderEditId) {
        reminderDate.value = todayDateValue();
        reminderTime.value = nowTimeValue();
      }
      renderReminders();
    }

    function showPhonesView() {
      currentView = "phones";
      myImportantHub.hidden = true;
      importantScreen.hidden = false;
      hideImpViews();
      impPhones.hidden = false;
      setImpBackLabel();
      renderPhones();
      notifyRoom("sectionVisited", { section: "phones" });
    }

    function showMeasuresView() {
      currentView = "measures";
      myImportantHub.hidden = true;
      importantScreen.hidden = false;
      hideImpViews();
      impMeasures.hidden = false;
      setImpBackLabel();
      renderMeasureDashboard();
      notifyRoom("sectionVisited", { section: "measures" });
    }

    function showHistoryView() {
      currentView = "history";
      hideImpViews();
      impHistory.hidden = false;
      setImpBackLabel();
      renderMeasureHistory();
    }

    function fillNow(dateInput, timeInput) {
      dateInput.value = todayDateValue();
      timeInput.value = nowTimeValue();
    }

    function showBpView() {
      currentView = "bp";
      hideImpViews();
      impBp.hidden = false;
      setImpBackLabel();
      if (!bpEditId) {
        bpForm.reset();
        fillNow(bpDate, bpTime);
      }
    }

    function showWeightView() {
      currentView = "weight";
      hideImpViews();
      impWeight.hidden = false;
      setImpBackLabel();
      if (!weightEditId) {
        weightForm.reset();
        fillNow(weightDate, weightTime);
      }
    }

    function showGlucoseView() {
      currentView = "glucose";
      hideImpViews();
      impGlucose.hidden = false;
      setImpBackLabel();
      if (!glucoseEditId) {
        glucoseForm.reset();
        glucoseCondition.value = "";
        fillNow(glucoseDate, glucoseTime);
      }
    }

    function resetVoiceButtons() {
      var buttons = importantScreen.querySelectorAll("[data-dictation], [data-measure-voice]");
      var i;
      for (i = 0; i < buttons.length; i += 1) {
        buttons[i].textContent = buttons[i].getAttribute("data-measure-voice") ? VOICE_FILL_IDLE : VOICE_IDLE;
        buttons[i].classList.remove("is-listening");
      }
    }

    function setImpVoiceMessage(button, text) {
      var form = button && button.closest ? button.closest(".imp-form") : null;
      var status = form ? form.querySelector(".imp-voice-status") : null;
      if (status) {
        status.textContent = text || "";
      }
    }

    function appendToField(field, spoken) {
      var current = String(field.value || "").trim();
      var next = String(spoken || "").trim();
      if (!next) {
        return;
      }
      field.value = current ? current + " " + next : next;
    }

    function parseSpokenNumberRun(tokens, start) {
      var UNITS = {
        ноль: 0, нуль: 0, один: 1, одна: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4,
        пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9
      };
      var TEENS = {
        десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14,
        пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19
      };
      var TENS = {
        двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50, шестьдесят: 60,
        семьдесят: 70, восемьдесят: 80, девяносто: 90
      };
      var HUNDREDS = {
        сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
        шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900
      };
      var i = start;
      var value = 0;
      var used = false;
      if (HUNDREDS[tokens[i]] != null) {
        value += HUNDREDS[tokens[i]];
        i += 1;
        used = true;
      }
      if (TEENS[tokens[i]] != null) {
        value += TEENS[tokens[i]];
        i += 1;
        used = true;
      } else {
        if (TENS[tokens[i]] != null) {
          value += TENS[tokens[i]];
          i += 1;
          used = true;
        }
        if (UNITS[tokens[i]] != null) {
          value += UNITS[tokens[i]];
          i += 1;
          used = true;
        }
      }
      if (!used) {
        return null;
      }
      return { value: value, next: i };
    }

    function normalizeSpokenMeasure(raw) {
      var text = String(raw || "").toLowerCase().replace(/ё/g, "е");
      text = text.replace(/(\d)\s*,\s*(\d)/g, "$1.$2");
      text = text.replace(/(\d)\s*(?:точка|запятая)\s*(\d)/g, "$1.$2");
      text = text.replace(/(\d)\s+(\d)\s*(?:кг|килограмм|килограмма|килограммов|ммоль)/g, "$1.$2");
      var tokens = text.replace(/[/]/g, " на ").replace(/[^\d.а-яa-z]+/gi, " ").replace(/\s+/g, " ").trim().split(" ");
      var converted = [];
      var i = 0;
      while (i < tokens.length) {
        if (!tokens[i]) {
          i += 1;
          continue;
        }
        if (/^\d+(?:\.\d+)?$/.test(tokens[i])) {
          converted.push(tokens[i]);
          i += 1;
          continue;
        }
        var run = parseSpokenNumberRun(tokens, i);
        if (run) {
          converted.push(String(run.value));
          i = run.next;
          continue;
        }
        converted.push(tokens[i]);
        i += 1;
      }
      var merged = [];
      for (i = 0; i < converted.length; i += 1) {
        var nextWord = converted[i + 1] || "";
        var fracWord = converted[i + 2] || "";
        var whole = Number(converted[i]);
        if (!isNaN(whole) && (nextWord === "целых" || nextWord === "целая" || nextWord === "целое")) {
          var frac = Number(fracWord);
          if (!isNaN(frac) && frac >= 0 && frac <= 9) {
            merged.push(String(Math.round((whole + frac / 10) * 10) / 10));
            i += 2;
            if (converted[i + 1] && /десят/.test(converted[i + 1])) {
              i += 1;
            }
            continue;
          }
        }
        if (!isNaN(whole) && nextWord === "с" && /половин/.test(fracWord)) {
          merged.push(String(whole + 0.5));
          i += 2;
          continue;
        }
        merged.push(converted[i]);
      }
      return merged.join(" ");
    }

    function inRange(value, min, max) {
      return typeof value === "number" && !isNaN(value) && value >= min && value <= max;
    }

    function parseBpSpeech(spoken) {
      var original = String(spoken || "").toLowerCase().replace(/ё/g, "е");
      var text = normalizeSpokenMeasure(spoken);
      var systolic;
      var diastolic;
      var pulse;
      var pair = text.match(/(\d{2,3})\s+на\s+(\d{2,3})/);
      if (!pair) {
        pair = text.match(/давлени[ея]\s+(\d{2,3})\s+(\d{2,3})/);
      }
      if (pair) {
        systolic = Number(pair[1]);
        diastolic = Number(pair[2]);
      }
      var pulseMatch = text.match(/пульс[а]?\s+(\d{2,3})/);
      if (pulseMatch) {
        pulse = Number(pulseMatch[1]);
      }
      var result = { systolic: null, diastolic: null, pulse: null, incomplete: false };
      if (inRange(systolic, 50, 300) && inRange(diastolic, 30, 200) && systolic > diastolic) {
        result.systolic = systolic;
        result.diastolic = diastolic;
      }
      if (inRange(pulse, 30, 220)) {
        result.pulse = pulse;
      } else if (/пульс/.test(original + " " + text) && result.systolic) {
        result.incomplete = true;
      }
      if (!result.systolic) {
        result.incomplete = true;
      }
      return result;
    }

    function parseWeightSpeech(spoken) {
      var text = normalizeSpokenMeasure(spoken);
      var match = text.match(/вес[а]?\s+(\d+(?:\.\d+)?)/);
      var value = match ? Number(match[1]) : NaN;
      if (!inRange(value, 20, 300)) {
        var numbers = text.match(/\d+(?:\.\d+)?/g) || [];
        var i;
        value = NaN;
        for (i = 0; i < numbers.length; i += 1) {
          var candidate = Number(numbers[i]);
          if (inRange(candidate, 20, 300)) {
            if (!isNaN(value)) {
              return { weight: null };
            }
            value = candidate;
          }
        }
      }
      if (!inRange(value, 20, 300)) {
        return { weight: null };
      }
      return { weight: Math.round(value * 10) / 10 };
    }

    function parseGlucoseSpeech(spoken) {
      var original = String(spoken || "").toLowerCase().replace(/ё/g, "е");
      var text = normalizeSpokenMeasure(spoken);
      var condition = "";
      if (/на\s*тощак|тощак/.test(original)) {
        condition = "fasting";
      } else if (/перед\s+сном/.test(original)) {
        condition = "before_sleep";
      } else if (/до\s+еды/.test(original)) {
        condition = "before_meal";
      } else if (/после\s+еды|через/.test(original)) {
        condition = "after_meal";
      } else if (/(^|\s)другое(\s|$)/.test(original)) {
        condition = "other";
      }
      var match = text.match(/(?:сахар[а]?|ммоль)\s+(\d+(?:\.\d+)?)/);
      var value = match ? Number(match[1]) : NaN;
      if (!inRange(value, 1, 40)) {
        var numbers = text.match(/\d+(?:\.\d+)?/g) || [];
        var i;
        value = NaN;
        for (i = 0; i < numbers.length; i += 1) {
          var candidate = Number(numbers[i]);
          if (inRange(candidate, 1, 40)) {
            if (!isNaN(value)) {
              return { glucose: null, condition: condition };
            }
            value = candidate;
          }
        }
      }
      if (!inRange(value, 1, 40)) {
        return { glucose: null, condition: condition };
      }
      return { glucose: Math.round(value * 10) / 10, condition: condition };
    }

    function applyMeasureVoice(kind, spoken, button) {
      var parsed;
      if (kind === "bp") {
        parsed = parseBpSpeech(spoken);
        if (!parsed.systolic || !parsed.diastolic) {
          setImpVoiceMessage(button, "Не всё удалось распознать. Попробуйте ещё раз или введите значения вручную.");
          return;
        }
        bpSystolic.value = parsed.systolic;
        bpDiastolic.value = parsed.diastolic;
        if (parsed.pulse) {
          bpPulse.value = parsed.pulse;
        }
        setImpVoiceMessage(
          button,
          parsed.incomplete
            ? "Не всё удалось распознать. Попробуйте ещё раз или введите значения вручную."
            : "Проверьте значения перед сохранением"
        );
        return;
      }
      if (kind === "weight") {
        parsed = parseWeightSpeech(spoken);
        if (!parsed.weight) {
          setImpVoiceMessage(button, "Не всё удалось распознать. Попробуйте ещё раз или введите значения вручную.");
          return;
        }
        weightKg.value = parsed.weight;
        setImpVoiceMessage(button, "Проверьте значения перед сохранением");
        return;
      }
      parsed = parseGlucoseSpeech(spoken);
      if (!parsed.glucose) {
        setImpVoiceMessage(button, "Не всё удалось распознать. Попробуйте ещё раз или введите значения вручную.");
        return;
      }
      glucoseValue.value = parsed.glucose;
      if (parsed.condition) {
        glucoseCondition.value = parsed.condition;
      }
      setImpVoiceMessage(button, "Проверьте значения перед сохранением");
    }

    function stopImportantDictation() {
      if (impSpeech) {
        try {
          impSpeech.onresult = null;
          impSpeech.onerror = null;
          impSpeech.onend = null;
          impSpeech.stop();
        } catch (error) {}
        impSpeech = null;
      }
      resetVoiceButtons();
      impVoiceButton = null;
    }

    function startImportantDictation(targetField, button, measureKind) {
      if (!targetField && !measureKind) {
        return;
      }
      stopImportantDictation();
      setImpVoiceMessage(button, "");
      var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        setImpVoiceMessage(button, "Голосовой ввод недоступен в этом браузере.");
        return;
      }

      function beginListen() {
        try {
          impSpeech = new Recognition();
          impSpeech.lang = "ru-RU";
          impSpeech.continuous = false;
          impSpeech.interimResults = false;
          impVoiceButton = button;
          if (button) {
            button.textContent = VOICE_LISTEN;
            button.classList.add("is-listening");
          }
          setImpVoiceMessage(button, "Слушаю…");
          impSpeech.onresult = function (event) {
            var text = "";
            var i;
            for (i = event.resultIndex; i < event.results.length; i += 1) {
              if (event.results[i].isFinal) {
                text += event.results[i][0].transcript;
              }
            }
            text = text.trim();
            if (!text) {
              return;
            }
            if (measureKind) {
              applyMeasureVoice(measureKind, text, button);
            } else {
              appendToField(targetField, text);
            }
          };
          impSpeech.onerror = function (event) {
            var err = event && event.error;
            if (err === "not-allowed" || err === "service-not-allowed") {
              setImpVoiceMessage(button, "Не удалось включить микрофон. Можно продолжить ввод вручную.");
            } else if (err !== "aborted" && err !== "no-speech") {
              setImpVoiceMessage(button, "Не удалось включить микрофон. Можно продолжить ввод вручную.");
            }
          };
          impSpeech.onend = function () {
            impSpeech = null;
            resetVoiceButtons();
            impVoiceButton = null;
            var form = button && button.closest ? button.closest(".imp-form") : null;
            var status = form ? form.querySelector(".imp-voice-status") : null;
            if (status && status.textContent === "Слушаю…") {
              status.textContent = "";
            }
          };
          impSpeech.start();
        } catch (error) {
          resetVoiceButtons();
          setImpVoiceMessage(button, "Не удалось включить микрофон. Можно продолжить ввод вручную.");
        }
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          try {
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
          } catch (error) {}
          beginListen();
        }).catch(function () {
          resetVoiceButtons();
          setImpVoiceMessage(button, "Не удалось включить микрофон. Можно продолжить ввод вручную.");
        });
        return;
      }
      beginListen();
    }

    function showImportantScreen() {
      stopGarden();
      stopMemoryRound();
      hideContentPages();
      importantScreen.hidden = false;
      if (impDialog) {
        impDialog.hidden = true;
      }
      pendingDelete = null;
      stopImportantDictation();
      showImpHub();
    }

    function askDelete(message, onConfirm) {
      pendingDelete = onConfirm;
      document.getElementById("imp-dialog-title").textContent = message || "Удалить эту запись?";
      impDialog.hidden = false;
    }

    function closeImpDialog() {
      pendingDelete = null;
      impDialog.hidden = true;
    }

    function scheduleReminderNotification(item) {
      if (!item || item.done) {
        return;
      }
      // Reserved for later browser Notification API support.
    }

    function noteCreatedLabel(item) {
      if (item.createdAt) {
        var created = new Date(item.createdAt);
        if (!isNaN(created.getTime())) {
          return pad2(created.getDate()) + "." + pad2(created.getMonth() + 1) + "." + created.getFullYear() + ", " + pad2(created.getHours()) + ":" + pad2(created.getMinutes());
        }
      }
      return formatDateTimeRu(item.date, item.time);
    }

    function renderNotes() {
      var list = loadList(STORAGE_NOTES).slice().sort(function (a, b) {
        if (!!a.done !== !!b.done) {
          return a.done ? 1 : -1;
        }
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
      notesEmpty.hidden = list.length > 0;
      notesList.innerHTML = list.map(function (item) {
        return (
          '<article class="imp-item' + (item.done ? " is-done" : "") + '">' +
            "<h2 class=\"imp-item-title\">" + escapeHtml(item.title) + "</h2>" +
            "<p class=\"imp-item-text\">" + escapeHtml(item.text) + "</p>" +
            "<p class=\"imp-item-meta\">" + escapeHtml(noteCreatedLabel(item)) + "</p>" +
            "<div class=\"imp-actions\">" +
              "<button class=\"hint-btn\" type=\"button\" data-imp=\"note-done\" data-id=\"" + escapeHtml(item.id) + "\">" +
                (item.done ? "Вернуть в текущие" : "Выполнено") +
              "</button>" +
              "<button class=\"hint-btn\" type=\"button\" data-imp=\"note-edit\" data-id=\"" + escapeHtml(item.id) + "\">Изменить</button>" +
              "<button class=\"next-btn\" type=\"button\" data-imp=\"note-delete\" data-id=\"" + escapeHtml(item.id) + "\">Удалить</button>" +
            "</div>" +
          "</article>"
        );
      }).join("");
    }

    function renderReminders() {
      var list = loadList(STORAGE_REMINDERS);
      var upcoming = [];
      var done = [];
      list.forEach(function (item) {
        var slot = nextReminderSlot(item);
        if (slot) {
          upcoming.push({ item: item, slot: slot });
        } else if (item.done || (item.repeat && item.repeat !== "once")) {
          done.push(item);
        } else if (item.done) {
          done.push(item);
        }
      });
      upcoming.sort(function (a, b) {
        return a.slot.ts - b.slot.ts;
      });
      done.sort(function (a, b) {
        return compareDateTime(b.date, b.time, a.date, a.time);
      });
      remindersEmpty.hidden = upcoming.length > 0;
      remindersDoneEmpty.hidden = done.length > 0;
      function reminderCard(item, slot) {
        return (
          '<article class="imp-item' + (item.done ? " is-done" : "") + '">' +
            "<p class=\"imp-item-title\">" + escapeHtml(item.text) + "</p>" +
            "<p class=\"imp-item-meta\">" + escapeHtml(formatRepeatMeta(item)) + "</p>" +
            (slot ? "<p class=\"imp-item-meta\">Ближайшее: " + escapeHtml(friendlyDate(slot.date, true, slot.time)) + "</p>" : "") +
            "<div class=\"imp-actions\">" +
              (item.done && (item.repeat || "once") === "once"
                ? "<button class=\"hint-btn\" type=\"button\" data-imp=\"reminder-undone\" data-id=\"" + escapeHtml(item.id) + "\">Вернуть в ближайшие</button>"
                : "<button class=\"hint-btn\" type=\"button\" data-imp=\"reminder-done\" data-id=\"" + escapeHtml(item.id) + "\" data-date=\"" + escapeHtml(slot ? slot.date : item.date) + "\" data-time=\"" + escapeHtml(slot ? slot.time : item.time) + "\">Выполнено</button>") +
              "<button class=\"hint-btn\" type=\"button\" data-imp=\"reminder-edit\" data-id=\"" + escapeHtml(item.id) + "\">Изменить</button>" +
              "<button class=\"next-btn\" type=\"button\" data-imp=\"reminder-delete\" data-id=\"" + escapeHtml(item.id) + "\">Удалить</button>" +
            "</div>" +
          "</article>"
        );
      }
      remindersList.innerHTML = upcoming.map(function (entry) {
        return reminderCard(entry.item, entry.slot);
      }).join("");
      remindersDoneList.innerHTML = done.map(function (item) {
        return reminderCard(item, null);
      }).join("");
    }

    function renderPhones() {
      var list = loadList(STORAGE_CONTACTS).slice().sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "ru");
      });
      phonesEmpty.hidden = list.length > 0;
      phonesList.innerHTML = list.map(function (item) {
        var href = telHref(item.phone);
        return (
          '<article class="imp-item">' +
            "<h2 class=\"imp-phone-name\">" + escapeHtml(item.name) + "</h2>" +
            (item.description ? "<p class=\"imp-item-text\">" + escapeHtml(item.description) + "</p>" : "") +
            "<p class=\"imp-phone-number\">" + escapeHtml(item.phone) + "</p>" +
            "<div class=\"imp-actions\">" +
              (href
                ? "<a class=\"next-btn\" href=\"" + escapeHtml(href) + "\">Позвонить</a>"
                : "") +
              "<button class=\"hint-btn\" type=\"button\" data-imp=\"phone-edit\" data-id=\"" + escapeHtml(item.id) + "\">Изменить</button>" +
              "<button class=\"next-btn\" type=\"button\" data-imp=\"phone-delete\" data-id=\"" + escapeHtml(item.id) + "\">Удалить</button>" +
            "</div>" +
          "</article>"
        );
      }).join("");
    }

    function loadBloodPressure() {
      var list = loadList(STORAGE_BP);
      var needsSave = false;
      var mapped = list.map(function (item) {
        if (item.sys != null || item.dia != null) {
          needsSave = true;
        }
        return {
          id: item.id,
          systolic: item.systolic != null ? item.systolic : item.sys,
          diastolic: item.diastolic != null ? item.diastolic : item.dia,
          pulse: item.pulse,
          date: item.date,
          time: item.time,
          note: item.note || ""
        };
      });
      if (needsSave) {
        saveList(STORAGE_BP, mapped);
      }
      return mapped;
    }

    function loadWeightRecords() {
      var list = loadList(STORAGE_WEIGHT);
      var needsSave = false;
      var mapped = list.map(function (item) {
        if (item.value != null && item.weight == null) {
          needsSave = true;
        }
        return {
          id: item.id,
          weight: item.weight != null ? item.weight : item.value,
          date: item.date,
          time: item.time,
          note: item.note || ""
        };
      });
      if (needsSave) {
        saveList(STORAGE_WEIGHT, mapped);
      }
      return mapped;
    }

    function loadGlucoseRecords() {
      var list = loadList(STORAGE_GLUCOSE);
      var needsSave = false;
      var mapped = list.map(function (item) {
        if (item.value != null || item.state != null || item.unit != null) {
          needsSave = true;
        }
        return {
          id: item.id,
          glucose: item.glucose != null ? item.glucose : item.value,
          condition: item.condition || item.state || "",
          date: item.date,
          time: item.time,
          note: item.note || ""
        };
      });
      if (needsSave) {
        saveList(STORAGE_GLUCOSE, mapped);
      }
      return mapped;
    }

    function parseOptionalNumber(raw) {
      var text = String(raw == null ? "" : raw).trim().replace(",", ".");
      if (!text) {
        return null;
      }
      var value = Number(text);
      return isFinite(value) ? value : null;
    }

    function isSetRange(min, max) {
      return min != null && max != null && isFinite(Number(min)) && isFinite(Number(max)) && Number(min) <= Number(max);
    }

    function emptyGoals() {
      return {
        bp: {
          sysMin: null,
          sysMax: null,
          diaMin: null,
          diaMax: null,
          pulseMin: null,
          pulseMax: null
        },
        weight: { min: null, max: null, target: null },
        glucose: {
          fasting: { min: null, max: null },
          before_meal: { min: null, max: null },
          after_meal: { min: null, max: null },
          before_sleep: { min: null, max: null },
          other: { min: null, max: null }
        }
      };
    }

    function readRangePair(source) {
      source = source || {};
      return {
        min: parseOptionalNumber(source.min),
        max: parseOptionalNumber(source.max)
      };
    }

    function loadGoals() {
      var base = emptyGoals();
      try {
        var raw = localStorage.getItem(STORAGE_GOALS);
        if (!raw) {
          return base;
        }
        var data = JSON.parse(raw) || {};
        var bp = data.bp || {};
        var weight = data.weight || {};
        var glucose = data.glucose || {};
        base.bp.sysMin = parseOptionalNumber(bp.sysMin);
        base.bp.sysMax = parseOptionalNumber(bp.sysMax);
        base.bp.diaMin = parseOptionalNumber(bp.diaMin);
        base.bp.diaMax = parseOptionalNumber(bp.diaMax);
        base.bp.pulseMin = parseOptionalNumber(bp.pulseMin);
        base.bp.pulseMax = parseOptionalNumber(bp.pulseMax);
        base.weight.min = parseOptionalNumber(weight.min);
        base.weight.max = parseOptionalNumber(weight.max);
        base.weight.target = parseOptionalNumber(weight.target);
        GLUCOSE_CONTEXT_KEYS.forEach(function (key) {
          base.glucose[key] = readRangePair(glucose[key]);
        });
        return base;
      } catch (error) {
        return emptyGoals();
      }
    }

    function saveGoals(goals) {
      try {
        localStorage.setItem(STORAGE_GOALS, JSON.stringify(goals));
      } catch (error) {}
    }

    function glucoseContextKey(raw) {
      var text = String(raw || "").toLowerCase().replace(/ё/g, "е").replace(/[–—]/g, "-").trim();
      if (!text) {
        return "";
      }
      if (GLUCOSE_CONTEXT_LABELS[text]) {
        return text;
      }
      if (text.indexOf("тощак") !== -1) {
        return "fasting";
      }
      if (text.indexOf("перед сном") !== -1) {
        return "before_sleep";
      }
      if (text.indexOf("до еды") !== -1) {
        return "before_meal";
      }
      if (text.indexOf("после еды") !== -1 || text.indexOf("часа после") !== -1 || text.indexOf("1-2") !== -1) {
        return "after_meal";
      }
      if (text === "другое" || text === "other") {
        return "other";
      }
      return "";
    }

    function glucoseContextLabel(raw) {
      var key = glucoseContextKey(raw);
      return key ? GLUCOSE_CONTEXT_LABELS[key] : "";
    }

    function formatBound(value, kind) {
      if (value == null || !isFinite(Number(value))) {
        return "";
      }
      if (kind === "glucose") {
        return formatDecimal((Math.round(Number(value) * 10) / 10).toFixed(1));
      }
      if (kind === "weight") {
        return formatDecimal(Math.round(Number(value) * 10) / 10);
      }
      return String(Math.round(Number(value)));
    }

    function formatGoalRange(min, max, unit, kind) {
      if (!isSetRange(min, max)) {
        return "";
      }
      return formatBound(min, kind) + "–" + formatBound(max, kind) + (unit ? " " + unit : "");
    }

    function statusCode(value, min, max) {
      if (!isSetRange(min, max) || value == null || !isFinite(Number(value))) {
        return "";
      }
      var num = Number(value);
      if (num < Number(min)) {
        return "low";
      }
      if (num > Number(max)) {
        return "high";
      }
      return "in";
    }

    function statusLabel(code) {
      if (code === "in") {
        return "В пределах моей цели";
      }
      if (code === "high") {
        return "Выше моей цели";
      }
      if (code === "low") {
        return "Ниже моей цели";
      }
      return "";
    }

    function combineStatus(codes) {
      var i;
      var has = false;
      for (i = 0; i < codes.length; i += 1) {
        if (codes[i]) {
          has = true;
          if (codes[i] === "high") {
            return "high";
          }
        }
      }
      for (i = 0; i < codes.length; i += 1) {
        if (codes[i] === "low") {
          return "low";
        }
      }
      return has ? "in" : "";
    }

    function glucoseGoalRange(goals, condition) {
      var key = glucoseContextKey(condition);
      if (!key || !goals || !goals.glucose) {
        return { min: null, max: null };
      }
      return goals.glucose[key] || { min: null, max: null };
    }

    function measureStatus(kind, item, goals) {
      goals = goals || loadGoals();
      if (kind === "bp") {
        return combineStatus([
          statusCode(item.systolic, goals.bp.sysMin, goals.bp.sysMax),
          statusCode(item.diastolic, goals.bp.diaMin, goals.bp.diaMax)
        ]);
      }
      if (kind === "weight") {
        return statusCode(item.weight, goals.weight.min, goals.weight.max);
      }
      var glu = glucoseGoalRange(goals, item.condition);
      return statusCode(item.glucose, glu.min, glu.max);
    }

    function goalLineHtml(kind, item, goals) {
      var text = "";
      if (kind === "bp") {
        var sys = formatGoalRange(goals.bp.sysMin, goals.bp.sysMax, "", "bp");
        var dia = formatGoalRange(goals.bp.diaMin, goals.bp.diaMax, "", "bp");
        if (sys && dia) {
          text = "Моя цель: " + sys + " / " + dia;
        } else if (sys) {
          text = "Моя цель: верхнее " + sys;
        } else if (dia) {
          text = "Моя цель: нижнее " + dia;
        }
      } else if (kind === "weight") {
        if (isSetRange(goals.weight.min, goals.weight.max)) {
          text = "Моя цель: " + formatGoalRange(goals.weight.min, goals.weight.max, "кг", "weight");
        } else if (goals.weight.target != null) {
          text = "Моя цель: " + formatBound(goals.weight.target, "weight") + " кг";
        }
      } else if (item) {
        var glu = glucoseGoalRange(goals, item.condition);
        if (isSetRange(glu.min, glu.max)) {
          text = "Моя цель: " + formatGoalRange(glu.min, glu.max, "ммоль/л", "glucose");
        }
      }
      if (text) {
        return "<p class=\"dash-card-goal\">" + escapeHtml(text) + "</p>";
      }
      return "<p class=\"dash-card-goal\"><button class=\"dash-goal-link\" type=\"button\" data-dash=\"goals\">Задать мою цель</button></p>";
    }

    function statusHtml(code) {
      var label = statusLabel(code);
      if (!label) {
        return "";
      }
      return "<p class=\"dash-card-status dash-status-" + code + "\">" + escapeHtml(label) + "</p>";
    }

    function setInputValue(id, value) {
      var node = document.getElementById(id);
      if (node) {
        node.value = value == null ? "" : value;
      }
    }

    function fillGoalsForm() {
      var goals = loadGoals();
      setInputValue("goal-sys-min", goals.bp.sysMin);
      setInputValue("goal-sys-max", goals.bp.sysMax);
      setInputValue("goal-dia-min", goals.bp.diaMin);
      setInputValue("goal-dia-max", goals.bp.diaMax);
      setInputValue("goal-pulse-min", goals.bp.pulseMin);
      setInputValue("goal-pulse-max", goals.bp.pulseMax);
      setInputValue("goal-weight-min", goals.weight.min);
      setInputValue("goal-weight-max", goals.weight.max);
      setInputValue("goal-weight-target", goals.weight.target);
      GLUCOSE_CONTEXT_KEYS.forEach(function (key) {
        setInputValue("goal-glu-" + key + "-min", goals.glucose[key].min);
        setInputValue("goal-glu-" + key + "-max", goals.glucose[key].max);
      });
      var err = document.getElementById("goals-error");
      if (err) {
        err.textContent = "";
      }
    }

    function showGoalsView() {
      currentView = "goals";
      hideImpViews();
      if (impGoals) {
        impGoals.hidden = false;
      }
      setImpBackLabel();
      fillGoalsForm();
    }

    function readPairOrError(minRaw, maxRaw, label, errors) {
      var min = parseOptionalNumber(minRaw);
      var max = parseOptionalNumber(maxRaw);
      if (min == null && max == null) {
        return { min: null, max: null };
      }
      if (min == null || max == null) {
        errors.push("Для «" + label + "» укажите оба значения: от и до.");
        return { min: null, max: null };
      }
      if (min > max) {
        errors.push("Для «" + label + "» значение «от» не должно быть больше «до».");
        return { min: null, max: null };
      }
      return { min: min, max: max };
    }

    function collectGoalsFromForm() {
      var errors = [];
      var sys = readPairOrError(
        document.getElementById("goal-sys-min").value,
        document.getElementById("goal-sys-max").value,
        "верхнее давление",
        errors
      );
      var dia = readPairOrError(
        document.getElementById("goal-dia-min").value,
        document.getElementById("goal-dia-max").value,
        "нижнее давление",
        errors
      );
      var pulse = readPairOrError(
        document.getElementById("goal-pulse-min").value,
        document.getElementById("goal-pulse-max").value,
        "пульс",
        errors
      );
      var weight = readPairOrError(
        document.getElementById("goal-weight-min").value,
        document.getElementById("goal-weight-max").value,
        "вес",
        errors
      );
      var goals = emptyGoals();
      goals.bp.sysMin = sys.min;
      goals.bp.sysMax = sys.max;
      goals.bp.diaMin = dia.min;
      goals.bp.diaMax = dia.max;
      goals.bp.pulseMin = pulse.min;
      goals.bp.pulseMax = pulse.max;
      goals.weight.min = weight.min;
      goals.weight.max = weight.max;
      goals.weight.target = parseOptionalNumber(document.getElementById("goal-weight-target").value);
      GLUCOSE_CONTEXT_KEYS.forEach(function (key) {
        goals.glucose[key] = readPairOrError(
          document.getElementById("goal-glu-" + key + "-min").value,
          document.getElementById("goal-glu-" + key + "-max").value,
          GLUCOSE_CONTEXT_LABELS[key],
          errors
        );
      });
      return { goals: goals, errors: errors };
    }

    function friendlyDate(dateStr, withTime, timeStr) {
      if (!dateStr) {
        return "";
      }
      if (dateStr === todayDateValue()) {
        return withTime && timeStr ? "Сегодня · " + timeStr : "Сегодня";
      }
      var parts = dateStr.split("-");
      var label = Number(parts[2]) + " " + (MONTHS_GEN[Number(parts[1]) - 1] || "");
      return withTime && timeStr ? label + " · " + timeStr : label;
    }

    function reminderTimes(item) {
      if (item.times && item.times.length) {
        return item.times.filter(Boolean);
      }
      return item.time ? [item.time] : [];
    }

    function isSlotDone(item, dateStr, timeStr) {
      return (item.doneSlots || []).indexOf(dateStr + "|" + timeStr) !== -1;
    }

    function parseStamp(dateStr, timeStr) {
      var p = String(dateStr || "").split("-");
      var t = String(timeStr || "00:00").split(":");
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), Number(t[0] || 0), Number(t[1] || 0), 0, 0);
    }

    function nextReminderSlot(item, from) {
      from = from || new Date();
      var repeat = item.repeat || "once";
      if (repeat === "once") {
        if (item.done) {
          return null;
        }
        var once = parseStamp(item.date, item.time);
        if (isNaN(once.getTime())) {
          return null;
        }
        return { date: item.date, time: item.time, ts: once.getTime(), item: item };
      }
      var times = reminderTimes(item);
      if (!times.length) {
        return null;
      }
      var i;
      var ti;
      for (i = 0; i < 28; i += 1) {
        var day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        var dow = day.getDay();
        if ((repeat === "weekly" || repeat === "weekdays") && (!item.weekdays || item.weekdays.indexOf(dow) === -1)) {
          continue;
        }
        var dateStr = day.getFullYear() + "-" + pad2(day.getMonth() + 1) + "-" + pad2(day.getDate());
        for (ti = 0; ti < times.length; ti += 1) {
          var stamp = parseStamp(dateStr, times[ti]);
          if (stamp.getTime() >= from.getTime() && !isSlotDone(item, dateStr, times[ti])) {
            return { date: dateStr, time: times[ti], ts: stamp.getTime(), item: item };
          }
        }
      }
      return null;
    }

    function todayReminderItems() {
      var today = todayDateValue();
      var items = [];
      loadList(STORAGE_REMINDERS).forEach(function (item) {
        var repeat = item.repeat || "once";
        if (repeat === "once") {
          if (!item.done && item.date === today) {
            items.push(item);
          }
          return;
        }
        var dow = new Date().getDay();
        var matchesDay = repeat === "daily" || (item.weekdays && item.weekdays.indexOf(dow) !== -1);
        if (!matchesDay) {
          return;
        }
        reminderTimes(item).forEach(function (time) {
          if (!isSlotDone(item, today, time)) {
            items.push({
              id: item.id,
              text: item.text,
              time: time,
              type: item.type,
              measurementType: item.measurementType,
              _slotDate: today
            });
          }
        });
      });
      return items.sort(function (a, b) {
        return String(a.time || "").localeCompare(String(b.time || ""));
      });
    }

    function todayIcon(item) {
      if (item.type === "measurement") {
        return "⏰";
      }
      var text = String(item.text || "").toLowerCase();
      if (text.indexOf("позвон") !== -1) {
        return "📞";
      }
      if (text.indexOf("купить") !== -1 || text.indexOf("замет") !== -1) {
        return "📝";
      }
      return "⏰";
    }

    function formatRepeatMeta(item) {
      var times = reminderTimes(item).join(" и ");
      var repeat = item.repeat || "once";
      if (repeat === "daily") {
        return "Ежедневно · " + times;
      }
      if (repeat === "weekly" || repeat === "weekdays") {
        var names = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
        var days = (item.weekdays || []).map(function (d) {
          return names[d];
        }).join(", ");
        return days + " · " + times;
      }
      return formatDateTimeRu(item.date, item.time);
    }

    function cutoffDate(days) {
      if (!days) {
        return "";
      }
      var d = new Date();
      d.setDate(d.getDate() - days);
      return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    }

    function filterByRange(list, range) {
      if (!range || range === "all") {
        return list;
      }
      var key = cutoffDate(Number(range));
      return list.filter(function (item) {
        return String(item.date || "") >= key;
      });
    }

    function allMeasureEntries() {
      var rows = [];
      loadBloodPressure().forEach(function (item) {
        rows.push({
          kind: "bp",
          id: item.id,
          date: item.date,
          time: item.time,
          label: "Давление",
          icon: "❤️",
          value: item.systolic + " / " + item.diastolic,
          extra: item.pulse != null ? "пульс " + item.pulse : "",
          note: item.note || "",
          status: measureStatus("bp", item),
          raw: item
        });
      });
      loadWeightRecords().forEach(function (item) {
        rows.push({
          kind: "weight",
          id: item.id,
          date: item.date,
          time: item.time,
          label: "Вес",
          icon: "⚖️",
          value: formatDecimal(item.weight) + " кг",
          extra: "",
          note: item.note || "",
          status: measureStatus("weight", item),
          raw: item
        });
      });
      loadGlucoseRecords().forEach(function (item) {
        rows.push({
          kind: "glucose",
          id: item.id,
          date: item.date,
          time: item.time,
          label: "Сахар",
          icon: "🩸",
          value: formatDecimal(item.glucose) + " ммоль/л",
          extra: glucoseContextLabel(item.condition) || item.condition || "",
          note: item.note || "",
          status: measureStatus("glucose", item),
          raw: item
        });
      });
      return rows.sort(function (a, b) {
        return compareDateTime(b.date, b.time, a.date, a.time);
      });
    }

    function latestOf(list) {
      return list.slice().sort(function (a, b) {
        return compareDateTime(b.date, b.time, a.date, a.time);
      })[0] || null;
    }

    function renderTodayBlock() {
      var box = document.getElementById("imp-today");
      if (!box) {
        return;
      }
      var items = todayReminderItems();
      if (!items.length) {
        box.innerHTML = "<h2>Сегодня</h2><p class=\"dash-card-meta\">На этот день напоминаний нет</p>";
        return;
      }
      box.innerHTML = "<h2>Сегодня</h2>" + items.map(function (item) {
        return "<p class=\"imp-today-item\">" + todayIcon(item) + " " + escapeHtml(item.time || "") + " — " + escapeHtml(item.text) + "</p>";
      }).join("");
    }

    function dashCardHtml(icon, title, kind, body, meta, extraHtml) {
      return (
        '<article class="dash-card">' +
          "<p class=\"dash-card-label\">" + icon + " " + title + "</p>" +
          "<p class=\"dash-card-value\">" + body + "</p>" +
          (extraHtml || "") +
          "<p class=\"dash-card-meta\">" + meta + "</p>" +
          "<div class=\"dash-card-actions\">" +
            "<button class=\"next-btn\" type=\"button\" data-dash=\"add\" data-kind=\"" + kind + "\">+ Записать</button>" +
            "<button class=\"hint-btn\" type=\"button\" data-dash=\"history\" data-kind=\"" + kind + "\">История</button>" +
            "<button class=\"hint-btn\" type=\"button\" data-dash=\"remind\" data-kind=\"" + kind + "\">⏰ Напомнить</button>" +
          "</div>" +
        "</article>"
      );
    }

    function renderMeasureCards() {
      var host = document.getElementById("dash-measure-cards");
      if (!host) {
        return;
      }
      var goals = loadGoals();
      var bp = latestOf(loadBloodPressure());
      var weight = latestOf(loadWeightRecords());
      var glucose = latestOf(loadGlucoseRecords());
      var empty = "Пока нет записей";
      var gluContext = glucose ? glucoseContextLabel(glucose.condition) : "";
      host.innerHTML = [
        dashCardHtml(
          "❤️",
          "Давление",
          "bp",
          bp ? escapeHtml(bp.systolic) + " / " + escapeHtml(bp.diastolic) : empty,
          bp ? "Пульс " + escapeHtml(bp.pulse) + "<br>" + escapeHtml(friendlyDate(bp.date, true, bp.time)) : "&nbsp;",
          goalLineHtml("bp", bp, goals) + (bp ? statusHtml(measureStatus("bp", bp, goals)) : "")
        ),
        dashCardHtml(
          "⚖️",
          "Вес",
          "weight",
          weight ? escapeHtml(formatDecimal(weight.weight)) + " кг" : empty,
          weight ? escapeHtml(friendlyDate(weight.date, false, weight.time)) : "&nbsp;",
          goalLineHtml("weight", weight, goals) + (weight ? statusHtml(measureStatus("weight", weight, goals)) : "")
        ),
        dashCardHtml(
          "🩸",
          "Сахар",
          "glucose",
          glucose ? escapeHtml(formatDecimal(glucose.glucose)) + " ммоль/л" : empty,
          glucose ? escapeHtml(friendlyDate(glucose.date, true, glucose.time)) : "&nbsp;",
          (gluContext ? "<p class=\"dash-card-context\">" + escapeHtml(gluContext) + "</p>" : "") +
            goalLineHtml("glucose", glucose, goals) +
            (glucose ? statusHtml(measureStatus("glucose", glucose, goals)) : "")
        )
      ].join("");
    }

    function nearestUpcomingReminder() {
      var best = null;
      loadList(STORAGE_REMINDERS).forEach(function (item) {
        var slot = nextReminderSlot(item);
        if (slot && (!best || slot.ts < best.ts)) {
          best = slot;
        }
      });
      return best;
    }

    function renderDashReminder() {
      var host = document.getElementById("dash-next-reminder");
      if (!host) {
        return;
      }
      var next = nearestUpcomingReminder();
      if (!next) {
        host.innerHTML =
          "<h2 class=\"dash-title\">Ближайшее напоминание</h2>" +
          "<p class=\"dash-card-meta\">Напоминаний пока нет</p>" +
          "<button class=\"next-btn dash-wide-btn\" type=\"button\" data-dash=\"remind-add\">+ Добавить</button>";
        return;
      }
      host.innerHTML =
        "<h2 class=\"dash-title\">Ближайшее напоминание</h2>" +
        "<p class=\"dash-card-value\" style=\"font-size:1.35rem\">⏰ " + escapeHtml(friendlyDate(next.date, true, next.time)) + "</p>" +
        "<p class=\"dash-card-meta\">" + escapeHtml(next.item.text) + "</p>" +
        "<p class=\"dash-card-meta\">" + escapeHtml(formatRepeatMeta(next.item)) + "</p>" +
        "<div class=\"dash-card-actions\">" +
          "<button class=\"hint-btn\" type=\"button\" data-dash=\"remind-done\" data-id=\"" + escapeHtml(next.item.id) + "\" data-date=\"" + escapeHtml(next.date) + "\" data-time=\"" + escapeHtml(next.time) + "\">Выполнено</button>" +
          "<button class=\"hint-btn\" type=\"button\" data-dash=\"remind-edit\" data-id=\"" + escapeHtml(next.item.id) + "\">Изменить</button>" +
        "</div>";
    }

    function formatChartDay(dateStr) {
      var parts = String(dateStr || "").split("-");
      if (parts.length !== 3) {
        return dateStr || "";
      }
      return parts[2] + "." + parts[1];
    }

    function formatChartTime(timeStr) {
      return String(timeStr || "").slice(0, 5);
    }

    function formatChartValue(value, kind) {
      var n = Number(value);
      if (!isFinite(n)) {
        return "";
      }
      if (kind === "glucose" || (kind === "weight" && Math.round(n * 10) / 10 !== Math.round(n))) {
        return formatDecimal(Math.round(n * 10) / 10);
      }
      return String(Math.round(n));
    }

    function niceCeiling(maxVal, kind) {
      if (!(maxVal > 0)) {
        return kind === "glucose" ? 8 : 10;
      }
      if (kind === "bp") {
        return Math.max(160, Math.ceil(maxVal / 40) * 40);
      }
      if (kind === "pulse") {
        return Math.max(80, Math.ceil(maxVal / 20) * 20);
      }
      if (kind === "weight") {
        return Math.max(40, Math.ceil(maxVal / 10) * 10);
      }
      return Math.max(8, Math.ceil(maxVal));
    }

    function niceFloor(minVal, kind) {
      if (!(minVal > 0) || kind !== "weight") {
        return 0;
      }
      return Math.max(0, Math.floor((minVal * 0.82) / 10) * 10);
    }

    function axisTicks(maxVal, kind, minVal) {
      var from = minVal > 0 ? minVal : 0;
      var step = maxVal / 4;
      if (kind === "bp") {
        step = 40;
      } else if (kind === "pulse") {
        step = 20;
      } else if (kind === "weight") {
        step = maxVal - from <= 40 ? 10 : 20;
      } else {
        step = 2;
      }
      var out = [];
      var v;
      for (v = from; v <= maxVal + 0.001; v += step) {
        out.push(v);
      }
      return out;
    }

    function drawMeasureChart() {
      var svg = document.getElementById("measure-chart");
      var empty = document.getElementById("chart-empty");
      var pulseWrap = document.getElementById("chart-pulse-wrap");
      var legend = document.getElementById("chart-legend");
      var tooltip = document.getElementById("chart-tooltip");
      var wrap = svg && svg.parentNode;
      if (!svg) {
        return;
      }
      if (pulseWrap) {
        pulseWrap.hidden = chartKind !== "bp";
      }
      var gluFilterRow = document.getElementById("chart-glucose-filter-row");
      if (gluFilterRow) {
        gluFilterRow.hidden = chartKind !== "glucose";
      }
      var goals = loadGoals();
      var raw = chartKind === "bp" ? loadBloodPressure() : chartKind === "weight" ? loadWeightRecords() : loadGlucoseRecords();
      var list = filterByRange(raw, chartRange).slice().sort(function (a, b) {
        return compareDateTime(a.date, a.time, b.date, b.time);
      }).filter(function (item) {
        if (chartKind === "bp") {
          return Number(item.systolic) > 0 && Number(item.diastolic) > 0;
        }
        if (chartKind === "weight") {
          return Number(item.weight) > 0;
        }
        if (!(Number(item.glucose) > 0)) {
          return false;
        }
        if (chartGlucoseFilter === "all") {
          return true;
        }
        return glucoseContextKey(item.condition) === chartGlucoseFilter;
      });
      svg.innerHTML = "";
      if (tooltip) {
        tooltip.hidden = true;
      }
      if (!list.length) {
        svg.hidden = true;
        if (empty) {
          empty.hidden = false;
          empty.textContent = "Пока нет измерений за этот период.";
        }
        if (legend) {
          legend.hidden = true;
        }
        return;
      }
      svg.hidden = false;
      if (empty) {
        empty.hidden = true;
      }
      var showPulse = chartKind === "bp" && chartPulse && list.some(function (item) {
        return Number(item.pulse) > 0;
      });
      var unit = chartKind === "bp" ? "мм рт. ст." : chartKind === "weight" ? "кг" : "ммоль/л";
      var sysZoneOn = chartKind === "bp" && isSetRange(goals.bp.sysMin, goals.bp.sysMax);
      var diaZoneOn = chartKind === "bp" && isSetRange(goals.bp.diaMin, goals.bp.diaMax);
      var pulseZoneOn = showPulse && isSetRange(goals.bp.pulseMin, goals.bp.pulseMax);
      var weightZoneOn = chartKind === "weight" && isSetRange(goals.weight.min, goals.weight.max);
      var gluFilterZone = null;
      if (chartKind === "glucose" && chartGlucoseFilter !== "all") {
        gluFilterZone = goals.glucose[chartGlucoseFilter] || { min: null, max: null };
      }
      var gluZoneOn = gluFilterZone ? isSetRange(gluFilterZone.min, gluFilterZone.max) : false;
      var gluColumnZoneOn = false;
      if (chartKind === "glucose" && chartGlucoseFilter === "all") {
        list.forEach(function (item) {
          var rowGoal = glucoseGoalRange(goals, item.condition);
          if (isSetRange(rowGoal.min, rowGoal.max)) {
            gluColumnZoneOn = true;
          }
        });
      }
      if (legend) {
        legend.hidden = false;
        if (chartKind === "bp") {
          legend.innerHTML =
            "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-sys\"></span>Верхнее</span>" +
            "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-dia\"></span>Нижнее</span>" +
            (sysZoneOn ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-zone chart-swatch-zone-sys\"></span>Мой целевой диапазон · верхнее</span>" : "") +
            (diaZoneOn ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-zone chart-swatch-zone-dia\"></span>Мой целевой диапазон · нижнее</span>" : "") +
            "<span class=\"chart-legend-unit\">" + unit + "</span>" +
            (showPulse ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-pulse\"></span>Пульс, уд/мин</span>" : "") +
            (pulseZoneOn ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-zone chart-swatch-zone-pulse\"></span>Мой целевой диапазон</span>" : "");
        } else if (chartKind === "weight") {
          legend.innerHTML =
            "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-sys\"></span>Вес, кг</span>" +
            (weightZoneOn ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-zone\"></span>Мой целевой диапазон веса</span>" : "");
        } else {
          legend.innerHTML =
            "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-sys\"></span>Сахар, ммоль/л</span>" +
            (gluZoneOn || gluColumnZoneOn ? "<span class=\"chart-legend-item\"><span class=\"chart-swatch chart-swatch-zone\"></span>Мой целевой диапазон</span>" : "");
        }
      }
      var width = 640;
      var padL = 44;
      var padR = 14;
      var padT = 28;
      var plotH = 168;
      var pulseH = 86;
      var gap = 36;
      var labelH = 46;
      var height = showPulse ? padT + plotH + gap + pulseH + labelH : padT + plotH + labelH;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute(
        "aria-label",
        chartKind === "bp"
          ? (showPulse ? "Столбчатая диаграмма давления и пульса" : "Столбчатая диаграмма давления")
          : chartKind === "weight"
            ? "Столбчатая диаграмма веса"
            : "Столбчатая диаграмма сахара"
      );
      var n = list.length;
      var innerW = width - padL - padR;
      var slotW = innerW / n;
      var groupW = Math.min(n === 1 ? 92 : 54, Math.max(18, slotW * 0.72));
      var dateHits = {};
      list.forEach(function (item) {
        dateHits[item.date] = (dateHits[item.date] || 0) + 1;
      });
      var ns = "http://www.w3.org/2000/svg";
      function el(name, attrs, text) {
        var node = document.createElementNS(ns, name);
        Object.keys(attrs).forEach(function (key) {
          node.setAttribute(key, attrs[key]);
        });
        if (text) {
          node.textContent = text;
        }
        svg.appendChild(node);
        return node;
      }
      function groupLeft(i) {
        return padL + i * slotW + (slotW - groupW) / 2;
      }
      function yOf(value, y0, h, maxV, minV) {
        var floor = minV > 0 ? minV : 0;
        var span = maxV - floor;
        if (!(span > 0)) {
          return y0 + h;
        }
        return y0 + h - ((Number(value) - floor) / span) * h;
      }
      function drawRangeBand(y0, h, maxV, min, max, fill, x, w, minV) {
        if (!isSetRange(min, max) || !(maxV > 0)) {
          return;
        }
        var floor = minV > 0 ? minV : 0;
        var lo = Math.max(floor, Number(min));
        var hi = Math.min(maxV, Number(max));
        if (!(hi > lo)) {
          return;
        }
        var y1 = yOf(hi, y0, h, maxV, floor);
        var y2 = yOf(lo, y0, h, maxV, floor);
        el("rect", {
          class: "chart-range-band",
          x: (x != null ? x : padL).toFixed ? (x != null ? x : padL).toFixed(1) : String(x != null ? x : padL),
          y: y1.toFixed(1),
          width: String(w != null ? w : width - padL - padR),
          height: Math.max(1, y2 - y1).toFixed(1),
          fill: fill,
          "pointer-events": "none"
        });
      }
      function chartTip(item, valueLine, extraLine, goalLine, code) {
        var lines = [formatDateRu(item.date) + (item.time ? " · " + formatChartTime(item.time) : ""), valueLine];
        if (extraLine) {
          lines.push(extraLine);
        }
        if (goalLine) {
          lines.push(goalLine);
        }
        var st = statusLabel(code);
        if (st) {
          lines.push(st);
        } else if (!goalLine) {
          lines.push("Задать мою цель");
        }
        return lines.join("\n");
      }
      function showTip(event, text) {
        if (!tooltip || !wrap) {
          return;
        }
        tooltip.hidden = false;
        tooltip.textContent = text;
        var rect = wrap.getBoundingClientRect();
        tooltip.style.left = Math.min(rect.width - 188, Math.max(8, event.clientX - rect.left + 12)) + "px";
        tooltip.style.top = Math.max(8, event.clientY - rect.top - 96) + "px";
      }
      function hideTip() {
        if (tooltip) {
          tooltip.hidden = true;
        }
      }
      function roundedBar(x, y, w, h, fill, tip) {
        if (!(h > 0) || !(w > 0)) {
          return null;
        }
        var r = Math.min(6, w / 2, h);
        var d =
          "M" + x.toFixed(2) + "," + (y + h).toFixed(2) +
          " V" + (y + r).toFixed(2) +
          " Q" + x.toFixed(2) + "," + y.toFixed(2) + " " + (x + r).toFixed(2) + "," + y.toFixed(2) +
          " H" + (x + w - r).toFixed(2) +
          " Q" + (x + w).toFixed(2) + "," + y.toFixed(2) + " " + (x + w).toFixed(2) + "," + (y + r).toFixed(2) +
          " V" + (y + h).toFixed(2) + " Z";
        var bar = el("path", { d: d, fill: fill });
        if (tip) {
          bar.style.cursor = "pointer";
          bar.addEventListener("mousemove", function (event) {
            showTip(event, tip);
          });
          bar.addEventListener("mouseleave", hideTip);
          bar.addEventListener("click", function (event) {
            showTip(event, tip);
          });
        }
        return bar;
      }
      function valueLabel(x, y, text, y0) {
        if (!text) {
          return;
        }
        var labelY = y - 6;
        if (labelY < y0 + 11) {
          labelY = y0 + 13;
        }
        el(
          "text",
          {
            x: x.toFixed(1),
            y: labelY.toFixed(1),
            fill: "#2a211c",
            "font-size": n > 10 ? "11" : "13",
            "font-weight": "700",
            "text-anchor": "middle",
            "font-family": "Segoe UI, sans-serif"
          },
          text
        );
      }
      function drawPanel(y0, h, maxV, kind, title, decimals, minV) {
        el(
          "text",
          {
            x: String(padL),
            y: String(y0 - 10),
            fill: "#5d4a40",
            "font-size": "12",
            "font-weight": "600",
            "font-family": "Segoe UI, sans-serif"
          },
          title
        );
        axisTicks(maxV, kind, minV).forEach(function (tick) {
          var y = yOf(tick, y0, h, maxV, minV);
          el("line", {
            x1: String(padL),
            y1: y.toFixed(1),
            x2: String(width - padR),
            y2: y.toFixed(1),
            stroke: "#ead9c6",
            "stroke-width": "1"
          });
          var label = decimals
            ? String(Math.round(tick * 10) / 10).replace(".", ",")
            : String(Math.round(tick));
          el(
            "text",
            {
              x: String(padL - 8),
              y: String(y + 4),
              fill: "#5d4a40",
              "font-size": "11",
              "text-anchor": "end",
              "font-family": "Segoe UI, sans-serif"
            },
            label
          );
        });
        el("line", {
          x1: String(padL),
          y1: String(y0 + h),
          x2: String(width - padR),
          y2: String(y0 + h),
          stroke: "#d7c2ab",
          "stroke-width": "1.2"
        });
      }
      function shouldShowXLabel(i, item) {
        if (n <= 8) {
          return true;
        }
        if (dateHits[item.date] > 1) {
          return true;
        }
        if (i === 0 || i === n - 1) {
          return true;
        }
        return i % Math.ceil(n / 7) === 0;
      }

      var mainMax = 0;
      var pulseMax = 0;
      list.forEach(function (item) {
        if (chartKind === "bp") {
          mainMax = Math.max(mainMax, Number(item.systolic), Number(item.diastolic));
          if (showPulse && Number(item.pulse) > 0) {
            pulseMax = Math.max(pulseMax, Number(item.pulse));
          }
        } else if (chartKind === "weight") {
          mainMax = Math.max(mainMax, Number(item.weight));
        } else {
          mainMax = Math.max(mainMax, Number(item.glucose));
        }
      });
      if (sysZoneOn) {
        mainMax = Math.max(mainMax, Number(goals.bp.sysMax));
      }
      if (diaZoneOn) {
        mainMax = Math.max(mainMax, Number(goals.bp.diaMax));
      }
      if (weightZoneOn) {
        mainMax = Math.max(mainMax, Number(goals.weight.max));
      }
      if (gluZoneOn) {
        mainMax = Math.max(mainMax, Number(gluFilterZone.max));
      }
      if (chartKind === "glucose" && chartGlucoseFilter === "all") {
        list.forEach(function (item) {
          var rowGoal = glucoseGoalRange(goals, item.condition);
          if (isSetRange(rowGoal.min, rowGoal.max)) {
            mainMax = Math.max(mainMax, Number(rowGoal.max));
          }
        });
      }
      if (pulseZoneOn) {
        pulseMax = Math.max(pulseMax, Number(goals.bp.pulseMax));
      }
      var mainKind = chartKind === "bp" ? "bp" : chartKind === "weight" ? "weight" : "glucose";
      var mainFloor = 0;
      if (chartKind === "weight") {
        var weightLow = mainMax;
        list.forEach(function (item) {
          if (Number(item.weight) > 0) {
            weightLow = Math.min(weightLow, Number(item.weight));
          }
        });
        if (weightZoneOn) {
          weightLow = Math.min(weightLow, Number(goals.weight.min));
        }
        mainFloor = niceFloor(weightLow, "weight");
      }
      var mainCeil = niceCeiling(mainMax, mainKind);
      if (mainCeil <= mainFloor) {
        mainCeil = mainFloor + (chartKind === "weight" ? 20 : 10);
      }
      var pulseCeil = niceCeiling(pulseMax, "pulse");
      var mainY0 = padT;
      drawPanel(
        mainY0,
        plotH,
        mainCeil,
        mainKind,
        chartKind === "bp" ? "мм рт. ст." : chartKind === "weight" ? "кг" : "ммоль/л",
        chartKind === "glucose",
        mainFloor
      );
      if (sysZoneOn) {
        drawRangeBand(mainY0, plotH, mainCeil, goals.bp.sysMin, goals.bp.sysMax, "rgba(143, 61, 50, 0.14)");
      }
      if (diaZoneOn) {
        drawRangeBand(mainY0, plotH, mainCeil, goals.bp.diaMin, goals.bp.diaMax, "rgba(201, 137, 98, 0.2)");
      }
      if (weightZoneOn) {
        drawRangeBand(mainY0, plotH, mainCeil, goals.weight.min, goals.weight.max, "rgba(143, 61, 50, 0.12)", null, null, mainFloor);
      }
      if (gluZoneOn) {
        drawRangeBand(mainY0, plotH, mainCeil, gluFilterZone.min, gluFilterZone.max, "rgba(143, 61, 50, 0.12)");
      }
      if (chartKind === "glucose" && chartGlucoseFilter === "all") {
        list.forEach(function (item, i) {
          var rowGoal = glucoseGoalRange(goals, item.condition);
          if (!isSetRange(rowGoal.min, rowGoal.max)) {
            return;
          }
          drawRangeBand(
            mainY0,
            plotH,
            mainCeil,
            rowGoal.min,
            rowGoal.max,
            "rgba(143, 61, 50, 0.1)",
            padL + i * slotW + 3,
            Math.max(6, slotW - 6)
          );
        });
      }

      list.forEach(function (item, i) {
        var gx = groupLeft(i);
        if (chartKind === "bp") {
          var barGap = Math.min(4, Math.max(2, groupW * 0.08));
          var barW = (groupW - barGap) / 2;
          var sys = Number(item.systolic);
          var dia = Number(item.diastolic);
          var sysY = yOf(sys, mainY0, plotH, mainCeil, 0);
          var diaY = yOf(dia, mainY0, plotH, mainCeil, 0);
          var sysH = mainY0 + plotH - sysY;
          var diaH = mainY0 + plotH - diaY;
          var sysGoal = formatGoalRange(goals.bp.sysMin, goals.bp.sysMax, "", "bp");
          var diaGoal = formatGoalRange(goals.bp.diaMin, goals.bp.diaMax, "", "bp");
          roundedBar(
            gx,
            sysY,
            barW,
            sysH,
            "#8f3d32",
            chartTip(
              item,
              "Верхнее: " + Math.round(sys) + " мм рт. ст.",
              "",
              sysGoal ? "Моя цель: " + sysGoal : "",
              statusCode(sys, goals.bp.sysMin, goals.bp.sysMax)
            )
          );
          roundedBar(
            gx + barW + barGap,
            diaY,
            barW,
            diaH,
            "#c98962",
            chartTip(
              item,
              "Нижнее: " + Math.round(dia) + " мм рт. ст.",
              "",
              diaGoal ? "Моя цель: " + diaGoal : "",
              statusCode(dia, goals.bp.diaMin, goals.bp.diaMax)
            )
          );
          if (barW >= 14) {
            valueLabel(gx + barW / 2, sysY, formatChartValue(sys, "bp"), mainY0);
            valueLabel(gx + barW + barGap + barW / 2, diaY, formatChartValue(dia, "bp"), mainY0);
          }
        } else {
          var value = chartKind === "weight" ? Number(item.weight) : Number(item.glucose);
          var barY = yOf(value, mainY0, plotH, mainCeil, mainFloor);
          var barH = mainY0 + plotH - barY;
          var valueText = formatChartValue(value, chartKind);
          var gluRange = chartKind === "glucose" ? glucoseGoalRange(goals, item.condition) : null;
          var goalText =
            chartKind === "weight"
              ? (isSetRange(goals.weight.min, goals.weight.max) ? "Моя цель: " + formatGoalRange(goals.weight.min, goals.weight.max, "кг", "weight") : "")
              : (gluRange && isSetRange(gluRange.min, gluRange.max) ? "Моя цель: " + formatGoalRange(gluRange.min, gluRange.max, "ммоль/л", "glucose") : "");
          var gluLabel = chartKind === "glucose" ? glucoseContextLabel(item.condition) : "";
          roundedBar(
            gx,
            barY,
            groupW,
            barH,
            "#8f3d32",
            chartTip(
              item,
              (chartKind === "weight" ? "Вес: " : "Сахар: ") + valueText + " " + unit,
              gluLabel,
              goalText,
              chartKind === "weight"
                ? statusCode(value, goals.weight.min, goals.weight.max)
                : statusCode(value, gluRange.min, gluRange.max)
            )
          );
          if (groupW >= 16) {
            valueLabel(gx + groupW / 2, barY, valueText, mainY0);
          }
        }
      });

      var labelsY0 = mainY0 + plotH;
      if (showPulse) {
        var pulseY0 = mainY0 + plotH + gap;
        drawPanel(pulseY0, pulseH, pulseCeil, "pulse", "Пульс, уд/мин", false);
        if (pulseZoneOn) {
          drawRangeBand(pulseY0, pulseH, pulseCeil, goals.bp.pulseMin, goals.bp.pulseMax, "rgba(109, 122, 94, 0.16)");
        }
        list.forEach(function (item, i) {
          var pulse = Number(item.pulse);
          if (!(pulse > 0)) {
            return;
          }
          var gx = groupLeft(i);
          var barW = Math.min(groupW * 0.72, n === 1 ? 64 : 36);
          var bx = gx + (groupW - barW) / 2;
          var barH = (pulse / pulseCeil) * pulseH;
          var barY = pulseY0 + pulseH - barH;
          roundedBar(
            bx,
            barY,
            barW,
            barH,
            "#6d7a5e",
            chartTip(
              item,
              "Пульс: " + Math.round(pulse) + " уд/мин",
              "",
              pulseZoneOn ? "Моя цель: " + formatGoalRange(goals.bp.pulseMin, goals.bp.pulseMax, "", "bp") : "",
              statusCode(pulse, goals.bp.pulseMin, goals.bp.pulseMax)
            )
          );
          if (barW >= 14) {
            valueLabel(bx + barW / 2, barY, String(Math.round(pulse)), pulseY0);
          }
        });
        labelsY0 = pulseY0 + pulseH;
      }

      list.forEach(function (item, i) {
        if (!shouldShowXLabel(i, item)) {
          return;
        }
        var cx = groupLeft(i) + groupW / 2;
        var needTime = dateHits[item.date] > 1 && item.time;
        var day = formatChartDay(item.date);
        el(
          "text",
          {
            x: cx.toFixed(1),
            y: String(labelsY0 + (needTime ? 16 : 18)),
            fill: "#5d4a40",
            "font-size": n > 9 ? "10" : "12",
            "text-anchor": "middle",
            "font-family": "Segoe UI, sans-serif"
          },
          day
        );
        if (needTime) {
          el(
            "text",
            {
              x: cx.toFixed(1),
              y: String(labelsY0 + 30),
              fill: "#5d4a40",
              "font-size": "11",
              "font-weight": "600",
              "text-anchor": "middle",
              "font-family": "Segoe UI, sans-serif"
            },
            formatChartTime(item.time)
          );
        }
      });
    }

    function renderRecent() {
      var host = document.getElementById("dash-recent");
      if (!host) {
        return;
      }
      var rows = allMeasureEntries().slice(0, 7);
      if (!rows.length) {
        host.innerHTML = "<p class=\"dash-card-meta\">Пока нет записей</p>";
        return;
      }
      host.innerHTML = rows.map(function (row) {
        return (
          "<div class=\"dash-recent-item\">" +
            "<p class=\"dash-card-meta\">" + escapeHtml(friendlyDate(row.date, true, row.time)) + "</p>" +
            "<p class=\"dash-card-value\" style=\"font-size:1.25rem\">" + row.icon + " " + escapeHtml(row.value) + (row.extra ? " · " + escapeHtml(row.extra) : "") + "</p>" +
          "</div>"
        );
      }).join("");
    }

    function renderMeasureDashboard() {
      renderMeasureCards();
      renderDashReminder();
      drawMeasureChart();
      renderRecent();
    }

    function renderMeasureHistory() {
      var rows = allMeasureEntries();
      var gluFilterRow = document.getElementById("history-glucose-filter-row");
      if (gluFilterRow) {
        gluFilterRow.hidden = historyKind !== "glucose";
      }
      if (historyKind !== "all") {
        rows = rows.filter(function (row) {
          return row.kind === historyKind;
        });
      }
      if (historyKind === "glucose" && historyGlucoseFilter !== "all") {
        rows = rows.filter(function (row) {
          return glucoseContextKey(row.raw.condition) === historyGlucoseFilter;
        });
      }
      rows = filterByRange(rows, historyRange);
      var empty = document.getElementById("history-empty");
      var list = document.getElementById("history-list");
      if (empty) {
        empty.hidden = rows.length > 0;
      }
      if (!list) {
        return;
      }
      list.innerHTML = rows.map(function (row) {
        return (
          '<article class="imp-item">' +
            "<p class=\"imp-item-meta\">" + escapeHtml(friendlyDate(row.date, true, row.time)) + "</p>" +
            "<p class=\"imp-measure-value\">" + row.icon + " " + escapeHtml(row.value) + "</p>" +
            (row.extra ? "<p class=\"imp-item-text\">" + escapeHtml(row.extra) + "</p>" : "") +
            statusHtml(row.status) +
            (row.note ? "<p class=\"imp-item-text\">" + escapeHtml(row.note) + "</p>" : "") +
            "<div class=\"imp-actions\">" +
              "<button class=\"hint-btn\" type=\"button\" data-hist=\"edit\" data-kind=\"" + row.kind + "\" data-id=\"" + escapeHtml(row.id) + "\">Изменить</button>" +
              "<button class=\"next-btn\" type=\"button\" data-hist=\"delete\" data-kind=\"" + row.kind + "\" data-id=\"" + escapeHtml(row.id) + "\">Удалить</button>" +
            "</div>" +
          "</article>"
        );
      }).join("");
    }

    function prepareMeasureHistoryPrint(rows) {
      return rows.map(function (row) {
        return {
          date: formatDateRu(row.date),
          time: row.time || "",
          label: row.label,
          value: row.value + (row.extra ? " · " + row.extra : "") + (statusLabel(row.status) ? " · " + statusLabel(row.status) : ""),
          note: row.note || ""
        };
      });
    }

    function exportMeasureHistoryLater() {
      // Reserved for later «Распечатать / Сохранить PDF».
    }

    function renderHistoryPrint() {
      var rows = allMeasureEntries();
      if (historyKind !== "all") {
        rows = rows.filter(function (row) {
          return row.kind === historyKind;
        });
      }
      rows = filterByRange(rows, historyRange);
      var caption = document.getElementById("history-print-caption");
      var host = document.getElementById("history-print-table");
      var printRows = prepareMeasureHistoryPrint(rows);
      if (caption) {
        caption.textContent = printRows.length ? "Записи за выбранный период" : "Пока записей нет";
      }
      if (!host) {
        return;
      }
      host.innerHTML =
        "<table class=\"imp-print-table\">" +
          "<thead><tr><th>Дата</th><th>Время</th><th>Показатель</th><th>Значение</th><th>Заметка</th></tr></thead>" +
          "<tbody>" +
            printRows.map(function (row) {
              return "<tr><td>" + escapeHtml(row.date) + "</td><td>" + escapeHtml(row.time) + "</td><td>" + escapeHtml(row.label) + "</td><td>" + escapeHtml(row.value) + "</td><td>" + escapeHtml(row.note) + "</td></tr>";
            }).join("") +
          "</tbody></table>";
      exportMeasureHistoryLater();
    }

    function setChip(rowId, attr, value) {
      var row = document.getElementById(rowId);
      if (!row) {
        return;
      }
      Array.prototype.forEach.call(row.querySelectorAll(".imp-chip"), function (btn) {
        btn.classList.toggle("is-on", btn.getAttribute(attr) === String(value));
      });
    }

    function defaultRemindText(kind) {
      if (kind === "bp" || kind === "blood_pressure") {
        return "Измерить давление";
      }
      if (kind === "weight") {
        return "Измерить вес";
      }
      return "Измерить сахар";
    }

    function toMeasureType(kind) {
      if (kind === "bp" || kind === "blood_pressure") {
        return "blood_pressure";
      }
      if (kind === "weight") {
        return "weight";
      }
      return "glucose";
    }

    function syncRemindFields() {
      var repeat = document.getElementById("measure-remind-repeat").value;
      document.getElementById("measure-remind-once").hidden = repeat !== "once";
      document.getElementById("measure-remind-time-only").hidden = repeat === "once";
      document.getElementById("measure-remind-time-extra").hidden = repeat === "once";
      document.getElementById("measure-remind-days").hidden = repeat !== "weekdays" && repeat !== "weekly";
    }

    function showMeasureRemind(kind, item) {
      currentView = "measure-remind";
      hideImpViews();
      impMeasureRemind.hidden = false;
      setImpBackLabel();
      measureRemindType = item && item.measurementType ? item.measurementType : (kind ? toMeasureType(kind) : "");
      measureRemindEditId = item ? item.id : "";
      document.getElementById("measure-remind-title").textContent = measureRemindType ? "Напоминание об измерении" : "Напоминание";
      document.getElementById("measure-remind-text").value = item ? item.text : (kind ? defaultRemindText(kind) : "");
      document.getElementById("measure-remind-repeat").value = item && item.repeat ? item.repeat : "once";
      document.getElementById("measure-remind-date").value = item && item.date ? item.date : todayDateValue();
      var times = item ? reminderTimes(item) : [nowTimeValue()];
      document.getElementById("measure-remind-time").value = times[0] || nowTimeValue();
      document.getElementById("measure-remind-time2").value = times[0] || nowTimeValue();
      document.getElementById("measure-remind-time3").value = times[1] || "";
      Array.prototype.forEach.call(document.querySelectorAll("#measure-remind-days input"), function (box) {
        box.checked = item && item.weekdays ? item.weekdays.indexOf(Number(box.value)) !== -1 : false;
      });
      syncRemindFields();
    }

    function completeReminder(id, dateStr, timeStr) {
      var list = loadList(STORAGE_REMINDERS);
      list = list.map(function (item) {
        if (item.id !== id) {
          return item;
        }
        if ((item.repeat || "once") === "once") {
          item.done = true;
          return item;
        }
        item.doneSlots = item.doneSlots || [];
        var key = dateStr + "|" + timeStr;
        if (item.doneSlots.indexOf(key) === -1) {
          item.doneSlots.push(key);
        }
        return item;
      });
      saveList(STORAGE_REMINDERS, list);
    }

    function renderBp() {}
    function renderWeight() {}
    function renderGlucose() {}

    function fillNoteForm(item) {
      noteEditId = item.id;
      noteTitle.value = item.title || "";
      noteText.value = item.text || "";
      noteTitle.focus();
    }

    function fillReminderForm(item) {
      if (item && item.type === "measurement") {
        showMeasureRemind(item.measurementType, item);
        return;
      }
      reminderEditId = item.id;
      showRemindersView();
      reminderText.value = item.text || "";
      reminderDate.value = item.date || todayDateValue();
      reminderTime.value = item.time || nowTimeValue();
      reminderText.focus();
    }

    function fillPhoneForm(item) {
      phoneEditId = item.id;
      phoneName.value = item.name || "";
      phoneDesc.value = item.description || "";
      phoneNumber.value = item.phone || "";
      phoneName.focus();
    }

    function fillBpForm(item) {
      bpEditId = item.id;
      bpSystolic.value = item.systolic || "";
      bpDiastolic.value = item.diastolic || "";
      bpPulse.value = item.pulse || "";
      bpDate.value = item.date || todayDateValue();
      bpTime.value = item.time || nowTimeValue();
      bpNote.value = item.note || "";
      bpSystolic.focus();
    }

    function fillWeightForm(item) {
      weightEditId = item.id;
      weightKg.value = item.weight || "";
      weightDate.value = item.date || todayDateValue();
      weightTime.value = item.time || nowTimeValue();
      weightNote.value = item.note || "";
      weightKg.focus();
    }

    function fillGlucoseForm(item) {
      glucoseEditId = item.id;
      glucoseValue.value = item.glucose || "";
      glucoseCondition.value = glucoseContextKey(item.condition) || "";
      glucoseDate.value = item.date || todayDateValue();
      glucoseTime.value = item.time || nowTimeValue();
      glucoseNote.value = item.note || "";
      glucoseValue.focus();
    }

    document.getElementById("open-important").addEventListener("click", showImportantScreen);
    importantBack.addEventListener("click", function () {
      stopImportantDictation();
      if (currentView === "hub" || currentView === "phones" || currentView === "measures") {
        showMyImportantHub();
        return;
      }
      if (currentView === "history-print") {
        showHistoryView();
        return;
      }
      if (
        currentView === "bp" ||
        currentView === "weight" ||
        currentView === "glucose" ||
        currentView === "history" ||
        currentView === "measure-remind" ||
        currentView === "goals"
      ) {
        bpEditId = "";
        weightEditId = "";
        glucoseEditId = "";
        measureRemindEditId = "";
        showMeasuresView();
        return;
      }
      noteEditId = "";
      reminderEditId = "";
      phoneEditId = "";
      showImpHub();
    });
    document.getElementById("open-notes").addEventListener("click", showNotesView);
    document.getElementById("open-reminders").addEventListener("click", showRemindersView);
    document.getElementById("open-phones").addEventListener("click", showPhonesView);
    document.getElementById("open-measures").addEventListener("click", showMeasuresView);
    importantScreen.addEventListener("click", function (event) {
      var fillButton = event.target.closest("[data-measure-voice]");
      var dictationButton = event.target.closest("[data-dictation]");
      if (fillButton && importantScreen.contains(fillButton)) {
        event.preventDefault();
        startImportantDictation(null, fillButton, fillButton.getAttribute("data-measure-voice"));
        return;
      }
      if (!dictationButton || !importantScreen.contains(dictationButton)) {
        return;
      }
      event.preventDefault();
      startImportantDictation(document.getElementById(dictationButton.getAttribute("data-dictation")), dictationButton);
    });

    noteForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var title = noteTitle.value.trim();
      var text = noteText.value.trim();
      if (!title || !text) {
        return;
      }
      var list = loadList(STORAGE_NOTES);
      var now = new Date().toISOString();
      if (noteEditId) {
        list = list.map(function (item) {
          if (item.id !== noteEditId) {
            return item;
          }
          item.title = title;
          item.text = text;
          item.updatedAt = now;
          return item;
        });
      } else {
        list.unshift({
          id: newId("note-"),
          title: title,
          text: text,
          done: false,
          createdAt: now
        });
      }
      saveList(STORAGE_NOTES, list);
      noteEditId = "";
      noteForm.reset();
      renderNotes();
    });

    reminderForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = reminderText.value.trim();
      var date = reminderDate.value;
      var time = reminderTime.value;
      if (!text || !date || !time) {
        return;
      }
      var list = loadList(STORAGE_REMINDERS);
      var payload = {
        id: reminderEditId || newId("reminder-"),
        text: text,
        date: date,
        time: time,
        done: false,
        createdAt: new Date().toISOString()
      };
      if (reminderEditId) {
        list = list.map(function (item) {
          if (item.id !== reminderEditId) {
            return item;
          }
          payload.done = item.done;
          payload.createdAt = item.createdAt || payload.createdAt;
          if (item.type) {
            payload.type = item.type;
          }
          if (item.measurementType) {
            payload.measurementType = item.measurementType;
          }
          if (item.repeat) {
            payload.repeat = item.repeat;
          }
          if (item.times) {
            payload.times = item.times;
          }
          if (item.weekdays) {
            payload.weekdays = item.weekdays;
          }
          if (item.doneSlots) {
            payload.doneSlots = item.doneSlots;
          }
          return payload;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_REMINDERS, list);
      scheduleReminderNotification(payload);
      reminderEditId = "";
      reminderForm.reset();
      reminderDate.value = todayDateValue();
      reminderTime.value = nowTimeValue();
      renderReminders();
    });

    phoneForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = phoneName.value.trim();
      var phone = phoneNumber.value.trim();
      if (!name || !phone) {
        return;
      }
      var list = loadList(STORAGE_CONTACTS);
      var payload = {
        id: phoneEditId || newId("phone-"),
        name: name,
        description: phoneDesc.value.trim(),
        phone: phone
      };
      if (phoneEditId) {
        list = list.map(function (item) {
          return item.id === phoneEditId ? payload : item;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_CONTACTS, list);
      phoneEditId = "";
      phoneForm.reset();
      renderPhones();
    });

    bpForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        id: bpEditId || newId("bp-"),
        systolic: Number(bpSystolic.value),
        diastolic: Number(bpDiastolic.value),
        pulse: Number(bpPulse.value),
        date: bpDate.value,
        time: bpTime.value,
        note: bpNote.value.trim()
      };
      if (!payload.systolic || !payload.diastolic || !payload.pulse) {
        return;
      }
      var list = loadBloodPressure();
      if (bpEditId) {
        list = list.map(function (item) {
          return item.id === bpEditId ? payload : item;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_BP, list);
      if (!bpEditId) {
        notifyRoom("measurementSaved");
      }
      bpEditId = "";
      bpForm.reset();
      fillNow(bpDate, bpTime);
      showMeasuresView();
    });

    weightForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        id: weightEditId || newId("weight-"),
        weight: Number(weightKg.value),
        date: weightDate.value,
        time: weightTime.value,
        note: weightNote.value.trim()
      };
      if (!payload.weight) {
        return;
      }
      var list = loadWeightRecords();
      if (weightEditId) {
        list = list.map(function (item) {
          return item.id === weightEditId ? payload : item;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_WEIGHT, list);
      if (!weightEditId) {
        notifyRoom("measurementSaved");
      }
      weightEditId = "";
      weightForm.reset();
      fillNow(weightDate, weightTime);
      showMeasuresView();
    });

    glucoseForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        id: glucoseEditId || newId("glucose-"),
        glucose: Number(glucoseValue.value),
        condition: glucoseCondition.value,
        date: glucoseDate.value,
        time: glucoseTime.value,
        note: glucoseNote.value.trim()
      };
      if (!payload.glucose || !payload.condition) {
        return;
      }
      var list = loadGlucoseRecords();
      if (glucoseEditId) {
        list = list.map(function (item) {
          return item.id === glucoseEditId ? payload : item;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_GLUCOSE, list);
      if (!glucoseEditId) {
        notifyRoom("measurementSaved");
      }
      glucoseEditId = "";
      glucoseForm.reset();
      glucoseCondition.value = "";
      fillNow(glucoseDate, glucoseTime);
      showMeasuresView();
    });

    notesList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-imp]");
      if (!button) {
        return;
      }
      var id = button.getAttribute("data-id");
      var action = button.getAttribute("data-imp");
      var list = loadList(STORAGE_NOTES);
      var item = list.filter(function (entry) {
        return entry.id === id;
      })[0];
      if (!item) {
        return;
      }
      if (action === "note-edit") {
        fillNoteForm(item);
        return;
      }
      if (action === "note-done") {
        item.done = !item.done;
        saveList(STORAGE_NOTES, list);
        renderNotes();
        return;
      }
      if (action === "note-delete") {
        askDelete("Удалить эту заметку?", function () {
          saveList(STORAGE_NOTES, list.filter(function (entry) {
            return entry.id !== id;
          }));
          if (noteEditId === id) {
            noteEditId = "";
            noteForm.reset();
          }
          renderNotes();
        });
      }
    });

    function onReminderListClick(event) {
      var button = event.target.closest("[data-imp]");
      if (!button) {
        return;
      }
      var id = button.getAttribute("data-id");
      var action = button.getAttribute("data-imp");
      var list = loadList(STORAGE_REMINDERS);
      var item = list.filter(function (entry) {
        return entry.id === id;
      })[0];
      if (!item) {
        return;
      }
      if (action === "reminder-edit") {
        fillReminderForm(item);
        return;
      }
      if (action === "reminder-done" || action === "reminder-undone") {
        if (action === "reminder-undone") {
          item.done = false;
          saveList(STORAGE_REMINDERS, list);
        } else {
          completeReminder(id, button.getAttribute("data-date"), button.getAttribute("data-time"));
        }
        renderReminders();
        return;
      }
      if (action === "reminder-delete") {
        askDelete("Удалить это напоминание?", function () {
          saveList(STORAGE_REMINDERS, list.filter(function (entry) {
            return entry.id !== id;
          }));
          if (reminderEditId === id) {
            reminderEditId = "";
            reminderForm.reset();
            reminderDate.value = todayDateValue();
            reminderTime.value = nowTimeValue();
          }
          renderReminders();
        });
      }
    }

    remindersList.addEventListener("click", onReminderListClick);
    remindersDoneList.addEventListener("click", onReminderListClick);

    phonesList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-imp]");
      if (!button) {
        return;
      }
      var id = button.getAttribute("data-id");
      var action = button.getAttribute("data-imp");
      var list = loadList(STORAGE_CONTACTS);
      var item = list.filter(function (entry) {
        return entry.id === id;
      })[0];
      if (!item) {
        return;
      }
      if (action === "phone-edit") {
        fillPhoneForm(item);
        return;
      }
      if (action === "phone-delete") {
        askDelete("Удалить этот номер?", function () {
          saveList(STORAGE_CONTACTS, list.filter(function (entry) {
            return entry.id !== id;
          }));
          if (phoneEditId === id) {
            phoneEditId = "";
            phoneForm.reset();
          }
          renderPhones();
        });
      }
    });

    function openMeasureForm(kind, item) {
      if (kind === "bp") {
        if (item) {
          fillBpForm(item);
        } else {
          bpEditId = "";
        }
        showBpView();
        return;
      }
      if (kind === "weight") {
        if (item) {
          fillWeightForm(item);
        } else {
          weightEditId = "";
        }
        showWeightView();
        return;
      }
      if (item) {
        fillGlucoseForm(item);
      } else {
        glucoseEditId = "";
      }
      showGlucoseView();
    }

    function findMeasure(kind, id) {
      var list = kind === "bp" ? loadBloodPressure() : kind === "weight" ? loadWeightRecords() : loadGlucoseRecords();
      return list.filter(function (entry) {
        return entry.id === id;
      })[0];
    }

    function deleteMeasure(kind, id) {
      if (kind === "bp") {
        saveList(STORAGE_BP, loadBloodPressure().filter(function (entry) {
          return entry.id !== id;
        }));
      } else if (kind === "weight") {
        saveList(STORAGE_WEIGHT, loadWeightRecords().filter(function (entry) {
          return entry.id !== id;
        }));
      } else {
        saveList(STORAGE_GLUCOSE, loadGlucoseRecords().filter(function (entry) {
          return entry.id !== id;
        }));
      }
    }

    importantScreen.addEventListener("click", function (event) {
      var dash = event.target.closest("[data-dash]");
      var hist = event.target.closest("[data-hist]");
      var chip = event.target.closest(".imp-chip");
      if (dash && importantScreen.contains(dash)) {
        var action = dash.getAttribute("data-dash");
        var kind = dash.getAttribute("data-kind");
        if (action === "add") {
          openMeasureForm(kind);
        } else if (action === "goals") {
          showGoalsView();
        } else if (action === "history") {
          historyKind = kind || "all";
          setChip("history-kind-row", "data-history-kind", historyKind);
          showHistoryView();
        } else if (action === "remind") {
          showMeasureRemind(kind);
        } else if (action === "remind-add") {
          showMeasureRemind("");
        } else if (action === "remind-done") {
          completeReminder(dash.getAttribute("data-id"), dash.getAttribute("data-date"), dash.getAttribute("data-time"));
          renderMeasureDashboard();
        } else if (action === "remind-edit") {
          var rem = loadList(STORAGE_REMINDERS).filter(function (entry) {
            return entry.id === dash.getAttribute("data-id");
          })[0];
          if (rem) {
            fillReminderForm(rem);
          }
        }
        return;
      }
      if (hist && importantScreen.contains(hist)) {
        var histKind = hist.getAttribute("data-kind");
        var histId = hist.getAttribute("data-id");
        var found = findMeasure(histKind, histId);
        if (hist.getAttribute("data-hist") === "edit" && found) {
          openMeasureForm(histKind, found);
        } else if (hist.getAttribute("data-hist") === "delete") {
          askDelete("Удалить эту запись?", function () {
            deleteMeasure(histKind, histId);
            renderMeasureHistory();
          });
        }
        return;
      }
      if (chip && chip.getAttribute("data-chart-kind")) {
        chartKind = chip.getAttribute("data-chart-kind");
        setChip("chart-kind-row", "data-chart-kind", chartKind);
        drawMeasureChart();
        return;
      }
      if (chip && chip.getAttribute("data-chart-glucose")) {
        chartGlucoseFilter = chip.getAttribute("data-chart-glucose");
        setChip("chart-glucose-filter-row", "data-chart-glucose", chartGlucoseFilter);
        drawMeasureChart();
        return;
      }
      if (chip && chip.getAttribute("data-chart-range")) {
        chartRange = chip.getAttribute("data-chart-range");
        setChip("chart-range-row", "data-chart-range", chartRange);
        drawMeasureChart();
        return;
      }
      if (chip && chip.getAttribute("data-history-kind")) {
        historyKind = chip.getAttribute("data-history-kind");
        setChip("history-kind-row", "data-history-kind", historyKind);
        renderMeasureHistory();
        return;
      }
      if (chip && chip.getAttribute("data-history-glucose")) {
        historyGlucoseFilter = chip.getAttribute("data-history-glucose");
        setChip("history-glucose-filter-row", "data-history-glucose", historyGlucoseFilter);
        renderMeasureHistory();
        return;
      }
      if (chip && chip.getAttribute("data-history-range")) {
        historyRange = chip.getAttribute("data-history-range");
        setChip("history-range-row", "data-history-range", historyRange);
        renderMeasureHistory();
      }
    });

    document.getElementById("open-measure-history").addEventListener("click", function () {
      historyKind = "all";
      setChip("history-kind-row", "data-history-kind", "all");
      showHistoryView();
    });
    document.getElementById("open-measure-goals").addEventListener("click", showGoalsView);
    document.getElementById("measure-goals-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var collected = collectGoalsFromForm();
      var err = document.getElementById("goals-error");
      if (collected.errors.length) {
        if (err) {
          err.textContent = collected.errors[0];
        }
        return;
      }
      saveGoals(collected.goals);
      notifyRoom("measurementGoalsConfigured");
      if (err) {
        err.textContent = "";
      }
      showMeasuresView();
    });
    document.getElementById("open-history-print").addEventListener("click", function () {
      currentView = "history-print";
      hideImpViews();
      impHistoryPrint.hidden = false;
      setImpBackLabel();
      renderHistoryPrint();
    });
    document.getElementById("chart-pulse").addEventListener("change", function () {
      chartPulse = !!document.getElementById("chart-pulse").checked;
      drawMeasureChart();
    });
    document.getElementById("measure-remind-repeat").addEventListener("change", syncRemindFields);
    document.getElementById("measure-remind-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var text = document.getElementById("measure-remind-text").value.trim();
      var repeat = document.getElementById("measure-remind-repeat").value;
      if (!text) {
        return;
      }
      var times = [];
      if (repeat === "once") {
        times = [document.getElementById("measure-remind-time").value];
      } else {
        times = [document.getElementById("measure-remind-time2").value, document.getElementById("measure-remind-time3").value].filter(Boolean);
      }
      if (!times.length) {
        return;
      }
      var weekdays = [];
      Array.prototype.forEach.call(document.querySelectorAll("#measure-remind-days input:checked"), function (box) {
        weekdays.push(Number(box.value));
      });
      if ((repeat === "weekdays" || repeat === "weekly") && !weekdays.length) {
        return;
      }
      if (repeat === "weekly" && weekdays.length > 1) {
        weekdays = [weekdays[0]];
      }
      var payload = {
        id: measureRemindEditId || newId("reminder-"),
        text: text,
        date: document.getElementById("measure-remind-date").value || todayDateValue(),
        time: times[0],
        times: times,
        repeat: repeat,
        done: false,
        createdAt: new Date().toISOString()
      };
      if (weekdays.length) {
        payload.weekdays = weekdays;
      }
      if (measureRemindType) {
        payload.type = "measurement";
        payload.measurementType = measureRemindType;
      }
      var list = loadList(STORAGE_REMINDERS);
      if (measureRemindEditId) {
        list = list.map(function (item) {
          if (item.id !== measureRemindEditId) {
            return item;
          }
          payload.createdAt = item.createdAt || payload.createdAt;
          payload.doneSlots = item.doneSlots || [];
          return payload;
        });
      } else {
        list.unshift(payload);
      }
      saveList(STORAGE_REMINDERS, list);
      scheduleReminderNotification(payload);
      measureRemindEditId = "";
      showMeasuresView();
    });

    impDialogCancel.addEventListener("click", closeImpDialog);
    impDialogOk.addEventListener("click", function () {
      var fn = pendingDelete;
      closeImpDialog();
      if (typeof fn === "function") {
        fn();
      }
    });
  }

  try {
    initImportantSection();
  } catch (error) {}

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
