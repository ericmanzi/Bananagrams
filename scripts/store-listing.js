// Pushes the App Store keywords in store/keywords.txt to App Store Connect, so
// the listing's search terms live in the repo instead of being typed by hand.
//
// They go on every localization of the iOS version that's still editable
// (normally the one in "Prepare for Submission"). A version that's in review
// or live can't be edited; then this only prints a notice, and the keywords
// apply to the next version once it exists.
//
// Reads the same ASC_KEY_PATH / ASC_KEY_ID / ASC_ISSUER_ID as
// configure-submit.js.
//
//   ASC_KEY_PATH=key.p8 ASC_KEY_ID=ABC123 ASC_ISSUER_ID=... node scripts/store-listing.js

const fs = require('fs');
const path = require('path');
const { ascToken, findAppId } = require('./configure-submit');

const ROOT = path.join(__dirname, '..');
const API = process.env.ASC_API_BASE || 'https://api.appstoreconnect.apple.com';
const MAX_KEYWORDS = 100; // characters, commas included

// Versions App Store Connect still lets you edit metadata on.
const EDITABLE = new Set([
  'PREPARE_FOR_SUBMISSION',
  'READY_FOR_REVIEW',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'INVALID_BINARY',
]);

/** Comma-separated, no padding, no repeats, within Apple's 100-character limit. */
function normalizeKeywords(text) {
  const seen = new Set();
  const words = String(text)
    .split(',')
    .map((w) => w.trim().replace(/\s+/g, ' '))
    .filter((w) => w && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()));
  const keywords = words.join(',');
  if (!keywords) throw new Error('store/keywords.txt is empty.');
  if (keywords.length > MAX_KEYWORDS) {
    throw new Error(`Keywords are ${keywords.length} characters; App Store Connect allows ${MAX_KEYWORDS}.`);
  }
  return keywords;
}

/** The iOS versions whose metadata can still be changed. */
function editableVersions(versions) {
  return versions.filter((v) => {
    const { platform, appVersionState, appStoreState } = v.attributes || {};
    return (!platform || platform === 'IOS') && EDITABLE.has(appVersionState || appStoreState);
  });
}

function client(token) {
  return async (method, urlPath, body) => {
    const res = await fetch(`${API}${urlPath}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`App Store Connect ${method} ${urlPath} returned ${res.status}: ${await res.text()}`);
    return res.json();
  };
}

async function main() {
  const { ASC_KEY_PATH: keyPath, ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId } = process.env;
  if (!keyPath || !keyId) throw new Error('Set ASC_KEY_PATH and ASC_KEY_ID.');
  const keywords = normalizeKeywords(fs.readFileSync(path.join(ROOT, 'store', 'keywords.txt'), 'utf8'));

  const token = ascToken({ keyPem: fs.readFileSync(keyPath, 'utf8'), keyId, issuerId });
  const asc = client(token);
  const bundleId = require(path.join(ROOT, 'app.json')).expo.ios.bundleIdentifier;
  const app = await findAppId(token, bundleId);
  if (!app) throw new Error(`No app with bundle ID ${bundleId} in App Store Connect.`);

  const { data: versions } = await asc('GET', `/v1/apps/${app.id}/appStoreVersions?limit=50`);
  const targets = editableVersions(versions);
  if (!targets.length) {
    const states = versions.map((v) => `${v.attributes.versionString} (${v.attributes.appVersionState || v.attributes.appStoreState})`);
    console.log(`::notice::No editable App Store version (${states.join(', ') || 'none'}); keywords not changed.`);
    return;
  }

  for (const version of targets) {
    const { data: locs } = await asc('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
    for (const loc of locs) {
      const where = `${version.attributes.versionString} ${loc.attributes.locale}`;
      if (loc.attributes.keywords === keywords) {
        console.log(`Keywords already up to date for ${where}`);
        continue;
      }
      await asc('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, {
        data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: { keywords } },
      });
      console.log(`Set keywords for ${where}: ${keywords}`);
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`::error::${err.message}`);
    process.exit(1);
  });
}

module.exports = { normalizeKeywords, editableVersions };
