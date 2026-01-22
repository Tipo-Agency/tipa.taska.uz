"""
Главный файл Telegram бота
"""
# ВАЖНО: Этот файл должен обновляться при каждом деплое!
# Если версия не меняется в логах - проверьте кэш Python и systemd service

import asyncio
import logging
import sys
import os
import subprocess
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    filters,
    ContextTypes
)
import config
from auth import authenticate_user, check_user_active, update_user_password, update_user_avatar
from firebase_client import firebase
from keyboards import (
    get_main_menu, get_tasks_menu, get_deals_menu, get_deal_menu, get_task_menu,
    get_settings_menu, get_profile_menu, get_statuses_keyboard, get_stages_keyboard,
    get_funnels_keyboard, get_clients_keyboard, get_users_keyboard, get_confirm_keyboard
)
from messages import format_task_message, format_deal_message
from tasks import (
    get_user_tasks, get_today_tasks, get_overdue_tasks, get_task_by_id,
    update_task_status, create_task, get_statuses
)
from deals import (
    get_all_deals, get_user_deals, get_deal_by_id, create_deal, update_deal,
    update_deal_stage, delete_deal, search_deals, get_sales_funnels, get_funnel_stages,
    get_won_deals_today
)
from clients import get_all_clients, get_client_by_id, create_client, search_clients
from profile import get_user_profile, format_profile_message
from notifications import (
    check_new_tasks, check_new_deals, check_upcoming_meetings,
    get_successful_deal_message
)
from scheduler import TaskScheduler
from utils import get_today_date, is_overdue

# Версия кода - определяем ДО всего остального
CODE_VERSION_AT_START = "2026-01-21-v7"
BOT_FILE_PATH = os.path.abspath(__file__)

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    force=True  # Принудительно перезаписываем конфигурацию
)
logger = logging.getLogger(__name__)

# Логируем версию кода СРАЗУ после настройки логирования
logger.info("=" * 60)
logger.info(f"[BOT] ===== MODULE LOADED ===== Code version: {CODE_VERSION_AT_START} =====")
logger.info(f"[BOT] Bot file path: {BOT_FILE_PATH}")
logger.info(f"[BOT] Bot file exists: {os.path.exists(BOT_FILE_PATH)}")
if os.path.exists(BOT_FILE_PATH):
    logger.info(f"[BOT] Bot file modified: {os.path.getmtime(BOT_FILE_PATH)}")
logger.info("=" * 60)

# Также выводим в stdout/stderr для systemd
print(f"[BOT] ===== MODULE LOADED ===== Code version: {CODE_VERSION_AT_START} =====", flush=True)
print(f"[BOT] Bot file path: {BOT_FILE_PATH}", flush=True)

# Включаем детальное логирование для httpx (чтобы видеть ответы от Telegram API)
logging.getLogger("httpx").setLevel(logging.DEBUG)

# Включаем логирование для httpx (чтобы видеть запросы к Telegram API)
logging.getLogger("httpx").setLevel(logging.INFO)

# Состояния для ConversationHandler
(LOGIN, PASSWORD) = range(2)

# Хранилище сессий пользователей (в продакшене использовать Redis)
user_sessions = {}  # {telegram_user_id: {user_id: str, last_check: datetime}}

# Хранилище состояний для создания/редактирования
user_states = {}  # {telegram_user_id: {state: str, data: dict}}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Обработчик команды /start"""
    try:
        telegram_user_id = update.effective_user.id
        username = update.effective_user.username or update.effective_user.first_name or "Unknown"
        logger.info(f"[START] Command received from user {telegram_user_id} (@{username})")
        
        # Проверяем, авторизован ли пользователь
        if telegram_user_id in user_sessions:
            user_id = user_sessions[telegram_user_id]['user_id']
            if check_user_active(user_id):
                logger.info(f"[START] User {telegram_user_id} already authorized")
                await update.message.reply_text(
                    "Вы уже авторизованы! Используйте меню для навигации.",
                    reply_markup=get_main_menu()
                )
                return ConversationHandler.END
        
        logger.info(f"[START] Starting authorization for user {telegram_user_id}")
        await update.message.reply_text(
            "Добро пожаловать в бот системы управления задачами!\n\n"
            "Для начала работы необходимо авторизоваться.\n"
            "Введите ваш логин:"
        )
        return LOGIN
    except Exception as e:
        logger.error(f"[START] Error in start handler: {e}", exc_info=True)
        try:
            await update.message.reply_text(
                "Произошла ошибка при обработке команды. Попробуйте еще раз."
            )
        except:
            pass
        return ConversationHandler.END

