"use strict";

class SDSP {
    constructor() {
        this.regs = new Uint8Array(128);
    }

    read_reg(addr) {
        return this.regs[addr & 0x7F];
    }

    write_reg(addr, val) {
        this.regs[addr & 0x7F] = val;
    }
}