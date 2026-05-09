"""
REST API для управления дроном
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

from agent.core import DroneIntelligentAgent
from agent.advanced_learning import AdvancedLearningAgent
from tools.amorfus import AmorfusTool
from tools.object_detection import ObjectDetectionTool
from utils.logger import setup_logger, Logger

logger = setup_logger(__name__)

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

# Try to import real classes, fallback to mock
try:
    from agent.core import DroneIntelligentAgent
    from agent.advanced_learning import AdvancedLearningAgent
    from tools.amorfus import AmorfusTool
    from tools.object_detection import ObjectDetectionTool
except ImportError:
    DroneIntelligentAgent = MockDroneIntelligentAgent
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

    # Установка статуса для остановки миссии
    agent.state = agent.agent.state.__class__.READY if hasattr(agent, 'state') else None

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
        frame = await detection_tool.get_current_frame()
        return {"frame": frame}
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
        logs = await logger.get_recent_logs(limit)
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
        filtered = await logger.filter_logs(level, component, drone_id, start, end)
        return {"logs": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/events/alert/config")
async def configure_alerts(request: AlertConfigRequest):
    """Настройка оповещений"""
    try:
        await logger.configure_alerts(request.dict())
        return {"status": "configured"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/events/log/{event_id}")
async def delete_event(event_id: str):
    """Удаление события"""
    try:
        await logger.delete_event(event_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/events/export")
async def export_events(format_type: str = "json"):
    """Экспорт событий"""
    try:
        data = await logger.export_logs(format_type)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/events/statistics")
async def get_event_statistics():
    """Получение статистики событий"""
    try:
        stats = await logger.get_statistics()
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


# Новые эндпоинты для dashboard-warm-heart

@app.get("/api/v1/mesh/topology")
async def get_mesh_topology():
    """Получение топологии mesh-сети"""
    global mesh_topology
    # В реальности получить из swarm_manager или mesh_network
    return mesh_topology

@app.get("/api/v1/camera/frame")
async def get_camera_frame():
    """Получение кадра с камеры"""
    global camera_frame
    if not camera_frame:
        # Placeholder image
        camera_frame = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
    return Response(content=camera_frame, media_type="image/png")

@app.get("/api/v1/camera/stream")
async def get_camera_stream():
    """URL для стрима камеры"""
    return {"stream_url": "http://localhost:8000/api/v1/camera/frame"}  # Placeholder

@app.post("/api/v1/camera/record/start")
async def start_camera_recording():
    """Запуск записи видео"""
    return {"status": "recording_started"}

@app.post("/api/v1/camera/record/stop")
async def stop_camera_recording():
    """Остановка записи видео"""
    return {"status": "recording_stopped"}

@app.get("/api/v1/detection/results")
async def get_detection_results():
    """Результаты детекции объектов"""
    global detection_results
    return {"detections": detection_results}

@app.get("/api/v1/events/log")
async def get_events_log(limit: int = 100):
    """Журнал событий"""
    global events_log
    return {"events": events_log[-limit:]}

@app.get("/api/v1/events/filter")
async def filter_events(request: EventFilterRequest = None):
    """Фильтрация событий"""
    global events_log
    filtered = events_log
    if request:
        if request.level:
            filtered = [e for e in filtered if e.get("level") == request.level]
        if request.source:
            filtered = [e for e in filtered if e.get("source") == request.source]
        # Добавить фильтры по времени
    return {"events": filtered}

@app.post("/api/v1/events/alert/config")
async def set_event_alerts(config: EventAlertConfig):
    """Настройка оповещений о событиях"""
    return {"status": "configured"}

@app.delete("/api/v1/events/log/{event_id}")
async def delete_event(event_id: str):
    """Удаление события"""
    global events_log
    events_log = [e for e in events_log if e.get("id") != event_id]
    return {"status": "deleted"}

@app.get("/api/v1/events/export")
async def export_events():
    """Экспорт событий"""
    global events_log
    return {"data": events_log}

@app.get("/api/v1/events/statistics")
async def get_event_statistics():
    """Статистика событий"""
    global events_log
    stats = {"total": len(events_log), "levels": {}}
    for event in events_log:
        level = event.get("level", "unknown")
        stats["levels"][level] = stats["levels"].get(level, 0) + 1
    return stats

@app.post("/api/v1/backup/create")
async def create_backup(request: BackupCreateRequest):
    """Создание бэкапа"""
    global backups
    backup_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    backup = {
        "id": backup_id,
        "created_at": datetime.now().isoformat(),
        "components": request.components,
        "size": "1.2MB"  # Placeholder
    }
    backups.append(backup)
    return {"backup_id": backup_id}

@app.get("/api/v1/backup/list")
async def list_backups():
    """Список бэкапов"""
    global backups
    return {"backups": backups}

@app.post("/api/v1/backup/restore/{backup_id}")
async def restore_backup(backup_id: str, request: BackupRestoreRequest):
    """Восстановление бэкапа"""
    return {"status": "restored"}

@app.delete("/api/v1/backup/{backup_id}")
async def delete_backup(backup_id: str):
    """Удаление бэкапа"""
    global backups
    backups = [b for b in backups if b["id"] != backup_id]
    return {"status": "deleted"}

@app.post("/api/v1/export/missions")
async def export_missions(request: ExportMissionsRequest):
    """Экспорт миссий"""
    return {"data": []}  # Placeholder

@app.post("/api/v1/export/telemetry")
async def export_telemetry(request: ExportTelemetryRequest):
    """Экспорт телеметрии"""
    return {"data": []}  # Placeholder

@app.post("/api/v1/export/models")
async def export_models():
    """Экспорт моделей обучения"""
    return {"data": []}  # Placeholder


@app.get("/api/v1/memory/short_term")
async def get_short_term_memory():
    """Получение краткосрочной памяти агента"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    memory = await agent.get_short_term_memory()
    return {"memory": memory}

@app.get("/api/v1/sub_agent/ask")
async def ask_sub_agent(question: str):
    """Запрос к суб-агенту"""
    if not agent:
        raise HTTPException(status_code=503, detail="Агент не инициализирован")

    response = await agent.ask_sub_agent(question)
    return {"response": response}

@app.get("/api/v1/reports/missions")
async def get_mission_reports():
    """Отчёты по миссиям"""
    # Placeholder
    return {"reports": []}


# WebSocket для real-time данных (опционально)
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket):
    """WebSocket для телеметрии в реальном времени"""
    await websocket.accept()

    try:
        while True:
            if agent:
                telemetry = await agent.perceive()
                await websocket.send_json(telemetry)

            await asyncio.sleep(0.1)  # 10 Hz
    except Exception as e:
        logger.error(f"WebSocket ошибка: {e}")
    finally:
        await websocket.close()
