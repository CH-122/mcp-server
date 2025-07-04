import mysql from 'mysql2/promise';
import { DatabaseConfig } from './database.js';
import { Pool as PgPool } from 'pg';
import sqlite3 from 'sqlite3';

export interface DatabaseConnection {
  connect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
  getDatabases(): Promise<string[]>;
  switchDatabase(database: string): Promise<void>;
}

class MySQLConnection implements DatabaseConnection {
  private connection!: mysql.Connection;

  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ...this.config.connectionOptions,
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }

  async getDatabases(): Promise<string[]> {
    if (this.config.databases && this.config.databases.length > 0) {
      return this.config.databases;
    }

    const [rows] = await this.query('SHOW DATABASES');
    return rows.map((row: any) => row.Database);
  }

  async switchDatabase(database: string): Promise<void> {
    await this.query(`USE \`${database}\``);
  }
}

class PostgreSQLConnection implements DatabaseConnection {
  private pool!: PgPool;

  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    this.pool = new PgPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ...this.config.connectionOptions,
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      // 释放连接
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getDatabases(): Promise<string[]> {
    if (this.config.databases && this.config.databases.length > 0) {
      return this.config.databases;
    }

    const result = await this.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    return result.map((row: any) => row.datname);
  }

  async switchDatabase(database: string): Promise<void> {
    await this.close();
    this.config.database = database;
    await this.connect();
  }
}

class SQLiteConnection implements DatabaseConnection {
  private db!: sqlite3.Database;

  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.config.database, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getDatabases(): Promise<string[]> {
    return this.config.databases || [this.config.database];
  }

  async switchDatabase(database: string): Promise<void> {
    await this.close();
    this.config.database = database;
    await this.connect();
  }
}

export class ConnectionManager {
  private connections: Map<string, DatabaseConnection> = new Map();

  async getConnection(config: DatabaseConfig): Promise<DatabaseConnection> {
    const key = config.id;
    if (!this.connections.has(key)) {
      let connection: DatabaseConnection;

      switch (config.type) {
        case 'mysql':
          connection = new MySQLConnection(config);
          break;
        case 'postgresql':
          connection = new PostgreSQLConnection(config);
          break;
        case 'sqlite':
          connection = new SQLiteConnection(config);
          break;
        default:
          throw new Error(`不支持的数据库类型: ${config.type}`);
      }

      await connection.connect();
      this.connections.set(key, connection);
    }

    return this.connections.get(key)!;
  }

  async closeAll(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
  }
}