async def login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Обработчик ввода логина"""
    try:
        login_text = update.message.text.strip()
        logger.info(f"[LOGIN] User {update.effective_user.id} entered login: {login_text[:3]}...")
        context.user_data['login'] = login_text
        
        await update.message.reply_text("Введите ваш пароль:")
        return PASSWORD
    except Exception as e:
        logger.error(f"[LOGIN] Error: {e}", exc_info=True)
        try:
            await update.message.reply_text("Произошла ошибка. Попробуйте еще раз.")
        except:
            pass
        return ConversationHandler.END

async def password(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Обработчик ввода пароля"""
    try:
        password_text = update.message.text
        login_text = context.user_data.get('login')
        logger.info(f"[PASSWORD] User {update.effective_user.id} attempting login: {login_text}")
        
        # Аутентификация
        user = authenticate_user(login_text, password_text)
        
        if user:
            telegram_user_id = update.effective_user.id
            user_sessions[telegram_user_id] = {
                'user_id': user['id'],
                'last_check': datetime.now()
            }
            
            # Сохраняем telegram_user_id в профиле пользователя
            user['telegramUserId'] = str(telegram_user_id)
            firebase.save('users', user)
            
            logger.info(f"[PASSWORD] User {telegram_user_id} authenticated successfully as {user.get('name', 'Unknown')}")
            await update.message.reply_text(
                f"✅ Авторизация успешна!\n\n"
                f"Добро пожаловать, {user.get('name', 'Пользователь')}!",
                reply_markup=get_main_menu()
            )
            return ConversationHandler.END
        else:
            logger.warning(f"[PASSWORD] User {update.effective_user.id} failed authentication for login: {login_text}")
            await update.message.reply_text(
                "❌ Неверный логин или пароль. Попробуйте еще раз.\n"
                "Используйте команду /start для повторной попытки."
            )
            return ConversationHandler.END
    except Exception as e:
        logger.error(f"[PASSWORD] Error: {e}", exc_info=True)
        try:
            await update.message.reply_text("Произошла ошибка при авторизации. Попробуйте еще раз.")
        except:
            pass
        return ConversationHandler.END

async def logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /logout"""
    telegram_user_id = update.effective_user.id
    if telegram_user_id in user_sessions:
        del user_sessions[telegram_user_id]
    if telegram_user_id in user_states:
        del user_states[telegram_user_id]
    
    await update.message.reply_text("Вы вышли из системы. Используйте /start для повторной авторизации.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = (
        "📖 Справка по боту\n\n"
        "Основные команды:\n"
        "/start - Начать работу с ботом\n"
        "/logout - Выйти из системы\n"
        "/help - Показать эту справку\n\n"
        "Используйте кнопки меню для навигации по функциям бота."
    )
    await update.message.reply_text(help_text)

def require_auth(func):
    """Декоратор для проверки авторизации"""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        telegram_user_id = update.effective_user.id
        
        if telegram_user_id not in user_sessions:
            await update.callback_query.answer("❌ Вы не авторизованы. Используйте /start")
            return
        
        user_id = user_sessions[telegram_user_id]['user_id']
        if not check_user_active(user_id):
            del user_sessions[telegram_user_id]
            await update.callback_query.answer("❌ Ваш аккаунт был деактивирован. Используйте /start")
            return
        
        return await func(update, context, *args, **kwargs)
    return wrapper

@require_auth
async def menu_main(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Главное меню"""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("🏠 Главное меню", reply_markup=get_main_menu())

