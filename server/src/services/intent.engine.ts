export type IntentCategory = 'transactional' | 'commercial' | 'navigational' | 'informational';
export type QsCtrComponent = 'below' | 'average' | 'above';

interface IntentConfig {
  cpcFactor: number;
  ctrFactor: number;
  cvr: number;
  qsCtr: QsCtrComponent;
}

export const INTENT_CONFIG: Record<IntentCategory, IntentConfig> = {
  transactional: { cpcFactor: 1.4, ctrFactor: 1.2,  cvr: 0.035, qsCtr: 'above'   },
  commercial:    { cpcFactor: 1.1, ctrFactor: 1.05, cvr: 0.008, qsCtr: 'average' },
  navigational:  { cpcFactor: 0.9, ctrFactor: 1.3,  cvr: 0.005, qsCtr: 'above'   },
  informational: { cpcFactor: 0.8, ctrFactor: 0.9,  cvr: 0.002, qsCtr: 'below'   },
};

export function getIntentCpcFactor(intent: IntentCategory): number {
  return INTENT_CONFIG[intent].cpcFactor;
}

export function getIntentCtrFactor(intent: IntentCategory): number {
  return INTENT_CONFIG[intent].ctrFactor;
}

export function getIntentCvr(intent: IntentCategory): number {
  return INTENT_CONFIG[intent].cvr;
}

export function getIntentQsCtrComponent(intent: IntentCategory): QsCtrComponent {
  return INTENT_CONFIG[intent].qsCtr;
}
