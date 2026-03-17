import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import AdmZip from 'adm-zip';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PDFParse } from 'pdf-parse';
import { OcrProvider, OCR_PROVIDER } from './ocr-provider';
import {
  OcrInvoiceDuplicateInfo,
  OcrInvoiceExtractedFields,
  OcrInvoiceSourceFile,
  OcrInvoiceSourceKind,
  OcrInvoiceTaskResult,
} from './ocr-invoice.types';

type UploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class OcrInvoiceService {
  constructor(
    @Optional()
    @Inject(OCR_PROVIDER)
    private readonly ocrProvider: OcrProvider | null,
  ) {}

  /**
   * 解析上传入口文件。
   * 支持 zip 递归展开，也支持单个 PDF/图片直接入队。
   */
  async parseUpload(
    file: UploadFile | undefined,
  ): Promise<OcrInvoiceTaskResult> {
    if (!file) {
      throw new BadRequestException('请上传 zip、pdf 或图片文件。');
    }

    const normalizedOriginalName = decodeUploadedName(file.originalname);
    const normalizedFile: UploadFile = {
      ...file,
      originalname: normalizedOriginalName,
    };

    const rootExtension = normalizeExtension(normalizedFile.originalname);
    const rootKind = detectKind(rootExtension);

    if (!isSupportedUploadKind(rootKind)) {
      throw new BadRequestException('仅支持 zip、pdf、png、jpg、jpeg 文件。');
    }

    const sourceFiles =
      rootKind === 'zip'
        ? await this.parseZipBuffer(
            normalizedFile.buffer,
            normalizedFile.originalname,
          )
        : [
            await this.buildSourceFile(
              normalizedFile.originalname,
              normalizedFile.originalname,
              normalizedFile,
            ),
          ];
    const normalizedSourceFiles = annotateDuplicateInvoices(sourceFiles);

    const supportedFiles = normalizedSourceFiles.filter(
      (item) => item.kind === 'pdf' || item.kind === 'image',
    );
    const ignoredFiles = normalizedSourceFiles.filter(
      (item) => item.status === 'ignored',
    );
    const pendingFiles = normalizedSourceFiles.filter(
      (item) => item.status === 'pending_ocr',
    );
    const reviewFiles = normalizedSourceFiles.filter(isReviewCandidate);
    const duplicateFiles = normalizedSourceFiles.filter(
      (item) => item.duplicate,
    );

    return {
      taskId: randomUUID(),
      uploadedFileName: normalizedFile.originalname,
      rootKind,
      summary: {
        totalFiles: normalizedSourceFiles.length,
        supportedFiles: supportedFiles.length,
        ignoredFiles: ignoredFiles.length,
        queuedFiles: pendingFiles.length,
        reviewFiles: reviewFiles.length,
        duplicateFiles: duplicateFiles.length,
      },
      sourceFiles: normalizedSourceFiles,
    };
  }

  /**
   * 递归解析 zip 内容。
   * 这里只负责文件展开和类型分流，不做真正 OCR。
   */
  private async parseZipBuffer(buffer: Buffer, archiveName: string) {
    let zip: AdmZip;

    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException(`无法解析压缩包：${archiveName}`);
    }

    const sourceFiles: OcrInvoiceSourceFile[] = [];

    for (const entry of zip.getEntries().filter((item) => !item.isDirectory)) {
      const normalizedPath = sanitizeRelativePath(entry.entryName);

      if (!normalizedPath) {
        continue;
      }

      if (normalizedPath.startsWith('__MACOSX/')) {
        continue;
      }

      const entryBuffer = entry.getData();
      const extension = normalizeExtension(normalizedPath);
      const kind = detectKind(extension);

      if (kind === 'zip') {
        sourceFiles.push(
          ...(await this.parseNestedZip(entryBuffer, normalizedPath)),
        );
        continue;
      }

      sourceFiles.push(
        await this.buildSourceFile(normalizedPath, normalizedPath, {
          originalname: normalizedPath,
          mimetype: guessMimeType(extension),
          size: entryBuffer.length,
          buffer: entryBuffer,
        }),
      );
    }

    return sourceFiles;
  }

  private async parseNestedZip(buffer: Buffer, parentPath: string) {
    let nested: AdmZip;

    try {
      nested = new AdmZip(buffer);
    } catch {
      return [
        {
          id: randomUUID(),
          name: basenameFromPath(parentPath),
          relativePath: parentPath,
          extension: 'zip',
          mimeType: 'application/zip',
          size: buffer.length,
          kind: 'unsupported' as const,
          status: 'ignored' as const,
          note: '嵌套压缩包解析失败，已忽略。',
        },
      ];
    }

    const sourceFiles: OcrInvoiceSourceFile[] = [];

    for (const entry of nested
      .getEntries()
      .filter((item) => !item.isDirectory)) {
      const childPath = sanitizeRelativePath(entry.entryName);
      const combinedPath = childPath
        ? `${parentPath}/${childPath}`
        : parentPath;
      const childBuffer = entry.getData();

      sourceFiles.push(
        await this.buildSourceFile(combinedPath, combinedPath, {
          originalname: combinedPath,
          mimetype: guessMimeType(normalizeExtension(combinedPath)),
          size: childBuffer.length,
          buffer: childBuffer,
        }),
      );
    }

    return sourceFiles;
  }

  /**
   * 为单个文件构建统一结果模型。
   * PDF 会先尝试直接提取文本，图片先进入待 OCR 状态。
   */
  private async buildSourceFile(
    relativePath: string,
    displayName: string,
    file: UploadFile,
  ): Promise<OcrInvoiceSourceFile> {
    const extension = normalizeExtension(file.originalname);
    const kind = detectKind(extension);
    const supported = kind === 'pdf' || kind === 'image';

    if (kind === 'pdf') {
      return this.parsePdfFile(relativePath, displayName, file);
    }

    if (kind === 'image') {
      return this.tryRecognizeWithOcr(relativePath, displayName, file, 'image');
    }

    return {
      id: randomUUID(),
      name: basenameFromPath(displayName),
      relativePath,
      extension,
      mimeType: file.mimetype || guessMimeType(extension),
      size: file.size,
      kind: supported ? kind : 'unsupported',
      status: 'ignored',
      note: supported
        ? '已加入 OCR 队列，等待识别。'
        : '当前文件类型不支持，已忽略。',
    };
  }

  private async parsePdfFile(
    relativePath: string,
    displayName: string,
    file: UploadFile,
  ): Promise<OcrInvoiceSourceFile> {
    let parser: PDFParse | null = null;

    try {
      parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      const normalizedText = normalizeExtractedText(result.text);
      const hasText = normalizedText.length > 0;

      if (!hasText) {
        return this.tryRecognizeWithOcr(relativePath, displayName, file, 'pdf');
      }

      return {
        id: randomUUID(),
        name: basenameFromPath(displayName),
        relativePath,
        extension: 'pdf',
        mimeType: file.mimetype || guessMimeType('pdf'),
        size: file.size,
        kind: 'pdf',
        status: 'parsed',
        note: 'PDF 文本已解析完成。',
        pageCount: result.total,
        extractedText: normalizedText,
        extractedTextPreview: normalizedText.slice(0, 240),
        ocrProvider: 'local-pdf-parse',
        ocrModel: 'pdf-parse',
        invoice: extractInvoiceFields(normalizedText),
      };
    } catch {
      return this.tryRecognizeWithOcr(relativePath, displayName, file, 'pdf');
    } finally {
      await parser?.destroy();
    }
  }

  /**
   * 调用 OCR provider 识别图片或扫描 PDF。
   * 未配置 provider 时回退为 pending_ocr，保证本地开发仍可运行。
   */
  private async tryRecognizeWithOcr(
    relativePath: string,
    displayName: string,
    file: UploadFile,
    kind: 'pdf' | 'image',
  ): Promise<OcrInvoiceSourceFile> {
    if (!this.ocrProvider?.isEnabled()) {
      return {
        id: randomUUID(),
        name: basenameFromPath(displayName),
        relativePath,
        extension: normalizeExtension(file.originalname),
        mimeType:
          file.mimetype || guessMimeType(normalizeExtension(file.originalname)),
        size: file.size,
        kind,
        status: 'pending_ocr',
        note:
          kind === 'pdf'
            ? 'PDF 未提取到文本，待 OCR 识别。'
            : '图片已接收，等待 OCR 识别。',
      };
    }

    try {
      const result =
        kind === 'pdf'
          ? await this.ocrProvider.recognizePdf({
              buffer: file.buffer,
              fileName: displayName,
            })
          : await this.ocrProvider.recognizeImage({
              buffer: file.buffer,
              mimeType:
                file.mimetype ||
                guessMimeType(normalizeExtension(file.originalname)),
              fileName: displayName,
            });
      const normalizedText = normalizeExtractedText(result.text);

      return {
        id: randomUUID(),
        name: basenameFromPath(displayName),
        relativePath,
        extension: normalizeExtension(file.originalname),
        mimeType:
          file.mimetype || guessMimeType(normalizeExtension(file.originalname)),
        size: file.size,
        kind,
        status: normalizedText ? 'parsed' : 'failed',
        note: normalizedText
          ? `${kind === 'pdf' ? 'PDF' : '图片'} OCR 识别完成。`
          : 'OCR 未返回有效文本。',
        extractedText: normalizedText,
        extractedTextPreview: normalizedText.slice(0, 240),
        ocrProvider: result.provider,
        ocrModel: result.model,
        invoice: extractInvoiceFields(normalizedText),
      };
    } catch (error) {
      return {
        id: randomUUID(),
        name: basenameFromPath(displayName),
        relativePath,
        extension: normalizeExtension(file.originalname),
        mimeType:
          file.mimetype || guessMimeType(normalizeExtension(file.originalname)),
        size: file.size,
        kind,
        status: 'failed',
        note:
          error instanceof Error
            ? `OCR 识别失败：${error.message}`
            : 'OCR 识别失败，需人工检查文件内容。',
      };
    }
  }
}

