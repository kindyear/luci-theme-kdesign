(function () {
  'use strict';

  var STORAGE_KEY = 'kdesign-appearance';
  var SIDEBAR_STORAGE_KEY = 'kdesign-sidebar-collapsed';
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

  function storedSidebarState() {
    try {
      var value = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (value === 'true' || value === 'false')
        return value;
    } catch (error) {
      // Fall back to the administrator configured default.
    }
    return document.documentElement.dataset.sidebarDefault === 'true' ? 'true' : 'false';
  }

  document.documentElement.dataset.sidebarCollapsed = storedSidebarState();

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
    var flyoutCloseTimer = null;
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
      var drawerToggle = event.target.closest('[data-kdesign-menu-drawer-toggle]');
      if (drawerToggle) {
        var item = drawerToggle.closest('.dropdown');
        var open = item && item.dataset.menuOpen !== 'true';
        if (item) {
          item.dataset.menuOpen = String(open);
          drawerToggle.setAttribute('aria-expanded', String(open));
        }
        return;
      }
      if (event.target.closest('a') && window.matchMedia('(max-width: 63.999rem)').matches)
        setOpen(false, false);
    });

    sidebar.addEventListener('pointerover', function (event) {
      if (document.documentElement.dataset.sidebarCollapsed !== 'true' || !window.matchMedia('(min-width: 64rem)').matches)
        return;
      var item = event.target.closest('.kdesign-sidebar-nav > ul > .dropdown');
      if (!item || item.contains(event.relatedTarget))
        return;
      window.clearTimeout(flyoutCloseTimer);
      sidebar.querySelectorAll('[data-flyout-open="true"]').forEach(function (openItem) {
        if (openItem !== item)
          delete openItem.dataset.flyoutOpen;
      });
      item.dataset.flyoutOpen = 'true';
      var rect = item.getBoundingClientRect();
      item.style.setProperty('--kdesign-flyout-top', Math.max(8, Math.min(rect.top, window.innerHeight - 80)) + 'px');
    });
    sidebar.addEventListener('pointerout', function (event) {
      if (document.documentElement.dataset.sidebarCollapsed !== 'true')
        return;
      var item = event.target.closest('.kdesign-sidebar-nav > ul > .dropdown');
      if (!item || (event.relatedTarget && item.contains(event.relatedTarget)))
        return;
      window.clearTimeout(flyoutCloseTimer);
      flyoutCloseTimer = window.setTimeout(function () {
        if (!item.matches(':hover'))
          delete item.dataset.flyoutOpen;
      }, 180);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.documentElement.dataset.sidebarOpen === 'true')
        setOpen(false, true);
    });
    window.matchMedia('(min-width: 64rem)').addEventListener('change', function (event) {
      if (event.matches)
        setOpen(false, false);
    });

    var collapse = document.querySelector('[data-kdesign-sidebar-collapse]');
    if (collapse) {
      var collapseIcon = collapse.querySelector('img');
      var collapseLabel = collapse.querySelector('span');
      var media = document.body.dataset.media || '/luci-static/kdesign';

      function updateCollapseButton() {
        var collapsed = document.documentElement.dataset.sidebarCollapsed === 'true';
        var label = collapsed ? collapse.dataset.labelExpand : collapse.dataset.labelCollapse;
        collapse.setAttribute('aria-expanded', String(!collapsed));
        collapse.setAttribute('aria-label', label);
        collapse.title = label;
        if (collapseLabel)
          collapseLabel.textContent = label;
        if (collapseIcon)
          collapseIcon.src = media + '/icons/' + (collapsed ? 'panel-left-open' : 'panel-left-close') + '.svg';
      }

      collapse.addEventListener('click', function () {
        var collapsed = document.documentElement.dataset.sidebarCollapsed !== 'true';
        document.documentElement.dataset.sidebarCollapsed = String(collapsed);
        if (!collapsed)
          sidebar.querySelectorAll('[data-flyout-open]').forEach(function (item) { delete item.dataset.flyoutOpen; });
        try {
          window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
        } catch (error) {
          // The current page still keeps the selected state.
        }
        updateCollapseButton();
      });
      updateCollapseButton();
    }
  }

  function initOverviewEnhancements() {
    if (document.body.dataset.page !== 'admin-status-overview')
      return;

    var view = document.querySelector('#view');
    if (!view)
      return;

    function refreshIcons() {
      var media = document.body.dataset.media || '/luci-static/kdesign';
      view.querySelectorAll('.kdesign-overview-card-ports .ifacebox-body > img:not([data-kdesign-icon])').forEach(function (icon) {
        var connected = /port_up/.test(icon.getAttribute('src') || '');
        icon.src = media + '/icons/ethernet-port.svg';
        icon.alt = '';
        icon.dataset.kdesignIcon = 'port';
        icon.closest('.ifacebox')?.setAttribute('data-port-connected', String(connected));
      });
      view.querySelectorAll('.network-status-table .ifacebadge img:not([data-kdesign-icon])').forEach(function (icon) {
        icon.src = media + '/icons/cable.svg';
        icon.alt = '';
        icon.dataset.kdesignIcon = 'network';
      });
    }

    function enhance() {
      if (view.querySelector('.kdesign-overview-dashboard')) {
        refreshIcons();
        return true;
      }

      var cards = Array.from(view.children).filter(function (node) {
        return node.classList && node.classList.contains('cbi-section');
      });
      if (cards.length < 5)
        return false;

      var names = ['system', 'cpu', 'memory', 'storage', 'ports'];
      cards.slice(0, 5).forEach(function (card, index) {
        card.classList.add('kdesign-overview-card', 'kdesign-overview-card-' + names[index]);
      });

      var dashboard = document.createElement('div');
      dashboard.className = 'kdesign-overview-dashboard';
      var columns = ['system', 'metrics', 'health'].map(function (name) {
        var column = document.createElement('div');
        column.className = 'kdesign-overview-column kdesign-overview-column-' + name;
        dashboard.appendChild(column);
        return column;
      });
      view.insertBefore(dashboard, cards[0]);
      columns[0].appendChild(cards[0]);
      columns[1].append(cards[1], cards[3]);
      columns[2].append(cards[2], cards[4]);

      refreshIcons();
      return true;
    }

    enhance();
    new MutationObserver(enhance).observe(view, { childList: true, subtree: true });
  }

  function initLoginCustomization() {
    if (!document.body.classList.contains('kdesign-login-body'))
      return;

    var color = document.body.dataset.loginBackgroundColor || '';
    if (/^#[0-9a-f]{6}$/i.test(color))
      document.body.style.backgroundColor = color;

    var image = document.body.dataset.loginBackground || '';
    if (image && document.body.dataset.loginBackgroundSource === 'bing')
      image += (image.indexOf('?') === -1 ? '?' : '&') + 'day=' + new Date().toISOString().slice(0, 10);
    if (image) {
      try {
        var resolved = new URL(image, window.location.href);
        if (resolved.protocol === 'http:' || resolved.protocol === 'https:')
          document.body.style.backgroundImage = 'url("' + resolved.href.replace(/["\\]/g, '\\$&') + '")';
      } catch (error) {
        // Ignore malformed administrator supplied URLs.
      }
    }

    var overlay = Number(document.body.dataset.loginOverlay || 0);
    if (Number.isFinite(overlay)) {
      overlay = Math.max(0, Math.min(80, overlay));
      document.body.style.setProperty('--kdesign-login-overlay', 'rgba(0, 0, 0, ' + (overlay / 100) + ')');
    }
  }

  function removeSyscontrolCredit(root) {
    var anchors = root.querySelectorAll ? root.querySelectorAll('a') : [];
    anchors.forEach(function (anchor) {
      if (anchor.hostname === 'github.com' && anchor.pathname.replace(/\/$/, '') === '/bobbyunknow' && /Dibuat oleh/.test(anchor.parentElement?.textContent || ''))
        anchor.closest('div')?.remove();
    });
  }

  function initCompatibilityCleanup() {
    var main = document.querySelector('#maincontent');
    if (!main)
      return;
    removeSyscontrolCredit(main);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1)
            removeSyscontrolCredit(node);
        });
      });
    }).observe(main, { childList: true, subtree: true });
  }

  function init() {
    initAppearance();
    initSidebar();
    initLoginCustomization();
    initCompatibilityCleanup();
    initOverviewEnhancements();
    document.documentElement.classList.add('kdesign-ready');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else
    init();
})();
