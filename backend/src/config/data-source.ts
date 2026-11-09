import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from: backend/.env -> project root/.env -> default
const localEnv = path.resolve(process.cwd(), ".env");
const parentEnv = path.resolve(process.cwd(), "..", ".env");
const srcRootEnv = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
} else if (fs.existsSync(srcRootEnv)) {
  dotenv.config({ path: srcRootEnv });
} else {
  dotenv.config();
}

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || process.env.DB_NAME || "project_management",

  synchronize: false, // Schema is managed by migrations in src/migrations
  logging: !isProduction,
  entities: [path.join(__dirname, "../entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/**/*.{ts,js}")],
  subscribers: [],
});
