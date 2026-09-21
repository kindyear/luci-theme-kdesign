# Copyright 2026 KDesign contributors
# Licensed to the public under the Apache License 2.0.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=KDesign 现代化 LuCI 主题
LUCI_DESCRIPTION:=一款面向 OpenWrt LuCI 的现代化响应式主题，提供深浅色模式、折叠侧栏和常用页面布局适配。
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

# CSS and JavaScript are built and minified by the development toolchain.
LUCI_MINIFY_CSS:=0
LUCI_MINIFY_JS:=0

define Package/luci-theme-kdesign/postinst
#!/bin/sh
# Recent LuCI exposes the repository-key view for both apk and opkg. Some
# opkg-based vendor images omit the otherwise empty key directory, causing
# the view's fs.list() call to fail with NotFoundError.
if [ -z "$${IPKG_INSTROOT}" ] && command -v opkg >/dev/null 2>&1; then
	mkdir -p /etc/opkg/keys
fi
exit 0
endef

define Package/luci-theme-kdesign/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.KDesign
	uci commit luci
}
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
