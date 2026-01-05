import { firestoreService } from "../../services/firestoreService";
import { Task, Project } from "../../types";

const TASKS_COLLECTION = 'tasks';
const PROJECTS_COLLECTION = 'projects';

export const tasksEndpoint = {
    getAll: async (): Promise<Task[]> => {
        const items = await firestoreService.getAll(TASKS_COLLECTION);
        // Не фильтруем архивные задачи - фильтрация происходит на уровне компонентов
        return items as Task[];
    },
    
    updateAll: async (tasks: Task[]): Promise<void> => {
        // Сохраняем все задачи (включая архивные) в Firebase
        await Promise.all(tasks.map(task => firestoreService.save(TASKS_COLLECTION, task)));
    },
};

export const projectsEndpoint = {
    getAll: async (): Promise<Project[]> => {
        const items = await firestoreService.getAll(PROJECTS_COLLECTION);
        // Не фильтруем архивные проекты - фильтрация происходит на уровне компонентов
        return items as Project[];
    },
    
    updateAll: async (projects: Project[]): Promise<void> => {
        // Сохраняем все проекты, включая архивные (soft delete)
        await Promise.all(projects.map(project => firestoreService.save(PROJECTS_COLLECTION, project)));
        // Удаление физически должно происходить только при "permanentDelete"
    },
};
