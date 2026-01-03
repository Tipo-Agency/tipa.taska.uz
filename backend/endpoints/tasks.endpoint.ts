
import { storageService } from "../../services/storageService";
import { Task, Project } from "../../types";

export const tasksEndpoint = {
  getAll: () => storageService.getTasks(),
  updateAll: (tasks: Task[]) => storageService.setTasks(tasks),
};

export const projectsEndpoint = {
  getAll: () => storageService.getProjects(),
  updateAll: (projects: Project[]) => storageService.setProjects(projects),
};
