
import { storageService } from "../../services/storageService";
import { Client, Contract, EmployeeInfo, Deal } from "../../types";

export const clientsEndpoint = {
  getAll: () => storageService.getClients(),
  updateAll: (clients: Client[]) => storageService.setClients(clients),
};

export const contractsEndpoint = {
  getAll: () => storageService.getContracts(),
  updateAll: (contracts: Contract[]) => storageService.setContracts(contracts),
};

export const employeesEndpoint = {
  getAll: () => storageService.getEmployeeInfos(),
  updateAll: (infos: EmployeeInfo[]) => storageService.setEmployeeInfos(infos),
};

export const dealsEndpoint = {
  getAll: () => storageService.getDeals(),
  updateAll: (deals: Deal[]) => storageService.setDeals(deals),
};
