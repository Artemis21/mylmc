import { Assembler, Error as AssemblerError } from "./assembler.js";
import { Machine } from "./machine.js";

const sourceEl = document.getElementById("source");
const goEl = document.getElementById("go");
const resetEl = document.getElementById("reset");
const loadEl = document.getElementById("load");
const runEl = document.getElementById("run");
const stepEl = document.getElementById("step");
const inpRegEl = document.getElementById("inp_reg")
const accRegEl = document.getElementById("acc_reg");
const ipRegEl = document.getElementById("ip_reg");
const haltFlagEl = document.getElementById("halt_flag");
const outputEl = document.getElementById("output");
const memoryEl = document.getElementById("memory");

for (let i = 0; i < 100; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    const cellAddr = document.createElement("div");
    cellAddr.classList.add("cell__label");
    cellAddr.innerText = `${i}`;
    cell.appendChild(cellAddr);
    const cellVal = document.createElement("div");
    cellVal.classList.add("cell__value");
    cellVal.id = `cell_${i}`;
    cellVal.innerText = "0";
    cell.appendChild(cellVal);
    memoryEl.appendChild(cell);
}

let machine = new Machine({
    beforeInput() {
        machine.input = getInput();
        updateMachine();
    },
    afterOutput() {
        updateMachine();
    },
});

function getInput() {
    let message = "Please enter an input value (-999 to 999)";
    while (true) {
        const input = Number(prompt(message));
        if (input >= -999 && input <= 999) return input;
        message = "Invalid: must be a number between -999 and 999";
    }
}

function loadSource() {
    const assembler = new Assembler(sourceEl.value);
    let code;
    try {
        code = assembler.assemble();
    } catch (e) {
        alert(`Assembler error at line ${e.lineNumber()}: ${e.message}`);
        return;
    } 
    sourceEl.value = assembler.pretty;
    machine.loadAt(code, 0);
}

function runTillHalt() {
    let halted = false;
    try {
        // run for 30ms between display updates
        halted = machine.runFor(30);
    } catch (e) {
        alert(e);
        halted = true;
    }
    updateMachine();
    // prevents freezing and shows feedback
    if (!halted) window.requestAnimationFrame(runTillHalt);
}

goEl.onclick = () => {
    machine.reset();
    loadSource();
    updateMachine();
    runTillHalt();
};
resetEl.onclick = () => {
    machine.reset();
    updateMachine();
};
loadEl.onclick = () => {
    loadSource();
    updateMachine();
};
runEl.onclick = runTillHalt;
stepEl.onclick = () => {
    try {
        machine.execNext();
    } catch (e) {
        runtimeError(e);
    }
    updateMachine();
};

function updateMachine() {
    inpRegEl.innerText = machine.input;
    accRegEl.innerText = machine.regAcc;
    ipRegEl.innerText = machine.regIp;
    haltFlagEl.innerText = machine.flagHalted ? 1 : 0;
    outputEl.innerText = machine.output;
    for (let i = 0; i < 100; i++) {
        const el = document.getElementById(`cell_${i}`);
        el.innerText = machine.memory[i];
    }
}
