"""
================================================================================
REST API - Интерфейс для внешних систем (v4, FastAPI)
================================================================================
"""
import asyncio
import base64
import json
import os
import re
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from src.utils.logger import setup_logger

logger = setup_logger(__name__)

app = FastAPI(
    title="COBA AI Drone Agent API",
    description="API для управления дроном и мониторинга",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_instance = None

_PLACEHOLDER_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)

MISSION_REGISTRY: Dict[str, Dict[str, Any]] = {}
MISSION_HISTORY: List[Dict[str, Any]] = []
ACTIVE_MISSION_ID: Optional[str] = None

FLEET_STATE: Dict[str, Any] = {
    "leader_id": "drone_alpha",
    "formation": "LINE",
}

CAMERA_STATE = {"zoom": 1.0, "brightness": 0.5}
RECORDING_STATE: Dict[str, Any] = {"active": False, "start_time": None, "stop_time": None}

LEARNING_UI_STATE = {
    "running": False,
    "reward": 145.67,
    "loss": 0.0234,
    "episodes": 1245,
    "tasks": [
        {"name": "Базовое управление полётом", "progress": 100},
        {"name": "Предотвращение столкновений", "progress": 75},
        {"name": "Автономная навигация", "progress": 50},
    ],
}

_sim_manager_cache: Any = None

MISSION_TYPES_RU = [
    "Патрулирование",
    "Поиск и обнаружение",
    "Доставка груза",
    "Обследование объекта",
    "Картографирование",
    "Сопровождение движущейся цели",
    "Экстренное реагирование",
    "Тестовая миссия",
]

DEFAULT_TOOL_CARDS = [
    {"id": "AmorfusTool", "name": "AmorfusTool", "description": "Инструмент Amorfus", "status": "ready"},
    {"id": "SlomTool", "name": "SlomTool", "description": "Модуль Slom", "status": "ready"},
    {"id": "MiFlyTool", "name": "MiFlyTool", "description": "MiFly", "status": "ready"},
    {"id": "GeoMapTool", "name": "GeoMapTool", "description": "Геопространственные карты", "status": "ready"},
    {"id": "ObjectDetectionTool", "name": "ObjectDetectionTool", "description": "Детекция объектов", "status": "ready"},
    {"id": "MissionPlannerTool", "name": "MissionPlannerTool", "description": "Планировщик миссий", "status": "ready"},
]


# ========== Модели данных ==========


class TelemetryResponse(BaseModel):
    position: Dict[str, float]
    velocity: Dict[str, float]
    attitude: Dict[str, float]
    battery: float
    timestamp: str


class CommandRequest(BaseModel):
    command: str
    params: Dict[str, Any] = {}


class CommandResponse(BaseModel):
    success: bool
    command: str
    result: Dict[str, Any]


class MissionRequest(BaseModel):
    name: str
    waypoints: List[Dict[str, Any]]
    altitude: float = 50.0
    speed: float = 10.0
    mission_type: str = "patrol"


class FormationBody(BaseModel):
    formation: str


class LeaderBody(BaseModel):
    leader_id: str


class AskBody(BaseModel):
    question: str


class ToolExecuteBody(BaseModel):
    tool_id: str


class SimulatorSwitchBody(BaseModel):
    simulator: str


class ZoomBody(BaseModel):
    value: float


class BrightnessBody(BaseModel):
    value: float


# ========== Эндпоинты ==========


@app.get("/")
async def root():
    return {
        "name": "COBA AI Drone Agent API",
        "version": "4.0.0",
        "status": "online",
        "endpoints": [
            "/health",
            "/api/v1/telemetry",
            "/api/v1/status",
            "/api/v1/command",
            "/ws/telemetry",
        ],
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agent_connected": agent_instance is not None,
    }


@app.get("/api/v1/telemetry")
async def get_telemetry() -> TelemetryResponse:
    if agent_instance:
        telemetry = agent_instance.telemetry
        return TelemetryResponse(
            position=telemetry.get("position", {}),
            velocity=telemetry.get("velocity", {}),
            attitude=telemetry.get("attitude", {}),
            battery=float(telemetry.get("battery", 0)),
            timestamp=str(telemetry.get("timestamp", datetime.now().isoformat())),
        )

    return TelemetryResponse(
        position={"x": 0, "y": 0, "z": 10, "lat": 55.7558, "lon": 37.6173},
        velocity={"vx": 0, "vy": 0, "vz": 0},
        attitude={"roll": 0, "pitch": 0, "yaw": 0},
        battery=85.5,
        timestamp=datetime.now().isoformat(),
    )


