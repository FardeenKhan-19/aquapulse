export type WsMessageType =
    | 'sensor_reading'
    | 'prediction_update'
    | 'new_alert'
    | 'forensics_complete'
    | 'legal_filed'
    | 'sensor_offline'
    | 'demo_scenario';

export interface WsMessage<T = unknown> {
    type: WsMessageType;
    payload: T;
    timestamp: string;
}

export type WsConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
