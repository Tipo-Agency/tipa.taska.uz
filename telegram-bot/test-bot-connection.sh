#!/bin/bash
# Скрипт для проверки подключения бота к Telegram API

BOT_TOKEN="8348357222:AAHzzrWFOE7n3MiGYKgugqXbUSehTW1-D1c"

echo "🔍 Testing bot connection..."
echo ""

# Проверка getMe
echo "1. Testing getMe..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | python3 -m json.tool
echo ""

# Проверка getUpdates
echo "2. Testing getUpdates..."
RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")
echo "$RESPONSE" | python3 -m json.tool
echo ""

# Проверка количества обновлений
UPDATE_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('result', [])))")
echo "📊 Updates in queue: $UPDATE_COUNT"
echo ""

if [ "$UPDATE_COUNT" -gt 0 ]; then
    echo "✅ Bot is receiving updates!"
else
    echo "⚠️ No updates in queue. Try sending /start to the bot in Telegram."
fi