@require_auth
async def menu_tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Меню задач"""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("📋 Задачи", reply_markup=get_tasks_menu())

@require_auth
async def tasks_today(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Задачи на сегодня"""
    query = update.callback_query
    await query.answer()
    
    telegram_user_id = update.effective_user.id
    user_id = user_sessions[telegram_user_id]['user_id']
    
    tasks = get_today_tasks(user_id)
    users = firebase.get_all('users')
    projects = firebase.get_all('projects')
    
    if not tasks:
        await query.edit_message_text(
            "✅ На сегодня задач нет!",
            reply_markup=get_tasks_menu()
        )
        return
    
    message = f"📋 Задачи на сегодня ({len(tasks)}):\n\n"
    keyboard = []
    for task in tasks[:10]:  # Ограничиваем 10 задачами
        task_id = task.get('id', '')
        task_title = task.get('title', 'Без названия')[:30]
        keyboard.append([
            InlineKeyboardButton(
                f"📋 {task_title}",
                callback_data=f"task_{task_id}"
            )
        ])
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="menu_tasks")])
    
    await query.edit_message_text(
        message,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

@require_auth
async def tasks_overdue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Просроченные задачи"""
    query = update.callback_query
    await query.answer()
    
    telegram_user_id = update.effective_user.id
    user_id = user_sessions[telegram_user_id]['user_id']
    
    tasks = get_overdue_tasks(user_id)
    users = firebase.get_all('users')
    projects = firebase.get_all('projects')
    
    if not tasks:
        await query.edit_message_text(
            "✅ Просроченных задач нет!",
            reply_markup=get_tasks_menu()
        )
        return
    
    message = f"⚠️ Просроченные задачи ({len(tasks)}):\n\n"
    keyboard = []
    for task in tasks[:10]:  # Ограничиваем 10 задачами
        task_id = task.get('id', '')
        task_title = task.get('title', 'Без названия')[:30]
        keyboard.append([
            InlineKeyboardButton(
                f"⚠️ {task_title}",
                callback_data=f"task_{task_id}"
            )
        ])
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="menu_tasks")])
    
    await query.edit_message_text(
        message,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

@require_auth
async def task_detail(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Детальная информация о задаче"""
    query = update.callback_query
    await query.answer()
    
    task_id = query.data.split('_')[1]
    task = get_task_by_id(task_id)
    
    if not task:
        await query.edit_message_text("❌ Задача не найдена", reply_markup=get_tasks_menu())
        return
    
    users = firebase.get_all('users')
    projects = firebase.get_all('projects')
    message = format_task_message(task, users, projects)
    
    await query.edit_message_text(message, reply_markup=get_task_menu(task_id))

@require_auth
async def task_set_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Изменить статус задачи"""
    query = update.callback_query
    await query.answer()
    
    parts = query.data.split('_')
    task_id = parts[3]
    new_status = parts[4] if len(parts) > 4 else None
    
    if new_status:
        # Устанавливаем статус
        task = get_task_by_id(task_id)
        if task:
            statuses = get_statuses()
            status_obj = next((s for s in statuses if s.get('id') == new_status or s.get('name') == new_status), None)
            if status_obj:
                status_name = status_obj.get('name', new_status)
                update_task_status(task_id, status_name)
                await query.edit_message_text(
                    f"✅ Статус задачи изменен на: {status_name}",
                    reply_markup=get_task_menu(task_id)
                )
            else:
                await query.answer("❌ Статус не найден")
        else:
            await query.answer("❌ Задача не найдена")
    else:
        # Показываем список статусов
        statuses = get_statuses()
        if not statuses:
            await query.answer("❌ Статусы не найдены")
            return
        
        await query.edit_message_text(
            "Выберите новый статус:",
            reply_markup=get_statuses_keyboard(statuses, task_id)
        )

@require_auth
async def menu_deals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Меню сделок"""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("🎯 Сделки", reply_markup=get_deals_menu())

@require_auth
async def deals_all(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Все сделки"""
    query = update.callback_query
    await query.answer()
    
    deals = get_all_deals()
    clients = firebase.get_all('clients')
    users = firebase.get_all('users')
    funnels = get_sales_funnels()
    
    if not deals:
        await query.edit_message_text(
            "📭 Сделок нет",
            reply_markup=get_deals_menu()
        )
        return
    
    message = f"🎯 Все сделки ({len(deals)}):\n\n"
    keyboard = []
    for deal in deals[:20]:  # Ограничиваем 20 сделками
        deal_id = deal.get('id', '')
        deal_title = deal.get('title', deal.get('contactName', 'Без названия'))[:30]
        keyboard.append([
            InlineKeyboardButton(
                f"🎯 {deal_title}",
                callback_data=f"deal_{deal_id}"
            )
        ])
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="menu_deals")])
    
    await query.edit_message_text(
        message,
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

@require_auth
async def deal_detail(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Детальная информация о сделке"""
    query = update.callback_query
    await query.answer()
    
    deal_id = query.data.split('_')[1]
    deal = get_deal_by_id(deal_id)
    
    if not deal:
        await query.edit_message_text("❌ Сделка не найдена", reply_markup=get_deals_menu())
        return
    
    clients = firebase.get_all('clients')
    users = firebase.get_all('users')
    funnels = get_sales_funnels()
    message = format_deal_message(deal, clients, users, funnels)
    
    await query.edit_message_text(message, reply_markup=get_deal_menu(deal_id))

@require_auth
async def deal_set_stage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Изменить стадию сделки"""
    query = update.callback_query
    await query.answer()
    
    parts = query.data.split('_')
    deal_id = parts[3]
    new_stage = parts[4] if len(parts) > 4 else None
    
    if new_stage:
        # Устанавливаем стадию
        deal = get_deal_by_id(deal_id)
        if deal:
            update_deal_stage(deal_id, new_stage)
            
            # Проверяем, не перешла ли сделка в стадию "won"
            if new_stage == 'won':
                # Отправляем уведомление в групповой чат
                notification_prefs = firebase.get_by_id('notificationPrefs', 'default')
                telegram_chat_id = notification_prefs.get('telegramChatId') if notification_prefs else None
                
                if telegram_chat_id:
                    clients = firebase.get_all('clients')
                    users = firebase.get_all('users')
                    message = get_successful_deal_message(deal, clients, users)
                    if message:
                        try:
                            await context.bot.send_message(
                                chat_id=telegram_chat_id,
                                text=message
                            )
                        except Exception as e:
                            logger.error(f"Error sending successful deal message: {e}")
            
            await query.edit_message_text(
                f"✅ Стадия сделки изменена",
                reply_markup=get_deal_menu(deal_id)
            )
        else:
            await query.answer("❌ Сделка не найдена")
    else:
        # Показываем список стадий
        deal = get_deal_by_id(deal_id)
        if not deal:
            await query.answer("❌ Сделка не найдена")
            return
        
        funnel_id = deal.get('funnelId')
        if not funnel_id:
            await query.answer("❌ У сделки не указана воронка")
            return
        
        stages = get_funnel_stages(funnel_id)
        if not stages:
            await query.answer("❌ Стадии не найдены")
            return
        
        await query.edit_message_text(
            "Выберите новую стадию:",
            reply_markup=get_stages_keyboard(stages, deal_id)
        )

@require_auth
async def menu_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Меню профиля"""
    query = update.callback_query
    await query.answer()
    
    telegram_user_id = update.effective_user.id
    user_id = user_sessions[telegram_user_id]['user_id']
    
    user = get_user_profile(user_id)
    if user:
        message = format_profile_message(user)
        await query.edit_message_text(message, reply_markup=get_profile_menu())
    else:
        await query.edit_message_text("❌ Профиль не найден", reply_markup=get_main_menu())

@require_auth
async def menu_settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Меню настроек"""
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("⚙️ Настройки", reply_markup=get_settings_menu())

@require_auth
async def menu_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Меню помощи"""
    query = update.callback_query
    await query.answer()
    
    help_text = (
        "📖 Справка по боту\n\n"
        "Основные команды:\n"
        "/start - Начать работу с ботом\n"
        "/logout - Выйти из системы\n"
        "/help - Показать эту справку\n\n"
        "Используйте кнопки меню для навигации по функциям бота."
    )
    await query.edit_message_text(help_text, reply_markup=get_main_menu())

async def periodic_check(context: ContextTypes.DEFAULT_TYPE):
    """Периодическая проверка новых задач, заявок и т.д."""
    try:
        now = datetime.now()
        
        # Проверяем активность пользователей
        for telegram_user_id, session in list(user_sessions.items()):
            user_id = session['user_id']
            if not check_user_active(user_id):
                del user_sessions[telegram_user_id]
                if telegram_user_id in user_states:
                    del user_states[telegram_user_id]
                try:
                    await context.bot.send_message(
                        chat_id=telegram_user_id,
                        text="❌ Ваш аккаунт был деактивирован. Используйте /start для повторной авторизации."
                    )
                except:
                    pass
                continue
            
            # Проверяем новые задачи
            last_check = session.get('last_check', now)
            new_tasks = check_new_tasks(user_id, last_check)
            for task in new_tasks:
                users = firebase.get_all('users')
                projects = firebase.get_all('projects')
                message = format_task_message(task, users, projects)
                keyboard = get_task_menu(task.get('id'))
                try:
                    await context.bot.send_message(
                        chat_id=telegram_user_id,
                        text=message,
                        reply_markup=keyboard
                    )
                except Exception as e:
                    logger.error(f"Error sending task notification: {e}")
            
            # Обновляем время последней проверки
            session['last_check'] = now
        
        # Проверяем успешные сделки для групповых уведомлений
        won_deals = get_won_deals_today()
        if won_deals:
            notification_prefs = firebase.get_by_id('notificationPrefs', 'default')
            telegram_chat_id = notification_prefs.get('telegramChatId') if notification_prefs else None
            
            if telegram_chat_id:
                clients = firebase.get_all('clients')
                users = firebase.get_all('users')
                for deal in won_deals:
                    message = get_successful_deal_message(deal, clients, users)
                    if message:
                        try:
                            await context.bot.send_message(
                                chat_id=telegram_chat_id,
                                text=message
                            )
                        except Exception as e:
                            logger.error(f"Error sending successful deal message: {e}")
    
    except Exception as e:
        logger.error(f"Error in periodic_check: {e}")

def main():
    """Главная функция запуска бота"""
    try:
        # Версия кода для проверки обновлений
        CODE_VERSION = "2026-01-21-v7"
        
        logger.info("=" * 60)
        logger.info(f"[BOT] ===== STARTING BOT =====")
        logger.info(f"[BOT] Code version: {CODE_VERSION}")
        logger.info(f"[BOT] This version includes detailed update logging")
        print(f"[BOT] ===== STARTING BOT ===== Code version: {CODE_VERSION} =====")
        logger.info(f"[BOT] Initializing bot with token: {config.TELEGRAM_BOT_TOKEN[:10]}...")
        
        # Создаем приложение
        application = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()
        logger.info("[BOT] Application created successfully")
    except Exception as e:
        logger.error(f"[BOT] FATAL ERROR in main() initialization: {e}", exc_info=True)
        raise
    
    # Обработчик ошибок
    async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Обработчик ошибок"""
        logger.error(f"[ERROR] Exception while handling an update: {context.error}", exc_info=context.error)
        if isinstance(update, Update) and update.effective_message:
            try:
                await update.effective_message.reply_text(
                    "Произошла ошибка при обработке вашего запроса. Попробуйте еще раз."
                )
            except:
                pass
    
    # Обработчик всех обновлений для логирования (добавляем ПЕРВЫМ, чтобы видеть все обновления)
    async def log_update(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Логируем все обновления для отладки"""
        try:
            logger.info(f"[UPDATE] ===== RECEIVED UPDATE (ID: {update.update_id}) =====")
            print(f"[UPDATE] ===== RECEIVED UPDATE (ID: {update.update_id}) =====", flush=True)
            
            if update.message:
                chat_type = "PRIVATE" if update.message.chat.type == "private" else f"GROUP ({update.message.chat.type})"
                user_id = update.effective_user.id if update.effective_user else "N/A"
                username = update.effective_user.username if update.effective_user and update.effective_user.username else "N/A"
                text = update.message.text or "N/A"
                logger.info(f"[UPDATE] Message from user {user_id} (@{username}) in {chat_type}: {text}")
                print(f"[UPDATE] Message from user {user_id} (@{username}) in {chat_type}: {text}", flush=True)
                if text and text.startswith('/'):
                    logger.info(f"[UPDATE] ⚠️ COMMAND DETECTED: {text}")
                    print(f"[UPDATE] ⚠️ COMMAND DETECTED: {text}", flush=True)
            elif update.callback_query:
                user_id = update.effective_user.id if update.effective_user else "N/A"
                logger.info(f"[UPDATE] Callback query from {user_id}: {update.callback_query.data}")
                print(f"[UPDATE] Callback query from {user_id}: {update.callback_query.data}", flush=True)
            elif update.edited_message:
                user_id = update.effective_user.id if update.effective_user else "N/A"
                logger.info(f"[UPDATE] Edited message from {user_id}")
                print(f"[UPDATE] Edited message from {user_id}", flush=True)
            else:
                logger.info(f"[UPDATE] Other update type: {type(update)}")
                print(f"[UPDATE] Other update type: {type(update)}", flush=True)
            logger.info(f"[UPDATE] ===== END UPDATE =====")
            print(f"[UPDATE] ===== END UPDATE =====", flush=True)
        except Exception as e:
            logger.error(f"[UPDATE] Error logging update: {e}", exc_info=True)
            print(f"[UPDATE] ERROR: {e}", flush=True)
    
    # Добавляем обработчик для логирования всех обновлений ПЕРВЫМ (группа -1)
    # Это гарантирует, что мы увидим все обновления ДО их обработки другими обработчиками
    # MessageHandler с filters.ALL ловит все сообщения
    application.add_handler(MessageHandler(filters.ALL, log_update), group=-1)
    # Также добавляем обработчик для callback_query
    application.add_handler(CallbackQueryHandler(log_update), group=-1)
    logger.info("[BOT] Logging handlers registered in group -1 (will see ALL updates)")
    
    # ConversationHandler для авторизации
    # Работает в приватных чатах (по умолчанию команды работают только в приватных чатах)
    auth_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            LOGIN: [MessageHandler(filters.TEXT & ~filters.COMMAND, login)],
            PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, password)],
        },
        fallbacks=[CommandHandler('start', start)],
    )
    
    # Регистрируем обработчики
    application.add_handler(auth_handler)
    application.add_handler(CommandHandler('logout', logout))
    application.add_handler(CommandHandler('help', help_command))
    
    # Регистрируем обработчик ошибок
    application.add_error_handler(error_handler)
    
    logger.info("[BOT] All handlers registered")
    
    # Обработчики callback_query
    application.add_handler(CallbackQueryHandler(menu_main, pattern='^menu_main$'))
    application.add_handler(CallbackQueryHandler(menu_tasks, pattern='^menu_tasks$'))
    application.add_handler(CallbackQueryHandler(tasks_today, pattern='^tasks_today$'))
    application.add_handler(CallbackQueryHandler(tasks_overdue, pattern='^tasks_overdue$'))
    application.add_handler(CallbackQueryHandler(task_detail, pattern='^task_[^_]+$'))
    application.add_handler(CallbackQueryHandler(task_set_status, pattern='^task_set_status_'))
    application.add_handler(CallbackQueryHandler(menu_deals, pattern='^menu_deals$'))
    application.add_handler(CallbackQueryHandler(deals_all, pattern='^deals_all$'))
    application.add_handler(CallbackQueryHandler(deal_detail, pattern='^deal_[^_]+$'))
    application.add_handler(CallbackQueryHandler(deal_set_stage, pattern='^deal_set_stage_'))
    application.add_handler(CallbackQueryHandler(menu_profile, pattern='^menu_profile$'))
    application.add_handler(CallbackQueryHandler(menu_settings, pattern='^menu_settings$'))
    application.add_handler(CallbackQueryHandler(menu_help, pattern='^menu_help$'))
    
    # Периодическая проверка (каждые 30 секунд)
    job_queue = application.job_queue
    job_queue.run_repeating(periodic_check, interval=30, first=10)
    
    # Запускаем планировщик задач
    scheduler = TaskScheduler(application.bot)
    scheduler.start()
    
    # Запускаем бота
    logger.info("=" * 60)
    logger.info("Bot started")
    logger.info(f"[BOT] Code version: {CODE_VERSION} (with detailed logging)")
    logger.info(f"[BOT] Starting polling with token: {config.TELEGRAM_BOT_TOKEN[:10]}...")
    logger.info(f"[BOT] Polling mode: allowed_updates={Update.ALL_TYPES}, drop_pending_updates=False")
    logger.info(f"[BOT] All handlers registered, starting polling...")
    logger.info("=" * 60)
    
    # Добавляем кастомный обработчик для логирования ответов от getUpdates
    async def post_init(application: Application) -> None:
        """Вызывается после инициализации приложения"""
        logger.info("[BOT] Application initialized, polling will start")
    
    async def post_shutdown(application: Application) -> None:
        """Вызывается при остановке приложения"""
        logger.info("[BOT] Application shutting down")
    
    application.post_init = post_init
    application.post_shutdown = post_shutdown
    
    # Проверяем, нет ли других запущенных экземпляров бота (перед запуском polling)
    try:
        running_processes = subprocess.run(
            ['pgrep', '-f', 'python.*bot.py'],
            capture_output=True,
            text=True,
            timeout=2
        )
        if running_processes.returncode == 0:
            pids = [p for p in running_processes.stdout.strip().split('\n') if p]
            current_pid = str(os.getpid())
            other_pids = [pid for pid in pids if pid != current_pid]
            if other_pids:
                logger.warning(f"[BOT] ⚠️ WARNING: Other bot processes detected: {other_pids}")
                logger.warning(f"[BOT] This may cause 409 Conflict errors!")
                logger.warning(f"[BOT] Current PID: {current_pid}")
            else:
                logger.info(f"[BOT] ✅ No other bot processes detected (current PID: {current_pid})")
    except Exception as e:
        logger.warning(f"[BOT] Could not check for other processes: {e}")
    
    try:
        logger.info("[BOT] Starting polling...")
        logger.info("[BOT] If you send /start to the bot, you should see [UPDATE] messages in logs")
        logger.info(f"[BOT] Polling config: allowed_updates=ALL_TYPES, drop_pending=False, interval=1.0s, timeout=10s")
        
        application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=False,  # Обрабатываем все обновления
            poll_interval=1.0,  # Проверяем обновления каждую секунду
            timeout=10  # Таймаут для запросов
        )
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error in polling: {e}", exc_info=True)
        raise

if __name__ == '__main__':
    print(f"[BOT] ===== SCRIPT STARTED ===== Code version: {CODE_VERSION_AT_START} =====")
    logger.info(f"[BOT] ===== SCRIPT STARTED =====")
    logger.info(f"[BOT] Code version at start: {CODE_VERSION_AT_START}")
    try:
        main()
    except Exception as e:
        logger.error(f"[BOT] FATAL ERROR in main(): {e}", exc_info=True)
        raise
