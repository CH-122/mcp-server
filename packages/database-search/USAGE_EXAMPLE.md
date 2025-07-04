# Database Search MCP Server 使用示例

## 🚀 快速开始

### 1. 环境设置

```bash
# 进入项目目录
cd packages/database-search

# 自动创建环境配置文件
npm run setup-env:dev

# 编辑开发环境配置
nano .env.development
```

**配置示例 (.env.development)：**
```env
# OpenAI API 密钥
OPENAI_API_KEY=sk-your-actual-openai-api-key

# 数据库连接配置
DB_LOCAL_MYSQL_HOST=localhost
DB_LOCAL_MYSQL_USERNAME=root
DB_LOCAL_MYSQL_PASSWORD=your_password
DB_LOCAL_MYSQL_DATABASE=learn-mysql

# 服务配置
DEFAULT_DATABASE=local-mysql
MAX_QUERY_RESULTS=50
LOG_LEVEL=debug
```

### 2. 启动服务

```bash
# 开发环境运行
npm run dev

# 或者构建后运行
npm run build:dev
npm run start:dev
```

## 🛠️ MCP 工具使用指南

Database Search MCP Server 提供了4个核心工具，可以通过支持 MCP 的客户端（如 Claude Desktop）调用。

### 1. query_database - 智能查询

**功能**: 使用自然语言或直接SQL查询数据库

#### 自然语言查询示例

```json
{
  "tool": "query_database",
  "parameters": {
    "query": "查询所有用户的姓名和邮箱地址",
    "database_id": "local-mysql"
  }
}
```

**系统会自动转换为：**
```sql
SELECT name, email FROM users;
```

#### 更多自然语言查询示例

```json
// 统计查询
{
  "query": "统计每个部门的员工数量",
  "database_id": "local-mysql"
}

// 条件查询
{
  "query": "查找年龄大于25岁的活跃用户",
  "database_id": "local-mysql"
}

// 排序查询
{
  "query": "按照创建时间倒序显示最近的10个订单",
  "database_id": "local-mysql"
}

// 关联查询
{
  "query": "查询用户及其订单信息，包括用户名和订单总金额",
  "database_id": "local-mysql"
}
```

#### 直接SQL查询示例

```json
{
  "tool": "query_database",
  "parameters": {
    "query": "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id",
    "raw_sql": true,
    "database_id": "local-mysql"
  }
}
```

#### 跨数据库查询

```json
{
  "tool": "query_database",
  "parameters": {
    "query": "查询分析数据库中的用户行为统计",
    "database_id": "local-mysql",
    "target_database": "analytics"
  }
}
```

### 2. list_databases - 数据库探索

**功能**: 查看可用的数据库连接和数据库列表

#### 列出所有数据库连接

```json
{
  "tool": "list_databases",
  "parameters": {}
}
```

**返回示例：**
```json
[
  {
    "connection": {
      "id": "local-mysql",
      "name": "本地MySQL开发数据库",
      "type": "mysql",
      "current_database": "learn-mysql"
    },
    "available_databases": ["learn-mysql", "test_db", "analytics"]
  },
  {
    "connection": {
      "id": "test-sqlite",
      "name": "测试SQLite数据库",
      "type": "sqlite",
      "current_database": "test.db"
    },
    "available_databases": ["test.db"]
  }
]
```

#### 查看特定连接的数据库

```json
{
  "tool": "list_databases",
  "parameters": {
    "database_id": "local-mysql"
  }
}
```

### 3. get_table_structure - 结构分析

**功能**: 获取数据库表结构信息，帮助理解数据模型

#### 获取所有表结构

```json
{
  "tool": "get_table_structure",
  "parameters": {
    "database_id": "local-mysql"
  }
}
```

#### 获取特定表结构

```json
{
  "tool": "get_table_structure",
  "parameters": {
    "database_id": "local-mysql",
    "table_name": "users"
  }
}
```

**返回示例（MySQL）：**
```json
{
  "database": "本地MySQL开发数据库",
  "target_database": "learn-mysql",
  "structure": [
    {
      "Field": "id",
      "Type": "int(11)",
      "Null": "NO",
      "Key": "PRI",
      "Default": null,
      "Extra": "auto_increment"
    },
    {
      "Field": "name",
      "Type": "varchar(100)",
      "Null": "NO",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "email",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "UNI",
      "Default": null,
      "Extra": ""
    }
  ]
}
```

