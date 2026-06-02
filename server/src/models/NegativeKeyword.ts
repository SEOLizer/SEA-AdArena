import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NegativeKeywordAttributes {
  id: number;
  campaign_id: number;
  keyword: string;
}

export interface NegativeKeywordCreationAttributes
  extends Optional<NegativeKeywordAttributes, 'id'> {}

class NegativeKeyword
  extends Model<NegativeKeywordAttributes, NegativeKeywordCreationAttributes>
  implements NegativeKeywordAttributes
{
  declare id: number;
  declare campaign_id: number;
  declare keyword: string;
}

NegativeKeyword.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    campaign_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    keyword:     { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'negative_keywords', timestamps: false },
);

export default NegativeKeyword;
