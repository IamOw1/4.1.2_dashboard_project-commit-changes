"""
================================================================================
COBA AI Drone Agent v4.0 - Главный файл запуска
Исправленная версия с Docker поддержкой
================================================================================
"""
import sys
import os
import asyncio
import subprocess
import argparse
from pathlib import Path
from typing import List

# Добавление текущей директории в путь
sys.path.insert(0, str(Path(__file__).parent))

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


def check_system():
    """Проверка системы перед запуском"""
    logger.info("🔍 Проверка системы...")

    # Проверка директорий
    dirs = [
        "data/missions",
        "data/reports",
        "data/state",
        "data/memory",
        "data/tiles",
        "data/flight_data",
        "logs",
        "backup"
    ]

    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)
        logger.info(f"  ✓ Директория {d} готова")

    # Проверка конфигурации
    if not os.path.exists("config/config.yaml"):
        logger.warning("⚠️ Файл конфигурации не найден, создаю значения по умолчанию")
        create_default_config()

    # Проверка зависимостей
    check_dependencies()

    logger.info("✅ Проверка системы завершена")
    return True


def create_default_config():
    """Создание конфигурации по умолчанию"""
    Path("config").mkdir(exist_ok=True)

    config_content = """# COBA AI Drone Agent v4.0 Configuration

agent_id: "drone_agent_001"
log_level: "INFO"

simulation:
  enabled: true
  simulator: "airsim"
  fallback_to_builtin: true

safety:
  enabled: true
  battery_critical: 15
  battery_low: 25
  max_altitude: 120
  max_wind_speed: 15
  min_signal_strength: -70
  max_temperature: 60
  reboot_frequency: 3600

learning:
  enabled: true
  algorithm: "dqn"
  learning_rate: 0.001
  discount_factor: 0.99
  replay_buffer_size: 10000
  batch_size: 32

sub_agent:
  enabled: true
  model: "${DEEPSEEK_MODEL:deepseek-chat}"
  temperature: 0.7
  max_tokens: 2000

hardware:
  drone_type: "generic"
  connection_string: "${DRONE_CONNECTION_STRING:udp:127.0.0.1:14550}"
  baudrate: 921600

# PitControllers - управление моторами
pit_controllers:
  enabled: true
  motor_count: 4
  min_throttle: 1000
  max_throttle: 2000
  esc_protocol: "dshot600"

# Mesh Network
mesh_network:
  enabled: true
  node_id: "drone_001"
  broadcast_port: 9000
  data_port: 9001
  heartbeat_interval: 5
  encryption: true

# OpenQ - сбор данных полета
openq:
  enabled: true
  log_interval: 0.1
  max_log_size_mb: 100
  compress_logs: true

tools:
  - module: "slom"
    class: "SlomTool"
    enabled: true
  - module: "amorfus"
    class: "AmorfusTool"
    enabled: true
  - module: "mifly"
    class: "MiFlyTool"
    enabled: true
  - module: "geospatial_mapping"
    class: "GeoMapTool"
    enabled: true
  - module: "precision_landing"
    class: "PrecisionLandingTool"
    enabled: true
  - module: "object_detection"
    class: "ObjectDetectionTool"
    enabled: true
  - module: "mission_planner_tool"
    class: "MissionPlannerTool"
    enabled: true
  - module: "autonomous_flight"
    class: "AutonomousFlightTool"
    enabled: true
  - module: "logistics"
    class: "LogisticsTool"
    enabled: true
  - module: "slam_navigation"
    class: "SlamNavigationTool"
    enabled: true
  - module: "emeu_navigation"
    class: "EmeuNavigationTool"
    enabled: true
  - module: "reptop_navigation"
    class: "ReptopNavigationTool"
    enabled: true

api:
  host: "0.0.0.0"
  port: 8000
  api_key: "${COBA_API_KEY:}"

dashboard:
  port: 8501
  password: "${DASHBOARD_PASSWORD:admin}"

memory:
  short_term_capacity: 1000
  long_term_storage: "data/memory/knowledge_base.db"
"""

    with open("config/config.yaml", "w", encoding="utf-8") as f:
        f.write(config_content)
    logger.info("✅ Конфигурация по умолчанию создана")


def check_dependencies():
    """Проверка установленных зависимостей"""
    required = {
        "torch": "PyTorch",
        "cv2": "OpenCV",
        "numpy": "NumPy",
        "fastapi": "FastAPI",
        "yaml": "PyYAML"
    }

    missing: List[str] = []
    for module, name in required.items():
        try:
            __import__(module)
            logger.info(f"  ✓ {name} установлен")
        except ImportError as e:
            if module == "cv2" and "libGL.so.1" in str(e):
                logger.warning(f"  ⚠️ {name} установлен, но недоступен в headless окружении")
            else:
                missing.append(name)
                logger.error(f"  ✗ {name} НЕ установлен")

    if missing:
        logger.warning(f"⚠️ Отсутствуют зависимости: {', '.join(missing)}")
        logger.info("💡 Установите: pip install -r requirements.txt")


