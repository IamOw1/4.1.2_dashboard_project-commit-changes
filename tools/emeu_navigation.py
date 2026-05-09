"""
EMEU Navigation Tool - Геолокация по средствам инерциального движения
(Extended MEMS-based Enhanced Unit)
Использует IMU (акселерометр, гироскоп, магнитометр) для навигации без GPS
"""
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque
from datetime import datetime

from tools.base_tool import BaseTool, ToolStatus
from src.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class IMUReading:
    """Данные с IMU сенсоров"""
    timestamp: float
    accel: np.ndarray  # Ускорение (m/s^2) [ax, ay, az]
    gyro: np.ndarray   # Угловая скорость (rad/s) [gx, gy, gz]
    mag: np.ndarray    # Магнитное поле (uT) [mx, my, mz]
    temperature: float = 25.0


@dataclass
class NavigationState:
    """Состояние навигации"""
    position: np.ndarray = field(default_factory=lambda: np.zeros(3))  # [x, y, z] в метрах
    velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))  # [vx, vy, vz] в м/с
    orientation: np.ndarray = field(default_factory=lambda: np.array([1, 0, 0, 0]))  # Кватернион [w, x, y, z]
    acceleration: np.ndarray = field(default_factory=lambda: np.zeros(3))
    angular_velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))


