
import { storageService } from "../../services/storageService";
import { ActivityLog, StatusOption, PriorityOption, TableCollection, NotificationPreferences, AutomationRule } from "../../types";

export const tablesEndpoint = {
  getAll: () => storageService.getTables(),
  updateAll: (tables: TableCollection[]) => storageService.setTables(tables),
};

export const activityEndpoint = {
  getAll: () => storageService.getActivities(),
  updateAll: (logs: ActivityLog[]) => storageService.setActivities(logs),
  add: (log: ActivityLog) => storageService.addActivity(log),
};

export const statusesEndpoint = {
  getAll: () => storageService.getStatuses(),
  updateAll: (s: StatusOption[]) => storageService.setStatuses(s),
};

export const prioritiesEndpoint = {
  getAll: () => storageService.getPriorities(),
  updateAll: (p: PriorityOption[]) => storageService.setPriorities(p),
};

export const notificationPrefsEndpoint = {
    get: () => storageService.getNotificationPrefs(),
    update: (prefs: NotificationPreferences) => storageService.setNotificationPrefs(prefs),
};

export const automationEndpoint = {
    getRules: () => storageService.getAutomationRules(),
    updateRules: (rules: AutomationRule[]) => storageService.setAutomationRules(rules),
};
