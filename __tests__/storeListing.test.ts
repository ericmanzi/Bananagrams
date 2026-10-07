import fs from 'fs';
import path from 'path';

// scripts/ is plain Node, outside the TypeScript project.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalizeKeywords, editableVersions } = require('../scripts/store-listing');

describe('store keywords', () => {
  it('ships keywords App Store Connect will accept', () => {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'store', 'keywords.txt'), 'utf8');
    const keywords: string = normalizeKeywords(raw);
    expect(keywords.length).toBeLessThanOrEqual(100);
    expect(keywords.split(',')).toContain('bananagrams');
  });

  it('tidies spacing and drops repeats', () => {
    expect(normalizeKeywords(' word  game , Tiles,tiles,, peel \n')).toBe('word game,Tiles,peel');
  });

  it('refuses an empty list or one over 100 characters', () => {
    expect(() => normalizeKeywords(' , ')).toThrow(/empty/);
    expect(() => normalizeKeywords('x'.repeat(101))).toThrow(/101 characters/);
  });
});

describe('editableVersions', () => {
  const v = (id: string, state: string, platform = 'IOS') => ({
    id,
    attributes: { platform, versionString: id, appVersionState: state },
  });

  it('picks only iOS versions that can still be edited', () => {
    const versions = [
      v('live', 'READY_FOR_DISTRIBUTION'),
      v('review', 'WAITING_FOR_REVIEW'),
      v('next', 'PREPARE_FOR_SUBMISSION'),
      v('fix', 'REJECTED'),
      v('mac', 'PREPARE_FOR_SUBMISSION', 'MAC_OS'),
    ];
    expect(editableVersions(versions).map((x: { id: string }) => x.id)).toEqual(['next', 'fix']);
  });

  it('understands the older appStoreState field', () => {
    expect(editableVersions([{ id: 'old', attributes: { appStoreState: 'PREPARE_FOR_SUBMISSION' } }])).toHaveLength(1);
  });
});

describe('store listing text', () => {
  const md = fs.readFileSync(path.join(__dirname, '..', 'store', 'listing.md'), 'utf8');
  const field = (name: string) => {
    const m = md.match(new RegExp(`<!-- ${name} -->\\n([\\s\\S]*?)\\n<!-- /${name} -->`));
    if (!m) throw new Error(`listing.md has no ${name} block`);
    return m[1].trim();
  };

  it.each([
    ['subtitle', 30],
    ['promo', 170],
    ['description', 4000],
    ['review-notes', 4000],
  ])('keeps the %s within %i characters', (name, max) => {
    const text = field(name);
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(max);
  });

  it('keeps the trademark out of what players read', () => {
    for (const name of ['subtitle', 'promo', 'description']) {
      expect(field(name)).not.toMatch(/bananagram/i);
    }
  });
});
