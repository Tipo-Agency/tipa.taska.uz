# Быстрый старт Telegram бота

## Проблема: бот не отвечает

Если бот запущен (`sudo systemctl status telegram-bot` показывает `active (running)`), но не отвечает на сообщения, **скорее всего проблема в доступе к Firebase**.

## Решение: настройте Firebase Service Account

**Для работы бота НУЖЕН service account от Firebase.** Это не логин/пароль, а специальный JSON файл с ключами.

📖 **Подробная пошаговая инструкция:** [FIREBASE_SERVICE_ACCOUNT_SETUP.md](./FIREBASE_SERVICE_ACCOUNT_SETUP.md)

### Шаг 1: Создайте Service Account

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект **tipa-task-manager**
3. Нажмите на ⚙️ (шестеренку) → **Project Settings**
4. Перейдите на вкладку **Service accounts**
5. Нажмите **"Generate new private key"**
6. Скачайте JSON файл (например, `tipa-task-manager-firebase-adminsdk-xxxxx.json`)

### Шаг 2: Загрузите файл на сервер

```bash
# С вашего компьютера
scp ~/Downloads/tipa-task-manager-firebase-adminsdk-xxxxx.json user@your-server:/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
```

Или загрузите через SFTP/FTP клиент в директорию `/var/www/tipa.taska.uz/telegram-bot/`

### Шаг 3: Настройте права доступа

```bash
cd /var/www/tipa.taska.uz/telegram-bot
chmod 600 firebase-credentials.json
```

### Шаг 4: Обновите .env файл

```bash
cd /var/www/tipa.taska.uz/telegram-bot
nano .env
```

Добавьте или обновите:
```env
TELEGRAM_BOT_TOKEN=8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c
FIREBASE_PROJECT_ID=tipa-task-manager
FIREBASE_CREDENTIALS_PATH=/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
DEFAULT_TIMEZONE=Asia/Tashkent
```

### Шаг 5: Установите firebase-admin (если еще не установлен)

```bash
cd /var/www/tipa.taska.uz/telegram-bot
source venv/bin/activate
pip install firebase-admin
```

### Шаг 6: Перезапустите бота

```bash
sudo systemctl restart telegram-bot
```

### Шаг 7: Проверьте логи

```bash
# Последние 50 строк логов
sudo journalctl -u telegram-bot -n 50

# Или в реальном времени
sudo journalctl -u telegram-bot -f
```

Должны увидеть:
```
[Firebase] Using Admin SDK with service account
```

Если видите ошибки - проверьте:
- Правильный ли путь к файлу credentials в `.env`
- Существует ли файл `firebase-credentials.json`
- Правильные ли права доступа (600)

### Шаг 8: Проверьте работу бота

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Введите логин и пароль (те же, что используете для входа в веб-приложение)

Если все настроено правильно, бот должен ответить и показать главное меню.

---

## Что делать, если не работает?

1. **Проверьте логи:** `sudo journalctl -u telegram-bot -n 50`
2. **Проверьте статус:** `sudo systemctl status telegram-bot`
3. **Проверьте .env файл:** `cat /var/www/tipa.taska.uz/telegram-bot/.env`
4. **Проверьте наличие credentials файла:** `ls -la /var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json`

Если видите ошибки 403/401 - это значит, что service account не настроен или неправильно указан путь.
