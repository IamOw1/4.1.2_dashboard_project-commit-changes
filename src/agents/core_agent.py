"""
================================================================================
Core Agent - Главный агент управления дроном
Принимает решения, управляет полетом, выполняет миссии
================================================================================
"""
import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field

from .agent_roles import (
    AgentRole, TaskPriority, TaskType, Task, 
    TaskDistributor, CORE_CAPABILITIES
)
from .sub_agent import SubAgent
from src.utils.logger import setup_logger

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


@dataclass
class MissionParams:
    """Параметры миссии"""
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


class CoreAgent:
    """
    Core Agent - Главный агент системы управления дроном
    
    Обязанности:
    - Принимает решения
    - Управляет дроном
    - Выполняет миссии
    - Реагирует на чрезвычайные ситуации
    - Координирует работу Sub-Agent
    
    Core Agent имеет доступ ко всем функциям, но делегирует Sub-Agent:
    - Сбор и анализ данных
    - Ведение журналов
    - Построение карт
    - Расчеты и оптимизация
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.agent_id = self.config.get('agent_id', 'core_agent_001')
        self.state = AgentState.INITIALIZING
        self.role = AgentRole.CORE
        self.capabilities = CORE_CAPABILITIES
        
        # Инициализация Sub-Agent
        self.sub_agent = SubAgent(self.config, main_agent=self)
        
        # Распределитель задач
        self.task_distributor = TaskDistributor()
        
        # Телеметрия
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
        
        # Система событий
        self.event_bus = asyncio.Queue()
        self.command_queue = asyncio.Queue()
        self.event_callbacks: List[callable] = []
        
        # Текущая миссия и очередь
        self.current_mission: Optional[MissionParams] = None
        self.mission_queue: List[MissionParams] = []
        self.mission_history: List[Dict] = []
        
        # Журнал событий
        self.event_log: List[Dict] = []
        
        # Клиенты симуляторов и аппаратуры
        self.sim_mode = self.config.get('simulation', {}).get('enabled', False)
        self.sim_client = None
        self.real_drone_client = None
        self.mavlink_handler = None
        
        # Инструменты
        self.tools: Dict[str, Any] = {}
        
        # PitControllers
        self.pit_controllers = None
        
        # Mesh Network
        self.mesh_network = None
        
        # OpenQ
        self.openq = None
        
        logger.info(f"🎯 Core Agent {self.agent_id} инициализирован")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Загрузка конфигурации"""
        import yaml
        import os
        import re
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            def replace_env_vars(obj):
                if isinstance(obj, str):
                    pattern = r'\$\{([^}:]+)(?::([^}]*))?\}'
                    def replacer(match):
                        var_name = match.group(1)
                        default = match.group(2) or match.group(0)
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

    async def initialize(self):
        """Полная инициализация агента"""
        logger.info("🚀 Начало инициализации Core Agent...")
        
        # Инициализация PitControllers
        await self._init_pit_controllers()
        
        # Инициализация Mesh сети
        await self._init_mesh_network()
        
        # Инициализация OpenQ
        await self._init_openq()
        
        # Подключение к симулятору или реальному дрону
        if self.sim_mode:
            await self._init_simulator()
        else:
            await self._init_real_drone()
        
        # Загрузка инструментов
        await self._load_tools()
        
        # Инициализация Sub-Agent
        await self.sub_agent.initialize()
        
        # Загрузка сохраненного состояния
        await self.load_state()
        
        # Проверка всех систем
        await self._system_check()
        
        self.state = AgentState.READY
        logger.info("✅ Core Agent готов к работе")
        return True

    async def _init_pit_controllers(self):
        """Инициализация PitControllers (управление моторами)"""
        try:
            from src.controllers.pit_controllers import PitControllers
            pit_config = self.config.get('pit_controllers', {})
            self.pit_controllers = PitControllers(pit_config)
            await self.pit_controllers.initialize()
            logger.info("✅ PitControllers инициализированы")
        except Exception as e:
            logger.warning(f"⚠️ PitControllers не инициализированы: {e}")

    async def _init_mesh_network(self):
        """Инициализация Mesh сети"""
        try:
            from src.network.mesh_network import MeshNetwork
            mesh_config = self.config.get('mesh_network', {})
            self.mesh_network = MeshNetwork(mesh_config)
            await self.mesh_network.initialize()
            logger.info("✅ Mesh Network инициализирована")
        except Exception as e:
            logger.warning(f"⚠️ Mesh Network не инициализирована: {e}")

    async def _init_openq(self):
        """Инициализация OpenQ (сбор данных полета)"""
        try:
            from src.sensors.openq import OpenQ
            openq_config = self.config.get('openq', {})
            self.openq = OpenQ(openq_config)
            await self.openq.initialize()
            logger.info("✅ OpenQ инициализирован")
        except Exception as e:
            logger.warning(f"⚠️ OpenQ не инициализирован: {e}")

    async def _init_simulator(self):
        """Инициализация симулятора"""
        logger.info("🎮 Инициализация симулятора...")
        # Заглушка для симулятора
        self.sim_client = True

    async def _init_real_drone(self):
        """Инициализация реального дрона"""
        logger.info("🚁 Инициализация реального дрона...")
        try:
            from src.hardware.mavlink_handler import MAVLinkHandler
            self.mavlink_handler = MAVLinkHandler(self.config)
            await self.mavlink_handler.connect()
            self.real_drone_client = self.mavlink_handler
            logger.info("✅ Подключено к реальному дрону")
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к дрону: {e}")

    async def _load_tools(self):
        """Загрузка инструментов"""
        logger.info("🛠️ Загрузка инструментов...")
        tool_configs = self.config.get('tools', [])
        
        for tool_config in tool_configs:
            try:
                if not tool_config.get('enabled', True):
                    continue
                # Заглушка для инструментов
                self.tools[tool_config['module']] = {"enabled": True}
                logger.info(f"  ✓ {tool_config['module']}")
            except Exception as e:
                logger.error(f"  ✗ {tool_config}: {e}")

    async def _system_check(self):
        """Проверка всех систем"""
        logger.info("🔍 Проверка систем...")
        checks = []
        
        checks.append(("sub_agent", self.sub_agent is not None))
        checks.append(("pit_controllers", self.pit_controllers is not None))
        checks.append(("mesh_network", self.mesh_network is not None))
        checks.append(("openq", self.openq is not None))
        
        failed = [name for name, ok in checks if not ok]
        if failed:
            logger.warning(f"⚠️ Системы требуют внимания: {failed}")
        else:
            logger.info("✅ Все системы функционируют")
        
        return all(ok for _, ok in checks)

    async def perceive(self) -> Dict[str, Any]:
        """Сбор данных с датчиков - Core Agent выполняет или делегирует Sub-Agent"""
        perception = {"timestamp": datetime.now().isoformat()}
        
        # Собираем базовую телеметрию (Core)
        perception["telemetry"] = self.telemetry.copy()
        
        # Делегируем расширенный анализ Sub-Agent
        if self.sub_agent:
            analysis_task = self.task_distributor.create_task(
                task_type=TaskType.DATA_ANALYSIS,
                data={"telemetry": self.telemetry},
                priority=TaskPriority.MEDIUM,
                assigned_to=AgentRole.SUB
            )
            # Sub-Agent обработает в фоне
            asyncio.create_task(self.sub_agent.process_task(analysis_task))
        
        # OpenQ сбор данных
        if self.openq:
            flight_data = await self.openq.collect_data(self.telemetry)
            perception["flight_data"] = flight_data
        
        # Обновление телеметрии
        self.telemetry["timestamp"] = datetime.now().isoformat()
        
        return perception

    async def decide(self, perception_data: Dict[str, Any]) -> Dict[str, Any]:
        """Принятие решений - ТОЛЬКО Core Agent"""
        try:
            # Проверка на аварийные ситуации (высший приоритет)
            emergency = await self._check_emergency(perception_data)
            if emergency:
                logger.warning(f"🚨 Обнаружена аварийная ситуация: {emergency}")
                return await self._handle_emergency(emergency)
            
            # Консультация с Sub-Agent (рекомендации)
            if self.sub_agent:
                sub_recommendations = await self.sub_agent.recommend(
                    perception_data, 
                    self.current_mission
                )
                # Core Agent принимает окончательное решение
                decision = self._make_decision(perception_data, sub_recommendations)
            else:
                decision = self._make_decision(perception_data, {})
            
            return decision
            
        except Exception as e:
            logger.error(f"❌ Ошибка принятия решения: {e}")
            return await self._fallback_decision()

    async def _check_emergency(self, perception: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Проверка на экстренные ситуации"""
        telemetry = perception.get("telemetry", {})
        
        # Низкий заряд
        battery = telemetry.get("battery", 100)
        if battery < 20:
            return {"type": "low_battery", "severity": "high", "battery": battery}
        
        # Потеря сигнала
        signal = telemetry.get("signal_strength", 100)
        if signal < 30:
            return {"type": "signal_lost", "severity": "high", "signal": signal}
        
        # Перегрев
        temp = telemetry.get("temperature", 25)
        if temp > 60:
            return {"type": "overheating", "severity": "high", "temperature": temp}
        
        return None

    async def _handle_emergency(self, emergency: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка экстренной ситуации"""
        emergency_type = emergency.get("type")
        
        if emergency_type == "low_battery":
            return {"command": "RTL", "reason": "Низкий заряд батареи", "priority": "critical"}
        elif emergency_type == "signal_lost":
            return {"command": "RTL", "reason": "Потеря сигнала", "priority": "critical"}
        elif emergency_type == "overheating":
            return {"command": "LAND", "reason": "Перегрев", "priority": "critical"}
        
        return {"command": "LAND", "reason": "Неизвестная авария", "priority": "critical"}

    def _make_decision(
        self, 
        perception: Dict[str, Any], 
        recommendations: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Принятие окончательного решения Core Agent"""
        # Базовое решение
        decision = {
            "command": "HOVER",
            "reason": "Ожидание команд",
            "priority": "low"
        }
        
        # Учитываем рекомендации Sub-Agent
        if recommendations.get("suggested_command"):
            # Core Agent может принять или отклонить
            if recommendations.get("confidence", 0) > 0.8:
                decision["command"] = recommendations["suggested_command"]
                decision["reason"] = f"Рекомендация Sub-Agent: {recommendations.get('reason', '')}"
                decision["priority"] = recommendations.get("priority", "medium")
        
        return decision

    async def _fallback_decision(self) -> Dict[str, Any]:
        """Резервное решение"""
        return {"command": "HOVER", "reason": "Резервный режим", "priority": "medium"}

    async def act(self, decision: Dict[str, Any]):
        """Выполнение решения"""
        command = decision.get("command")
        params = decision.get("params", {})
        
        logger.info(f"🎮 Выполнение: {command} | {decision.get('reason', '')}")

        if command == "EMERGENCY_STOP":
            if self.pit_controllers:
                await self.pit_controllers.emergency_stop()
            self.state = AgentState.EMERGENCY
            if self.sub_agent:
                await self.sub_agent.notify_action("EMERGENCY_STOP", {"success": True})
            return {"success": True, "command": command}
        
        # Управление моторами через PitControllers
        pit_supported_commands = ["ARM", "DISARM", "TAKEOFF", "LAND", "HOVER", "SET_THROTTLE"]
        if self.pit_controllers and command in pit_supported_commands:
            await self.pit_controllers.execute_command(command, params)
        
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
        
        # Уведомление Sub-Agent
        if self.sub_agent:
            await self.sub_agent.notify_action(command, {"success": True})
        
        return {"success": True, "command": command}

    async def run_mission(self, mission: MissionParams):
        """Выполнение миссии"""
        self.current_mission = mission
        self.state = AgentState.FLYING
        logger.info(f"🎯 Начало миссии: {mission.name}")
        
        # Делегируем анализ и планирование Sub-Agent
        if self.sub_agent:
            route_optimization = await self.sub_agent.optimize_route(mission.waypoints)
            mission.waypoints = route_optimization.get("optimized_waypoints", mission.waypoints)
        
        # Core Agent выполняет миссию
        mission_data = {
            "start_time": datetime.now(),
            "waypoints_completed": [],
            "events": [],
            "data_collected": []
        }
        
        try:
            for waypoint in mission.waypoints:
                if self.state == AgentState.EMERGENCY:
                    break
                
                result = await self._goto_waypoint(waypoint)
                if result.get("success"):
                    mission_data["waypoints_completed"].append(waypoint)
                
                await asyncio.sleep(0.1)
            
            await self._complete_mission(mission, mission_data)
            
        except Exception as e:
            logger.error(f"❌ Ошибка миссии: {e}")
            await self._handle_mission_failure(e)

    async def _goto_waypoint(self, waypoint: Dict[str, float]) -> Dict[str, Any]:
        """Перемещение к точке"""
        return {"success": True, "waypoint": waypoint}

    async def _complete_mission(self, mission: MissionParams, mission_data: Dict):
        """Завершение миссии"""
        logger.info(f"✅ Миссия завершена: {mission.name}")
        
        report = {
            "mission_id": mission.mission_id,
            "mission_name": mission.name,
            "status": "completed",
            "start_time": mission_data["start_time"].isoformat(),
            "end_time": datetime.now().isoformat(),
            "waypoints_completed": len(mission_data["waypoints_completed"])
        }
        
        # Sub-Agent анализирует результаты
        if self.sub_agent:
            analysis = await self.sub_agent.analyze_mission(report)
            report["analysis"] = analysis
        
        self.current_mission = None
        self.state = AgentState.READY
        
        return report

    async def _handle_mission_failure(self, error: Exception):
        """Обработка ошибки миссии"""
        logger.error(f"❌ Ошибка миссии: {error}")
        await self.act({"command": "LAND", "reason": "Ошибка миссии", "priority": "high"})
        self.current_mission = None
        self.state = AgentState.READY

    async def shutdown(self):
        """Корректное завершение работы"""
        logger.info("🛑 Завершение работы Core Agent...")
        
        if self.state == AgentState.FLYING:
            await self.act({"command": "LAND", "reason": "Завершение работы"})
        
        await self.save_state()
        
        if self.sub_agent:
            await self.sub_agent.shutdown()
        if self.pit_controllers:
            await self.pit_controllers.shutdown()
        if self.mesh_network:
            await self.mesh_network.shutdown()
        if self.openq:
            await self.openq.shutdown()
        
        self.state = AgentState.SHUTDOWN
        logger.info("👋 Core Agent завершил работу")

    async def save_state(self):
        """Сохранение состояния"""
        try:
            state_data = {
                "agent_id": self.agent_id,
                "state": self.state.value,
                "telemetry": self.telemetry,
                "timestamp": datetime.now().isoformat()
            }
            
            import os
            os.makedirs("data/state", exist_ok=True)
            
            with open(f"data/state/{self.agent_id}_state.json", "w") as f:
                json.dump(state_data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Ошибка сохранения состояния: {e}")

    async def load_state(self):
        """Загрузка состояния"""
        try:
            import os
            from pathlib import Path
            
            state_path = Path(f"data/state/{self.agent_id}_state.json")
            if state_path.exists():
                with open(state_path, 'r') as f:
                    state_data = json.load(f)
                self.telemetry.update(state_data.get("telemetry", {}))
                logger.info("✅ Состояние загружено")
                return True
        except Exception as e:
            logger.error(f"Ошибка загрузки состояния: {e}")
        return False

    async def get_status(self) -> Dict[str, Any]:
        """Получение статуса"""
        return {
            "agent_id": self.agent_id,
            "role": self.role.value,
            "state": self.state.value,
            "mission": self.current_mission.to_dict() if self.current_mission else None,
            "telemetry": self.telemetry,
            "sub_agent_online": self.sub_agent is not None,
            "timestamp": datetime.now().isoformat()
        }
