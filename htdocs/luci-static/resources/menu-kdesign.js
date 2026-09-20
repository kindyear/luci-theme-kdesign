'use strict';
'require baseclass';
'require ui';

/*
 * Derived from OpenWrt LuCI's menu-bootstrap.js.
 * Copyright 2008-2025 The LuCI Team
 * Licensed to the public under the Apache License 2.0.
 */

return baseclass.extend({
	__init__() {
		ui.menu.load().then((tree) => this.render(tree));
	},
	render(tree) {
		let node = tree;
		let url = '';
		this.renderModeMenu(tree);
		if (L.env.dispatchpath.length >= 3) {
			for (let i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url += (url ? '/' : '') + L.env.dispatchpath[i];
			}
			if (node)
				this.renderTabMenu(node, url);
		}
	},
	renderTabMenu(tree, url, level) {
		const container = document.querySelector('#tabmenu');
		const ul = E('ul', { class: 'tabs' });
		const children = ui.menu.getChildren(tree);
		let activeNode = null;
		children.forEach((child) => {
			const isActive = L.env.dispatchpath[3 + (level || 0)] === child.name;
			ul.appendChild(E('li', { class: `tabmenu-item-${child.name}${isActive ? ' active' : ''}` }, [
				E('a', { href: L.url(url, child.name), 'aria-current': isActive ? 'page' : null }, [_(child.title)])
			]));
			if (isActive)
				activeNode = child;
		});
		if (!ul.children.length)
			return E([]);
		container.appendChild(ul);
		container.style.display = '';
		if (activeNode)
			this.renderTabMenu(activeNode, `${url}/${activeNode.name}`, (level || 0) + 1);
		return ul;
	},
	iconFor(name) {
		return ({ status: 'activity', network: 'network', wireless: 'wifi', firewall: 'shield', services: 'boxes', system: 'settings' })[name] || 'chevron-right';
	},
	renderMainMenu(tree, url, level) {
		const ul = level ? E('ul', { class: 'dropdown-menu' }) : document.querySelector('#topmenu');
		const children = ui.menu.getChildren(tree);
		const media = document.body.dataset.media || '/luci-static/kdesign';
		if (!children.length || level > 1)
			return E([]);
		children.forEach((child) => {
			const submenu = this.renderMainMenu(child, `${url}/${child.name}`, (level || 0) + 1);
			const isActive = L.env.dispatchpath[1 + (level || 0)] === child.name;
			const firstLink = submenu.querySelector?.('a');
			const linkUrl = firstLink?.getAttribute('href') || L.url(url, child.name);
			const content = [];
			if (!level)
				content.push(E('img', { class: 'kdesign-menu-icon', src: `${media}/icons/${this.iconFor(child.name)}.svg`, alt: '' }));
			content.push(_(child.title));
			ul.appendChild(E('li', { class: `${submenu.firstElementChild ? 'dropdown ' : ''}${isActive ? 'active' : ''}`.trim() }, [
				E('a', { href: linkUrl, 'aria-current': isActive && !submenu.firstElementChild ? 'page' : null }, content),
				submenu
			]));
		});
		ul.style.display = '';
		return ul;
	},
	renderModeMenu(tree) {
		const ul = document.querySelector('#modemenu');
		const children = ui.menu.getChildren(tree);
		children.forEach((child, index) => {
			const isActive = L.env.requestpath.length ? child.name === L.env.requestpath[0] : index === 0;
			ul.appendChild(E('li', { class: isActive ? 'active' : '' }, [
				E('a', { href: L.url(child.name), 'aria-current': isActive ? 'page' : null }, [_(child.title)])
			]));
			if (isActive)
				this.renderMainMenu(child, child.name);
		});
		if (ul.children.length > 1)
			ul.style.display = '';
	}
});
