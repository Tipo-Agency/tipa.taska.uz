
import { useState } from 'react';
import { Client, Contract, Deal, EmployeeInfo, OneTimeDeal, AccountsReceivable } from '../../../types';
import { api } from '../../../backend/api';
import { createSaveHandler, createDeleteHandler } from '../../../utils/crudUtils';
import { NOTIFICATION_MESSAGES } from '../../../constants/messages';

export const useCRMLogic = (showNotification: (msg: string) => void) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [oneTimeDeals, setOneTimeDeals] = useState<OneTimeDeal[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
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

  // OneTimeDeals
  const saveOneTimeDeal = createSaveHandler(
    setOneTimeDeals,
    api.oneTimeDeals.updateAll,
    showNotification,
    'Разовая сделка сохранена'
  );
  const deleteOneTimeDeal = createDeleteHandler(
    setOneTimeDeals,
    api.oneTimeDeals.updateAll,
    showNotification,
    'Разовая сделка удалена'
  );

  // AccountsReceivable
  const saveAccountsReceivable = createSaveHandler(
    setAccountsReceivable,
    api.accountsReceivable.updateAll,
    showNotification,
    'Задолженность сохранена'
  );
  const deleteAccountsReceivable = createDeleteHandler(
    setAccountsReceivable,
    api.accountsReceivable.updateAll,
    showNotification,
    'Задолженность удалена'
  );

  return {
    state: { clients, contracts, oneTimeDeals, accountsReceivable, employeeInfos, deals },
    setters: { setClients, setContracts, setOneTimeDeals, setAccountsReceivable, setEmployeeInfos, setDeals },
    actions: { 
      saveClient, deleteClient, 
      saveContract, deleteContract, 
      saveOneTimeDeal, deleteOneTimeDeal,
      saveAccountsReceivable, deleteAccountsReceivable,
      saveEmployee, deleteEmployee, 
      saveDeal, deleteDeal 
    }
  };
};
