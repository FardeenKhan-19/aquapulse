from fastapi import WebSocket
from typing import Dict, List, Set, Optional
from datetime import datetime
import json
import asyncio
from loguru import logger


class WebSocketManager:
    def __init__(self):
        self._connections: Dict[str, WebSocket] = {}
        self._user_connections: Dict[str, str] = {}
        self._room_members: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str, role: str, village_ids: Optional[List[str]] = None):
        await websocket.accept()
        async with self._lock:
            self._connections[connection_id] = websocket
            self._user_connections[connection_id] = user_id

            if role == "admin":
                self._add_to_room("all", connection_id)
                self._add_to_room("system", connection_id)
            if village_ids:
                for vid in village_ids:
                    self._add_to_room(f"village_{vid}", connection_id)

        logger.info(f"WebSocket connected: {connection_id} (user={user_id}, role={role})")

    async def disconnect(self, connection_id: str):
        async with self._lock:
            self._connections.pop(connection_id, None)
            self._user_connections.pop(connection_id, None)
            for room in list(self._room_members.keys()):
                self._room_members[room].discard(connection_id)
                if not self._room_members[room]:
                    self._room_members.pop(room, None)
        logger.info(f"WebSocket disconnected: {connection_id}")

    def _add_to_room(self, room: str, connection_id: str):
        if room not in self._room_members:
            self._room_members[room] = set()
        self._room_members[room].add(connection_id)

    async def send_personal(self, connection_id: str, message: dict):
        ws = self._connections.get(connection_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                await self.disconnect(connection_id)

    async def broadcast_to_room(self, room: str, message: dict):
        members = self._room_members.get(room, set()).copy()
        dead_connections = []
        for conn_id in members:
            ws = self._connections.get(conn_id)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_connections.append(conn_id)
        for conn_id in dead_connections:
            await self.disconnect(conn_id)

    async def broadcast_to_all(self, message: dict):
        for conn_id in list(self._connections.keys()):
            ws = self._connections.get(conn_id)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    await self.disconnect(conn_id)

    async def broadcast_sensor_reading(self, village_id: str, sensor_node_id: str, data: dict):
        message = {
            "type": "sensor_reading",
            "payload": {
                "village_id": village_id,
                "sensor_node_id": sensor_node_id,
                "data": data,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)

    async def broadcast_prediction(self, village_id: str, risk_score: float, risk_level: str, change_delta: float = 0):
        message = {
            "type": "prediction_update",
            "payload": {
                "village_id": village_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "change_delta": change_delta,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)

    async def broadcast_alert(self, alert_id: str, village_id: str, severity: str, message_text: str):
        message = {
            "type": "new_alert",
            "payload": {
                "alert_id": alert_id,
                "village_id": village_id,
                "severity": severity,
                "message": message_text,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)

    async def broadcast_forensics(self, village_id: str, source: str, confidence: float):
        message = {
            "type": "forensics_complete",
            "payload": {
                "village_id": village_id,
                "source": source,
                "confidence": confidence,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)

    async def broadcast_legal_filed(self, village_id: str, document_type: str, filing_reference: str):
        message = {
            "type": "legal_filed",
            "payload": {
                "village_id": village_id,
                "document_type": document_type,
                "filing_reference": filing_reference,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)

    async def broadcast_sensor_offline(self, sensor_node_id: str, village_id: str, last_seen: str):
        message = {
            "type": "sensor_offline",
            "payload": {
                "sensor_node_id": sensor_node_id,
                "village_id": village_id,
                "last_seen": last_seen,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_room("all", message)
        await self.broadcast_to_room(f"village_{village_id}", message)
        await self.broadcast_to_room("system", message)

    async def broadcast_demo_scenario(self, scenario_number: int, state: str):
        message = {
            "type": "demo_scenario",
            "payload": {
                "scenario_number": scenario_number,
                "state": state,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        await self.broadcast_to_all(message)

    @property
    def active_connections_count(self) -> int:
        return len(self._connections)

    def get_room_members_count(self, room: str) -> int:
        return len(self._room_members.get(room, set()))


ws_manager = WebSocketManager()
