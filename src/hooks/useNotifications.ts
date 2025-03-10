export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  error: Error | null;
}

export interface NotificationActionType {
  action: string;
  title: string;
  icon?: string;
}

export interface CustomNotificationOptions extends NotificationOptions {
  dir?: NotificationDirection;
  lang?: string;
  badge?: string;
  body?: string;
  tag?: string;
  icon?: string;
  image?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationActionType[];
  silent?: boolean;
  onClick?: (event: Event) => void;
  onShow?: (event: Event) => void;
  onError?: (event: Event) => void;
  onClose?: (event: Event) => void;
}

export function useNotifications() {
  let state: NotificationState = {
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    error: null
  };

  const requestPermission = async () => {
    if (!state.isSupported) return 'denied';
    
    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const getPermissionState = () => {
    if (!state.isSupported) return 'denied';
    return Notification.permission;
  };

  const show = async (title: string, options: CustomNotificationOptions = {}) => {
    if (!state.isSupported) return null;

    try {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const { onClick, onClose, onError, onShow, ...notificationOptions } = options;
      
      const notification = new Notification(title, notificationOptions);

      if (onClick) notification.onclick = onClick;
      if (onClose) notification.onclose = onClose;
      if (onError) notification.onerror = onError;
      if (onShow) notification.onshow = onShow;

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  };

  const close = (notification: Notification) => {
    if (notification) {
      notification.close();
    }
  };

  return {
    isSupported: state.isSupported,
    requestPermission,
    getPermissionState,
    show,
    close
  };
}