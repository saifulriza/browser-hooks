interface PushMessageData {
  arrayBuffer(): ArrayBuffer;
  blob(): Blob;
  json(): any;
  text(): string;
}

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  options: PushSubscriptionOptions;
  toJSON(): PushSubscriptionJSON;
  unsubscribe(): Promise<boolean>;
  getKey(name: PushEncryptionKeyName): ArrayBuffer | null;
}

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: Record<string, string>;
}

type PushEncryptionKeyName = 'p256dh' | 'auth';