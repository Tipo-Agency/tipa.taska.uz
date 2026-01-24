#!/bin/bash
# Скрипт автоматического деплоя для GitHub Actions
# Использование: ./scripts/deploy.sh

set +e  # Не падаем на ошибках, обрабатываем их вручную

SERVER_PATH="${SERVER_PATH:-/var/www/tipa.taska.uz}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"

echo "🚀 Starting deployment..."
echo "👤 Deploy user: $USER"
echo "📁 Server path: $SERVER_PATH"

# Переходим в директорию проекта
cd "$SERVER_PATH" || { echo "❌ Failed to cd to $SERVER_PATH"; exit 1; }

# 1. Исправляем права на всю папку проекта
echo ""
echo "🔧 Step 1: Fixing ownership..."
sudo chown -R "$USER:$USER" "$SERVER_PATH" || true
sudo chmod -R u+rwX "$SERVER_PATH" || true
if [ -d "$SERVER_PATH/.git" ]; then
  sudo chown -R "$USER:$USER" "$SERVER_PATH/.git" || true
  sudo chmod -R u+rwX "$SERVER_PATH/.git" || true
fi
git config --global --add safe.directory "$SERVER_PATH" || true
echo "✅ Ownership fixed"

# 2. Обновляем код
echo ""
echo "📥 Step 2: Updating code..."
git fetch origin || { echo "⚠️ git fetch failed, but continuing..."; }
git reset --hard origin/main || { echo "⚠️ git reset failed, but continuing..."; }
sudo chown -R "$USER:$USER" "$SERVER_PATH" || true
echo "✅ Code updated"

# 3. Деплой фронтенда
echo ""
echo "🚀 Step 3: Deploying frontend..."
npm ci || { echo "❌ npm ci failed"; exit 1; }
npm run build || { echo "❌ npm build failed"; exit 1; }
echo "✅ Frontend deployed"

# 4. Деплой Telegram бота
echo ""
echo "🤖 Step 4: Deploying Telegram bot..."
if [ -d "telegram-bot" ]; then
  cd telegram-bot || { echo "❌ Failed to cd to telegram-bot"; exit 1; }
  
  # Исправляем права
  sudo chown -R "$USER:$USER" "$(pwd)" || true
  sudo chmod -R u+rwX "$(pwd)" || true
  
  # Обновляем .env с токеном
  if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo "🔐 Updating .env file..."
    if [ ! -f ".env" ]; then
      touch .env
    fi
    if grep -q "^TELEGRAM_BOT_TOKEN=" .env; then
      sed -i "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN|" .env
    else
      echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN" >> .env
    fi
    sudo chown "$USER:$USER" .env || true
    chmod 600 .env || true
    echo "✅ .env updated"
  fi
  
  # Обновляем systemd сервис
  echo "🔧 Updating systemd service..."
  if [ -f "telegram-bot.service" ]; then
    sudo cp telegram-bot.service /etc/systemd/system/telegram-bot.service
    sudo chmod 644 /etc/systemd/system/telegram-bot.service
    sudo systemctl daemon-reload
    echo "✅ Systemd service updated"
  else
    echo "⚠️ telegram-bot.service not found, skipping..."
  fi
  
  # Запускаем deploy.sh бота
  if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
    echo "📝 Running bot deploy.sh..."
    DEPLOY_USER="$USER" sudo -E ./deploy.sh || {
      echo "⚠️ Bot deploy.sh exited with error, but checking status..."
      if systemctl is-active --quiet telegram-bot 2>/dev/null; then
        echo "✅ Bot is actually running"
      else
        echo "❌ Bot is NOT running"
      fi
    }
  fi
  
  # Перезапускаем сервис
  echo "🔄 Restarting bot service..."
  sudo systemctl restart telegram-bot.service || echo "⚠️ Failed to restart service"
  sleep 3
  
  # Проверяем статус
  if systemctl is-active --quiet telegram-bot 2>/dev/null; then
    echo "✅ Telegram bot is running"
    # Проверяем на ошибки 409
    if sudo journalctl -u telegram-bot -n 20 --no-pager 2>/dev/null | grep -qi "409\|conflict"; then
      echo "   ⚠️ Found 409/Conflict errors in logs!"
    else
      echo "   ✅ No 409/Conflict errors"
    fi
  else
    echo "❌ Telegram bot is NOT running!"
    echo "📋 Recent logs:"
    sudo journalctl -u telegram-bot -n 10 --no-pager 2>/dev/null || true
  fi
  
  cd .. || true
else
  echo "⚠️ telegram-bot directory not found, skipping..."
fi

# 5. Перезагружаем nginx
echo ""
echo "🔄 Step 5: Reloading nginx..."
nginx -t || echo "⚠️ nginx config test failed"
systemctl reload nginx || echo "⚠️ nginx reload failed"

# Финальный статус
echo ""
echo "✅ Deployment completed!"
echo "📋 Final status:"
echo "   Frontend: ✅ Built"
if systemctl is-active --quiet telegram-bot 2>/dev/null; then
  echo "   Telegram bot: ✅ Running"
else
  echo "   Telegram bot: ⚠️ Not running"
fi
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo "   Nginx: ✅ Running"
else
  echo "   Nginx: ⚠️ Not running"
fi

exit 0
