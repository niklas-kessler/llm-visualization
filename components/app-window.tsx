import Settings from "./settings";
import Window from "./window";

export default function AppWindow() {
    return(
        <div className="grid">
            <div>
                <p>Settings</p>
                <Settings />
            </div>
            <div>
                <p>Window1</p>
                <Window />
            </div>
            <div>
                <p>Window2</p>
                <Window />
            </div>
        </div>
    );
}