/**
 * 2D Flowchart View - Technical schematic of data flow
 * Monochrome, clean, engineering-style visualization
 */

import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

interface NodeConfig {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  type: 'primary' | 'model' | 'storage';
}

const NODES: NodeConfig[] = [
  { id: 'claude', label: 'CLAUDE', sublabel: 'Cloud API', x: 100, y: 200, type: 'primary' },
  { id: 'orchestrator', label: 'ORCHESTRATOR', sublabel: 'Task Router', x: 350, y: 200, type: 'primary' },
  { id: 'local-7b', label: 'LOCAL 7B', sublabel: 'Mac / Quick Tasks', x: 600, y: 100, type: 'model' },
  { id: 'remote-14b', label: 'REMOTE 14B', sublabel: 'Windows PC / Complex', x: 600, y: 200, type: 'model' },
  { id: 'embeddings', label: 'EMBEDDINGS', sublabel: 'nomic-embed-text', x: 600, y: 300, type: 'model' },
  { id: 'chromadb', label: 'CHROMADB', sublabel: 'Vector Store', x: 850, y: 300, type: 'storage' },
];

const CONNECTIONS: Array<{ from: string; to: string; label?: string }> = [
  { from: 'claude', to: 'orchestrator', label: 'task' },
  { from: 'orchestrator', to: 'local-7b', label: 'simple' },
  { from: 'orchestrator', to: 'remote-14b', label: 'complex' },
  { from: 'orchestrator', to: 'embeddings', label: 'search' },
  { from: 'embeddings', to: 'chromadb', label: 'query' },
  { from: 'remote-14b', to: 'chromadb', label: 'context' },
];

export function FlowchartView() {
  const activeModels = useStore((state) => state.activeModels);
  const stats = useStore((state) => state.stats);
  const events = useStore((state) => state.events);

  return (
    <div className="flowchart-container">
      <svg className="flowchart-svg" viewBox="0 0 1000 450">
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        {CONNECTIONS.map((conn, i) => {
          const from = NODES.find(n => n.id === conn.from)!;
          const to = NODES.find(n => n.id === conn.to)!;
          const isActive = activeModels.has(conn.from) || activeModels.has(conn.to);

          return (
            <ConnectionLine
              key={i}
              x1={from.x + 100}
              y1={from.y + 30}
              x2={to.x}
              y2={to.y + 30}
              label={conn.label}
              active={isActive}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((node) => (
          <FlowchartNode
            key={node.id}
            node={node}
            active={activeModels.has(node.id)}
            stats={stats[node.id]}
          />
        ))}
      </svg>

      {/* Event Timeline */}
      <div className="flowchart-timeline">
        <div className="timeline-label">RECENT ACTIVITY</div>
        <div className="timeline-events">
          {events.slice(0, 8).map((event) => (
            <TimelineEvent key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowchartNode({
  node,
  active,
  stats,
}: {
  node: NodeConfig;
  active: boolean;
  stats?: { calls: number; tokens: number };
}) {
  const width = 120;
  const height = 60;

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {/* Outer glow when active */}
      {active && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={4}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
          className="node-glow"
        />
      )}

      {/* Main box */}
      <rect
        width={width}
        height={height}
        rx={2}
        fill={active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'}
        stroke={active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'}
        strokeWidth={active ? 1.5 : 1}
      />

      {/* Type indicator line */}
      <rect
        y={0}
        width={3}
        height={height}
        fill={
          node.type === 'primary' ? 'rgba(255,255,255,0.6)' :
          node.type === 'model' ? 'rgba(255,255,255,0.4)' :
          'rgba(255,255,255,0.2)'
        }
      />

      {/* Label */}
      <text
        x={width / 2 + 5}
        y={22}
        textAnchor="middle"
        className="node-label"
        fill={active ? '#ffffff' : 'rgba(255,255,255,0.7)'}
      >
        {node.label}
      </text>

      {/* Sublabel */}
      <text
        x={width / 2 + 5}
        y={38}
        textAnchor="middle"
        className="node-sublabel"
        fill="rgba(255,255,255,0.4)"
      >
        {node.sublabel}
      </text>

      {/* Stats */}
      {stats && stats.calls > 0 && (
        <text
          x={width / 2 + 5}
          y={52}
          textAnchor="middle"
          className="node-stats"
          fill="rgba(255,255,255,0.3)"
        >
          {stats.calls} calls
        </text>
      )}

      {/* Active indicator */}
      {active && (
        <circle
          cx={width - 8}
          cy={8}
          r={3}
          fill="#ffffff"
          className="active-indicator"
        />
      )}
    </g>
  );
}

function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  active,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  active: boolean;
}) {
  // Calculate control points for curved line
  const midX = (x1 + x2) / 2;

  // Path for smooth curve
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  // Calculate label position
  const labelX = midX;
  const labelY = (y1 + y2) / 2 - 8;

  return (
    <g>
      {/* Connection line */}
      <path
        d={path}
        fill="none"
        stroke={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
        strokeWidth={active ? 1.5 : 1}
        strokeDasharray={active ? 'none' : '4 4'}
      />

      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
        fill={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}
      />

      {/* Data flow animation when active */}
      {active && (
        <circle r={3} fill="#ffffff" className="flow-dot">
          <animateMotion dur="1s" repeatCount="indefinite" path={path} />
        </circle>
      )}

      {/* Label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          className="connection-label"
          fill="rgba(255,255,255,0.3)"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function TimelineEvent({ event }: { event: ReturnType<typeof useStore.getState>['events'][0] }) {
  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getEventText = () => {
    switch (event.type) {
      case 'model:start': return `${event.model} started`;
      case 'model:complete': return `${event.model} completed`;
      case 'model:error': return `${event.model} error`;
      case 'cache:hit': return 'cache hit';
      case 'route:decision': return `→ ${event.model}`;
      default: return event.type;
    }
  };

  return (
    <motion.div
      className="timeline-event"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="event-time">{time}</span>
      <span className="event-separator">│</span>
      <span className="event-text">{getEventText()}</span>
    </motion.div>
  );
}