@app.get("/api/v1/status")
async def get_status():
    if agent_instance:
        return await agent_instance.get_status()

    return {
        "agent_id": "demo_agent",
        "state": "ready",
        "mission": None,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/v1/command")
async def send_command(request: CommandRequest) -> CommandResponse:
    logger.info(f"API: Получена команда {request.command}")

    if agent_instance:
        result = await agent_instance.act(
            {
                "command": request.command,
                "params": request.params,
            }
        )
        return CommandResponse(
            success=result.get("success", False),
            command=request.command,
            result=result,
        )

    return CommandResponse(
        success=True,
        command=request.command,
        result={"demo": True, "message": "Команда принята (демо режим)"},
    )


async def _demo_mission_progress(mission_id: str, wp_count: int):
    reg = MISSION_REGISTRY.get(mission_id)
    if not reg:
        return
    for i in range(wp_count):
        await asyncio.sleep(0.28)
        reg = MISSION_REGISTRY.get(mission_id)
        if not reg or reg.get("state") == "stopped":
            return
        reg["waypoints_done"] = i + 1
        reg["progress"] = round((i + 1) / wp_count * 100, 1)
    reg = MISSION_REGISTRY.get(mission_id)
    if reg and reg.get("state") != "stopped":
        reg["state"] = "completed"
        reg["progress"] = 100.0
        MISSION_HISTORY.append(dict(reg))
        global ACTIVE_MISSION_ID
        if ACTIVE_MISSION_ID == mission_id:
            ACTIVE_MISSION_ID = None


async def _agent_mission_wrapper(mission_id: str, mp: Any):
    global ACTIVE_MISSION_ID
    from src.agents.core_agent import MissionParams as MP

    assert isinstance(mp, MP)
    reg = MISSION_REGISTRY[mission_id]
    t0 = asyncio.get_event_loop().time()
    est = max(0.5, len(mp.waypoints) * 0.3)
    stop_flag = {"stop": False}

    async def tick():
        while not stop_flag["stop"] and reg.get("state") == "running":
            elapsed = asyncio.get_event_loop().time() - t0
            reg["progress"] = min(99.0, (elapsed / est) * 100.0)
            done = int(min(len(mp.waypoints), (elapsed / est) * len(mp.waypoints)))
            reg["waypoints_done"] = done
            await asyncio.sleep(0.35)

    ticker = asyncio.create_task(tick())
    try:
        await agent_instance.run_mission(mp)
        if reg.get("state") == "stopped" or reg.get("force_stopped"):
            reg["state"] = "stopped"
        else:
            reg["state"] = "completed"
            reg["progress"] = 100.0
            reg["waypoints_done"] = len(mp.waypoints)
        MISSION_HISTORY.append(dict(reg))
    except Exception as e:
        logger.error(f"Mission error: {e}")
        reg["state"] = "failed"
    finally:
        stop_flag["stop"] = True
        ticker.cancel()
        try:
            await ticker
        except asyncio.CancelledError:
            pass
        global ACTIVE_MISSION_ID
        if ACTIVE_MISSION_ID == mission_id:
            ACTIVE_MISSION_ID = None


@app.post("/api/v1/mission/start")
async def start_mission(request: MissionRequest):
    global ACTIVE_MISSION_ID
    logger.info(f"API: Запуск миссии {request.name}")

    mission_id = f"mission_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"

    MISSION_REGISTRY[mission_id] = {
        "mission_id": mission_id,
        "name": request.name,
        "mission_type": request.mission_type,
        "state": "running",
        "waypoints_total": len(request.waypoints),
        "waypoints_done": 0,
        "progress": 0.0,
        "started_at": datetime.now().isoformat(),
        "force_stopped": False,
    }
    ACTIVE_MISSION_ID = mission_id

    if agent_instance:
        from src.agents.core_agent import MissionParams

        mp = MissionParams(
            name=request.name,
            mission_id=mission_id,
            waypoints=request.waypoints,
            altitude=request.altitude,
            speed=request.speed,
            mission_type=request.mission_type,
        )
        asyncio.create_task(_agent_mission_wrapper(mission_id, mp))
    else:
        asyncio.create_task(_demo_mission_progress(mission_id, max(1, len(request.waypoints))))

    return {
        "success": True,
        "mission_id": mission_id,
        "name": request.name,
        "waypoints_count": len(request.waypoints),
    }


@app.post("/api/v1/mission/stop")
async def stop_mission():
    global ACTIVE_MISSION_ID
    from src.agents.core_agent import AgentState

    mid = ACTIVE_MISSION_ID
    if mid and mid in MISSION_REGISTRY:
        MISSION_REGISTRY[mid]["force_stopped"] = True
        MISSION_REGISTRY[mid]["state"] = "stopped"
        MISSION_HISTORY.append(dict(MISSION_REGISTRY[mid]))

    ACTIVE_MISSION_ID = None

    if agent_instance:
        agent_instance.state = AgentState.EMERGENCY

    return {"success": True, "mission_id": mid}


@app.get("/api/v1/mission/status")
async def mission_status():
    active = None
    if ACTIVE_MISSION_ID and ACTIVE_MISSION_ID in MISSION_REGISTRY:
        active = MISSION_REGISTRY[ACTIVE_MISSION_ID]
    return {"active": active, "history": MISSION_HISTORY[-30:]}


@app.post("/api/v1/mission/save")
async def mission_save(request: MissionRequest):
    os.makedirs("data/missions", exist_ok=True)
    safe = re.sub(r"[^\w\-]+", "_", request.name)[:80]
    fn = f"data/missions/{safe}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    payload = {
        "name": request.name,
        "mission_type": request.mission_type,
        "altitude": request.altitude,
        "speed": request.speed,
        "waypoints": request.waypoints,
        "saved_at": datetime.now().isoformat(),
    }
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return {"success": True, "path": fn}


