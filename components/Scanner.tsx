
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Icons } from './Icons';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        config,
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
        }
      );
    } catch (e) {
      setError("Camera permission denied or not available.");
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <p className="text-center text-xs text-zinc-500 mt-6 uppercase tracking-widest">
            Align QR code within the frame
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
