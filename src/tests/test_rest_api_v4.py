"""
Smoke и сценарные тесты FastAPI v4 (src.api.rest_api), демо-режим без агента.
"""
import time

import pytest
from fastapi.testclient import TestClient

from src.api import rest_api


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(rest_api, "agent_instance", None)
    return TestClient(rest_api.app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "healthy"


def test_telemetry_demo(client):
    r = client.get("/api/v1/telemetry")
    assert r.status_code == 200
    body = r.json()
    assert "battery" in body
    assert "position" in body


def test_sub_agent_ask_demo(client):
    r = client.post("/api/v1/sub_agent/ask", json={"question": "test?"})
    assert r.status_code == 200
    j = r.json()
    assert "answer" in j
    assert j.get("offline") is True


def test_tools_list_demo(client):
    r = client.get("/api/v1/tools")
    assert r.status_code == 200
    assert "tools" in r.json()


def test_backup_list_demo(client):
    r = client.get("/api/v1/backup/list")
    assert r.status_code == 200
    assert "items" in r.json()


def test_events_demo(client):
    r = client.get("/api/v1/events?limit=10")
    assert r.status_code == 200
    assert "events" in r.json()


def test_learning_progress_demo(client):
    r = client.get("/api/v1/learning/progress")
    assert r.status_code == 200
    assert r.json().get("experimental") is True


def test_fleet_status_demo(client):
    r = client.get("/api/v1/fleet/status")
    assert r.status_code == 200
    assert "drones" in r.json()


def test_camera_snapshot_demo(client):
    r = client.get("/api/v1/camera/snapshot")
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")


def test_simulators_list(client):
    r = client.get("/api/v1/simulators")
    assert r.status_code == 200
    assert "simulators" in r.json()


def test_mission_lifecycle_demo(client):
    """start → running/progress → stop → stopped (демо, без агента)."""
    start = client.post(
        "/api/v1/mission/start",
        json={
            "name": "t",
            "waypoints": [{"x": 0, "y": 0, "z": 10}, {"x": 1, "y": 1, "z": 10}],
            "altitude": 10,
            "speed": 5,
            "mission_type": "Тестовая миссия",
        },
    )
    assert start.status_code == 200
    mid = start.json()["mission_id"]

    time.sleep(0.15)

    st = client.get("/api/v1/mission/status")
    assert st.status_code == 200
    active = st.json().get("active")
    assert active is not None
    assert active.get("state") == "running"

    stop = client.post("/api/v1/mission/stop")
    assert stop.status_code == 200

    time.sleep(0.05)

    st2 = client.get("/api/v1/mission/status")
    assert st2.json().get("active") is None


def test_emergency_stop_demo(client):
    r = client.post("/api/v1/emergency/stop")
    assert r.status_code == 200
    assert r.json().get("success") is True
