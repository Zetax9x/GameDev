import { describe, expect, it } from 'vitest';
import { normalizeDate, parseCsv, parseSessionsCsv, toCsv } from '../src/lib/csv';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });
  it('detects semicolon separators (Italian spreadsheets)', () => {
    expect(parseCsv('data;minuti\n01/12/2026;90')).toEqual([
      ['data', 'minuti'],
      ['01/12/2026', '90'],
    ]);
  });
});

describe('toCsv', () => {
  it('escapes cells and neutralises formulas', () => {
    expect(toCsv(['a', 'b'], [['x,y', '=SUM(A1)']])).toBe('a,b\r\n"x,y",\'=SUM(A1)\r\n');
  });
});

describe('normalizeDate', () => {
  it('converts Italian dates', () => {
    expect(normalizeDate('1/12/2026')).toBe('2026-12-01');
    expect(normalizeDate('01.12.26')).toBe('2026-12-01');
    expect(normalizeDate('2026-12-01')).toBe('2026-12-01');
  });
});

describe('parseSessionsCsv', () => {
  it('imports minutes or hours with category aliases', () => {
    const { rows, error } = parseSessionsCsv(
      'Data;Ore;Categoria;Nota\n30/11/2026;1,5;C++;learncpp cap. 1\n01/12/2026;2;CS50;\n',
    );
    expect(error).toBeUndefined();
    expect(rows.map((r) => r.value)).toEqual([
      { date: '2026-11-30', minutes: 90, category: 'cpp', note: 'learncpp cap. 1', link: null },
      { date: '2026-12-01', minutes: 120, category: 'corso', note: null, link: null },
    ]);
  });

  it('reports invalid rows with their line number', () => {
    const { rows } = parseSessionsCsv('date,minutes\n2026-02-30,60\n2026-12-01,0\n2026-12-02,1:30\n');
    expect(rows.map((r) => [r.line, r.ok])).toEqual([
      [2, false],
      [3, false],
      [4, true],
    ]);
    expect(rows[2]?.value?.minutes).toBe(90);
  });

  it('rejects files without the required columns', () => {
    expect(parseSessionsCsv('foo,bar\n1,2').error).toBeDefined();
  });
});
