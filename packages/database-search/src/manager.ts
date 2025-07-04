import { Config, ConfigSchema, defaultConfig } from './database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

export class ConfigManager {
  private config!: Config;
  private configPath: string;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // 当从 dist/src 运行时，需要向上两级到达包根目录
    const packageRoot = path.resolve(__dirname, '../..');
    
    // 加载环境变量文件
    this.loadEnvironmentVariables(packageRoot, env);
    
    this.configPath = path.resolve(packageRoot, `config/database-${env}.json`);
    this.loadConfig();
  }

  private loadEnvironmentVariables(packageRoot: string, env: string): void {
    const envPath = path.resolve(packageRoot, `.env.${env}`);
    
    // 优先加载通用 .env 文件
    const commonEnvPath = path.resolve(packageRoot, '.env');
    if (fs.existsSync(commonEnvPath)) {
      dotenv.config({ path: commonEnvPath });
      console.error(`已加载通用环境变量文件: ${commonEnvPath}`);
    }
    
    // 再加载特定环境的 .env 文件，会覆盖通用配置
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.error(`已加载环境变量文件: ${envPath}`);
    } else {
      console.warn(`环境变量文件不存在: ${envPath}`);
      console.warn(`请复制 env-templates/${env}.env.template 为 .env.${env} 并配置相应的值`);
    }
  }

  loadConfig(): void {
    try {
      console.error('正在读取配置文件从:', this.configPath);
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        console.error('配置文件内容前50个字符:', configContent.substring(0, 50));
        
        // 解析环境变量占位符
        const resolvedContent = this.resolveEnvironmentVariables(configContent);
        const configData = JSON.parse(resolvedContent);
        
        this.config = ConfigSchema.parse(configData);
        console.error('配置加载成功');
      } else {
        console.error('配置文件不存在:', this.configPath);
        this.config = defaultConfig;
        this.saveConfig();
      }

      // 从环境变量覆盖配置
      this.overrideFromEnv();
    } catch (error) {
      console.error('加载配置失败，使用默认配置：', error);
      this.config = defaultConfig;
    }
  }

  private resolveEnvironmentVariables(content: string): string {
    // 解析 ${VAR} 和 ${VAR:-default} 格式的环境变量占位符
    return content.replace(/\$\{([^}]+)\}/g, (match, varExpression) => {
      const [varName, defaultValue] = varExpression.split(':-');
      const envValue = process.env[varName.trim()];
      
      if (envValue !== undefined) {
        return envValue;
      } else if (defaultValue !== undefined) {
        return defaultValue.trim();
      } else {
        // 如果环境变量不存在且没有默认值，保持原样或返回空字符串
        console.warn(`环境变量 ${varName} 未设置且无默认值`);
        return '';
      }
    });
  }

  private overrideFromEnv() {
    // 覆盖通用环境配置
    if (process.env.OPENAI_API_KEY) {
      this.config.environment.openaiApiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.DEFAULT_DATABASE) {
      this.config.environment.defaultDatabase = process.env.DEFAULT_DATABASE;
    }
    if (process.env.MAX_QUERY_RESULTS) {
      this.config.environment.maxQueryResults = parseInt(process.env.MAX_QUERY_RESULTS);
    }
    if (process.env.ENABLE_CACHE) {
      this.config.environment.enableCache = process.env.ENABLE_CACHE === 'true';
    }
    if (process.env.LOG_LEVEL) {
      const logLevel = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
      if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
        this.config.environment.logLevel = logLevel;
      }
    }
  }

  private saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public getDatabaseConfig(id: string) {
    return this.config.databases.find((db: any) => db.id === id);
  }

  public getDefaultDatabaseConfig() {
    const defaultId = this.config.environment.defaultDatabase;
    return defaultId ? this.getDatabaseConfig(defaultId) : this.config.databases[0];
  }

  public getAllDatabases() {
    return this.config.databases;
  }
}
