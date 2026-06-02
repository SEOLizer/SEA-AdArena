import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type BidderType = 'player' | 'competitor';

export interface AuctionResultAttributes {
  id: number;
  campaign_id: number;
  keyword_id: number;
  hour: number;
  bidder_type: BidderType;
  bidder_id: number;
  ad_rank: number;
  impressions: number;
  clicks: number;
  cost: number;
  avg_position: number;
}

export interface AuctionResultCreationAttributes
  extends Optional<AuctionResultAttributes,
    'id' | 'ad_rank' | 'impressions' | 'clicks' | 'cost' | 'avg_position'> {}

class AuctionResult
  extends Model<AuctionResultAttributes, AuctionResultCreationAttributes>
  implements AuctionResultAttributes
{
  declare id: number;
  declare campaign_id: number;
  declare keyword_id: number;
  declare hour: number;
  declare bidder_type: BidderType;
  declare bidder_id: number;
  declare ad_rank: number;
  declare impressions: number;
  declare clicks: number;
  declare cost: number;
  declare avg_position: number;
}

AuctionResult.init(
  {
    id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    campaign_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    keyword_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hour:         { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    bidder_type:  { type: DataTypes.ENUM('player','competitor'), allowNull: false },
    bidder_id:    { type: DataTypes.INTEGER, allowNull: false },
    ad_rank:      { type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0 },
    impressions:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    clicks:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    cost:         { type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0 },
    avg_position: { type: DataTypes.DECIMAL(3,1), allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'auction_results', timestamps: false },
);

export default AuctionResult;
