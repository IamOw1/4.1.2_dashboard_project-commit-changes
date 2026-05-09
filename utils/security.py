"""
Модуль безопасности для COBA AI Drone Agent
"""
import hashlib
import hmac
import secrets
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from functools import wraps
import asyncio

from utils.logger import setup_logger

logger = setup_logger(__name__)


class APIKeyManager:
    """Управление API ключами"""
    
    def __init__(self):
        self.keys: Dict[str, Dict[str, Any]] = {}
        self.rate_limits: Dict[str, List[float]] = {}
        
    def generate_key(self, name: str, rate_limit: int = 100) -> str:
        """Сгенерировать новый API ключ"""
        key = secrets.token_urlsafe(32)
        self.keys[key] = {
            'name': name,
            'created_at': datetime.now().isoformat(),
            'rate_limit': rate_limit,
            'requests_count': 0,
            'active': True
        }
        self.rate_limits[key] = []
        logger.info(f"Сгенерирован API ключ для {name}")
        return key
    
    def validate_key(self, key: str) -> bool:
        """Проверить валидность ключа"""
        if key not in self.keys:
            return False
        return self.keys[key]['active']
    
    def revoke_key(self, key: str):
        """Отозвать ключ"""
        if key in self.keys:
            self.keys[key]['active'] = False
            logger.info(f"API ключ отозван: {self.keys[key]['name']}")
    
    def check_rate_limit(self, key: str, window: int = 60, max_requests: int = 100) -> bool:
        """Проверить rate limit"""
        if key not in self.rate_limits:
            return True
        
        now = time.time()
        # Очистка старых записей
        self.rate_limits[key] = [t for t in self.rate_limits[key] if now - t < window]
        
        if len(self.rate_limits[key]) >= max_requests:
            return False
        
        self.rate_limits[key].append(now)
        return True
    
    def get_key_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Получить информацию о ключе"""
        return self.keys.get(key)


class EncryptionManager:
    """Управление шифрованием"""
    
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        
    def hash_password(self, password: str) -> str:
        """Хешировать пароль"""
        salt = secrets.token_hex(16)
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return salt + pwdhash.hex()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Проверить пароль"""
        salt = hashed[:32]
        stored_hash = hashed[32:]
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return pwdhash.hex() == stored_hash
    
    def generate_hmac(self, data: str) -> str:
        """Сгенерировать HMAC"""
        return hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def verify_hmac(self, data: str, signature: str) -> bool:
        """Проверить HMAC"""
        expected = self.generate_hmac(data)
        return hmac.compare_digest(expected, signature)


class AuditLogger:
    """Логирование действий для аудита"""
    
    def __init__(self, log_file: str = "data/audit.log"):
        self.log_file = log_file
        
    def log(self, action: str, user: str, details: Dict[str, Any], success: bool = True):
        """Записать действие"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'user': user,
            'details': details,
            'success': success,
            'ip': details.get('ip', 'unknown')
        }
        
        try:
            with open(self.log_file, 'a') as f:
                f.write(f"{entry}\n")
        except Exception as e:
            logger.error(f"Ошибка записи в audit log: {e}")
    
    def get_logs(self, start_time: Optional[datetime] = None, 
                 end_time: Optional[datetime] = None,
                 user: Optional[str] = None,
                 action: Optional[str] = None) -> List[Dict]:
        """Получить логи с фильтрацией"""
        logs = []
        
        try:
            with open(self.log_file, 'r') as f:
                for line in f:
                    try:
                        entry = eval(line.strip())
                        
                        # Фильтрация
                        if start_time and datetime.fromisoformat(entry['timestamp']) < start_time:
                            continue
                        if end_time and datetime.fromisoformat(entry['timestamp']) > end_time:
                            continue
                        if user and entry['user'] != user:
                            continue
                        if action and entry['action'] != action:
                            continue
                        
                        logs.append(entry)
                    except:
                        continue
        except FileNotFoundError:
            pass
        
        return logs


class AccessControl:
    """Контроль доступа на основе ролей"""
    
    def __init__(self):
        self.roles = {
            'admin': ['*'],  # Все разрешения
            'operator': [
                'mission:start',
                'mission:stop',
                'command:send',
                'telemetry:read'
            ],
            'viewer': [
                'telemetry:read',
                'mission:read'
            ]
        }
        self.user_roles: Dict[str, str] = {}
        
    def assign_role(self, user: str, role: str):
        """Назначить роль пользователю"""
        if role in self.roles:
            self.user_roles[user] = role
            logger.info(f"Пользователю {user} назначена роль {role}")
    
    def check_permission(self, user: str, permission: str) -> bool:
        """Проверить разрешение"""
        role = self.user_roles.get(user, 'viewer')
        permissions = self.roles.get(role, [])
        return '*' in permissions or permission in permissions


class SecurityManager:
    """Главный менеджер безопасности"""
    
    def __init__(self, secret_key: Optional[str] = None):
        self.api_key_manager = APIKeyManager()
        self.encryption_manager = EncryptionManager(secret_key)
        self.audit_logger = AuditLogger()
        self.access_control = AccessControl()
        
        # Настройки
        self.max_login_attempts = 5
        self.lockout_duration = 300  # 5 минут
        self.failed_attempts: Dict[str, List[float]] = {}
        
    def is_locked_out(self, identifier: str) -> bool:
        """Проверить, заблокирован ли пользователь"""
        if identifier not in self.failed_attempts:
            return False
        
        now = time.time()
        # Очистка старых попыток
        self.failed_attempts[identifier] = [
            t for t in self.failed_attempts[identifier] 
            if now - t < self.lockout_duration
        ]
        
        return len(self.failed_attempts[identifier]) >= self.max_login_attempts
    
    def record_failed_attempt(self, identifier: str):
        """Записать неудачную попытку"""
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = []
        self.failed_attempts[identifier].append(time.time())
        
        if len(self.failed_attempts[identifier]) >= self.max_login_attempts:
            logger.warning(f"Пользователь {identifier} заблокирован на {self.lockout_duration} секунд")
    
    def clear_failed_attempts(self, identifier: str):
        """Очистить неудачные попытки"""
        if identifier in self.failed_attempts:
            del self.failed_attempts[identifier]
    
    def require_auth(self, permission: str = None):
        """Декоратор для требования аутентификации"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Проверка аутентификации
                user = kwargs.get('user')
                api_key = kwargs.get('api_key')
                
                if not user or not api_key:
                    raise PermissionError("Требуется аутентификация")
                
                if not self.api_key_manager.validate_key(api_key):
                    raise PermissionError("Недействительный API ключ")
                
                # Проверка rate limit
                if not self.api_key_manager.check_rate_limit(api_key):
                    raise PermissionError("Превышен rate limit")
                
                # Проверка разрешения
                if permission and not self.access_control.check_permission(user, permission):
                    raise PermissionError(f"Недостаточно прав для {permission}")
                
                # Логирование
                self.audit_logger.log(
                    action=func.__name__,
                    user=user,
                    details={'args': str(args), 'kwargs': str(kwargs)}
                )
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# Глобальный экземпляр
security_manager = SecurityManager()
