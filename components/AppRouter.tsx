
import React from 'react';
import { 
  Task, User, Project, StatusOption, PriorityOption, ActivityLog, 
  Deal, Client, Contract, EmployeeInfo, Meeting, ContentPost, 
  Doc, Folder, TableCollection, Department, FinanceCategory, 
  FinancePlan, PurchaseRequest, FinancialPlanDocument, FinancialPlanning, OrgPosition, BusinessProcess, 
  ViewMode, AutomationRule, Warehouse, InventoryItem, StockBalance, StockMovement, OneTimeDeal, AccountsReceivable
} from '../types';

import HomeView from './HomeView';
import InboxView from './InboxView';
import SettingsView from './SettingsView';
import AnalyticsView from './AnalyticsView';
import DocEditor from './DocEditor';
import TableView from './TableView'; // Needed for Global Search
import { TasksView } from './TasksView';
import { SpacesTabsView } from './SpacesTabsView';
import { SpaceModule } from './modules/SpaceModule';
import { CRMModule } from './modules/CRMModule';
import { FinanceModule } from './modules/FinanceModule';
import { HRModule } from './modules/HRModule';
import { MeetingsModule } from './modules/MeetingsModule';
import { DocumentsModule } from './modules/DocumentsModule';

interface AppRouterProps {
  currentView: string;
  viewMode: ViewMode;
  searchQuery: string;
  activeTable?: TableCollection;
  filteredTasks: Task[];
  allTasks: Task[];
  users: User[];
  currentUser: User;
  projects: Project[];
  statuses: StatusOption[];
  priorities: PriorityOption[];
  activities: ActivityLog[];
  deals: Deal[];
  clients: Client[];
  contracts: Contract[];
  oneTimeDeals?: OneTimeDeal[];
  accountsReceivable?: AccountsReceivable[];
  employeeInfos: EmployeeInfo[];
  meetings: Meeting[];
  contentPosts: ContentPost[];
  docs: Doc[];
  folders: Folder[];
  activeDoc?: Doc;
  tables: TableCollection[];
  departments: Department[];
  financeCategories: FinanceCategory[];
  financePlan: FinancePlan | null;
  purchaseRequests: PurchaseRequest[];
  financialPlanDocuments?: FinancialPlanDocument[];
  financialPlannings?: FinancialPlanning[];
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  inventoryBalances: StockBalance[];
  inventoryMovements: StockMovement[];
  orgPositions: OrgPosition[];
  businessProcesses: BusinessProcess[];
  automationRules?: AutomationRule[];
  settingsActiveTab?: string;
  activeSpaceTab?: 'content-plan' | 'backlog' | 'functionality';
  telegramBotToken?: string;
  actions: any;
}

