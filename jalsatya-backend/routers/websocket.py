from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.websocket_manager import ws_manager
from core.security import decode_token
from loguru import logger
import uuid

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/live")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
):
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    role = payload.get("role", "health_officer")
    connection_id = str(uuid.uuid4())

    village_ids = []
    if role == "health_officer":
        pass

    await ws_manager.connect(
        websocket=websocket,
        connection_id=connection_id,
        user_id=user_id,
        role=role,
        village_ids=village_ids,
    )

    try:
        from datetime import datetime
        await websocket.send_json({
            "type": "connection_established",
            "payload": {
                "connection_id": connection_id,
                "user_id": user_id,
                "role": role,
                "active_connections": ws_manager.active_connections_count,
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

        while True:
            data = await websocket.receive_text()
            logger.debug(f"WS received from {connection_id}: {data}")

    except WebSocketDisconnect:
        await ws_manager.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await ws_manager.disconnect(connection_id)
