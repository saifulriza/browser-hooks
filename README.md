# Browser Hooks

A collection of framework-agnostic browser API utilities with tree-shaking and dynamic import support.

## Installation

### NPM
```bash
npm install browser-hooks
```

### CDN
```html
<!-- UMD build -->
<script src="https://unpkg.com/browser-hooks/dist/browser-hooks.min.js"></script>

<!-- ES Module -->
<script type="module">
  import { loadPushAPI } from 'https://unpkg.com/browser-hooks/dist/index.esm.js';
</script>
```

## Usage

### Dynamic Import (Recommended)
```javascript
// Only loads the Push API code when needed
import { loadPushAPI } from 'browser-hooks';

async function setupPushNotifications() {
  const usePushAPI = await loadPushAPI();
  const api = await usePushAPI();
  
  const subscription = await api.subscribe({
    applicationServerKey: 'your-vapid-key'
  });
  
  console.log('Push subscription:', subscription);
}
```

### Full Import (Not Recommended)
```javascript
import { usePushAPI } from 'browser-hooks/hooks/usePushAPI';

async function setup() {
  const api = await usePushAPI();
  // ... rest of the code
}
```

## Features

- 🌳 Tree-shakeable exports
- 📦 Dynamic imports for better performance
- 🌐 CDN support
- 📱 Framework agnostic
- 💪 TypeScript support
- 🔄 Auto-updating state
- 🧹 Automatic cleanup

## Browser Support

Supports all modern browsers that implement the respective Web APIs.

## Available Hooks

### Async and Background
- `useBackgroundSync` - Background sync API functionality
- `useBackgroundTask` - Schedule and manage background tasks
- `useBeacon` - Send data to a server before page unload

### Storage and Data
- `useLocalStorage` - Local storage operations with type safety
- `useClipboard` - Clipboard read/write operations
- `useCompressionStream` - Compress and decompress data streams
- `useCookieStore` - Modern Cookie Store API operations
- `useCredentialManagement` - Credential Management API
- `useFileSystem` - File System Access API
- `useFile` - File API operations
- `useFileEntry` - File Entry API operations

### Media and Graphics
- `useCanvas` - Canvas API operations
- `useEncryptedMedia` - Encrypted Media Extensions (EME)
- `useEyeDropper` - EyeDropper API for color picking
- `useImageCapture` - Image Capture API
- `useMediaCapabilities` - Media Capabilities API
- `useMediaRecorder` - MediaRecorder API
- `useMediaSession` - Media Session API
- `useMediaSource` - MediaSource Extensions
- `useMediaStream` - MediaStream API
- `usePictureInPicture` - Picture-in-Picture API
- `useScreenCapture` - Screen Capture API
- `useWebAnimations` - Web Animations API

### Device and Sensors
- `useDeviceMemory` - Device Memory API
- `useDeviceOrientation` - Device Orientation API
- `useDevicePosture` - Device Posture API
- `useFullscreen` - Fullscreen API
- `useGeometry` - Geometry Interfaces
- `useIdleDetection` - Idle Detection API
- `useKeyboard` - Keyboard API
- `usePointerEvents` - Pointer Events API
- `usePointerLock` - Pointer Lock API

### Communication and Networking
- `useBroadcastChannel` - BroadcastChannel API
- `useMessageChannel` - MessageChannel API
- `useNavigation` - Navigation API
- `useNetwork` - Network Information API
- `useNotifications` - Notifications API
- `useWebRTC` - WebRTC API
- `useWebTransport` - WebTransport API
- `useWebSocket` - WebSocket API
- `useWebShare` - Web Share API

### Security and Authentication
- `useWebAuthn` - Web Authentication API
- `useWebCrypto` - Web Crypto API
- `usePermissions` - Permissions API
- `usePushAPI` - Push API

### UI and Interaction
- `useCSSCustomHighlight` - CSS Custom Highlight API
- `useCSSOM` - CSS Object Model
- `useCSSPainting` - CSS Painting API
- `useCSSProperties` - CSS Custom Properties
- `useCSSTypedOM` - CSS Typed OM
- `useDragAndDrop` - Drag and Drop API
- `usePopover` - Popover API
- `useResizeObserver` - Resize Observer API

### Performance and Monitoring
- `usePerformance` - Performance API
- `useReportingAPI` - Reporting API
- `useResourceTiming` - Resource Timing API
- `useScheduler` - Scheduler API

### Hardware Access
- `useWebHID` - Web HID API
- `useWebMIDI` - Web MIDI API
- `useWebNFC` - Web NFC API
- `useWebUSB` - Web USB API

### Example Usage

Here's how to use various hooks in your application:

```typescript
// Background Sync
import { useBackgroundSync } from 'browser-hooks';

const sync = await useBackgroundSync();
await sync.register('sync-tag', {
  minInterval: 1000 * 60 * 60 // 1 hour
});

// Device Memory
import { useDeviceMemory } from 'browser-hooks';

const memory = await useDeviceMemory();
console.log('Device memory:', memory.estimate());

// Network Information
import { useNetwork } from 'browser-hooks';

const network = await useNetwork();
network.onChange((info) => {
  console.log('Network type:', info.type);
  console.log('Network speed:', info.downlink);
});
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details

## Support

For questions and support, please open an issue in the GitHub repository.
