"""
COBA AI Drone Agent - Арбитр управления
Арбитрирует между командами оператора RC и командами ИИ с логикой приоритета
"""

import logging
from dataclasses import dataclass
from typing import Dict, Any, Optional, Union
from enum import Enum

from hardware.rc_input import RCState

logger = logging.getLogger(__name__)

class CommandSource(Enum):
    """Источник команды управления"""
    RC = "rc"
    LLM = "llm"
    SYSTEM = "system"

@dataclass
class AICommand:
    """Команда от LLM/AI системы"""
    action: str  # e.g., "move_forward", "turn_left", "hover", "land"
    parameters: Dict[str, Any] = None
    confidence: float = 0.0  # 0.0 to 1.0
    reasoning: str = ""
    timestamp: float = 0.0

    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}

@dataclass
class ControlCommand:
    """Финальная команда управления отправленная на дрон"""
    source: CommandSource
    action: str
    parameters: Dict[str, Any]
    priority: int  # Higher number = higher priority
    timestamp: float
    reasoning: str = ""

class ControlArbitrator:
    """
    Арбитрирует управление между оператором RC и ИИ LLM
    Оператор имеет приоритет при активном управлении
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.rc_priority_threshold = self.config.get('rc_priority_threshold', 0.1)  # Дедзона
        self.llm_min_confidence = self.config.get('llm_min_confidence', 0.7)
        self.operator_timeout = self.config.get('operator_timeout', 5.0)  # секунды

        # Отслеживание состояния
        self.last_operator_active_time = 0.0
        self.last_rc_state = None

        logger.info("Арбитр управления инициализирован")

    def arbitrate(self, rc_state: RCState, ai_command: Optional[AICommand] = None) -> ControlCommand:
        """
        Арбитрирует между командами RC и AI

        Правила приоритета:
        1. Команды оператора RC всегда имеют приоритет когда оператор активен
        2. Команды AI только когда оператор неактивен и уверенность достаточна
        3. Системные команды (аварийная остановка) переопределяют все
        """
        current_time = rc_state.last_update

        # Update operator activity tracking
        if rc_state.is_operator_active():
            self.last_operator_active_time = current_time
            self.last_rc_state = rc_state

        # Check if operator was recently active
        operator_recently_active = (current_time - self.last_operator_active_time) < self.operator_timeout

        # Rule 1: RC operator has priority when active or recently active
        if rc_state.connected and (rc_state.is_operator_active() or operator_recently_active):
            rc_command = self._rc_state_to_command(rc_state)
            rc_command.reasoning = "Operator actively controlling or recently active"
            logger.debug(f"RC command selected: {rc_command.action}")
            return rc_command

        # Rule 2: AI command if operator inactive and AI command available
        if ai_command and ai_command.confidence >= self.llm_min_confidence:
            ai_control_command = self._ai_command_to_control_command(ai_command)
            ai_control_command.reasoning = f"AI command with confidence {ai_command.confidence:.2f}"
            logger.debug(f"AI command selected: {ai_control_command.action}")
            return ai_control_command

        # Rule 3: Default to hover/maintain position if no active control
        default_command = ControlCommand(
            source=CommandSource.SYSTEM,
            action="hover",
            parameters={},
            priority=0,
            timestamp=current_time,
            reasoning="No active control source, maintaining position"
        )
        logger.debug("Default hover command selected")
        return default_command

    def _rc_state_to_command(self, rc_state: RCState) -> ControlCommand:
        """Convert RC state to control command"""
        # Map RC inputs to drone actions
        command = ControlCommand(
            source=CommandSource.RC,
            action="manual_control",
            parameters={},
            priority=100,  # High priority
            timestamp=rc_state.last_update
        )

        # Convert stick positions to velocity commands
        # Assuming NED coordinate system (North, East, Down)
        command.parameters = {
            'velocity_north': -rc_state.right_stick_y * 5.0,  # Forward/backward (m/s)
            'velocity_east': rc_state.right_stick_x * 5.0,    # Left/right (m/s)
            'velocity_down': -rc_state.left_stick_y * 2.0,    # Up/down (m/s)
            'yaw_rate': rc_state.left_stick_x * 90.0,         # Rotation rate (deg/s)
        }

        # Handle button actions
        if rc_state.button_y:  # Emergency stop
            command.action = "emergency_stop"
            command.parameters = {}
            command.priority = 1000  # Emergency priority

        elif rc_state.button_x:  # Land
            command.action = "land"
            command.parameters = {}
            command.priority = 100

        elif rc_state.button_a:  # Take off
            command.action = "takeoff"
            command.parameters = {'altitude': 10.0}  # Default takeoff altitude

        elif rc_state.button_b:  # Return to home
            command.action = "rtl"
            command.parameters = {}

        return command

    def _ai_command_to_control_command(self, ai_command: AICommand) -> ControlCommand:
        """Convert AI command to control command"""
        command = ControlCommand(
            source=CommandSource.LLM,
            action=ai_command.action,
            parameters=ai_command.parameters.copy(),
            priority=10,  # Lower than RC
            timestamp=ai_command.timestamp,
            reasoning=ai_command.reasoning
        )

        # Validate AI command parameters
        if ai_command.action == "move":
            # Ensure velocity limits
            for param in ['velocity_x', 'velocity_y', 'velocity_z']:
                if param in command.parameters:
                    command.parameters[param] = max(-5.0, min(5.0, command.parameters[param]))

        elif ai_command.action == "turn":
            # Ensure yaw rate limits
            if 'yaw_rate' in command.parameters:
                command.parameters['yaw_rate'] = max(-90.0, min(90.0, command.parameters['yaw_rate']))

        return command

    def get_arbitration_status(self) -> Dict[str, Any]:
        """Get current arbitration status for monitoring"""
        return {
            'last_operator_active_time': self.last_operator_active_time,
            'operator_timeout': self.operator_timeout,
            'rc_priority_threshold': self.rc_priority_threshold,
            'llm_min_confidence': self.llm_min_confidence,
            'last_rc_connected': self.last_rc_state.connected if self.last_rc_state else False
        }

# Global arbitrator instance
_arbitrator = None

def get_control_arbitrator(config: Optional[Dict[str, Any]] = None) -> ControlArbitrator:
    """Get or create global control arbitrator instance"""
    global _arbitrator
    if _arbitrator is None:
        _arbitrator = ControlArbitrator(config)
    return _arbitrator