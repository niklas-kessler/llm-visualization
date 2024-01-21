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
            setIdCount(idCount + Node.idCount_temp + 1);
            Node.idCount_temp++;
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
            new Node({type:"final", x:0, y:20, messages: [{role:'system', content:'Based on all the reasoning steps, give a final improved answer'},{role:'assistant', content:'Final answer: ...'}], children:[], parents:[6]}),
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

    console.log("rerender, nodes:", nodes)


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
        
        const node: Node = new Node({type:"user", x:0, y:0, messages: [userMessage], parents: [], children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
            node.x = nodes[selectedNode].x;
            node.y = nodes[selectedNode].y + 5;
        }
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
        
        const node: Node = new Node({type:"forward", x:0, y:0, messages:[assistant_message], parents: [], children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
            node.x = nodes[selectedNode].x;
            node.y = nodes[selectedNode].y + 5;
        }
        appendNodes([node]);        
    }

    function deleteChildren(nodeId: number, nodes: { [id: number]: Node }) {
        const queue: number[] = [nodeId];
        const visited: Set<number> = new Set();
    
        while (queue.length > 0) {
            const currNodeId = queue.shift() as number;
            visited.add(currNodeId);
    
            const currNode = nodes[currNodeId];
            const children = currNode.children ?? [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    queue.push(childId);
                }
            }
    
            delete nodes[currNodeId];
        }
    }

    function reasoning_backward() {
        if (selectedNode === -1) return;

        const curr_node = nodes[selectedNode];
        const parentIds = curr_node.parents?.map(parentId => nodes[parentId].id) ?? [];
        let updatedNodes = {...nodes};
        if ( updatedNodes[selectedNode].type === "split"){
            deleteChildren(selectedNode, updatedNodes);
        } else {
            delete updatedNodes[selectedNode];
            for (const parentId of parentIds) {
                if (parentId !== -1) {
                    updatedNodes[parentId].children?.splice(updatedNodes[parentId].children?.indexOf(selectedNode) as number, 1);   
                }
            }
        }
        setNodes(updatedNodes);
        setSelectedNode(parentIds?.length > 0 ? parentIds[0] : -1);
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
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
            node.x = nodes[selectedNode].x;
            node.y = nodes[selectedNode].y + 5;
        }
        appendNodes([node]);
    }

    async function reasoning_parallel_split() {        
        const response1 = await fetch("/api/chatgpt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [...chatMessages],
                temperature: 0.9,
            }),
        });
        const response2 = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
                messages: [...chatMessages],
                temperature: 0.9,
            })
        });
        const response3 = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
                messages: [...chatMessages],
                temperature: 0.9,
            })
        });
        const result1 = await response1.json();
        const result2 = await response2.json();
        const result3 = await response3.json();
        const assistant_message1: MessageType = {role: result1.choices[0].message.role, content: result1.choices[0].message.content}
        const assistant_message2: MessageType = {role: result2.choices[0].message.role, content: result2.choices[0].message.content}
        const assistant_message3: MessageType = {role: result3.choices[0].message.role, content: result3.choices[0].message.content}
        
        const node_split: Node = new Node({type:"split", x:0, y:0, messages:[], parents: ([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node_split.parents = [selectedNode];
            nodes[selectedNode].children?.push(node_split.id);
            node_split.x = nodes[selectedNode].x;
            node_split.y = nodes[selectedNode].y + 5;
        }
        const node1: Node = new Node({type:"forward", x:(node_split.x - 5), y:(node_split.y + 5), messages:[assistant_message1], parents: ([node_split.id]), children:[]})
        const node2: Node = new Node({type:"forward", x:node_split.x, y:(node_split.y + 5), messages:[assistant_message2], parents: ([node_split.id]), children:[]})
        const node3: Node = new Node({type:"forward", x:(node_split.x + 5), y:(node_split.y + 5), messages:[assistant_message3], parents: ([node_split.id]), children:[]})
        node_split.children = [node1.id, node2.id, node3.id]
        
        appendNodes([node_split, node1, node2, node3]);        
    }

    async function reasoning_aggregate() {
        
        // TODO: Collect branches and augment messageNodes with them

        // system prompt
        const refine_prompt="In 3 different reasoning steps, you have come to 3 different answers. Please overthink. Which one is the most promising and accurate? How can you combine and summarize them?"
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
        
        const node: Node = new Node({type: "aggregate", x:0, y:0, messages:[system_message, assistant_message], parents:([selectedNode]), children:[]}) //extend parents to different branches
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id); //TODO: extend children to different branches
            //TODO: set x to the middle and y to the maximum of the branches
            node.x = nodes[selectedNode].x; 
            node.y = nodes[selectedNode].y + 5;
        }
        appendNodes([node]);
    }

    async function reasoning_attention() {
        const refine_prompt="Reflect about the reasoning steps you have taken. Which were the most important and what have you been able to conclude so far? How can you go on from here to find a solution."
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
        
        const node: Node = new Node({type: "attention", x:0, y:0, messages:[system_message, assistant_message], parents:([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
            node.x = nodes[selectedNode].x;
            node.y = nodes[selectedNode].y + 5;
        }
        appendNodes([node]);
    }

    const reasoning_functions: ReasoningFunctionsType = {
        user: reasoning_user,
        forward: reasoning_forward,
        backward: reasoning_backward,
        refine: reasoning_refine,
        parallel_split: reasoning_parallel_split,
        aggregate: reasoning_aggregate,
        attention: reasoning_attention,
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
