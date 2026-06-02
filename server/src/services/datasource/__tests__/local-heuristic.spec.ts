import {
  classifyIntent,
  estimateSearchVolume,
  estimateBaseCpc,
  getCompetitionLevel,
  getDefaultSeasonality,
} from '../local-heuristic';

describe('classifyIntent — Abnahmekriterien', () => {
  it('"sneaker kaufen"              → transactional',  () =>
    expect(classifyIntent('sneaker kaufen')).toBe('transactional'));
  it('"was ist ein qualitätsfaktor" → informational',  () =>
    expect(classifyIntent('was ist ein qualitätsfaktor')).toBe('informational'));
  it('"nike.de"                     → navigational',   () =>
    expect(classifyIntent('nike.de')).toBe('navigational'));
  it('"laufschuhe test"             → commercial',     () =>
    expect(classifyIntent('laufschuhe test')).toBe('commercial'));
  it('"schuhe" (kein Signal)        → commercial',     () =>
    expect(classifyIntent('schuhe')).toBe('commercial'));
});

describe('classifyIntent — Zusatzfälle', () => {
  it('"sneaker kaufen vergleich" → transactional gewinnt (höheres Gewicht)', () =>
    expect(classifyIntent('sneaker kaufen vergleich')).toBe('transactional'));
  it('"anleitung ratgeber"       → informational',  () =>
    expect(classifyIntent('anleitung ratgeber')).toBe('informational'));
  it('Großschreibung ignorieren',                   () =>
    expect(classifyIntent('SNEAKER KAUFEN')).toBe('transactional'));
});

describe('estimateSearchVolume', () => {
  it('1 Wort  → 8000',  () => expect(estimateSearchVolume('sneaker')).toBe(8000));
  it('2 Wörter → 3500', () => expect(estimateSearchVolume('sneaker kaufen')).toBe(3500));
  it('3 Wörter → 400',  () => expect(estimateSearchVolume('sneaker kaufen günstig')).toBe(400));
  it('4+ Wörter → 80',  () =>
    expect(estimateSearchVolume('sneaker kaufen online günstig bestellen')).toBe(80));
});

describe('estimateBaseCpc', () => {
  it('transactional, 2 Wörter → 1.40', () =>
    expect(estimateBaseCpc('transactional', 2)).toBe(1.40));
  it('transactional, 4 Wörter → 0.85', () =>
    expect(estimateBaseCpc('transactional', 4)).toBe(0.85));
  it('informational, 2 Wörter → 0.80', () =>
    expect(estimateBaseCpc('informational', 2)).toBe(0.80));
  it('commercial, 4 Wörter → 0.65',    () =>
    expect(estimateBaseCpc('commercial', 4)).toBeCloseTo(0.65, 2));
});

describe('getCompetitionLevel', () => {
  it('transactional → high',   () => expect(getCompetitionLevel('transactional')).toBe('high'));
  it('commercial    → medium', () => expect(getCompetitionLevel('commercial')).toBe('medium'));
  it('navigational  → low',    () => expect(getCompetitionLevel('navigational')).toBe('low'));
  it('informational → low',    () => expect(getCompetitionLevel('informational')).toBe('low'));
});

describe('getDefaultSeasonality', () => {
  it('gibt Array mit Länge 12 zurück',      () =>
    expect(getDefaultSeasonality()).toHaveLength(12));
  it('alle Werte sind 1.0',                 () =>
    expect(getDefaultSeasonality().every(v => v === 1.0)).toBe(true));
});
