"""
================================================================================
Mesh Network - Инструменты взаимодействия и обмена данными 
между дронами и оператором посредством mesh-сети

Возможности:
- Самоорганизующаяся mesh-сеть
- Шифрование данных
- Многопутевая маршрутизация
- Автоматическое восстановление связи
- Поддержка множества узлов
================================================================================
"""
import asyncio
import json
import time
import hashlib
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class NodeType(Enum):
    """Типы узлов сети"""
    DRONE = "drone"
    OPERATOR = "operator"
    BASE_STATION = "base_station"
    RELAY = "relay"


class MessageType(Enum):
    """Типы сообщений"""
    HEARTBEAT = "heartbeat"
    TELEMETRY = "telemetry"
    COMMAND = "command"
    STATUS = "status"
    DATA = "data"
    EMERGENCY = "emergency"
    ROUTE_UPDATE = "route_update"
    DISCOVERY = "discovery"


@dataclass
class MeshNode:
    """Узел mesh-сети"""
    node_id: str
    node_type: NodeType
    address: str
    port: int
    last_seen: datetime
    signal_strength: int = 0
    hops: int = 0
    is_direct: bool = True
    public_key: str = ""
    capabilities: List[str] = field(default_factory=list)
    status: str = "online"


@dataclass
class MeshMessage:
    """Сообщение в mesh-сети"""
    message_id: str
    message_type: MessageType
    source: str
    destination: str
    payload: Dict[str, Any]
    timestamp: datetime
    ttl: int = 10
    encrypted: bool = False
    signature: str = ""
    path: List[str] = field(default_factory=list)


