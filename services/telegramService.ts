
import { TELEGRAM_CHAT_ID } from "../constants";
import { TelegramButtonConfig, Deal, Comment } from "../types";
import { storageService } from "./storageService";

// --- EMPLOYEE BOT (Notifications, Automation) ---

export const sendTelegramNotification = async (message: string, buttons?: TelegramButtonConfig[]) => {
  // Use Employee Bot Token
  const botToken = storageService.getEmployeeBotToken();
  const chatId = TELEGRAM_CHAT_ID;
  if (!chatId || !botToken) return false;

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
                  text: btn.label,
                  callback_data: `${btn.action}:${btn.value}` 
              }))
          ]
      };
  }

  try {
    await fetch(telegramUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    return true;
  } catch (error) {
    console.warn('[TELEGRAM EMPLOYEE] Send failed', error);
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
