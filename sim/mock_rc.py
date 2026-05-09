"""
COBA AI Drone Agent - Имитатор Mock RC
Имитирует ввод RC контроллера для тестирования и разработки
"""

import asyncio
import logging
import math
import random
import time
from typing import Dict, Any, Optional

from hardware.rc_input import IRCInput, RCState

logger = logging.getLogger(__name__)

class MockRC(IRCInput):
    """
    Имитатор RC контроллера который генерирует имитируемый ввод
    Полезен для тестирования логики арбитрации без физического RC
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.scenario = self.config.get('scenario', 'idle')
        self.update_interval = self.config.get('update_interval', 0.1)  # 10Hz
        self.start_time = time.time()
        self.connected = True

        # Scenario state
        self.scenario_time = 0.0
        self.phase = 0

        logger.info(f"Mock RC initialized with scenario: {self.scenario}")

    async def initialize(self) -> bool:
        """Initialize mock RC (always succeeds)"""
        self.start_time = time.time()
        logger.info("Mock RC initialized")
        return True

    async def get_state(self) -> RCState:
        """Generate simulated RC state based on scenario"""
        current_time = time.time()
        self.scenario_time = current_time - self.start_time

        state = RCState(connected=True, last_update=current_time)

        if self.scenario == 'idle':
            # No input, RC inactive
            pass

        elif self.scenario == 'active_pilot':
            # Simulate active pilot control
            state.left_stick_x = 0.5 * math.sin(self.scenario_time * 2)  # Roll
            state.left_stick_y = 0.3  # Throttle
            state.right_stick_x = 0.2 * math.cos(self.scenario_time * 1.5)  # Yaw
            state.right_stick_y = -0.1  # Pitch

        elif self.scenario == 'takeoff':
            # Simulate takeoff sequence
            if self.scenario_time < 2.0:
                state.button_a = True  # Takeoff button
            elif self.scenario_time < 5.0:
                state.left_stick_y = 0.5  # Throttle up
            # Then idle

        elif self.scenario == 'emergency':
            # Simulate emergency stop
            if 3.0 <= self.scenario_time <= 3.5:
                state.button_y = True  # Emergency button

        elif self.scenario == 'pattern':
            # Complex flight pattern
            phase = int(self.scenario_time / 3.0) % 4

            if phase == 0:  # Forward
                state.right_stick_y = -0.5
            elif phase == 1:  # Turn right
                state.left_stick_x = 0.5
            elif phase == 2:  # Backward
                state.right_stick_y = 0.5
            elif phase == 3:  # Turn left
                state.left_stick_x = -0.5

        elif self.scenario == 'random':
            # Random inputs for testing
            state.left_stick_x = random.uniform(-0.8, 0.8)
            state.left_stick_y = random.uniform(-0.8, 0.8)
            state.right_stick_x = random.uniform(-0.8, 0.8)
            state.right_stick_y = random.uniform(-0.8, 0.8)

            # Random button presses (low probability)
            if random.random() < 0.05:
                state.button_a = True
            if random.random() < 0.03:
                state.button_y = True

        elif self.scenario == 'calibration':
            # Calibration sequence - move each axis/button in sequence
            cycle_time = self.scenario_time % 10.0

            if cycle_time < 1.0:
                state.left_stick_x = 1.0  # Full right
            elif cycle_time < 2.0:
                state.left_stick_x = -1.0  # Full left
            elif cycle_time < 3.0:
                state.left_stick_y = 1.0  # Full up
            elif cycle_time < 4.0:
                state.left_stick_y = -1.0  # Full down
            elif cycle_time < 5.0:
                state.right_stick_x = 1.0  # Full right
            elif cycle_time < 6.0:
                state.right_stick_x = -1.0  # Full left
            elif cycle_time < 7.0:
                state.right_stick_y = 1.0  # Full up
            elif cycle_time < 8.0:
                state.right_stick_y = -1.0  # Full down
            elif cycle_time < 9.0:
                state.button_a = True
            elif cycle_time < 10.0:
                state.button_y = True

        # Add some noise to make it more realistic
        if self.scenario != 'idle':
            noise_level = 0.02
            state.left_stick_x += random.uniform(-noise_level, noise_level)
            state.left_stick_y += random.uniform(-noise_level, noise_level)
            state.right_stick_x += random.uniform(-noise_level, noise_level)
            state.right_stick_y += random.uniform(-noise_level, noise_level)

            # Clamp to valid range
            for attr in ['left_stick_x', 'left_stick_y', 'right_stick_x', 'right_stick_y']:
                value = getattr(state, attr)
                setattr(state, attr, max(-1.0, min(1.0, value)))

        return state

    async def shutdown(self) -> None:
        """Shutdown mock RC"""
        self.connected = False
        logger.info("Mock RC shutdown")

    def is_connected(self) -> bool:
        """Check if mock RC is connected"""
        return self.connected

    def set_scenario(self, scenario: str):
        """Change the simulation scenario"""
        self.scenario = scenario
        self.scenario_time = 0.0
        self.start_time = time.time()
        logger.info(f"Mock RC scenario changed to: {scenario}")

    def get_available_scenarios(self) -> list:
        """Get list of available scenarios"""
        return ['idle', 'active_pilot', 'takeoff', 'emergency', 'pattern', 'random', 'calibration']