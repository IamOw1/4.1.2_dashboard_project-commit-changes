"""
================================================================================
Тесты OpenQ
================================================================================
"""
import pytest
import asyncio
import json
import tempfile
import gzip
from pathlib import Path
from unittest.mock import Mock, patch

from src.sensors.openq import OpenQ, FlightDataPoint


@pytest.fixture
def openq():
    """Фикстура для OpenQ"""
    config = {
        'log_interval': 0.1,
        'max_log_size_mb': 10,
        'compress_logs': False
    }
    return OpenQ(config)


@pytest.fixture
def temp_output_dir():
    """Временная директория для вывода"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


class TestOpenQ:
    """Тесты OpenQ"""
    
    def test_initialization(self, openq):
        """Тест инициализации"""
        assert openq.log_interval == 0.1
        assert openq.max_log_size_mb == 10
        assert openq.compress_logs is False
        assert openq.is_recording is False
        assert len(openq.data_buffer) == 0
    
    @pytest.mark.asyncio
    async def test_initialize(self, openq):
        """Тест инициализации OpenQ"""
        result = await openq.initialize()
        
        assert result is True
        assert openq.is_running is True
    
    @pytest.mark.asyncio
    async def test_start_recording(self, openq, temp_output_dir):
        """Тест начала записи"""
        openq.output_dir = temp_output_dir
        
        flight_id = await openq.start_recording("test_flight")
        
        assert openq.is_recording is True
        assert openq.current_flight_id == "test_flight"
        assert flight_id == "test_flight"
        assert openq.current_log_file is not None
    
    @pytest.mark.asyncio
    async def test_stop_recording(self, openq, temp_output_dir):
        """Тест остановки записи"""
        openq.output_dir = temp_output_dir
        
        await openq.start_recording("test_flight")
        await asyncio.sleep(0.1)
        
        result = await openq.stop_recording()
        
        assert openq.is_recording is False
        assert result["flight_id"] == "test_flight"
        assert "duration_seconds" in result
    
    @pytest.mark.asyncio
    async def test_collect_data(self, openq):
        """Тест сбора данных"""
        telemetry = {
            "position": {"lat": 55.7558, "lon": 37.6173, "z": 10},
            "velocity": {"vx": 1.0, "vy": 0.5, "vz": 0.1},
            "attitude": {"roll": 5.0, "pitch": -2.0, "yaw": 45.0},
            "battery": 85.5
        }
        
        data_point = await openq.collect_data(telemetry)
        
        assert isinstance(data_point, FlightDataPoint)
        assert data_point.latitude == 55.7558
        assert data_point.longitude == 37.6173
        assert data_point.battery_percent == 85.5
    
    def test_flight_data_point_creation(self):
        """Тест создания точки данных"""
        point = FlightDataPoint(
            timestamp=1234567890.0,
            latitude=55.7558,
            longitude=37.6173,
            altitude=100.0,
            roll=0.0,
            pitch=0.0,
            yaw=0.0,
            vx=0.0,
            vy=0.0,
            vz=0.0,
            battery_percent=100.0,
            battery_voltage=12.6,
            battery_current=0.0,
            motor_throttle=[1000, 1000, 1000, 1000],
            gps_sats=10,
            gps_hdop=1.0,
            temperature=25.0,
            pressure=1013.25,
            wind_speed=0.0,
            wind_direction=0.0
        )
        
        assert point.latitude == 55.7558
        assert point.longitude == 37.6173
        assert point.altitude == 100.0
    
    def test_get_status(self, openq):
        """Тест получения статуса"""
        status = openq.get_status()
        
        assert "is_recording" in status
        assert "total_flights" in status
        assert "flights_list" in status
    
    @pytest.mark.asyncio
    async def test_analyze_flight(self, openq, temp_output_dir):
        """Тест анализа полета"""
        openq.output_dir = temp_output_dir
        
        # Создаем тестовый лог
        log_data = {
            "header": {"flight_id": "test_flight"},
            "data": [
                {
                    "timestamp": 0.0,
                    "latitude": 55.7558,
                    "longitude": 37.6173,
                    "altitude": 10.0,
                    "roll": 0.0,
                    "pitch": 0.0,
                    "yaw": 0.0,
                    "vx": 0.0,
                    "vy": 0.0,
                    "vz": 0.0,
                    "battery_percent": 100.0,
                    "battery_voltage": 12.6,
                    "battery_current": 0.0,
                    "motor_throttle": [1000, 1000, 1000, 1000],
                    "gps_sats": 10,
                    "gps_hdop": 1.0,
                    "temperature": 25.0,
                    "pressure": 1013.25,
                    "wind_speed": 0.0,
                    "wind_direction": 0.0
                },
                {
                    "timestamp": 1.0,
                    "latitude": 55.7559,
                    "longitude": 37.6174,
                    "altitude": 15.0,
                    "roll": 5.0,
                    "pitch": -2.0,
                    "yaw": 45.0,
                    "vx": 1.0,
                    "vy": 0.5,
                    "vz": 0.1,
                    "battery_percent": 99.0,
                    "battery_voltage": 12.5,
                    "battery_current": 5.0,
                    "motor_throttle": [1200, 1200, 1200, 1200],
                    "gps_sats": 10,
                    "gps_hdop": 1.0,
                    "temperature": 26.0,
                    "pressure": 1013.0,
                    "wind_speed": 2.0,
                    "wind_direction": 90.0
                }
            ]
        }
        
        log_file = temp_output_dir / "test_flight.json"
        with open(log_file, 'w') as f:
            json.dump(log_data, f)
        
        analysis = openq.analyze_flight("test_flight")
        
        assert "flight_id" in analysis
        assert analysis["data_points"] == 2
        assert "duration_seconds" in analysis
        assert "battery" in analysis
        assert "altitude" in analysis
    
    def test_get_flight_list(self, openq, temp_output_dir):
        """Тест получения списка полетов"""
        openq.output_dir = temp_output_dir
        
        # Создаем тестовые файлы
        (temp_output_dir / "flight_20240101_120000.json").touch()
        (temp_output_dir / "flight_20240101_130000.json.gz").touch()
        
        flights = openq.get_flight_list()
        
        assert len(flights) == 2
