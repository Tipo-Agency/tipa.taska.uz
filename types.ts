
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum ViewMode {
  TABLE = 'table',
  KANBAN = 'kanban',
  GANTT = 'gantt',
}

export interface StatusOption {
    id: string;
    name: string;
    color: string; // Tailwind class
}

export interface PriorityOption {
    id: string;
    name: string;
    color: string; // Tailwind class
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  login?: string; 
  email?: string;
  phone?: string;
  telegram?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  instagram?: string;
  companyName?: string; // Название компании
  companyInfo?: string; // Информация о том, чем занимается компания
  notes?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  number: string; 
  startDate: string;
  endDate?: string;
  amount: number;
  currency: string; 
  status: 'active' | 'completed' | 'pending';
  paymentDay: number; 
  services: string; 
}

export interface OneTimeDeal {
  id: string;
  clientId: string;
  number?: string; // Номер сделки (опционально)
  date: string; // Дата сделки
  amount: number; // Сумма сделки
  currency: string; // Валюта
  description: string; // Описание услуги/товара
  status: 'pending' | 'paid' | 'overdue'; // Статус оплаты
  dueDate?: string; // Срок оплаты (если есть)
  paidAmount?: number; // Оплаченная сумма
  paidDate?: string; // Дата оплаты
  notes?: string; // Примечания
}

export interface AccountsReceivable {
  id: string;
  clientId: string;
  dealId?: string; // ID разовой сделки
  contractId?: string; // ID договора (если задолженность по договору)
  amount: number; // Сумма задолженности
  currency: string; // Валюта
  dueDate: string; // Срок погашения
  status: 'current' | 'overdue' | 'paid'; // Статус
  description: string; // Описание
  paidAmount?: number; // Оплаченная сумма
  paidDate?: string; // Дата оплаты
  createdAt: string; // Дата создания записи
  updatedAt?: string; // Дата обновления
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  type?: 'internal' | 'telegram_in' | 'telegram_out'; // New field for chat context
}

export interface Deal {
  id: string;
  title: string;
  clientId?: string; 
  contactName?: string; 
  amount: number;
  currency: string; 
  stage: 'new' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source?: 'instagram' | 'telegram' | 'site' | 'manual' | 'recommendation'; // Lead Source
  telegramChatId?: string; // For chatting with lead
  telegramUsername?: string;
  assigneeId: string;
  createdAt: string;
  notes?: string; // Комментарии к сделке
  projectId?: string; // Вид услуг (модуль/проект)
  comments?: Comment[];
  isArchived?: boolean; // Архив
}

export interface Department {
    id: string;
    name: string;
    headId?: string; 
    description?: string;
}

export interface EmployeeInfo {
  id: string;
  userId: string; 
  departmentId?: string; 
  position: string;
  hireDate: string;
  birthDate?: string;
  // Поля salary и conditions удалены согласно ТЗ
}

// --- BPM TYPES ---

export interface OrgPosition {
    id: string;
    title: string;
    departmentId?: string;
    managerPositionId?: string; 
    holderUserId?: string;
    order?: number; // Порядок для определения позиции слева/справа (меньше = левее)
}

export interface ProcessStep {
    id: string;
    title: string;
    description?: string;
    assigneeType: 'user' | 'position';
    assigneeId: string; 
    order: number;
}

export interface ProcessInstance {
    id: string;
    processId: string;
    processVersion: number; // Версия процесса на момент запуска (для защиты от конфликтов)
    currentStepId: string | null; // Текущий активный шаг
    status: 'active' | 'completed' | 'paused';
    startedAt: string;
    completedAt?: string;
    taskIds: string[]; // ID задач, созданных для этого экземпляра
}

export interface BusinessProcess {
    id: string;
    version: number; // Версия процесса (для избежания конфликтов)
    title: string;
    description?: string;
    steps: ProcessStep[];
    instances?: ProcessInstance[]; // Экземпляры запущенных процессов
    isArchived?: boolean; // Архив
    createdAt: string; // ISO дата создания
    updatedAt: string; // ISO дата последнего обновления
}

// --- AUTOMATION TYPES ---

export type TriggerType = 
    | 'task_created' | 'task_status_changed' | 'task_assigned' | 'task_comment' | 'task_deadline'
    | 'doc_created' | 'doc_updated' | 'doc_shared'
    | 'meeting_created' | 'meeting_reminder' | 'meeting_updated'
    | 'post_created' | 'post_status_changed'
    | 'purchase_request_created' | 'purchase_request_status_changed' | 'finance_plan_updated'
    | 'deal_created' | 'deal_status_changed' | 'client_created' | 'contract_created'
    | 'employee_created' | 'employee_updated'
    | 'process_started' | 'process_step_completed' | 'process_step_requires_approval';

