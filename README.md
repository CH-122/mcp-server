# MCP 服务器演示项目

一个基于 Model Context Protocol (MCP) 的多功能服务器演示项目，展示了如何构建和使用不同类型的 MCP 服务器。

## 🚀 项目概述

本项目是一个 monorepo，包含了三个不同功能的 MCP 服务器示例：

- **Database Search** - 智能数据库搜索服务，支持自然语言查询
- **GitHub Search** - GitHub 仓库和用户信息搜索服务
- **Time** - 时间获取和时区转换服务

所有服务器都基于 Model Context Protocol (MCP) 标准构建，可以与支持 MCP 的客户端（如 Claude Desktop）无缝集成。

## 📦 项目结构

```
hh-mcp-server/
├── packages/
│   ├── database-search/     # 数据库搜索 MCP 服务器
│   ├── github-search/       # GitHub 搜索 MCP 服务器
│   └── time/               # 时间服务 MCP 服务器
├── package.json            # 根项目配置
├── pnpm-workspace.yaml     # pnpm workspace 配置
└── README.md              # 项目说明文档
```

## 🛠️ 技术栈

- **运行时**: Node.js + TypeScript
- **包管理**: pnpm workspace
- **框架**: Model Context Protocol SDK
- **数据库**: MySQL, PostgreSQL, SQLite (database-search)
- **API**: GitHub API (github-search)
- **工具库**: dayjs, zod, prettier

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd hh-mcp-server

# 安装依赖
pnpm install
```

### 构建所有包

```bash
# 构建所有 MCP 服务器
pnpm run build
```

### 代码格式化

```bash
# 格式化代码
pnpm run format

# 检查代码格式
pnpm run format:check
```

## 📚 MCP 服务器详解

### 1. Database Search MCP Server

**功能**: 支持自然语言查询多种数据库，提供智能 SQL 转换

**核心特性**:

- 🗄️ 多数据库支持（MySQL、PostgreSQL、SQLite）
- 🧠 自然语言转 SQL（基于 OpenAI GPT）
- 🔒 安全 SQL 检查和过滤
- ⚙️ 灵活的环境配置管理
- 🔄 连接池和资源管理

**工具列表**:

- `query_database` - 自然语言数据库查询
- `list_databases` - 列出可用数据库
- `get_table_structure` - 获取表结构
- `execute_sql` - 直接执行 SQL

[查看详细文档](./packages/database-search/README.md)

### 2. GitHub Search MCP Server

**功能**: 搜索 GitHub 仓库、代码、问题和用户信息

**核心特性**:

- 🔍 全面搜索（仓库、代码、问题、用户）
- 📄 分页支持
- 🔑 GitHub API 集成
- 📊 结构化数据返回

**工具列表**:

- `search_github` - 搜索 GitHub 内容
- `get_user_info` - 获取用户详细信息

**使用示例**:

```bash
cd packages/github-search

# 设置 GitHub Token
export GITHUB_TOKEN=your_github_token

# 构建并运行
pnpm run build
node dist/index.js
```

**代码来源**:

[代码来源](https://github.com/vaebe/mcp)

### 3. Time MCP Server

**功能**: 获取当前时间和进行时区转换

**核心特性**:

- 🕐 获取当前时间
- 🌍 时区转换
- 🔧 灵活的时区配置
- 📅 标准时间格式

**工具列表**:

- `get_current_time` - 获取当前时间
- `convert_time` - 时区间时间转换

**使用示例**:

```bash
cd packages/time

# 构建并运行
pnpm run build
node dist/index.js
```

**代码来源**:

[代码来源](https://github.com/vaebe/mcp)

## 🔧 开发指南

### 添加新的 MCP 服务器

1. 在 `packages/` 目录下创建新包
2. 配置 `package.json` 和 `tsconfig.json`
3. 实现 MCP 服务器逻辑
4. 添加到 workspace 配置

### 项目脚本命令

```bash
# 构建所有包
pnpm run build

# 格式化代码
pnpm run format

# 检查代码格式
pnpm run format:check

# 运行测试（待实现）
pnpm run test
```

### 开发最佳实践

- 使用 TypeScript 进行类型安全
- 遵循 MCP 标准和最佳实践
- 使用 zod 进行参数验证
- 实现适当的错误处理
- 添加详细的工具描述和参数说明

## 🤝 与 MCP 客户端集成

### Claude Desktop 配置示例

在 Claude Desktop 的配置文件中添加服务器：

```json
{
  "mcpServers": {
    "database-search": {
      "command": "node",
      "args": ["path/to/packages/database-search/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "github-search": {
      "command": "node",
      "args": ["path/to/packages/github-search/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_token"
      }
    },
    "time": {
      "command": "node",
      "args": ["path/to/packages/time/dist/index.js"]
    }
  }
}
```

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看各包的详细文档
2. 检查环境配置
3. 提交 Issue 描述问题

---

> **注意**: 这些是 MCP (Model Context Protocol) 服务器，需要与支持 MCP 的客户端（如 Claude Desktop）配合使用。
