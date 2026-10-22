// Renders the App Store creative assets into the folder above:
//   header.png          3840 x 1646 (21:9) product page header
//   search-results.png  3840 x 2560 (3:2)  search results asset
// The search asset uses the cropped captures from ../../screenshots/src, so run
// `python3 prepare.py` there first.
//
//   node render.js     # needs Playwright with a Chromium build
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const banana = fs.readFileSync(path.join(__dirname, 'banana.svg.html'), 'utf8');
const assets = [
  ['header', 3840, 1646, 'header.html', 860],
  ['search-results', 3840, 2560, 'search.html', 760],
];

(async () => {
  const browser = await chromium.launch();
  for (const [out, width, height, page, fit] of assets) {
    const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(__dirname, page));
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(([svg, fit]) => {
      const box = document.getElementById('bananaBox');
      if (box) window.mountBanana(svg, box, fit);
    }, [banana, fit]);
    await p.waitForFunction(() => [...document.images].every((i) => i.complete));
    await p.screenshot({ path: path.join(__dirname, '..', `${out}.png`) });
    console.log(`${out}.png`);
    await p.close();
  }
  await browser.close();
})();
