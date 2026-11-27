import { describe, expect, it } from 'vitest';
import { preferredLang } from '../src/pages/index';

describe('preferredLang', () => {
  it('sends Italian browsers to /it/', () => {
    expect(preferredLang('it-IT,it;q=0.9,en;q=0.8')).toBe('it');
    expect(preferredLang('it')).toBe('it');
  });
  it('defaults to English', () => {
    expect(preferredLang(null)).toBe('en');
    expect(preferredLang('de-DE,de;q=0.9')).toBe('en');
    expect(preferredLang('en-US,it;q=0.5')).toBe('en');
  });
  it('respects q values', () => {
    expect(preferredLang('en;q=0.4,it;q=0.8')).toBe('it');
  });
});
