# Technitium Blocker-Schalter

[English](README.md) | **Deutsch**

Browser-Erweiterung für Chrome/Edge und Firefox, die den Blocker eines
[Technitium DNS Servers](https://technitium.com/dns/) per Klick pausiert:

- 1, 2 oder 5 Minuten pausieren (Technitium schaltet danach selbst wieder ein)
- dauerhaft ausschalten und wieder einschalten
- Status am Icon: kein Badge = aktiv, `4m` = pausiert, `AUS` = ausgeschaltet
- Countdown im Popup, Hell-/Dunkelmodus
- Oberfläche auf Deutsch und Englisch, automatisch nach Browsersprache
- keine Abhängigkeiten, keine Telemetrie, Zugriff nur auf den eingetragenen Server

## Installation

Fertige Pakete gibt es unter [Releases](../../releases).

**Chrome / Edge / Brave**
1. ZIP entpacken
2. `chrome://extensions` öffnen, *Entwicklermodus* einschalten
3. *Entpackte Erweiterung laden* → entpackten Ordner wählen

**Firefox**
- Signierte `.xpi` aus den Releases per Drag & Drop in Firefox ziehen, oder
- zum Testen: `about:debugging#/runtime/this-firefox` → *Temporäres Add-on laden*
  → ZIP wählen (verschwindet nach Neustart)

## Einrichtung

1. In Technitium einen eigenen Benutzer anlegen und ihm nur die Berechtigung
   **Settings: View + Modify** geben
2. Als dieser Benutzer unter *Administration → Sessions → Create Token* einen
   API-Token erzeugen
3. Popup öffnen, Server-Adresse (z. B. `http://192.168.1.53:5380`) und Token
   eintragen, *Speichern und verbinden* → Zugriff auf den Host erlauben

### Sicherheitshinweise

- *Settings: Modify* erlaubt das Ändern **aller** Servereinstellungen, nicht nur
  des Blockings – feiner lässt sich das in Technitium nicht einschränken.
  Deshalb einen eigenen Benutzer verwenden, nicht den Admin.
- Der Token liegt unverschlüsselt im lokalen Erweiterungsspeicher und wird
  nicht synchronisiert. Die Technitium-API erwartet ihn als Query-Parameter –
  außerhalb des LANs nur über HTTPS nutzen.

## Bekannte Stolperfallen

- **DNS-Cache:** Nach dem Pausieren können geblockte Antworten noch im
  Betriebssystem- oder Browser-Cache liegen. Abhilfe: `ipconfig /flushdns` bzw.
  `chrome://net-internals/#dns`, oder in Technitium die TTL für
  Blocking-Antworten senken.
- **Secure DNS / DoH im Browser:** Ist ein externer DoH-Anbieter aktiv, fragt
  der Browser Technitium gar nicht – dann wirkt weder Blocker noch Pause.
- **Selbstsignierte Zertifikate:** `fetch` schlägt fehl, bis dem Zertifikat im
  Browser vertraut wurde. Im LAN alternativ HTTP auf Port 5380 nutzen.
- **Mehrere Server:** Es wird nur der eingetragene Server geschaltet.

## Verwendete API

| Aktion | Endpunkt |
|---|---|
| Status | `GET /api/settings/get` |
| Pausieren | `GET /api/settings/temporaryDisableBlocking?minutes=N` |
| Aus / Ein | `GET /api/settings/set?enableBlocking=false\|true` |

## Entwicklung

```
src/                gemeinsamer Code (Popup, API, Hintergrund-Skript, Icons)
src/_locales/       Übersetzungen (en, de)
platform/chrome/    manifest.json für Chromium (Service Worker)
platform/firefox/   manifest.json für Firefox (Event Page, Gecko-ID)
```

Bauen: `./build.sh` (Linux/macOS, benötigt `zip`) oder `.\build.ps1` (PowerShell).
Ergebnis in `dist/`: entpackte Ordner zum Laden im Browser plus ZIP-Pakete.

### Release

1. Version in **beiden** `platform/*/manifest.json` erhöhen
2. `git tag v1.2.0 && git push --tags`
3. Die GitHub Action baut beide Pakete und hängt sie an das Release. Sind die
   Repository-Secrets `AMO_JWT_ISSUER` und `AMO_JWT_SECRET` gesetzt
   (addons.mozilla.org → *API-Schlüssel verwalten*), wird zusätzlich eine
   signierte Firefox-`.xpi` erzeugt (Kanal *unlisted*).

### Übersetzungen

Alle Texte liegen in `src/_locales/<sprache>/messages.json`. Für eine neue
Sprache `en/messages.json` in einen Ordner mit dem Locale-Code kopieren
(z. B. `fr`), die `message`-Werte übersetzen und einen Pull Request stellen.
Platzhalter `$1`, `$2` beibehalten. Fehlt eine Sprache, wird Englisch angezeigt.

### Forks

Die Firefox-ID `technitium-blocker-toggle@mysash` ist bei AMO an das
Original gebunden. Wer einen Fork selbst signieren will, muss die `id` in
`platform/firefox/manifest.json` ändern.

## Lizenz

[MIT](LICENSE) – kein offizielles Projekt von Technitium.
