export interface MessageType {
    role: string,
    content: string
}
export interface ReasoningFunctionsType {
    user: (prompt: string) => void,
    forward: () => void,
    backward: () => void,
    refine: () => void
}