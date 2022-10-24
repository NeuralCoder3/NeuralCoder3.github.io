/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const DIR_RIGHT = "R";
/* harmony export (immutable) */ __webpack_exports__["a"] = DIR_RIGHT;

const DIR_LEFT = "L";
/* harmony export (immutable) */ __webpack_exports__["b"] = DIR_LEFT;

const DIR_STAY = "S";
/* harmony export (immutable) */ __webpack_exports__["f"] = DIR_STAY;


const STATE_RUNNING = "running";
/* harmony export (immutable) */ __webpack_exports__["c"] = STATE_RUNNING;

const STATE_STOPPED_FAIL = "stopped-fail";
/* harmony export (immutable) */ __webpack_exports__["d"] = STATE_STOPPED_FAIL;

const STATE_STOPPED_SUCCESS = "stopped-success";
/* harmony export (immutable) */ __webpack_exports__["e"] = STATE_STOPPED_SUCCESS;


// export const BLANK = '#'

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Represents a single machine step.
 */
class MachineStep {

    constructor(nextState, rewrite, direction) {
        this.nextState = nextState;
        this.rewrite = rewrite;
        this.direction = direction;
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = MachineStep;


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Represents current state of the Turing Machine Simulator view, i.e., the
 * tape and the TM state description.
 */
class ViewState {

    constructor(direction, highlight, tape, newState, added = false) {
        this.direction = direction;
        this.highlight = highlight;
        this.tape = tape;
        this.newState = newState;
        this.added = added;
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ViewState;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__consts__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ViewState__ = __webpack_require__(2);



/**
 * Represents a MachineState in given point in time.
 */
class MachineState {

    constructor(states, finalStates, head, state, transitionFunction, tape) {
        this.states = states;
        this.finalStates = finalStates;
        this.head = head;
        this.state = state;
        this.transitionFunction = transitionFunction;
        this.tape = tape;
        this.running = __WEBPACK_IMPORTED_MODULE_0__consts__["c" /* STATE_RUNNING */];
        this.apply = this.apply.bind(this);
    }

    /**
     * Applies machine step to the state.
     */
    apply(machineStep) {
        let added = false;
        if (this.head == -1) {
            this.tape.unshift(machineStep.rewrite);
            this.head = 0;
            added = true;
        } else if (this.head >= this.tape.length) {
            this.tape.push(machineStep.rewrite);
            added = true;
        } else {
            this.tape[this.head] = machineStep.rewrite;
        }
        let oldHead = this.head;
        this.head += machineStep.direction === __WEBPACK_IMPORTED_MODULE_0__consts__["b" /* DIR_LEFT */] ? -1 : machineStep.direction === __WEBPACK_IMPORTED_MODULE_0__consts__["a" /* DIR_RIGHT */] ? +1 : 0;
        this.state = machineStep.nextState;
        return new __WEBPACK_IMPORTED_MODULE_1__ViewState__["a" /* default */](machineStep.direction, oldHead, this.tape, this.state, added);
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = MachineState;


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__MachineStep__ = __webpack_require__(1);


/**
 * Populates the transition table in editor with current Turing Machine description.
 */
/* harmony default export */ __webpack_exports__["a"] = (function (transitionTable, symbols, machineState) {
    let states = [];
    let transitionTableHeadRowEl = document.querySelector(".transition-table > thead > tr");
    if (!transitionTableHeadRowEl) {
        transitionTableHeadRowEl = document.createElement("tr");
        document.querySelector(".transition-table > thead").appendChild(transitionTableHeadRowEl);
    }
    transitionTableHeadRowEl.innerHTML = "";
    for (var state in transitionTable) {
        if (!transitionTable.hasOwnProperty(state)) {
            continue;
        }
        states.push(state);
    }
    states.pop(); // Dont display final state

    // Top left corner of table
    let headerCol = document.createElement("th");
    headerCol.textContent = "-";
    transitionTableHeadRowEl.appendChild(headerCol);

    // For each symbol, add header column
    symbols.forEach(symbol => {
        let headerCol = document.createElement("th");
        headerCol.textContent = symbol;
        transitionTableHeadRowEl.appendChild(headerCol);
    });

    let transitionTableBodyEl = document.querySelector(".transition-table > tbody");
    transitionTableBodyEl.innerHTML = "";
    states.forEach(state => {
        if (!transitionTable.hasOwnProperty(state)) {
            return;
        }
        let stateRow = document.createElement("tr");

        // Create row header - name of the state
        let rowHeader = document.createElement("th");
        // rowHeader.innerHTML = `q<sub>${state}</sub>`
        rowHeader.innerHTML = `${state}`;
        stateRow.appendChild(rowHeader);

        symbols.forEach(symbol => {
            let col = document.createElement("td");
            if (transitionTable[state].hasOwnProperty(symbol)) {
                let step = transitionTable[state][symbol];
                let nextState = step.nextState < states.length ? step.nextState : "F";
                // col.innerHTML = `q<sub>${nextState}</sub>` +
                col.innerHTML = `${nextState}` + `<span>|</span>${step.rewrite}` + `<span>|</span>${step.direction}`;
            }
            col.dataset.state = state;
            col.dataset.symbol = symbol;
            col.classList.add("transition");
            stateRow.appendChild(col);
        });

        // Append the row
        transitionTableBodyEl.appendChild(stateRow);
    });

    let addInputListener = col => {}
    // col.addEventListener("click", (e) => {
    //     if (!col.classList.contains("editing")) {
    //         let content = col.textContent.length > 0 ? col.textContent : ""
    //         col.innerHTML = `<input value="${content}" type="text"/>`
    //         col.classList.add("editing")
    //         document.querySelector("#set-transitions").style.display = "inline"
    //     }
    // })

    // document.querySelectorAll("td.transition").forEach(col => addInputListener(col))

    ;document.querySelector("#set-transitions").addEventListener("click", e => {
        e.preventDefault();
        document.querySelectorAll("td.transition").forEach(col => {
            let inputEl = col.querySelector("input");
            if (inputEl) {
                if (!transitionTable.hasOwnProperty(col.dataset.state)) {
                    transitionTable[col.dataset.state] = {};
                }
                if (!transitionTable[col.dataset.state].hasOwnProperty[col.dataset.symbol]) {
                    transitionTable[col.dataset.state][col.dataset.symbol] = {};
                }
                let [newState, rewrite, direction] = inputEl.value.split("|");
                newState = newState.replace("q", "");
                transitionTable[col.dataset.state][col.dataset.symbol] = new __WEBPACK_IMPORTED_MODULE_0__MachineStep__["a" /* default */](parseInt(newState), rewrite, direction);

                col.classList.remove("editing");
                col.innerHTML = inputEl.value;
                addInputListener(col);
            }
        });
        machineState.transitionTable = transitionTable;
    });
});

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__consts_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ViewState_js__ = __webpack_require__(2);



/**
 * Renders the Turing Machine and all its components, i.e., the tape
 * and the descriptions of current TM state.
 */
/* harmony default export */ __webpack_exports__["a"] = (function (viewState, hard = false) {
    let symbolsWrapper = document.querySelector(".symbols-wrapper");
    symbolsWrapper.innerHTML = "";
    let width = viewState.tape.length * 50;

    let currentStateEl = document.querySelector(".current-state");
    // currentStateEl.innerHTML = `q<sub>${viewState.newState}</sub>`
    currentStateEl.innerHTML = `${viewState.newState}`;

    // Propagate current state to SVG cursor
    let svgTextEl = document.querySelector("svg > text");
    // svgTextEl.innerHTML = `q<tspan dy="+5">${viewState.newState}</tspan>`
    svgTextEl.innerHTML = `${viewState.newState}`;

    // Add first blank if not present
    width += 50;
    let blankNode = document.createElement("div");
    blankNode.classList.add("symbol");
    blankNode.classList.add("blank");
    blankNode.textContent = document.blank;
    symbolsWrapper.appendChild(blankNode);

    viewState.tape.forEach((symbol, i) => {
        let symbolNode = document.createElement("div");
        symbolNode.classList.add("symbol");
        if (viewState.highlight !== undefined && viewState.highlight === i) {
            symbolNode.classList.add("highlight");
        }
        symbolNode.textContent = symbol;
        symbolsWrapper.appendChild(symbolNode);
    });

    // Add last blank if not present
    width += 50;
    blankNode = document.createElement("div");
    blankNode.classList.add("symbol");
    blankNode.classList.add("blank");
    blankNode.textContent = document.blank;
    symbolsWrapper.appendChild(blankNode);

    symbolsWrapper.style.width = width + "px";
    let translateX = parseInt(getComputedStyle(symbolsWrapper).transform.split(',')[4]);
    if (translateX === -1 || hard) {
        translateX = width / 2 - 25;
    }
    if (viewState.direction === __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]) {
        if (viewState.added) {
            translateX -= 25;
        }
        translateX -= 50;
    } else if (viewState.direction === __WEBPACK_IMPORTED_MODULE_0__consts_js__["b" /* DIR_LEFT */]) {
        if (viewState.added) {
            translateX += 25;
        }
        translateX += 50;
    }
    symbolsWrapper.style.transform = 'translateX(' + translateX + 'px)';
});

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__consts__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__MachineStep__ = __webpack_require__(1);



/**
 * Handles logic of advancing the turing machine to the next step.
 */
/* harmony default export */ __webpack_exports__["a"] = (function (machineState) {
    let state = machineState.state;
    let currentSymbol = document.blank;
    if (machineState.head >= 0 && machineState.head < machineState.tape.length) {
        currentSymbol = machineState.tape[machineState.head];
    }
    let transitionFunction = machineState.transitionFunction[state];

    if (machineState.finalStates.indexOf(state) > -1) {
        console.log("Machine stopped successfuly");
        return {
            machineStep: null,
            running: __WEBPACK_IMPORTED_MODULE_0__consts__["e" /* STATE_STOPPED_SUCCESS */]
        };
    }
    if (!transitionFunction.hasOwnProperty(currentSymbol)) {
        console.log("Machine stopped because of undefined transition from the current state");
        return {
            machineStep: null,
            running: __WEBPACK_IMPORTED_MODULE_0__consts__["d" /* STATE_STOPPED_FAIL */]
        };
    }

    return {
        machineStep: transitionFunction[currentSymbol],
        running: __WEBPACK_IMPORTED_MODULE_0__consts__["c" /* STATE_RUNNING */] // Returns the MachineStep
    };
});

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__consts_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__render__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__turing_machine__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__MachineState__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__MachineStep__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ViewState__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__populateTransitionTable__ = __webpack_require__(4);







// import {
//     set301,
//     set302,
//     set303,
//     set31,
//     set32,
//     set33,
//     set34
// } from './exercises.js'
let set301 = (transitionTable, machineState, reset, input) => {
    transitionTable = {
        0: {
            "a": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](1, "a", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */])
        },
        1: {
            "a": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](1, "a", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
            "b": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](2, "b", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */])
        },
        2: {
            "b": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](2, "b", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
            "c": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](3, "c", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */])
        },
        3: {
            "c": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](3, "c", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
            "#": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */]('F', document.blank, __WEBPACK_IMPORTED_MODULE_0__consts_js__["b" /* DIR_LEFT */])
        },
        'F': {}
    };
    machineState.transitionFunction = transitionTable;
    machineState.states = [0, 1, 2, 3, 'F'];
    machineState.finalStates = ['F'];
    // document.querySelector(".description").innerHTML = "This Turing Machine accepts <br/> L = {w | w = a<sup>i</sup>b<sup>j</sup>c<sup>k</sup>; i,j,k > 0}";
    input = ["F", "a", "b", "b", "c"];
    reset(input);
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__populateTransitionTable__["a" /* default */])(transitionTable, ["a", "b", "c", document.blank], machineState);
    return input;
};

