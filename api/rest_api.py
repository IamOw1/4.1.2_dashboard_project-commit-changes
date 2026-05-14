"""
REST API для управления дроном
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
import asyncio
import json
import base64
import os

from agent.core import DroneIntelligentAgent
from agent.core_agent import AgentState
from utils.logger import setup_logger, Logger

logger = setup_logger(__name__)
event_log = Logger()

# Mock classes for demo
class MockDroneIntelligentAgent:
    def __init__(self):
        self.agent_id = "mock_agent"
        self.state = type('obj', (object,), {'value': 'READY'})()

    async def initialize(self):
        return True

    async def shutdown(self):
        pass

    async def get_status(self):
        return {"status": "ready", "agent_id": self.agent_id}

    async def get_short_term_memory(self):
        return []

    async def ask_sub_agent(self, question):
        return f"Mock response to: {question}"

class MockAdvancedLearningAgent:
    async def get_available_tasks(self):
        return ["task1", "task2"]

    async def start_training(self, task, config):
        return "training_id"

    async def update_config(self, config):
        pass

class MockAmorfusTool:
    def __init__(self, config):
        pass

    async def get_fleet_status(self):
        return {"drones": []}

    async def get_drone_telemetry(self, drone_id):
        return {"altitude": 10, "speed": 5}

class MockObjectDetectionTool:
    def __init__(self, config):
        pass

# Опциональные модули (без них API работает на заглушках)
try:
    from agent.advanced_learning import AdvancedLearningAgent
    from tools.amorfus import AmorfusTool
    from tools.object_detection import ObjectDetectionTool
except ImportError:
    AdvancedLearningAgent = MockAdvancedLearningAgent
    AmorfusTool = MockAmorfusTool
    ObjectDetectionTool = MockObjectDetectionTool

# Модели данных
class MissionRequest(BaseModel):
    name: str
    waypoints: List[Dict[str, float]]
    altitude: float = 30.0
    speed: float = 5.0

class CommandRequest(BaseModel):
    command: str
    params: Optional[Dict[str, Any]] = {}

class ConfigRequest(BaseModel):
    key: str
    value: Any

class LearningConfigRequest(BaseModel):
    task: str = "default"
    config: Dict[str, Any] = {}

class FleetFormationRequest(BaseModel):
    formation: str = "line"
    spacing: float = 5.0

class AlertConfigRequest(BaseModel):
    email: Optional[str] = None
    telegram: Optional[str] = None
    webhook: Optional[str] = None

class BackupRequest(BaseModel):
    components: List[str] = ["missions", "config"]

class RestoreRequest(BaseModel):
    mode: str = "merge"  # merge or replace

class ExportRequest(BaseModel):
    format: str = "json"
    start: Optional[str] = None
    end: Optional[str] = None

class EventFilterRequest(BaseModel):
    level: Optional[str] = None
    source: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None

class EventAlertConfig(BaseModel):
    email: Optional[str] = None
    telegram: Optional[str] = None
    webhook: Optional[str] = None

class BackupCreateRequest(BaseModel):
    components: List[str] = ["missions", "config", "models"]

class BackupRestoreRequest(BaseModel):
    mode: str = "merge"  # merge or replace

class ExportMissionsRequest(BaseModel):
    format: str = "json"
    start: Optional[str] = None
    end: Optional[str] = None

class ExportTelemetryRequest(BaseModel):
    format: str = "json"
    start: Optional[str] = None
    end: Optional[str] = None


class DemoModeBody(BaseModel):
    """Тело запроса переключения демо-режима с дашборда."""

    enabled: bool = True


class SimConnectBody(BaseModel):
    """Подключение к симулятору (Webots, AirSim и др.)."""

    simulator_id: str
    host: str = "127.0.0.1"
    port: Optional[int] = None


class ModelDownloadRequest(BaseModel):
    """Загрузка языковой модели по HTTP(S) в каталог data/models (on-premise)."""

    url: str
    slot: str = "core"

    @field_validator("slot")
    @classmethod
    def slot_ok(cls, v: str) -> str:
        if v not in ("core", "sub"):
            raise ValueError("slot должен быть core или sub")
        return v

    @field_validator("url")
    @classmethod
    def url_ok(cls, v: str) -> str:
        from urllib.parse import urlparse

        p = urlparse(v.strip())
        if p.scheme not in ("http", "https"):
            raise ValueError("разрешены только схемы http и https")
        if not p.netloc:
            raise ValueError("некорректный URL")
        return v.strip()


# Глобальные переменные
agent: Optional[DroneIntelligentAgent] = None
learning_agent: Optional[AdvancedLearningAgent] = None
swarm_manager: Optional[AmorfusTool] = None
detection_tool: Optional[ObjectDetectionTool] = None

# Дополнительные глобальные переменные для новых функций
events_log: List[Dict[str, Any]] = []
backups: List[Dict[str, Any]] = []
mesh_topology: Dict[str, Any] = {"nodes": [], "links": []}
camera_frame: bytes = b""  # Placeholder for camera frame
detection_results: List[Dict[str, Any]] = []
# Настройки дашборда (демо-хранилище в памяти + синхронизация с .env при чтении)
_runtime_settings: Dict[str, Any] = {}
# Активное подключение к симулятору (сессия API-процесса)
_simulator_session: Dict[str, Any] = {
    "simulator_id": None,
    "host": None,
    "port": None,
    "status": "offline",
}

app = FastAPI(
    title="COBA AI Drone Agent API",
    description="API для управления дроном с ИИ-агентом",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_app(drone_agent: DroneIntelligentAgent = None) -> FastAPI:
    """
    Создание приложения FastAPI.

    Args:
        drone_agent (DroneIntelligentAgent): Экземпляр агента.

    Returns:
        FastAPI: Приложение FastAPI.
    """
    global agent, learning_agent, swarm_manager, detection_tool
    agent = drone_agent

    # Инициализация дополнительных компонентов
    if not learning_agent:
        learning_agent = AdvancedLearningAgent()
    if not swarm_manager:
        swarm_manager = AmorfusTool({})
    if not detection_tool:
        detection_tool = ObjectDetectionTool({})

    return app


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "name": "COBA AI Drone Agent API",
        "version": "2.0.0",
        "status": "active"
    }


@app.get("/api/v1/agent/status")
async def get_agent_status():
    """Получение статуса агента"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    status = await agent.get_status()
    return status