/**
 * 对已解析票据做最小可用的重复检测。
 * 规则分两层：
 * 1. 发票号 + 销售方 + 日期 + 金额 完全一致，判定为明确重复。
 * 2. 无发票号时，用 销售方 + 日期 + 金额 做弱匹配，判定为疑似重复。
 */
function annotateDuplicateInvoices(sourceFiles: OcrInvoiceSourceFile[]) {
  const next = sourceFiles.map((item) => ({ ...item }));
  const exactGroups = new Map<string, OcrInvoiceSourceFile[]>();
  const possibleGroups = new Map<string, OcrInvoiceSourceFile[]>();

  next.forEach((item) => {
    if (item.status !== 'parsed' || !item.invoice) {
      return;
    }

    const exactKey = buildExactDuplicateKey(item.invoice);

    if (exactKey) {
      const group = exactGroups.get(exactKey) ?? [];
      group.push(item);
      exactGroups.set(exactKey, group);
      return;
    }

    const possibleKey = buildPossibleDuplicateKey(item.invoice);

    if (!possibleKey) {
      return;
    }

    const group = possibleGroups.get(possibleKey) ?? [];
    group.push(item);
    possibleGroups.set(possibleKey, group);
  });

  annotateDuplicateGroups(exactGroups, 'exact');
  annotateDuplicateGroups(possibleGroups, 'possible');

  return next;
}