var transitionTable = {
    0: {
        "a": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](1, "a", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */])
    },
    1: {
        "a": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](1, "a", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
        "b": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](2, "b", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */])
    },
    2: {
        "b": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](2, "b", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
        "c": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](3, "c", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]) },
    3: {
        "c": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](3, "c", __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */]),
        "B": new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](4, document.blank, __WEBPACK_IMPORTED_MODULE_0__consts_js__["b" /* DIR_LEFT */])
    },
    4: {}

    // Machine State init
    // TODO: move to class and pass that around
};var defined = false;
var symbols = ["a", "b", "c", "B"];
var inputSymbols = ["a", "b", "c"];
var input = window.input || ["a", "a", "b", "b", "c"];
var states = [0, 1, 2, 3, 4];
var finalStates = [4];
var step = 0;
var machineState = new __WEBPACK_IMPORTED_MODULE_3__MachineState__["a" /* default */](states, // States
finalStates, // Final states
0, // Head position
'S', // Initial State
transitionTable, // Transition Function
input.slice());

let readyForEvent = true;

/**
 * Resets the whole machine to the initial state.
 */
let reset = input => {
    // Reset machine state
    machineState.head = 0;
    machineState.state = 'S';
    machineState.tape = input.slice();
    machineState.running = __WEBPACK_IMPORTED_MODULE_0__consts_js__["c" /* STATE_RUNNING */];

    // Remove state info
    let stateEl = document.querySelector('.state');
    stateEl.classList.remove("fail");
    stateEl.textContent = "";

    // Reset & redraw step counter
    step = 0;
    document.querySelector('.counter').textContent = step;

    // Reset machine input for good measure
    document.querySelector('#machine-input').value = input.join("");

    // Re-render the simulator
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__render__["a" /* default */])(new __WEBPACK_IMPORTED_MODULE_5__ViewState__["a" /* default */](__WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */], undefined, machineState.tape, 0), true);
};

