
import { Doc, Project, Role, TableCollection, Task, User, Meeting, ActivityLog, StatusOption, PriorityOption, ContentPost, Client, EmployeeInfo, Contract, Folder, Deal, NotificationPreferences, Department, FinanceCategory, FinancePlan, PurchaseRequest, OrgPosition, BusinessProcess, AutomationRule, Warehouse, InventoryItem, StockMovement, OneTimeDeal, AccountsReceivable, SalesFunnel } from "../types";
import { FIREBASE_DB_URL, MOCK_PROJECTS, MOCK_TABLES, DEFAULT_STATUSES, DEFAULT_PRIORITIES, DEFAULT_NOTIFICATION_PREFS, MOCK_DEPARTMENTS, DEFAULT_FINANCE_CATEGORIES, MOCK_ORG_POSITIONS, DEFAULT_AUTOMATION_RULES, TELEGRAM_BOT_TOKEN } from "../constants";
import { firestoreService } from "./firestoreService";


// Флаг для отслеживания последнего сохранения (чтобы не перезаписывать свежие данные)
let lastSaveTime = 0;
const SAVE_COOLDOWN = 5000; // 5 секунд - минимальная задержка между сохранением и синхронизацией
let isSaving = false; // Флаг, что идет процесс сохранения

const STORAGE_KEYS = {
  USERS: 'cfo_users',
  TASKS: 'cfo_tasks',
  PROJECTS: 'cfo_projects',
  TABLES: 'cfo_tables',
  DOCS: 'cfo_docs',
  FOLDERS: 'cfo_folders',
  MEETINGS: 'cfo_meetings',
  CONTENT_POSTS: 'cfo_content_posts',
  ACTIVITY: 'cfo_activity',
  
  // Auth Session
  ACTIVE_USER_ID: 'cfo_active_user_session',

  TELEGRAM_CHAT_ID: 'cfo_telegram_chat_id',
  TELEGRAM_EMPLOYEE_TOKEN: 'cfo_telegram_employee_token',
  TELEGRAM_CLIENT_TOKEN: 'cfo_telegram_client_token',

  STATUSES: 'cfo_statuses',
  PRIORITIES: 'cfo_priorities',
  CLIENTS: 'cfo_clients',
  CONTRACTS: 'cfo_contracts',
  EMPLOYEE_INFOS: 'cfo_employee_infos',
  DEALS: 'cfo_deals',
  NOTIFICATION_PREFS: 'cfo_notification_prefs',
  // Finance
  DEPARTMENTS: 'cfo_departments',
  FINANCE_CATEGORIES: 'cfo_finance_categories',
  FINANCE_PLAN: 'cfo_finance_plan',
  PURCHASE_REQUESTS: 'cfo_purchase_requests',
  FINANCIAL_PLAN_DOCUMENTS: 'cfo_financial_plan_documents',
  FINANCIAL_PLANNINGS: 'cfo_financial_plannings',
  // BPM
  ORG_POSITIONS: 'cfo_org_positions',
  BUSINESS_PROCESSES: 'cfo_business_processes',
  // Automation
  AUTOMATION_RULES: 'cfo_automation_rules',
  // Inventory
  WAREHOUSES: 'cfo_warehouses',
  INVENTORY_ITEMS: 'cfo_inventory_items',
  STOCK_MOVEMENTS: 'cfo_stock_movements',
  // Sales Funnels
  SALES_FUNNELS: 'cfo_sales_funnels',
  // Integrations
  LAST_TELEGRAM_UPDATE_ID: 'cfo_last_telegram_update_id',
  ENABLE_TELEGRAM_IMPORT: 'cfo_enable_telegram_import',
};

const getLocal = <T>(key: string, seed: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
        return JSON.parse(stored);
    } catch (e) {
        return seed;
    }
  }
  return seed;
};

const setLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Helper to convert Firebase Objects (from POST requests) to Arrays
const normalizeArray = <T>(data: any): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
        // If data is { "key1": val1, "key2": val2 }, return [val1, val2]
        return Object.values(data);
    }
    return [];
};

