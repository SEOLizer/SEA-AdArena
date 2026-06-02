export type IntentCategory = 'transactional' | 'commercial' | 'navigational' | 'informational';
export type CompetitionLevel = 'low' | 'medium' | 'high';

const SIGNALS: Record<IntentCategory, string[]> = {
  transactional: [
    'kaufen', 'bestellen', 'kauf', 'order', 'shop', 'günstig', 'preis',
    'rabatt', 'angebot', 'sale', 'lieferung', 'online bestellen',
  ],
  commercial: [
    'vergleich', 'test', 'bewertung', 'erfahrung', 'alternativ', 'beste',
    'top', '2025', '2026', 'empfehlung',
  ],
  navigational: [
    'marke', '.de', 'login', 'homepage', 'seite', 'anmelden', 'registrieren',
  ],
  informational: [
    'was ist', 'anleitung', 'wie funktioniert', 'ratgeber', 'erklärung',
    'kurs', 'tutorial', 'definition', 'bedeutung', 'wiki', 'wie ',
  ],
};

const INTENT_WEIGHTS: Record<IntentCategory, number> = {
  transactional: 3,
  commercial:    2,
  navigational:  2,
  informational: 1,
};

// Priorität bei Gleichstand
const INTENT_PRIORITY: IntentCategory[] = [
  'transactional', 'commercial', 'navigational', 'informational',
];

function countWords(keyword: string): number {
  return keyword.trim().split(/\s+/).length;
}

export function classifyIntent(keyword: string): IntentCategory {
  const lower = keyword.toLowerCase();
  const scores: Record<IntentCategory, number> = {
    transactional: 0, commercial: 0, navigational: 0, informational: 0,
  };

  for (const intent of INTENT_PRIORITY) {
    for (const signal of SIGNALS[intent]) {
      if (lower.includes(signal)) {
        scores[intent] += INTENT_WEIGHTS[intent];
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'commercial';

  // Bei Gleichstand: höhere Priorität gewinnt
  for (const intent of INTENT_PRIORITY) {
    if (scores[intent] === maxScore) return intent;
  }

  return 'commercial';
}

export function estimateSearchVolume(keyword: string): number {
  const words = countWords(keyword);
  if (words === 1) return 8000;
  if (words === 2) return 3500;
  if (words === 3) return 400;
  return 80;
}

export function estimateBaseCpc(intent: IntentCategory, wordCount: number): number {
  const intentFactors: Record<IntentCategory, number> = {
    transactional: 1.4,
    commercial:    1.1,
    navigational:  0.9,
    informational: 0.8,
  };
  const longTailFactor = wordCount >= 4 ? 0.6 : 1.0;
  const raw = 1.00 * intentFactors[intent] * longTailFactor;
  return Math.round(raw * 20) / 20;
}

export function getCompetitionLevel(intent: IntentCategory): CompetitionLevel {
  const map: Record<IntentCategory, CompetitionLevel> = {
    transactional: 'high',
    commercial:    'medium',
    navigational:  'low',
    informational: 'low',
  };
  return map[intent];
}

export function getDefaultSeasonality(): number[] {
  return Array(12).fill(1.0);
}
