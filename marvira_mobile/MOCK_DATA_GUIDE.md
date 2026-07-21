# Mock Data Guide

The app is now configured to use **mock data in development mode**. This allows you to test the app without a backend API.

## How It Works

- **Development Mode**: Mock data is automatically used when `__DEV__` is true
- **Production Mode**: The app will use the real API (configure `API_BASE_URL` in `src/utils/constants.ts`)

## Authentication

### Login

- **Any email/password combination will work** in mock mode
- Example: `user@example.com` / `password123`
- The app will automatically create a mock user with your email

### Register

- Any registration will succeed in mock mode
- User data will be stored locally

## Mock Events

The app includes 3 sample events:

1. **Downtown Adventure** (In Progress)
   - 5 places, 2 completed
   - Event ID: `1`

2. **Historical Tour** (Not Started)
   - 8 places, 0 completed
   - Event ID: `2`

3. **Nature Walk** (Completed)
   - 6 places, all completed
   - Event ID: `3`

## Mock Places & Answers

### Event 1: Downtown Adventure

| Place            | Question                                               | Correct Answer |
| ---------------- | ------------------------------------------------------ | -------------- |
| City Square      | What is the name of the statue in the center?          | `Liberty`      |
| Historic Library | In what year was this library built?                   | `1897`         |
| Art Gallery      | What is the name of the current featured artist?       | `Van Gogh`     |
| Riverside Park   | How many bridges cross the river in this park?         | `3`            |
| Observation Deck | What is the height of this observation deck in meters? | `150`          |

### Event 2: Historical Tour

| Place           | Question                                          | Correct Answer |
| --------------- | ------------------------------------------------- | -------------- |
| Museum Entrance | What is the architectural style of this building? | `Neoclassical` |

## Testing the App

1. **Login/Register**: Use any credentials
2. **Browse Events**: You'll see 3 mock events
3. **Start Event**: Click "Start Event" on any event
4. **Answer Questions**: Use the correct answers above to test the flow
5. **Complete Event**: Answer all questions correctly to see the completion screen

## Location Testing

- The mock places use San Francisco coordinates (37.78825, -122.4324)
- To test geofencing, you may need to simulate location or adjust the unlock distance in `src/utils/constants.ts`

## Disabling Mock Data

To use real API:

1. Set `USE_MOCK_DATA = false` in `src/utils/constants.ts`
2. Update `API_BASE_URL` with your actual API endpoint
3. Rebuild the app

## Customizing Mock Data

Edit `src/api/mockData.ts` to:

- Add more events
- Add more places
- Change questions and answers
- Modify event statuses
