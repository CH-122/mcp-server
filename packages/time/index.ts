#!/usr/bin/env node

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import packageJson from './package.json';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 扩展 UTC 插件
dayjs.extend(utc);
// 扩展时区插件
dayjs.extend(timezone);

const server = new McpServer({
  name: 'mcp-server-time',
  version: packageJson.version,
});

server.tool(
  'get_current_time',
  '获取当前时间',
  { timezone: z.string().optional() },
  async ({ timezone }) => {
    // 获取时区
    const tz = timezone || process.env.LOCAL_TIMEZONE || 'Asia/Shanghai';

    const currentTime = dayjs().tz(tz).format('YYYY-MM-DD HH:mm:ss');

    return {
      // 返回当前时间    JSON.stringify 将对象转换为字符串  2 表示缩进2个空格
      content: [{ type: 'text', text: JSON.stringify({ currentTime }, null, 2) }],
    };
  }
);

server.tool(
  'convert_time',
  '在时区间转换时间',
  {
    source_timezone: z.string().optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:MM'),
    target_timezone: z.string(),
  },
  async ({ source_timezone, time, target_timezone }) => {
    const sourceTime = dayjs.tz(`${dayjs().format('YYYY-MM-DD')} ${time}`, source_timezone);
    const convertedTime = sourceTime.clone().tz(target_timezone).format();

    return {
      content: [{ type: 'text', text: JSON.stringify({ convertedTime }, null, 2) }],
    };
  }
);

async function runServer() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('获取当前时间和时区转换的 MCP 服务器已在 stdio 中启动');
}

runServer().catch((error) => {
  console.error('获取当前时间和时区转换的 MCP 服务器启动失败', error);
  process.exit(1);
});
