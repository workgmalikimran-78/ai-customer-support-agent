"""Pydantic models describing the visual bot-flow graph.

Nodes carry a strongly-typed `data.config` payload selected via a
discriminated union keyed on the node `type`. Edges optionally carry a
`condition` dict that the flow engine evaluates against session
variables / the latest classification / quick-reply selection.
"""
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, Field
from typing_extensions import Annotated


NodeType = Literal[
    "welcomeMessage",
    "intentClassification",
    "textBlock",
    "quickReplies",
    "apiCall",
    "aiResponse",
    "directToAgent",
]


# ---------------------------------------------------------------------------
# Per-node-type config payloads
# ---------------------------------------------------------------------------
class WelcomeMessageConfig(BaseModel):
    type: Literal["welcomeMessage"] = "welcomeMessage"
    text: str


class IntentClassificationConfig(BaseModel):
    type: Literal["intentClassification"] = "intentClassification"
    intents: List[str]


class TextBlockConfig(BaseModel):
    type: Literal["textBlock"] = "textBlock"
    text: str


class QuickRepliesConfig(BaseModel):
    type: Literal["quickReplies"] = "quickReplies"
    text: str
    options: List[str]


class ApiCallConfig(BaseModel):
    type: Literal["apiCall"] = "apiCall"
    url: str
    method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    body: Optional[Dict[str, Any]] = None
    timeoutSeconds: float = 10.0


class AiResponseConfig(BaseModel):
    type: Literal["aiResponse"] = "aiResponse"
    promptTemplate: str


class DirectToAgentConfig(BaseModel):
    type: Literal["directToAgent"] = "directToAgent"
    reason: str


NodeConfig = Annotated[
    Union[
        WelcomeMessageConfig,
        IntentClassificationConfig,
        TextBlockConfig,
        QuickRepliesConfig,
        ApiCallConfig,
        AiResponseConfig,
        DirectToAgentConfig,
    ],
    Field(discriminator="type"),
]


# ---------------------------------------------------------------------------
# Node / edge / graph
# ---------------------------------------------------------------------------
class NodeData(BaseModel):
    config: NodeConfig
    label: Optional[str] = None


class NodePosition(BaseModel):
    x: float = 0.0
    y: float = 0.0


class FlowNode(BaseModel):
    id: str
    type: NodeType
    position: NodePosition = Field(default_factory=NodePosition)
    data: NodeData


class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    condition: Optional[Dict[str, Any]] = None


class FlowGraph(BaseModel):
    nodes: List[FlowNode]
    edges: List[FlowEdge]
    startNodeId: str

    def get_node(self, node_id: str) -> Optional[FlowNode]:
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None

    def outgoing_edges(self, node_id: str) -> List[FlowEdge]:
        return [edge for edge in self.edges if edge.source == node_id]


# Node types that are expected to have at least one outgoing edge
# (i.e. non-terminal node types).
NON_TERMINAL_NODE_TYPES = {
    "welcomeMessage",
    "intentClassification",
    "textBlock",
    "quickReplies",
    "apiCall",
    "aiResponse",
}

TERMINAL_NODE_TYPES = {"directToAgent"}
