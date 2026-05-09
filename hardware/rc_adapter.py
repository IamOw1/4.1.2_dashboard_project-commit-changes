"""
COBA AI Drone Agent - RC Adapter for DJI Mini 2 / RC-N1
Windows implementation using pygame for gamepad/joystick input
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional

try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    pygame = None

from .rc_input import IRCInput, RCState

logger = logging.getLogger(__name__)

class RCAdapter(IRCInput):
    """
    RC Adapter for DJI Mini 2 / RC-N1 using pygame
    Assumes RC-N1 appears as a gamepad/joystick device
    """

    # DJI RC-N1 button/axis mapping (may need calibration)
    AXIS_MAPPING = {
        0: 'left_stick_x',   # Roll
        1: 'left_stick_y',   # Throttle (inverted)
        2: 'right_stick_x',  # Yaw
        3: 'right_stick_y',  # Pitch (inverted)
        4: 'left_trigger',   # Left trigger
        5: 'right_trigger',  # Right trigger
    }

    BUTTON_MAPPING = {
        0: 'button_a',   # A button
        1: 'button_b',   # B button
        2: 'button_x',   # X button
        3: 'button_y',   # Y button (emergency)
    }

    HAT_MAPPING = {
        'dpad_up': (0, 1),
        'dpad_down': (0, -1),
        'dpad_left': (-1, 0),
        'dpad_right': (1, 0),
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.device_index = self.config.get('device_index', 0)
        self.joystick = None
        self.initialized = False
        self.last_state = RCState()

    async def initialize(self) -> bool:
        """Initialize pygame and detect RC device"""
        if not PYGAME_AVAILABLE:
            self.logger.error("pygame not available. Install with: pip install pygame")
            return False

        try:
            pygame.init()
            pygame.joystick.init()

            joystick_count = pygame.joystick.get_count()
            self.logger.info(f"Found {joystick_count} joystick(s)")

            if joystick_count == 0:
                self.logger.warning("No joysticks found. Make sure DJI RC-N1 is connected and recognized.")
                return False

            if self.device_index >= joystick_count:
                self.logger.error(f"Device index {self.device_index} not available")
                return False

            self.joystick = pygame.joystick.Joystick(self.device_index)
            self.joystick.init()

            name = self.joystick.get_name()
            self.logger.info(f"Initialized joystick: {name}")

            # Log joystick capabilities
            axes = self.joystick.get_numaxes()
            buttons = self.joystick.get_numbuttons()
            hats = self.joystick.get_numhats()
            self.logger.info(f"Axes: {axes}, Buttons: {buttons}, Hats: {hats}")

            self.initialized = True
            return True

        except Exception as e:
            self.logger.error(f"Failed to initialize RC adapter: {e}")
            return False

    async def get_state(self) -> RCState:
        """Get current RC state from pygame"""
        if not self.initialized or not self.joystick:
            return RCState(connected=False)

        try:
            # Process pygame events
            pygame.event.pump()

            state = RCState(connected=True, last_update=time.time())

            # Read axes
            for axis_id, axis_name in self.AXIS_MAPPING.items():
                if axis_id < self.joystick.get_numaxes():
                    value = self.joystick.get_axis(axis_id)
                    # Invert throttle and pitch if needed
                    if axis_name in ['left_stick_y', 'right_stick_y']:
                        value = -value
                    setattr(state, axis_name, value)

            # Read buttons
            for button_id, button_name in self.BUTTON_MAPPING.items():
                if button_id < self.joystick.get_numbuttons():
                    value = self.joystick.get_button(button_id) == 1
                    setattr(state, button_name, value)

            # Read hat (d-pad)
            if self.joystick.get_numhats() > 0:
                hat_x, hat_y = self.joystick.get_hat(0)
                state.dpad_up = hat_y == 1
                state.dpad_down = hat_y == -1
                state.dpad_left = hat_x == -1
                state.dpad_right = hat_x == 1

            # Store last state for comparison
            self.last_state = state
            return state

        except Exception as e:
            self.logger.error(f"Error reading RC state: {e}")
            return RCState(connected=False)

    async def shutdown(self) -> None:
        """Shutdown pygame"""
        try:
            if self.joystick:
                self.joystick.quit()
            pygame.joystick.quit()
            pygame.quit()
            self.initialized = False
            self.logger.info("RC adapter shutdown")
        except Exception as e:
            self.logger.error(f"Error shutting down RC adapter: {e}")

    def is_connected(self) -> bool:
        """Check if RC is connected"""
        return self.initialized and self.joystick is not None

    def calibrate(self) -> Dict[str, Any]:
        """
        Interactive calibration for DJI RC-N1
        Returns mapping configuration
        """
        if not self.initialized:
            self.logger.error("RC not initialized")
            return {}

        print("RC Calibration Mode")
        print("Move sticks and press buttons, then press Enter when done")

        calibration_data = {
            'axes': {},
            'buttons': {},
            'hats': {}
        }

        try:
            while True:
                pygame.event.pump()

                # Check axes
                for i in range(self.joystick.get_numaxes()):
                    value = self.joystick.get_axis(i)
                    if abs(value) > 0.1:  # Deadzone
                        calibration_data['axes'][i] = value

                # Check buttons
                for i in range(self.joystick.get_numbuttons()):
                    if self.joystick.get_button(i):
                        calibration_data['buttons'][i] = True

                # Check hats
                for i in range(self.joystick.get_numhats()):
                    hat = self.joystick.get_hat(i)
                    if hat != (0, 0):
                        calibration_data['hats'][i] = hat

                # Exit on Enter key (this is simplistic)
                if input().strip() == "":
                    break

        except KeyboardInterrupt:
            pass

        self.logger.info(f"Calibration data: {calibration_data}")
        return calibration_data