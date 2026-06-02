import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ScenarioConfig {
  competitorOverrides?: Array<{
    id: number;
    base_bid?: number;
    quality_score?: number;
    daily_budget?: number | null;
    active_hours_start?: number;
    active_hours_end?: number;
  }>;
  marketConditions?: {
    baseCpcMultiplier?: number;
  };
}

export interface ScenarioAttributes {
  id: number;
  name: string;
  description: string | null;
  config: ScenarioConfig;
  active: boolean;
}

export interface ScenarioCreationAttributes
  extends Optional<ScenarioAttributes, 'id' | 'description' | 'active'> {}

class Scenario
  extends Model<ScenarioAttributes, ScenarioCreationAttributes>
  implements ScenarioAttributes
{
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare config: ScenarioConfig;
  declare active: boolean;
}

Scenario.init(
  {
    id:          { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    name:        { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    config:      { type: DataTypes.JSON, allowNull: false },
    active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'scenarios', timestamps: false },
);

export default Scenario;
