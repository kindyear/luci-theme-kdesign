(function () {
  'use strict';

  var STORAGE_KEY = 'kdesign-appearance';
  var MODES = ['system', 'light', 'dark'];
  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function storedMode() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return MODES.indexOf(value) !== -1 ? value : 'system';
    } catch (error) {
      return 'system';
    }
  }

  function resolvedMode(mode) {
    return mode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : mode;
  }

  function applyMode(mode) {
    var root = document.documentElement;
    root.dataset.themePreference = mode;
    root.dataset.theme = resolvedMode(mode);
    root.style.colorScheme = resolvedMode(mode);
  }

  function saveMode(mode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      // Visual preference storage may be unavailable in private contexts.
    }
    applyMode(mode);
  }

  applyMode(storedMode());

  function initAppearance() {
    var button = document.querySelector('[data-kdesign-appearance]');
    if (!button)
      return;

    var icon = button.querySelector('img');
    var label = button.querySelector('[data-kdesign-appearance-label]');
    var media = document.body.dataset.media || '/luci-static/kdesign';

    function updateButton() {
      var mode = document.documentElement.dataset.themePreference || 'system';
      var key = 'label' + mode.charAt(0).toUpperCase() + mode.slice(1);
      var translated = button.dataset[key] || mode;
      button.setAttribute('aria-label', translated);
      button.title = translated;
      if (label)
        label.textContent = translated;
      if (icon)
        icon.src = media + '/icons/' + (mode === 'system' ? 'monitor' : mode === 'dark' ? 'moon' : 'sun') + '.svg';
    }

    button.addEventListener('click', function () {
      var current = document.documentElement.dataset.themePreference || 'system';
      saveMode(MODES[(MODES.indexOf(current) + 1) % MODES.length]);
      updateButton();
    });
    mediaQuery.addEventListener('change', function () {
      if (document.documentElement.dataset.themePreference === 'system')
        applyMode('system');
    });
    updateButton();
  }

  function initSidebar() {
    var toggle = document.querySelector('[data-kdesign-menu-toggle]');
    var overlay = document.querySelector('[data-kdesign-sidebar-overlay]');
    var sidebar = document.querySelector('.kdesign-sidebar');
    if (!toggle || !overlay || !sidebar)
      return;

    function setOpen(open, restoreFocus) {
      document.documentElement.dataset.sidebarOpen = open ? 'true' : 'false';
      toggle.setAttribute('aria-expanded', String(open));
      overlay.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (open)
        sidebar.querySelector('a, button')?.focus();
      else if (restoreFocus)
        toggle.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(document.documentElement.dataset.sidebarOpen !== 'true', true);
    });
    overlay.addEventListener('click', function () { setOpen(false, true); });
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a') && window.matchMedia('(max-width: 63.999rem)').matches)
        setOpen(false, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.documentElement.dataset.sidebarOpen === 'true')
        setOpen(false, true);
    });
    window.matchMedia('(min-width: 64rem)').addEventListener('change', function (event) {
      if (event.matches)
        setOpen(false, false);
    });
  }

  function init() {
    initAppearance();
    initSidebar();
    document.documentElement.classList.add('kdesign-ready');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else
    init();
})();
