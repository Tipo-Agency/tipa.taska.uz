# Инструкция: Обновление Telegram бота на сервере

## Пошаговая инструкция

### Шаг 1: Подключитесь к серверу по SSH

```bash
ssh root@217.199.252.14
```

Или используйте ваше имя пользователя:
```bash
ssh user@217.199.252.14
```

### Шаг 2: Перейдите в директорию проекта

```bash
cd /var/www/tipa.taska.uz
```

### Шаг 3: Проверьте текущий статус бота

```bash
sudo systemctl status telegram-bot
```

Должны увидеть статус (active/running или stopped).

### Шаг 4: Остановите бота (если запущен)

```bash
sudo systemctl stop telegram-bot
```

### Шаг 5: Обновите код из репозитория

```bash
git pull origin main
```

Если возникнет ошибка с правами доступа:
```bash
git config --global --add safe.directory /var/www/tipa.taska.uz
git pull origin main
```

### Шаг 6: Проверьте, что файлы обновились

```bash
# Проверьте, что firebase_client_admin.py содержит исправления
grep -n "hasattr(value, 'seconds')" telegram-bot/firebase_client_admin.py
```

Должна быть строка с проверкой Timestamp.

### Шаг 7: Перезапустите бота

```bash
sudo systemctl start telegram-bot
```

### Шаг 8: Проверьте статус бота

```bash
sudo systemctl status telegram-bot
```

Должно быть `Active: active (running)`.

### Шаг 9: Проверьте логи на ошибки

```bash
sudo journalctl -u telegram-bot -n 50
```

**Что должно быть в логах:**
- ✅ `[Firebase] Using Admin SDK with service account` - бот использует Admin SDK
- ✅ `[Firebase] Initialized with credentials from /var/www/...` - инициализация прошла успешно
- ✅ `[BOT] Initializing bot with token: 8348357222...` - бот инициализируется с правильным токеном
- ✅ `Bot started` - бот запущен
- ✅ `[START] Command received from user ...` - когда пользователь отправляет `/start` (появится в логах)
- ❌ НЕ должно быть ошибок `module 'firebase_admin.firestore' has no attribute 'Timestamp'`
- ❌ НЕ должно быть ошибок `403 PERMISSION_DENIED`

### Шаг 9: Проверьте работу бота в реальном времени

Откройте Telegram и отправьте боту команду `/start`. В логах должны появиться:
- `[START] Command received from user ...`
- `[START] Starting authorization for user ...`

Если этих сообщений нет, значит бот не получает обновления от Telegram.

### Шаг 10: Проверьте работу бота в Telegram

```bash
sudo journalctl -u telegram-bot -f
```

Нажмите `Ctrl+C` для выхода из просмотра логов.

---

## Если что-то пошло не так

### Проблема: Git pull не работает (ошибка прав доступа)

```bash
# Исправьте права на директорию
sudo chown -R $USER:$USER /var/www/tipa.taska.uz
git config --global --add safe.directory /var/www/tipa.taska.uz
git pull origin main
```

### Проблема: Бот не запускается

```bash
# Проверьте логи на ошибки
sudo journalctl -u telegram-bot -n 100

# Проверьте, что файл credentials существует
ls -la /var/www/tipa.taska.uz/telegram-bot/firebase-credentials.json

# Проверьте .env файл
cat /var/www/tipa.taska.uz/telegram-bot/.env
```

### Проблема: Все еще видна ошибка с Timestamp

```bash
# Убедитесь, что файл обновился
cat telegram-bot/firebase_client_admin.py | grep -A 5 "hasattr(value, 'seconds')"

# Если изменений нет, попробуйте принудительно обновить
cd /var/www/tipa.taska.uz
git fetch origin
git reset --hard origin/main
sudo systemctl restart telegram-bot
```

### Проблема: Бот не отвечает в Telegram

1. Проверьте токен бота в `.env`:
   ```bash
   cat /var/www/tipa.taska.uz/telegram-bot/.env | grep TELEGRAM_BOT_TOKEN
   ```

2. Проверьте, что бот запущен:
   ```bash
   sudo systemctl status telegram-bot
   ```

3. Проверьте логи на ошибки:
   ```bash
   sudo journalctl -u telegram-bot -n 50
   ```

---

## Быстрая команда (все в одной строке)

Если хотите сделать все быстро:

```bash
cd /var/www/tipa.taska.uz && sudo systemctl stop telegram-bot && git pull origin main && sudo systemctl start telegram-bot && sleep 3 && sudo systemctl status telegram-bot
```

**Важно:** После обновления проверьте логи, чтобы убедиться, что бот получает команды:
```bash
sudo journalctl -u telegram-bot -f
```

Затем отправьте `/start` боту в Telegram и проверьте, появляются ли сообщения `[START]` в логах.

---

## После обновления

После успешного обновления:

1. ✅ Бот должен запуститься без ошибок
2. ✅ В логах не должно быть ошибок с Timestamp
3. ✅ Бот должен отвечать на команды в Telegram
4. ✅ Бот должен читать данные из Firebase без ошибок 403

Проверьте работу бота, отправив ему `/start` в Telegram.
