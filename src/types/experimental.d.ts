interface HIDDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  manufacturerName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface NavigatorHID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: { filters: { vendorId?: number; productId?: number }[] }): Promise<HIDDevice[]>;
  onconnect: ((this: NavigatorHID, ev: HIDConnectionEvent) => any) | null;
  ondisconnect: ((this: NavigatorHID, ev: HIDConnectionEvent) => any) | null;
}

interface Navigator {
  hid: NavigatorHID;
}

interface USBDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  serialNumber: string;
  manufacturerName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  reset(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
}

interface USBConnectionEvent extends Event {
  device: USBDevice;
}

interface NavigatorUSB extends EventTarget {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: { vendorId?: number; productId?: number }[] }): Promise<USBDevice>;
  onconnect: ((this: NavigatorUSB, ev: USBConnectionEvent) => any) | null;
  ondisconnect: ((this: NavigatorUSB, ev: USBConnectionEvent) => any) | null;
}

interface Navigator {
  usb: NavigatorUSB;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  data: any;
}

interface NDEFRecordInit {
  recordType: string;
  mediaType?: string;
  data?: any;
}

interface NDEFReader extends EventTarget {
  scan(): Promise<void>;
  write(message: NDEFMessage): Promise<void>;
}

// Web NFC Types
interface NFCPermissionDescriptor extends PermissionDescriptor {
  name: "nfc";
}

interface NFCReadingEvent extends Event {
  serialNumber?: string;
  message: NDEFMessage;
}

interface NFCErrorEvent extends Event {
  error: Error;
}

interface NFCReaderOptions {
  signal?: AbortSignal;
}

interface NFCWriteOptions {
  signal?: AbortSignal;
  overwrite?: boolean;
}

interface NDEFReader extends EventTarget {
  scan(options?: NFCReaderOptions): Promise<void>;
  write(message: NDEFMessageInit, options?: NFCWriteOptions): Promise<void>;
  onreading: ((this: NDEFReader, ev: NFCReadingEvent) => any) | null;
  onreadingerror: ((this: NDEFReader, ev: NFCErrorEvent) => any) | null;
}

interface KeyboardLayoutMap {
  get(key: string): string | undefined;
  has(key: boolean): boolean;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

interface NavigationTransition {
  navigationType: 'push' | 'replace' | 'reload' | 'traverse';
  from: string;
  finished: Promise<void>;
}

interface NavigateEvent extends Event {
  destination: string;
  canIntercept: boolean;
  intercept(): void;
  scroll(): void;
}

interface NavigationCurrentEntryChangeEvent extends Event {
  navigationType: 'push' | 'replace' | 'reload' | 'traverse';
  from: string;
}

interface PhotoCapabilities {
  redEyeReduction: string;
  imageHeight: MediaSettingsRange;
  imageWidth: MediaSettingsRange;
  fillLightMode: string[];
}

interface MediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
  audioBitrateMode?: 'constant' | 'variable';
  videoBitrateMode?: 'constant' | 'variable';
}

interface MediaRecorderEventMap {
  'dataavailable': BlobEvent;
  'error': MediaRecorderErrorEvent;
  'pause': Event;
  'resume': Event;
  'start': Event;
  'stop': Event;
}

interface CookieChangeEvent extends Event {
  changed: Array<{ name: string; value: string }>;
  deleted: Array<{ name: string }>;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    HIDDevice: HIDDevice;
    USBDevice: USBDevice;
    NDEFReader: NDEFReader;
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}

declare global {
  interface Window {
    NDEFReader: {
      new(): NDEFReader;
      prototype: NDEFReader;
    };
  }
}

// Fix Fullscreen API types
interface Document {
  webkitFullscreenElement: Element | null;
  mozFullScreenElement: Element | null;
  msFullscreenElement: Element | null;
  webkitExitFullscreen(): Promise<void>;
  mozCancelFullScreen(): Promise<void>;
  msExitFullscreen(): Promise<void>;
}

interface Element {
  webkitRequestFullscreen(): Promise<void>;
  mozRequestFullScreen(): Promise<void>;
  msRequestFullscreen(): Promise<void>;
}

