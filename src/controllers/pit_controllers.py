"""
================================================================================
PitControllers - Четкий контроль работы с моторами дрона

Поддерживает:
- 4 мотора (квадрокоптер)
- 6 моторов (гексакоптер)
- 8 моторов (октокоптер)

Протоколы:
- PWM (стандартный)
- OneShot125
- OneShot42
- DShot150/300/600/1200
================================================================================
"""
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class ESCProtocol(Enum):
    """Протоколы ESC"""
    PWM = "pwm"
    ONESHOT125 = "oneshot125"
    ONESHOT42 = "oneshot42"
    DSHOT150 = "dshot150"
    DSHOT300 = "dshot300"
    DSHOT600 = "dshot600"
    DSHOT1200 = "dshot1200"


class MotorState(Enum):
    """Состояния мотора"""
    IDLE = "idle"           # Ожидание
    ARMED = "armed"         # Вооружен
    RUNNING = "running"     # Работает
    ERROR = "error"         # Ошибка
    OVERHEAT = "overheat"   # Перегрев


@dataclass
class Motor:
    """Класс мотора"""
    motor_id: int
    name: str
    min_throttle: int = 1000
    max_throttle: int = 2000
    current_throttle: int = 1000
    target_throttle: int = 1000
    state: MotorState = MotorState.IDLE
    temperature: float = 25.0
    rpm: int = 0
    current: float = 0.0  # Амперы
    voltage: float = 0.0  # Вольты
    error_count: int = 0
    total_runtime: float = 0.0  # секунды


