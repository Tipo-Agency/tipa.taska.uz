
import React from 'react';
import { Deal, Client, Contract, User, Project, Task } from '../../types';
import SalesFunnelView from '../SalesFunnelView';
import ClientsView from '../ClientsView';

interface CRMModuleProps {
  view: 'sales-funnel' | 'clients';
  deals: Deal[];
  clients: Client[];
  contracts: Contract[];
  users: User[];
  projects?: Project[];
  tasks?: Task[];
  actions: any;
  autoOpenCreateModal?: boolean;
}

export const CRMModule: React.FC<CRMModuleProps> = ({ view, deals, clients, contracts, users, projects, tasks, actions, autoOpenCreateModal = false }) => {
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
      return <ClientsView clients={clients} contracts={contracts} onSaveClient={actions.saveClient} onDeleteClient={actions.deleteClient} onSaveContract={actions.saveContract} onDeleteContract={actions.deleteContract} />;
  }

  return null;
};
