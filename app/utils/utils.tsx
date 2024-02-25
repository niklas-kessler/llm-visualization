import { scaleLinear } from '@visx/scale';
import { UMAP } from 'umap-js';
import * as difflib from 'difflib';
import { Node } from './types';

// returns the text representation of a node type
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

// returns the color of a node in the similarity graph, based on its similarity value and the current linear color space
const similarity_node_color = (similarity: number, color1: string, color2: string) => {
  const color = scaleLinear({
    domain: [0, 1],
    range: [color1, color2],
  });
  return color(similarity);  
}

// returns the color of a node in the standard graph, based on its type and whether it is selected
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

// prompt the LLM to extract keywords from a list of messages
async function extract_keywords(data: {inputs: string[]}) {
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

// normalize an array of numbers to a range between 0 and 1
function normalizeArray(arr: number[]): number[] {
  if (arr.length === 0) {
    return arr; // Empty array, nothing to normalize
  }

  const minValue = Math.min(...arr);
  const maxValue = Math.max(...arr);

  // prevent NaN returns
  if (minValue === maxValue) {
    return arr.map(() => 0.5);
  }

  const normalizedArray = arr.map((value) => (value - minValue) / (maxValue - minValue));

  return normalizedArray;
}

// maps a 2D matrix to a 1D array using PCA or UMAP, then normalizes the result
function mapToOneDimension(matrix: number[][], method: "PCA"|"UMAP" = "PCA"): number[] {
  let result: number[] = [];
  if (method === "PCA"){
    var PCA = require('pca-js');
    const vectors = PCA.getEigenVectors(matrix);
    result = PCA.computeAdjustedData(matrix, vectors[0]).adjustedData[0];
  } 
  else if (method === "UMAP"){
    const n = matrix.length;
    const reducer = new UMAP({ nComponents: 1, nNeighbors: n-1 });
    result = reducer.fit(matrix).map((x: number[]) => x[0]);
  } 
  else {
    console.log("Error: Invalid method");
    return result;
  }
  return normalizeArray(result);
}

// using a SequenceMatcher, calculate the similarity of two strings as a number between 0 and 1
function seqmatch(str1: string, str2: string): number {
  const seq = new difflib.SequenceMatcher(null, str1, str2);
  return seq.ratio();
}

// using KeywordOverlap, return the similarity of two strings as a number between 0 and 1
function keyword_overlap(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  const overlap1 = keywords1.filter((keyword) => keywords2.includes(keyword)).length;
  const overlap2 = keywords2.filter((keyword) => keywords1.includes(keyword)).length;
  return Math.max(overlap1, overlap2) / Math.min(keywords1.length, keywords2.length);
}

// calculate the text embedding of a string
async function text_embedding(inputs: string[]){
  const str = inputs.join(" ");
  if(str === "") return Array(256).fill(0);
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

// calculate the similarity of nodes based on the sequence-match-similarity of their messages
function node_similarity_seqmatch(nodes: { [id: number]: Node }, reduction_method?: "PCA"|"UMAP"): { [id: number]: Node } {
  
  const stringSet = Object.values(nodes).map((node) => node.messages.map((message) => message.content).join(" "));
  const n = stringSet.length;
  if (n <= 1) return nodes;

  let similarityMatrix: number[][] = [];

  // calculate the similarity of each pair of nodes
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const similarity = seqmatch(stringSet[i], stringSet[j]);
      row.push(similarity);
    }
    similarityMatrix.push(row);
  }

  // reduce to 1-D
  const similarityValues = mapToOneDimension(similarityMatrix, reduction_method);  

  nodes = Object.values(nodes).reduce((acc: { [id: number]: Node }, node: Node, index: number) => {
    node.similarityValue = similarityValues[index];
    acc[node.id] = node;
    return acc;
  }, {});
  return nodes;
}

// calculate the similarity of nodes based on the keyword-overlap-similarity of their messages
function node_similarity_keyword_overlap(nodes: { [id: number]: Node }, reduction_method?: "PCA"|"UMAP"): { [id: number]: Node } {
  const keywords = Object.values(nodes).map((node) => node.keywords ?? []); 
  const n = keywords.length;
  if (n <= 1) return nodes;

  let similarityMatrix: number[][] = [];

  // calculate the similarity of each pair of nodes
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const similarity = keyword_overlap(keywords[i], keywords[j]);
      row.push(similarity);
    }
    similarityMatrix.push(row);
  }
  
  // reduce to 1-D
  const similarityValues = mapToOneDimension(similarityMatrix, reduction_method);  

  nodes = Object.values(nodes).reduce((acc: { [id: number]: Node }, node: Node, index: number) => {
    node.similarityValue = similarityValues[index];
    acc[node.id] = node;
    return acc;
  }, {});
  return nodes;
}

// calculate the similarity of nodes based on the text-embedding-similarity of their messages
function node_similarity_text_embedding(nodes: { [id: number]: Node }, reduction_method?: "PCA"|"UMAP"): { [id: number]: Node }{
  
  // get text embeddings, which have already been calculated at creation of the nodes
  const embedding_matrix = Object.values(nodes).map((node) => node.textembedding ?? []);
  const n = embedding_matrix.length;
  if (n <= 1) return nodes;

  // reduce to 1-D
  const similarityValues = mapToOneDimension(embedding_matrix, reduction_method);  

  nodes = Object.values(nodes).reduce((acc: { [id: number]: Node }, node: Node, index: number) => {
    node.similarityValue = similarityValues[index];
    acc[node.id] = node;
    return acc;
  }, {});

  return nodes;
}


export {node_text, node_color, similarity_node_color, extract_keywords, text_embedding, node_similarity_seqmatch, node_similarity_keyword_overlap, node_similarity_text_embedding}