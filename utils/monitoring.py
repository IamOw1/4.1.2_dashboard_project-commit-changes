"""
Модуль мониторинга и аналитики для COBA AI Drone Agent
"""
import time
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import numpy as np

from utils.logger import setup_logger

logger = setup_logger(__name__)


class PerformanceMonitor:
    """Мониторинг производительности системы"""
    
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.metrics = {
            'response_time': deque(maxlen=window_size),
            'cpu_usage': deque(maxlen=window_size),
            'memory_usage': deque(maxlen=window_size),
            'throughput': deque(maxlen=window_size)
        }
        self.start_times = {}
        
    def start_timer(self, operation_id: str):
        """Начать таймер для операции"""
        self.start_times[operation_id] = time.time()
    
    def end_timer(self, operation_id: str) -> float:
        """Завершить таймер и записать метрику"""
        if operation_id in self.start_times:
            elapsed = time.time() - self.start_times[operation_id]
            self.metrics['response_time'].append(elapsed)
            del self.start_times[operation_id]
            return elapsed
        return 0.0
    
    def record_cpu_usage(self, usage: float):
        """Записать использование CPU"""
        self.metrics['cpu_usage'].append(usage)
    
    def record_memory_usage(self, usage: float):
        """Записать использование памяти"""
        self.metrics['memory_usage'].append(usage)
    
    def record_throughput(self, count: int):
        """Записать пропускную способность"""
        self.metrics['throughput'].append(count)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Получить статистику метрик"""
        stats = {}
        for metric_name, values in self.metrics.items():
            if values:
                stats[metric_name] = {
                    'mean': np.mean(values),
                    'std': np.std(values),
                    'min': np.min(values),
                    'max': np.max(values),
                    'count': len(values)
                }
        return stats
    
    def get_recent_metrics(self, n: int = 10) -> Dict[str, List]:
        """Получить последние n метрик"""
        return {
            name: list(values)[-n:] 
            for name, values in self.metrics.items()
        }


class AnomalyDetector:
    """Детектор аномалий в данных телеметрии"""
    
    def __init__(self, threshold: float = 3.0):
        self.threshold = threshold
        self.baseline_stats = {}
        self.history = deque(maxlen=1000)
        
    def update_baseline(self, data: Dict[str, float]):
        """Обновить базовую статистику"""
        for key, value in data.items():
            if key not in self.baseline_stats:
                self.baseline_stats[key] = {'values': deque(maxlen=100)}
            self.baseline_stats[key]['values'].append(value)
            
            # Пересчитать статистику
            values = list(self.baseline_stats[key]['values'])
            self.baseline_stats[key]['mean'] = np.mean(values)
            self.baseline_stats[key]['std'] = np.std(values) if len(values) > 1 else 1.0
    
    def detect_anomalies(self, data: Dict[str, float]) -> List[Dict[str, Any]]:
        """Обнаружить аномалии в данных"""
        anomalies = []
        
        for key, value in data.items():
            if key in self.baseline_stats:
                baseline = self.baseline_stats[key]
                mean = baseline['mean']
                std = baseline['std'] if baseline['std'] > 0 else 1.0
                
                z_score = abs(value - mean) / std
                
                if z_score > self.threshold:
                    anomalies.append({
                        'parameter': key,
                        'value': value,
                        'expected': mean,
                        'deviation': z_score,
                        'severity': 'high' if z_score > self.threshold * 2 else 'medium',
                        'timestamp': datetime.now().isoformat()
                    })
        
        self.history.append({
            'timestamp': datetime.now().isoformat(),
            'data': data,
            'anomalies': anomalies
        })
        
        return anomalies
    
    def get_anomaly_history(self, limit: int = 100) -> List[Dict]:
        """Получить историю аномалий"""
        return list(self.history)[-limit:]


class EnergyMonitor:
    """Мониторинг энергопотребления"""
    
    def __init__(self):
        self.energy_log = deque(maxlen=1000)
        self.current_consumption = 0.0
        self.total_consumed = 0.0
        
    def record_consumption(self, power: float, duration: float):
        """Записать потребление энергии"""
        energy = power * duration
        self.current_consumption = power
        self.total_consumed += energy
        
        self.energy_log.append({
            'timestamp': datetime.now().isoformat(),
            'power': power,
            'duration': duration,
            'energy': energy
        })
    
    def estimate_remaining_time(self, battery_percent: float) -> float:
        """Оценить оставшееся время полета"""
        if self.current_consumption > 0:
            # Предполагаем линейный разряд
            remaining_energy = battery_percent / 100.0 * 100  # Wh
            return remaining_energy / self.current_consumption * 3600  # секунд
        return 0.0
    
    def get_efficiency_metrics(self) -> Dict[str, float]:
        """Получить метрики эффективности"""
        if len(self.energy_log) < 2:
            return {}
        
        recent = list(self.energy_log)[-100:]
        powers = [e['power'] for e in recent]
        
        return {
            'average_power': np.mean(powers),
            'peak_power': np.max(powers),
            'total_consumed': self.total_consumed,
            'efficiency_trend': 'improving' if np.mean(powers[-10:]) < np.mean(powers[:10]) else 'degrading'
        }


class SystemHealthMonitor:
    """Мониторинг здоровья системы"""
    
    def __init__(self):
        self.health_checks = {}
        self.status_history = deque(maxlen=100)
        self.current_status = 'healthy'
        
    def register_health_check(self, name: str, check_func):
        """Зарегистрировать проверку здоровья"""
        self.health_checks[name] = check_func
        
    async def run_health_checks(self) -> Dict[str, Any]:
        """Выполнить все проверки здоровья"""
        results = {}
        overall_status = 'healthy'
        
        for name, check_func in self.health_checks.items():
            try:
                result = await check_func()
                results[name] = {
                    'status': 'pass' if result else 'fail',
                    'healthy': result
                }
                
                if not result:
                    overall_status = 'unhealthy'
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'error': str(e)
                }
                overall_status = 'unhealthy'
        
        self.current_status = overall_status
        self.status_history.append({
            'timestamp': datetime.now().isoformat(),
            'status': overall_status,
            'checks': results
        })
        
        return {
            'overall_status': overall_status,
            'checks': results
        }
    
    def get_health_history(self, limit: int = 100) -> List[Dict]:
        """Получить историю состояния здоровья"""
        return list(self.status_history)[-limit:]


class MetricsCollector:
    """Сборщик метрик системы"""
    
    def __init__(self, storage_path: str = "data/metrics.json"):
        self.storage_path = storage_path
        self.metrics = {
            'missions': {'completed': 0, 'failed': 0, 'total': 0},
            'commands': {'sent': 0, 'successful': 0, 'failed': 0},
            'telemetry': {'updates': 0, 'errors': 0},
            'learning': {'episodes': 0, 'total_reward': 0.0}
        }
        self.load_metrics()
        
    def record_mission(self, success: bool):
        """Записать результат миссии"""
        self.metrics['missions']['total'] += 1
        if success:
            self.metrics['missions']['completed'] += 1
        else:
            self.metrics['missions']['failed'] += 1
        self.save_metrics()
        
    def record_command(self, success: bool):
        """Записать результат команды"""
        self.metrics['commands']['sent'] += 1
        if success:
            self.metrics['commands']['successful'] += 1
        else:
            self.metrics['commands']['failed'] += 1
        self.save_metrics()
        
    def record_telemetry_update(self, success: bool):
        """Записать обновление телеметрии"""
        self.metrics['telemetry']['updates'] += 1
        if not success:
            self.metrics['telemetry']['errors'] += 1
        self.save_metrics()
        
    def record_learning_episode(self, reward: float):
        """Записать эпизод обучения"""
        self.metrics['learning']['episodes'] += 1
        self.metrics['learning']['total_reward'] += reward
        self.save_metrics()
        
    def get_metrics(self) -> Dict[str, Any]:
        """Получить все метрики"""
        return self.metrics.copy()
        
    def save_metrics(self):
        """Сохранить метрики в файл"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(self.metrics, f, indent=2)
        except Exception as e:
            logger.error(f"Ошибка сохранения метрик: {e}")
            
    def load_metrics(self):
        """Загрузить метрики из файла"""
        try:
            with open(self.storage_path, 'r') as f:
                self.metrics = json.load(f)
        except FileNotFoundError:
            pass
        except Exception as e:
            logger.error(f"Ошибка загрузки метрик: {e}")


# Глобальные экземпляры для использования по всей системе
performance_monitor = PerformanceMonitor()
anomaly_detector = AnomalyDetector()
energy_monitor = EnergyMonitor()
health_monitor = SystemHealthMonitor()
metrics_collector = MetricsCollector()
