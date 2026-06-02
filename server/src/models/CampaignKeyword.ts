import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MatchType = 'broad' | 'phrase' | 'exact';

export interface CampaignKeywordAttributes {
  id: number;
  ad_group_id: number;
  keyword_id: number;
  match_type: MatchType;
  max_cpc_override: number | null;
  generated_by_heuristic: boolean;
}

export interface CampaignKeywordCreationAttributes
  extends Optional<CampaignKeywordAttributes,
    'id' | 'match_type' | 'max_cpc_override' | 'generated_by_heuristic'> {}

class CampaignKeyword
  extends Model<CampaignKeywordAttributes, CampaignKeywordCreationAttributes>
  implements CampaignKeywordAttributes
{
  declare id: number;
  declare ad_group_id: number;
  declare keyword_id: number;
  declare match_type: MatchType;
  declare max_cpc_override: number | null;
  declare generated_by_heuristic: boolean;
}

CampaignKeyword.init(
  {
    id:                     { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    ad_group_id:            { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    keyword_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    match_type:             { type: DataTypes.ENUM('broad','phrase','exact'), allowNull: false, defaultValue: 'phrase' },
    max_cpc_override:       { type: DataTypes.DECIMAL(6,2), allowNull: true },
    generated_by_heuristic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'campaign_keywords', timestamps: false },
);

export default CampaignKeyword;