export type ActionType = 
    | 'telegram_message' 
    | 'approval_request' // Запрос на согласование
    | 'assign_task'
    | 'change_status';

export interface TelegramButtonConfig {
    text: string;
    action: 'approve' | 'reject' | 'defer' | 'view' | 'custom';
    url?: string;
    callbackData?: string;
}

export interface AutomationRule {
    id: string;
    name: string;
    isActive: boolean;
    module: 'tasks' | 'docs' | 'meetings' | 'content' | 'finance' | 'crm' | 'employees' | 'bpm';
    trigger: TriggerType;
    conditions: {
        moduleId?: string; 
        statusTo?: string;
        statusFrom?: string;
        priority?: string;
        departmentId?: string;
        categoryId?: string;
    };
    action: {
        type: ActionType;
        template?: string; 
        buttons?: TelegramButtonConfig[];
        targetUser: 'assignee' | 'creator' | 'admin' | 'specific' | 'manager';
        specificUserId?: string;
        // Для согласования
        approvalType?: 'purchase_request' | 'process_step' | 'document' | 'deal';
        approvalEntityId?: string;
    };
}

// ----------------

export interface Project {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    text: string;
    createdAt: string;
    isSystem?: boolean;
    attachmentId?: string; // ID вложения, если комментарий связан с загрузкой файла
}

export interface TaskAttachment {
    id: string;
    taskId: string;
    name: string;
    url: string; 
    type: string; 
    uploadedAt: string;
    docId?: string; // Если вложение - это документ из модуля документов
    attachmentType?: 'file' | 'doc'; // Тип вложения: файл или документ
    storagePath?: string; // Путь в Firebase Storage для файлов
}

export type EntityType = 'task' | 'idea' | 'feature' | 'purchase_request';

export interface Task {
  id: string;
  entityType: EntityType; // Тип сущности: task, idea, feature, purchase_request
  tableId: string; // ID страницы проекта (для идей/функций) или пустое (для обычных задач)
  title: string;
  status: string; 
  priority: string; 
  assigneeId: string | null;
  assigneeIds?: string[]; 
  projectId: string | null;
  startDate: string;
  endDate: string;
  description?: string;
  isArchived?: boolean;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  contentPostId?: string; // LINK TO CONTENT PLAN POST
  processId?: string; // Связь с бизнес-процессом
  processInstanceId?: string; // ID экземпляра процесса
  stepId?: string; // ID шага процесса
  dealId?: string; // Связь со сделкой
  source?: string; // 'Задача', 'Беклог', 'Функционал', или название контент-плана
  category?: string; // Категория функции (ID из functionalityCategories)
  taskId?: string; // ID связанной задачи (для функций)
  createdByUserId?: string; // ID автора (для идей)
  createdAt?: string; // ISO дата создания
  // Поля для purchase_request:
  requesterId?: string; // ID пользователя (для заявок)
  departmentId?: string; // ID отдела (для заявок)
  categoryId?: string; // ID категории финансов (для заявок)
  amount?: number; // Сумма (для заявок)
  decisionDate?: string; // ISO дата решения (для заявок)
}

export interface Meeting {
  id: string;
  tableId: string; // Не используется (модуль фиксированный)
  title: string;
  date: string; // ISO дата
  time: string; // 'HH:mm'
  participantIds: string[];
  summary: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  isArchived?: boolean; // Архив
}

export interface ContentPost {
  id: string;
  tableId: string; // ID страницы контент плана для проекта (contentPlanPages.id)
  topic: string; 
  date: string; // ISO дата
  platform: string[]; 
  format: 'post' | 'reel' | 'story' | 'article' | 'video';
  status: 'idea' | 'copywriting' | 'design' | 'approval' | 'scheduled' | 'published';
  copy?: string; 
  mediaUrl?: string;
  isArchived?: boolean; // Архив
}

export interface TableCollection {
  id: string;
  name: string;
  type: 'tasks' | 'docs' | 'meetings' | 'content-plan' | 'backlog' | 'functionality';
  icon: string;
  color?: string;
  isSystem?: boolean;
}

export interface Folder {
  id: string;
  tableId: string;
  name: string;
  parentFolderId?: string; // Поддержка вложенных папок
}

