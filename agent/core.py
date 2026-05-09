"""
================================================================================
COBA AI Drone Agent v4.0 - Unified Core Agent
Объединённая версия с функциями из v3, v3.6 и новыми модулями

Включает:
- DroneIntelligentAgent (716 строк из v3)
- Очередь миссий (из v3.6)
- Event callbacks (из v3.6)
- PitControllers (новый модуль)
- Mesh Network (новый модуль)
- OpenQ (новый модуль)
- Ролевое распределение агентов
- Поддержка GPT-4o и DeepSeek
================================================================================
"""
import asyncio
import json
import logging
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field

from agent.memory import ShortTermMemory, LongTermMemory
from agent.decision_maker import DecisionMaker
from agent.learner import Learner
from agent.sub_agent import SubAgent
from tools.base_tool import BaseTool
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AgentState(Enum):
    """Состояния агента"""
    INITIALIZING = "initializing"
    READY = "ready"
    FLYING = "flying"
    LANDING = "landing"
    EMERGENCY = "emergency"
    LEARNING = "learning"
    UPDATING = "updating"
    SHUTDOWN = "shutdown"


class AgentRole(Enum):
    """Роли агентов в системе"""
    CORE = "core"
    SUB = "sub"
    HYBRID = "hybrid"


class TaskPriority(Enum):
    """Приоритеты задач"""
    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3
    BACKGROUND = 4


@dataclass
class MissionParams:
    """Параметры миссии - объединённая версия из v3 и v3.6"""
    name: str
    mission_id: str
    waypoints: List[Dict[str, float]]
    altitude: float = 50.0
    speed: float = 10.0
    max_distance: float = 5000.0
    emergency_protocols: Dict[str, Any] = field(default_factory=dict)
    data_collection: bool = True
    learning_enabled: bool = False
    resources: List[str] = field(default_factory=list)
    agent_version: Optional[str] = None
    instructions: List[Dict[str, Any]] = field(default_factory=list)
    map_points: List[Dict[str, float]] = field(default_factory=list)
    map_area: Dict[str, Any] = field(default_factory=dict)
    mission_type: str = "patrol"
    auto_execute: bool = False
    queue_position: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "mission_id": self.mission_id,
            "waypoints": self.waypoints,
            "altitude": self.altitude,
            "speed": self.speed,
            "max_distance": self.max_distance,
            "emergency_protocols": self.emergency_protocols,
            "data_collection": self.data_collection,
            "learning_enabled": self.learning_enabled,
            "resources": self.resources,
            "agent_version": self.agent_version,
            "instructions": self.instructions,
            "map_points": self.map_points,
            "map_area": self.map_area,
            "mission_type": self.mission_type,
            "auto_execute": self.auto_execute,
            "queue_position": self.queue_position
        }


@dataclass
class Task:
    """Задача для агента - из v3.6"""
    task_id: str
    task_type: str
    priority: TaskPriority
    data: Dict[str, Any]
    assigned_to: AgentRole
    created_at: datetime
    deadline: Optional[datetime] = None
    dependencies: List[str] = None
    result: Any = None
    status: str = "pending"

    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


