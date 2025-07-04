# Database Search MCP Server

一个基于 Model Context Protocol (MCP) 的智能数据库搜索服务，支持使用自然语言查询多种数据库类型。

## 🚀 核心特性

### 多数据库支持
- **MySQL** - 主流关系型数据库
- **PostgreSQL** - 高级关系型数据库  
- **SQLite** - 轻量级嵌入式数据库

### 智能查询转换
- **自然语言转SQL** - 使用 OpenAI GPT 模型将自然语言转换为精确的SQL查询
- **安全SQL检查** - 自动过滤危险操作（DROP、DELETE、UPDATE等）
- **降级处理** - API 不可用时提供基础关键词匹配转换

### 灵活配置管理
- **多环境支持** - development、test、production 环境隔离
- **环境变量配置** - 安全的敏感信息管理
- **动态数据库切换** - 运行时切换不同数据库
- **连接池管理** - 高效的数据库连接复用

## 🏗️ 架构设计

```
├── src/
│   ├── index.ts           # MCP 服务器主入口和工具定义
│   ├── manager.ts         # 配置管理器 - 环境变量解析和配置加载
│   ├── connection-manager.ts # 数据库连接管理器 - 连接池和多数据库支持
│   ├── database.ts        # 数据模型和Schema定义
│   └── nlp-service.ts     # NLP服务 - 自然语言转SQL
├── config/               # 分环境配置文件
│   ├── database-development.json
│   ├── database-test.json
│   └── database-production.json
├── env-templates/        # 环境变量模板文件
└── setup-env.js         # 环境设置自动化脚本
```

## 🛠️ MCP 工具接口

### 1. query_database
**使用自然语言查询数据库**

```typescript
interface QueryDatabaseParams {
  query: string;              // 自然语言查询描述
  database_id?: string;       // 数据库连接ID，可选
  target_database?: string;   // 目标数据库名称，可选
  raw_sql?: boolean;          // 是否直接执行SQL语句，默认false
}
```

**使用示例：**
```bash
# 自然语言查询
query: "查询所有用户的姓名和邮箱"

# 直接SQL查询
query: "SELECT name, email FROM users LIMIT 10"
raw_sql: true
```

### 2. list_databases
**列出可用的数据库连接和数据库**

```typescript
interface ListDatabasesParams {
  database_id?: string;       // 数据库连接ID，可选
}
```

### 3. get_table_structure
**获取表结构信息**

```typescript
interface GetTableStructureParams {
  database_id?: string;       // 数据库连接ID，可选
  target_database?: string;   // 目标数据库名称，可选
  table_name?: string;        // 表名，可选（不指定返回所有表）
}
```

### 4. execute_sql
**直接执行SQL查询**

```typescript
interface ExecuteSQLParams {
  sql: string;                // 要执行的SQL语句
  database_id?: string;       // 数据库连接ID，可选
  target_database?: string;   // 目标数据库名称，可选
}
```

## ⚙️ 配置指南

### 快速开始

1. **环境设置**
```bash
cd packages/database-search

# 创建所有环境配置文件
npm run setup-env

# 或创建特定环境
npm run setup-env:dev
```

2. **配置数据库连接**
```bash
# 编辑开发环境配置
nano .env.development
```

3. **构建和运行**
```bash
# 开发环境运行
npm run dev

# 生产环境构建并运行
npm run build:prod
npm run start:prod
```

### 环境变量配置

每个环境使用独立的配置文件：
- `.env.development` - 开发环境
- `.env.test` - 测试环境  
- `.env.production` - 生产环境

**关键配置项：**
```env
# OpenAI API配置
OPENAI_API_KEY=sk-your-api-key

# 通用设置
DEFAULT_DATABASE=local-mysql
MAX_QUERY_RESULTS=100
ENABLE_CACHE=true
LOG_LEVEL=debug

# 数据库连接
DB_LOCAL_MYSQL_HOST=localhost
DB_LOCAL_MYSQL_USERNAME=root
DB_LOCAL_MYSQL_PASSWORD=your_password
DB_LOCAL_MYSQL_DATABASE=learn-mysql
```