def run_api():
    """Запуск API сервера + CoreAgent (для реального управления).

    Важно: в текущей версии `rest_api.py` использует глобальный `agent_instance`.
    Поэтому без запуска CoreAgent внутри этого же процесса API будет работать
    в демо-режиме. Здесь агент поднимается и выполняет цикл принятия решений
    параллельно с uvicorn.
    """
    logger.info("🚀 Запуск API сервера (и CoreAgent)...")

    import uvicorn

    from api.rest_api import app, create_app
    from agent.core import DroneIntelligentAgent

    async def run_agent_loop(agent: DroneIntelligentAgent):
        """Непрерывный цикл агента."""
        try:
            while True:  # Simplified loop
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass
        except KeyboardInterrupt:
            logger.info("⛔ Получен сигнал прерывания внутри агент-цикла")
        finally:
            if agent:
                await agent.shutdown()

    async def serve():
        agent: DroneIntelligentAgent | None = None
        agent_task = None
        try:
            agent = DroneIntelligentAgent()
            await agent.initialize()
            app = create_app(agent)
            agent_task = asyncio.create_task(run_agent_loop(agent))
        except Exception as e:
            logger.warning(f"⚠️ Agent не запущен в API-процессе: {e}. API останется в demo-режиме.")
            app = create_app()

        config = uvicorn.Config(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False,
        )
        server = uvicorn.Server(config)
        await server.serve()

        # Корректная остановка агента (если он был успешно запущен).
        if agent_task is not None:
            agent_task.cancel()
            try:
                await agent_task
            except asyncio.CancelledError:
                pass

    asyncio.run(serve())


def run_dashboard():
    """Запуск дашборда"""
    logger.info("📊 Запуск нового React дашборда...")

    # Запуск Vite dev server
    subprocess.run([
        "npm", "run", "dev"
    ], cwd=str(Path(__file__).parent))


def run_gui():
    """Запуск GUI приложения"""
    logger.info("🖥️ Запуск GUI приложения...")

    from src.gui.main_window import main as gui_main
    gui_main()


def run_agent():
    """Запуск только агента"""
    logger.info("🤖 Запуск агента...")

    from src.agents.core_agent import CoreAgent

    agent = CoreAgent()

    async def main():
        await agent.initialize()

        try:
            while agent.state.value != "shutdown":
                perception = await agent.perceive()
                decision = await agent.decide(perception)
                await agent.act(decision)
                await asyncio.sleep(0.1)
        except KeyboardInterrupt:
            logger.info("⛔ Получен сигнал прерывания")
        finally:
            await agent.shutdown()

    asyncio.run(main())


def run_all():
    """Запуск всех компонентов"""
    import multiprocessing
    from typing import List

    logger.info("🚀 Запуск всех компонентов...")

    processes: List[multiprocessing.Process] = []

    # Запуск API
    api_process = multiprocessing.Process(target=run_api, name="API")
    api_process.start()
    processes.append(api_process)

    # Запуск дашборда
    dashboard_process = multiprocessing.Process(target=run_dashboard, name="Dashboard")
    dashboard_process.start()
    processes.append(dashboard_process)

    try:
        # Агент запускается вместе с API в процессе `run_api()`.
        # Главный процесс ждёт завершения дочерних процессов.
        api_process.join()
    except KeyboardInterrupt:
        logger.info("⛔ Завершение работы...")
    finally:
        for p in processes:
            p.terminate()
            p.join(timeout=5)


def print_banner():
    """Вывод баннера (UTF-8; на Windows cp1251 — безопасный fallback)."""
    banner = """
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║           🤖 COBA AI Drone Agent v4.0 🤖                        ║
    ║                                                                  ║
    ║     Core Agent + Sub-Agent | Mesh Network | PitControllers      ║
    ║         OpenQ | Visual Fusion | GPS-free Navigation             ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    try:
        print(banner)
    except UnicodeEncodeError:
        print("COBA AI Drone Agent v4.0 — Core Agent + Sub-Agent | Mesh | PitControllers")


def print_help():
    """Вывод справки"""
    print_banner()
    print("""
📖 Использование:
    python main.py [command] [options]

🔧 Команды:
    all         - Запустить все компоненты (API, дашборд, агент)
    api         - Запустить только API сервер (http://localhost:8000)
    dashboard   - Запустить только дашборд (http://localhost:8501)
    gui         - Запустить GUI приложение (PyQt)
    agent       - Запустить только агента
    check       - Проверить систему

🐳 Docker:
    docker-compose up --build     # Запуск в Docker
    docker build -t coba-drone .  # Сборка образа
    docker run -p 8000:8000 -p 8501:8501 coba-drone

💡 Примеры:
    python main.py all          # Запуск всей системы
    python main.py api          # Только API
    python main.py gui          # Только GUI
    python main.py check        # Проверка системы
""")


def main():
    """Главная функция"""
    parser = argparse.ArgumentParser(
        description="COBA AI Drone Agent v4.0",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python main.py all         # Запуск всей системы
  python main.py gui         # Запуск GUI
  python main.py check       # Проверка системы
        """
    )

    parser.add_argument(
        "command",
        nargs="?",
        default="help",
        choices=["all", "api", "dashboard", "gui", "agent", "check", "help"],
        help="Команда для выполнения"
    )

    parser.add_argument(
        "--config",
        "-c",
        default="config/config.yaml",
        help="Путь к файлу конфигурации"
    )

    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Подробный вывод"
    )

    args = parser.parse_args()

    # Подгружаем переменные окружения из .env (локальный сценарий).
    # В docker-compose они и так подхватываются нативно.
    try:
        from dotenv import load_dotenv
        load_dotenv(".env", override=False)
    except Exception:
        # .env опционален; при отсутствии/ошибках просто продолжаем.
        pass

    if args.verbose:
        os.environ["LOG_LEVEL"] = "DEBUG"

    print_banner()

    if args.command == "check":
        check_system()
    elif args.command == "api":
        check_system()
        run_api()
    elif args.command == "dashboard":
        check_system()
        run_dashboard()
    elif args.command == "gui":
        check_system()
        run_gui()
    elif args.command == "agent":
        check_system()
        run_agent()
    elif args.command == "all":
        check_system()
        run_all()
    else:
        print_help()


if __name__ == "__main__":
    main()
