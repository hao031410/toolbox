'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { WorkBook } from 'xlsx';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  OcrInvoiceTaskResult,
  uploadOcrInvoiceTask,
} from '@/lib/toolbox-api';

type SummaryCard = {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'warning';
};

type CompanySummary = {
  name: string;
  invoices: number;
  amount: string;
};

type CategorySummary = {
  name: string;
  invoices: number;
  amount: string;
  confidence: string;
};

type InvoiceItem = {
  id: string;
  fileName: string;
  company: string;
  date: string;
  amount: string;
  category: string;
  status: '完成' | '需复核' | '识别失败';
  reason: string;
  invoiceType: string;
  invoiceNo: string;
  taxAmount: string;
  totalAmount: string;
  ocrText: string;
};

const summaryCards: SummaryCard[] = [
  { label: '票据总数', value: '18', hint: '22 个文件中识别出 18 张票据。' },
  { label: '总金额', value: '¥12,486.20', hint: '已排除失败文件。' },
  { label: '开票公司数', value: '7', hint: '公司名归一后统计。' },
  { label: '需复核数', value: '3', hint: '需人工确认。', tone: 'warning' },
];

const companySummary: CompanySummary[] = [
  { name: '杭州西湖餐饮管理有限公司', invoices: 5, amount: '¥2,368.00' },
  { name: '中国东方航空股份有限公司', invoices: 3, amount: '¥4,780.00' },
  { name: '滴滴出行科技有限公司', invoices: 4, amount: '¥326.50' },
  { name: '上海锦江之星旅馆有限公司', invoices: 2, amount: '¥1,280.00' },
  { name: '京东五星电器集团有限公司', invoices: 2, amount: '¥2,930.00' },
];

const categorySummary: CategorySummary[] = [
  { name: '交通', invoices: 7, amount: '¥5,106.50', confidence: '92%' },
  { name: '餐饮', invoices: 5, amount: '¥2,368.00', confidence: '95%' },
  { name: '住宿', invoices: 2, amount: '¥1,280.00', confidence: '94%' },
  { name: '办公', invoices: 2, amount: '¥2,930.00', confidence: '88%' },
  { name: '其他', invoices: 2, amount: '¥801.70', confidence: '61%' },
];

