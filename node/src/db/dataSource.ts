import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from "typeorm";

const port = process.env.DB_PORT as number | undefined;

export const AppDataSource = new DataSource({
   type: 'postgres',
   url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=-c%20search_path=${process.env.DB_SCHEMA}`, 
   host: process.env.DB_HOST,
   port: port,
   username: process.env.DB_USER,
   password: process.env.DB_PASS,
   database: process.env.DB_NAME,
   schema: process.env.DB_SCHEMA,

   entities: [`${__dirname}/../modules/**/entities/*.{ts,js}`],
   migrations: [`${__dirname}/**/migrations/*.{ts,js}`]
})