import type { NodeTypes } from '@xyflow/react';
import { WelcomeMessageNode } from './WelcomeMessageNode';
import { IntentClassificationNode } from './IntentClassificationNode';
import { TextBlockNode } from './TextBlockNode';
import { QuickRepliesNode } from './QuickRepliesNode';
import { ApiCallNode } from './ApiCallNode';
import { AiResponseNode } from './AiResponseNode';
import { DirectToAgentNode } from './DirectToAgentNode';

/** Maps each `BotNodeType` to its custom node renderer. Keys must match
 * the `type` field used in the bot-flow JSON shape exactly. */
export const botFlowNodeTypes: NodeTypes = {
  welcomeMessage: WelcomeMessageNode,
  intentClassification: IntentClassificationNode,
  textBlock: TextBlockNode,
  quickReplies: QuickRepliesNode,
  apiCall: ApiCallNode,
  aiResponse: AiResponseNode,
  directToAgent: DirectToAgentNode,
};

export {
  WelcomeMessageNode,
  IntentClassificationNode,
  TextBlockNode,
  QuickRepliesNode,
  ApiCallNode,
  AiResponseNode,
  DirectToAgentNode,
};
