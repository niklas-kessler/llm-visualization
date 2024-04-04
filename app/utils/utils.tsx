import { UMAP } from 'umap-js';
import * as difflib from 'difflib';
import { Node } from './types';
import { createColorMap, linearScale } from '@colormap/core';
import { viridis, cividis, plasma, inferno, magma, blackWhite } from "@colormap/presets";
import nlp from 'compromise';


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
      auto: "Auto",
      default: "Default",
    };

    return textMap[type] || textMap.default;
};

const colorMapDict = {
  viridis: viridis,
  cividis: cividis,
  plasma: plasma,
  inferno: inferno,
  magma: magma,
  blackWhite: blackWhite
};

// returns the color of a node in the similarity graph, based on its 2d-similarity-value and the current 2d color space
const similarity_node_color = (similarity: number, colorMapName: keyof typeof colorMapDict) => {
  const dummy_scale = linearScale([0, 1], [0, 1]);  
  const colorMap = createColorMap(colorMapDict[colorMapName], dummy_scale);
  let color = colorMap(similarity).map((c) => c * 255);
  return `rgb(${color.join(",")})`;
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
  console.log("Extracting Keywords");
  let input = data.inputs.join(" \n");
  let keywords: string[] = [];

  //For long inputs, mainly tool results (website content/...):
  //Approach 1 TF-IDF: Doesn't work well for websites, since keywords are often "arrow left" / "show more" / ...
  //Approach 2 Cut: Only consider the first 8192 characters of the input (limit of the model), then extract keywords
  //TODO: Approach 3: Summarize before keyword extraction, e.g. with https://huggingface.co/facebook/bart-large-cnn
  if(input.length > 500) {
    /* Approach 1 TF-IDF 
      // Process the text
      const doc = nlp(input);

      // Calculate term frequency (TF)
      const tf: Record<string, number> = {};
      doc.out('array').forEach(word => {
          tf[word] = (tf[word] || 0) + 1;
      });

      // Calculate inverse document frequency (IDF)
      const documents = input.split(" "); 
      console.log(documents.filter(doc => doc.includes("Bundeswehr")))   
      const idf: Record<string, number> = {};
      Object.keys(tf).forEach(word => {
          const documentsContainingWord = documents.filter(doc => doc.includes(word)).length;
          idf[word] = Math.log(documents.length / (1 + documentsContainingWord));
      });

      // Calculate TF-IDF
      const tfidf: Record<string, number> = {};
      Object.keys(tf).forEach(word => {
          tfidf[word] = tf[word] * idf[word];
      });

      // Sort TF-IDF scores in descending order
      const sortedTfidf = Object.entries(tfidf).sort((a, b) => b[1] - a[1]);

      // Extract top 1-4 keywords
      keywords = sortedTfidf.slice(0, Math.min(4, sortedTfidf.length)).map(entry => entry[0]);*/
    // Approach 2 Cut  
    input = data.inputs.join(" \n").slice(0, 8192);
  }  

  //ChatGPT Model
  const response = await fetch("/api/chatgpt", {
    method:"POST",
    headers:{
    "Content-Type": "application/json",
    },
    body:JSON.stringify({
    messages: [{role: "system", content: "Extract 1-4 keywords from the following text and give them  separated by a single comma without any additional text before or after: " + input}],
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

  keywords = res_mess.split(",") ?? [];

  for (let i = 0; i < keywords.length; i++) {
    keywords[i] = keywords[i].trim();
    keywords[i] = keywords[i].toLowerCase();
  }
  return keywords;
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
    //first component is vectors[0]. If vectors[0].eigenvalue is NaN set it to zero array
    const firstComponent = vectors[0].eigenvalue ? vectors[0] : {eigenvalue: 0, vector: Array(matrix.length).fill(0)};
    result = PCA.computeAdjustedData(matrix, firstComponent).adjustedData[0];
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
  //For long inputs, mainly tool results (website content/...):
  //Approach 1 Cut: Only consider the first 8192 characters of the input (limit of the model), then get text_embedding
  //TODO: Approach 2: Summarize before calculating the text_embedding, e.g. with https://huggingface.co/facebook/bart-large-cnn
  const str = inputs.join(" ").slice(0, 8192);
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