class TaskDistributor:
    """Распределитель задач между агентами - из v3.6"""

    def __init__(self):
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        self.task_handlers = {
            "flight_control": AgentRole.CORE,
            "emergency_response": AgentRole.CORE,
            "mission_execution": AgentRole.CORE,
            "decision_making": AgentRole.CORE,
            "data_analysis": AgentRole.SUB,
            "logging": AgentRole.SUB,
            "mapping": AgentRole.SUB,
            "calculation": AgentRole.SUB,
            "route_optimization": AgentRole.SUB,
            "prediction": AgentRole.SUB,
            "perception": AgentRole.HYBRID,
            "navigation": AgentRole.HYBRID,
            "visual_analysis": AgentRole.HYBRID,
        }

    def create_task(self, task_type: str, data: Dict[str, Any],
                    priority: TaskPriority = TaskPriority.MEDIUM,
                    assigned_to: AgentRole = None) -> Task:
        """Создание новой задачи"""
        import uuid

        if assigned_to is None:
            assigned_to = self.task_handlers.get(task_type, AgentRole.CORE)

        task = Task(
            task_id=str(uuid.uuid4()),
            task_type=task_type,
            priority=priority,
            data=data,
            assigned_to=assigned_to,
            created_at=datetime.now()
        )

        self.task_queue.append(task)
        self._sort_queue()

        return task

    def _sort_queue(self):
        """Сортировка очереди по приоритету"""
        self.task_queue.sort(key=lambda t: t.priority.value)

    def get_next_task(self, agent_role: AgentRole) -> Optional[Task]:
        """Получение следующей задачи для агента"""
        for task in self.task_queue:
            if task.status == "pending":
                if agent_role == AgentRole.CORE:
                    task.status = "in_progress"
                    return task
                elif agent_role == AgentRole.SUB and task.assigned_to in [AgentRole.SUB, AgentRole.HYBRID]:
                    task.status = "in_progress"
                    return task
        return None

    def complete_task(self, task_id: str, result: Any):
        """Завершение задачи"""
        for task in self.task_queue:
            if task.task_id == task_id:
                task.status = "completed"
                task.result = result
                self.task_queue.remove(task)
                self.completed_tasks.append(task)
                return True
        return False