#### 获取其他数据库的表结构

```json
{
  "tool": "get_table_structure",
  "parameters": {
    "database_id": "local-mysql",
    "target_database": "analytics",
    "table_name": "user_events"
  }
}
```

### 4. execute_sql - 直接执行

**功能**: 直接执行SQL语句，适用于复杂查询

#### 基本SQL执行

```json
{
  "tool": "execute_sql",
  "parameters": {
    "sql": "SELECT COUNT(*) as total_users FROM users WHERE status = 'active'",
    "database_id": "local-mysql"
  }
}
```

#### 复杂分析查询

```json
{
  "tool": "execute_sql",
  "parameters": {
    "sql": "SELECT DATE(created_at) as date, COUNT(*) as daily_signups FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date",
    "database_id": "local-mysql"
  }
}
```

#### 跨表关联查询

```json
{
  "tool": "execute_sql",
  "parameters": {
    "sql": "SELECT u.name, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id HAVING total_spent > 1000 ORDER BY total_spent DESC",
    "database_id": "local-mysql"
  }
}
```

## 🎯 实际使用场景

### 场景1：数据探索分析

**步骤1**: 了解数据库结构
```json
{
  "tool": "list_databases",
  "parameters": {}
}
```

**步骤2**: 查看表结构
```json
{
  "tool": "get_table_structure",
  "parameters": {
    "database_id": "local-mysql"
  }
}
```

**步骤3**: 探索性查询
```json
{
  "tool": "query_database",
  "parameters": {
    "query": "显示用户表的前10条记录",
    "database_id": "local-mysql"
  }
}
```

### 场景2：业务数据分析

**分析用户活跃度：**
```json
{
  "tool": "query_database",
  "parameters": {
    "query": "统计最近30天每天的活跃用户数量",
    "database_id": "local-mysql"
  }
}
```

**分析销售趋势：**
```json
{
  "tool": "execute_sql",
  "parameters": {
    "sql": "SELECT MONTH(order_date) as month, SUM(total_amount) as monthly_revenue FROM orders WHERE YEAR(order_date) = 2024 GROUP BY MONTH(order_date) ORDER BY month",
    "database_id": "local-mysql"
  }
}
```

### 场景3：多数据库查询

**步骤1**: 查询主数据库
```json
{
  "tool": "query_database",
  "parameters": {
    "query": "获取所有用户的基本信息",
    "database_id": "local-mysql",
    "target_database": "production"
  }
}
```

**步骤2**: 查询分析数据库
```json
{
  "tool": "query_database",
  "parameters": {
    "query": "获取用户行为分析数据",
    "database_id": "local-mysql",
    "target_database": "analytics"
  }
}
```

## 🔧 不同环境的配置示例

### 开发环境配置

**.env.development:**
```env
NODE_ENV=development
OPENAI_API_KEY=sk-dev-key-here
DEFAULT_DATABASE=local-mysql
MAX_QUERY_RESULTS=50
ENABLE_CACHE=true
LOG_LEVEL=debug

# 本地开发数据库
DB_LOCAL_MYSQL_HOST=localhost
DB_LOCAL_MYSQL_PORT=3306
DB_LOCAL_MYSQL_USERNAME=root
DB_LOCAL_MYSQL_PASSWORD=dev_password
DB_LOCAL_MYSQL_DATABASE=learn-mysql

# 本地SQLite测试库
DB_LOCAL_SQLITE_DATABASE=./dev.db
```

**运行开发环境：**
```bash
npm run dev
```

### 测试环境配置

**.env.test:**
```env
NODE_ENV=test
OPENAI_API_KEY=sk-test-key-here
DEFAULT_DATABASE=test-sqlite
MAX_QUERY_RESULTS=10
ENABLE_CACHE=false
LOG_LEVEL=debug

# 测试数据库
DB_TEST_SQLITE_DATABASE=./test.db
```

**运行测试环境：**
```bash
npm run test:run
```

