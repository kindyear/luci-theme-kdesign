# KDesign for LuCI

KDesign is a restrained, high-density SaaS-style theme for OpenWrt LuCI. It keeps LuCI's router, RPC, UCI, ubus, forms, views, and application behavior intact while replacing the visual shell and component styling.

The project currently includes the foundation, generic component, and core-page milestones: the installable theme skeleton, ucode templates, local build pipeline, semantic design tokens, login screen, responsive shell, appearance preference, baseline CBI controls, dense tables, tabs, badges, alerts, modals, dropdowns, tooltips, progress indicators, dynamic lists, scoped adapters for the principal official LuCI pages, and compatibility adapters for AdGuard Home, UPnP, Dynamic DNS, Samba4, SQM, and Statistics.

## Screenshots

Screenshots will be added after the foundation has been exercised on the target LuCI environment. The repository includes local fixtures for development checks, but they are not presented as router validation.

## Requirements

Runtime:

- OpenWrt with `luci-base` and ucode templates
- A current evergreen browser
- No Node.js, npm package, CDN, remote font, or internet access on the router

Development:

- Node.js 20 or newer
- pnpm 10 or newer

The implementation follows the current `openwrt/luci` master theme structure and is designed to retain compatibility with recent stable LuCI releases that use ucode theme templates. Exact stable-release and third-party-app coverage remains to be tested on real targets.

## Build

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

Generated runtime assets are written to:

```text
htdocs/luci-static/kdesign/cascade.css
htdocs/luci-static/kdesign/theme.js
htdocs/luci-static/kdesign/icons/
htdocs/luci-static/resources/menu-kdesign.js
```

Source files in `src/` are authoritative. Do not hand-edit generated assets.

For continuous local rebuilding:

```sh
pnpm dev
```

Tailwind and PostCSS are build tools only. They are not installed or executed on OpenWrt.

To create a feed-ready source archive containing only the generated runtime assets, LuCI templates, UCI defaults, package metadata, license, and README:

```sh
pnpm package:source
```

The archive is written to `dist/luci-theme-kdesign-source.tar.gz`. It does not contain Node.js dependencies, development sources, or test fixtures.

## OpenWrt package build

Place this directory in an OpenWrt package or feed path, then select and build `luci-theme-kdesign` through the normal OpenWrt build system. The `Makefile` uses the build tree's LuCI feed rules and deliberately disables LuCI's second CSS/JS minification pass.

### GitHub Actions build for Kwrt x86/64

The repository workflow builds an IPK for the current target environment: Kwrt 25.12-SNAPSHOT on x86/64 with `opkg`. It validates the generated frontend assets first, then uses the official OpenWrt SDK action with the final 24.10 x86_64 SDK. This SDK is intentionally used because it emits IPK packages and retains LuCI ucode templates as source instead of producing release-specific precompiled bytecode.

Run **Build Kwrt IPK** from the repository's Actions page, or push to `main`. Download the `luci-theme-kdesign-kwrt-x86_64-ipk` artifact after the workflow succeeds.

## Installation

Install the package produced by your matching OpenWrt SDK/buildroot. Depending on the target release, use its native package manager:

```sh
# opkg-based releases
opkg install ./luci-theme-kdesign_*.ipk

# apk-based snapshots/releases
apk add --allow-untrusted ./luci-theme-kdesign-*.apk
```

Then select **KDesign** in LuCI under **System → System → Language and Style**. Installation registers the theme but does not force it as the default.

## Development model

- `src/styles/` contains ordered token, foundation, layout, component, and LuCI layers.
- `src/scripts/theme.js` owns visual preference and responsive drawer state only.
- `src/scripts/menu-kdesign.js` adapts LuCI's dynamic menu tree without hardcoding application routes.
- `ucode/template/themes/kdesign/` contains the theme shell and login template.
- `root/etc/uci-defaults/30_luci-theme-kdesign` only registers the theme.

Theme JavaScript does not write UCI, call ubus, change network state, or add a business data layer.

## Appearance

The theme supports Light, Dark, and System modes. The preference is stored in `localStorage` as visual-only state, and the theme is applied before the stylesheet is loaded to avoid a light-to-dark flash.

## Known compatibility status

- Current LuCI master template and menu contracts have been used as the baseline.
- Local fixtures verify the shell, login, generic controls, tables, CBI sections, dialogs, the principal Network and System pages, and responsive behavior.
- Stress fixtures cover long hostnames, IPv6, multiple WAN interfaces, 32 VLAN devices, an empty wireless state, 80 DHCPv6 leases, and 100 firewall rules down to a 320px viewport.
- Router installation, Save & Apply behavior, and all application integrations still require target-device validation.
- Large real-world datasets, device-specific pages, and third-party applications outside the initial compatibility matrix remain to be completed.

## Uninstallation

Switch to another installed theme before removal, then use the target's package manager:

```sh
opkg remove luci-theme-kdesign
# or
apk del luci-theme-kdesign
```

## License and credits

KDesign is licensed under the Apache License 2.0. Theme template and menu integration are based on the interfaces and structure of the OpenWrt LuCI Bootstrap theme; upstream copyright notices are retained where code is derived. Bundled Lucide SVGs retain the Lucide ISC license in the generated icon directory.
