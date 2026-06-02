import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type RelationshipType = 'primary' | 'synonym' | 'broader' | 'narrower' | 'related';

export interface KeywordGroupMemberAttributes {
  id: number;
  keyword_id: number;
  group_id: number;
  relationship_type: RelationshipType;
  created_at?: Date;
}

export interface KeywordGroupMemberCreationAttributes
  extends Optional<KeywordGroupMemberAttributes, 'id' | 'relationship_type' | 'created_at'> {}

class KeywordGroupMember
  extends Model<KeywordGroupMemberAttributes, KeywordGroupMemberCreationAttributes>
  implements KeywordGroupMemberAttributes
{
  declare id: number;
  declare keyword_id: number;
  declare group_id: number;
  declare relationship_type: RelationshipType;
  declare created_at: Date;
}

KeywordGroupMember.init(
  {
    id:                { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    keyword_id:        { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    group_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    relationship_type: { type: DataTypes.ENUM('primary','synonym','broader','narrower','related'), allowNull: false, defaultValue: 'related' },
    created_at:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'keyword_group_members', timestamps: false },
);

export default KeywordGroupMember;
