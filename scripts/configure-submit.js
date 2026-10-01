// Fills in eas.json's iOS submit profile for CI, so nobody has to copy IDs
// around by hand:
//
// - ascAppId: looked up in App Store Connect by the app's bundle identifier,
//   unless eas.json already has a real one.
// - ascApiKeyPath / ascApiKeyId / ascApiKeyIssuerId: the API key `eas submit`
//   uploads with.
//
// Reads ASC_KEY_PATH (the .p8 file), ASC_KEY_ID and ASC_ISSUER_ID (omit for an
// individual key). Only the CI runner's copy of eas.json is changed.
//
//   ASC_KEY_PATH=key.p8 ASC_KEY_ID=ABC123 ASC_ISSUER_ID=... node scripts/configure-submit.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PLACEHOLDER = 'REPLACE_WITH_APP_STORE_CONNECT_APP_ID';
const API = process.env.ASC_API_BASE || 'https://api.appstoreconnect.apple.com';

const b64url = (data) => Buffer.from(data).toString('base64url');

/** An App Store Connect API token (ES256 JWT), valid for 15 minutes. */
function ascToken({ keyPem, keyId, issuerId }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const claims = { aud: 'appstoreconnect-v1', iat: now, exp: now + 15 * 60 };
  // Team keys name their issuer; individual keys identify as the user instead.
  if (issuerId) claims.iss = issuerId;
  else claims.sub = 'user';
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: keyPem, dsaEncoding: 'ieee-p1363' });
  return `${unsigned}.${b64url(signature)}`;
}

async function findAppId(token, bundleId) {
  const url = `${API}/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`App Store Connect returned ${res.status} looking up ${bundleId}: ${await res.text()}`);
  }
  const { data } = await res.json();
  const app = (data || []).find((a) => a.attributes?.bundleId === bundleId);
  return app ? { id: app.id, name: app.attributes.name } : null;
}

async function main() {
  const { ASC_KEY_PATH: keyPath, ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId } = process.env;
  if (!keyPath || !keyId) throw new Error('Set ASC_KEY_PATH and ASC_KEY_ID.');

  const easPath = path.join(ROOT, 'eas.json');
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const ios = eas.submit.production.ios;
  const bundleId = require(path.join(ROOT, 'app.json')).expo.ios.bundleIdentifier;

  if (!ios.ascAppId || ios.ascAppId === PLACEHOLDER) {
    const token = ascToken({ keyPem: fs.readFileSync(keyPath, 'utf8'), keyId, issuerId });
    const app = await findAppId(token, bundleId);
    if (!app) {
      throw new Error(
        `No app with bundle ID ${bundleId} in App Store Connect. Create it there ` +
          '(Apps → + → New App), then re-run this workflow.',
      );
    }
    ios.ascAppId = app.id;
    console.log(`Found "${app.name}" in App Store Connect: ascAppId ${app.id}`);
  }

  ios.ascApiKeyPath = keyPath;
  ios.ascApiKeyId = keyId;
  if (issuerId) ios.ascApiKeyIssuerId = issuerId;
  fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + '\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`::error::${err.message}`);
    process.exit(1);
  });
}

module.exports = { ascToken, findAppId };
