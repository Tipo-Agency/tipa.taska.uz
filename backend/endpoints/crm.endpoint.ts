import { firestoreService } from "../../services/firestoreService";
import { Client, Deal, EmployeeInfo, AccountsReceivable } from "../../types";

const CLIENTS_COLLECTION = 'clients';
const DEALS_COLLECTION = 'deals'; // Объединенная коллекция для договоров и продаж
const EMPLOYEES_COLLECTION = 'employeeInfos';
const ACCOUNTS_RECEIVABLE_COLLECTION = 'accountsReceivable';

// Убрана функция filterArchived - фильтрация происходит на уровне компонентов
// saveCollection теперь сохраняет все элементы, включая архивные (soft delete)
const saveCollection = async (collectionName: string, items: Array<{ id: string; isArchived?: boolean }>) => {
    // Сохраняем все элементы, включая архивные (soft delete)
    await Promise.all(items.map(item => firestoreService.save(collectionName, item)));
    // Удаление физически должно происходить только при "permanentDelete"
    // В данном случае, saveCollection не должен физически удалять, а только сохранять текущее состояние
};

export const clientsEndpoint = {
    getAll: async (): Promise<Client[]> => {
        const items = await firestoreService.getAll(CLIENTS_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as Client[];
    },
    updateAll: async (clients: Client[]) => saveCollection(CLIENTS_COLLECTION, clients),
};

// Объединенный endpoint для договоров и продаж
export const dealsEndpoint = {
    getAll: async (): Promise<Deal[]> => {
        const items = await firestoreService.getAll(DEALS_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as Deal[];
    },
    updateAll: async (deals: Deal[]) => saveCollection(DEALS_COLLECTION, deals),
};

// Алиасы для обратной совместимости
export const contractsEndpoint = dealsEndpoint;
export const oneTimeDealsEndpoint = dealsEndpoint;

export const employeesEndpoint = {
    getAll: async (): Promise<EmployeeInfo[]> => {
        const items = await firestoreService.getAll(EMPLOYEES_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as EmployeeInfo[];
    },
    updateAll: async (employees: EmployeeInfo[]) => saveCollection(EMPLOYEES_COLLECTION, employees),
};

export const accountsReceivableEndpoint = {
    getAll: async (): Promise<AccountsReceivable[]> => {
        const items = await firestoreService.getAll(ACCOUNTS_RECEIVABLE_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as AccountsReceivable[];
    },
    updateAll: async (accounts: AccountsReceivable[]) => saveCollection(ACCOUNTS_RECEIVABLE_COLLECTION, accounts),
};
