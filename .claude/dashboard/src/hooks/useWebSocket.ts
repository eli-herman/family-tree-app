import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../stores/useStore';

const ORCHESTRATOR_WS = 'ws://localhost:3334';  // Local orchestrator
const QUALITY_SERVER_WS = 'ws://192.168.1.190:4001';  // Remote quality server

export function useWebSocket() {
  const orchestratorRef = useRef<WebSocket | null>(null);
  const qualityServerRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const {
    setConnected,
    addEvent,
    updateStats,
    setModelActive,
    incrementCache,
    addTokensSaved,
  } = useStore();

  const handleMessage = useCallback((data: any, _source: string) => {
    const { event, data: eventData, timestamp } = data;

    // Create event for the log
    const logEvent = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type: event,
      model: eventData.model,
      data: eventData,
    };
    addEvent(logEvent);

    // Handle specific events
    switch (event) {
      case 'model:start':
        setModelActive(eventData.model, true);
        break;

      case 'model:complete':
        setModelActive(eventData.model, false);
        updateStats(eventData.model, {
          calls: (useStore.getState().stats[eventData.model]?.calls || 0) + 1,
          tokens: (useStore.getState().stats[eventData.model]?.tokens || 0) + (eventData.tokens || 0),
          lastActive: timestamp,
        });

        // Track tokens saved (local model usage = tokens not sent to Claude)
        if (eventData.model !== 'claude') {
          addTokensSaved(eventData.tokens || 0);
        }
        break;

      case 'model:error':
        setModelActive(eventData.model, false);
        updateStats(eventData.model, {
          errors: (useStore.getState().stats[eventData.model]?.errors || 0) + 1,
        });
        break;

      case 'cache:hit':
        incrementCache(true);
        break;

      case 'cache:miss':
        incrementCache(false);
        break;

      case 'route:decision':
        // Could add visual feedback for routing decisions
        break;

      default:
        console.log('Unknown event:', event, eventData);
    }
  }, [addEvent, setModelActive, updateStats, incrementCache, addTokensSaved]);

  const connectWebSocket = useCallback((
    url: string,
    ref: React.MutableRefObject<WebSocket | null>,
    name: string
  ) => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`Connected to ${name}`);
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data, name);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error (${name}):`, error);
      };

      ws.onclose = () => {
        console.log(`Disconnected from ${name}`);
        ref.current = null;

        // Check if both are disconnected
        if (!orchestratorRef.current && !qualityServerRef.current) {
          setConnected(false);
        }

        // Attempt reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Attempting to reconnect to ${name}...`);
          connectWebSocket(url, ref, name);
        }, 5000);
      };

      ref.current = ws;
    } catch (e) {
      console.error(`Failed to connect to ${name}:`, e);
    }
  }, [handleMessage, setConnected]);

  useEffect(() => {
    // Connect to both WebSocket servers
    connectWebSocket(ORCHESTRATOR_WS, orchestratorRef, 'Orchestrator');
    connectWebSocket(QUALITY_SERVER_WS, qualityServerRef, 'Quality Server');

    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.close();
      }
      if (qualityServerRef.current) {
        qualityServerRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  return {
    orchestratorConnected: !!orchestratorRef.current,
    qualityServerConnected: !!qualityServerRef.current,
  };
}

// Demo mode - generates fake events for testing without real connections
export function useDemoMode() {
  const {
    addEvent,
    setModelActive,
    updateStats,
    incrementCache,
    addTokensSaved,
    setConnected,
  } = useStore();

  useEffect(() => {
    setConnected(true);

    const models = ['local-7b', 'remote-32b', 'embeddings', 'claude'];
    const eventTypes = ['model:start', 'model:complete', 'cache:hit', 'route:decision'];

    const interval = setInterval(() => {
      const model = models[Math.floor(Math.random() * models.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const tokens = Math.floor(Math.random() * 500) + 100;

      if (eventType === 'model:start') {
        setModelActive(model, true);

        // Complete after random delay
        setTimeout(() => {
          setModelActive(model, false);
          updateStats(model, {
            calls: (useStore.getState().stats[model]?.calls || 0) + 1,
            tokens: (useStore.getState().stats[model]?.tokens || 0) + tokens,
            lastActive: Date.now(),
          });

          if (model !== 'claude') {
            addTokensSaved(tokens);
          }

          addEvent({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: 'model:complete',
            model: model as any,
            data: { tokens, duration: Math.floor(Math.random() * 3000) + 500 },
          });
        }, Math.random() * 2000 + 500);
      }

      if (eventType === 'cache:hit') {
        incrementCache(Math.random() > 0.3);
      }

      addEvent({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: eventType as any,
        model: model as any,
        data: { tokens },
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      setConnected(false);
    };
  }, [addEvent, setModelActive, updateStats, incrementCache, addTokensSaved, setConnected]);
}