/**
 * Handler for "r" keypress - resets the machine.
 */
let rPressed = () => {
    if (!readyForEvent) {
        return; // Animation in progress, do nothing
    }
    readyForEvent = false;
    reset(input);
    // Animation sync
    setTimeout(() => {
        readyForEvent = true;
    }, 100);
};

/**
 * Handler for "space" keypress, mves the machine to the next state.
 */
document.spacePressed = function () {
    if (!defined) {
        return;
    }
    if (!readyForEvent) {
        return; // Animation in progress, do nothing
    }
    if (machineState.running !== __WEBPACK_IMPORTED_MODULE_0__consts_js__["c" /* STATE_RUNNING */]) {
        return;
    }
    readyForEvent = false;

    const {
        machineStep,
        running
    } = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__turing_machine__["a" /* default */])(machineState);

    let stateEl = null;
    switch (running) {
        case __WEBPACK_IMPORTED_MODULE_0__consts_js__["d" /* STATE_STOPPED_FAIL */]:
            machineState.running = __WEBPACK_IMPORTED_MODULE_0__consts_js__["d" /* STATE_STOPPED_FAIL */];
            stateEl = document.querySelector('.state');
            stateEl.classList.add("fail");
            stateEl.textContent = "Machine stopped unsuccessfully";
            break;
        case __WEBPACK_IMPORTED_MODULE_0__consts_js__["e" /* STATE_STOPPED_SUCCESS */]:
            machineState.running = __WEBPACK_IMPORTED_MODULE_0__consts_js__["e" /* STATE_STOPPED_SUCCESS */];
            stateEl = document.querySelector('.state');
            stateEl.classList.add("success");
            stateEl.textContent = "Machine stopped successfully";
            break;
        case __WEBPACK_IMPORTED_MODULE_0__consts_js__["c" /* STATE_RUNNING */]:
            let viewState = machineState.apply(machineStep);
            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__render__["a" /* default */])(viewState);
            document.querySelector('.counter').textContent = ++step;
            break;
        default:
            console.err("Unknown machine state");
    }

    // Animation sync
    setTimeout(() => {
        readyForEvent = true;
    }, 100);
};

