export default function ChatInput() {
    return (
        <div className="flex p-4">
            <input type="text" placeholder="Send a message..." className="flex-1 px-4 py-2 border rounded-l-md border-zinc-600 focus:outline-none"></input>
            <button className="px-4 py-2 bg-zinc-400 border-2 border-zinc-600 rounded-r-md">Send</button>
        </div>
    );
}