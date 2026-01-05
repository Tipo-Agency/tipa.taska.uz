import { firestoreService } from "../../services/firestoreService";
import { ActivityLog, StatusOption, PriorityOption, TableCollection, NotificationPreferences, AutomationRule } from "../../types";
import { DEFAULT_NOTIFICATION_PREFS } from "../../constants";

const TABLES_COLLECTION = 'tables';
const ACTIVITY_COLLECTION = 'activity';
const STATUSES_COLLECTION = 'statuses';
const PRIORITIES_COLLECTION = 'priorities';
const NOTIFICATION_PREFS_COLLECTION = 'notificationPrefs';
const AUTOMATION_RULES_COLLECTION = 'automationRules';

export const tablesEndpoint = {
    getAll: async (): Promise<TableCollection[]> => {
        return await firestoreService.getAll(TABLES_COLLECTION) as TableCollection[];
    },
    updateAll: async (tables: TableCollection[]) => {
        await Promise.all(tables.map(table => firestoreService.save(TABLES_COLLECTION, table)));
    },
};

export const activityEndpoint = {
    getAll: async (): Promise<ActivityLog[]> => {
        return await firestoreService.getAll(ACTIVITY_COLLECTION) as ActivityLog[];
    },
    updateAll: async (logs: ActivityLog[]) => {
        await Promise.all(logs.map(log => firestoreService.save(ACTIVITY_COLLECTION, log)));
    },
    add: async (log: ActivityLog) => {
        await firestoreService.save(ACTIVITY_COLLECTION, log);
    },
};

export const statusesEndpoint = {
    getAll: async (): Promise<StatusOption[]> => {
        return await firestoreService.getAll(STATUSES_COLLECTION) as StatusOption[];
    },
    updateAll: async (statuses: StatusOption[]) => {
        await Promise.all(statuses.map(status => firestoreService.save(STATUSES_COLLECTION, status)));
    },
};

export const prioritiesEndpoint = {
    getAll: async (): Promise<PriorityOption[]> => {
        return await firestoreService.getAll(PRIORITIES_COLLECTION) as PriorityOption[];
    },
    updateAll: async (priorities: PriorityOption[]) => {
        await Promise.all(priorities.map(priority => firestoreService.save(PRIORITIES_COLLECTION, priority)));
    },
};

export const notificationPrefsEndpoint = {
    get: async (): Promise<NotificationPreferences> => {
        const items = await firestoreService.getAll(NOTIFICATION_PREFS_COLLECTION);
        return (items[0] as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFS;
    },
    update: async (prefs: NotificationPreferences) => {
        const existing = await firestoreService.getAll(NOTIFICATION_PREFS_COLLECTION);
        if (existing.length > 0) {
            await firestoreService.save(NOTIFICATION_PREFS_COLLECTION, { ...prefs, id: existing[0].id });
        } else {
            await firestoreService.save(NOTIFICATION_PREFS_COLLECTION, { ...prefs, id: 'default' });
        }
    },
};

export const automationEndpoint = {
    getRules: async (): Promise<AutomationRule[]> => {
        return await firestoreService.getAll(AUTOMATION_RULES_COLLECTION) as AutomationRule[];
    },
    updateRules: async (rules: AutomationRule[]) => {
        await Promise.all(rules.map(rule => firestoreService.save(AUTOMATION_RULES_COLLECTION, rule)));
    },
};
