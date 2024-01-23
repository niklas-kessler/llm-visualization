export interface ChatMessageType {
    role: string,
    content: string
}

export interface MessageType {
    role: string,
    content: string
}

export interface ReasoningFunctionsType {
    user: (prompt: string) => void,
    forward: () => void,
    backward: () => void,
    refine: () => void,
    parallel_split: () => void,
    aggregate: () => void,
    attention: () => void,
}

export interface Node {
    id: number;
    type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
    messages: MessageType[];
    parents?: number[];
    children?: number[];
    level: () => number;
    leaf: () => boolean;
    head: () => boolean;
}

export interface GraphNode {
    id: number;
    type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
    x: number;
    y: number;
    messages: MessageType[];
    parents?: number[];
    children?: number[];
    leaf: () => boolean;
    head: () => boolean;
}

export interface GraphLink {
    source: GraphNode;
    target: GraphNode;
    dashed?: boolean;
}