import 'dotenv/config';
import { sequelize, User, Campaign, AdGroup, CampaignKeyword, Keyword,
         AuctionResult, HourlyStat, SimulationLog } from '../../models/index';
import { runSimulation, calculateQualityScore } from '../auction.engine';

// ── Shared test fixtures ───────────────────────────────────────────────────

const TS = Date.now();
let userId: number;
let keywordId: number;

async function createCampaign(opts: {
  name: string;
  monthlyBudget: number;
  maxCpc: number;
  qsExpectedCtr: 'below' | 'average' | 'above';
  qsAdRelevance: 'below' | 'average' | 'above';
  lpExperience: 'poor' | 'average' | 'excellent';
}) {
  const campaign = await Campaign.create({
    user_id: userId,
    name: opts.name,
    monthly_budget: opts.monthlyBudget,
    daily_budget: opts.monthlyBudget / 30.4,
    bid_strategy: 'manual_cpc',
    network: 'search',
    status: 'paused',
  });

  const adGroup = await AdGroup.create({
    campaign_id: campaign.id,
    name: 'Test AdGroup',
    max_cpc: opts.maxCpc,
    qs_expected_ctr: opts.qsExpectedCtr,
    qs_ad_relevance: opts.qsAdRelevance,
    landing_page_experience: opts.lpExperience,
  });

  await CampaignKeyword.create({
    ad_group_id: adGroup.id,
    keyword_id: keywordId,
    match_type: 'phrase',
  });

  return campaign;
}

async function cleanupCampaign(campaignId: number) {
  await AuctionResult.destroy({ where: { campaign_id: campaignId } });
  await HourlyStat.destroy({ where: { campaign_id: campaignId } });
  await SimulationLog.destroy({ where: { campaign_id: campaignId } });
  const adGroups = await AdGroup.findAll({ where: { campaign_id: campaignId } });
  for (const ag of adGroups) {
    await CampaignKeyword.destroy({ where: { ad_group_id: ag.id } });
  }
  await AdGroup.destroy({ where: { campaign_id: campaignId } });
  await Campaign.destroy({ where: { id: campaignId } });
}

beforeAll(async () => {
  // Create shared test user and keyword
  const user = await User.create({
    username: `auc_test_${TS}`,
    email: `auc_test_${TS}@sea-test.local`,
    password_hash: 'x',
    role: 'trainee',
  });
  userId = user.id;

  const keyword = await Keyword.create({
    keyword: `testkeyword_${TS}`,
    monthly_search_volume: 500000,  // enough for reliable clicks at position 3
    base_cpc: 1.00,
    intent_category: 'commercial',
    competition_level: 'medium',
    seasonality_factors: Array(12).fill(1.0),
  });
  keywordId = keyword.id;
});

afterAll(async () => {
  await Keyword.destroy({ where: { id: keywordId } });
  await User.destroy({ where: { id: userId } });
  await sequelize.close();
});

// ── Unit: calculateQualityScore ────────────────────────────────────────────

describe('calculateQualityScore', () => {
  it('alle above → 10',   () => expect(calculateQualityScore('above',   'above',   'excellent')).toBe(10));
  it('alle average → 5',  () => expect(calculateQualityScore('average', 'average', 'average'  )).toBe(5));
  it('alle below → 2',    () => expect(calculateQualityScore('below',   'below',   'poor'      )).toBe(2));
  it('gemischt → gerundet', () => {
    // (10 + 5 + 2) / 3 = 5.67 → round → 6
    expect(calculateQualityScore('above', 'average', 'poor')).toBe(6);
  });
});

// ── Integration: runSimulation ─────────────────────────────────────────────

describe('runSimulation — Basis', () => {
  let campaignId: number;

  beforeAll(async () => {
    const c = await createCampaign({
      name: `Basis_${TS}`,
      monthlyBudget: 300,       // 300 / 30.4 ≈ 9.87 €/Tag
      maxCpc: 1.50,
      qsExpectedCtr: 'average',
      qsAdRelevance: 'average',
      lpExperience: 'average',
    });
    campaignId = c.id;
  });

  afterAll(() => cleanupCampaign(campaignId));

  it('läuft ohne Fehler und gibt SimulationSummary zurück', async () => {
    const summary = await runSimulation(campaignId);
    expect(summary.campaignId).toBe(campaignId);
    expect(['ended', 'budget_exhausted']).toContain(summary.status);
    expect(summary.hoursSimulated).toBeGreaterThan(0);
  });

  it('auction_results enthält Player- und Competitor-Einträge', async () => {
    const results = await AuctionResult.findAll({ where: { campaign_id: campaignId } });
    expect(results.length).toBeGreaterThan(0);

    const playerResults     = results.filter(r => r.bidder_type === 'player');
    const competitorResults = results.filter(r => r.bidder_type === 'competitor');
    expect(playerResults.length).toBeGreaterThan(0);
    expect(competitorResults.length).toBeGreaterThan(0);
  });

  it('hourly_stats sind geschrieben', async () => {
    const stats = await HourlyStat.findAll({ where: { campaign_id: campaignId } });
    expect(stats.length).toBeGreaterThan(0);
  });

  it('campaigns-Totals wurden aktualisiert', async () => {
    const c = await Campaign.findByPk(campaignId);
    expect(['ended', 'budget_exhausted']).toContain(c!.status);
    expect(Number(c!.cost)).toBeGreaterThan(0);
  });
});

