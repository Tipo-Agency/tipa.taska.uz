
import React from 'react';
import { Deal, Client, Contract, User, Project, Task, OneTimeDeal, AccountsReceivable } from '../../types';
import SalesFunnelView from '../SalesFunnelView';
import ClientsView from '../ClientsView';

interface CRMModuleProps {
  view: 'sales-funnel' | 'clients';
  deals: Deal[];
  clients: Client[];
  contracts: Contract[];
  oneTimeDeals?: OneTimeDeal[];
  accountsReceivable?: AccountsReceivable[];
  users: User[];
  projects?: Project[];
  tasks?: Task[];
  actions: any;
  autoOpenCreateModal?: boolean;
}

export const CRMModule: React.FC<CRMModuleProps> = ({ view, deals, clients, contracts, oneTimeDeals = [], accountsReceivable = [], users, projects, tasks, actions, autoOpenCreateModal = false }) => {
  if (view === 'sales-funnel') {
      return <SalesFunnelView 
        deals={deals} 
        clients={clients} 
        users={users}
        projects={projects}
        tasks={tasks}
        onSaveDeal={actions.saveDeal} 
        onDeleteDeal={actions.deleteDeal}
        onCreateTask={actions.openTaskModal ? (task) => actions.openTaskModal(task) : undefined}
        onCreateClient={actions.saveClient}
        onOpenTask={actions.openTaskModal}
        autoOpenCreateModal={autoOpenCreateModal}
      />;
  }
  
  if (view === 'clients') {
      return <ClientsView 
        clients={clients} 
        contracts={contracts}
        oneTimeDeals={oneTimeDeals}
        accountsReceivable={accountsReceivable}
        onSaveClient={actions.saveClient} 
        onDeleteClient={actions.deleteClient} 
        onSaveContract={actions.saveContract} 
        onDeleteContract={actions.deleteContract}
        onSaveOneTimeDeal={actions.saveOneTimeDeal}
        onDeleteOneTimeDeal={actions.deleteOneTimeDeal}
        onSaveAccountsReceivable={actions.saveAccountsReceivable}
        onDeleteAccountsReceivable={actions.deleteAccountsReceivable}
      />;
  }

  return null;
};
