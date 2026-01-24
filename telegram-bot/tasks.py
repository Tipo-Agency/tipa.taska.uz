"""
Модуль работы с задачами
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from firebase_client import firebase
from utils import get_today_date, is_overdue

def get_user_tasks(user_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
    """Получить задачи пользователя"""
    try:
        all_tasks = firebase.get_all('tasks')
        user_tasks = []
        
        for task in all_tasks:
            if task.get('isArchived') and not include_archived:
                continue
            
            # Проверяем, назначена ли задача на пользователя
            if task.get('assigneeId') == user_id or user_id in task.get('assigneeIds', []):
                user_tasks.append(task)
        
        return user_tasks
    except Exception as e:
        print(f"Error getting user tasks: {e}")
        return []

def get_today_tasks(user_id: str) -> List[Dict[str, Any]]:
    """Получить задачи на сегодня"""
    today = get_today_date()
    user_tasks = get_user_tasks(user_id)
    
    today_tasks = []
    for task in user_tasks:
        if task.get('endDate') == today:
            # Исключаем выполненные задачи
            status = task.get('status', '')
            if status not in ['Выполнено', 'Done', 'Завершено']:
                today_tasks.append(task)
    
    return today_tasks

def get_overdue_tasks(user_id: str) -> List[Dict[str, Any]]:
    """Получить просроченные задачи"""
    user_tasks = get_user_tasks(user_id)
    
    overdue_tasks = []
    for task in user_tasks:
        if is_overdue(task.get('endDate', '')):
            # Исключаем выполненные задачи
            status = task.get('status', '')
            if status not in ['Выполнено', 'Done', 'Завершено']:
                overdue_tasks.append(task)
    
    return overdue_tasks

def get_yesterday_tasks() -> List[Dict[str, Any]]:
    """Получить задачи на вчера (не выполненные)"""
    try:
        from utils import get_today_date
        from datetime import datetime, timedelta
        import pytz
        
        tz = pytz.timezone('Asia/Tashkent')
        today = datetime.now(tz).date()
        yesterday = today - timedelta(days=1)
        yesterday_str = yesterday.isoformat()
        
        all_tasks = firebase.get_all('tasks')
        yesterday_tasks = []
        
        for task in all_tasks:
            if task.get('isArchived'):
                continue
            
            # Исключаем выполненные задачи
            status = task.get('status', '')
            if status in ['Выполнено', 'Done', 'Завершено']:
                continue
            
            end_date = task.get('endDate', '')
            if end_date == yesterday_str:
                yesterday_tasks.append(task)
        
        return yesterday_tasks
    except Exception as e:
        print(f"Error getting yesterday tasks: {e}")
        return []

def get_all_today_tasks() -> List[Dict[str, Any]]:
    """Получить все задачи на сегодня (не только для конкретного пользователя)"""
    try:
        from utils import get_today_date
        
        today = get_today_date()
        all_tasks = firebase.get_all('tasks')
        
        today_tasks = []
        for task in all_tasks:
            if task.get('isArchived'):
                continue
            
            # Исключаем выполненные задачи
            status = task.get('status', '')
            if status in ['Выполнено', 'Done', 'Завершено']:
                continue
            
            if task.get('endDate') == today:
                today_tasks.append(task)
        
        return today_tasks
    except Exception as e:
        print(f"Error getting all today tasks: {e}")
        return []

def get_all_overdue_tasks() -> List[Dict[str, Any]]:
    """Получить все просроченные задачи (не только для конкретного пользователя)"""
    try:
        all_tasks = firebase.get_all('tasks')
        
        overdue_tasks = []
        for task in all_tasks:
            if task.get('isArchived'):
                continue
            
            # Исключаем выполненные задачи
            status = task.get('status', '')
            if status in ['Выполнено', 'Done', 'Завершено']:
                continue
            
            if is_overdue(task.get('endDate', '')):
                overdue_tasks.append(task)
        
        return overdue_tasks
    except Exception as e:
        print(f"Error getting all overdue tasks: {e}")
        return []

def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
    """Получить задачу по ID"""
    return firebase.get_by_id('tasks', task_id)

def update_task_status(task_id: str, new_status: str) -> bool:
    """Обновить статус задачи"""
    try:
        task = firebase.get_by_id('tasks', task_id)
        if not task:
            return False
        
        task['status'] = new_status
        task['updatedAt'] = datetime.now().isoformat()
        firebase.save('tasks', task)
        return True
    except Exception as e:
        print(f"Error updating task status: {e}")
        return False

def create_task(task_data: Dict[str, Any]) -> Optional[str]:
    """Создать новую задачу"""
    try:
        now = datetime.now().isoformat()
        task_data['createdAt'] = task_data.get('createdAt', now)
        task_data['updatedAt'] = now
        task_data['isArchived'] = False
        
        # Генерируем ID если нет
        if not task_data.get('id'):
            task_data['id'] = f"task-{int(datetime.now().timestamp() * 1000)}"
        
        firebase.save('tasks', task_data)
        return task_data['id']
    except Exception as e:
        print(f"Error creating task: {e}")
        return None

def get_statuses() -> List[Dict[str, Any]]:
    """Получить список статусов"""
    try:
        return firebase.get_all('statuses')
    except Exception as e:
        print(f"Error getting statuses: {e}")
        return []
