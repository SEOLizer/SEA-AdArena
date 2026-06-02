import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface HourlyStatAttributes {
  id: number;
  campaign_id: number;
  hour: number;
  impressions: number;
  clicks: number;
  cost: number;
  avg_position: number;
  budget_remaining: number;
  conversions: number;
}

export interface HourlyStatCreationAttributes
  extends Optional<HourlyStatAttributes,
    'id' | 'impressions' | 'clicks' | 'cost' | 'avg_position' | 'conversions'> {}

class HourlyStat
  extends Model<HourlyStatAttributes, HourlyStatCreationAttributes>
  implements HourlyStatAttributes
{
  declare id: number;
  declare campaign_id: number;
  declare hour: number;
  declare impressions: number;
  declare clicks: number;
  declare cost: number;
  declare avg_position: number;
  declare budget_remaining: number;
  declare conversions: number;
}

HourlyStat.init(
  {
    id:               { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    campaign_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hour:             { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    impressions:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    clicks:           { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    cost:             { type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0 },
    avg_position:     { type: DataTypes.DECIMAL(3,1), allowNull: false, defaultValue: 0 },
    budget_remaining: { type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0 },
    conversions:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'hourly_stats', timestamps: false },
);

export default HourlyStat;