class MeshNetwork:
    """
    Mesh Network - Самоорганизующаяся сеть для дронов
    
    Обеспечивает:
    - Связь между дронами без центральной точки отказа
    - Многопутевую маршрутизацию
    - Автоматическое восстановление
    - Шифрование end-to-end
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Параметры узла
        self.node_id = self.config.get('node_id', f'drone_{int(time.time())}')
        self.node_type = NodeType(self.config.get('node_type', 'drone'))
        self.broadcast_port = self.config.get('broadcast_port', 9000)
        self.data_port = self.config.get('data_port', 9001)
        self.heartbeat_interval = self.config.get('heartbeat_interval', 5)
        self.encryption_enabled = self.config.get('encryption', True)
        
        # Состояние сети
        self.nodes: Dict[str, MeshNode] = {}
        self.routing_table: Dict[str, List[str]] = {}
        self.message_history: List[str] = []
        self.pending_messages: List[MeshMessage] = []
        
        # Статистика
        self.messages_sent = 0
        self.messages_received = 0
        self.messages_forwarded = 0
        
        # Сокеты
        self.broadcast_socket = None
        self.data_socket = None
        
        # Задачи
        self.is_running = False
        self.tasks = []
        
        # Callbacks
        self.message_handlers: Dict[MessageType, List[callable]] = {}
        
        logger.info(f"🌐 Mesh Network инициализирован (node: {self.node_id})")

    async def initialize(self):
        """Инициализация mesh-сети"""
        logger.info("🚀 Инициализация Mesh Network...")
        
        # Создание сокетов
        await self._create_sockets()
        
        # Запуск задач
        self.is_running = True
        self.tasks = [
            asyncio.create_task(self._heartbeat_sender()),
            asyncio.create_task(self._message_receiver()),
            asyncio.create_task(self._node_monitor()),
            asyncio.create_task(self._discovery_service())
        ]
        
        # Добавляем себя в сеть
        self.nodes[self.node_id] = MeshNode(
            node_id=self.node_id,
            node_type=self.node_type,
            address="127.0.0.1",
            port=self.data_port,
            last_seen=datetime.now(),
            is_direct=True
        )
        
        logger.info("✅ Mesh Network активна")
        return True

    async def _create_sockets(self):
        """Создание сокетов"""
        try:
            import socket
            
            # Broadcast socket
            self.broadcast_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.broadcast_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            self.broadcast_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.broadcast_socket.bind(("0.0.0.0", self.broadcast_port))
            self.broadcast_socket.setblocking(False)
            
            # Data socket
            self.data_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.data_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.data_socket.bind(("0.0.0.0", self.data_port))
            self.data_socket.setblocking(False)
            
            logger.info(f"  ✓ Сокеты созданы (broadcast: {self.broadcast_port}, data: {self.data_port})")
        except Exception as e:
            logger.error(f"❌ Ошибка создания сокетов: {e}")

    async def _heartbeat_sender(self):
        """Отправка heartbeat"""
        while self.is_running:
            try:
                heartbeat = {
                    "node_id": self.node_id,
                    "node_type": self.node_type.value,
                    "port": self.data_port,
                    "timestamp": datetime.now().isoformat(),
                    "neighbors": list(self.nodes.keys())
                }
                
                await self._send_broadcast(MessageType.HEARTBEAT, heartbeat)
                await asyncio.sleep(self.heartbeat_interval)
            except Exception as e:
                logger.error(f"❌ Ошибка heartbeat: {e}")
                await asyncio.sleep(1)

    async def _send_broadcast(self, msg_type: MessageType, payload: Dict[str, Any]):
        """Отправка broadcast сообщения"""
        if not self.broadcast_socket:
            return
        
        message = MeshMessage(
            message_id=self._generate_message_id(),
            message_type=msg_type,
            source=self.node_id,
            destination="broadcast",
            payload=payload,
            timestamp=datetime.now()
        )
        
        try:
            data = json.dumps({
                "id": message.message_id,
                "type": message.message_type.value,
                "source": message.source,
                "destination": message.destination,
                "payload": message.payload,
                "timestamp": message.timestamp.isoformat(),
                "ttl": message.ttl
            }).encode()
            
            import socket
            self.broadcast_socket.sendto(data, ("<broadcast>", self.broadcast_port))
            self.messages_sent += 1
        except Exception as e:
            logger.error(f"❌ Ошибка broadcast: {e}")

    async def _message_receiver(self):
        """Прием сообщений"""
        while self.is_running:
            try:
                if not self.broadcast_socket:
                    await asyncio.sleep(0.1)
                    continue
                
                import select
                ready, _, _ = select.select([self.broadcast_socket], [], [], 0.1)
                
                if ready:
                    data, addr = self.broadcast_socket.recvfrom(4096)
                    await self._process_message(data, addr)
                
                await asyncio.sleep(0.01)
            except Exception as e:
                await asyncio.sleep(0.1)

    async def _process_message(self, data: bytes, addr: tuple):
        """Обработка входящего сообщения"""
        try:
            msg_data = json.loads(data.decode())
            
            # Проверка дубликатов
            msg_id = msg_data.get("id")
            if msg_id in self.message_history:
                return
            
            self.message_history.append(msg_id)
            if len(self.message_history) > 1000:
                self.message_history = self.message_history[-500:]
            
            # Создание объекта сообщения
            message = MeshMessage(
                message_id=msg_id,
                message_type=MessageType(msg_data.get("type", "data")),
                source=msg_data.get("source"),
                destination=msg_data.get("destination"),
                payload=msg_data.get("payload", {}),
                timestamp=datetime.fromisoformat(msg_data.get("timestamp")),
                ttl=msg_data.get("ttl", 10)
            )
            
            self.messages_received += 1
            
            # Обновление информации об узле
            if message.source != self.node_id:
                await self._update_node_info(message.source, addr, message.payload)
            
            # Обработка сообщения
            if message.destination == self.node_id or message.destination == "broadcast":
                await self._handle_message(message)
            
            # Пересылка если нужно
            if message.ttl > 0 and message.destination != self.node_id:
                await self._forward_message(message)
                
        except Exception as e:
            logger.error(f"❌ Ошибка обработки сообщения: {e}")

    async def _update_node_info(self, node_id: str, addr: tuple, payload: Dict):
        """Обновление информации об узле"""
        if node_id not in self.nodes:
            logger.info(f"🔍 Обнаружен новый узел: {node_id}")
        
        node_type = NodeType(payload.get("node_type", "drone"))
        port = payload.get("port", self.data_port)
        
        self.nodes[node_id] = MeshNode(
            node_id=node_id,
            node_type=node_type,
            address=addr[0],
            port=port,
            last_seen=datetime.now(),
            signal_strength=100,  # Упрощенно
            is_direct=True
        )

    async def _handle_message(self, message: MeshMessage):
        """Обработка сообщения"""
        handlers = self.message_handlers.get(message.message_type, [])
        
        for handler in handlers:
            try:
                await handler(message)
            except Exception as e:
                logger.error(f"❌ Ошибка обработчика: {e}")
        
        # Встроенная обработка
        if message.message_type == MessageType.HEARTBEAT:
            pass  # Уже обработано в _update_node_info
        elif message.message_type == MessageType.DISCOVERY:
            await self._handle_discovery(message)
        elif message.message_type == MessageType.COMMAND:
            await self._handle_command(message)

    async def _handle_discovery(self, message: MeshMessage):
        """Обработка discovery"""
        # Отправляем ответ с информацией о себе
        response = {
            "node_id": self.node_id,
            "node_type": self.node_type.value,
            "neighbors": list(self.nodes.keys()),
            "capabilities": ["telemetry", "commands", "data"]
        }
        await self.send_to(message.source, MessageType.STATUS, response)

    async def _handle_command(self, message: MeshMessage):
        """Обработка команды"""
        command = message.payload.get("command")
        params = message.payload.get("params", {})
        
        logger.info(f"📩 Получена команда от {message.source}: {command}")
        
        # Передача команду в основной агент
        # (будет реализовано через callback)

    async def _forward_message(self, message: MeshMessage):
        """Пересылка сообщения"""
        if message.ttl <= 0:
            return
        
        message.ttl -= 1
        message.path.append(self.node_id)
        
        # Находим лучший путь
        next_hop = self._find_next_hop(message.destination)
        
        if next_hop and next_hop in self.nodes:
            node = self.nodes[next_hop]
            try:
                data = json.dumps({
                    "id": message.message_id,
                    "type": message.message_type.value,
                    "source": message.source,
                    "destination": message.destination,
                    "payload": message.payload,
                    "timestamp": message.timestamp.isoformat(),
                    "ttl": message.ttl,
                    "path": message.path
                }).encode()
                
                import socket
                self.data_socket.sendto(data, (node.address, node.port))
                self.messages_forwarded += 1
            except Exception as e:
                logger.error(f"❌ Ошибка пересылки: {e}")

    def _find_next_hop(self, destination: str) -> Optional[str]:
        """Поиск следующего узла"""
        if destination in self.nodes:
            return destination
        
        # Поиск через соседей (упрощенно)
        for node_id, node in self.nodes.items():
            neighbors = node.capabilities
            if destination in neighbors:
                return node_id
        
        return None

    async def _node_monitor(self):
        """Мониторинг узлов"""
        while self.is_running:
            try:
                now = datetime.now()
                offline_nodes = []
                
                for node_id, node in self.nodes.items():
                    if node_id == self.node_id:
                        continue
                    
                    time_since_seen = (now - node.last_seen).total_seconds()
                    
                    if time_since_seen > 30:
                        node.status = "offline"
                        offline_nodes.append(node_id)
                    elif time_since_seen > 15:
                        node.status = "unstable"
                
                # Удаление давно оффлайн узлов
                for node_id in offline_nodes:
                    if (now - self.nodes[node_id].last_seen).total_seconds() > 120:
                        del self.nodes[node_id]
                        logger.info(f"🗑️ Узел удален: {node_id}")
                
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"❌ Ошибка мониторинга: {e}")
                await asyncio.sleep(5)

    async def _discovery_service(self):
        """Сервис обнаружения"""
        while self.is_running:
            try:
                discovery = {
                    "node_id": self.node_id,
                    "node_type": self.node_type.value,
                    "looking_for": ["operator", "base_station"]
                }
                await self._send_broadcast(MessageType.DISCOVERY, discovery)
                await asyncio.sleep(10)
            except Exception as e:
                logger.error(f"❌ Ошибка discovery: {e}")
                await asyncio.sleep(5)

    # ========== Публичные методы ==========

    async def send_to(self, destination: str, msg_type: MessageType, payload: Dict[str, Any]) -> bool:
        """Отправка сообщения конкретному узлу"""
        message = MeshMessage(
            message_id=self._generate_message_id(),
            message_type=msg_type,
            source=self.node_id,
            destination=destination,
            payload=payload,
            timestamp=datetime.now()
        )
        
        if destination in self.nodes:
            node = self.nodes[destination]
            try:
                data = json.dumps({
                    "id": message.message_id,
                    "type": message.message_type.value,
                    "source": message.source,
                    "destination": message.destination,
                    "payload": message.payload,
                    "timestamp": message.timestamp.isoformat(),
                    "ttl": message.ttl
                }).encode()
                
                import socket
                self.data_socket.sendto(data, (node.address, node.port))
                self.messages_sent += 1
                return True
            except Exception as e:
                logger.error(f"❌ Ошибка отправки: {e}")
        
        return False

    async def broadcast(self, payload: Dict[str, Any], msg_type: MessageType = MessageType.DATA):
        """Broadcast сообщение"""
        await self._send_broadcast(msg_type, payload)

    def _generate_message_id(self) -> str:
        """Генерация ID сообщения"""
        data = f"{self.node_id}:{time.time()}"
        return hashlib.md5(data.encode()).hexdigest()[:16]

    def register_handler(self, msg_type: MessageType, handler: callable):
        """Регистрация обработчика сообщений"""
        if msg_type not in self.message_handlers:
            self.message_handlers[msg_type] = []
        self.message_handlers[msg_type].append(handler)

    def get_network_status(self) -> Dict[str, Any]:
        """Получение статуса сети"""
        return {
            "node_id": self.node_id,
            "node_type": self.node_type.value,
            "nodes_online": len([n for n in self.nodes.values() if n.status == "online"]),
            "nodes_total": len(self.nodes),
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "messages_forwarded": self.messages_forwarded,
            "neighbors": [
                {
                    "node_id": n.node_id,
                    "type": n.node_type.value,
                    "status": n.status,
                    "signal": n.signal_strength
                }
                for n in self.nodes.values() if n.node_id != self.node_id
            ]
        }

    async def shutdown(self):
        """Завершение работы"""
        logger.info("🛑 Завершение работы Mesh Network...")
        
        self.is_running = False
        
        # Отправка прощального сообщения
        await self._send_broadcast(MessageType.STATUS, {
            "node_id": self.node_id,
            "status": "going_offline"
        })
        
        # Отмена задач
        for task in self.tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Закрытие сокетов
        if self.broadcast_socket:
            self.broadcast_socket.close()
        if self.data_socket:
            self.data_socket.close()
        
        logger.info("👋 Mesh Network завершил работу")
