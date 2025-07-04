#!/usr/bin/env node

import { ConfigManager } from './manager.js';
import { ConnectionManager } from './connection-manager.js';
import { NLPService } from './nlp-service.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 读取 package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const configManager = new ConfigManager();
const connectionManager = new ConnectionManager();
const config = configManager.getConfig();
const nlpService = new NLPService(config.environment.openaiApiKey);

const server = new McpServer({
  name: 'mcp-server-database-search',
  version: packageJson.version,
});

server.tool(
  'query_database',
  '使用自然语言查询数据库',
  {
    query: z.string().describe('自然语言查询描述'),
    database_id: z.string().optional().describe('数据库连接ID，不指定则使用默认数据库'),
    target_database: z.string().optional().describe('目标数据库名称，用于查询特定数据库'),
    raw_sql: z.boolean().optional().default(false).describe('是否直接执行SQL语句'),
  },
  async ({ query, database_id, target_database, raw_sql }) => {
    try {
      const dbConfig = database_id
        ? configManager.getDatabaseConfig(database_id)
        : configManager.getDefaultDatabaseConfig();

      if (!dbConfig) {
        throw new Error(`数据库连接配置不存在：${database_id}`);
      }

      const connection = await connectionManager.getConnection(dbConfig);

      if (target_database) {
        await connection.switchDatabase(target_database);
      }

      let sql: string;
      let results: any;
      // 若给定了执行的SQL语句，则直接执行
      if (raw_sql) {
        sql = query;
        results = await connection.query(sql);
      } else {
        // 获取表结构用于AI转换
        const tableStructure = await getTableStructure(connection, dbConfig.type);

        // 转换自然语言为SQL
        sql = await nlpService.convertToSQL(query, tableStructure, dbConfig.type);

        // 执行查询
        results = await connection.query(sql);
      }

      // 限制结果数量
      if (Array.isArray(results) && results.length > config.environment.maxQueryResults) {
        results = results.slice(0, config.environment.maxQueryResults);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                database: dbConfig.name,
                target_database: target_database || dbConfig.database,
                sql: sql,
                results: results,
                total_rows: Array.isArray(results) ? results.length : 1,
                message:
                  Array.isArray(results) && results.length === config.environment.maxQueryResults
                    ? `结果已限制为${config.environment.maxQueryResults}条`
                    : undefined,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
);

// 列出数据库工具
server.tool(
  'list_databases',
  '列出可用的数据库连接和数据库',
  {
    database_id: z.string().optional().describe('数据库连接ID，不指定则返回所有连接'),
  },
  async ({ database_id }) => {
    try {
      if (database_id) {
        const dbConfig = configManager.getDatabaseConfig(database_id);
        if (!dbConfig) {
          throw new Error(`数据库连接未找到: ${database_id}`);
        }

        const connection = await connectionManager.getConnection(dbConfig);
        const databases = await connection.getDatabases();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  connection: {
                    id: dbConfig.id,
                    name: dbConfig.name,
                    type: dbConfig.type,
                    current_database: dbConfig.database,
                  },
                  available_databases: databases,
                },
                null,
                2
              ),
            },
          ],
        };
      } else {
        const allConnections = configManager.getAllDatabases();
        const result = [];

        for (const dbConfig of allConnections) {
          try {
            const connection = await connectionManager.getConnection(dbConfig);
            const databases = await connection.getDatabases();

            result.push({
              connection: {
                id: dbConfig.id,
                name: dbConfig.name,
                type: dbConfig.type,
                current_database: dbConfig.database,
              },
              available_databases: databases,
            });
          } catch (error) {
            result.push({
              connection: {
                id: dbConfig.id,
                name: dbConfig.name,
                type: dbConfig.type,
                current_database: dbConfig.database,
              },
              error: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
            });
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`列出数据库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
);

// 获取表结构工具
server.tool(
  'get_table_structure',
  '获取表结构信息',
  {
    database_id: z.string().optional().describe('数据库连接ID'),
    target_database: z.string().optional().describe('目标数据库名称'),
    table_name: z.string().optional().describe('表名，不指定则返回所有表结构'),
  },
  async ({ database_id, target_database, table_name }) => {
    try {
      const dbConfig = database_id
        ? configManager.getDatabaseConfig(database_id)
        : configManager.getDefaultDatabaseConfig();

      if (!dbConfig) {
        throw new Error(`数据库连接未找到: ${database_id}`);
      }

      const connection = await connectionManager.getConnection(dbConfig);

      if (target_database) {
        await connection.switchDatabase(target_database);
      }

      const structure = await getTableStructure(connection, dbConfig.type, table_name);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                database: dbConfig.name,
                target_database: target_database || dbConfig.database,
                structure: structure,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取表结构失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
);

// 执行SQL工具
server.tool(
  'execute_sql',
  '直接执行SQL查询',
  {
    sql: z.string().describe('要执行的SQL语句'),
    database_id: z.string().optional().describe('数据库连接ID'),
    target_database: z.string().optional().describe('目标数据库名称'),
  },
  async ({ sql, database_id, target_database }) => {
    try {
      const dbConfig = database_id
        ? configManager.getDatabaseConfig(database_id)
        : configManager.getDefaultDatabaseConfig();

      if (!dbConfig) {
        throw new Error(`数据库连接未找到: ${database_id}`);
      }

      const connection = await connectionManager.getConnection(dbConfig);

      if (target_database) {
        await connection.switchDatabase(target_database);
      }

      const results = await connection.query(sql);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                database: dbConfig.name,
                target_database: target_database || dbConfig.database,
                sql: sql,
                results: results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`执行SQL失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
);

// 辅助函数：获取表结构
async function getTableStructure(connection: any, dbType: string, tableName?: string) {
  let sql: string;

  switch (dbType) {
    case 'mysql':
      sql = tableName ? `DESCRIBE \`${tableName}\`` : 'SHOW TABLES';
      break;
    case 'postgresql':
      sql = tableName
        ? `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${tableName}'`
        : `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      break;
    case 'sqlite':
      sql = tableName
        ? `PRAGMA table_info(${tableName})`
        : `SELECT name FROM sqlite_master WHERE type='table'`;
      break;
    default:
      throw new Error(`不支持的数据库类型: ${dbType}`);
  }

  return await connection.query(sql);
}

// 启动服务器
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 监听进程退出，清理连接
  process.on('SIGINT', async () => {
    console.error('收到SIGINT信号，正在关闭连接...');
    await connectionManager.closeAll();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('收到SIGTERM信号，正在关闭连接...');
    await connectionManager.closeAll();
    process.exit(0);
  });

  console.error(
    `数据库搜索MCP服务器已在stdio上启动 (环境: ${process.env.NODE_ENV || 'development'})`
  );
}

runServer().catch((error) => {
  console.error('启动服务器时出错:', error);
  process.exit(1);
});
