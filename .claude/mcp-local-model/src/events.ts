/**
 * Event Emitter for Dashboard WebSocket
 * Broadcasts AI orchestration events for real-time visualization
 */

import { WebSocketServer, WebSocket } from "ws";

export type EventType =
  | 'model:start'
  | 'model:complete'
  | 'model:error'
  | 'cache:hit'
  | 'cache:miss'
  | 'route:decision'
  | 'index:progress';

export interface AIEvent {
  event: EventType;
  data: Record<string, unknown>;
  timestamp: number;
}

class EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private enabled = false;

  /**
   * Start WebSocket server for dashboard connections
   */
  start(port = 3334): void {
    if (this.wss) {
      console.error('[Events] WebSocket server already running');
      return;
    }

    try {
      this.wss = new WebSocketServer({ port, host: '127.0.0.1' });
      this.enabled = true;

      this.wss.on('connection', (ws) => {
        console.error('[Events] Dashboard connected');
        this.clients.add(ws);

        ws.on('close', () => {
          console.error('[Events] Dashboard disconnected');
          this.clients.delete(ws);
        });

        // Send welcome event
        this.send(ws, {
          event: 'model:complete',
          data: { message: 'Connected to Orchestrator' },
          timestamp: Date.now(),
        });
      });

      this.wss.on('error', (error) => {
        console.error('[Events] WebSocket error:', error.message);
      });

      console.error(`[Events] WebSocket server running on ws://127.0.0.1:${port}`);
    } catch (error) {
      console.error('[Events] Failed to start WebSocket server:', error);
    }
  }

  /**
   * Stop WebSocket server
   */
  stop(): void {
    if (this.wss) {
      this.clients.forEach(client => client.close());
      this.clients.clear();
      this.wss.close();
      this.wss = null;
      this.enabled = false;
    }
  }

  /**
   * Broadcast event to all connected dashboards
   */
  emit(type: EventType, data: Record<string, unknown>): void {
    if (!this.enabled || this.clients.size === 0) return;

    const event: AIEvent = {
      event: type,
      data,
      timestamp: Date.now(),
    };

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        this.send(client, event);
      }
    });
  }

  private send(ws: WebSocket, event: AIEvent): void {
    try {
      ws.send(JSON.stringify(event));
    } catch (error) {
      console.error('[Events] Failed to send event:', error);
    }
  }

  /**
   * Convenience methods for specific events
   */
  modelStart(model: string, promptPreview?: string): void {
    this.emit('model:start', {
      model,
      prompt_preview: promptPreview?.substring(0, 100),
    });
  }

  modelComplete(model: string, tokens: number, durationMs: number): void {
    this.emit('model:complete', {
      model,
      tokens,
      duration: durationMs,
    });
  }

  modelError(model: string, error: string): void {
    this.emit('model:error', {
      model,
      error,
    });
  }

  cacheHit(key: string): void {
    this.emit('cache:hit', { key });
  }

  cacheMiss(key: string): void {
    this.emit('cache:miss', { key });
  }

  routeDecision(taskType: string, target: string, reason: string): void {
    this.emit('route:decision', {
      task_type: taskType,
      target,
      reason,
    });
  }
}

// Singleton instance
export const events = new EventEmitter();