// ── Integration: Budget-Erschöpfung ───────────────────────────────────────

describe('runSimulation — Budget-Erschöpfung', () => {
  let campaignId: number;

  beforeAll(async () => {
    // Sehr kleines Budget → wird in erster aktiver Stunde erschöpft
    const c = await createCampaign({
      name: `BudgetTest_${TS}`,
      monthlyBudget: 0.50,     // 0.50 / 30.4 ≈ 0.016 €/Tag
      maxCpc: 1.50,
      qsExpectedCtr: 'average',
      qsAdRelevance: 'average',
      lpExperience: 'average',
    });
    campaignId = c.id;
  });

  afterAll(() => cleanupCampaign(campaignId));

  it('status wird auf budget_exhausted gesetzt', async () => {
    const summary = await runSimulation(campaignId);
    expect(summary.status).toBe('budget_exhausted');
    expect(summary.budgetExhaustedAt).not.toBeNull();
  });

  it('simulation_log hat budget_exhausted Eintrag', async () => {
    const logs = await SimulationLog.findAll({ where: { campaign_id: campaignId } });
    const exhaustionLog = logs.find(l => l.event_type === 'budget_exhausted');
    expect(exhaustionLog).toBeDefined();
    expect(exhaustionLog!.message).toContain('aufgebraucht');
  });
});

// ── Integration: QS-Hebel (Kerntest) ──────────────────────────────────────

describe('runSimulation — QS 10 zahlt weniger CPC als QS 5', () => {
  let campaignHighId: number;
  let campaignLowId:  number;

  beforeAll(async () => {
    // Bid=1.00 → beide Kampagnen landen hinter Der Smarte (ad_rank ≈12.9)
    // QS=10: 1.00*1.1*10=11.0 < 12.9  → Position 3
    // QS=5:  1.00*1.1*5 = 5.5 < 12.9  → Position 3
    // In Stunden mit Der Discounter (06-10):
    //   paid_cpc_10 = Discounter.rank/10+0.01 ≈ 0.21
    //   paid_cpc_5  = Discounter.rank/5 +0.01 ≈ 0.41
    //   → QS=10 zahlt weniger ✓
    const high = await createCampaign({
      name: `QShigh_${TS}`,
      monthlyBudget: 9999,
      maxCpc: 1.00,            // hält beide hinter Smarte
      qsExpectedCtr: 'above',
      qsAdRelevance: 'above',
      lpExperience:  'excellent',   // QS = 10
    });
    const low = await createCampaign({
      name: `QSlow_${TS}`,
      monthlyBudget: 9999,
      maxCpc: 1.00,
      qsExpectedCtr: 'average',
      qsAdRelevance: 'average',
      lpExperience:  'average',     // QS = 5
    });
    campaignHighId = high.id;
    campaignLowId  = low.id;
  });

  afterAll(async () => {
    await cleanupCampaign(campaignHighId);
    await cleanupCampaign(campaignLowId);
  });

  it('QS-10-Kampagne hat niedrigeren Ø-CPC als QS-5-Kampagne', async () => {
    const [summaryHigh, summaryLow] = await Promise.all([
      runSimulation(campaignHighId),
      runSimulation(campaignLowId),
    ]);

    // Both must have clicks for the comparison to be meaningful
    expect(summaryHigh.totalClicks).toBeGreaterThan(0);
    expect(summaryLow.totalClicks).toBeGreaterThan(0);

    const avgCpcHigh = summaryHigh.totalCost / summaryHigh.totalClicks;
    const avgCpcLow  = summaryLow.totalCost  / summaryLow.totalClicks;

    console.log(`QS=10 avg CPC: ${avgCpcHigh.toFixed(4)} €`);
    console.log(`QS=5  avg CPC: ${avgCpcLow.toFixed(4)} €`);

    expect(avgCpcHigh).toBeLessThan(avgCpcLow);
  });
});
