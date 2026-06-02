import {
  getIntentCpcFactor,
  getIntentCtrFactor,
  getIntentCvr,
  getIntentQsCtrComponent,
} from '../intent.engine';

describe('getIntentCpcFactor', () => {
  it('transactional → 1.4',   () => expect(getIntentCpcFactor('transactional')).toBe(1.4));
  it('commercial    → 1.1',   () => expect(getIntentCpcFactor('commercial')).toBe(1.1));
  it('navigational  → 0.9',   () => expect(getIntentCpcFactor('navigational')).toBe(0.9));
  it('informational → 0.8',   () => expect(getIntentCpcFactor('informational')).toBe(0.8));
});

describe('getIntentCtrFactor', () => {
  it('transactional → 1.2',   () => expect(getIntentCtrFactor('transactional')).toBe(1.2));
  it('commercial    → 1.05',  () => expect(getIntentCtrFactor('commercial')).toBe(1.05));
  it('navigational  → 1.3',   () => expect(getIntentCtrFactor('navigational')).toBe(1.3));
  it('informational → 0.9',   () => expect(getIntentCtrFactor('informational')).toBe(0.9));
});

describe('getIntentCvr', () => {
  it('transactional → 0.035', () => expect(getIntentCvr('transactional')).toBe(0.035));
  it('commercial    → 0.008', () => expect(getIntentCvr('commercial')).toBe(0.008));
  it('navigational  → 0.005', () => expect(getIntentCvr('navigational')).toBe(0.005));
  it('informational → 0.002', () => expect(getIntentCvr('informational')).toBe(0.002));
});

describe('getIntentQsCtrComponent', () => {
  it('transactional → above',   () => expect(getIntentQsCtrComponent('transactional')).toBe('above'));
  it('commercial    → average', () => expect(getIntentQsCtrComponent('commercial')).toBe('average'));
  it('navigational  → above',   () => expect(getIntentQsCtrComponent('navigational')).toBe('above'));
  it('informational → below',   () => expect(getIntentQsCtrComponent('informational')).toBe('below'));
});
