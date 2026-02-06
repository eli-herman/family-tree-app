import { motion } from 'framer-motion';
import { useStore } from '../stores/useStore';

export function HUDPanels() {
  return (
    <div className="hud-container">
      <LeftPanel />
      <RightPanel />
      <TopBar />
      <BottomBar />
    </div>
  );
}

function TopBar() {
  const connected = useStore((state) => state.connected);

  return (
    <motion.div
      className="hud-top"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="hud-title">
        <span className="hud-icon">&#9670;</span>
        <span>A.I. ORCHESTRATION SYSTEM</span>
        <span className="hud-icon">&#9670;</span>
      </div>
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {connected ? 'CONNECTED' : 'DISCONNECTED'}
      </div>
    </motion.div>
  );
}

function LeftPanel() {
  const stats = useStore((state) => state.stats);
  const cacheHits = useStore((state) => state.cacheHits);
  const cacheMisses = useStore((state) => state.cacheMisses);

  const cacheRate = cacheHits + cacheMisses > 0
    ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)
    : 0;

  return (
    <motion.div
      className="hud-panel hud-left"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel-header">
        <span className="bracket">[</span>
        MODEL STATISTICS
        <span className="bracket">]</span>
      </div>

      <div className="panel-content">
        <ModelStat
          name="CLAUDE"
          color="#ff6b35"
          calls={stats['claude']?.calls || 0}
          tokens={stats['claude']?.tokens || 0}
        />
        <ModelStat
          name="LOCAL 7B"
          color="#00ff88"
          calls={stats['local-7b']?.calls || 0}
          tokens={stats['local-7b']?.tokens || 0}
        />
        <ModelStat
          name="REMOTE 14B"
          color="#ff00ff"
          calls={stats['remote-14b']?.calls || 0}
          tokens={stats['remote-14b']?.tokens || 0}
        />
        <ModelStat
          name="EMBEDDINGS"
          color="#ffff00"
          calls={stats['embeddings']?.calls || 0}
          tokens={stats['embeddings']?.tokens || 0}
        />

        <div className="divider"></div>

        <div className="cache-stats">
          <div className="stat-label">CACHE EFFICIENCY</div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${cacheRate}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="stat-value">{cacheRate}%</div>
        </div>
      </div>

      <div className="panel-decoration">
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket top-right"></div>
        <div className="corner-bracket bottom-left"></div>
        <div className="corner-bracket bottom-right"></div>
      </div>
    </motion.div>
  );
}

function RightPanel() {
  const events = useStore((state) => state.events);
  const totalTokensSaved = useStore((state) => state.totalTokensSaved);

  return (
    <motion.div
      className="hud-panel hud-right"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="panel-header">
        <span className="bracket">[</span>
        EVENT LOG
        <span className="bracket">]</span>
      </div>

      <div className="panel-content event-log">
        {events.slice(0, 15).map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <div className="no-events">Awaiting events...</div>
        )}
      </div>

      <div className="divider"></div>

      <div className="savings-display">
        <div className="stat-label">TOKENS OFFLOADED</div>
        <motion.div
          className="big-number"
          key={totalTokensSaved}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {totalTokensSaved.toLocaleString()}
        </motion.div>
      </div>

      <div className="panel-decoration">
        <div className="corner-bracket top-left"></div>
        <div className="corner-bracket top-right"></div>
        <div className="corner-bracket bottom-left"></div>
        <div className="corner-bracket bottom-right"></div>
      </div>
    </motion.div>
  );
}

function BottomBar() {
  const activeModels = useStore((state) => state.activeModels);

  return (
    <motion.div
      className="hud-bottom"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="active-processes">
        {Array.from(activeModels).map((model) => (
          <div key={model} className="active-badge">
            <span className="pulse"></span>
            {model.toUpperCase()}
          </div>
        ))}
        {activeModels.size === 0 && (
          <span className="idle-text">SYSTEM IDLE</span>
        )}
      </div>
    </motion.div>
  );
}

function ModelStat({
  name,
  color,
  calls,
  tokens
}: {
  name: string;
  color: string;
  calls: number;
  tokens: number;
}) {
  return (
    <div className="model-stat">
      <div className="model-indicator" style={{ backgroundColor: color }}></div>
      <div className="model-info">
        <div className="model-name">{name}</div>
        <div className="model-numbers">
          <span>{calls} calls</span>
          <span className="separator">|</span>
          <span>{tokens.toLocaleString()} tokens</span>
        </div>
      </div>
    </div>
  );
}

function EventItem({ event }: { event: ReturnType<typeof useStore.getState>['events'][0] }) {
  const getEventColor = () => {
    switch (event.type) {
      case 'model:complete': return '#00ff88';
      case 'model:start': return '#00d4ff';
      case 'model:error': return '#ff4444';
      case 'cache:hit': return '#ffff00';
      case 'route:decision': return '#ff00ff';
      default: return '#ffffff';
    }
  };

  const getEventText = () => {
    switch (event.type) {
      case 'model:start':
        return `${event.model?.toUpperCase()} processing...`;
      case 'model:complete':
        return `${event.model?.toUpperCase()} completed (${event.data.tokens} tokens)`;
      case 'model:error':
        return `${event.model?.toUpperCase()} error`;
      case 'cache:hit':
        return `Cache hit`;
      case 'route:decision':
        return `Routed to ${event.model?.toUpperCase()}`;
      default:
        return event.type;
    }
  };

  const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <motion.div
      className="event-item"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <span className="event-time">{time}</span>
      <span className="event-dot" style={{ backgroundColor: getEventColor() }}></span>
      <span className="event-text">{getEventText()}</span>
    </motion.div>
  );
}
