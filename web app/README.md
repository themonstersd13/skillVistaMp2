# SKILLVISTA Web Portal

State-of-the-art React + Vite candidate portal and Faculty administration panel. This interface serves as the primary touch-point, communicating with the backend's core inference engine via HTTP and bidirectional Socket.IO events.

## Architecture & Design System

The frontend has been entirely rebuilt utilizing a highly constrained, premium design token system.

*   **Variables**: Global variables established in `index.css` under the `.sv-` namespace.
*   **Aesthetics**: A beautiful "Slate" dark theme using gradients of `--app-bg` (`#0B1120`), balanced with a rich Indigo primary brand marker (`#4F46E5`).
*   **Typography**: Strict migration to Google's Inter font.
*   **SVGs & Visuals**: Completely stripped of heavy external chart bloat. Radar and Growth UI vectors are raw, calculated React SVG outputs mapping explicitly to backend `analytics` endpoints.

## Implemented Workspace Components

### Student
*   **AppShell**: Collapsed left-sidebar allowing ultra-immersive window widths.
*   **LiveInterviewArena**: Full-bleed rendering of user video. Powered by isolated dock controls for mic and recording. Native `MicVisualizer` provides immediate Web API-driven audio feedback.
*   **ReportPage**: Actionable SWOT arrays tagged with semantic icons, driving a responsive radar coordinate plotter.

### Faculty
*   **FacultyDashboard**: Rapid data-grid detailing every cohort user. Filterable natively tracking real readiness scores mapping back from the deferred `analytics_worker`. Complete with CSV exporting capabilities and drill-down historical overlays.

## Run Locally

Create `.env` based on `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_SOCKET_PATH=/socket.io
```

Execute initialization:

```powershell
npm install
npm run dev
```
