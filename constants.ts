
import { Project, Role, TableCollection, Task, User, Doc, StatusOption, PriorityOption, NotificationPreferences, Department, FinanceCategory, OrgPosition, AutomationRule } from "./types";

// URL Firebase и токен бота теперь читаем из окружения, чтобы ты мог использовать свой проект.
// В .env.local можно задать:
// VITE_FIREBASE_DB_URL=...
// ВАЖНО: Токен бота теперь берется только из GitHub Secrets (через .env на сервере)
// В браузере токен устанавливается в настройках системы (localStorage)
// НЕ используем VITE_TELEGRAM_BOT_TOKEN - это только для сервера
// export const TELEGRAM_BOT_TOKEN = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN || '';
export const FIREBASE_DB_URL: string = (import.meta as any).env?.VITE_FIREBASE_DB_URL || '';

export const TELEGRAM_CHAT_ID = '-1002719375477'; 

export const ICON_OPTIONS = ['Bug', 'CheckSquare', 'Target', 'FileText', 'Users', 'Briefcase', 'Zap', 'Star', 'Heart', 'Flag', 'Rocket', 'Layout'];
export const COLOR_OPTIONS = [ 'text-gray-500', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-600', 'text-blue-500', 'text-purple-500', 'text-pink-500', 'text-indigo-500' ];

export const DEFAULT_STATUSES: StatusOption[] = [
    { id: 's1', name: 'Не начато', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
    { id: 's2', name: 'В работе', color: 'bg-blue-500 dark:bg-blue-600 text-white border border-blue-600 dark:border-blue-500' },
    { id: 's3', name: 'На проверке', color: 'bg-amber-500 dark:bg-amber-600 text-white border border-amber-600 dark:border-amber-500' },
    { id: 's4', name: 'Выполнено', color: 'bg-emerald-500 dark:bg-emerald-600 text-white border border-emerald-600 dark:border-emerald-500' },
];

export const DEFAULT_PRIORITIES: PriorityOption[] = [
    { id: 'p1', name: 'Низкий', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' },
    { id: 'p2', name: 'Средний', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' },
    { id: 'p3', name: 'Высокий', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700' },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
    // Задачи
    newTask: { telegramPersonal: true, telegramGroup: false },
    statusChange: { telegramPersonal: true, telegramGroup: false },
    taskAssigned: { telegramPersonal: true, telegramGroup: false },
    taskComment: { telegramPersonal: true, telegramGroup: false },
    taskDeadline: { telegramPersonal: true, telegramGroup: false },
    // Документы
    docCreated: { telegramPersonal: true, telegramGroup: false },
    docUpdated: { telegramPersonal: true, telegramGroup: false },
    docShared: { telegramPersonal: true, telegramGroup: false },
    // Встречи
    meetingCreated: { telegramPersonal: true, telegramGroup: false },
    meetingReminder: { telegramPersonal: true, telegramGroup: false },
    meetingUpdated: { telegramPersonal: true, telegramGroup: false },
    // Контент-план
    postCreated: { telegramPersonal: true, telegramGroup: false },
    postStatusChanged: { telegramPersonal: true, telegramGroup: false },
    // Финансы
    purchaseRequestCreated: { telegramPersonal: true, telegramGroup: false },
    purchaseRequestStatusChanged: { telegramPersonal: true, telegramGroup: false },
    financePlanUpdated: { telegramPersonal: true, telegramGroup: false },
    // CRM
    dealCreated: { telegramPersonal: true, telegramGroup: false },
    dealStatusChanged: { telegramPersonal: true, telegramGroup: false },
    clientCreated: { telegramPersonal: true, telegramGroup: false },
    contractCreated: { telegramPersonal: true, telegramGroup: false },
    // Сотрудники
    employeeCreated: { telegramPersonal: true, telegramGroup: false },
    employeeUpdated: { telegramPersonal: true, telegramGroup: false },
    // Бизнес-процессы
    processStarted: { telegramPersonal: true, telegramGroup: false },
    processStepCompleted: { telegramPersonal: true, telegramGroup: false },
    processStepRequiresApproval: { telegramPersonal: true, telegramGroup: false }
};

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
    {
        id: 'rule-1',
        name: 'Согласование договора',
        isActive: true,
        trigger: 'status_change',
        conditions: { statusTo: 'На проверке' },
        action: {
            type: 'telegram_message',
            targetUser: 'admin',
            template: '🔔 <b>Требует согласования:</b> {task_title}\n\nПожалуйста, проверьте документ.',
            buttons: [
                { text: '✅ Одобрить', action: 'approve', callbackData: 'change_status:Выполнено' },
                { text: '❌ Вернуть', action: 'reject', callbackData: 'change_status:В работе' }
            ]
        }
    }
];

export const LABEL_COLORS = [
    { name: 'Gray', class: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
    { name: 'Blue', class: 'bg-blue-500 dark:bg-blue-600 text-white border border-blue-600 dark:border-blue-500' },
    { name: 'Green', class: 'bg-emerald-500 dark:bg-emerald-600 text-white border border-emerald-600 dark:border-emerald-500' },
    { name: 'Yellow', class: 'bg-amber-500 dark:bg-amber-600 text-white border border-amber-600 dark:border-amber-500' },
    { name: 'Red', class: 'bg-rose-500 dark:bg-rose-600 text-white border border-rose-600 dark:border-rose-500' },
    { name: 'Purple', class: 'bg-violet-500 dark:bg-violet-600 text-white border border-violet-600 dark:border-violet-500' },
    { name: 'Pink', class: 'bg-pink-500 dark:bg-pink-600 text-white border border-pink-600 dark:border-pink-500' },
    { name: 'Indigo', class: 'bg-indigo-500 dark:bg-indigo-600 text-white border border-indigo-600 dark:border-indigo-500' },
    { name: 'Orange', class: 'bg-orange-500 dark:bg-orange-600 text-white border border-orange-600 dark:border-orange-500' },
    { name: 'Cyan', class: 'bg-cyan-500 dark:bg-cyan-600 text-white border border-cyan-600 dark:border-cyan-500' },
];

export const PRIORITY_COLORS = [
    { name: 'Green', class: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' },
    { name: 'Orange', class: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' },
    { name: 'Red', class: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700' },
    { name: 'Gray', class: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
    { name: 'Blue', class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700' },
    { name: 'Yellow', class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700' },
];

// Fallback значения для начальной загрузки (используются только если в Firestore нет данных)
export const MOCK_PROJECTS: Project[] = [];

export const MOCK_TABLES: TableCollection[] = [];

export const MOCK_DEPARTMENTS: Department[] = [];

export const MOCK_ORG_POSITIONS: OrgPosition[] = [];

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
    { id: 'fc1', name: 'ФОТ (Зарплаты)', type: 'percent', value: 40, color: 'bg-blue-100 text-blue-700' },
    { id: 'fc2', name: 'Налоги', type: 'percent', value: 12, color: 'bg-red-100 text-red-700' },
    { id: 'fc3', name: 'Реклама', type: 'percent', value: 15, color: 'bg-purple-100 text-purple-700' },
    { id: 'fc4', name: 'Аренда офиса', type: 'fixed', value: 5000000, color: 'bg-orange-100 text-orange-700' },
    { id: 'fc5', name: 'Сервисы / Софт', type: 'fixed', value: 1000000, color: 'bg-green-100 text-green-700' },
    { id: 'fc6', name: 'Дивиденды', type: 'percent', value: 10, color: 'bg-yellow-100 text-yellow-700' },
];

