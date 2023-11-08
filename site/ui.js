import { assemble } from "./assembler.js";
import { Machine } from "./machine.js";

const sourceEl = document.getElementById("source");
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

resetEl.onclick = () => {
    machine.reset();
    updateMachine();
};
loadEl.onclick = () => {
    const code = assemble(sourceEl.value);
    machine.loadAt(code, 0);
    updateMachine();
};
runEl.onclick = () => {
    machine.run();
    updateMachine();
};
stepEl.onclick = () => {
    machine.execNext();
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
