/**
 * 日期和数字的本地化格式化工具
 */

type Locale = 'zh' | 'ja';

/**
 * 格式化日期
 * @param date - 日期对象或字符串
 * @param locale - 语言
 * @param options - Intl.DateTimeFormat 选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };

  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  return new Intl.DateTimeFormat(localeCode, defaultOptions).format(d);
}

/**
 * 格式化日期时间
 * @param date - 日期对象或字符串
 * @param locale - 语言
 * @param options - Intl.DateTimeFormat 选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  date: Date | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  return new Intl.DateTimeFormat(localeCode, defaultOptions).format(d);
}

/**
 * 格式化相对时间
 * @param date - 日期对象或字符串
 * @param locale - 语言
 * @returns 相对时间字符串（如：3天前）
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes === 0) {
        return rtf.format(0, 'second');
      }
      return rtf.format(-minutes, 'minute');
    }
    return rtf.format(-hours, 'hour');
  } else if (days < 30) {
    return rtf.format(-days, 'day');
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return rtf.format(-months, 'month');
  } else {
    const years = Math.floor(days / 365);
    return rtf.format(-years, 'year');
  }
}

/**
 * 格式化数字
 * @param number - 数字
 * @param locale - 语言
 * @param options - Intl.NumberFormat 选项
 * @returns 格式化后的数字字符串
 */
export function formatNumber(
  number: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  return new Intl.NumberFormat(localeCode, options).format(number);
}

/**
 * 格式化货币
 * @param amount - 金额
 * @param locale - 语言
 * @param currency - 货币代码（默认：CNY for zh, JPY for ja）
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency?: string
): string {
  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  const currencyCode = currency || (locale === 'zh' ? 'CNY' : 'JPY');
  
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
}

/**
 * 格式化百分比
 * @param value - 数值（0-1之间）
 * @param locale - 语言
 * @param options - Intl.NumberFormat 选项
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const localeCode = locale === 'zh' ? 'zh-CN' : 'ja-JP';
  
  return new Intl.NumberFormat(localeCode, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @param locale - 语言
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, locale: Locale): string {
  const units = locale === 'zh' 
    ? ['B', 'KB', 'MB', 'GB', 'TB']
    : ['B', 'KB', 'MB', 'GB', 'TB'];
  
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${formatNumber(size, locale, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
}

/**
 * 格式化持续时间（分钟）
 * @param minutes - 分钟数
 * @param locale - 语言
 * @returns 格式化后的时间字符串
 */
export function formatDuration(minutes: number, locale: Locale): string {
  if (minutes < 60) {
    return locale === 'zh' 
      ? `${minutes} 分钟`
      : `${minutes} 分`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return locale === 'zh'
      ? `${hours} 小时`
      : `${hours} 時間`;
  }
  
  return locale === 'zh'
    ? `${hours} 小时 ${mins} 分钟`
    : `${hours} 時間 ${mins} 分`;
}