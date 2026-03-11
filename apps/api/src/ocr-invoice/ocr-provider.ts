export type OcrProviderResult = {
  text: string;
  provider: string;
  model: string;
};

export interface OcrProvider {
  /**
   * 当前 provider 是否可用。
   * 未配置密钥时直接返回 false，业务层会回退到待 OCR 状态。
   */
  isEnabled(): boolean;

  /**
   * 识别图片中的文本。
   * 返回纯文本，后续再做发票字段抽取。
   */
  recognizeImage(input: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
  }): Promise<OcrProviderResult>;

  /**
   * 识别扫描 PDF 或无文本层 PDF。
   * 这里走多模态模型，不依赖本地文本层。
   */
  recognizePdf(input: {
    buffer: Buffer;
    fileName: string;
  }): Promise<OcrProviderResult>;
}

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');
