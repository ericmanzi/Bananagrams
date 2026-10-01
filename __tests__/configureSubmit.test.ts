import crypto from 'crypto';

// scripts/ is plain Node, outside the TypeScript project.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ascToken } = require('../scripts/configure-submit');

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
