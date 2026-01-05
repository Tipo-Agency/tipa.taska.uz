import { firestoreService } from "../../services/firestoreService";
import { Doc, Folder, Meeting, ContentPost } from "../../types";

const DOCS_COLLECTION = 'docs';
const FOLDERS_COLLECTION = 'folders';
const MEETINGS_COLLECTION = 'meetings';
const CONTENT_POSTS_COLLECTION = 'contentPosts';

const filterArchived = <T extends { isArchived?: boolean }>(items: T[]): T[] => {
    return items.filter(item => !item.isArchived);
};

const saveCollection = async (collectionName: string, items: Array<{ id: string; isArchived?: boolean }>) => {
    const activeItems = filterArchived(items);
    await Promise.all(activeItems.map(item => firestoreService.save(collectionName, item)));
    
    const allItems = await firestoreService.getAll(collectionName);
    const archivedIds = new Set(items.filter(item => item.isArchived).map(item => item.id));
    await Promise.all(
        allItems
            .filter(item => archivedIds.has(item.id))
            .map(item => firestoreService.delete(collectionName, item.id))
    );
};

export const docsEndpoint = {
    getAll: async (): Promise<Doc[]> => {
        const items = await firestoreService.getAll(DOCS_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as Doc[];
    },
    updateAll: async (docs: Doc[]) => saveCollection(DOCS_COLLECTION, docs),
};

export const foldersEndpoint = {
    getAll: async (): Promise<Folder[]> => {
        const items = await firestoreService.getAll(FOLDERS_COLLECTION);
        return filterArchived(items) as Folder[];
    },
    updateAll: async (folders: Folder[]) => saveCollection(FOLDERS_COLLECTION, folders),
};

export const meetingsEndpoint = {
    getAll: async (): Promise<Meeting[]> => {
        const items = await firestoreService.getAll(MEETINGS_COLLECTION);
        return filterArchived(items) as Meeting[];
    },
    updateAll: async (meetings: Meeting[]) => saveCollection(MEETINGS_COLLECTION, meetings),
};

export const contentPostsEndpoint = {
    getAll: async (): Promise<ContentPost[]> => {
        const items = await firestoreService.getAll(CONTENT_POSTS_COLLECTION);
        // Не фильтруем архивные элементы - фильтрация происходит на уровне компонентов
        return items as ContentPost[];
    },
    updateAll: async (posts: ContentPost[]) => saveCollection(CONTENT_POSTS_COLLECTION, posts),
};
