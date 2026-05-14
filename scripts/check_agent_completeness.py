#!/usr/bin/env python3
"""
Проверяет, что все файлы агентов на месте и импортируются без ошибок.
"""

import importlib.util
from pathlib import Path
import sys

REQUIRED_FILES = [
    "agent/__init__.py",
    "agent/core_agent.py",
    "agent/sub_agent.py",
    "agent/roles.py",
    "agent/llm_client.py",
    "agent/memory.py",
    "agent/decision_maker.py",
    "agent/learner.py",
    "agent/advanced_learning.py",
    "agent/config/decision_rules.yaml",
    "agent/config/training_presets.yaml",
    "agent/config/model_defaults.yaml",
    "agent/utils/model_loader.py",
    "agent/utils/telemetry_parser.py",
    "agent/utils/role_dispatcher.py",
]

PYTHON_MODULES = [
    "agent.core_agent",
    "agent.sub_agent",
    "agent.roles",
    "agent.llm_client",
    "agent.memory",
    "agent.decision_maker",
    "agent.learner",
    "agent.advanced_learning",
    "agent.utils.model_loader",
    "agent.utils.telemetry_parser",
    "agent.utils.role_dispatcher",
]

def check_files_exist():
    """Проверяет наличие всех требуемых файлов."""
    print("📁 Проверка наличия файлов...")
    errors = []
    for file_path in REQUIRED_FILES:
        full_path = Path(file_path)
        if not full_path.exists():
            errors.append(f"❌ Файл не найден: {file_path}")
        else:
            print(f"✅ {file_path}")
    return errors

def check_imports():
    """Проверяет импорты всех Python модулей."""
    print("\n🔗 Проверка импортов...")
    errors = []
    # Добавляем текущую директорию в path для импорта
    sys.path.insert(0, str(Path(__file__).parent.parent))
    for module_name in PYTHON_MODULES:
        try:
            importlib.import_module(module_name)
            print(f"✅ {module_name}")
        except Exception as e:
            errors.append(f"❌ {module_name}: {e}")
    return errors

def main():
    print("=" * 60)
    print("🔍 Проверка полноты архитектуры агентов")
    print("=" * 60)
    
    file_errors = check_files_exist()
    import_errors = check_imports()
    
    all_errors = file_errors + import_errors
    
    print("\n" + "=" * 60)
    if all_errors:
        print("❌ ОШИБКИ:")
        for e in all_errors:
            print(f"   {e}")
        print(f"\n📊 Найдено ошибок: {len(all_errors)}")
        return 1
    else:
        print("🎉 Все модули агентов на месте и загружаются корректно!")
        print("✅ Структура agent/ полная и функциональная")
        return 0

if __name__ == "__main__":
    sys.exit(main())
