import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SimulationLogAttributes {
  id: number;
  campaign_id: number;
  hour: number;
  event_type: string;
  message: string;
}

export interface SimulationLogCreationAttributes
  extends Optional<SimulationLogAttributes, 'id'> {}

class SimulationLog
  extends Model<SimulationLogAttributes, SimulationLogCreationAttributes>
  implements SimulationLogAttributes
{
  declare id: number;
  declare campaign_id: number;
  declare hour: number;
  declare event_type: string;
  declare message: string;
}

SimulationLog.init(
  {
    id:          { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    campaign_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    hour:        { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    event_type:  { type: DataTypes.STRING(50), allowNull: false },
    message:     { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: 'simulation_log', timestamps: false },
);

export default SimulationLog;
