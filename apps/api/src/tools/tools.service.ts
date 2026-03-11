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
            key: 'lan-transfer',
            name: '局域网文件传输',
            description: '同一局域网内直连传文件，手机电脑免中转。',
            status: 'available',
          },
          {
            key: 'ocr-invoice',
            name: '发票 OCR 汇总',
            description: '批量识别 PDF、图片、ZIP 并汇总导出。',
            status: 'available',
          },
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
