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

# The repository's src/ directory contains frontend source files, not a
# conventional Make-based LuCI backend. Prevent luci.mk from invoking
# `make install` in PKG_BUILD_DIR merely because that directory exists.
define Build/Compile
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
