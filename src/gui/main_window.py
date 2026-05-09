"""
================================================================================
GUI Application - PyQt6 интерфейс для управления дроном

Возможности:
- Управление дроном через кнопки
- Визуализация телеметрии в реальном времени
- Просмотр видео с камер
- Drag-and-drop планирование миссий
- Офлайн работа
================================================================================
"""
import sys
import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QFrame, QGridLayout, QTabWidget,
    QGroupBox, QSlider, QProgressBar, QTextEdit, QLineEdit,
    QComboBox, QSpinBox, QDoubleSpinBox, QTableWidget, QTableWidgetItem,
    QHeaderView, QMessageBox, QFileDialog, QSplitter, QTreeWidget,
    QTreeWidgetItem, QCheckBox, QMenuBar, QMenu, QStatusBar
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QRunnable, QThreadPool
from PyQt6.QtGui import QFont, QPalette, QColor, QIcon, QPixmap, QImage

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class TelemetryWorker(QThread):
    """Worker для обновления телеметрии"""
    telemetry_updated = pyqtSignal(dict)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.running = True
    
    def run(self):
        while self.running:
            # Демо данные
            telemetry = {
                "position": {"x": 0, "y": 0, "z": 10, "lat": 55.7558, "lon": 37.6173},
                "velocity": {"vx": 0, "vy": 0, "vz": 0},
                "attitude": {"roll": 0, "pitch": 0, "yaw": 0},
                "battery": 85.5,
                "timestamp": datetime.now().isoformat()
            }
            self.telemetry_updated.emit(telemetry)
            self.msleep(100)  # 10 Hz
    
    def stop(self):
        self.running = False