function annotateDuplicateGroups(
  groups: Map<string, OcrInvoiceSourceFile[]>,
  type: OcrInvoiceDuplicateInfo['type'],
) {
  groups.forEach((group) => {
    if (group.length < 2) {
      return;
    }

    const matchedFileIds = group.map((item) => item.id);
    const reason =
      type === 'exact'
        ? '发票号码、日期、金额和开票公司一致，疑似重复报销。'
        : '开票公司、日期和金额一致，但缺少稳定票号，疑似重复报销。';

    group.forEach((item) => {
      item.duplicate = {
        type,
        reason,
        matchedFileIds: matchedFileIds.filter((id) => id !== item.id),
      };
      item.note = reason;
    });
  });
}

function buildExactDuplicateKey(invoice: OcrInvoiceExtractedFields) {
  const invoiceNo = normalizeKeyPart(invoice.invoiceNo);
  const sellerName = normalizeKeyPart(invoice.sellerName);
  const issueDate = normalizeKeyPart(invoice.issueDate);
  const totalAmount = normalizeAmount(invoice.totalAmount);

  if (!invoiceNo || !sellerName || !issueDate || !totalAmount) {
    return '';
  }

  return ['exact', invoiceNo, sellerName, issueDate, totalAmount].join('|');
}

function buildPossibleDuplicateKey(invoice: OcrInvoiceExtractedFields) {
  const sellerName = normalizeKeyPart(invoice.sellerName);
  const issueDate = normalizeKeyPart(invoice.issueDate);
  const totalAmount = normalizeAmount(invoice.totalAmount);

  if (!sellerName || !issueDate || !totalAmount) {
    return '';
  }

  return ['possible', sellerName, issueDate, totalAmount].join('|');
}

