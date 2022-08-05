"use strict";

let SPC_NUM_TO_GENERATE = 1000; // Generate 1 of each test
const SPC_GEN_WAIT_HOW_LONG = 6; // 6 cycles of Wait are generated
let rand_seed = 'apples and bananas';
let rand_seeded;


// We use seedable, repeatable RNGs to make reproducible tests.
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

// Optionally create hex2, hex4, mksigned8, and save_js if needed...
if (typeof hex2 !== 'function') {
    /**
     * @param {Number} val
     */
    window.hex2 = function(val) {
        let outstr = val.toString(16);
        if (outstr.length === 1) outstr = '0' + outstr;
        return outstr.toUpperCase();
    }
}

if (typeof hex4 !== 'function') {
    /**
     * @param {Number} val
     */
    window.hex4 = function(val) {
        let outstr = val.toString(16);
        if (outstr.length < 4) outstr = '0' + outstr;
        if (outstr.length < 4) outstr = '0' + outstr;
        if (outstr.length < 4) outstr = '0' + outstr;
        return outstr.toUpperCase();
    }
}

if (typeof mksigned8 !== 'function') {
    window.mksigned8 = function(what) {
         return what >= 0x80 ? -(0x100 - what) : what;
    }
}

if (typeof save_js !== 'function') {
    // https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
    window.save_js = function(filename, data, kind = 'text/javascript') {
        const blob = new Blob([data], {type: kind});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
}

// Format target...
// { "name": "0a 78 2d",
// "initial": {
//   "pc": 55578,
//   "s": 142,
//   "a": 57,
//   "x": 62,
//   "y": 93,
//   "p": 171,
//   "ram": [ [55578, 10], [55579, 120], [55580, 45] ]
//},
//"final": {
//   "pc": 55579,
//   "s": 142,
//   "a": 114,
//   "x": 62,
//   "y": 93,
//   "p": 40,
//   "ram": [ [55578, 10], [55579, 120], [55580, 45] ]
//},
//"cycles": [ [55578, 10, "read"], [55579, 120, "read"]]
// },


// This generates (hopefully) cycle-accurate tests for the SPC700.
// PLEASE NOTE, the timings are taken from Higan, which claims 100% compatability.
// PLEASE ALSO NOTE, we do not simulate extra hardware registers here, clock dividers,
//  timers, etc.

class proc_cycles {
    constructor() {
        this.cycles = [];
        this.state = {
            RW: 'read',
            addr: 0,
            D: 0
        }
    }

    add(addr, val, kind) {
        this.cycles.push([addr, val, kind]);
    }

    serializeable() {
        return this.cycles;
    }
}

class proc_test {
    constructor() {
        // Serialized
        this.name = '';
        this.initial = {};
        this.final = {};
        this.cycles = new proc_cycles();

        // Not serialized
        this.current_cycle = 0;
    }

    serializable() {
        return {
            name: this.name,
            initial: this.initial,
            final: this.final,
            cycles: this.cycles.serializeable()
        }
    }

    finalize(regs) {
        regs.dump_to(this.final);
        let initial_RAMs = [];
        let final_RAMs = [];
        let initial_set = new Set();
        let final_set = new Set();
        for (let i in this.cycles.cycles) {
            let cycle = this.cycles.cycles[i];
            let addr = cycle[0];
            let val = cycle[1];
            let rw = cycle[2];
            if (addr !== null && val !== null) {
                if (rw === 'read') {
                    if (!initial_set.has(addr)) {
                        initial_set.add(addr);
                        initial_RAMs.push([addr, val]);
                    }
                }
                if (rw === 'write') {
                    if (!initial_set.has(addr)) {
                        initial_set.add(addr);
                        initial_RAMs.push([addr, 0]);
                    }
                }
                if (!final_set.has(addr)) {
                    final_set.add(addr);
                    final_RAMs.push([addr, val]);
                } else {
                    for (let j in final_RAMs) {
                        if (final_RAMs[j][0] === addr) {
                            final_RAMs[j][1] = val;
                            break;
                        }
                    }
                }
            }
            //}
        }
        initial_RAMs = initial_RAMs.sort((a, b) => {return a[0] - b[0]});
        final_RAMs = final_RAMs.sort((a, b) => {return a[0] - b[0]});
        this.initial.ram = initial_RAMs;
        this.final.ram = final_RAMs;
    }

    add_cycle(addr, val, kind) {
        this.cycles.add(addr, val, kind);
    }
}

const SPC_FN = 0x80;
const SPC_FV = 0x40;
const SPC_FP = 0x20;
const SPC_FB = 0x10;
const SPC_FH = 0x08;
const SPC_FI = 0x04;
const SPC_FZ = 0x02;
const SPC_FC = 0x01;

class SPC_PSW {
    constructor(from) {
        this.N = 0;
        this.V = 0;
        this.P = 0;
        this.B = 0;
        this.H = 0;
        this.I = 0;
        this.Z = 0;
        this.C = 0;

        this.setbyte(from);
    }

    setbyte(val) {
        this.N = (val >>> 7) & 1;
        this.V = (val >>> 6) & 1;
        this.P = (val >>> 5) & 1;
        this.B = (val >>> 4) & 1;
        this.H = (val >>> 3) & 1;
        this.I = (val >>> 2) & 1;
        this.Z = (val >>> 1) & 1;
        this.C = val & 1;
    }

    getbyte() {
        return this.C | (this.Z << 1) | (this.I << 2) | (this.H << 3) | (this.B << 4) | (this.P << 5) | (this.V << 6) | (this.N << 7);
    }
}

class SPC_state {
    constructor(from=null) {
        if (from === null) {
            this.A = 0;
            this.X = 0;
            this.Y = 0;
            this.SP = 0;
            this.PC = 0;
            this.P = new SPC_PSW(0);
        }
        else {
            this.A = from.a;
            this.X = from.x;
            this.Y = from.y;
            this.SP = from.sp;
            this.PC = from.pc;
            this.P = new SPC_PSW(from.psw);
        }
    }

    dump_to(where) {
        where.a = this.A;
        where.x = this.X;
        where.y = this.Y;
        where.sp = this.SP;
        where.pc = this.PC;
        where.psw = this.P.getbyte();
    }

    inc_PC() {
        this.PC = (this.PC + 1) & 0xFFFF;
    }

    dec_PC() {
        this.PC = (this.PC - 1) & 0xFFFF;
    }

    inc_SP() {
        this.SP = (this.SP + 1) & 0xFF;
    }

    dec_SP() {
        this.SP = (this.SP - 1) & 0xFF;
    }

}

function pt_rnd8() {
    //return Math.floor(Math.random() * 255);
    return Math.floor(rand_seeded() * 256) & 0xFF;
}

function pt_rnd16() {
    //return Math.floor(Math.random() * 65535);
    return Math.floor(rand_seeded() * 65536) & 0xFFFF;
}

function SPC_generate_registers(where) {
    where.pc = pt_rnd16();
    where.a = pt_rnd8();
    where.x = pt_rnd8();
    where.y = pt_rnd8();
    where.sp = pt_rnd8();
    where.psw = pt_rnd8() & 0xF7; // Break flag
}

function _isbset(val, bit) {
    let bm = 1 << bit;
    return (val & bit) ? 1 : 0;
}

function _getbit(val, bit) {
    return (val >>> bit) & 1;
}

function _ngetbit(val, bit) {
    return ((val >>> bit) & 1) ? 0 : 1;
}

function _setbit(val, bit, setto) {
    // Set bit X of val to setto
    let mask = 1 << bit;
    if (val & mask) { // Bit is set
        if (!setto) val &= ((~mask) & 0xFF);
    }
    else { // Bit is not set
        if (setto) val |= mask;
    }
    return val;
}

class SPC_test_generator {
    constructor() {
        this.test = null;
        this.regs = new SPC_state();

        this.already_done_addrs = {};
    }

    algorithmADC(x, y) {
        let z = x + y + this.regs.P.C;
        this.regs.P.C = +(z > 0xFF);
        this.setz(z);
        this.regs.P.H = ((x ^ y ^ z) >>> 4) & 1;
        this.regs.P.V = ((~(x ^ y)) & (x ^ z) & 0x80) >>> 7;
        this.setn8(z);
        return (z & 0xFF);
    }

    algorithmAND(x, y) {
        x &= y;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmASL(x) {
        this.regs.P.C = (x & 0x80) >>> 7;
        x = (x << 1) & 0xFF;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmCMP(x, y) {
        let z = x - y;
        this.regs.P.C = +(z >= 0);
        this.setz(z);
        this.setn8(z);
        return x;
    }

    algorithmDEC(x) {
        x = (x - 1) & 0xFF;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmEOR(x, y) {
        x ^= y;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmINC(x) {
        x = (x + 1) & 0xFF;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmLD(x, y) {
        this.setz(y);
        this.setn8(y);
        return y;
    }

    algorithmLSR(x) {
        this.regs.P.C = x & 1;
        x >>>= 1;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmOR(x, y) {
        if (typeof x === 'string') debugger;
        x |= y;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmROL(x) {
        let carry = this.regs.P.C;
        this.regs.P.C = (x >>> 7) & 1;
        x = ((x << 1) | carry) & 0xFF;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmROR(x) {
        let carry = this.regs.P.C << 7;
        this.regs.P.C = x & 1;
        x = (x >>> 1) | carry;
        this.setz(x);
        this.setn8(x);
        return x;
    }

    algorithmSBC(x, y) {
        return this.algorithmADC(x, (~y) & 0xFF);
    }

    algorithmADW(x, y) {
        let z;
        this.regs.P.C = 0;
        z = this.algorithmADC(x & 0xFF, y & 0xFF);
        z |= this.algorithmADC((x >>> 8) & 0xFF, (y >>> 8) & 0xFF) << 8;
        this.regs.P.Z = +((z & 0xFFFF) === 0);
        return (z & 0xFFFF);
    }

    algorithmCPW(x, y) {
        let z = x - y;
        this.regs.P.C = +(z >= 0);
        this.regs.P.Z = +((z & 0xFFFF) === 0);
        this.regs.P.N = (z >>> 15) & 1;
        return x;
    }

    algorithmLDW(x, y) {
        this.regs.P.Z = +(y === 0);
        this.regs.P.N = ((y & 0xFFFF) >>> 15) & 1;
        return y;
    }

    algorithmSBW(x, y) {
        let z;
        this.regs.P.C = 1;
        z = this.algorithmSBC(x & 0xFF, y & 0xFF);
        z |= this.algorithmSBC((x >>> 8) & 0xFF, (y >>> 8) & 0xFF) << 8;
        this.regs.P.Z = +((z & 0xFFFF) === 0);
        return z;
    }

    setn8(from) {
        this.regs.P.N = (from & 0x80) >>> 7;
    }

    setz(from) {
        this.regs.P.Z = +((from & 0xFF) === 0);
    }

    fetch() {
        let val = this.read(this.regs.PC);
        this.regs.inc_PC();
        return val;
    }

    load(addr) {
        addr &= 0xFF;
        //if (addr === 0x31) { console.log('P IS1!', this.regs.P.P);}
        if (this.regs.P.P) {
            addr += 0x100;
        }
        return this.read(addr);
    }

    store(addr, val) {
        addr &= 0xFF;
        //if (addr === 0x31) { console.log('P IS2!', this.regs.P.P);}
        if (this.regs.P.P) {
            addr += 0x100;
        }
        this.test.add_cycle(addr, val, 'write');
    }

    read(wherefrom, val=null) {
        if (val === null) val = pt_rnd8();
        if (wherefrom in this.already_done_addrs) {
            val = this.already_done_addrs[wherefrom];
        }
        else {
            this.already_done_addrs[wherefrom] = val;
        }
        this.test.add_cycle(wherefrom & 0xFFFF, val, 'read');
        return val;
    }

    write(whereto, what) {
        this.test.add_cycle(whereto & 0xFFFF, what & 0xFF, 'write');
    }

    read_discard(wherefrom=null) {
        if (wherefrom === null) wherefrom = this.regs.PC;
        let val = null;
        if (wherefrom in this.already_done_addrs) {
            val = this.already_done_addrs[wherefrom];
        }
        this.test.add_cycle(wherefrom & 0xFFFF, val, 'read');
        return val;
    }

    idle() {
        this.test.add_cycle(null, null, 'wait');
    }

    pull() {
        let val = pt_rnd8();
        this.regs.inc_SP();
        this.test.add_cycle(0x100 | this.regs.SP, val, 'read');
        return val;
    }

    push(what) {
        this.test.add_cycle(0x100 | this.regs.SP, what & 0xFF, 'write');
        this.regs.dec_SP();
    }

    alu(op) {
        return this['algorithm' + op].bind(this);
    }

    AbsoluteBitModify(mode) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        let bit = addr >>> 13;
        addr &= 0x1FFF;
        let data = this.read(addr);
        switch(mode) {
            case 0: // or
                this.idle();
                this.regs.P.C |= _getbit(data, bit);
                break;
            case 1: // !or
                this.idle();
                this.regs.P.C |= _ngetbit(data, bit);
                break;
            case 2: // and
                this.regs.P.C &= _getbit(data, bit);
                break;
            case 3: // !and
                this.regs.P.C &= _ngetbit(data, bit);
                break;
            case 4: // eor
                this.idle();
                this.regs.P.C ^= _getbit(data, bit);
                break;
            case 5: // ld
                this.regs.P.C = _getbit(data, bit);
                break;
            case 6: // st
                this.idle();
                data = _setbit(data, bit, this.regs.P.C);
                this.write(addr, data);
                break;
            case 7: // not
                data = _setbit(data, bit, _ngetbit(data, bit));
                this.write(addr, data);
                break;
        }
    }

    AbsoluteBitSet(bit, val) {
        let addr = this.fetch();
        let data = this.load(addr);
        let bm = 1 << bit;
        if (val) // SET
            data |= bm;
        else // CLR
            data &= ((~bm) & 0xFF);
        this.store(addr, data);
    }

    AbsoluteIndexedRead(op, index) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.idle();
        let data = this.read(addr + index);
        this.regs.A = this.alu(op)(this.regs.A, data);
    }

    AbsoluteIndexedWrite(index) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.idle();
        this.read(addr + index);
        this.write(addr + index, this.regs.A);
    }

    AbsoluteModify(op) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        let data = this.read(addr);
        this.write(addr, this.alu(op)(data));
    }

    AbsoluteRead(op, target) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        let data = this.read(addr);
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    AbsoluteWrite(val) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.read(addr);
        this.write(addr, val);
    }

    Branch(shouldi) {
        let data = this.fetch();
        if (!shouldi) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(data)) & 0xFFFF;
    }

    BranchBit(bit, val) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.idle();
        let displacement = this.fetch();
        let bm = 1 << bit;
        let do_branch;
        if (val) // Branch if set
            do_branch = (data & bm) !== 0;
        else
            do_branch = (data & bm) === 0;
        if (!do_branch) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(displacement)) & 0xFFFF;
    }

    BranchNotDirect() {
        let addr = this.fetch();
        let data = this.load(addr);
        this.idle();
        let displacement = this.fetch();
        if (this.regs.A === data) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(displacement)) & 0xFFFF;
    }

    BranchNotDirectDecrement() {
        let addr = this.fetch();
        let data = this.load(addr);
        data = (data - 1) & 0xFF;
        this.store(addr, data);
        let displacement = this.fetch();
        if (data === 0) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(displacement)) & 0xFFFF;
    }

    BranchNotDirectIndexed(index) {
        let addr = this.fetch();
        this.idle();
        let data = this.load(addr + index);
        this.idle();
        let displacement = this.fetch();
        if (this.regs.A === data) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(displacement)) & 0xFFFF;
    }

    BranchNotYDecrement() {
        this.read_discard();
        this.idle();
        let displacement = this.fetch();
        this.regs.Y = (this.regs.Y - 1) & 0xFF;
        if (this.regs.Y === 0) return;
        this.idle();
        this.idle();
        this.regs.PC = (this.regs.PC + mksigned8(displacement)) & 0xFFFF;
    }

    Break() {
        this.read_discard();
        this.push(this.regs.PC >>> 8);
        this.push(this.regs.PC & 0xFF);
        this.push(this.regs.P.getbyte());
        this.idle();
        let addr = this.read(0xFFDE);
        addr |= this.read(0xFFDF) << 8;
        this.regs.PC = addr;
        this.regs.P.I = 0;
        this.regs.P.B = 1;
    }

    CallAbsolute() {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.idle();
        this.push(this.regs.PC >>> 8);
        this.push(this.regs.PC & 0xFF);
        this.idle();
        this.idle();
        this.regs.PC = addr;
    }

    CallPage() {
        let addr = this.fetch();
        this.idle();
        this.push(this.regs.PC >>> 8);
        this.push(this.regs.PC & 0xFF);
        this.idle();
        this.regs.PC = 0xFF00 | addr;
    }

    CallTable(vector) {
        this.read(this.regs.PC, null);
        this.idle();
        this.push(this.regs.PC >>> 8);
        this.push(this.regs.PC);
        this.idle();
        let address = 0xFFDE - (vector * 2);
        this.regs.PC = this.read(address);
        this.regs.PC |= this.read(address + 1) << 8;
    }

    ComplementCarry() {
        this.read_discard();
        this.idle();
        this.regs.P.C = this.regs.P.C ? 0 : 1;
    }

    DecimalAdjustAdd() {
        this.read_discard();
        this.idle();
        if (this.regs.P.C || (this.regs.A > 0x99)) {
            this.regs.A = (this.regs.A + 0x60) & 0xFF;
            this.regs.P.C = 1;
        }
        if (this.regs.P.H || ((this.regs.A & 15) > 0x09)) {
            this.regs.A = (this.regs.A + 0x06) & 0xFF;
        }
        this.setz(this.regs.A);
        this.setn8(this.regs.A);
    }

    DecimalAdjustSub() {
        this.read_discard();
        this.idle();
        if (!this.regs.P.C || (this.regs.A > 0x99)) {
            this.regs.A = (this.regs.A - 0x60) & 0xFF;
            this.regs.P.C = 0;
        }
        if (!this.regs.P.H || ((this.regs.A & 15) > 0x09)) {
            this.regs.A = (this.regs.A - 0x06) & 0xFF;
        }
        this.setz(this.regs.A);
        this.setn8(this.regs.A);
    }

    DirectCompareWord(op) {
        let addr = this.fetch();
        let data = this.load(addr);
        data |= this.load(addr + 1) << 8;
        let YA = this.regs.A | (this.regs.Y << 8);
        YA = this.alu(op)(YA, data);
        this.regs.Y = (YA & 0xFF00) >>> 8;
        this.regs.A = YA & 0xFF;
    }

    DirectDirectCompare(op) {
        let source = this.fetch();
        let rhs = this.load(source);
        let target = this.fetch();
        let lhs = this.load(target);
        lhs = this.alu(op)(lhs, rhs);
        this.idle();
    }

    DirectDirectModify(op) {
        let source = this.fetch();
        let rhs = this.load(source);
        let target = this.fetch();
        let lhs = this.load(target);
        lhs = this.alu(op)(lhs, rhs);
        this.store(target, lhs);
    }

    DirectDirectWrite() {
        let source = this.fetch();
        let data = this.load(source);
        let target = this.fetch();
        this.store(target, data);
    }

    DirectImmediateCompare(op) {
        let immediate = this.fetch();
        let addr = this.fetch();
        let data = this.load(addr);
        data = this.alu(op)(data, immediate);
        this.idle();
    }

    DirectImmediateModify(op) {
        let immediate = this.fetch();
        let addr = this.fetch();
        let data = this.load(addr);
        data = this.alu(op)(data, immediate);
        this.store(addr, data);
    }

    DirectImmediateWrite() {
        let imm = this.fetch();
        let addr = this.fetch();
        this.load(addr);
        this.store(addr, imm);
    }

    DirectIndexedModify(op, index) {
        let addr = this.fetch();
        this.idle();
        let data = this.load(addr + index);
        this.store(addr + index, this.alu(op)(data));
    }

    DirectIndexedRead(op, target, index) {
        let addr = this.fetch();
        this.idle();
        let data = this.load(addr + index);
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    DirectIndexedWrite(val, index) {
        let addr = this.fetch();
        this.idle();
        this.load(addr + index);
        this.store(addr + index, val);
    }

    DirectModify(op) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.store(addr, this.alu(op)(data));
    }

    DirectModifyWord(adjust) {
        let addr = this.fetch();
        let data = (this.load(addr) + adjust) & 0xFFFF;
        this.store(addr, data & 0xFF);
        data += this.load(addr+1) << 8;
        this.store(addr+1, (data >>> 8) & 0xFF);
        this.regs.P.Z = +(data === 0);
        this.regs.P.N = (data & 0x8000) >>> 15;
    }

    DirectRead(op, target) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    DirectReadWord(op) {
        let addr = this.fetch();
        let data = this.load(addr);
        this.idle();
        data |= this.load(addr + 1) << 8;
        let YA = (this.regs.Y << 8) | this.regs.A;
        YA = this.alu(op)(YA, data);
        this.regs.Y = (YA & 0xFF00) >>> 8;
        this.regs.A = YA & 0xFF;
    }

    DirectWrite(val) {
        let addr = this.fetch();
        this.load(addr);
        this.store(addr, val);
    }

    DirectWriteWord() {
        let addr = this.fetch();
        this.load(addr);
        this.store(addr, this.regs.A);
        this.store(addr + 1, this.regs.Y);
    }

    Divide() {
        this.read_discard();
        for (let i =0; i < 10; i++) this.idle();
        let YA = (this.regs.Y << 8) | this.regs.A;
        this.regs.P.H = +((this.regs.Y & 15) >= (this.regs.X & 15));
        this.regs.P.V = +(this.regs.Y >= this.regs.X);
        if (this.regs.Y < (this.regs.X << 1)) {
            this.regs.A = (Math.floor(YA / this.regs.X)) & 0xFF;
            this.regs.Y = (YA % this.regs.X) & 0xFF;
        } else {
            this.regs.A = (255 - Math.floor((YA - (this.regs.X << 9)) / (256 - this.regs.X))) & 0xFF;
            this.regs.Y = (this.regs.X + ((YA - (this.regs.X << 9)) % (256 - this.regs.X))) & 0xFF;
        }
        this.regs.P.Z = +(this.regs.A === 0);
        this.regs.P.N = (this.regs.A & 0x80) >>> 7;
    }

    ExchangeNibble() {
        this.read_discard();
        this.idle();
        this.idle();
        this.idle();
        this.regs.A = (this.regs.A >>> 4) | ((this.regs.A << 4) & 0xF0);
        this.setz(this.regs.A);
        this.setn8(this.regs.A);
    }

    FlagSet(flag, value) {
        this.read_discard();
        if (flag === SPC_FI) this.idle();
        let cf = this.regs.P.getbyte();


        if (value) cf |= flag;
        else cf &= ((~flag) & 0xFF);

        this.regs.P.setbyte(cf);
    }

    IndirectIndexedRead(op, index) {
        let indirect = this.fetch();
        this.idle();
        let addr = this.load(indirect);
        addr |= this.load(indirect + 1) << 8;
        let data = this.read(addr + index);
        this.regs.A = this.alu(op)(this.regs.A, data);
    }

    IndirectIndexedWrite(val, index) {
        let indirect = this.fetch();
        let addr = this.load(indirect);
        addr |= this.load(indirect + 1) << 8;
        this.idle();
        this.read(addr + index);
        this.write(addr + index, val);
    }

    IndexedIndirectRead(op, index) {
        let indirect = this.fetch();
        this.idle();
        let addr = this.load(indirect + index);
        addr |= this.load(indirect + index + 1) << 8;
        let data = this.read(addr);
        this.regs.A = this.alu(op)(this.regs.A, data)
    }

    IndexedIndirectWrite(val, index) {
        let indirect = this.fetch();
        this.idle();
        let addr = this.load(indirect + index);
        addr |= this.load(indirect + index + 1) << 8;
        this.read(addr);
        this.write(addr, val);
    }

    IndirectXCompareIndirectY(op) {
        this.read_discard();
        let rhs = this.load(this.regs.Y);
        let lhs = this.load(this.regs.X);
        lhs = this.alu(op)(lhs, rhs);
        this.idle();
    }

    IndirectXIncrementRead(target) {
        this.read_discard();
        this.regs[target] = this.load(this.regs.X++);
        this.regs.X &= 0xFF;
        this.idle();
        this.setz(this.regs[target]);
        this.setn8(this.regs[target]);
    }

    IndirectXIncrementWrite(val) {
        this.read_discard();
        this.idle();
        this.store(this.regs.X++, val);
        this.regs.X &= 0xFF;
    }

    IndirectXRead(op) {
        this.read_discard();
        let data = this.load(this.regs.X);
        this.regs.A = this.alu(op)(this.regs.A, data);
    }

    IndirectXWrite(val) {
        this.read_discard();
        this.load(this.regs.X);
        this.store(this.regs.X, val);
    }

    IndirectXWriteIndirectY(op) {
        this.read_discard();
        let rhs = this.load(this.regs.Y);
        let lhs = this.load(this.regs.X);
        lhs = this.alu(op)(lhs, rhs);
        this.store(this.regs.X, lhs);
    }

    ImmediateRead(op, target) {
        let data = this.fetch();
        this.regs[target] = this.alu(op)(this.regs[target], data);
    }

    ImpliedModify(op, target) {
        this.read_discard();
        this.regs[target] = this.alu(op)(this.regs[target]);
    }

    JumpAbsolute() {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.regs.PC = addr;
    }

    JumpIndirectX() {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        this.idle();
        this.regs.PC = this.read(addr + this.regs.X);
        this.regs.PC |= this.read(addr + this.regs.X + 1) << 8;
    }

    Multiply() {
        this.read_discard();
        for (let i = 0; i < 7; i++) { this.idle(); }
        let ya = this.regs.Y * this.regs.A;
        this.regs.A = ya & 0xFF;
        this.regs.Y = (ya >>> 8) & 0xFF;
        this.setz(this.regs.Y);
        this.setn8(this.regs.Y);
    }

    OverflowClear() {
        this.read_discard();
        this.regs.P.H = 0;
        this.regs.P.V = 0;
    }

    Pull(target) {
        this.read_discard();
        this.idle();
        this.regs[target] = this.pull();
    }

    PullP() {
        this.read_discard();
        this.idle();
        this.regs.P.setbyte(this.pull());
    }

    Push(val) {
        this.read_discard();
        this.push(val);
        this.idle();
    }

    ReturnInterrupt() {
        this.read_discard();
        this.idle();
        this.regs.P.setbyte(this.pull())
        this.regs.PC = this.pull();
        this.regs.PC |= this.pull() << 8;
    }

    ReturnSubroutine() {
        this.read_discard();
        this.idle();
        this.regs.PC = this.pull();
        this.regs.PC |= this.pull() << 8;
    }

    Stop() {
        for (let i = 0; i < (SPC_GEN_WAIT_HOW_LONG >>> 1); i++) {
            this.read_discard();
            this.idle();
        }
    }

    TestSetBitsAbsolute(set) {
        let addr = this.fetch();
        addr |= this.fetch() << 8;
        let data = this.read(addr);
        this.regs.P.Z = +((this.regs.A - data) === 0);
        this.regs.P.N = ((this.regs.A - data) & 0x80) >>> 7;
        this.read(addr, data);
        this.write(addr, set ? data | this.regs.A : data & (~this.regs.A) & 0xFF);
    }

    Transfer(from, to) {
        this.read_discard();
        this.regs[to] = this.regs[from];
        if (to === 'SP') return;
        this.setz(this.regs[to]);
        this.setn8(this.regs[to]);
    }

    Wait() {
        for (let i = 0; i < (SPC_GEN_WAIT_HOW_LONG >>> 1); i++) {
            this.read_discard();
            this.idle();
        }
    }

    generate_test(opcode, number) {
        let tests = [];
        let bnum, vector;
        for (let testnum = 0; testnum < number; testnum++) {
            let seed = cyrb128(rand_seed + hex2(opcode) + hex4(testnum));
            rand_seeded = sfc32(seed[0], seed[1], seed[2], seed[3]);
            this.test = new proc_test();
            SPC_generate_registers(this.test.initial);
            this.regs = new SPC_state(this.test.initial);
            this.test.add_cycle(this.regs.PC, opcode, 'read');
            this.already_done_addrs = {[this.regs.PC]: opcode};
            this.regs.inc_PC();
            switch (opcode) {
                case 0x00: // Nop
                    this.read_discard();
                    break;
                case 0x01: // TCALL 0
                case 0x11: // TCALL 1
                case 0x21: // TCALL 2
                case 0x31: // TCALL 3
                case 0x41: // 4
                case 0x51: // 5
                case 0x61: // 6
                case 0x71: // 7
                case 0x81: // 8
                case 0x91: // 9
                case 0xA1: // 10
                case 0xB1: // 11
                case 0xC1: // 12
                case 0xD1: // 13
                case 0xE1: // 14
                case 0xF1: // 15
                    vector = (opcode & 0xF0) >>> 4;
                    this.CallTable(vector);
                    break;
                case 0x02: // SET1 d.0
                case 0x22: // SET1 d.1
                case 0x42: // SET1 d.2
                case 0x62: // SET1 d.3
                case 0x82: // SET1 d.4
                case 0xA2: // SET1 d.5
                case 0xC2: // SET1 d.6
                case 0xE2: // SET1 d.7
                    bnum = (opcode & 0xF0) >>> 5;
                    this.AbsoluteBitSet(bnum, true);
                    break;
                case 0x12: // CLR1 d.0
                case 0x32: // CLR1 d.1
                case 0x52: // CLR1 d.2
                case 0x72: // CLR1 d.3
                case 0x92: // CLR1 d.4
                case 0xB2: // CLR1 d.5
                case 0xD2: // CLR1 d.6
                case 0xF2: // CLR1 d.7
                    bnum = (((opcode & 0xF0) >>> 4) - 1) >>> 1;
                    this.AbsoluteBitSet(bnum, false);
                    break;
                case 0x03: // Branch if bit set
                case 0x23:
                case 0x43:
                case 0x63:
                case 0x83:
                case 0xA3:
                case 0xC3:
                case 0xE3:
                    bnum = (opcode & 0xF0) >>> 5;
                    this.BranchBit(bnum, true);
                    break;
                case 0x13: // Branch if bit clear
                case 0x33:
                case 0x53:
                case 0x73:
                case 0x93:
                case 0xB3:
                case 0xD3:
                case 0xF3:
                    bnum = (((opcode & 0xF0) >>> 4) - 1) >>> 1;
                    this.BranchBit(bnum, false);
                    break;
                case 0x04: // OR A, d
                    this.DirectRead('OR', 'A');
                    break;
                case 0x05: // OR A, !abs
                    this.AbsoluteRead('OR', 'A');
                    break;
                case 0x06: // OR A, (X)
                    this.IndirectXRead('OR');
                    break;
                case 0x07: // OR A, [d+x]
                    this.IndexedIndirectRead('OR', this.regs.X);
                    break;
                case 0x08: // OR A, #i
                    this.ImmediateRead('OR', 'A');
                    break;
                case 0x09: // OR dp, dp
                    this.DirectDirectModify('OR');
                    break;
                case 0x0A: // OR1 C, m.b
                    this.AbsoluteBitModify(0);
                    break;
                case 0x0B: // ASL d
                    this.DirectModify('ASL');
                    break;
                case 0x0C: // ASL !abs
                    this.AbsoluteModify('ASL')
                    break;
                case 0x0D: // Push P
                    this.Push(this.regs.P.getbyte());
                    break;
                case 0x0E: // TSET1 !a
                    this.TestSetBitsAbsolute(true);
                    break;
                case 0x0F:
                    this.Break(); // Break!
                    break;
                case 0x10: // Branch if NF === 0
                    this.Branch(this.regs.P.N === 0);
                    break;
                case 0x14: // OR A, d+X
                    this.DirectIndexedRead('OR', 'A', this.regs.X);
                    break;
                case 0x15: // OR A, !abs+X
                    this.AbsoluteIndexedRead('OR', this.regs.X);
                    break;
                case 0x16: // OR A, !abs+Y
                    this.AbsoluteIndexedRead('OR', this.regs.Y);
                    break;
                case 0x17: // OR A, [d]+Y
                    this.IndirectIndexedRead('OR', this.regs.Y);
                    break;
                case 0x18: // OR d, #imm ?
                    this.DirectImmediateModify('OR');
                    break;
                case 0x19:  // OR (X), (Y)
                    this.IndirectXWriteIndirectY('OR');
                    break;
                case 0x1A: // DEC d
                    this.DirectModifyWord(-1);
                    break;
                case 0x1B: // ASL d+X
                    this.DirectIndexedModify('ASL', this.regs.X);
                    break;
                case 0x1C:
                    this.ImpliedModify('ASL', 'A');
                    break;
                case 0x1D:
                    this.ImpliedModify('DEC', 'X');
                    break;
                case 0x1E:
                    this.AbsoluteRead('CMP', 'X');
                    break;
                case 0x1F:
                    this.JumpIndirectX();
                    break;
                case 0x20:
                    this.FlagSet(SPC_FP, false);
                    break;
                case 0x24:
                    this.DirectRead('AND', 'A');
                    break;
                case 0x25:
                    this.AbsoluteRead('AND', 'A');
                    break;
                case 0x26:
                    this.IndirectXRead('AND');
                    break;
                case 0x27:
                    this.IndexedIndirectRead('AND', this.regs.X);
                    break;
                case 0x28:
                    this.ImmediateRead('AND', 'A');
                    break;
                case 0x29:
                    this.DirectDirectModify('AND');
                    break;
                case 0x2A:
                    this.AbsoluteBitModify(1);
                    break;
                case 0x2B:
                    this.DirectModify('ROL');
                    break;
                case 0x2C:
                    this.AbsoluteModify('ROL');
                    break;
                case 0x2D:
                    this.Push(this.regs.A);
                    break;
                case 0x2E:
                    this.BranchNotDirect();
                    break;
                case 0x2F:
                    this.Branch(true);
                    break;
                case 0x30:
                    this.Branch(this.regs.P.N === 1);
                    break;
                case 0x34:
                    this.DirectIndexedRead('AND', 'A', this.regs.X);
                    break;
                case 0x35:
                    this.AbsoluteIndexedRead('AND', this.regs.X);
                    break;
                case 0x36:
                    this.AbsoluteIndexedRead('AND', this.regs.Y);
                    break;
                case 0x37:
                    this.IndirectIndexedRead('AND', this.regs.Y);
                    break;
                case 0x38:
                    this.DirectImmediateModify('AND');
                    break;
                case 0x39:
                    this.IndirectXWriteIndirectY('AND');
                    break;
                case 0x3A:
                    this.DirectModifyWord(1);
                    break;
                case 0x3B:
                    this.DirectIndexedModify('ROL', this.regs.X);
                    break;
                case 0x3C:
                    this.ImpliedModify('ROL', 'A');
                    break;
                case 0x3D:
                    this.ImpliedModify('INC', 'X');
                    break;
                case 0x3E:
                    this.DirectRead('CMP', 'X');
                    break;
                case 0x3F:
                    this.CallAbsolute();
                    break;
                case 0x40:
                    this.FlagSet(SPC_FP, true);
                    break;
                case 0x44:
                    this.DirectRead('EOR', 'A');
                    break;
                case 0x45:
                    this.AbsoluteRead('EOR', 'A');
                    break;
                case 0x46:
                    this.IndirectXRead('EOR');
                    break;
                case 0x47:
                    this.IndexedIndirectRead('EOR', this.regs.X);
                    break;
                case 0x48:
                    this.ImmediateRead('EOR', 'A');
                    break;
                case 0x49:
                    this.DirectDirectModify('EOR');
                    break;
                case 0x4A:
                    this.AbsoluteBitModify(2);
                    break;
                case 0x4B:
                    this.DirectModify('LSR');
                    break;
                case 0x4C:
                    this.AbsoluteModify('LSR');
                    break;
                case 0x4D:
                    this.Push(this.regs.X);
                    break;
                case 0x4E:
                    this.TestSetBitsAbsolute(0);
                    break;
                case 0x4F:
                    this.CallPage();
                    break;
                case 0x50:
                    this.Branch(this.regs.P.V === 0);
                    break;
                case 0x54:
                    this.DirectIndexedRead('EOR', 'A', this.regs.X);
                    break;
                case 0x55:
                    this.AbsoluteIndexedRead('EOR', this.regs.X);
                    break;
                case 0x56:
                    this.AbsoluteIndexedRead('EOR', this.regs.Y);
                    break;
                case 0x57:
                    this.IndirectIndexedRead('EOR', this.regs.Y);
                    break;
                case 0x58:
                    this.DirectImmediateModify('EOR');
                    break;
                case 0x59:
                    this.IndirectXWriteIndirectY('EOR');
                    break;
                case 0x5A:
                    this.DirectCompareWord('CPW');
                    break;
                case 0x5B:
                    this.DirectIndexedModify('LSR', this.regs.X);
                    break;
                case 0x5C:
                    this.ImpliedModify('LSR', 'A');
                    break;
                case 0x5D:
                    this.Transfer('A', 'X');
                    break;
                case 0x5E:
                    this.AbsoluteRead('CMP', 'Y');
                    break;
                case 0x5F:
                    this.JumpAbsolute();
                    break;
                case 0x60:
                    this.FlagSet(SPC_FC, false);
                    break;
                case 0x64:
                    this.DirectRead('CMP', 'A');
                    break;
                case 0x65:
                    this.AbsoluteRead('CMP', 'A');
                    break;
                case 0x66:
                    this.IndirectXRead('CMP');
                    break;
                case 0x67:
                    this.IndexedIndirectRead('CMP', this.regs.X);
                    break;
                case 0x68:
                    this.ImmediateRead('CMP', 'A');
                    break;
                case 0x69:
                    this.DirectDirectCompare('CMP');
                    break;
                case 0x6A:
                    this.AbsoluteBitModify(3);
                    break;
                case 0x6B:
                    this.DirectModify('ROR');
                    break;
                case 0x6C:
                    this.AbsoluteModify('ROR');
                    break;
                case 0x6D:
                    this.Push(this.regs.Y);
                    break;
                case 0x6E:
                    this.BranchNotDirectDecrement();
                    break;
                case 0x6F:
                    this.ReturnSubroutine();
                    break;
                case 0x70:
                    this.Branch(this.regs.P.V === 1);
                    break;
                case 0x74:
                    this.DirectIndexedRead('CMP', 'A', this.regs.X);
                    break;
                case 0x75:
                    this.AbsoluteIndexedRead('CMP', this.regs.X);
                    break;
                case 0x76:
                    this.AbsoluteIndexedRead('CMP', this.regs.Y);
                    break;
                case 0x77:
                    this.IndirectIndexedRead('CMP', this.regs.Y);
                    break;
                case 0x78:
                    this.DirectImmediateCompare('CMP');
                    break;
                case 0x79:
                    this.IndirectXCompareIndirectY('CMP');
                    break;
                case 0x7A:
                    this.DirectReadWord('ADW');
                    break;
                case 0x7B:
                    this.DirectIndexedModify('ROR', this.regs.X);
                    break;
                case 0x7C:
                    this.ImpliedModify('ROR', 'A');
                    break;
                case 0x7D:
                    this.Transfer('X', 'A');
                    break;
                case 0x7E:
                    this.DirectRead('CMP', 'Y');
                    break;
                case 0x7F:
                    this.ReturnInterrupt();
                    break;
                case 0x80:
                    this.FlagSet(SPC_FC, true);
                    break;
                case 0x84:
                    this.DirectRead('ADC', 'A');
                    break;
                case 0x85:
                    this.AbsoluteRead('ADC', 'A');
                    break;
                case 0x86:
                    this.IndirectXRead('ADC');
                    break;
                case 0x87:
                    this.IndexedIndirectRead('ADC', this.regs.X);
                    break;
                case 0x88:
                    this.ImmediateRead('ADC', 'A');
                    break;
                case 0x89:
                    this.DirectDirectModify('ADC');
                    break;
                case 0x8A:
                    this.AbsoluteBitModify(4);
                    break;
                case 0x8B:
                    this.DirectModify('DEC');
                    break;
                case 0x8C:
                    this.AbsoluteModify('DEC');
                    break;
                case 0x8D:
                    this.ImmediateRead('LD', 'Y');
                    break;
                case 0x8E:
                    this.PullP();
                    break;
                case 0x8F:
                    this.DirectImmediateWrite();
                    break;
                case 0x90:
                    this.Branch(this.regs.P.C === 0);
                    break;
                case 0x94:
                    this.DirectIndexedRead('ADC', 'A', this.regs.X);
                    break;
                case 0x95:
                    this.AbsoluteIndexedRead('ADC', this.regs.X);
                    break;
                case 0x96:
                    this.AbsoluteIndexedRead('ADC', this.regs.Y);
                    break;
                case 0x97:
                    this.IndirectIndexedRead('ADC', this.regs.Y);
                    break;
                case 0x98:
                    this.DirectImmediateModify('ADC');
                    break;
                case 0x99:
                    this.IndirectXWriteIndirectY('ADC');
                    break;
                case 0x9A:
                    this.DirectReadWord('SBW');
                    break;
                case 0x9B:
                    this.DirectIndexedModify('DEC', this.regs.X);
                    break;
                case 0x9C:
                    this.ImpliedModify('DEC', 'A');
                    break;
                case 0x9D:
                    this.Transfer('SP', 'X');
                    break;
                case 0x9E:
                    this.Divide();
                    break;
                case 0x9F:
                    this.ExchangeNibble();
                    break;
                case 0xA0:
                    this.FlagSet(SPC_FI, true);
                    break;
                case 0xA4:
                    this.DirectRead('SBC', 'A');
                    break;
                case 0xA5:
                    this.AbsoluteRead('SBC', 'A');
                    break;
                case 0xA6:
                    this.IndirectXRead('SBC');
                    break;
                case 0xA7:
                    this.IndexedIndirectRead('SBC', this.regs.X);
                    break;
                case 0xA8:
                    this.ImmediateRead('SBC', 'A');
                    break;
                case 0xA9:
                    this.DirectDirectModify('SBC');
                    break;
                case 0xAA:
                    this.AbsoluteBitModify(5);
                    break;
                case 0xAB:
                    this.DirectModify('INC');
                    break;
                case 0xAC:
                    this.AbsoluteModify('INC');
                    break;
                case 0xAD:
                    this.ImmediateRead('CMP', 'Y');
                    break;
                case 0xAE:
                    this.Pull('A');
                    break;
                case 0xAF:
                    this.IndirectXIncrementWrite(this.regs.A);
                    break;
                case 0xB0:
                    this.Branch(this.regs.P.C === 1);
                    break;
                case 0xB4:
                    this.DirectIndexedRead('SBC', 'A', this.regs.X);
                    break;
                case 0xB5:
                    this.AbsoluteIndexedRead('SBC', this.regs.X);
                    break;
                case 0xB6:
                    this.AbsoluteIndexedRead('SBC', this.regs.Y);
                    break;
                case 0xB7:
                    this.IndirectIndexedRead('SBC', this.regs.Y);
                    break;
                case 0xB8:
                    this.DirectImmediateModify('SBC');
                    break;
                case 0xB9:
                    this.IndirectXWriteIndirectY('SBC');
                    break;
                case 0xBA:
                    this.DirectReadWord('LDW');
                    break;
                case 0xBB:
                    this.DirectIndexedModify('INC', this.regs.X);
                    break;
                case 0xBC:
                    this.ImpliedModify('INC', 'A');
                    break;
                case 0xBD:
                    this.Transfer('X', 'SP');
                    break;
                case 0xBE:
                    this.DecimalAdjustSub();
                    break;
                case 0xBF:
                    this.IndirectXIncrementRead('A');
                    break;
                case 0xC0:
                    this.FlagSet(SPC_FI, false);
                    break;
                case 0xC4:
                    this.DirectWrite(this.regs.A);
                    break;
                case 0xC5:
                    this.AbsoluteWrite(this.regs.A);
                    break;
                case 0xC6:
                    this.IndirectXWrite(this.regs.A);
                    break;
                case 0xC7:
                    this.IndexedIndirectWrite(this.regs.A, this.regs.X);
                    break;
                case 0xC8:
                    this.ImmediateRead('CMP', 'X');
                    break;
                case 0xC9:
                    this.AbsoluteWrite(this.regs.X);
                    break;
                case 0xCA:
                    this.AbsoluteBitModify(6);
                    break;
                case 0xCB:
                    this.DirectWrite(this.regs.Y);
                    break;
                case 0xCC:
                    this.AbsoluteWrite(this.regs.Y);
                    break;
                case 0xCD:
                    this.ImmediateRead('LD', 'X');
                    break;
                case 0xCE:
                    this.Pull('X');
                    break;
                case 0xCF:
                    this.Multiply();
                    break;
                case 0xD0:
                    this.Branch(this.regs.P.Z === 0);
                    break;
                case 0xD4:
                    this.DirectIndexedWrite(this.regs.A, this.regs.X);
                    break;
                case 0xD5:
                    this.AbsoluteIndexedWrite(this.regs.X);
                    break;
                case 0xD6:
                    this.AbsoluteIndexedWrite(this.regs.Y);
                    break;
                case 0xD7:
                    this.IndirectIndexedWrite(this.regs.A, this.regs.Y);
                    break;
                case 0xD8:
                    this.DirectWrite(this.regs.X);
                    break;
                case 0xD9:
                    this.DirectIndexedWrite(this.regs.X, this.regs.Y);
                    break;
                case 0xDA:
                    this.DirectWriteWord();
                    break;
                case 0xDB:
                    this.DirectIndexedWrite(this.regs.Y, this.regs.X);
                    break;
                case 0xDC:
                    this.ImpliedModify('DEC', 'Y');
                    break;
                case 0xDD:
                    this.Transfer('Y', 'A');
                    break;
                case 0xDE:
                    this.BranchNotDirectIndexed(this.regs.X);
                    break;
                case 0xDF:
                    this.DecimalAdjustAdd();
                    break;
                case 0xE0:
                    this.OverflowClear();
                    break;
                case 0xE4:
                    this.DirectRead('LD', 'A');
                    break;
                case 0xE5:
                    this.AbsoluteRead('LD', 'A');
                    break;
                case 0xE6:
                    this.IndirectXRead('LD');
                    break;
                case 0xE7:
                    this.IndexedIndirectRead('LD', this.regs.X);
                    break;
                case 0xE8:
                    this.ImmediateRead('LD', 'A');
                    break;
                case 0xE9:
                    this.AbsoluteRead('LD', 'X');
                    break;
                case 0xEA:
                    this.AbsoluteBitModify(7);
                    break;
                case 0xEB:
                    this.DirectRead('LD', 'Y');
                    break;
                case 0xEC:
                    this.AbsoluteRead('LD', 'Y');
                    break;
                case 0xED:
                    this.ComplementCarry();
                    break;
                case 0xEE:
                    this.Pull('Y');
                    break;
                case 0xEF:
                    this.Wait();
                    break;
                case 0xF0:
                    this.Branch(this.regs.P.Z === 1);
                    break;
                case 0xF4:
                    this.DirectIndexedRead('LD', 'A', this.regs.X);
                    break;
                case 0xF5:
                    this.AbsoluteIndexedRead('LD', this.regs.X);
                    break;
                case 0xF6:
                    this.AbsoluteIndexedRead('LD', this.regs.Y);
                    break;
                case 0xF7:
                    this.IndirectIndexedRead('LD', this.regs.Y);
                    break;
                case 0xF8:
                    this.DirectRead('LD', 'X');
                    break;
                case 0xF9:
                    this.DirectIndexedRead('LD', 'X', this.regs.Y);
                    break;
                case 0xFA:
                    this.DirectDirectWrite();
                    break;
                case 0xFB:
                    this.DirectIndexedRead('LD', 'Y', this.regs.X);
                    break;
                case 0xFC:
                    this.ImpliedModify('INC', 'Y');
                    break;
                case 0xFD:
                    this.Transfer('A', 'Y');
                    break;
                case 0xFE:
                    this.BranchNotYDecrement();
                    break;
                case 0xFF:
                    this.Stop();
                    break;
            }
            if (opcode === 0x9D && testnum === 0) {
                console.log('REGS!', this.regs);
            }
            this.test.finalize(this.regs);
            this.test.name = hex2(opcode) + ' ' + hex4(testnum)
            tests.push(this.test.serializable());
        }
        return tests;
    }
}

function generate_SPC700_test_test(seed = null) {
    if (seed !== null) rand_seed = seed;
    let test_generator = new SPC_test_generator();
    let tests = {};

    dconsole.addl(null,'Generating tests...');
    for (let i = 0; i < 256; i++) {
        tests[i] = test_generator.generate_test(i, SPC_NUM_TO_GENERATE);
    }
    dconsole.addl(null,'Zipping tests...');
    let zip = new JSZip();
    for (let i = 0; i < 256; i++) {
        zip.file((hex2(i) + '.json').toLowerCase(), JSON.stringify(tests[i]));
    }

    dconsole.addl(null,'Finalizing ZIP for download...')
    zip.generateAsync({type:"blob"}).then(function(content) {
        dconsole.addl(null, 'Downloading...');
        save_js("spc700 tests.zip", content, 'application/zip');
        dconsole.addl(null, 'Done!');
    });
    //save_js('spcalltests.json', JSON.stringify(tests));
}