@app.post("/api/v1/agent/initialize")
async def initialize_agent():
    """Инициализация агента"""
    global agent

    if not agent:
        agent = DroneIntelligentAgent()

    success = await agent.initialize()

    return {
        "success": success,
        "agent_id": agent.agent_id,
        "status": agent.state.value
    }


@app.post("/api/v1/agent/shutdown")
async def shutdown_agent():
    """Завершение работы агента"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    await agent.shutdown()

    return {
        "success": True,
        "message": "Агент завершил работу"
    }


@app.post("/api/v1/mission/start")
async def start_mission(mission: MissionRequest, background_tasks: BackgroundTasks):
    """Запуск миссии"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    from agent.core import MissionParams

    mission_params = MissionParams(
        name=mission.name,
        mission_id=f"mission_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        waypoints=mission.waypoints,
        altitude=mission.altitude,
        speed=mission.speed
    )

    # Запуск миссии в фоне
    background_tasks.add_task(agent.run_mission, mission_params)

    return {
        "success": True,
        "mission_id": mission_params.mission_id,
        "status": "started"
    }


@app.post("/api/v1/mission/stop")
async def stop_mission():
    """Остановка текущей миссии"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    agent.state = AgentState.READY

    return {
        "success": True,
        "message": "Миссия остановлена"
    }


@app.get("/api/v1/mission/status")
async def get_mission_status():
    """Получение статуса миссии"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    return {
        "current_mission": agent.current_mission.to_dict() if agent.current_mission else None,
        "mission_history": agent.mission_history
    }


