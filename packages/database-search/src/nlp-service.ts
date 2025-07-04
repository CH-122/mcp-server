import OpenAI from 'openai';

export class NLPService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        baseURL: 'https://burn.hair/',
        apiKey,
      });
    }
  }

  async convertToSQL(
    naturalLanguage: string,
    tabseStructure: any,
    databaseType: string
  ): Promise<string> {
    if (!this.openai) {
      return this.simpleConversion(naturalLanguage, tabseStructure, databaseType);
    }

    const prompt = this.buildPrompt(naturalLanguage, tabseStructure, databaseType);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的SQL查询生成助手，根据自然语言描述生成准确的SQL查询语句。只返回SQL语句，不要包含任何解释。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      });

      const sql = response.choices[0]?.message?.content?.trim() || '';

      if (!sql) {
        throw new Error('SQL生成失败');
      }

      return this.sanitizeSQL(sql);
    } catch (error) {
      console.error('SQL生成失败:', error);
      return this.simpleConversion(naturalLanguage, tabseStructure, databaseType);
    }
  }

  private buildPrompt(naturalLanguage: string, tableStructure: any, databaseType: string): string {
    return `
    数据库类型: ${databaseType}

    表结构:
    ${JSON.stringify(tableStructure, null, 2)}

    自然语言查询: ${naturalLanguage}

    请生成对应的SQL查询语句。注意：
    1. 只返回SQL语句，不要任何解释
    2. 使用正确的${databaseType}语法
    3. 考虑表结构和字段类型
    4. 确保查询安全，避免SQL注入
    `;
  }

  private simpleConversion(
    naturalLanguage: string,
    tableStructure: any,
    databaseType: string
  ): string {
    const text = naturalLanguage.toLowerCase();

    // 简单的关键词匹配转换
    if (text.includes('所有') || text.includes('全部') || text.includes('all')) {
      const tableName = Object.keys(tableStructure)[0] || 'table';
      return `SELECT * FROM ${tableName} LIMIT 100`;
    }

    if (text.includes('数量') || text.includes('count')) {
      const tableName = Object.keys(tableStructure)[0] || 'table';
      return `SELECT COUNT(*) as count FROM ${tableName}`;
    }

    // 默认查询
    const tableName = Object.keys(tableStructure)[0] || 'table';
    return `SELECT * FROM ${tableName} LIMIT 10`;
  }

  private sanitizeSQL(sql: string): string {
    // 移除SQL注释和潜在的危险语句
    sql = sql.replace(/--.*$/gm, '');
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

    // 移除危险的关键词
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
    const upperSQL = sql.toUpperCase();

    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        throw new Error(`查询包含危险关键词: ${keyword}`);
      }
    }

    return sql.trim();
  }
}
