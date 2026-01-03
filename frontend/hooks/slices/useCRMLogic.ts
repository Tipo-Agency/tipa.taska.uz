
import { useState } from 'react';
import { Client, Contract, Deal, EmployeeInfo } from '../../../types';
import { api } from '../../../backend/api';
import { createSaveHandler, createDeleteHandler } from '../../../utils/crudUtils';
import { NOTIFICATION_MESSAGES } from '../../../constants/messages';

export const useCRMLogic = (showNotification: (msg: string) => void) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employeeInfos, setEmployeeInfos] = useState<EmployeeInfo[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Clients
  const saveClient = createSaveHandler(
    setClients,
    api.clients.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.CLIENT_SAVED
  );
  const deleteClient = createDeleteHandler(
    setClients,
    api.clients.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.CLIENT_DELETED
  );

  // Contracts
  const saveContract = createSaveHandler(
    setContracts,
    api.contracts.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.CONTRACT_SAVED
  );
  const deleteContract = createDeleteHandler(
    setContracts,
    api.contracts.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.CONTRACT_DELETED
  );

  // Employees
  const saveEmployee = createSaveHandler(
    setEmployeeInfos,
    api.employees.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.EMPLOYEE_SAVED
  );
  const deleteEmployee = createDeleteHandler(
    setEmployeeInfos,
    api.employees.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.EMPLOYEE_DELETED
  );

  // Deals
  const saveDeal = createSaveHandler(
    setDeals,
    api.deals.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.DEAL_SAVED
  );
  const deleteDeal = createDeleteHandler(
    setDeals,
    api.deals.updateAll,
    showNotification,
    NOTIFICATION_MESSAGES.DEAL_DELETED
  );

  return {
    state: { clients, contracts, employeeInfos, deals },
    setters: { setClients, setContracts, setEmployeeInfos, setDeals },
    actions: { saveClient, deleteClient, saveContract, deleteContract, saveEmployee, deleteEmployee, saveDeal, deleteDeal }
  };
};
