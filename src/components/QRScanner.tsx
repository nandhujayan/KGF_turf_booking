import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");
  const html5QrCode = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Use environment camera (rear camera)
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.current = new Html5Qrcode("qr-reader");

    html5QrCode.current.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        onScan(decodedText);
      },
      (errorMessage) => {
        // We can ignore frame read errors, they happen continuously until a QR is found
      }
    ).catch((err) => {
       console.error(err);
       setError("Could not start camera. Please ensure you have granted camera permissions and are using HTTPS.");
    });

    return () => {
      if (html5QrCode.current?.isScanning) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-display font-black text-white tracking-tight">SCAN QR PASS</h2>
          <p className="text-white/40 text-sm mt-2">Point camera at the customer's Match Pass</p>
        </div>

        <div className="bg-black rounded-3xl overflow-hidden border-2 border-primary/20 shadow-[0_0_50px_rgba(0,255,136,0.1)] relative">
          {error ? (
            <div className="p-8 text-center text-red-400 font-bold text-sm">
              {error}
            </div>
          ) : (
             <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