// Fix WebRTC types
interface RTCPeerConnection {
  onerror: ((this: RTCPeerConnection, ev: Event) => any) | null;
}

// Fix Media Capabilities types
interface AudioConfiguration {
  channels: string;
}

// Fix PictureInPicture types
interface PictureInPictureWindow {
  width: number;
  height: number;
  onresize: ((this: PictureInPictureWindow, ev: Event) => any) | null;
}

// Fix WebMIDI types
interface MIDIInputMap extends Map<string, MIDIInput> {}
interface MIDIOutputMap extends Map<string, MIDIOutput> {}

interface MIDIMessageEvent extends Event {
  data: Uint8Array;
  receivedTime: number;
  port: MIDIInput;
}

// Fix media session types
interface MediaSessionActionHandler {
  (details: MediaSessionActionDetails): void;
}

interface MediaPositionState {
  duration?: number;
  playbackRate?: number;
  position?: number;
}

// Update MediaSession types
interface MediaSessionState {
  isSupported: boolean;
  playbackState: MediaSessionPlaybackState;
  metadata: MediaMetadata | null;
}

interface MediaSessionActionDetails {
  action: MediaSessionAction;
  seekTime?: number;
  fastSeek?: boolean;
}

interface MediaSession {
  metadata: MediaMetadata | null;
  playbackState: MediaSessionPlaybackState;
  setActionHandler(
    action: MediaSessionAction,
    handler: ((details: MediaSessionActionDetails) => void) | null
  ): void;
  setPositionState(state?: MediaPositionState): void;
}

// Add Web Audio types
interface AudioContextState {
  state: 'suspended' | 'running' | 'closed';
}

// Update global declarations
declare global {
  interface Window {
    // ...existing Window properties...
    webkitRequestFullscreen: () => Promise<void>;
    mozRequestFullScreen: () => Promise<void>;
    msRequestFullscreen: () => Promise<void>;
  }
}

// Add permission types
type PermissionName = 
  | 'geolocation' 
  | 'notifications' 
  | 'push' 
  | 'midi' 
  | 'camera' 
  | 'microphone' 
  | 'background-sync' 
  | 'ambient-light-sensor' 
  | 'accelerometer' 
  | 'gyroscope' 
  | 'magnetometer'
  | 'background-fetch'
  | 'nfc';

interface PermissionDescriptor {
  name: PermissionName;
}

// Add event handler type definitions and fix event interfaces
interface EventMap {
  'keydown': KeyboardEvent;
  'keyup': KeyboardEvent;
  'pointerdown': PointerEvent;
  'pointermove': PointerEvent;
  'pointerup': PointerEvent;
  'pointercancel': PointerEvent;
  'pointerleave': PointerEvent;
  'midimessage': MIDIMessageEvent;
  'connect': HIDConnectionEvent | USBConnectionEvent;
  'disconnect': HIDConnectionEvent | USBConnectionEvent;
  'change': CookieChangeEvent;
  'reading': NFCReadingEvent;
  'error': NFCErrorEvent;
  'statechange': Event & { target: { state: AudioContextState['state'] } };
}

// Update existing event handlers to use EventMap
interface EventTarget {
  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

// Fix FileSystem API types
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: FileSystem;
  createWriter?(successCallback: (writer: FileWriter) => void, errorCallback?: (error: Error) => void): void;
}

interface FileWriter {
  write(data: Blob): void;
  seek(offset: number): void;
  truncate(size: number): void;
  onwriteend: ((event: ProgressEvent) => void) | null;
  onerror: ((error: Error) => void) | null;
}

interface FileEntry extends FileSystemEntry {
  file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void;
  createWriter(successCallback: (writer: FileWriter) => void, errorCallback?: (error: Error) => void): void;
}

interface DirectoryEntry extends FileSystemEntry {
  createReader(): DirectoryReader;
  getDirectory(path: string, options?: { create?: boolean }, successCallback?: (entry: DirectoryEntry) => void, errorCallback?: (error: Error) => void): void;
  getFile(path: string, options?: { create?: boolean }, successCallback?: (entry: FileEntry) => void, errorCallback?: (error: Error) => void): void;
  removeRecursively(successCallback: () => void, errorCallback?: (error: Error) => void): void;
}

