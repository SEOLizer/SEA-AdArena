import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'trainee';
  created_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password_hash: string;
  declare role: 'admin' | 'trainee';
  declare created_at: Date;
}

User.init(
  {
    id:            { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    username:      { type: DataTypes.STRING(50),  allowNull: false, unique: true },
    email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role:          { type: DataTypes.ENUM('admin', 'trainee'), allowNull: false, defaultValue: 'trainee' },
    created_at:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'users', timestamps: false },
);

export default User;
