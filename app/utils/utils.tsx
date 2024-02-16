const node_text = (type: string) => {
    const textMap: { [key: string]: string } = {
      user: "U",
      forward: "\u2193",
      backward: "\u2191",
      tools: "T",
      split: "\u2199 \u2193 \u2198",
      aggregate: "\u2198 \u2193 \u2199",
      refine: "\u21BB",
      attention: "?",
      final: "Final",
      default: "Default",
    };

    return textMap[type] || textMap.default;
};

const node_color = (type: string, selected: boolean) => {
    
  const colorMap_selected: { [key: string]: string } = {
    user: "#4169E1", // Royal Blue
    forward: "#108c4f", // Dark Sea Green
    tools: "#02d002", // Lime Green
    split: "#ffa500", // Orange
    aggregate: "#ffa500", // Orange
    refine: "#9932cc", // Dark Orchid
    attention: "#ff7f50", // Coral
    final: "#8b4513", // Saddle Brown
  };

  const colorMap_unselected: { [key: string]: string } = {
      user: "#3150D0", 
      forward: "#097c40",
      tools: "#01e001", 
      split: "#df9500", 
      aggregate: "#df9500",
      refine: "#8922ac", 
      attention: "#df6f40",
      final: "#7b350a", 
    };

  return selected? (colorMap_selected[type] || "#ff0000") : (colorMap_unselected[type] || "#ff0000"); // Default: Alert Red
};

async function extract_keywords(data: {inputs: string[]}) {
  // HuggingFace Model
  /*const response = await fetch(
		"https://api-inference.huggingface.co/models/yanekyuk/bert-uncased-keyword-extractor",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
  console.log("backend: keyword extraction1", result)
  if(!result.error){
    const result_arr = result.flatMap((entry: any) => entry.map((keyword: { word: string, score: number }) => keyword.word));
    console.log("backend: keyword extraction2", result_arr);
    return result_arr;
  }
  else return [];*/
  //ChatGPT Model
  const response = await fetch("/api/chatgpt", {
    method:"POST",
    headers:{
    "Content-Type": "application/json",
    },
    body:JSON.stringify({
    messages: [{role: "system", content: "Extract 1-4 keywords from the following text and give them  separated by a single comma without any additional text before or after: " + data.inputs.join(" \n")}],
    use_tools: false
    })
  });
  
  const result = await response.json();
  console.log(result)

  let res_mess: string = result.choices[0].message.content ?? "";
  
  // if the response contains some message like 'These are the Keywords: ', we throw that first part away
  if (res_mess.toLowerCase().includes('keywords: ')) {
    const startIndex = res_mess.toLowerCase().indexOf('keywords: ') + 'keywords: '.length;
    res_mess = res_mess.slice(startIndex);
  }
  const content = res_mess.split(",") ?? [];
  for (let i = 0; i < content.length; i++) {
    content[i] = content[i].trim();
    content[i] = content[i].toLowerCase();
  }
  return content;
}

import { UMAP } from 'umap-js';
import * as difflib from 'difflib';
import { Node } from './types';

function normalizeArray(arr: number[]): number[] {
  if (arr.length === 0) {
    return arr; // Empty array, nothing to normalize
  }

  const minValue = Math.min(...arr);
  const maxValue = Math.max(...arr);

  const normalizedArray = arr.map((value) => (value - minValue) / (maxValue - minValue));

  return normalizedArray;
}

function string_similarity_seqmatch(str1: string, str2: string): number {
  const seq = new difflib.SequenceMatcher(null, str1, str2);
  return seq.ratio();
}

async function text_embedding(inputs: string[]){
  const str = inputs.join(" ");
  const response = await fetch("/api/get_text_embedding", {
    method:"POST",
    headers:{
    "Content-Type": "application/json",
    },
    body:JSON.stringify({
    str: str
    })
  });
  
  const result = await response.json();
  return result.data[0].embedding;
}

function node_similarity_seqmatch(nodes: { [id: number]: Node }): { [id: number]: Node } {
  const stringSet = Object.values(nodes).map((node) => node.messages.map((message) => message.content).join(" "));
  const n = stringSet.length;
  if (n <= 1) return nodes;
  console.log("stringSet", stringSet);

  //calculate similarity matrix
  let similarityMatrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const similarity = string_similarity_seqmatch(stringSet[i], stringSet[j]);
      row.push(similarity);
    }
    similarityMatrix.push(row);
  }
  const reducer = new UMAP({ nComponents: 1, nNeighbors: n-1 }); //TODO: Option to map to more than 1 dimension -> multi-dim. color scale
  let similarityValues = reducer.fit(similarityMatrix).map((x: number[]) => x[0]);
  
  similarityValues = normalizeArray(similarityValues);
  console.log("similarityValues", similarityValues);

  nodes = Object.values(nodes).map((node, index) => {
    node.similarityValue = similarityValues[index];
    return node;
  });
  return nodes;
}


function node_similarity_text_embedding(nodes: { [id: number]: Node }): { [id: number]: Node }{
  const embedding_matrix = Object.values(nodes).map((node) => node.textembedding ?? []);
  const n = embedding_matrix.length;
  if (n <= 1) return nodes;

  const reducer = new UMAP({ nComponents: 1, nNeighbors: n-1 }); //TODO: Option to map to more than 1 dimension -> multi-dim. color scale
  let similarityValues = reducer.fit(embedding_matrix).map((x: number[]) => x[0]);
  
  similarityValues = normalizeArray(similarityValues);
  console.log("similarityValues", similarityValues);

  nodes = Object.values(nodes).map((node, index) => {
    node.similarityValue = similarityValues[index];
    return node;
  });

  return nodes;
}


export {node_text, node_color, extract_keywords, text_embedding, node_similarity_seqmatch, node_similarity_text_embedding}