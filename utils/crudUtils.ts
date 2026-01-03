/**
 * Утилиты для CRUD операций
 * Устраняет дублирование кода в логике сохранения/удаления
 */

export interface CrudItem {
  id: string;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * Сохраняет или обновляет элемент в массиве
 * @param items - массив элементов
 * @param item - элемент для сохранения
 * @returns новый массив с обновленным/добавленным элементом
 */
export function saveItem<T extends CrudItem>(items: T[], item: T): T[] {
  const existingIndex = items.findIndex(x => x.id === item.id);
  if (existingIndex >= 0) {
    return items.map((x, index) => index === existingIndex ? item : x);
  }
  return [...items, item];
}

/**
 * Удаляет элемент из массива по ID
 * @param items - массив элементов
 * @param id - ID элемента для удаления
 * @returns новый массив без удаленного элемента
 */
export function deleteItem<T extends CrudItem>(items: T[], id: string): T[] {
  return items.filter(item => item.id !== id);
}

/**
 * Находит элемент в массиве по ID
 * @param items - массив элементов
 * @param id - ID элемента
 * @returns найденный элемент или undefined
 */
export function findItemById<T extends CrudItem>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * Создает функцию сохранения элемента с уведомлением и синхронизацией
 * @param setter - функция для обновления состояния
 * @param apiUpdate - функция для обновления через API
 * @param notification - функция для показа уведомления
 * @param successMessage - сообщение об успехе
 * @returns функция сохранения
 */
export function createSaveHandler<T extends CrudItem>(
  setter: (items: T[]) => void,
  apiUpdate: (items: T[]) => void,
  notification: (msg: string) => void,
  successMessage: string
) {
  return (item: T) => {
    setter(prevItems => {
      const now = new Date().toISOString();
      // Автоматически устанавливаем updatedAt при сохранении
      const itemWithTimestamp: T = {
        ...item,
        updatedAt: now,
        // Если это новый элемент (нет в массиве), устанавливаем createdAt
        createdAt: item.createdAt || (prevItems.find(x => x.id === item.id) ? undefined : now)
      } as T;
      
      const updated = saveItem(prevItems, itemWithTimestamp);
      apiUpdate(updated);
      notification(successMessage);
      return updated;
    });
  };
}

/**
 * Создает функцию удаления элемента с уведомлением и синхронизацией
 * @param setter - функция для обновления состояния
 * @param apiUpdate - функция для обновления через API
 * @param notification - функция для показа уведомления
 * @param successMessage - сообщение об успехе
 * @returns функция удаления
 */
export function createDeleteHandler<T extends CrudItem>(
  setter: (items: T[]) => void,
  apiUpdate: (items: T[]) => void,
  notification: (msg: string) => void,
  successMessage: string
) {
  return (id: string) => {
    setter(prevItems => {
      const updated = deleteItem(prevItems, id);
      apiUpdate(updated);
      notification(successMessage);
      return updated;
    });
  };
}

