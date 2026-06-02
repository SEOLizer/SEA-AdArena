import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type QsComponent          = 'below' | 'average' | 'above';
export type LandingPageExperience = 'poor'  | 'average' | 'excellent';

export interface AdGroupAttributes {
  id: number;
  campaign_id: number;
  name: string;
  max_cpc: number;
  quality_score: number;
  qs_expected_ctr: QsComponent;
  qs_ad_relevance: QsComponent;
  qs_landing_page: QsComponent;
  landing_page_experience: LandingPageExperience;
}

export interface AdGroupCreationAttributes
  extends Optional<AdGroupAttributes,
    'id' | 'quality_score' | 'qs_expected_ctr' | 'qs_ad_relevance' |
    'qs_landing_page' | 'landing_page_experience'> {}

class AdGroup
  extends Model<AdGroupAttributes, AdGroupCreationAttributes>
  implements AdGroupAttributes
{
  declare id: number;
  declare campaign_id: number;
  declare name: string;
  declare max_cpc: number;
  declare quality_score: number;
  declare qs_expected_ctr: QsComponent;
  declare qs_ad_relevance: QsComponent;
  declare qs_landing_page: QsComponent;
  declare landing_page_experience: LandingPageExperience;
}

AdGroup.init(
  {
    id:                      { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    campaign_id:             { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name:                    { type: DataTypes.STRING(200), allowNull: false },
    max_cpc:                 { type: DataTypes.DECIMAL(6,2), allowNull: false, defaultValue: 1.00 },
    quality_score:           { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 5 },
    qs_expected_ctr:         { type: DataTypes.ENUM('below','average','above'), allowNull: false, defaultValue: 'average' },
    qs_ad_relevance:         { type: DataTypes.ENUM('below','average','above'), allowNull: false, defaultValue: 'average' },
    qs_landing_page:         { type: DataTypes.ENUM('below','average','above'), allowNull: false, defaultValue: 'average' },
    landing_page_experience: { type: DataTypes.ENUM('poor','average','excellent'), allowNull: false, defaultValue: 'average' },
  },
  { sequelize, tableName: 'ad_groups', timestamps: false },
);

export default AdGroup;