interface DirectoryReader {
  readEntries(successCallback: (entries: Entry[]) => void, errorCallback?: (error: Error) => void): void;
}

type Entry = FileEntry | DirectoryEntry;

// Update Window interface with FileSystem constants
interface Window {
  // ...existing Window properties...
  TEMPORARY: number;
  PERSISTENT: number;
  requestFileSystem(type: number, size: number, successCallback: (fs: FileSystem) => void, errorCallback?: (error: Error) => void): void;
  webkitRequestFileSystem(type: number, size: number, successCallback: (fs: FileSystem) => void, errorCallback?: (error: Error) => void): void;
}

// Fix MediaRecorderOptions interface to not be recursive
interface MediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
}

// Fix NotificationOptions interface to not be recursive
interface NotificationOptions {
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
  actions?: NotificationAction[];
  silent?: boolean;
}

// Fix FileSystem API type definitions and error handling
interface FileSystemCallback {
  (entry: FileEntry | DirectoryEntry): void;
}

interface FileSystemEntryCallback {
  (entry: FileEntry | DirectoryEntry): void;
}

interface FileSystem {
  root: DirectoryEntry;
  name: string;
}

interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: FileSystem;
  remove(successCallback: () => void, errorCallback?: (error: Error) => void): void;
}

interface FileEntry extends FileSystemEntry {
  createWriter(successCallback: (writer: FileWriter) => void, errorCallback?: (error: Error) => void): void;
  file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void;
}

interface DirectoryEntry extends FileSystemEntry {
  createReader(): DirectoryReader;
  getFile(path: string, options?: { create?: boolean }, successCallback?: FileSystemCallback, errorCallback?: (error: Error) => void): void;
  getDirectory(path: string, options?: { create?: boolean }, successCallback?: FileSystemCallback, errorCallback?: (error: Error) => void): void;
  removeRecursively(successCallback: () => void, errorCallback?: (error: Error) => void): void;
}

interface DirectoryReader {
  readEntries(successCallback: (entries: FileSystemEntry[]) => void, errorCallback?: (error: Error) => void): void;
}

interface FileSystemFlags {
  create?: boolean;
  exclusive?: boolean;
}

interface Window {
  // ...existing Window interface...
  requestFileSystem(type: number, size: number, successCallback: (fs: FileSystem) => void, errorCallback?: (error: Error) => void): void;
  webkitRequestFileSystem(type: number, size: number, successCallback: (fs: FileSystem) => void, errorCallback?: (error: Error) => void): void;
  TEMPORARY: number;
  PERSISTENT: number;
}

// Fix MediaCapabilities configuration types
interface MediaDecodingConfiguration {
  type: 'file' | 'media-source';
  video?: {
    contentType: string;
    width: number;
    height: number;
    bitrate: number;
    framerate: number;
  };
  audio?: {
    contentType: string;
    channels: number | string;
    bitrate: number;
    samplerate: number;
  };
}

interface MediaEncodingConfiguration {
  type: 'record';
  video?: {
    contentType: string;
    width: number;
    height: number;
    bitrate: number;
    framerate: number;
  };
  audio?: {
    contentType: string;
    channels: number | string;
    bitrate: number;
    samplerate: number;
  };
}

interface MediaCapabilitiesDecodingInfo {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

interface MediaCapabilitiesEncodingInfo {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

interface MediaCapabilities {
  decodingInfo(configuration: MediaDecodingConfiguration): Promise<MediaCapabilitiesDecodingInfo>;
  encodingInfo(configuration: MediaEncodingConfiguration): Promise<MediaCapabilitiesEncodingInfo>;
}

interface MediaTrackConstraints {
  // Add Chrome-specific option
  preferCurrentTab?: boolean;
}

interface DevicePostureNavigator extends Navigator {
    devicePosture?: {
        type: 'continuous' | 'folded' | 'flat';
        angle?: number;
        addEventListener(type: string, listener: EventListener): void;
        removeEventListener(type: string, listener: EventListener): void;
    };
}

declare global {
    interface Navigator extends DevicePostureNavigator {}
}