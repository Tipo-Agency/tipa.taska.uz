
import { TelegramButtonConfig, Deal, Comment } from "../types";
import { storageService } from "./storageService";

// --- EMPLOYEE BOT (Notifications, Automation) ---

export const sendTelegramNotification = async (message: string, buttons?: TelegramButtonConfig[]) => {
  // Use Employee Bot Token
  const botToken = storageService.getEmployeeBotToken();
  const chatId = storageService.getTelegramChatId();
  
  if (!chatId || !botToken) {
    console.warn('[TELEGRAM] Не настроен bot token или chat ID:', { 
      hasToken: !!botToken, 
      hasChatId: !!chatId 
    });
    return false;
  }

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const body: any = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
  };

  if (buttons && buttons.length > 0) {
      body.reply_markup = {
          inline_keyboard: [
              buttons.map(btn => ({
                  text: btn.text,
                  callback_data: btn.callbackData || `${btn.action}:${btn.url || ''}` 
              }))
          ]
      };
  }

  try {
    const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TELEGRAM EMPLOYEE] Send failed:', result.description || result);
      return false;
    }
    
    console.log('[TELEGRAM EMPLOYEE] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[TELEGRAM EMPLOYEE] Send failed', error);
    return false;
  }
};

// --- CLIENT BOT (Leads, Chat) ---

export const sendClientMessage = async (chatId: string, text: string) => {
    // Use Client Bot Token
    const botToken = storageService.getClientBotToken();
    if (!chatId || !botToken) return false;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: chatId, text: text })
        });
        return true;
    } catch (error) {
        console.warn('[TELEGRAM CLIENT] Send failed', error);
        return false;
    }
};

export const pollTelegramUpdates = async (): Promise<{ newDeals: Deal[], newMessages: { dealId: string, text: string, username: string }[] }> => {
    const result = { newDeals: [] as Deal[], newMessages: [] as any[] };
    
    // Use Client Bot Token
    const botToken = storageService.getClientBotToken();
    if (!botToken) return result;

    try {
        const offset = storageService.getLastTelegramUpdateId() + 1;
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&limit=20`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            let lastUpdateId = offset - 1;
            const existingDeals = storageService.getDeals(); // Get current deals to check existence

            for (const update of data.result) {
                lastUpdateId = update.update_id;
                
                if (update.message && update.message.chat.type === 'private') {
                    const text = update.message.text || '[Вложение]';
                    const chatId = String(update.message.chat.id);
                    const username = update.message.from.username ? `@${update.message.from.username}` : update.message.from.first_name;
                    
                    // Check if deal exists
                    const existingDeal = existingDeals.find(d => d.telegramChatId === chatId);

                    if (existingDeal) {
                        // It's a new message for an existing deal
                        result.newMessages.push({
                            dealId: existingDeal.id,
                            text: text,
                            username: username
                        });
                    } else {
                        // It's a new lead
                        const deal: Deal = {
                            id: `lead-tg-${update.update_id}`,
                            title: `Лид: ${username}`,
                            contactName: username,
                            amount: 0,
                            currency: 'UZS',
                            stage: 'new',
                            source: 'telegram',
                            telegramChatId: chatId,
                            telegramUsername: username,
                            assigneeId: '', // Unassigned
                            createdAt: new Date().toISOString(),
                            notes: text,
                            comments: [{
                                id: `cm-${Date.now()}`,
                                text: text,
                                authorId: 'telegram_user',
                                createdAt: new Date().toISOString(),
                                type: 'telegram_in'
                            }]
                        };
                        result.newDeals.push(deal);
                    }
                }
            }

            storageService.setLastTelegramUpdateId(lastUpdateId);
        }
    } catch (e) {
        console.error('[TELEGRAM POLLING] Error:', e);
    }
    return result;
};

export const formatStatusChangeMessage = (taskTitle: string, oldStatus: string, newStatus: string, user: string) => {
  return `🔔 <b>Обновление статуса</b>\n\n👤 <b>Сотрудник:</b> ${user}\n📝 <b>Задача:</b> ${taskTitle}\n🔄 <b>Статус:</b> ${oldStatus} ➡️ ${newStatus}`;
};

export const formatNewTaskMessage = (taskTitle: string, priority: string, endDate: string, assignee: string, project: string | null) => {
    return `🆕 <b>Новая задача</b>\n\n👤 <b>Ответственный:</b> ${assignee}\n📝 <b>Задача:</b> ${taskTitle}\n📂 <b>Модуль:</b> ${project || 'Без модуля'}\n⚡ <b>Приоритет:</b> ${priority}\n📅 <b>Срок:</b> ${endDate}`;
};

export const formatDealMessage = (dealTitle: string, stage: string, amount: number, assignee: string) => {
    return `💼 <b>Новая сделка</b>\n\n<b>Название:</b> ${dealTitle}\n<b>Стадия:</b> ${stage}\n<b>Сумма:</b> ${amount.toLocaleString()} UZS\n<b>Ответственный:</b> ${assignee}`;
};

export const formatDealStatusChangeMessage = (dealTitle: string, oldStage: string, newStage: string, user: string) => {
    return `🔄 <b>Изменена стадия сделки</b>\n\n<b>Сделка:</b> ${dealTitle}\n<b>Было:</b> ${oldStage}\n<b>Стало:</b> ${newStage}\n<b>Изменил:</b> ${user}`;
};

export const formatClientMessage = (clientName: string, user: string) => {
    return `👤 <b>Новый клиент</b>\n\n<b>Клиент:</b> ${clientName}\n<b>Добавил:</b> ${user}`;
};

export const formatContractMessage = (contractNumber: string, clientName: string, amount: number, user: string) => {
    return `📄 <b>Новый договор</b>\n\n<b>Номер:</b> ${contractNumber}\n<b>Клиент:</b> ${clientName}\n<b>Сумма:</b> ${amount.toLocaleString()} UZS\n<b>Добавил:</b> ${user}`;
};

export const formatPurchaseRequestMessage = (requestTitle: string, amount: number, department: string, user: string) => {
    return `💰 <b>Новая заявка на покупку</b>\n\n<b>Название:</b> ${requestTitle}\n<b>Сумма:</b> ${amount.toLocaleString()} UZS\n<b>Отдел:</b> ${department}\n<b>Создал:</b> ${user}`;
};

export const formatDocumentMessage = (docTitle: string, user: string) => {
    return `📑 <b>Новый документ</b>\n\n<b>Название:</b> ${docTitle}\n<b>Добавил:</b> ${user}`;
};

export const formatMeetingMessage = (meetingTitle: string, date: string, time: string, user: string) => {
    return `📅 <b>Новая встреча</b>\n\n<b>Название:</b> ${meetingTitle}\n<b>Дата:</b> ${new Date(date).toLocaleDateString('ru-RU')}\n<b>Время:</b> ${time}\n<b>Создал:</b> ${user}`;
};
