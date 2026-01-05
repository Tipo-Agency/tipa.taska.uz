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
 * Использует мягкое удаление (isArchived: true) вместо физического удаления
 * @param setter - функция для обновления состояния
 * @param apiUpdate - функция для обновления через API
 * @param notification - функция для показа уведомления
 * @param successMessage - сообщение об успехе
 * @returns функция удаления
 */
export function createDeleteHandler<T extends CrudItem & { isArchived?: boolean }>(
  setter: (items: T[]) => void,
  apiUpdate: (items: T[]) => void | Promise<void>,
  notification: (msg: string) => void,
  successMessage: string
) {
  return async (id: string) => {
    const now = new Date().toISOString();
    // Мягкое удаление: помечаем элемент как архивный вместо физического удаления
    // Это решает проблему синхронизации - архивные элементы не возвращаются из Firebase
    setter(prevItems => {
      const updated = prevItems.map(item => {
        if (item.id === id) {
          return { ...item, isArchived: true, updatedAt: now } as T;
        }
        return { ...item, updatedAt: item.updatedAt || now } as T;
      });
      // Вызываем apiUpdate асинхронно, но не ждем его завершения для обновления UI
      Promise.resolve(apiUpdate(updated)).catch(err => {
        console.error('Ошибка сохранения в Firebase:', err);
      });
      return updated;
    });
    notification(successMessage);
  };
}

