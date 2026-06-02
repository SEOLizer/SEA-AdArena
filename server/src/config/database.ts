import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS!,
  {
    host:    process.env.DB_HOST ?? 'localhost',
    port:    parseInt(process.env.DB_PORT ?? '3306', 10),
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 10000,
    },
  },
);

export default sequelize;