export const storageService = {
  getDbUrl: () => FIREBASE_DB_URL,
  
  // Session Management
  getActiveUserId: (): string | null => localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID),
  setActiveUserId: (id: string) => localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id),
  clearActiveUserId: () => localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID),

  getTelegramChatId: (): string => localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHAT_ID) || '',
  setTelegramChatId: (id: string) => localStorage.setItem(STORAGE_KEYS.TELEGRAM_CHAT_ID, id),

  // Bot Tokens
  getEmployeeBotToken: (): string => localStorage.getItem(STORAGE_KEYS.TELEGRAM_EMPLOYEE_TOKEN) || TELEGRAM_BOT_TOKEN,
  setEmployeeBotToken: (t: string) => localStorage.setItem(STORAGE_KEYS.TELEGRAM_EMPLOYEE_TOKEN, t),
  
  getClientBotToken: (): string => localStorage.getItem(STORAGE_KEYS.TELEGRAM_CLIENT_TOKEN) || '',
  setClientBotToken: (t: string) => localStorage.setItem(STORAGE_KEYS.TELEGRAM_CLIENT_TOKEN, t),

  // Telegram Direct Integration Settings
  getLastTelegramUpdateId: (): number => getLocal(STORAGE_KEYS.LAST_TELEGRAM_UPDATE_ID, 0),
  setLastTelegramUpdateId: (id: number) => setLocal(STORAGE_KEYS.LAST_TELEGRAM_UPDATE_ID, id),

  // Inventory Local Accessors
  getWarehouses: (): Warehouse[] => getLocal(STORAGE_KEYS.WAREHOUSES, []),
  setWarehouses: (warehouses: Warehouse[]) => { setLocal(STORAGE_KEYS.WAREHOUSES, warehouses); storageService.saveToCloud(); },
  getInventoryItems: (): InventoryItem[] => getLocal(STORAGE_KEYS.INVENTORY_ITEMS, []),
  setInventoryItems: (items: InventoryItem[]) => { setLocal(STORAGE_KEYS.INVENTORY_ITEMS, items); storageService.saveToCloud(); },
  getStockMovements: (): StockMovement[] => getLocal(STORAGE_KEYS.STOCK_MOVEMENTS, []),
  setStockMovements: (movements: StockMovement[]) => { setLocal(STORAGE_KEYS.STOCK_MOVEMENTS, movements); storageService.saveToCloud(); },
  
  getEnableTelegramImport: (): boolean => getLocal(STORAGE_KEYS.ENABLE_TELEGRAM_IMPORT, false),
  setEnableTelegramImport: (enabled: boolean) => setLocal(STORAGE_KEYS.ENABLE_TELEGRAM_IMPORT, enabled),

  // Sales Funnels Local Accessors
  getSalesFunnels: (): SalesFunnel[] => {
    const funnels = getLocal(STORAGE_KEYS.SALES_FUNNELS, []);
    return funnels.filter(f => !f.isArchived);
  },
  setSalesFunnels: (funnels: SalesFunnel[]) => { setLocal(STORAGE_KEYS.SALES_FUNNELS, funnels); storageService.saveToCloud(); },

  loadFromCloud: async (force: boolean = false) => {
      try {
          // Если force=true (первая загрузка), всегда загружаем из облака
          // При обычной синхронизации пропускаем только если идет сохранение
          if (!force && isSaving) {
              return false; // Пропускаем, если идет сохранение
          }
          
          // Убрали проверку timeSinceLastSave - она мешала синхронизации между устройствами
          // Теперь синхронизация происходит всегда, кроме случаев когда идет сохранение
          
          // Используем Firestore вместо Realtime Database
          const data = await firestoreService.loadFromCloud();
          // Если data === null, значит ошибка загрузки
          // Если data === {}, значит Firebase пуст, но это нормально - используем localStorage
          if (data === null) return false;

          // data может быть пустым объектом {} - это нормально, просто нет данных в Firebase
          let hasChanges = false;
          if (data) {
              
              // Firebase - единственный источник истины
              // Просто перезаписываем localStorage данными из Firebase
              // Никаких слияний - Firebase всегда прав
              // Фильтруем архивные элементы из Firebase (на всякий случай, хотя их там быть не должно)
              const filterArchived = <T extends { isArchived?: boolean }>(items: T[]): T[] => {
                  return items.filter(item => !item.isArchived);
              };
              
              // Firebase - единственный источник истины, просто перезаписываем
              if (data.tasks !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.tasks));
                  const current = getLocal(STORAGE_KEYS.TASKS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.TASKS, normalized);
                      hasChanges = true;
                  }
              }
              
              
              if (data.users !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.users));
                  // Удаляем дубликаты по логину для пользователей (оставляем только последнего)
                  const removeDuplicatesByLogin = (users: User[]): User[] => {
                      const seen = new Map<string, User>();
                      for (let i = users.length - 1; i >= 0; i--) {
                          const user = users[i];
                          if (user.login && !seen.has(user.login)) {
                              seen.set(user.login, user);
                          } else if (!user.login && !seen.has(user.id)) {
                              seen.set(user.id, user);
                          }
                      }
                      return Array.from(seen.values());
                  };
                  const deduplicated = removeDuplicatesByLogin(normalized);
                  const current = getLocal(STORAGE_KEYS.USERS, []);
                  if (JSON.stringify(deduplicated) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.USERS, deduplicated);
                      hasChanges = true;
                  }
              }
              if (data.projects !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.projects));
                  const current = getLocal(STORAGE_KEYS.PROJECTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.PROJECTS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.tables !== undefined) {
                  const normalized = normalizeArray(data.tables);
                  const current = getLocal(STORAGE_KEYS.TABLES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.TABLES, normalized);
                      hasChanges = true;
                  }
              }
              if (data.docs !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.docs));
                  const current = getLocal(STORAGE_KEYS.DOCS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.DOCS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.folders !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.folders));
                  const current = getLocal(STORAGE_KEYS.FOLDERS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.FOLDERS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.meetings !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.meetings));
                  const current = getLocal(STORAGE_KEYS.MEETINGS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.MEETINGS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.contentPosts !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.contentPosts));
                  const current = getLocal(STORAGE_KEYS.CONTENT_POSTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.CONTENT_POSTS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.activity !== undefined) {
                  const normalized = normalizeArray(data.activity);
                  const current = getLocal(STORAGE_KEYS.ACTIVITY, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.ACTIVITY, normalized);
                      hasChanges = true;
                  }
              }
              // Статусы и приоритеты - не используем smartMerge, так как это справочники
              if (data.statuses) {
                  const normalized = normalizeArray(data.statuses);
                  const current = getLocal(STORAGE_KEYS.STATUSES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.STATUSES, normalized);
                      hasChanges = true;
                  }
              }
              if (data.priorities) {
                  const normalized = normalizeArray(data.priorities);
                  const current = getLocal(STORAGE_KEYS.PRIORITIES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.PRIORITIES, normalized);
                      hasChanges = true;
                  }
              }
              
              // CRM & Finance
              if (data.clients !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.clients));
                  const current = getLocal(STORAGE_KEYS.CLIENTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.CLIENTS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.contracts !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.contracts));
                  const current = getLocal(STORAGE_KEYS.CONTRACTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.CONTRACTS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.oneTimeDeals !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.oneTimeDeals));
                  const current = getLocal(STORAGE_KEYS.ONE_TIME_DEALS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.ONE_TIME_DEALS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.accountsReceivable !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.accountsReceivable));
                  const current = getLocal(STORAGE_KEYS.ACCOUNTS_RECEIVABLE, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.ACCOUNTS_RECEIVABLE, normalized);
                      hasChanges = true;
                  }
              }
              if (data.employeeInfos !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.employeeInfos));
                  const current = getLocal(STORAGE_KEYS.EMPLOYEE_INFOS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.EMPLOYEE_INFOS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.deals !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.deals));
                  const current = getLocal(STORAGE_KEYS.DEALS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.DEALS, normalized);
                      hasChanges = true;
                  }
              }
              
              if (data.notificationPrefs) {
                  const current = getLocal(STORAGE_KEYS.NOTIFICATION_PREFS, DEFAULT_NOTIFICATION_PREFS);
                  if (JSON.stringify(data.notificationPrefs) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.NOTIFICATION_PREFS, data.notificationPrefs);
                      hasChanges = true;
                  }
              }
              
              // Finance
              if (data.departments !== undefined) {
                  const normalized = normalizeArray(data.departments);
                  const current = getLocal(STORAGE_KEYS.DEPARTMENTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.DEPARTMENTS, normalized);
                      hasChanges = true;
                  }
              }

              // Inventory
              if (data.warehouses !== undefined) {
                  const normalized = normalizeArray(data.warehouses);
                  const current = getLocal(STORAGE_KEYS.WAREHOUSES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.WAREHOUSES, normalized);
                      hasChanges = true;
                  }
              }
              if (data.inventoryItems !== undefined) {
                  const normalized = normalizeArray(data.inventoryItems);
                  const current = getLocal(STORAGE_KEYS.INVENTORY_ITEMS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.INVENTORY_ITEMS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.stockMovements !== undefined) {
                  const normalized = normalizeArray(data.stockMovements);
                  const current = getLocal(STORAGE_KEYS.STOCK_MOVEMENTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.STOCK_MOVEMENTS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.salesFunnels !== undefined) {
                  const normalized = filterArchived(normalizeArray(data.salesFunnels));
                  const current = filterArchived(getLocal(STORAGE_KEYS.SALES_FUNNELS, []));
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.SALES_FUNNELS, normalized);
                      hasChanges = true;
                  }
              }
              // Справочники - не используем smartMerge
              if (data.financeCategories) {
                  const normalized = normalizeArray(data.financeCategories);
                  const current = getLocal(STORAGE_KEYS.FINANCE_CATEGORIES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.FINANCE_CATEGORIES, normalized);
                      hasChanges = true;
                  }
              }
              if (data.financePlan) {
                  const current = getLocal(STORAGE_KEYS.FINANCE_PLAN, null);
                  if (JSON.stringify(data.financePlan) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.FINANCE_PLAN, data.financePlan);
                      hasChanges = true;
                  }
              }
              if (data.purchaseRequests !== undefined) {
                  const normalized = normalizeArray(data.purchaseRequests);
                  const current = getLocal(STORAGE_KEYS.PURCHASE_REQUESTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.PURCHASE_REQUESTS, normalized);
                      hasChanges = true;
                  }
              }
              // BPM
              if (data.orgPositions !== undefined) {
                  const normalized = normalizeArray(data.orgPositions);
                  const current = getLocal(STORAGE_KEYS.ORG_POSITIONS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.ORG_POSITIONS, normalized);
                      hasChanges = true;
                  }
              }
              if (data.businessProcesses !== undefined) {
                  const normalized = normalizeArray(data.businessProcesses);
                  const current = getLocal(STORAGE_KEYS.BUSINESS_PROCESSES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.BUSINESS_PROCESSES, normalized);
                      hasChanges = true;
                  }
              }
              // Automation
              if (data.automationRules !== undefined) {
                  const normalized = normalizeArray(data.automationRules);
                  const current = getLocal(STORAGE_KEYS.AUTOMATION_RULES, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.AUTOMATION_RULES, normalized);
                      hasChanges = true;
                  }
              }
              
              // Financial Plan Documents
              if (data.financialPlanDocuments !== undefined) {
                  const normalized = normalizeArray(data.financialPlanDocuments);
                  const current = getLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, normalized);
                      hasChanges = true;
                  }
              }
              
              // Financial Plannings
              if (data.financialPlannings !== undefined) {
                  const normalized = normalizeArray(data.financialPlannings);
                  const current = getLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, []);
                  if (JSON.stringify(normalized) !== JSON.stringify(current)) {
                      setLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, normalized);
                      hasChanges = true;
                  }
              }
              
              return hasChanges;
          }
      } catch (e) {
          // Cloud Load Error
      }
      return false;
  },

  saveToCloud: async () => {
      // Фильтруем архивные элементы перед сохранением в Firebase
      // Архивные элементы НЕ сохраняются в Firebase - они удаляются навсегда
      const filterArchived = <T extends { isArchived?: boolean }>(items: T[]): T[] => {
          return items.filter(item => !item.isArchived);
      };
      
      // Получаем актуальные данные из localStorage
      // batch.set() с merge: false полностью перезаписывает документ,
      // что гарантирует, что все поля из локальных данных сохранятся в Firebase
      // Это обновит старые записи в Firebase, добавив им все новые поля
      const fullState = {
          users: filterArchived(getLocal(STORAGE_KEYS.USERS, [])),
          tasks: filterArchived(getLocal(STORAGE_KEYS.TASKS, [])),
          projects: filterArchived(getLocal(STORAGE_KEYS.PROJECTS, [])),
          tables: getLocal(STORAGE_KEYS.TABLES, []), // Таблицы не имеют isArchived
          docs: filterArchived(getLocal(STORAGE_KEYS.DOCS, [])),
          folders: filterArchived(getLocal(STORAGE_KEYS.FOLDERS, [])),
          meetings: filterArchived(getLocal(STORAGE_KEYS.MEETINGS, [])),
          contentPosts: filterArchived(getLocal(STORAGE_KEYS.CONTENT_POSTS, [])),
          activity: getLocal(STORAGE_KEYS.ACTIVITY, []), // Логи не имеют isArchived
          statuses: getLocal(STORAGE_KEYS.STATUSES, DEFAULT_STATUSES),
          priorities: getLocal(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES),
          clients: filterArchived(getLocal(STORAGE_KEYS.CLIENTS, [])),
          contracts: filterArchived(getLocal(STORAGE_KEYS.CONTRACTS, [])),
          oneTimeDeals: filterArchived(getLocal(STORAGE_KEYS.ONE_TIME_DEALS, [])),
          accountsReceivable: filterArchived(getLocal(STORAGE_KEYS.ACCOUNTS_RECEIVABLE, [])),
          employeeInfos: filterArchived(getLocal(STORAGE_KEYS.EMPLOYEE_INFOS, [])),
          deals: filterArchived(getLocal(STORAGE_KEYS.DEALS, [])),
          notificationPrefs: getLocal(STORAGE_KEYS.NOTIFICATION_PREFS, DEFAULT_NOTIFICATION_PREFS),
          // Finance
          departments: getLocal(STORAGE_KEYS.DEPARTMENTS, []), // Справочники не имеют isArchived
          financeCategories: getLocal(STORAGE_KEYS.FINANCE_CATEGORIES, DEFAULT_FINANCE_CATEGORIES),
          financePlan: getLocal(STORAGE_KEYS.FINANCE_PLAN, null),
          purchaseRequests: getLocal(STORAGE_KEYS.PURCHASE_REQUESTS, []), // Заявки не имеют isArchived
          financialPlanDocuments: getLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, []),
          financialPlannings: getLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, []),
          // BPM
          orgPositions: getLocal(STORAGE_KEYS.ORG_POSITIONS, []),
          businessProcesses: getLocal(STORAGE_KEYS.BUSINESS_PROCESSES, []),
          // Automation
          automationRules: getLocal(STORAGE_KEYS.AUTOMATION_RULES, []),
          // Inventory
          warehouses: getLocal(STORAGE_KEYS.WAREHOUSES, []),
          inventoryItems: getLocal(STORAGE_KEYS.INVENTORY_ITEMS, []),
          stockMovements: getLocal(STORAGE_KEYS.STOCK_MOVEMENTS, []),
          // Sales Funnels
          salesFunnels: filterArchived(getLocal(STORAGE_KEYS.SALES_FUNNELS, [])),
      };

      // Используем Firestore вместо Realtime Database
      isSaving = true; // Устанавливаем флаг, что идет сохранение
      try {
          await firestoreService.saveToCloud(fullState);
          lastSaveTime = Date.now(); // Отмечаем время последнего сохранения
      } finally {
          isSaving = false; // Снимаем флаг после завершения
      }
  },

  getUsers: (): User[] => {
      const users = getLocal(STORAGE_KEYS.USERS, []);
      // Удаляем дубликаты по логину (оставляем только последнего)
      const seen = new Map<string, User>();
      for (let i = users.length - 1; i >= 0; i--) {
          const user = users[i];
          if (user.login && !seen.has(user.login)) {
              seen.set(user.login, user);
          } else if (!user.login) {
              // Пользователи без логина добавляем по id
              if (!seen.has(user.id)) {
                  seen.set(user.id, user);
              }
          }
      }
      return Array.from(seen.values());
  }, // Пользователи загружаются только из Firebase
  getTasks: (): Task[] => getLocal(STORAGE_KEYS.TASKS, []),
  getProjects: (): Project[] => getLocal(STORAGE_KEYS.PROJECTS, MOCK_PROJECTS),
  getTables: (): TableCollection[] => getLocal(STORAGE_KEYS.TABLES, MOCK_TABLES),
  getDocs: (): Doc[] => getLocal(STORAGE_KEYS.DOCS, []),
  getFolders: (): Folder[] => getLocal(STORAGE_KEYS.FOLDERS, []),
  getMeetings: (): Meeting[] => getLocal(STORAGE_KEYS.MEETINGS, []),
  getContentPosts: (): ContentPost[] => getLocal(STORAGE_KEYS.CONTENT_POSTS, []),
  getActivities: (): ActivityLog[] => getLocal(STORAGE_KEYS.ACTIVITY, []),
  getStatuses: (): StatusOption[] => getLocal(STORAGE_KEYS.STATUSES, DEFAULT_STATUSES),
  getPriorities: (): PriorityOption[] => getLocal(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES),
  getClients: (): Client[] => getLocal(STORAGE_KEYS.CLIENTS, []),
  getContracts: (): Contract[] => getLocal(STORAGE_KEYS.CONTRACTS, []),
  getOneTimeDeals: (): OneTimeDeal[] => getLocal(STORAGE_KEYS.ONE_TIME_DEALS, []),
  getAccountsReceivable: (): AccountsReceivable[] => getLocal(STORAGE_KEYS.ACCOUNTS_RECEIVABLE, []),
  getEmployeeInfos: (): EmployeeInfo[] => getLocal(STORAGE_KEYS.EMPLOYEE_INFOS, []),
  getDeals: (): Deal[] => getLocal(STORAGE_KEYS.DEALS, []),
  getNotificationPrefs: (): NotificationPreferences => getLocal(STORAGE_KEYS.NOTIFICATION_PREFS, DEFAULT_NOTIFICATION_PREFS),
  
  // Finance Getters
  getDepartments: (): Department[] => getLocal(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS),
  getFinanceCategories: (): FinanceCategory[] => getLocal(STORAGE_KEYS.FINANCE_CATEGORIES, DEFAULT_FINANCE_CATEGORIES),
  getFinancePlan: (): FinancePlan | null => getLocal(STORAGE_KEYS.FINANCE_PLAN, { id: 'current', period: 'month', salesPlan: 0, currentIncome: 0 }),
  getPurchaseRequests: (): PurchaseRequest[] => getLocal(STORAGE_KEYS.PURCHASE_REQUESTS, []),
  getFinancialPlanDocuments: (): FinancialPlanDocument[] => getLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, []),
  getFinancialPlannings: (): FinancialPlanning[] => getLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, []),

  // BPM Getters
  getOrgPositions: (): OrgPosition[] => getLocal(STORAGE_KEYS.ORG_POSITIONS, MOCK_ORG_POSITIONS),
  getBusinessProcesses: (): BusinessProcess[] => getLocal(STORAGE_KEYS.BUSINESS_PROCESSES, []),

  // Automation
  getAutomationRules: (): AutomationRule[] => getLocal(STORAGE_KEYS.AUTOMATION_RULES, DEFAULT_AUTOMATION_RULES),

  setUsers: (users: User[]) => {
      // Удаляем дубликаты по логину перед сохранением
      const removeDuplicatesByLogin = (usersList: User[]): User[] => {
          const seen = new Map<string, User>();
          // Проходим в обратном порядке, чтобы оставить последнего
          for (let i = usersList.length - 1; i >= 0; i--) {
              const user = usersList[i];
              if (user.login && !seen.has(user.login)) {
                  seen.set(user.login, user);
              } else if (!user.login) {
                  // Пользователи без логина добавляем по id
                  if (!seen.has(user.id)) {
                      seen.set(user.id, user);
                  }
              }
          }
          return Array.from(seen.values());
      };
      const deduplicatedUsers = removeDuplicatesByLogin(users);
      setLocal(STORAGE_KEYS.USERS, deduplicatedUsers); 
      // Сохраняем в Firestore асинхронно, не блокируя UI
      storageService.saveToCloud().catch(err => console.error('Failed to save users to cloud:', err)); 
    setLocal(STORAGE_KEYS.USERS, users); 
    // Сохраняем в Firestore асинхронно, не блокируя UI
    storageService.saveToCloud().catch(err => console.error('Failed to save users to cloud:', err)); 
  },
  setTasks: (tasks: Task[]) => { 
    setLocal(STORAGE_KEYS.TASKS, tasks); 
    // Сохраняем в Firebase асинхронно
    storageService.saveToCloud().catch(err => console.error('Failed to save tasks to cloud:', err)); 
  },
  setProjects: (projects: Project[]) => { 
    setLocal(STORAGE_KEYS.PROJECTS, projects); 
    storageService.saveToCloud().catch(err => console.error('Failed to save projects to cloud:', err)); 
  },
  setTables: (tables: TableCollection[]) => { 
    setLocal(STORAGE_KEYS.TABLES, tables); 
    storageService.saveToCloud().catch(err => console.error('Failed to save tables to cloud:', err)); 
  },
  setDocs: (docs: Doc[]) => { 
    setLocal(STORAGE_KEYS.DOCS, docs); 
    storageService.saveToCloud().catch(err => console.error('Failed to save docs to cloud:', err)); 
  },
  setFolders: (folders: Folder[]) => { 
    setLocal(STORAGE_KEYS.FOLDERS, folders); 
    storageService.saveToCloud().catch(err => console.error('Failed to save folders to cloud:', err)); 
  },
  setMeetings: (meetings: Meeting[]) => { 
    setLocal(STORAGE_KEYS.MEETINGS, meetings); 
    storageService.saveToCloud().catch(err => console.error('Failed to save meetings to cloud:', err)); 
  },
  setContentPosts: (posts: ContentPost[]) => { 
    setLocal(STORAGE_KEYS.CONTENT_POSTS, posts); 
    storageService.saveToCloud().catch(err => console.error('Failed to save content posts to cloud:', err)); 
  },
  setActivities: (logs: ActivityLog[]) => { 
    setLocal(STORAGE_KEYS.ACTIVITY, logs); 
    storageService.saveToCloud().catch(err => console.error('Failed to save activities to cloud:', err)); 
  },
  setStatuses: (statuses: StatusOption[]) => { 
    setLocal(STORAGE_KEYS.STATUSES, statuses); 
    storageService.saveToCloud().catch(err => console.error('Failed to save statuses to cloud:', err)); 
  },
  setPriorities: (priorities: PriorityOption[]) => { 
    setLocal(STORAGE_KEYS.PRIORITIES, priorities); 
    storageService.saveToCloud().catch(err => console.error('Failed to save priorities to cloud:', err)); 
  },
  setClients: (clients: Client[]) => { 
    setLocal(STORAGE_KEYS.CLIENTS, clients); 
    storageService.saveToCloud().catch(err => console.error('Failed to save clients to cloud:', err)); 
  },
  setContracts: (contracts: Contract[]) => { 
    setLocal(STORAGE_KEYS.CONTRACTS, contracts); 
    storageService.saveToCloud().catch(err => console.error('Failed to save contracts to cloud:', err)); 
  },
  setOneTimeDeals: (deals: OneTimeDeal[]) => { 
    setLocal(STORAGE_KEYS.ONE_TIME_DEALS, deals); 
    storageService.saveToCloud().catch(err => console.error('Failed to save one-time deals to cloud:', err)); 
  },
  setAccountsReceivable: (receivables: AccountsReceivable[]) => { 
    setLocal(STORAGE_KEYS.ACCOUNTS_RECEIVABLE, receivables); 
    storageService.saveToCloud().catch(err => console.error('Failed to save accounts receivable to cloud:', err)); 
  },
  setEmployeeInfos: (infos: EmployeeInfo[]) => { 
    setLocal(STORAGE_KEYS.EMPLOYEE_INFOS, infos); 
    storageService.saveToCloud().catch(err => console.error('Failed to save employee infos to cloud:', err)); 
  },
  setDeals: (deals: Deal[]) => { 
    setLocal(STORAGE_KEYS.DEALS, deals); 
    storageService.saveToCloud().catch(err => console.error('Failed to save deals to cloud:', err)); 
  },
  setNotificationPrefs: (prefs: NotificationPreferences) => { setLocal(STORAGE_KEYS.NOTIFICATION_PREFS, prefs); storageService.saveToCloud(); },
  
  // Finance Setters
  setDepartments: (deps: Department[]) => { setLocal(STORAGE_KEYS.DEPARTMENTS, deps); storageService.saveToCloud(); },
  setFinanceCategories: (cats: FinanceCategory[]) => { setLocal(STORAGE_KEYS.FINANCE_CATEGORIES, cats); storageService.saveToCloud(); },
  setFinancePlan: (plan: FinancePlan) => { setLocal(STORAGE_KEYS.FINANCE_PLAN, plan); storageService.saveToCloud(); },
  setPurchaseRequests: (reqs: PurchaseRequest[]) => { setLocal(STORAGE_KEYS.PURCHASE_REQUESTS, reqs); storageService.saveToCloud(); },
  setFinancialPlanDocuments: (docs: FinancialPlanDocument[]) => { setLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, docs); storageService.saveToCloud(); },
  setFinancialPlannings: (plannings: FinancialPlanning[]) => { setLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, plannings); storageService.saveToCloud(); },

  // BPM Setters
  setOrgPositions: (ops: OrgPosition[]) => { setLocal(STORAGE_KEYS.ORG_POSITIONS, ops); storageService.saveToCloud(); },
  setBusinessProcesses: (bps: BusinessProcess[]) => { setLocal(STORAGE_KEYS.BUSINESS_PROCESSES, bps); storageService.saveToCloud(); },

  // Automation Setters
  setAutomationRules: (rules: AutomationRule[]) => { setLocal(STORAGE_KEYS.AUTOMATION_RULES, rules); storageService.saveToCloud(); },

  addActivity: (log: ActivityLog) => {
      const logs = getLocal<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, []);
      const newLogs = [log, ...logs].slice(0, 100); 
      setLocal(STORAGE_KEYS.ACTIVITY, newLogs);
      storageService.saveToCloud();
      return newLogs;
  },
};