class EmeuNavigationTool(BaseTool):
    """
    EMЕU - Инерциальная навигация
    
    Определяет позицию дрона используя только IMU сенсоры:
    - Акселерометр (ускорение)
    - Гироскоп (угловая скорость)
    - Магнитометр (ориентация относительно магнитного поля)
    
    Подходит для:
    - Кратковременной навигации в GPS-отказных зонах
    - Уточнения позиции между GPS-обновлениями
    - Навигации в помещениях (короткие дистанции)
    - Резервной навигации при отказе GPS
    
    Ограничения:
    - Накопление ошибок со временем (drift)
    - Требует периодической корректировки
    """
    
    @property
    def name(self) -> str:
        return "emeu_navigation"
    
    @property
    def description(self) -> str:
        return """
        EMЕU навигация - геолокация по средствам инерциального движения.
        
        Использует IMU сенсоры (акселерометр, гироскоп, магнитометр)
        для определения позиции без GPS.
        
        Возможности:
        - Интеграция ускорения для получения скорости и позиции
        - Определение ориентации по гироскопу и магнитометру
        - Компенсация смещения нуля (zero-offset compensation)
        - Калибровка сенсоров
        - Оценка ошибок (drift estimation)
        
        Примеры использования:
        - Навигация в туннелях (до 1-2 минут)
        - Полет в помещениях
        - Резервная навигация при GPS-помехах
        - Уточнение позиции между GPS-обновлениями
        
        Точность: ~1-5% от пройденного расстояния (без коррекции)
        """
    
    def __init__(self, config: Dict[str, Any], agent=None):
        super().__init__(config, agent)
        
        # Параметры IMU
        self.accel_bias = np.array(config.get('accel_bias', [0.0, 0.0, 0.0]))
        self.gyro_bias = np.array(config.get('gyro_bias', [0.0, 0.0, 0.0]))
        self.mag_bias = np.array(config.get('mag_bias', [0.0, 0.0, 0.0]))
        
        # Коэффициенты шума
        self.accel_noise = config.get('accel_noise', 0.01)  # m/s^2
        self.gyro_noise = config.get('gyro_noise', 0.001)   # rad/s
        self.mag_noise = config.get('mag_noise', 0.1)       # uT
        
        # Гравитация
        self.gravity = np.array([0, 0, 9.80665])
        
        # Состояние навигации
        self.state = NavigationState()
        self.last_timestamp = None
        
        # История для сглаживания и анализа
        self.imu_history = deque(maxlen=config.get('imu_history_size', 1000))
        self.position_history = deque(maxlen=config.get('position_history_size', 500))
        self.velocity_history = deque(maxlen=100)
        
        # Флаги
        self.is_calibrated = False
        self.gps_correction_enabled = config.get('gps_correction', True)
        
        # Оценка ошибок
        self.position_uncertainty = np.zeros(3)  # Метры
        self.velocity_uncertainty = np.zeros(3)  # м/с
        self.orientation_uncertainty = np.zeros(3)  # радианы
        
        # Магнитное склонение (деклинация)
        self.magnetic_declination = config.get('magnetic_declination', 0.0)  # градусы
        
        # Статистика
        self.total_distance = 0.0
        self.max_speed = 0.0
        self.start_time = None
        
        logger.info("EMEU Navigation Tool инициализирован")
    
    def _register_actions(self):
        """Регистрация действий"""
        self._actions = {
            'update': self._update,
            'get_position': self._get_position,
            'calibrate': self._calibrate,
            'reset': self._reset,
            'correct_with_gps': self._correct_with_gps,
            'get_drift_estimate': self._get_drift_estimate,
            'set_initial_position': self._set_initial_position,
            'get_trajectory': self._get_trajectory,
            'get_statistics': self._get_statistics,
            'estimate_heading': self._estimate_heading
        }
    
    async def initialize(self):
        """Инициализация инструмента"""
        self.start_time = datetime.now()
        self.status = ToolStatus.READY
        logger.info("EMEU Navigation готов к работе")
        return True
    
    async def _update(self, accel: List[float] = None, gyro: List[float] = None,
                      mag: List[float] = None, timestamp: float = None, **kwargs) -> Dict[str, Any]:
        """
        Обновление состояния навигации на основе данных IMU
        
        Args:
            accel: [ax, ay, az] в m/s^2
            gyro: [gx, gy, gz] в rad/s
            mag: [mx, my, mz] в uT
            timestamp: Время в секундах
        
        Returns:
            Обновленное состояние навигации
        """
        # Генерация тестовых данных если не предоставлены
        if accel is None:
            accel = [0.0, 0.0, 9.8]  # Покой
        if gyro is None:
            gyro = [0.0, 0.0, 0.0]
        if mag is None:
            mag = [25.0, 0.0, 40.0]  # Типичное магнитное поле
        
        accel = np.array(accel)
        gyro = np.array(gyro)
        mag = np.array(mag)
        
        # Текущее время
        current_time = timestamp or datetime.now().timestamp()
        
        if self.last_timestamp is None:
            self.last_timestamp = current_time
            return {
                'success': True,
                'position': self.state.position.tolist(),
                'status': 'initialized'
            }
        
        # Вычисление dt
        dt = current_time - self.last_timestamp
        if dt <= 0 or dt > 1.0:  # Защита от некорректных значений
            dt = 0.01
        
        self.last_timestamp = current_time
        
        # Компенсация смещения
        accel_corrected = accel - self.accel_bias
        gyro_corrected = gyro - self.gyro_bias
        mag_corrected = mag - self.mag_bias
        
        # Добавление шума (симуляция реальных сенсоров)
        accel_corrected += np.random.normal(0, self.accel_noise, 3)
        gyro_corrected += np.random.normal(0, self.gyro_noise, 3)
        mag_corrected += np.random.normal(0, self.mag_noise, 3)
        
        # Обновление ориентации
        self._update_orientation(gyro_corrected, mag_corrected, dt)
        
        # Компенсация гравитации
        accel_world = self._rotate_to_world(accel_corrected)
        accel_linear = accel_world - self.gravity
        
        # Интеграция ускорения -> скорость
        self.state.velocity += accel_linear * dt
        
        # Демпфирование скорости (предотвращение накопления ошибок)
        self.state.velocity *= 0.999
        
        # Интеграция скорости -> позиция
        displacement = self.state.velocity * dt
        self.state.position += displacement
        
        # Обновление ускорения
        self.state.acceleration = accel_linear
        self.state.angular_velocity = gyro_corrected
        
        # Обновление статистики
        speed = np.linalg.norm(self.state.velocity)
        self.total_distance += np.linalg.norm(displacement)
        self.max_speed = max(self.max_speed, speed)
        
        # Обновление неопределенности
        self._update_uncertainty(dt)
        
        # Сохранение в историю
        self.imu_history.append(IMUReading(
            timestamp=current_time,
            accel=accel_corrected,
            gyro=gyro_corrected,
            mag=mag_corrected
        ))
        self.position_history.append(self.state.position.copy())
        self.velocity_history.append(self.state.velocity.copy())
        
        return {
            'success': True,
            'position': self.state.position.tolist(),
            'velocity': self.state.velocity.tolist(),
            'orientation': self.state.orientation.tolist(),
            'acceleration': accel_linear.tolist(),
            'speed': float(speed),
            'dt': dt,
            'uncertainty': self.position_uncertainty.tolist()
        }
    
    async def _get_position(self, **kwargs) -> Dict[str, Any]:
        """Получение текущей позиции"""
        # Обновление с последними данными если доступны
        if kwargs.get('refresh', False):
            await self._update()
        
        return {
            'success': True,
            'position': self.state.position.tolist(),
            'velocity': self.state.velocity.tolist(),
            'orientation': self._quaternion_to_euler(self.state.orientation).tolist(),
            'speed': float(np.linalg.norm(self.state.velocity)),
            'uncertainty': self.position_uncertainty.tolist(),
            'gps_available': False,
            'ins_available': True,
            'drift_estimate': self._estimate_drift()
        }
    
    async def _calibrate(self, samples: int = 100, **kwargs) -> Dict[str, Any]:
        """
        Калибровка IMU сенсоров
        
        Дрон должен находиться в покое во время калибровки
        """
        logger.info(f"Начало калибровки IMU ({samples} образцов)...")
        
        accel_samples = []
        gyro_samples = []
        mag_samples = []
        
        # Сбор образцов
        for _ in range(samples):
            # В реальности здесь чтение с сенсоров
            # Для симуляции - генерация данных
            accel_samples.append(np.random.normal([0, 0, 9.8], self.accel_noise))
            gyro_samples.append(np.random.normal([0, 0, 0], self.gyro_noise))
            mag_samples.append(np.random.normal([25, 0, 40], self.mag_noise))
        
        # Вычисление среднего (смещение нуля)
        self.accel_bias = np.mean(accel_samples, axis=0) - np.array([0, 0, 9.8])
        self.gyro_bias = np.mean(gyro_samples, axis=0)
        self.mag_bias = np.mean(mag_samples, axis=0)
        
        # Вычисление шума (стандартное отклонение)
        self.accel_noise = np.std(accel_samples, axis=0).mean()
        self.gyro_noise = np.std(gyro_samples, axis=0).mean()
        self.mag_noise = np.std(mag_samples, axis=0).mean()
        
        self.is_calibrated = True
        
        logger.info("Калибровка завершена")
        
        return {
            'success': True,
            'accel_bias': self.accel_bias.tolist(),
            'gyro_bias': self.gyro_bias.tolist(),
            'mag_bias': self.mag_bias.tolist(),
            'accel_noise': float(self.accel_noise),
            'gyro_noise': float(self.gyro_noise),
            'mag_noise': float(self.mag_noise)
        }
    
    async def _reset(self, keep_calibration: bool = True, **kwargs) -> Dict[str, Any]:
        """Сброс состояния навигации"""
        bias_backup = (self.accel_bias.copy(), self.gyro_bias.copy(), self.mag_bias.copy())
        
        self.state = NavigationState()
        self.last_timestamp = None
        self.imu_history.clear()
        self.position_history.clear()
        self.velocity_history.clear()
        self.position_uncertainty = np.zeros(3)
        self.velocity_uncertainty = np.zeros(3)
        self.orientation_uncertainty = np.zeros(3)
        self.total_distance = 0.0
        self.max_speed = 0.0
        
        if keep_calibration:
            self.accel_bias, self.gyro_bias, self.mag_bias = bias_backup
        else:
            self.is_calibrated = False
        
        logger.info("EMEU навигация сброшена")
        
        return {
            'success': True,
            'message': 'Навигация сброшена' + (' (калибровка сохранена)' if keep_calibration else '')
        }
    
    async def _correct_with_gps(self, gps_position: List[float], gps_accuracy: float = 5.0, **kwargs) -> Dict[str, Any]:
        """
        Коррекция позиции по GPS
        
        Args:
            gps_position: [lat, lon, alt] или [x, y, z]
            gps_accuracy: Точность GPS в метрах
        """
        gps_pos = np.array(gps_position)
        
        # Разница между INS и GPS
        error = self.state.position - gps_pos
        
        # Коэффициент доверия (меньше = больше доверия GPS)
        alpha = min(1.0, gps_accuracy / 10.0)
        
        # Коррекция позиции
        self.state.position = self.state.position * alpha + gps_pos * (1 - alpha)
        
        # Коррекция скорости (если есть предыдущая позиция)
        if len(self.position_history) > 0:
            prev_pos = self.position_history[-1]
            dt = 1.0  # Предполагаем 1 секунду
            self.state.velocity = (self.state.position - prev_pos) / dt
        
        # Сброс неопределенности
        self.position_uncertainty = np.array([gps_accuracy] * 3)
        self.velocity_uncertainty *= 0.5
        
        return {
            'success': True,
            'corrected_position': self.state.position.tolist(),
            'correction_applied': error.tolist(),
            'gps_accuracy': gps_accuracy
        }
    
    async def _get_drift_estimate(self, **kwargs) -> Dict[str, Any]:
        """Оценка дрейфа навигации"""
        drift = self._estimate_drift()
        
        return {
            'success': True,
            'position_drift': drift['position'],
            'velocity_drift': drift['velocity'],
            'recommended_correction_interval': drift['recommended_interval'],
            'accuracy_estimate': drift['accuracy']
        }
    
    async def _set_initial_position(self, position: List[float], velocity: List[float] = None, **kwargs) -> Dict[str, Any]:
        """Установка начальной позиции"""
        self.state.position = np.array(position)
        if velocity:
            self.state.velocity = np.array(velocity)
        
        self.position_uncertainty = np.zeros(3)
        
        return {
            'success': True,
            'position': self.state.position.tolist(),
            'velocity': self.state.velocity.tolist()
        }
    
    async def _get_trajectory(self, **kwargs) -> Dict[str, Any]:
        """Получение траектории полета"""
        trajectory = [
            {
                'position': pos.tolist(),
                'index': i
            }
            for i, pos in enumerate(self.position_history)
        ]
        
        return {
            'success': True,
            'points_count': len(trajectory),
            'trajectory': trajectory,
            'total_distance': self.total_distance
        }
    
    async def _get_statistics(self, **kwargs) -> Dict[str, Any]:
        """Получение статистики навигации"""
        if self.start_time:
            elapsed = (datetime.now() - self.start_time).total_seconds()
        else:
            elapsed = 0
        
        return {
            'success': True,
            'elapsed_time': elapsed,
            'total_distance': self.total_distance,
            'max_speed': self.max_speed,
            'current_speed': float(np.linalg.norm(self.state.velocity)),
            'position_uncertainty': self.position_uncertainty.tolist(),
            'samples_processed': len(self.imu_history),
            'is_calibrated': self.is_calibrated
        }
    
    async def _estimate_heading(self, **kwargs) -> Dict[str, Any]:
        """Оценка направления по магнитометру"""
        if len(self.imu_history) == 0:
            return {
                'success': False,
                'error': 'Нет данных магнитометра'
            }
        
        # Последнее показание магнитометра
        last_mag = self.imu_history[-1].mag
        
        # Вычисление направления
        heading = np.arctan2(last_mag[1], last_mag[0]) * 180 / np.pi
        heading += self.magnetic_declination
        
        # Нормализация к 0-360
        heading = (heading + 360) % 360
        
        return {
            'success': True,
            'heading': float(heading),
            'heading_rad': float(np.radians(heading)),
            'magnetic_declination': self.magnetic_declination
        }
    
    def _update_orientation(self, gyro: np.ndarray, mag: np.ndarray, dt: float):
        """Обновление ориентации по гироскопу и магнитометру"""
        # Интеграция гироскопа
        q = self.state.orientation
        
        # Угловое смещение
        angle = np.linalg.norm(gyro) * dt
        if angle > 0:
            axis = gyro / np.linalg.norm(gyro)
            delta_q = np.array([
                np.cos(angle / 2),
                axis[0] * np.sin(angle / 2),
                axis[1] * np.sin(angle / 2),
                axis[2] * np.sin(angle / 2)
            ])
            
            # Умножение кватернионов
            w1, x1, y1, z1 = q
            w2, x2, y2, z2 = delta_q
            q_new = np.array([
                w1*w2 - x1*x2 - y1*y2 - z1*z2,
                w1*x2 + x1*w2 + y1*z2 - z1*y2,
                w1*y2 - x1*z2 + y1*w2 + z1*x2,
                w1*z2 + x1*y2 - y1*x2 + z1*w2
            ])
            
            # Нормализация
            q_new /= np.linalg.norm(q_new)
            self.state.orientation = q_new
    
    def _rotate_to_world(self, accel: np.ndarray) -> np.ndarray:
        """Поворот вектора ускорения в мировые координаты"""
        q = self.state.orientation
        w, x, y, z = q
        
        # Матрица поворота из кватерниона
        R = np.array([
            [1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
            [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
            [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)]
        ])
        
        return R @ accel
    
    def _quaternion_to_euler(self, q: np.ndarray) -> np.ndarray:
        """Преобразование кватерниона в углы Эйлера"""
        w, x, y, z = q
        
        # Roll (x-axis rotation)
        sinr_cosp = 2 * (w * x + y * z)
        cosr_cosp = 1 - 2 * (x * x + y * y)
        roll = np.arctan2(sinr_cosp, cosr_cosp)
        
        # Pitch (y-axis rotation)
        sinp = 2 * (w * y - z * x)
        pitch = np.arcsin(np.clip(sinp, -1, 1))
        
        # Yaw (z-axis rotation)
        siny_cosp = 2 * (w * z + x * y)
        cosy_cosp = 1 - 2 * (y * y + z * z)
        yaw = np.arctan2(siny_cosp, cosy_cosp)
        
        return np.array([np.degrees(roll), np.degrees(pitch), np.degrees(yaw)])
    
    def _update_uncertainty(self, dt: float):
        """Обновление оценки неопределенности"""
        # Рост неопределенности со временем
        position_growth = self.accel_noise * dt * dt / 2
        velocity_growth = self.accel_noise * dt
        orientation_growth = self.gyro_noise * dt
        
        self.position_uncertainty += position_growth
        self.velocity_uncertainty += velocity_growth
        self.orientation_uncertainty += orientation_growth
        
        # Ограничение роста
        self.position_uncertainty = np.minimum(self.position_uncertainty, 1000)
        self.velocity_uncertainty = np.minimum(self.velocity_uncertainty, 100)
    
    def _estimate_drift(self) -> Dict[str, Any]:
        """Оценка дрейфа навигации"""
        # Примерная оценка на основе времени
        if self.start_time:
            elapsed = (datetime.now() - self.start_time).total_seconds()
        else:
            elapsed = 0
        
        # Дрейф позиции: ~1-5% от времени
        position_drift = elapsed * 0.02  # метров
        
        # Дрейф скорости
        velocity_drift = elapsed * 0.001  # м/с
        
        # Рекомендуемый интервал коррекции
        if position_drift < 1:
            recommended_interval = 60  # 1 минута
        elif position_drift < 5:
            recommended_interval = 30  # 30 секунд
        else:
            recommended_interval = 10  # 10 секунд
        
        # Оценка точности
        if position_drift < 1:
            accuracy = 'high'
        elif position_drift < 5:
            accuracy = 'medium'
        else:
            accuracy = 'low'
        
        return {
            'position': float(position_drift),
            'velocity': float(velocity_drift),
            'recommended_interval': recommended_interval,
            'accuracy': accuracy
        }
