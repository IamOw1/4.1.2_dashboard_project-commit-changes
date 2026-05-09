"""
Integration tests for RC and arbitration system
"""

import pytest
import asyncio
import time
from hardware.rc_input import RCState, RCInputSource, get_rc_input
from controllers.control_arbitrator import get_control_arbitrator, AICommand, CommandSource
from sim.mock_rc import MockRC


@pytest.mark.integration
class TestRCArbitrationIntegration:
    """Integration tests for RC input and command arbitration"""

    @pytest.fixture
    async def mock_rc(self):
        """Create and initialize mock RC"""
        rc = MockRC({'scenario': 'idle'})
        await rc.initialize()
        yield rc
        await rc.shutdown()

    @pytest.fixture
    def arbitrator(self):
        """Create control arbitrator"""
        return get_control_arbitrator({
            'rc_priority_threshold': 0.1,
            'llm_min_confidence': 0.7,
            'operator_timeout': 1.0  # Short timeout for testing
        })

    @pytest.mark.asyncio
    async def test_idle_scenario_arbitration(self, mock_rc, arbitrator):
        """Test arbitration with idle RC (should allow AI commands)"""
        # Get idle state
        rc_state = await mock_rc.get_state()
        assert rc_state.is_operator_active() == False

        # Create AI command
        ai_command = AICommand(
            action="move_forward",
            confidence=0.8,
            timestamp=time.time()
        )

        # Arbitrate
        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.LLM
        assert result.action == "move_forward"

    @pytest.mark.asyncio
    async def test_active_pilot_blocks_ai(self, mock_rc, arbitrator):
        """Test that active pilot blocks AI commands"""
        # Set active pilot scenario
        mock_rc.set_scenario('active_pilot')

        # Get active state
        rc_state = await mock_rc.get_state()
        assert rc_state.is_operator_active() == True

        # Create AI command
        ai_command = AICommand(
            action="move_forward",
            confidence=0.9,
            timestamp=time.time()
        )

        # Arbitrate
        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.RC
        assert result.action == "manual_control"
        assert result.priority == 100

    @pytest.mark.asyncio
    async def test_emergency_button_priority(self, mock_rc, arbitrator):
        """Test emergency button has highest priority"""
        # Set emergency scenario
        mock_rc.set_scenario('emergency')

        # Get emergency state
        rc_state = await mock_rc.get_state()
        assert rc_state.button_y == True  # Emergency button

        # Create AI command
        ai_command = AICommand(
            action="move_forward",
            confidence=0.9,
            timestamp=time.time()
        )

        # Arbitrate
        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.RC
        assert result.action == "emergency_stop"
        assert result.priority == 1000  # Emergency priority

    @pytest.mark.asyncio
    async def test_recent_activity_blocks_ai(self, mock_rc, arbitrator):
        """Test that recent RC activity blocks AI commands"""
        # First, make RC active
        mock_rc.set_scenario('active_pilot')
        active_state = await mock_rc.get_state()
        arbitrator.arbitrate(active_state)

        # Then switch to idle but within timeout
        mock_rc.set_scenario('idle')
        idle_state = await mock_rc.get_state()

        # Should still be blocked due to recent activity
        ai_command = AICommand(
            action="move_forward",
            confidence=0.8,
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(idle_state, ai_command)

        assert result.source == CommandSource.RC
        assert result.action == "manual_control"

    @pytest.mark.asyncio
    async def test_timeout_allows_ai(self, mock_rc, arbitrator):
        """Test that after timeout, AI commands are allowed"""
        # Make RC active
        mock_rc.set_scenario('active_pilot')
        active_state = await mock_rc.get_state()
        arbitrator.arbitrate(active_state)

        # Wait for timeout
        await asyncio.sleep(1.1)  # Longer than timeout

        # Now AI should be allowed
        mock_rc.set_scenario('idle')
        idle_state = await mock_rc.get_state()

        ai_command = AICommand(
            action="move_forward",
            confidence=0.8,
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(idle_state, ai_command)

        assert result.source == CommandSource.LLM
        assert result.action == "move_forward"

    @pytest.mark.asyncio
    async def test_low_confidence_ai_rejected(self, mock_rc, arbitrator):
        """Test that low confidence AI commands are rejected"""
        mock_rc.set_scenario('idle')
        rc_state = await mock_rc.get_state()

        # Low confidence AI command
        ai_command = AICommand(
            action="move_forward",
            confidence=0.5,  # Below threshold
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.SYSTEM
        assert result.action == "hover"

    @pytest.mark.asyncio
    async def test_takeoff_command_conversion(self, mock_rc, arbitrator):
        """Test takeoff button conversion"""
        # Simulate takeoff button press
        mock_rc.set_scenario('takeoff')
        rc_state = await mock_rc.get_state()
        assert rc_state.button_a == True

        result = arbitrator.arbitrate(rc_state)

        assert result.source == CommandSource.RC
        assert result.action == "takeoff"
        assert result.parameters.get('altitude') == 10.0

    @pytest.mark.asyncio
    async def test_velocity_limits_ai_commands(self, arbitrator):
        """Test that AI velocity commands are properly limited"""
        rc_state = RCState(connected=True, last_update=time.time())

        # AI command with excessive velocity
        ai_command = AICommand(
            action="move",
            parameters={
                "velocity_x": 10.0,  # Above 5.0 limit
                "velocity_y": -8.0,  # Above 5.0 limit
                "velocity_z": 3.0    # Above 2.0 limit
            },
            confidence=0.8,
            timestamp=time.time()
        )

        result = arbitrator.arbitrate(rc_state, ai_command)

        assert result.source == CommandSource.LLM
        assert result.parameters["velocity_x"] == 5.0   # Clamped
        assert result.parameters["velocity_y"] == -5.0  # Clamped
        assert result.parameters["velocity_z"] == 2.0   # Clamped

    @pytest.mark.asyncio
    async def test_arbitration_status_tracking(self, mock_rc, arbitrator):
        """Test arbitration status tracking"""
        # Initial status
        status = arbitrator.get_arbitration_status()
        assert status['last_operator_active_time'] == 0.0
        assert status['last_rc_connected'] == False

        # After RC activity
        mock_rc.set_scenario('active_pilot')
        rc_state = await mock_rc.get_state()
        arbitrator.arbitrate(rc_state)

        status = arbitrator.get_arbitration_status()
        assert status['last_operator_active_time'] > 0.0
        assert status['last_rc_connected'] == True

    @pytest.mark.asyncio
    async def test_scenario_transitions(self, mock_rc, arbitrator):
        """Test smooth transitions between different RC scenarios"""
        scenarios = ['idle', 'active_pilot', 'emergency', 'idle']

        for scenario in scenarios:
            mock_rc.set_scenario(scenario)
            rc_state = await mock_rc.get_state()

            ai_command = AICommand(
                action="test_action",
                confidence=0.8,
                timestamp=time.time()
            )

            result = arbitrator.arbitrate(rc_state, ai_command)

            # Verify arbitration logic for each scenario
            if scenario == 'idle':
                assert result.source == CommandSource.LLM
            elif scenario in ['active_pilot', 'emergency']:
                assert result.source == CommandSource.RC