@app.get("/api/v1/missions")
async def list_saved_missions():
    os.makedirs("data/missions", exist_ok=True)
    out = []
    for p in sorted(Path("data/missions").glob("*.json"), reverse=True)[:100]:
        try:
            with open(p, encoding="utf-8") as f:
                out.append({"file": p.name, **json.load(f)})
        except Exception:
            continue
    return out


@app.get("/api/v1/mission/types")
async def mission_types():
    return MISSION_TYPES_RU


@app.post("/api/v1/emergency/stop")
async def emergency_stop():
    if agent_instance:
        await agent_instance.act({"command": "EMERGENCY_STOP", "params": {}})
        return {"success": True, "demo": False}
    return {"success": True, "demo": True}


@app.post("/api/v1/emergency/land")
async def emergency_land():
    if agent_instance:
        await agent_instance.act(
            {
                "command": "LAND",
                "params": {"reason": "emergency"},
                "reason": "emergency",
            }
        )
        return {"success": True, "demo": False}
    return {"success": True, "demo": True}


@app.get("/api/v1/fleet/status")
async def fleet_status():
    if agent_instance:
        st = await agent_instance.get_status()
        bat = float(st.get("telemetry", {}).get("battery", 80))
        drones = [
            {
                "id": agent_instance.agent_id,
                "name": agent_instance.agent_id,
                "battery": bat,
                "state": str(st.get("state", "ready")),
                "role": "leader",
            }
        ]
        return {
            "leader_id": FLEET_STATE.get("leader_id", agent_instance.agent_id),
            "formation": FLEET_STATE.get("formation", "LINE"),
            "drones": drones,
            "average_battery": bat,
            "demo": False,
        }

    return {
        "leader_id": "drone_alpha",
        "formation": FLEET_STATE.get("formation", "LINE"),
        "drones": [
            {"id": "drone_alpha", "name": "Alpha-1", "battery": 87, "state": "ready", "role": "leader"},
            {"id": "drone_beta", "name": "Beta-2", "battery": 82, "state": "ready", "role": "wing"},
            {"id": "drone_gamma", "name": "Gamma-3", "battery": 91, "state": "active", "role": "wing"},
            {"id": "drone_delta", "name": "Delta-4", "battery": 79, "state": "ready", "role": "relay"},
        ],
        "average_battery": round((87 + 82 + 91 + 79) / 4, 1),
        "demo": True,
    }


@app.post("/api/v1/fleet/formation")
async def fleet_formation(body: FormationBody):
    name = body.formation.upper().replace("-", "_")
    FLEET_STATE["formation"] = name
    if agent_instance and agent_instance.mesh_network:
        await agent_instance.mesh_network.broadcast({"type": "formation", "name": name})
    return {"success": True, "formation": name}


