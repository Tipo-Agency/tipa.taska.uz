# Подробная инструкция: Настройка Firebase Service Account

## Шаг 1: Генерация Private Key в Firebase Console

1. **Вы уже на правильной странице!** Вы видите раздел "Service accounts" в Firebase Console.

2. **Нажмите кнопку "Generate new private key"** (синяя кнопка внизу справа)

3. **Появится предупреждение** о том, что ключ будет доступен только один раз. Нажмите **"Generate key"**.

4. **JSON файл автоматически скачается** на ваш компьютер (обычно в папку "Загрузки" / Downloads).

   Файл будет называться примерно так: `tipa-task-manager-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

## Шаг 2: Загрузка файла на сервер

### Вариант A: Через SCP (с вашего компьютера)

```bash
# Замените:
# - ~/Downloads/...json - путь к скачанному файлу
# - user - ваше имя пользователя на сервере
# - your-server-ip - IP адрес или домен сервера

scp ~/Downloads/tipa-task-manager-firebase-adminsdk-*.json user@your-server-ip:/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
```

**Пример:**
```bash
scp ~/Downloads/tipa-task-manager-firebase-adminsdk-abc12-xyz789.json root@185.123.45.67:/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
```

### Вариант B: Через SFTP/FTP клиент (FileZilla, WinSCP и т.д.)

1. Подключитесь к серверу через SFTP/FTP
2. Перейдите в папку `/var/www/tipa.taska.uz/telegram-bot/`
3. Загрузите скачанный JSON файл
4. Переименуйте его в `firebase-credentials.json`

### Вариант C: Через веб-интерфейс хостинга

Если у вас есть веб-интерфейс (например, ISPmanager, cPanel), загрузите файл через файловый менеджер.

## Шаг 3: Настройка прав доступа на сервере

Подключитесь к серверу по SSH:

```bash
ssh user@your-server-ip
```

Перейдите в директорию бота:

```bash
cd /var/www/tipa.taska.uz/telegram-bot
```

Проверьте, что файл загружен:

```bash
ls -la firebase-credentials.json
```

Должны увидеть что-то вроде:
```
-rw-r--r-- 1 user user 2345 Jan 21 22:00 firebase-credentials.json
```

Установите правильные права доступа (только владелец может читать):

```bash
chmod 600 firebase-credentials.json
```

Проверьте еще раз:

```bash
ls -la firebase-credentials.json
```

Теперь должно быть:
```
-rw------- 1 user user 2345 Jan 21 22:00 firebase-credentials.json
```

## Шаг 4: Обновление .env файла

Откройте файл `.env`:

```bash
cd /var/www/tipa.taska.uz/telegram-bot
nano .env
```

Проверьте, что там есть следующие строки:

```env
TELEGRAM_BOT_TOKEN=8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c
FIREBASE_PROJECT_ID=tipa-task-manager
FIREBASE_CREDENTIALS_PATH=/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json
DEFAULT_TIMEZONE=Asia/Tashkent
```

**Важно:** Путь к файлу должен быть **абсолютным** (начинаться с `/`), не относительным.

Сохраните файл:
- В `nano`: нажмите `Ctrl+O`, затем `Enter`, затем `Ctrl+X`
- В `vi`: нажмите `Esc`, затем `:wq`, затем `Enter`

## Шаг 5: Установка firebase-admin (если еще не установлен)

```bash
cd /var/www/tipa.taska.uz/telegram-bot
source venv/bin/activate
pip install firebase-admin
```

Если виртуальное окружение не активировано, активируйте его:

```bash
source venv/bin/activate
```

## Шаг 6: Перезапуск бота

```bash
sudo systemctl restart telegram-bot
```

## Шаг 7: Проверка работы

### Проверка статуса:

```bash
sudo systemctl status telegram-bot
```

Должны увидеть:
```
● telegram-bot.service - Telegram Bot for Task Management System
   Loaded: loaded (/etc/systemd/system/telegram-bot.service; enabled; preset: enabled)
   Active: active (running) since ...
```

### Проверка логов:

```bash
sudo journalctl -u telegram-bot -n 50
```

**Ищите в логах:**
- ✅ `[Firebase] Using Admin SDK with service account` - значит все правильно!
- ✅ `[Firebase] Initialized with credentials from /var/www/...` - инициализация прошла успешно
- ❌ `Error initializing: ...` - ошибка, проверьте путь к файлу
- ❌ `403 Forbidden` или `401 Unauthorized` - проблема с credentials

### Тест в Telegram:

1. Откройте Telegram
2. Найдите вашего бота (по имени или через поиск)
3. Отправьте команду `/start`
4. Бот должен попросить ввести логин
5. Введите логин (тот же, что используете для входа в веб-приложение)
6. Введите пароль
7. Если все правильно, увидите главное меню с кнопками

## Решение проблем

### Проблема: "Error initializing: File not found"

**Решение:**
```bash
# Проверьте, существует ли файл
ls -la /var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json

# Проверьте путь в .env
cat /var/www/tipa.taska.uz/telegram-bot/.env | grep FIREBASE_CREDENTIALS_PATH
```

### Проблема: "403 Forbidden" или "401 Unauthorized"

**Решение:**
1. Убедитесь, что файл credentials правильный (не поврежден)
2. Проверьте, что файл имеет правильные права: `chmod 600 firebase-credentials.json`
3. Убедитесь, что путь в `.env` абсолютный и правильный

### Проблема: Бот не отвечает после настройки

**Решение:**
1. Проверьте логи: `sudo journalctl -u telegram-bot -n 50`
2. Проверьте, что бот запущен: `sudo systemctl status telegram-bot`
3. Перезапустите бота: `sudo systemctl restart telegram-bot`

### Проблема: "Module not found: firebase_admin"

**Решение:**
```bash
cd /var/www/tipa.taska.uz/telegram-bot
source venv/bin/activate
pip install firebase-admin
sudo systemctl restart telegram-bot
```

## Проверочный чеклист

- [ ] JSON файл скачан из Firebase Console
- [ ] Файл загружен на сервер в `/var/www/tipa.taska.uz/telegram-bot/`
- [ ] Файл переименован в `firebase-credentials.json`
- [ ] Права доступа установлены: `chmod 600 firebase-credentials.json`
- [ ] В `.env` указан правильный путь: `FIREBASE_CREDENTIALS_PATH=/var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json`
- [ ] `firebase-admin` установлен: `pip install firebase-admin`
- [ ] Бот перезапущен: `sudo systemctl restart telegram-bot`
- [ ] В логах видно: `[Firebase] Using Admin SDK with service account`
- [ ] Бот отвечает в Telegram на команду `/start`

## Готово! 🎉

Если все шаги выполнены и в логах видно `[Firebase] Using Admin SDK with service account`, значит бот настроен правильно и должен работать!
