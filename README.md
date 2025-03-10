# Browser Hooks

A comprehensive collection of framework-agnostic browser API utilities exposed as hooks.

## Installation

### NPM
```bash
npm install browser-hooks
```

### CDN
```html
<!-- UMD version -->
<script src="https://unpkg.com/browser-hooks@1.0.0/dist/browser-hooks.umd.cjs"></script>

<!-- ES Module version -->
<script type="module">
  import { useNotifications } from 'https://unpkg.com/browser-hooks@1.0.0/dist/browser-hooks.js';
</script>
```

## Available Hooks

This library provides hooks for various browser APIs:

### Storage and Data
- `useLocalStorage` - Local storage operations
- `useClipboard` - Clipboard API
- `useFileSystem` - File System API
- `useFile` - File API operations

### Media and Display
- `useMediaStream` - Media Stream API
- `useMediaRecorder` - Media Recording
- `useMediaSession` - Media Session API
- `useScreenCapture` - Screen Capture API
- `usePictureInPicture` - Picture-in-Picture API
- `useWebAudio` - Web Audio API
- `useFullscreen` - Fullscreen API

### Device Features
- `useDeviceOrientation` - Device Orientation API
- `useDeviceMemory` - Device Memory API
- `useDevicePosture` - Device Posture API
- `useEyeDropper` - EyeDropper API
- `useWebUSB` - Web USB API
- `useWebHID` - Web HID API
- `useWebNFC` - Web NFC API

### Communication
- `useWebRTC` - WebRTC functionality
- `useBroadcastChannel` - BroadcastChannel API
- `useMessageChannel` - MessageChannel API
- `useWebTransport` - WebTransport API
- `useBeacon` - Beacon API

### Security and Authentication
- `useWebAuthn` - Web Authentication API
- `useWebCrypto` - Web Crypto API
- `useCredentialManagement` - Credential Management API
- `usePermissions` - Permissions API

### Performance and Monitoring
- `usePerformance` - Performance API
- `useResourceTiming` - Resource Timing API
- `useIdleDetection` - Idle Detection API
- `useNetwork` - Network Information API

### UI and Interaction
- `usePointerEvents` - Pointer Events
- `usePointerLock` - Pointer Lock API
- `useDragAndDrop` - Drag and Drop API
- `usePopover` - Popover API
- `useKeyboard` - Keyboard API

### And many more...

## Usage Examples

### Using Local Storage
```typescript
import { useLocalStorage } from 'browser-hooks';

const { getItem, setItem, removeItem } = useLocalStorage();
setItem('key', 'value');
const value = getItem('key');
```

### Using Notifications
```typescript
import { useNotifications } from 'browser-hooks';

const { requestPermission, sendNotification } = useNotifications();
await requestPermission();
sendNotification('Title', { body: 'Message body' });
```

### Using Media Stream
```typescript
import { useMediaStream } from 'browser-hooks';

const { getVideoStream } = useMediaStream();
const stream = await getVideoStream();
```

## Browser Support

Most hooks require modern browser support. Check individual hook documentation for specific browser compatibility information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