function normalizeKeyPart(value?: string) {
  return value?.replace(/\s+/g, '').trim().toLowerCase() ?? '';
}

function normalizeAmount(value?: string) {
  const amount = Number(value ?? '');

  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return amount.toFixed(2);
}

function isReviewCandidate(item: OcrInvoiceSourceFile) {
  return item.status !== 'parsed' || Boolean(item.duplicate);
}

function normalizeExtension(fileName: string) {
  return extname(fileName).replace('.', '').toLowerCase();
}

function detectKind(extension: string): OcrInvoiceSourceKind {
  if (extension === 'zip') {
    return 'zip';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    return 'image';
  }
  return 'unsupported';
}

function isSupportedUploadKind(kind: OcrInvoiceSourceKind) {
  return kind === 'zip' || kind === 'pdf' || kind === 'image';
}

function sanitizeRelativePath(pathValue: string) {
  return pathValue
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.')
    .join('/');
}

function basenameFromPath(pathValue: string) {
  const parts = sanitizeRelativePath(pathValue).split('/');
  return parts[parts.length - 1] ?? pathValue;
}

function decodeUploadedName(value: string) {
  try {
    const decoded = Buffer.from(value, 'latin1').toString('utf8');

    if (looksLikeMojibake(value) && !looksLikeMojibake(decoded)) {
      return decoded;
    }

    return value;
  } catch {
    return value;
  }
}

function looksLikeMojibake(value: string) {
  return /[ÃÂÅÆÇÐÑØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö]/.test(value);
}

