/**
 * Утилиты для работы с датами в локальном времени
 */

/**
 * Получить сегодняшнюю дату в формате YYYY-MM-DD в локальном времени
 */
export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получить дату через N дней от сегодня в формате YYYY-MM-DD в локальном времени
 */
export function getDateDaysFromNow(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Преобразовать дату в формате YYYY-MM-DD в объект Date в локальном времени
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Сравнить две даты в формате YYYY-MM-DD
 * @returns -1 если date1 < date2, 0 если равны, 1 если date1 > date2
 */
export function compareDates(date1: string, date2: string): number {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Проверить, является ли дата сегодняшней (в локальном времени)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayLocalDate();
}

/**
 * Проверить, просрочена ли дата (в локальном времени)
 */
export function isOverdue(dateStr: string): boolean {
  return compareDates(dateStr, getTodayLocalDate()) < 0;
}

/**
 * Форматировать дату для отображения
 * @param dateStr - дата в формате YYYY-MM-DD или ISO строке
 * @param format - формат даты (по умолчанию 'DD.MM.YYYY')
 * @returns отформатированная дата
 */
export function formatDate(dateStr: string, format: string = 'DD.MM.YYYY'): string {
  if (!dateStr) return '';
  
  let date: Date;
  
  // Если дата в формате YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    date = parseLocalDate(dateStr);
  } else {
    // Пытаемся распарсить как ISO строку
    date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Возвращаем исходную строку, если не удалось распарсить
    }
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
    .replace('YY', String(year).slice(-2));
}
