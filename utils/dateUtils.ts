/**
 * Утилиты для работы с датами
 */

/**
 * Форматирует дату в формат DD.MM.YYYY
 * @param dateStr - строка с датой или Date объект
 * @returns отформатированная строка или '—' если дата невалидна
 */
export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '—';
  }
}

/**
 * Форматирует дату и время в формат DD.MM.YYYY, HH:MM:SS
 * @param dateStr - строка с датой или Date объект
 * @returns отформатированная строка или '—' если дата невалидна
 */
export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
  } catch {
    return '—';
  }
}

/**
 * Получает текущий период в формате YYYY-MM
 * @returns строка с текущим периодом
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Получает начало и конец периода
 * @param period - период в формате YYYY-MM
 * @returns объект с началом и концом периода
 */
export function getPeriodRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