function normalizeExtractedText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function guessMimeType(extension: string) {
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 从 OCR 纯文本里抽取发票关键字段。
 * 这里先走规则版，目标是覆盖高频电子发票，而不是一次性做全票种。
 */
function extractInvoiceFields(text: string): OcrInvoiceExtractedFields {
  const invoiceType = matchFirst(text, [
    /(电子发票（普通发票）)/,
    /(电子发票)/,
    /(普通发票)/,
    /(专用发票)/,
    /(电子行程单)/,
  ]);
  const invoiceNo = matchFirst(text, [
    /发票号码[:：]?\s*([A-Z0-9]{8,})/,
    /\b([A-Z]{2}\d{18,})\b/,
    /\b(\d{14,20})\b/,
  ]);
  const issueDate = normalizeDate(
    matchFirst(text, [
      /开票日期[:：]?\s*(\d{4}年\d{1,2}月\d{1,2}日)/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
    ]),
  );
  const buyerName = extractBuyerName(text, issueDate);
  const sellerName = extractSellerName(text, buyerName);
  const amounts = matchAll(text, /¥\s?(\d+\.\d{2})/g).map((item) => item[1]);
  const amountWithoutTax = amounts.length >= 3 ? amounts[0] : undefined;
  const taxAmount =
    amounts.length >= 2 ? amounts[amounts.length - 2] : undefined;
  const totalAmount =
    amounts.length >= 1 ? amounts[amounts.length - 1] : undefined;
  const category = classifyInvoice(text, sellerName);

  return {
    invoiceType: invoiceType || undefined,
    invoiceNo: invoiceNo || undefined,
    issueDate,
    buyerName,
    sellerName,
    amountWithoutTax,
    taxAmount,
    totalAmount,
    category,
  };
}

function extractBuyerName(text: string, issueDate?: string) {
  const labeledBuyer = extractEntityAfterLabel(text, '购买方信息');

  if (labeledBuyer) {
    return labeledBuyer;
  }

  const companyMatches = matchAll(
    text,
    /([\u4e00-\u9fa5A-Za-z0-9（）()·]{3,}(?:公司|中心|事务所|酒店|宾馆|商店|集团|有限公司|科技有限公司))/g,
  ).map((item) => item[1]);

  if (companyMatches.length === 1) {
    return cleanEntityName(companyMatches[0]);
  }

  if (companyMatches.length >= 2) {
    return cleanEntityName(companyMatches[0]);
  }

  const taxpayerIds = matchAll(text, /\b([0-9A-Z]{15,20})\b/g).map(
    (item) => item[1],
  );

  if (issueDate && taxpayerIds.length >= 2) {
    const dateIndex = text.indexOf(issueDate);
    const firstTaxIndex = text.indexOf(taxpayerIds[0], dateIndex);

    if (dateIndex >= 0 && firstTaxIndex > dateIndex) {
      const raw = text.slice(dateIndex + issueDate.length, firstTaxIndex);
      return cleanEntityName(raw);
    }
  }

  return undefined;
}

function extractSellerName(text: string, buyerName?: string) {
  const labeledSeller = extractEntityAfterLabel(text, '销售方信息');

  if (labeledSeller) {
    return labeledSeller;
  }

  const companyMatches = matchAll(
    text,
    /([\u4e00-\u9fa5A-Za-z0-9（）()·]{3,}(?:公司|中心|事务所|酒店|宾馆|商店|集团|有限公司|科技有限公司))/g,
  )
    .map((item) => cleanEntityName(item[1]))
    .filter(Boolean);

  if (!companyMatches.length) {
    return undefined;
  }

  if (buyerName) {
    const seller = companyMatches.find((item) => item !== buyerName);
    if (seller) {
      return seller;
    }
  }

  return companyMatches.length > 1
    ? companyMatches[companyMatches.length - 1]
    : companyMatches[0];
}

function classifyInvoice(
  text: string,
  sellerName?: string,
): OcrInvoiceExtractedFields['category'] {
  const candidate = `${sellerName ?? ''} ${text}`;

  if (
    /(餐饮|咖啡|奶茶|美食|饭店|餐厅|瑞幸|星巴克|肯德基|麦当劳)/.test(candidate)
  ) {
    return '餐饮';
  }
  if (/(机票|航班|航空|打车|出行|高铁|火车|滴滴|交通)/.test(candidate)) {
    return '交通';
  }
  if (/(酒店|住宿|宾馆|旅馆|房费)/.test(candidate)) {
    return '住宿';
  }
  if (/(办公|文具|打印纸|墨盒|耗材)/.test(candidate)) {
    return '办公';
  }
  if (/(服务费|技术服务|信息服务|咨询服务)/.test(candidate)) {
    return '服务';
  }

  return '其他';
}

function extractEntityAfterLabel(text: string, label: string) {
  const start = text.indexOf(label);

  if (start < 0) {
    return undefined;
  }

  const segment = text.slice(start, start + 120);
  const companies = matchAll(
    segment,
    /([\u4e00-\u9fa5A-Za-z0-9（）()·]{3,}(?:公司|中心|事务所|酒店|宾馆|商店|集团|有限公司|科技有限公司))/g,
  ).map((item) => cleanEntityName(item[1]));

  return companies[0];
}

function cleanEntityName(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/^(名称[:：]?\s*)+/, '')
    .replace(
      /^(购买方信息|销售方信息|统一社会信用代码\/纳税人识别号[:：]?\s*)+/g,
      '',
    )
    .replace(/[;；，,。]+$/g, '')
    .trim();
}

function normalizeDate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value.includes('年')) {
    const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);

    if (!match) {
      return value;
    }

    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  return value;
}

function matchFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function matchAll(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern));
}
