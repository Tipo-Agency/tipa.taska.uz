
import { Doc, Project, Role, TableCollection, Task, User, Meeting, ActivityLog, StatusOption, PriorityOption, ContentPost, Client, EmployeeInfo, Contract, Folder, Deal, NotificationPreferences, Department, FinanceCategory, FinancePlan, PurchaseRequest, OrgPosition, BusinessProcess, AutomationRule, Warehouse, InventoryItem, StockMovement } from "../types";
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
              
              // Функция для умного слияния с приоритетом облачных данных
              // При первой загрузке (force=true) - приоритет облаку
              // При обычной синхронизации - приоритет более свежим данным
              const smartMergeByTimestamp = <T extends { id: string; updatedAt?: string; createdAt?: string }>(
                  cloudData: T[], 
                  localData: T[],
                  force: boolean = false
              ): { merged: T[], hasChanges: boolean } => {
                  const localMap = new Map(localData.map(item => [item.id, item]));
                  const cloudMap = new Map(cloudData.map(item => [item.id, item]));
                  const merged: T[] = [];
                  let hasChanges = false;
                  
                  // Собираем все уникальные ID
                  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
                  
                  allIds.forEach(id => {
                      const localItem = localMap.get(id);
                      const cloudItem = cloudMap.get(id);
                      
                      if (localItem && cloudItem) {
                          // Оба существуют - сравниваем по updatedAt или createdAt
                          const localTime = localItem.updatedAt 
                              ? new Date(localItem.updatedAt).getTime() 
                              : (localItem.createdAt ? new Date(localItem.createdAt).getTime() : 0);
                          const cloudTime = cloudItem.updatedAt 
                              ? new Date(cloudItem.updatedAt).getTime() 
                              : (cloudItem.createdAt ? new Date(cloudItem.createdAt).getTime() : 0);
                          
                          if (force) {
                              // При первой загрузке - приоритет облаку (источник истины)
                              // Но только если действительно есть различия
                              const localStr = JSON.stringify(localItem);
                              const cloudStr = JSON.stringify(cloudItem);
                              if (localStr !== cloudStr) {
                                  merged.push(cloudItem);
                                  hasChanges = true;
                              } else {
                                  // Данные идентичны - оставляем локальную версию (не меняем)
                                  merged.push(localItem);
                              }
                          } else if (cloudTime > localTime && cloudTime > 0 && (cloudTime - localTime) > 1000) {
                              // Облачная версия новее (разница больше 1 секунды, чтобы избежать конфликтов)
                              merged.push(cloudItem);
                              hasChanges = true;
                          } else if (localTime > cloudTime && localTime > 0 && (localTime - cloudTime) > 1000) {
                              // Локальная версия новее (разница больше 1 секунды)
                              merged.push(localItem);
                          } else {
                              // Равны или разница меньше 1 секунды - оставляем локальную (не меняем без необходимости)
                              merged.push(localItem);
                          }
                      } else if (localItem) {
                          // Только локальная версия - добавляем всегда (новые данные)
                          merged.push(localItem);
                      } else if (cloudItem) {
                          // Только облачная версия - добавляем
                          merged.push(cloudItem);
                          hasChanges = true;
                      }
                  });
                  
                  return { merged, hasChanges };
              };
              
              // Проверяем изменения в задачах (самое важное для синхронизации статусов)
              if (data.tasks) {
                  const normalizedTasks = normalizeArray(data.tasks);
                  const currentTasks = getLocal(STORAGE_KEYS.TASKS, []);
                  const { merged, hasChanges: tasksChanged } = smartMergeByTimestamp(normalizedTasks, currentTasks, force);
                  
                  // Обновляем только если действительно есть изменения
                  if (tasksChanged) {
                      setLocal(STORAGE_KEYS.TASKS, merged);
                      hasChanges = true;
                  }
              }
              
              
              if (data.users) {
                  const normalized = normalizeArray(data.users);
                  const current = getLocal(STORAGE_KEYS.USERS, []);
                  
                  // Удаляем дубликаты по логину (оставляем только последнего)
                  const removeDuplicatesByLogin = (users: User[]): User[] => {
                      const seen = new Map<string, User>();
                      // Проходим в обратном порядке, чтобы оставить последнего
                      for (let i = users.length - 1; i >= 0; i--) {
                          const user = users[i];
                          if (user.login && !seen.has(user.login)) {
                              seen.set(user.login, user);
                          }
                      }
                      return Array.from(seen.values());
                  };
                  
                  // Сначала удаляем дубликаты из текущих локальных данных
                  const deduplicatedCurrent = removeDuplicatesByLogin(current);
                  
                  // Используем умное слияние по timestamp
                  const { merged, hasChanges: usersChanged } = smartMergeByTimestamp(normalized, deduplicatedCurrent, force);
                  
                  if (usersChanged) {
                      // Еще раз удаляем дубликаты на всякий случай
                      const finalUsers = removeDuplicatesByLogin(merged);
                      setLocal(STORAGE_KEYS.USERS, finalUsers);
                      hasChanges = true;
                  }
              }
              if (data.projects) {
                  const normalized = normalizeArray(data.projects);
                  const current = getLocal(STORAGE_KEYS.PROJECTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.PROJECTS, merged);
                      hasChanges = true;
                  }
              }
              if (data.tables) {
                  const normalized = normalizeArray(data.tables);
                  const current = getLocal(STORAGE_KEYS.TABLES, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.TABLES, merged);
                      hasChanges = true;
                  }
              }
              if (data.docs) {
                  const normalized = normalizeArray(data.docs);
                  const current = getLocal(STORAGE_KEYS.DOCS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.DOCS, merged);
                      hasChanges = true;
                  }
              }
              if (data.folders) {
                  const normalized = normalizeArray(data.folders);
                  const current = getLocal(STORAGE_KEYS.FOLDERS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.FOLDERS, merged);
                      hasChanges = true;
                  }
              }
              if (data.meetings) {
                  const normalized = normalizeArray(data.meetings);
                  const current = getLocal(STORAGE_KEYS.MEETINGS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.MEETINGS, merged);
                      hasChanges = true;
                  }
              }
              if (data.contentPosts) {
                  const normalized = normalizeArray(data.contentPosts);
                  const current = getLocal(STORAGE_KEYS.CONTENT_POSTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.CONTENT_POSTS, merged);
                      hasChanges = true;
                  }
              }
              if (data.activity) {
                  const normalized = normalizeArray(data.activity);
                  const current = getLocal(STORAGE_KEYS.ACTIVITY, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.ACTIVITY, merged);
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
              if (data.clients) {
                  const normalized = normalizeArray(data.clients);
                  const current = getLocal(STORAGE_KEYS.CLIENTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.CLIENTS, merged);
                      hasChanges = true;
                  }
              }
              if (data.contracts) {
                  const normalized = normalizeArray(data.contracts);
                  const current = getLocal(STORAGE_KEYS.CONTRACTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.CONTRACTS, merged);
                      hasChanges = true;
                  }
              }
              if (data.employeeInfos) {
                  const normalized = normalizeArray(data.employeeInfos);
                  const current = getLocal(STORAGE_KEYS.EMPLOYEE_INFOS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.EMPLOYEE_INFOS, merged);
                      hasChanges = true;
                  }
              }
              if (data.deals) {
                  const normalized = normalizeArray(data.deals);
                  const current = getLocal(STORAGE_KEYS.DEALS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.DEALS, merged);
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
              if (data.departments) {
                  const normalized = normalizeArray(data.departments);
                  const current = getLocal(STORAGE_KEYS.DEPARTMENTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.DEPARTMENTS, merged);
                      hasChanges = true;
                  }
              }

              // Inventory
              if (data.warehouses) {
                  const normalized = normalizeArray(data.warehouses);
                  const current = getLocal(STORAGE_KEYS.WAREHOUSES, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.WAREHOUSES, merged);
                      hasChanges = true;
                  }
              }
              if (data.inventoryItems) {
                  const normalized = normalizeArray(data.inventoryItems);
                  const current = getLocal(STORAGE_KEYS.INVENTORY_ITEMS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.INVENTORY_ITEMS, merged);
                      hasChanges = true;
                  }
              }
              if (data.stockMovements) {
                  const normalized = normalizeArray(data.stockMovements);
                  const current = getLocal(STORAGE_KEYS.STOCK_MOVEMENTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.STOCK_MOVEMENTS, merged);
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
              if (data.purchaseRequests) {
                  const normalized = normalizeArray(data.purchaseRequests);
                  const current = getLocal(STORAGE_KEYS.PURCHASE_REQUESTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.PURCHASE_REQUESTS, merged);
                      hasChanges = true;
                  }
              }
              // BPM
              if (data.orgPositions) {
                  const normalized = normalizeArray(data.orgPositions);
                  const current = getLocal(STORAGE_KEYS.ORG_POSITIONS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.ORG_POSITIONS, merged);
                      hasChanges = true;
                  }
              }
              if (data.businessProcesses) {
                  const normalized = normalizeArray(data.businessProcesses);
                  const current = getLocal(STORAGE_KEYS.BUSINESS_PROCESSES, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.BUSINESS_PROCESSES, merged);
                      hasChanges = true;
                  }
              }
              // Automation
              if (data.automationRules) {
                  const normalized = normalizeArray(data.automationRules);
                  const current = getLocal(STORAGE_KEYS.AUTOMATION_RULES, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.AUTOMATION_RULES, merged);
                      hasChanges = true;
                  }
              }
              
              // Financial Plan Documents
              if (data.financialPlanDocuments) {
                  const normalized = normalizeArray(data.financialPlanDocuments);
                  const current = getLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.FINANCIAL_PLAN_DOCUMENTS, merged);
                      hasChanges = true;
                  }
              }
              
              // Financial Plannings
              if (data.financialPlannings) {
                  const normalized = normalizeArray(data.financialPlannings);
                  const current = getLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, []);
                  const { merged, hasChanges: changed } = smartMergeByTimestamp(normalized, current, force);
                  if (changed) {
                      setLocal(STORAGE_KEYS.FINANCIAL_PLANNINGS, merged);
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
      const fullState = {
          users: getLocal(STORAGE_KEYS.USERS, []),
          tasks: getLocal(STORAGE_KEYS.TASKS, []),
          projects: getLocal(STORAGE_KEYS.PROJECTS, []),
          tables: getLocal(STORAGE_KEYS.TABLES, []),
          docs: getLocal(STORAGE_KEYS.DOCS, []),
          folders: getLocal(STORAGE_KEYS.FOLDERS, []),
          meetings: getLocal(STORAGE_KEYS.MEETINGS, []),
          contentPosts: getLocal(STORAGE_KEYS.CONTENT_POSTS, []),
          activity: getLocal(STORAGE_KEYS.ACTIVITY, []),
          statuses: getLocal(STORAGE_KEYS.STATUSES, DEFAULT_STATUSES),
          priorities: getLocal(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES),
          clients: getLocal(STORAGE_KEYS.CLIENTS, []),
          contracts: getLocal(STORAGE_KEYS.CONTRACTS, []),
          employeeInfos: getLocal(STORAGE_KEYS.EMPLOYEE_INFOS, []),
          deals: getLocal(STORAGE_KEYS.DEALS, []),
          notificationPrefs: getLocal(STORAGE_KEYS.NOTIFICATION_PREFS, DEFAULT_NOTIFICATION_PREFS),
          // Finance
          departments: getLocal(STORAGE_KEYS.DEPARTMENTS, []),
          financeCategories: getLocal(STORAGE_KEYS.FINANCE_CATEGORIES, DEFAULT_FINANCE_CATEGORIES),
          financePlan: getLocal(STORAGE_KEYS.FINANCE_PLAN, null),
          purchaseRequests: getLocal(STORAGE_KEYS.PURCHASE_REQUESTS, []),
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
