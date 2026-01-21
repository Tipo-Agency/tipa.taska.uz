#!/bin/bash
# Скрипт для деплоя Telegram бота
# Использование: sudo ./deploy.sh
# Примечание: Код уже обновлен через git в основном workflow, этот скрипт только устанавливает зависимости и перезапускает сервис

# Не завершаем при ошибках в некоторых местах (чтобы не блокировать деплой фронтенда)
set +e

BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$BOT_DIR/venv"
SERVICE_NAME="telegram-bot"

echo "🚀 Starting Telegram bot deployment..."
echo "📁 Bot directory: $BOT_DIR"

# Проверяем наличие Python
set -e
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
set +e

# Создаем виртуальное окружение если его нет
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Активируем виртуальное окружение
echo "🔧 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Обновляем pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Устанавливаем зависимости
echo "📥 Installing dependencies..."
pip install -r "$BOT_DIR/requirements.txt"

# Проверяем наличие .env файла
if [ ! -f "$BOT_DIR/.env" ]; then
    echo "⚠️ Warning: .env file not found. Creating from .env.example..."
    if [ -f "$BOT_DIR/.env.example" ]; then
        cp "$BOT_DIR/.env.example" "$BOT_DIR/.env"
        echo "⚠️ Please update .env file with your configuration!"
    else
        echo "❌ .env.example not found. Please create .env manually."
    fi
fi

# Останавливаем существующий сервис если он запущен
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "🛑 Stopping existing service..."
    sudo systemctl stop "$SERVICE_NAME" || true
    sleep 2  # Даем время сервису остановиться
fi

# Определяем пользователя для сервиса
# Приоритет:
# 1. DEPLOY_USER (передается из GitHub Actions)
# 2. SUDO_USER (если запущено через sudo)
# 3. Владелец директории проекта
# 4. Текущий пользователь
SERVICE_USER=""
if [ -n "$DEPLOY_USER" ]; then
    SERVICE_USER="$DEPLOY_USER"
    echo "📋 Using DEPLOY_USER: $SERVICE_USER"
elif [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
    SERVICE_USER="$SUDO_USER"
    echo "📋 Using SUDO_USER: $SERVICE_USER"
else
    # Пытаемся определить владельца директории проекта
    if command -v stat >/dev/null 2>&1; then
        if stat -c '%U' "$BOT_DIR/.." >/dev/null 2>&1; then
            SERVICE_USER=$(stat -c '%U' "$BOT_DIR/..")
        elif stat -f '%Su' "$BOT_DIR/.." >/dev/null 2>&1; then
            SERVICE_USER=$(stat -f '%Su' "$BOT_DIR/..")
        fi
    fi
    
    if [ -z "$SERVICE_USER" ] || [ "$SERVICE_USER" = "root" ]; then
        # Последняя попытка - текущий пользователь (если не root)
        if [ "$USER" != "root" ]; then
            SERVICE_USER="$USER"
        else
            SERVICE_USER="www-data"
        fi
    fi
    echo "📋 Detected service user: $SERVICE_USER"
fi

# Убеждаемся, что пользователь существует
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    echo "⚠️ Warning: User $SERVICE_USER does not exist, using www-data"
    SERVICE_USER="www-data"
fi

echo "✅ Service will run as user: $SERVICE_USER"

# Создаем systemd service файл
echo "📝 Creating/updating systemd service..."
sudo tee "/etc/systemd/system/$SERVICE_NAME.service" > /dev/null <<EOF
[Unit]
Description=Telegram Bot for Task Management System
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$BOT_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/python $BOT_DIR/bot.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Включаем сервис
echo "✅ Enabling service..."
sudo systemctl enable "$SERVICE_NAME"

# Запускаем сервис
echo "🚀 Starting service..."
sudo systemctl start "$SERVICE_NAME"

# Проверяем статус
sleep 3
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Telegram bot deployed and running successfully!"
    echo "📊 Service status:"
    sudo systemctl status "$SERVICE_NAME" --no-pager -l | head -15 || true
    echo ""
    echo "📝 Recent logs (last 10 lines):"
    sudo journalctl -u "$SERVICE_NAME" -n 10 --no-pager || true
else
    echo "⚠️ Service may not be running. Checking logs:"
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager || true
    echo ""
    echo "💡 You may need to check the service manually:"
    echo "   sudo systemctl status $SERVICE_NAME"
    echo "   sudo journalctl -u $SERVICE_NAME -f"
    # Не завершаем с ошибкой, чтобы не блокировать деплой фронтенда
fi

echo ""
echo "✅ Telegram bot deployment script completed!"
