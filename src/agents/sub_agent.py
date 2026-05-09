"""
================================================================================
Sub-Agent - Вспомогательный агент для анализа и помощи Core Agent

Обязанности:
- Сбор и анализ данных
- Ведение журналов
- Построение карт
- Расчеты и оптимизация
- Предложение вариантов Core Agent
================================================================================
"""
import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass

from .agent_roles import (
    AgentRole, TaskPriority, TaskType, Task, 
    TaskDistributor, SUB_CAPABILITIES
)
from src.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class AnalysisResult:
    """Результат анализа"""
    analysis_type: str
    confidence: float
    data: Dict[str, Any]
    recommendations: List[str]
    timestamp: datetime


class SubAgent:
    """
    Sub-Agent - Вспомогательный агент
    
    НЕ принимает решения самостоятельно!
    Только анализирует, считает, рекомендует.
    Все решения принимает Core Agent.
    """

    def __init__(self, config: Dict[str, Any] = None, main_agent: Any = None):
        self.config = config or {}
        self.main_agent = main_agent
        self.role = AgentRole.SUB
        self.capabilities = SUB_CAPABILITIES
        
        # Статус
        self.status = "initializing"
        self.is_running = False
        
        # Очередь задач
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        
        # Журналы
        self.flight_logs: List[Dict] = []
        self.event_logs: List[Dict] = []
        self.analysis_history: List[AnalysisResult] = []
        
        # Карты
        self.maps: Dict[str, Any] = {}
        self.heatmaps: Dict[str, Any] = {}
        
        # DeepSeek интеграция
        self.sub_agent_config = self.config.get('sub_agent', {})
        self.deepseek_enabled = self.sub_agent_config.get('enabled', False)
        self.deepseek_available = False
        self.api_key = None
        self.client = None
        
        if self.deepseek_enabled:
            self._init_deepseek()
        
        logger.info("🤖 Sub-Agent инициализирован")

    def _init_deepseek(self):
        """Инициализация DeepSeek API"""
        import os
        
        self.api_key = os.getenv('DEEPSEEK_API_KEY')
        api_base = os.getenv('DEEPSEEK_API_BASE', 'https://api.deepseek.com/v1')
        
        if self.api_key:
            try:
                import openai
                self.client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url=api_base
                )
                self.deepseek_available = True
                logger.info("✅ DeepSeek API доступен")
            except Exception as e:
                logger.warning(f"⚠️ DeepSeek недоступен: {e}")
        else:
            logger.info("ℹ️ DeepSeek API ключ не установлен")

    async def ask(self, question: str) -> Dict[str, Any]:
        """
        Ответ на произвольный вопрос через DeepSeek (если доступен) или офлайн-заглушка.
        Используется HTTP `/api/v1/sub_agent/ask`.
        """
        if self.deepseek_available and self.client:
            try:
                model = self.sub_agent_config.get("model", "deepseek-chat")
                completion = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": question}],
                    temperature=float(self.sub_agent_config.get("temperature", 0.7)),
                    max_tokens=int(self.sub_agent_config.get("max_tokens", 2000)),
                )
                text = completion.choices[0].message.content or ""
                return {"answer": text.strip(), "offline": False}
            except Exception as e:
                logger.error(f"DeepSeek ask error: {e}")
        return {
            "answer": (
                "[офлайн] Субагент получил вопрос, но LLM недоступен. "
                "Установите DEEPSEEK_API_KEY для полноценных ответов."
            ),
            "offline": True,
        }

    async def initialize(self):
        """Инициализация Sub-Agent"""
        logger.info("🚀 Инициализация Sub-Agent...")
        
        # Загрузка исторических данных
        await self._load_logs()
        await self._load_maps()
        
        self.status = "ready"
        self.is_running = True
        
        # Запуск фоновых задач
        asyncio.create_task(self._background_worker())
        
        logger.info("✅ Sub-Agent готов к работе")
        return True

    async def _background_worker(self):
        """Фоновый обработчик задач"""
        while self.is_running:
            try:
                # Обработка задач из очереди
                if self.task_queue:
                    task = self.task_queue.pop(0)
                    await self.process_task(task)
                
                # Периодический анализ
                await self._periodic_analysis()
                
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"❌ Ошибка фонового worker: {e}")
                await asyncio.sleep(5)

    async def _periodic_analysis(self):
        """Периодический анализ данных"""
        # Анализ каждые 30 секунд
        if len(self.flight_logs) % 30 == 0 and self.flight_logs:
            await self._analyze_flight_data()

    async def process_task(self, task: Task) -> Any:
        """Обработка задачи"""
        logger.info(f"📋 Sub-Agent обрабатывает: {task.task_type.value}")
        
        task.status = "in_progress"
        result = None
        
        try:
            if task.task_type == TaskType.DATA_ANALYSIS:
                result = await self._analyze_data(task.data)
            elif task.task_type == TaskType.LOGGING:
                result = await self._log_event(task.data)
            elif task.task_type == TaskType.MAPPING:
                result = await self._update_map(task.data)
            elif task.task_type == TaskType.CALCULATION:
                result = await self._calculate(task.data)
            elif task.task_type == TaskType.ROUTE_OPTIMIZATION:
                result = await self._optimize_route_task(task.data)
            elif task.task_type == TaskType.PREDICTION:
                result = await self._predict(task.data)
            elif task.task_type == TaskType.PERCEPTION:
                result = await self._enhance_perception(task.data)
            else:
                result = await self._general_analysis(task.data)
            
            task.status = "completed"
            task.result = result
            self.completed_tasks.append(task)
            
        except Exception as e:
            logger.error(f"❌ Ошибка обработки задачи: {e}")
            task.status = "failed"
        
        return result

    # ========== Анализ данных ==========
    
    async def _analyze_data(self, data: Dict[str, Any]) -> AnalysisResult:
        """Анализ данных"""
        telemetry = data.get("telemetry", {})
        
        # Анализ батареи
        battery = telemetry.get("battery", 100)
        battery_trend = "stable"
        if len(self.flight_logs) > 10:
            old_battery = self.flight_logs[-10].get("battery", 100)
            if battery < old_battery - 5:
                battery_trend = "decreasing_fast"
            elif battery < old_battery:
                battery_trend = "decreasing"
        
        # Анализ позиции
        position = telemetry.get("position", {})
        
        result = AnalysisResult(
            analysis_type="telemetry",
            confidence=0.95,
            data={
                "battery_trend": battery_trend,
                "position": position,
                "signal_quality": telemetry.get("signal_strength", 0)
            },
            recommendations=[],
            timestamp=datetime.now()
        )
        
        # Генерация рекомендаций
        if battery < 30:
            result.recommendations.append("Низкий заряд батареи - рекомендуется RTL")
        if battery_trend == "decreasing_fast":
            result.recommendations.append("Быстрая разрядка - сократите миссию")
        
        self.analysis_history.append(result)
        return result

    async def _enhance_perception(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Улучшение восприятия через анализ"""
        # Дополнительный анализ данных от сенсоров
        enhanced = data.copy()
        
        # Добавляем контекст из истории
        if self.flight_logs:
            recent_logs = self.flight_logs[-10:]
            enhanced["context"] = {
                "average_battery_drain": self._calculate_battery_drain(recent_logs),
                "flight_time": len(self.flight_logs) * 0.1,
                "waypoints_visited": len([l for l in recent_logs if l.get("waypoint_reached")])
            }
        
        return enhanced

    def _calculate_battery_drain(self, logs: List[Dict]) -> float:
        """Расчет скорости разрядки батареи"""
        if len(logs) < 2:
            return 0.0
        
        start_battery = logs[0].get("battery", 100)
        end_battery = logs[-1].get("battery", 100)
        time_period = len(logs) * 0.1  # секунды
        
        if time_period > 0:
            return (start_battery - end_battery) / time_period * 60  # % в минуту
        return 0.0

    # ========== Журналирование ==========
    
    async def _log_event(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Запись события в журнал"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": data.get("event_type", "unknown"),
            "data": data,
            "agent_id": self.main_agent.agent_id if self.main_agent else "unknown"
        }
        
        self.event_logs.append(event)
        
        # Ограничение размера
        if len(self.event_logs) > 10000:
            self.event_logs = self.event_logs[-5000:]
        
        # Сохранение в файл
        await self._save_logs()
        
        return {"logged": True, "event_id": len(self.event_logs)}

    async def _save_logs(self):
        """Сохранение журналов"""
        try:
            import os
            os.makedirs("data/flight_data", exist_ok=True)
            
            with open("data/flight_data/event_logs.json", "w") as f:
                json.dump(self.event_logs[-1000:], f, indent=2)
        except Exception as e:
            logger.error(f"Ошибка сохранения логов: {e}")

    async def _load_logs(self):
        """Загрузка журналов"""
        try:
            import os
            from pathlib import Path
            
            log_path = Path("data/flight_data/event_logs.json")
            if log_path.exists():
                with open(log_path, 'r') as f:
                    self.event_logs = json.load(f)
                logger.info(f"✅ Загружено {len(self.event_logs)} событий")
        except Exception as e:
            logger.warning(f"⚠️ Не удалось загрузить логи: {e}")

    # ========== Карты ==========
    
    async def _update_map(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Обновление карты"""
        position = data.get("position", {})
        map_type = data.get("map_type", "coverage")
        
        if map_type not in self.maps:
            self.maps[map_type] = {
                "points": [],
                "heatpoints": [],
                "created": datetime.now().isoformat()
            }
        
        self.maps[map_type]["points"].append({
            "lat": position.get("lat", 0),
            "lon": position.get("lon", 0),
            "alt": position.get("z", 0),
            "timestamp": datetime.now().isoformat()
        })
        
        await self._save_maps()
        
        return {"map_updated": True, "points_count": len(self.maps[map_type]["points"])}

    async def _save_maps(self):
        """Сохранение карт"""
        try:
            import os
            os.makedirs("data/flight_data/maps", exist_ok=True)
            
            for map_name, map_data in self.maps.items():
                with open(f"data/flight_data/maps/{map_name}.json", "w") as f:
                    json.dump(map_data, f, indent=2)
        except Exception as e:
            logger.error(f"Ошибка сохранения карт: {e}")

    async def _load_maps(self):
        """Загрузка карт"""
        try:
            import os
            from pathlib import Path
            
            maps_dir = Path("data/flight_data/maps")
            if maps_dir.exists():
                for map_file in maps_dir.glob("*.json"):
                    with open(map_file, 'r') as f:
                        self.maps[map_file.stem] = json.load(f)
                logger.info(f"✅ Загружено {len(self.maps)} карт")
        except Exception as e:
            logger.warning(f"⚠️ Не удалось загрузить карты: {e}")

    # ========== Расчеты ==========
    
    async def _calculate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Выполнение расчетов"""
        calculation_type = data.get("calculation_type", "distance")
        
        if calculation_type == "distance":
            return self._calculate_distance(data)
        elif calculation_type == "flight_time":
            return self._calculate_flight_time(data)
        elif calculation_type == "battery_needed":
            return self._calculate_battery_needed(data)
        
        return {"error": "Unknown calculation type"}

    def _calculate_distance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Расчет расстояния между точками"""
        import math
        
        p1 = data.get("point1", {})
        p2 = data.get("point2", {})
        
        lat1, lon1 = p1.get("lat", 0), p1.get("lon", 0)
        lat2, lon2 = p2.get("lat", 0), p2.get("lon", 0)
        
        # Haversine formula
        R = 6371000  # радиус Земли в метрах
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return {"distance_m": distance, "distance_km": distance / 1000}

    def _calculate_flight_time(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Расчет времени полета"""
        distance = data.get("distance_m", 0)
        speed = data.get("speed_ms", 10)
        
        if speed > 0:
            time_seconds = distance / speed
            return {
                "time_seconds": time_seconds,
                "time_minutes": time_seconds / 60
            }
        return {"error": "Invalid speed"}

    def _calculate_battery_needed(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Расчет необходимого заряда батареи"""
        distance = data.get("distance_m", 0)
        # Примерно 1% батареи на 100 метров
        battery_needed = (distance / 100) * 1
        
        # Запас 20%
        battery_with_reserve = battery_needed * 1.2
        
        return {
            "battery_needed_percent": battery_needed,
            "battery_with_reserve": battery_with_reserve,
            "is_enough": battery_with_reserve < data.get("current_battery", 100)
        }

    # ========== Оптимизация маршрута ==========
    
    async def optimize_route(self, waypoints: List[Dict[str, float]]) -> Dict[str, Any]:
        """Оптимизация маршрута - публичный метод для Core Agent"""
        return await self._optimize_route_task({"waypoints": waypoints})

    async def _optimize_route_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Оптимизация маршрута"""
        waypoints = data.get("waypoints", [])
        
        if len(waypoints) < 3:
            return {"optimized_waypoints": waypoints, "optimization": "none"}
        
        # Простая оптимизация: убрать лишние точки
        optimized = self._simplify_path(waypoints)
        
        # Расчет улучшения
        original_distance = self._calculate_path_distance(waypoints)
        optimized_distance = self._calculate_path_distance(optimized)
        
        improvement = (original_distance - optimized_distance) / original_distance * 100
        
        return {
            "optimized_waypoints": optimized,
            "original_count": len(waypoints),
            "optimized_count": len(optimized),
            "distance_saved_m": original_distance - optimized_distance,
            "improvement_percent": improvement,
            "optimization": "path_simplification"
        }

    def _simplify_path(self, waypoints: List[Dict[str, float]], epsilon: float = 5.0) -> List[Dict[str, float]]:
        """Упрощение пути (Douglas-Peucker)"""
        if len(waypoints) <= 2:
            return waypoints
        
        # Упрощенная версия - убираем точки ближе epsilon метров
        simplified = [waypoints[0]]
        
        for i in range(1, len(waypoints) - 1):
            dist = self._point_to_line_distance(
                waypoints[i],
                simplified[-1],
                waypoints[i + 1]
            )
            if dist > epsilon:
                simplified.append(waypoints[i])
        
        simplified.append(waypoints[-1])
        return simplified

    def _point_to_line_distance(self, p: Dict, line_start: Dict, line_end: Dict) -> float:
        """Расстояние от точки до линии"""
        import math
        
        x, y = p.get("x", 0), p.get("y", 0)
        x1, y1 = line_start.get("x", 0), line_start.get("y", 0)
        x2, y2 = line_end.get("x", 0), line_end.get("y", 0)
        
        if x1 == x2 and y1 == y2:
            return math.sqrt((x - x1)**2 + (y - y1)**2)
        
        num = abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1)
        den = math.sqrt((y2 - y1)**2 + (x2 - x1)**2)
        
        return num / den if den > 0 else 0

    def _calculate_path_distance(self, waypoints: List[Dict[str, float]]) -> float:
        """Расчет длины пути"""
        total = 0
        for i in range(len(waypoints) - 1):
            result = self._calculate_distance({
                "point1": waypoints[i],
                "point2": waypoints[i + 1]
            })
            total += result.get("distance_m", 0)
        return total

    # ========== Предсказания ==========
    
    async def _predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Предсказание на основе истории"""
        prediction_type = data.get("prediction_type", "battery_life")
        
        if prediction_type == "battery_life":
            return self._predict_battery_life()
        elif prediction_type == "flight_completion":
            return self._predict_flight_completion(data)
        
        return {"error": "Unknown prediction type"}

    def _predict_battery_life(self) -> Dict[str, Any]:
        """Предсказание времени работы батареи"""
        if len(self.flight_logs) < 10:
            return {"estimated_minutes": 15, "confidence": 0.5}
        
        drain_rate = self._calculate_battery_drain(self.flight_logs[-50:])
        current_battery = self.flight_logs[-1].get("battery", 100)
        
        if drain_rate > 0:
            estimated_minutes = current_battery / drain_rate
            return {
                "estimated_minutes": estimated_minutes,
                "confidence": 0.8,
                "drain_rate_per_min": drain_rate
            }
        
        return {"estimated_minutes": 15, "confidence": 0.5}

    def _predict_flight_completion(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Предсказание завершения полета"""
        waypoints_remaining = data.get("waypoints_remaining", 0)
        battery = data.get("battery", 100)
        
        # Примерно 2% на точку
        battery_needed = waypoints_remaining * 2
        
        return {
            "can_complete": battery > battery_needed * 1.5,
            "battery_needed": battery_needed,
            "safety_margin": battery - battery_needed
        }

    # ========== Публичные методы для Core Agent ==========
    
    async def recommend(
        self, 
        perception: Dict[str, Any], 
        mission: Any
    ) -> Dict[str, Any]:
        """Рекомендации для Core Agent"""
        recommendations = {
            "suggested_command": None,
            "reason": "",
            "confidence": 0.0,
            "priority": "low"
        }
        
        telemetry = perception.get("telemetry", {})
        battery = telemetry.get("battery", 100)
        
        # Рекомендация на основе батареи
        if battery < 25:
            recommendations["suggested_command"] = "RTL"
            recommendations["reason"] = "Критический уровень батареи"
            recommendations["confidence"] = 0.95
            recommendations["priority"] = "high"
        elif battery < 40:
            recommendations["suggested_command"] = "CONSERVE_BATTERY"
            recommendations["reason"] = "Низкий заряд - экономия энергии"
            recommendations["confidence"] = 0.8
            recommendations["priority"] = "medium"
        
        # Рекомендация на основе миссии
        if mission:
            route_opt = await self.optimize_route(mission.waypoints)
            if route_opt.get("improvement_percent", 0) > 10:
                recommendations["route_optimization"] = route_opt
        
        return recommendations

    async def analyze_mission(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Анализ завершенной миссии"""
        analysis = {
            "efficiency": 0.0,
            "issues": [],
            "improvements": []
        }
        
        # Эффективность
        completed = report.get("waypoints_completed", 0)
        total = report.get("total_waypoints", 1)
        analysis["efficiency"] = completed / total * 100
        
        # Проблемы
        if analysis["efficiency"] < 100:
            analysis["issues"].append("Не все точки достигнуты")
        
        # Улучшения
        analysis["improvements"].append("Оптимизировать скорость между точками")
        
        return analysis

    async def notify_action(self, action: str, result: Dict[str, Any]):
        """Уведомление о действии"""
        logger.debug(f"📢 Sub-Agent получил уведомление: {action}")
        
        # Логирование действия
        await self._log_event({
            "event_type": "action",
            "action": action,
            "result": result
        })

    async def shutdown(self):
        """Завершение работы"""
        logger.info("🛑 Завершение работы Sub-Agent...")
        
        self.is_running = False
        
        # Сохранение данных
        await self._save_logs()
        await self._save_maps()
        
        self.status = "shutdown"
        logger.info("👋 Sub-Agent завершил работу")

    async def _general_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Общий анализ"""
        return {"analyzed": True, "data_keys": list(data.keys())}

    async def _analyze_flight_data(self):
        """Анализ данных полета"""
        if len(self.flight_logs) < 10:
            return
        
        # Периодический анализ
        logger.info("📊 Sub-Agent выполняет периодический анализ полета")
