import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type CampaignStatus = 'running' | 'paused' | 'budget_exhausted' | 'ended';
export type BidStrategy    = 'manual_cpc' | 'maximize_conversions';
export type CampaignNetwork = 'search' | 'search_display';

export interface CampaignAttributes {
  id: number;
  user_id: number;
  name: string;
  status: CampaignStatus;
  daily_budget: number;
  monthly_budget: number;
  bid_strategy: BidStrategy;
  network: CampaignNetwork;
  start_date: string | null;
  budget_exhausted_at: string | null;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  avg_position: number;
  created_at?: Date;
}

export interface CampaignCreationAttributes
  extends Optional<CampaignAttributes,
    'id' | 'status' | 'daily_budget' | 'bid_strategy' | 'network' |
    'start_date' | 'budget_exhausted_at' | 'impressions' | 'clicks' |
    'cost' | 'conversions' | 'avg_position' | 'created_at'> {}

class Campaign
  extends Model<CampaignAttributes, CampaignCreationAttributes>
  implements CampaignAttributes
{
  declare id: number;
  declare user_id: number;
  declare name: string;
  declare status: CampaignStatus;
  declare daily_budget: number;
  declare monthly_budget: number;
  declare bid_strategy: BidStrategy;
  declare network: CampaignNetwork;
  declare start_date: string | null;
  declare budget_exhausted_at: string | null;
  declare impressions: number;
  declare clicks: number;
  declare cost: number;
  declare conversions: number;
  declare avg_position: number;
  declare created_at: Date;
}

Campaign.init(
  {
    id:                  { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name:                { type: DataTypes.STRING(200), allowNull: false },
    status:              { type: DataTypes.ENUM('running','paused','budget_exhausted','ended'), allowNull: false, defaultValue: 'paused' },
    daily_budget:        { type: DataTypes.DECIMAL(8,2),  allowNull: false, defaultValue: 0 },
    monthly_budget:      { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    bid_strategy:        { type: DataTypes.ENUM('manual_cpc','maximize_conversions'), allowNull: false, defaultValue: 'manual_cpc' },
    network:             { type: DataTypes.ENUM('search','search_display'), allowNull: false, defaultValue: 'search' },
    start_date:          { type: DataTypes.DATEONLY, allowNull: true },
    budget_exhausted_at: { type: DataTypes.TIME, allowNull: true },
    impressions:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    clicks:              { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    cost:                { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    conversions:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    avg_position:        { type: DataTypes.DECIMAL(3,1),  allowNull: false, defaultValue: 0 },
    created_at:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'campaigns', timestamps: false },
);

export default Campaign;
