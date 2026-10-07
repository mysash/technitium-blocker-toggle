# Technitium Blocker Toggle

**English** | [Deutsch](README.de.md)

A tiny browser extension for Chrome, Edge, Brave and Firefox that pauses the
ad blocker of your [Technitium DNS Server](https://technitium.com/dns/) with
one click – for those moments when a site breaks because a tracker or CDN is
blocked.

- Pause blocking for **1, 2 or 5 minutes** – Technitium turns it back on by itself
- **Turn blocking off** until you switch it back on
- Status on the toolbar icon: no badge = active, `4m` = paused, `OFF` = off
- Live countdown in the popup, light and dark mode
- English and German interface, chosen automatically from your browser language
- No dependencies, no telemetry, network access only to the server you enter

---

## Contents

- [Requirements](#requirements)
- [Step 1: Create an API token in Technitium](#step-1-create-an-api-token-in-technitium)
- [Step 2: Install the extension](#step-2-install-the-extension)
- [Step 3: Connect the extension](#step-3-connect-the-extension)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [API endpoints used](#api-endpoints-used)
- [Development](#development)
- [Translations](#translations)
- [License](#license)

---

## Requirements

- Technitium DNS Server with its web console reachable from your browser
  (default: `http://<server-ip>:5380`)
- Chrome, Edge or Brave (any current version), or Firefox 128 or newer
- Your devices actually use Technitium as their DNS server (see
  [Troubleshooting](#troubleshooting) if the browser bypasses it)

## Step 1: Create an API token in Technitium

Use a dedicated user instead of your admin account, so the token can only
change server settings.

1. Log in to the Technitium web console as admin.
2. Go to **Administration → Users** and add a new user, e.g. `blocker-toggle`.
3. Go to **Administration → Permissions**, open the **Settings** section and
   grant the new user **View** and **Modify**. Leave all other sections
   untouched.
4. Log out and log in as the new user.
5. Go to **Administration → Sessions → Create Token**, give it a name
   (e.g. `browser`) and copy the token. It is shown only once.

## Step 2: Install the extension

Download the package for your browser from the [Releases](../../releases)
page.

### Chrome, Edge, Brave

1. Unzip `technitium-blocker-chrome-<version>.zip` into a folder you will keep
   (the browser loads the extension from there).
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Enable **Developer mode** (top right in Chrome, left sidebar in Edge).
4. Click **Load unpacked** and select the unzipped folder.
5. Click the puzzle icon in the toolbar and pin **Technitium Blocker Toggle**.

### Firefox

**Permanent install (recommended):** download the signed
`technitium-blocker-firefox-<version>.xpi` from the release and drag it into a
Firefox window. Confirm the prompt.

**Temporary install for testing:** open
`about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and
select the `.zip`. Firefox removes it again on restart.

> Regular Firefox only accepts signed add-ons. If a release contains no `.xpi`,
> use the temporary install or Firefox Developer Edition / ESR with
> `xpinstall.signatures.required` set to `false` in `about:config`.

## Step 3: Connect the extension

1. Click the extension icon. On first start the settings open automatically.
2. Enter the **server address**, e.g. `http://192.168.1.53:5380`, without a
   trailing path.
3. Paste the **API token** from step 1.
4. Click **Save and connect**.
5. The browser asks for permission to access this one host. Allow it.
   - In Firefox the popup closes when the prompt appears. That is expected –
     just open it again.

The status lamp turns green and shows *Blocking active*. To change the server or
token later, click the gear icon in the popup.

## Usage

| Button | What happens |
|---|---|
| **1 Min / 2 Min / 5 Min** | Blocking is paused. Technitium re-enables it automatically when the time is up – even if your browser is closed. |
| **Turn off** | Blocking stays off until you turn it back on. |
| **Turn blocking back on** | Turns blocking on immediately and ends a running pause. |

The popup shows when the pause ends and counts down. The badge on the toolbar
icon updates every minute and exactly when a pause ends, and it also reflects
changes made elsewhere (web console, Home Assistant, another browser).

After pausing, **reload the page you wanted to visit**. If it still fails, see
the DNS cache section below.

## Troubleshooting

**The page still doesn't load after pausing**
Your operating system or browser has cached the blocked answer. Flush it:
- Windows: `ipconfig /flushdns`
- macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- Chrome/Edge: `chrome://net-internals/#dns` → **Clear host cache**

For a lasting fix, lower the TTL of blocked responses in Technitium under
**Settings → Blocking**.

**Blocking has no effect in this browser at all**
The browser probably uses its own encrypted DNS (DNS over HTTPS) and bypasses
Technitium. Check **Settings → Privacy and security → Use secure DNS** in
Chrome/Edge or **Settings → Privacy & Security → DNS over HTTPS** in Firefox.

**"Server not reachable"**
- Check address and port – open the URL in a normal tab; the Technitium login
  page should appear.
- With HTTPS and a self-signed certificate the request fails until the browser
  trusts the certificate. Open the URL once and accept it, or use plain HTTP on
  port 5380 inside your LAN.

**"Token invalid or expired"**
The token was deleted or belongs to a user without the *Settings* permission.
Create a new one as described in [step 1](#step-1-create-an-api-token-in-technitium).

**"Access missing"**
The host permission was not granted. Open the settings and click
**Save and connect** again, or grant it in Firefox via
`about:addons` → the extension → **Permissions**.

**I run two Technitium servers**
The extension controls only the server you entered. Clients falling back to the
second server will still be filtered.

## Security notes

- The *Settings: Modify* permission allows changing **all** server settings,
  not only blocking. Technitium does not offer anything more fine-grained, so
  always use a dedicated user.
- The token is stored unencrypted in the extension's local storage and is not
  synced between devices.
- The Technitium API expects the token as a query parameter. Use HTTPS if the
  server is reachable from outside your LAN.

## API endpoints used

| Action | Endpoint |
|---|---|
| Read status | `GET /api/settings/get` |
| Pause | `GET /api/settings/temporaryDisableBlocking?minutes=N` |
| Off / on | `GET /api/settings/set?enableBlocking=false\|true` |

See the official [Technitium API documentation](https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md).

## Development

```
src/                shared code (popup, API client, background script, icons)
src/_locales/       translations (en, de)
platform/chrome/    manifest.json for Chromium (service worker)
platform/firefox/   manifest.json for Firefox (event page, Gecko ID)
```

Build with `./build.sh` (Linux, macOS; needs `zip`) or `.\build.ps1`
(PowerShell). The output in `dist/` contains unpacked folders you can load
directly in the browser plus the zip packages.

### Releasing

1. Bump `version` in **both** `platform/*/manifest.json` files.
2. `git tag v1.2.0 && git push --tags`
3. The GitHub Action builds both packages and attaches them to the release. If
   the repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` are set
   (addons.mozilla.org → *Manage API Keys*), it also produces a signed Firefox
   `.xpi` on the *unlisted* channel.

### Forks

The Firefox ID `technitium-blocker-toggle@mysash` is bound to the original on
addons.mozilla.org. To sign your own fork, change `id` in
`platform/firefox/manifest.json`.

## Translations

All texts live in `src/_locales/<language>/messages.json`. To add a language,
copy `en/messages.json` to a new folder named after the
[locale code](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales)
(e.g. `fr`, `pt_BR`), translate the `message` values and open a pull request.
Keep `$1`, `$2` placeholders in place. English is the fallback for any browser
language without a translation.

## License

[MIT](LICENSE) © mysash. Not affiliated with Technitium.
