import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const WS_BASE_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8080';

type Listener = (message: IMessage) => void;

/**
 * Thin wrapper around a single shared STOMP client (over SockJS) for the
 * whole app. Designed to no-op gracefully when the backend isn't running:
 * connection errors are caught/logged rather than thrown, so pages using
 * `useInboxSocket` / `useLiveMetrics` keep rendering whatever REST already
 * fetched instead of crashing when live updates aren't available.
 */
class SocketClient {
  private client: Client | null = null;
  private connecting = false;
  private connected = false;
  private pendingSubscriptions = new Map<string, Set<Listener>>();
  private activeSubscriptions = new Map<string, StompSubscription>();

  private ensureClient() {
    if (this.client) return this.client;

    // SockJS expects an http(s) URL, not ws(s)://
    const httpUrl = WS_BASE_URL.replace(/^ws/, 'http');

    const client = new Client({
      webSocketFactory: () => new SockJS(`${httpUrl}/ws`) as unknown as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        this.pendingSubscriptions.forEach((listeners, topic) => {
          listeners.forEach((listener) => this.subscribeInternal(topic, listener));
        });
      },
      onStompError: (frame) => {
        // eslint-disable-next-line no-console
        console.warn('[socketClient] STOMP error', frame.headers, frame.body);
      },
      onWebSocketError: (event) => {
        // eslint-disable-next-line no-console
        console.warn('[socketClient] WebSocket error (backend likely offline):', event);
      },
      onDisconnect: () => {
        this.connected = false;
      },
    });

    this.client = client;
    return client;
  }

  connect() {
    try {
      const client = this.ensureClient();
      if (this.connected || this.connecting) return;
      this.connecting = true;
      client.activate();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[socketClient] failed to activate STOMP client:', err);
    } finally {
      this.connecting = false;
    }
  }

  private subscribeInternal(topic: string, listener: Listener) {
    if (!this.client || !this.connected) return;
    try {
      const sub = this.client.subscribe(topic, listener);
      this.activeSubscriptions.set(`${topic}:${listener.toString()}`, sub);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[socketClient] failed to subscribe to ${topic}:`, err);
    }
  }

  /** Subscribe to a STOMP topic. Returns an unsubscribe function. */
  subscribe(topic: string, listener: Listener): () => void {
    try {
      this.connect();
      if (!this.pendingSubscriptions.has(topic)) {
        this.pendingSubscriptions.set(topic, new Set());
      }
      this.pendingSubscriptions.get(topic)!.add(listener);

      if (this.connected) {
        this.subscribeInternal(topic, listener);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[socketClient] subscribe failed, continuing without live updates:', err);
    }

    return () => {
      this.pendingSubscriptions.get(topic)?.delete(listener);
      const key = `${topic}:${listener.toString()}`;
      const sub = this.activeSubscriptions.get(key);
      if (sub) {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
        this.activeSubscriptions.delete(key);
      }
    };
  }

  disconnect() {
    try {
      this.client?.deactivate();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[socketClient] error during disconnect:', err);
    } finally {
      this.connected = false;
    }
  }
}

export const socketClient = new SocketClient();
export default socketClient;
