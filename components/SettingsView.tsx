
import React, { useState, useEffect } from 'react';
import { Project, Role, Task, User, StatusOption, PriorityOption, NotificationPreferences, AutomationRule, TableCollection, Deal, Department, FinanceCategory, SalesFunnel, Doc, ContentPost, EmployeeInfo, Client, Contract, BusinessProcess, Meeting } from '../types';
import { User as UserIcon, Briefcase, Archive, List, BarChart2, Bell, Zap, Users, Building2, Wallet, TrendingUp, X, Layout } from 'lucide-react';
import { ProfileSettings } from './settings/ProfileSettings';
import { SpaceSettings } from './settings/SpaceSettings';
import { AutomationSettings } from './settings/AutomationSettings';
import DepartmentsView from './DepartmentsView';
import { storageService } from '../services/storageService';
import FinanceCategoriesSettings from './settings/FinanceCategoriesSettings';
import SalesFunnelsSettings from './settings/SalesFunnelsSettings';

// Компонент для отображения архива с вкладками
const ArchiveView: React.FC<{ 
    tasks: Task[];
    users?: User[];
    employees?: EmployeeInfo[];
    docs?: Doc[];
    posts?: ContentPost[];
    projects?: Project[];
    departments?: Department[];
    financeCategories?: FinanceCategory[];
    salesFunnels?: SalesFunnel[];
    tables?: TableCollection[];
    businessProcesses?: BusinessProcess[];
    deals?: Deal[];
    clients?: Client[];
    contracts?: Contract[];
    meetings?: Meeting[];
    onRestoreTask?: (taskId: string) => void;
    onPermanentDelete?: (taskId: string) => void;
    onRestoreUser?: (userId: string) => void;
    onRestoreEmployee?: (employeeId: string) => void;
    onRestoreDoc?: (docId: string) => void;
    onRestorePost?: (postId: string) => void;
    onRestoreProject?: (projectId: string) => void;
    onRestoreDepartment?: (departmentId: string) => void;
    onRestoreFinanceCategory?: (categoryId: string) => void;
    onRestoreSalesFunnel?: (funnelId: string) => void;
    onRestoreTable?: (tableId: string) => void;
    onRestoreBusinessProcess?: (processId: string) => void;
    onRestoreDeal?: (dealId: string) => void;
    onRestoreClient?: (clientId: string) => void;
    onRestoreContract?: (contractId: string) => void;
    onRestoreMeeting?: (meetingId: string) => void;
}> = ({ 
    tasks, users: initialUsers = [], employees: initialEmployees = [], docs = [], posts = [], 
    projects = [], departments = [], financeCategories = [], salesFunnels = [], tables = [],
    businessProcesses = [], deals = [], clients = [], contracts = [], meetings = [],
    onRestoreTask, onPermanentDelete, onRestoreUser, onRestoreEmployee, onRestoreDoc, onRestorePost,
    onRestoreProject, onRestoreDepartment, onRestoreFinanceCategory, onRestoreSalesFunnel,
    onRestoreTable, onRestoreBusinessProcess, onRestoreDeal, onRestoreClient, onRestoreContract,
    onRestoreMeeting
}) => {
    const [archiveTab, setArchiveTab] = useState<'tasks' | 'users' | 'employees' | 'docs' | 'posts' | 'projects' | 'departments' | 'financeCategories' | 'salesFunnels' | 'tables' | 'businessProcesses' | 'deals' | 'clients' | 'contracts' | 'meetings'>('tasks');
    const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
    const [allEmployees, setAllEmployees] = useState<EmployeeInfo[]>(initialEmployees);
    
    const getEmployeeName = (employee: EmployeeInfo) => {
        const user = allUsers.find(u => u.id === employee.userId);
        return user ? user.name : `ID: ${employee.id}`;
    };
    
    // Загружаем всех пользователей и сотрудников (включая архивных) при открытии соответствующих вкладок
    useEffect(() => {
        if (archiveTab === 'users') {
            import('../backend/api').then(({ api }) => {
                api.users.getAll().then(users => {
                    setAllUsers(users);
                }).catch(err => console.error('Ошибка загрузки пользователей:', err));
            });
        }
        if (archiveTab === 'employees') {
            import('../backend/api').then(({ api }) => {
                api.employees.getAll().then(employees => {
                    setAllEmployees(employees);
                }).catch(err => console.error('Ошибка загрузки сотрудников:', err));
            });
        }
    }, [archiveTab]);
    
    const renderArchiveList = <T extends { id: string; isArchived?: boolean }>(
        items: T[],
        getLabel: (item: T) => string,
        onRestore?: (id: string) => void,
        emptyMessage: string = 'Архив пуст'
    ) => {
        const archived = items.filter(item => item.isArchived);
        if (archived.length === 0) {
            return <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
        }
        return archived.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-[#333] rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300">{getLabel(item)}</span>
                <div className="flex gap-2">
                    {onRestore && <button onClick={() => onRestore(item.id)} className="text-blue-600 hover:underline text-xs">Восстановить</button>}
                </div>
            </div>
        ));
    };
    
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Архив</h3>
            
            {/* Вкладки внутри архива - используем скролл для большого количества вкладок */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#252525] rounded-full p-1 text-xs overflow-x-auto">
                {[
                    { id: 'tasks', label: 'Задачи' },
                    { id: 'users', label: 'Пользователи' },
                    { id: 'employees', label: 'Сотрудники' },
                    { id: 'projects', label: 'Проекты' },
                    { id: 'departments', label: 'Подразделения' },
                    { id: 'financeCategories', label: 'Статьи расходов' },
                    { id: 'salesFunnels', label: 'Воронки' },
                    { id: 'tables', label: 'Таблицы' },
                    { id: 'businessProcesses', label: 'Бизнес-процессы' },
                    { id: 'deals', label: 'Сделки' },
                    { id: 'clients', label: 'Клиенты' },
                    { id: 'contracts', label: 'Договоры' },
                    { id: 'docs', label: 'Документы' },
                    { id: 'posts', label: 'Посты' },
                    { id: 'meetings', label: 'Встречи' },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setArchiveTab(tab.id as any)} 
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap ${archiveTab === tab.id ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {/* Контент вкладок */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {archiveTab === 'tasks' && renderArchiveList(tasks, t => t.title, onRestoreTask, 'Архив задач пуст')}
                {archiveTab === 'users' && renderArchiveList(allUsers, u => u.name, onRestoreUser, 'Архив пользователей пуст')}
                {archiveTab === 'employees' && renderArchiveList(allEmployees, e => getEmployeeName(e), onRestoreEmployee, 'Архив сотрудников пуст')}
                {archiveTab === 'projects' && renderArchiveList(projects, p => p.name, onRestoreProject, 'Архив проектов пуст')}
                {archiveTab === 'departments' && renderArchiveList(departments, d => d.name, onRestoreDepartment, 'Архив подразделений пуст')}
                {archiveTab === 'financeCategories' && renderArchiveList(financeCategories, f => f.name, onRestoreFinanceCategory, 'Архив статей расходов пуст')}
                {archiveTab === 'salesFunnels' && renderArchiveList(salesFunnels, s => s.name, onRestoreSalesFunnel, 'Архив воронок пуст')}
                {archiveTab === 'tables' && renderArchiveList(tables, t => t.name, onRestoreTable, 'Архив таблиц пуст')}
                {archiveTab === 'businessProcesses' && renderArchiveList(businessProcesses, b => b.title, onRestoreBusinessProcess, 'Архив бизнес-процессов пуст')}
                {archiveTab === 'deals' && renderArchiveList(deals, d => d.title, onRestoreDeal, 'Архив сделок пуст')}
                {archiveTab === 'clients' && renderArchiveList(clients, c => c.name, onRestoreClient, 'Архив клиентов пуст')}
                {archiveTab === 'contracts' && renderArchiveList(contracts, c => c.number, onRestoreContract, 'Архив договоров пуст')}
                {archiveTab === 'docs' && renderArchiveList(docs, d => d.title, onRestoreDoc, 'Архив документов пуст')}
                {archiveTab === 'posts' && renderArchiveList(posts, p => p.topic, onRestorePost, 'Архив постов пуст')}
                {archiveTab === 'meetings' && renderArchiveList(meetings, m => m.title, onRestoreMeeting, 'Архив встреч пуст')}
            </div>
        </div>
    );
};

interface SettingsViewProps {
  // Data
  users: User[];
  projects: Project[];
  tasks?: Task[];
  statuses: StatusOption[];
  priorities: PriorityOption[];
  tables?: TableCollection[];
  automationRules?: AutomationRule[];
  currentUser?: User;
  departments?: Department[];
  financeCategories?: FinanceCategory[];
  salesFunnels?: SalesFunnel[];
  employeeInfos?: EmployeeInfo[];
  deals?: Deal[];
  clients?: Client[];
  contracts?: Contract[];
  meetings?: Meeting[];
  businessProcesses?: BusinessProcess[];
  
  // Actions
  onUpdateTable?: (table: TableCollection) => void;
  onCreateTable?: () => void;
  onDeleteTable?: (id: string) => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateStatuses: (statuses: StatusOption[]) => void;
  onUpdatePriorities: (priorities: PriorityOption[]) => void;
  onRestoreTask?: (taskId: string) => void;
  onPermanentDelete?: (taskId: string) => void;
  onRestoreUser?: (userId: string) => void;
  onRestoreEmployee?: (employeeId: string) => void;
  onRestoreDoc?: (docId: string) => void;
  onRestorePost?: (postId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onRestoreDepartment?: (departmentId: string) => void;
  onRestoreFinanceCategory?: (categoryId: string) => void;
  onRestoreSalesFunnel?: (funnelId: string) => void;
  onRestoreTable?: (tableId: string) => void;
  onRestoreBusinessProcess?: (processId: string) => void;
  onRestoreDeal?: (dealId: string) => void;
  onRestoreClient?: (clientId: string) => void;
  onRestoreContract?: (contractId: string) => void;
  onRestoreMeeting?: (meetingId: string) => void;
  docs?: Doc[];
  contentPosts?: ContentPost[];
  onClose: () => void;
  onUpdateNotificationPrefs: (prefs: NotificationPreferences) => void;
  onSaveAutomationRule?: (rule: AutomationRule) => void;
  onDeleteAutomationRule?: (id: string) => void;
  onUpdateProfile?: (user: User) => void;
  onSaveDeal?: (deal: Deal) => void;
  onSaveDepartment?: (dep: Department) => void;
  onDeleteDepartment?: (id: string) => void;
  onSaveFinanceCategory?: (cat: FinanceCategory) => void;
  onDeleteFinanceCategory?: (id: string) => void;
  onSaveSalesFunnel?: (funnel: SalesFunnel) => void;
  onDeleteSalesFunnel?: (id: string) => void;
  onUpdateTelegramBotToken?: (token: string) => void;
  telegramBotToken?: string;
  
  initialTab?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  users, projects, tasks = [], statuses, priorities, tables = [], automationRules = [], 
  onUpdateTable, onCreateTable, onDeleteTable, onUpdateUsers, onUpdateProjects, onUpdateStatuses, onUpdatePriorities,
  onRestoreTask, onPermanentDelete, onRestoreUser, onRestoreEmployee, onRestoreDoc, onRestorePost,
  onRestoreProject, onRestoreDepartment, onRestoreFinanceCategory, onRestoreSalesFunnel,
  onRestoreTable, onRestoreBusinessProcess, onRestoreDeal, onRestoreClient, onRestoreContract,
  onRestoreMeeting,
  docs = [], contentPosts = [],
  onUpdateNotificationPrefs, onSaveAutomationRule, onDeleteAutomationRule,
  currentUser, onUpdateProfile, initialTab = 'users',
  onSaveDeal, departments = [], onSaveDepartment, onDeleteDepartment,
  financeCategories = [], onSaveFinanceCategory, onDeleteFinanceCategory,
  salesFunnels = [], onSaveSalesFunnel, onDeleteSalesFunnel,
  employeeInfos = [], deals = [], clients = [], contracts = [], meetings = [], businessProcesses = [],
  onUpdateTelegramBotToken, telegramBotToken, onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
        activeTab === id 
          ? 'bg-white dark:bg-[#303030] text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#191919]">
      <div className="flex flex-1 overflow-hidden">
        {/* Левая боковая панель */}
        <div className="w-64 bg-gray-50 dark:bg-[#202020] border-r border-gray-100 dark:border-[#333] p-4 flex flex-col gap-1 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-1 mb-2 uppercase">ЛИЧНЫЕ</div>
          <TabButton id="profile" label="Профиль" icon={<UserIcon size={16}/>} />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">СИСТЕМА</div>
          <TabButton id="users" label="Пользователи" icon={<Users size={16}/>} />
          <TabButton id="spaces" label="Проекты" icon={<Briefcase size={16}/>} />
          <TabButton id="departments" label="Подразделения" icon={<Building2 size={16}/>} />
          <TabButton id="finance-categories" label="Статьи расходов" icon={<Wallet size={16}/>} />
          <TabButton id="sales-funnels" label="Воронки продаж" icon={<TrendingUp size={16}/>} />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">ЗАДАЧИ</div>
          <TabButton id="statuses" label="Статусы" icon={<List size={16}/>} />
          <TabButton id="priorities" label="Приоритеты" icon={<BarChart2 size={16}/>} />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">АВТОМАТИЗАЦИЯ</div>
          <TabButton id="automation" label="Уведомления" icon={<Bell size={16}/>} />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">РАЗНОЕ</div>
          <TabButton id="archive" label="Архив" icon={<Archive size={16}/>} />
        </div>

        {/* Правая панель контента */}
        <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-[#191919] custom-scrollbar">
          <div className="max-w-3xl mx-auto">
          {activeTab === 'profile' && currentUser && <ProfileSettings activeTab="profile" currentUser={currentUser} users={users} onUpdateProfile={onUpdateProfile!} onUpdateUsers={onUpdateUsers} />}
          {activeTab === 'users' && <ProfileSettings activeTab="users" currentUser={currentUser!} users={users} onUpdateProfile={onUpdateProfile!} onUpdateUsers={onUpdateUsers} />}
          {activeTab === 'spaces' && <SpaceSettings activeTab="projects" tables={tables} projects={projects} statuses={statuses} priorities={priorities} onUpdateTable={onUpdateTable!} onCreateTable={onCreateTable!} onDeleteTable={onDeleteTable!} onUpdateProjects={onUpdateProjects} onUpdateStatuses={onUpdateStatuses} onUpdatePriorities={onUpdatePriorities} />}
          {activeTab === 'departments' && <DepartmentsView departments={departments} users={users} onSave={onSaveDepartment!} onDelete={onDeleteDepartment!} />}
          {activeTab === 'finance-categories' && <FinanceCategoriesSettings categories={financeCategories} onSave={onSaveFinanceCategory!} onDelete={onDeleteFinanceCategory!} />}
          {activeTab === 'sales-funnels' && <SalesFunnelsSettings funnels={salesFunnels} onSave={onSaveSalesFunnel!} onDelete={onDeleteSalesFunnel!} />}
          {activeTab === 'statuses' && <SpaceSettings activeTab={activeTab} tables={tables} projects={projects} statuses={statuses} priorities={priorities} onUpdateTable={onUpdateTable!} onCreateTable={onCreateTable!} onDeleteTable={onDeleteTable!} onUpdateProjects={onUpdateProjects} onUpdateStatuses={onUpdateStatuses} onUpdatePriorities={onUpdatePriorities} />}
          {activeTab === 'priorities' && <SpaceSettings activeTab={activeTab} tables={tables} projects={projects} statuses={statuses} priorities={priorities} onUpdateTable={onUpdateTable!} onCreateTable={onCreateTable!} onDeleteTable={onDeleteTable!} onUpdateProjects={onUpdateProjects} onUpdateStatuses={onUpdateStatuses} onUpdatePriorities={onUpdatePriorities} />}
          {activeTab === 'automation' && <AutomationSettings activeTab="notifications" notificationPrefs={{}} onUpdatePrefs={onUpdateNotificationPrefs} automationRules={automationRules} statuses={statuses} onSaveRule={onSaveAutomationRule} onDeleteRule={onDeleteAutomationRule} />}
          {activeTab === 'archive' && (
            <ArchiveView 
              tasks={tasks.filter(t => t.isArchived)}
              users={users.filter(u => u.isArchived)}
              employees={employeeInfos.filter(e => e.isArchived)}
              docs={docs.filter(d => d.isArchived)}
              posts={contentPosts.filter(p => p.isArchived)}
              projects={projects.filter(p => p.isArchived)}
              departments={departments.filter(d => d.isArchived)}
              financeCategories={financeCategories.filter(f => f.isArchived)}
              salesFunnels={salesFunnels.filter(s => s.isArchived)}
              tables={tables.filter(t => t.isArchived)}
              businessProcesses={businessProcesses.filter(b => b.isArchived)}
              deals={deals.filter(d => d.isArchived)}
              clients={clients.filter(c => c.isArchived)}
              contracts={contracts.filter(c => c.isArchived)}
              meetings={meetings.filter(m => m.isArchived)}
              onRestoreTask={onRestoreTask}
              onPermanentDelete={onPermanentDelete}
              onRestoreUser={onRestoreUser}
              onRestoreEmployee={onRestoreEmployee}
              onRestoreDoc={onRestoreDoc}
              onRestorePost={onRestorePost}
              onRestoreProject={onRestoreProject}
              onRestoreDepartment={onRestoreDepartment}
              onRestoreFinanceCategory={onRestoreFinanceCategory}
              onRestoreSalesFunnel={onRestoreSalesFunnel}
              onRestoreTable={onRestoreTable}
              onRestoreBusinessProcess={onRestoreBusinessProcess}
              onRestoreDeal={onRestoreDeal}
              onRestoreClient={onRestoreClient}
              onRestoreContract={onRestoreContract}
              onRestoreMeeting={onRestoreMeeting}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
