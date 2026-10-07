# App Store listing: Nanagrams 1.0

Everything to paste into App Store Connect for version 1.0. Character limits are
App Store Connect's; `npm test` checks the counts (`__tests__/storeListing.test.ts`).
Keywords are pushed automatically from `keywords.txt`, so they aren't repeated here.

## App Information

- **Name:** Nanagrams
- **Subtitle** (30 max):

<!-- subtitle -->
Banana Word Tile Race
<!-- /subtitle -->

- **Category:** Games. Subcategories: Word, Puzzle
- **Content Rights:** No, it does not contain, show, or access third-party content
- **Age Rating:** answer *None* / *No* to every question (no chat, no user-generated
  content, no web browsing). It should come out **4+**.

## Pricing and Availability

Free, all countries and regions.

## App Privacy

- **Privacy Policy URL:** https://ericmanzi.github.io/nanagrams/privacy.html
- **Data collection:** *Yes, we collect data from this app*, then tick one type:
  - **User Content → Gameplay Content.** Online games send tiles, boards and
    room codes to the game server, which keeps them for up to two hours.
  - Purpose: **App Functionality** only.
  - Linked to the user's identity: **No**.
  - Used for tracking: **No**.

  Everything else (solo games, best time) stays on the device, so it isn't
  "collected" in Apple's sense.

## Version 1.0

- **Screenshots** (6.9-inch iPhone display, 1320 × 2868, in this order):
  `screenshots/01-build.png`, `02-peel.png`, `03-play.png`, `04-dump.png`.
  Apple scales these down for smaller iPhones, so no other sizes are needed.
- **Promotional Text** (170 max, can change any time without review):

<!-- promo -->
Turn 21 letter tiles into one connected crossword before the bunch runs out. Play solo against the clock, or share a room code and race a friend online.
<!-- /promo -->

- **Description** (4000 max):

<!-- description -->
Nanagrams is the fast, no-board word race. Grab 21 letter tiles and build them into your own connected crossword. Use every tile and you're ready to PEEL: draw another letter and keep building, until the bunch runs dry.

HOW IT PLAYS
• Tap a tile, then tap the board to place it. Tap a placed tile to pick it up again, or tap an occupied square to swap the two.
• Every run of two or more letters, across and down, has to be a word.
• Empty your hand and the board checks itself: words turn green when they're good, red when they're not.
• All green? PEEL to draw a new tile.
• Stuck with a Q? DUMP it and take three new letters instead.
• Use every tile once the bunch runs out to win.

PLAY YOUR WAY
• Solo: race the clock, beat your best time, and pick up right where you left off. Every move is saved.
• With a friend: create a room, share the six-letter code, and race head-to-head. When either of you peels, you both draw.

MADE FOR IPHONE
• Pinch to zoom and drag around a big board.
• Haptic taps as you play.
• Works offline in solo mode, with a full built-in dictionary of over 170,000 words.
• No ads, no accounts, no tracking.

Questions or ideas? Visit the support page or email eric.manzi.site@gmail.com.
<!-- /description -->

- **Support URL:** https://ericmanzi.github.io/nanagrams/
- **Marketing URL:** leave empty, or reuse the support URL
- **Version:** 1.0
- **Copyright:** 2026 Eric Manzi
- **Build:** the newest build under TestFlight (1.0.0 (6) or later)

## App Review Information

- **Sign-in required:** No
- **Contact:** your name, phone and email
- **Notes:**

<!-- review-notes -->
No account or sign-in is needed.

Solo: tap Play Solo. Place tiles by tapping a tile in the hand, then a square on the board. Once the hand is empty and every word is green, PEEL draws another tile.

Online (two players): tap Play Online, then Create Room on one device to get a six-letter code. Join from a second iPhone with Play Online and that code. If you only have one device, open https://ericmanzi.github.io/bananagrams/ in any browser, which is the same game on the web and joins the same rooms.

The dictionary is the public-domain ENABLE word list, bundled in the app.
<!-- /review-notes -->

## Version release

Your choice: *Automatically release this version* or *Manually release*.
