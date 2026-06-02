import 'dotenv/config';
import {
  Campaign, AdGroup, CampaignKeyword, Keyword, NegativeKeyword,
  AuctionResult, HourlyStat, SimulationLog, CompetitorProfile,
} from '../models/index';
import type { MatchType } from '../models/CampaignKeyword';
import type { IntentCategory } from '../models/Keyword';
import type { QsComponent, LandingPageExperience } from '../models/AdGroup';
import type { CampaignStatus } from '../models/Campaign';
import {
  getIntentCpcFactor,
  getIntentCtrFactor,
  getIntentCvr,
} from './intent.engine';

// ── Constants ──────────────────────────────────────────────────────────────

const HOURLY_TRAFFIC = [
  0.010, 0.005, 0.005, 0.010, 0.020, 0.030,
  0.050, 0.060, 0.060, 0.050, 0.050, 0.050,
  0.050, 0.050, 0.040, 0.040, 0.050, 0.060,
  0.070, 0.080, 0.090, 0.080, 0.060, 0.030,
];

const MATCH_IMPRESSION_FACTOR: Record<MatchType, number> = {
  broad: 1.0, phrase: 0.65, exact: 0.35,
};

const MATCH_CPC_FACTOR: Record<MatchType, number> = {
  broad: 1.2, phrase: 1.0, exact: 0.9,
};

const POSITION_IMPRESSION_SHARE: Record<number, number> = {
  1: 0.45, 2: 0.25, 3: 0.125, 4: 0.08,
};

const BASE_CTR_BY_POSITION: Record<number, number> = {
  1: 0.10, 2: 0.06, 3: 0.03, 4: 0.015,
};

// midpoints per QS component bucket — 'above' uses 10 so all-above yields QS=10
const QS_MIDPOINTS: Record<QsComponent, number> = {
  below: 2, average: 5, above: 10,
};

