import { firestoreService } from "../../services/firestoreService";
import { SalesFunnel } from "../../types";

const COLLECTION_NAME = 'salesFunnels';

export const funnelsEndpoint = {
    getAll: async (): Promise<SalesFunnel[]> => {
        const items = await firestoreService.getAll(COLLECTION_NAME);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as SalesFunnel[];
    },
    
    updateAll: async (funnels: SalesFunnel[]): Promise<void> => {
        // Сохраняем все элементы, включая архивные (soft delete)
        await Promise.all(funnels.map(funnel => firestoreService.save(COLLECTION_NAME, funnel)));
        // Удаление физически должно происходить только при "permanentDelete"
    },
    
    create: async (funnel: Omit<SalesFunnel, 'id'>): Promise<SalesFunnel> => {
        const newFunnel: SalesFunnel = {
            ...funnel,
            id: `funnel-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await firestoreService.save(COLLECTION_NAME, newFunnel);
        return newFunnel;
    },
    
    update: async (id: string, updates: Partial<SalesFunnel>): Promise<SalesFunnel | null> => {
        const existing = await firestoreService.getById(COLLECTION_NAME, id);
        if (!existing) return null;
        
        const updated: SalesFunnel = {
            ...existing,
            ...updates,
            id, // Не позволяем изменить id
            updatedAt: new Date().toISOString(),
        } as SalesFunnel;
        
        await firestoreService.save(COLLECTION_NAME, updated);
        return updated;
    },
    
    delete: async (id: string): Promise<boolean> => {
        // Мягкое удаление - помечаем как архивный
        const existing = await firestoreService.getById(COLLECTION_NAME, id);
        if (!existing) return false;
        
        const archived: SalesFunnel = {
            ...existing,
            isArchived: true,
            updatedAt: new Date().toISOString(),
        } as SalesFunnel;
        
        // Удаляем из Firebase (мягкое удаление = физическое удаление из облака)
        await firestoreService.delete(COLLECTION_NAME, id);
        return true;
    },
};

