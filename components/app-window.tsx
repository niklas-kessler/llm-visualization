"use client"
import { useState, useEffect } from "react";
import Window from "./window";
import History from "./history";
import { MessageType, ReasoningFunctionsType } from "@/app/utils/types";

interface AppWindowProps {
    showHistory: boolean;
    activeWindows: string[];
}


export default function AppWindow({ showHistory, activeWindows }: AppWindowProps) {
    class Node {
        static idCount_temp = 0;    //temporal counter until compoment is being refreshed, which will 1. update idCount: useState<number> and 2. reset this temporal counter
        id: number;
        type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
        x: number;
        y: number;
        messages: MessageType[];
        parents?: number[];
        children?: number[];
        leaf: () => boolean;
        head: () => boolean;
        
        constructor({ type, x, y, messages, parents, children }: {
            type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
            x: number;
            y: number;
            messages: MessageType[];
            parents?: number[];
            children?: number[];
        }) {
            this.id = idCount + Node.idCount_temp;
            Node.idCount_temp++;
            setIdCount(idCount + Node.idCount_temp + 1);
            this.type = type;
            this.x = x;
            this.y = y;
            this.messages = messages;
            this.parents = parents;
            this.children = children;
            this.leaf = () => (this.children?.length ?? 0) === 0;
            this.head = () => (this.parents?.length ?? 0) === 0
        }
    }

    const initNodes = () => {
        const newNodes: Node[] = [
            new Node({type:"user", x:0, y:0, messages: [{role:'user', content:'A users compliacted question.'}], children:[2]}),
            new Node({type:"forward", x:0, y:5, messages: [{role:'assistant', content:'The LLMs initial stupid answer.'}], children:[3], parents:[0]}),
            new Node({type:"split", x:0, y:10, messages: [], children:[4,5,6], parents:[1]}),
            new Node({type:"tools", x:-5, y:15, messages: [{role:'system', content:'Make tool-calls to check and improve your answer'},{role:'assistant', content:'Tool-Calls: google(Pandas)'},{role:'system', content:'Those are the tools results: ...'}], children:[7], parents:[2]}),
            new Node({type:"forward", x:0, y:15, messages: [{role:'assistant', content:'Another reasoning step'}], children:[7], parents:[2]}),
            new Node({type:"forward", x:5, y:15, messages: [{role:'assistant', content:'Another reasoning step'}], children:[7], parents:[2]}),
            new Node({type:"aggregate", x:0, y:20, messages: [{role:'system', content:'Aggregate the previous steps'},{role:'assistant', content:'Most prompisin seems the answer from google, indicating that ...'}], children:[8], parents:[3,4,5]}),
            new Node({type:"final", x:0, y:20, messages: [{role:'system', content:'Based on all the reasoning steps, give a final improved answer'},{role:'assistant', content:'Final answer: ...'}], parents:[6]}),
            ];
        let nodeDict: {[id:number]:Node} = {};
        
        for (let n of newNodes){
            nodeDict[n.id] = n;
        }
                
        setSelectedNode(idCount + Node.idCount_temp-1);
        return nodeDict;
    }

    const [ selectedNode, setSelectedNode ] = useState<number>(-1); // initialize with -1
    const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
    const [idCount, setIdCount] = useState<number>(0); // use as (idCount + Node.idCount_temp) to get the actual current id
    const [nodes, setNodes] = useState<{ [id: number]: Node }>(initNodes);

    // update collected messages, triggered when selectedNode is changed
    useEffect(() => {
        collectChat();
    }, [selectedNode])

/**
    function appendMessage (newMessages: MessageType[]) {
        let updatedMessages = [...chatMessages];
        for (let m of newMessages){
            updatedMessages.push(m);
        }
        setChatMessages(updatedMessages)
    }
 */
    function collectChat () : void {
        if (selectedNode === -1) {
            setChatMessages([]);
            return;
        }
        
        let node: Node = nodes[selectedNode];
        let prevNode: Node;
        let messageNodes: Node[] = [];
        let chatMessages: MessageType[] = [];
        
        let aggregated = 0; // depth-level

        // backtrack to beginning, collect important nodes on the fly
        let i = 0
        while (!node.head() && i < 3) {
            i++;
            // (2) continue, when split of branches is reached
            console.log("continue collectChat here (unfinished), current node:", node)
            /// (3) place this code in the middle, to include the split and the aggregate nodes themselves
            if (aggregated === 0) {
                messageNodes.push(node);
            }
            // (1) ignore branches that have been aggregated already
            if (node.type === "aggregate"){
                aggregated++;
            } else if (node.type === "split" && aggregated > 0){
                aggregated--;
            };

            // move one up
            node = nodes[node.parents?.[0] as number];
            prevNode = node;
        }
        //push head
        messageNodes.push(node); 
        
        messageNodes.reverse();
        for (let n of messageNodes) {
            for (let m of n.messages){
                chatMessages.push({role:m.role, content:m.content});
            }
        }
        setChatMessages(chatMessages);
    }

    function appendNodes (newNodes: Node[]) {
        let updatedNodes = {...nodes};
        for (let n of newNodes){
            updatedNodes[n.id] = n;            
        }
        setNodes(updatedNodes);
        setSelectedNode(newNodes[newNodes.length - 1].id);
    }


    function reasoning_user(prompt: string) {
        const userMessage: MessageType = {role: "user", content: prompt};            
        
        const node: Node = new Node({type:"user", x:0, y:0, messages: [userMessage], parents: (selectedNode !== -1 ? [selectedNode]: []), children:[]})
        appendNodes([node]);
    }

    async function reasoning_forward() {        
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...chatMessages]
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type:"forward", x:0, y:0, messages:[assistant_message], parents: ([selectedNode]), children:[]})
        appendNodes([node]);        
    }

    function reasoning_backward() {
        if (selectedNode === -1) return;

        const curr_node = nodes[selectedNode];
        const parentId = curr_node.parents?.length ? 
            nodes[curr_node.parents[0]].id 
            : -1
        
        let updatedNodes = {...nodes};
        if ( updatedNodes[selectedNode].type === "split"){
            // TODO: add BFS-algorithm
            delete updatedNodes[selectedNode];
        } else {
            delete updatedNodes[selectedNode];
        }
        setNodes(updatedNodes);
        setSelectedNode(parentId);
    }

    async function reasoning_refine() {
        
        // system prompt
        const refine_prompt="Please overthink your previous answer. Is there anything incorrect"
        const system_message: MessageType = {role: "system", content: refine_prompt}

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...chatMessages]
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type: "refine", x:0, y:0, messages:[system_message, assistant_message], parents:([selectedNode]), children:[]})
        appendNodes([node]);
    }

    const reasoning_functions: ReasoningFunctionsType = {
        user: reasoning_user,
        forward: reasoning_forward,
        backward: reasoning_backward,
        refine: reasoning_refine
    }

    return(
        <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
                {showHistory && (
                    <div className=" basis-1/6 border-r-2 bg-stone-200 border-zinc-400">
                        <History />
                    </div>
                )}
                <div className="flex-1">
                    <Window content={activeWindows[0]} nodes={nodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]} nodes={nodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions}/>
                    </div>
                )}
            </div>
        </main>
    );
}
