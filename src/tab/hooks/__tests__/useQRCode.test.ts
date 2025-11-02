/**
 * Tests for useQRCode hook
 *
 * Handles QR code generation using the qrcode library with canvas rendering.
 *
 * Test coverage:
 * - generateQR with valid canvas ref
 * - generateQR with null canvas ref
 * - generateQR with custom options
 * - generateQR error handling
 * - clearQR functionality
 * - clearQR with null canvas ref
 * - chunkData for large data
 * - chunkData with custom chunk size
 * - chunkData with empty string
 * - Function stability (useCallback)
 * - Canvas context interactions
 */

import { renderHook, act } from '@testing-library/react';
import { useQRCode } from '../useQRCode';
import QRCode from 'qrcode';

// Mock the qrcode library
jest.mock('qrcode', () => ({
  toCanvas: jest.fn()
}));

describe('useQRCode', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let mockCanvasRef: React.RefObject<HTMLCanvasElement>;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 240;
    mockCanvas.height = 240;

    // Create mock context
    mockContext = {
      clearRect: jest.fn()
    } as any;

    // Mock getContext
    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);

    // Create ref
    mockCanvasRef = { current: mockCanvas };

    // Clear mocks
    jest.clearAllMocks();
  });

  /**
   * Test: generateQR with valid canvas ref
   */
  it('generates QR code with valid canvas ref', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await result.current.generateQR('bitcoin:tb1qtest123');
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'bitcoin:tb1qtest123',
      expect.objectContaining({
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    );
  });

  /**
   * Test: generateQR with custom options
   */
  it('generates QR code with custom options', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const customOptions = {
      width: 300,
      margin: 4,
      errorCorrectionLevel: 'H' as const
    };

    await act(async () => {
      await result.current.generateQR('test-data', customOptions);
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'test-data',
      expect.objectContaining({
        width: 300,
        margin: 4,
        errorCorrectionLevel: 'H'
      })
    );
  });

  /**
   * Test: generateQR with null canvas ref
   */
  it('throws error when canvas ref is null', async () => {
    const nullRef = { current: null };
    const { result } = renderHook(() => useQRCode(nullRef));

    await act(async () => {
      await expect(
        result.current.generateQR('test-data')
      ).rejects.toThrow('Canvas ref is not available');
    });

    expect(QRCode.toCanvas).not.toHaveBeenCalled();
  });

  /**
   * Test: generateQR error handling
   */
  it('handles QR code generation errors', async () => {
    const qrError = new Error('QR generation failed');
    (QRCode.toCanvas as jest.Mock).mockRejectedValue(qrError);

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await expect(
        result.current.generateQR('test-data')
      ).rejects.toThrow('Failed to generate QR code');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to generate QR code:',
      qrError
    );

    consoleErrorSpy.mockRestore();
  });

  /**
   * Test: generateQR with all error correction levels
   */
  it('supports all error correction levels', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];

    for (const level of levels) {
      await act(async () => {
        await result.current.generateQR('test', { errorCorrectionLevel: level });
      });

      expect(QRCode.toCanvas).toHaveBeenCalledWith(
        mockCanvas,
        'test',
        expect.objectContaining({ errorCorrectionLevel: level })
      );
    }
  });

  /**
   * Test: clearQR functionality
   */
  it('clears QR code from canvas', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    act(() => {
      result.current.clearQR();
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 240, 240);
  });

  /**
   * Test: clearQR with null canvas ref
   */
  it('does not error when clearing with null canvas ref', () => {
    const nullRef = { current: null };
    const { result } = renderHook(() => useQRCode(nullRef));

    act(() => {
      result.current.clearQR();
    });

    // Should not throw error
    expect(mockContext.clearRect).not.toHaveBeenCalled();
  });

  /**
   * Test: clearQR with null context
   */
  it('handles null context when clearing', () => {
    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    act(() => {
      result.current.clearQR();
    });

    // Should not throw error
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
  });

  /**
   * Test: chunkData for large data
   */
  it('chunks large data into smaller pieces', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const largeData = 'a'.repeat(5000);
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(largeData, 2000);
    });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(2000);
    expect(chunks[1]).toHaveLength(2000);
    expect(chunks[2]).toHaveLength(1000);
    expect(chunks.join('')).toBe(largeData);
  });

  /**
   * Test: chunkData with default chunk size
   */
  it('uses default chunk size of 2000', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const data = 'a'.repeat(4500);
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(data);
    });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(2000);
    expect(chunks[1]).toHaveLength(2000);
    expect(chunks[2]).toHaveLength(500);
  });

  /**
   * Test: chunkData with custom chunk size
   */
  it('supports custom chunk size', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const data = 'abcdefghij'; // 10 characters
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(data, 3);
    });

    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toBe('abc');
    expect(chunks[1]).toBe('def');
    expect(chunks[2]).toBe('ghi');
    expect(chunks[3]).toBe('j');
  });

  /**
   * Test: chunkData with empty string
   */
  it('returns empty array for empty string', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData('');
    });

    expect(chunks).toEqual([]);
  });

  /**
   * Test: chunkData with data smaller than chunk size
   */
  it('returns single chunk when data is smaller than chunk size', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const data = 'small';
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(data, 100);
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('small');
  });

  /**
   * Test: Function references are stable (useCallback)
   */
  it('maintains stable function references', () => {
    const { result, rerender } = renderHook(() => useQRCode(mockCanvasRef));

    const generateQRFirst = result.current.generateQR;
    const clearQRFirst = result.current.clearQR;
    const chunkDataFirst = result.current.chunkData;

    rerender();

    const generateQRSecond = result.current.generateQR;
    const clearQRSecond = result.current.clearQR;
    const chunkDataSecond = result.current.chunkData;

    expect(generateQRFirst).toBe(generateQRSecond);
    expect(clearQRFirst).toBe(clearQRSecond);
    expect(chunkDataFirst).toBe(chunkDataSecond);
  });

  /**
   * Test: Function references update when ref changes
   */
  it('updates function references when canvas ref changes', () => {
    const { result, rerender } = renderHook(
      ({ ref }) => useQRCode(ref),
      { initialProps: { ref: mockCanvasRef } }
    );

    const generateQRFirst = result.current.generateQR;

    // Create new ref
    const newCanvas = document.createElement('canvas');
    const newRef = { current: newCanvas };

    rerender({ ref: newRef });

    const generateQRSecond = result.current.generateQR;

    // Functions should be different since dependency (canvasRef) changed
    expect(generateQRFirst).not.toBe(generateQRSecond);
  });

  /**
   * Test: Generates QR for Bitcoin URI
   */
  it('generates QR code for Bitcoin URI', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const bitcoinURI = 'bitcoin:tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?amount=0.001';

    await act(async () => {
      await result.current.generateQR(bitcoinURI);
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      bitcoinURI,
      expect.any(Object)
    );
  });

  /**
   * Test: Generates QR for PSBT (base64)
   */
  it('generates QR code for PSBT data', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const psbtBase64 = 'cHNidP8BAH8CAAAAASeaI...'; // Long base64 string

    await act(async () => {
      await result.current.generateQR(psbtBase64);
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      psbtBase64,
      expect.any(Object)
    );
  });

  /**
   * Test: Chunks PSBT for multiple QR codes
   */
  it('chunks large PSBT data for multiple QR codes', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    // Large PSBT that exceeds single QR capacity
    const largePSBT = 'cHNidP8B' + 'A'.repeat(3000);

    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(largePSBT, 2000);
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(largePSBT);
  });

  /**
   * Test: generateQR with very small width
   */
  it('generates QR with custom small width', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await result.current.generateQR('test', { width: 100 });
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'test',
      expect.objectContaining({ width: 100 })
    );
  });

  /**
   * Test: generateQR with very large width
   */
  it('generates QR with custom large width', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await result.current.generateQR('test', { width: 500 });
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'test',
      expect.objectContaining({ width: 500 })
    );
  });

  /**
   * Test: Multiple sequential QR generations
   */
  it('handles multiple sequential QR generations', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await result.current.generateQR('data1');
      await result.current.generateQR('data2');
      await result.current.generateQR('data3');
    });

    expect(QRCode.toCanvas).toHaveBeenCalledTimes(3);
    expect(QRCode.toCanvas).toHaveBeenNthCalledWith(1, mockCanvas, 'data1', expect.any(Object));
    expect(QRCode.toCanvas).toHaveBeenNthCalledWith(2, mockCanvas, 'data2', expect.any(Object));
    expect(QRCode.toCanvas).toHaveBeenNthCalledWith(3, mockCanvas, 'data3', expect.any(Object));
  });

  /**
   * Test: Clear then generate
   */
  it('clears then generates new QR code', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    // Generate first QR
    await act(async () => {
      await result.current.generateQR('first');
    });

    // Clear
    act(() => {
      result.current.clearQR();
    });

    expect(mockContext.clearRect).toHaveBeenCalled();

    // Generate second QR
    await act(async () => {
      await result.current.generateQR('second');
    });

    expect(QRCode.toCanvas).toHaveBeenCalledTimes(2);
  });

  /**
   * Test: chunkData preserves data integrity
   */
  it('preserves data integrity when chunking and joining', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const originalData = 'This is a test string with various characters: 123!@#$%^&*()';
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(originalData, 10);
    });

    const reconstructed = chunks.join('');
    expect(reconstructed).toBe(originalData);
  });

  /**
   * Test: Returns hook interface
   */
  it('returns correct hook interface', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    expect(result.current).toHaveProperty('generateQR');
    expect(result.current).toHaveProperty('clearQR');
    expect(result.current).toHaveProperty('chunkData');

    expect(typeof result.current.generateQR).toBe('function');
    expect(typeof result.current.clearQR).toBe('function');
    expect(typeof result.current.chunkData).toBe('function');
  });
});