### 生产环境配置

**.env.production:**
```env
NODE_ENV=production
OPENAI_API_KEY=sk-prod-key-here
DEFAULT_DATABASE=prod-mysql
MAX_QUERY_RESULTS=200
ENABLE_CACHE=true
LOG_LEVEL=warn

# 生产数据库
DB_PROD_MYSQL_HOST=prod.database.server
DB_PROD_MYSQL_PORT=3306
DB_PROD_MYSQL_USERNAME=prod_user
DB_PROD_MYSQL_PASSWORD=secure_prod_password
DB_PROD_MYSQL_DATABASE=production

# 分析数据库
DB_PROD_POSTGRES_HOST=analytics.database.server
DB_PROD_POSTGRES_PORT=5432
DB_PROD_POSTGRES_USERNAME=analytics_user
DB_PROD_POSTGRES_PASSWORD=analytics_password
DB_PROD_POSTGRES_DATABASE=analytics
```

**运行生产环境：**
```bash
npm run build:prod
npm run start:prod
```

## 📋 常用命令参考

### 环境管理
```bash
# 创建环境配置
npm run setup-env           # 所有环境
npm run setup-env:dev       # 开发环境
npm run setup-env:test      # 测试环境
npm run setup-env:prod      # 生产环境
```

### 开发命令
```bash
# 开发模式
npm run dev                 # TypeScript直接运行
npm run watch               # 监听模式构建

# 构建命令
npm run build:dev           # 构建开发版本
npm run build:test          # 构建测试版本
npm run build:prod          # 构建生产版本

# 运行命令
npm run start:dev           # 运行开发版本
npm run start:test          # 运行测试版本
npm run start:prod          # 运行生产版本
```

## 🐛 故障排除

### 问题1：环境变量未加载

**现象**：应用启动时提示找不到配置

**解决方案**：
```bash
# 检查环境文件
ls -la .env.*

# 如果不存在，重新创建
npm run setup-env:dev

# 检查文件内容
cat .env.development
```

### 问题2：数据库连接失败

**现象**：查询时报连接错误

**诊断步骤**：
```bash
# 1. 测试数据库连接
mysql -h localhost -u root -p

# 2. 检查配置是否正确
echo $DB_LOCAL_MYSQL_HOST
echo $DB_LOCAL_MYSQL_USERNAME

# 3. 启用调试日志
LOG_LEVEL=debug npm run dev
```

### 问题3：自然语言转换不准确

**现象**：生成的SQL不符合预期

**解决方案**：
1. 使用更具体的自然语言描述
2. 先查看表结构了解字段名
3. 使用 `raw_sql: true` 直接执行SQL

**示例**：
```json
// ❌ 模糊描述
{
  "query": "查用户",
  "database_id": "local-mysql"
}

// ✅ 具体描述  
{
  "query": "查询users表中所有用户的姓名name和邮箱email字段",
  "database_id": "local-mysql"
}
```

### 问题4：OpenAI API调用失败

**现象**：自然语言查询返回错误

**解决方案**：
1. 检查API密钥是否正确
2. 确认账户余额充足
3. 检查网络连接
4. 使用 `raw_sql: true` 绕过API调用

## 💡 最佳实践

### 1. 查询优化
- 使用具体的字段名而非 `SELECT *`
- 添加适当的 LIMIT 限制结果数量
- 使用索引字段进行查询条件

### 2. 安全考虑
- 只授予数据库用户必要的权限
- 定期轮换密码和API密钥
- 在生产环境中限制查询权限

### 3. 性能优化
- 启用查询缓存减少重复查询
- 合理设置最大结果数量
- 使用连接池管理数据库连接

### 4. 调试技巧
- 使用 `LOG_LEVEL=debug` 查看详细日志
- 先用简单查询测试连接
- 逐步增加查询复杂度

## 📚 相关文档

- [README.md](./README.md) - 项目总览和架构
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境配置详解
- [config/](./config/) - 配置文件参考

---

**提示**: 这是一个 MCP (Model Context Protocol) 服务器，需要与支持 MCP 的客户端配合使用。推荐使用 Claude Desktop 或其他 MCP 兼容的工具。 