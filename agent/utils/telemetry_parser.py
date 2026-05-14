#!/usr/bin/env python3
"""
Парсер телеметрии для агентов.

Преобразует сырые данные телеметрии (MAVLink, симуляторы)
в структурированный формат для обработки агентами.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from datetime import datetime
import math


@dataclass
class ProcessedTelemetry:
    """
    Структурированные данные телеметрии дрона.
    
    Attributes:
        timestamp: Время получения данных (UTC)
        drone_id: Идентификатор дрона
        latitude: Широта (градусы)
        longitude: Долгота (градусы)
        altitude: Высота над уровнем моря (метры)
        battery_percent: Заряд батареи (проценты)
        speed_horizontal: Горизонтальная скорость (м/с)
        speed_vertical: Вертикальная скорость (м/с)
        heading: Курс (градусы, 0-360)
        satellites: Количество видимых спутников
        flight_mode: Режим полёта
        rc_signal_strength: Уровень сигнала RC (dBm)
        video_signal_strength: Уровень видеосигнала (dBm)
        distance_to_home: Расстояние до точки взлёта (метры)
        errors: Список ошибок и предупреждений
    """
    timestamp: datetime
    drone_id: str = "drone_001"
    latitude: float = 0.0
    longitude: float = 0.0
    altitude: float = 0.0
    battery_percent: float = 100.0
    speed_horizontal: float = 0.0
    speed_vertical: float = 0.0
    heading: float = 0.0
    satellites: int = 0
    flight_mode: str = "STABILIZE"
    rc_signal_strength: float = -100.0
    video_signal_strength: float = -100.0
    distance_to_home: float = 0.0
    errors: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразует объект в словарь."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'drone_id': self.drone_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'altitude': self.altitude,
            'battery_percent': self.battery_percent,
            'speed_horizontal': self.speed_horizontal,
            'speed_vertical': self.speed_vertical,
            'heading': self.heading,
            'satellites': self.satellites,
            'flight_mode': self.flight_mode,
            'rc_signal_strength': self.rc_signal_strength,
            'video_signal_strength': self.video_signal_strength,
            'distance_to_home': self.distance_to_home,
            'errors': self.errors
        }


class TelemetryParser:
    """
    Парсер телеметрии для различных источников данных.
    
    Поддерживает форматы:
    - MAVLink (дроны Pixhawk, ArduPilot)
    - DJI SDK (дроны DJI)
    - Симуляторы (AirSim, Gazebo)
    - Пользовательский JSON-формат
    """
    
    def __init__(self):
        """Инициализирует парсер телеметрии."""
        self._last_position: Optional[tuple] = None
        self._last_timestamp: Optional[datetime] = None
    
    def parse_mavlink(self, raw_data: Dict[str, Any]) -> ProcessedTelemetry:
        """
        Парсит данные телеметрии в формате MAVLink.
        
        Args:
            raw_data: Словарь с данными MAVLink.
                      Ожидаемые ключи: GLOBAL_POSITION_INT, BATTERY_STATUS,
                      RC_CHANNELS, SYS_STATUS.
        
        Returns:
            ProcessedTelemetry: Обработанные данные телеметрии.
        
        Raises:
            ValueError: Если отсутствуют критические данные.
        """
        errors = []
        
        # Извлекаем позицию
        gps_data = raw_data.get('GLOBAL_POSITION_INT', {})
        lat = gps_data.get('lat', 0) / 1e7 if gps_data else 0.0
        lon = gps_data.get('lon', 0) / 1e7 if gps_data else 0.0
        alt = gps_data.get('alt', 0) / 1e3 if gps_data else 0.0
        relative_alt = gps_data.get('relative_alt', 0) / 1e3 if gps_data else 0.0
        
        # Извлекаем скорость
        vx = gps_data.get('vx', 0) / 100.0 if gps_data else 0.0
        vy = gps_data.get('vy', 0) / 100.0 if gps_data else 0.0
        vz = gps_data.get('vz', 0) / 100.0 if gps_data else 0.0
        
        speed_horizontal = math.sqrt(vx**2 + vy**2)
        speed_vertical = vz
        
        # Извлекаем батарею
        battery_data = raw_data.get('BATTERY_STATUS', {})
        battery_remaining = battery_data.get('remaining', -1)
        battery_percent = max(0, min(100, battery_remaining)) if battery_remaining >= 0 else 0.0
        
        # Извлекаем сигнал RC
        rc_data = raw_data.get('RC_CHANNELS', {})
        rssi = rc_data.get('rssi', -100)
        
        # Вычисляем расстояние до дома
        distance_to_home = 0.0
        if self._last_position and lat != 0 and lon != 0:
            distance_to_home = self._haversine_distance(
                self._last_position[0], self._last_position[1], lat, lon
            )
        
        # Обновляем последнее известное положение
        if lat != 0 and lon != 0:
            self._last_position = (lat, lon)
        
        current_time = datetime.utcnow()
        
        # Проверяем наличие ошибок
        sys_status = raw_data.get('SYS_STATUS', {})
        if sys_status.get('onboard_control_sensors_health', 0) == 0:
            errors.append("CRITICAL: Sensor health check failed")
        
        return ProcessedTelemetry(
            timestamp=current_time,
            latitude=lat,
            longitude=lon,
            altitude=alt + relative_alt,
            battery_percent=battery_percent,
            speed_horizontal=speed_horizontal,
            speed_vertical=speed_vertical,
            heading=gps_data.get('hdg', 0) / 100.0 if gps_data else 0.0,
            satellites=gps_data.get('satellites_visible', 0),
            flight_mode=raw_data.get('HEARTBEAT', {}).get('custom_mode', 'STABILIZE'),
            rc_signal_strength=float(rssi),
            distance_to_home=distance_to_home,
            errors=errors
        )
    
    def parse_dji(self, raw_data: Dict[str, Any]) -> ProcessedTelemetry:
        """
        Парсит данные телеметрии от дронов DJI.
        
        Args:
            raw_data: Словарь с данными DJI SDK.
        
        Returns:
            ProcessedTelemetry: Обработанные данные телеметрии.
        """
        errors = []
        
        # Данные позиции
        position = raw_data.get('position', {})
        lat = position.get('latitude', 0.0)
        lon = position.get('longitude', 0.0)
        alt = position.get('altitude', 0.0)
        
        # Батарея
        battery_data = raw_data.get('battery', {})
        battery_percent = battery_data.get('percent', 0.0)
        
        # Скорость
        velocity = raw_data.get('velocity', {})
        speed_x = velocity.get('x', 0.0)
        speed_y = velocity.get('y', 0.0)
        speed_z = velocity.get('z', 0.0)
        
        speed_horizontal = math.sqrt(speed_x**2 + speed_y**2)
        speed_vertical = speed_z
        
        # Сигнал
        signal_data = raw_data.get('signal', {})
        rc_signal = signal_data.get('rc', -100.0)
        video_signal = signal_data.get('video', -100.0)
        
        # Расстояние до дома
        home_point = raw_data.get('home_point', {})
        distance_to_home = 0.0
        if home_point and lat != 0 and lon != 0:
            distance_to_home = self._haversine_distance(
                home_point.get('lat', lat),
                home_point.get('lon', lon),
                lat,
                lon
            )
        
        current_time = datetime.utcnow()
        
        # Проверка ошибок
        if battery_percent < 20:
            errors.append(f"LOW BATTERY: {battery_percent}%")
        
        if rc_signal < -90:
            errors.append("WEAK RC SIGNAL")
        
        return ProcessedTelemetry(
            timestamp=current_time,
            latitude=lat,
            longitude=lon,
            altitude=alt,
            battery_percent=battery_percent,
            speed_horizontal=speed_horizontal,
            speed_vertical=speed_vertical,
            heading=raw_data.get('heading', 0.0),
            satellites=raw_data.get('satellite_count', 0),
            flight_mode=raw_data.get('flight_mode', 'P-GPS'),
            rc_signal_strength=rc_signal,
            video_signal_strength=video_signal,
            distance_to_home=distance_to_home,
            errors=errors
        )
    
    def parse_simulator(self, raw_data: Dict[str, Any]) -> ProcessedTelemetry:
        """
        Парсит данные от симуляторов (AirSim, Gazebo).
        
        Args:
            raw_data: Словарь с данными симулятора.
        
        Returns:
            ProcessedTelemetry: Обработанные данные телеметрии.
        """
        position = raw_data.get('position', {})
        velocity = raw_data.get('velocity', {})
        orientation = raw_data.get('orientation', {})
        
        x = position.get('x_val', 0.0)
        y = position.get('y_val', 0.0)
        z = position.get('z_val', 0.0)
        
        # Конвертируем координаты симулятора в географические (упрощённо)
        lat = 47.6414 + x / 111000  # Примерно для Сиэтла
        lon = -122.1400 + y / (111000 * math.cos(math.radians(lat)))
        alt = -z  # В AirSim Z вниз положительный
        
        vx = velocity.get('x_val', 0.0)
        vy = velocity.get('y_val', 0.0)
        vz = velocity.get('z_val', 0.0)
        
        speed_horizontal = math.sqrt(vx**2 + vy**2)
        speed_vertical = vz
        
        # Вычисляем heading из ориентации
        yaw = self._quaternion_to_yaw(
            orientation.get('w', 1.0),
            orientation.get('x', 0.0),
            orientation.get('y', 0.0),
            orientation.get('z', 0.0)
        )
        
        current_time = datetime.utcnow()
        
        return ProcessedTelemetry(
            timestamp=current_time,
            latitude=lat,
            longitude=lon,
            altitude=alt,
            battery_percent=raw_data.get('battery_percent', 100.0),
            speed_horizontal=speed_horizontal,
            speed_vertical=speed_vertical,
            heading=yaw,
            satellites=12,  # Симуляция идеального GPS
            flight_mode=raw_data.get('flight_mode', 'OFFBOARD'),
            rc_signal_strength=-50.0,  # Идеальный сигнал в симуляции
            video_signal_strength=-40.0,
            distance_to_home=math.sqrt(x**2 + y**2),
            errors=[]
        )
    
    def parse_json(self, raw_data: Dict[str, Any]) -> ProcessedTelemetry:
        """
        Парсит пользовательский JSON-формат телеметрии.
        
        Args:
            raw_data: Словарь с данными в произвольном формате.
        
        Returns:
            ProcessedTelemetry: Обработанные данные телеметрии.
        """
        current_time = datetime.utcnow()
        
        return ProcessedTelemetry(
            timestamp=current_time,
            drone_id=raw_data.get('drone_id', 'drone_001'),
            latitude=raw_data.get('latitude', 0.0),
            longitude=raw_data.get('longitude', 0.0),
            altitude=raw_data.get('altitude', 0.0),
            battery_percent=raw_data.get('battery_percent', 100.0),
            speed_horizontal=raw_data.get('speed_horizontal', 0.0),
            speed_vertical=raw_data.get('speed_vertical', 0.0),
            heading=raw_data.get('heading', 0.0),
            satellites=raw_data.get('satellites', 0),
            flight_mode=raw_data.get('flight_mode', 'UNKNOWN'),
            rc_signal_strength=raw_data.get('rc_signal_strength', -100.0),
            video_signal_strength=raw_data.get('video_signal_strength', -100.0),
            distance_to_home=raw_data.get('distance_to_home', 0.0),
            errors=raw_data.get('errors', [])
        )
    
    def _haversine_distance(self, lat1: float, lon1: float, 
                            lat2: float, lon2: float) -> float:
        """
        Вычисляет расстояние между двумя точками на сфере (формула гаверсинусов).
        
        Args:
            lat1, lon1: Координаты первой точки (градусы)
            lat2, lon2: Координаты второй точки (градусы)
        
        Returns:
            float: Расстояние в метрах.
        """
        R = 6371000  # Радиус Земли в метрах
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _quaternion_to_yaw(self, w: float, x: float, 
                           y: float, z: float) -> float:
        """
        Конвертирует кватернион в угол рыскания (yaw).
        
        Args:
            w, x, y, z: Компоненты кватерниона.
        
        Returns:
            float: Угол рыскания в градусах (0-360).
        """
        yaw = math.atan2(2.0 * (w * z + x * y), 
                        1.0 - 2.0 * (y * y + z * z))
        return math.degrees(yaw) % 360
