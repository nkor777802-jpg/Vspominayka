(function () {
  var STORAGE_ROOM = "vspominayka_room";
  var STORAGE_ACTIVITY = "vspominayka_activity";
  var RECIPE_KEY = "vspominaykaRecipes";
  var BP_KEY = "vspominayka_blood_pressure";
  var WEIGHT_KEY = "vspominayka_weight";
  var GLUCOSE_KEY = "vspominayka_glucose";
  var GOALS_KEY = "vspominayka_measure_goals";
  var MAX_EVENTS = 400;

  var ROOM_BASE = "assets/images/room/room-base.png";

  // Furniture slots: left/top are the contact point (bottom-center of the item).
  // top = surface the object stands on, as % of the scene.
  var ROOM_SLOTS = {
    shelfTop: { left: "16.4%", top: "35.15%" },
    shelfMid: { left: "22.4%", top: "46.45%" },
    shelfLow: { left: "19.2%", top: "58.55%" },
    sideTableL: { left: "40.2%", top: "50.45%" },
    sideTableR: { left: "46.0%", top: "50.45%" },
    deskYarn: { left: "17.5%", top: "85.8%" },
    deskLetter: { left: "36.5%", top: "88.6%" },
    deskJam: { left: "53.2%", top: "86.6%" },
    deskCup: { left: "65.6%", top: "89.6%" },
    deskClock: { left: "80.4%", top: "87.3%" }
  };

  function slotPlacement(slotName, extra) {
    var slot = ROOM_SLOTS[slotName] || {};
    var out = {
      slot: slotName,
      left: slot.left,
      top: slot.top
    };
    var key;
    extra = extra || {};
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        out[key] = extra[key];
      }
    }
    return out;
  }

  var ROOM_ITEMS = [
    {
      id: "vase-daisies",
      title: "Букет ромашек",
      description: "Первая завершённая игра оставила в комнате цветы.",
      how: "За первую завершённую игру",
      condition: "firstGame",
      image: "assets/images/room/daisies.png",
      placement: slotPlacement("sideTableL", { width: "5.8%", z: 8, pad: 1.2 })
    },
    {
      id: "framed-photo",
      title: "Семейная фотография",
      description: "Собранная картинка нашла место на полке.",
      how: "За собранную картинку",
      condition: "firstPuzzle",
      image: "assets/images/room/family-photo.png",
      placement: slotPlacement("shelfLow", { width: "6.2%", z: 6, pad: 3.4 })
    },
    {
      id: "radio",
      title: "Радио",
      description: "В комнате появились знакомые голоса и фразы.",
      how: "За верные ответы в викторинах",
      condition: "fiveCorrectQuiz",
      image: "assets/images/room/radio.png",
      placement: slotPlacement("shelfMid", { width: "7.8%", z: 6, pad: 2.0 })
    },
    {
      id: "book",
      title: "Книги",
      description: "Народная мудрость легла на полку.",
      how: "За народную мудрость",
      condition: "tenProverbTasks",
      image: "assets/images/room/books.png",
      placement: slotPlacement("shelfTop", { width: "7.2%", z: 6, pad: 2.0 })
    },
    {
      id: "cup",
      title: "Чашка",
      description: "В комнате всё чаще бывает тепло и спокойно.",
      how: "За три дня с занятиями",
      condition: "threeActiveDays",
      image: "assets/images/room/cup.png",
      placement: slotPlacement("deskCup", { width: "5.8%", z: 24, pad: 2.8 })
    },
    {
      id: "jam",
      title: "Баночка варенья",
      description: "Домашний рецепт пришёл в комнату.",
      how: "За первый сохранённый рецепт",
      condition: "firstRecipe",
      image: "assets/images/room/jam.png",
      placement: slotPlacement("deskJam", { width: "4.8%", z: 22, pad: 0 })
    },
    {
      id: "letter",
      title: "Письмо",
      description: "Первое воспоминание пришло в комнату.",
      how: "За первое воспоминание",
      condition: "firstMemory",
      image: "assets/images/room/letter.png",
      placement: slotPlacement("deskLetter", { width: "8.4%", z: 23, pad: 0.4 })
    },
    {
      id: "yarn-basket",
      title: "Корзина с пряжей",
      description: "Воспоминаний стало больше — и в комнате уютнее.",
      how: "За пять воспоминаний",
      condition: "fiveMemories",
      image: "assets/images/room/yarn.png",
      placement: slotPlacement("deskYarn", { width: "8.8%", z: 21, pad: 5.2 })
    },
    {
      id: "sunflowers",
      title: "Подсолнухи",
      description: "Игры наполнили комнату светом.",
      how: "За десять игр",
      condition: "tenGames",
      image: "assets/images/room/sunflowers.png",
      placement: slotPlacement("sideTableR", { width: "5.9%", z: 7, pad: 4.6 })
    },
    {
      id: "wall-clock",
      title: "Часы",
      description: "Время, проведённое за играми, осталось здесь.",
      how: "За 25 игр",
      condition: "twentyFiveGames",
      image: "assets/images/room/clock.png",
      placement: slotPlacement("deskClock", { width: "5.1%", z: 23, pad: 9.4 })
    }
  ];

  function todayKey() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      var data = JSON.parse(raw);
      return data == null ? fallback : data;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function emptyRoomState() {
    return { introShown: false, items: {}, pendingNotify: [] };
  }

  function emptyActivity() {
    return { events: [], sections: {} };
  }

  function loadRoomState() {
    var data = readJson(STORAGE_ROOM, null);
    if (!data || typeof data !== "object") {
      return emptyRoomState();
    }
    return {
      introShown: !!data.introShown,
      items: data.items && typeof data.items === "object" ? data.items : {},
      pendingNotify: Array.isArray(data.pendingNotify) ? data.pendingNotify : []
    };
  }

  function saveRoomState(state) {
    writeJson(STORAGE_ROOM, state);
  }

  function loadActivity() {
    var data = readJson(STORAGE_ACTIVITY, null);
    if (!data || typeof data !== "object") {
      return emptyActivity();
    }
    return {
      events: Array.isArray(data.events) ? data.events : [],
      sections: data.sections && typeof data.sections === "object" ? data.sections : {}
    };
  }

  function saveActivity(activity) {
    writeJson(STORAGE_ACTIVITY, activity);
  }

  function itemById(id) {
    var i;
    for (i = 0; i < ROOM_ITEMS.length; i += 1) {
      if (ROOM_ITEMS[i].id === id) {
        return ROOM_ITEMS[i];
      }
    }
    return null;
  }

  function isRoomPreview() {
    try {
      return /(?:^|[?&])roomPreview=1(?:&|$)/.test(window.location.search || "");
    } catch (error) {
      return false;
    }
  }

  function applyPlacement(node, placement) {
    var p = placement || {};
    var pad = typeof p.pad === "number" ? p.pad : 0;
    node.style.left = p.left || "0%";
    node.style.top = p.top || "0%";
    node.style.right = "auto";
    node.style.bottom = "auto";
    node.style.width = p.width || "10%";
    node.style.zIndex = String(p.z || 1);
    node.style.transform = "translate(-50%, " + (-100 + pad) + "%)";
  }

  function renderRoom() {
    var scene = document.getElementById("room-scene");
    var hint = document.getElementById("room-more-hint");
    if (!scene) {
      return;
    }
    var state = loadRoomState();
    scene.innerHTML = "";
    var base = document.createElement("img");
    base.className = "room-base-img";
    base.src = ROOM_BASE;
    base.alt = "";
    base.setAttribute("aria-hidden", "true");
    base.draggable = false;
    scene.appendChild(base);
    var preview = isRoomPreview();
    var lockedLeft = false;
    ROOM_ITEMS.forEach(function (def) {
      var item = ensureItemState(state, def);
      if (!item.unlocked && !preview) {
        lockedLeft = true;
        return;
      }
      var node = document.createElement("button");
      node.type = "button";
      node.className = "room-item";
      if (!preview && !item.seen) {
        node.classList.add("is-new");
      }
      node.setAttribute("data-item", def.id);
      node.setAttribute("aria-label", def.title);
      applyPlacement(node, def.placement);
      var img = document.createElement("img");
      img.src = def.image;
      img.alt = "";
      img.draggable = false;
      node.appendChild(img);
      node.addEventListener("click", function () {
        if (preview) {
          openItemCard(def.id);
          return;
        }
        markSeen(def.id);
        openItemCard(def.id);
      });
      scene.appendChild(node);
    });
    if (!preview) {
      saveRoomState(state);
    }
    if (hint) {
      hint.hidden = preview || !lockedLeft;
    }
    renderRewardsList();
    window.setTimeout(function () {
      markVisibleNewSeen();
    }, 1600);
  }

  function countType(events, type, extraKey, extraValue) {
    var n = 0;
    var i;
    for (i = 0; i < events.length; i += 1) {
      if (events[i].type !== type) {
        continue;
      }
      if (extraKey && events[i][extraKey] !== extraValue) {
        continue;
      }
      n += 1;
    }
    return n;
  }

  function uniqueEventDays(events, types) {
    var days = {};
    var i;
    for (i = 0; i < events.length; i += 1) {
      if (types && types.indexOf(events[i].type) === -1) {
        continue;
      }
      if (events[i].day) {
        days[events[i].day] = true;
      }
    }
    return days;
  }

  function readList(key) {
    var data = readJson(key, []);
    return Array.isArray(data) ? data : [];
  }

  function measureDays() {
    var days = {};
    function add(list) {
      list.forEach(function (item) {
        if (item && item.date) {
          days[String(item.date)] = true;
        }
      });
    }
    add(readList(BP_KEY));
    add(readList(WEIGHT_KEY));
    add(readList(GLUCOSE_KEY));
    return days;
  }

  function hasAnyGoal() {
    var goals = readJson(GOALS_KEY, null);
    if (!goals || typeof goals !== "object") {
      return false;
    }
    function pair(obj) {
      return obj && obj.min != null && obj.max != null && isFinite(Number(obj.min)) && isFinite(Number(obj.max));
    }
    var bp = goals.bp || {};
    if (bp.sysMin != null && bp.sysMax != null) {
      return true;
    }
    if (bp.diaMin != null && bp.diaMax != null) {
      return true;
    }
    if (bp.pulseMin != null && bp.pulseMax != null) {
      return true;
    }
    if (pair(goals.weight)) {
      return true;
    }
    var glucose = goals.glucose || {};
    var key;
    for (key in glucose) {
      if (Object.prototype.hasOwnProperty.call(glucose, key) && pair(glucose[key])) {
        return true;
      }
    }
    return false;
  }

  function isoWeekKey(dayStr) {
    var parts = String(dayStr || "").split("-");
    if (parts.length !== 3) {
      return "";
    }
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0, 0);
    var day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day + 3);
    var first = new Date(date.getFullYear(), 0, 4);
    var week = 1 + Math.round((date - first) / 86400000 / 7);
    return date.getFullYear() + "-W" + String(week);
  }

  function collectStats() {
    var activity = loadActivity();
    var events = activity.events;
    var activeTypes = [
      "gameCompleted",
      "puzzleCompleted",
      "correctAnswer",
      "proverbTask",
      "recipeSaved",
      "memorySaved",
      "measurementSaved"
    ];
    var eventDays = uniqueEventDays(events, activeTypes);
    var mDays = measureDays();
    var day;
    for (day in mDays) {
      if (Object.prototype.hasOwnProperty.call(mDays, day)) {
        eventDays[day] = true;
      }
    }
    readList(RECIPE_KEY).forEach(function (item) {
      var created = String(item.createdAt || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(created)) {
        eventDays[created] = true;
      }
    });
    var dayList = Object.keys(eventDays);
    var weekBuckets = {};
    dayList.forEach(function (key) {
      var week = isoWeekKey(key);
      if (!week) {
        return;
      }
      if (!weekBuckets[week]) {
        weekBuckets[week] = {};
      }
      weekBuckets[week][key] = true;
    });
    var maxWeekDays = 0;
    var week;
    for (week in weekBuckets) {
      if (Object.prototype.hasOwnProperty.call(weekBuckets, week)) {
        maxWeekDays = Math.max(maxWeekDays, Object.keys(weekBuckets[week]).length);
      }
    }
    var measureDayCount = Object.keys(mDays).length;
    return {
      games: countType(events, "gameCompleted"),
      puzzles: countType(events, "puzzleCompleted"),
      quizCorrect: countType(events, "correctAnswer", "source", "ussr") + countType(events, "correctAnswer", "source", "phrase"),
      proverbTasks: countType(events, "proverbTask"),
      memories: countType(events, "memorySaved"),
      recipes: readList(RECIPE_KEY).length,
      sections: Object.keys(activity.sections).length,
      activeDays: dayList.length,
      maxWeekDays: maxWeekDays,
      measureDays: measureDayCount,
      hasGoals: hasAnyGoal(),
      hasBp: readList(BP_KEY).length > 0,
      hasWeight: readList(WEIGHT_KEY).length > 0,
      hasGlucose: readList(GLUCOSE_KEY).length > 0
    };
  }

  function conditionMet(id, stats) {
    if (id === "always") {
      return true;
    }
    if (id === "firstGame") {
      return stats.games >= 1;
    }
    if (id === "firstPuzzle") {
      return stats.puzzles >= 1;
    }
    if (id === "fiveCorrectQuiz") {
      return stats.quizCorrect >= 5;
    }
    if (id === "tenProverbTasks") {
      return stats.proverbTasks >= 10;
    }
    if (id === "threeActiveDays") {
      return stats.activeDays >= 3;
    }
    if (id === "firstRecipe") {
      return stats.recipes >= 1;
    }
    if (id === "firstMemory") {
      return stats.memories >= 1;
    }
    if (id === "fiveMemories") {
      return stats.memories >= 5;
    }
    if (id === "tenGames") {
      return stats.games >= 10;
    }
    if (id === "fiveDaysInWeek") {
      return stats.maxWeekDays >= 5;
    }
    if (id === "twentyFiveGames") {
      return stats.games >= 25;
    }
    if (id === "fiveSections") {
      return stats.sections >= 5;
    }
    if (id === "goalsConfigured") {
      return stats.hasGoals;
    }
    if (id === "allMeasureKinds") {
      return stats.hasBp && stats.hasWeight && stats.hasGlucose;
    }
    return false;
  }

  function ensureItemState(state, def) {
    if (!state.items[def.id]) {
      state.items[def.id] = {
        unlocked: false,
        unlockedAt: "",
        notificationShown: false,
        seen: false
      };
    }
    return state.items[def.id];
  }

  var notifyTimer = 0;
  var notifyQueue = [];

  function evaluate(options) {
    options = options || {};
    var silent = !!options.silent;
    var stats = collectStats();
    var state = loadRoomState();
    var nowIso = new Date().toISOString();
    var newly = [];
    ROOM_ITEMS.forEach(function (def) {
      var item = ensureItemState(state, def);
      var ok = conditionMet(def.condition, stats);
      if (ok && !item.unlocked) {
        item.unlocked = true;
        item.unlockedAt = nowIso;
        item.seen = silent;
        item.notificationShown = silent;
        if (!silent) {
          newly.push(def.id);
        }
      }
    });
    if (newly.length) {
      state.pendingNotify = (state.pendingNotify || []).concat(newly);
    }
    saveRoomState(state);
    if (!silent) {
      flushNotify();
    }
    refreshHomeCard();
    if (isRoomOpen()) {
      renderRoom();
    }
    return newly;
  }

  function formatUnlockDate(iso) {
    if (!iso) {
      return "";
    }
    var date = new Date(iso);
    if (isNaN(date.getTime())) {
      return "";
    }
    var months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
  }

  function isRoomOpen() {
    var screen = document.getElementById("screen-room");
    return !!(screen && !screen.hidden);
  }

  function hideAllPages() {
    Array.prototype.forEach.call(document.querySelectorAll(".page"), function (page) {
      page.hidden = true;
    });
  }

  function unlockedCount(state) {
    var n = 0;
    ROOM_ITEMS.forEach(function (def) {
      var item = state.items[def.id];
      if (item && item.unlocked) {
        n += 1;
      }
    });
    return n;
  }

  function refreshHomeCard() {
    var note = document.getElementById("room-home-note");
    if (!note) {
      return;
    }
    var state = loadRoomState();
    note.textContent = unlockedCount(state) > 0
      ? "В комнате становится всё уютнее."
      : "Здесь скоро появится что-то ваше.";
  }

  function renderRewardsList() {
    var host = document.getElementById("room-rewards-list");
    var summary = document.getElementById("room-rewards-summary");
    if (!host) {
      return;
    }
    var state = loadRoomState();
    var opened = unlockedCount(state);
    if (summary) {
      summary.textContent = "Открыто " + opened + " из " + ROOM_ITEMS.length;
    }
    host.innerHTML = "";
    ROOM_ITEMS.forEach(function (def) {
      var item = ensureItemState(state, def);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "room-trophy" + (item.unlocked ? "" : " is-locked");
      card.setAttribute("aria-label", item.unlocked ? def.title : "Награда ещё не открыта");
      var frame = document.createElement("span");
      frame.className = "room-trophy-frame";
      var img = document.createElement("img");
      img.src = def.image;
      img.alt = "";
      img.draggable = false;
      frame.appendChild(img);
      if (!item.unlocked) {
        var lock = document.createElement("span");
        lock.className = "room-trophy-lock";
        lock.setAttribute("aria-hidden", "true");
        frame.appendChild(lock);
      }
      card.appendChild(frame);
      var name = document.createElement("span");
      name.className = "room-trophy-name";
      name.textContent = item.unlocked ? def.title : "Ещё не открыто";
      card.appendChild(name);
      var how = document.createElement("span");
      how.className = "room-trophy-how";
      how.textContent = item.unlocked ? (def.how || def.description) : "";
      card.appendChild(how);
      if (item.unlocked) {
        card.addEventListener("click", function () {
          closeRewards();
          openItemCard(def.id);
        });
      } else {
        card.disabled = true;
      }
      host.appendChild(card);
    });
    saveRoomState(state);
  }

  function openRewards() {
    renderRewardsList();
    var dialog = document.getElementById("room-rewards-dialog");
    if (dialog) {
      dialog.hidden = false;
    }
  }

  function closeRewards() {
    var dialog = document.getElementById("room-rewards-dialog");
    if (dialog) {
      dialog.hidden = true;
    }
  }

  function markSeen(id) {
    var state = loadRoomState();
    if (state.items[id]) {
      state.items[id].seen = true;
      saveRoomState(state);
    }
  }

  function markVisibleNewSeen() {
    var state = loadRoomState();
    var changed = false;
    Array.prototype.forEach.call(document.querySelectorAll(".room-item.is-new"), function (node) {
      var id = node.getAttribute("data-item");
      if (state.items[id] && !state.items[id].seen) {
        state.items[id].seen = true;
        changed = true;
      }
      node.classList.remove("is-new");
    });
    if (changed) {
      saveRoomState(state);
    }
  }

  function openItemCard(id) {
    var def = itemById(id);
    var state = loadRoomState();
    var item = state.items[id];
    var dialog = document.getElementById("room-item-dialog");
    if (!def || !item || !dialog) {
      return;
    }
    document.getElementById("room-item-title").textContent = def.title;
    document.getElementById("room-item-text").textContent = def.description;
    var dateEl = document.getElementById("room-item-date");
    var dateText = formatUnlockDate(item.unlockedAt);
    var howText = def.how ? def.how + (dateText ? " · " + dateText : "") : (dateText ? "Появилось: " + dateText : "");
    dateEl.textContent = howText;
    dateEl.hidden = !howText;
    var variantsEl = document.getElementById("room-item-variants");
    if (variantsEl) {
      variantsEl.innerHTML = "";
    }
    dialog.hidden = false;
  }

  function closeItemCard() {
    var dialog = document.getElementById("room-item-dialog");
    if (dialog) {
      dialog.hidden = true;
    }
  }

  function showIntroIfNeeded() {
    var state = loadRoomState();
    var intro = document.getElementById("room-intro-dialog");
    if (!intro || state.introShown) {
      return;
    }
    intro.hidden = false;
  }

  function closeIntro() {
    var state = loadRoomState();
    state.introShown = true;
    saveRoomState(state);
    var intro = document.getElementById("room-intro-dialog");
    if (intro) {
      intro.hidden = true;
    }
  }

  function flushNotify() {
    var state = loadRoomState();
    if (!state.pendingNotify.length) {
      return;
    }
    var dialog = document.getElementById("room-notify-dialog");
    if (dialog && !dialog.hidden) {
      return;
    }
    var id = state.pendingNotify[0];
    var def = itemById(id);
    if (!def) {
      state.pendingNotify.shift();
      saveRoomState(state);
      flushNotify();
      return;
    }
    document.getElementById("room-notify-title").textContent = "В вашей комнате появилось кое-что новое…";
    document.getElementById("room-notify-name").textContent = def.title;
    document.getElementById("room-notify-text").textContent = def.description;
    dialog.hidden = false;
  }

  function consumeNotify(goToRoom) {
    var state = loadRoomState();
    var id = state.pendingNotify.shift();
    if (id && state.items[id]) {
      state.items[id].notificationShown = true;
    }
    saveRoomState(state);
    var dialog = document.getElementById("room-notify-dialog");
    if (dialog) {
      dialog.hidden = true;
    }
    if (goToRoom) {
      showRoom();
      return;
    }
    window.clearTimeout(notifyTimer);
    notifyTimer = window.setTimeout(flushNotify, 280);
  }

  function showRoom() {
    hideAllPages();
    var screen = document.getElementById("screen-room");
    if (screen) {
      screen.hidden = false;
    }
    renderRoom();
    showIntroIfNeeded();
    window.scrollTo(0, 0);
  }

  function record(type, detail) {
    detail = detail || {};
    var activity = loadActivity();
    if (type === "sectionVisited" && detail.section) {
      if (!activity.sections[detail.section]) {
        activity.sections[detail.section] = todayKey();
        saveActivity(activity);
        evaluate();
      }
      return;
    }
    activity.events.push({
      type: type,
      day: todayKey(),
      at: new Date().toISOString(),
      game: detail.game || "",
      source: detail.source || ""
    });
    if (activity.events.length > MAX_EVENTS) {
      activity.events = activity.events.slice(-MAX_EVENTS);
    }
    saveActivity(activity);
    evaluate();
  }

  function bindUi() {
    var look = document.getElementById("room-notify-look");
    var cont = document.getElementById("room-notify-continue");
    var introOk = document.getElementById("room-intro-ok");
    var itemClose = document.getElementById("room-item-close");
    var itemDialog = document.getElementById("room-item-dialog");
    var rewardsOpen = document.getElementById("room-rewards-open");
    var rewardsClose = document.getElementById("room-rewards-close");
    var rewardsDialog = document.getElementById("room-rewards-dialog");
    if (look) {
      look.addEventListener("click", function () {
        consumeNotify(true);
      });
    }
    if (cont) {
      cont.addEventListener("click", function () {
        consumeNotify(false);
      });
    }
    if (introOk) {
      introOk.addEventListener("click", closeIntro);
    }
    if (itemClose) {
      itemClose.addEventListener("click", closeItemCard);
    }
    if (itemDialog) {
      itemDialog.addEventListener("click", function (event) {
        if (event.target === itemDialog) {
          closeItemCard();
        }
      });
    }
    if (rewardsOpen) {
      rewardsOpen.addEventListener("click", openRewards);
    }
    if (rewardsClose) {
      rewardsClose.addEventListener("click", closeRewards);
    }
    if (rewardsDialog) {
      rewardsDialog.addEventListener("click", function (event) {
        if (event.target === rewardsDialog) {
          closeRewards();
        }
      });
    }
  }

  window.VspominaykaRoom = {
    items: ROOM_ITEMS,
    record: record,
    evaluate: evaluate,
    show: showRoom,
    refreshHomeCard: refreshHomeCard
  };

  bindUi();
  evaluate({ silent: true });
  refreshHomeCard();
  flushNotify();
})();
