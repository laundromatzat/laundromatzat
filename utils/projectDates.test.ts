import { describe, expect, it } from 'vitest';
import { compareProjectsByDateDesc, parseYearMonth } from './projectDates';

describe('parseYearMonth', () => {
  it('parses MM/YYYY strings', () => {
    expect(parseYearMonth('07/2025')).toBe(202507);
  });

  it('parses YYYY-MM strings', () => {
    expect(parseYearMonth('2024-11')).toBe(202411);
  });

  it('parses YYYY strings by defaulting to January', () => {
    expect(parseYearMonth('2023')).toBe(202301);
  });

  it('handles extraneous words gracefully', () => {
    expect(parseYearMonth('around 05/2024')).toBe(202405);
  });

  it('returns null for invalid input', () => {
    expect(parseYearMonth('banana')).toBeNull();
  });
});

describe('compareProjectsByDateDesc', () => {
  it('orders projects from newest to oldest and places undated items last', () => {
    const projects = [
      { date: '01/2023' },
      { date: '07/2025' },
      { date: '2019' },
      { date: null },
    ];

    const sorted = [...projects].sort(compareProjectsByDateDesc);

    expect(sorted.map(project => project.date)).toEqual([
      '07/2025',
      '01/2023',
      '2019',
      null,
    ]);
  });
});
