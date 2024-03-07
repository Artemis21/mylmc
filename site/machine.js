const ACC_MIN = -999;
const ACC_MAX = 999;
const ACC_SIZE = ACC_MAX * 2 + 1;

export class Machine {
    input = 0;
    output = "";
    memory = new Array(100).fill(0);
    regIp = 0;
    regAcc = 0;
    flagHalted = false;

    constructor({ beforeInput, afterOutput }) {
        this.beforeInput = beforeInput;
        this.afterOutput = afterOutput;
    }

    reset() {
        this.input = 0;
        this.output = "";
        this.memory = new Array(100).fill(0);
        this.regIp = 0;
        this.regAcc = 0;
        this.flagHalted = false;
    }

    loadAt(code, addr = 0) {
        this.memory.splice(addr, code.length, ...code);
    }

    error(message) {
        this.flagHalted = true;
        throw `runtime error at ${this.regIp - 1}: ${message}`;
    }

    execNext() {
        const instr = this.memory[this.regIp++];
        const opcode = Math.floor(instr / 100);
        const operand = instr % 100;
        switch (opcode) {
            case 0: // HLT
                if (operand != 0) {
                    this.error("bad instruction: HLT takes no operand");
                }
                this.flagHalted = true;
            case 1: // ADD
                this.regAcc += this.memory[operand];
                this.wrapAcc();
                break;
            case 2: // SUB
                this.regAcc -= this.memory[operand];
                this.wrapAcc();
                break;
            case 3: // STA
                this.memory[operand] = this.regAcc;
                break;
            case 4: // reserved
                this.error("bad instruction: invalid opcode 4");
            case 5: // LDA
                this.regAcc = this.memory[operand];
                break;
            case 6: // BRA
                this.regIp = operand;
                break;
            case 7: // BRZ
                if (this.regAcc === 0) this.regIp = operand;
                break;
            case 8: // BRP
                if (this.regAcc >= 0) this.regIp = operand;
                break;
            case 9: // INP/OUT
                this.#doIo(operand);
                break;
        }
    }

    wrapAcc() {
        if (this.regAcc < ACC_MIN) {
            this.regAcc += ACC_SIZE;
        } else if (this.regAcc > ACC_MAX) {
            this.regAcc -= ACC_SIZE;
        }
    }

    #doIo(ioCode) {
        switch (ioCode) {
            case 1:
                this.beforeInput();
                this.regAcc = this.input;
                break;
            case 2:
                if (this.output === "") this.output = `${this.regAcc}`;
                else this.output += `\n${this.regAcc}`;
                this.afterOutput();
                break;
            case 22:
                // 922 is a non-standard extension from peterhigginson.co.uk/lmc
                this.output += String.fromCharCode(this.regAcc);
                this.afterOutput();
                break;
            default:
                this.error(`bad instruction: operand should be 1, 2 or 22 but found ${ioCode}`);
        }
    }

    runFor(ms) {
        const runUntil = Date.now() + ms;
        while (!this.flagHalted && Date.now() < runUntil) this.execNext();
        return this.flagHalted;
    }
}
