"""
Фасад `DroneIntelligentAgent` для FastAPI и тестов.

Реализация находится в `agent.core_agent.CoreAgent`. Этот модуль добавляет
методы, ожидаемые `api/rest_api.py`, и безопасный демо-запуск без AirSim/MAVLink.
"""

from __future__ import annotations

import os
import random
from datetime import datetime
from typing import Any, Dict, List

from utils.logger import setup_logger

from agent.core_agent import AgentState, CoreAgent, MissionParams

logger = setup_logger(__name__)

__all__ = ["DroneIntelligentAgent", "MissionParams"]


class DroneIntelligentAgent(CoreAgent):
    """
    Интеллектуальный агент дрона для REST/WebSocket.

    В демо-режиме (`DEMO_MODE=true` по умолчанию) пропускается подключение
    к AirSim и реальному MAVLink — подходит для ноутбука и презентаций.
    """

    async def initialize(self) -> bool:
        """Инициализация: демо или полный путь CoreAgent."""
        demo = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes", "on")
        if demo:
            return await self._initialize_demo()
        try:
            return await super().initialize()
        except Exception as exc:
            logger.warning("Ошибка полной инициализации, переключаюсь на демо: %s", exc)
            return await self._initialize_demo()

    async def _initialize_demo(self) -> bool:
        """Инициализация без внешнего симулятора и дрона."""
        self.sim_mode = True
        self.sim_client = None
        self.real_drone_client = None
        try:
            if self.sub_agent:
                await self.sub_agent.initialize()
        except Exception as exc:
            logger.warning("Субагент в демо не инициализирован: %s", exc)
        self.state = AgentState.READY
        logger.info("Агент в демо-режиме готов (без AirSim/MAVLink).")
        return True

    async def perceive(self) -> Dict[str, Any]:
        """Телеметрия: реальные датчики или синтетика в демо."""
        demo = os.getenv("DEMO_MODE", "true").lower() in ("1", "true", "yes", "on")
        if demo and self.sim_client is None and self.real_drone_client is None and self.state != AgentState.SHUTDOWN:
            t = self.telemetry
            t["battery"] = max(15.0, float(t.get("battery", 100)) - random.uniform(0, 0.02))
            t["signal_strength"] = int(
                max(20, min(100, float(t.get("signal_strength", 90)) + random.uniform(-2, 2)))
            )
            t["timestamp"] = datetime.now().isoformat()
            self.short_term_memory.add({"telemetry": dict(t), "demo": True})
            return {"telemetry": dict(t)}
        try:
            return await super().perceive()
        except Exception as exc:
            logger.warning("Ошибка perceive (возможен режим без симулятора): %s", exc)
            return {}

    async def get_short_term_memory(self) -> List[Dict[str, Any]]:
        """Последние записи краткосрочной памяти для API."""
        return self.short_term_memory.get_recent(100)

    async def ask_sub_agent(self, question: str) -> str:
        """Запрос к субагенту (LLM или заглушка)."""
        if not self.sub_agent:
            return "Субагент недоступен."
        try:
            return await self.sub_agent.ask(question)
        except Exception as exc:
            logger.error("Ошибка субагента: %s", exc)
            return f"[демо] Не удалось получить ответ LLM: {exc}"

    async def process_command(self, command: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
        """Выполнение текстовой команды из REST API (демо/реальный режим)."""
        params = params or {}
        c = (command or "HOVER").strip().upper().replace(" ", "_")
        return await self.act({"command": c, "params": params})

    async def emergency_stop(self) -> None:
        """Аварийная остановка по запросу API."""
        await self.act({"command": "LAND", "reason": "API emergency stop", "priority": "high"})
