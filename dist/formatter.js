export function prettyPrintJavaScript(source) {
    const trimmed = source.trim();
    if (!trimmed)
        return "";
    let output = "";
    let indentLevel = 0;
    let lastChar = "";
    const stack = [];
    const indent = () => "  ".repeat(indentLevel);
    for (let index = 0; index < trimmed.length; index += 1) {
        const character = trimmed[index];
        if (character === "\n" || character === "\r")
            continue;
        if ("{[(".includes(character)) {
            output += character;
            stack.push(character);
            indentLevel += 1;
            output += "\n" + indent();
            lastChar = character;
            continue;
        }
        if (")]}".includes(character)) {
            const opening = "([{".charAt(")]}".indexOf(character));
            while (stack.length && stack[stack.length - 1] !== opening) {
                stack.pop();
                indentLevel = Math.max(0, indentLevel - 1);
            }
            if (stack.length) {
                stack.pop();
                indentLevel = Math.max(0, indentLevel - 1);
            }
            if (output && !output.endsWith("\n"))
                output += "\n";
            output += indent() + character;
            lastChar = character;
            continue;
        }
        if (character === ";") {
            output += ";\n" + indent();
            lastChar = character;
            continue;
        }
        if (character === ",") {
            output += ", ";
            lastChar = character;
            continue;
        }
        if (character === "=") {
            output += "=";
            if (trimmed[index + 1] !== "=" && trimmed[index - 1] !== "!")
                output += " ";
            lastChar = character;
            continue;
        }
        if (character === " " && "{[(:, ".includes(lastChar))
            continue;
        output += character;
        lastChar = character;
    }
    return output.replace(/\n{3,}/g, "\n\n").trim();
}
