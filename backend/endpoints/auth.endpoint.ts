
import { storageService } from "../../services/storageService";
import { User } from "../../types";

export const authEndpoint = {
  getAll: () => storageService.getUsers(),
  updateAll: (users: User[]) => storageService.setUsers(users),
};
