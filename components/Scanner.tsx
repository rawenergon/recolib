import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Icons } from './Icons';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [usingBackCamera, setUsingBackCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
      verbose: false
    };

    try {
      scannerRef.current = new Html5Qrcode("reader", config);

      const startCamera = async (isBack: boolean) => {
        const facingMode = isBack ? 'environment' : 'user';
        try {
          if (scannerRef.current) {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          }
          scannerRef.current = new Html5Qrcode("reader", config);
          setError(null);
          await scannerRef.current.start(
            { facingMode },
            config,
            (decodedText) => {
              onScan(decodedText);
            },
            () => {}
          );
        } catch (e: any) {
          setError(e?.name === 'NotFoundException'
            ? "No camera found. Use the manual code entry instead."
            : "Camera access is off. Tap Allow once when asked, or open this page in Chrome/Safari browser (not an in-app browser like WhatsApp or Instagram).");
        }
      };

      startCamera(usingBackCamera);
    } catch (e) {
      setError("Camera permission denied or not available.");
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .catch(() => {})
          .finally(() => scannerRef.current!.clear().catch(() => {}));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingBackCamera]);

  const handleSwitchCamera = () => {
    setUsingBackCamera(prev => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 dark:bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
        >
          <Icons.X className="w-5 h-5" />
        </button>
        
        <div className="p-6 pt-10">
          <h2 className="text-xl font-bold mb-6 text-center text-zinc-900 dark:text-white tracking-wide">SCAN BOOK QR</h2>
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-black"></div>
          {error && <p className="text-red-500 text-center mt-4 text-sm">{error}</p>}
          <button 
            onClick={handleSwitchCamera}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Icons.SwitchCamera className="w-4 h-4 text-indigo-500" />
            {usingBackCamera ? 'Switch to Front Camera' : 'Switch to Back Camera'}
          </button>
          <p className="text-center text-xs text-zinc-500 mt-4 uppercase tracking-widest">
            Align QR code within the frame
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;