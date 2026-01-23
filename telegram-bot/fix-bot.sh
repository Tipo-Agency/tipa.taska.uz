#!/bin/bash
# Комплексный скрипт для диагностики и исправления проблем с Telegram ботом

set -e

BOT_DIR="/var/www/tipa.taska.uz/telegram-bot"
SERVICE_NAME="telegram-bot"
BOT_TOKEN="8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c"

echo "🔍 ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ПРОБЛЕМ С TELEGRAM БОТОМ"
echo "=================================================="
echo ""

# Функция для проверки статуса
check_status() {
    echo "📊 ТЕКУЩИЙ СТАТУС:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 1. Статус systemd сервиса
    echo "1️⃣ Systemd сервис:"
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        echo "   ✅ Сервис активен"
    else
        echo "   ❌ Сервис НЕ активен"
    fi
    
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        echo "   ✅ Сервис включен в автозагрузку"
    else
        echo "   ⚠️ Сервис НЕ включен в автозагрузку"
    fi
    
    # 2. Запущенные процессы
    echo ""
    echo "2️⃣ Запущенные процессы:"
    PROCESSES=$(ps aux | grep "python.*bot.py" | grep -v grep || echo "")
    PROCESS_COUNT=$(echo "$PROCESSES" | grep -c "python.*bot.py" || echo "0")
    
    if [ "$PROCESS_COUNT" -eq 0 ]; then
        echo "   ❌ Нет запущенных процессов бота"
    elif [ "$PROCESS_COUNT" -eq 1 ]; then
        echo "   ✅ Запущен 1 процесс (правильно)"
        echo "$PROCESSES" | awk '{print "   PID:", $2, "User:", $1, "Time:", $10}'
    else
        echo "   ❌ Запущено $PROCESS_COUNT процессов (должен быть 1!)"
        echo "$PROCESSES" | awk '{print "   PID:", $2, "User:", $1}'
    fi
    
    # Дополнительная проверка: все процессы Python
    echo ""
    echo "   🔍 Все процессы Python (для диагностики):"
    ALL_PYTHON=$(ps aux | grep python | grep -v grep | grep -v "grep python" || echo "")
    if [ -n "$ALL_PYTHON" ]; then
        echo "$ALL_PYTHON" | head -10 | awk '{print "   PID:", $2, "CMD:", substr($0, index($0,$11))}'
    else
        echo "   (нет процессов Python)"
    fi
    
    # Проверка systemd сервисов
    echo ""
    echo "   🔍 Systemd сервисы с 'bot' в имени:"
    systemctl list-units --type=service | grep -i bot || echo "   (нет других сервисов с 'bot')"
    
    # 3. Версия кода
    echo ""
    echo "3️⃣ Версия кода:"
    if [ -f "$BOT_DIR/bot.py" ]; then
        CODE_VERSION=$(grep -o "CODE_VERSION_AT_START = \"[^\"]*\"" "$BOT_DIR/bot.py" 2>/dev/null | head -1 | cut -d'"' -f2 || echo "NOT FOUND")
        if [ "$CODE_VERSION" != "NOT FOUND" ]; then
            echo "   ✅ Версия в коде: $CODE_VERSION"
        else
            echo "   ⚠️ Версия не найдена в коде"
        fi
    else
        echo "   ❌ Файл bot.py не найден!"
    fi
    
    # 4. Подключение к Telegram API
    echo ""
    echo "4️⃣ Подключение к Telegram API:"
    GETME_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" 2>/dev/null || echo "")
    if echo "$GETME_RESPONSE" | grep -q '"ok":true'; then
        echo "   ✅ getMe: OK"
        BOT_USERNAME=$(echo "$GETME_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['username'])" 2>/dev/null || echo "unknown")
        echo "   Bot username: @$BOT_USERNAME"
    else
        echo "   ❌ getMe: FAILED"
        echo "   Response: $(echo "$GETME_RESPONSE" | head -3)"
    fi
    
    # 5. Проверка getUpdates (409 ошибка)
    echo ""
    echo "5️⃣ Проверка getUpdates:"
    GETUPDATES_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=1" 2>/dev/null || echo "")
    if echo "$GETUPDATES_RESPONSE" | grep -q '"ok":true'; then
        echo "   ✅ getUpdates: OK (нет ошибки 409)"
        UPDATE_COUNT=$(echo "$GETUPDATES_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('result', [])))" 2>/dev/null || echo "0")
        echo "   Обновлений в очереди: $UPDATE_COUNT"
    elif echo "$GETUPDATES_RESPONSE" | grep -q "409"; then
        echo "   ❌ getUpdates: 409 CONFLICT ERROR!"
        echo "   Это означает, что запущено несколько экземпляров бота!"
    else
        echo "   ⚠️ getUpdates: Неожиданный ответ"
        echo "   Response: $(echo "$GETUPDATES_RESPONSE" | head -3)"
    fi
    
    # 6. Логи (последние 10 строк)
    echo ""
    echo "6️⃣ Последние логи:"
    sudo journalctl -u "$SERVICE_NAME" -n 10 --no-pager 2>/dev/null | tail -5 || echo "   Не удалось получить логи"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Функция для исправления проблем
fix_issues() {
    echo ""
    echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМ:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 1. Остановка всех процессов
    echo "1️⃣ Остановка всех процессов бота..."
    sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    sleep 5  # Увеличено время ожидания
    
    # Убиваем все процессы Python с bot.py
    ALL_PIDS=$(pgrep -f "python.*bot.py" 2>/dev/null || echo "")
    if [ -n "$ALL_PIDS" ]; then
        echo "   Найдено процессов: $(echo "$ALL_PIDS" | wc -w)"
        for PID in $ALL_PIDS; do
            echo "   Убиваем PID: $PID"
            sudo kill -9 "$PID" 2>/dev/null || true
        done
        sleep 3
    else
        echo "   ✅ Процессы не найдены"
    fi
    
    # Дополнительно: убиваем все процессы Python, которые могут быть ботом
    echo "   🔍 Проверяем все процессы Python на наличие bot.py..."
    ALL_PYTHON_PIDS=$(ps aux | grep python | grep -v grep | awk '{print $2}' || echo "")
    for PID in $ALL_PYTHON_PIDS; do
        CMD=$(ps -p "$PID" -o cmd= 2>/dev/null || echo "")
        if echo "$CMD" | grep -q "bot.py"; then
            echo "   Найден процесс с bot.py: PID $PID, убиваем..."
            sudo kill -9 "$PID" 2>/dev/null || true
        fi
    done
    sleep 2
    
    # Дополнительно: проверяем и останавливаем tipa.uz.backend (может вызывать конфликт)
    echo ""
    echo "   🔍 Проверяем tipa.uz.backend (может вызывать конфликт)..."
    TIPA_BACKEND_PIDS=$(ps aux | grep "tipa.uz.backend" | grep -v grep | awk '{print $2}' || echo "")
    if [ -n "$TIPA_BACKEND_PIDS" ]; then
        echo "   ⚠️ Найдены процессы tipa.uz.backend: $TIPA_BACKEND_PIDS"
        echo "   Останавливаем их (бэкенд больше не используется)..."
        for PID in $TIPA_BACKEND_PIDS; do
            CMD=$(ps -p "$PID" -o cmd= 2>/dev/null || echo "")
            echo "   Убиваем PID $PID: $CMD"
            sudo kill -9 "$PID" 2>/dev/null || true
        done
        sleep 2
    else
        echo "   ✅ Процессы tipa.uz.backend не найдены"
    fi
    
    # Финальная проверка
    REMAINING=$(pgrep -f "python.*bot.py" 2>/dev/null || echo "")
    if [ -n "$REMAINING" ]; then
        echo "   ⚠️ Остались процессы, принудительно убиваем..."
        for PID in $REMAINING; do
            sudo kill -9 "$PID" 2>/dev/null || true
        done
        sleep 2
    fi
    
    # 2. Очистка кэша Python
    echo ""
    echo "2️⃣ Очистка кэша Python..."
    cd "$BOT_DIR" || exit 1
    find . -type d -name "__pycache__" -exec sudo rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    find . -type f -name "*.pyo" -delete 2>/dev/null || true
    if [ -d "venv" ]; then
        find venv -type d -name "__pycache__" -exec sudo rm -rf {} + 2>/dev/null || true
        find venv -type f -name "*.pyc" -delete 2>/dev/null || true
    fi
    echo "   ✅ Кэш очищен"
    
    # 3. Проверка .env файла
    echo ""
    echo "3️⃣ Проверка .env файла..."
    if [ -f "$BOT_DIR/.env" ]; then
        if grep -q "TELEGRAM_BOT_TOKEN=$BOT_TOKEN" "$BOT_DIR/.env"; then
            echo "   ✅ Токен бота найден в .env"
        else
            echo "   ⚠️ Токен бота не найден или неверный"
            echo "   Проверьте файл: $BOT_DIR/.env"
        fi
    else
        echo "   ❌ Файл .env не найден!"
        echo "   Создайте файл $BOT_DIR/.env с содержимым:"
        echo "   TELEGRAM_BOT_TOKEN=$BOT_TOKEN"
    fi
    
    # 4. Проверка прав доступа
    echo ""
    echo "4️⃣ Проверка прав доступа..."
    DEPLOY_USER=$(stat -c '%U' "$BOT_DIR" 2>/dev/null || stat -f '%Su' "$BOT_DIR" 2>/dev/null || echo "unknown")
    echo "   Владелец директории: $DEPLOY_USER"
    
    # 5. Очистка очереди Telegram (ВАЖНО!)
    echo ""
    echo "5️⃣ Очистка очереди обновлений Telegram..."
    echo "   Отправляем getUpdates с offset=-1 для очистки..."
    CLEAR_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1" 2>/dev/null || echo "")
    if echo "$CLEAR_RESPONSE" | grep -q '"ok":true'; then
        echo "   ✅ Очередь очищена"
    else
        echo "   ⚠️ Не удалось очистить очередь: $(echo "$CLEAR_RESPONSE" | head -3)"
    fi
    sleep 2
    
    # 6. Запуск бота
    echo ""
    echo "6️⃣ Запуск бота..."
    sudo systemctl start "$SERVICE_NAME"
    sleep 7  # Увеличено время ожидания для полной инициализации
    
    # 7. Проверка после запуска
    echo ""
    echo "7️⃣ Проверка после запуска..."
    RUNNING_COUNT=$(ps aux | grep "python.*bot.py" | grep -v grep | wc -l || echo "0")
    if [ "$RUNNING_COUNT" -eq 1 ]; then
        echo "   ✅ Запущен один процесс (правильно)"
    elif [ "$RUNNING_COUNT" -gt 1 ]; then
        echo "   ❌ Запущено $RUNNING_COUNT процессов (должен быть 1!)"
        echo "   Повторите исправление"
    else
        echo "   ❌ Процесс не запущен!"
        echo "   Проверьте логи: sudo journalctl -u $SERVICE_NAME -n 50"
    fi
    
    # 7. Проверка подключения к Telegram
    echo ""
    echo "7️⃣ Проверка подключения к Telegram API..."
    sleep 3
    GETUPDATES_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=1" 2>/dev/null || echo "")
    if echo "$GETUPDATES_RESPONSE" | grep -q '"ok":true'; then
        echo "   ✅ getUpdates: OK (нет ошибки 409)"
    elif echo "$GETUPDATES_RESPONSE" | grep -q "409"; then
        echo "   ❌ getUpdates: 409 CONFLICT ERROR!"
        echo "   Все еще есть несколько экземпляров бота"
        echo ""
        echo "   🔍 Возможные причины:"
        echo "   1. Другой бот с тем же токеном запущен на другом сервере"
        echo "   2. Бот запущен локально на вашем компьютере"
        echo "   3. Есть скрытый процесс, который не виден через ps"
        echo ""
        echo "   💡 Решение:"
        echo "   1. Проверьте, нет ли других серверов/компьютеров с этим ботом"
        echo "   2. Проверьте cron jobs: crontab -l"
        echo "   3. Проверьте все systemd сервисы: systemctl list-units --type=service | grep bot"
        echo "   4. Попробуйте еще раз через минуту: sudo ./fix-bot.sh"
    else
        echo "   ⚠️ getUpdates: Неожиданный ответ"
    fi
    
    # 9. Проверка логов на наличие ошибок Conflict
    echo ""
    echo "9️⃣ Проверка логов на ошибки Conflict..."
    sleep 3
    CONFLICT_IN_LOGS=$(sudo journalctl -u "$SERVICE_NAME" -n 50 --no-pager 2>/dev/null | grep -i "conflict" | tail -3 || echo "")
    if [ -n "$CONFLICT_IN_LOGS" ]; then
        echo "   ⚠️ Найдены ошибки Conflict в логах:"
        echo "$CONFLICT_IN_LOGS" | sed 's/^/   /'
        echo ""
        echo "   💡 Это означает, что где-то еще есть экземпляр бота"
        echo ""
        echo "   🔍 ВОЗМОЖНЫЕ ПРИЧИНЫ:"
        echo "   1. Бот запущен на другом сервере/компьютере с тем же токеном"
        echo "   2. Бот запущен локально на вашем компьютере"
        echo "   3. Есть старые обновления в очереди Telegram"
        echo ""
        echo "   💡 РЕШЕНИЯ:"
        echo "   1. Проверьте, нет ли бота на других серверах:"
        echo "      - Другие серверы с этим проектом"
        echo "      - Локальный компьютер (ps aux | grep bot.py)"
        echo "   2. Если бот запущен в другом месте - остановите его"
        echo "   3. Если проблема сохраняется - создайте новый токен в BotFather"
    else
        echo "   ✅ Ошибок Conflict в последних логах нет"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Основная логика
cd "$BOT_DIR" || { echo "❌ Не удалось перейти в директорию $BOT_DIR"; exit 1; }

# Показываем текущий статус
check_status

# Спрашиваем, нужно ли исправлять
echo ""
read -p "Исправить проблемы? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    fix_issues
    
    echo ""
    echo "✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Отправьте /start боту в Telegram"
    echo "2. Следите за логами: sudo journalctl -u $SERVICE_NAME -f"
    echo "3. В логах должны появиться сообщения [UPDATE] при отправке /start"
    echo ""
    echo "Если бот все еще не работает, проверьте:"
    echo "- Не заблокирован ли бот в Telegram"
    echo "- Правильный ли токен в .env файле"
    echo "- Есть ли доступ к интернету с сервера"
else
    echo ""
    echo "Исправление пропущено. Для ручного исправления выполните:"
    echo "  sudo ./fix-bot.sh"
fi
