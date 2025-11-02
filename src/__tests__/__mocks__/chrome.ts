/**
 * Chrome Extension API Mock
 *
 * Mocks chrome.storage, chrome.runtime, and other Chrome Extension APIs
 * for testing purposes.
 */

// Storage mock with in-memory implementation
class StorageMock {
  private data: Record<string, any> = {};
  private errors: Map<string, Error> = new Map();

  get(keys?: string | string[] | null): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const error = this.errors.get('get');
      if (error) {
        this.errors.delete('get'); // Clear error after triggering
        reject(error);
        return;
      }

      if (keys === null || keys === undefined) {
        // Return all data
        resolve({ ...this.data });
      } else if (typeof keys === 'string') {
        // Return single key
        resolve(keys in this.data ? { [keys]: this.data[keys] } : {});
      } else if (Array.isArray(keys)) {
        // Return multiple keys
        const result: Record<string, any> = {};
        keys.forEach((key) => {
          if (key in this.data) {
            result[key] = this.data[key];
          }
        });
        resolve(result);
      } else {
        resolve({});
      }
    });
  }

  set(items: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      const error = this.errors.get('set');
      if (error) {
        this.errors.delete('set'); // Clear error after triggering
        reject(error);
        return;
      }

      Object.assign(this.data, items);
      resolve();
    });
  }

  remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const error = this.errors.get('remove');
      if (error) {
        this.errors.delete('remove'); // Clear error after triggering
        reject(error);
        return;
      }

      if (typeof keys === 'string') {
        delete this.data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => delete this.data[key]);
      }
      resolve();
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      const error = this.errors.get('clear');
      if (error) {
        this.errors.delete('clear'); // Clear error after triggering
        reject(error);
        return;
      }

      this.data = {};
      resolve();
    });
  }

  // Test helper to clear storage
  __clear(): void {
    this.data = {};
    this.errors.clear();
  }

  // Test helper to get all data
  __getData(): Record<string, any> {
    return { ...this.data };
  }

  // Test helper to simulate errors
  __setError(operation: 'get' | 'set' | 'remove' | 'clear', error: Error): void {
    this.errors.set(operation, error);
  }
}

// Runtime message mock
class RuntimeMessageMock {
  private listeners: Array<(message: any, sender: any, sendResponse: any) => boolean | void> = [];

  addListener(
    callback: (message: any, sender: any, sendResponse: any) => boolean | void
  ): void {
    this.listeners.push(callback);
  }

  removeListener(
    callback: (message: any, sender: any, sendResponse: any) => boolean | void
  ): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  hasListener(
    callback: (message: any, sender: any, sendResponse: any) => boolean | void
  ): boolean {
    return this.listeners.includes(callback);
  }

  // Simulate message sending
  __trigger(message: any, sender?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const mockSender = sender || { tab: { id: 1 }, frameId: 0, id: 'test-extension-id' };
      let responded = false;

      const sendResponse = (response: any) => {
        responded = true;
        resolve(response);
      };

      for (const listener of this.listeners) {
        const result = listener(message, mockSender, sendResponse);
        if (result === true) {
          // Listener will respond asynchronously
          return;
        }
      }

      if (!responded) {
        // No listener handled the message
        reject(new Error('No listener handled the message'));
      }
    });
  }

  // Test helper to clear listeners
  __clearListeners(): void {
    this.listeners = [];
  }

  // Test helper to get listener count
  __getListenerCount(): number {
    return this.listeners.length;
  }
}

// Storage change event mock
class StorageChangedMock {
  private listeners: Array<(changes: any, areaName: string) => void> = [];

  addListener(callback: (changes: any, areaName: string) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (changes: any, areaName: string) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  hasListener(callback: (changes: any, areaName: string) => void): boolean {
    return this.listeners.includes(callback);
  }

  // Test helper to trigger storage change events
  __trigger(changes: any, areaName: string = 'local'): void {
    this.listeners.forEach(listener => listener(changes, areaName));
  }

  // Test helper to clear listeners
  __clearListeners(): void {
    this.listeners = [];
  }
}

// Create mock instances
const localStorageMock = new StorageMock();
const sessionStorageMock = new StorageMock();
const runtimeMessageMock = new RuntimeMessageMock();
const storageChangedMock = new StorageChangedMock();

// Chrome API mock object
export const chromeMock = {
  storage: {
    local: localStorageMock,
    session: sessionStorageMock, // Session storage for unlock state persistence
    sync: new StorageMock(), // Not used but included for completeness
    onChanged: storageChangedMock,
    QUOTA_BYTES: 5242880, // 5MB
  },

  runtime: {
    onMessage: runtimeMessageMock,

    sendMessage: jest.fn((message: any) => {
      // Simulate message sending to background
      return runtimeMessageMock.__trigger(message);
    }),

    getManifest: jest.fn(() => ({
      version: '0.4.0',
      name: 'Bitcoin Wallet Extension',
      manifest_version: 3,
    })),

    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),

    id: 'test-extension-id',

    lastError: undefined as Error | undefined,
  },

  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    sendMessage: jest.fn(),
    get: jest.fn(), // Used by WizardSessionStorage to check if tab exists
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },

  // Mock for chrome.action (Manifest V3)
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },

  // Mock for chrome.alarms (for auto-lock functionality)
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
};

// Export individual mocks for direct access in tests
export const storageMock = localStorageMock;
export const messageMock = runtimeMessageMock;
