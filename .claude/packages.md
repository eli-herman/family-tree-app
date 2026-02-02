# Packages & Documentation

## Tech Stack

### Platform
- **React Native** with **Expo** (cross-platform iOS + Android)

### Backend
- **Firebase**
  - Authentication
  - Firestore (database)
  - Storage (photos/audio)

---

## Core Dependencies

### Framework
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| expo | latest | React Native framework | [docs.expo.dev](https://docs.expo.dev) |
| react-native | latest | Mobile UI framework | [reactnative.dev](https://reactnative.dev/docs/getting-started) |
| react | 18.x | UI library | [react.dev](https://react.dev) |

### Navigation
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| @react-navigation/native | 6.x | Navigation container | [reactnavigation.org](https://reactnavigation.org/docs/getting-started) |
| @react-navigation/bottom-tabs | 6.x | Tab bar navigation | [Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator) |
| @react-navigation/native-stack | 6.x | Stack navigation | [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) |

### Firebase
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| @react-native-firebase/app | latest | Firebase core | [rnfirebase.io](https://rnfirebase.io) |
| @react-native-firebase/auth | latest | Authentication | [Auth Docs](https://rnfirebase.io/auth/usage) |
| @react-native-firebase/firestore | latest | Database | [Firestore Docs](https://rnfirebase.io/firestore/usage) |
| @react-native-firebase/storage | latest | File storage | [Storage Docs](https://rnfirebase.io/storage/usage) |

### UI Components
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| react-native-reanimated | 3.x | Animations | [docs.swmansion.com](https://docs.swmansion.com/react-native-reanimated/) |
| react-native-gesture-handler | latest | Touch gestures | [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| expo-image | latest | Optimized images | [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/) |
| expo-av | latest | Audio recording/playback | [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) |

### Utilities
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| date-fns | latest | Date formatting | [date-fns.org](https://date-fns.org/docs/Getting-Started) |
| zustand | latest | State management | [Zustand](https://github.com/pmndrs/zustand) |
| react-native-mmkv | latest | Fast local storage | [MMKV](https://github.com/mrousavy/react-native-mmkv) |

### Icons
| Package | Version | Purpose | Docs |
|---------|---------|---------|------|
| @expo/vector-icons | latest | Icon library | [Expo Icons](https://docs.expo.dev/guides/icons/) |
| react-native-heroicons | latest | Heroicons for RN | [Heroicons](https://heroicons.com) |

---

## Quick Links

### Documentation
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Firebase Console](https://console.firebase.google.com)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

### Design Resources
- [Heroicons](https://heroicons.com) - Icon library
- [Inter Font](https://rsms.me/inter/) - Typography
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) - Color reference

### Tutorials & References
- [Expo + Firebase Setup](https://docs.expo.dev/guides/using-firebase/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)

---

## Firebase Optimization Notes

### Read/Write Cost Reduction
- Use pagination for feeds (limit queries to 20 items)
- Cache family tree data locally
- Batch writes when possible
- Use Firestore listeners sparingly

### Media Handling
- Compress images before upload (max 1200px width)
- Use thumbnails for feed previews
- Lazy load images
- Audio: compress to 64kbps AAC

### Data Model Tips
- Denormalize where it reduces reads
- Store feed items as subcollection
- Profile data separate from auth user
- Family membership as separate collection

---

## Package Notes

### Known Issues
- *None documented yet*

### Tips & Tricks
- *To be added as discovered*

---

*Last updated: 2026-02-01*
