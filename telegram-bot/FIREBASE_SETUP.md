# Настройка Firebase для Telegram бота

## Вариант 1: REST API (текущий, без credentials)

Бот использует REST API Firebase, который работает через API ключ. **Не требует credentials файла.**

### Проверка работы:
1. Убедитесь, что бот запущен: `sudo systemctl status telegram-bot`
2. Проверьте логи: `sudo journalctl -u telegram-bot -n 50`
3. Если видите ошибки 403/401 - переходите к Варианту 2

### Ограничения:
- Работает только для коллекций с публичным доступом
- Для защищенных коллекций нужен сервисный аккаунт

---

## Вариант 2: Firebase Admin SDK (с сервисным аккаунтом)

Если REST API не работает (ошибки доступа), нужно использовать Admin SDK с сервисным аккаунтом.

### Шаг 1: Создайте сервисный аккаунт

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект **tipa-task-manager**
3. Перейдите в **⚙️ Project Settings** → вкладка **Service accounts**
4. Нажмите **"Generate new private key"**
5. Скачайте JSON файл (например, `tipa-task-manager-firebase-adminsdk-xxxxx.json`)

### Шаг 2: Загрузите файл на сервер

```bash
# С вашего компьютера (замените путь и имя файла)
scp ~/Downloads/tipa-task-manager-firebase-adminsdk-xxxxx.json user@your-server:/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
```

Или загрузите файл через SFTP/FTP клиент в директорию `/var/www/tipa.taska.uz/telegram-bot/`

### Шаг 3: Настройте права доступа

```bash
cd /var/www/tipa.taska.uz/telegram-bot
chmod 600 firebase-credentials.json  # Только владелец может читать
```

### Шаг 4: Обновите .env файл

```bash
cd /var/www/tipa.taska.uz/telegram-bot
nano .env
```

Добавьте или обновите:
```env
FIREBASE_CREDENTIALS_PATH=/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
```

### Шаг 5: Обновите firebase_client.py для использования Admin SDK

Нужно вернуть использование `firebase-admin` вместо REST API. Я могу помочь с этим, если REST API не работает.

### Шаг 6: Установите firebase-admin

```bash
cd /var/www/tipa.taska.uz/telegram-bot
source venv/bin/activate
pip install firebase-admin
```

### Шаг 7: Перезапустите бота

```bash
sudo systemctl restart telegram-bot
sudo journalctl -u telegram-bot -f
```

---

## Какой вариант использовать?

**Начните с Варианта 1 (REST API)** - он проще и не требует credentials.

**Переходите к Варианту 2**, если:
- Видите ошибки 403/401 в логах
- Бот не может читать данные из Firebase
- Правила безопасности Firestore блокируют доступ

---

## Проверка работы

После настройки проверьте:

```bash
# Статус бота
sudo systemctl status telegram-bot

# Логи (должны быть без ошибок)
sudo journalctl -u telegram-bot -n 50

# Тест в Telegram
# Отправьте /start боту и попробуйте авторизоваться
```

Если все работает, вы сможете авторизоваться в боте, используя логин и пароль из веб-приложения.