const invoices: InvoiceItem[] = [
  {
    id: 'inv-001',
    fileName: '2026-03-餐饮-01.pdf',
    company: '杭州西湖餐饮管理有限公司',
    date: '2026-03-02',
    amount: '¥486.00',
    category: '餐饮',
    status: '完成',
    reason: '销售方名称与商品明细均命中餐饮规则。',
    invoiceType: '电子发票',
    invoiceNo: '420001234567',
    taxAmount: '¥28.31',
    totalAmount: '¥486.00',
    ocrText: '餐饮服务费 午餐消费 合计486.00 销售方 杭州西湖餐饮管理有限公司',
  },
  {
    id: 'inv-002',
    fileName: '2026-03-机票-01.pdf',
    company: '中国东方航空股份有限公司',
    date: '2026-03-03',
    amount: '¥1,860.00',
    category: '交通',
    status: '完成',
    reason: '票据类型识别为航空运输电子客票行程单。',
    invoiceType: '电子行程单',
    invoiceNo: '781204928341',
    taxAmount: '¥0.00',
    totalAmount: '¥1,860.00',
    ocrText: '旅客运输服务 电子客票行程单 中国东方航空 杭州-北京 1860.00',
  },
  {
    id: 'inv-003',
    fileName: '2026-03-打车-02.jpg',
    company: '滴滴出行科技有限公司',
    date: '2026-03-04',
    amount: '¥42.50',
    category: '交通',
    status: '完成',
    reason: '平台名和服务明细命中打车规则。',
    invoiceType: '电子发票',
    invoiceNo: '033894284921',
    taxAmount: '¥1.24',
    totalAmount: '¥42.50',
    ocrText: '滴滴出行 出租车客运服务 42.50 销售方 滴滴出行科技有限公司',
  },
  {
    id: 'inv-004',
    fileName: '2026-03-办公用品-01.pdf',
    company: '京东五星电器集团有限公司',
    date: '2026-03-05',
    amount: '¥1,480.00',
    category: '办公',
    status: '完成',
    reason: '商品明细含办公耗材、打印纸、墨盒。',
    invoiceType: '电子发票',
    invoiceNo: '420001238866',
    taxAmount: '¥85.84',
    totalAmount: '¥1,480.00',
    ocrText: '办公用品 打印纸 墨盒 销售方 京东五星电器集团有限公司 合计1480.00',
  },
  {
    id: 'inv-005',
    fileName: '2026-03-住宿-01.pdf',
    company: '上海锦江之星旅馆有限公司',
    date: '2026-03-06',
    amount: '¥640.00',
    category: '住宿',
    status: '完成',
    reason: '酒店住宿服务识别明确。',
    invoiceType: '电子发票',
    invoiceNo: '510024982341',
    taxAmount: '¥37.28',
    totalAmount: '¥640.00',
    ocrText: '住宿服务 房费 上海锦江之星旅馆有限公司 合计640.00',
  },
  {
    id: 'inv-006',
    fileName: '2026-03-未知-01.png',
    company: '杭州城市服务有限公司',
    date: '2026-03-07',
    amount: '¥301.70',
    category: '其他',
    status: '需复核',
    reason: '销售方可识别，但费用类别候选冲突，模型置信度 58%。',
    invoiceType: '电子发票',
    invoiceNo: '510024982999',
    taxAmount: '¥17.58',
    totalAmount: '¥301.70',
    ocrText: '城市服务费 综合保障服务 杭州城市服务有限公司 301.70',
  },
  {
    id: 'inv-007',
    fileName: '2026-03-模糊扫描-01.jpg',
    company: '未识别',
    date: '2026-03-08',
    amount: '¥0.00',
    category: '其他',
    status: '识别失败',
    reason: '原图模糊且关键信息缺失，建议人工补录。',
    invoiceType: '扫描件',
    invoiceNo: '--',
    taxAmount: '¥0.00',
    totalAmount: '¥0.00',
    ocrText: 'OCR 结果置信度过低，未提取到有效金额。',
  },
];

function buildKindSummary(taskResult: OcrInvoiceTaskResult): CompanySummary[] {
  const groups = new Map<string, { invoices: number; amount: string }>();

  taskResult.sourceFiles.forEach((item) => {
    const label =
      item.kind === 'pdf'
        ? 'PDF 文件'
        : item.kind === 'image'
          ? '图片文件'
          : '忽略文件';
    const next = groups.get(label) ?? {
      invoices: 0,
      amount: item.kind === 'unsupported' ? '已忽略' : '待 OCR',
    };
    next.invoices += 1;
    groups.set(label, next);
  });

  return Array.from(groups.entries()).map(([name, value]) => ({
    name,
    invoices: value.invoices,
    amount: value.amount,
  }));
}

