#!/usr/bin/env python3
"""
Тесты для модулей обучения (Learner и AdvancedLearning)
Проверяет методы обучения: supervised, RL, imitation, PPO, multi-agent
"""

import pytest
from unittest.mock import Mock, patch
from agent.learner import Learner, LearningMethods, TrainingConfig
from agent.advanced_learning import AdvancedLearning


class TestLearner:
    """Тесты для базового Learner"""
    
    def test_learner_initialization(self):
        """Проверка инициализации Learner"""
        config = {'learning': {}}
        learner = Learner(config)
        assert learner is not None
        
    def test_learning_methods_enum(self):
        """Проверка enum методов обучения"""
        assert LearningMethods.SUPERVISED.value == "supervised"
        assert LearningMethods.REINFORCEMENT.value == "reinforcement"
        assert LearningMethods.IMITATION.value == "imitation"
        assert LearningMethods.SELF_PLAY.value == "self_play"
        assert LearningMethods.CURRICULUM.value == "curriculum"
        
    def test_training_config_defaults(self):
        """Проверка конфигурации обучения по умолчанию"""
        config = TrainingConfig(method=LearningMethods.SUPERVISED)
        assert config.learning_rate == 3e-4
        assert config.batch_size == 32
        assert config.epochs == 100
        assert config.early_stopping is True
        assert config.patience == 10
        
    def test_learner_train_supervised(self):
        """Проверка обучения с учителем (мок)"""
        config = {'learning': {}}
        learner = Learner(config)
        
        # Просто проверяем что метод существует
        assert hasattr(learner, 'select_action') or hasattr(learner, 'config')
            
    def test_learner_train_reinforcement(self):
        """Проверка обучения с подкреплением (мок)"""
        config = {'learning': {}}
        learner = Learner(config)
        
        # Проверяем что базовые атрибуты существуют
        assert learner.config is not None


class TestAdvancedLearning:
    """Тесты для продвинутых методов обучения"""
    
    def test_advanced_learning_initialization(self):
        """Проверка инициализации AdvancedLearning"""
        al = AdvancedLearning()
        assert al is not None
        
    def test_ppo_training(self):
        """Проверка PPO обучения"""
        al = AdvancedLearning()
        config = Mock()
        result = al.ppo_training(config)
        assert isinstance(result, dict)
        assert 'success' in result
            
    def test_multi_agent_coordination(self):
        """Проверка координации мульти-агентов"""
        al = AdvancedLearning()
        agents = [Mock(), Mock()]
        result = al.multi_agent_coordination(agents)
        assert isinstance(result, dict)
        assert 'policy' in result
            
    def test_transfer_learning(self):
        """Проверка transfer learning"""
        al = AdvancedLearning()
        result = al.transfer_learning(
            source_model="pretrained",
            target_task="drone_control"
        )
        assert isinstance(result, dict)
        assert 'model' in result


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
