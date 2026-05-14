"""
Интеграционные тесты API
"""
import pytest
from fastapi.testclient import TestClient

from api.rest_api import create_app


@pytest.fixture
def client():
    """Фикстура для тестового клиента"""
    app = create_app()
    return TestClient(app)


def test_root_endpoint(client):
    """Тест корневого эндпоинта"""
    response = client.get("/")
    
    assert response.status_code == 200
    assert response.json()["name"] == "COBA AI Drone Agent API"


def test_health_check(client):
    """Тест проверки здоровья"""
    response = client.get("/health")
    
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_agent_status_without_agent(client):
    """Тест статуса агента без инициализации"""
    response = client.get("/api/v1/agent/status")
    
    assert response.status_code == 503


def test_telemetry_without_agent(client):
    """Тест телеметрии без инициализации"""
    response = client.get("/api/v1/telemetry")
    
    assert response.status_code == 503


def test_tools_without_agent(client):
    """Тест списка инструментов без инициализации"""
    response = client.get("/api/v1/tools")
    
    assert response.status_code == 503


def test_mission_status_without_agent(client):
    """Тест статуса миссии без инициализации"""
    response = client.get("/api/v1/mission/status")
    
    assert response.status_code == 503


def test_learning_progress_without_agent(client):
    """Тест прогресса обучения без инициализации"""
    response = client.get("/api/v1/learning/progress")
    
    assert response.status_code == 503


def test_system_self_test(client):
    """Самопроверка подсистем (настройки дашборда)."""
    response = client.post("/api/v1/system/self_test", json={})
    assert response.status_code == 200
    body = response.json()
    assert "checks" in body
    assert isinstance(body["checks"], list)


def test_runtime_demo_mode(client):
    """Переключение DEMO_MODE с дашборда."""
    response = client.post("/api/v1/runtime/demo_mode", json={"enabled": True})
    assert response.status_code == 200
    assert response.json().get("demo_mode") is True


def test_simulators_connect_and_status(client):
    """Регистрация сессии симулятора (без реального Webots)."""
    r1 = client.post(
        "/api/v1/simulators/connect",
        json={"simulator_id": "webots", "host": "127.0.0.1"},
    )
    assert r1.status_code == 200
    r2 = client.get("/api/v1/simulators/status")
    assert r2.status_code == 200
    assert r2.json()["session"]["simulator_id"] == "webots"
    r3 = client.post("/api/v1/simulators/disconnect", json={})
    assert r3.status_code == 200
