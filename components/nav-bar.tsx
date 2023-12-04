export default function NavBar() {
    return(
    <nav>
        <ul>
            <li><a href="#">Settings</a></li>
        </ul>
        <details role="list">
            <summary aria-haspopup="listbox">Dropdown</summary>
            <ul role="listbox">
                <li>
                    <label>
                        <input type="checkbox" />
                        Chat
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" />
                        Keyword Graph
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" />
                        Highlight Graph
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" />
                        Similarity Graph
                    </label>
                </li>
                
            </ul>
        </details>
        <ul>
            <select>
                <option value="" disabled selected>Select View</option>
                <option>Single Window</option>
                <option>Multi Window</option>
            </select>
        </ul>
    </nav>
    );
}