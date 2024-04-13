"use client"
import { useState, useEffect } from "react";
import Window from "./window";
import History from "./history";
import { MessageType, ReasoningFunctionsType } from "@/app/utils/types";
import { extract_keywords, text_embedding } from "@/app/utils/utils";
import { langchain_tools, computed_tools } from "@/app/utils/tools";

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
        textembedding?: number[];
        similarityValue: number = 0;
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

    
    const [selectedNode, setSelectedNode ] = useState<number>(-1); // initialize selectedNode with -1
    const [chatMessages, setChatMessages] = useState<MessageType[]>([
    ]);
    const [idCount, setIdCount] = useState<number>(0); // use as (idCount + Node.idCount_temp) to get the actual current id
    const [nodes, setNodes] = useState<{ [id: number]: Node }>({});

    // update collected messages, triggered when selectedNode is changed
    useEffect(() => {
        collectChat();
    }, [selectedNode])

    // collect all messages from the head node until a specific node, per default until the selected node
    function collectChat ( nodeId: number = selectedNode ) : MessageType[] {
        console.log(nodes)
        
        if (nodeId === -1) {
            setChatMessages([]);
            return [];
        }
        
        let node: Node = nodes[nodeId];
        let prevNode: Node;
        let messageNodes: Node[] = [];
        let chatMessages: MessageType[] = [];
        
        let aggregated = 0; // depth-level

        // backtrack to beginning, collecting all nodes on the fly
        while (!node.head()) {
            if (aggregated === 0) {
                messageNodes.push(node);
            }
            // ignore branches that have been aggregated already and only collect the aggregate-node
            if (node.type === "aggregate"){
                aggregated++;
            } else if (node.type === "split" && aggregated > 0){
                aggregated--;
            };

            // move one up
            node = nodes[node.parents?.[0] as number];
            prevNode = node;
        }
        //push head node as well
        messageNodes.push(node); 
        
        // traverse nodes in reverse order and get the messages in the correct order
        messageNodes.reverse();
        for (let n of messageNodes) {
            for (let m of n.messages){
                chatMessages.push({role:m.role, content:m.content});
            }
        }
        setChatMessages(chatMessages);
        return chatMessages;
    }

    // append new nodes to the graph, select the latest node
    function appendNodes (newNodes: Node[]) {
        let updatedNodes = {...nodes};
        for (let n of newNodes){
            updatedNodes[n.id] = n;            
        }
        setNodes(updatedNodes);
        setSelectedNode(newNodes[newNodes.length - 1].id);
    }

    // operations for reasoning are also called reasoning functions in the following

    // user operation
    async function reasoning_user(prompt: string) {
        // only allowed if selected node is a leaf or no node is selected
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        const userMessage: MessageType = {role: "user", content: prompt};            
        
        const node: Node = new Node({type:"user", messages: [userMessage], parents: [], children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }

        // extract keywords and calculate textembedding
        const relevant_messages = node.messages.map(m => m.content);
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // forward operation
    async function reasoning_forward() {
        // only allowed if selected node is a leaf or no node is selected
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

        // extract keywords and calculate textembedding
        const relevant_messages = node.messages.map(m => m.content);
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // tools operation
    async function reasoning_tools() {
        // only allowed if selected node is a leaf or no node is selected
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        const system_message_before = {role:'user', content:'Call tools to help you with the reasoning process.'}

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

        const res_mess = result.choices[0].message;

        let tool_result = "";
        let tool_results_string = "";

        // iterate over tool calls and get results
        for (let tool_call of res_mess.tool_calls) {
            /*
            // pass tool calls to the simulate_tool function, long-term this will be replaced by a dynamic call to the respective tool
            const tool_answer = await fetch("/api/simulate_tool", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                    },
                body:JSON.stringify({
                    tool: tool_call.function.name,
                    tool_args: tool_call.function.arguments
                })
            });*/
            let tool_path = "";
            let body = {};

            if (langchain_tools.map(obj => obj.function.name).includes(tool_call.function.name)) {
                tool_path = "/api/langchain/" + tool_call.function.name;
                body = { args: tool_call.function.arguments };
            } else if (computed_tools.map(obj => obj.function.name).includes(tool_call.function.name)) {
                console.log("pass1:", tool_call.function.name, tool_call.function.arguments);
                tool_path = "/api/computed_tool/" + tool_call.function.name;
                body = { args: tool_call.function.arguments };
            } 
            
            else {
                tool_path = "/api/simulate_tool";
                body = { tool: tool_call.function.name, tool_args: tool_call.function.arguments };
            }

            const tool_answer = await fetch(tool_path, {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                    },
                body:JSON.stringify(body)
            });

            tool_result = (await tool_answer.json()).result;
            tool_results_string += "Tool " + tool_call.function.name + " with arguments " + tool_call.function.arguments + " gave result: " + tool_result + ".";    
        }
        
        // Tool results are added as a message. This way the model can react to the results in the next step.
        const system_message_after = { role: 'system', content: tool_results_string };

        const node: Node = new Node({ type: "tools", messages: [system_message_before, system_message_after], parents: [], children: [] });
        if (selectedNode !== -1) {
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }

        // extract keywords and calculate textembedding
        const relevant_messages = [tool_result];
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // delete all children for a node (helper function for backward operation)
    function deleteChildren(nodeId: number, nodes: { [id: number]: Node }) {
        
        // BFS to delete all children
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

    // backward operation
    function reasoning_backward() {
        if (selectedNode === -1) return;

        const curr_node = nodes[selectedNode];
        const parentIds = curr_node.parents?.map(parentId => nodes[parentId].id) ?? [];
        let updatedNodes = {...nodes};
        
        // first, delete all children if there are any
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

    // refine operation
    async function reasoning_refine() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        // system prompt
        const refine_prompt="Reflect and overthink your previous answer. Is there anything incorrect?"
        const system_message: MessageType = {role: "user", content: refine_prompt}

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

        // extract keywords and calculate textembedding
        const relevant_messages = [node.messages[1].content];
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // split operation
    async function reasoning_parallel_split() {        
        if (selectedNode !== -1 && (nodes[selectedNode].children?.length ?? 0) > 0) return;

        // any amount valid
        const approaches: string[] = [
            "Without the help of any tools, try to solve the problem on your own. REMEMBER, DO NOT USE ANY TOOL! Do it with your knowledge only.",
            "Try using the best fitting tool to solve the problem.",
            "Avoid the most obvious action and try something different. E.g. only gather background information and try to conclude what happened. Or use a tool thats not obvious at the first glance but could provide additional helpful information."
        ]
        
        const splitnode: Node = new Node({type:"split", messages:[], parents: ([selectedNode]), children:[]})
        if(selectedNode !== -1){
            splitnode.parents = [selectedNode];
            nodes[selectedNode].children?.push(splitnode.id);
        }

        const branchnodes: Node[] = [];
        for (const approach of approaches) {
            const approach_message: MessageType = {role: "system", content: "Using the following approach: " + approach}
            const response = await fetch("/api/chatgpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...chatMessages, approach_message],
                    temperature: 0.9,
                }),
            });

            const result = await response.json();
            const assistant_message: MessageType = { role: result.choices[0].message.role, content: result.choices[0].message.content };

            const node: Node = new Node({ type: "forward", messages: [approach_message, assistant_message], parents: [splitnode.id], children: []});
            // Add the new node to the splitnodes's children array
            splitnode.children?.push(node.id);
            branchnodes.push(node)
        }
        
        //extract keywords and calculate textembedding
        const relevant_messages: string[][] = branchnodes.map(node => node.messages.map(m => m.content))
        Promise.all([
            Promise.all(relevant_messages.map(messages => extract_keywords({"inputs": messages}))),
            Promise.all(relevant_messages.map(messages => text_embedding(messages))),
            text_embedding([])
        ]).then(([keywords, textembeddings, textembedding_split]) => {
            for (let i = 0; i < relevant_messages.length; i++) {
                branchnodes[i].keywords = keywords[i];
                branchnodes[i].textembedding = textembeddings[i];
            }
            splitnode.textembedding = textembedding_split;
            //appendNodes([splitnode, ...branchnodes]);
            appendNodes([new Node({type:"forward", messages:[
                {role: "system", content: `To enhance your reasoning process, we have integrated you into a larger system, where the user can input its request and then you will find the solution step by step. \n \n
                Each step is called an operation and there are different operations available. First, choose the forward operation to let yourself generate a plan to solve the problem and map it to a sequence of operations. Then choose the operations according to the generated plan. The last operation should be the final answer. \n \n
                In each step, first state the whole sequence and where you are right now. \n \n
                When you get unexpected results, you are allowed to dynamically change the plan and instead choose another operation that would be the more helpful to continue the reasoning process.`},
                {role: "system", content: `Available operations are:  \n \n
                    - Forward: Simply lets you generate. \n
                    - Tools: Lets you generate function calls to a set of related tools. \n
                    - Split: Lets you generate 3 distinct answers. It is useful for concurrently trying different strategies, and later aggregating their results. \n
                    - Aggregate: Lets you summarize three different reasoning chains. \n
                    - Refine: Lets you check, wether any mistake might have happened, by reflecting about the last steps. \n
                    - Attention: Lets you remind yourself of what was important, by reflecting about the last steps. \n
                    - Final Answer: Lets you provide a precise and clear answer to the question. \n    
                `}
            ], parents:[], children:[]})]);
        });
    }
     
    // aggregate operation
    async function reasoning_aggregate() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        let split_node = nodes[selectedNode].findSplit(nodes);
        if (split_node === undefined) return;

        async function aggregate(node: Node, i:number) {

            if (node.type !== "split")
                return;
            
            let branches: MessageType[][] = [];
            let leaves: number[] = [];
            
            // collect branches independently
            for (let childId of node.children ?? []) {
                let curr_node = nodes[childId];
                let branch: MessageType[] = [];

                // until leaf
                while(!curr_node.leaf()) {
                
                    // further inner split
                    if (curr_node.type === "split") {

                        // already aggregated
                        if (curr_node.findAggregate(nodes)) {
                            curr_node = curr_node.findAggregate(nodes) as Node; // skip inner split-aggregate structure
                        } 
                        // not yet aggregated
                        else {
                            branch.push(...curr_node.messages); // redundant (split nodes usually have no messages)
                            await aggregate(curr_node,(i+1)); 
                            // when trying to recursevly aggregate inner most splits and afterwards continue with outer split,
                            // a endless loop appears that couldn't be fixed yet. Therefore we return here and settle with only 
                            // aggergating the inner most split for now, and leave it to the user to call the aggregate opearation again.
                            return;
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

            // extract keywords and calculate textembedding
            const relevant_messages = [aggregate_node.messages[1].content];
            Promise.all([
                extract_keywords({"inputs": relevant_messages}),
                text_embedding(relevant_messages)
            ]).then(([keywords, textembedding]) => {
                aggregate_node.keywords = keywords;
                aggregate_node.textembedding = textembedding;
                appendNodes([aggregate_node]);
                return;
            });
        }

        await aggregate(split_node, 0);        
    }

    // attention operation
    async function reasoning_attention() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        const refine_prompt="Reflect about the reasoning steps you have taken. Which were the most important and what have you been able to conclude so far? How can you go on from here to find a solution."
        const system_message: MessageType = {role: "user", content: refine_prompt}

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
        
        // extract keywords and calculate textembedding
        const relevant_messages = [node.messages[1].content];
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // final answer operation
    async function reasoning_final_answer() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        const final_answer_prompt="Based on what you found out, provide a precise and clear answer to the question. If you haven't found a solution yet, try to summarize the most important findings so far. Make sure that your final answer is founded on the reasoning steps you have taken so far."
        const system_message: MessageType = {role: "user", content: final_answer_prompt}

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
        
        const node: Node = new Node({type: "final", messages:[system_message, assistant_message], parents:([selectedNode]), children:[]})
        if(selectedNode !== -1){
            node.parents = [selectedNode];
            nodes[selectedNode].children?.push(node.id);
        }
        
        // extract keywords and calculate textembedding
        const relevant_messages = [node.messages[1].content];
        Promise.all([
            extract_keywords({"inputs": relevant_messages}),
            text_embedding(relevant_messages)
        ]).then(([keywords, textembedding]) => {
            node.keywords = keywords;
            node.textembedding = textembedding;
            appendNodes([node]);
        });
    }

    // operation for automatically choosing an operation
    async function reasoning_auto() {
        if (selectedNode === -1) return;
        if ((nodes[selectedNode].children?.length ?? 0) > 0) return;

        //const choose_operation_prompt = "To enhance your reasoning process, we have integrated you into a larger system, where the user can input its request and then you will find the solution step by step. Each step is called an operation and there are different operations available. Choose, which operation would be the most helpful to continue the reasoning process."
        const choose_operation_prompt = "Choose the next operation";
        const system_message: MessageType = {role: "system", content: choose_operation_prompt}
        
        console.log("chatMessages: ", chatMessages);

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...chatMessages, system_message],
            auto_mode: true
            })
        });
        const result = await response.json();
        
        if(result.error) {
            console.log("Error: Could not generate a valid response.");
            return;
        }

        const res_mess = result.choices[0].message;
        let operation: keyof ReasoningFunctionsType = res_mess.tool_calls[0].function.name ?? "forward";
        console.log("auto chose operation: ", operation);
        if(reasoning_functions[operation]){
            let func = reasoning_functions[operation] as (() => void); // User operation is of different type, but LLM won't choose it / doesn't know about it anyway
            await func();
        }
        return;
    }

    const reasoning_functions: ReasoningFunctionsType = {
        user: reasoning_user,
        forward: reasoning_forward,
        tools: reasoning_tools,
        backward: reasoning_backward,
        refine: reasoning_refine,
        parallelsplit: reasoning_parallel_split,
        aggregate: reasoning_aggregate,
        attention: reasoning_attention,
        final: reasoning_final_answer
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
                    <Window content={activeWindows[0]} fullScreen={!activeWindows[1]} nodes={nodes} setNodes={setNodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions} reasoning_auto={reasoning_auto}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]} fullScreen={false} nodes={nodes} setNodes={setNodes} chatMessages={chatMessages} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions} reasoning_auto={reasoning_auto}/>
                    </div>
                )}
            </div>
        </main>
    );
}
