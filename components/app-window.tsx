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
    const [chatMessages, setChatMessages] = useState<MessageType[]>([]); // messages for (task-solving) chat model
    const [idCount, setIdCount] = useState<number>(0); // use as (idCount + Node.idCount_temp) to get the actual current id
    const [nodes, setNodes] = useState<{ [id: number]: Node }>({});

    const [autoModeTokens, setAutoModeTokens] = useState<number>(0); // additionally used tokens (approx) for auto mode

    // update collected messages, triggered when selectedNode is changed
    useEffect(() => {
        collectChat();
    }, [selectedNode])

    // collect all messages from the head node until a specific node, per default until the selected node
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

    function currentReasoningGraph(): string {
        //return all nodes in BFS order, seperated by levels
        let graph = "";
        let level = 0;
        const visited: { [id: number]: boolean } = {};
        const queue: Node[] = [];

        const startNode = Object.values(nodes).find(node => node.head() === true);
        if(startNode){
            visited[startNode.id] = true;
            queue.push(startNode);
        }

        while (queue.length > 0) {
            let size = queue.length;
            graph += "Level " + level + ": \n";
            
            for (let i = 0; i < size; i++) {
                const currNode = queue.shift() as Node;
                let nodeText = "Node_"  + currNode.id + ": " + currNode.type + "\n - Children: " ;
                nodeText += currNode.leaf()? "None, This is a leaf node! \n - Messages: \n   <" : currNode.children?.map(childId => "Node_" + childId).join(", ") + "\n - Messages: \n   <"
                nodeText += currNode.messages.map(m => m.content).join(">\n   <") + ">\n";
                graph += nodeText;
                for (let childId of currNode.children ?? []) {
                    if (!visited[childId] && nodes[childId].level(nodes) === (currNode?.level(nodes) ?? 0) + 1) {
                        visited[childId] = true;
                        queue.push(nodes[childId]);
                    }
                }
            }

            graph += "\n";
            level++;
        }

        return graph;
    }

    function computePlanChat() : MessageType[] {
        let messages: MessageType[] = [
            {role: "system", content: `Hello PlanningModel (PM)! There is another language model, called TSM (TaskSolvingModel), that tries to solve a users task, going step-by-step. 
            
            Each step can be one of various operations, like generating text, calling tools, splitting into parallel branches, aggregating results, refining or providing a final answer.
            
            Your role is to navigate the TSM through the reasoning process, choosing each next operation. 
            
            This will build a reasoning graph (each step = 1 node). I said reasoning graph instead of chain, because there are also operations to split the reasoning into parallel branches, trying several approaches and aggregating their results at a later point. 
            
            Guide the TSM and make it find the answer, by calling the respective function for the next operation. Also select on which (leaf-) node the operation should be performed, in case there are several active branches. 
            
            Parallely trying different approaches and analysing the query from different perspectives by splitting might be promising.
            
            Your should oversee the overall reasoning flow and adjust the plan as needed based on the TSM's progress.`}
        ];

        const graph: string = currentReasoningGraph();
        messages.push({role: "system", content: "This is the current reasoning graph:\n" + graph});

        messages.push({role: "system", content: `Available operations are:
        
            forward: Simply lets TSM generate.
            tools: Lets TSM generate function calls to a set of related tools.
            parallelsplit: Lets TSM generate 3 distinct answers. It is useful for concurrently trying different strategies, and later aggregating their results.
            aggregate: Lets TSM summarize three different reasoning chains.
            refine: Lets TSM check, wether any mistake might have happened, by reflecting about the last steps.
            attention: Lets TSM remind yourself of what was important, by reflecting about the last steps.
            final: Lets TSM provide a precise and clear answer to the question.
            
            Please choose a node and operation to continue the reasoning process. IMPORTANT: Only leaf nodes can be selected for operations. Nodes with children are not selectable.
        `});

        return messages;
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
    async function reasoning_user(prompt: string, node_for_operation: number = selectedNode) {
        // only allowed if selected node is a leaf or no node is selected
        if (node_for_operation !== -1 && (nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const userMessage: MessageType = {role: "user", content: prompt};            
        
        const node: Node = new Node({type:"user", messages: [userMessage], parents: [], children:[]})
        if(node_for_operation !== -1){
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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
    async function reasoning_forward(node_for_operation: number = selectedNode) {

        console.log("inside operation, node:", node_for_operation);

        // only allowed if selected node is a leaf or no node is selected
        if (node_for_operation !== -1 && (nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)

        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages],
            use_tools: false
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type:"forward", messages:[assistant_message], parents: [], children:[]})
        if(node_for_operation !== -1){
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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
    async function reasoning_tools(node_for_operation: number = selectedNode) {

        // only allowed if selected node is a leaf or no node is selected
        console.log("inside operation, node:", node_for_operation);
        if (node_for_operation !== -1 && (nodes[node_for_operation]?.children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)
        const system_message_before = {role:'user', content:'Call tools to help you with the reasoning process.'}

        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages, system_message_before],
            use_tools: true
            })
        });
        const result = await response.json();

        const res_mess = result.choices[0].message;

        let tool_result = "";
        let tool_results_string = "";

        // iterate over tool calls and get results
        for (let tool_call of res_mess.tool_calls) {
            
            let tool_path = "";
            let body = {};

            if (langchain_tools.map(obj => obj.function.name).includes(tool_call.function.name)) {
                //tool_path = "/api/langchain/" + tool_call.function.name;
                //body = { args: tool_call.function.arguments };
                tool_path = "/api/simulate_tool";
                body = { tool: tool_call.function.name, tool_args: tool_call.function.arguments };
            } else if (computed_tools.map(obj => obj.function.name).includes(tool_call.function.name)) {                
                //tool_path = "/api/computed_tool/" + tool_call.function.name;
                //body = { args: tool_call.function.arguments };
                tool_path = "/api/simulate_tool";
                body = { tool: tool_call.function.name, tool_args: tool_call.function.arguments };
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
        if (node_for_operation !== -1) {
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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
    function reasoning_backward(node_for_operation: number = selectedNode) {
        if (node_for_operation === -1) return;

        const curr_node = nodes[node_for_operation];
        const parentIds = curr_node.parents?.map(parentId => nodes[parentId].id) ?? [];
        let updatedNodes = {...nodes};
        
        // first, delete all children if there are any
        if (updatedNodes[node_for_operation].children) {
            deleteChildren(node_for_operation, updatedNodes);
        } 
        
        delete updatedNodes[node_for_operation];
        for (const parentId of parentIds) {
            if (parentId !== -1) {
                updatedNodes[parentId].children?.splice(updatedNodes[parentId].children?.indexOf(node_for_operation) as number, 1);   
            }
        }

        setNodes(updatedNodes);
        setSelectedNode(parentIds?.length > 0 ? parentIds[0] : -1);
    }

    // refine operation
    async function reasoning_refine(node_for_operation: number = selectedNode) {
        if (node_for_operation === -1) return;
        if ((nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)        

        const refine_prompt="Analyze your previous answer. Was there anything incorrect or improvable?" // system prompt
        const system_message: MessageType = {role: "user", content: refine_prompt}

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages, system_message]
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type: "refine",  messages:[system_message, assistant_message], parents:([node_for_operation]), children:[]})
        if(node_for_operation !== -1){
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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

    // standard approaches
    const stdappr: {"approaches": string[]} = { "approaches": [
        "Without the help of any tools, try to solve the problem on your own. REMEMBER, DO NOT USE ANY TOOL! Do it with your knowledge only.",
        "Try using the best fitting tool to solve the problem.",
        "Avoid the most obvious action and try something different. E.g. only gather background information and try to conclude what happened. Or use a tool thats not obvious at the first glance but could provide additional helpful information."
    ]};

    // split operation
    async function reasoning_parallel_split(approaches_arg: {approaches: string[]} = stdappr, node_for_operation: number = selectedNode) {        
        if (node_for_operation !== -1 && (nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)

        let approaches: string[] = approaches_arg.approaches
        console.log("Splitting with approaches: ", approaches);
        
        if (approaches.length > 5){
            console.log("Too many approaches, Max. 5. We will only consider the first 5.");
            approaches = approaches.slice(0, 5);
        }

        const splitnode: Node = new Node({type:"split", messages:[], parents: ([node_for_operation]), children:[]})
        if(node_for_operation !== -1){
            splitnode.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(splitnode.id);
        }

        const branchnodes: Node[] = [];
        for (const approach of approaches) {
            const approach_message: MessageType = {role: "user", content: "Try to solve the problem strictly following this approach:" + approach}
            const response = await fetch("/api/chatgpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, approach_message],
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
            appendNodes([splitnode, ...branchnodes]);
        });
    }
     
    // aggregate operation
    async function reasoning_aggregate(node_for_operation: number = selectedNode) {
        if (node_for_operation === -1) return;
        if ((nodes[node_for_operation].children?.length ?? 0) > 0) return;

        let split_node = nodes[node_for_operation].findSplit(nodes);
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
    async function reasoning_attention(node_for_operation: number = selectedNode) {
        if (node_for_operation === -1) return;
        if ((nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)
        const attention_prompt="Reflect about the reasoning steps you have taken. Which were the most important and what have you been able to conclude so far? How can you go on from here to find a solution?"
        const system_message: MessageType = {role: "user", content: attention_prompt}

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages, system_message]
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type: "attention", messages:[system_message, assistant_message], parents:([node_for_operation]), children:[]})
        if(node_for_operation !== -1){
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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
    async function reasoning_final_answer(node_for_operation: number = selectedNode) {
        if (node_for_operation === -1) return;
        if ((nodes[node_for_operation].children?.length ?? 0) > 0) return;

        const messages = collectChat(node_for_operation); // run collectChat again, to ensure its up to date (in case setSelectedNode/setChatMessages still waits for reload)
        const final_answer_prompt="Based on what you found out, provide a precise and clear answer to the question. If you haven't found a solution yet, try to summarize the most important findings so far. Make sure that your final answer is founded on the reasoning steps you have taken so far."
        const system_message: MessageType = {role: "user", content: final_answer_prompt}

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages, system_message]
            })
        });
        const result = await response.json();
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        
        const node: Node = new Node({type: "final", messages:[system_message, assistant_message], parents:([node_for_operation]), children:[]})
        if(node_for_operation !== -1){
            node.parents = [node_for_operation];
            nodes[node_for_operation].children?.push(node.id);
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
        // get response
        const response = await fetch("/api/chatgpt-automode", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...computePlanChat()],
            nodes: nodes
            })
        });
        const result = await response.json();
        
        if(result.error) {
            console.log("Error: Could not generate a valid response.");
            return;
        }

        const res_mess = result.choices[0].message;
        let operation: keyof ReasoningFunctionsType;
        if(res_mess.tool_calls[0].function.name){
            operation = res_mess.tool_calls[0].function.name;
        } else {
            console.log("Error: No operation selected. Using forward as default.");
            operation = "forward";
        }
         
        let args : {node?: number, [key: string]: any} = JSON.parse(res_mess.tool_calls[0].function.arguments) ?? {};
        let node_for_operation = selectedNode;
        
        if (args.node !== undefined){
            if (nodes[args.node]){ 
            node_for_operation = args.node;
            } else {
                console.log("Error: Unavailable node selected. Using selected node as default.");
            }
            args = {...args};
            delete args.node;
        } else {
            console.log("Error: No node selected. Using selected node as default.");
        }

        console.log("-------------------")
        console.log("Automode Next step")
        console.log(computePlanChat())
        console.log("Chose operation:", operation, "on node:", node_for_operation);
        console.log("Current used tokens for auto-mode: ", autoModeTokens + result.usage.total_tokens)
        console.log("-------------------")
        setAutoModeTokens(autoModeTokens + result.usage.total_tokens);

        if(reasoning_functions[operation]){
            let func = reasoning_functions[operation] as ((args?: any, node_for_operation?: number) => void); // User operation is of different type, but LLM won't choose it / doesn't know about it anyway
            console.log("input is args: ", args, "node: ", node_for_operation)
            console.log("current nodes", nodes)
            if(Object.keys(args).length === 0){
                await node_for_operation !== -1? func(node_for_operation) : func();
            } else {
                await node_for_operation !== -1? func(args, node_for_operation) : func(args);
            }
            
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
