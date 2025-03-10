interface PresentationConnection {
  state: PresentationConnectionState;
  id: string;
  url: string;
  onconnect: ((this: PresentationConnection, ev: Event) => any) | null;
  onclose: ((this: PresentationConnection, ev: Event) => any) | null;
  onterminate: ((this: PresentationConnection, ev: Event) => any) | null;
  onmessage: ((this: PresentationConnection, ev: MessageEvent) => any) | null;
  close(): void;
  terminate(): void;
  send(data: string | ArrayBuffer | Blob): void;
}

type PresentationConnectionState = 'connected' | 'closed' | 'terminated';

interface PresentationAvailability {
  value: boolean;
  onchange: ((this: PresentationAvailability, ev: Event) => any) | null;
}

interface PresentationRequest {
  new(url: string | string[]): PresentationRequest;
  start(): Promise<PresentationConnection>;
  reconnect(presentationId: string): Promise<PresentationConnection>;
  getAvailability(): Promise<PresentationAvailability>;
  onconnectionavailable: ((this: PresentationRequest, ev: PresentationConnectionAvailableEvent) => any) | null;
}

interface PresentationConnectionAvailableEvent extends Event {
  readonly connection: PresentationConnection;
}

interface Window {
  PresentationRequest: PresentationRequest;
}