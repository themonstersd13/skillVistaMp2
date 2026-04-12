# SkillVista Mobile Subsystem

Complete React Native iOS/Android implementation connecting natively to the SkillVista FastAPI backend.

## Structure

The entire Mobile frontend has been integrated into `App.js` with decoupled network logic resting securely in `api.js`.

*   **api.js**: A centralized `fetch` based connectivity layer. Wraps user authentication loops natively through backend token exchange (`/auth/login`) and automatically embeds credentials on all subsequent Cohort array requests.
*   **App.js**: The core React tree navigating role-identities. Instantiates conditional UI structures for `Faculty` vs `Student`. Renders native graphical vectors using `react-native-chart-kit` and custom styling blocks.

## Development

Requires standard React Native + Expo bindings.

```powershell
npm install
```

Launch the Metro local server:

```powershell
npm start
```

Press `i` to launch in the local iOS Simulator or `a` to route to Android.

## Configuration

To route network payloads to your local machine, assure the mobile device or simulator can access `localhost:8000`. If testing on a physical networked device, update the IP literal inside `BASE_URL` in `api.js` explicitly.
