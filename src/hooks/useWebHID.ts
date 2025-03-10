export interface WebHIDState {
  isSupported: boolean;
  devices: HIDDevice[];
  error: Error | null;
}

export interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

export interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
  exclusionFilters?: HIDDeviceFilter[];
}

export function useWebHID() {
  let state: WebHIDState = {
    isSupported: typeof navigator !== 'undefined' && 'hid' in navigator,
    devices: [],
    error: null
  };

  const listeners = new Set<(state: WebHIDState) => void>();

  const updateState = (newState: Partial<WebHIDState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('WebHID API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  // Initialize event listeners for device connection/disconnection
  if (state.isSupported && typeof navigator !== 'undefined') {
    // Listen for device connections
    navigator.hid.addEventListener('connect', ((event: Event) => {
      const hidEvent = event as HIDConnectionEvent;
      updateState({
        devices: [...state.devices, hidEvent.device]
      });
    }) as EventListener);

    // Listen for device disconnections
    navigator.hid.addEventListener('disconnect', ((event: Event) => {
      const hidEvent = event as HIDConnectionEvent;
      updateState({
        devices: state.devices.filter(device => device !== hidEvent.device)
      });
    }) as EventListener);
  }

  /**
   * Get already granted devices
   */
  const getDevices = async (): Promise<HIDDevice[]> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    try {
      clearError();
      const devices = await navigator.hid.getDevices();
      updateState({ devices });
      return devices;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Request access to HID devices matching the provided filters
   */
  const requestDevice = async (options: HIDDeviceRequestOptions): Promise<HIDDevice[]> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    try {
      clearError();
      const devices = await navigator.hid.requestDevice(options);
      
      // Update the state with the new devices, avoiding duplicates
      const existingDeviceIds = new Set(state.devices.map(d => d.productId + '-' + d.vendorId));
      const newDevices = devices.filter(d => !existingDeviceIds.has(d.productId + '-' + d.vendorId));
      
      if (newDevices.length > 0) {
        updateState({
          devices: [...state.devices, ...newDevices]
        });
      }
      
      return devices;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Open a connection to a HID device
   */
  const openDevice = async (device: HIDDevice): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    try {
      clearError();
      if (!device.opened) {
        await device.open();
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Close a connection to a HID device
   */
  const closeDevice = async (device: HIDDevice): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    try {
      clearError();
      if (device.opened) {
        await device.close();
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Send a report to a HID device
   */
  const sendReport = async (
    device: HIDDevice,
    reportId: number,
    data: BufferSource
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    if (!device.opened) {
      throw new Error('Device is not opened. Call openDevice first.');
    }

    try {
      clearError();
      await device.sendReport(reportId, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Send a feature report to a HID device
   */
  const sendFeatureReport = async (
    device: HIDDevice,
    reportId: number,
    data: BufferSource
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    if (!device.opened) {
      throw new Error('Device is not opened. Call openDevice first.');
    }

    try {
      clearError();
      await device.sendFeatureReport(reportId, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Receive a feature report from a HID device
   */
  const receiveFeatureReport = async (
    device: HIDDevice,
    reportId: number
  ): Promise<DataView> => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    if (!device.opened) {
      throw new Error('Device is not opened. Call openDevice first.');
    }

    try {
      clearError();
      return await device.receiveFeatureReport(reportId);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  /**
   * Listen for input reports from a device
   */
  const addInputReportListener = (
    device: HIDDevice,
    callback: (event: HIDInputReportEvent) => void
  ): () => void => {
    if (!state.isSupported) {
      throw new Error('WebHID API is not supported in this browser');
    }

    if (!device.opened) {
      throw new Error('Device is not opened. Call openDevice first.');
    }

    const handleInputReport = (event: HIDInputReportEvent) => {
      callback(event);
    };

    device.addEventListener('inputreport', handleInputReport);
    
    // Return a function to remove the event listener
    return () => {
      device.removeEventListener('inputreport', handleInputReport);
    };
  };

  // Initialize by getting already paired devices
  if (state.isSupported && typeof navigator !== 'undefined') {
    getDevices().catch(error => {
      console.error('Error initializing WebHID:', error);
    });
  }

  return {
    get state() { return state; },
    getDevices,
    requestDevice,
    openDevice,
    closeDevice,
    sendReport,
    sendFeatureReport,
    receiveFeatureReport,
    addInputReportListener,
    subscribe(callback: (state: WebHIDState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}