interface CookieListItem {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number | Date;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

interface CookieChangeEvent extends Event {
  changed: CookieListItem[];
  deleted: CookieListItem[];
}

interface CookieStore extends EventTarget {
  get(name: string): Promise<CookieListItem | null>;
  getAll(): Promise<CookieListItem[]>;
  set(options: CookieListItem): Promise<void>;
  delete(options: { name: string; domain?: string; path?: string }): Promise<void>;
}

declare const cookieStore: CookieStore;