@app.post("/api/v1/fleet/swap_leader")
async def fleet_swap_leader(body: LeaderBody):
    FLEET_STATE["leader_id"] = body.leader_id
    return {"success": True, "leader_id": body.leader_id}


@app.get("/api/v1/learning/progress")
async def learning_progress():
    if agent_instance and getattr(agent_instance, "learner", None):
        return {"experimental": False, "status": "live", "message": "Learner attached"}

    return {
        "reward": LEARNING_UI_STATE["reward"],
        "loss": LEARNING_UI_STATE["loss"],
        "episodes": LEARNING_UI_STATE["episodes"],
        "tasks": LEARNING_UI_STATE["tasks"],
        "experimental": True,
        "status": "paused" if not LEARNING_UI_STATE["running"] else "running",
    }


@app.post("/api/v1/learning/start")
async def learning_start():
    LEARNING_UI_STATE["running"] = True
    return {"success": True, "experimental": True, "status": "running"}


@app.post("/api/v1/learning/pause")
async def learning_pause():
    LEARNING_UI_STATE["running"] = False
    return {"success": True, "experimental": True, "status": "paused"}


@app.post("/api/v1/learning/reset")
async def learning_reset():
    LEARNING_UI_STATE["reward"] = 0.0
    LEARNING_UI_STATE["loss"] = 0.0
    LEARNING_UI_STATE["episodes"] = 0
    LEARNING_UI_STATE["tasks"] = [
        {"name": "Базовое управление полётом", "progress": 0},
        {"name": "Предотвращение столкновений", "progress": 0},
        {"name": "Автономная навигация", "progress": 0},
    ]
    return {"success": True, "experimental": True}


@app.post("/api/v1/learning/export")
async def learning_export():
    os.makedirs("data/reports", exist_ok=True)
    path = f"data/reports/learning_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(LEARNING_UI_STATE, f, ensure_ascii=False, indent=2)
    return {"success": True, "experimental": True, "path": path}


@app.get("/api/v1/camera/snapshot")
async def camera_snapshot():
    if agent_instance:
        try:
            from sim.airsim_client import AirSimClient

            cfg = getattr(agent_instance, "config", {}) or {}
            client = AirSimClient(cfg)
            await client.connect()
            shot = await client.take_photo()
            if shot.get("success") and shot.get("image"):
                return Response(content=shot["image"], media_type="image/png")
        except Exception as e:
            logger.warning(f"camera snapshot fallback: {e}")

    return Response(content=_PLACEHOLDER_PNG, media_type="image/png")


@app.post("/api/v1/camera/record/start")
async def camera_record_start():
    os.makedirs("data/flight_data", exist_ok=True)
    RECORDING_STATE["active"] = True
    RECORDING_STATE["start_time"] = datetime.now().isoformat()
    RECORDING_STATE["stop_time"] = None
    meta = Path("data/flight_data/recording.json")
    meta.write_text(json.dumps(RECORDING_STATE, indent=2), encoding="utf-8")
    return {"success": True, **RECORDING_STATE}


@app.post("/api/v1/camera/record/stop")
async def camera_record_stop():
    RECORDING_STATE["active"] = False
    RECORDING_STATE["stop_time"] = datetime.now().isoformat()
    meta = Path("data/flight_data/recording.json")
    meta.write_text(json.dumps(RECORDING_STATE, indent=2), encoding="utf-8")
    return {"success": True, **RECORDING_STATE}


@app.get("/api/v1/camera/detections")
async def camera_detections():
    if agent_instance and agent_instance.tools:
        for _k, meta in agent_instance.tools.items():
            if "object" in str(_k).lower() or "detection" in str(_k).lower():
                return {"detections": [], "note": "tool registered", "demo": False}
    return {"detections": [], "demo": True}


@app.post("/api/v1/camera/zoom")
async def camera_zoom(body: ZoomBody):
    CAMERA_STATE["zoom"] = max(0.5, min(3.0, float(body.value)))
    return {"success": True, **CAMERA_STATE}


@app.post("/api/v1/camera/brightness")
async def camera_brightness(body: BrightnessBody):
    CAMERA_STATE["brightness"] = max(0.0, min(1.0, float(body.value)))
    return {"success": True, **CAMERA_STATE}


