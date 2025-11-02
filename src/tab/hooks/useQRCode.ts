/**
 * useQRCode - Custom hook for QR code generation
 *
 * Handles QR code generation using the qrcode library,
 * supports canvas rendering with proper cleanup.
 *
 * Usage:
 * const { generateQR, clearQR } = useQRCode(canvasRef);
 * generateQR('bitcoin:tb1q...');
 */

import { useCallback } from 'react';
import QRCode from 'qrcode';

interface UseQRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const useQRCode = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const generateQR = useCallback(
    async (data: string, options?: UseQRCodeOptions) => {
      if (!canvasRef.current) {
        throw new Error('Canvas ref is not available');
      }

      const defaultOptions = {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M' as const,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      };

      try {
        await QRCode.toCanvas(canvasRef.current, data, {
          ...defaultOptions,
          ...options,
        });
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('Failed to generate QR code');
      }
    },
    [canvasRef]
  );

  const clearQR = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  /**
   * Chunk large data for multiple QR codes
   * Useful for PSBTs that exceed QR code capacity
   */
  const chunkData = useCallback((data: string, chunkSize: number = 2000): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }, []);

  return {
    generateQR,
    clearQR,
    chunkData,
  };
};

export default useQRCode;
