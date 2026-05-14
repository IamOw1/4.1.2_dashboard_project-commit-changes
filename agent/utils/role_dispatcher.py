#!/usr/bin/env python3
"""
Диспетчер ролей для распределения задач между агентами.

Реализует логику назначения приоритетов и координации
между Core Agent и Sub Agents на основе их ролей.
"""

from typing import Dict, List, Optional, Any, Protocol
from enum import Enum, auto
from dataclasses import dataclass, field
import logging

from agent.roles import AgentRole


logger = logging.getLogger(__name__)


class AgentProtocol(Protocol):
    """Протокол для всех агентов системы."""
    
    role: AgentRole
    priority: int
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Обрабатывает входные данные."""
        ...
    
    def get_status(self) -> Dict[str, Any]:
        """Возвращает текущий статус агента."""
        ...
    
    def shutdown(self) -> bool:
        """Корректно завершает работу агента."""
        ...


@dataclass
class TaskAssignment:
    """
    Назначение задачи агенту.
    
    Attributes:
        task_id: Уникальный идентификатор задачи
        agent_role: Роль агента, которому назначается задача
        priority: Приоритет задачи (1-10)
        input_data: Входные данные для обработки
        assigned_to: ID конкретного агента (если назначен)
        status: Статус выполнения
        result: Результат выполнения (если есть)
    """
    task_id: str
    agent_role: AgentRole
    priority: int
    input_data: Dict[str, Any]
    assigned_to: Optional[str] = None
    status: str = "pending"  # pending, running, completed, failed
    result: Optional[Dict[str, Any]] = None


class RoleDispatcher:
    """
    Диспетчер для распределения задач между агентами по ролям.
    
    Реализует следующую логику:
    - CORE агент координирует всех суб-агентов
    - Каждый суб-агент отвечает за свою зону ответственности
    - Приоритеты решают конфликты ресурсов
    - Задачи распределяются на основе ролей и доступности агентов
    """
    
    def __init__(self):
        """Инициализирует диспетчер ролей."""
        self._agents: Dict[str, AgentProtocol] = {}
        self._task_queue: List[TaskAssignment] = []
        self._role_priority_map: Dict[AgentRole, int] = {
            AgentRole.CORE: 10,
            AgentRole.NAVIGATION: 8,
            AgentRole.PERCEPTION: 7,
            AgentRole.COMMUNICATION: 6,
            AgentRole.LEARNING: 5,
        }
    
    def register_agent(self, agent_id: str, agent: AgentProtocol) -> bool:
        """
        Регистрирует агента в диспетчере.
        
        Args:
            agent_id: Уникальный идентификатор агента
            agent: Экземпляр агента, реализующий AgentProtocol
        
        Returns:
            bool: True если регистрация успешна, False если агент уже существует
        
        Raises:
            ValueError: Если агент не реализует требуемый протокол
        """
        if agent_id in self._agents:
            logger.warning(f"Агент {agent_id} уже зарегистрирован")
            return False
        
        # Проверяем наличие обязательных атрибутов
        if not hasattr(agent, 'role') or not hasattr(agent, 'priority'):
            raise ValueError(f"Агент {agent_id} не реализует AgentProtocol")
        
        self._agents[agent_id] = agent
        logger.info(f"Зарегистрирован агент {agent_id} с ролью {agent.role.name}")
        return True
    
    def unregister_agent(self, agent_id: str) -> bool:
        """
        Удаляет агента из диспетчера.
        
        Args:
            agent_id: Идентификатор агента для удаления
        
        Returns:
            bool: True если агент успешно удалён, False если не найден
        """
        if agent_id not in self._agents:
            return False
        
        agent = self._agents[agent_id]
        # Пытаемся корректно завершить работу агента
        try:
            agent.shutdown()
        except Exception as e:
            logger.error(f"Ошибка при завершении работы агента {agent_id}: {e}")
        
        del self._agents[agent_id]
        logger.info(f"Агент {agent_id} удалён из диспетчера")
        return True
    
    def assign_task(self, task: TaskAssignment) -> Optional[str]:
        """
        Назначает задачу подходящему агенту.
        
        Args:
            task: Задача для назначения
        
        Returns:
            Optional[str]: ID агента, которому назначена задача, или None
        """
        # Находим всех агентов с подходящей ролью
        suitable_agents = [
            (agent_id, agent) for agent_id, agent in self._agents.items()
            if agent.role == task.agent_role
        ]
        
        if not suitable_agents:
            logger.warning(f"Нет агентов с ролью {task.agent_role.name}")
            task.status = "failed"
            return None
        
        # Сортируем по приоритету агента (выше приоритет = лучше)
        suitable_agents.sort(key=lambda x: x[1].priority, reverse=True)
        
        # Выбираем первого доступного агента
        selected_agent_id, selected_agent = suitable_agents[0]
        
        task.assigned_to = selected_agent_id
        task.status = "running"
        
        logger.info(
            f"Задача {task.task_id} назначена агенту {selected_agent_id} "
            f"(роль: {task.agent_role.name}, приоритет: {task.priority})"
        )
        
        return selected_agent_id
    
    def process_task(self, task: TaskAssignment) -> Optional[Dict[str, Any]]:
        """
        Выполняет задачу через назначенного агента.
        
        Args:
            task: Задача для выполнения
        
        Returns:
            Optional[Dict[str, Any]]: Результат выполнения или None
        """
        if not task.assigned_to:
            # Пытаемся назначить задачу
            agent_id = self.assign_task(task)
            if not agent_id:
                return None
        else:
            agent_id = task.assigned_to
        
        if agent_id not in self._agents:
            logger.error(f"Агент {agent_id} не найден")
            task.status = "failed"
            return None
        
        agent = self._agents[agent_id]
        
        try:
            result = agent.process(task.input_data)
            task.result = result
            task.status = "completed"
            logger.info(f"Задача {task.task_id} выполнена агентом {agent_id}")
            return result
        except Exception as e:
            logger.error(f"Ошибка при выполнении задачи {task.task_id}: {e}")
            task.status = "failed"
            return None
    
    def get_available_agents(self, role: Optional[AgentRole] = None) -> List[str]:
        """
        Возвращает список доступных агентов.
        
        Args:
            role: Фильтр по роли (если None, возвращает всех)
        
        Returns:
            List[str]: Список ID доступных агентов
        """
        if role is None:
            return list(self._agents.keys())
        
        return [
            agent_id for agent_id, agent in self._agents.items()
            if agent.role == role
        ]
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Возвращает статус конкретного агента.
        
        Args:
            agent_id: Идентификатор агента
        
        Returns:
            Optional[Dict[str, Any]]: Статус агента или None если не найден
        """
        if agent_id not in self._agents:
            return None
        
        agent = self._agents[agent_id]
        status = agent.get_status()
        status['agent_id'] = agent_id
        status['role'] = agent.role.name
        status['registered'] = True
        
        return status
    
    def get_all_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Возвращает статусы всех зарегистрированных агентов.
        
        Returns:
            Dict[str, Dict[str, Any]]: Словарь статусов по ID агентов
        """
        return {
            agent_id: self.get_agent_status(agent_id)
            for agent_id in self._agents
        }
    
    def coordinate_agents(self, coordination_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Координирует работу нескольких агентов.
        
        Использует CORE агента для координации суб-агентов
        при выполнении сложных многоэтапных задач.
        
        Args:
            coordination_data: Данные для координации, включая:
                - objective: Цель координации
                - constraints: Ограничения
                - sub_tasks: Подзадачи для суб-агентов
        
        Returns:
            Dict[str, Any]: Результаты координации
        """
        # Находим CORE агента
        core_agents = [
            (agent_id, agent) for agent_id, agent in self._agents.items()
            if agent.role == AgentRole.CORE
        ]
        
        if not core_agents:
            logger.error("CORE агент не найден для координации")
            return {"error": "No CORE agent available"}
        
        core_agent_id, core_agent = core_agents[0]
        
        try:
            result = core_agent.process({
                "type": "coordination",
                "data": coordination_data,
                "available_agents": self.get_all_statuses()
            })
            
            logger.info(f"Координация выполнена CORE агентом {core_agent_id}")
            return result
        except Exception as e:
            logger.error(f"Ошибка координации агентов: {e}")
            return {"error": str(e)}
    
    def resolve_conflict(self, task1: TaskAssignment, 
                         task2: TaskAssignment) -> TaskAssignment:
        """
        Разрешает конфликт между двумя задачами за ресурсы.
        
        Args:
            task1: Первая задача
            task2: Вторая задача
        
        Returns:
            TaskAssignment: Задача с более высоким приоритетом
        """
        # Получаем приоритеты ролей
        priority1 = self._role_priority_map.get(task1.agent_role, 0) + task1.priority
        priority2 = self._role_priority_map.get(task2.agent_role, 0) + task2.priority
        
        if priority1 >= priority2:
            logger.info(
                f"Конфликт разрешён: задача {task1.task_id} имеет приоритет "
                f"({priority1} vs {priority2})"
            )
            return task1
        else:
            logger.info(
                f"Конфликт разрешён: задача {task2.task_id} имеет приоритет "
                f"({priority2} vs {priority1})"
            )
            return task2
    
    def shutdown_all(self) -> bool:
        """
        Корректно завершает работу всех агентов.
        
        Returns:
            bool: True если все агенты успешно завершены
        """
        success = True
        for agent_id in list(self._agents.keys()):
            if not self.unregister_agent(agent_id):
                success = False
        
        self._task_queue.clear()
        logger.info("Все агенты завершили работу")
        return success
