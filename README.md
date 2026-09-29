# Bananagrams for iOS

An iOS app of the Bananagrams game from
[ericmanzi.github.io/bananagrams](https://ericmanzi.github.io/bananagrams/), built
with Expo (SDK 57) and React Native. It has both modes from the web version:

- **Solo**: 21 tiles, PEEL, DUMP, BANANAS. The game is saved as you play and
  resumes where you left off. Your best time is kept.
- **Online**: create or join a room with a 6-letter code. It uses the same
  WebSocket backend as the web game (`ericmanzi.github.io/backend`), so a phone
  and a browser can play each other. If iOS drops the connection while the app
  is in the background, the app rejoins the room when you come back.

What changed for the phone:

- The SOWPODS dictionary is bundled into the app, so it works offline and
  doesn't download on every launch.
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
npm test           # game-logic unit tests (Jest)
npm run typecheck
```

### Layout

| Path | What's there |
| --- | --- |
| `app/` | Screens (expo-router): `index` home, `solo`, `online` |
| `src/game/` | Pure game logic: tiles, grid rules, moves, solo engine. No React, fully unit-tested |
| `src/online/` | WebSocket protocol types and the `useOnlineGame` state machine |
| `src/components/` | Board, hand, buttons, sheets and so on |
| `src/dictionary/` | Bundled SOWPODS word list (generated; see `scripts/build-dictionary.js`) |
| `__tests__/` | Jest tests |

## Shipping to TestFlight

This uses the same setup as SeparateCompanions. `.github/workflows/testflight.yml`
typechecks and tests the app. On every push to `main` it then builds the app on
EAS and submits it to TestFlight. You can also run it by hand from the Actions
tab, and choose the `preview` profile to build without submitting.

### One-time setup

1. **EAS project.** Log in as the Expo account that owns SeparateCompanions
   (`petertacos`, set as `owner` in `app.json`), then link the project:

   ```bash
   npx eas-cli login
   npx eas-cli init          # writes extra.eas.projectId into app.json
   ```

   Commit the updated `app.json`. Until you do, the workflow links the project
   on each run and prints a warning.

2. **App Store Connect app.** In App Store Connect, go to Apps → + → New App.
   Pick bundle ID `com.ericmanzi.bananagrams`; if it isn't listed yet, step 3
   registers it. Then copy the app's **Apple ID** (App Information → Apple ID)
   into `eas.json` → `submit.production.ios.ascAppId`, replacing
   `REPLACE_WITH_APP_STORE_CONNECT_APP_ID`.

   > **Name:** App Store names must be unique, and "Bananagrams" is the
   > trademarked name of the official game, so App Store Connect will likely
   > reject it. Use something else for the store listing. You can keep
   > "Bananagrams" as the home-screen name (`expo.name` in `app.json`) for
   > TestFlight, but change it too before any public release.

3. **iOS signing credentials.** Do one of these:
   - Run `npx eas-cli credentials -p ios` locally, choose the `production`
     profile, and let it set up the distribution certificate (you can reuse
     SeparateCompanions') and a provisioning profile. Then choose
     *App Store Connect: Manage your API Key* and assign the existing key for
     submissions.
   - Or add these repository secrets: `ASC_API_KEY_P8` (the contents of the
     `.p8` file), `ASC_KEY_ID` and `ASC_ISSUER_ID`. EAS then creates the
     provisioning profile in CI.

4. **GitHub.** In this repo, go to Settings → Environments, create an
   environment named `testflight`, and add the secret `EXPO_TOKEN` (an Expo
   access token for the account above; SeparateCompanions' token works).

5. Merge to `main`. The workflow builds the app and uploads it to TestFlight.
   The first build takes about 15–20 minutes on EAS.

`ci.yml` runs the typecheck and tests on pull requests and branch pushes.

## Notes

- **Dictionary licence.** The bundled list is the SOWPODS (Collins Scrabble
  Words) file the web game already downloads. Collins Scrabble Words is
  copyrighted by HarperCollins. That's fine for TestFlight, but before a public
  App Store release, consider switching to a public-domain list such as ENABLE.
  To switch, regenerate `src/dictionary/sowpods.js` with
  `scripts/build-dictionary.js`.
- **Dependency versions.** Native module versions are pinned to what Expo SDK
  57 expects. `react-native-gesture-handler`, `react-native-reanimated` and
  `react-native-worklets` are listed only for this reason: expo-router pulls
  them in as peers, and without the pins npm installs newer, incompatible
  versions. To upgrade, use `npx expo install --fix` rather than bumping
  versions by hand.
