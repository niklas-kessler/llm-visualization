import Message from "./message";
import ChatInput from "./chat-input";

export default function Chat() {
    return(
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div className="flex-1 overflow-hidden space-y-10 overflow-y-auto px-4 py-4 max-h-full">
                <Message content="This is a really really really really really really really really really really really really really really really really really really really really really really really really really really long request." sender="User"/>
                <Message content="This is a tool-call." sender="ChatGPT"/>
                <Message content="This is a tool-result." sender="Tool"/>
                <Message content="This is a final answer." sender="ChatGPT"/>
                <Message content="This is a request." sender="User"/>
                <Message content="This is a tool-call." sender="ChatGPT"/>
                <Message content="This is a tool-result." sender="Tool"/>
                <Message content="This is a final answer." sender="ChatGPT"/>
                <Message content="This is a request." sender="User"/>
                <Message content="This is a tool-call." sender="ChatGPT"/>
                <Message content="This is a tool-result." sender="Tool"/>
                <Message content="This is a final answer." sender="ChatGPT"/>
            </div>
            <ChatInput />
        </div>
    );
}