class DroneIntelligentAgent:
    """
    Основной класс интеллектуального агента для управления дроном.
    Объединённая версия с функциями из v3, v3.6 и новыми модулями.
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Инициализация агента.

        Args:
            config_path (str): Путь к файлу конфигурации.
        """
        self.config = self._load_config(config_path)
        self.agent_id = self.config.get('agent_id', 'drone_agent_1')
        self.state = AgentState.INITIALIZING
        self.role = AgentRole.CORE

        # Инициализация компонентов памяти (из v3)
        self.short_term_memory = ShortTermMemory(capacity=1000)
        self.long_term_memory = LongTermMemory(storage_path="data/memory/knowledge_base.db")

        # Инициализация принятия решений (из v3)
        self.decision_maker = DecisionMaker(self.config)

        # Инициализация обучения (из v3)
        self.learner = Learner(self.config)

        # Инициализация субагента (из v3)
        self.sub_agent = SubAgent(self.config, main_agent=self)

        # Распределитель задач (из v3.6)
        self.task_distributor = TaskDistributor()

        # Клиенты симуляторов
        self.sim_mode = self.config.get('simulation', {}).get('enabled', False)
        self.sim_client = None
        self.real_drone_client = None

        # Реестр инструментов
        self.tools: Dict[str, BaseTool] = {}
        self._load_tools()

        # Телеметрия (расширенная из v3.6)
        self.telemetry = {
            "position": {"x": 0, "y": 0, "z": 0, "lat": 0.0, "lon": 0.0},
            "velocity": {"vx": 0, "vy": 0, "vz": 0},
            "attitude": {"roll": 0, "pitch": 0, "yaw": 0},
            "battery": 100.0,
            "signal_strength": 100,
            "gps_status": "3D_FIX",
            "temperature": 25.0,
            "motors": {"m1": 0, "m2": 0, "m3": 0, "m4": 0},
            "timestamp": datetime.now().isoformat()
        }

        # Система событий (из v3.6)
        self.event_bus = asyncio.Queue()
        self.command_queue = asyncio.Queue()
        self.event_callbacks: List[Callable] = []

        # Текущая миссия и очередь (из v3.6)
        self.current_mission: Optional[MissionParams] = None
        self.mission_queue: List[MissionParams] = []
        self.mission_history: List[Dict] = []

        # Журнал событий (из v3.6)
        self.event_log: List[Dict] = []

        # Новые модули
        self.pit_controllers = None
        self.mesh_network = None
        self.openq = None

        logger.info(f"Агент {self.agent_id} инициализирован. Режим: {'симуляция' if self.sim_mode else 'реальный дрон'}")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Загрузка конфигурации с поддержкой переменных окружения."""
        import yaml
        import os
        import re

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)

            # Замена переменных окружения ${VAR} или ${VAR:default}
            def replace_env_vars(obj):
                if isinstance(obj, str):
                    pattern = r'\$\{([^}:]+)(?::([^}]*))?\}'
                    def replacer(match):
                        var_name = match.group(1)
                        default = match.group(2) if match.group(2) else match.group(0)
                        return os.getenv(var_name, default)
                    return re.sub(pattern, replacer, obj)
                elif isinstance(obj, dict):
                    return {k: replace_env_vars(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [replace_env_vars(item) for item in obj]
                return obj

            return replace_env_vars(config)
        except Exception as e:
            logger.error(f"Ошибка загрузки конфигурации: {e}")
            return {}

    def _load_tools(self):
        """Динамическая загрузка инструментов."""
        tool_configs = self.config.get('tools', [])
        for tool_config in tool_configs:
            try:
                if not tool_config.get('enabled', True):
                    continue
                module_path = f"tools.{tool_config['module']}"
                class_name = tool_config['class']
                module = __import__(module_path, fromlist=[class_name])
                tool_class = getattr(module, class_name)
                tool = tool_class(self.config, agent=self)
                self.tools[tool.name] = tool
                logger.info(f"Загружен инструмент: {tool.name}")
            except Exception as e:
                logger.error(f"Не удалось загрузить инструмент {tool_config}: {e}")

    def _parse_command(self, command: str) -> Dict[str, Any]:
        """Парсинг естественного языка команд для дрона."""
        command = command.lower().strip()

        # Взлет
        if command.startswith("взлет"):
            if "на" in command and "метр" in command:
                try:
                    altitude_str = command.split("на")[1].split("метр")[0].strip()
                    altitude = float(altitude_str)
                    return {"action": "takeoff", "altitude": altitude}
                except ValueError:
                    pass
            return {"action": "takeoff", "altitude": 10}  # default

        # Посадка
        elif "посадка" in command or "садиться" in command:
            return {"action": "land"}

        # Возврат домой
        elif "вернись домой" in command or "домой" in command or "rtl" in command:
            return {"action": "rtl"}

        # По умолчанию
        return {"action": "unknown"}

    async def initialize(self):
        """Полная инициализация агента и подключение к дрону."""
        logger.info("Начало инициализации агента...")

        # Инициализация PitControllers
        await self._init_pit_controllers()

        # Инициализация Mesh сети
        await self._init_mesh_network()

        # Инициализация OpenQ
        await self._init_openq()

        # Подключение к симулятору или реальному дрону
        if self.sim_mode:
            from sim.airsim_client import AirSimClient
            self.sim_client = AirSimClient(self.config)
            await self.sim_client.connect()
            logger.info("Подключено к симулятору AirSim")
        else:
            from hardware.mavlink_handler import MAVLinkHandler
            self.real_drone_client = MAVLinkHandler(self.config)
            await self.real_drone_client.connect()
            logger.info("Подключено к реальному дрону через MAVLink")

        # Инициализация инструментов
        for tool in self.tools.values():
            await tool.initialize()

        # Инициализация субагента
        await self.sub_agent.initialize()

        # Загрузка сохраненного состояния
        await self.load_state()

        # Проверка всех систем
        await self._system_check()

        self.state = AgentState.READY
        logger.info("Агент готов к работе.")
        return True

    async def _init_pit_controllers(self):
        """Инициализация PitControllers (управление моторами)."""
        try:
            from controllers.pit_controllers import PitControllers
            pit_config = self.config.get('pit_controllers', {})
            self.pit_controllers = PitControllers(pit_config)
            await self.pit_controllers.initialize()
            logger.info("PitControllers инициализированы")
        except Exception as e:
            logger.warning(f"PitControllers не инициализированы: {e}")

    async def _init_mesh_network(self):
        """Инициализация Mesh сети."""
        try:
            from network.mesh_network import MeshNetwork
            mesh_config = self.config.get('mesh_network', {})
            self.mesh_network = MeshNetwork(mesh_config)
            await self.mesh_network.initialize()
            logger.info("Mesh Network инициализирована")
        except Exception as e:
            logger.warning(f"Mesh Network не инициализирована: {e}")

    async def _init_openq(self):
        """Инициализация OpenQ (сбор данных полета)."""
        try:
            from sensors.openq import OpenQ
            openq_config = self.config.get('openq', {})
            self.openq = OpenQ(openq_config)
            await self.openq.initialize()
            logger.info("OpenQ инициализирован")
        except Exception as e:
            logger.warning(f"OpenQ не инициализирован: {e}")

    async def _system_check(self):
        """Проверка всех систем."""
        checks = []

        # Проверка связи
        if self.sim_client or self.real_drone_client:
            connection_ok = await self._check_connection()
            checks.append(("connection", connection_ok))

        # Проверка инструментов
        for name, tool in self.tools.items():
            try:
                tool_ok = await tool.health_check()
                checks.append((f"tool_{name}", tool_ok))
            except:
                checks.append((f"tool_{name}", False))

        # Проверка памяти
        memory_ok = self.short_term_memory is not None and self.long_term_memory is not None
        checks.append(("memory", memory_ok))

        # Проверка новых модулей
        checks.append(("pit_controllers", self.pit_controllers is not None))
        checks.append(("mesh_network", self.mesh_network is not None))
        checks.append(("openq", self.openq is not None))

        failed = [name for name, ok in checks if not ok]
        if failed:
            logger.warning(f"Следующие системы требуют внимания: {failed}")

        return all(ok for _, ok in checks)

    async def _check_connection(self) -> bool:
        """Проверка подключения."""
        try:
            if self.sim_client:
                return await self.sim_client.is_connected()
            elif self.real_drone_client:
                return await self.real_drone_client.is_connected()
            return False
        except:
            return False

    def register_event_callback(self, callback: Callable):
        """Регистрация callback для событий - из v3.6."""
        self.event_callbacks.append(callback)

    async def _notify_event(self, event_type: str, data: Dict[str, Any]):
        """Уведомление о событии - из v3.6."""
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.event_log.append(event)

        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error(f"Ошибка в callback события: {e}")

    async def perceive(self) -> Dict[str, Any]:
        """Сбор данных с датчиков дрона."""
        perception = {}

        try:
            # Получение телеметрии
            if self.sim_client:
                perception["telemetry"] = await self.sim_client.get_telemetry()
            elif self.real_drone_client:
                perception["telemetry"] = await self.real_drone_client.get_telemetry()

            # Данные с инструментов
            perception["tools"] = {}
            for name, tool in self.tools.items():
                try:
                    tool_data = await tool.perceive()
                    perception["tools"][name] = tool_data
                except Exception as e:
                    logger.error(f"Ошибка восприятия инструмента {name}: {e}")

            # Обновление телеметрии агента
            self.telemetry.update(perception.get("telemetry", {}))
            self.telemetry["timestamp"] = datetime.now().isoformat()

            # Сохранение в краткосрочную память
            self.short_term_memory.add(perception)

            # OpenQ сбор данных
            if self.openq:
                await self.openq.collect_data(self.telemetry)

            return perception
        except Exception as e:
            logger.error(f"Ошибка восприятия: {e}")
            return {}

    async def decide(self, perception_data: Dict[str, Any]) -> Dict[str, Any]:
        """Принятие решений на основе данных восприятия."""
        try:
            # Обновление состояния агента
            self.telemetry.update({
                "position": perception_data.get("position", self.telemetry["position"]),
                "velocity": perception_data.get("velocity", self.telemetry["velocity"]),
                "battery": perception_data.get("battery", self.telemetry["battery"])
            })

            # Проверка на аварийные ситуации через инструмент Slom
            if "slom" in self.tools:
                emergency = await self.tools["slom"].check_emergency(perception_data)
                if emergency:
                    logger.warning(f"Обнаружена аварийная ситуация: {emergency}")
                    return {"command": "RTL", "reason": emergency, "priority": "high"}

            # Проверка на экстренные ситуации
            emergency = await self._check_emergency(perception_data)
            if emergency:
                return await self._handle_emergency(emergency)

            # Получение текущей миссии
            if self.current_mission:
                decision = await self.decision_maker.decide_mission(perception_data, self.current_mission)
            else:
                decision = await self.decision_maker.decide_free(perception_data)

            # Консультация с субагентом
            if self.config.get('sub_agent', {}).get('enabled', False):
                sub_agent_advice = await self.sub_agent.review_decision(decision, perception_data)
                if sub_agent_advice.get("suggest_change", False):
                    decision = self._merge_decisions(decision, sub_agent_advice)

            return decision
        except Exception as e:
            logger.error(f"Ошибка принятия решения: {e}")
            return await self._fallback_decision()

    async def _check_emergency(self, perception: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Проверка на экстренные ситуации."""
        battery = perception.get("telemetry", {}).get("battery", 100)
        if battery < 20:
            return {"type": "low_battery", "severity": "high", "data": {"battery": battery}}

        signal = perception.get("telemetry", {}).get("signal_strength", 100)
        if signal < 30:
            return {"type": "signal_lost", "severity": "high", "data": {"signal": signal}}

        temp = perception.get("telemetry", {}).get("temperature", 25)
        if temp > 60:
            return {"type": "overheating", "severity": "high", "data": {"temperature": temp}}

        return None

    async def _handle_emergency(self, emergency: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка экстренной ситуации."""
        emergency_type = emergency["type"]

        if emergency_type == "low_battery":
            return {"command": "RTL", "reason": "Низкий заряд батареи", "priority": "high"}
        elif emergency_type == "signal_lost":
            return {"command": "RTL", "reason": "Потеря сигнала", "priority": "high"}
        elif emergency_type == "overheating":
            return {"command": "LAND", "reason": "Перегрев", "priority": "high"}

        return {"command": "LAND", "reason": "Неизвестная аварийная ситуация", "priority": "high"}

    async def _fallback_decision(self) -> Dict[str, Any]:
        """Резервное решение при ошибке."""
        return {"command": "HOVER", "reason": "Резервный режим", "priority": "medium"}

    def _merge_decisions(self, original: Dict[str, Any], advice: Dict[str, Any]) -> Dict[str, Any]:
        """Объединение решений с учетом совета субагента."""
        merged = original.copy()
        if advice.get("suggested_command"):
            merged["command"] = advice["suggested_command"]
            merged["reason"] = advice.get("reason", original.get("reason", ""))
        return merged

    async def act(self, decision: Dict[str, Any]):
        """Выполнение решения (отправка команд дрону)."""
        command = decision.get("command")
        params = decision.get("params", {})

        logger.info(f"Выполнение команды: {command} с параметрами: {params}")

        try:
            # Управление моторами через PitControllers
            if self.pit_controllers and command in ["TAKEOFF", "LAND", "HOVER", "ARM", "DISARM"]:
                await self.pit_controllers.execute_command(command, params)

            # Отправка команды дрону
            if self.sim_client:
                result = await self.sim_client.send_command(command, **params)
            elif self.real_drone_client:
                result = await self.real_drone_client.send_command(command, **params)
            else:
                result = {"success": False, "error": "Нет подключения к дрону"}

            # Отправка через Mesh сеть
            if self.mesh_network:
                await self.mesh_network.broadcast({
                    "type": "command",
                    "command": command,
                    "agent_id": self.agent_id
                })

            # Обновление состояния
            if command in ["TAKEOFF", "GOTO", "FOLLOW_PATH"]:
                self.state = AgentState.FLYING
            elif command in ["LAND", "RTL"]:
                self.state = AgentState.LANDING

            # Уведомление субагента
            if self.sub_agent:
                await self.sub_agent.notify_action(command, result)

            # Уведомление о событии
            await self._notify_event("action", {"command": command, "result": result})

            return result
        except Exception as e:
            logger.error(f"Ошибка выполнения действия: {e}")
            return {"success": False, "error": str(e)}

    async def learn(self, experience: Dict[str, Any]):
        """Обучение агента на основе опыта."""
        try:
            # Сохранение опыта в долговременную память
            self.long_term_memory.store_experience(experience)

            # Обучение RL-агента
            if self.config.get('learning', {}).get('enabled', False):
                await self.learner.learn_from_experience(experience)

            # Консультация с субагентом
            if self.sub_agent:
                lessons = await self.sub_agent.analyze_experience(experience)
                await self._apply_lessons(lessons)

            logger.info("Обучение завершено успешно")
        except Exception as e:
            logger.error(f"Ошибка обучения: {e}")

    async def _apply_lessons(self, lessons: Dict[str, Any]):
        """Применение уроков от субагента."""
        if lessons.get("improvements"):
            for improvement in lessons["improvements"]:
                logger.info(f"Применяю улучшение: {improvement}")

    async def run_mission(self, mission: MissionParams):
        """Выполнение миссии."""
        self.current_mission = mission
        self.state = AgentState.FLYING
        logger.info(f"Начало миссии: {mission.name}")

        # Уведомление субагента
        await self.sub_agent.notify_mission_start(mission)

        # Уведомление о событии
        await self._notify_event("mission_start", {"mission": mission.to_dict()})

        # Данные миссии
        mission_data = {
            "start_time": datetime.now(),
            "waypoints_completed": [],
            "events": [],
            "data_collected": []
        }

        try:
            # Основной цикл миссии
            for waypoint in mission.waypoints:
                # Проверка на прерывание
                if self.state == AgentState.EMERGENCY:
                    break

                # Перемещение к точке
                result = await self._goto_waypoint(waypoint)
                if result.get("success"):
                    mission_data["waypoints_completed"].append(waypoint)
                    mission_data["events"].append({
                        "type": "waypoint_reached",
                        "waypoint": waypoint,
                        "timestamp": datetime.now()
                    })

                    # Сбор данных в точке
                    if mission.data_collection:
                        data = await self._collect_waypoint_data(waypoint)
                        mission_data["data_collected"].append(data)

                await asyncio.sleep(0.1)

            # Завершение миссии
            await self._complete_mission(mission, mission_data)

        except Exception as e:
            logger.error(f"Ошибка выполнения миссии: {e}")
            await self._handle_mission_failure(e)

    async def add_mission_to_queue(self, mission: MissionParams) -> int:
        """Добавление миссии в очередь - из v3.6."""
        mission.queue_position = len(self.mission_queue)
        self.mission_queue.append(mission)
        logger.info(f"Миссия {mission.name} добавлена в очередь (позиция: {mission.queue_position})")
        return mission.queue_position

    async def process_mission_queue(self):
        """Обработка очереди миссий - из v3.6."""
        while self.mission_queue:
            mission = self.mission_queue.pop(0)
            await self.run_mission(mission)

            # Обновление позиций
            for i, m in enumerate(self.mission_queue):
                m.queue_position = i

    async def _goto_waypoint(self, waypoint: Dict[str, float]) -> Dict[str, Any]:
        """Перемещение к точке маршрута."""
        command = "GOTO"
        params = {
            "x": waypoint.get("x", 0),
            "y": waypoint.get("y", 0),
            "z": waypoint.get("z", 10),
            "speed": waypoint.get("speed", 5.0)
        }

        if self.sim_client:
            return await self.sim_client.send_command(command, **params)
        elif self.real_drone_client:
            return await self.real_drone_client.send_command(command, **params)

        return {"success": False, "error": "Нет подключения"}

    async def _collect_waypoint_data(self, waypoint: Dict[str, float]) -> Dict[str, Any]:
        """Сбор данных в точке маршрута."""
        perception = await self.perceive()
        return {
            "waypoint": waypoint,
            "telemetry": perception.get("telemetry", {}),
            "timestamp": datetime.now().isoformat()
        }

    async def _complete_mission(self, mission: MissionParams, mission_data: Dict[str, Any]):
        """Завершение миссии."""
        logger.info(f"Миссия завершена: {mission.name}")

        # Формирование отчета
        report = {
            "mission_id": mission.mission_id,
            "mission_name": mission.name,
            "start_time": mission_data["start_time"],
            "end_time": datetime.now(),
            "status": "completed",
            "waypoints_completed": len(mission_data["waypoints_completed"]),
            "total_waypoints": len(mission.waypoints),
            "events": mission_data["events"],
            "data_collected": mission_data["data_collected"]
        }

        # Сохранение отчета
        import os
        os.makedirs("data/reports", exist_ok=True)
        report_path = f"data/reports/mission_{mission.mission_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)

        # Добавление в историю
        self.mission_history.append(report)

        # Уведомление субагента
        await self.sub_agent.notify_mission_complete(report)

        # Уведомление о событии
        await self._notify_event("mission_complete", {"report": report})

        # Обучение на основе миссии
        if mission.learning_enabled:
            experience = {
                "state": mission_data,
                "action": "complete_mission",
                "reward": len(mission_data["waypoints_completed"]) / len(mission.waypoints),
                "next_state": {}
            }
            await self.learn(experience)

        self.current_mission = None
        self.state = AgentState.READY

    async def _handle_mission_failure(self, error: Exception):
        """Обработка ошибки миссии."""
        logger.error(f"Ошибка миссии: {error}")

        # Уведомление о событии
        await self._notify_event("mission_error", {"error": str(error)})

        # Аварийная посадка
        await self.act({"command": "LAND", "reason": "Ошибка миссии", "priority": "high"})
        self.current_mission = None
        self.state = AgentState.READY

    async def shutdown(self):
        """Корректное завершение работы агента."""
        logger.info("Завершение работы агента...")

        # Завершение текущей миссии
        if self.current_mission:
            await self.act({"command": "LAND", "reason": "Завершение работы"})

        # Сохранение состояния
        await self.save_state()

        # Завершение субагента
        if self.sub_agent:
            await self.sub_agent.shutdown()

        # Завершение новых модулей
        if self.pit_controllers:
            await self.pit_controllers.shutdown()
        if self.mesh_network:
            await self.mesh_network.shutdown()
        if self.openq:
            await self.openq.shutdown()

        # Отключение от дрону
        if self.sim_client:
            await self.sim_client.disconnect()
        elif self.real_drone_client:
            await self.real_drone_client.disconnect()

        self.state = AgentState.SHUTDOWN
        logger.info("Агент завершил работу.")

    async def save_state(self):
        """Сохранение состояния агента."""
        try:
            state_data = {
                "agent_id": self.agent_id,
                "state": self.state.value,
                "telemetry": self.telemetry,
                "mission_history": self.mission_history[-10:] if self.mission_history else [],
                "timestamp": datetime.now().isoformat()
            }

            import os
            os.makedirs("data/state", exist_ok=True)

            with open(f"data/state/{self.agent_id}_state.json", "w", encoding='utf-8') as f:
                json.dump(state_data, f, indent=2)

        except Exception as e:
            logger.error(f"Ошибка сохранения состояния: {e}")

    async def load_state(self):
        """Загрузка состояния агента."""
        try:
            import os
            from pathlib import Path

            state_path = Path(f"data/state/{self.agent_id}_state.json")
            if state_path.exists():
                with open(state_path, 'r', encoding='utf-8') as f:
                    state_data = json.load(f)
                self.telemetry.update(state_data.get("telemetry", {}))
                self.mission_history = state_data.get("mission_history", [])
                logger.info("Состояние агента загружено")
                return True
        except Exception as e:
            logger.error(f"Ошибка загрузки состояния: {e}")
        return False

    async def get_status(self) -> Dict[str, Any]:
        """Получение статуса агента."""
        return {
            "agent_id": self.agent_id,
            "state": self.state.value,
            "mission": self.current_mission.to_dict() if self.current_mission else None,
            "mission_queue_length": len(self.mission_queue),
            "telemetry": self.telemetry,
            "tools_loaded": list(self.tools.keys()),
            "pit_controllers": self.pit_controllers is not None,
            "mesh_network": self.mesh_network is not None,
            "openq": self.openq is not None,
            "timestamp": datetime.now().isoformat()
        }
