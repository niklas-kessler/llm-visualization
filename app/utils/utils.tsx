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
	console.log("inputs", data)
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
  if (res_mess.includes('Keywords: ')) {
    const startIndex = res_mess.indexOf('Keywords: ') + 'Keywords: '.length;
    res_mess = res_mess.slice(startIndex);
  }
  const content = res_mess.split(",") ?? [];
  return content;
}

export {node_text, node_color, extract_keywords}