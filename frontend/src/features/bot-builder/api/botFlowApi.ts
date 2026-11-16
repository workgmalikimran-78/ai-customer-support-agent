import httpClient from '@/api/httpClient';
import type { BotFlow } from '../types/botFlow';

// Matches the demo bot flow row seeded by V2__seed_demo_data.sql.
export const DEFAULT_FLOW_ID = '00000000-0000-0000-0000-000000000020';

// Backend's BotFlowDto nests the shared {nodes, edges, startNodeId} graph shape under a
// `graphJson` field rather than flattening it onto the DTO.
interface BotFlowDto {
  id: string;
  name: string;
  graphJson: Pick<BotFlow, 'nodes' | 'edges' | 'startNodeId'>;
}

function toBotFlow(dto: BotFlowDto): BotFlow {
  return {
    id: dto.id,
    name: dto.name,
    nodes: dto.graphJson.nodes,
    edges: dto.graphJson.edges,
    startNodeId: dto.graphJson.startNodeId,
  };
}

function toUpdateRequest(flow: BotFlow) {
  return {
    graphJson: {
      nodes: flow.nodes,
      edges: flow.edges,
      startNodeId: flow.startNodeId,
    },
  };
}

export async function fetchBotFlow(flowId: string = DEFAULT_FLOW_ID): Promise<BotFlow> {
  const { data } = await httpClient.get<BotFlowDto>(`/api/bot-flows/${flowId}`);
  return toBotFlow(data);
}

export async function saveBotFlow(flow: BotFlow): Promise<BotFlow> {
  const { data } = await httpClient.put<BotFlowDto>(
    `/api/bot-flows/${flow.id ?? DEFAULT_FLOW_ID}`,
    toUpdateRequest(flow),
  );
  return toBotFlow(data);
}

export async function publishBotFlow(flow: BotFlow): Promise<BotFlow> {
  const { data } = await httpClient.post<BotFlowDto>(
    `/api/bot-flows/${flow.id ?? DEFAULT_FLOW_ID}/publish`,
  );
  return toBotFlow(data);
}

export interface FlowValidationError {
  nodeId: string;
  message: string;
}

export interface FlowValidationResult {
  valid: boolean;
  errors: FlowValidationError[];
}

export async function validateBotFlow(flow: BotFlow): Promise<FlowValidationResult> {
  const { data } = await httpClient.post<FlowValidationResult>(
    `/api/bot-flows/${flow.id ?? DEFAULT_FLOW_ID}/validate`,
    toUpdateRequest(flow),
  );
  return data;
}