def _load_events_file() -> List[Dict[str, Any]]:
    path = Path("data/logs/events.jsonl")
    if not path.exists():
        return [
            {
                "id": "demo1",
                "timestamp": datetime.now().isoformat(),
                "type": "info",
                "level": "info",
                "message": "Демо: журнал событий",
            }
        ]
    rows = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except Exception:
        pass
    return rows


@app.get("/api/v1/events")
async def list_events(
    limit: int = Query(100, ge=1, le=500),
    type: Optional[str] = None,
    level: Optional[str] = None,
):
    rows = _load_events_file()
    if type:
        rows = [r for r in rows if str(r.get("type", "")).lower() == type.lower()]
    if level:
        rows = [r for r in rows if str(r.get("level", "")).lower() == level.lower()]
    rows = rows[-limit:]
    return {"events": list(reversed(rows)), "demo": not Path("data/logs/events.jsonl").exists()}


@app.get("/api/v1/events/statistics")
async def events_statistics():
    rows = _load_events_file()
    by_type: Dict[str, int] = {}
    by_level: Dict[str, int] = {}
    for r in rows:
        t = str(r.get("type", "unknown"))
        by_type[t] = by_type.get(t, 0) + 1
        lv = str(r.get("level", "info"))
        by_level[lv] = by_level.get(lv, 0) + 1
    return {"by_type": by_type, "by_level": by_level, "total": len(rows)}


