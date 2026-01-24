/**
 * Централизованный сервис для отправки уведомлений
 * Объединяет логику создания activity logs и отправки Telegram уведомлений
 */

import { User, NotificationPreferences, Task, Deal, Client, Contract, Doc, Meeting, Role } from '../types';
import { sendTelegramNotification, getUserTelegramChatId } from './telegramService';
import {
  createTaskCreatedLog,
  createTaskStatusChangedLog,
  createDealCreatedLog,
  createDealStatusChangedLog,
  createClientCreatedLog,
  createContractCreatedLog,
  createDocCreatedLog,
  createMeetingCreatedLog,
  createPurchaseRequestCreatedLog,
} from '../utils/activityLogUtils';
import {
  formatNewTaskMessage,
  formatStatusChangeMessage,
  formatDealMessage,
  formatDealStatusChangeMessage,
  formatClientMessage,
  formatContractMessage,
  formatDocumentMessage,
  formatMeetingMessage,
  formatPurchaseRequestMessage,
} from './telegramService';

export interface NotificationContext {
  currentUser: User;
  allUsers: User[];
  notificationPrefs?: NotificationPreferences;
}

/**
 * Базовый интерфейс для уведомлений
 */
interface BaseNotificationOptions {
  context: NotificationContext;
  skipActivityLog?: boolean;
  skipTelegram?: boolean;
}

/**
 * Отправляет уведомление о создании задачи
 */
export const notifyTaskCreated = async (
  task: Task,
  assigneeUser: User | null,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createTaskCreatedLog(task, currentUser, assigneeUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.newTask) {
      const assigneeName = assigneeUser ? assigneeUser.name : 'Не назначено';
      
      // Отправляем уведомление исполнителю (если назначен)
      if (assigneeUser) {
        const assigneeTelegramChatId = getUserTelegramChatId(assigneeUser);
        if (assigneeTelegramChatId) {
          await sendTelegramNotification(
            formatNewTaskMessage(task.title, task.priority, task.endDate, assigneeName, null),
            undefined,
            notificationPrefs.newTask,
            assigneeTelegramChatId,
            notificationPrefs.telegramGroupChatId
          );
        } else {
          console.warn('[NOTIFICATION] Assignee has no telegramUserId:', assigneeUser.id);
        }
      }
      
      // Также отправляем уведомление создателю, если он не является исполнителем
      const creatorId = task.createdByUserId || currentUser?.id;
      if (creatorId && (!assigneeUser || assigneeUser.id !== creatorId)) {
        const creatorUser = allUsers.find(u => u.id === creatorId);
        if (creatorUser) {
          const creatorTelegramChatId = getUserTelegramChatId(creatorUser);
          if (creatorTelegramChatId) {
            await sendTelegramNotification(
              formatNewTaskMessage(task.title, task.priority, task.endDate, assigneeName, null),
              undefined,
              notificationPrefs.newTask,
              creatorTelegramChatId,
              notificationPrefs.telegramGroupChatId
            );
          } else {
            console.warn('[NOTIFICATION] Creator has no telegramUserId:', creatorId);
          }
        }
      }
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying task created:', error);
  }
};

/**
 * Отправляет уведомление об изменении статуса задачи
 */
export const notifyTaskStatusChanged = async (
  task: Task,
  oldStatus: string,
  newStatus: string,
  assigneeUser: User | null,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createTaskStatusChangedLog(task, oldStatus, newStatus, currentUser, assigneeUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.statusChange) {
      const userTelegramChatId = getUserTelegramChatId(assigneeUser);
      await sendTelegramNotification(
        formatStatusChangeMessage(task.title, oldStatus, newStatus, currentUser.name),
        undefined,
        notificationPrefs.statusChange,
        userTelegramChatId,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying task status changed:', error);
  }
};

/**
 * Отправляет уведомление о создании сделки
 */
export const notifyDealCreated = async (
  deal: Deal,
  assigneeUser: User | null,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createDealCreatedLog(deal, currentUser, assigneeUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.dealCreated) {
      const userTelegramChatId = getUserTelegramChatId(assigneeUser);
      await sendTelegramNotification(
        formatDealMessage(deal.title, deal.stage, deal.amount, assigneeUser?.name || 'Не назначено'),
        undefined,
        notificationPrefs.dealCreated,
        userTelegramChatId,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying deal created:', error);
  }
};

/**
 * Отправляет уведомление об изменении статуса сделки
 */
export const notifyDealStatusChanged = async (
  deal: Deal,
  oldStage: string,
  newStage: string,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createDealStatusChangedLog(deal, oldStage, newStage, currentUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.dealStatusChanged) {
      await sendTelegramNotification(
        formatDealStatusChangeMessage(deal.title, oldStage, newStage, currentUser.name),
        undefined,
        notificationPrefs.dealStatusChanged,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying deal status changed:', error);
  }
};

/**
 * Отправляет уведомление о создании клиента
 */
export const notifyClientCreated = async (
  client: Client,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createClientCreatedLog(client, currentUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.clientCreated) {
      await sendTelegramNotification(
        formatClientMessage(client.name, currentUser.name),
        undefined,
        notificationPrefs.clientCreated,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying client created:', error);
  }
};

/**
 * Отправляет уведомление о создании договора
 */
export const notifyContractCreated = async (
  contract: Contract,
  clientName: string,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createContractCreatedLog(contract, currentUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.contractCreated) {
      await sendTelegramNotification(
        formatContractMessage(contract.number || 'Без номера', clientName, contract.amount, currentUser.name),
        undefined,
        notificationPrefs.contractCreated,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying contract created:', error);
  }
};

/**
 * Отправляет уведомление о создании документа
 */
export const notifyDocCreated = async (
  doc: Doc,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createDocCreatedLog(doc, currentUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.docCreated) {
      await sendTelegramNotification(
        formatDocumentMessage(doc.title, currentUser.name),
        undefined,
        notificationPrefs.docCreated,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying doc created:', error);
  }
};

/**
 * Отправляет уведомление о создании встречи
 */
export const notifyMeetingCreated = async (
  meeting: Meeting,
  participantIds: string[],
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createMeetingCreatedLog(meeting, currentUser, participantIds, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.meetingCreated) {
      await sendTelegramNotification(
        formatMeetingMessage(meeting.title, meeting.date, meeting.time, currentUser.name),
        undefined,
        notificationPrefs.meetingCreated,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying meeting created:', error);
  }
};

/**
 * Отправляет уведомление о создании заявки на покупку
 */
export const notifyPurchaseRequestCreated = async (
  request: { id: string; title?: string; description?: string; amount?: number },
  departmentName: string,
  options: BaseNotificationOptions
): Promise<void> => {
  const { context, skipActivityLog, skipTelegram } = options;
  const { currentUser, allUsers, notificationPrefs } = context;

  try {
    // Activity log - всегда создается (если не пропущен)
    if (!skipActivityLog) {
      await createPurchaseRequestCreatedLog(request, currentUser, allUsers);
    }

    // Telegram уведомление
    if (!skipTelegram && notificationPrefs?.purchaseRequestCreated) {
      await sendTelegramNotification(
        formatPurchaseRequestMessage(
          request.title || request.description || 'Заявка',
          request.amount || 0,
          departmentName,
          currentUser.name
        ),
        undefined,
        notificationPrefs.purchaseRequestCreated,
        undefined,
        notificationPrefs.telegramGroupChatId
      );
    }
  } catch (error) {
    console.error('[NOTIFICATION] Error notifying purchase request created:', error);
  }
};
