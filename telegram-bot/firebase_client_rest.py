"""
Клиент для работы с Firebase Firestore через REST API (без credentials)
"""
import requests
from typing import List, Dict, Any, Optional
import config

# Firebase REST API конфигурация
FIREBASE_API_KEY = config.FIREBASE_API_KEY
FIREBASE_PROJECT_ID = config.FIREBASE_PROJECT_ID or "tipa-task-manager"
FIREBASE_DATABASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

if not FIREBASE_API_KEY:
    print("[Firebase REST] WARNING: FIREBASE_API_KEY not set in .env file!")
    print("[Firebase REST] Please add FIREBASE_API_KEY to your .env file.")
    print("[Firebase REST] You can find it in Firebase Console -> Project Settings -> General -> Web API Key")

def _convert_firestore_value(value: Any) -> Any:
    """Конвертировать значение из формата Firestore REST API в обычный Python тип"""
    if isinstance(value, dict):
        if 'stringValue' in value:
            return value['stringValue']
        elif 'integerValue' in value:
            return int(value['integerValue'])
        elif 'doubleValue' in value:
            return float(value['doubleValue'])
        elif 'booleanValue' in value:
            return value['booleanValue']
        elif 'timestampValue' in value:
            return value['timestampValue']
        elif 'arrayValue' in value:
            return [_convert_firestore_value(v) for v in value['arrayValue'].get('values', [])]
        elif 'mapValue' in value:
            return {k: _convert_firestore_value(v) for k, v in value['mapValue'].get('fields', {}).items()}
        elif 'nullValue' in value:
            return None
    return value

def _convert_to_firestore_value(value: Any) -> Dict[str, Any]:
    """Конвертировать значение в формат Firestore REST API"""
    if value is None:
        return {'nullValue': None}
    elif isinstance(value, bool):
        return {'booleanValue': value}
    elif isinstance(value, int):
        return {'integerValue': str(value)}
    elif isinstance(value, float):
        return {'doubleValue': value}
    elif isinstance(value, str):
        return {'stringValue': value}
    elif isinstance(value, list):
        return {'arrayValue': {'values': [_convert_to_firestore_value(v) for v in value]}}
    elif isinstance(value, dict):
        return {'mapValue': {'fields': {k: _convert_to_firestore_value(v) for k, v in value.items()}}}
    else:
        return {'stringValue': str(value)}

class FirebaseClient:
    """Клиент для работы с Firebase Firestore через REST API"""
    
    @staticmethod
    def get_all(collection_name: str) -> List[Dict[str, Any]]:
        """Получить все документы из коллекции"""
        try:
            url = f"{FIREBASE_DATABASE_URL}/{collection_name}"
            params = {'key': FIREBASE_API_KEY}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                print(f"Error getting all from {collection_name}: HTTP {response.status_code}, Response: {response.text[:200]}")
                return []
            
            data = response.json()
            items = []
            
            if 'documents' in data:
                for doc in data['documents']:
                    # Извлекаем ID из пути документа
                    doc_path = doc.get('name', '')
                    doc_id = doc_path.split('/')[-1] if '/' in doc_path else doc_path
                    
                    # Конвертируем поля
                    fields = doc.get('fields', {})
                    item = {}
                    for k, v in fields.items():
                        item[k] = _convert_firestore_value(v)
                    item['id'] = doc_id
                    items.append(item)
            
            return items
        except Exception as e:
            print(f"Error getting all from {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def get_by_id(collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Получить документ по ID"""
        try:
            url = f"{FIREBASE_DATABASE_URL}/{collection_name}/{doc_id}"
            params = {'key': FIREBASE_API_KEY}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 404:
                return None
            
            if response.status_code != 200:
                print(f"Error getting {doc_id} from {collection_name}: HTTP {response.status_code}, Response: {response.text[:200]}")
                return None
            
            doc = response.json()
            fields = doc.get('fields', {})
            item = {}
            for k, v in fields.items():
                item[k] = _convert_firestore_value(v)
            item['id'] = doc_id
            return item
        except Exception as e:
            print(f"Error getting {doc_id} from {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def save(collection_name: str, item: Dict[str, Any]) -> bool:
        """Сохранить документ (создать или обновить)"""
        try:
            doc_id = item.get('id')
            if not doc_id:
                # Для создания нового документа нужно использовать POST
                # Но проще использовать случайный ID
                import random
                import string
                doc_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))
                item['id'] = doc_id
            
            # Удаляем id из данных перед сохранением
            data = {k: v for k, v in item.items() if k != 'id'}
            
            # Конвертируем данные в формат Firestore
            fields = {k: _convert_to_firestore_value(v) for k, v in data.items()}
            
            url = f"{FIREBASE_DATABASE_URL}/{collection_name}/{doc_id}"
            params = {'key': FIREBASE_API_KEY}
            payload = {'fields': fields}
            
            # Используем PATCH для обновления (merge=True)
            response = requests.patch(url, json=payload, params=params, timeout=10)
            
            if response.status_code not in [200, 201]:
                print(f"Error saving to {collection_name}: HTTP {response.status_code}, Response: {response.text[:200]}")
                return False
            
            return True
        except Exception as e:
            print(f"Error saving to {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def delete(collection_name: str, doc_id: str) -> bool:
        """Удалить документ"""
        try:
            url = f"{FIREBASE_DATABASE_URL}/{collection_name}/{doc_id}"
            params = {'key': FIREBASE_API_KEY}
            response = requests.delete(url, params=params, timeout=10)
            
            if response.status_code not in [200, 204]:
                print(f"Error deleting {doc_id} from {collection_name}: HTTP {response.status_code}, Response: {response.text[:200]}")
                return False
            
            return True
        except Exception as e:
            print(f"Error deleting {doc_id} from {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def query(collection_name: str, filters: List[tuple]) -> List[Dict[str, Any]]:
        """Выполнить запрос с фильтрами"""
        # REST API для запросов сложнее, пока возвращаем все и фильтруем локально
        try:
            all_items = FirebaseClient.get_all(collection_name)
            return all_items
        except Exception as e:
            print(f"Error querying {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            return []

# Создаем экземпляр клиента
firebase = FirebaseClient()
