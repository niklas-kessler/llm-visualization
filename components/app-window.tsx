import Settings from "./settings";
import Window from "./window";

export default function AppWindow() {
    return(
        <div className="grid">
            <article className="bg-blue-100">
                <p>Settings</p>
                <Settings />
            </article>
            <article className="bg-red-100">
                <p>Window1</p>
                <Window content="Chat"/>
            </article>
            <article className="bg-blue-100">
                <p>Window2</p>
                <Window content="SimilarityGraph"/>
            </article>
        </div>
    );
}