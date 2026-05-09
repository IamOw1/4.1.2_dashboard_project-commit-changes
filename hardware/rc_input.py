"""
COBA AI Drone Agent - Абстракция ввода RC
Абстрактный интерфейс для ввода RC контроллера с управлением состояния
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)

class RCInputSource(Enum):
    """Типы источников ввода RC"""
    REAL = "real"
    MOCK = "mock"
    SIMULATOR = "simulator"

@dataclass
class RCState:
    """Текущее состояние RC контроллера"""
    # Joystick axes (-1.0 to 1.0)
    left_stick_x: float = 0.0  # Roll
    left_stick_y: float = 0.0  # Throttle
    right_stick_x: float = 0.0  # Yaw
    right_stick_y: float = 0.0  # Pitch

    # Buttons (True/False)
    button_a: bool = False
    button_b: bool = False
    button_x: bool = False
    button_y: bool = False

    # Triggers (0.0 to 1.0)
    left_trigger: float = 0.0
    right_trigger: float = 0.0

    # D-pad
    dpad_up: bool = False
    dpad_down: bool = False
    dpad_left: bool = False
    dpad_right: bool = False

    # Connection status
    connected: bool = False
    last_update: float = 0.0

    def is_operator_active(self) -> bool:
        """
        Определить если оператор активно управляет дроном
        Возвращает True если палки отклоняются за дедзону или нажаты критические кнопки
        """
        DEADZONE = 0.1

        # Check if sticks are moved
        sticks_active = (
            abs(self.left_stick_x) > DEADZONE or
            abs(self.left_stick_y) > DEADZONE or
            abs(self.right_stick_x) > DEADZONE or
            abs(self.right_stick_y) > DEADZONE
        )

        # Check critical buttons (emergency stop, etc.)
        critical_buttons = self.button_y  # Assuming Y is emergency

        return sticks_active or critical_buttons

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'left_stick_x': self.left_stick_x,
            'left_stick_y': self.left_stick_y,
            'right_stick_x': self.right_stick_x,
            'right_stick_y': self.right_stick_y,
            'button_a': self.button_a,
            'button_b': self.button_b,
            'button_x': self.button_x,
            'button_y': self.button_y,
            'left_trigger': self.left_trigger,
            'right_trigger': self.right_trigger,
            'dpad_up': self.dpad_up,
            'dpad_down': self.dpad_down,
            'dpad_left': self.dpad_left,
            'dpad_right': self.dpad_right,
            'connected': self.connected,
            'last_update': self.last_update,
            'operator_active': self.is_operator_active()
        }

class IRCInput(ABC):
    """Абстрактный базовый класс для источников ввода RC"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the RC input source"""
        pass

    @abstractmethod
    async def get_state(self) -> RCState:
        """Get current RC state"""
        pass

    @abstractmethod
    async def shutdown(self) -> None:
        """Shutdown the RC input source"""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check if RC is connected"""
        pass

def create_rc_input(source: RCInputSource, config: Optional[Dict[str, Any]] = None) -> IRCInput:
    """
    Factory function to create RC input instance based on source type
    """
    if source == RCInputSource.REAL:
        # Import here to avoid circular imports
        from .rc_adapter import RCAdapter
        return RCAdapter(config)
    elif source == RCInputSource.MOCK:
        from .mock_rc import MockRC
        return MockRC(config)
    else:
        raise ValueError(f"Unsupported RC input source: {source}")

# Global RC input instance
_rc_input = None

def get_rc_input(source: Optional[RCInputSource] = None, config: Optional[Dict[str, Any]] = None) -> IRCInput:
    """Get or create global RC input instance"""
    global _rc_input
    if _rc_input is None:
        if source is None:
            source = RCInputSource.REAL
        _rc_input = create_rc_input(source, config)
    return _rc_input