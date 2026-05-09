"""
================================================================================
Тесты Mesh Network
================================================================================
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock

from src.network.mesh_network import MeshNetwork, MeshNode, MeshMessage, NodeType, MessageType


@pytest.fixture
def mesh_network():
    """Фикстура для Mesh Network"""
    config = {
        'node_id': 'test_node_001',
        'node_type': 'drone',
        'broadcast_port': 19000,
        'data_port': 19001,
        'heartbeat_interval': 1,
        'encryption': False
    }
    return MeshNetwork(config)


class TestMeshNetwork:
    """Тесты Mesh Network"""
    
    def test_initialization(self, mesh_network):
        """Тест инициализации"""
        assert mesh_network.node_id == 'test_node_001'
        assert mesh_network.node_type == NodeType.DRONE
        assert mesh_network.broadcast_port == 19000
        assert mesh_network.encryption_enabled is False
        assert len(mesh_network.nodes) == 0
    
    @pytest.mark.asyncio
    async def test_initialize(self, mesh_network):
        """Тест инициализации сети"""
        with patch.object(mesh_network, '_create_sockets'):
            result = await mesh_network.initialize()
            
            assert result is True
            assert mesh_network.is_running is True
            assert mesh_network.node_id in mesh_network.nodes
    
    def test_generate_message_id(self, mesh_network):
        """Тест генерации ID сообщения"""
        msg_id1 = mesh_network._generate_message_id()
        msg_id2 = mesh_network._generate_message_id()
        
        assert msg_id1 is not None
        assert len(msg_id1) == 16
        assert msg_id1 != msg_id2
    
    def test_register_handler(self, mesh_network):
        """Тест регистрации обработчика"""
        handler = Mock()
        
        mesh_network.register_handler(MessageType.TELEMETRY, handler)
        
        assert MessageType.TELEMETRY in mesh_network.message_handlers
        assert handler in mesh_network.message_handlers[MessageType.TELEMETRY]
    
    def test_get_network_status(self, mesh_network):
        """Тест получения статуса сети"""
        # Добавляем тестовые узлы
        mesh_network.nodes['node1'] = MeshNode(
            node_id='node1',
            node_type=NodeType.DRONE,
            address='127.0.0.1',
            port=9000,
            last_seen=__import__('datetime').datetime.now(),
            status='online'
        )
        
        status = mesh_network.get_network_status()
        
        assert status['node_id'] == 'test_node_001'
        assert status['nodes_online'] == 1
        assert status['nodes_total'] == 1
    
    @pytest.mark.asyncio
    async def test_send_to(self, mesh_network):
        """Тест отправки сообщения"""
        mesh_network.data_socket = Mock()
        
        # Добавляем тестовый узел
        mesh_network.nodes['target_node'] = MeshNode(
            node_id='target_node',
            node_type=NodeType.DRONE,
            address='127.0.0.1',
            port=9001,
            last_seen=__import__('datetime').datetime.now()
        )
        
        result = await mesh_network.send_to(
            'target_node',
            MessageType.COMMAND,
            {'command': 'test'}
        )
        
        assert result is True
        assert mesh_network.messages_sent == 1


class TestMeshNode:
    """Тесты класса MeshNode"""
    
    def test_node_creation(self):
        """Тест создания узла"""
        node = MeshNode(
            node_id='test_node',
            node_type=NodeType.OPERATOR,
            address='192.168.1.1',
            port=9000,
            last_seen=__import__('datetime').datetime.now()
        )
        
        assert node.node_id == 'test_node'
        assert node.node_type == NodeType.OPERATOR
        assert node.address == '192.168.1.1'


class TestMeshMessage:
    """Тесты класса MeshMessage"""
    
    def test_message_creation(self):
        """Тест создания сообщения"""
        message = MeshMessage(
            message_id='msg_001',
            message_type=MessageType.TELEMETRY,
            source='node1',
            destination='node2',
            payload={'data': 'test'},
            timestamp=__import__('datetime').datetime.now()
        )
        
        assert message.message_id == 'msg_001'
        assert message.message_type == MessageType.TELEMETRY
        assert message.ttl == 10
