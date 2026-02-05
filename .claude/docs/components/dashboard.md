# Visualization Dashboard

> Real-time monitoring of the multi-model orchestration system.

## Overview

The dashboard provides visual insight into:

- Model activity (which models are working)
- Data flow between components
- Performance metrics
- Event history

## Design Philosophy

**Clean Technical Aesthetic:**
- Monochrome color scheme (white, gray, black)
- Engineering schematic style
- No flashy colors or animations
- Clear data flow visualization

**Two Views:**
- **2D Schematic** - Flowchart-style, default view
- **3D View** - Subtle depth, same monochrome palette

## Location

```
.claude/dashboard/
├── src/
│   ├── App.tsx              # Main app with view toggle
│   ├── App.css              # Monochrome theme styles
│   ├── components/
│   │   ├── FlowchartView.tsx # 2D schematic view
│   │   ├── Scene.tsx         # 3D view
│   │   └── HUDPanel.tsx      # Side panels
│   ├── stores/
│   │   └── useStore.ts       # Zustand state
│   └── hooks/
│       └── useWebSocket.ts   # Real-time connection + demo mode
├── dist/                     # Built files
└── package.json
```

## Running

```bash
cd .claude/dashboard
npm install
npm run dev    # Development server at localhost:5173
npm run build  # Production build
```

## Views

### 2D Schematic (Default)

Flowchart showing data flow between components:

```
┌─────────┐     ┌─────────────┐     ┌──────────┐
│ CLAUDE  │────►│ ORCHESTRATOR│────►│ LOCAL 7B │
│ Cloud   │     │ Router      │     │ Mac      │
└─────────┘     └──────┬──────┘     └──────────┘
                       │
                       ├────────────►┌──────────┐
                       │             │REMOTE 14B│
                       │             │ Windows  │
                       │             └────┬─────┘
                       │                  │
                       ├────►┌──────────┐ │
                       │     │EMBEDDINGS│ │
                       │     │ Search   │ │
                       │     └────┬─────┘ │
                       │          │       │
                       │          ▼       │
                       │     ┌──────────┐ │
                       └────►│ CHROMADB │◄┘
                             │ Vectors  │
                             └──────────┘
```

Features:
- Active nodes glow
- Connection lines pulse when data flows
- Animated dots travel along active paths
- Event timeline on the right

### 3D View

Same components in 3D space:
- Flat box nodes (not spheres)
- White wireframe outlines
- Subtle depth perception
- Manual rotation/zoom (no auto-rotate)

## Components

### Nodes

Each node represents a system component:

| Node | Label | Description |
|------|-------|-------------|
| Claude | CLAUDE | Claude API (cloud) |
| Orchestrator | ORCHESTRATOR | Task router (Mac) |
| Local 7B | LOCAL 7B | Local Ollama (Mac) |
| Remote 14B | REMOTE 14B | Quality Server (Windows) |
| Embeddings | EMBEDDINGS | nomic-embed-text |
| ChromaDB | CHROMADB | Vector store |

**Node States:**
- **Inactive** - Gray, dim
- **Active** - White, glowing, subtle pulse

### Connections

Lines between nodes show data flow:

- **Dashed** - Inactive path
- **Solid** - Active path
- **Animated dot** - Data flowing

### HUD Panels

Side panels showing:

1. **Model Stats**
   - Calls per model
   - Total tokens
   - Average latency

2. **Event Log**
   - Recent model:start/complete events
   - Route decisions
   - Errors

## State Management

Zustand store (`useStore.ts`):

```typescript
interface State {
  activeModels: Set<string>;  // Currently processing
  stats: Record<string, { calls: number; tokens: number }>;
  events: Event[];  // Recent events (max 50)
}
```

## WebSocket Connection

Connects to orchestrator at `ws://localhost:3334`:

```typescript
// Incoming event types
type Event = {
  type: 'model:start' | 'model:complete' | 'model:error' | 'route:decision' | 'cache:hit';
  model?: string;
  tokens?: number;
  duration?: number;
  error?: string;
  timestamp: number;
};
```

## Demo Mode

For testing without live connections:

```typescript
// In App.tsx
const DEMO_MODE = true;  // Set to false for real data
```

Demo mode simulates:
- Random model activations every 2-4 seconds
- Token counts and durations
- Event stream

## Styling

Monochrome theme in `App.css`:

```css
:root {
  --bg-primary: #0a0a0a;      /* Near black */
  --bg-secondary: #141414;    /* Dark gray */
  --text-primary: #ffffff;    /* White */
  --text-secondary: #888888;  /* Gray */
  --border-active: rgba(255,255,255,0.8);
  --border-inactive: rgba(255,255,255,0.2);
}
```

## Tech Stack

- **React 18** - UI framework
- **Three.js** - 3D rendering (via React Three Fiber)
- **@react-three/drei** - Three.js helpers
- **Framer Motion** - UI animations
- **Zustand** - State management
- **Vite** - Build tool

## Building for Production

```bash
npm run build
# Output in dist/

# Serve locally
npm run preview
```

## Deployment

The dashboard is a static site. Options:

1. **Local only** - Run `npm run dev` when needed
2. **Built files** - Serve `dist/` with any static server
3. **Embedded** - Could be integrated into Electron app

## Customization

### Add a Node

1. Add to `NODE_POSITIONS` and `CONNECTIONS` in `Scene.tsx` / `FlowchartView.tsx`
2. Add to store's stats and activeModels initialization
3. Handle new WebSocket events if needed

### Change Colors

Edit CSS variables in `App.css` or inline styles in components.

### Adjust Layout

Modify node positions in:
- `FlowchartView.tsx`: `NODES` array (x, y coordinates)
- `Scene.tsx`: `NODE_POSITIONS` (x, y, z coordinates)
