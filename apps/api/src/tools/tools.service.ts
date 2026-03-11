import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolsService {
  listTools() {
    return [
      {
        group: 'daily',
        title: '日常工具',
        tools: [
          {
            key: 'calculator',
            name: '计算器',
            description: '表达式计算、括号、小数、历史记录。',
            status: 'available',
          },
        ],
      },
      {
        group: 'developer',
        title: '开发者工具',
        tools: [
          {
            key: 'timestamp',
            name: '时间戳转换',
            description: 'Unix 时间与日期格式互转。',
            status: 'planned',
          },
          {
            key: 'diff',
            name: '文本比对',
            description: '快速对比两段文本差异。',
            status: 'planned',
          },
          {
            key: 'random',
            name: '随机字符串',
            description: '生成测试用随机内容。',
            status: 'planned',
          },
        ],
      },
    ];
  }
}