@app.post("/api/v1/command")
async def send_command(request: CommandRequest):
    """Отправка команды дрону"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    result = await agent.process_command(request.command, request.params)

    return result


@app.post("/api/v1/emergency/stop")
async def emergency_stop():
    """Аварийная остановка"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    await agent.emergency_stop()

    return {
        "success": True,
        "message": "Аварийная остановка выполнена"
    }


@app.get("/api/v1/telemetry")
async def get_telemetry():
    """Получение телеметрии"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    return {
        "telemetry": agent.telemetry
    }


@app.get("/api/v1/tools")
async def get_tools():
    """Получение списка инструментов"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    return {
        "tools": [
            {
                "name": name,
                "description": tool.description,
                "status": tool.status.value if hasattr(tool, 'status') else "unknown"
            }
            for name, tool in agent.tools.items()
        ]
    }


@app.post("/api/v1/tools/{tool_name}/execute")
async def execute_tool(tool_name: str, request: CommandRequest):
    """Выполнение инструмента"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    if tool_name not in agent.tools:
        raise HTTPException(status_code=404, detail=f"Инструмент {tool_name} не найден")

    tool = agent.tools[tool_name]
    result = await tool.execute(request.command, request.params)

    return result


@app.get("/api/v1/learning/progress")
async def get_learning_progress():
    """Получение прогресса обучения"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    progress = agent.learner.get_progress()

    return {
        "learning_progress": progress
    }


@app.get("/api/v1/memory/short_term")
async def get_short_term_memory(limit: int = 10):
    """Получение краткосрочной памяти"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    memory = agent.short_term_memory.get_recent(limit)

    return {
        "memory": memory,
        "count": len(memory)
    }


@app.get("/api/v1/sub_agent/ask")
async def ask_sub_agent(question: str):
    """Вопрос субагенту"""
    if not agent or not agent.sub_agent:
        raise HTTPException(status_code=503, detail="Субагент не инициализирован")

    answer = await agent.sub_agent.ask(question)

    return {
        "question": question,
        "answer": answer
    }


@app.get("/api/v1/reports/missions")
async def get_mission_reports():
    """Получение отчетов о миссиях"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    return {
        "reports": agent.mission_history
    }