### 配置文件结构

配置文件支持环境变量占位符：
```json
{
  "environment": {
    "openaiApiKey": "${OPENAI_API_KEY}",
    "defaultDatabase": "local-mysql",
    "maxQueryResults": 100
  },
  "databases": [
    {
      "id": "local-mysql",
      "name": "本地MySQL数据库",
      "type": "mysql",
      "host": "${DB_LOCAL_MYSQL_HOST:-localhost}",
      "username": "${DB_LOCAL_MYSQL_USERNAME:-root}",
      "password": "${DB_LOCAL_MYSQL_PASSWORD}",
      "database": "${DB_LOCAL_MYSQL_DATABASE:-learn-mysql}"
    }
  ]
}
```

## 🔧 开发指南

### 可用脚本命令

```bash
# 环境设置
npm run setup-env           # 创建所有环境配置
npm run setup-env:dev       # 创建开发环境配置
npm run setup-env:test      # 创建测试环境配置
npm run setup-env:prod      # 创建生产环境配置

# 开发环境
npm run dev                 # TypeScript 直接运行
npm run build:dev           # 构建开发版本
npm run start:dev           # 运行构建后的开发版本
npm run watch               # 监听模式构建

# 测试环境
npm run test:run            # 测试环境运行
npm run build:test          # 构建测试版本
npm run start:test          # 运行测试版本

# 生产环境
npm run build:prod          # 构建生产版本
npm run start:prod          # 运行生产版本
```

### 添加新数据库类型

1. **扩展 DatabaseConnection 接口** (connection-manager.ts)
2. **实现具体数据库类** 
3. **更新 ConnectionManager.getConnection()**
4. **添加配置Schema** (database.ts)

### NLP 服务自定义

NLPService 支持：
- 自定义 OpenAI API 端点
- 降级到关键词匹配
- SQL 安全检查
- 提示词模板自定义

## 🔒 安全最佳实践

### 1. 敏感信息管理
- ✅ 使用环境变量存储密码和API密钥
- ✅ `.env*` 文件已添加到 `.gitignore`
- ❌ 永远不要在代码中硬编码敏感信息

### 2. SQL 注入防护
- ✅ 自动过滤危险SQL关键词
- ✅ 参数化查询支持
- ✅ 查询结果数量限制

### 3. 权限控制
- ✅ 数据库用户最小权限原则
- ✅ 只读查询限制（默认禁用修改操作）
- ✅ 连接超时和重试机制

### 4. 生产部署建议
- 使用环境变量而非 `.env` 文件
- 定期轮换数据库密码和API密钥
- 启用访问日志和监控
- 配置防火墙和网络隔离

## 🐛 故障排除

### 常见问题

**Q: 环境变量未加载**
```bash
# 检查文件存在性
ls -la .env.*

# 重新创建配置
npm run setup-env:dev
```

**Q: 数据库连接失败**
- 检查数据库服务状态
- 验证连接参数（host、port、username、password）
- 确认网络连接和防火墙设置
- 检查数据库用户权限

**Q: OpenAI API 调用失败**  
- 验证 `OPENAI_API_KEY` 设置
- 检查账户余额和API限制
- 确认网络连接到API端点

**Q: SQL转换不准确**
- 检查表结构获取是否正确
- 尝试更具体的自然语言描述
- 使用 `raw_sql: true` 直接执行SQL

### 调试模式

启用详细日志：
```bash
LOG_LEVEL=debug npm run dev
```

这将显示：
- 配置加载过程
- 数据库连接状态
- SQL生成和执行过程
- 错误详细堆栈

## 📚 API 参考

详细的API文档和使用示例请参考：
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - 完整使用示例
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境配置详解

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

---

**注意**: 这是一个 MCP (Model Context Protocol) 服务器，需要与支持 MCP 的客户端（如 Claude Desktop）配合使用。 