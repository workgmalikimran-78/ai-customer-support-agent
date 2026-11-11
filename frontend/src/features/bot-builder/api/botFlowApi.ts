import httpClient from '@/api/httpClient';
import type { BotFlow } from '../types/botFlow';
import { DEFAULT_FLOW_ID, MOCK_BOT_FLOW } from './mockBotFlow';

/**
 * Bot-flow API layer. Hits `GET/PUT/POST /api/bot-flows` on the Spring Boot
 * backend, falling back to in-memory mock data whenever the request fails
 * (e.g. the backend isn't running yet in local dev). Swapping to a fully
 * real backend is just deleting the `catch` fallbacks below.
 */

let mockFlowCache: BotFlow = structuredClone(MOCK_BOT_FLOW);

export async function fetchBotFlow(flowId: string = DEFAULT_FLOW_ID): Promise<BotFlow> {
  try {
    const { data } = await httpClient.get<BotFlow>(`/api/bot-flows/${flowId}`);
    return data;
  } catch (err) {
    console.warn('[botFlowApi] fetchBotFlow falling back to mock data:', err);
    return structuredClone(mockFlowCache);
  }
}

export async function saveBotFlow(flow: BotFlow): Promise<BotFlow> {
  try {
    const { data } = await httpClient.put<BotFlow>(`/api/bot-flows/${flow.id ?? DEFAULT_FLOW_ID}`, flow);
    return data;
  } catch (err) {
    console.warn('[botFlowApi] saveBotFlow falling back to mock cache:', err);
    mockFlowCache = structuredClone(flow);
    return structuredClone(mockFlowCache);
  }
}

export async function publishBotFlow(flow: BotFlow): Promise<BotFlow> {
  try {
    const { data } = await httpClient.post<BotFlow>(
      `/api/bot-flows/${flow.id ?? DEFAULT_FLOW_ID}/publish`,
      flow,
    );
    return data;
  } catch (err) {
    console.warn('[botFlowApi] publishBotFlow falling back to mock cache:', err);
    mockFlowCache = structuredClone(flow);
    return structuredClone(mockFlowCache);
  }
}
