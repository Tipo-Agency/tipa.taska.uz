"""
Клиент для работы с Firebase Firestore
Автоматически выбирает между REST API и Admin SDK в зависимости от наличия credentials
"""
import os
import config

# Проверяем, есть ли credentials файл
USE_ADMIN_SDK = config.FIREBASE_CREDENTIALS_PATH and os.path.exists(config.FIREBASE_CREDENTIALS_PATH)

if USE_ADMIN_SDK:
    # Используем Admin SDK
    from firebase_client_admin import FirebaseClient, firebase
    print("[Firebase] Using Admin SDK with service account")
else:
    # Используем REST API
    from firebase_client_rest import FirebaseClient, firebase
    print("[Firebase] Using REST API (no credentials file)")

# Экспортируем для использования в других модулях
__all__ = ['FirebaseClient', 'firebase']
