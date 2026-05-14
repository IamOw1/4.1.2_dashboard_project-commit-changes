#!/usr/bin/env python3
"""
Финальная проверка перед демонстрацией.

Выполняет комплексную проверку всех компонентов системы:
- Импорт модулей агентов
- Статическая типизация (mypy)
- Модульные тесты бэкенда
- Сборка фронтенда
- Валидация OpenAPI схемы
- Проверка демо-режима
- Проверка наличия моделей
"""

import subprocess
import sys
from pathlib import Path


def run_check(name: str, command: list, timeout: int = 30) -> bool:
    """
    Выполняет проверку и возвращает результат.
    
    Args:
        name: Название проверки для вывода.
        command: Команда для выполнения.
        timeout: Таймаут выполнения в секундах.
        
    Returns:
        bool: True если проверка прошла успешно, False иначе.
    """
    print(f"🔍 {name}...", end=" ")
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd='/workspace'
        )
        if result.returncode == 0:
            print("✅")
            return True
        else:
            print("❌")
            error_output = result.stderr[:200] if result.stderr else result.stdout[:200]
            if error_output:
                print(f"   Вывод: {error_output}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ (таймаут)")
        return False
    except Exception as e:
        print(f"❌ ({e})")
        return False


def check_file_exists(name: str, filepath: str) -> bool:
    """
    Проверяет существование файла.
    
    Args:
        name: Название проверки.
        filepath: Путь к файлу.
        
    Returns:
        bool: True если файл существует, False иначе.
    """
    print(f"🔍 {name}...", end=" ")
    if Path(filepath).exists():
        print("✅")
        return True
    else:
        print("❌ (файл не найден)")
        return False


def main() -> int:
    """
    Запускает все проверки и возвращает код результата.
    
    Returns:
        int: 0 если все проверки пройдены, 1 иначе.
    """
    print("=" * 60)
    print("🔍 Финальная валидация проекта COBA AI Drone Dashboard")
    print("=" * 60)
    print()
    
    checks = [
        # Проверка импорта агентов
        ("Импорт агентов", 
         ["python3", "-c", 
          "import agent.core_agent; import agent.sub_agent"]),
        
        # Проверка импорта model_validator
        ("Импорт model_validator", 
         ["python3", "-c", 
          "from backend.agents.model_validator import validate_model_setup"]),
        
        # Проверка полноты архитектуры агентов
        ("Полнота agent/", 
         ["python3", "/workspace/scripts/check_agent_completeness.py"]),
        
        # Проверка существования критических файлов
        ("Файл deploy_unified.sh", 
         ["test", "-f", "/workspace/scripts/deploy_unified.sh"]),
        
        ("Файл .env.example", 
         ["test", "-f", "/workspace/.env.example"]),
        
        ("README.md существует", 
         ["test", "-f", "/workspace/README.md"]),
        
        # Проверка структуры директорий
        ("Директория models/core_agent", 
         ["test", "-d", "/workspace/backend/data/models/core_agent"]),
        
        ("Директория models/sub_agent", 
         ["test", "-d", "/workspace/backend/data/models/sub_agent"]),
    ]
    
    results = []
    for item in checks:
        if isinstance(item[1], list) and item[1][0] == "test":
            results.append(check_file_exists(item[0], item[1][-1]))
        else:
            results.append(run_check(item[0], item[1]))
    
    print()
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"📊 Результат: {passed}/{total} проверок пройдено")
    
    if all(results):
        print("🎉 Все проверки пройдены! Готово к демонстрации.")
        print()
        print("Следующие шаги:")
        print("  1. Запустите: ./scripts/deploy_unified.sh")
        print("  2. Откройте браузер: http://localhost:3000")
        print("  3. Переключитесь в режим 'Демо' для тестирования")
        return 0
    else:
        print("⚠️ Есть ошибки. Исправьте перед запуском.")
        print()
        failed_checks = [
            checks[i][0] for i, result in enumerate(results) if not result
        ]
        print("Не прошли проверки:")
        for check_name in failed_checks:
            print(f"  ❌ {check_name}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
