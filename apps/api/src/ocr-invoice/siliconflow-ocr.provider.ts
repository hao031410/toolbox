import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrProvider, OcrProviderResult } from './ocr-provider';

type SiliconFlowMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | {
          type: 'image_url';
          image_url: {
            url: string;
          };
        }
    >;

type SiliconFlowResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

const defaultApiBaseUrl = 'https://api.siliconflow.cn/v1';
const defaultModel = 'deepseek-ai/DeepSeek-OCR';
const ocrPrompt =
  '请执行 OCR，只输出识别到的原始文本，保持阅读顺序，不要解释，不要总结，不要补充。';

@Injectable()
export class SiliconFlowOcrProvider implements OcrProvider {
  constructor(private readonly configService: ConfigService) {}

  isEnabled() {
    return Boolean(this.configService.get<string>('SILICON_FLOW_API_KEY'));
  }

  async recognizeImage(input: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
  }): Promise<OcrProviderResult> {
    return this.requestOcr([
      {
        role: 'user',
        content: [
          { type: 'text', text: `${ocrPrompt}\n文件名：${input.fileName}` },
          {
            type: 'image_url',
            image_url: {
              url: toDataUrl(input.mimeType, input.buffer),
            },
          },
        ],
      },
    ]);
  }

  async recognizePdf(input: {
    buffer: Buffer;
    fileName: string;
  }): Promise<OcrProviderResult> {
    return this.requestOcr([
      {
        role: 'user',
        content: [
          { type: 'text', text: `${ocrPrompt}\n文件名：${input.fileName}` },
          {
            type: 'image_url',
            image_url: {
              url: toDataUrl('application/pdf', input.buffer),
            },
          },
        ],
      },
    ]);
  }

  /**
   * 统一走 SiliconFlow OpenAI 兼容接口。
   * 这里只取模型主回复文本，避免把上层耦合到具体响应结构。
   */
  private async requestOcr(
    messages: Array<{ role: 'user'; content: SiliconFlowMessageContent }>,
  ): Promise<OcrProviderResult> {
    const apiKey = this.configService.get<string>('SILICON_FLOW_API_KEY');

    if (!apiKey) {
      throw new Error('未配置 SILICON_FLOW_API_KEY');
    }

    const apiBaseUrl =
      this.configService.get<string>('SILICON_FLOW_BASE_URL') ??
      defaultApiBaseUrl;
    const model =
      this.configService.get<string>('SILICON_FLOW_OCR_MODEL') ?? defaultModel;

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SiliconFlow OCR 请求失败: ${response.status} ${errorText}`,
      );
    }

    const payload = (await response.json()) as SiliconFlowResponse;
    const text = extractMessageContent(payload).trim();

    if (!text) {
      throw new Error('SiliconFlow OCR 未返回有效文本');
    }

    return {
      text,
      provider: 'siliconflow',
      model,
    };
  }
}

function toDataUrl(mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function extractMessageContent(payload: SiliconFlowResponse) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? '')
      .join('\n')
      .trim();
  }

  return '';
}
