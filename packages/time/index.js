#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const package_json_1 = __importDefault(require("./package.json"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// 扩展 UTC 插件
dayjs_1.default.extend(utc_1.default);
// 扩展时区插件
dayjs_1.default.extend(timezone_1.default);
const server = new mcp_js_1.McpServer({
    name: 'mcp-server-time',
    version: package_json_1.default.version,
});
server.tool('get_current_time', '获取当前时间', { timezone: zod_1.z.string().optional() }, async ({ timezone }) => {
    // 获取时区
    const tz = timezone || process.env.LOCAL_TIMEZONE || 'Asia/Shanghai';
    const currentTime = (0, dayjs_1.default)().tz(tz).format('YYYY-MM-DD HH:mm:ss');
    return {
        // 返回当前时间    JSON.stringify 将对象转换为字符串  2 表示缩进2个空格
        content: [{ type: 'text', text: JSON.stringify({ currentTime }, null, 2) }],
    };
});
server.tool('convert_time', '在时区间转换时间', {
    source_timezone: zod_1.z.string().optional(),
    time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:MM'),
    target_timezone: zod_1.z.string(),
}, async ({ source_timezone, time, target_timezone }) => {
    const sourceTime = dayjs_1.default.tz(`${(0, dayjs_1.default)().format('YYYY-MM-DD')} ${time}`, source_timezone);
    const convertedTime = sourceTime.clone().tz(target_timezone).format();
    return {
        content: [{ type: 'text', text: JSON.stringify({ convertedTime }, null, 2) }],
    };
});
async function runServer() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('获取当前时间和时区转换的 MCP 服务器已在 stdio 中启动');
}
runServer().catch((error) => {
    console.error('获取当前时间和时区转换的 MCP 服务器启动失败', error);
    process.exit(1);
});
