"""
================================================================================
Streamlit Dashboard - Веб-интерфейс для мониторинга
================================================================================
"""
import streamlit as st
import requests
import json
from datetime import datetime

# Настройка страницы
st.set_page_config(
    page_title="COBA AI Drone Agent Dashboard",
    page_icon="🚁",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS стили
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #0d6efd;
    }
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status-online {
        color: #198754;
        font-weight: bold;
    }
    .status-offline {
        color: #dc3545;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

# API URL
API_URL = "http://localhost:8000"


def get_telemetry():
    """Получение телеметрии"""
    try:
        response = requests.get(f"{API_URL}/api/v1/telemetry", timeout=2)
        return response.json()
    except:
        return None


def get_status():
    """Получение статуса"""
    try:
        response = requests.get(f"{API_URL}/api/v1/status", timeout=2)
        return response.json()
    except:
        return None


def send_command(command, params=None):
    """Отправка команды"""
    try:
        data = {"command": command, "params": params or {}}
        response = requests.post(f"{API_URL}/api/v1/command", json=data, timeout=5)
        return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


# ========== Sidebar ==========
with st.sidebar:
    st.image("https://img.icons8.com/color/96/drone.png", width=80)
    st.markdown("<h2 style='text-align: center;'>COBA AI Drone</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: gray;'>v4.0.0</p>", unsafe_allow_html=True)
    
    st.divider()
    
    # Навигация
    page = st.radio(
        "Навигация",
        ["📊 Дашборд", "🎮 Управление", "🎯 Миссии", "📹 Камера", "🌐 Mesh", "⚙️ Настройки"]
    )
    
    st.divider()
    
    # Статус подключения
    status = get_status()
    if status:
        st.success("✅ Агент подключен")
        st.json({
            "ID": status.get("agent_id"),
            "Состояние": status.get("state"),
            "Миссия": status.get("mission", "Нет")
        })
    else:
        st.error("❌ Агент не подключен")
        st.info("Запустите: python main.py api")

# ========== Pages ==========

if page == "📊 Дашборд":
    st.markdown("<h1 class='main-header'>📊 Дашборд</h1>", unsafe_allow_html=True)
    
    # Телеметрия
    telemetry = get_telemetry()
    
    if telemetry:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("🔋 Батарея", f"{telemetry.get('battery', 0):.1f}%")
        
        with col2:
            pos = telemetry.get("position", {})
            st.metric("📍 Высота", f"{pos.get('z', 0):.1f} м")
        
        with col3:
            vel = telemetry.get("velocity", {})
            speed = (vel.get("vx", 0)**2 + vel.get("vy", 0)**2 + vel.get("vz", 0)**2)**0.5
            st.metric("💨 Скорость", f"{speed:.1f} м/с")
        
        with col4:
            att = telemetry.get("attitude", {})
            st.metric("🧭 Курс", f"{att.get('yaw', 0):.0f}°")
        
        st.divider()
        
        # Детальная телеметрия
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📍 Позиция")
            st.json({
                "Широта": f"{pos.get('lat', 0):.6f}",
                "Долгота": f"{pos.get('lon', 0):.6f}",
                "Высота": f"{pos.get('z', 0):.2f} м"
            })
        
        with col2:
            st.subheader("🧭 Ориентация")
            st.json({
                "Крен (Roll)": f"{att.get('roll', 0):.1f}°",
                "Тангаж (Pitch)": f"{att.get('pitch', 0):.1f}°",
                "Рысканье (Yaw)": f"{att.get('yaw', 0):.1f}°"
            })
    else:
        st.warning("⚠️ Нет данных телеметрии")
        st.info("Убедитесь, что API сервер запущен: python main.py api")

elif page == "🎮 Управление":
    st.markdown("<h1 class='main-header'>🎮 Управление</h1>", unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Основные команды")
        
        if st.button("🔒 ARM", use_container_width=True):
            result = send_command("ARM")
            st.success(f"Результат: {result}")
        
        if st.button("🔓 DISARM", use_container_width=True):
            result = send_command("DISARM")
            st.success(f"Результат: {result}")
        
        if st.button("🚁 ВЗЛЕТ", use_container_width=True):
            result = send_command("TAKEOFF", {"altitude": 10})
            st.success(f"Результат: {result}")
        
        if st.button("🛬 ПОСАДКА", use_container_width=True):
            result = send_command("LAND")
            st.success(f"Результат: {result}")
    
    with col2:
        st.subheader("Дополнительно")
        
        if st.button("🏠 RTL", use_container_width=True):
            result = send_command("RTL")
            st.success(f"Результат: {result}")
        
        if st.button("⏸️ ЗАВИСАНИЕ", use_container_width=True):
            result = send_command("HOVER")
            st.success(f"Результат: {result}")
        
        st.divider()
        
        # Пользовательская команда
        custom_cmd = st.text_input("Команда:", "GOTO")
        custom_params = st.text_area("Параметры (JSON):", '{"x": 10, "y": 10, "z": 10}')
        
        if st.button("▶️ Выполнить", use_container_width=True):
            try:
                params = json.loads(custom_params)
                result = send_command(custom_cmd, params)
                st.json(result)
            except json.JSONDecodeError:
                st.error("❌ Неверный JSON в параметрах")

elif page == "🎯 Миссии":
    st.markdown("<h1 class='main-header'>🎯 Миссии</h1>", unsafe_allow_html=True)
    
    st.subheader("Создание миссии")
    
    mission_name = st.text_input("Название миссии:", "Патрулирование")
    
    st.subheader("Точки маршрута")
    
    # Таблица точек
    waypoints_data = st.data_editor(
        [
            {"lat": 55.7558, "lon": 37.6173, "alt": 50},
            {"lat": 55.7560, "lon": 37.6175, "alt": 50},
            {"lat": 55.7562, "lon": 37.6177, "alt": 50},
        ],
        num_rows="dynamic",
        use_container_width=True
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("▶️ Запустить миссию", use_container_width=True):
            st.success(f"Миссия '{mission_name}' запущена!")
    
    with col2:
        if st.button("💾 Сохранить миссию", use_container_width=True):
            st.success("Миссия сохранена!")

elif page == "📹 Камера":
    st.markdown("<h1 class='main-header'>📹 Камера</h1>", unsafe_allow_html=True)
    
    camera_source = st.selectbox(
        "Источник видео:",
        ["Основная камера", "Тепловизор", "LIDAR", "Камера 2"]
    )
    
    # Placeholder для видео
    st.info("🎥 Видеопоток будет отображаться здесь")
    
    # Заглушка для видео
    st.image(
        "https://via.placeholder.com/800x450/1a1a1a/666666?text=Video+Stream",
        use_column_width=True
    )
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.button("⬆️ Вверх")
    with col2:
        st.button("⬇️ Вниз")
    with col3:
        st.button("⬅️ Влево")
    with col4:
        st.button("➡️ Вправо")

elif page == "🌐 Mesh":
    st.markdown("<h1 class='main-header'>🌐 Mesh Network</h1>", unsafe_allow_html=True)
    
    try:
        response = requests.get(f"{API_URL}/api/v1/mesh", timeout=2)
        mesh_status = response.json()
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Узел", mesh_status.get("node_id", "N/A"))
        
        with col2:
            st.metric("Узлов онлайн", mesh_status.get("nodes_online", 0))
        
        with col3:
            st.metric("Всего узлов", mesh_status.get("nodes_total", 0))
        
        st.divider()
        
        st.subheader("👥 Соседи")
        neighbors = mesh_status.get("neighbors", [])
        
        if neighbors:
            for neighbor in neighbors:
                with st.container():
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.write(f"**{neighbor.get('node_id', 'Unknown')}**")
                    with col2:
                        st.write(f"Тип: {neighbor.get('type', 'Unknown')}")
                    with col3:
                        st.write(f"Сигнал: {neighbor.get('signal', 0)}%")
        else:
            st.info("Нет соседей в сети")
    
    except:
        st.error("❌ Не удалось получить статус Mesh сети")

elif page == "⚙️ Настройки":
    st.markdown("<h1 class='main-header'>⚙️ Настройки</h1>", unsafe_allow_html=True)
    
    st.subheader("Подключение")
    
    api_url = st.text_input("API URL:", API_URL)
    
    st.subheader("Телеметрия")
    
    update_rate = st.slider("Частота обновления (Гц):", 1, 30, 10)
    
    st.subheader("Логирование")
    
    log_level = st.selectbox(
        "Уровень логирования:",
        ["DEBUG", "INFO", "WARNING", "ERROR"]
    )
    
    if st.button("💾 Сохранить настройки", use_container_width=True):
        st.success("Настройки сохранены!")
