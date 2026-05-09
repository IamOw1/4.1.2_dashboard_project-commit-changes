"""
================================================================================
OpenQ - Сбор данных о полете

Возможности:
- Запись всех параметров полета
- Сжатие и архивация логов
- Экспорт в различные форматы
- Анализ производительности
- Генерация отчетов
================================================================================
"""
import asyncio
import json
import gzip
import os
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class FlightDataPoint:
    """Точка данных полета"""
    timestamp: float
    latitude: float
    longitude: float
    altitude: float
    roll: float
    pitch: float
    yaw: float
    vx: float
    vy: float
    vz: float
    battery_percent: float
    battery_voltage: float
    battery_current: float
    motor_throttle: List[float]
    gps_sats: int
    gps_hdop: float
    temperature: float
    pressure: float
    wind_speed: float
    wind_direction: float


class OpenQ:
    """
    OpenQ - Система сбора данных о полете
    
    Собирает:
    - Телеметрию
    - Параметры полета
    - Состояние систем
    - События
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Параметры
        self.log_interval = self.config.get('log_interval', 0.1)  # секунды
        self.max_log_size_mb = self.config.get('max_log_size_mb', 100)
        self.compress_logs = self.config.get('compress_logs', True)
        
        # Текущий полет
        self.is_recording = False
        self.current_flight_id = None
        self.flight_start_time = None
        self.data_buffer: List[FlightDataPoint] = []
        
        # Статистика
        self.total_flights = 0
        self.total_flight_time = 0.0
        self.total_distance = 0.0
        
        # Файлы
        self.current_log_file = None
        self.output_dir = Path("data/flight_data")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Задачи
        self.is_running = False
        self.recording_task = None
        
        logger.info("📊 OpenQ инициализирован")

    async def initialize(self):
        """Инициализация OpenQ"""
        logger.info("🚀 Инициализация OpenQ...")
        
        # Загрузка статистики
        await self._load_statistics()
        
        self.is_running = True
        
        logger.info("✅ OpenQ готов")
        return True

    async def _load_statistics(self):
        """Загрузка статистики"""
        stats_file = self.output_dir / "statistics.json"
        if stats_file.exists():
            try:
                with open(stats_file, 'r') as f:
                    stats = json.load(f)
                self.total_flights = stats.get("total_flights", 0)
                self.total_flight_time = stats.get("total_flight_time", 0.0)
                self.total_distance = stats.get("total_distance", 0.0)
                logger.info(f"📈 Статистика загружена: {self.total_flights} полетов")
            except Exception as e:
                logger.warning(f"⚠️ Не удалось загрузить статистику: {e}")

    async def _save_statistics(self):
        """Сохранение статистики"""
        stats_file = self.output_dir / "statistics.json"
        try:
            stats = {
                "total_flights": self.total_flights,
                "total_flight_time": self.total_flight_time,
                "total_distance": self.total_distance,
                "last_updated": datetime.now().isoformat()
            }
            with open(stats_file, 'w') as f:
                json.dump(stats, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Ошибка сохранения статистики: {e}")

    async def start_recording(self, flight_id: str = None) -> str:
        """Начало записи полета"""
        if self.is_recording:
            logger.warning("⚠️ Запись уже идет")
            return self.current_flight_id
        
        self.current_flight_id = flight_id or f"flight_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.flight_start_time = time.time()
        self.is_recording = True
        self.data_buffer = []
        
        # Создание файла лога
        log_filename = f"{self.current_flight_id}.json"
        self.current_log_file = self.output_dir / log_filename
        
        # Запись заголовка
        header = {
            "flight_id": self.current_flight_id,
            "start_time": datetime.now().isoformat(),
            "version": "1.0"
        }
        
        with open(self.current_log_file, 'w') as f:
            json.dump({"header": header, "data": []}, f)
        
        # Запуск записи
        self.recording_task = asyncio.create_task(self._recording_loop())
        
        logger.info(f"🎬 Начата запись полета: {self.current_flight_id}")
        return self.current_flight_id

    async def stop_recording(self) -> Dict[str, Any]:
        """Остановка записи полета"""
        if not self.is_recording:
            return {"error": "Запись не идет"}
        
        self.is_recording = False
        
        if self.recording_task:
            self.recording_task.cancel()
            try:
                await self.recording_task
            except asyncio.CancelledError:
                pass
        
        # Сохранение оставшихся данных
        await self._flush_buffer()
        
        # Расчет статистики полета
        flight_time = time.time() - self.flight_start_time if self.flight_start_time else 0
        
        # Обновление общей статистики
        self.total_flights += 1
        self.total_flight_time += flight_time
        await self._save_statistics()
        
        # Сжатие если нужно
        if self.compress_logs:
            await self._compress_log()
        
        result = {
            "flight_id": self.current_flight_id,
            "duration_seconds": flight_time,
            "data_points": len(self.data_buffer),
            "log_file": str(self.current_log_file)
        }
        
        logger.info(f"⏹️ Запись остановлена: {flight_time:.1f}с, {len(self.data_buffer)} точек")
        
        self.current_flight_id = None
        self.flight_start_time = None
        self.data_buffer = []
        
        return result

    async def _recording_loop(self):
        """Цикл записи"""
        while self.is_recording:
            try:
                await asyncio.sleep(self.log_interval)
            except asyncio.CancelledError:
                break

    async def collect_data(self, telemetry: Dict[str, Any]) -> FlightDataPoint:
        """Сбор данных из телеметрии"""
        position = telemetry.get("position", {})
        velocity = telemetry.get("velocity", {})
        attitude = telemetry.get("attitude", {})
        
        data_point = FlightDataPoint(
            timestamp=time.time(),
            latitude=position.get("lat", 0.0),
            longitude=position.get("lon", 0.0),
            altitude=position.get("z", 0.0),
            roll=attitude.get("roll", 0.0),
            pitch=attitude.get("pitch", 0.0),
            yaw=attitude.get("yaw", 0.0),
            vx=velocity.get("vx", 0.0),
            vy=velocity.get("vy", 0.0),
            vz=velocity.get("vz", 0.0),
            battery_percent=telemetry.get("battery", 100.0),
            battery_voltage=telemetry.get("battery_voltage", 12.6),
            battery_current=telemetry.get("battery_current", 0.0),
            motor_throttle=telemetry.get("motors", [0, 0, 0, 0]),
            gps_sats=telemetry.get("gps_sats", 0),
            gps_hdop=telemetry.get("gps_hdop", 99.9),
            temperature=telemetry.get("temperature", 25.0),
            pressure=telemetry.get("pressure", 1013.25),
            wind_speed=telemetry.get("wind_speed", 0.0),
            wind_direction=telemetry.get("wind_direction", 0.0)
        )
        
        if self.is_recording:
            self.data_buffer.append(data_point)
            
            # Периодический сброс в файл
            if len(self.data_buffer) >= 100:
                await self._flush_buffer()
        
        return data_point

    async def _flush_buffer(self):
        """Сброс буфера в файл"""
        if not self.data_buffer or not self.current_log_file:
            return
        
        try:
            # Чтение текущего содержимого
            with open(self.current_log_file, 'r') as f:
                log_data = json.load(f)
            
            # Добавление новых данных
            for point in self.data_buffer:
                log_data["data"].append(asdict(point))
            
            # Запись обратно
            with open(self.current_log_file, 'w') as f:
                json.dump(log_data, f, indent=2)
            
            self.data_buffer = []
            
        except Exception as e:
            logger.error(f"❌ Ошибка сброса буфера: {e}")

    async def _compress_log(self):
        """Сжатие файла лога"""
        if not self.current_log_file or not self.current_log_file.exists():
            return
        
        try:
            compressed_file = self.current_log_file.with_suffix('.json.gz')
            
            with open(self.current_log_file, 'rb') as f_in:
                with gzip.open(compressed_file, 'wb') as f_out:
                    f_out.write(f_in.read())
            
            # Удаление оригинала
            self.current_log_file.unlink()
            
            logger.info(f"📦 Лог сжат: {compressed_file.name}")
            
        except Exception as e:
            logger.error(f"❌ Ошибка сжатия: {e}")

    # ========== Анализ данных ==========

    def analyze_flight(self, flight_id: str) -> Dict[str, Any]:
        """Анализ полета"""
        log_file = self.output_dir / f"{flight_id}.json"
        if not log_file.exists():
            log_file = self.output_dir / f"{flight_id}.json.gz"
        
        if not log_file.exists():
            return {"error": "Flight log not found"}
        
        try:
            # Чтение лога
            if log_file.suffix == '.gz':
                with gzip.open(log_file, 'rt') as f:
                    log_data = json.load(f)
            else:
                with open(log_file, 'r') as f:
                    log_data = json.load(f)
            
            data = log_data.get("data", [])
            
            if not data:
                return {"error": "No data in flight log"}
            
            # Анализ
            analysis = {
                "flight_id": flight_id,
                "data_points": len(data),
                "duration_seconds": data[-1]["timestamp"] - data[0]["timestamp"] if len(data) > 1 else 0,
                "battery": {
                    "start": data[0]["battery_percent"],
                    "end": data[-1]["battery_percent"],
                    "min": min(d["battery_percent"] for d in data),
                    "drain_rate": (data[0]["battery_percent"] - data[-1]["battery_percent"]) / max(1, (data[-1]["timestamp"] - data[0]["timestamp"]) / 60)
                },
                "altitude": {
                    "max": max(d["altitude"] for d in data),
                    "min": min(d["altitude"] for d in data),
                    "avg": sum(d["altitude"] for d in data) / len(data)
                },
                "speed": {
                    "max": max((d["vx"]**2 + d["vy"]**2 + d["vz"]**2)**0.5 for d in data),
                    "avg": sum((d["vx"]**2 + d["vy"]**2 + d["vz"]**2)**0.5 for d in data) / len(data)
                }
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Ошибка анализа полета: {e}")
            return {"error": str(e)}

    def get_flight_list(self) -> List[Dict[str, Any]]:
        """Получение списка полетов"""
        flights = []
        
        for log_file in self.output_dir.glob("flight_*.json*"):
            try:
                stat = log_file.stat()
                flights.append({
                    "flight_id": log_file.stem.replace('.json', ''),
                    "filename": log_file.name,
                    "size_bytes": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "compressed": log_file.suffix == '.gz'
                })
            except Exception:
                pass
        
        return sorted(flights, key=lambda x: x["created"], reverse=True)

    def export_flight(self, flight_id: str, format: str = "csv") -> Optional[str]:
        """Экспорт полета в другой формат"""
        log_file = self.output_dir / f"{flight_id}.json"
        if not log_file.exists():
            log_file = self.output_dir / f"{flight_id}.json.gz"
        
        if not log_file.exists():
            return None
        
        try:
            if log_file.suffix == '.gz':
                with gzip.open(log_file, 'rt') as f:
                    log_data = json.load(f)
            else:
                with open(log_file, 'r') as f:
                    log_data = json.load(f)
            
            data = log_data.get("data", [])
            
            if format == "csv":
                import csv
                output_file = self.output_dir / f"{flight_id}.csv"
                
                with open(output_file, 'w', newline='') as f:
                    if data:
                        writer = csv.DictWriter(f, fieldnames=data[0].keys())
                        writer.writeheader()
                        writer.writerows(data)
                
                return str(output_file)
            
            elif format == "kml":
                # Google Earth KML
                output_file = self.output_dir / f"{flight_id}.kml"
                
                kml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
    <name>{}</name>
    <Placemark>
        <name>Flight Path</name>
        <LineString>
            <coordinates>
'''.format(flight_id)
                
                for point in data:
                    kml_content += f"{point['longitude']},{point['latitude']},{point['altitude']} "
                
                kml_content += '''
            </coordinates>
        </LineString>
    </Placemark>
</Document>
</kml>'''
                
                with open(output_file, 'w') as f:
                    f.write(kml_content)
                
                return str(output_file)
        
        except Exception as e:
            logger.error(f"❌ Ошибка экспорта: {e}")
        
        return None

    # ========== Статус ==========

    def get_status(self) -> Dict[str, Any]:
        """Получение статуса"""
        return {
            "is_recording": self.is_recording,
            "current_flight_id": self.current_flight_id,
            "buffer_size": len(self.data_buffer),
            "total_flights": self.total_flights,
            "total_flight_time_hours": self.total_flight_time / 3600,
            "flights_list": self.get_flight_list()[:5]
        }

    async def shutdown(self):
        """Завершение работы"""
        logger.info("🛑 Завершение работы OpenQ...")
        
        if self.is_recording:
            await self.stop_recording()
        
        await self._save_statistics()
        
        logger.info("👋 OpenQ завершил работу")
