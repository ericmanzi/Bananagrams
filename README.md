# Bananagrams 2 player (iOS)

An iOS app of the Bananagrams game from
[ericmanzi.github.io/bananagrams](https://ericmanzi.github.io/bananagrams/), built
with Expo (SDK 57) and React Native. It has both modes from the web version:

- **Online (2 player)**: create or join a room with a 6-letter code. It uses the
  same WebSocket backend as the web game (`ericmanzi.github.io/backend`), so a
  phone and a browser can play each other. If iOS drops the connection while
  the app is in the background, the app rejoins the room when you come back.
- **Solo**: 21 tiles, PEEL, DUMP, BANANAS. The game is saved as you play and
  resumes where you left off. Your best time is kept.

What changed for the phone:

- The dictionary is the public-domain ENABLE list, bundled into the app, so it
  works offline. The web game uses SOWPODS, which also accepts words like QI
  and ZA. In an online game each player's board is checked by their own
  device, so an app player can't use those words.
- The board scrolls in both directions and pinch-zooms.
- Tapping an occupied cell, or a hand tile while a board tile is selected,
  swaps the two tiles.
- Taps give haptic feedback.
- Tiles are placed by tapping (select, then place). The web version's desktop
  drag-and-drop isn't included.

## Development

```bash
npm install
npm start          # then press i for the iOS simulator, or scan with Expo Go
npm test           # unit tests (Jest)
npm run typecheck
```

### Layout

| Path | What's there |
| --- | --- |
| `app/` | Screens (expo-router): `index` home, `solo`, `online` |
| `src/game/` | Pure game logic: tiles, grid rules, moves, solo engine. No React, fully unit-tested |
| `src/online/` | WebSocket protocol types and the `useOnlineGame` state machine |
| `src/components/` | Board, hand, buttons, sheets and so on |
| `src/dictionary/` | Bundled ENABLE word list (generated; see `scripts/build-dictionary.js`) |
| `scripts/` | Dictionary generator, and `configure-submit.js`, which CI uses to find the App Store Connect app |
| `__tests__/` | Jest tests |

## Shipping to TestFlight

`.github/workflows/testflight.yml` typechecks and tests the app. On every push
to `main` it then builds the app on EAS and submits it to TestFlight. You can
also run it by hand from the Actions tab, and choose the `preview` profile to
build without submitting.

The workflow runs from four secrets plus signing credentials stored on EAS:

- **EAS project:** `@petertacos/bananagrams`, whose ID is in `app.json`.
- **Signing:** the distribution certificate and provisioning profile are set
  up on EAS once, interactively (step 6); eas-cli never creates them in CI.
  CI builds with what's stored there and doesn't log into Apple. Profiles
  last a year; when one expires, run step 6 again.
- **App lookup:** it finds the App Store Connect app by its bundle ID, so
  `ascAppId` in `eas.json` never needs editing.

### One-time setup

1. **Register the bundle ID.** In the
   [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list),
   go to Identifiers → **+** → App IDs → App. Enter a description such as
   "Bananagrams 2 player" and the explicit bundle ID
   `com.ericmanzi.bananagrams`, then Register.

2. **Create the app.** In [App Store Connect](https://appstoreconnect.apple.com/apps),
   go to **+** → New App. Choose iOS, name it **Bananagrams 2 player**, choose
   English (U.S.) as the primary language, pick bundle ID
   `com.ericmanzi.bananagrams`, and enter any SKU (for example `bananagrams`).

3. **App Store Connect API key.** In App Store Connect, go to Users and Access →
   Integrations → App Store Connect API → Team Keys. Click **+**, name the key
   (for example "GitHub Actions"), give it the **Admin** role, and download
   the `.p8` (Apple only lets you download it once). CI uses it to find the
   app and upload builds, which App Manager also allows; Admin leaves room
   for more. Note the **Key ID**
   in the table and the **Issuer ID** shown above it. You can reuse an existing
   Admin team key if you still have its `.p8` file.

4. **Expo token.** At [expo.dev](https://expo.dev), signed in as
   `petertacos`, go to Account settings → Access tokens → Create token, and
   copy it (it's shown once). GitHub won't show you SeparateCompanions'
   `EXPO_TOKEN` secret, so make a new token unless you saved that one.

5. **GitHub secrets.** In this repo, go to Settings → Secrets and variables →
   Actions → New repository secret, and add:

   | Secret | Value |
   | --- | --- |
   | `EXPO_TOKEN` | the Expo token |
   | `ASC_API_KEY_P8` | the whole contents of the `.p8` file, including the `BEGIN`/`END` lines |
   | `ASC_KEY_ID` | the Key ID |
   | `ASC_ISSUER_ID` | the Issuer ID |

6. **Signing credentials (once, on your computer).** You need Node 22 and the
   repo:

   ```bash
   git clone https://github.com/ericmanzi/Bananagrams && cd Bananagrams
   npm ci
   npx eas-cli login                                   # as petertacos
   npx eas-cli credentials:configure-build -p ios -e production
   ```

   Answer the prompts:
   - Log in to your Apple account: **yes** (Apple ID, then the 2FA code).
   - Reuse the existing distribution certificate (the one SeparateCompanions
     uses): **yes**.
   - Generate a new provisioning profile: **yes**.

7. **Run it.** Go to Actions → *Deploy to TestFlight* → Run workflow, or
   push to `main`. The first build takes about 15–20 minutes. The build then
   appears in App Store Connect under TestFlight, where you add yourself as a
   tester.

`ci.yml` runs the typecheck and tests on pull requests and branch pushes.

## Notes

- **Home-screen name.** iOS cuts long names on the home screen, so
  "Bananagrams 2 player" shows as roughly "Bananagrams…". To show a shorter
  label there while keeping the full name in the App Store, change `expo.name`
  in `app.json`.
- **Dependency versions.** Native module versions are pinned to what Expo SDK
  57 expects. `react-native-gesture-handler`, `react-native-reanimated` and
  `react-native-worklets` are listed only for this reason: expo-router pulls
  them in as peers, and without the pins npm installs newer, incompatible
  versions. To upgrade, use `npx expo install --fix` rather than bumping
  versions by hand.
