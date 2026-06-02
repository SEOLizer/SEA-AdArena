import 'dotenv/config';
import { sequelize, User, Campaign, AdGroup, Keyword, CampaignKeyword,
         KeywordGroup, KeywordGroupMember, CompetitorProfile } from '../index';

afterAll(async () => {
  await sequelize.close();
});

describe('Database connection', () => {
  it('authenticate() succeeds', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  it('sync({ alter: false }) succeeds — schema already matches', async () => {
    await expect(sequelize.sync({ alter: false })).resolves.not.toThrow();
  });
});

describe('Model exports', () => {
  it('all 13 models are exported from index', () => {
    const { User, Campaign, AdGroup, Keyword, CampaignKeyword,
            NegativeKeyword, KeywordGroup, KeywordGroupMember,
            CompetitorProfile, AuctionResult, HourlyStat,
            SimulationLog, Scenario } = require('../index');

    for (const [name, model] of Object.entries({
      User, Campaign, AdGroup, Keyword, CampaignKeyword,
      NegativeKeyword, KeywordGroup, KeywordGroupMember,
      CompetitorProfile, AuctionResult, HourlyStat,
      SimulationLog, Scenario,
    })) {
      expect(model).toBeDefined(); // ${name} should be a Sequelize Model
      expect(typeof (model as any).findAll).toBe('function');
    }
  });
});

describe('Associations — eager loading', () => {
  it('Campaign.findAll includes AdGroups', async () => {
    const campaigns = await Campaign.findAll({ include: [{ model: AdGroup, as: 'adGroups' }] });
    expect(Array.isArray(campaigns)).toBe(true);
    // Each campaign should have an adGroups array (even if empty)
    campaigns.forEach(c => expect(Array.isArray((c as any).adGroups)).toBe(true));
  });

  it('User.findAll includes Campaigns', async () => {
    const users = await User.findAll({ include: [{ model: Campaign, as: 'campaigns' }] });
    expect(Array.isArray(users)).toBe(true);
    users.forEach(u => expect(Array.isArray((u as any).campaigns)).toBe(true));
  });

  it('CampaignKeyword includes Keyword and AdGroup', async () => {
    const cks = await CampaignKeyword.findAll({
      include: [
        { model: Keyword,  as: 'keyword'  },
        { model: AdGroup,  as: 'adGroup'  },
      ],
    });
    expect(Array.isArray(cks)).toBe(true);
  });

  it('KeywordGroup hierarchy: parent and children', async () => {
    const groups = await KeywordGroup.findAll({
      include: [
        { model: KeywordGroup, as: 'parent' },
        { model: KeywordGroup, as: 'children' },
      ],
    });
    expect(Array.isArray(groups)).toBe(true);
  });

  it('CompetitorProfile has 3 seeded rows', async () => {
    const competitors = await CompetitorProfile.findAll();
    expect(competitors).toHaveLength(3);
    const names = competitors.map(c => c.name);
    expect(names).toContain('Der Riese');
    expect(names).toContain('Der Discounter');
    expect(names).toContain('Der Smarte');
  });
});
