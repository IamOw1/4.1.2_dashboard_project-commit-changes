"""
================================================================================
Stub Agents для демонстрации и тестирования COBA AI Drone Agent v4.1
Заглушки для Core Agent и Sub Agent с простой логикой принятия решений
================================================================================
"""
import json
import time
import random
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path
from dataclasses import dataclass, asdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class AgentDecision:
    """Решение агента"""
    command: str
    reason: str
    priority: str = "normal"
    params: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.params is None:
            self.params = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AgentAnalysis:
    """Анализ от Sub-Agent"""
    metrics: Dict[str, float]
    anomalies: List[str]
    recommendations: List[str]
    confidence: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StubAgents:
    """Пара агентов для демо-режима"""
    core: StubCoreAgent
    sub: StubSubAgent


class TaskQueue:
    """Очередь задач для агентов"""
    
    def __init__(self, max_size: int = 100):
        self.queue: List[Dict[str, Any]] = []
        self.max_size = max_size
        self.processing = False
        self.current_task: Optional[Dict[str, Any]] = None
    
    def add(self, task: Dict[str, Any]) -> bool:
        """Добавить задачу в очередь"""
        if len(self.queue) >= self.max_size:
            logger.warning("Очередь задач переполнена")
            return False
        
        task["queued_at"] = datetime.now().isoformat()
        task["status"] = "queued"
        self.queue.append(task)
        logger.info(f"Задача добавлена в очередь: {task.get('type', 'unknown')}")
        return True
    
    def get_next(self) -> Optional[Dict[str, Any]]:
        """Получить следующую задачу"""
        if not self.queue:
            return None
        
        self.current_task = self.queue.pop(0)
        self.current_task["status"] = "processing"
        self.processing = True
        return self.current_task
    
    def complete_current(self) -> None:
        """Завершить текущую задачу"""
        if self.current_task:
            self.current_task["completed_at"] = datetime.now().isoformat()
            self.current_task["status"] = "completed"
            self.processing = False
            self.current_task = None
    
    def get_status(self) -> Dict[str, Any]:
        """Статус очереди"""
        return {
            "queue_size": len(self.queue),
            "processing": self.processing,
            "current_task": self.current_task,
            "max_size": self.max_size
        }


