/**
 * 密码生成器组件
 * @id password-generator
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { Button, Card, Input, Slider, Toggle, ProgressBar } from '@design/components';
import { colors, spacing } from '@design/tokens';

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  // 生成密码
  const generatePassword = useCallback(() => {
    let chars = '';
    if (options.lowercase) chars += CHAR_SETS.lowercase;
    if (options.uppercase) chars += CHAR_SETS.uppercase;
    if (options.numbers) chars += CHAR_SETS.numbers;
    if (options.symbols) chars += CHAR_SETS.symbols;

    if (!chars) return;

    let result = '';
    for (let i = 0; i < options.length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  }, [options]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  // 计算密码强度
  const calculateStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 12) score += 20;
    if (pwd.length >= 16) score += 20;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
    return score;
  };

  const strength = password ? calculateStrength(password) : 0;

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: spacing.lg }}>
        🔐 密码生成器
      </div>

      {/* 密码显示 */}
      <div
        style={{
          background: colors.bgElevated,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: 8,
          padding: spacing.md,
          marginBottom: spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Input
          value={password}
          readOnly
          placeholder="点击生成密码"
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 18,
            letterSpacing: 1,
            border: 'none',
            background: 'transparent',
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={copyToClipboard}
          disabled={!password}
          style={{
            color: copied ? colors.success : undefined,
          }}
        >
          {copied ? '✓ 已复制' : '📋'}
        </Button>
      </div>

      {/* 强度条 */}
      {password && (
        <ProgressBar
          value={strength}
          color={
            strength <= 40 ? colors.error :
            strength <= 70 ? colors.warning :
            colors.success
          }
          style={{ marginBottom: spacing.lg }}
        />
      )}

      {/* 生成按钮 */}
      <Button
        variant="primary"
        size="lg"
        onClick={generatePassword}
        style={{ width: '100%', marginBottom: spacing.lg }}
      >
        生成密码
      </Button>

      {/* 配置选项 */}
      <div
        style={{
          borderTop: `1px solid ${colors.borderLight}`,
          paddingTop: spacing.md,
        }}
      >
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          <span>自定义选项</span>
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>

        {expanded && (
          <div style={{ marginTop: spacing.md }}>
            {/* 长度滑块 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${spacing.sm} 0`,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <span style={{ fontSize: 14 }}>密码长度</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Slider
                  min={8}
                  max={64}
                  value={options.length}
                  onChange={(v) => setOptions({ ...options, length: v })}
                  style={{ width: 120 }}
                />
                <span style={{ fontSize: 14, color: colors.textSecondary, minWidth: 24 }}>
                  {options.length}
                </span>
              </div>
            </div>

            {/* 开关选项 */}
            {[
              { key: 'uppercase', label: '大写字母 (A-Z)' },
              { key: 'lowercase', label: '小写字母 (a-z)' },
              { key: 'numbers', label: '数字 (0-9)' },
              { key: 'symbols', label: '特殊符号 (!@#$%)' },
            ].map(({ key, label }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${spacing.sm} 0`,
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <span style={{ fontSize: 14 }}>{label}</span>
                <Toggle
                  checked={options[key as keyof PasswordOptions] as boolean}
                  onChange={(checked) =>
                    setOptions({ ...options, [key]: checked })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PasswordGenerator;
