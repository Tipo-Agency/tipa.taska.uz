# Отладка Telegram бота

## Проблема: Бот не отвечает на команду /start

### Возможные причины:

1. **Бот не получает обновления от Telegram**
2. **Обработчик команды не вызывается**
3. **Проблема с правами доступа (root vs обычный пользователь)**
4. **Проблема с токеном бота**

## Пошаговая диагностика:

### Шаг 1: Проверьте, получает ли бот обновления

После обновления кода с логированием, отправьте `/start` боту и проверьте логи:

```bash
sudo journalctl -u telegram-bot -f
```

**Что должно появиться:**
- `[UPDATE] Message from user ... in PRIVATE: /start`
- `[UPDATE] Command detected: /start`
- `[START] Command received from user ...`

**Если этих сообщений НЕТ:**
- Бот не получает обновления от Telegram
- Проверьте токен бота
- Проверьте, что бот не заблокирован

### Шаг 2: Проверьте токен бота

```bash
# На сервере
cat /var/www/tipa.taska.uz/telegram-bot/.env | grep TELEGRAM_BOT_TOKEN
```

Должен быть: `TELEGRAM_BOT_TOKEN=8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c`

### Шаг 3: Проверьте, под каким пользователем запущен бот

```bash
# Проверьте systemd service
sudo systemctl status telegram-bot | grep User

# Или проверьте процесс
ps aux | grep bot.py
```

**Проблема:** Если бот запущен под `root`, а файлы принадлежат другому пользователю, могут быть проблемы с доступом к файлам.

**Решение:** Убедитесь, что бот запущен под правильным пользователем:

```bash
# Проверьте, кто владелец файлов
ls -la /var/www/tipa.taska.uz/telegram-bot/

# Если нужно, измените владельца
sudo chown -R $USER:$USER /var/www/tipa.taska.uz/telegram-bot/
```

### Шаг 4: Проверьте, что бот не заблокирован в Telegram

1. Откройте Telegram
2. Найдите вашего бота
3. Убедитесь, что бот не заблокирован (должна быть кнопка "Начать" или возможность отправить сообщение)

### Шаг 5: Проверьте логи на ошибки

```bash
sudo journalctl -u telegram-bot -n 100 | grep -i error
```

Ищите:
- Ошибки с Firebase
- Ошибки с токеном
- Ошибки импорта модулей

### Шаг 6: Проверьте, что бот может отправлять сообщения

Попробуйте отправить тестовое сообщение через API:

```bash
curl -X POST "https://api.telegram.org/bot8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c/getMe"
```

Должен вернуться JSON с информацией о боте.

### Шаг 7: Проверьте webhook (если установлен)

Если у бота установлен webhook, polling не будет работать:

```bash
curl -X POST "https://api.telegram.org/bot8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c/getWebhookInfo"
```

Если webhook установлен, удалите его:

```bash
curl -X POST "https://api.telegram.org/bot8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c/deleteWebhook"
```

## Решение проблем:

### Проблема: Бот запущен под root, а файлы принадлежат другому пользователю

```bash
# Определите правильного пользователя (тот, кто владеет файлами проекта)
ls -la /var/www/tipa.taska.uz/ | head -5

# Обновите systemd service
cd /var/www/tipa.taska.uz/telegram-bot
sudo nano /etc/systemd/system/telegram-bot.service
```

Измените строку `User=...` на правильного пользователя (например, `User=www-data` или имя пользователя из GitHub Actions).

Затем:
```bash
sudo systemctl daemon-reload
sudo systemctl restart telegram-bot
```

### Проблема: Бот не получает обновления

1. Проверьте токен
2. Проверьте, что webhook не установлен
3. Проверьте, что бот не заблокирован
4. Попробуйте перезапустить бота

### Проблема: В логах есть `[UPDATE]`, но нет `[START]`

Это значит, что обновления приходят, но обработчик команды не вызывается. Возможные причины:
- ConversationHandler не правильно настроен
- Есть ошибка в обработчике, которая не логируется
- Фильтры блокируют команду

Проверьте логи на ошибки:
```bash
sudo journalctl -u telegram-bot -n 100 | grep -i "error\|exception\|traceback"
```

## После обновления кода:

1. Обновите код на сервере:
   ```bash
   cd /var/www/tipa.taska.uz
   git pull origin main
   ```

2. Перезапустите бота:
   ```bash
   sudo systemctl restart telegram-bot
   ```

3. Проверьте логи в реальном времени:
   ```bash
   sudo journalctl -u telegram-bot -f
   ```

4. Отправьте `/start` боту в Telegram

5. В логах должны появиться:
   - `[UPDATE] Message from user ... in PRIVATE: /start`
   - `[UPDATE] Command detected: /start`
   - `[START] Command received from user ...`

Если этих сообщений нет - проблема в получении обновлений.
Если есть `[UPDATE]`, но нет `[START]` - проблема в обработчике команды.
