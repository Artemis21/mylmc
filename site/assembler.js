class Reader {
    #pointer = 0;

    constructor(source) {
        this.source = source;
    }

    readChar() {
        const char = this.source.charAt(this.#pointer++);
        if (char === "") throw "Unexpected EOF";
        return char;
    }

    peekChar(skip = 0) {
        return this.source.charAt(this.#pointer + skip);
    }

    readWord() {
        this.skipWs();
        let word = "";
        while (true) {
            const peek = this.peekChar();
            if (peek === "" || peek.charCodeAt(0) <= 32) break;
            word += this.readChar();
        }
        return word || null;
    }

    peekWord() {
        const ptr = this.#pointer;
        const word = this.readWord();
        this.#pointer = ptr;
        return word;
    }

    skipWs() {
        let min = "";
        while (true) {
            let next = this.peekChar();
            if (next === "/" && this.peekChar(1) === "/") {
                this.#pointer += 2;
                if (!min.endsWith("\n")) min += "\n";
                min += "//";
                while (next !== "\n") {
                    next = this.readChar();
                    min += next;
                }
                next = this.peekChar();
            }
            if (next === "\n") min += next;
            if (next === "" || next.charCodeAt(0) > 32) {
                return min;
            }
            this.#pointer++;
        }
    }

    readNumber() {
        const word = this.readWord();
        const number = Number(word);
        if (isNaN(number)) {
            throw `Expected a number, got ${word}`;
        }
        return number;
    }
}

class OpCode {
    constructor(code, { hasParam, isDat } = { hasParam: true, isDat: false }) {
        this.code = code;
        this.hasParam = hasParam;
        this.isDat = isDat;
    }
}

const _OPCODES = {
    HLT: new OpCode(0, { hasParam: false, isDat: false }),
    ADD: new OpCode(100),
    SUB: new OpCode(200),
    STA: new OpCode(300),
    LDA: new OpCode(500),
    BRA: new OpCode(600),
    BRZ: new OpCode(700),
    BRP: new OpCode(800),
    INP: new OpCode(901, { hasParam: false, isDat: false }),
    OUT: new OpCode(902, { hasParam: false, isDat: false }),
    // OTC is a non-standard extension from peterhigginson.co.uk/lmc
    OTC: new OpCode(922, { hasParam: false, isDat: false }),
    DAT: new OpCode(0, { hasParam: true, isDat: true }),
};
const OPCODES = new Map(Object.entries(_OPCODES));

export class Assembler {
    // Compiled code: an array of numbers.
    #code = new Array();
    // Map of label name to label address (an index into code).
    #labels = new Map();
    // Array of [reference address, reference label] for references to be filled later in code. 
    #refs = new Array();
    // Prettified assembly.
    pretty = "";
    // The source code reader;
    #reader;

    constructor(source) {
        this.#reader = new Reader(source);
    }

    #assembleNext() {
        this.pretty += this.#reader.skipWs();
        let opWord = this.#reader.readWord();
        if (opWord === null) return false;
        let label = null;
        let opCode = OPCODES.get(opWord.toUpperCase());
        if (typeof opCode === "undefined") {
            label = opWord;
            opWord = this.#reader.readWord();
            if (opWord === null) throw `Invalid op '${label}'`
            opCode = OPCODES.get(opWord.toUpperCase());
            if (typeof opCode === "undefined") {
                throw `Invalid op '${label} ${opWord}'`;
            }
        }
        const address = this.#code.length;
        let param = 0;
        let paramWord = null;
        if (opCode.isDat) {
            const number = Number(this.#reader.peekWord());
            if (!isNaN(number)) {
                param = number;
                paramWord = this.#reader.readWord();
            }
        } else if (opCode.hasParam) {
            paramWord = this.#reader.readWord();
            const immediate = Number(paramWord);
            if (isNaN(immediate)) this.#refs.push([address, paramWord]);
            else param = immediate;
        }
        this.#code.push(opCode.code + param);
        if (label !== null) {
            this.#labels.set(label, address);
        }
        this.#pushPretty(label, opWord, paramWord);
        return true;
    }

    #pushPretty(label, op, maybeParam) {
        let param = maybeParam ? `\t${maybeParam}` : "";
        this.pretty += `${label || ""}\t${op.toUpperCase()}${param}`;
    }

    #fillReferences() {
        for (const [address, ref] of this.#refs) {
            const value = this.#labels.get(ref);
            if (typeof value === "undefined") {
                throw `Undefined reference ${ref}`;
            }
            this.#code[address] += value;
        }
    }

    assemble() {
        while (this.#assembleNext());
        this.pretty += this.#reader.skipWs();
        this.#fillReferences();
        return this.#code;
    }
}
