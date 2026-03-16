'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { WorkBook } from 'xlsx';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  OcrInvoiceTaskResult,
  OcrInvoiceTaskFile,
  uploadOcrInvoiceTask,
} from '@/lib/toolbox-api';

type WorkflowPhase = 'idle' | 'uploading' | 'done';

type FileWithPreview = {
  file: File;
  id: string;
  status: 'pending' | 'success' | 'error';
  amount?: string;
};

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
}

function formatCurrency(value?: string | number): string {
  if (!value) return '--';
  return `¥${value}`;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========== 导出工具函数 ==========

function buildDetailRows(
  sourceFiles: OcrInvoiceTaskFile[],
): string[][] {
  return [
    ['文件名', '发票号', '开票公司', '购买方', '日期', '分类', '税额', '价税合计', '状态'],
    ...sourceFiles.map((item) => [
      item.name,
      item.invoice?.invoiceNo || '--',
      item.invoice?.sellerName || '--',
      item.invoice?.buyerName || '--',
      item.invoice?.issueDate || '--',
      item.invoice?.category || '--',
      formatCurrency(item.invoice?.taxAmount),
      formatCurrency(item.invoice?.totalAmount),
      item.status === 'parsed' ? '成功' : item.status === 'failed' ? '失败' : '已忽略',
    ]),
  ];
}

function buildCompanySummaryRows(sourceFiles: OcrInvoiceTaskFile[]): string[][] {
  const groups = new Map<string, { count: number; amount: number }>();

  sourceFiles.forEach((item) => {
    const name = item.invoice?.sellerName;
    if (!name) return;
    const current = groups.get(name) || { count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(item.invoice?.totalAmount) || 0;
    groups.set(name, current);
  });

  return [
    ['开票公司', '数量', '金额'],
    ...Array.from(groups.entries()).map(([name, data]) => [
      name,
      String(data.count),
      formatCurrency(data.amount.toFixed(2)),
    ]),
  ];
}

function buildCategorySummaryRows(sourceFiles: OcrInvoiceTaskFile[]): string[][] {
  const groups = new Map<string, { count: number; amount: number }>();

  sourceFiles.forEach((item) => {
    const category = item.invoice?.category;
    if (!category) return;
    const current = groups.get(category) || { count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(item.invoice?.totalAmount) || 0;
    groups.set(category, current);
  });

  return [
    ['分类', '数量', '金额', '说明'],
    ...Array.from(groups.entries()).map(([name, data]) => [
      name,
      String(data.count),
      formatCurrency(data.amount.toFixed(2)),
      '规则分类',
    ]),
  ];
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

function triggerDownload(filename: string, content: string | ArrayBuffer, type: 'text' | 'binary'): void {
  const blob = type === 'text'
    ? new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
    : new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportToExcel(sourceFiles: OcrInvoiceTaskFile[]): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const detailRows = buildDetailRows(sourceFiles);
  const companyRows = buildCompanySummaryRows(sourceFiles);
  const categoryRows = buildCategorySummaryRows(sourceFiles);

  try {
    const xlsx = await import('xlsx');
    const workbook: WorkBook = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(detailRows), '票据明细');
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(companyRows), '公司汇总');
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(categoryRows), '分类汇总');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    triggerDownload(`invoice-${timestamp}.xlsx`, buffer, 'binary');
  } catch {
    triggerDownload(`invoice-${timestamp}.csv`, buildCsv(detailRows), 'text');
  }
}

// ========== 主组件 ==========

export default function OcrInvoicePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [taskResult, setTaskResult] = useState<OcrInvoiceTaskResult | null>(null);
  const [phase, setPhase] = useState<WorkflowPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  // ========== 计算属性 ==========

  const totalFileSize = useMemo(() => {
    return selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  }, [selectedFiles]);

  const summaryStats = useMemo(() => {
    if (!taskResult) return null;

    const parsedFiles = taskResult.sourceFiles.filter((f) => f.status === 'parsed');
    const failedFiles = taskResult.sourceFiles.filter((f) => f.status === 'failed' || f.status === 'ignored');
    const reviewFiles = taskResult.sourceFiles.filter((f) => f.duplicate);

    const totalAmount = parsedFiles.reduce((sum, f) => sum + (Number(f.invoice?.totalAmount) || 0), 0);
    const companyCount = new Set(parsedFiles.map((f) => f.invoice?.sellerName).filter(Boolean)).size;

    return {
      totalFiles: taskResult.summary.totalFiles,
      totalAmount,
      companyCount,
      reviewCount: reviewFiles.length + failedFiles.length,
      failedFiles,
    };
  }, [taskResult]);

  const companySummary = useMemo(() => {
    if (!taskResult) return [];

    const groups = new Map<string, { count: number; amount: number }>();
    taskResult.sourceFiles.forEach((item) => {
      const name = item.invoice?.sellerName;
      if (!name) return;
      const current = groups.get(name) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(item.invoice?.totalAmount) || 0;
      groups.set(name, current);
    });

    return Array.from(groups.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [taskResult]);

  const categorySummary = useMemo(() => {
    if (!taskResult) return [];

    const groups = new Map<string, { count: number; amount: number }>();
    taskResult.sourceFiles.forEach((item) => {
      const category = item.invoice?.category;
      if (!category) return;
      const current = groups.get(category) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(item.invoice?.totalAmount) || 0;
      groups.set(category, current);
    });

    return Array.from(groups.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [taskResult]);

  // ========== 事件处理 ==========

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files)
      .filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['zip', 'pdf', 'png', 'jpg', 'jpeg'].includes(ext || '');
      })
      .map((f) => ({
        file: f,
        id: `${f.name}-${f.size}-${Date.now()}`,
        status: 'pending' as const,
      }));

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('is-drag-over');
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('is-drag-over');
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('is-drag-over');
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (selectedFiles.length === 0 || phase === 'uploading') return;

    setPhase('uploading');
    setProgress(0);
    setError(null);

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 8, 85));
      }, 150);

      // 上传第一个文件（后端目前只支持单文件）
      const file = selectedFiles[0].file;
      const result = await uploadOcrInvoiceTask(file);

      clearInterval(progressInterval);
      setProgress(100);

      await sleep(200);

      setTaskResult(result);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
      setPhase('idle');
      setProgress(0);
    }
  }, [selectedFiles, phase]);

  const handleReupload = useCallback(() => {
    setPhase('idle');
    setTaskResult(null);
    setProgress(0);
    setSelectedFiles([]);
    setError(null);
    setExpandedFileId(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!taskResult) return;
    await exportToExcel(taskResult.sourceFiles);
  }, [taskResult]);

  const toggleFileDetail = useCallback((id: string) => {
    setExpandedFileId((prev) => (prev === id ? null : id));
  }, []);

  // ========== 渲染 ==========

  return (
    <div className="site-shell">
      <header className="site-header fade-up">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">你的工具箱</span>
        </Link>
        <nav className="main-nav">
          <Link href="/">首页</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="main-content ocr-page">
        {/* 进度条 */}
        {phase === 'uploading' && (
          <div className="ocr-progress-panel fade-up">
            <div className="ocr-progress-header">
              <span className="ocr-progress-title">正在分析...</span>
              <span className="ocr-progress-percent">{Math.round(progress)}%</span>
            </div>
            <div className="ocr-progress-track">
              <div className="ocr-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* 上传页面 */}
        {phase !== 'done' && (
          <section className="ocr-upload-page fade-up fade-delay-1">
            <div className="ocr-page-intro">
              <p className="page-kicker">Invoice OCR</p>
              <h1>发票识别</h1>
              <p>批量上传发票，自动提取关键信息</p>
            </div>

            <div
              className={`ocr-upload-zone ${selectedFiles.length > 0 ? 'has-files' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFiles.length === 0 ? (
                <div className="ocr-upload-prompt">
                  <div className="ocr-upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M17 8l-5-5-5 5" />
                      <path d="M12 3v12" />
                    </svg>
                  </div>
                  <h3>拖拽文件到此处</h3>
                  <p>或点击选择文件</p>
                  <div className="ocr-upload-formats">
                    <span>ZIP</span>
                    <span>PDF</span>
                    <span>PNG</span>
                    <span>JPG</span>
                  </div>
                </div>
              ) : (
                <div className="ocr-file-list">
                  <div className="ocr-file-list-header">
                    <span>已选 {selectedFiles.length} 个文件 / {formatFileSize(totalFileSize)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFiles();
                      }}
                    >
                      清空
                    </button>
                  </div>
                  <div className="ocr-file-items">
                    {selectedFiles.map((f) => (
                      <div key={f.id} className="ocr-file-item">
                        <div className="ocr-file-icon">{getFileExtension(f.file.name)}</div>
                        <div className="ocr-file-info">
                          <div className="ocr-file-name">{f.file.name}</div>
                          <div className="ocr-file-meta">{formatFileSize(f.file.size)}</div>
                        </div>
                        {f.amount && <div className="ocr-file-status">{f.amount}</div>}
                        <button
                          type="button"
                          className="ocr-file-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(f.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".zip,.pdf,.png,.jpg,.jpeg"
                multiple
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="ocr-upload-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={phase === 'uploading'}
                  onClick={handleStartAnalysis}
                >
                  开始分析
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleClearFiles}>
                  清空
                </button>
              </div>
            )}

            {error && <p className="ocr-inline-error">{error}</p>}
          </section>
        )}

        {/* 大盘页面 */}
        {phase === 'done' && taskResult && summaryStats && (
          <section className="ocr-dashboard fade-up">
            <div className="ocr-dashboard-head">
              <div>
                <p className="page-kicker">Invoice OCR</p>
                <h1>识别结果</h1>
                <p>
                  共识别 {summaryStats.totalFiles} 张票据，总金额 {formatCurrency(summaryStats.totalAmount.toFixed(2))}
                </p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleReupload}>
                重新上传
              </button>
            </div>

            {/* 失败横幅 */}
            {summaryStats.failedFiles.length > 0 && (
              <div className="ocr-failed-banner">
                <div className="ocr-failed-head">
                  <div className="ocr-failed-title">
                    <span>⚠</span>
                    <span>{summaryStats.failedFiles.length} 个文件识别失败</span>
                  </div>
                  <button type="button" className="btn btn-secondary" style={{ minHeight: '36px', padding: '8px 14px', fontSize: '0.82rem' }}>
                    全部重试
                  </button>
                </div>
                {summaryStats.failedFiles.map((f) => (
                  <div key={f.id} className="ocr-failed-item">
                    <span className="ocr-badge is-error">✗</span>
                    <span className="ocr-failed-name">{f.name}</span>
                    <span className="ocr-failed-error">{f.note || '识别失败'}</span>
                    <div className="ocr-row-actions">
                      <button type="button" className="ocr-row-btn">重试</button>
                      <button type="button" className="ocr-row-btn">下载</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 摘要卡片 */}
            <div className="ocr-summary-grid">
              <div className="ocr-summary-card">
                <div className="ocr-summary-label">票据总数</div>
                <div className="ocr-summary-value">{summaryStats.totalFiles}</div>
              </div>
              <div className="ocr-summary-card">
                <div className="ocr-summary-label">总金额</div>
                <div className="ocr-summary-value">{formatCurrency(summaryStats.totalAmount.toFixed(2))}</div>
              </div>
              <div className="ocr-summary-card">
                <div className="ocr-summary-label">开票公司</div>
                <div className="ocr-summary-value">{summaryStats.companyCount}</div>
              </div>
              <div className="ocr-summary-card">
                <div className="ocr-summary-label">需复核</div>
                <div className="ocr-summary-value is-danger">{summaryStats.reviewCount}</div>
              </div>
            </div>

            {/* 双列布局 */}
            <div className="ocr-two-col">
              {/* 分类分布 */}
              <div className="ocr-panel">
                <div className="ocr-panel-head">
                  <h2>分类分布</h2>
                </div>
                <div className="ocr-panel-body">
                  <div className="ocr-chart-placeholder">
                    <span>◎</span>
                    环形图占位
                  </div>
                </div>
              </div>

              {/* 公司汇总 */}
              <div className="ocr-panel">
                <div className="ocr-panel-head">
                  <h2>公司汇总</h2>
                </div>
                <div className="ocr-panel-body" style={{ padding: 0, margin: 0 }}>
                  <div className="ocr-table-wrap" style={{ margin: 0, padding: 0 }}>
                    <table className="ocr-table">
                      <thead>
                        <tr>
                          <th>开票公司</th>
                          <th className="text-right">数量</th>
                          <th className="text-right">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companySummary.slice(0, 5).map((item) => (
                          <tr key={item.name}>
                            <td>{item.name}</td>
                            <td className="text-right mono">{item.count}</td>
                            <td className="text-right mono">{formatCurrency(item.amount.toFixed(2))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 分类汇总 */}
            <div className="ocr-panel">
              <div className="ocr-panel-head">
                <h2>分类汇总</h2>
                <button type="button" className="btn btn-primary" style={{ minHeight: '36px', padding: '8px 14px', fontSize: '0.82rem' }} onClick={handleExport}>
                  导出 Excel
                </button>
              </div>
              <div className="ocr-table-wrap">
                <table className="ocr-table">
                  <thead>
                    <tr>
                      <th>分类</th>
                      <th className="text-right">数量</th>
                      <th className="text-right">金额</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySummary.map((item) => (
                      <tr key={item.name}>
                        <td>
                          <span className="ocr-badge is-success">{item.name}</span>
                        </td>
                        <td className="text-right mono">{item.count}</td>
                        <td className="text-right mono">{formatCurrency(item.amount.toFixed(2))}</td>
                        <td>规则分类</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 复核摘要 */}
            <div className="ocr-panel ocr-review-panel">
              <div className="ocr-panel-head">
                <h2>复核摘要</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-primary" style={{ minHeight: '36px', padding: '8px 14px', fontSize: '0.82rem' }} onClick={handleExport}>
                    导出 Excel
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ minHeight: '36px', padding: '8px 14px', fontSize: '0.82rem' }}>
                    全部重试
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ minHeight: '36px', padding: '8px 14px', fontSize: '0.82rem' }}>
                    下载全部
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                <table className="ocr-review-table">
                  <thead>
                    <tr>
                      <th>文件名</th>
                      <th>状态</th>
                      <th>发票号</th>
                      <th>开票公司</th>
                      <th>日期</th>
                      <th className="text-right">金额</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskResult.sourceFiles.map((item) => {
                      const isError = item.status === 'failed' || item.status === 'ignored';
                      const isDuplicate = item.duplicate;
                      const isExpanded = expandedFileId === item.id;

                      return (
                        <>
                          <tr
                            key={item.id}
                            className={isError ? 'is-error' : ''}
                            onClick={() => toggleFileDetail(item.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="mono">{item.name}</td>
                            <td>
                              {isError ? (
                                <span className="ocr-badge is-error">失败</span>
                              ) : isDuplicate ? (
                                <span className="ocr-badge is-warning">
                                  {item.duplicate?.type === 'exact' ? '明确重复' : '疑似重复'}
                                </span>
                              ) : (
                                <span className="ocr-badge is-success">成功</span>
                              )}
                            </td>
                            <td className="mono">{item.invoice?.invoiceNo || '--'}</td>
                            <td>{item.invoice?.sellerName || '--'}</td>
                            <td>{item.invoice?.issueDate || '--'}</td>
                            <td className="text-right mono">
                              {item.invoice?.totalAmount ? formatCurrency(item.invoice.totalAmount) : '--'}
                            </td>
                            <td>
                              <div className="ocr-row-actions">
                                <button
                                  type="button"
                                  className={`ocr-detail-toggle ${isExpanded ? 'is-open' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFileDetail(item.id);
                                  }}
                                >
                                  详情
                                </button>
                                <button type="button" className="ocr-row-btn">下载</button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${item.id}-detail`} className="ocr-detail-row">
                              <td colSpan={7} style={{ padding: '14px 18px', background: 'var(--bg-strong)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.82rem' }}>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">发票类型</span>
                                    <span className="ocr-review-field-value">{item.invoice?.invoiceType || '--'}</span>
                                  </div>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">购买方</span>
                                    <span className="ocr-review-field-value">{item.invoice?.buyerName || '--'}</span>
                                  </div>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">税额</span>
                                    <span className="ocr-review-field-value mono">{formatCurrency(item.invoice?.taxAmount)}</span>
                                  </div>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">不含税金额</span>
                                    <span className="ocr-review-field-value mono">
                                      {item.invoice?.amountWithoutTax ? formatCurrency(item.invoice.amountWithoutTax) : '--'}
                                    </span>
                                  </div>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">OCR 提供商</span>
                                    <span className="ocr-review-field-value">{item.ocrProvider || '--'}</span>
                                  </div>
                                  <div className="ocr-review-field">
                                    <span className="ocr-review-field-label">备注</span>
                                    <span className="ocr-review-field-value">{item.note || '--'}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <p>© 2026 你的工具箱</p>
        <p>发票 OCR 识别工具</p>
      </footer>
    </div>
  );
}