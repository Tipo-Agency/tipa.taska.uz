# Инструкция по настройке Telegram бота на сервере

## Шаги для запуска бота на сервере

### 1. Подключитесь к серверу по SSH

```bash
ssh user@your-server-ip
```

### 2. Перейдите в директорию проекта

```bash
cd /var/www/taska  # или путь, указанный в SERVER_PATH
```

### 3. Убедитесь, что Python 3 установлен

```bash
python3 --version
# Должно быть Python 3.10 или выше
```

Если Python не установлен:
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

### 4. Создайте файл `.env` для бота

```bash
cd telegram-bot
nano .env
```

Добавьте следующие переменные:
```env
TELEGRAM_BOT_TOKEN=8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c
FIREBASE_PROJECT_ID=tipa-task-manager
DEFAULT_TIMEZONE=Asia/Tashkent
```

**Важно:** Если вы используете Firebase Admin SDK (не REST API), укажите путь к credentials файлу:
```env
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
```

### 5. Исправьте проблему с Git ownership (если нужно)

```bash
cd /var/www/taska  # путь к репозиторию
git config --global --add safe.directory /var/www/taska
```

Или используйте скрипт:
```bash
sudo ./telegram-bot/fix-git-ownership.sh /var/www/taska
```

### 6. Запустите деплой бота

```bash
cd telegram-bot
chmod +x deploy.sh
sudo ./deploy.sh
```

Скрипт автоматически:
- Создаст виртуальное окружение Python
- Установит все зависимости
- Создаст systemd service
- Запустит бота

### 7. Проверьте статус бота

```bash
sudo systemctl status telegram-bot
```

### 8. Просмотр логов (если нужно)

```bash
# Просмотр логов в реальном времени
sudo journalctl -u telegram-bot -f

# Последние 50 строк логов
sudo journalctl -u telegram-bot -n 50
```

## Управление ботом

### Команды для управления сервисом:

```bash
# Запустить бота
sudo systemctl start telegram-bot

# Остановить бота
sudo systemctl stop telegram-bot

# Перезапустить бота
sudo systemctl restart telegram-bot

# Проверить статус
sudo systemctl status telegram-bot

# Включить автозапуск при загрузке системы
sudo systemctl enable telegram-bot

# Отключить автозапуск
sudo systemctl disable telegram-bot
```

## Автоматический деплой

После настройки бот будет автоматически обновляться при каждом пуше в ветку `main` через GitHub Actions.

Процесс:
1. Вы делаете `npm run push` (или `git push`)
2. GitHub Actions запускает деплой
3. На сервере обновляется код
4. Автоматически перезапускается бот

## Решение проблем

### Бот не запускается (статус: activating/auto-restart)

1. **Проверьте логи (самое важное!):**
```bash
# Последние 50 строк логов
sudo journalctl -u telegram-bot -n 50

# Или используйте скрипт для удобного просмотра
cd telegram-bot
./check-logs.sh
```

2. **Проверьте файл `.env`:**
```bash
cd telegram-bot
cat .env
```

Убедитесь, что все переменные заполнены:
- `TELEGRAM_BOT_TOKEN` - должен быть заполнен
- `FIREBASE_PROJECT_ID` - должен быть заполнен
- `DEFAULT_TIMEZONE` - должен быть заполнен

3. **Проверьте виртуальное окружение:**
```bash
cd telegram-bot
source venv/bin/activate
python bot.py
```

Если есть ошибки при запуске, они будут видны в консоли.

4. **Частые проблемы:**

   **Ошибка "Module not found":**
   ```bash
   cd telegram-bot
   source venv/bin/activate
   pip install -r requirements.txt
   ```

   **Ошибка с Firebase:**
   - Проверьте, что `FIREBASE_PROJECT_ID` указан правильно
   - Если используете credentials файл, проверьте путь и права доступа
   - Убедитесь, что Firebase Admin SDK правильно настроен

   **Ошибка "Token is invalid":**
   - Проверьте токен бота в `.env`
   - Убедитесь, что токен правильный и бот не был удален/пересоздан

   **Ошибка импорта модулей:**
   - Убедитесь, что все файлы бота находятся в директории `telegram-bot/`
   - Проверьте, что все импорты правильные

### Ошибка "Module not found"

Установите зависимости вручную:
```bash
cd telegram-bot
source venv/bin/activate
pip install -r requirements.txt
```

### Ошибка с Firebase

- Убедитесь, что `FIREBASE_PROJECT_ID` указан правильно
- Если используете credentials файл, проверьте путь к нему
- Проверьте права доступа к credentials файлу

### Бот не отвечает

1. Проверьте токен бота в `.env`
2. Проверьте, что бот запущен: `sudo systemctl status telegram-bot`
3. Проверьте логи на ошибки

## Обновление бота вручную

Если нужно обновить бот вручную:

```bash
cd /var/www/taska
git pull origin main
cd telegram-bot
sudo ./deploy.sh
```

## Проверка работы бота

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте команду `/start`
4. Введите логин и пароль (те же, что в веб-приложении)
5. Если авторизация прошла успешно, вы увидите главное меню
