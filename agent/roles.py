"""
================================================================================
Ролевое распределение задач между Core Agent и Sub-Agent
================================================================================

Модуль определяет роли агентов, протоколы взаимодействия и распределение задач.
Core Agent координирует всех суб-агентов, каждый суб-агент отвечает за свою зону.
"""
from enum import Enum, auto
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Protocol
from datetime import datetime


class AgentRole(Enum):
    """
    Роли агентов в системе.
    
    Атрибуты:
        CORE: Главный агент - принятие стратегических решений (приоритет 10)
        NAVIGATION: Планирование маршрута, избегание препятствий (приоритет 8)
        PERCEPTION: Анализ видео/сенсоров, распознавание объектов (приоритет 7)
        COMMUNICATION: Mesh-сеть, логирование, отчёты (приоритет 6)
        LEARNING: Сбор данных для обучения, fine-tuning (приоритет 5)
        SUB: Субагент - анализирует, помогает (приоритет 4)
        HYBRID: Совместная работа нескольких агентов (приоритет зависит от задачи)
    """
    CORE = auto()           # Принятие стратегических решений
    NAVIGATION = auto()     # Планирование маршрута, избегание препятствий
    PERCEPTION = auto()     # Анализ видео/сенсоров, распознавание объектов
    COMMUNICATION = auto()  # Mesh-сеть, логирование, отчёты
    LEARNING = auto()       # Сбор данных для обучения, fine-tuning
    SUB = auto()            # Субагент - анализирует, помогает
    HYBRID = auto()         # Совместная работа


class AgentProtocol(Protocol):
    """
    Протокол взаимодействия с агентом.
    
    Все агенты должны реализовать этот протокол для обеспечения
    единого интерфейса управления и мониторинга.
    
    Attributes:
        role: Роль агента в системе
        priority: Приоритет агента (1-10, где 10 = критический)
    
    Methods:
        process: Обработка входных данных и возврат результата
        get_status: Получение текущего статуса агента
        shutdown: Корректная остановка агента
    """
    role: AgentRole
    priority: int  # 1-10, где 10 = критический
    
    def process(self, input_data: Dict) -> Dict:
        """
        Обрабатывает входные данные и возвращает результат.
        
        Args:
            input_data: Словарь с входными данными для обработки.
            
        Returns:
            Dict: Результат обработки данных.
        """
        ...
    
    def get_status(self) -> Dict:
        """
        Возвращает текущий статус агента.
        
        Returns:
            Dict: Статус агента включая состояние, загрузку и метрики.
        """
        ...
    
    def shutdown(self) -> bool:
        """
        Корректно останавливает агента.
        
        Returns:
            bool: True если остановка успешна, False иначе.
        """
        ...


class TaskPriority(Enum):
    """Приоритеты задач"""
    CRITICAL = 0    # Критический - немедленное выполнение
    HIGH = 1        # Высокий - в течение 1 секунды
    MEDIUM = 2      # Средний - в течение 5 секунд
    LOW = 3         # Низкий - в течение 30 секунд
    BACKGROUND = 4  # Фоновый - когда есть время


class TaskType(Enum):
    """Типы задач"""
    # Core Agent задачи
    FLIGHT_CONTROL = "flight_control"
    EMERGENCY_RESPONSE = "emergency_response"
    MISSION_EXECUTION = "mission_execution"
    DECISION_MAKING = "decision_making"
    
    # Sub-Agent задачи
    DATA_ANALYSIS = "data_analysis"
    LOGGING = "logging"
    MAPPING = "mapping"
    CALCULATION = "calculation"
    ROUTE_OPTIMIZATION = "route_optimization"
    PREDICTION = "prediction"
    
    # Совместные задачи
    PERCEPTION = "perception"
    NAVIGATION = "navigation"
    VISUAL_ANALYSIS = "visual_analysis"


@dataclass
class Task:
    """Задача для агента"""
    task_id: str
    task_type: TaskType
    priority: TaskPriority
    data: Dict[str, Any]
    assigned_to: AgentRole
    created_at: datetime
    deadline: Optional[datetime] = None
    dependencies: List[str] = None
    result: Any = None
    status: str = "pending"  # pending, in_progress, completed, failed
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []


@dataclass
class AgentCapabilities:
    """Возможности агента"""
    role: AgentRole
    can_fly: bool
    can_analyze: bool
    can_log: bool
    can_map: bool
    can_calculate: bool
    can_decide: bool
    can_emergency: bool
    
    # Доступ к инструментам
    available_tools: List[str]


# Определение возможностей по ролям
CORE_CAPABILITIES = AgentCapabilities(
    role=AgentRole.CORE,
    can_fly=True,
    can_analyze=True,  # Core тоже может анализировать
    can_log=True,
    can_map=True,
    can_calculate=True,
    can_decide=True,
    can_emergency=True,
    available_tools=["all"]  # Доступ ко всем инструментам
)

SUB_CAPABILITIES = AgentCapabilities(
    role=AgentRole.SUB,
    can_fly=False,  # Sub не управляет полетом напрямую
    can_analyze=True,
    can_log=True,
    can_map=True,
    can_calculate=True,
    can_decide=False,  # Рекомендует, но не решает
    can_emergency=False,  # Предупреждает, но не действует
    available_tools=["analysis", "mapping", "logging", "calculation"]
)


class TaskDistributor:
    """Распределитель задач между агентами"""
    
    def __init__(self):
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        self.task_handlers = {
            # Core Agent задачи
            TaskType.FLIGHT_CONTROL: AgentRole.CORE,
            TaskType.EMERGENCY_RESPONSE: AgentRole.CORE,
            TaskType.MISSION_EXECUTION: AgentRole.CORE,
            TaskType.DECISION_MAKING: AgentRole.CORE,
            
            # Sub-Agent задачи
            TaskType.DATA_ANALYSIS: AgentRole.SUB,
            TaskType.LOGGING: AgentRole.SUB,
            TaskType.MAPPING: AgentRole.SUB,
            TaskType.CALCULATION: AgentRole.SUB,
            TaskType.ROUTE_OPTIMIZATION: AgentRole.SUB,
            TaskType.PREDICTION: AgentRole.SUB,
            
            # Совместные задачи - оба агента
            TaskType.PERCEPTION: AgentRole.HYBRID,
            TaskType.NAVIGATION: AgentRole.HYBRID,
            TaskType.VISUAL_ANALYSIS: AgentRole.HYBRID,
        }
    
    def create_task(
        self,
        task_type: TaskType,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.MEDIUM,
        assigned_to: AgentRole = None
    ) -> Task:
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
                # Core может взять любую задачу
                if agent_role == AgentRole.CORE:
                    task.status = "in_progress"
                    return task
                # Sub берет только свои или гибридные
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
    
    def get_task_status(self, task_id: str) -> Optional[str]:
        """Получение статуса задачи"""
        for task in self.task_queue + self.completed_tasks:
            if task.task_id == task_id:
                return task.status
        return None