@app.post("/api/v1/backup/create")
async def backup_create():
    os.makedirs("backup", exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_path = Path("backup") / f"backup_{ts}.zip"
    roots = [Path("data/state"), Path("data/missions"), Path("config/config.yaml")]
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root in roots:
            if root.is_file():
                zf.write(root, arcname=str(root))
            elif root.is_dir():
                for fp in root.rglob("*"):
                    if fp.is_file():
                        zf.write(fp, arcname=str(fp))
    return {"success": True, "id": zip_path.name, "path": str(zip_path)}


@app.get("/api/v1/backup/list")
async def backup_list():
    os.makedirs("backup", exist_ok=True)
    items = []
    for p in sorted(Path("backup").glob("*.zip"), reverse=True):
        st = p.stat()
        items.append(
            {
                "id": p.name,
                "filename": p.name,
                "created_at": datetime.fromtimestamp(st.st_mtime).isoformat(),
                "size_bytes": st.st_size,
            }
        )
    return {"items": items}


@app.post("/api/v1/backup/restore/{backup_id}")
async def backup_restore(backup_id: str):
    safe = os.path.basename(backup_id)
    path = Path("backup") / safe
    if not path.exists() or not path.suffix == ".zip":
        raise HTTPException(404, "backup not found")
    tmp = Path("backup") / f"_restore_tmp_{safe}"
    shutil.unpack_archive(str(path), tmp, "zip")
    return {"success": True, "extracted_to": str(tmp), "note": "Review before replacing live data"}


@app.delete("/api/v1/backup/{backup_id}")
async def backup_delete(backup_id: str):
    safe = os.path.basename(backup_id)
    path = Path("backup") / safe
    if path.exists() and path.suffix == ".zip":
        path.unlink()
        return {"success": True}
    raise HTTPException(404, "not found")


@app.get("/api/v1/backup/download/{backup_id}")
async def backup_download(backup_id: str):
    safe = os.path.basename(backup_id)
    path = Path("backup") / safe
    if path.exists() and path.suffix == ".zip":
        return FileResponse(path, filename=path.name, media_type="application/zip")
    raise HTTPException(404, "not found")


@app.post("/api/v1/sub_agent/ask")
async def sub_agent_ask(body: AskBody):
    if agent_instance and agent_instance.sub_agent:
        r = await agent_instance.sub_agent.ask(body.question)
        return r
    return {
        "answer": "[демо] Субагент недоступен без ядра агента. Запустите `python main.py api`.",
        "offline": True,
    }


@app.get("/api/v1/tools")
async def list_tools():
    if agent_instance and getattr(agent_instance, "tools", None):
        tools = []
        for tid in agent_instance.tools.keys():
            tools.append(
                {
                    "id": str(tid),
                    "name": str(tid),
                    "description": f"Зарегистрированный модуль: {tid}",
                    "status": "registered",
                }
            )
        return {"tools": tools or DEFAULT_TOOL_CARDS}
    return {"tools": DEFAULT_TOOL_CARDS, "demo": True}


@app.post("/api/v1/tools/execute")
async def tools_execute(body: ToolExecuteBody):
    return {
        "success": True,
        "tool_id": body.tool_id,
        "message": "Запрос принят (демо или очередь инструмента)",
        "demo": agent_instance is None,
    }


def _get_sim_manager():
    global _sim_manager_cache
    if _sim_manager_cache is not None:
        return _sim_manager_cache
    try:
        import yaml

        cfg_path = Path("config/config.yaml")
        cfg = {}
        if cfg_path.exists():
            with open(cfg_path, encoding="utf-8") as f:
                cfg = yaml.safe_load(f) or {}
        from sim.simulator_manager import SimulatorManager

        _sim_manager_cache = SimulatorManager(cfg)
    except Exception as e:
        logger.warning(f"SimulatorManager unavailable: {e}")
        _sim_manager_cache = None
    return _sim_manager_cache


@app.get("/api/v1/simulators")
async def simulators_list():
    try:
        from sim.simulator_manager import SimulatorType

        mgr = _get_sim_manager()
        active = getattr(mgr, "active_simulator", None) if mgr else None
        out = []
        for s in SimulatorType:
            out.append(
                {
                    "id": s.value,
                    "name": s.value,
                    "active": active == s,
                }
            )
        return {"simulators": out}
    except Exception:
        return {
            "simulators": [
                {"id": "airsim", "name": "airsim", "active": True},
                {"id": "grid", "name": "grid", "active": False},
            ]
        }


@app.post("/api/v1/simulators/switch")
async def simulators_switch(body: SimulatorSwitchBody):
    try:
        from sim.simulator_manager import SimulatorType

        key = body.simulator.lower().replace("-", "_")
        mapping = {t.value: t for t in SimulatorType}
        sim = mapping.get(key)
        if sim is None:
            raise HTTPException(400, "unknown simulator")
        mgr = _get_sim_manager()
        if mgr:
            ok = await mgr.switch_simulator(sim)
            return {"success": ok, "simulator": sim.value}
        return {"success": False, "demo": True, "simulator": body.simulator}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(str(e))
        return {"success": False, "demo": True, "error": str(e)}


@app.get("/api/v1/motors")
async def get_motors_status():
    if agent_instance and agent_instance.pit_controllers:
        return agent_instance.pit_controllers.get_all_status()

    return {
        "is_armed": False,
        "is_flying": False,
        "motors": {
            0: {"name": "Front-Left", "state": "idle", "throttle": 1000},
            1: {"name": "Front-Right", "state": "idle", "throttle": 1000},
            2: {"name": "Rear-Right", "state": "idle", "throttle": 1000},
            3: {"name": "Rear-Left", "state": "idle", "throttle": 1000},
        },
    }


@app.get("/api/v1/mesh")
async def get_mesh_status():
    if agent_instance and agent_instance.mesh_network:
        return agent_instance.mesh_network.get_network_status()

    return {
        "node_id": "demo_node",
        "nodes_online": 1,
        "nodes_total": 1,
        "neighbors": [],
    }


@app.get("/api/v1/openq")
async def get_openq_status():
    if agent_instance and agent_instance.openq:
        return agent_instance.openq.get_status()

    return {
        "is_recording": False,
        "total_flights": 0,
        "flights_list": [],
    }


@app.get("/api/v1/flights")
async def get_flights():
    if agent_instance and agent_instance.openq:
        return agent_instance.openq.get_flight_list()
    return []


# ========== WebSocket ==========


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket подключен, всего: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket отключен, всего: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            if agent_instance:
                telemetry = agent_instance.telemetry
            else:
                telemetry = {
                    "position": {"x": 0, "y": 0, "z": 10},
                    "battery": 85.5,
                    "timestamp": datetime.now().isoformat(),
                }

            await websocket.send_json({"type": "telemetry", "data": telemetry})

            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                message = json.loads(data)

                if message.get("type") == "command":
                    command = message.get("command")
                    logger.info(f"WebSocket: Получена команда {command}")

                    if agent_instance:
                        await agent_instance.act(
                            {
                                "command": command,
                                "params": message.get("params", {}),
                            }
                        )
            except asyncio.TimeoutError:
                pass

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket ошибка: {e}")
        manager.disconnect(websocket)


def set_agent(agent):
    global agent_instance
    agent_instance = agent
    logger.info("API: Агент подключен")
