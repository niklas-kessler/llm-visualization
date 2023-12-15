import Message from "./message";

export default function Chat() {
    return(
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div className="flex-1 overflow-hidden space-y-10 overflow-y-auto px-4 py-4 max-h-full">
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
                <Message />
            </div>
            <div className="border-purple-500 border-4 p-2">
                <label>Send Message</label>
            </div>
        </div>
    );
}