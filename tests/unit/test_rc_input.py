"""
Unit tests for RC input abstraction
"""

import pytest
from hardware.rc_input import RCState, RCInputSource


class TestRCState:
    """Test RC state dataclass"""

    def test_default_state(self):
        """Test default RC state"""
        state = RCState()

        assert state.left_stick_x == 0.0
        assert state.left_stick_y == 0.0
        assert state.connected == False
        assert state.last_update == 0.0

    def test_operator_active_with_sticks(self):
        """Test operator active detection with stick movement"""
        state = RCState(
            left_stick_x=0.5,  # Above deadzone
            connected=True
        )

        assert state.is_operator_active() == True

    def test_operator_active_with_button(self):
        """Test operator active detection with button press"""
        state = RCState(
            button_y=True,  # Emergency button
            connected=True
        )

        assert state.is_operator_active() == True

    def test_operator_inactive(self):
        """Test operator inactive with no input"""
        state = RCState(connected=True)

        assert state.is_operator_active() == False

    def test_operator_inactive_deadzone(self):
        """Test operator inactive within deadzone"""
        state = RCState(
            left_stick_x=0.05,  # Within deadzone
            connected=True
        )

        assert state.is_operator_active() == False

    def test_to_dict(self):
        """Test conversion to dictionary"""
        state = RCState(
            left_stick_x=0.5,
            button_a=True,
            connected=True,
            last_update=123.45
        )

        data = state.to_dict()

        assert data['left_stick_x'] == 0.5
        assert data['button_a'] == True
        assert data['connected'] == True
        assert data['last_update'] == 123.45
        assert data['operator_active'] == True

    def test_to_dict_inactive(self):
        """Test dictionary conversion for inactive operator"""
        state = RCState(connected=True)

        data = state.to_dict()

        assert data['operator_active'] == False


class TestRCInputSource:
    """Test RC input source enum"""

    def test_enum_values(self):
        """Test enum values"""
        assert RCInputSource.REAL.value == "real"
        assert RCInputSource.MOCK.value == "mock"
        assert RCInputSource.SIMULATOR.value == "simulator"