import { z } from 'zod';

/**
 * 数据库连接配置
 */
export const DatabaseConfigSchema = z.object({
  id: z.string().describe('数据库连接唯一标识'),
  name: z.string().describe('数据库连接名称'),
  type: z.enum(['mysql', 'postgresql', 'sqlite']).describe('数据库类型'),
  host: z.string().optional().describe('数据库主机地址'),
  port: z.number().optional().describe('数据库端口'),
  username: z.string().optional().describe('数据库用户名'),
  password: z.string().optional().describe('数据库密码'),
  database: z.string().describe('默认数据库名称'),
  databases: z.array(z.string()).optional().describe('可访问数据库列表'),
  connectionOptions: z.record(z.any()).optional().describe('额外连接选项'),
});

/**
 * 环境配置
 */
export const EnvironmentConfigSchema = z.object({
  openaiApiKey: z.string().optional().describe('OpenAI API密钥'),
  defaultDatabase: z.string().optional().describe('默认数据库连接ID'),
  maxQueryResults: z.number().default(100).describe('最大查询结果数'),
  enableCache: z.boolean().default(true).describe('是否启用查询缓存'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info').describe('日志级别'),
});

/**
 * 配置
 */
export const ConfigSchema = z.object({
  environment: EnvironmentConfigSchema,
  databases: z.array(DatabaseConfigSchema),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Config = {
  environment: {
    maxQueryResults: 100,
    enableCache: true,
    logLevel: 'info',
  },
  databases: [
    {
      id: 'default',
      name: 'Default Database',
      type: 'mysql',
      database: 'default.db',
    },
  ],
};
