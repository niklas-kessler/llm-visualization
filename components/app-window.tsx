"use client"
import { useState, useEffect } from "react";
import Window from "./window";
import History from "./history";
import { MessageType, ReasoningFunctionsType } from "@/app/utils/types";
import { extract_keywords } from "@/app/utils/utils";

interface AppWindowProps {
    showHistory: boolean;
    activeWindows: string[];
}


export default function AppWindow({ showHistory, activeWindows }: AppWindowProps) {    
    class Node {
        static idCount_temp = 0;    //temporal counter until compoment is being refreshed, which will 1. update idCount: useState<number> and 2. reset this temporal counter
        id: number;
        type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
        messages: MessageType[];
        keywords?: string[] = [];
        selectedKeywordsContained?: string[];
        parents?: number[];
        children?: number[];
        leaf: () => boolean;
        head: () => boolean;
        
        constructor({ type, messages, parents, children }: {
            type: "user" | "forward" | "tools" | "split" | "aggregate" | "refine" | "attention" | "final";
            messages: MessageType[];
            parents?: number[];
            children?: number[];
        }) {
            this.id = idCount + Node.idCount_temp;
            setIdCount(idCount + Node.idCount_temp + 1);
            Node.idCount_temp++;
            this.type = type;
            //maximum level of parents + 1
            this.messages = messages;
            this.parents = parents;
            this.children = children;
            this.leaf = () => (this.children?.length ?? 0) === 0;
            this.head = () => (this.parents?.length ?? 0) === 0;
        }

        level(this: Node, nodes: { [id:number]: Node}): number {
            if (this.parents === undefined || this.parents.length === 0) {
                return 0;
            }
            const parentNodes = this.parents?.map((parentId: number) => nodes[parentId]?.level(nodes));
            return Math.max(...parentNodes) + 1;
        }    

        // find the aggregate node that aggregates the current branch with the other two that are on the same level
        findAggregate(this: Node, nodes: { [id:number]: Node}): Node | undefined {
            let curr_node = this;
            let splits = 0;

            // until leaf
            while (!curr_node.leaf()){
                if(curr_node.type === "split") splits++;
                if(curr_node.type === "aggregate") splits--;
                if(splits === 0) return curr_node;
                curr_node = nodes[curr_node.children?.[0] as number];
            }

            // once more for the leaf
            if (curr_node.type === "aggregate") splits--;
            if (splits === 0) return curr_node;
            return undefined;
        }

        // find the split node that generated the current branch
        findSplit(this: Node, nodes: { [id:number]: Node}): Node | undefined {
            let curr_node = this;
            let aggregates = 1;
            while (!curr_node.head()){
                if(curr_node.type === "aggregate") aggregates++;
                if(curr_node.type === "split") aggregates--;
                if(aggregates === 0) return curr_node;
                curr_node = nodes[curr_node.parents?.[0] as number];
            }

            // once more for the head
            if(curr_node.type === "split") aggregates--;
            if(aggregates === 0) return curr_node;
            return undefined;
        }
    }

    const initNodes = () => {
        const newNodes: Node[] = [
            new Node({type:"user", messages: [{role:'user', content:'A users compliacted question.'}], children:[1]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'The LLMs initial stupid answer.'}], children:[2], parents:[0]}),
            new Node({type:"split", messages: [], children:[3,4,5], parents:[1]}),
            new Node({type:"tools", messages: [{role:'system', content:'Make tool-calls to check and improve your answer'},{role:'assistant', content:'Tool-Calls: google(Pandas)'},{role:'system', content:'Those are the tools results: ...'}], children:[6], parents:[2]}),
            /*new Node({type:"split", messages: [], children:[6,7,8], parents:[2]}),            
            new Node({type:"split", messages: [], children:[9,10,11], parents:[2]}),            
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[4]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[4]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[4]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[5]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[5]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Test'}], children:[], parents:[5]}),*/
            new Node({type:"forward", messages: [{role:'assistant', content:'Another reasoning step'}], children:[6], parents:[2]}),
            new Node({type:"forward", messages: [{role:'assistant', content:'Another reasoning step'}], children:[6], parents:[2]}),
            new Node({type:"aggregate", messages: [{role:'system', content:'Aggregate the previous steps'},{role:'assistant', content:'Most prompisin seems the answer from google, indicating that ...'}], children:[7], parents:[3,4,5]}),
            new Node({type:"final",  messages: [{role:'system', content:'Based on all the reasoning steps, give a final improved answer'},{role:'assistant', content:'Final answer: ...'}], children:[], parents:[6]}),
            ];
        let nodeDict: {[id:number]:Node} = {};
        
        for (let n of newNodes){
            nodeDict[n.id] = n;
        }
                
        setSelectedNode(idCount + Node.idCount_temp-1);
        return nodeDict;
    }

    const [selectedNode, setSelectedNode ] = useState<number>(-1); // initialize with -1
    const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
    const [idCount, setIdCount] = useState<number>(0); // use as (idCount + Node.idCount_temp) to get the actual current id
    const [nodes, setNodes] = useState<{ [id: number]: Node }>(initNodes);

    console.log("rerender, nodes:", nodes)
    // print level of nodes

    // update collected messages, triggered when selectedNode is changed
    useEffect(() => {
        collectChat();
    }, [selectedNode])

    function collectChat ( nodeId: number = selectedNode ) : MessageType[] {
        if (nodeId === -1) {
            setChatMessages([]);
            return [];
        }
        
        let node: Node = nodes[nodeId];
        let prevNode: Node;
        let messageNodes: Node[] = [];
        let chatMessages: MessageType[] = [];
        
        let aggregated = 0; // depth-level

        // backtrack to beginning, collect important nodes on the fly
        while (!node.head()) {
            if (aggregated === 0) {
                messageNodes.push(node);
            }
            // ignore branches that have been aggregated already
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
        return chatMessages;
    }

    function appendNodes (newNodes: Node[]) {
        let updatedNodes = {...nodes};
        for (let n of newNodes){
            updatedNodes[n.id] = n;            
        }
        setNodes(updatedNodes);
        setSelectedNode(newNodes[newNodes.length - 1].id);
    }


    async function reasoning_user(prompt: string) {
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        const userMessage: MessageType = {role: "user", content: prompt};            
        
        const node: Node = new Node({type:"user", messages: [userMessage], parents: [], children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        extract_keywords({"inputs": node.messages.map(m => m.content)}).then((keywords) => {
            node.keywords = keywords
            appendNodes([node]);
        });
    }

    async function reasoning_forward() {

        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...chatMessages],
            use_tools: false
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type:"forward", messages:[assistant_message], parents: [], children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        extract_keywords({"inputs": node.messages.map(m => m.content)}).then((keywords) => {
            node.keywords = keywords
            appendNodes([node]);
        });
    }


    async function reasoning_tools() {
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        const system_message_before = {role:'system', content:'Make tool-calls to check and improve your answer'}

        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...chatMessages, system_message_before],
            use_tools: true
            })
        });
        const result = await response.json();
        console.log(result)

        const res_mess = result.choices[0].message;
        const assistant_message: MessageType = {role: res_mess.role, content: res_mess.content? res_mess.content : res_mess.tool_calls.map((tool_call: any) => tool_call.function.name + ", " + tool_call.function.arguments).join("\n ")}

        let tool_result = "";
        let tool_results_string = "";

        for (let tool_call of res_mess.tool_calls) {
            const tool_answer = await fetch("/api/simulate_tool", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                    },
                body:JSON.stringify({
                    tool: tool_call.function.name,
                    tool_args: tool_call.function.arguments
                })
            });
            tool_result = (await tool_answer.json()).result;
            tool_results_string += "Tool " + tool_call.function.name + " with arguments " + tool_call.function.arguments + " gave result: " + tool_result + "\n";    
        }
        
        
        const system_message_after = { role: 'system', content: tool_results_string };

        const node: Node = new Node({ type: "tools", messages: [system_message_before, assistant_message, system_message_after], parents: [], children: [] });
        if (selectedNode !== -1) {
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        extract_keywords({"inputs": [tool_result]}).then((keywords) => {
            node.keywords = keywords
            appendNodes([node]);
        });
    }

    function deleteChildren(nodeId: number, nodes: { [id: number]: Node }) {
        const queue: number[] = [nodeId];
        const visited: Set<number> = new Set();
    
        while (queue.length > 0) {
            const currNodeId = queue.shift() as number;
            if (visited.has(currNodeId)) continue;
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
        if (updatedNodes[selectedNode].children) {
            deleteChildren(selectedNode, updatedNodes);
        } 
        
        delete updatedNodes[selectedNode];
        for (const parentId of parentIds) {
            if (parentId !== -1) {
                updatedNodes[parentId].children?.splice(updatedNodes[parentId].children?.indexOf(selectedNode) as number, 1);   
            }
        }

        setNodes(updatedNodes);
        setSelectedNode(parentIds?.length > 0 ? parentIds[0] : -1);
    }

    async function reasoning_refine() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

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
        
        const node: Node = new Node({type: "refine",  messages:[system_message, assistant_message], parents:([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        extract_keywords({"inputs": [node.messages[1].content]}).then((keywords) => {
            node.keywords = keywords
            appendNodes([node]);
        });
    }

    async function reasoning_parallel_split() {        
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

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

        const node_split: Node = new Node({type:"split", messages:[], parents: ([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node_split.parents = [selectedNode];
            nodes[selectedNode].children?.push(node_split.id);
        }
        const node1: Node = new Node({type:"forward", messages:[assistant_message1], parents: ([node_split.id]), children:[]})
        const node2: Node = new Node({type:"forward", messages:[assistant_message2], parents: ([node_split.id]), children:[]})
        const node3: Node = new Node({type:"forward", messages:[assistant_message3], parents: ([node_split.id]), children:[]})
        node_split.children = [node1.id, node2.id, node3.id]
        extract_keywords({"inputs": node1.messages.map(m => m.content)}).then((keywords) => {
            node1.keywords = keywords
            console.log("extracted keywords 1", node1.keywords)
        });
        extract_keywords({"inputs": node2.messages.map(m => m.content)}).then((keywords) => {
            node2.keywords = keywords
            console.log("extracted keywords 2", node2.keywords)
        });
        extract_keywords({"inputs": node3.messages.map(m => m.content)}).then((keywords) => {
            node3.keywords = keywords
            console.log("extracted keywords 3", node3.keywords)
            appendNodes([node_split, node1, node2, node3]);        
        });
    }
         
    async function reasoning_aggregate() {
        console.log("reasoning_aggregate, selectedNode", selectedNode)
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        let split_node = nodes[selectedNode].findSplit(nodes);
        if (split_node === undefined) return;

        async function aggregate(node: Node, i:number) {

            console.log("aggregate with node", node, "i ", i)
            
            if (node.type !== "split")
                return;
            
            let branches: MessageType[][] = [];
            let leaves: number[] = [];
            
            // collect branches independently
            for (let childId of node.children ?? []) {
                console.log("childId", childId)
                let curr_node = nodes[childId];
                console.log("curr_node1", curr_node)
                let branch: MessageType[] = [];
                console.log("curr_node2", curr_node)

                // until leaf
                while(!curr_node.leaf()) {
                    console.log("curr_node3", curr_node)

                    // further inner split
                    if (curr_node.type === "split") {

                        // already aggregated
                        if (curr_node.findAggregate(nodes)) {
                            curr_node = curr_node.findAggregate(nodes) as Node; // skip inner split-aggregate structure
                        } 
                        // not yet aggregated
                        else {
                            branch.push(...curr_node.messages); // redundant (split nodes usually have no messages)
                            if(i<3) {
                                console.log("i" ,i);
                                return;
                            }
                                //aggregate(curr_node, (i+1));  //TODO: fix endless recursive call
                        }
                    // else collect and move on
                    } else {
                        branch.push(...curr_node.messages);
                        curr_node = nodes[curr_node.children?.[0] as number]; // [0] because non-split nodes have only one child
                    }
                }
                branch.push(...curr_node.messages); // add messages of leaf itself

                // branch completely collected
                branches.push(branch);
                leaves.push(curr_node.id);
            }
            
            // get response
            const aggregate_prompt="You have seen the task and previous reasoning steps. From here, I have let you generate three independent reasoning chains. I will give you each generated reasoning chain in the following and we will call them branch 1, branch 2 and branch 3."
            const aggregate_prompt_branch1="The following steps all belong to branch 1."
            const aggregate_prompt_branch2="The following steps all belong to branch 2."
            const aggregate_prompt_branch3="The following steps all belong to branch 3."
            const aggregate_prompt_closing = "This have been the reasoning chains. Please overthink. Which one is the most promising and accurate? How can you combine and summarize them?"
            const messages_before_split = collectChat((split_node as Node).id);
            const system_message_aggregate: MessageType = {role: "system", content: aggregate_prompt}
            const system_message_aggregate_branch1: MessageType = {role: "system", content: aggregate_prompt_branch1}
            const system_message_aggregate_branch2: MessageType = {role: "system", content: aggregate_prompt_branch2}
            const system_message_aggregate_branch3: MessageType = {role: "system", content: aggregate_prompt_branch3}
            const system_message_aggregate_closing: MessageType = {role: "system", content: aggregate_prompt_closing}
            const messages = 
                [...messages_before_split, 
                system_message_aggregate, 
                system_message_aggregate_branch1, 
                ...branches[0], 
                system_message_aggregate_branch2, 
                ...branches[1], 
                system_message_aggregate_branch3, 
                ...branches[2], 
                system_message_aggregate_closing
            ]

            const response = await fetch("/api/chatgpt", {
                method:"POST",
                headers:{
                "Content-Type": "application/json",
                },
                body:JSON.stringify({
                messages: messages
                })
            });
            const result = await response.json();
            const system_message_explain_aggregate: MessageType = {role: "system", content: "Summarizing three different reasoning chains, the following highlights the most important results."}
            const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
            const aggregate_node: Node = new Node({type: "aggregate", messages:[system_message_explain_aggregate, assistant_message], parents:([...leaves]), children:[]})
            for (let leaf of leaves) {
                nodes[leaf].children?.push(aggregate_node.id);
            }
            extract_keywords({"inputs": [aggregate_node.messages[1].content]}).then((keywords) => {
                aggregate_node.keywords = keywords            
                appendNodes([aggregate_node]);        
            });
        }

        await aggregate(split_node, 0);        
    }

    async function reasoning_attention() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

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
        
        const node: Node = new Node({type: "attention", messages:[system_message, assistant_message], parents:([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        extract_keywords({"inputs": [node.messages[1].content]}).then((keywords) => {
            node.keywords = keywords
            appendNodes([node]);        
        });
    }

    const reasoning_functions: ReasoningFunctionsType = {
        user: reasoning_user,
        forward: reasoning_forward,
        tools: reasoning_tools,
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
                    <Window content={activeWindows[0]} fullScreen={!activeWindows[1]} nodes={nodes} setNodes={setNodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]} fullScreen={false} nodes={nodes} setNodes={setNodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions}/>
                    </div>
                )}
            </div>
        </main>
    );
}
