#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import packageJson from './package.json';
import { z } from 'zod';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

const server = new Server(
  {
    name: 'mcp-server-github-search',
    version: packageJson.version,
  },
  {
    // 工具
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 搜索参数
 */
const SearchParamsSchema = z.object({
  query: z.string().describe('搜索关键词, 用于匹配 GitHub 中的内容'),
  page: z.number().optional().default(1).describe('页码, 用于分页查询'),
  perPage: z.number().optional().default(10).describe('每页条数, 用于分页查询'),
  type: z
    .enum(['repositories', 'code', 'issues', 'users'])
    .optional()
    .describe('搜索类型, 可选值: repositories, code, issues, users'),
});

/**
 * 用户信息参数
 */
const UserInfoParamsSchema = z.object({
  username: z.string().describe('用户名, 用于查询用户信息'),
});

// 定义工具列表及输入参数
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_github',
        description: '搜索 GitHub 中的仓库、代码、问题、用户',
        inputSchema: zodToJsonSchema(SearchParamsSchema),
      },
      {
        name: 'get_user_info',
        description: '获取 GitHub 用户信息',
        inputSchema: zodToJsonSchema(UserInfoParamsSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.name) {
      throw new Error('Tool name is required');
    }

    switch (request.params.name) {
      case 'search_github': {
        const { query, page, perPage, type } = SearchParamsSchema.parse(request.params.arguments);

        const url = new URL(`https://api.github.com/search/${type}`);
        url.searchParams.set('q', encodeURIComponent(query));
        url.searchParams.set('page', page.toString());
        url.searchParams.set('per_page', perPage.toString());

        const res = await fetch(url.toString(), {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
        });

        if (!res.ok) {
          throw new Error(`GitHub API 错误: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      case 'get_user_info': {
        const { username } = UserInfoParamsSchema.parse(request.params.arguments);

        const url = new URL(`https://api.github.com/users/${encodeURIComponent(username)}`);

        console.log('username', username);
        console.log('urlllllllllllllllll', url.toString());

        const res = await fetch(url.toString(), {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
        });

        if (!res.ok) {
          throw new Error(`GitHub API 错误: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      default: {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub 搜索 MCP 服务器已在 stdio 上启动');
}

runServer().catch((error) => {
  console.error('启动服务器时出错:', error);
  process.exit(1);
});