class MainWindow(QMainWindow):
    """Главное окно приложения"""
    
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("COBA AI Drone Agent v4.0 - GUI Control")
        self.setMinimumSize(1400, 900)
        
        # Темная тема
        self.apply_dark_theme()
        
        # Центральный виджет
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Главный layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setSpacing(10)
        main_layout.setContentsMargins(10, 10, 10, 10)
        
        # Левая панель - управление
        left_panel = self.create_left_panel()
        main_layout.addWidget(left_panel, 1)
        
        # Центральная панель - телеметрия и видео
        center_panel = self.create_center_panel()
        main_layout.addWidget(center_panel, 3)
        
        # Правая панель - статус и логи
        right_panel = self.create_right_panel()
        main_layout.addWidget(right_panel, 1)
        
        # Меню
        self.create_menu()
        
        # Статус бар
        self.statusBar().showMessage("Готов к работе")
        
        # Таймер обновления
        self.telemetry_worker = TelemetryWorker()
        self.telemetry_worker.telemetry_updated.connect(self.update_telemetry)
        self.telemetry_worker.start()
        
        # Лог
        self.log_message("🚀 GUI приложение запущено")
        self.log_message("📡 Ожидание подключения к агенту...")
    
    def apply_dark_theme(self):
        """Применение темной темы"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1e1e1e;
            }
            QWidget {
                background-color: #2d2d2d;
                color: #ffffff;
                font-family: 'Segoe UI', Arial;
                font-size: 11px;
            }
            QGroupBox {
                border: 2px solid #3d3d3d;
                border-radius: 5px;
                margin-top: 10px;
                padding-top: 10px;
                font-weight: bold;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QPushButton {
                background-color: #0d6efd;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0b5ed7;
            }
            QPushButton:pressed {
                background-color: #0a58ca;
            }
            QPushButton:disabled {
                background-color: #6c757d;
            }
            QPushButton#danger {
                background-color: #dc3545;
            }
            QPushButton#danger:hover {
                background-color: #bb2d3b;
            }
            QPushButton#success {
                background-color: #198754;
            }
            QPushButton#success:hover {
                background-color: #157347;
            }
            QLineEdit, QTextEdit, QComboBox {
                background-color: #3d3d3d;
                border: 1px solid #4d4d4d;
                border-radius: 4px;
                padding: 5px;
            }
            QProgressBar {
                border: 1px solid #4d4d4d;
                border-radius: 4px;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #0d6efd;
                border-radius: 3px;
            }
            QSlider::groove:horizontal {
                height: 8px;
                background: #3d3d3d;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background: #0d6efd;
                width: 18px;
                margin: -5px 0;
                border-radius: 9px;
            }
            QTabWidget::pane {
                border: 1px solid #3d3d3d;
                background-color: #2d2d2d;
            }
            QTabBar::tab {
                background-color: #3d3d3d;
                padding: 8px 16px;
                margin-right: 2px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
            }
            QTabBar::tab:selected {
                background-color: #0d6efd;
            }
            QTableWidget {
                background-color: #2d2d2d;
                gridline-color: #3d3d3d;
            }
            QHeaderView::section {
                background-color: #3d3d3d;
                padding: 5px;
                border: none;
                font-weight: bold;
            }
            QTreeWidget {
                background-color: #2d2d2d;
            }
            QMenuBar {
                background-color: #2d2d2d;
            }
            QMenuBar::item:selected {
                background-color: #0d6efd;
            }
            QMenu {
                background-color: #2d2d2d;
                border: 1px solid #3d3d3d;
            }
            QMenu::item:selected {
                background-color: #0d6efd;
            }
            QLabel#value {
                color: #0dcaf0;
                font-family: 'Consolas', monospace;
                font-size: 12px;
            }
            QLabel#label {
                color: #adb5bd;
            }
        """)
    
    def create_left_panel(self) -> QWidget:
        """Создание левой панели управления"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setSpacing(10)
        
        # Группа: Основное управление
        control_group = QGroupBox("🎮 Основное управление")
        control_layout = QVBoxLayout()
        
        self.btn_arm = QPushButton("🔒 ARM (Вооружить)")
        self.btn_arm.setObjectName("success")
        self.btn_arm.clicked.connect(self.on_arm)
        control_layout.addWidget(self.btn_arm)
        
        self.btn_disarm = QPushButton("🔓 DISARM (Разоружить)")
        self.btn_disarm.clicked.connect(self.on_disarm)
        control_layout.addWidget(self.btn_disarm)
        
        self.btn_takeoff = QPushButton("🚁 ВЗЛЕТ")
        self.btn_takeoff.setObjectName("success")
        self.btn_takeoff.clicked.connect(self.on_takeoff)
        control_layout.addWidget(self.btn_takeoff)
        
        self.btn_land = QPushButton("🛬 ПОСАДКА")
        self.btn_land.setObjectName("danger")
        self.btn_land.clicked.connect(self.on_land)
        control_layout.addWidget(self.btn_land)
        
        self.btn_rtl = QPushButton("🏠 RTL (Вернуться домой)")
        self.btn_rtl.setObjectName("danger")
        self.btn_rtl.clicked.connect(self.on_rtl)
        control_layout.addWidget(self.btn_rtl)
        
        self.btn_hover = QPushButton("⏸️ ЗАВИСАНИЕ")
        self.btn_hover.clicked.connect(self.on_hover)
        control_layout.addWidget(self.btn_hover)
        
        control_group.setLayout(control_layout)
        layout.addWidget(control_group)
        
        # Группа: Миссии
        mission_group = QGroupBox("🎯 Миссии")
        mission_layout = QVBoxLayout()
        
        self.btn_new_mission = QPushButton("📋 Новая миссия")
        self.btn_new_mission.clicked.connect(self.on_new_mission)
        mission_layout.addWidget(self.btn_new_mission)
        
        self.btn_start_mission = QPushButton("▶️ Запустить миссию")
        self.btn_start_mission.setObjectName("success")
        self.btn_start_mission.clicked.connect(self.on_start_mission)
        mission_layout.addWidget(self.btn_start_mission)
        
        self.btn_stop_mission = QPushButton("⏹️ Остановить миссию")
        self.btn_stop_mission.setObjectName("danger")
        self.btn_stop_mission.clicked.connect(self.on_stop_mission)
        mission_layout.addWidget(self.btn_stop_mission)
        
        mission_group.setLayout(mission_layout)
        layout.addWidget(mission_group)
        
        # Группа: Запись полета
        record_group = QGroupBox("📹 Запись полета (OpenQ)")
        record_layout = QVBoxLayout()
        
        self.btn_start_record = QPushButton("🔴 Начать запись")
        self.btn_start_record.setObjectName("danger")
        self.btn_start_record.clicked.connect(self.on_start_record)
        record_layout.addWidget(self.btn_start_record)
        
        self.btn_stop_record = QPushButton("⏹️ Остановить запись")
        self.btn_stop_record.clicked.connect(self.on_stop_record)
        record_layout.addWidget(self.btn_stop_record)
        
        self.lbl_record_status = QLabel("Статус: Не записывает")
        self.lbl_record_status.setStyleSheet("color: #6c757d;")
        record_layout.addWidget(self.lbl_record_status)
        
        record_group.setLayout(record_layout)
        layout.addWidget(record_group)
        
        # Растяжка
        layout.addStretch()
        
        return panel
    
    def create_center_panel(self) -> QWidget:
        """Создание центральной панели"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setSpacing(10)
        
        # Вкладки
        tabs = QTabWidget()
        
        # Вкладка: Телеметрия
        telemetry_tab = self.create_telemetry_tab()
        tabs.addTab(telemetry_tab, "📊 Телеметрия")
        
        # Вкладка: Видео
        video_tab = self.create_video_tab()
        tabs.addTab(video_tab, "📷 Камера")
        
        # Вкладка: Карта
        map_tab = self.create_map_tab()
        tabs.addTab(map_tab, "🗺️ Карта")
        
        # Вкладка: Моторы
        motors_tab = self.create_motors_tab()
        tabs.addTab(motors_tab, "⚙️ Моторы")
        
        # Вкладка: Mesh сеть
        mesh_tab = self.create_mesh_tab()
        tabs.addTab(mesh_tab, "🌐 Mesh")
        
        layout.addWidget(tabs)
        
        return panel
    
    def create_telemetry_tab(self) -> QWidget:
        """Вкладка телеметрии"""
        tab = QWidget()
        layout = QGridLayout(tab)
        layout.setSpacing(10)
        
        # Позиция
        pos_group = QGroupBox("📍 Позиция")
        pos_layout = QGridLayout()
        
        pos_layout.addWidget(QLabel("Широта:", objectName="label"), 0, 0)
        self.lbl_lat = QLabel("0.000000", objectName="value")
        pos_layout.addWidget(self.lbl_lat, 0, 1)
        
        pos_layout.addWidget(QLabel("Долгота:", objectName="label"), 1, 0)
        self.lbl_lon = QLabel("0.000000", objectName="value")
        pos_layout.addWidget(self.lbl_lon, 1, 1)
        
        pos_layout.addWidget(QLabel("Высота:", objectName="label"), 2, 0)
        self.lbl_alt = QLabel("0.0 м", objectName="value")
        pos_layout.addWidget(self.lbl_alt, 2, 1)
        
        pos_group.setLayout(pos_layout)
        layout.addWidget(pos_group, 0, 0)
        
        # Скорость
        vel_group = QGroupBox("💨 Скорость")
        vel_layout = QGridLayout()
        
        vel_layout.addWidget(QLabel("VX:", objectName="label"), 0, 0)
        self.lbl_vx = QLabel("0.0 м/с", objectName="value")
        vel_layout.addWidget(self.lbl_vx, 0, 1)
        
        vel_layout.addWidget(QLabel("VY:", objectName="label"), 1, 0)
        self.lbl_vy = QLabel("0.0 м/с", objectName="value")
        vel_layout.addWidget(self.lbl_vy, 1, 1)
        
        vel_layout.addWidget(QLabel("VZ:", objectName="label"), 2, 0)
        self.lbl_vz = QLabel("0.0 м/с", objectName="value")
        vel_layout.addWidget(self.lbl_vz, 2, 1)
        
        vel_group.setLayout(vel_layout)
        layout.addWidget(vel_group, 0, 1)
        
        # Ориентация
        att_group = QGroupBox("🧭 Ориентация")
        att_layout = QGridLayout()
        
        att_layout.addWidget(QLabel("Крен:", objectName="label"), 0, 0)
        self.lbl_roll = QLabel("0.0°", objectName="value")
        att_layout.addWidget(self.lbl_roll, 0, 1)
        
        att_layout.addWidget(QLabel("Тангаж:", objectName="label"), 1, 0)
        self.lbl_pitch = QLabel("0.0°", objectName="value")
        att_layout.addWidget(self.lbl_pitch, 1, 1)
        
        att_layout.addWidget(QLabel("Рысканье:", objectName="label"), 2, 0)
        self.lbl_yaw = QLabel("0.0°", objectName="value")
        att_layout.addWidget(self.lbl_yaw, 2, 1)
        
        att_group.setLayout(att_layout)
        layout.addWidget(att_group, 0, 2)
        
        # Батарея
        batt_group = QGroupBox("🔋 Батарея")
        batt_layout = QVBoxLayout()
        
        self.progress_battery = QProgressBar()
        self.progress_battery.setRange(0, 100)
        self.progress_battery.setValue(85)
        self.progress_battery.setTextVisible(True)
        batt_layout.addWidget(self.progress_battery)
        
        self.lbl_battery = QLabel("85.5% | 12.4V | 5.2A", objectName="value")
        batt_layout.addWidget(self.lbl_battery)
        
        batt_group.setLayout(batt_layout)
        layout.addWidget(batt_group, 1, 0, 1, 3)
        
        # Графики (заглушки)
        charts_group = QGroupBox("📈 Графики")
        charts_layout = QVBoxLayout()
        charts_layout.addWidget(QLabel("Графики телеметрии будут здесь"))
        charts_group.setLayout(charts_layout)
        layout.addWidget(charts_group, 2, 0, 1, 3)
        
        return tab
    
    def create_video_tab(self) -> QWidget:
        """Вкладка видео"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Выбор источника
        source_layout = QHBoxLayout()
        source_layout.addWidget(QLabel("Источник:"))
        
        self.cmb_video_source = QComboBox()
        self.cmb_video_source.addItems([
            "Основная камера",
            "Тепловизор",
            "LIDAR",
            "Камера 2"
        ])
        source_layout.addWidget(self.cmb_video_source)
        
        self.btn_connect_video = QPushButton("Подключить")
        self.btn_connect_video.clicked.connect(self.on_connect_video)
        source_layout.addWidget(self.btn_connect_video)
        
        source_layout.addStretch()
        layout.addLayout(source_layout)
        
        # Видео плеер (заглушка)
        video_frame = QFrame()
        video_frame.setStyleSheet("background-color: #000000; border-radius: 5px;")
        video_frame.setMinimumHeight(400)
        video_layout = QVBoxLayout(video_frame)
        
        self.lbl_video = QLabel("Нет сигнала")
        self.lbl_video.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_video.setStyleSheet("color: #6c757d; font-size: 18px;")
        video_layout.addWidget(self.lbl_video)
        
        layout.addWidget(video_frame)
        
        # Управление камерой
        cam_control = QHBoxLayout()
        
        self.btn_cam_up = QPushButton("⬆️")
        self.btn_cam_down = QPushButton("⬇️")
        self.btn_cam_left = QPushButton("⬅️")
        self.btn_cam_right = QPushButton("➡️")
        self.btn_cam_center = QPushButton("⏺️ Центр")
        
        cam_control.addWidget(self.btn_cam_up)
        cam_control.addWidget(self.btn_cam_down)
        cam_control.addWidget(self.btn_cam_left)
        cam_control.addWidget(self.btn_cam_right)
        cam_control.addWidget(self.btn_cam_center)
        cam_control.addStretch()
        
        layout.addLayout(cam_control)
        
        return tab
    
    def create_map_tab(self) -> QWidget:
        """Вкладка карты"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Заглушка для карты
        map_frame = QFrame()
        map_frame.setStyleSheet("background-color: #1a1a1a; border-radius: 5px;")
        map_frame.setMinimumHeight(400)
        map_layout = QVBoxLayout(map_frame)
        
        self.lbl_map = QLabel("Карта полета\n(Интеграция с картографическим сервисом)")
        self.lbl_map.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_map.setStyleSheet("color: #6c757d; font-size: 14px;")
        map_layout.addWidget(self.lbl_map)
        
        layout.addWidget(map_frame)
        
        # Точки маршрута
        waypoints_group = QGroupBox("📍 Точки маршрута")
        waypoints_layout = QVBoxLayout()
        
        self.table_waypoints = QTableWidget()
        self.table_waypoints.setColumnCount(4)
        self.table_waypoints.setHorizontalHeaderLabels(["#", "Lat", "Lon", "Alt"])
        self.table_waypoints.horizontalHeader().setStretchLastSection(True)
        waypoints_layout.addWidget(self.table_waypoints)
        
        btn_add_wp = QPushButton("➕ Добавить точку")
        btn_add_wp.clicked.connect(self.on_add_waypoint)
        waypoints_layout.addWidget(btn_add_wp)
        
        btn_clear_wp = QPushButton("🗑️ Очистить")
        btn_clear_wp.clicked.connect(self.on_clear_waypoints)
        waypoints_layout.addWidget(btn_clear_wp)
        
        waypoints_group.setLayout(waypoints_layout)
        layout.addWidget(waypoints_group)
        
        return tab
    
    def create_motors_tab(self) -> QWidget:
        """Вкладка моторов"""
        tab = QWidget()
        layout = QGridLayout(tab)
        
        # Статус моторов
        for i in range(4):
            motor_group = QGroupBox(f"Мотор {i+1}")
            motor_layout = QVBoxLayout()
            
            lbl_status = QLabel(f"Статус: {'Работает' if i < 2 else 'Ожидание'}")
            motor_layout.addWidget(lbl_status)
            
            progress = QProgressBar()
            progress.setRange(1000, 2000)
            progress.setValue(1200 if i < 2 else 1000)
            motor_layout.addWidget(progress)
            
            lbl_temp = QLabel(f"Темп: {25 + i*2}°C")
            motor_layout.addWidget(lbl_temp)
            
            motor_group.setLayout(motor_layout)
            layout.addWidget(motor_group, i // 2, i % 2)
        
        return tab
    
    def create_mesh_tab(self) -> QWidget:
        """Вкладка Mesh сети"""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Статус сети
        status_group = QGroupBox("🌐 Статус сети")
        status_layout = QGridLayout()
        
        status_layout.addWidget(QLabel("Узел:"), 0, 0)
        self.lbl_mesh_node = QLabel("drone_001")
        status_layout.addWidget(self.lbl_mesh_node, 0, 1)
        
        status_layout.addWidget(QLabel("Узлов онлайн:"), 1, 0)
        self.lbl_mesh_nodes = QLabel("1")
        status_layout.addWidget(self.lbl_mesh_nodes, 1, 1)
        
        status_layout.addWidget(QLabel("Сообщений:"), 2, 0)
        self.lbl_mesh_messages = QLabel("Отправлено: 0 | Получено: 0")
        status_layout.addWidget(self.lbl_mesh_messages, 2, 1)
        
        status_group.setLayout(status_layout)
        layout.addWidget(status_group)
        
        # Список соседей
        neighbors_group = QGroupBox("👥 Соседи")
        neighbors_layout = QVBoxLayout()
        
        self.tree_neighbors = QTreeWidget()
        self.tree_neighbors.setHeaderLabels(["Узел", "Тип", "Сигнал", "Статус"])
        neighbors_layout.addWidget(self.tree_neighbors)
        
        neighbors_group.setLayout(neighbors_layout)
        layout.addWidget(neighbors_group)
        
        return tab
    
    def create_right_panel(self) -> QWidget:
        """Создание правой панели"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setSpacing(10)
        
        # Статус агента
        status_group = QGroupBox("🤖 Статус агента")
        status_layout = QVBoxLayout()
        
        self.lbl_agent_state = QLabel("● Готов")
        self.lbl_agent_state.setStyleSheet("color: #198754; font-weight: bold;")
        status_layout.addWidget(self.lbl_agent_state)
        
        self.lbl_mission = QLabel("Миссия: Нет")
        status_layout.addWidget(self.lbl_mission)
        
        self.lbl_queue = QLabel("Очередь: 0")
        status_layout.addWidget(self.lbl_queue)
        
        status_group.setLayout(status_layout)
        layout.addWidget(status_group)
        
        # Лог
        log_group = QGroupBox("📝 Лог событий")
        log_layout = QVBoxLayout()
        
        self.txt_log = QTextEdit()
        self.txt_log.setReadOnly(True)
        self.txt_log.setMaximumBlockCount(1000)
        log_layout.addWidget(self.txt_log)
        
        btn_clear_log = QPushButton("🗑️ Очистить")
        btn_clear_log.clicked.connect(self.on_clear_log)
        log_layout.addWidget(btn_clear_log)
        
        log_group.setLayout(log_layout)
        layout.addWidget(log_group)
        
        return panel
    
    def create_menu(self):
        """Создание меню"""
        menubar = self.menuBar()
        
        # Файл
        file_menu = menubar.addMenu("📁 Файл")
        
        action_new_mission = file_menu.addAction("📝 Новая миссия")
        action_new_mission.triggered.connect(self.on_new_mission)
        
        action_load_mission = file_menu.addAction("📂 Загрузить миссию")
        action_load_mission.triggered.connect(self.on_load_mission)
        
        action_save_mission = file_menu.addAction("💾 Сохранить миссию")
        action_save_mission.triggered.connect(self.on_save_mission)
        
        file_menu.addSeparator()
        
        action_exit = file_menu.addAction("🚪 Выход")
        action_exit.triggered.connect(self.close)
        
        # Настройки
        settings_menu = menubar.addMenu("⚙️ Настройки")
        
        action_connection = settings_menu.addAction("🔌 Подключение")
        action_connection.triggered.connect(self.on_settings_connection)
        
        action_telemetry = settings_menu.addAction("📊 Телеметрия")
        action_telemetry.triggered.connect(self.on_settings_telemetry)
        
        # Помощь
        help_menu = menubar.addMenu("❓ Помощь")
        
        action_about = help_menu.addAction("ℹ️ О программе")
        action_about.triggered.connect(self.on_about)
    
    # ========== Обработчики событий ==========
    
    def on_arm(self):
        self.log_message("🔒 ARM: Вооружение моторов...")
        self.statusBar().showMessage("Моторы вооружены")
    
    def on_disarm(self):
        self.log_message("🔓 DISARM: Разоружение моторов...")
        self.statusBar().showMessage("Моторы разоружены")
    
    def on_takeoff(self):
        self.log_message("🚁 ВЗЛЕТ: Набор высоты...")
        self.statusBar().showMessage("Взлет")
    
    def on_land(self):
        self.log_message("🛬 ПОСАДКА: Снижение...")
        self.statusBar().showMessage("Посадка")
    
    def on_rtl(self):
        self.log_message("🏠 RTL: Возврат домой...")
        self.statusBar().showMessage("RTL")
    
    def on_hover(self):
        self.log_message("⏸️ ЗАВИСАНИЕ: Удержание позиции...")
        self.statusBar().showMessage("Зависание")
    
    def on_new_mission(self):
        self.log_message("📝 Создание новой миссии...")
    
    def on_start_mission(self):
        self.log_message("▶️ Запуск миссии...")
    
    def on_stop_mission(self):
        self.log_message("⏹️ Остановка миссии...")
    
    def on_start_record(self):
        self.lbl_record_status.setText("Статус: 🔴 ЗАПИСЬ")
        self.lbl_record_status.setStyleSheet("color: #dc3545; font-weight: bold;")
        self.log_message("🔴 Начата запись полета")
    
    def on_stop_record(self):
        self.lbl_record_status.setText("Статус: Не записывает")
        self.lbl_record_status.setStyleSheet("color: #6c757d;")
        self.log_message("⏹️ Запись остановлена")
    
    def on_connect_video(self):
        source = self.cmb_video_source.currentText()
        self.log_message(f"📷 Подключение к {source}...")
        self.lbl_video.setText(f"Подключено: {source}\n(Видеопоток)")
    
    def on_add_waypoint(self):
        row = self.table_waypoints.rowCount()
        self.table_waypoints.insertRow(row)
        self.table_waypoints.setItem(row, 0, QTableWidgetItem(str(row + 1)))
        self.table_waypoints.setItem(row, 1, QTableWidgetItem("55.7558"))
        self.table_waypoints.setItem(row, 2, QTableWidgetItem("37.6173"))
        self.table_waypoints.setItem(row, 3, QTableWidgetItem("50"))
        self.log_message(f"📍 Добавлена точка маршрута #{row + 1}")
    
    def on_clear_waypoints(self):
        self.table_waypoints.setRowCount(0)
        self.log_message("🗑️ Точки маршрута очищены")
    
    def on_clear_log(self):
        self.txt_log.clear()
    
    def on_load_mission(self):
        filename, _ = QFileDialog.getOpenFileName(
            self, "Загрузить миссию", "data/missions", "JSON (*.json)"
        )
        if filename:
            self.log_message(f"📂 Миссия загружена: {filename}")
    
    def on_save_mission(self):
        filename, _ = QFileDialog.getSaveFileName(
            self, "Сохранить миссию", "data/missions", "JSON (*.json)"
        )
        if filename:
            self.log_message(f"💾 Миссия сохранена: {filename}")
    
    def on_settings_connection(self):
        self.log_message("⚙️ Открыты настройки подключения")
    
    def on_settings_telemetry(self):
        self.log_message("⚙️ Открыты настройки телеметрии")
    
    def on_about(self):
        QMessageBox.about(
            self,
            "О программе",
            """<h2>COBA AI Drone Agent v4.0</h2>
            <p>Графический интерфейс управления дроном</p>
            <p><b>Возможности:</b></p>
            <ul>
                <li>Управление дроном в реальном времени</li>
                <li>Мониторинг телеметрии</li>
                <li>Просмотр видео с камер</li>
                <li>Планирование миссий</li>
                <li>Запись полетных данных</li>
            </ul>
            <p>Версия: 4.0.0</p>
            """
        )
    
    def update_telemetry(self, telemetry: dict):
        """Обновление отображения телеметрии"""
        pos = telemetry.get("position", {})
        vel = telemetry.get("velocity", {})
        att = telemetry.get("attitude", {})
        
        self.lbl_lat.setText(f"{pos.get('lat', 0):.6f}")
        self.lbl_lon.setText(f"{pos.get('lon', 0):.6f}")
        self.lbl_alt.setText(f"{pos.get('z', 0):.1f} м")
        
        self.lbl_vx.setText(f"{vel.get('vx', 0):.1f} м/с")
        self.lbl_vy.setText(f"{vel.get('vy', 0):.1f} м/с")
        self.lbl_vz.setText(f"{vel.get('vz', 0):.1f} м/с")
        
        self.lbl_roll.setText(f"{att.get('roll', 0):.1f}°")
        self.lbl_pitch.setText(f"{att.get('pitch', 0):.1f}°")
        self.lbl_yaw.setText(f"{att.get('yaw', 0):.1f}°")
        
        battery = telemetry.get("battery", 0)
        self.progress_battery.setValue(int(battery))
        self.lbl_battery.setText(f"{battery:.1f}% | 12.4V | 5.2A")
    
    def log_message(self, message: str):
        """Добавление сообщения в лог"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.txt_log.append(f"[{timestamp}] {message}")
    
    def closeEvent(self, event):
        """Обработка закрытия окна"""
        self.telemetry_worker.stop()
        self.telemetry_worker.wait()
        event.accept()


def main():
    """Запуск GUI приложения"""
    app = QApplication(sys.argv)
    app.setApplicationName("COBA AI Drone Agent")
    app.setApplicationVersion("4.0.0")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
