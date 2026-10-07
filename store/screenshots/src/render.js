// Renders the framed App Store screenshots (1320 x 2868, Apple's 6.9-inch
// iPhone size) from work/*.png into the folder above. Run prepare.py first.
//
//   node render.js     # needs Playwright with a Chromium build
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

// Order matters: the first three show in App Store search results.
const shots = [
  ['01-build', 'hero', 'Build one giant crossword', 'Race to use every tile in the bunch'],
  ['02-peel', 'green', 'Green means every word works', 'Then PEEL to draw a new tile'],
  ['03-play', 'home', 'Play solo or with a friend', 'Share a room code and race online'],
  ['04-dump', 'dumped', 'Stuck? Dump a tile', 'Trade one letter for three new ones'],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1320, height: 2868 }, deviceScaleFactor: 1 });
  for (const [out, img, h, s] of shots) {
    const url = 'file://' + path.join(__dirname, 'frame.html') + '?' + new URLSearchParams({ img: `work/${img}.png`, h, s });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.getElementById('img').complete);
    await page.screenshot({ path: path.join(__dirname, '..', `${out}.png`) });
    console.log(`${out}.png`);
  }
  await browser.close();
})();
