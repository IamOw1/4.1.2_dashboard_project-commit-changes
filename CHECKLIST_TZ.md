# Чеклист соответствия ТЗ (COBA AI v4.1.2)

Статусы: **готово** | **исправлено** | **ограничение**

| Пункт ТЗ | Статус | Примечание |
|----------|--------|------------|
| On-premise на ноутбуке | **готово** | `DEMO_MODE=true`, без AirSim/Ollama обязательности |
| Демо без железа | **готово** | `agent/core.py` — `_initialize_demo`, WebSocket шлёт данные без агента |
| RC / эмуляция | **ограничение** | Реальный RC через `hardware/rc_input`; по умолчанию `RC_SOURCE=mock` в `install.ps1` / `.env.example` |
| Заглушки Core / Sub-Agent | **готово** | Core: `DroneIntelligentAgent`; Sub: `SubAgent.ask` через `/api/v1/sub_agent/ask`; UI чат вызывает API с fallback |
| ≥8 вкладок + закреплённый чат | **готово** | Sidebar: 12 пунктов; `AIChat` закреплён в `__root.tsx` |
| Синхронизация FE ↔ BE | **исправлено** | Удалены дубликаты маршрутов в `api/rest_api.py`; добавлены `/api/v1/settings`, `/api/v1/sensors/*`; `Logger` для событий; `AmorfusTool`/`ObjectDetectionTool` — методы под REST |
| config / .env | **исправлено** | `.env.example` без секретов, `VITE_API_URL`; `install.ps1` — `DEMO_MODE`, `RC_SOURCE=mock` |
| Документация / ссылки на репо | **исправлено** | README: `4.1.2_dashboard_project-commit-changes.git`, убран захардкоженный API-ключ |
| Логирование | **исправлено** | Разделение `logger` / `event_log`; файлы в `logs/` (`utils/logger.py`) |
| Зависимости `agent/core` | **исправлено** | Добавлен модуль `agent/core.py` (ранее отсутствовал, `ModuleNotFoundError`) |

## Команды проверки

```powershell
cd 4.1.2_dashboard_project-commit-changes
pip install -r requirements.txt
npm install
python main.py check
python main.py api   # терминал 1
npm run dev          # терминал 2 — http://localhost:3000
```

Или: `.\install.ps1 -SkipLLM` затем `python main.py all` (API + Vite из `main.py`).

```bash
pytest tests/unit/ -q --tb=no
npm run build
```

Сборка фронтенда: добавлены `autoprefixer`, `@tailwindcss/postcss`, `react-is`; в корне [`.npmrc`](.npmrc) — `legacy-peer-deps=true` для React 19 / react-leaflet.

`mypy --strict` по всему репозиторию не входит в обязательный gate (нет единого mypy.ini под весь монорепо); при необходимости запускайте выборочно для `agent/` и `api/`.
