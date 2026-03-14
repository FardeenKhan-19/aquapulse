'use client';

import { Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
    sensorName: string;
    apiKey?: string;
    qrCodeBase64: string;
}

export function QRCodeDisplay({ sensorName, apiKey, qrCodeBase64 }: QRCodeDisplayProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${qrCodeBase64}`;
        link.download = `sensor-qr-${sensorName}.png`;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html><head><title>QR Code - ${sensorName}</title><style>
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
          img { width: 300px; height: 300px; }
          h3 { margin-top: 16px; }
        </style></head><body>
          <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code" />
          <h3>${sensorName}</h3>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body></html>
      `);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-surface border border-accent/30 rounded-xl">
            <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt={`QR Code for ${sensorName}`}
                className="w-48 h-48 rounded-lg"
            />
            <p className="text-sm font-semibold text-text-primary">{sensorName}</p>

            {apiKey && (
                <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-coral font-medium">⚠ Store this API key safely — shown only once</p>
                    </div>
                    <div className="bg-primary border border-accent/50 rounded-lg p-3">
                        <code className="text-xs font-mono text-cyan break-all select-all">{apiKey}</code>
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(apiKey)}
                        className="mt-2 w-full py-2 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors"
                    >
                        Copy API Key
                    </button>
                </div>
            )}

            <div className="flex gap-2 w-full">
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-purple bg-purple/10 hover:bg-purple/20 rounded-lg transition-colors"
                >
                    <Download className="w-3 h-3" />
                    Download QR
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber bg-amber/10 hover:bg-amber/20 rounded-lg transition-colors"
                >
                    <Printer className="w-3 h-3" />
                    Print QR
                </button>
            </div>
        </div>
    );
}
