# 环境变量配置指南

## 概述

Database Search MCP Server 支持按环境分离的配置管理，提供灵活的环境变量配置方案，确保开发、测试、生产环境的配置安全和独立。

## 🏗️ 配置架构

### 双层配置系统
- **JSON配置文件** - 结构化配置和环境变量占位符
- **环境变量文件** - 实际的敏感信息和环境特定配置

### 文件结构

```
packages/database-search/
├── config/                      # JSON配置文件
│   ├── database-development.json
│   ├── database-test.json
│   └── database-production.json
├── env-templates/               # 环境变量模板文件
│   ├── development.env.template
│   ├── test.env.template
│   └── production.env.template
├── .env.development            # 开发环境变量（需要创建）
├── .env.test                   # 测试环境变量（需要创建）
├── .env.production             # 生产环境变量（需要创建）
├── setup-env.js               # 自动化环境设置脚本
└── .gitignore                  # 忽略 .env* 文件
```

## 🚀 快速设置

### 方法一：自动化脚本（推荐）

```bash
# 创建所有环境配置文件
npm run setup-env

# 或创建特定环境
npm run setup-env:dev     # 开发环境
npm run setup-env:test    # 测试环境
npm run setup-env:prod    # 生产环境
```

### 方法二：手动设置

```bash
# 复制模板文件
cp env-templates/development.env.template .env.development
cp env-templates/test.env.template .env.test
cp env-templates/production.env.template .env.production

# 编辑配置文件
nano .env.development
```

## ⚙️ 环境变量详解

### 核心配置

| 变量名 | 描述 | 类型 | 默认值 | 必需 |
|--------|------|------|--------|------|
| `NODE_ENV` | 运行环境标识 | string | development | 否 |
| `OPENAI_API_KEY` | OpenAI API 密钥 | string | - | 是 |
| `DEFAULT_DATABASE` | 默认数据库连接ID | string | - | 否 |
| `MAX_QUERY_RESULTS` | 查询结果数量限制 | number | 100 | 否 |
| `ENABLE_CACHE` | 启用查询缓存 | boolean | true | 否 |
| `LOG_LEVEL` | 日志详细程度 | debug/info/warn/error | info | 否 |

### MySQL 数据库配置

```env
# 格式：DB_[连接ID]_[属性]
DB_LOCAL_MYSQL_HOST=localhost
DB_LOCAL_MYSQL_PORT=3306
DB_LOCAL_MYSQL_USERNAME=root
DB_LOCAL_MYSQL_PASSWORD=your_password
DB_LOCAL_MYSQL_DATABASE=learn-mysql
DB_LOCAL_MYSQL_DATABASES=db1,db2,db3  # 可访问的数据库列表
```

### PostgreSQL 数据库配置

```env
DB_PROD_POSTGRES_HOST=pg.example.com
DB_PROD_POSTGRES_PORT=5432
DB_PROD_POSTGRES_USERNAME=pg_user
DB_PROD_POSTGRES_PASSWORD=pg_password
DB_PROD_POSTGRES_DATABASE=main
DB_PROD_POSTGRES_DATABASES=main,analytics,logs
```

### SQLite 数据库配置

```env
DB_TEST_SQLITE_DATABASE=./test.db
DB_TEST_SQLITE_DATABASES=test,backup  # 可选
```

## 🔧 配置文件占位符

JSON配置文件支持环境变量占位符语法：

### 基本语法
```json
{
  "host": "${DB_LOCAL_MYSQL_HOST}",           // 直接引用
  "port": "${DB_LOCAL_MYSQL_PORT:-3306}",     // 带默认值
  "database": "${DB_LOCAL_MYSQL_DATABASE}"
}
```

### 示例配置文件

**config/database-development.json**:
```json
{
  "environment": {
    "openaiApiKey": "${OPENAI_API_KEY}",
    "defaultDatabase": "local-mysql",
    "maxQueryResults": 50,
    "enableCache": true,
    "logLevel": "debug"
  },
  "databases": [
    {
      "id": "local-mysql",
      "name": "本地MySQL开发数据库",
      "type": "mysql",
      "host": "${DB_LOCAL_MYSQL_HOST:-localhost}",
      "port": 3306,
      "username": "${DB_LOCAL_MYSQL_USERNAME:-root}",
      "password": "${DB_LOCAL_MYSQL_PASSWORD}",
      "database": "${DB_LOCAL_MYSQL_DATABASE:-learn-mysql}",
      "databases": ["learn-mysql", "test_db"]
    }
  ]
}
```

## 🏃‍♂️ 运行不同环境

### 开发环境
```bash
# 直接运行 TypeScript（推荐开发使用）
npm run dev

# 或构建后运行
npm run build:dev
npm run start:dev

# 监听模式
npm run watch
```

### 测试环境
```bash
npm run test:run        # 直接运行
npm run build:test      # 构建测试版本
npm run start:test      # 运行测试版本
```

### 生产环境
```bash
npm run build:prod      # 构建生产版本
npm run start:prod      # 运行生产版本
```

## 📋 配置示例

### 开发环境 (.env.development)

```env
# 开发环境配置
NODE_ENV=development
LOG_LEVEL=debug

# OpenAI配置
OPENAI_API_KEY=sk-dev-your-key-here

# 数据库设置
DEFAULT_DATABASE=local-mysql
MAX_QUERY_RESULTS=50
ENABLE_CACHE=true

# 本地MySQL数据库
DB_LOCAL_MYSQL_HOST=localhost
DB_LOCAL_MYSQL_PORT=3306
DB_LOCAL_MYSQL_USERNAME=root
DB_LOCAL_MYSQL_PASSWORD=dev_password
DB_LOCAL_MYSQL_DATABASE=learn-mysql

# 本地SQLite测试库
DB_LOCAL_SQLITE_DATABASE=./dev.db
```

