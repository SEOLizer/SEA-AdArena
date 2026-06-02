import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CompetitorProfileAttributes {
  id: number;
  name: string;
  strategy_label: string;
  base_bid: number;
  quality_score: number;
  daily_budget: number | null;
  active_hours_start: number;
  active_hours_end: number;
}

export interface CompetitorProfileCreationAttributes
  extends Optional<CompetitorProfileAttributes,
    'id' | 'daily_budget' | 'active_hours_start' | 'active_hours_end'> {}

class CompetitorProfile
  extends Model<CompetitorProfileAttributes, CompetitorProfileCreationAttributes>
  implements CompetitorProfileAttributes
{
  declare id: number;
  declare name: string;
  declare strategy_label: string;
  declare base_bid: number;
  declare quality_score: number;
  declare daily_budget: number | null;
  declare active_hours_start: number;
  declare active_hours_end: number;
}

CompetitorProfile.init(
  {
    id:                  { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name:                { type: DataTypes.STRING(100), allowNull: false },
    strategy_label:      { type: DataTypes.STRING(50),  allowNull: false },
    base_bid:            { type: DataTypes.DECIMAL(6,2), allowNull: false },
    quality_score:       { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    daily_budget:        { type: DataTypes.DECIMAL(8,2), allowNull: true },
    active_hours_start:  { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    active_hours_end:    { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 23 },
  },
  { sequelize, tableName: 'competitor_profiles', timestamps: false },
);

export default CompetitorProfile;
