
import React, { useState, useEffect } from 'react';
import { Project, Role, Task, User, StatusOption, PriorityOption, NotificationPreferences, AutomationRule, TableCollection, Deal, Department, FinanceCategory } from '../types';
import { User as UserIcon, Briefcase, Archive, List, BarChart2, Bell, Zap, Users, Building2, Wallet } from 'lucide-react';
import { ProfileSettings } from './settings/ProfileSettings';
import { SpaceSettings } from './settings/SpaceSettings';
import { AutomationSettings } from './settings/AutomationSettings';
import DepartmentsView from './DepartmentsView';
import { storageService } from '../services/storageService';
import FinanceCategoriesSettings from './settings/FinanceCategoriesSettings';

// Компонент для отображения архива с вкладками
const ArchiveView: React.FC<{ 
    tasks: Task[];
    onRestoreTask?: (taskId: string) => void;
    onPermanentDelete?: (taskId: string) => void;
}> = ({ tasks, onRestoreTask, onPermanentDelete }) => {
    const [archiveTab, setArchiveTab] = useState<'tasks' | 'employees' | 'docs' | 'posts'>('tasks');
    
    return (
        <div className="space-y-4 max-w-3xl">
            <h3 className="font-bold text-gray-800 dark:text-white">Архив</h3>
            
            {/* Вкладки внутри архива */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#252525] rounded-full p-1 text-xs">
                <button 
                    onClick={() => setArchiveTab('tasks')} 
                    className={`px-3 py-1.5 rounded-full ${archiveTab === 'tasks' ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    Задачи
                </button>
                <button 
                    onClick={() => setArchiveTab('employees')} 
                    className={`px-3 py-1.5 rounded-full ${archiveTab === 'employees' ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    Сотрудники
                </button>
                <button 
                    onClick={() => setArchiveTab('docs')} 
                    className={`px-3 py-1.5 rounded-full ${archiveTab === 'docs' ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    Документы
                </button>
                <button 
                    onClick={() => setArchiveTab('posts')} 
                    className={`px-3 py-1.5 rounded-full ${archiveTab === 'posts' ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    Посты
                </button>
            </div>
            
            {/* Контент вкладок */}
            {archiveTab === 'tasks' && (
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">Архив задач пуст</p>
                    ) : (
                        tasks.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-[#333] rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">{t.title}</span>
                                <div className="flex gap-2">
                                    {onRestoreTask && <button onClick={() => onRestoreTask(t.id)} className="text-blue-600 hover:underline text-xs">Восстановить</button>}
                                    {onPermanentDelete && <button onClick={() => { if(confirm('Удалить навсегда?')) onPermanentDelete(t.id) }} className="text-red-500 hover:underline text-xs">Удалить</button>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {archiveTab === 'employees' && (
                <p className="text-gray-500 dark:text-gray-400">Архив сотрудников пуст</p>
            )}
            {archiveTab === 'docs' && (
                <p className="text-gray-500 dark:text-gray-400">Архив документов пуст</p>
            )}
            {archiveTab === 'posts' && (
                <p className="text-gray-500 dark:text-gray-400">Архив постов пуст</p>
            )}
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
  onClose: () => void;
  onUpdateNotificationPrefs: (prefs: NotificationPreferences) => void;
  onSaveAutomationRule?: (rule: AutomationRule) => void;
  onDeleteAutomationRule?: (id: string) => void;
  onUpdateProfile?: (user: User) => void;
  onSaveDeal?: (deal: Deal) => void;
  // onFillMockData удален
  onSaveDepartment?: (dep: Department) => void;
  onDeleteDepartment?: (id: string) => void;
  onSaveFinanceCategory?: (cat: FinanceCategory) => void;
  onDeleteFinanceCategory?: (id: string) => void;
  onUpdateTelegramBotToken?: (token: string) => void;
  telegramBotToken?: string;
  
  initialTab?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  users, projects, tasks = [], statuses, priorities, tables = [],
  onUpdateTable, onCreateTable, onDeleteTable,
  onUpdateUsers, onUpdateProjects, onUpdateStatuses, onUpdatePriorities,
  onRestoreTask, onPermanentDelete,
  onUpdateNotificationPrefs, automationRules = [], onSaveAutomationRule, onDeleteAutomationRule,
  currentUser, onUpdateProfile, initialTab = 'users',
  onSaveDeal, departments = [], onSaveDepartment, onDeleteDepartment,
  financeCategories = [], onSaveFinanceCategory, onDeleteFinanceCategory,
  onUpdateTelegramBotToken, telegramBotToken
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [botToken, setBotToken] = useState<string>('');
  
  useEffect(() => {
      setActiveTab(initialTab);
      setBotToken(storageService.getEmployeeBotToken());
  }, [initialTab]);

  const TabButton = ({ id, label, icon }: { id: any, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left whitespace-nowrap ${activeTab === id ? 'bg-white dark:bg-[#303030] text-blue-600 shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'}`}>
        {icon} {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-white dark:bg-[#191919]">
        {/* Mobile Header for Settings */}
        <div className="md:hidden flex items-center p-4 border-b border-gray-100 dark:border-[#333]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Настройки</h2>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-[#202020] border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#333] p-4 flex md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar">
            <div className="md:block hidden text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-1 mb-2 uppercase">Личные</div>
            <TabButton id="profile" label="Профиль" icon={<UserIcon size={16}/>} />
            
            <div className="md:block hidden text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">Система</div>
            <TabButton id="users" label="Пользователи" icon={<Users size={16}/>} />
            <TabButton id="projects" label="Проекты" icon={<Briefcase size={16}/>} />
            <TabButton id="departments" label="Подразделения" icon={<Building2 size={16}/>} />
            <TabButton id="finance-categories" label="Статьи расходов" icon={<Wallet size={16}/>} />
            
            <div className="md:block hidden text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">Задачи</div>
            <TabButton id="statuses" label="Статусы" icon={<List size={16}/>} />
            <TabButton id="priorities" label="Приоритеты" icon={<BarChart2 size={16}/>} />
            
            <div className="md:block hidden text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">Автоматизация</div>
            <TabButton id="notifications" label="Уведомления" icon={<Bell size={16}/>} />
            
            <div className="md:block hidden text-xs font-bold text-gray-400 dark:text-gray-600 px-3 mt-6 mb-2 uppercase">Разное</div>
            <TabButton id="archive" label="Архив" icon={<Archive size={16}/>} />
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-white dark:bg-[#191919] custom-scrollbar">
            {/* Profile & Users */}
            {(activeTab === 'profile' || activeTab === 'users') && currentUser && (
                <ProfileSettings 
                    activeTab={activeTab} 
                    currentUser={currentUser} 
                    users={users} 
                    onUpdateProfile={onUpdateProfile || (() => {})} 
                    onUpdateUsers={onUpdateUsers}
                />
            )}

            {/* Space (Projects, Statuses, Priorities) */}
            {['projects', 'statuses', 'priorities'].includes(activeTab) && (
                <SpaceSettings 
                    activeTab={activeTab}
                    tables={tables} projects={projects} statuses={statuses} priorities={priorities}
                    onUpdateTable={onUpdateTable || (() => {})} onCreateTable={onCreateTable || (() => {})} onDeleteTable={onDeleteTable || (() => {})}
                    onUpdateProjects={onUpdateProjects} onUpdateStatuses={onUpdateStatuses} onUpdatePriorities={onUpdatePriorities}
                />
            )}

            {/* Departments */}
            {activeTab === 'departments' && onSaveDepartment && onDeleteDepartment && (
                <DepartmentsView 
                    departments={departments}
                    users={users}
                    onSave={onSaveDepartment}
                    onDelete={onDeleteDepartment}
                />
            )}

            {/* Finance Categories */}
            {activeTab === 'finance-categories' && onSaveFinanceCategory && onDeleteFinanceCategory && (
                <FinanceCategoriesSettings 
                    categories={financeCategories} 
                    onSave={onSaveFinanceCategory} 
                    onDelete={onDeleteFinanceCategory} 
                />
            )}

            {/* Notifications (бывшая Автоматизация) */}
            {activeTab === 'notifications' && (
                <>
                    <AutomationSettings 
                        activeTab="notifications"
                        automationRules={automationRules || []}
                        notificationPrefs={storageService.getNotificationPrefs() || { newTask: { app: true, telegram: true }, statusChange: { app: true, telegram: true } }}
                        statuses={statuses}
                        onSaveRule={onSaveAutomationRule || (() => {})}
                        onDeleteRule={onDeleteAutomationRule || (() => {})}
                        onUpdatePrefs={onUpdateNotificationPrefs}
                    />
                    
                    {/* Telegram Bot Token (только для админа) */}
                    {currentUser?.role === Role.ADMIN && (
                        <div className="mt-6 bg-white dark:bg-[#252525] p-6 rounded-xl border border-gray-200 dark:border-[#333]">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Настройки Telegram бота</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Токен бота</label>
                                    <input 
                                        type="password"
                                        value={botToken} 
                                        onChange={e => {
                                            const value = e.target.value;
                                            setBotToken(value);
                                            storageService.setEmployeeBotToken(value);
                                            onUpdateTelegramBotToken?.(value);
                                        }}
                                        placeholder="Введите токен Telegram бота"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Токен можно получить у @BotFather в Telegram</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}


            {/* Archive */}
            {activeTab === 'archive' && (
                <ArchiveView 
                    tasks={tasks.filter(t => t.isArchived)}
                    onRestoreTask={onRestoreTask}
                    onPermanentDelete={onPermanentDelete}
                />
            )}
        </div>
    </div>
  );
};

export default SettingsView;
