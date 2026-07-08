import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden relative">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Scan Barcode Inventaris</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div id="reader" className="w-full"></div>
        <div className="p-4 bg-slate-50 text-center">
          <p className="text-sm text-slate-500">Arahkan kamera ke barcode barang</p>
        </div>
      </div>
    </div>
  );
}