function buildExtensionSummary(taskResult: OcrInvoiceTaskResult): CategorySummary[] {
  const groups = new Map<string, number>();

  taskResult.sourceFiles.forEach((item) => {
    const label = item.extension ? `.${item.extension}` : '无后缀';
    groups.set(label, (groups.get(label) ?? 0) + 1);
  });

  return Array.from(groups.entries()).map(([name, count]) => ({
    name,
    invoices: count,
    amount: count > 0 ? '已接收' : '--',
    confidence: `${Math.round((count / taskResult.summary.totalFiles) * 100)}%`,
  }));
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

function formatCurrency(value?: string) {
  if (!value) {
    return '--';
  }

  return `¥${value}`;
}

function buildExtractedCompanySummary(taskResult: OcrInvoiceTaskResult): CompanySummary[] {
  const groups = new Map<string, { invoices: number; amount: number }>();

  taskResult.sourceFiles.forEach((item) => {
    const name = item.invoice?.sellerName;

    if (!name) {
      return;
    }

    const totalAmount = Number(item.invoice?.totalAmount ?? 0);
    const current = groups.get(name) ?? { invoices: 0, amount: 0 };
    current.invoices += 1;
    current.amount += Number.isFinite(totalAmount) ? totalAmount : 0;
    groups.set(name, current);
  });

  if (!groups.size) {
    return buildKindSummary(taskResult);
  }

  return Array.from(groups.entries()).map(([name, value]) => ({
    name,
    invoices: value.invoices,
    amount: `¥${value.amount.toFixed(2)}`,
  }));
}

function buildExtractedCategorySummary(taskResult: OcrInvoiceTaskResult): CategorySummary[] {
  const groups = new Map<string, { invoices: number; amount: number }>();

  taskResult.sourceFiles.forEach((item) => {
    const category = item.invoice?.category;

    if (!category) {
      return;
    }

    const totalAmount = Number(item.invoice?.totalAmount ?? 0);
    const current = groups.get(category) ?? { invoices: 0, amount: 0 };
    current.invoices += 1;
    current.amount += Number.isFinite(totalAmount) ? totalAmount : 0;
    groups.set(category, current);
  });

  if (!groups.size) {
    return buildExtensionSummary(taskResult);
  }

  return Array.from(groups.entries()).map(([name, value]) => ({
    name,
    invoices: value.invoices,
    amount: `¥${value.amount.toFixed(2)}`,
    confidence: '规则',
  }));
}

function buildDetailRows(
  filteredInvoices: InvoiceItem[],
  taskResult: OcrInvoiceTaskResult | null,
) {
  return [
    ['文件名', '销售方', '购买方', '开票日期', '发票类型', '发票号码', '分类', '税额', '价税合计', '状态', '说明'],
    ...filteredInvoices.map((item) => [
      item.fileName,
      item.company,
      taskResult?.sourceFiles.find((source) => source.id === item.id)?.invoice?.buyerName ?? '--',
      item.date,
      item.invoiceType,
      item.invoiceNo,
      item.category,
      item.taxAmount,
      item.totalAmount,
      item.status,
      item.reason,
    ]),
  ];
}

function buildCompanyRows(liveCompanySummary: CompanySummary[]) {
  return [
    ['开票公司', '票据数', '金额'],
    ...liveCompanySummary.map((item) => [
      item.name,
      String(item.invoices),
      item.amount,
    ]),
  ];
}

function buildCategoryRows(liveCategorySummary: CategorySummary[]) {
  return [
    ['分类', '票据数', '金额', '说明'],
    ...liveCategorySummary.map((item) => [
      item.name,
      String(item.invoices),
      item.amount,
      item.confidence,
    ]),
  ];
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

function buildCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
}

function triggerTextDownload(fileName: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function triggerBinaryDownload(fileName: string, content: ArrayBuffer) {
  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function OcrInvoicePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [taskResult, setTaskResult] = useState<OcrInvoiceTaskResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('全部公司');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部分类');
  const [onlyReview, setOnlyReview] = useState(false);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(invoices[0]?.id ?? '');

  const liveInvoices = useMemo(() => {
    if (!taskResult) {
      return invoices;
    }

    return taskResult.sourceFiles.map((item) => ({
      id: item.id,
      fileName: item.name,
      company:
        item.status === 'parsed'
          ? item.invoice?.sellerName || item.invoice?.buyerName || '文本已提取'
          : item.kind === 'unsupported'
            ? '不支持文件'
            : '待 OCR 识别',
      date: item.invoice?.issueDate || '--',
      amount: formatCurrency(item.invoice?.totalAmount),
      category:
        item.status === 'parsed'
          ? item.invoice?.category || '待分类'
          : item.kind === 'unsupported'
            ? '已忽略'
            : '待分类',
      status:
        item.status === 'parsed'
          ? ('完成' as const)
          : item.status === 'ignored'
            ? ('识别失败' as const)
            : item.status === 'failed'
              ? ('识别失败' as const)
              : ('需复核' as const),
      reason:
        item.status === 'parsed' && item.extractedTextPreview
          ? `已通过 ${item.ocrProvider ?? 'OCR'} 完成识别${item.invoice?.sellerName ? `，销售方：${item.invoice.sellerName}` : ''}。`
          : item.note,
      invoiceType: item.invoice?.invoiceType
        ? `${item.invoice.invoiceType}${item.ocrModel ? ` / ${item.ocrModel}` : ''}`
        : item.kind === 'pdf'
          ? `PDF${item.pageCount ? ` / ${item.pageCount} 页` : ''}${item.ocrModel ? ` / ${item.ocrModel}` : ''}`
          : item.kind === 'image'
            ? `图片${item.ocrModel ? ` / ${item.ocrModel}` : ''}`
            : '压缩包内文件',
      invoiceNo: item.invoice?.invoiceNo || '--',
      taxAmount: formatCurrency(item.invoice?.taxAmount),
      totalAmount:
        item.invoice?.totalAmount
          ? formatCurrency(item.invoice.totalAmount)
          : item.status === 'parsed' && item.extractedTextPreview
            ? `${item.extractedTextPreview.length} 字`
          : item.size > 0
            ? formatFileSize(item.size)
            : '--',
      ocrText: item.extractedTextPreview || item.relativePath,
    }));
  }, [taskResult]);

  const activeItem = liveInvoices.find((item) => item.id === activeId) ?? liveInvoices[0];

  const liveSummaryCards = taskResult
    ? (() => {
        const parsedItems = taskResult.sourceFiles.filter(
          (item) => item.status === 'parsed',
        );
        const reviewCount = taskResult.sourceFiles.filter(
          (item) => item.status !== 'parsed',
        ).length;
        const companyCount = new Set(
          parsedItems
            .map((item) => item.invoice?.sellerName)
            .filter(Boolean),
        ).size;
        const totalAmount = parsedItems.reduce((sum, item) => {
          const value = Number(item.invoice?.totalAmount ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        return [
          {
            label: '票据总数',
            value: String(taskResult.summary.totalFiles),
            hint: `来自 ${taskResult.uploadedFileName}`,
          },
          {
            label: '总金额',
            value: totalAmount > 0 ? `¥${totalAmount.toFixed(2)}` : '--',
            hint: '已按已解析票据统计。',
          },
          {
            label: '开票公司数',
            value: String(companyCount),
            hint: '按销售方去重。',
          },
          {
            label: '需复核数',
            value: String(reviewCount),
            hint: '待 OCR 或识别失败。',
            tone: 'warning' as const,
          },
        ];
      })()
    : summaryCards;

  const liveCompanySummary = taskResult
    ? buildExtractedCompanySummary(taskResult)
    : companySummary;

  const liveCategorySummary = taskResult
    ? buildExtractedCategorySummary(taskResult)
    : categorySummary;

  const companyOptions = useMemo(() => {
    return Array.from(
      new Set(
        liveInvoices
          .map((item) => item.company)
          .filter((item) => item && item !== '不支持文件' && item !== '待 OCR 识别'),
      ),
    );
  }, [liveInvoices]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        liveInvoices
          .map((item) => item.category)
          .filter((item) => item && item !== '已忽略' && item !== '待分类'),
      ),
    );
  }, [liveInvoices]);

  const filteredInvoices = useMemo(() => {
    return liveInvoices.filter((item) => {
      if (selectedCompany !== '全部公司' && item.company !== selectedCompany) {
        return false;
      }
      if (selectedCategory !== '全部分类' && item.category !== selectedCategory) {
        return false;
      }
      if (onlyReview && item.status === '完成') {
        return false;
      }
      if (!search.trim()) {
        return true;
      }

      const keyword = search.trim().toLowerCase();
      return `${item.fileName} ${item.company} ${item.category} ${item.reason}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [liveInvoices, onlyReview, search, selectedCategory, selectedCompany]);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const result = await uploadOcrInvoiceTask(file);
      setTaskResult(result);
      setActiveId(result.sourceFiles[0]?.id ?? '');
      setSelectedCompany('全部公司');
      setSelectedCategory('全部分类');
      setOnlyReview(false);
      setSearch('');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败，请重试。');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    const timeTag = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const detailRows = buildDetailRows(filteredInvoices, taskResult);
    const companyRows = buildCompanyRows(liveCompanySummary);
    const categoryRows = buildCategoryRows(liveCategorySummary);

    try {
      const xlsx = await import('xlsx');
      const workbook: WorkBook = xlsx.utils.book_new();

      xlsx.utils.book_append_sheet(
        workbook,
        xlsx.utils.aoa_to_sheet(detailRows),
        '票据明细',
      );
      xlsx.utils.book_append_sheet(
        workbook,
        xlsx.utils.aoa_to_sheet(companyRows),
        '公司汇总',
      );
      xlsx.utils.book_append_sheet(
        workbook,
        xlsx.utils.aoa_to_sheet(categoryRows),
        '分类汇总',
      );

      const buffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      }) as ArrayBuffer;

      triggerBinaryDownload(`invoice-summary-${timeTag}.xlsx`, buffer);
    } catch {
      triggerTextDownload(
        `invoice-detail-${timeTag}.csv`,
        buildCsv(detailRows),
      );
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header fade-up">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">你的工具箱</span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link href="/">首页</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="main-content invoice-page">
        <section className="page-intro invoice-intro fade-up fade-delay-1">
          <h1>发票 OCR 汇总</h1>
          <p>上传票据文件，自动识别并汇总。</p>
        </section>

        <section className="invoice-upload-grid fade-up fade-delay-2">
          <article className="invoice-dropzone">
            <div className="invoice-dropzone-head">
              <span className="invoice-dropzone-tag">Single Task Tool</span>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? '上传中' : '选择文件'}
              </button>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept=".zip,.pdf,.png,.jpg,.jpeg"
                onChange={(event) => {
                  void handleFileSelect(event.target.files?.[0]);
                }}
              />
            </div>
            <div className="invoice-dropzone-body">
              <div className="invoice-dropzone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V6" />
                  <path d="m8 10 4-4 4 4" />
                  <path d="M5 18h14" />
                </svg>
              </div>
              <h2>拖拽文件到这里，或点击上传</h2>
              <p>支持 ZIP 递归识别。格式：zip / pdf / png / jpg。</p>
              {uploadError ? (
                <p className="invoice-inline-error">{uploadError}</p>
              ) : null}
            </div>
          </article>

          <article className="invoice-task-card">
            <div className="invoice-task-head">
              <h2>任务状态</h2>
              <span className="invoice-task-badge">
                {isUploading
                  ? '上传中'
                  : taskResult
                    ? '待识别'
                    : '等待上传'}
              </span>
            </div>
            <div className="invoice-task-progress">
              <div className="invoice-task-progress-bar">
                <span
                  style={{
                    width: isUploading ? '35%' : taskResult ? '100%' : '12%',
                  }}
                />
              </div>
              <p>
                当前阶段：
                {isUploading
                  ? ' 文件上传'
                  : taskResult
                    ? ' 等待 OCR 识别'
                    : ' 等待任务开始'}
              </p>
            </div>
            <div className="invoice-task-stats">
              <div>
                <strong>{taskResult?.summary.totalFiles ?? '0'}</strong>
                <span>文件总数</span>
              </div>
              <div>
                <strong>{taskResult?.summary.queuedFiles ?? '0'}</strong>
                <span>待识别</span>
              </div>
              <div>
                <strong>{taskResult?.summary.ignoredFiles ?? '0'}</strong>
                <span>已忽略</span>
              </div>
              <div>
                <strong>{taskResult ? taskResult.rootKind.toUpperCase() : '--'}</strong>
                <span>上传入口</span>
              </div>
            </div>
          </article>
        </section>

        <section className="invoice-summary-grid fade-up fade-delay-2">
          {liveSummaryCards.map((card) => (
            <article
              key={card.label}
              className={`invoice-summary-card ${
                card.tone === 'warning' ? 'is-warning' : ''
              }`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </article>
          ))}
        </section>

        <section className="invoice-report-grid fade-up fade-delay-3">
          <article className="invoice-report-card">
            <div className="invoice-report-head">
              <h2>按开票公司汇总</h2>
              <span>{liveCompanySummary.length} 家</span>
            </div>
            <div className="invoice-table-wrap invoice-report-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>开票公司</th>
                    <th>数量</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {liveCompanySummary.map((item) => (
                    <tr
                      key={item.name}
                      onClick={() => {
                        if (!taskResult) {
                          setSelectedCompany(item.name);
                        }
                      }}
                    >
                      <td>{item.name}</td>
                      <td>{item.invoices}</td>
                      <td>{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="invoice-report-card">
            <div className="invoice-report-head">
              <h2>智能汇总</h2>
              <span>{liveCategorySummary.length} 类</span>
            </div>
            <div className="invoice-table-wrap invoice-report-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>分类</th>
                    <th>数量</th>
                    <th>金额</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {liveCategorySummary.map((item) => (
                    <tr
                      key={item.name}
                      onClick={() => {
                        if (!taskResult) {
                          setSelectedCategory(item.name);
                        }
                      }}
                    >
                      <td>{item.name}</td>
                      <td>{item.invoices}</td>
                      <td>{item.amount}</td>
                      <td>{item.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="invoice-detail-grid fade-up fade-delay-3">
          <article className="invoice-report-card invoice-detail-card invoice-detail-main">
            <div className="invoice-report-head invoice-detail-head">
              <div>
                <h2>票据明细</h2>
                <p>筛选与导出</p>
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleExport}
                disabled={!liveInvoices.length}
              >
                导出 Excel
              </button>
            </div>

            <div className="invoice-toolbar">
              <label className="invoice-search-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索文件名 / 公司 / 分类"
                />
              </label>

              <select
                className="invoice-select"
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
              >
                <option>全部公司</option>
                {companyOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                className="invoice-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option>全部分类</option>
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <button
                className={`invoice-filter-chip ${onlyReview ? 'is-active' : ''}`}
                type="button"
                onClick={() => setOnlyReview((value) => !value)}
              >
                异常
              </button>
            </div>

            <div className="invoice-table-wrap invoice-table-scroll invoice-detail-table-wrap">
              <table className="invoice-table invoice-detail-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>开票公司</th>
                    <th>日期</th>
                    <th>金额</th>
                    <th>分类</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((item) => (
                    <tr
                      key={item.id}
                    className={item.id === activeItem?.id ? 'is-active' : ''}
                    onClick={() => setActiveId(item.id)}
                  >
                      <td>{item.fileName}</td>
                      <td>{item.company}</td>
                      <td>{item.date}</td>
                      <td>{item.amount}</td>
                      <td>{item.category}</td>
                      <td>
                        <span
                          className={`invoice-status-badge ${
                            item.status === '完成'
                              ? 'is-done'
                              : item.status === '需复核'
                                ? 'is-review'
                                : 'is-failed'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="invoice-report-card invoice-drawer">
            <div className="invoice-drawer-scroll">
              <div className="invoice-report-head invoice-drawer-head">
                <h2>票据详情</h2>
                <span>{activeItem.status}</span>
              </div>

              <div className="invoice-preview">
                <div className="invoice-preview-paper">
                  <span>预览占位</span>
                  <small>{activeItem.fileName}</small>
                </div>
              </div>

              <div className="invoice-field-grid">
                <label>
                  <span>开票公司</span>
                  <input value={activeItem.company} readOnly />
                </label>
                <label>
                  <span>金额</span>
                  <input value={activeItem.amount} readOnly />
                </label>
                <label>
                  <span>分类</span>
                  <input value={activeItem.category} readOnly />
                </label>
                <label>
                  <span>开票日期</span>
                  <input value={activeItem.date} readOnly />
                </label>
                <label>
                  <span>票据类型</span>
                  <input value={activeItem.invoiceType} readOnly />
                </label>
                <label>
                  <span>发票号码</span>
                  <input value={activeItem.invoiceNo} readOnly />
                </label>
              </div>

              <div className="invoice-meta-block">
                <h3>结构化结果</h3>
                <ul>
                  <li>税额：{activeItem.taxAmount}</li>
                  <li>价税合计：{activeItem.totalAmount}</li>
                  <li>分类理由：{activeItem.reason}</li>
                </ul>
              </div>

              <div className="invoice-meta-block">
                <h3>OCR 原文</h3>
                <p>{activeItem.ocrText}</p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
