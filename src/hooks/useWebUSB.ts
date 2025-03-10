export interface WebUSBState {
  isSupported: boolean;
  devices: USBDevice[];
  error: Error | null;
}

export interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

export interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

export function useWebUSB() {
  let state: WebUSBState = {
    isSupported: typeof navigator !== 'undefined' && 'usb' in navigator,
    devices: [],
    error: null
  };

  const listeners = new Set<(state: WebUSBState) => void>();

  const updateState = (newState: Partial<WebUSBState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const setError = (error: Error) => {
    updateState({ error });
    console.error('Web USB API error:', error);
  };

  const clearError = () => {
    updateState({ error: null });
  };

  // Initialize event listeners for device connection/disconnection
  if (state.isSupported && typeof navigator !== 'undefined') {
    navigator.usb.addEventListener('connect', ((event: Event) => {
      const usbEvent = event as USBConnectionEvent;
      updateState({
        devices: [...state.devices, usbEvent.device]
      });
    }) as EventListener);

    navigator.usb.addEventListener('disconnect', ((event: Event) => {
      const usbEvent = event as USBConnectionEvent;
      updateState({
        devices: state.devices.filter(device => device !== usbEvent.device)
      });
    }) as EventListener);
  }

  const getDevices = async (): Promise<USBDevice[]> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      const devices = await navigator.usb.getDevices();
      updateState({ devices });
      return devices;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const requestDevice = async (options: USBDeviceRequestOptions): Promise<USBDevice> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      const device = await navigator.usb.requestDevice(options);
      
      // Update devices list
      if (!state.devices.includes(device)) {
        updateState({
          devices: [...state.devices, device]
        });
      }
      
      return device;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const openDevice = async (device: USBDevice): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.open();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const closeDevice = async (device: USBDevice): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.close();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const selectConfiguration = async (
    device: USBDevice, 
    configurationValue: number
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.selectConfiguration(configurationValue);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const claimInterface = async (
    device: USBDevice, 
    interfaceNumber: number
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.claimInterface(interfaceNumber);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const releaseInterface = async (
    device: USBDevice, 
    interfaceNumber: number
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.releaseInterface(interfaceNumber);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const selectAlternateInterface = async (
    device: USBDevice,
    interfaceNumber: number,
    alternateSetting: number
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.selectAlternateInterface(interfaceNumber, alternateSetting);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const controlTransferIn = async (
    device: USBDevice,
    setup: USBControlTransferParameters,
    length: number
  ): Promise<USBInTransferResult> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      return await device.controlTransferIn(setup, length);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const controlTransferOut = async (
    device: USBDevice,
    setup: USBControlTransferParameters,
    data?: BufferSource
  ): Promise<USBOutTransferResult> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      return await device.controlTransferOut(setup, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const transferIn = async (
    device: USBDevice,
    endpointNumber: number,
    length: number
  ): Promise<USBInTransferResult> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      return await device.transferIn(endpointNumber, length);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const transferOut = async (
    device: USBDevice,
    endpointNumber: number,
    data: BufferSource
  ): Promise<USBOutTransferResult> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      return await device.transferOut(endpointNumber, data);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const reset = async (device: USBDevice): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.reset();
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const clearHalt = async (
    device: USBDevice, 
    direction: USBDirection,
    endpointNumber: number
  ): Promise<void> => {
    if (!state.isSupported) {
      throw new Error('Web USB API is not supported in this browser');
    }

    try {
      clearError();
      await device.clearHalt(direction, endpointNumber);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  // Initialize by getting already paired devices
  if (state.isSupported && typeof navigator !== 'undefined') {
    getDevices().catch(error => {
      console.error('Error initializing WebUSB:', error);
    });
  }

  return {
    get state() { return state; },
    getDevices,
    requestDevice,
    openDevice,
    closeDevice,
    selectConfiguration,
    claimInterface,
    releaseInterface,
    selectAlternateInterface,
    controlTransferIn,
    controlTransferOut,
    transferIn,
    transferOut,
    reset,
    clearHalt,
    subscribe(callback: (state: WebUSBState) => void) {
      listeners.add(callback);
      callback(state);
      return () => listeners.delete(callback);
    }
  };
}