const LP_TO_QS: Record<LandingPageExperience, QsComponent> = {
  poor: 'below', average: 'average', excellent: 'above',
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface SimulationSummary {
  campaignId: number;
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgPosition: number;
  hoursSimulated: number;
  budgetExhaustedAt: number | null;
  status: CampaignStatus;
}

interface BidderInfo {
  type: 'player' | 'competitor';
  id: number;
  effectiveCpc: number;
  adRank: number;
  qualityScore: number;
}

interface KeywordEntry {
  keywordId: number;
  matchType: MatchType;
  maxCpc: number;
  qualityScore: number;
  intent: IntentCategory;
  monthlySearchVolume: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function calculateQualityScore(
  qs_expected_ctr: QsComponent,
  qs_ad_relevance: QsComponent,
  landing_page_experience: LandingPageExperience,
): number {
  const lpQs = LP_TO_QS[landing_page_experience];
  const sum  = QS_MIDPOINTS[qs_expected_ctr]
             + QS_MIDPOINTS[qs_ad_relevance]
             + QS_MIDPOINTS[lpQs];
  return Math.round(sum / 3);
}

function positionShare(pos: number): number {
  return POSITION_IMPRESSION_SHARE[Math.min(pos, 4)] ?? 0.05;
}

function baseCtr(pos: number): number {
  return BASE_CTR_BY_POSITION[Math.min(pos, 4)] ?? 0.01;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Main ───────────────────────────────────────────────────────────────────

export async function runSimulation(campaignId: number): Promise<SimulationSummary> {

  // 1. Load campaign with full hierarchy
  const campaign = await Campaign.findByPk(campaignId, {
    include: [{
      model: AdGroup,
      as: 'adGroups',
      include: [{
        model: CampaignKeyword,
        as: 'campaignKeywords',
        include: [{ model: Keyword, as: 'keyword' }],
      }],
    }],
  });

  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const negatives = await NegativeKeyword.findAll({ where: { campaign_id: campaignId } });
  const negativeSet = new Set(negatives.map(n => n.keyword.toLowerCase()));

  const competitors = await CompetitorProfile.findAll();

  // 2. Clear previous simulation data
  await AuctionResult.destroy({ where: { campaign_id: campaignId } });
  await HourlyStat.destroy({ where: { campaign_id: campaignId } });
  await SimulationLog.destroy({ where: { campaign_id: campaignId } });

  // 3. Setup
  const dailyBudget   = Number(campaign.monthly_budget) / 30.4;
  let budgetRemaining = dailyBudget;
  let budgetExhaustedAt: number | null = null;

  const competitorBudgets = new Map<number, number>();
  for (const c of competitors) {
    competitorBudgets.set(c.id, c.daily_budget !== null ? Number(c.daily_budget) : Infinity);
  }

  await campaign.update({
    status: 'running',
    start_date: new Date().toISOString().split('T')[0],
  });

  // Flatten all keywords across ad groups
  const keywordEntries: KeywordEntry[] = [];
  const adGroups = (campaign as any).adGroups as AdGroup[];

  for (const ag of adGroups) {
    const qs  = calculateQualityScore(ag.qs_expected_ctr, ag.qs_ad_relevance, ag.landing_page_experience);
    const cks = (ag as any).campaignKeywords as CampaignKeyword[];

    for (const ck of cks) {
      const kw = (ck as any).keyword as Keyword;
      if (negativeSet.has(kw.keyword.toLowerCase())) continue;

      const maxCpc = ck.max_cpc_override !== null
        ? Number(ck.max_cpc_override)
        : Number(ag.max_cpc);

      keywordEntries.push({
        keywordId:            kw.id,
        matchType:            ck.match_type,
        maxCpc,
        qualityScore:         qs,
        intent:               kw.intent_category,
        monthlySearchVolume:  kw.monthly_search_volume,
      });
    }
  }

  // Running totals
  let totalImpressions     = 0;
  let totalClicks          = 0;
  let totalCost            = 0;
  let totalConversions     = 0;
  let weightedPositionSum  = 0;
  let hoursSimulated       = 0;

  // 4. 24-hour loop
  for (let h = 0; h < 24; h++) {
    if (budgetRemaining <= 0) break;
    hoursSimulated = h + 1;

    const hourResults: Array<Record<string, unknown>> = [];
    let hourImpressions = 0;
    let hourClicks      = 0;
    let hourCost        = 0;
    let hourConversions = 0;
    let hourWeightedPos = 0;

    for (const entry of keywordEntries) {
      const dailyVolume  = entry.monthlySearchVolume / 30.4;
      const hourlyVolume = dailyVolume * HOURLY_TRAFFIC[h];

      const intentCpcFactor = getIntentCpcFactor(entry.intent);
      const playerEffCpc    = entry.maxCpc * MATCH_CPC_FACTOR[entry.matchType] * intentCpcFactor;
      const playerAdRank    = playerEffCpc * entry.qualityScore;

      // Build bidder list
      const bidders: BidderInfo[] = [{
        type: 'player', id: campaign.user_id,
        effectiveCpc: playerEffCpc, adRank: playerAdRank, qualityScore: entry.qualityScore,
      }];

      for (const c of competitors) {
        if (c.active_hours_start > h || c.active_hours_end < h) continue;
        if ((competitorBudgets.get(c.id) ?? 0) <= 0) continue;

        const compEffCpc = Number(c.base_bid) * intentCpcFactor;
        bidders.push({
          type: 'competitor', id: c.id,
          effectiveCpc: compEffCpc,
          adRank: compEffCpc * c.quality_score,
          qualityScore: c.quality_score,
        });
      }

      // Sort by ad_rank DESC, stable on id for ties
      bidders.sort((a, b) => b.adRank - a.adRank || a.id - b.id);

      const playerIdx  = bidders.findIndex(b => b.type === 'player');
      const playerPos  = Math.min(playerIdx + 1, 4);

      // Discount CPC formula
      let paidCpc: number;
      if (playerIdx < bidders.length - 1) {
        const loser = bidders[playerIdx + 1];
        paidCpc = (loser.adRank / entry.qualityScore) + 0.01;
      } else {
        paidCpc = playerEffCpc;
      }
      paidCpc = Math.min(paidCpc, entry.maxCpc);

      const impressions = Math.floor(
        hourlyVolume * MATCH_IMPRESSION_FACTOR[entry.matchType] * positionShare(playerPos),
      );
      const ctr         = baseCtr(playerPos) * getIntentCtrFactor(entry.intent);
      const clicks      = Math.floor(impressions * ctr);
      const cost        = clicks * paidCpc;
      const conversions = Math.floor(clicks * getIntentCvr(entry.intent));

      // Player auction result
      hourResults.push({
        campaign_id: campaignId, keyword_id: entry.keywordId, hour: h,
        bidder_type: 'player', bidder_id: campaign.user_id,
        ad_rank: round2(playerAdRank), impressions, clicks,
        cost: round2(cost), avg_position: playerPos,
      });

      // Competitor results
      for (let idx = 0; idx < bidders.length; idx++) {
        const b = bidders[idx];
        if (b.type !== 'competitor') continue;

        const compPos        = Math.min(idx + 1, 4);
        const compImpressions = Math.floor(hourlyVolume * positionShare(compPos));
        const compClicks      = Math.floor(compImpressions * baseCtr(compPos));
        const compCost        = compClicks * b.effectiveCpc;

        hourResults.push({
          campaign_id: campaignId, keyword_id: entry.keywordId, hour: h,
          bidder_type: 'competitor', bidder_id: b.id,
          ad_rank: round2(b.adRank), impressions: compImpressions, clicks: compClicks,
          cost: round2(compCost), avg_position: compPos,
        });

        const prev = competitorBudgets.get(b.id) ?? Infinity;
        if (prev !== Infinity) competitorBudgets.set(b.id, prev - compCost);
      }

      hourImpressions += impressions;
      hourClicks      += clicks;
      hourCost        += cost;
      hourConversions += conversions;
      hourWeightedPos += impressions * playerPos;
    }

    // Deduct budget
    budgetRemaining -= hourCost;
    const budgetAfter = Math.max(0, budgetRemaining);

    // Persist hour results
    if (hourResults.length > 0) {
      await AuctionResult.bulkCreate(hourResults as any);
    }

    const hourAvgPos = hourImpressions > 0
      ? Math.round((hourWeightedPos / hourImpressions) * 10) / 10
      : 0;

    await HourlyStat.upsert({
      campaign_id: campaignId, hour: h,
      impressions: hourImpressions, clicks: hourClicks,
      cost: round2(hourCost), avg_position: hourAvgPos,
      budget_remaining: round2(budgetAfter),
      conversions: hourConversions,
    } as any);

    totalImpressions    += hourImpressions;
    totalClicks         += hourClicks;
    totalCost           += hourCost;
    totalConversions    += hourConversions;
    weightedPositionSum += hourWeightedPos;

    // Log budget exhaustion (first time only)
    if (budgetRemaining <= 0 && budgetExhaustedAt === null) {
      budgetExhaustedAt = h;
      await SimulationLog.create({
        campaign_id: campaignId, hour: h,
        event_type: 'budget_exhausted',
        message:    `Tagesbudget von ${dailyBudget.toFixed(2)} € wurde in Stunde ${h} aufgebraucht.`,
      });
    }
  }

  // 5. Update campaign totals
  const finalAvgPos    = totalImpressions > 0
    ? Math.round((weightedPositionSum / totalImpressions) * 10) / 10
    : 0;
  const finalStatus: CampaignStatus = budgetExhaustedAt !== null ? 'budget_exhausted' : 'ended';
  const roundedCost    = round2(totalCost);

  await campaign.update({
    status:              finalStatus,
    impressions:         totalImpressions,
    clicks:              totalClicks,
    cost:                roundedCost,
    conversions:         totalConversions,
    avg_position:        finalAvgPos,
    budget_exhausted_at: budgetExhaustedAt !== null
      ? `${String(budgetExhaustedAt).padStart(2, '0')}:00:00`
      : null,
  });

  return {
    campaignId,
    totalImpressions,
    totalClicks,
    totalCost: roundedCost,
    totalConversions,
    avgPosition: finalAvgPos,
    hoursSimulated,
    budgetExhaustedAt,
    status: finalStatus,
  };
}
