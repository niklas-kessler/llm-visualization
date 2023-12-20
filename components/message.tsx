export default function Message({content, sender}: {content:string, sender:string}) {
        
    const colorDict: Record<string, string> = {
        "User": "bg-blue-400",
        "ChatGPT": "bg-green-400",
        "Tool": "bg-red-400",
    }

    return(
        <div className="flex">
            <div className={`h-10 ${colorDict[sender]} rounded-full mr-4`}>
                <div className="p-2"> {sender} </div>
            </div>
            <div className="bg-slate-300 w-full rounded">
                <div className="p-2">{content}</div>
            </div>
        </div>
    );
}