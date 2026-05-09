"""
Unit tests for control arbitrator
"""

import pytest
import time
from unittest.mock import Mock
from hardware.rc_input import RCState
from controllers.control_arbitrator import ControlArbitrator, AICommand, ControlCommand, CommandSource


class TestControlArbitrator:
    """Test control arbitration logic"""

    @pytest.fixture
    def arbitrator(self):
        return ControlArbitrator({
            'rc_priority_threshold': 0.1,
            'llm_min_confidence': 0.7,
            'operator_timeout': 2.0
        })

    def test_initialization(self, arbitrator):
        """Test arbitrator initialization"""
        assert arbitrator.rc_priority_threshold == 0.1
        assert arbitrator.llm_min_confidence == 0.7
        assert arbitrator.operator_timeout == 2.0

    def test_arbitrate_rc_active(self, arbitrator):
        """Test RC priority when operator is active"""
        rc_state = RCState(
            connected=True,
            left_stick_x=0.5,  # Active input
            last_update=time.time()
        )

        ai_command = AICommand(
            action="move_forward",
            confidence=0.9,
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.RC
        assert result.action == "manual_control"
        assert result.priority == 100

    def test_arbitrate_rc_recently_active(self, arbitrator):
        """Test RC priority when operator was recently active"""
        # First, make operator active
        active_time = time.time()
        rc_state_active = RCState(
            connected=True,
            left_stick_x=0.5,
            last_update=active_time
        )
        arbitrator.arbitrate(rc_state_active)

        # Then test with inactive RC but recent activity
        current_time = active_time + 1.0  # Within timeout
        rc_state_inactive = RCState(
            connected=True,
            last_update=current_time
        )

        ai_command = AICommand(
            action="move_forward",
            confidence=0.9,
            timestamp=current_time
        )

        result = arbitrator.arbitrate(rc_state_inactive, ai_command)

        assert result.source == CommandSource.RC
        assert result.action == "manual_control"

    def test_arbitrate_ai_command(self, arbitrator):
        """Test AI command when RC is inactive"""
        rc_state = RCState(
            connected=True,
            last_update=time.time()
        )

        ai_command = AICommand(
            action="move_forward",
            confidence=0.8,
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.LLM
        assert result.action == "move_forward"
        assert result.priority == 10

    def test_arbitrate_ai_low_confidence(self, arbitrator):
        """Test AI command rejection with low confidence"""
        rc_state = RCState(
            connected=True,
            last_update=time.time()
        )

        ai_command = AICommand(
            action="move_forward",
            confidence=0.5,  # Below threshold
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.SYSTEM
        assert result.action == "hover"

    def test_arbitrate_no_commands(self, arbitrator):
        """Test default behavior with no commands"""
        rc_state = RCState(
            connected=True,
            last_update=time.time()
        )

        result = arbitrator.arbitrate(rc_state)

        assert result.source == CommandSource.SYSTEM
        assert result.action == "hover"
        assert result.priority == 0

    def test_rc_state_to_command_manual(self, arbitrator):
        """Test RC state to manual control command"""
        rc_state = RCState(
            connected=True,
            left_stick_x=0.5,   # Roll
            left_stick_y=0.3,   # Throttle
            right_stick_x=0.2,  # Yaw
            right_stick_y=-0.1, # Pitch
            last_update=time.time()
        )

        command = arbitrator._rc_state_to_command(rc_state)

        assert command.source == CommandSource.RC
        assert command.action == "manual_control"
        assert command.priority == 100
        assert command.parameters['velocity_east'] == 0.5 * 5.0  # Roll to east velocity
        assert command.parameters['velocity_down'] == -0.3 * 2.0  # Throttle to down velocity
        assert command.parameters['yaw_rate'] == 0.2 * 90.0  # Yaw stick to yaw rate

    def test_rc_state_to_command_emergency(self, arbitrator):
        """Test RC emergency button"""
        rc_state = RCState(
            connected=True,
            button_y=True,  # Emergency
            last_update=time.time()
        )

        command = arbitrator._rc_state_to_command(rc_state)

        assert command.action == "emergency_stop"
        assert command.priority == 1000

    def test_rc_state_to_command_land(self, arbitrator):
        """Test RC land button"""
        rc_state = RCState(
            connected=True,
            button_x=True,  # Land
            last_update=time.time()
        )

        command = arbitrator._rc_state_to_command(rc_state)

        assert command.action == "land"
        assert command.priority == 100

    def test_ai_command_to_control_command(self, arbitrator):
        """Test AI command conversion"""
        ai_command = AICommand(
            action="move",
            parameters={"velocity_x": 10.0, "velocity_y": 5.0},  # Above limits
            confidence=0.8,
            reasoning="Test reasoning",
            timestamp=time.time()
        )

        command = arbitrator._ai_command_to_control_command(ai_command)

        assert command.source == CommandSource.LLM
        assert command.action == "move"
        assert command.priority == 10
        assert command.parameters["velocity_x"] == 5.0  # Clamped to limit
        assert command.parameters["velocity_y"] == 5.0  # Clamped to limit
        assert command.reasoning == "Test reasoning"

    def test_get_arbitration_status(self, arbitrator):
        """Test getting arbitration status"""
        status = arbitrator.get_arbitration_status()

        assert 'last_operator_active_time' in status
        assert 'operator_timeout' in status
        assert 'rc_priority_threshold' in status
        assert 'llm_min_confidence' in status
        assert 'last_rc_connected' in status


class TestAICommand:
    """Test AI command dataclass"""

    def test_ai_command_creation(self):
        """Test creating AI command"""
        command = AICommand(
            action="move_forward",
            parameters={"speed": 5.0},
            confidence=0.8,
            reasoning="Test reasoning"
        )

        assert command.action == "move_forward"
        assert command.parameters == {"speed": 5.0}
        assert command.confidence == 0.8
        assert command.reasoning == "Test reasoning"

    def test_ai_command_defaults(self):
        """Test AI command defaults"""
        command = AICommand(action="hover")

        assert command.parameters == {}
        assert command.confidence == 0.0
        assert command.reasoning == ""


class TestControlCommand:
    """Test control command dataclass"""

    def test_control_command_creation(self):
        """Test creating control command"""
        command = ControlCommand(
            source=CommandSource.RC,
            action="manual_control",
            parameters={"test": "value"},
            priority=100,
            timestamp=123.45,
            reasoning="Test reasoning"
        )

        assert command.source == CommandSource.RC
        assert command.action == "manual_control"
        assert command.parameters == {"test": "value"}
        assert command.priority == 100
        assert command.timestamp == 123.45
        assert command.reasoning == "Test reasoning"