import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type IntentCategory  = 'informational' | 'transactional' | 'commercial' | 'navigational';
export type IntentSource    = 'seed' | 'heuristic';
export type CompetitionLevel = 'low' | 'medium' | 'high';

export interface KeywordAttributes {
  id: number;
  keyword: string;
  monthly_search_volume: number;
  base_cpc: number;
  intent_category: IntentCategory;
  intent_source: IntentSource;
  competition_level: CompetitionLevel;
  seasonality_factors: number[];   // JSON — 12 monthly multipliers
  heuristic_data: Record<string, unknown> | null;
  created_at?: Date;
}

export interface KeywordCreationAttributes
  extends Optional<KeywordAttributes,
    'id' | 'intent_source' | 'heuristic_data' | 'created_at'> {}

class Keyword
  extends Model<KeywordAttributes, KeywordCreationAttributes>
  implements KeywordAttributes
{
  declare id: number;
  declare keyword: string;
  declare monthly_search_volume: number;
  declare base_cpc: number;
  declare intent_category: IntentCategory;
  declare intent_source: IntentSource;
  declare competition_level: CompetitionLevel;
  declare seasonality_factors: number[];
  declare heuristic_data: Record<string, unknown> | null;
  declare created_at: Date;
}

Keyword.init(
  {
    id:                    { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    keyword:               { type: DataTypes.STRING(255), allowNull: false, unique: true },
    monthly_search_volume: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    base_cpc:              { type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0.50 },
    intent_category:       { type: DataTypes.ENUM('informational','transactional','commercial','navigational'), allowNull: false, defaultValue: 'commercial' },
    intent_source:         { type: DataTypes.ENUM('seed','heuristic'), allowNull: false, defaultValue: 'seed' },
    competition_level:     { type: DataTypes.ENUM('low','medium','high'), allowNull: false, defaultValue: 'medium' },
    seasonality_factors:   { type: DataTypes.JSON, allowNull: false },
    heuristic_data:        { type: DataTypes.JSON, allowNull: true },
    created_at:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'keywords', timestamps: false },
);

export default Keyword;
