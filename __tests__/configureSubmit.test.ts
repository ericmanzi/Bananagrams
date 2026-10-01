import crypto from 'crypto';

// scripts/ is plain Node, outside the TypeScript project.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ascToken, normalizeP8 } = require('../scripts/configure-submit');

describe('App Store Connect token', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString());

  it('is an ES256 JWT Apple can verify', () => {
    const token: string = ascToken({ keyPem, keyId: 'KEY123', issuerId: 'issuer' });
    const [header, claims, signature] = token.split('.');
    expect(decode(header)).toEqual({ alg: 'ES256', kid: 'KEY123', typ: 'JWT' });
    const body = decode(claims);
    expect(body).toMatchObject({ aud: 'appstoreconnect-v1', iss: 'issuer' });
    expect(body.exp - body.iat).toBeLessThanOrEqual(20 * 60); // Apple's limit
    const valid = crypto.verify(
      'sha256',
      Buffer.from(`${header}.${claims}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'),
    );
    expect(valid).toBe(true);
  });

  it('identifies an individual key as the user', () => {
    const body = decode(ascToken({ keyPem, keyId: 'K' }).split('.')[1]);
    expect(body.sub).toBe('user');
    expect(body.iss).toBeUndefined();
  });
});

describe('normalizeP8', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim();
  const body = pem.split('\n').slice(1, -1).join('');
  const sec1 = privateKey.export({ type: 'sec1', format: 'pem' }).toString();
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

  // What Expo's submission service checks (jose's importPKCS8), then the key itself.
  const expectUsable = (out: string) => {
    expect(out.indexOf('-----BEGIN PRIVATE KEY-----')).toBe(0);
    expect(out).toBe(pem);
    const derived = crypto.createPublicKey(crypto.createPrivateKey(out)).export({ type: 'spki', format: 'pem' });
    expect(derived).toBe(publicPem);
  };

  it.each([
    ['as downloaded', pem],
    ['with a leading blank line and spaces', `\n  ${pem}\n\n`],
    ['with a byte-order mark', `\uFEFF${pem}`],
    ['with Windows line endings', pem.replace(/\n/g, '\r\n')],
    ['flattened onto one line', pem.replace(/\n/g, ' ')],
    ['with literal \\n sequences', pem.replace(/\n/g, '\\n')],
    ['as a bare base64 body', body],
    ['in SEC1 "EC PRIVATE KEY" form', sec1],
  ])('accepts a key %s', (_label, input) => {
    expectUsable(normalizeP8(input));
  });

  it('explains an empty or unreadable secret', () => {
    expect(() => normalizeP8('')).toThrow(/empty/);
    expect(() => normalizeP8('not a key')).toThrow(/AuthKey_<KeyID>\.p8/);
  });

  it('rejects a key that is not EC', () => {
    const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 }).privateKey;
    expect(() => normalizeP8(rsa.export({ type: 'pkcs8', format: 'pem' }).toString())).toThrow(/EC/);
  });
});
