import { useWsStore } from '@/lib/stores/wsStore';
import { useAlertStore } from '@/lib/stores/alertStore';
import { useDemoStore } from '@/lib/stores/demoStore';
import type { WsMessage } from '@/lib/types/websocket';
import type { SensorReading } from '@/lib/types/sensor';
import type { OutbreakPrediction } from '@/lib/types/prediction';
import type { Alert } from '@/lib/types/alert';
import type { DemoEvent } from '@/lib/api/demo';
import { toast } from 'sonner';
import type { QueryClient } from '@tanstack/react-query';

let notificationSound: AudioContext | null = null;

function playNotificationSound() {
    try {
        if (!notificationSound) {
            notificationSound = new AudioContext();
        }
        const oscillator = notificationSound.createOscillator();
        const gainNode = notificationSound.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(notificationSound.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, notificationSound.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, notificationSound.currentTime + 0.3);
        oscillator.start(notificationSound.currentTime);
        oscillator.stop(notificationSound.currentTime + 0.3);
    } catch {
        // Audio not available
    }
}

export function createMessageHandler(queryClient: QueryClient) {
    return function handleWsMessage(message: WsMessage) {
        switch (message.type) {
            case 'sensor_reading': {
                const reading = message.payload as SensorReading;
                useWsStore.getState().updateReading(reading.village_id, reading);
                queryClient.invalidateQueries({ queryKey: ['villages', reading.village_id] });
                break;
            }

            case 'prediction_update': {
                const prediction = message.payload as OutbreakPrediction;
                useWsStore.getState().updatePrediction(prediction.village_id, prediction);
                queryClient.invalidateQueries({ queryKey: ['predictions', prediction.village_id] });

                if (prediction.risk_level === 'critical') {
                    toast.error(`CRITICAL: Risk level critical for village`, {
                        description: `Risk Score: ${prediction.risk_score.toFixed(1)} — ${prediction.predicted_disease || 'Unknown disease'}`,
                        duration: Infinity,
                        action: {
                            label: 'View Village',
                            onClick: () => {
                                window.location.href = `/dashboard/villages/${prediction.village_id}`;
                            },
                        },
                    });
                    playNotificationSound();
                } else if (prediction.risk_level === 'high') {
                    toast.warning(`High risk detected`, {
                        description: `Risk Score: ${prediction.risk_score.toFixed(1)}`,
                        duration: 6000,
                    });
                }
                break;
            }

            case 'new_alert': {
                const alert = message.payload as Alert;
                useAlertStore.getState().prependAlert(alert);
                queryClient.invalidateQueries({ queryKey: ['alerts'] });

                const toastFn = alert.severity === 'critical' ? toast.error
                    : alert.severity === 'high' ? toast.warning
                        : toast.info;

                toastFn(alert.message, {
                    duration: alert.severity === 'critical' ? Infinity : alert.severity === 'high' ? 6000 : 4000,
                });

                if (alert.severity === 'critical') {
                    playNotificationSound();
                }
                break;
            }

            case 'forensics_complete': {
                const report = message.payload as { village_id: string; source: string; confidence: number };
                queryClient.invalidateQueries({ queryKey: ['forensics', report.village_id] });
                toast.info(`Forensics complete: ${report.source}`, {
                    description: `Confidence: ${(report.confidence * 100).toFixed(1)}%`,
                });
                break;
            }

            case 'legal_filed': {
                const legal = message.payload as { case_number: string; village_id: string };
                queryClient.invalidateQueries({ queryKey: ['legal', legal.village_id] });
                toast.success(`Legal document filed`, {
                    description: `Case #${legal.case_number}`,
                });
                break;
            }

            case 'sensor_offline': {
                const sensor = message.payload as { sensor_id: string; village_id: string; name: string };
                queryClient.invalidateQueries({ queryKey: ['admin', 'sensors'] });
                toast.warning(`Sensor offline: ${sensor.name}`, { duration: 6000 });
                break;
            }

            case 'demo_scenario': {
                const event = message.payload as DemoEvent;
                useDemoStore.getState().addEvent(event);
                if (event.status === 'completed') {
                    useDemoStore.getState().setIsRunning(false);
                }
                break;
            }

            default:
                break;
        }
    };
}
