"""
🚁 COBA AI Drone System - Modern Dashboard
Advanced web interface for drone management and AI agent control
"""
import streamlit as st
import requests
import json
from datetime import datetime
from typing import Dict, Any

# ============================================================================
# PAGE CONFIGURATION
# ============================================================================

st.set_page_config(
    page_title="COBA AI Drone Control",
    page_icon="🚁",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "Get Help": "https://github.com/yourusername/coba-ai-drone",
        "Report a bug": "https://github.com/yourusername/coba-ai-drone/issues",
    }
)

# ============================================================================
# STYLING & THEME
# ============================================================================

st.markdown("""
<style>
    :root {
        --background: 222 47% 4%;
        --foreground: 210 40% 98%;
        --card: 222 47% 6%;
        --card-foreground: 210 40% 98%;
        --popover: 222 47% 6%;
        --popover-foreground: 210 40% 98%;
        --primary: 188 94% 43%;
        --primary-foreground: 222 47% 4%;
        --secondary: 217 33% 17%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217 33% 17%;
        --muted-foreground: 215 20% 65%;
        --accent: 188 94% 43%;
        --accent-foreground: 222 47% 4%;
        --destructive: 0 84% 60%;
        --destructive-foreground: 210 40% 98%;
        --border: 217 33% 17%;
        --input: 217 33% 17%;
        --ring: 188 94% 43%;
        --radius: .5rem;
    }

    body {
        background-color: hsl(var(--background));
        color: hsl(var(--foreground));
        font-family: ui-sans-serif, system-ui, sans-serif;
    }

    .main {
        padding: 0rem 0rem;
        background: linear-gradient(135deg, hsl(var(--background)), hsl(var(--secondary)));
    }

    [data-testid="stMetricValue"] {
        font-size: 2rem;
        color: hsl(var(--primary));
    }

    .stTabs [data-baseweb="tab-list"] {
        gap: 2ch;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: var(--radius);
        padding: 0.5rem;
    }

    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius);
        color: hsl(var(--muted-foreground));
        font-weight: bold;
        transition: all 0.3s ease;
        border: 1px solid hsl(var(--border));
    }

    .stTabs [data-baseweb="tab"]:hover {
        background-color: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
        transform: translateY(-2px);
        box-shadow: 0 10px 40px -10px hsl(var(--primary) / 0.5);
    }

    .stTabs [aria-selected="true"] [data-testid="stMarkdownContainer"] {
        color: hsl(var(--primary));
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .status-online {
        color: hsl(var(--primary));
        font-weight: bold;
    }

    .status-offline {
        color: hsl(var(--destructive));
        font-weight: bold;
    }

    .status-standby {
        color: hsl(var(--accent));
        font-weight: bold;
    }

    .heading-custom {
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 2rem;
    }

    .glass {
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: var(--radius);
        border: 1px solid hsl(var(--border));
    }

    .card-hover {
        transition: all .3s ease;
    }

    .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 40px -10px hsl(var(--primary) / 0.5);
    }

    .gradient-text {
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .animate-pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 5px hsl(var(--primary) / 0.5);
        }
        50% {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.8);
        }
    }

    .stButton > button {
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
        color: hsl(var(--primary-foreground));
        border-radius: var(--radius);
        border: none;
        transition: all 0.3s ease;
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 40px -10px hsl(var(--primary) / 0.5);
    }

    .stTextInput > div > div > input {
        background-color: hsl(var(--input));
        color: hsl(var(--foreground));
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
    }

    .stSidebar {
        background: linear-gradient(180deg, hsl(var(--background)), hsl(var(--secondary)));
        border-right: 1px solid hsl(var(--border));
    }

    .stSuccess, .stError, .stWarning, .stInfo {
        border-radius: var(--radius);
        border: 1px solid hsl(var(--border));
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# API CONFIGURATION
# ============================================================================

API_URL = st.secrets.get("api_url", "http://localhost:8000")


class APIClient:
    """API Client for drone system"""

    @staticmethod
    def get(endpoint: str) -> Dict[str, Any]:
        """GET request"""
        try:
            response = requests.get(f"{API_URL}{endpoint}", timeout=5)
            return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def post(endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """POST request"""
        try:
            response = requests.post(f"{API_URL}{endpoint}", json=data, timeout=5)
            return response.json() if response.status_code == 200 else {"error": response.text}
        except Exception as e:
            return {"error": str(e)}


# ============================================================================
# SIDEBAR
# ============================================================================

with st.sidebar:
    st.markdown('<div class="glass" style="padding: 1rem; margin-bottom: 1rem;">', unsafe_allow_html=True)
    st.image("https://via.placeholder.com/200x100?text=COBA+AI", use_column_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<div class="glass card-hover" style="padding: 1rem;">', unsafe_allow_html=True)
    st.title("🎛️ Control Panel")
    st.markdown('</div>', unsafe_allow_html=True)

    # System Status
    st.markdown('<div class="glass card-hover" style="padding: 1rem; margin-top: 1rem;">', unsafe_allow_html=True)
    st.subheader("System Status")
    health = APIClient.get("/health")

    if "error" not in health:
        st.success("✅ API Connected")
    else:
        st.error("❌ API Disconnected")
    st.markdown('</div>', unsafe_allow_html=True)

    # Agent Control
    st.markdown('<div class="glass card-hover" style="padding: 1rem; margin-top: 1rem;">', unsafe_allow_html=True)
    st.subheader("Agent Management")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("🚀 Initialize", key="init"):
            result = APIClient.post("/api/v1/agent/initialize")
            if result.get("success"):
                st.success("Agent initialized!")
            else:
                st.error(f"Error: {result.get('error', 'Unknown')}")

    with col2:
        if st.button("⏹️ Shutdown", key="shutdown"):
            result = APIClient.post("/api/v1/agent/shutdown")
            if result.get("success"):
                st.success("Agent stopped!")
            else:
                st.error(f"Error: {result.get('error', 'Unknown')}")
    st.markdown('</div>', unsafe_allow_html=True)

    # Tools Status
    st.markdown('<div class="glass card-hover" style="padding: 1rem; margin-top: 1rem;">', unsafe_allow_html=True)
    st.subheader("📦 System Tools")
    tools = APIClient.get("/api/v1/tools")

    if "error" not in tools:
        for tool in tools.get("tools", []):
            status = "🟢" if tool.get("status") == "ready" else "🔴"
            st.write(f"{status} **{tool['name']}** - {tool.get('status', 'unknown').upper()}")
    else:
        st.write("Tools unavailable")
    st.markdown('</div>', unsafe_allow_html=True)

    # API Configuration
    st.markdown('<div class="glass card-hover" style="padding: 1rem; margin-top: 1rem;">', unsafe_allow_html=True)
    st.divider()
    st.subheader("⚙️ Settings")
    new_url = st.text_input("API URL", value=API_URL)
    if new_url != API_URL:
        st.info("API URL updated (restart required)")
    st.markdown('</div>', unsafe_allow_html=True)


# ============================================================================
# MAIN HEADER
# ============================================================================

col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    st.markdown(
        '<p class="heading-custom gradient-text">🚁 COBA AI Drone Control System</p>',
        unsafe_allow_html=True
    )

st.divider()

# ============================================================================
# TAB NAVIGATION
# ============================================================================

tab_dashboard, tab_telemetry, tab_missions, tab_commands, tab_scenarios, tab_learning, tab_fleet, tab_camera, tab_events, tab_backups = st.tabs(
    ["📊 Dashboard", "📈 Telemetry", "🗺️ Missions", "🎮 Flight", "🚀 Scenarios", "🧠 Learning", "🐝 Fleet", "📹 Camera", "📋 Events", "💾 Backups"]
)

# ============================================================================
# TAB 1: DASHBOARD
# ============================================================================

with tab_dashboard:
    st.header("System Dashboard")

    # Get telemetry
    telemetry_data = APIClient.get("/api/v1/telemetry")
    telemetry = telemetry_data.get("telemetry", {}) if "error" not in telemetry_data else {}

    # Status metrics
    col1, col2, col3, col4, col5, col6 = st.columns(6)

    with col1:
        status = "🟢 ONLINE" if telemetry else "🔴 OFFLINE"
        st.metric("Status", status)

    with col2:
        battery = telemetry.get("battery", 0)
        st.metric("Battery", f"{battery:.1f}%")

    with col3:
        altitude = telemetry.get("position", {}).get("z", 0)
        st.metric("Altitude", f"{altitude:.1f} m")

    with col4:
        velocity = telemetry.get("velocity", {})
        speed = (velocity.get("vx", 0)**2 + velocity.get("vy", 0)**2 + velocity.get("vz", 0)**2) ** 0.5
        st.metric("Speed", f"{speed:.2f} m/s")

    with col5:
        signal = telemetry.get("signal_strength", 0)
        st.metric("Signal", f"{signal}%")

    with col6:
        gps = telemetry.get("gps_status", "Unknown")
        st.metric("GPS", gps)

    st.divider()

    # Two-column layout
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Position Information")

        pos = telemetry.get("position", {})

        positions_data = {
            "X": f"{pos.get('x', 0):.2f} m",
            "Y": f"{pos.get('y', 0):.2f} m",
            "Z": f"{pos.get('z', 0):.2f} m"
        }

        st.dataframe(
            [[k, v] for k, v in positions_data.items()],
            column_config={
                0: st.column_config.TextColumn("Parameter"),
                1: st.column_config.TextColumn("Value")
            },
            hide_index=True
        )

    with col_right:
        st.subheader("Orientation Information")

        att = telemetry.get("attitude", {})

        attitude_data = {
            "Roll": f"{att.get('roll', 0):.2f}°",
            "Pitch": f"{att.get('pitch', 0):.2f}°",
            "Yaw": f"{att.get('yaw', 0):.2f}°"
        }

        st.dataframe(
            [[k, v] for k, v in attitude_data.items()],
            column_config={
                0: st.column_config.TextColumn("Parameter"),
                1: st.column_config.TextColumn("Value")
            },
            hide_index=True
        )


# ============================================================================
# TAB 2: TELEMETRY
# ============================================================================

with tab_telemetry:
    st.header("Detailed Telemetry")

    telemetry_data = APIClient.get("/api/v1/telemetry")
    telemetry = telemetry_data.get("telemetry", {}) if "error" not in telemetry_data else {}

    if not telemetry:
        st.warning("Telemetry data unavailable")
    else:
        # Velocity
        st.subheader("Velocity")
        vel = telemetry.get("velocity", {})

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Vx", f"{vel.get('vx', 0):.2f} m/s")
        with col2:
            st.metric("Vy", f"{vel.get('vy', 0):.2f} m/s")
        with col3:
            st.metric("Vz", f"{vel.get('vz', 0):.2f} m/s")

        st.divider()

        # IMU Data
        st.subheader("IMU Sensors")
        imu = telemetry.get("imu", {})

        col1, col2, col3 = st.columns(3)
        with col1:
            st.write(f"**Accelerometer**: {imu.get('accel', 'N/A')}")
        with col2:
            st.write(f"**Gyroscope**: {imu.get('gyro', 'N/A')}")
        with col3:
            st.write(f"**Magnetometer**: {imu.get('mag', 'N/A')}")

        st.divider()

        # Raw Telemetry JSON
        st.subheader("Raw Telemetry Data")
        st.json(telemetry)


# ============================================================================
# TAB 3: MISSIONS
# ============================================================================

with tab_missions:
    st.header("🗺️ Mission Control")

    # Create new mission
    st.subheader("Создание новой миссии")

    col1, col2 = st.columns(2)

    with col1:
        mission_name = st.text_input("Название миссии", value="Патрулирование склада", placeholder="Введите название миссии")

    with col2:
        mission_type = st.selectbox(
            "Тип миссии",
            [
                "Патрулирование",
                "Поиск и обнаружение",
                "Доставка груза",
                "Обследование объекта",
                "Картографирование",
                "Сопровождение движущейся цели",
                "Экстренное реагирование",
                "Тестовая миссия"
            ]
        )

    # Mission parameters
    st.subheader("Параметры полёта")
    col1, col2, col3 = st.columns(3)
    with col1:
        default_altitude = st.slider("Высота полёта (м)", 5, 100, 30)
    with col2:
        default_speed = st.slider("Скорость (м/с)", 1, 20, 5)
    with col3:
        actions_at_points = st.multiselect(
            "Действия в точках",
            ["Сделать фото", "Видео", "Зависнуть", "Активировать поиск", "Отправить данные"],
            default=["Сделать фото"]
        )

    # Special instructions
    special_instructions = st.text_area(
        "Особые инструкции",
        placeholder="Например: избегать жилых домов, при обнаружении — отправить координаты",
        height=100
    )

    # Waypoints
    st.subheader("Маршрут (Waypoints)")
    st.write("Добавьте точки маршрута:")

    waypoints = []
    num_waypoints = st.number_input("Количество точек", min_value=1, max_value=10, value=3)

    for i in range(num_waypoints):
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            x = st.number_input(f"X {i+1} (м)", value=float(i*10), key=f"wp_x_{i}")
        with col2:
            y = st.number_input(f"Y {i+1} (м)", value=float(i*5), key=f"wp_y_{i}")
        with col3:
            z = st.number_input(f"Z {i+1} (м)", value=default_altitude, key=f"wp_z_{i}")
        with col4:
            speed = st.number_input(f"Скорость {i+1} (м/с)", value=default_speed, key=f"wp_speed_{i}")

        waypoints.append({"x": x, "y": y, "z": z, "speed": speed, "actions": actions_at_points})

    # Preview
    if st.button("👁️ Предпросмотр маршрута"):
        st.subheader("Предпросмотр маршрута")
        import pandas as pd
        df = pd.DataFrame(waypoints)
        st.dataframe(df)
        st.map()  # Simple map placeholder

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("💾 Сохранить миссию"):
            mission_data = {
                "name": mission_name,
                "type": mission_type,
                "waypoints": waypoints,
                "altitude": default_altitude,
                "speed": default_speed,
                "actions": actions_at_points,
                "instructions": special_instructions
            }
            # Save to file or API
            st.success("Миссия сохранена!")

    with col2:
        if st.button("▶️ Запустить миссию"):
            mission_data = {
                "name": mission_name,
                "type": mission_type,
                "waypoints": waypoints,
                "altitude": default_altitude,
                "speed": default_speed,
                "actions": actions_at_points,
                "instructions": special_instructions
            }

            result = APIClient.post("/api/v1/mission/start", mission_data)

            if result.get("success"):
                st.success(f"✅ Миссия '{mission_name}' запущена! ID: {result.get('mission_id')}")
            else:
                st.error(f"Ошибка запуска: {result.get('error', 'Неизвестная ошибка')}")

    with col3:
        if st.button("⏹️ Остановить миссию"):
            result = APIClient.post("/api/v1/mission/stop")
            if result.get("success"):
                st.success("Миссия остановлена")
            else:
                st.error("Ошибка остановки")

    st.divider()

    # Active mission
    st.subheader("Активная миссия")

    mission_status = APIClient.get("/api/v1/mission/status")

    if "error" not in mission_status:
        current = mission_status.get("current_mission")

        if current:
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Название", current.get("name", "Неизвестно"))
            with col2:
                st.metric("Точек маршрута", len(current.get("waypoints", [])))
            with col3:
                st.metric("Прогресс", f"{current.get('progress', 0):.0f}%")

            # Show current position if available
            if "current_position" in current:
                pos = current["current_position"]
                st.write(f"Текущая позиция: X={pos.get('x', 0):.2f}, Y={pos.get('y', 0):.2f}, Z={pos.get('z', 0):.2f}")
        else:
            st.info("Нет активной миссии")
    else:
        st.error("Не удалось получить статус миссии")

    # Mission history
    st.subheader("История миссий")
    # Placeholder for mission history
    st.write("Здесь будет список выполненных миссий")


# ============================================================================
# TAB 4: FLIGHT CONTROLS
# ============================================================================

with tab_commands:
    st.header("Flight Control")

    st.subheader("Quick Commands")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🛫 Takeoff", key="takeoff"):
            alt = st.number_input("Altitude (m)", value=15, key="alt_takeoff")
            result = APIClient.post("/api/v1/command", {
                "command": "takeoff",
                "params": {"altitude": alt}
            })
            if result.get("success"):
                st.success("✅ Takeoff command sent")

    with col2:
        if st.button("⏸️ Hover", key="hover"):
            result = APIClient.post("/api/v1/command", {"command": "hover"})
            if result.get("success"):
                st.success("✅ Hover command sent")

    with col3:
        if st.button("🛬 Land", key="land"):
            result = APIClient.post("/api/v1/command", {"command": "land"})
            if result.get("success"):
                st.success("✅ Land command sent")

    st.divider()

    st.subheader("Navigation")

    col1, col2, col3 = st.columns(3)

    with col1:
        goto_x = st.number_input("Target X", value=50.0)
    with col2:
        goto_y = st.number_input("Target Y", value=50.0)
    with col3:
        goto_z = st.number_input("Target Altitude", value=20.0)

    if st.button("🎯 Navigate to Point"):
        result = APIClient.post("/api/v1/command", {
            "command": "goto",
            "params": {"x": goto_x, "y": goto_y, "z": goto_z}
        })
        if result.get("success"):
            st.success(f"✅ Navigating to ({goto_x}, {goto_y}, {goto_z})")

    st.divider()

    st.subheader("Return to Launch")

    if st.button("🏠 Return to Home (RTL)"):
        result = APIClient.post("/api/v1/command", {"command": "rtl"})
        if result.get("success"):
            st.success("✅ RTL command sent")


# ============================================================================
# TAB 5: SCENARIOS
# ============================================================================

with tab_scenarios:
    st.header("Pre-configured Scenarios")

    scenarios = {
        "patrol": {
            "icon": "👁️",
            "name": "Patrol Mode",
            "description": "Automatic perimeter surveillance with photo capture"
        },
        "search": {
            "icon": "🔍",
            "name": "Search & Detect",
            "description": "Object detection in designated area"
        },
        "survey": {
            "icon": "📸",
            "name": "Territory Survey",
            "description": "Mapping with serpentine flight pattern"
        },
        "delivery": {
            "icon": "📦",
            "name": "Cargo Delivery",
            "description": "Autonomous delivery to target location"
        },
        "swarm": {
            "icon": "🐝",
            "name": "Swarm Flight",
            "description": "V-formation with dynamic reconfiguration"
        },
        "inspection": {
            "icon": "🔧",
            "name": "Orbital Inspection",
            "description": "360° survey with 8-point imaging"
        }
    }

    # Display scenarios in grid
    cols = st.columns(3)

    for idx, (key, scenario) in enumerate(scenarios.items()):
        with cols[idx % 3]:
            if st.button(
                f"{scenario['icon']}\n{scenario['name']}\n\n_{scenario['description']}_",
                key=f"scenario_{key}",
                use_container_width=True
            ):
                result = APIClient.post("/api/v1/scenario", {"name": key})
                if result.get("success"):
                    st.success(f"✅ {scenario['name']} started!")
                else:
                    st.error(f"Error: {result.get('error', 'Unknown')}")

            st.write("")


# ============================================================================
# TAB 6: LEARNING
# ============================================================================

with tab_learning:
    st.header("🧠 AI Learning & Training")

    # Learning Progress
    st.subheader("Training Progress")
    progress_data = APIClient.get("/api/v1/learning/progress")

    if "error" not in progress_data:
        col1, col2, col3 = st.columns(3)

        with col1:
            reward = progress_data.get("reward", 0)
            st.metric("Current Reward", f"{reward:.2f}")

        with col2:
            loss = progress_data.get("loss", 0)
            st.metric("Training Loss", f"{loss:.4f}")

        with col3:
            episodes = progress_data.get("episodes", 0)
            st.metric("Episodes", episodes)

        # Progress chart placeholder
        st.subheader("Reward History")
        # Here you would add a chart with historical data
        st.info("Chart visualization requires additional data collection")
    else:
        st.error("Learning data unavailable")

    st.divider()

    # Training Controls
    st.subheader("Training Controls")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("▶️ Start Training", key="start_training"):
            config = {"task": "default", "config": {}}
            result = APIClient.post("/api/v1/learning/start", config)
            if "task_id" in result:
                st.success(f"Training started! Task ID: {result['task_id']}")
            else:
                st.error(f"Error: {result.get('error', 'Unknown')}")

    with col2:
        if st.button("⏸️ Pause Training", key="pause_training"):
            result = APIClient.put("/api/v1/learning/config", {"paused": True})
            if result.get("status") == "updated":
                st.success("Training paused")
            else:
                st.error("Failed to pause training")

    with col3:
        if st.button("🔄 Reset Model", key="reset_training"):
            result = APIClient.put("/api/v1/learning/config", {"reset": True})
            if result.get("status") == "updated":
                st.success("Model reset")
            else:
                st.error("Failed to reset model")

    st.divider()

    # Model Export
    st.subheader("Model Management")

    export_path = st.text_input("Export Path", value="models/exported_model.pkl")

    if st.button("💾 Export Model"):
        result = APIClient.post("/api/v1/learning/export", {"path": export_path})
        if result.get("status") == "exported":
            st.success(f"Model exported to {result['path']}")
        else:
            st.error("Export failed")

    # Curriculum Learning
    st.subheader("Curriculum Learning")
    tasks_data = APIClient.get("/api/v1/learning/tasks")

    if "error" not in tasks_data:
        tasks = tasks_data.get("tasks", [])
        for task in tasks:
            st.write(f"**{task['name']}**: {task.get('description', '')}")
            progress = st.progress(task.get('progress', 0))
            st.caption(f"Progress: {task.get('progress', 0)*100:.1f}%")
    else:
        st.info("No curriculum tasks available")


# ============================================================================
# TAB 7: FLEET
# ============================================================================

with tab_fleet:
    st.header("🐝 Drone Fleet Management")

    # Fleet Status
    st.subheader("Fleet Overview")
    fleet_data = APIClient.get("/api/v1/fleet/status")

    if "error" not in fleet_data:
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            connected = fleet_data.get("connected_drones", 0)
            st.metric("Connected Drones", connected)

        with col2:
            avg_battery = fleet_data.get("avg_battery", 0)
            st.metric("Avg Battery", f"{avg_battery:.1f}%")

        with col3:
            formation = fleet_data.get("formation", "unknown")
            st.metric("Formation", formation.upper())

        with col4:
            leader = fleet_data.get("leader_id", 0)
            st.metric("Leader ID", leader)

        # Fleet Table
        st.subheader("Drone Status")
        drones = fleet_data.get("drones", [])

        if drones:
            import pandas as pd
            df = pd.DataFrame(drones)
            st.dataframe(df, use_container_width=True)
        else:
            st.info("No drone data available")
    else:
        st.error("Fleet data unavailable")

    st.divider()

    # Formation Control
    st.subheader("Formation Control")

    col1, col2 = st.columns(2)

    with col1:
        formation = st.selectbox(
            "Formation",
            ["line", "circle", "pyramid", "v-shape"],
            key="formation_select"
        )
        spacing = st.slider("Spacing (m)", 1.0, 20.0, 5.0, key="spacing_slider")

        if st.button("🔄 Set Formation"):
            result = APIClient.post("/api/v1/fleet/formation", {
                "formation": formation,
                "spacing": spacing
            })
            if result.get("status") == "set":
                st.success(f"Formation set to {formation}")
            else:
                st.error("Failed to set formation")

    with col2:
        leader_id = st.number_input("New Leader ID", min_value=0, value=0, key="leader_input")

        if st.button("👑 Change Leader"):
            result = APIClient.post("/api/v1/fleet/swap_leader", {"leader_id": leader_id})
            if result.get("status") == "swapped":
                st.success(f"Leader changed to drone {leader_id}")
            else:
                st.error("Failed to change leader")

    # Mesh Topology
    st.subheader("Mesh Network Topology")
    topology_data = APIClient.get("/api/v1/mesh/topology")

    if "error" not in topology_data:
        st.json(topology_data)
    else:
        st.info("Topology data unavailable")


# ============================================================================
# TAB 8: CAMERA
# ============================================================================

with tab_camera:
    st.header("📹 Camera & Video Feed")

    # Camera Controls
    st.subheader("Camera Controls")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        zoom = st.slider("Zoom", 1.0, 10.0, 1.0, key="zoom_slider")
        st.caption(f"Zoom: {zoom:.1f}x")

    with col2:
        brightness = st.slider("Brightness", -50, 50, 0, key="brightness_slider")
        st.caption(f"Brightness: {brightness}")

    with col3:
        exposure = st.selectbox("Exposure", ["auto", "manual"], key="exposure_select")
        st.caption(f"Exposure: {exposure}")

    with col4:
        mode = st.selectbox("Mode", ["photo", "video", "detection"], key="mode_select")
        st.caption(f"Mode: {mode}")

    st.divider()

    # Recording Controls
    st.subheader("Recording")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🎥 Start Recording", key="start_recording"):
            result = APIClient.post("/api/v1/camera/record/start")
            if result.get("status") == "recording":
                st.success("Recording started")
            else:
                st.error("Failed to start recording")

    with col2:
        if st.button("⏹️ Stop Recording", key="stop_recording"):
            result = APIClient.post("/api/v1/camera/record/stop")
            if result.get("status") == "stopped":
                st.success(f"Recording saved to {result.get('file', 'unknown')}")
            else:
                st.error("Failed to stop recording")

    with col3:
        if st.button("📸 Take Photo", key="take_photo"):
            result = APIClient.post("/api/v1/camera/record/start")
            # Simulate quick photo
            import time
            time.sleep(0.5)
            result = APIClient.post("/api/v1/camera/record/stop")
            if result.get("status") == "stopped":
                st.success("Photo captured")
            else:
                st.error("Failed to capture photo")

    st.divider()

    # Object Detection
    st.subheader("Object Detection Results")
    detection_data = APIClient.get("/api/v1/detection/results")

    if "error" not in detection_data:
        detections = detection_data.get("detections", [])

        if detections:
            import pandas as pd
            df = pd.DataFrame(detections)
            st.dataframe(df, use_container_width=True)

            # Detection stats
            total_objects = len(detections)
            classes = [d.get("class") for d in detections]
            unique_classes = len(set(classes))

            col1, col2 = st.columns(2)
            with col1:
                st.metric("Objects Detected", total_objects)
            with col2:
                st.metric("Classes", unique_classes)
        else:
            st.info("No objects detected")
    else:
        st.error("Detection data unavailable")

    # Video Stream Placeholder
    st.subheader("Live Video Stream")
    st.info("Video stream integration requires WebRTC or MJPEG setup")
    st.image("https://via.placeholder.com/640x480?text=Camera+Feed", use_column_width=True)


# ============================================================================
# TAB 9: EVENTS
# ============================================================================

with tab_events:
    st.header("📋 Event Logs & Monitoring")

    # Event Statistics
    st.subheader("Event Statistics")
    stats_data = APIClient.get("/api/v1/events/statistics")

    if "error" not in stats_data:
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            total = stats_data.get("total_events", 0)
            st.metric("Total Events", total)

        with col2:
            errors = stats_data.get("error_count", 0)
            st.metric("Errors", errors)

        with col3:
            warnings = stats_data.get("warning_count", 0)
            st.metric("Warnings", warnings)

        with col4:
            infos = stats_data.get("info_count", 0)
            st.metric("Info", infos)
    else:
        st.error("Statistics unavailable")

    st.divider()

    # Event Log
    st.subheader("Event Log")

    # Filters
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        level_filter = st.selectbox("Level", ["All", "ERROR", "WARNING", "INFO", "SUCCESS"], key="level_filter")

    with col2:
        component_filter = st.text_input("Component", key="component_filter")

    with col3:
        drone_filter = st.text_input("Drone ID", key="drone_filter")

    with col4:
        limit = st.number_input("Limit", min_value=10, max_value=1000, value=100, key="limit_input")

    # Get filtered events
    params = {}
    if level_filter != "All":
        params["level"] = level_filter
    if component_filter:
        params["component"] = component_filter
    if drone_filter:
        params["drone_id"] = drone_filter

    events_data = APIClient.get(f"/api/v1/events/filter?limit={limit}&{'&'.join([f'{k}={v}' for k, v in params.items()])}")

    if "error" not in events_data:
        events = events_data.get("logs", [])

        if events:
            import pandas as pd
            df = pd.DataFrame(events)
            st.dataframe(df, use_container_width=True)
        else:
            st.info("No events found")
    else:
        st.error("Event data unavailable")

    st.divider()

    # Export & Alert Config
    st.subheader("Export & Notifications")

    col1, col2, col3 = st.columns(3)

    with col1:
        export_format = st.selectbox("Export Format", ["json", "csv", "txt"], key="export_format")

        if st.button("📤 Export Logs"):
            result = APIClient.get(f"/api/v1/events/export?format={export_format}")
            if "data" in result:
                st.download_button(
                    label="Download",
                    data=json.dumps(result["data"]),
                    file_name=f"events.{export_format}",
                    mime="application/json"
                )
            else:
                st.error("Export failed")

    with col2:
        email = st.text_input("Email for alerts", key="alert_email")
        telegram = st.text_input("Telegram for alerts", key="alert_telegram")

        if st.button("🔔 Configure Alerts"):
            config = {"email": email, "telegram": telegram}
            result = APIClient.post("/api/v1/events/alert/config", config)
            if result.get("status") == "configured":
                st.success("Alerts configured")
            else:
                st.error("Failed to configure alerts")

    with col3:
        if st.button("🗑️ Clear Old Events"):
            # This would require a new endpoint
            st.info("Clear functionality requires backend implementation")


# ============================================================================
# TAB 10: BACKUPS
# ============================================================================

with tab_backups:
    st.header("💾 Backups & Recovery")

    # Backup Creation
    st.subheader("Create Backup")

    components = st.multiselect(
        "Components to backup",
        ["missions", "config", "models", "logs"],
        default=["missions", "config"],
        key="backup_components"
    )

    if st.button("💾 Create Backup"):
        result = APIClient.post("/api/v1/backup/create", {"components": components})
        if "backup_id" in result:
            st.success(f"Backup created! ID: {result['backup_id']}")
        else:
            st.error("Backup creation failed")

    st.divider()

    # Backup List
    st.subheader("Available Backups")
    backups_data = APIClient.get("/api/v1/backup/list")

    if "error" not in backups_data:
        backups = backups_data.get("backups", [])

        if backups:
            import pandas as pd
            df = pd.DataFrame(backups)
            st.dataframe(df, use_container_width=True)

            # Restore options
            selected_backup = st.selectbox("Select backup to restore", [b["id"] for b in backups], key="restore_select")
            restore_mode = st.selectbox("Restore mode", ["merge", "replace"], key="restore_mode")

            col1, col2 = st.columns(2)

            with col1:
                if st.button("🔄 Restore Backup"):
                    result = APIClient.post(f"/api/v1/backup/restore/{selected_backup}", {"mode": restore_mode})
                    if result.get("status") == "restored":
                        st.success("Backup restored successfully")
                    else:
                        st.error("Restore failed")

            with col2:
                if st.button("🗑️ Delete Backup"):
                    result = APIClient.delete(f"/api/v1/backup/{selected_backup}")
                    if result.get("status") == "deleted":
                        st.success("Backup deleted")
                    else:
                        st.error("Delete failed")
        else:
            st.info("No backups available")
    else:
        st.error("Backup list unavailable")

    st.divider()

    # Data Export
    st.subheader("Data Export")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("📊 Export Missions"):
            result = APIClient.post("/api/v1/export/missions", {"format": "json"})
            if "data" in result:
                st.download_button(
                    label="Download Missions",
                    data=json.dumps(result["data"]),
                    file_name="missions.json",
                    mime="application/json"
                )
            else:
                st.error("Export failed")

    with col2:
        if st.button("📈 Export Telemetry"):
            start_date = st.date_input("Start date", key="telemetry_start")
            end_date = st.date_input("End date", key="telemetry_end")
            result = APIClient.post("/api/v1/export/telemetry", {
                "format": "json",
                "start": str(start_date),
                "end": str(end_date)
            })
            if "data" in result:
                st.download_button(
                    label="Download Telemetry",
                    data=json.dumps(result["data"]),
                    file_name="telemetry.json",
                    mime="application/json"
                )
            else:
                st.error("Export failed")

    with col3:
        if st.button("🧠 Export Models"):
            result = APIClient.post("/api/v1/export/models")
            if "data" in result:
                st.download_button(
                    label="Download Models",
                    data=json.dumps(result["data"]),
                    file_name="models.json",
                    mime="application/json"
                )
            else:
                st.error("Export failed")


# ============================================================================
# FLOATING CHAT
# ============================================================================

# Add floating chat in sidebar or as overlay
with st.sidebar:
    st.divider()
    st.subheader("💬 AI Assistant")

    # Chat history
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Display chat history
    chat_container = st.container()
    with chat_container:
        for msg in st.session_state.chat_history[-10:]:  # Show last 10 messages
            if msg["role"] == "user":
                st.write(f"👤 **You:** {msg['content']}")
            else:
                st.write(f"🤖 **AI:** {msg['content']}")

    # Chat input
    user_input = st.text_input("Ask AI assistant...", key="chat_input")

    if st.button("Send", key="send_chat"):
        if user_input:
            # Add user message
            st.session_state.chat_history.append({"role": "user", "content": user_input})

            # Get AI response
            response = APIClient.get(f"/api/v1/sub_agent/ask?question={user_input}")
            ai_response = response.get("answer", "Sorry, I couldn't process that request.")

            # Add AI message
            st.session_state.chat_history.append({"role": "ai", "content": ai_response})

            st.rerun()

    # Quick actions
    st.caption("Quick Actions:")
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🚨 Emergency", key="quick_emergency"):
            st.session_state.chat_history.append({"role": "user", "content": "What should I do in an emergency?"})
            st.rerun()

    with col2:
        if st.button("🔋 Battery", key="quick_battery"):
            st.session_state.chat_history.append({"role": "user", "content": "Check battery status and give advice"})
            st.rerun()

    with col3:
        if st.button("📍 Location", key="quick_location"):
            st.session_state.chat_history.append({"role": "user", "content": "Where is the drone currently?"})
            st.rerun()


# ============================================================================
# FOOTER
# ============================================================================

st.divider()

col1, col2, col3 = st.columns(3)

with col1:
    st.caption("Last updated: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

with col2:
    st.caption("🔗 API: " + API_URL)

with col3:
    st.caption("Made with ❤️ for autonomous drones")
