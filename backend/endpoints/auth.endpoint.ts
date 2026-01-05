import { firestoreService } from "../../services/firestoreService";
import { User } from "../../types";

const COLLECTION_NAME = 'users';

export const authEndpoint = {
    getAll: async (): Promise<User[]> => {
        const items = await firestoreService.getAll(COLLECTION_NAME);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as User[];
    },
    
    updateAll: async (users: User[]): Promise<void> => {
        // Фильтруем архивные элементы перед сохранением
        const activeUsers = users.filter(u => !u.isArchived);
        
        // Сохраняем каждый элемент в Firebase
        await Promise.all(activeUsers.map(user => firestoreService.save(COLLECTION_NAME, user)));
        
        // Удаляем архивные элементы из Firebase
        const allItems = await firestoreService.getAll(COLLECTION_NAME);
        const archivedIds = new Set(users.filter(u => u.isArchived).map(u => u.id));
        await Promise.all(
            allItems
                .filter(item => archivedIds.has(item.id))
                .map(item => firestoreService.delete(COLLECTION_NAME, item.id))
        );
    },
};