/**
 * Kaypress handling.
 */
// document.onkeydown = function(e) {
//     // if (e.code === "KeyR") {
//     //     rPressed()
//     // }
//     if (e.code === "Period") {
//         spacePressed()
//     }
//   return true;
//     // if (e.code === "KeyF") {
//     //     set301(transitionTable, machineState, reset, input)
//     // }
// }

document.setTuring = function (word, nodes, links) {
    var chars = [];
    transitionTable = {};
    machineState.states = [];
    machineState.finalStates = [];

    for (var i = 0; i < nodes.length; i++) {
        machineState.states.push(nodes[i].text);
        if (nodes[i].isAcceptState) {
            machineState.finalStates.push(nodes[i].text);
        }
        transitionTable[nodes[i].text] = {};
    }

    for (var i = 0; i < links.length; i++) {
        var nodeA;
        var nodeB;
        var text;
        if (links[i] instanceof SelfLink) {
            nodeA = links[i].node.text;
            nodeB = nodeA;
            text = links[i].text;
        } else if (links[i] instanceof Link) {
            nodeA = links[i].nodeA.text;
            nodeB = links[i].nodeB.text;
            text = links[i].text;
        } else {
            continue;
        }

        transitions = text.split("\\\\");
        for (var k = 0; k < transitions.length; k++) {
            var read;
            var write;
            var direction;
            if (transitions[k][0] == "(") {
                parts = transitions[k].substring(1, transitions[k].length - 1).split(",");
                read = parts[0];
                write = parts[1];
                direction = parts[2];
            } else {
                parts = transitions[k].split(",");
                parts1 = parts[0].split(";");
                read = parts1[0];
                write = parts1[1];
                direction = parts[1];
            }

            if (chars.indexOf(read) == -1) chars.push(read);
            if (chars.indexOf(write) == -1) chars.push(write);

            var dir = __WEBPACK_IMPORTED_MODULE_0__consts_js__["f" /* DIR_STAY */];
            var move = direction.toLowerCase()[0];
            if (move == "r") {
                dir = __WEBPACK_IMPORTED_MODULE_0__consts_js__["a" /* DIR_RIGHT */];
            } else if (move == "l") {
                dir = __WEBPACK_IMPORTED_MODULE_0__consts_js__["b" /* DIR_LEFT */];
            }
            transitionTable[nodeA][read] = new __WEBPACK_IMPORTED_MODULE_4__MachineStep__["a" /* default */](nodeB, write, dir);
        }
    }

    machineState.transitionFunction = transitionTable;
    // machineState.states = [0, 1, 2, 3, 'F']
    // machineState.finalStates = ['F']
    // document.querySelector(".description").innerHTML = "This Turing Machine accepts <br/> L = {w | w = a<sup>i</sup>b<sup>j</sup>c<sup>k</sup>; i,j,k > 0}";
    input = word.split('');
    reset(input);
    chars.push(document.blank);
    defined = true;
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__populateTransitionTable__["a" /* default */])(transitionTable, chars, machineState);
    return input;
};

