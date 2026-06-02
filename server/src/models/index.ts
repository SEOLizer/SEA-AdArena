import sequelize from '../config/database';

import User            from './User';
import Campaign        from './Campaign';
import AdGroup         from './AdGroup';
import Keyword         from './Keyword';
import CampaignKeyword from './CampaignKeyword';
import NegativeKeyword from './NegativeKeyword';
import KeywordGroup    from './KeywordGroup';
import KeywordGroupMember from './KeywordGroupMember';
import CompetitorProfile  from './CompetitorProfile';
import AuctionResult   from './AuctionResult';
import HourlyStat      from './HourlyStat';
import SimulationLog   from './SimulationLog';
import Scenario        from './Scenario';

// ── User ↔ Campaign ─────────────────────────────────────────────
User.hasMany(Campaign,  { foreignKey: 'user_id', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Campaign ↔ AdGroup ──────────────────────────────────────────
Campaign.hasMany(AdGroup,  { foreignKey: 'campaign_id', as: 'adGroups', onDelete: 'CASCADE' });
AdGroup.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

// ── AdGroup ↔ CampaignKeyword ───────────────────────────────────
AdGroup.hasMany(CampaignKeyword,  { foreignKey: 'ad_group_id', as: 'campaignKeywords', onDelete: 'CASCADE' });
CampaignKeyword.belongsTo(AdGroup, { foreignKey: 'ad_group_id', as: 'adGroup' });

// ── Keyword ↔ CampaignKeyword ───────────────────────────────────
Keyword.hasMany(CampaignKeyword,  { foreignKey: 'keyword_id', as: 'campaignKeywords' });
CampaignKeyword.belongsTo(Keyword, { foreignKey: 'keyword_id', as: 'keyword' });

// ── Campaign ↔ NegativeKeyword ──────────────────────────────────
Campaign.hasMany(NegativeKeyword,  { foreignKey: 'campaign_id', as: 'negativeKeywords', onDelete: 'CASCADE' });
NegativeKeyword.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

// ── Keyword ↔ KeywordGroupMember ────────────────────────────────
Keyword.hasMany(KeywordGroupMember,  { foreignKey: 'keyword_id', as: 'groupMemberships', onDelete: 'CASCADE' });
KeywordGroupMember.belongsTo(Keyword, { foreignKey: 'keyword_id', as: 'keyword' });

// ── KeywordGroup ↔ KeywordGroupMember ───────────────────────────
KeywordGroup.hasMany(KeywordGroupMember,  { foreignKey: 'group_id', as: 'members', onDelete: 'CASCADE' });
KeywordGroupMember.belongsTo(KeywordGroup, { foreignKey: 'group_id', as: 'group' });

// ── KeywordGroup self-referencing hierarchy ─────────────────────
KeywordGroup.hasMany(KeywordGroup,  { foreignKey: 'parent_group_id', as: 'children' });
KeywordGroup.belongsTo(KeywordGroup, { foreignKey: 'parent_group_id', as: 'parent' });

// ── Campaign ↔ AuctionResult ────────────────────────────────────
Campaign.hasMany(AuctionResult,  { foreignKey: 'campaign_id', as: 'auctionResults', onDelete: 'CASCADE' });
AuctionResult.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });
AuctionResult.belongsTo(Keyword,  { foreignKey: 'keyword_id', as: 'keyword' });

// ── Campaign ↔ HourlyStat ───────────────────────────────────────
Campaign.hasMany(HourlyStat,  { foreignKey: 'campaign_id', as: 'hourlyStats', onDelete: 'CASCADE' });
HourlyStat.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

// ── Campaign ↔ SimulationLog ────────────────────────────────────
Campaign.hasMany(SimulationLog,  { foreignKey: 'campaign_id', as: 'simulationLogs', onDelete: 'CASCADE' });
SimulationLog.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

export {
  sequelize,
  User,
  Campaign,
  AdGroup,
  Keyword,
  CampaignKeyword,
  NegativeKeyword,
  KeywordGroup,
  KeywordGroupMember,
  CompetitorProfile,
  AuctionResult,
  HourlyStat,
  SimulationLog,
  Scenario,
};
