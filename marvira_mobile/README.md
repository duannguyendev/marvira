# Marvira - Location-Based Game App

A production-ready React Native application for location-based gaming with events and places. Built with TypeScript, React Navigation, Google Maps, and modern best practices.

## 🚀 Features

- **Authentication**: Secure login/register with token-based auth
- **Events List**: Browse events with location-based filtering and search
- **Event Details**: View event information with interactive maps
- **Place Game Flow**: Geofenced gameplay - unlock places when within range
- **Real-time Location**: Continuous location tracking with distance calculations
- **Beautiful UI**: Modern, polished interface with smooth animations
- **TypeScript**: Fully typed codebase for better developer experience

## 📋 Prerequisites

- Node.js >= 18
- React Native development environment set up
- iOS: Xcode and CocoaPods
- Android: Android Studio and Android SDK
- Google Maps API key (for map functionality)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd marvira
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **iOS Setup**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Configure Google Maps**

   **iOS** (`ios/AppDelegate.mm`):
   Add your Google Maps API key:
   ```objc
   [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
   ```

   **Android** (`android/app/src/main/AndroidManifest.xml`):
   Add your Google Maps API key:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
   ```

5. **Configure API Base URL**

   Update `src/utils/constants.ts`:
   ```typescript
   export const API_BASE_URL = 'https://your-api-url.com';
   ```

## 🏃 Running the App

### iOS
```bash
npm run ios
# or
yarn ios
```

### Android
```bash
npm run android
# or
yarn android
```

## 📁 Project Structure

```
marvira/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   └── places.ts
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── EventCard.tsx
│   │   ├── PlaceCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorView.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useEvents.ts
│   │   ├── usePlaces.ts
│   │   └── useLocation.ts
│   ├── navigation/       # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── HomeNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   ├── EventsListScreen.tsx
│   │   │   ├── EventDetailsScreen.tsx
│   │   │   ├── PlaceGameScreen.tsx
│   │   │   └── EventCompletionScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── services/         # Business logic services
│   │   ├── auth.service.ts
│   │   └── location.service.ts
│   ├── theme/            # Theme configuration
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── utils/            # Utility functions
│       ├── constants.ts
│       ├── distance.ts
│       └── storage.ts
├── App.tsx
├── index.js
└── package.json
```

## 🔌 API Integration

The app expects the following API endpoints:

### Authentication

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "url",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**POST /auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### Events

**GET /events**
Query params:
- `latitude` (optional): User latitude
- `longitude` (optional): User longitude
- `radius` (optional): Search radius in meters
- `status` (optional): Event status filter
- `search` (optional): Search query

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "event_id",
      "title": "Event Title",
      "description": "Event description",
      "imageUrl": "url",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "status": "in_progress",
      "totalPlaces": 5,
      "completedPlaces": 2,
      "location": {
        "latitude": 37.78825,
        "longitude": -122.4324
      }
    }
  ]
}
```

**GET /events/:eventId**
Response:
```json
{
  "success": true,
  "data": {
    "id": "event_id",
    "title": "Event Title",
    "description": "Event description",
    "status": "in_progress",
    "progress": 40,
    "places": [
      {
        "id": "place_id",
        "eventId": "event_id",
        "name": "Place Name",
        "description": "Place description",
        "question": "What is the answer?",
        "location": {
          "latitude": 37.78825,
          "longitude": -122.4324
        },
        "order": 1,
        "isUnlocked": true,
        "isCompleted": false
      }
    ]
  }
}
```

**POST /events/:eventId/start**
Starts an event for the current user.

### Places

**GET /places/:placeId**
Response:
```json
{
  "success": true,
  "data": {
    "id": "place_id",
    "name": "Place Name",
    "description": "Place description",
    "question": "What is the answer?",
    "location": {
      "latitude": 37.78825,
      "longitude": -122.4324
    },
    "isUnlocked": true,
    "isCompleted": false
  }
}
```

**POST /places/answer**
```json
{
  "placeId": "place_id",
  "answer": "user answer"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "message": "Correct answer!",
    "nextPlaceUnlocked": true,
    "eventCompleted": false
  }
}
```

**POST /places/:placeId/unlock**
Unlocks a place (typically called when user is within range).

## 🎮 Game Flow

1. **User logs in/registers**
2. **Browse events** - View available events with distance and status
3. **Start event** - Begin an event to unlock the first place
4. **Navigate to place** - User must be within 100 meters to unlock
5. **Answer question** - Submit answer when place is unlocked
6. **Unlock next place** - Correct answers unlock the next place
7. **Complete event** - Finish all places to complete the event

## 🔐 Security

- Tokens stored securely using AsyncStorage
- Automatic token refresh on expiration
- Protected routes with auth guards
- Secure API communication with HTTPS

## 📱 Permissions

The app requires the following permissions:

- **Location** (Always/When in Use): Required for geofencing and distance calculations
- **Network**: Required for API calls

## 🎨 Customization

### Theme
Edit `src/theme/colors.ts` and `src/theme/spacing.ts` to customize the app's appearance.

### Constants
Edit `src/utils/constants.ts` to adjust:
- API base URL
- Place unlock distance (default: 100m)
- Location update interval
- Map default region

## 🐛 Troubleshooting

### Maps not showing
- Ensure Google Maps API key is correctly configured
- Check that billing is enabled for your Google Cloud project
- Verify API key has Maps SDK enabled

### Location not working
- Check device location permissions
- Ensure location services are enabled on device
- For iOS, add location usage descriptions to Info.plist

### Build errors
- Run `npm install` or `yarn install` again
- For iOS: `cd ios && pod install && cd ..`
- Clear Metro cache: `npm start -- --reset-cache`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the repository.

