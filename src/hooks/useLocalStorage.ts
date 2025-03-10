export function useLocalStorage<T>(key: string, initialValue: T) {
  const getValue = () => {
    try {
      if (!key) return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const setValue = (value: T) => {
    try {
      if (!key) return;
      if (value === undefined || value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  };

  return { getValue, setValue };
}
