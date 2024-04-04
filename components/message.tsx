export default function Message({role, content}: {role:string, content:string}) {
        
    const roleDict: Record<string, string> = {
        "system": "System",
        "user": "User",
        "assistant": "ChatGPT",
        "tool": "Tool,"
    }

    const colorDict: Record<string, string> = {
        "system": "bg-purple-400",
        "user": "bg-blue-400",
        "assistant": "bg-green-400",
        "tool": "bg-red-400",
    }

    return(
        <div className="flex">
            <div className={`h-10 ${colorDict[role]} rounded-full mr-4`}>
                <div className="p-2"> {roleDict[role]} </div>
            </div>
            <div className="bg-slate-300 w-full rounded">
                <div className="p-2">{content.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                ))}</div>
            </div>
        </div>
    );
}