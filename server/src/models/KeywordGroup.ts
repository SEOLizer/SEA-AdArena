import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import type { IntentCategory } from './Keyword';

export interface KeywordGroupAttributes {
  id: number;
  name: string;
  description: string | null;
  parent_group_id: number | null;
  default_intent: IntentCategory | null;
  icon: string | null;
  created_at?: Date;
}

export interface KeywordGroupCreationAttributes
  extends Optional<KeywordGroupAttributes,
    'id' | 'description' | 'parent_group_id' | 'default_intent' | 'icon' | 'created_at'> {}

class KeywordGroup
  extends Model<KeywordGroupAttributes, KeywordGroupCreationAttributes>
  implements KeywordGroupAttributes
{
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare parent_group_id: number | null;
  declare default_intent: IntentCategory | null;
  declare icon: string | null;
  declare created_at: Date;
}

KeywordGroup.init(
  {
    id:              { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name:            { type: DataTypes.STRING(100), allowNull: false },
    description:     { type: DataTypes.STRING(255), allowNull: true },
    parent_group_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    default_intent:  { type: DataTypes.ENUM('informational','transactional','commercial','navigational'), allowNull: true },
    icon:            { type: DataTypes.STRING(50), allowNull: true },
    created_at:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'keyword_groups', timestamps: false },
);

export default KeywordGroup;
