# Copyright 2026 KDesign contributors
# Licensed to the public under the Apache License 2.0.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=KDesign SaaS Theme
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

# CSS and JavaScript are built and minified by the development toolchain.
LUCI_MINIFY_CSS:=0
LUCI_MINIFY_JS:=0

define Package/luci-theme-kdesign/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	# Recent LuCI exposes the repository-key view for both apk and opkg. Some
	# opkg-based vendor images omit the otherwise empty key directory, causing
	# the view's fs.list() call to fail with NotFoundError.
	command -v opkg >/dev/null 2>&1 && mkdir -p /etc/opkg/keys
}
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
