"""
================================================================================
Тесты PitControllers
================================================================================
"""
import pytest
import asyncio
from unittest.mock import Mock, patch

from src.controllers.pit_controllers import PitControllers, MotorState, ESCProtocol


@pytest.fixture
def pit_controllers():
    """Фикстура для PitControllers"""
    config = {
        'motor_count': 4,
        'min_throttle': 1000,
        'max_throttle': 2000,
        'esc_protocol': 'dshot600'
    }
    return PitControllers(config)


class TestPitControllers:
    """Тесты PitControllers"""
    
    def test_initialization(self, pit_controllers):
        """Тест инициализации"""
        assert pit_controllers.motor_count == 4
        assert pit_controllers.min_throttle == 1000
        assert pit_controllers.max_throttle == 2000
        assert pit_controllers.esc_protocol == ESCProtocol.DSHOT600
        assert len(pit_controllers.motors) == 4
    
    @pytest.mark.asyncio
    async def test_arm(self, pit_controllers):
        """Тест вооружения"""
        with patch.object(pit_controllers, '_safety_check', return_value=True):
            result = await pit_controllers.arm()
            
            assert result is True
            assert pit_controllers.is_armed is True
            
            for motor in pit_controllers.motors.values():
                assert motor.state == MotorState.ARMED
    
    @pytest.mark.asyncio
    async def test_disarm(self, pit_controllers):
        """Тест разоружения"""
        pit_controllers.is_armed = True
        
        result = await pit_controllers.disarm()
        
        assert result is True
        assert pit_controllers.is_armed is False
    
    @pytest.mark.asyncio
    async def test_takeoff(self, pit_controllers):
        """Тест взлета"""
        with patch.object(pit_controllers, '_safety_check', return_value=True):
            await pit_controllers.arm()
            result = await pit_controllers.takeoff(target_altitude=10.0)
            
            assert result is True
            assert pit_controllers.is_flying is True
            assert pit_controllers.target_altitude == 10.0
    
    @pytest.mark.asyncio
    async def test_land(self, pit_controllers):
        """Тест посадки"""
        pit_controllers.is_flying = True
        pit_controllers.current_altitude = 10.0
        
        result = await pit_controllers.land()
        
        assert result is True
        assert pit_controllers.is_flying is False
        assert pit_controllers.current_altitude == 0
    
    @pytest.mark.asyncio
    async def test_hover(self, pit_controllers):
        """Тест зависания"""
        result = await pit_controllers.hover()
        
        assert result is True
        
        for motor in pit_controllers.motors.values():
            assert motor.target_throttle == 1150  # min + 150
    
    @pytest.mark.asyncio
    async def test_set_throttle(self, pit_controllers):
        """Тест установки throttle"""
        result = await pit_controllers.set_throttle(0, 1500)
        
        assert result is True
        assert pit_controllers.motors[0].target_throttle == 1500
    
    @pytest.mark.asyncio
    async def test_set_throttle_invalid_motor(self, pit_controllers):
        """Тест установки throttle для неверного мотора"""
        result = await pit_controllers.set_throttle(10, 1500)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_emergency_stop(self, pit_controllers):
        """Тест аварийной остановки"""
        pit_controllers.is_armed = True
        pit_controllers.is_flying = True
        
        await pit_controllers.emergency_stop()
        
        assert pit_controllers.is_armed is False
        assert pit_controllers.is_flying is False
        
        for motor in pit_controllers.motors.values():
            assert motor.target_throttle == pit_controllers.min_throttle
    
    def test_get_motor_status(self, pit_controllers):
        """Тест получения статуса мотора"""
        status = pit_controllers.get_motor_status(0)
        
        assert status["motor_id"] == 0
        assert "name" in status
        assert "state" in status
    
    def test_get_all_status(self, pit_controllers):
        """Тест получения статуса всех моторов"""
        status = pit_controllers.get_all_status()
        
        assert "is_armed" in status
        assert "is_flying" in status
        assert "motors" in status
        assert len(status["motors"]) == 4


class TestMotor:
    """Тесты класса Motor"""
    
    def test_motor_initialization(self):
        """Тест инициализации мотора"""
        from src.controllers.pit_controllers import Motor
        
        motor = Motor(
            motor_id=0,
            name="Test Motor",
            min_throttle=1000,
            max_throttle=2000
        )
        
        assert motor.motor_id == 0
        assert motor.name == "Test Motor"
        assert motor.current_throttle == 1000
        assert motor.state == MotorState.IDLE