export interface Doc {
  id: string;
  tableId: string; // Не используется (модуль фиксированный)
  folderId?: string; 
  title: string;
  type: 'link' | 'internal';
  url?: string; // Для типа 'link'
  content?: string; // Для типа 'internal' (HTML)
  tags: string[];
  isArchived?: boolean; // Архив
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  details: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSetting {
    app: boolean;
    telegram: boolean;
}

export interface NotificationPreferences {
    // Задачи
    newTask: NotificationSetting;
    statusChange: NotificationSetting;
    taskAssigned: NotificationSetting;
    taskComment: NotificationSetting;
    taskDeadline: NotificationSetting;
    // Документы
    docCreated: NotificationSetting;
    docUpdated: NotificationSetting;
    docShared: NotificationSetting;
    // Встречи
    meetingCreated: NotificationSetting;
    meetingReminder: NotificationSetting;
    meetingUpdated: NotificationSetting;
    // Контент-план
    postCreated: NotificationSetting;
    postStatusChanged: NotificationSetting;
    // Финансы
    purchaseRequestCreated: NotificationSetting;
    purchaseRequestStatusChanged: NotificationSetting;
    financePlanUpdated: NotificationSetting;
    // CRM
    dealCreated: NotificationSetting;
    dealStatusChanged: NotificationSetting;
    clientCreated: NotificationSetting;
    contractCreated: NotificationSetting;
    // Сотрудники
    employeeCreated: NotificationSetting;
    employeeUpdated: NotificationSetting;
    // Бизнес-процессы
    processStarted: NotificationSetting;
    processStepCompleted: NotificationSetting;
    processStepRequiresApproval: NotificationSetting;
}

// --- FINANCE TYPES ---

export interface FinanceCategory {
    id: string;
    name: string;
    type: 'fixed' | 'percent'; 
    color?: string;
}

export interface FinancePlan {
    id: string; 
    period: 'week' | 'month';
    salesPlan: number; 
    currentIncome: number; 
}

// PurchaseRequest теперь является частью универсальной сущности Task с entityType: 'purchase_request'
// Поля хранятся в Task: requesterId, departmentId, categoryId, amount, description, status, decisionDate
// Этот интерфейс оставлен для обратной совместимости, но рекомендуется использовать Task с entityType
export interface PurchaseRequest {
    id: string;
    requesterId: string;
    departmentId: string;
    categoryId: string; 
    amount: number;
    description: string;
    status: 'pending' | 'approved' | 'rejected' | 'deferred';
    date: string;
    decisionDate?: string;
    isArchived?: boolean; // Архив
}

// Финансовый план (на месяц) - создается в настройках для каждого подразделения
// Финансовый план - план по доходу и расходу по статьям затрат
export interface FinancialPlanDocument {
    id: string;
    departmentId: string;
    period: string; // YYYY-MM формат месяца
    income: number; // Доход
    expenses: Record<string, number>; // Расходы по статьям: { categoryId: amount }
    status: 'created' | 'conducted' | 'approved'; // создан, проведен, утвержден
    createdAt: string;
    updatedAt?: string;
    approvedBy?: string; // userId
    approvedAt?: string;
    isArchived?: boolean;
}

// Финансовое планирование - создается на основе финансового плана, содержит заявки
export interface FinancialPlanning {
    id: string;
    departmentId: string;
    period: string; // YYYY-MM формат месяца
    planDocumentId?: string; // Ссылка на FinancialPlanDocument
    requestIds: string[]; // ID заявок, которые попадают в это планирование
    status: 'created' | 'conducted' | 'approved'; // создан, проведен, одобрен
    createdAt: string;
    updatedAt?: string;
    approvedBy?: string; // userId
    approvedAt?: string;
    notes?: string;
    isArchived?: boolean;
}

// --- INVENTORY TYPES ---

export interface Warehouse {
  id: string;
  name: string;
  departmentId?: string;
  location?: string;
  isDefault?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category?: string;
  notes?: string;
}

export type StockMovementType = 'receipt' | 'transfer' | 'writeoff' | 'adjustment';

export interface StockMovementItem {
  itemId: string;
  quantity: number;
  price?: number;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  date: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  items: StockMovementItem[];
  reason?: string;
  createdByUserId: string;
}

export interface StockBalance {
  warehouseId: string;
  itemId: string;
  quantity: number;
}

// --- NEW INTERFACES FROM DATA ARCHITECTURE ---

export interface BacklogPage {
  id: string;
  projectId: string; // ID проекта
  name: string; // Название страницы (обычно название проекта)
  createdAt: string; // ISO дата создания
}

export interface FunctionalityPage {
  id: string;
  projectId: string; // ID проекта
  name: string; // Название страницы (обычно название проекта)
  createdAt: string; // ISO дата создания
}

export interface FunctionalityCategory {
  id: string;
  name: string; // 'counters', 'seo', 'features', 'backend', 'infrastructure'
  description?: string;
  defaultFeatures?: string[]; // ID базовых функций для этой категории
}

export interface DefaultFeature {
  id: string;
  categoryId: string; // ID категории
  title: string;
  description?: string;
  order: number; // Порядок создания
}

export interface ContentPlanPage {
  id: string;
  projectId: string; // ID проекта
  name: string; // Название страницы (обычно название проекта)
  createdAt: string; // ISO дата создания
  publicLink?: string; // Публичная ссылка для клиента
}
