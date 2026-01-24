# Исправление конфликта 409 в Telegram боте

## Проблема

Ошибка `telegram.error.Conflict: terminated by other getUpdates request` возникала из-за того, что одновременно несколько мест пытались использовать `getUpdates` для одного токена бота.

## Причины конфликта

1. **fix-bot.sh делал getUpdates** во время диагностики, даже когда сервис был запущен
2. **Systemd сервис не использовал EnvironmentFile** - токен мог браться из разных источников
3. **GitHub Actions не обновлял systemd сервис** после изменения .env

## Решение

### 1. Исправлен fix-bot.sh

**Изменения:**
- ✅ Проверка `getUpdates` теперь выполняется **ТОЛЬКО** если сервис остановлен
- ✅ Если сервис запущен - пропускаем `getUpdates` и показываем предупреждение
- ✅ Очистка очереди Telegram выполняется **ТОЛЬКО** если сервис остановлен
- ✅ После запуска сервиса проверяем только `getMe` и `getWebhookInfo` (не `getUpdates`)

**Код:**
```bash
# Проверка getUpdates только если сервис остановлен
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "   ⚠️ Сервис запущен - пропускаем getUpdates (чтобы избежать конфликта 409)"
else
    # Безопасно делаем getUpdates
    GETUPDATES_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=1" ...)
fi
```

### 2. Проверен bot.py на двойной polling

**Результаты проверки:**
- ✅ `Application.builder().token(...).build()` создается **только один раз**
- ✅ `application.run_polling()` вызывается **строго один раз**
- ✅ `TaskScheduler` не делает `get_updates` - только использует `bot.send_message()`
- ✅ `job_queue.run_repeating()` не делает `get_updates` - только выполняет задачи

**Вывод:** В `bot.py` нет двойного polling.

### 3. Обновлен systemd сервис

**Изменения:**
- ✅ Добавлена строка `EnvironmentFile=/var/www/tipa.taska.uz/telegram-bot/.env`
- ✅ Токен теперь берется **только** из `.env` файла через `os.getenv('TELEGRAM_BOT_TOKEN')`
- ✅ Сохранены настройки автоперезапуска: `Restart=always`, `RestartSec=10`

**Файл:** `telegram-bot/telegram-bot.service`
```ini
[Service]
Type=simple
User=root
WorkingDirectory=/var/www/tipa.taska.uz/telegram-bot
Environment="PATH=/var/www/tipa.taska.uz/telegram-bot/venv/bin:/usr/local/bin:/usr/bin:/bin"
# ВАЖНО: Загружаем переменные окружения из .env файла
EnvironmentFile=/var/www/tipa.taska.uz/telegram-bot/.env
ExecStart=/var/www/tipa.taska.uz/telegram-bot/venv/bin/python /var/www/tipa.taska.uz/telegram-bot/bot.py
Restart=always
RestartSec=10
```

### 4. Обновлен GitHub Actions деплой

**Изменения:**
- ✅ Создание/обновление `.env` файла с токеном из `secrets.TELEGRAM_BOT_TOKEN`
- ✅ Установка прав `chmod 600` на `.env` файл
- ✅ Автоматическое создание/обновление systemd сервиса с `EnvironmentFile`
- ✅ Выполнение `sudo systemctl daemon-reload` после обновления сервиса
- ✅ Перезапуск сервиса после деплоя: `sudo systemctl restart telegram-bot.service`
- ✅ Проверка на наличие ошибок 409 в логах после деплоя

**Код:**
```yaml
# Создаем или обновляем .env файл с токеном из secrets
echo "TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}" >> .env
chmod 600 .env

# Обновляем systemd сервис с EnvironmentFile
sudo cp telegram-bot.service /etc/systemd/system/telegram-bot.service
sudo systemctl daemon-reload
sudo systemctl restart telegram-bot.service
```

### 5. Обновлен deploy.sh

**Изменения:**
- ✅ Systemd сервис теперь использует `EnvironmentFile=$BOT_DIR/.env`
- ✅ Токен берется только из `.env` файла

## Итоговое решение

### Архитектура:

1. **Токен бота:**
   - Хранится в GitHub Secrets (`TELEGRAM_BOT_TOKEN`)
   - При деплое записывается в `.env` файл на сервере
   - Systemd сервис загружает токен через `EnvironmentFile`
   - `config.py` читает токен через `os.getenv('TELEGRAM_BOT_TOKEN')`

2. **Polling:**
   - Выполняется **только** ботом на сервере через `application.run_polling()`
   - `fix-bot.sh` **НЕ делает** `getUpdates` если сервис запущен
   - Фронтенд **НЕ делает** polling (полностью отключен)

3. **Диагностика:**
   - `fix-bot.sh` проверяет статус сервиса перед `getUpdates`
   - Если сервис запущен - использует только `getMe` и `getWebhookInfo`
   - После исправления перезапускает сервис и проверяет логи на ошибки 409

## Проверка после деплоя

После деплоя проверьте:

1. **Статус сервиса:**
   ```bash
   sudo systemctl status telegram-bot
   ```

2. **Логи на ошибки 409:**
   ```bash
   sudo journalctl -u telegram-bot -n 50 | grep -i "409\|conflict"
   ```
   Должно быть пусто.

3. **Проверка getUpdates (только если сервис остановлен):**
   ```bash
   sudo systemctl stop telegram-bot
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates?timeout=1"
   sudo systemctl start telegram-bot
   ```

4. **Отправка команды боту:**
   - Отправьте `/start` боту в Telegram
   - Проверьте логи: `sudo journalctl -u telegram-bot -f`
   - Должны появиться сообщения `[UPDATE]` без ошибок 409

## Результат

✅ **Конфликт 409 устранен:**
- Только один экземпляр polling (бот на сервере)
- `fix-bot.sh` не конфликтует с polling
- Токен управляется через GitHub Secrets
- Systemd сервис правильно настроен с `EnvironmentFile`

## Важные замечания

1. **Никогда не делайте `getUpdates` если сервис запущен** - это вызовет конфликт 409
2. **Токен должен быть только в `.env` файле** - не хардкодите его в коде
3. **После изменения `.env` перезапустите сервис:** `sudo systemctl restart telegram-bot`
4. **После изменения systemd сервиса:** `sudo systemctl daemon-reload`