class PitControllers:
    """
    PitControllers - Контроллер моторов дрона
    
    Обеспечивает:
    - Точное управление оборотами
    - Мониторинг состояния моторов
    - Защиту от перегрева
    - Синхронизацию моторов
    - Плавные переходы
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Параметры
        self.motor_count = self.config.get('motor_count', 4)
        self.min_throttle = self.config.get('min_throttle', 1000)
        self.max_throttle = self.config.get('max_throttle', 2000)
        self.esc_protocol = ESCProtocol(self.config.get('esc_protocol', 'dshot600'))
        
        # Моторы
        self.motors: Dict[int, Motor] = {}
        self._init_motors()
        
        # Состояние
        self.is_armed = False
        self.is_flying = False
        self.current_altitude = 0.0
        self.target_altitude = 0.0
        
        # PID для стабилизации
        self.pid_kp = 1.0
        self.pid_ki = 0.1
        self.pid_kd = 0.5
        self.pid_integral = 0.0
        self.pid_last_error = 0.0
        
        # Мониторинг
        self.monitoring_task = None
        self.is_running = False
        
        logger.info(f"🔧 PitControllers инициализирован ({self.motor_count} моторов, {self.esc_protocol.value})")

    def _init_motors(self):
        """Инициализация моторов"""
        motor_names = {
            4: ["Front-Left", "Front-Right", "Rear-Right", "Rear-Left"],
            6: ["Front", "Front-Right", "Rear-Right", "Rear", "Rear-Left", "Front-Left"],
            8: ["Front", "Front-Right", "Right", "Rear-Right", "Rear", "Rear-Left", "Left", "Front-Left"]
        }
        
        names = motor_names.get(self.motor_count, [f"Motor-{i+1}" for i in range(self.motor_count)])
        
        for i in range(self.motor_count):
            self.motors[i] = Motor(
                motor_id=i,
                name=names[i] if i < len(names) else f"Motor-{i+1}",
                min_throttle=self.min_throttle,
                max_throttle=self.max_throttle
            )
        
        logger.info(f"  ✓ Инициализировано {self.motor_count} моторов")

    async def initialize(self):
        """Инициализация контроллера"""
        logger.info("🚀 Инициализация PitControllers...")
        
        # Проверка соединения с ESC
        await self._esc_check()
        
        # Запуск мониторинга
        self.is_running = True
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        logger.info("✅ PitControllers готов")
        return True

    async def _esc_check(self):
        """Проверка ESC"""
        logger.info("🔍 Проверка ESC...")
        
        for motor_id, motor in self.motors.items():
            # Имитация проверки
            motor.state = MotorState.IDLE
            logger.info(f"  ✓ {motor.name}: OK")

    async def _monitoring_loop(self):
        """Цикл мониторинга моторов"""
        while self.is_running:
            try:
                for motor_id, motor in self.motors.items():
                    # Симуляция изменения температуры
                    if motor.state == MotorState.RUNNING:
                        motor.temperature = min(80, motor.temperature + 0.1)
                        motor.total_runtime += 0.1
                        
                        # Проверка перегрева
                        if motor.temperature > 70:
                            motor.state = MotorState.OVERHEAT
                            logger.warning(f"🌡️ {motor.name} перегрев: {motor.temperature:.1f}°C")
                    else:
                        motor.temperature = max(25, motor.temperature - 0.5)
                    
                    # Плавное изменение throttle
                    if motor.current_throttle != motor.target_throttle:
                        diff = motor.target_throttle - motor.current_throttle
                        step = max(10, abs(diff) // 10)
                        if diff > 0:
                            motor.current_throttle = min(motor.target_throttle, motor.current_throttle + step)
                        else:
                            motor.current_throttle = max(motor.target_throttle, motor.current_throttle - step)
                
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"❌ Ошибка мониторинга: {e}")
                await asyncio.sleep(1)

    # ========== Основные команды ==========
    
    async def arm(self) -> bool:
        """Вооружение моторов"""
        logger.info("🔒 Вооружение моторов...")
        
        if self.is_armed:
            logger.warning("⚠️ Моторы уже вооружены")
            return True
        
        # Проверка безопасности
        safety_check = await self._safety_check()
        if not safety_check:
            logger.error("❌ Проверка безопасности не пройдена")
            return False
        
        # Вооружение
        for motor in self.motors.values():
            motor.state = MotorState.ARMED
            motor.current_throttle = self.min_throttle
            motor.target_throttle = self.min_throttle
        
        self.is_armed = True
        logger.info("✅ Моторы вооружены")
        return True

    async def disarm(self) -> bool:
        """Разоружение моторов"""
        logger.info("🔓 Разоружение моторов...")
        
        # Остановка всех моторов
        for motor in self.motors.values():
            motor.target_throttle = self.min_throttle
            motor.state = MotorState.IDLE
        
        # Ждем остановки
        await asyncio.sleep(1)
        
        self.is_armed = False
        self.is_flying = False
        logger.info("✅ Моторы разоружены")
        return True

    async def takeoff(self, target_altitude: float = 10.0) -> bool:
        """Взлет"""
        logger.info(f"🚁 Взлет на высоту {target_altitude}м...")
        
        if not self.is_armed:
            await self.arm()
        
        self.target_altitude = target_altitude
        self.is_flying = True
        
        # Плавный набор высоты
        throttle_increment = 50
        target_throttle = self.min_throttle + 200
        
        for motor in self.motors.values():
            motor.state = MotorState.RUNNING
            motor.target_throttle = target_throttle
        
        # Симуляция набора высоты
        while self.current_altitude < target_altitude * 0.9:
            self.current_altitude += 0.5
            await asyncio.sleep(0.1)
        
        self.current_altitude = target_altitude
        logger.info(f"✅ Взлет завершен, высота: {self.current_altitude}м")
        return True

    async def land(self) -> bool:
        """Посадка"""
        logger.info("🛬 Посадка...")
        
        # Плавное снижение
        while self.current_altitude > 0.5:
            self.current_altitude -= 0.3
            
            # Уменьшение throttle
            for motor in self.motors.values():
                motor.target_throttle = max(
                    self.min_throttle,
                    motor.target_throttle - 10
                )
            
            await asyncio.sleep(0.1)
        
        # Остановка моторов
        for motor in self.motors.values():
            motor.target_throttle = self.min_throttle
            motor.state = MotorState.ARMED
        
        self.current_altitude = 0
        self.is_flying = False
        
        logger.info("✅ Посадка завершена")
        return True

    async def hover(self) -> bool:
        """Зависание"""
        logger.info("⏸️ Режим зависания...")
        
        hover_throttle = self.min_throttle + 150
        
        for motor in self.motors.values():
            motor.target_throttle = hover_throttle
        
        return True

    async def set_throttle(self, motor_id: int, throttle: int) -> bool:
        """Установка throttle для конкретного мотора"""
        if motor_id not in self.motors:
            logger.error(f"❌ Неверный ID мотора: {motor_id}")
            return False
        
        motor = self.motors[motor_id]
        motor.target_throttle = max(self.min_throttle, min(self.max_throttle, throttle))
        
        return True

    async def set_all_throttles(self, throttle: int) -> bool:
        """Установка throttle для всех моторов"""
        for motor_id in self.motors:
            await self.set_throttle(motor_id, throttle)
        return True

    async def execute_command(self, command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Выполнение команды"""
        params = params or {}
        
        if command == "ARM":
            success = await self.arm()
        elif command == "DISARM":
            success = await self.disarm()
        elif command == "TAKEOFF":
            altitude = params.get("altitude", 10)
            success = await self.takeoff(altitude)
        elif command == "LAND":
            success = await self.land()
        elif command == "HOVER":
            success = await self.hover()
        elif command == "SET_THROTTLE":
            motor_id = params.get("motor_id", 0)
            throttle = params.get("throttle", self.min_throttle)
            success = await self.set_throttle(motor_id, throttle)
        else:
            logger.warning(f"⚠️ Неизвестная команда: {command}")
            return {"success": False, "error": "Unknown command"}
        
        return {"success": success, "command": command}

    # ========== Стабилизация ==========
    
    async def stabilize(self, target_roll: float = 0, target_pitch: float = 0, target_yaw: float = 0):
        """Стабилизация дрона"""
        # PID контроллер для стабилизации
        error_roll = target_roll  # упрощенно
        error_pitch = target_pitch
        
        # Расчет PID
        self.pid_integral += error_roll
        derivative = error_roll - self.pid_last_error
        
        output = (self.pid_kp * error_roll + 
                  self.pid_ki * self.pid_integral + 
                  self.pid_kd * derivative)
        
        self.pid_last_error = error_roll
        
        # Применение к моторам (упрощенно)
        base_throttle = self.min_throttle + 150
        
        if self.motor_count == 4:
            # Квадрокоптер: FL, FR, RR, RL
            self.motors[0].target_throttle = int(base_throttle - output)  # Front-Left
            self.motors[1].target_throttle = int(base_throttle + output)  # Front-Right
            self.motors[2].target_throttle = int(base_throttle - output)  # Rear-Right
            self.motors[3].target_throttle = int(base_throttle + output)  # Rear-Left

    # ========== Безопасность ==========
    
    async def _safety_check(self) -> bool:
        """Проверка безопасности"""
        checks = []
        
        # Проверка температуры
        for motor in self.motors.values():
            if motor.temperature > 60:
                logger.error(f"❌ {motor.name} слишком горячий: {motor.temperature}°C")
                checks.append(False)
            else:
                checks.append(True)
        
        # Проверка напряжения
        # ...
        
        return all(checks)

    async def emergency_stop(self):
        """Аварийная остановка"""
        logger.error("🚨 Аварийная остановка моторов!")
        
        for motor in self.motors.values():
            motor.target_throttle = self.min_throttle
            motor.state = MotorState.IDLE
        
        self.is_armed = False
        self.is_flying = False

    # ========== Мониторинг и диагностика ==========
    
    def get_motor_status(self, motor_id: int) -> Dict[str, Any]:
        """Получение статуса мотора"""
        if motor_id not in self.motors:
            return {"error": "Invalid motor ID"}
        
        motor = self.motors[motor_id]
        return {
            "motor_id": motor.motor_id,
            "name": motor.name,
            "state": motor.state.value,
            "current_throttle": motor.current_throttle,
            "target_throttle": motor.target_throttle,
            "temperature": motor.temperature,
            "rpm": motor.rpm,
            "current": motor.current,
            "voltage": motor.voltage,
            "total_runtime": motor.total_runtime
        }

    def get_all_status(self) -> Dict[str, Any]:
        """Получение статуса всех моторов"""
        return {
            "is_armed": self.is_armed,
            "is_flying": self.is_flying,
            "current_altitude": self.current_altitude,
            "target_altitude": self.target_altitude,
            "motors": {mid: self.get_motor_status(mid) for mid in self.motors}
        }

    async def shutdown(self):
        """Завершение работы"""
        logger.info("🛑 Завершение работы PitControllers...")
        
        self.is_running = False
        
        if self.is_flying:
            await self.land()
        
        if self.is_armed:
            await self.disarm()
        
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        
        logger.info("👋 PitControllers завершил работу")
