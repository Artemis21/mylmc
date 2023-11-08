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

    peekChar() {
        return this.source.charAt(this.#pointer);
    }

    readWord() {
        this.skipWs();
        let word = "";
        while (true) {
            if (this.peekChar() === "") break;
            const char = this.readChar();
            if (char.charCodeAt(0) <= 32) { // whitespace
                break;
            }
            word += char;
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
        while (true) {
            const peek = this.peekChar();
            if (peek === "" || peek.charCodeAt(0) > 32) {
                return;
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

class Assembler {
    // Compiled code: an array of numbers.
    #code = new Array();
    // Map of label name to label address (an index into code).
    #labels = new Map();
    // Array of [reference address, reference label] for references to be filled later in code. 
    #refs = new Array();
    // The source code reader;
    #reader;

    constructor(source) {
        this.#reader = new Reader(source);
    }

    #assembleNext() {
        const word = this.#reader.readWord();
        if (word === null) return false;
        let label = null;
        let opCode = OPCODES.get(word.toUpperCase());
        if (typeof opCode === "undefined") {
            label = word;
            const opWord = this.#reader.readWord();
            if (opWord === null) throw `Invalid op '${word}'`
            opCode = OPCODES.get(opWord.toUpperCase());
            if (typeof opCode === "undefined") {
                throw `Invalid op '${word} ${opWord}'`;
            }
        }
        const address = this.#code.length;
        let param = 0;
        if (opCode.isDat) {
            const number = Number(this.#reader.peekWord());
            if (!isNaN(number)) {
                param = number;
                this.#reader.readWord();
            }
        } else if (opCode.hasParam) {
            const paramWord = this.#reader.readWord();
            const immediate = Number(paramWord);
            if (isNaN(immediate)) this.#refs.push([address, paramWord]);
            else param = immediate;
        }
        this.#code.push(opCode.code + param);
        if (label !== null) {
            this.#labels.set(label, address);
        }
        return true;
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
        this.#fillReferences();
        return this.#code;
    }
}

export function assemble(source) {
    return (new Assembler(source)).assemble();
}
