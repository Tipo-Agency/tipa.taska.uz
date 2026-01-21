"""
Конфигурация Telegram бота
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Token
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c')

# Firebase конфигурация
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'tipa-task-manager')
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', '')
FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY', '')

# Часовой пояс по умолчанию
DEFAULT_TIMEZONE = os.getenv('DEFAULT_TIMEZONE', 'Asia/Tashkent')

# Время ежедневного напоминания
DAILY_REMINDER_TIME = '09:00'  # 9:00 утра

# Время еженедельного отчета (понедельник)
WEEKLY_REPORT_DAY = 0  # 0 = понедельник
WEEKLY_REPORT_TIME = '09:00'  # 9:00 утра