class StubCoreAgent:
    """
    Заглушка Core Agent для демо-режима
    
    Принимает телеметрию, возвращает решение по простым правилам:
    - Низкий заряд (<20%) → возврат на базу (RTL)
    - Перегрев (>60°C) → посадка (LAND)
    - Потеря сигнала (<30%) → возврат на базу (RTL)
    - Иначе → зависание (HOVER)
    """
    
    def __init__(self, agent_id: str = "stub_core_001"):
        self.agent_id = agent_id
        self.state = "ready"
        self.task_queue = TaskQueue()
        self.decisions_count = 0
        self.logs_path = Path("data/logs/agent_communication.json")
        self._ensure_logs_dir()
    
    def _ensure_logs_dir(self):
        """Убедиться, что директория логов существует"""
        self.logs_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.logs_path.exists():
            self.logs_path.write_text(json.dumps([], indent=2))
    
    def _log_interaction(self, interaction: Dict[str, Any]):
        """Логировать взаимодействие с агентом"""
        try:
            logs = json.loads(self.logs_path.read_text())
            logs.append(interaction)
            # Храним последние 1000 записей
            logs = logs[-1000:]
            self.logs_path.write_text(json.dumps(logs, indent=2, ensure_ascii=False))
        except Exception as e:
            logger.error(f"Ошибка логирования: {e}")
    
    async def initialize(self) -> bool:
        """Инициализация агента"""
        logger.info(f"🤖 {self.agent_id} инициализирован")
        self.state = "ready"
        return True
    
    async def shutdown(self) -> None:
        """Завершение работы"""
        logger.info(f"🛑 {self.agent_id} завершает работу")
        self.state = "shutdown"
    
    async def decide(self, telemetry: Dict[str, Any]) -> AgentDecision:
        """
        Принять решение на основе телеметрии
        
        Простые правила:
        1. Низкий заряд → RTL
        2. Перегрев → LAND
        3. Потеря сигнала → RTL
        4. Иначе → HOVER
        """
        self.decisions_count += 1
        
        battery = telemetry.get("battery", 100)
        temperature = telemetry.get("temperature", 25)
        signal = telemetry.get("signal_strength", 100)
        
        # Проверка аварийных ситуаций
        if battery < 15:
            decision = AgentDecision(
                command="RTL",
                reason=f"Критически низкий заряд: {battery}%",
                priority="critical"
            )
        elif battery < 25:
            decision = AgentDecision(
                command="RTL",
                reason=f"Низкий заряд: {battery}%",
                priority="high"
            )
        elif temperature > 70:
            decision = AgentDecision(
                command="LAND",
                reason=f"Критический перегрев: {temperature}°C",
                priority="critical"
            )
        elif temperature > 60:
            decision = AgentDecision(
                command="LAND",
                reason=f"Перегрев: {temperature}°C",
                priority="high"
            )
        elif signal < 20:
            decision = AgentDecision(
                command="RTL",
                reason=f"Потеря сигнала: {signal}%",
                priority="critical"
            )
        elif signal < 40:
            decision = AgentDecision(
                command="RTL",
                reason=f"Слабый сигнал: {signal}%",
                priority="high"
            )
        else:
            decision = AgentDecision(
                command="HOVER",
                reason="Нормальная работа",
                priority="low"
            )
        
        # Логирование
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.agent_id,
            "type": "decision",
            "input": {"telemetry": telemetry},
            "output": decision.to_dict(),
            "decisions_count": self.decisions_count
        }
        self._log_interaction(interaction)
        
        logger.info(f"🎯 Решение: {decision.command} - {decision.reason}")
        return decision
    
    async def process_command(self, command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Обработать команду"""
        if params is None:
            params = {}
        
        valid_commands = ["TAKEOFF", "LAND", "RTL", "HOVER", "EMERGENCY_STOP"]
        
        if command not in valid_commands:
            return {
                "success": False,
                "error": f"Неизвестная команда: {command}",
                "valid_commands": valid_commands
            }
        
        # Имитация выполнения команды
        result = {
            "success": True,
            "command": command,
            "params": params,
            "executed_at": datetime.now().isoformat(),
            "estimated_duration": random.uniform(1.0, 5.0)
        }
        
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.agent_id,
            "type": "command",
            "input": {"command": command, "params": params},
            "output": result
        }
        self._log_interaction(interaction)
        
        logger.info(f"✅ Команда выполнена: {command}")
        return result
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Статус очереди задач"""
        return self.task_queue.get_status()


class StubSubAgent:
    """
    Заглушка Sub-Agent для демо-режима
    
    Принимает данные, возвращает "анализ" с фиктивными метриками
    """
    
    def __init__(self, agent_id: str = "stub_sub_001"):
        self.agent_id = agent_id
        self.state = "ready"
        self.task_queue = TaskQueue()
        self.analyses_count = 0
        self.logs_path = Path("data/logs/agent_communication.json")
        self._ensure_logs_dir()
    
    def _ensure_logs_dir(self):
        """Убедиться, что директория логов существует"""
        self.logs_path.parent.mkdir(parents=True, exist_ok=True)
    
    def _log_interaction(self, interaction: Dict[str, Any]):
        """Логировать взаимодействие с агентом"""
        try:
            logs = json.loads(self.logs_path.read_text())
            logs.append(interaction)
            logs = logs[-1000:]
            self.logs_path.write_text(json.dumps(logs, indent=2, ensure_ascii=False))
        except Exception as e:
            logger.error(f"Ошибка логирования: {e}")
    
    async def initialize(self) -> bool:
        """Инициализация агента"""
        logger.info(f"🔬 {self.agent_id} инициализирован")
        self.state = "ready"
        return True
    
    async def shutdown(self) -> None:
        """Завершение работы"""
        logger.info(f"🛑 {self.agent_id} завершает работу")
        self.state = "shutdown"
    
    async def analyze(self, data: Dict[str, Any]) -> AgentAnalysis:
        """
        Проанализировать данные и вернуть метрики
        
        Генерирует фиктивные метрики для демонстрации
        """
        self.analyses_count += 1
        
        # Генерация фиктивных метрик
        metrics = {
            "stability_score": random.uniform(0.7, 1.0),
            "efficiency_rating": random.uniform(0.6, 0.95),
            "risk_level": random.uniform(0.0, 0.3),
            "optimal_altitude": random.uniform(45, 55),
            "battery_consumption_rate": random.uniform(0.5, 2.0),
            "signal_quality": random.uniform(0.8, 1.0),
            "navigation_accuracy": random.uniform(0.9, 0.99),
            "environmental_factor": random.uniform(0.85, 1.0)
        }
        
        # Возможные аномалии
        anomaly_types = [
            "Небольшие колебания высоты",
            "Временное падение сигнала",
            "Повышенное энергопотребление",
            "Отклонение от маршрута",
            "Вибрация моторов"
        ]
        
        # Случайный выбор аномалий (0-2)
        anomalies = random.sample(anomaly_types, random.randint(0, 2))
        
        # Рекомендации
        recommendations = []
        if metrics["risk_level"] > 0.2:
            recommendations.append("Рекомендуется снизить скорость")
        if metrics["battery_consumption_rate"] > 1.5:
            recommendations.append("Проверить эффективность двигателей")
        if metrics["stability_score"] < 0.8:
            recommendations.append("Выполнить калибровку IMU")
        if not recommendations:
            recommendations.append("Все системы в норме")
        
        analysis = AgentAnalysis(
            metrics=metrics,
            anomalies=anomalies,
            recommendations=recommendations,
            confidence=random.uniform(0.85, 0.99)
        )
        
        # Логирование
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "agent": self.agent_id,
            "type": "analysis",
            "input": {"data": data},
            "output": analysis.to_dict(),
            "analyses_count": self.analyses_count
        }
        self._log_interaction(interaction)
        
        logger.info(f"📊 Анализ завершён: {len(anomalies)} аномалий, уверенность {analysis.confidence:.2f}")
        return analysis
    
    async def recommend(self, perception: Dict[str, Any], mission: Any = None) -> Dict[str, Any]:
        """
        Дать рекомендации на основе восприятия
        
        Возвращает рекомендации для Core Agent
        """
        analysis = await self.analyze(perception)
        
        suggested_command = "HOVER"
        if analysis.metrics["risk_level"] > 0.25:
            suggested_command = "LAND"
        elif analysis.metrics["stability_score"] < 0.75:
            suggested_command = "HOVER"
        
        return {
            "suggested_command": suggested_command,
            "reason": analysis.recommendations[0],
            "priority": "high" if analysis.metrics["risk_level"] > 0.2 else "medium",
            "confidence": analysis.confidence,
            "metrics": analysis.metrics,
            "anomalies": analysis.anomalies
        }
    
    def get_status(self) -> Dict[str, Any]:
        """Статус агента"""
        return {
            "agent_id": self.agent_id,
            "state": self.state,
            "analyses_count": self.analyses_count,
            "queue": self.task_queue.get_status()
        }


# Фабрика для создания агентов
def create_stub_agents() -> tuple[StubCoreAgent, StubSubAgent]:
    """Создать пару stub-агентов для демо-режима"""
    core = StubCoreAgent()
    sub = StubSubAgent()
    return core, sub


if __name__ == "__main__":
    # Тестирование агентов
    import asyncio
    
    async def test_agents():
        core, sub = create_stub_agents()
        
        await core.initialize()
        await sub.initialize()
        
        # Тестовая телеметрия
        telemetry = {
            "battery": 18,
            "temperature": 65,
            "signal_strength": 35,
            "position": {"x": 10, "y": 20, "z": 50},
            "velocity": {"vx": 0, "vy": 0, "vz": 0}
        }
        
        # Тест решения
        decision = await core.decide(telemetry)
        print(f"\nРешение Core Agent: {decision.to_dict()}")
        
        # Тест анализа
        analysis = await sub.analyze(telemetry)
        print(f"\nАнализ Sub Agent: {analysis.to_dict()}")
        
        # Тест рекомендаций
        recommendations = await sub.recommend({"telemetry": telemetry})
        print(f"\nРекомендации: {recommendations}")
        
        await core.shutdown()
        await sub.shutdown()
    
    asyncio.run(test_agents())
