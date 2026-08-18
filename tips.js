(function () {
  var STORAGE_SAVED = "vspominayka_saved_tips";
  var STORAGE_NOTES = "vspominayka_tip_notes";
  var STORAGE_USER = "vspominayka_user_tips";
  var PAGE_SIZE = 8;
  var CATEGORIES = [
    "Дом и уборка",
    "Стирка и одежда",
    "Кухонные хитрости",
    "Дача и огород",
    "Цветы и растения",
    "Хозяйке на заметку",
    "Бережливый дом",
    "Телефон без страха"
  ];

  var view = "hub";
  var listKind = "category";
  var listTitle = "";
  var listQuery = "";
  var listCategory = "";
  var shownCount = PAGE_SIZE;
  var detailId = "";
  var detailFrom = "hub";
  var noteTargetId = "";
  var editingUserId = "";
  var pendingDeleteUserId = "";
  var toastTimer = 0;

  function allTips() {
    return window.VSPOMINAYKA_TIPS || [];
  }

  function loadJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      var data = JSON.parse(raw);
      return data == null ? fallback : data;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function savedIds() {
    var data = loadJson(STORAGE_SAVED, []);
    return Array.isArray(data) ? data.filter(function (id) { return typeof id === "string"; }) : [];
  }

  function saveSavedIds(ids) {
    saveJson(STORAGE_SAVED, ids);
  }

  function notesMap() {
    var data = loadJson(STORAGE_NOTES, {});
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  }

  function saveNotes(map) {
    saveJson(STORAGE_NOTES, map);
  }

  function userTips() {
    var data = loadJson(STORAGE_USER, []);
    return Array.isArray(data) ? data.filter(function (item) {
      return item && typeof item.id === "string";
    }) : [];
  }

  function saveUserTips(items) {
    saveJson(STORAGE_USER, items);
  }

  function isSaved(id) {
    return savedIds().indexOf(id) !== -1;
  }

  function noteFor(id) {
    var note = notesMap()[id];
    return typeof note === "string" ? note : "";
  }

  function findTip(id) {
    var tips = allTips();
    for (var i = 0; i < tips.length; i++) {
      if (tips[i].id === id) {
        return tips[i];
      }
    }
    var own = userTips();
    for (var j = 0; j < own.length; j++) {
      if (own[j].id === id) {
        return own[j];
      }
    }
    return null;
  }

  function dayNumber() {
    var now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  }

  function tipOfDay() {
    var tips = allTips();
    if (!tips.length) {
      return null;
    }
    var idx = ((dayNumber() * 47) + 13) % tips.length;
    return tips[idx];
  }

  function recommendedTips() {
    var tips = allTips();
    var today = tipOfDay();
    var skip = today ? today.id : "";
    var picked = [];
    var i = 1;
    while (picked.length < 3 && i < tips.length + 3) {
      var idx = ((dayNumber() * 47) + 13 + (i * 19)) % tips.length;
      var tip = tips[idx];
      if (tip && tip.id !== skip) {
        var exists = false;
        for (var p = 0; p < picked.length; p++) {
          if (picked[p].id === tip.id) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          picked.push(tip);
        }
      }
      i += 1;
    }
    return picked;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortText(text) {
    var raw = String(text || "").trim();
    var dot = raw.indexOf(".");
    if (dot > 40 && dot < 160) {
      return raw.slice(0, dot + 1);
    }
    if (raw.length <= 160) {
      return raw;
    }
    return raw.slice(0, 157).replace(/\s+\S*$/, "") + "…";
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function matchesQuery(tip, query) {
    var q = normalize(query);
    if (!q) {
      return true;
    }
    if (normalize(tip.title).indexOf(q) !== -1) {
      return true;
    }
    if (normalize(tip.text).indexOf(q) !== -1) {
      return true;
    }
    var tags = tip.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (normalize(tags[i]).indexOf(q) !== -1) {
        return true;
      }
    }
    return false;
  }

  function hideAllPages() {
    Array.prototype.forEach.call(document.querySelectorAll(".page"), function (page) {
      page.hidden = true;
    });
  }

  function showToast(message) {
    var toast = document.getElementById("tips-toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 2600);
  }

  function setBackLabel(label) {
    var btn = document.getElementById("tips-back");
    if (btn) {
      btn.textContent = label;
    }
  }

  function showView(name) {
    view = name;
    var intro = document.getElementById("tips-intro");
    var browse = document.getElementById("tips-browse");
    var search = document.getElementById("tips-search-form");
    var list = document.getElementById("tips-list");
    var detail = document.getElementById("tips-detail");
    var notebook = document.getElementById("tips-notebook");
    var form = document.getElementById("tips-user-form");
    if (intro) intro.hidden = name !== "hub";
    if (browse) browse.hidden = name !== "hub";
    if (search) search.hidden = name !== "hub" && name !== "list";
    if (list) list.hidden = name !== "list";
    if (detail) detail.hidden = name !== "detail";
    if (notebook) notebook.hidden = name !== "notebook";
    if (form) form.hidden = name !== "form";
    if (name === "hub") setBackLabel("← На главную");
    if (name === "list") setBackLabel("← К полезным хитростям");
    if (name === "detail") setBackLabel("← Назад");
    if (name === "notebook") setBackLabel("← К полезным хитростям");
    if (name === "form") setBackLabel("← К тетрадке");
    if (name !== "list") {
      window.scrollTo(0, 0);
    }
  }

  function renderHomeToday() {
    var title = document.getElementById("tips-home-today-title");
    var tip = tipOfDay();
    if (title && tip) {
      title.textContent = tip.title;
    }
  }

  function renderDay() {
    var host = document.getElementById("tips-day");
    var tip = tipOfDay();
    if (!host || !tip) {
      return;
    }
    host.setAttribute("data-open-tip", tip.id);
    host.setAttribute("role", "button");
    host.setAttribute("tabindex", "0");
    host.innerHTML =
      "<p class=\"tips-kicker\">💡 Совет дня</p>" +
      "<h2>" + escapeHtml(tip.title) + "</h2>" +
      "<p>" + escapeHtml(shortText(tip.text)) + "</p>" +
      "<span class=\"card-action\">Посмотреть →</span>";
  }

  function renderCategories() {
    var host = document.getElementById("tips-cat-grid");
    if (!host) {
      return;
    }
    host.innerHTML = CATEGORIES.map(function (cat) {
      return "<button class=\"tips-cat-btn\" type=\"button\" data-category=\"" + escapeHtml(cat) + "\">" + escapeHtml(cat) + "</button>";
    }).join("");
  }

  function cardHtml(tip, options) {
    options = options || {};
    var saved = isSaved(tip.id);
    var note = noteFor(tip.id);
    var warning = tip.warning ? "<p class=\"tips-warning tips-warning-card\">" + escapeHtml(tip.warning) + "</p>" : "";
    var extra = "";
    if (options.showNote && note) {
      extra += "<p class=\"tips-note-preview\">Заметка: " + escapeHtml(note) + "</p>";
    }
    var ownBtns = "";
    if (options.userTip) {
      ownBtns =
        "<button class=\"hint-btn\" type=\"button\" data-edit-user=\"" + escapeHtml(tip.id) + "\">Изменить</button>" +
        "<button class=\"hint-btn\" type=\"button\" data-delete-user=\"" + escapeHtml(tip.id) + "\">Удалить</button>";
    }
    return (
      "<article class=\"tips-card\" data-open-tip=\"" + escapeHtml(tip.id) + "\">" +
        "<p class=\"tips-kicker\">" + escapeHtml(tip.category || "") + "</p>" +
        "<h3>" + escapeHtml(tip.title) + "</h3>" +
        "<p>" + escapeHtml(shortText(tip.text)) + "</p>" +
        warning +
        extra +
        "<div class=\"tips-card-actions\">" +
          (options.userTip ? "" : "<button class=\"hint-btn\" type=\"button\" data-save-tip=\"" + escapeHtml(tip.id) + "\">" + (saved ? "♡ В тетрадке" : "♡ Сохранить") + "</button>") +
          "<button class=\"hint-btn\" type=\"button\" data-note-tip=\"" + escapeHtml(tip.id) + "\">✎ Моя заметка</button>" +
          ownBtns +
        "</div>" +
      "</article>"
    );
  }

  function renderRecommended() {
    var host = document.getElementById("tips-recommended-list");
    if (!host) {
      return;
    }
    host.innerHTML = recommendedTips().map(function (tip) {
      return cardHtml(tip);
    }).join("");
  }

  function currentList() {
    var tips = allTips();
    if (listKind === "search") {
      return tips.filter(function (tip) {
        return matchesQuery(tip, listQuery);
      });
    }
    return tips.filter(function (tip) {
      return tip.category === listCategory;
    });
  }

  function renderList() {
    var cards = document.getElementById("tips-list-cards");
    var empty = document.getElementById("tips-list-empty");
    var more = document.getElementById("tips-show-more");
    var title = document.getElementById("tips-list-title");
    var note = document.getElementById("tips-list-note");
    if (!cards) {
      return;
    }
    if (title) {
      title.textContent = listTitle;
    }
    if (note) {
      note.textContent = listKind === "search"
        ? "Результаты по вашему запросу"
        : "Советы этой категории";
    }
    var items = currentList();
    if (!items.length) {
      cards.innerHTML = "";
      if (empty) empty.hidden = false;
      if (more) more.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    var slice = items.slice(0, shownCount);
    cards.innerHTML = slice.map(function (tip) {
      return cardHtml(tip);
    }).join("");
    if (more) {
      more.hidden = slice.length >= items.length;
    }
  }

  function renderDetail(id) {
    var tip = findTip(id);
    if (!tip) {
      return;
    }
    detailId = id;
    document.getElementById("tips-detail-cat").textContent = tip.category || "";
    document.getElementById("tips-detail-title").textContent = tip.title || "";
    document.getElementById("tips-detail-text").textContent = tip.text || "";
    var warn = document.getElementById("tips-detail-warning");
    if (tip.warning) {
      warn.hidden = false;
      warn.textContent = tip.warning;
    } else {
      warn.hidden = true;
      warn.textContent = "";
    }
    var noteBox = document.getElementById("tips-detail-note");
    var note = noteFor(id);
    if (note) {
      noteBox.hidden = false;
      noteBox.textContent = "Ваша заметка: " + note;
    } else {
      noteBox.hidden = true;
      noteBox.textContent = "";
    }
    var saveBtn = document.getElementById("tips-detail-save");
    if (String(id).indexOf("user_") === 0) {
      saveBtn.hidden = true;
    } else {
      saveBtn.hidden = false;
      saveBtn.textContent = isSaved(id) ? "♡ В тетрадке" : "♡ Сохранить";
    }
  }

  function renderNotebook() {
    var empty = document.getElementById("tips-notebook-empty");
    var savedHost = document.getElementById("tips-notebook-saved");
    var ownHost = document.getElementById("tips-notebook-own");
    var ids = savedIds();
    var savedTips = [];
    ids.forEach(function (id) {
      var tip = findTip(id);
      if (tip && String(id).indexOf("user_") !== 0) {
        savedTips.push(tip);
      }
    });
    var own = userTips();
    if (!savedTips.length && !own.length) {
      if (empty) empty.hidden = false;
      if (savedHost) savedHost.innerHTML = "";
      if (ownHost) ownHost.innerHTML = "";
      return;
    }
    if (empty) empty.hidden = true;
    if (savedHost) {
      savedHost.innerHTML = savedTips.length
        ? "<h2 class=\"tips-section-title\">Сохранённые советы</h2>" + savedTips.map(function (tip) {
          return cardHtml(tip, { showNote: true });
        }).join("")
        : "";
    }
    if (ownHost) {
      ownHost.innerHTML = own.length
        ? "<h2 class=\"tips-section-title\">Мои хитрости</h2>" + own.map(function (tip) {
          return cardHtml(tip, { showNote: true, userTip: true });
        }).join("")
        : "";
    }
  }

  function fillCategorySelect(selected) {
    var select = document.getElementById("tips-own-category");
    if (!select) {
      return;
    }
    select.innerHTML = CATEGORIES.map(function (cat) {
      return "<option value=\"" + escapeHtml(cat) + "\"" + (cat === selected ? " selected" : "") + ">" + escapeHtml(cat) + "</option>";
    }).join("");
  }

  function openHub() {
    renderDay();
    renderCategories();
    renderRecommended();
    var search = document.getElementById("tips-search-input");
    if (search) {
      search.value = "";
    }
    showView("hub");
    window.scrollTo(0, 0);
  }

  function openList(kind, title, extra) {
    var sameList = view === "list";
    listKind = kind;
    listTitle = title;
    listQuery = extra && extra.query ? extra.query : "";
    listCategory = extra && extra.category ? extra.category : "";
    if (!sameList || kind !== "search") {
      shownCount = PAGE_SIZE;
    }
    renderList();
    showView("list");
    if (!sameList) {
      window.scrollTo(0, 0);
    }
  }

  function openDetail(id, from) {
    detailFrom = from || view;
    renderDetail(id);
    showView("detail");
  }

  function openNotebook() {
    renderNotebook();
    showView("notebook");
  }

  function openUserForm(item) {
    editingUserId = item && item.id ? item.id : "";
    var title = document.getElementById("tips-user-form-title");
    var titleInput = document.getElementById("tips-own-title");
    var textInput = document.getElementById("tips-own-text");
    if (title) {
      title.textContent = editingUserId ? "Изменить запись" : "Своя хитрость";
    }
    fillCategorySelect(item && item.category ? item.category : CATEGORIES[0]);
    if (titleInput) titleInput.value = item && item.title ? item.title : "";
    if (textInput) textInput.value = item && item.text ? item.text : "";
    showView("form");
  }

  function toggleSave(id) {
    if (!id || String(id).indexOf("user_") === 0) {
      return;
    }
    var ids = savedIds();
    var index = ids.indexOf(id);
    if (index === -1) {
      ids.push(id);
      saveSavedIds(ids);
      showToast("Сохранено в вашу тетрадку ♡");
    } else {
      ids.splice(index, 1);
      saveSavedIds(ids);
      showToast("Убрано из тетрадки");
    }
    if (view === "detail") renderDetail(id);
    if (view === "list") renderList();
    if (view === "hub") renderRecommended();
    if (view === "notebook") renderNotebook();
    renderDay();
  }

  function openNoteDialog(id) {
    noteTargetId = id;
    var dialog = document.getElementById("tips-note-dialog");
    var input = document.getElementById("tips-note-input");
    var del = document.getElementById("tips-note-delete");
    var existing = noteFor(id);
    if (input) input.value = existing;
    if (del) del.hidden = !existing;
    if (dialog) dialog.hidden = false;
    if (input) input.focus();
  }

  function closeNoteDialog() {
    var dialog = document.getElementById("tips-note-dialog");
    if (dialog) dialog.hidden = true;
    noteTargetId = "";
  }

  function saveNote() {
    if (!noteTargetId) {
      return;
    }
    var input = document.getElementById("tips-note-input");
    var text = input ? String(input.value || "").trim() : "";
    var map = notesMap();
    if (text) {
      map[noteTargetId] = text;
    } else {
      delete map[noteTargetId];
    }
    saveNotes(map);
    closeNoteDialog();
    if (view === "detail") renderDetail(detailId);
    if (view === "notebook") renderNotebook();
    if (view === "list") renderList();
    showToast(text ? "Заметка сохранена" : "Заметка удалена");
  }

  function deleteNote() {
    if (!noteTargetId) {
      return;
    }
    var map = notesMap();
    delete map[noteTargetId];
    saveNotes(map);
    closeNoteDialog();
    if (view === "detail") renderDetail(detailId);
    if (view === "notebook") renderNotebook();
    if (view === "list") renderList();
    showToast("Заметка удалена");
  }

  function openDeleteDialog(id) {
    pendingDeleteUserId = id;
    var dialog = document.getElementById("tips-delete-dialog");
    if (dialog) dialog.hidden = false;
  }

  function closeDeleteDialog() {
    pendingDeleteUserId = "";
    var dialog = document.getElementById("tips-delete-dialog");
    if (dialog) dialog.hidden = true;
  }

  function confirmDeleteUser() {
    var id = pendingDeleteUserId;
    closeDeleteDialog();
    if (!id) {
      return;
    }
    saveUserTips(userTips().filter(function (item) {
      return item.id !== id;
    }));
    var map = notesMap();
    if (map[id]) {
      delete map[id];
      saveNotes(map);
    }
    if (view === "detail") {
      openNotebook();
    } else {
      renderNotebook();
    }
    showToast("Запись удалена");
  }

  function handleCardClick(event) {
    var deleteUser = event.target.closest("[data-delete-user]");
    if (deleteUser) {
      event.preventDefault();
      event.stopPropagation();
      openDeleteDialog(deleteUser.getAttribute("data-delete-user"));
      return;
    }
    var editUser = event.target.closest("[data-edit-user]");
    if (editUser) {
      event.preventDefault();
      event.stopPropagation();
      var item = findTip(editUser.getAttribute("data-edit-user"));
      if (item) openUserForm(item);
      return;
    }
    var saveBtn = event.target.closest("[data-save-tip]");
    if (saveBtn) {
      event.preventDefault();
      event.stopPropagation();
      toggleSave(saveBtn.getAttribute("data-save-tip"));
      return;
    }
    var noteBtn = event.target.closest("[data-note-tip]");
    if (noteBtn) {
      event.preventDefault();
      event.stopPropagation();
      openNoteDialog(noteBtn.getAttribute("data-note-tip"));
      return;
    }
    var openBtn = event.target.closest("[data-open-tip]");
    if (openBtn) {
      openDetail(openBtn.getAttribute("data-open-tip"), view);
    }
  }

  function bindUi() {
    var screen = document.getElementById("screen-tips");
    if (!screen) {
      return;
    }

    var searchForm = document.getElementById("tips-search-form");
    var searchInput = document.getElementById("tips-search-input");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var query = searchInput ? searchInput.value : "";
        if (normalize(query)) {
          openList("search", "Поиск", { query: query });
        }
      });
    }
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var query = searchInput.value;
        if (normalize(query)) {
          openList("search", "Поиск", { query: query });
        } else if (view === "list" && listKind === "search") {
          openHub();
        }
      });
    }

    var catGrid = document.getElementById("tips-cat-grid");
    if (catGrid) {
      catGrid.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-category]");
        if (!btn) {
          return;
        }
        openList("category", btn.getAttribute("data-category"), {
          category: btn.getAttribute("data-category")
        });
        var searchInput = document.getElementById("tips-search-input");
        if (searchInput) {
          searchInput.value = "";
        };
      });
    }

    ["tips-day", "tips-recommended-list", "tips-list-cards", "tips-notebook-saved", "tips-notebook-own"].forEach(function (id) {
      var host = document.getElementById(id);
      if (host) {
        host.addEventListener("click", handleCardClick);
      }
    });

    var more = document.getElementById("tips-show-more");
    if (more) {
      more.addEventListener("click", function () {
        shownCount += PAGE_SIZE;
        renderList();
      });
    }

    var notebookBtn = document.getElementById("tips-open-notebook");
    if (notebookBtn) {
      notebookBtn.addEventListener("click", openNotebook);
    }

    var writeOwn = document.getElementById("tips-write-own");
    if (writeOwn) {
      writeOwn.addEventListener("click", function () {
        openUserForm(null);
      });
    }

    var detailSave = document.getElementById("tips-detail-save");
    if (detailSave) {
      detailSave.addEventListener("click", function () {
        toggleSave(detailId);
      });
    }
    var detailNote = document.getElementById("tips-detail-note-btn");
    if (detailNote) {
      detailNote.addEventListener("click", function () {
        openNoteDialog(detailId);
      });
    }

    var ownForm = document.getElementById("tips-own-form");
    if (ownForm) {
      ownForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var title = document.getElementById("tips-own-title");
        var category = document.getElementById("tips-own-category");
        var text = document.getElementById("tips-own-text");
        var item = {
          id: editingUserId || ("user_" + Date.now()),
          title: title ? String(title.value || "").trim() : "",
          category: category ? category.value : CATEGORIES[0],
          text: text ? String(text.value || "").trim() : "",
          tags: []
        };
        if (!item.title || !item.text) {
          return;
        }
        var items = userTips();
        var found = false;
        items = items.map(function (row) {
          if (row.id === item.id) {
            found = true;
            return item;
          }
          return row;
        });
        if (!found) {
          items.push(item);
        }
        saveUserTips(items);
        showToast("Записано. Теперь не потеряется.");
        openNotebook();
      });
    }

    document.getElementById("tips-note-save").addEventListener("click", saveNote);
    document.getElementById("tips-note-delete").addEventListener("click", deleteNote);
    document.getElementById("tips-note-cancel").addEventListener("click", closeNoteDialog);
    document.getElementById("tips-delete-cancel").addEventListener("click", closeDeleteDialog);
    document.getElementById("tips-delete-ok").addEventListener("click", confirmDeleteUser);

    var noteDialog = document.getElementById("tips-note-dialog");
    if (noteDialog) {
      noteDialog.addEventListener("click", function (event) {
        if (event.target === noteDialog) closeNoteDialog();
      });
    }
    var deleteDialog = document.getElementById("tips-delete-dialog");
    if (deleteDialog) {
      deleteDialog.addEventListener("click", function (event) {
        if (event.target === deleteDialog) closeDeleteDialog();
      });
    }
  }

  function showTips() {
    hideAllPages();
    var screen = document.getElementById("screen-tips");
    if (screen) {
      screen.hidden = false;
    }
    openHub();
  }

  function showNotebookFromHome() {
    hideAllPages();
    var screen = document.getElementById("screen-tips");
    if (screen) {
      screen.hidden = false;
    }
    openNotebook();
    window.scrollTo(0, 0);
  }

  function goBack() {
    closeNoteDialog();
    closeDeleteDialog();
    if (view === "detail") {
      if (detailFrom === "notebook") {
        openNotebook();
      } else if (detailFrom === "list") {
        renderList();
        showView("list");
      } else {
        openHub();
      }
      return true;
    }
    if (view === "form") {
      openNotebook();
      return true;
    }
    if (view === "list" || view === "notebook") {
      openHub();
      return true;
    }
    return false;
  }

  window.VspominaykaTips = {
    show: showTips,
    showNotebook: showNotebookFromHome,
    back: goBack,
    tipOfDay: tipOfDay
  };

  bindUi();
  renderHomeToday();
})();