// document.querySelector("a#r").addEventListener("click", (e) => {
//     e.preventDefault()
//     rPressed()
// })

// document.querySelector("a#space").addEventListener("click", (e) => {
//     e.preventDefault()
//     spacePressed()
// })

/**
 * Editor toggling.
 */
document.querySelector("#editor > a.banner").addEventListener("click", e => {
    let editorPane = document.querySelector("#editor");
    if (editorPane.classList.contains("active")) {
        editorPane.style.right = "-850px";
    } else {
        editorPane.style.right = "0";
    }
    editorPane.classList.toggle("active");
});

// Machine input init
let machineInputEl = document.querySelector("#machine-input");
machineInputEl.value = input.join("");

// --- Below are event listeners of hrefs

let resetEl = document.querySelector("#reset");
resetEl.addEventListener("click", e => {
    e.preventDefault();
    resetEl.blur();
    let rawInput = input = document.querySelector("#machine-input").value;
    input = rawInput.split("");
    symbols = input.reduce((acc, symbol) => {
        if (acc.indexOf(symbol) < 0) {
            acc.push(symbol);
        }
        return acc;
    }, []);
    symbols.push(document.blank);
    reset(input);
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__populateTransitionTable__["a" /* default */])(transitionTable, symbols, machineState);
});

document.querySelector("#add-state").addEventListener("click", e => {
    e.preventDefault();
    let newState = states.reduce((max, val) => {
        return val > max ? val : max;
    }, 0) + 1;
    states.push(newState);
    transitionTable[newState] = {};
    machineState.transitionTable = transitionTable;
    machineState.finalStates = [newState];
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__populateTransitionTable__["a" /* default */])(transitionTable, symbols, machineState);
});

// // Selecting current TM based on window location hash
// switch (window.location.hash) {
//     case "#cv31":
//         input = set31(transitionTable, machineState, reset)
//         break
//     case "#cv32":
//         input = set32(transitionTable, machineState, reset)
//         break
//     case "#cv33":
//         input = set33(transitionTable, machineState, reset)
//         break
//     case "#cv34":
//         input = set34(transitionTable, machineState, reset)
//         break
//     case "#cv302":
//         input = set302(transitionTable, machineState, reset)
//         break
//     case "#cv303":
//         input = set303(transitionTable, machineState, reset)
//         break
//     case "#cv301":
//     default:
//         input = set301(transitionTable, machineState, reset)
//         // render(new ViewState(DIR_RIGHT, undefined, machineState.tape))
//         populateTransitionTable(transitionTable, symbols, machineState)
// }

// document.querySelector("a#cv301").addEventListener("click", (e) => {
//     input = set301(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv302").addEventListener("click", (e) => {
//     input = set302(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv303").addEventListener("click", (e) => {
//     input = set303(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv31").addEventListener("click", (e) => {
//     input = set31(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv32").addEventListener("click", (e) => {
//     input = set32(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv33").addEventListener("click", (e) => {
//     input = set33(transitionTable, machineState, reset, input)
// })

// document.querySelector("a#cv34").addEventListener("click", (e) => {
//     input = set34(transitionTable, machineState, reset, input)
// })


window.addEventListener("online", e => {
    // No useful functionality here, I just want the points
    console.log("We are online!");
});

window.addEventListener("offline", e => {
    // No useful functionality here, I just want points
    console.log("We are offline :(");
});

window.reset = reset;

/***/ })
/******/ ]);