@app.get("/health")
async def health_check():
    """Проверка здоровья API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent_connected": agent is not None
    }


# --- Новые эндпоинты для расширенного дашборда ---

# Обучение (Learning)
@app.post("/api/v1/learning/start")
async def start_learning(request: LearningConfigRequest):
    """Запуск обучения"""
    if not learning_agent:
        raise HTTPException(status_code=503, detail="Обучение не инициализировано")

    try:
        result = await learning_agent.start_training(request.task, request.config)
        return {"status": "started", "task_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/learning/config")
async def update_learning_config(config: Dict[str, Any]):
    """Обновление конфигурации обучения"""
    if not learning_agent:
        raise HTTPException(status_code=503, detail="Обучение не инициализировано")

    try:
        await learning_agent.update_config(config)
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/learning/tasks")
async def get_learning_tasks():
    """Получение доступных задач обучения"""
    if not learning_agent:
        raise HTTPException(status_code=503, detail="Обучение не инициализировано")

    try:
        tasks = await learning_agent.get_available_tasks()
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/learning/curriculum/progress")
async def update_curriculum_progress(progress: Dict[str, Any]):
    """Обновление прогресса curriculum"""
    if not learning_agent:
        raise HTTPException(status_code=503, detail="Обучение не инициализировано")

    try:
        await learning_agent.update_curriculum(progress)
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/learning/export")
async def export_learning_model(path: str = "models/exported_model.pkl"):
    """Экспорт обученной модели"""
    if not learning_agent:
        raise HTTPException(status_code=503, detail="Обучение не инициализировано")

    try:
        await learning_agent.export_model(path)
        return {"status": "exported", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Флот (Fleet)
@app.get("/api/v1/fleet/status")
async def get_fleet_status():
    """Получение статуса флота"""
    if not swarm_manager:
        raise HTTPException(status_code=503, detail="Флот не инициализирован")

    try:
        status = await swarm_manager.get_fleet_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/fleet/{drone_id}/telemetry")
async def get_drone_telemetry(drone_id: str):
    """Получение телеметрии дрона"""
    if not swarm_manager:
        raise HTTPException(status_code=503, detail="Флот не инициализирован")

    try:
        telemetry = await swarm_manager.get_drone_telemetry(drone_id)
        return telemetry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fleet/formation")
async def set_fleet_formation(request: FleetFormationRequest):
    """Установка формации флота"""
    if not swarm_manager:
        raise HTTPException(status_code=503, detail="Флот не инициализирован")

    try:
        await swarm_manager.set_formation(request.formation, request.spacing)
        return {"status": "set"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fleet/swap_leader")
async def swap_fleet_leader(leader_id: int = 0):
    """Смена лидера флота"""
    if not swarm_manager:
        raise HTTPException(status_code=503, detail="Флот не инициализирован")

    try:
        await swarm_manager.swap_leader(leader_id)
        return {"status": "swapped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/mesh/topology")
async def get_mesh_topology():
    """Получение топологии mesh-сети"""
    if not swarm_manager:
        raise HTTPException(status_code=503, detail="Флот не инициализирован")

    try:
        topology = await swarm_manager.get_mesh_topology()
        return topology
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Камера (Camera)
@app.get("/api/v1/camera/frame")
async def get_camera_frame():
    """Получение кадра с камеры"""
    if not detection_tool:
        raise HTTPException(status_code=503, detail="Камера не инициализирована")

    try:
        raw = await detection_tool.get_current_frame()
        if isinstance(raw, dict) and "frame" in raw:
            return raw
        return {"frame": raw}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/camera/stream")
async def get_camera_stream():
    """Получение URL потока камеры"""
    return {"stream_url": "ws://localhost:8000/ws/camera"}

@app.post("/api/v1/camera/record/start")
async def start_camera_recording():
    """Начало записи с камеры"""
    if not detection_tool:
        raise HTTPException(status_code=503, detail="Камера не инициализирована")

    try:
        await detection_tool.start_recording()
        return {"status": "recording"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/camera/record/stop")
async def stop_camera_recording():
    """Остановка записи с камеры"""
    if not detection_tool:
        raise HTTPException(status_code=503, detail="Камера не инициализирована")

    try:
        path = await detection_tool.stop_recording()
        return {"status": "stopped", "file": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/detection/results")
async def get_detection_results():
    """Получение результатов обнаружения объектов"""
    if not detection_tool:
        raise HTTPException(status_code=503, detail="Обнаружение не инициализировано")

    try:
        results = await detection_tool.get_latest_detections()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# События (Events)
@app.get("/api/v1/events/log")
async def get_event_log(limit: int = 100):
    """Получение журнала событий"""
    try:
        logs = await event_log.get_recent_logs(limit)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/events/filter")
async def filter_events(
    level: Optional[str] = None,
    component: Optional[str] = None,
    drone_id: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None
):
    """Фильтрация событий"""
    try:
        filtered = await event_log.filter_logs(level, component, drone_id, start, end)
        return {"logs": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/events/alert/config")
async def configure_alerts(request: AlertConfigRequest):
    """Настройка оповещений"""
    try:
        await event_log.configure_alerts(request.model_dump(exclude_unset=True))
        return {"status": "configured"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/events/log/{event_id}")
async def delete_event(event_id: str):
    """Удаление события"""
    try:
        await event_log.delete_event(event_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/events/export")
async def export_events(format_type: str = "json"):
    """Экспорт событий"""
    try:
        data = await event_log.export_logs(format_type)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/events/statistics")
async def get_event_statistics():
    """Получение статистики событий"""
    try:
        stats = await event_log.get_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Бэкапы (Backups)
@app.post("/api/v1/backup/create")
async def create_backup(request: BackupRequest):
    """Создание бэкапа"""
    try:
        backup_id = await create_backup_function(request.components)
        return {"backup_id": backup_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/backup/list")
async def list_backups():
    """Список бэкапов"""
    try:
        backups = await list_backup_files()
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/backup/restore/{backup_id}")
async def restore_backup(backup_id: str, request: RestoreRequest):
    """Восстановление из бэкапа"""
    try:
        await restore_backup_function(backup_id, request.mode)
        return {"status": "restored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/backup/{backup_id}")
async def delete_backup(backup_id: str):
    """Удаление бэкапа"""
    try:
        await delete_backup_file(backup_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/export/missions")
async def export_missions(request: ExportRequest):
    """Экспорт миссий"""
    try:
        data = await export_missions_function(request.format)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/export/telemetry")
async def export_telemetry(request: ExportRequest):
    """Экспорт телеметрии"""
    try:
        data = await export_telemetry_function(request.start, request.end)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/export/models")
async def export_models():
    """Экспорт моделей"""
    try:
        data = await export_models_function()
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/settings")
async def get_dashboard_settings():
    """Агрегированные настройки для дашборда (env + сессионные overrides)."""
    env_keys = (
        "DEMO_MODE",
        "SIMULATION_MODE",
        "SIMULATOR_TYPE",
        "DRONE_TYPE",
        "RC_SOURCE",
        "RC_DEVICE",
        "LOG_LEVEL",
        "BACKEND_PORT",
        "FRONTEND_PORT",
        "VITE_API_URL",
    )
    data = {k: os.getenv(k, "") for k in env_keys}
    data["overrides"] = dict(_runtime_settings)
    return data


@app.post("/api/v1/settings")
async def post_dashboard_setting(request: ConfigRequest):
    """Обновление одной настройки в памяти процесса (демо; для продакшена — .env вручную)."""
    _runtime_settings[request.key] = request.value
    return {"ok": True, "key": request.key, "value": request.value}


_SIM_DEFAULT_PORTS: Dict[str, int] = {
    "airsim": 41451,
    "gazebo": 11345,
    "pybullet": 6010,
    "webots": 10001,
    "jmavsim": 14560,
    "unity": 7777,
    "carla": 2000,
    "isaac": 50051,
    "simnet": 9000,
    "skyrover": 8899,
    "unreal": 8000,
    "grid": 14540,
}


@app.post("/api/v1/runtime/demo_mode")
async def set_runtime_demo_mode(body: DemoModeBody):
    """
    Переключение демо-режима с дашборда.

    Обновляет переменную окружения процесса API; агент читает ``DEMO_MODE`` при
    инициализации и в цикле восприятия. Для смены RC/MAVLink после «реального»
    режима рекомендуется перезапуск ``python main.py api``.
    """
    os.environ["DEMO_MODE"] = "true" if body.enabled else "false"
    _runtime_settings["DEMO_MODE"] = os.environ["DEMO_MODE"]
    return {
        "ok": True,
        "demo_mode": body.enabled,
        "DEMO_MODE": os.environ["DEMO_MODE"],
    }


@app.get("/api/v1/simulators/status")
async def simulators_status():
    """Текущее подключение к симулятору (в т.ч. Webots) и переменные окружения."""
    return {
        "session": dict(_simulator_session),
        "SIMULATOR_TYPE": os.getenv("SIMULATOR_TYPE", _runtime_settings.get("SIMULATOR_TYPE", "")),
        "SIMULATION_MODE": os.getenv("SIMULATION_MODE", ""),
    }


@app.post("/api/v1/simulators/connect")
async def simulators_connect(body: SimConnectBody):
    """Регистрация подключения к симулятору; выставляет ``SIMULATOR_TYPE`` для бэкенда."""
    global _simulator_session
    sid = body.simulator_id.strip().lower()
    port = body.port if body.port is not None else _SIM_DEFAULT_PORTS.get(sid)
    if port is None:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестный симулятор «{body.simulator_id}» без явного поля port",
        )
    _simulator_session = {
        "simulator_id": sid,
        "host": body.host,
        "port": port,
        "status": "connected",
        "since": datetime.now().isoformat(),
    }
    os.environ["SIMULATOR_TYPE"] = sid
    os.environ["SIMULATION_MODE"] = "true"
    _runtime_settings["SIMULATOR_TYPE"] = sid
    _runtime_settings["SIMULATION_MODE"] = "true"
    return {"ok": True, "session": dict(_simulator_session)}


@app.post("/api/v1/simulators/disconnect")
async def simulators_disconnect():
    """Сброс сессии симулятора (без остановки внешнего процесса Webots/AirSim)."""
    global _simulator_session
    _simulator_session = {
        "simulator_id": None,
        "host": None,
        "port": None,
        "status": "offline",
    }
    os.environ["SIMULATION_MODE"] = "false"
    _runtime_settings["SIMULATION_MODE"] = "false"
    return {"ok": True, "session": dict(_simulator_session)}


@app.post("/api/v1/models/download")
async def download_llm_model(req: ModelDownloadRequest):
    """
    Скачивание файла модели по HTTP(S) в ``data/models/{core|sub}_agent/``.

    Лимит размера 512 МБ за один запрос (защита on-premise). После загрузки
    выставляет переменную окружения ``CORE_AGENT_MODEL_PATH`` или
    ``SUB_AGENT_MODEL_PATH`` на сохранённый путь.
    """
    from pathlib import Path
    from urllib.parse import urlparse

    import httpx

    folder = Path("data/models") / f"{req.slot}_agent"
    folder.mkdir(parents=True, exist_ok=True)
    path_name = Path(urlparse(req.url).path).name or ("model.gguf" if "gguf" in req.url else "model.bin")
    dest = folder / path_name[:180]
    max_bytes = 512 * 1024 * 1024
    total = 0
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0), follow_redirects=True) as client:
            async with client.stream("GET", req.url) as resp:
                resp.raise_for_status()
                with open(dest, "wb") as out:
                    async for chunk in resp.aiter_bytes(65536):
                        total += len(chunk)
                        if total > max_bytes:
                            raise HTTPException(
                                status_code=400,
                                detail="Превышен лимит 512 МБ; для больших моделей используйте wget/curl локально.",
                            )
                        out.write(chunk)
    except httpx.HTTPError as e:
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(status_code=502, detail=f"Ошибка загрузки: {e}") from e

    rel = str(dest).replace("\\", "/")
    env_key = "CORE_AGENT_MODEL_PATH" if req.slot == "core" else "SUB_AGENT_MODEL_PATH"
    os.environ[env_key] = rel
    _runtime_settings[env_key] = rel
    return {"ok": True, "path": rel, "bytes": total, "env_key": env_key}


@app.post("/api/v1/system/self_test")
async def system_self_test():
    """
    Самопроверка подсистем для кнопки «Запустить тест систем» на странице настроек.

    Не заменяет калибровку железа; проверяет доступность ключевых модулей процесса API.
    """
    checks: List[Dict[str, Any]] = []
    checks.append({"id": "api", "ok": True, "detail": "процесс FastAPI отвечает"})
    checks.append(
        {
            "id": "agent",
            "ok": agent is not None,
            "detail": "экземпляр агента создан" if agent else "агент не инициализирован (вызовите POST /api/v1/agent/initialize)",
        }
    )
    checks.append({"id": "learning", "ok": learning_agent is not None, "detail": "модуль обучения загружен"})
    checks.append({"id": "swarm", "ok": swarm_manager is not None, "detail": "инструмент роя (Amorfus) загружен"})
    checks.append({"id": "detection", "ok": detection_tool is not None, "detail": "детекция объектов загружена"})
    demo = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes", "on")
    checks.append({"id": "demo_mode", "ok": True, "detail": f"DEMO_MODE={'on' if demo else 'off'}"})
    all_ok = all(bool(c.get("ok")) for c in checks)
    return {"ok": all_ok, "checks": checks, "timestamp": datetime.now().isoformat()}


@app.get("/api/v1/sensors/link-quality")
async def sensors_link_quality():
    """Датчики качества связи (демо-данные для дашборда)."""
    tel = getattr(agent, "telemetry", {}) if agent else {}
    return {
        "wifi_dbm": tel.get("signal_strength", -58),
        "mesh_latency_ms": 12.4,
        "packet_loss_pct": 0.02,
        "radio_mhz": 868,
        "encryption": "AES-256",
        "failover": "auto",
    }


@app.get("/api/v1/sensors/environment")
async def sensors_environment():
    """Сенсоры состояния и окружающей среды."""
    tel = getattr(agent, "telemetry", {}) if agent else {}
    return {
        "temperature_c": tel.get("temperature", 25.0),
        "pressure_mmhg": 756.0,
        "humidity_pct": 42.0,
        "wind_ms": 6.2,
        "battery_v": tel.get("battery", 24.1) if isinstance(tel.get("battery"), (int, float)) else 24.1,
    }


@app.get("/api/v1/sensors/navigation")
async def sensors_navigation():
    """Навигационные сенсоры (GPS/IMU)."""
    tel = getattr(agent, "telemetry", {}) if agent else {}
    pos = tel.get("position", {}) if isinstance(tel, dict) else {}
    att = tel.get("attitude", {}) if isinstance(tel, dict) else {}
    return {
        "gps_fix": tel.get("gps_status", "3D_FIX"),
        "satellites": 14,
        "imu_calibrated": True,
        "position": pos,
        "attitude": att,
    }


@app.get("/api/v1/sensors/visual")
async def sensors_visual():
    """Визуальные сенсоры (камера, depth)."""
    return {
        "main_camera": "4K/30",
        "thermal": "enabled",
        "depth": "stereo",
        "autofocus": "tracking",
    }


# Вспомогательные функции для бэкапов
async def create_backup_function(components: List[str]) -> str:
    """Создание бэкапа"""
    backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    # Реализовать логику создания бэкапа
    return backup_id

async def list_backup_files() -> List[Dict]:
    """Список бэкапов"""
    # Реализовать логику списка
    return []

async def restore_backup_function(backup_id: str, mode: str):
    """Восстановление бэкапа"""
    # Реализовать логику восстановления
    pass

async def delete_backup_file(backup_id: str):
    """Удаление бэкапа"""
    # Реализовать логику удаления
    pass

async def export_missions_function(format_type: str) -> Dict:
    """Экспорт миссий"""
    # Реализовать логику экспорта
    return {}

async def export_telemetry_function(start: Optional[str], end: Optional[str]) -> Dict:
    """Экспорт телеметрии"""
    # Реализовать логику экспорта
    return {}

async def export_models_function() -> Dict:
    """Экспорт моделей"""
    # Реализовать логику экспорта
    return {}


# WebSocket для real-time данных (опционально)
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket):
    """WebSocket для телеметрии в реальном времени"""
    await websocket.accept()

    try:
        while True:
            if agent:
                telemetry = await agent.perceive()
            else:
                telemetry = {
                    "demo": True,
                    "timestamp": datetime.now().isoformat(),
                    "telemetry": {"battery": 87.5, "signal_strength": 82, "mode": "no_agent"},
                }
            await websocket.send_json(telemetry)
            await asyncio.sleep(0.1)  # 10 Hz
    except Exception as e:
        logger.error(f"WebSocket ошибка: {e}")
    finally:
        await websocket.close()