export const AppRouter: React.FC<AppRouterProps> = (props) => {
  const { currentView, activeTable, actions } = props;

  // Проверка на наличие currentUser
  if (!props.currentUser) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#191919]">
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">Пользователь не найден</div>
      </div>
    );
  }

  // Fallback: если currentView пустой или undefined, показываем home
  const view = currentView || 'home';

  // 1. Global / Core Views
  if (view === 'home') {
      return (
          <div className="h-full w-full overflow-auto bg-white dark:bg-[#191919]">
          <HomeView 
              currentUser={props.currentUser} 
              tasks={props.filteredTasks} 
              recentActivity={props.activities} 
              meetings={props.meetings}
              financePlan={props.financePlan}
              purchaseRequests={props.purchaseRequests}
              deals={props.deals}
              contentPosts={props.contentPosts}
              employeeInfos={props.employeeInfos}
              onOpenTask={actions.openTaskModal}
              onNavigateToInbox={() => actions.setCurrentView('inbox')}
              onQuickCreateTask={() => actions.openTaskModal(null)}
              onQuickCreateProcess={() => { 
                actions.setCurrentView('business-processes'); 
                // Открываем модалку через небольшую задержку, чтобы компонент успел смонтироваться
                setTimeout(() => {
                  const event = new CustomEvent('openCreateProcessModal');
                  window.dispatchEvent(event);
                }, 100);
              }}
              onQuickCreateDeal={() => { 
                actions.setCurrentView('sales-funnel'); 
                // Открываем модалку через небольшую задержку, чтобы компонент успел смонтироваться
                setTimeout(() => {
                  const event = new CustomEvent('openCreateDealModal');
                  window.dispatchEvent(event);
                }, 100);
              }}
          />
          </div>
      );
  }

  if (view === 'tasks') {
      return (
          <TasksView 
              tasks={props.allTasks} 
              users={props.users} 
              projects={props.projects} 
              statuses={props.statuses} 
              priorities={props.priorities} 
              tables={props.tables} 
              businessProcesses={props.businessProcesses} 
              currentUser={props.currentUser} 
              onUpdateTask={(id, updates) => actions.saveTask({ id, ...updates })} 
              onDeleteTask={actions.deleteTask} 
              onOpenTask={actions.openTaskModal}
              onCreateTask={() => actions.openTaskModal(null)}
          />
      );
  }

  // 2. Spaces (Tabs View)
  if (view === 'spaces') {
      return (
          <SpacesTabsView
              tables={props.tables}
              currentUser={props.currentUser}
              activeTableId={props.activeTableId}
              currentView={props.currentView}
              initialTab={props.activeSpaceTab}
              onSelectTable={(id) => { actions.setActiveTableId(id); actions.setCurrentView('table'); }}
              onEditTable={actions.openEditTable}
              onDeleteTable={actions.deleteTable}
              onCreateTable={(type) => {
                  actions.openCreateTable(type);
              }}
          />
      );
  }

  if (view === 'inbox') {
      return <InboxView activities={props.activities} onMarkAllRead={actions.markAllRead} />;
  }

  if (view === 'settings') {
      return (
          <SettingsView 
              users={props.users} projects={props.projects} tasks={props.allTasks} statuses={props.statuses} priorities={props.priorities} tables={props.tables} automationRules={props.automationRules} currentUser={props.currentUser}
              departments={props.departments} financeCategories={props.financeCategories}
              onUpdateUsers={actions.updateUsers} onUpdateProjects={actions.updateProjects} onUpdateStatuses={actions.updateStatuses} onUpdatePriorities={actions.updatePriorities}
              onUpdateTable={actions.updateTable} onCreateTable={actions.openCreateTable} onDeleteTable={actions.deleteTable}
              onUpdateNotificationPrefs={actions.updateNotificationPrefs} onSaveAutomationRule={actions.saveAutomationRule} onDeleteAutomationRule={actions.deleteAutomationRule}
              onUpdateProfile={actions.updateProfile} onSaveDeal={actions.saveDeal} onClose={actions.closeSettings} initialTab={props.settingsActiveTab}
              onSaveDepartment={actions.saveDepartment} onDeleteDepartment={actions.deleteDepartment}
              onSaveFinanceCategory={actions.saveFinanceCategory} onDeleteFinanceCategory={actions.deleteFinanceCategory}
              onUpdateTelegramBotToken={actions.onUpdateTelegramBotToken}
              telegramBotToken={props.telegramBotToken}
              onRestoreTask={actions.restoreTask}
              onPermanentDelete={actions.permanentDeleteTask}
          />
      );
  }

  if (view === 'doc-editor' && props.activeDoc) {
      return <DocEditor doc={props.activeDoc} onSave={actions.saveDocContent} onBack={() => { 
          actions.setCurrentView('docs'); 
      }} />;
  }

  if (view === 'analytics') {
      return <AnalyticsView tasks={props.filteredTasks} deals={props.deals} users={props.users} financePlan={props.financePlan} contracts={props.contracts} />;
  }

  // 2. Search (Global)
  if (view === 'search') {
      return <TableView tasks={props.filteredTasks} users={props.users} projects={props.projects} statuses={props.statuses} priorities={props.priorities} tables={props.tables} isAggregator={true} currentUser={props.currentUser} businessProcesses={props.businessProcesses} onUpdateTask={(id, updates) => actions.saveTask({ id, ...updates })} onDeleteTask={actions.deleteTask} onOpenTask={actions.openTaskModal} />;
  }

  // 4. Modules
  if (view === 'table') {
      if (!activeTable) {
          return <div className="p-10 text-center text-gray-500">Страница не найдена. Выберите страницу из списка.</div>;
      }
                        return <SpaceModule
                            activeTable={activeTable} viewMode={props.viewMode} tasks={props.filteredTasks}
                            users={props.users} currentUser={props.currentUser} projects={props.projects}
                            statuses={props.statuses} priorities={props.priorities} tables={props.tables}
                            docs={props.docs} folders={props.folders} meetings={props.meetings}
                            contentPosts={props.contentPosts} businessProcesses={props.businessProcesses}
                            actions={actions}
                        />;
  }

  if (view === 'sales-funnel' || view === 'clients') {
      return <CRMModule view={view} deals={props.deals} clients={props.clients} contracts={props.contracts} oneTimeDeals={props.oneTimeDeals} accountsReceivable={props.accountsReceivable} users={props.users} projects={props.projects} tasks={props.allTasks} actions={actions} />;
  }

  if (view === 'finance') {
      return <FinanceModule categories={props.financeCategories} plan={props.financePlan} requests={props.purchaseRequests} departments={props.departments} users={props.users} currentUser={props.currentUser} financialPlanDocuments={props.financialPlanDocuments} financialPlannings={props.financialPlannings} actions={actions} />;
  }

  if (view === 'employees' || view === 'business-processes') {
      return <HRModule 
          view={view} 
          employees={props.employeeInfos} 
          users={props.users} 
          departments={props.departments} 
          orgPositions={props.orgPositions} 
          processes={props.businessProcesses}
          tasks={props.filteredTasks}
          tables={props.tables}
          actions={actions} 
      />;
  }

  // Meetings and Documents as separate modules (хардкодные, работают без создания таблиц)
  if (view === 'meetings') {
      // Автоматически создаем фиктивную таблицу для встреч, если её нет (не показывается в настройках)
      let meetingsTable = props.tables.find(t => t.type === 'meetings' && t.isSystem) || 
                          props.tables.find(t => t.type === 'meetings');
      if (!meetingsTable) {
          // Создаем фиктивную таблицу автоматически
          meetingsTable = { 
              id: 'meetings-system', 
              name: 'Встречи', 
              type: 'meetings', 
              icon: 'Users', 
              color: 'text-purple-500', 
              isSystem: true 
          };
          // Добавляем в таблицы, но не сохраняем (чтобы не показывалась в настройках)
          // Модуль будет работать с этой фиктивной таблицей
      }
      return <MeetingsModule table={meetingsTable} meetings={props.meetings} users={props.users} tables={props.tables} actions={actions} />;
  }

  if (view === 'docs') {
      // Автоматически создаем фиктивную таблицу для документов, если её нет (не показывается в настройках)
      let docsTable = props.tables.find(t => t.type === 'docs' && t.isSystem) || 
                     props.tables.find(t => t.type === 'docs');
      if (!docsTable) {
          // Создаем фиктивную таблицу автоматически
          docsTable = { 
              id: 'docs-system', 
              name: 'Документы', 
              type: 'docs', 
              icon: 'FileText', 
              color: 'text-yellow-500', 
              isSystem: true 
          };
          // Добавляем в таблицы, но не сохраняем (чтобы не показывалась в настройках)
          // Модуль будет работать с этой фиктивной таблицей
      }
      return <DocumentsModule table={docsTable} docs={props.docs} folders={props.folders} tables={props.tables} tasks={props.allTasks} actions={actions} />;
  }

  // Fallback: если ничего не подошло, показываем home
  return (
      <HomeView 
          currentUser={props.currentUser} 
          tasks={props.filteredTasks} 
          recentActivity={props.activities} 
          meetings={props.meetings}
          financePlan={props.financePlan}
          purchaseRequests={props.purchaseRequests}
          deals={props.deals}
          contentPosts={props.contentPosts}
          employeeInfos={props.employeeInfos}
          onOpenTask={actions.openTaskModal}
          onNavigateToInbox={() => actions.setCurrentView('inbox')}
          onQuickCreateTask={() => actions.openTaskModal(null)}
          onQuickCreateProcess={() => { actions.setCurrentView('business-processes'); }}
          onQuickCreateDeal={() => { actions.setCurrentView('sales-funnel'); }}
      />
  );
};
