
import { storageService } from "../services/storageService";
import { authEndpoint } from "./endpoints/auth.endpoint";
import { tasksEndpoint, projectsEndpoint } from "./endpoints/tasks.endpoint";
import { clientsEndpoint, contractsEndpoint, employeesEndpoint, dealsEndpoint } from "./endpoints/crm.endpoint";
import { docsEndpoint, foldersEndpoint, meetingsEndpoint, contentPostsEndpoint } from "./endpoints/content.endpoint";
import { tablesEndpoint, activityEndpoint, statusesEndpoint, prioritiesEndpoint, notificationPrefsEndpoint, automationEndpoint } from "./endpoints/settings.endpoint";
import { departmentsEndpoint, financeEndpoint } from "./endpoints/finance.endpoint";
import { bpmEndpoint } from "./endpoints/bpm.endpoint";
import { inventoryEndpoint } from "./endpoints/inventory.endpoint";

// The Unified "Backend" Interface
export const api = {
  sync: async (force: boolean = false) => await storageService.loadFromCloud(force),
  
  users: authEndpoint,
  
  tasks: tasksEndpoint,
  projects: projectsEndpoint,
  
  tables: tablesEndpoint,
  activity: activityEndpoint,
  statuses: statusesEndpoint,
  priorities: prioritiesEndpoint,
  notificationPrefs: notificationPrefsEndpoint,
  automation: automationEndpoint,
  
  clients: clientsEndpoint,
  contracts: contractsEndpoint,
  oneTimeDeals: oneTimeDealsEndpoint,
  accountsReceivable: accountsReceivableEndpoint,
  employees: employeesEndpoint,
  deals: dealsEndpoint,
  
  docs: docsEndpoint,
  folders: foldersEndpoint,
  meetings: meetingsEndpoint,
  contentPosts: contentPostsEndpoint,

  departments: departmentsEndpoint,
  finance: financeEndpoint,
  bpm: bpmEndpoint,
  inventory: inventoryEndpoint,
};