### 测试环境 (.env.test)

```env
# 测试环境配置
NODE_ENV=test
LOG_LEVEL=debug

# OpenAI配置（测试key）
OPENAI_API_KEY=sk-test-your-key-here

# 测试设置
DEFAULT_DATABASE=test-sqlite
MAX_QUERY_RESULTS=10
ENABLE_CACHE=false

# 测试SQLite数据库
DB_TEST_SQLITE_DATABASE=./test.db
```

### 生产环境 (.env.production)

```env
# 生产环境配置
NODE_ENV=production
LOG_LEVEL=warn

# OpenAI配置
OPENAI_API_KEY=sk-prod-your-actual-key

# 生产设置
DEFAULT_DATABASE=prod-mysql
MAX_QUERY_RESULTS=200
ENABLE_CACHE=true

# 生产MySQL数据库
DB_PROD_MYSQL_HOST=mysql.production.com
DB_PROD_MYSQL_PORT=3306
DB_PROD_MYSQL_USERNAME=prod_user
DB_PROD_MYSQL_PASSWORD=secure_prod_password
DB_PROD_MYSQL_DATABASE=production

# 生产PostgreSQL数据库
DB_PROD_POSTGRES_HOST=pg.production.com
DB_PROD_POSTGRES_PORT=5432
DB_PROD_POSTGRES_USERNAME=pg_prod_user
DB_PROD_POSTGRES_PASSWORD=secure_pg_password
DB_PROD_POSTGRES_DATABASE=analytics
```

## 🔒 安全最佳实践

### 1. 敏感信息保护
- ✅ 所有 `.env*` 文件已添加到 `.gitignore`
- ✅ 生产环境使用系统环境变量而非文件
- ✅ 定期轮换 API 密钥和数据库密码
- ❌ 绝不在代码或配置文件中硬编码密码

### 2. 权限管理
```sql
-- 为应用创建专用数据库用户
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';

-- 只授予必要权限（只读查询）
GRANT SELECT ON learn_mysql.* TO 'app_user'@'localhost';

-- 不授予危险权限
-- REVOKE INSERT, UPDATE, DELETE, DROP ON *.* FROM 'app_user'@'localhost';
```

### 3. 网络安全
- 使用 SSL/TLS 连接数据库
- 配置防火墙限制数据库访问
- 使用VPN或私有网络连接生产数据库

## 🔧 配置加载优先级

系统按以下顺序加载配置（后加载会覆盖先加载）：

1. **默认配置** (src/database.ts)
2. **JSON配置文件** (config/database-{env}.json)
3. **通用环境变量文件** (.env) 
4. **特定环境变量文件** (.env.{env})
5. **系统环境变量** (process.env)

## 🐛 故障排除

### 环境变量未加载

**检查步骤：**
```bash
# 1. 检查文件是否存在
ls -la .env.*

# 2. 检查文件权限
ls -l .env.development

# 3. 验证文件内容格式
cat .env.development | head -10

# 4. 检查环境变量是否被正确解析
LOG_LEVEL=debug npm run dev
```

### 数据库连接失败

**诊断清单：**
- [ ] 数据库服务是否运行？
- [ ] 主机地址和端口是否正确？
- [ ] 用户名和密码是否正确？
- [ ] 数据库名称是否存在？
- [ ] 网络连接是否正常？
- [ ] 防火墙是否允许连接？

```bash
# 测试MySQL连接
mysql -h $DB_LOCAL_MYSQL_HOST -u $DB_LOCAL_MYSQL_USERNAME -p

# 测试PostgreSQL连接
psql -h $DB_PROD_POSTGRES_HOST -U $DB_PROD_POSTGRES_USERNAME -d $DB_PROD_POSTGRES_DATABASE
```

### OpenAI API 调用失败

**检查要点：**
- [ ] API 密钥格式是否正确？
- [ ] 账户是否有足够余额？
- [ ] API 限制是否达到？
- [ ] 网络是否能访问 API 端点？

```bash
# 测试API连接
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models
```

### 配置占位符解析失败

**常见问题：**
```env
# ❌ 错误：缺少闭合大括号
MYSQL_HOST=${DB_HOST

# ❌ 错误：语法不正确
MYSQL_HOST=$DB_HOST

# ✅ 正确：标准占位符语法
MYSQL_HOST=${DB_HOST}
MYSQL_HOST=${DB_HOST:-localhost}
```

## 📚 相关文档

- [README.md](./README.md) - 项目总体文档
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - 使用示例
- [config/](./config/) - 配置文件示例

## 💡 高级技巧

### 动态数据库配置

通过环境变量动态添加数据库连接：

```env
# 新增Redis缓存数据库
DB_CACHE_REDIS_HOST=redis.example.com
DB_CACHE_REDIS_PORT=6379
DB_CACHE_REDIS_TYPE=redis
DB_CACHE_REDIS_NAME=Redis缓存

# 新增分析数据库
DB_ANALYTICS_POSTGRES_HOST=analytics.db.com
DB_ANALYTICS_POSTGRES_TYPE=postgresql
DB_ANALYTICS_POSTGRES_NAME=数据分析库
```

### 条件配置

```env
# 开发环境启用调试功能
DB_DEBUG_MODE=true
DB_SLOW_QUERY_LOG=true

# 生产环境性能优化
DB_CONNECTION_POOL_SIZE=20
DB_QUERY_TIMEOUT=30000
``` 