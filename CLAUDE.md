# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

An iOS app (Expo SDK 57, React Native, expo-router, TypeScript) of the
Bananagrams game from the `ericmanzi.github.io` repo (`bananagrams/` online,
`bananagrams-1p/` solo). Shipped to TestFlight through EAS by
`.github/workflows/testflight.yml`, modelled on the SeparateCompanions repo.

## Commands

- `npm test`: Jest unit tests (game logic, dictionary, protocol helpers)
- `npm run typecheck`: `tsc --noEmit`
- `npx expo export --platform ios`: confirms the app bundles without a Mac

Run the tests and the typecheck before pushing; CI runs both, and a push to
`main` also builds and submits to TestFlight.

## Architecture

- `src/game/` is pure and React-free. Moves take `(board, selection)` and return
  a new board and selection without mutating anything. Keep rules here, and test
  them in `__tests__/`
- Peel rules match the web game's stricter online version: one connected
  crossword, no lone tiles, every word in the dictionary. Word colours only show
  once the hand is empty
- `src/online/protocol.ts` mirrors the message types in
  `ericmanzi.github.io/backend/handler.js`. The app talks to that live server, so
  a protocol change has to land in the backend and the web game too
- `useLatest` (state plus a ref) exists so a tap and a server message in the
  same frame both build on the newest board. Route board updates through it
- The board is one Pressable. The tapped cell comes from the touch position, and
  tiles and grid lines have `pointerEvents="none"`. Don't make cells
  individually pressable (625 of them)
- The dictionary is a generated JS module holding one long string, built into a
  `Set` on first use. Regenerate it with `scripts/build-dictionary.js`, never by
  hand

## Dependencies

Native module versions must match Expo SDK 57 (`expo/bundledNativeModules.json`).
Use `npx expo install <pkg>`, or read the version from that file if the Expo API
is unreachable. Never add a bare `npm install <pkg>@latest`. Reanimated,
gesture-handler and worklets are pinned only because expo-router's peers would
otherwise pull in incompatible latest versions.
