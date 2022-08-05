"use strict";

const BBCS1bit = Object.freeze({
	0x02: 0,
	0x03: 0,
    0x12: 0,
	0x13: 0,
	0x22: 1,
	0x23: 1,
	0x32: 1,
    0x33: 1,
	0x42: 2,
	0x43: 2,
	0x52: 2,
    0x53: 2,
	0x62: 3,
	0x63: 3,
	0x72: 3,
    0x73: 3,
	0x82: 4,
	0x83: 4,
	0x92: 4,
    0x93: 4,
	0xA2: 5,
	0xA3: 5,
	0xB2: 5,
    0xB3: 5,
	0xC2: 6,
	0xC3: 6,
	0xD2: 6,
    0xD3: 6,
	0xE2: 7,
	0xE3: 7,
	0xF2: 7,
    0xF3: 7
})

const SPC_MN = Object.freeze({
    UNKNOWN: 0,
    ADC: 1,
    ADDW: 2,
    AND: 3,
    AND1: 4,
    AND1f: 401,
    ASL: 5,
    BBC: 6,
    BBS: 7,
    BCC: 8,
    BCS: 9,
    BEQ: 10,
    BMI: 11,
    BNE: 12,
    BPL: 13,
    BVC: 14,
    BVS: 15,
    BRA: 16,
    BRK: 17,
    CALL: 18,
    CBNE: 19,
    CLR1: 20,
    CLRC: 21,
    CLRP: 22,
    CLRV: 23,
    CMP: 24,
    CMPW: 25,
    DAA: 26,
    DAS: 27,
    DBNZ: 28,
    DEC: 29,
    DECW: 30,
    DI: 31,
    DIV: 32,
    EI: 33,
    EOR: 34,
    EOR1: 35,
    INC: 36,
    INCW: 37,
    JMP: 38,
    LSR: 39,
    MOV: 40,
    MOV1: 41,
    MOVW: 42,
    MUL: 43,
    NOP: 44,
    NOT1: 45,
    NOTC: 46,
    OR: 47,
    OR1: 48,
    OR1f: 4801,
    PCALL: 49,
    POP: 50,
    PUSH: 51,
    RET: 52,
    RET1: 53,
    ROL: 54,
    ROR: 55,
    SBC: 56,
    SET1: 57,
    SETC: 58,
    SETP: 59,
    SLEEP: 60,
    STOP: 61,
    SUBW: 62,
    TCALL: 63,
    TCLR1: 64,
    TSET1: 65,
    XCN: 66
});

const SPC_AM = Object.freeze({
    I: 0, // Implied
    PC_R: 2, // PC relative
    IND_XY: 3, // X/Y indirect Zero Page
    RX: 4, // register X
    RY: 5, // register Y
    RA: 6, // register A
    A_IND_X: 7, // [!abs+X]
    MOV: 8, // MOV has its own stuff
    DP_IMM: 9, // dp, #imm
    X_IMM: 10, // X, #imm
    X_DP: 11, // X, dp
    X_A: 12, // X, !abs
    Y_IMM: 13, // Y, #imm
    Y_DP: 14, // Y, dp
    Y_A: 15, // Y, !abs
    DP_DP: 16, // dp, dp
    MEMBITR: 17, // 2 bytes. 13 bits absolute address, 3 bits bit #. read-only
    MEMBITW: 1, // 2 bytes. 13 bits absolute address, 3 bits bit #. write after
    DP: 18, // dp
    DP_INDEXED_X: 19, // dp+X
    MOVW: 20,
    PC_R_BIT: 21, // PC relative based on a bit
    D_BIT: 22, // dp.n
    RA_IMM: 23,  // A, #imm
    RA_IND_X: 24, // A, (X)
    RA_IND_INDEXED_X: 25, // A, [dp+X]
    RA_IND_Y_INDEXED: 26, // A, [dp]+Y
    RA_DP: 27, // A, dp
    RA_DP_X: 28, // A, dp+X
    RA_A: 29, // A, !abs
    RA_A_X: 30, // A, !abs+X
    RA_A_Y: 31, // A, !abs+Y
    YA_DP: 32, // YA, dp
    A: 33, // !abs
    A16: 3301, // !abs 16-bits
    PC_R_D_X: 34, // dp+X, r
    PC_R_D: 35, // dp, r
    RX_IMM: 36, // X, #imm
    RX_DP: 37, // X, dp
    RX_A: 38, // X, !abs
    RY_IMM: 39, // Y, #imm
    RY_DP: 40, // Y dp
    RY_A: 41, // Y, !abs
    RY_R: 42, // Y, r
    DP_R: 43, // dp, r
    DPW: 44, // dp (word)
    YA_X: 45, // YA, X for DIV
    RYA: 46, // YA for MUL
    STACK: 47, // Stack pop
    DCB: 48, // For assembler
    JMPA: 49, // Jump Absolute
    IMM: 50 // Immediate
});

class SPC_OP_INFO {
    constructor(opcode, mnemonic, operand, ins, addr_mode, cycles) {
        this.opcode = opcode;
        this.mnemonic = mnemonic;
        this.operand = operand;
        this.ins = ins;
        this.addr_mode = addr_mode;
        this.cycles = cycles;
    }
}

/*
 */
const SPC_INS = Object.freeze({
    // Opcodes used in boot IPL
    0x00: new SPC_OP_INFO(0x00, 'NOP', '', SPC_MN.NOP, SPC_AM.I, 2), // X
    0x01: new SPC_OP_INFO(0x01, 'TCALL', '0', SPC_MN.TCALL, SPC_AM.I, 8), // X
    0x0B: new SPC_OP_INFO(0x0B, 'ASL', 'd', SPC_MN.ASL, SPC_AM.DP, 4), // X
    0x10: new SPC_OP_INFO(0x10, 'BPL', 'r', SPC_MN.BPL, SPC_AM.PC_R, 2), // +2 for branch
    0x19: new SPC_OP_INFO(0x19, 'OR', '(X), (Y)', SPC_MN.OR, SPC_AM.IND_XY, 5), // X
    0x1D: new SPC_OP_INFO(0x1D, 'DEC', 'X', SPC_MN.DEC, SPC_AM.RX, 2), // X
    0x1F: new SPC_OP_INFO(0x1F, 'JMP', '[!abs+X]', SPC_MN.JMP, SPC_AM.A_IND_X, 6), // X
    0x2F: new SPC_OP_INFO(0x2F, 'BRA', 'r', SPC_MN.BRA, SPC_AM.PC_R, 2), // X
    0x5D: new SPC_OP_INFO(0x5D, 'MOV', 'X, A', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0x78: new SPC_OP_INFO(0x78, 'CMP', 'dp, #imm', SPC_MN.CMP, SPC_AM.DP_IMM, 5), // X
    0x7E: new SPC_OP_INFO(0x7E, 'CMP', 'Y, dp', SPC_MN.CMP, SPC_AM.Y_DP, 3), // X
    0x8F: new SPC_OP_INFO(0x8F, 'MOV', 'd, #imm', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xAA: new SPC_OP_INFO(0xAA, 'MOV1', 'C, m.b', SPC_MN.MOV1, SPC_AM.MEMBITR, 4), // X
    0xAB: new SPC_OP_INFO(0xAB, 'INC', 'dp', SPC_MN.INC, SPC_AM.DP, 4), // X
    0xBA: new SPC_OP_INFO(0xBA, 'MOVW', 'YA, dp', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xBB: new SPC_OP_INFO(0xBB, 'INC', 'dp+X', SPC_MN.INC, SPC_AM.DP_INDEXED_X, 5), // X
    0xBD: new SPC_OP_INFO(0xBD, 'MOV', 'SP, X', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xC0: new SPC_OP_INFO(0xC0, 'DI', '', SPC_MN.DI, SPC_AM.I, 3), // X
    0xC4: new SPC_OP_INFO(0xC4, 'MOV', 'd, A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xC6: new SPC_OP_INFO(0xC6, 'MOV', '(X), A', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCB: new SPC_OP_INFO(0xCB, 'MOV', 'd, Y', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xCC: new SPC_OP_INFO(0xCC, 'MOV', '!a, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xCD: new SPC_OP_INFO(0xCD, 'MOV', 'X, #imm', SPC_MN.MOV, SPC_AM.MOV,2), // X
    0xD0: new SPC_OP_INFO(0xD0, 'BNE', 'r', SPC_MN.BNE, SPC_AM.PC_R, 2), // X
    0xD7: new SPC_OP_INFO(0xD7, 'MOV', '[dp]+Y, A', SPC_MN.MOV, SPC_AM.MOV, 7), // X
    0xDA: new SPC_OP_INFO(0xDA, 'MOVW', 'd, YA', SPC_MN.MOVW, SPC_AM.MOVW, 5), // X
    0xDB: new SPC_OP_INFO(0xDB, 'MOV', 'dp+X, Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xDD: new SPC_OP_INFO(0xDD, 'MOV', 'A, Y', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xE4: new SPC_OP_INFO(0xE4, 'MOV', 'A, dp', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xE8: new SPC_OP_INFO(0xE8, 'MOV', 'A, #imm', SPC_MN.MOV, SPC_AM.MOV, 2), // X
    0xEB: new SPC_OP_INFO(0xEB, 'MOV', 'Y, dp', SPC_MN.MOV, SPC_AM.MOV, 3), // X
    0xEF: new SPC_OP_INFO(0xEF, 'SLEEP', '', SPC_MN.SLEEP, SPC_AM.I, 3), // X
    0xF3: new SPC_OP_INFO(0xF3, 'BBC', 'dp.n, r', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0xF4: new SPC_OP_INFO(0xF4, 'MOV', 'A, dp+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xF5: new SPC_OP_INFO(0xF5, 'MOV', '!a+X', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xF6: new SPC_OP_INFO(0xF6, 'MOV', '!a+Y', SPC_MN.MOV, SPC_AM.MOV, 5), // X
    0xFB: new SPC_OP_INFO(0xFB, 'MOV', 'Y, dp+X', SPC_MN.MOV, SPC_AM.MOV, 4), // X
    0xFC: new SPC_OP_INFO(0xFC, 'INC', 'Y', SPC_MN.INC, SPC_AM.RY, 2), // X
    0xFF: new SPC_OP_INFO(0xFF, 'STOP', '', SPC_MN.STOP, SPC_AM.I, 2), // X

    // Rest of opcodes, not as well tested ATM
    0x02: new SPC_OP_INFO(0x02, 'SET1', 'dp.0', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x03: new SPC_OP_INFO(0x03, 'BBS', 'dp.0, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x04: new SPC_OP_INFO(0x04, 'OR', 'A, dp', SPC_MN.OR, SPC_AM.RA_DP, 3), // X
    0x05: new SPC_OP_INFO(0x05, 'OR', 'A, !abs', SPC_MN.OR, SPC_AM.RA_A, 4),
    0x06: new SPC_OP_INFO(0x06, 'OR', 'A, (X)', SPC_MN.OR, SPC_AM.RA_IND_X, 3), // X
    0x07: new SPC_OP_INFO(0x07, 'OR', 'A, [dp+X]', SPC_MN.OR, SPC_AM.RA_IND_INDEXED_X, 6),
    0x08: new SPC_OP_INFO(0x08, 'OR', 'A, #', SPC_MN.OR, SPC_AM.RA_IMM, 2), // X
    0x09: new SPC_OP_INFO(0x09, 'OR', 'dp, dp', SPC_MN.OR, SPC_AM.DP_DP, 6),
    0x0A: new SPC_OP_INFO(0x0A, 'OR1', 'C, m.b', SPC_MN.OR1, SPC_AM.MEMBITR, 5),
    0x0C: new SPC_OP_INFO(0x0C, 'ASL', '!abs', SPC_MN.ASL, SPC_AM.A, 5),
    0x0D: new SPC_OP_INFO(0x0D, 'PUSH', 'P', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x0E: new SPC_OP_INFO(0x0E, 'TSET1', '!abs', SPC_MN.TSET1, SPC_AM.A, 6),
    0x0F: new SPC_OP_INFO(0x0F, 'BRK', 'i', SPC_MN.BRK, SPC_AM.I, 8),
    0x11: new SPC_OP_INFO(0x11, 'TCALL', 'i', SPC_MN.TCALL, SPC_AM.I, 8),
    0x12: new SPC_OP_INFO(0x12, 'CLR1', 'dp.0', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x13: new SPC_OP_INFO(0x13, 'BBC', 'dp.0', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x14: new SPC_OP_INFO(0x14, 'OR', 'A, dp+X', SPC_MN.OR, SPC_AM.RA_DP_X, 4),
    0x15: new SPC_OP_INFO(0x15, 'OR', 'A, !abs+X', SPC_MN.OR, SPC_AM.RA_A_X, 5),
    0x16: new SPC_OP_INFO(0x16, 'OR', 'A, !abs+Y', SPC_MN.OR, SPC_AM.RA_A_Y, 5),
    0x17: new SPC_OP_INFO(0x17, 'OR', 'A, [dp]+Y', SPC_MN.OR, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x18: new SPC_OP_INFO(0x18, 'OR', 'dp, #imm', SPC_MN.OR, SPC_AM.DP_IMM, 5),
    0x1A: new SPC_OP_INFO(0x1A, 'DECW', 'dp', SPC_MN.DECW, SPC_AM.DPW, 6),
    0x1B: new SPC_OP_INFO(0x1B, 'ASL', 'dp+X', SPC_MN.ASL, SPC_AM.DP_INDEXED_X, 5),
    0x1C: new SPC_OP_INFO(0x1C, 'ASL', 'A', SPC_MN.ASL, SPC_AM.RA, 2),
    0x1E: new SPC_OP_INFO(0x1E, 'CMP', 'X, !abs', SPC_MN.CMP, SPC_AM.RX_A, 4),
    0x20: new SPC_OP_INFO(0x20, 'CLRP', 'i', SPC_MN.CLRP, SPC_AM.I, 2),
    0x21: new SPC_OP_INFO(0x21, 'TCALL', '2', SPC_MN.TCALL, SPC_AM.I, 8),
    0x22: new SPC_OP_INFO(0x22, 'SET1', 'dp.1', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x23: new SPC_OP_INFO(0x23, 'BBS', 'dp.1, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x24: new SPC_OP_INFO(0x24, 'AND', 'A, dp', SPC_MN.AND, SPC_AM.RA_DP, 3),
    0x25: new SPC_OP_INFO(0x25, 'AND', 'A, !abs', SPC_MN.AND, SPC_AM.RA_A, 4),
    0x26: new SPC_OP_INFO(0x26, 'AND', 'A, (X)', SPC_MN.AND, SPC_AM.RA_IND_X, 3),
    0x27: new SPC_OP_INFO(0x27, 'AND', 'A, [dp+X]', SPC_MN.AND, SPC_AM.RA_IND_INDEXED_X, 6),
    0x28: new SPC_OP_INFO(0x28, 'AND', 'A, #imm', SPC_MN.AND, SPC_AM.RA_IMM, 2),
    0x29: new SPC_OP_INFO(0x29, 'AND', 'dp, dp', SPC_MN.AND, SPC_AM.DP_DP, 6),
    0x2A: new SPC_OP_INFO(0x2A, 'OR1', 'C, /m.b', SPC_MN.OR1f, SPC_AM.MEMBITR, 5),
    0x2B: new SPC_OP_INFO(0x2B, 'ROL', 'dp', SPC_MN.ROL, SPC_AM.DP, 4),
    0x2C: new SPC_OP_INFO(0x2C, 'ROL', '!abs', SPC_MN.ROL, SPC_AM.A, 5),
    0x2D: new SPC_OP_INFO(0x2D, 'PUSH', 'A', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x2E: new SPC_OP_INFO(0x2E, 'CBNE', 'dp, r', SPC_MN.CBNE, SPC_AM.PC_R_D, 5),
    0x30: new SPC_OP_INFO(0x30, 'BMI', 'r', SPC_MN.BMI, SPC_AM.PC_R, 2),
    0x31: new SPC_OP_INFO(0x31, 'TCALL', '3', SPC_MN.TCALL, SPC_AM.I, 8),
    0x32: new SPC_OP_INFO(0x32, 'CLR1', 'dp.1', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x33: new SPC_OP_INFO(0x33, 'BBC', 'dp.1', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x34: new SPC_OP_INFO(0x34, 'AND', 'A, dp+X', SPC_MN.AND, SPC_AM.RA_DP_X, 4),
    0x35: new SPC_OP_INFO(0x35, 'AND', 'A, !abs+X', SPC_MN.AND, SPC_AM.RA_A_X, 5),
    0x36: new SPC_OP_INFO(0x36, 'AND', 'A, !abs+Y', SPC_MN.AND, SPC_AM.RA_A_Y, 5),
    0x37: new SPC_OP_INFO(0x37, 'AND', 'A, [dp]+Y', SPC_MN.AND, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x38: new SPC_OP_INFO(0x38, 'AND', 'dp, #imm', SPC_MN.AND, SPC_AM.DP_IMM, 5),
    0x39: new SPC_OP_INFO(0x39, 'AND', '(X), (Y)', SPC_MN.AND, SPC_AM.IND_XY, 5),
    0x3A: new SPC_OP_INFO(0x3A, 'INCW', 'dp', SPC_MN.INCW, SPC_AM.DPW, 6),
    0x3B: new SPC_OP_INFO(0x3B, 'ROL', 'dp+X', SPC_MN.ROL, SPC_AM.DP_INDEXED_X, 5),
    0x3C: new SPC_OP_INFO(0x3C, 'ROL', 'A', SPC_MN.ROL, SPC_AM.RA, 2),
    0x3D: new SPC_OP_INFO(0x3D, 'INC', 'X', SPC_MN.INC, SPC_AM.RX, 2),
    0x3E: new SPC_OP_INFO(0x3E, 'CMP', 'X, dp', SPC_MN.CMP, SPC_AM.RX_DP, 3),
    0x3F: new SPC_OP_INFO(0x3F, 'CALL', '!abs', SPC_MN.CALL, SPC_AM.A16, 8),
    0x40: new SPC_OP_INFO(0x40, 'SETP', 'i', SPC_MN.SETP, SPC_AM.I, 2),
    0x41: new SPC_OP_INFO(0x41, 'TCALL', '4', SPC_MN.TCALL, SPC_AM.I, 8),
    0x42: new SPC_OP_INFO(0x42, 'SET1', 'dp.2', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x43: new SPC_OP_INFO(0x43, 'BBS', 'dp.2, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x44: new SPC_OP_INFO(0x44, 'EOR', 'A, dp', SPC_MN.EOR, SPC_AM.RA_DP, 3),
    0x45: new SPC_OP_INFO(0x45, 'EOR', 'A, !abs', SPC_MN.EOR, SPC_AM.RA_A, 4),
    0x46: new SPC_OP_INFO(0x46, 'EOR', 'A, (X)', SPC_MN.EOR, SPC_AM.RA_IND_X, 3),
    0x47: new SPC_OP_INFO(0x47, 'EOR', 'A, [dp+X]', SPC_MN.EOR, SPC_AM.RA_IND_INDEXED_X, 6),
    0x48: new SPC_OP_INFO(0x48, 'EOR', 'A, #imm', SPC_MN.EOR, SPC_AM.RA_IMM, 2),
    0x49: new SPC_OP_INFO(0x49, 'EOR', 'dp, dp', SPC_MN.EOR, SPC_AM.DP_DP, 6),
    0x4A: new SPC_OP_INFO(0x4A, 'AND1', 'm.b', SPC_MN.AND1, SPC_AM.MEMBITR, 4), // X
    0x4B: new SPC_OP_INFO(0x4B, 'LSR', 'dp', SPC_MN.LSR, SPC_AM.DP, 4),
    0x4C: new SPC_OP_INFO(0x4C, 'LSR', '!abs', SPC_MN.LSR, SPC_AM.A, 5),
    0x4D: new SPC_OP_INFO(0x4D, 'PUSH', 'X', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x4E: new SPC_OP_INFO(0x4E, 'TCLR1', '!abs', SPC_MN.TCLR1, SPC_AM.A, 6),
    0x4F: new SPC_OP_INFO(0x4F, 'PCALL', '#imm', SPC_MN.PCALL, SPC_AM.IMM, 6),
    0x50: new SPC_OP_INFO(0x50, 'BVC', 'r', SPC_MN.BVC, SPC_AM.PC_R, 2),
    0x51: new SPC_OP_INFO(0x51, 'TCALL', '5', SPC_MN.TCALL, SPC_AM.I, 8),
    0x52: new SPC_OP_INFO(0x52, 'CLR1', 'dp.2', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x53: new SPC_OP_INFO(0x53, 'BBC', 'dp.2', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x54: new SPC_OP_INFO(0x54, 'EOR', 'A, dp+X', SPC_MN.EOR, SPC_AM.RA_DP_X, 4),
    0x55: new SPC_OP_INFO(0x55, 'EOR', 'A, !abs+X', SPC_MN.EOR, SPC_AM.RA_A_X, 5),
    0x56: new SPC_OP_INFO(0x56, 'EOR', 'A, !abs+Y', SPC_MN.EOR, SPC_AM.RA_A_Y, 5),
    0x57: new SPC_OP_INFO(0x57, 'EOR', 'A, [dp]+Y', SPC_MN.EOR, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x58: new SPC_OP_INFO(0x58, 'EOR', 'dp, #imm', SPC_MN.EOR, SPC_AM.DP_IMM, 5),
    0x59: new SPC_OP_INFO(0x59, 'EOR', '(X), (Y)', SPC_MN.EOR, SPC_AM.IND_XY, 5),
    0x5A: new SPC_OP_INFO(0x5A, 'CMPW', '', SPC_MN.CMPW, SPC_AM.YA_DP, 4),
    0x5B: new SPC_OP_INFO(0x5B, 'LSR', 'dp+X', SPC_MN.LSR, SPC_AM.DP_INDEXED_X, 5),
    0x5C: new SPC_OP_INFO(0x5C, 'LSR', 'A', SPC_MN.LSR, SPC_AM.RA, 2),
    0x5E: new SPC_OP_INFO(0x5E, 'CMP', 'Y, !abs', SPC_MN.CMP, SPC_AM.RY_A, 4),
    0x5F: new SPC_OP_INFO(0x5F, 'JMP', '!abs', SPC_MN.JMP, SPC_AM.JMPA, 3),
    0x60: new SPC_OP_INFO(0x60, 'CLRC', 'i', SPC_MN.CLRC, SPC_AM.I, 2),
    0x61: new SPC_OP_INFO(0x61, 'TCALL', '6', SPC_MN.TCALL, SPC_AM.I, 8),
    0x62: new SPC_OP_INFO(0x62, 'SET1', 'dp.3', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x63: new SPC_OP_INFO(0x63, 'BBS', 'dp.3, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x64: new SPC_OP_INFO(0x64, 'CMP', 'A, dp', SPC_MN.CMP, SPC_AM.RA_DP, 3),
    0x65: new SPC_OP_INFO(0x65, 'CMP', 'A, !abs', SPC_MN.CMP, SPC_AM.RA_A, 4),
    0x66: new SPC_OP_INFO(0x66, 'CMP', 'A, (X)', SPC_MN.CMP, SPC_AM.RA_IND_X, 3),
    0x67: new SPC_OP_INFO(0x67, 'CMP', 'A, [dp+X]', SPC_MN.CMP, SPC_AM.RA_IND_INDEXED_X, 6),
    0x68: new SPC_OP_INFO(0x68, 'CMP', 'A, #i', SPC_MN.CMP, SPC_AM.RA_IMM, 2),
    0x69: new SPC_OP_INFO(0x69, 'CMP', 'dp, dp', SPC_MN.CMP, SPC_AM.DP_DP, 6),
    0x6A: new SPC_OP_INFO(0x6A, 'AND1', 'C, /m.b', SPC_MN.AND1f, SPC_AM.MEMBITR, 4), // X
    0x6B: new SPC_OP_INFO(0x6B, 'ROR', 'dp', SPC_MN.ROR, SPC_AM.DP, 4),
    0x6C: new SPC_OP_INFO(0x6C, 'ROR', '!abs', SPC_MN.ROR, SPC_AM.A, 5),
    0x6D: new SPC_OP_INFO(0x6D, 'PUSH', 'Y', SPC_MN.PUSH, SPC_AM.STACK, 4),
    0x6E: new SPC_OP_INFO(0x6E, 'DBNZ', 'dp, r', SPC_MN.DBNZ, SPC_AM.DP_R, 5),
    0x6F: new SPC_OP_INFO(0x6F, 'RET', 'i', SPC_MN.RET, SPC_AM.I, 5),
    0x70: new SPC_OP_INFO(0x70, 'BVS', 'r', SPC_MN.BVS, SPC_AM.PC_R, 2),
    0x71: new SPC_OP_INFO(0x71, 'TCALL', '7', SPC_MN.TCALL, SPC_AM.I, 8),
    0x72: new SPC_OP_INFO(0x72, 'CLR1', 'dp.3', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x73: new SPC_OP_INFO(0x73, 'BBC', 'dp.3', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x74: new SPC_OP_INFO(0x74, 'CMP', 'A, dp+X', SPC_MN.CMP, SPC_AM.RA_DP_X, 4),
    0x75: new SPC_OP_INFO(0x75, 'CMP', 'A, !abs+X', SPC_MN.CMP, SPC_AM.RA_A_X, 5),
    0x76: new SPC_OP_INFO(0x76, 'CMP', 'A, !abs+Y', SPC_MN.CMP, SPC_AM.RA_A_Y, 5),
    0x77: new SPC_OP_INFO(0x77, 'CMP', 'A, [dp]+Y', SPC_MN.CMP, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x79: new SPC_OP_INFO(0x79, 'CMP', '(X), (Y)', SPC_MN.CMP, SPC_AM.IND_XY, 5),
    0x7A: new SPC_OP_INFO(0x7A, 'ADDW', 'YA, dp', SPC_MN.ADDW, SPC_AM.YA_DP, 5),
    0x7B: new SPC_OP_INFO(0x7B, 'ROR', 'dp+X', SPC_MN.ROR, SPC_AM.DP_INDEXED_X, 5),
    0x7C: new SPC_OP_INFO(0x7C, 'ROR', 'A', SPC_MN.ROR, SPC_AM.RA, 2),
    0x7D: new SPC_OP_INFO(0x7D, 'MOV', 'A, X', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x7F: new SPC_OP_INFO(0x7F, 'RET1', 'i', SPC_MN.RET1, SPC_AM.I, 6),
    0x80: new SPC_OP_INFO(0x80, 'SETC', 'i', SPC_MN.SETC, SPC_AM.I, 2),
    0x81: new SPC_OP_INFO(0x81, 'TCALL', '8', SPC_MN.TCALL, SPC_AM.I, 8),
    0x82: new SPC_OP_INFO(0x82, 'SET1', 'dp.4', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0x83: new SPC_OP_INFO(0x83, 'BBS', 'dp.4, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0x84: new SPC_OP_INFO(0x84, 'ADC', 'A, dp', SPC_MN.ADC, SPC_AM.RA_DP, 3),
    0x85: new SPC_OP_INFO(0x85, 'ADC', '!abs', SPC_MN.ADC, SPC_AM.RA_A, 4),
    0x86: new SPC_OP_INFO(0x86, 'ADC', 'A, (X)', SPC_MN.ADC, SPC_AM.RA_IND_X, 3),
    0x87: new SPC_OP_INFO(0x87, 'ADC', 'A, [dp+X]', SPC_MN.ADC, SPC_AM.RA_IND_INDEXED_X, 6),
    0x88: new SPC_OP_INFO(0x88, 'ADC', 'A, #imm', SPC_MN.ADC, SPC_AM.RA_IMM, 2),
    0x89: new SPC_OP_INFO(0x89, 'ADC', 'dp, dp', SPC_MN.ADC, SPC_AM.DP_DP, 6),
    0x8A: new SPC_OP_INFO(0x8A, 'EOR1', 'C, m.b', SPC_MN.EOR1, SPC_AM.MEMBITR, 5),
    0x8B: new SPC_OP_INFO(0x8B, 'DEC', 'dp', SPC_MN.DEC, SPC_AM.DP, 4),
    0x8C: new SPC_OP_INFO(0x8C, 'DEC', '!abs', SPC_MN.DEC, SPC_AM.A, 5),
    0x8D: new SPC_OP_INFO(0x8D, 'MOV', 'Y, #imm', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x8E: new SPC_OP_INFO(0x8E, 'POP', 'P', SPC_MN.POP, SPC_AM.STACK, 4),
    0x90: new SPC_OP_INFO(0x90, 'BCC', 'r', SPC_MN.BCC, SPC_AM.PC_R, 2),
    0x91: new SPC_OP_INFO(0x91, 'TCALL', '9', SPC_MN.TCALL, SPC_AM.I, 8),
    0x92: new SPC_OP_INFO(0x92, 'CLR1', 'dp.4', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0x93: new SPC_OP_INFO(0x93, 'BBC', 'dp.4', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0x94: new SPC_OP_INFO(0x94, 'ADC', 'A, dp+X', SPC_MN.ADC, SPC_AM.RA_DP_X, 4),
    0x95: new SPC_OP_INFO(0x95, 'ADC', 'A, !abs+X', SPC_MN.ADC, SPC_AM.RA_A_X, 5),
    0x96: new SPC_OP_INFO(0x96, 'ADC', 'A, !abs+Y', SPC_MN.ADC, SPC_AM.RA_A_Y, 5),
    0x97: new SPC_OP_INFO(0x97, 'ADC', 'A, [dp]+Y', SPC_MN.ADC, SPC_AM.RA_IND_Y_INDEXED, 6),
    0x98: new SPC_OP_INFO(0x98, 'ADC', 'dp, #imm', SPC_MN.ADC, SPC_AM.DP_IMM, 5),
    0x99: new SPC_OP_INFO(0x99, 'ADC', '(X), (Y)', SPC_MN.ADC, SPC_AM.IND_XY, 5),
    0x9A: new SPC_OP_INFO(0x9A, 'SUBW', 'YA, dp', SPC_MN.SUBW, SPC_AM.YA_DP, 5),
    0x9B: new SPC_OP_INFO(0x9B, 'DEC', 'dp+X', SPC_MN.DEC, SPC_AM.DP_INDEXED_X, 5),
    0x9C: new SPC_OP_INFO(0x9C, 'DEC', 'A', SPC_MN.DEC, SPC_AM.RA, 2),
    0x9D: new SPC_OP_INFO(0x9D, 'MOV', 'X, SP', SPC_MN.MOV, SPC_AM.MOV, 2),
    0x9E: new SPC_OP_INFO(0x9E, 'DIV', 'YA, X', SPC_MN.DIV, SPC_AM.YA_X, 12),
    0x9F: new SPC_OP_INFO(0x9F, 'XCN', 'i', SPC_MN.XCN, SPC_AM.I, 5),
    0xA0: new SPC_OP_INFO(0xA0, 'EI', 'i', SPC_MN.EI, SPC_AM.I, 3),
    0xA1: new SPC_OP_INFO(0xA1, 'TCALL', '10', SPC_MN.TCALL, SPC_AM.I, 8),
    0xA2: new SPC_OP_INFO(0xA2, 'SET1', 'dp.5', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xA3: new SPC_OP_INFO(0xA3, 'BBS', 'dp.5, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xA4: new SPC_OP_INFO(0xA4, 'SBC', 'A, dp', SPC_MN.SBC, SPC_AM.RA_DP, 3), // X
    0xA5: new SPC_OP_INFO(0xA5, 'SBC', 'A, !abs', SPC_MN.SBC, SPC_AM.RA_A, 4),
    0xA6: new SPC_OP_INFO(0xA6, 'SBC', 'A, (X)', SPC_MN.SBC, SPC_AM.RA_IND_X, 3),
    0xA7: new SPC_OP_INFO(0xA7, 'SBC', 'A, [dp+X]', SPC_MN.SBC, SPC_AM.RA_IND_INDEXED_X, 6),
    0xA8: new SPC_OP_INFO(0xA8, 'SBC', 'A, #imm', SPC_MN.SBC, SPC_AM.RA_IMM, 2),
    0xA9: new SPC_OP_INFO(0xA9, 'SBC', 'dp, dp', SPC_MN.SBC, SPC_AM.DP_DP, 6),
    0xAC: new SPC_OP_INFO(0xAC, 'INC', '!abs', SPC_MN.INC, SPC_AM.A, 5),
    0xAD: new SPC_OP_INFO(0xAD, 'CMP', 'Y, #imm', SPC_MN.CMP, SPC_AM.RY_IMM, 2),
    0xAE: new SPC_OP_INFO(0xAE, 'POP', 'A', SPC_MN.POP, SPC_AM.STACK, 4),
    0xAF: new SPC_OP_INFO(0xAF, 'MOV', '(X)+, A', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xB0: new SPC_OP_INFO(0xB0, 'BCS', 'r', SPC_MN.BCS, SPC_AM.PC_R, 2),
    0xB1: new SPC_OP_INFO(0xB1, 'TCALL', '11', SPC_MN.TCALL, SPC_AM.I, 8),
    0xB2: new SPC_OP_INFO(0xB2, 'CLR1', 'dp.5', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xB3: new SPC_OP_INFO(0xB3, 'BBC', 'dp.5', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5), // X
    0xB4: new SPC_OP_INFO(0xB4, 'SBC', 'A, dp+X', SPC_MN.SBC, SPC_AM.RA_DP_X, 4),
    0xB5: new SPC_OP_INFO(0xB5, 'SBC', 'A, !abs+X', SPC_MN.SBC, SPC_AM.RA_A_X, 5),
    0xB6: new SPC_OP_INFO(0xB6, 'SBC', 'A, !abs+Y', SPC_MN.SBC, SPC_AM.RA_A_Y, 5),
    0xB7: new SPC_OP_INFO(0xB7, 'SBC', 'A, [dp]+Y', SPC_MN.SBC, SPC_AM.RA_IND_Y_INDEXED, 6),
    0xB8: new SPC_OP_INFO(0xB8, 'SBC', 'dp, #imm', SPC_MN.SBC, SPC_AM.DP_IMM, 5),
    0xB9: new SPC_OP_INFO(0xB9, 'SBC', '(X), (Y)', SPC_MN.SBC, SPC_AM.IND_XY, 5),
    0xBC: new SPC_OP_INFO(0xBC, 'INC', 'A', SPC_MN.INC, SPC_AM.RA, 2),
    0xBE: new SPC_OP_INFO(0xBE, 'DAS', 'A', SPC_MN.DAS, SPC_AM.I, 3),
    0xBF: new SPC_OP_INFO(0xBF, 'MOV', 'A, (X)+', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xC1: new SPC_OP_INFO(0xC1, 'TCALL', '12', SPC_MN.TCALL, SPC_AM.I, 8),
    0xC2: new SPC_OP_INFO(0xC2, 'SET1', 'dp.6', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xC3: new SPC_OP_INFO(0xC3, 'BBS', 'dp.6, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xC5: new SPC_OP_INFO(0xC5, 'MOV', '!abs, A', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xC7: new SPC_OP_INFO(0xC7, 'MOV', '[dp+X], A', SPC_MN.MOV, SPC_AM.MOV, 7),
    0xC8: new SPC_OP_INFO(0xC8, 'CMP', 'X, #i', SPC_MN.CMP, SPC_AM.RX_IMM, 2),
    0xC9: new SPC_OP_INFO(0xC9, 'MOV', '!abs, X', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xCA: new SPC_OP_INFO(0xCA, 'MOV1', 'm.b, C', SPC_MN.MOV1, SPC_AM.MEMBITW, 6),
    0xCE: new SPC_OP_INFO(0xCE, 'POP', 'X', SPC_MN.POP, SPC_AM.STACK, 4),
    0xCF: new SPC_OP_INFO(0xCF, 'MUL', 'YA', SPC_MN.MUL, SPC_AM.RYA, 9),
    0xD1: new SPC_OP_INFO(0xD1, 'TCALL', '13', SPC_MN.TCALL, SPC_AM.I, 8),
    0xD2: new SPC_OP_INFO(0xD2, 'CLR1', 'dp.6', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xD3: new SPC_OP_INFO(0xD3, 'BBC', 'dp.6', SPC_MN.BBC, SPC_AM.PC_R_BIT, 5),
    0xD4: new SPC_OP_INFO(0xD4, 'MOV', 'dp+X, A', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xD5: new SPC_OP_INFO(0xD5, 'MOV', '!abs+X, A', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xD6: new SPC_OP_INFO(0xD6, 'MOV', '!abs+Y, A', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xD8: new SPC_OP_INFO(0xD8, 'MOV', 'dp, X', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xD9: new SPC_OP_INFO(0xD9, 'MOV', 'dp+Y, X', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xDC: new SPC_OP_INFO(0xDC, 'DEC', 'Y', SPC_MN.DEC, SPC_AM.RY, 2),
    0xDE: new SPC_OP_INFO(0xDE, 'CBNE', 'dp+X, r', SPC_MN.CBNE, SPC_AM.PC_R_D_X, 6),
    0xDF: new SPC_OP_INFO(0xDF, 'DAA', 'A', SPC_MN.DAA, SPC_AM.I, 3),
    0xE0: new SPC_OP_INFO(0xE0, 'CLRV', 'i', SPC_MN.CLRV, SPC_AM.I, 2),
    0xE1: new SPC_OP_INFO(0xE1, 'TCALL', '14', SPC_MN.TCALL, SPC_AM.I, 8),
    0xE2: new SPC_OP_INFO(0xE2, 'SET1', 'dp.7', SPC_MN.SET1, SPC_AM.D_BIT, 4), // X
    0xE3: new SPC_OP_INFO(0xE3, 'BBS', 'dp.7, r', SPC_MN.BBS, SPC_AM.PC_R_BIT, 5), // X
    0xE5: new SPC_OP_INFO(0xE5, 'MOV', 'A, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xE6: new SPC_OP_INFO(0xE6, 'MOV', 'A, (X)', SPC_MN.MOV, SPC_AM.MOV, 3),
    0xE7: new SPC_OP_INFO(0xE7, 'MOV', 'A, [dp+X]', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xE9: new SPC_OP_INFO(0xE9, 'MOV', 'X, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xEA: new SPC_OP_INFO(0xEA, 'NOT1', 'm.b', SPC_MN.NOT1, SPC_AM.MEMBITW, 5),
    0xEC: new SPC_OP_INFO(0xEC, 'MOV', 'Y, !abs', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xED: new SPC_OP_INFO(0xED, 'NOTC', 'i', SPC_MN.NOTC, SPC_AM.I, 3),
    0xEE: new SPC_OP_INFO(0xEE, 'POP', 'Y', SPC_MN.POP, SPC_AM.STACK, 4),
    0xF0: new SPC_OP_INFO(0xF0, 'BEQ', 'r', SPC_MN.BEQ, SPC_AM.PC_R, 2),
    0xF1: new SPC_OP_INFO(0xF1, 'TCALL', '15', SPC_MN.TCALL, SPC_AM.I, 8),
    0xF2: new SPC_OP_INFO(0xF2, 'CLR1', 'dp.7', SPC_MN.CLR1, SPC_AM.D_BIT, 4), // X
    0xF7: new SPC_OP_INFO(0xF7, 'MOV', 'A, [dp]+Y', SPC_MN.MOV, SPC_AM.MOV, 6),
    0xF8: new SPC_OP_INFO(0xF8, 'MOV', 'X, dp', SPC_MN.MOV, SPC_AM.MOV, 3),
    0xF9: new SPC_OP_INFO(0xF9, 'MOV', 'X, dp+Y', SPC_MN.MOV, SPC_AM.MOV, 4),
    0xFA: new SPC_OP_INFO(0xFA, 'MOV', 'dp, dp', SPC_MN.MOV, SPC_AM.MOV, 5),
    0xFD: new SPC_OP_INFO(0xFD, 'MOV', 'Y, A', SPC_MN.MOV, SPC_AM.MOV, 2),
    0xFE: new SPC_OP_INFO(0xFE, 'DBNZ', 'Y, r', SPC_MN.DBNZ, SPC_AM.RY_R, 4),
});

class SPC_funcgen {
    constructor(indent, opc_info) {
        this.indent1 = indent;
        this.indent2 = '    ' + this.indent1;
        this.cycles = opc_info.cycles;
        this.outstr = '';
        this.addl1(hex0x2(opc_info.opcode) + ': function(cpu, regs) { // ' + opc_info.mnemonic + ' ' + opc_info.operand);
        this.addl('regs.opc_cycles = ' + opc_info.cycles + ';');
    }

    fetch(who) {
        this.addl(who + ' = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
    }

    fetch_TR() {
        this.fetch('regs.TR')
    }

    fetch_TA() {
        this.fetch('regs.TA');
    }

    fetch16() {
        this.addl('regs.TA = cpu.read8(regs.PC++);');
        this.addl('regs.PC &= 0xFFFF;');
        this.addl('regs.TA += cpu.read8(regs.PC++) << 8;');
        this.addl('regs.PC &= 0xFFFF;');
    }

    read(where, what) {
        this.addl(what + ' = cpu.read8(' + where + ');');
    }

    load(where, what) {
        this.addl(what + ' = cpu.read8D(' + where + ');');
    }

    read16(where, what) {
        this.addl(what + ' = cpu.read8((' + where + ') & 0xFFFF) + (cpu.read8(((' + where + ') + 1) & 0xFFFF) << 8);');
    }

    load16(where, what)
    {
        this.addl(what + ' = cpu.read8D((' + where + ')) + (cpu.read8D((' + where + ') + 1) << 8);');
    }

    write(where, what) {
        this.addl('cpu.write8(' + where + ', ' + what +');');
    }

    store(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ');');
    }

    store16(where, what) {
        this.addl('cpu.write8D((' + where + '), ' + what + ' & 0xFF);')
        this.addl('cpu.write8D((' + where + ') + 1, ((' + what + ') >>> 8) & 0xFF);')
    }

    load16_2D(where, lo, hi) {
        this.load(where, lo);
        this.load(where + ' + 1', hi);
    }

    store16_2D(where, lo, hi) {
        this.store(where, lo);
        this.store(where + ' + 1', hi);
    }

    ADC(who, y) {
        this.addl('let z = (' + who + ') + (' + y + ') + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = (((' + who + ') ^ (' + y + ') ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~((' + who + ') ^ (' + y + ' ))) & ((' + who + ') ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl(who + ' = z & 0xFF;');
        this.setz(who);
    }

    SBC(who, y) {
        this.addl('let y = (~' + y + ') & 0xFF;');
        this.addl('let z = (' + who + ') + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = (((' + who + ') ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~((' + who + ') ^ y)) & ((' + who + ') ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl(who + ' = z & 0xFF;');
        this.setz(who);
    }

    AND1f(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val = (~val) & 0x01;');
        this.addl('regs.P.C &= val;');
    }

    AND1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C &= val;');
    }

    OR1f(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C |= (val ? 0 : 1);');
    }

    OR1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val  + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C |= val;')
    }

    EOR1(val, bit) {
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('let val = (' + val + ' & mask) >>> ' + bit + ';');
        this.addl('val &= 0x01;');
        this.addl('regs.P.C ^= val;');
    }

    ADDW() { // YA, TR
        this.addl('let z;');
        this.addl('regs.P.C = 0;');

        this.addl('let y = regs.TR & 0xFF;');
        this.addl('z = regs.A + y;');
        this.addl('regs.P.C = +(z > 0xFF);');
        //this.addl('regs.P.H = ((regs.A ^ y ^ z) & 0x10) >>> 4;');
        //this.addl('regs.P.V = (((~(regs.A ^ y)) & (regs.A ^ z)) & 0x80) >>> 7;');
        //this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.A = z & 0xFF;')

        this.addl('y = (regs.TR >>> 8) & 0xFF;');
        this.addl('z = regs.Y + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = ((regs.Y ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~(regs.Y ^ y)) & (regs.Y ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.Y = z & 0xFF;')

        this.addl('regs.P.Z = +(regs.A === 0 && regs.Y === 0);');
    }

    SUBW() { // YA, TR
        // CF = 1
        // z = SBC(x, y)
        // z |= SBC(x >> 8, y >> 8) << 8
        // ZF
        this.addl('regs.P.C = 1;');
        this.addl('let x, y, z;');

        this.addl('x = regs.A;');
        this.addl('y = (~regs.TR) & 0xFF;');
        this.addl('z = (x & 0xFF) + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        //this.addl('regs.P.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        //this.addl('regs.P.V = (((~(x ^ y)) & (x ^ z)) & 0x80) >>> 7;');
        //this.addl('regs.P.N = (z & 0x80) >>> 7;');

        this.addl('x = regs.Y;');
        this.addl('regs.A = z & 0xFF;');
        this.addl('y = ((~regs.TR) >>> 8) & 0xFF;');
        this.addl('z = (x & 0xFF) + y + regs.P.C;');
        this.addl('regs.P.C = +(z > 0xFF);');
        this.addl('regs.P.H = ((x ^ y ^ z) & 0x10) >>> 4;');
        this.addl('regs.P.V = (((~(x ^ y)) & (x ^ z)) & 0x80) >>> 7;');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
        this.addl('regs.Y = z & 0xFF;');
        this.addl('regs.P.Z = +(regs.Y === 0 && regs.A === 0);')
    }

    XCN() {
        this.addl('regs.A = ((regs.A << 4) | (regs.A >>> 4)) & 0xFF;');
        this.setn('regs.A');
        this.setz('regs.A');
    }

    AND(who, y) {
        this.addl(who + ' &= (' + y + ');');
        this.setz(who);
        this.setn(who);
    }

    ASL(who) {
        this.addl('regs.P.C = ((' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' = (' + who + ' << 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    LSR(who) {
        this.addl('regs.P.C = (' + who + ') & 0x01;');
        this.addl(who + ' >>>= 1');
        this.setz(who);
        this.setn(who);
    }

    BR(when, where) {
        let indent = '';
        if (when !== 'true') {
            this.addl('if (' + when + ') {');
            indent = '    ';
        }
        this.addl(indent + 'regs.PC = (regs.PC + mksigned8(' + where + ')) & 0xFFFF;');
        this.addl(indent + 'regs.opc_cycles += 2;');
        if (when !== 'true') {
            this.addl('}');
        }
    }

    CMP(operand1, operand2) {
        this.addl('let z = ' + operand1 + ' - ' + operand2 + ';');
        this.addl('regs.P.C = +(z >= 0)');
        this.addl('regs.P.Z = +((z & 0xFF) === 0);');
        this.addl('regs.P.N = (z & 0x80) >>> 7;');
    }

    // YA, TR
    CMPW() {
        this.addl('let z = ((regs.Y << 8) + regs.A) - regs.TR;');
        this.addl('regs.P.C = +(z >= 0);');
        this.addl('regs.P.Z = +((z & 0xFFFF) === 0);');
        this.addl('regs.P.N = (z & 0x8000) >>> 15;');
    }

    DEC(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    CBNE(cmp, r) {
        this.BR('regs.A !== ' + cmp, r);
    }

    DBNZ(who, r) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFF;');
        this.BR(who + ' !== 0', r);
    }

    DECW(who) {
        this.addl(who + ' = (' + who + ' - 1) & 0xFFFF;');
        this.setz(who);
        this.addl('regs.P.N = (' + who + ' & 0x8000) >>> 15;');
    }

    INCW(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFFFF;');
        this.setz(who);
        this.addl('regs.P.N = (' + who + ' & 0x8000) >>> 15;');
    }

    DIV() {
        this.addl('let YA = (regs.Y << 8) + regs.A;');
        this.addl('regs.P.H = +((regs.Y & 15) >= (regs.X & 15));');
        this.addl('regs.P.V = +(regs.Y >= regs.X);');
        this.addl('if (regs.Y < (regs.X << 1)) {');
        this.addl('    regs.A = Math.floor(YA / regs.X) & 0xFF;');
        this.addl('    regs.Y = (YA % regs.X) & 0xFF;')
        this.addl('} else {');
        this.addl('    regs.A = (255 - Math.floor((YA - (regs.X << 9)) / (256 - regs.X))) & 0xFF;');
        this.addl('    regs.Y = (regs.X + (YA - (regs.X << 9)) % (256 - regs.X)) & 0xFF;');
        this.addl('}');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    MUL() {
        this.addl('let YA = regs.Y * regs.A;');
        this.addl('regs.A = YA & 0xFF;');
        this.addl('regs.Y = (YA >>> 8) & 0xFF;');
        this.setz('regs.Y');
        this.setn('regs.Y');
    }

    ROL(who) {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = (' + who + ' & 0x80) >>> 7;');
        this.addl(who + ' = ((' + who + ' << 1) | carry) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    ROR(who) {
        this.addl('let carry = regs.P.C;');
        this.addl('regs.P.C = ' + who + '& 1;');
        this.addl(who + ' = (carry << 7) | (' + who + ' >>> 1);')
        this.setz(who);
        this.setn(who);
    }

    INC(who) {
        this.addl(who + ' = (' + who + ' + 1) & 0xFF;');
        this.setz(who);
        this.setn(who);
    }

    EOR(who, who2) {
        this.addl(who + ' ^= ' + who2 + ';');
        this.setz(who);
        this.setn(who);
    }

    NOT1(val, bit) {
        // bit = !bit
        this.addl('let mask = 1 << ' + bit + ';');
        this.addl('if (mask & ' + val + ')'); // We gotta unset, which means and the inverse
        this.addl('    ' + val + ' &= ((~mask) & 0xFF);');
        this.addl('else')
        this.addl('    ' + val + ' |= mask;');
    }

    OR(who, who2) {
        this.addl(who + ' |= ' + who2 + ';');
        this.setz(who);
        this.setn(who);
    }

    POP16(what) {
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' = cpu.read8(0x100 + regs.SP);');
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' += cpu.read8(0x100 + regs.SP) << 8;');
    }

    POP(what) {
        this.addl('regs.SP = (regs.SP + 1) & 0xFF;');
        this.addl(what + ' = cpu.read8(0x100 + regs.SP);');
    }

    PUSH(what) {
        this.addl('cpu.write8(0x100 + regs.SP--, ' + what + ');');
        this.addl('regs.SP &= 0xFF;');
    }

    BRK() {
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('regs.PC & 0xFF');
        this.PUSH('regs.P.getbyte()');
        this.addl('regs.P.I = 0;');
        this.addl('regs.P.B = 1;');
        this.read16('0xFFDE', 'regs.PC');
    }

    TCLR1(who) {
        this.addl('regs.P.Z = +((regs.A - ' + who + ') === 0);');
        this.addl('regs.P.N = ((regs.A - ' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' &= (~regs.A) & 0xFF;');
    }

    TSET1(who) {
        this.addl('regs.P.Z = +((regs.A - ' + who + ') === 0);');
        this.addl('regs.P.N = ((regs.A - ' + who + ') & 0x80) >>> 7;');
        this.addl(who + ' |= regs.A;');
    }

    CALL(where, hex=false) {
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('(regs.PC & 0xFF)');
        if (hex)
            this.addl('regs.PC = ' + hex0x4(where) + ';');
        else
            this.addl('regs.PC = ' + where + ';');
    }

    DAA() {
        this.addl('if (regs.P.C || (regs.A > 0x99)) {');
        this.addl('    regs.A = (regs.A + 0x60) & 0xFF;');
        this.addl('    regs.P.C = 1;')
        this.addl('}');
        this.addl('if (regs.P.H || ((regs.A & 15) > 0x09)) {');
        this.addl('    regs.A = (regs.A + 0x06) & 0xFF;');
        this.addl('}');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    DAS() {
        this.addl('if (!regs.P.C || regs.A > 0x99) {');
        this.addl('    regs.A -= 0x60;');
        this.addl('    regs.P.C = 0;');
        this.addl('}');
        this.addl('if (!regs.P.H || ((regs.A & 15) > 0x09)) {');
        this.addl('    regs.A -= 0x06;');
        this.addl('}');
        this.addl('regs.A &= 0xFF;');
        this.setz('regs.A');
        this.setn('regs.A');
    }

    TCALL(opcode) {
        let vec = 0xFFDE - ((opcode & 0xF0) >>> 3);
        this.PUSH('(regs.PC >>> 8) & 0xFF');
        this.PUSH('(regs.PC & 0xFF)');
        this.read(vec, 'regs.PC');
        this.addl('regs.PC |= cpu.read8(' + (vec+1) + ') << 8;');
    }

    DOINS(ins, operand, operand2, addr_mode, opcode) {
        let mask1, mask2;
        this.addl('// INS ' + ins + ' ADDR MODE ' + addr_mode);
        switch(ins) {
            case SPC_MN.RET: // PCL, PCH
                this.POP16('regs.PC');
                break;
            case SPC_MN.RET1: // flag, PCL, PCH
                this.POP('regs.TR');
                this.addl('regs.P.setbyte(regs.TR);');
                this.POP16('regs.PC');
                break;
            case SPC_MN.POP:
                switch(opcode) {
                    case 0xAE:
                        this.POP('regs.A');
                        break;
                    case 0x8E:
                        this.POP('regs.TR');
                        this.addl('regs.P.setbyte(regs.TR);');
                        break;
                    case 0xCE:
                        this.POP('regs.X');
                        break;
                    case 0xEE:
                        this.POP('regs.Y');
                        break;
                }
                break;
            case SPC_MN.PUSH:
                switch(opcode) {
                    case 0x2D:
                        this.PUSH('regs.A');
                        break;
                    case 0x0D:
                        this.PUSH('regs.P.getbyte()');
                        break;
                    case 0x4D:
                        this.PUSH('regs.X');
                        break;
                    case 0x6D:
                        this.PUSH('regs.Y');
                        break;
                }
                break;
            case SPC_MN.DAA:
                this.DAA();
                break;
            case SPC_MN.DAS:
                this.DAS();
                break;
            case SPC_MN.LSR:
                this.LSR(operand);
                break;
            case SPC_MN.DECW:
                this.DECW(operand);
                break;
            case SPC_MN.INCW:
                this.INCW(operand);
                break;
            case SPC_MN.TCALL:
                this.TCALL(opcode);
                break;
            case SPC_MN.CALL:
                this.CALL(operand);
                break;
            case SPC_MN.ADC:
                this.ADC(operand, operand2);
                break;
            case SPC_MN.ADDW:
                this.ADDW();
                break;
            case SPC_MN.TCLR1:
                this.TCLR1(operand);
                break;
            case SPC_MN.TSET1:
                this.TSET1(operand);
                break;
            case SPC_MN.SUBW:
                this.SUBW();
                break;
            case SPC_MN.AND1f:
                this.AND1f(operand, operand2);
                break;
            case SPC_MN.AND1:
                this.AND1(operand, operand2);
                break;
            case SPC_MN.OR1f:
                this.OR1f(operand, operand2);
                break;
            case SPC_MN.OR1:
                this.OR1(operand, operand2);
                break;
            case SPC_MN.ROL:
                this.ROL(operand);
                break;
            case SPC_MN.AND:
                this.AND(operand, operand2);
                break;
            case SPC_MN.SBC:
                this.SBC(operand, operand2);
                break;
            case SPC_MN.XCN:
                this.XCN();
                break;
            case SPC_MN.ROR:
                this.ROR(operand);
                break;
            case SPC_MN.EOR:
                this.EOR(operand, operand2);
                break;
            case SPC_MN.EOR1:
                this.EOR1(operand, operand2);
                break;
            case SPC_MN.DI:
                this.addl('regs.P.I = 0;');
                break;
            case SPC_MN.EI:
                this.addl('regs.P.I = 1;');
                break;
            case SPC_MN.CMP:
                this.CMP(operand, operand2);
                break;
            case SPC_MN.CMPW:
                this.CMPW();
                break;
            case SPC_MN.DEC:
                this.DEC(operand);
                break;
            case SPC_MN.CBNE:
                this.CBNE(operand, operand2)
                break;
            case SPC_MN.DBNZ:
                this.DBNZ(operand, operand2);
                break;
            case SPC_MN.INC:
                this.INC(operand);
                break;
            case SPC_MN.ASL:
                this.ASL(operand);
                break;
            case SPC_MN.OR:
                this.OR(operand, operand2);
                break;
            case SPC_MN.NOP:
                break;
            case SPC_MN.BRK:
                this.BRK();
                break;
            case SPC_MN.BCC: // Branch C = 0
                this.fetch_TR();
                this.BR('!regs.P.C', 'regs.TR');
                break;
            case SPC_MN.BCS: // Branch C = 1
                this.fetch_TR();
                this.BR('regs.P.C', 'regs.TR');
                break;
            case SPC_MN.BEQ: // Branch Z = 1
                this.fetch_TR();
                this.BR('regs.P.Z', 'regs.TR');
                break;
            case SPC_MN.BMI: // Branch N = 1
                this.fetch_TR();
                this.BR('regs.P.N', 'regs.TR');
                break;
            case SPC_MN.BNE: // branch Z = 0
                this.fetch_TR();
                this.BR('!regs.P.Z', 'regs.TR');
                break;
            case SPC_MN.BPL: // branch N = 0
                this.fetch_TR();
                this.BR('!regs.P.N', 'regs.TR');
                break;
            case SPC_MN.BVC: // branch V = 0
                this.fetch_TR();
                this.BR('!regs.P.V', 'regs.TR');
                break;
            case SPC_MN.BVS: // branch V = 1
                this.fetch_TR();
                this.BR('regs.P.V', 'regs.TR');
                break;
            case SPC_MN.BRA: // Always branch
                this.fetch_TR();
                this.BR('true', 'regs.TR');
                break;
            case SPC_MN.JMP:
                this.addl('regs.PC = ' + operand + ';');
                break;
            case SPC_MN.CLRC:
                this.addl('regs.P.C = 0;');
                break;
            case SPC_MN.CLRP:
                this.addl('regs.P.P = 0;');
                this.addl('regs.P.DO = 0;');
                break;
            case SPC_MN.SETC:
                this.addl('regs.P.C = 1;');
                break;
            case SPC_MN.SETP:
                this.addl('regs.P.P = 1;');
                this.addl('regs.P.DO = 0x100;');
                break;
            case SPC_MN.CLRV:
                this.addl('regs.P.V = 0;');
                this.addl('regs.P.H = 0;');
                break;
            case SPC_MN.MOV1:
                if (addr_mode === SPC_AM.MEMBITR)
                    this.addl('regs.P.C = ((' + operand + ') >>> (' + operand2 + ')) & 1;');
                else
                    this.addl(operand + ' = regs.P.C ? ' + operand + ' | (regs.P.C << ' + operand2 + ') : ' + operand + ' & ((~(1 << ' + operand2 + ')) & 0xFF);');
                break;
            case SPC_MN.SLEEP:
                this.addl('cpu.WAI = true;');
                break;
            case SPC_MN.STOP:
                this.addl('cpu.STP = true;')
                break;
            case SPC_MN.PCALL:
                this.CALL('regs.TR + 0xFF00');
                break;
            case SPC_MN.CLR1:
                this.load(operand, 'regs.TR');
                mask1 = 1 << BBCS1bit[opcode];
                this.addl('regs.TR &= ' + hex0x2(~mask1 & 0xFF) + ';');
                this.store(operand, 'regs.TR');
                break;
            case SPC_MN.SET1:
                this.load(operand, 'regs.TR');
                mask1 = 1 << BBCS1bit[opcode];
                this.addl('regs.TR |= ' + hex0x2(mask1) + ';');
                this.store(operand, 'regs.TR');
                break;
            case SPC_MN.NOT1:
                this.NOT1(operand, operand2);
                break;
            case SPC_MN.NOTC:
                this.addl('regs.P.C = regs.P.C ? 0 : 1;');
                break;
            default:
                console.log('Missing ins2', ins, operand);
                break;
        }
    }

    ADDRINS(addr_mode, ins, opcode) {
        switch(addr_mode) {
            case SPC_AM.RA_IMM: // A, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_X: // A, (X)
                this.load('regs.X', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_INDEXED_X: // A, [dp+X]
                this.fetch_TA();
                this.addl('regs.TA += regs.X;')
                this.load16('regs.TA', 'regs.TA');
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_IND_Y_INDEXED: // A, [dp]+Y
                this.fetch_TA();
                this.load16('regs.TA', 'regs.TA');
                this.addl('regs.TA += regs.Y;');
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_DP: // A, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A: // A, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A_X: // RA, !abs+X
                this.fetch16();
                this.addl('regs.TA += regs.X;');
                this.read('regs.TA & 0xFFFF', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.RA_A_Y: // RA, !abs+Y
                this.fetch16();
                this.addl('regs.TA += regs.Y;');
                this.read('regs.TA & 0xFFFF', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.YA_DP: // YA, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.load('regs.TA+1', 'regs.TA');
                this.addl('regs.TR += (regs.TA << 8);')
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.RA_DP_X: // A, dp+X
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.TR');
                this.DOINS(ins, 'regs.A', 'regs.TR');
                break;
            case SPC_AM.I: // implied
                this.DOINS(ins, null, null, addr_mode, opcode);
                break;
            case SPC_AM.DP: // dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case SPC_AM.DP_IMM: // dp, #imm
                this.fetch_TR();
                this.fetch_TA();
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.TA', 'regs.TA2')
                break;
            case SPC_AM.DP_INDEXED_X: // dp+X
                this.fetch_TA();
                this.addl('regs.TA += regs.X;');
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins,  'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case SPC_AM.RA: // A
                this.DOINS(ins, 'regs.A');
                break;
            case SPC_AM.RX: // X
                this.DOINS(ins, 'regs.X');
                break;
            case SPC_AM.RY: // Y
                this.DOINS(ins,'regs.Y');
                break;
            case SPC_AM.IND_XY: // (X), (Y)
                this.load('regs.Y', 'regs.TA');
                this.load('regs.X', 'regs.TR');
                this.DOINS(ins,'regs.TR', 'regs.TA');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.X', 'regs.TR');
                break;
            case SPC_AM.IMM:
                this.fetch_TR();
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.A_IND_X: // [!abs+X]
                this.fetch16();
                this.addl('regs.TA = (regs.TA + regs.X) & 0xFFFF;');
                this.read16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                break;
            case SPC_AM.Y_DP: // Y, d
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins,'regs.Y', 'regs.TR');
                break;
            case SPC_AM.DP_DP: // dp, dp2
                this.fetch_TR(); // dp2   TR = source, rhs
                this.fetch_TA(); // dp    TA = target, lhs
                this.load('regs.TR', 'regs.TR');
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                if (ins === SPC_MN.CMP) break;
                this.store('regs.TA', 'regs.TA2');
                break;
            case SPC_AM.PC_R:
                this.DOINS(ins, 'regs.TA', null);
                break;
            case SPC_AM.PC_R_BIT: // d.bit, r  .. but backwards from normal
                this.fetch_TA();
                this.load('regs.TA', 'regs.TA');
                this.fetch_TR();
                switch(opcode) {
                    case 0x03: // BBS 0
                        this.BR('regs.TA & 1', 'regs.TR');
                        break;
                    case 0x13: // BBC 0
                        this.BR('(regs.TA & 1) === 0', 'regs.TR');
                        break;
                    case 0x23: // BBS 1
                        this.BR('regs.TA & 2', 'regs.TR');
                        break;
                    case 0x33: // BBC 1
                        this.BR('(regs.TA & 2) === 0', 'regs.TR');
                        break;
                    case 0x43: // BBS 2
                        this.BR('regs.TA & 4', 'regs.TR');
                        break;
                    case 0x53: // BBC 2
                        this.BR('(regs.TA & 0x04) === 0', 'regs.TR');
                        break;
                    case 0x63: // BBS 3
                        this.BR('regs.TA & 8', 'regs.TR');
                        break;
                    case 0x73: // BBC 3
                        this.BR('(regs.TA & 0x08) === 0', 'regs.TR');
                        break;
                    case 0x83: // BBS 4
                        this.BR('regs.TA & 0x10', 'regs.TR');
                        break;
                    case 0x93: // BBC 4
                        this.BR('(regs.TA & 0x10) === 0', 'regs.TR');
                        break;
                    case 0xA3: // BBS 5
                        this.BR('regs.TA & 0x20', 'regs.TR');
                        break;
                    case 0xB3: // BBC 5
                        this.BR('(regs.TA & 0x20) === 0', 'regs.TR');
                        break;
                    case 0xC3: // BBS 6
                        this.BR('regs.TA & 0x40', 'regs.TR');
                        break;
                    case 0xD3: // BBC 6
                        this.BR('(regs.TA & 0x40) === 0', 'regs.TR');
                        break;
                    case 0xE3: // BBS 7
                        this.BR('regs.TA & 0x80', 'regs.TR');
                        break;
                    case 0xF3: // BBC 7
                        this.BR('(regs.TA & 0x80) === 0', 'regs.TR');
                        break;
                }
                break;
            case SPC_AM.MEMBITR:
                this.fetch16();
                this.addl('regs.TR = (regs.TA >>> 13) & 7;');
                this.read('regs.TA & 0x1FFF', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR', addr_mode);
                break;
            case SPC_AM.MEMBITW:
                this.fetch16();
                this.addl('regs.TR = (regs.TA >>> 13) & 7;'); // regs.TR is bit
                this.addl('regs.TA &= 0x1FFF;'); // regs.TA is addr
                this.read('regs.TA', 'regs.TA2'); // regs.TA2 is data
                this.DOINS(ins, 'regs.TA2', 'regs.TR', addr_mode);
                this.write('regs.TA', 'regs.TA2'); // write addr, data
                break;
            case SPC_AM.D_BIT:
                this.fetch_TA();
                this.DOINS(ins, 'regs.TA', null, addr_mode, opcode);
                break;
            case SPC_AM.JMPA:
                this.fetch16();
                this.addl('regs.PC = regs.TA');
                break;
            case SPC_AM.A:
                this.fetch16();
                if (opcode !== 0x5F) this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                if ((ins !== SPC_MN.CALL) && (ins !== SPC_MN.JMP)) {
                    this.write('regs.TA', 'regs.TR');
                }
                break;
            case SPC_AM.A16:
                this.fetch16();
                //this.read16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TA');
                break;
            case SPC_AM.PC_R_D: // dp, r  r second byte
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR');
                break;
            case SPC_AM.PC_R_D_X: // dp+X, r  second byte
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA + regs.X', 'regs.TA');
                this.DOINS(ins, 'regs.TA', 'regs.TR');
                break;
            case SPC_AM.RX_IMM: // X, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RX_DP: // X, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RX_A: // X, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.X', 'regs.TR');
                break;
            case SPC_AM.RY_IMM: // Y, #imm
                this.fetch_TR();
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_DP: // Y, dp
                this.fetch_TA();
                this.load('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_A: // Y, !abs
                this.fetch16();
                this.read('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.RY_R: // Y, r
                this.fetch_TR();
                this.DOINS(ins, 'regs.Y', 'regs.TR');
                break;
            case SPC_AM.DP_R: // dp, r
                this.fetch_TA();
                this.fetch_TR();
                this.load('regs.TA', 'regs.TA2');
                this.DOINS(ins, 'regs.TA2', 'regs.TR');
                this.store('regs.TA', 'regs.TA2');
                break;
            case SPC_AM.DPW: // dp (word)
                this.fetch_TA();
                this.load16('regs.TA', 'regs.TR');
                this.DOINS(ins, 'regs.TR');
                this.store16('regs.TA', 'regs.TR');
                break;
            case SPC_AM.YA_X:
                this.DIV();
                break;
            case SPC_AM.RYA:
                this.MUL();
                break;
            case SPC_AM.STACK:
                this.DOINS(ins, null, null, null, opcode);
                break;
            default:
                console.log('MISSING ADDR MODE', addr_mode, ins)
                break;
        }
    }

    MOV(ins) {
        let test = null;
        switch(ins) {
            case 0x5D: // X, A
                test = 'regs.X';
                this.addl('regs.X = regs.A;');
                break;
            case 0x7D: // A, X
                test = 'regs.A';
                this.addl('regs.A = regs.X;');
                break;
            case 0x8D: // Y, #imm
                test = 'regs.Y';
                this.fetch_TR();
                this.addl('regs.Y = regs.TR;');
                break;
            case 0x8F: // dp, #imm     operands last to first, except BBC, BBS, CBNE, and DBNZ
                this.fetch_TR();
                this.fetch_TA();
                this.store('regs.TA', 'regs.TR');
                break;
            case 0x9D: // X, SP
                test = 'regs.X';
                this.addl('regs.X = regs.SP');
                break;
            case 0xAF: // (X)+, A
                this.store('regs.X', 'regs.A');
                this.addl('regs.X = (regs.X + 1) & 0xFF;');
                break;
            case 0xBD: // SP, X
                this.addl('regs.SP = regs.X;');
                break;
            case 0xBF: // A, (X)+
                test = 'regs.A';
                this.load('regs.X', 'regs.A');
                this.addl('regs.X = (regs.X + 1) & 0xFF;');
                break;
            case 0xC4: // dp, A
                this.fetch_TA();
                this.store('regs.TA', 'regs.A');
                break;
            case 0xC5: // !abs, A
                this.fetch16();
                this.write('regs.TA', 'regs.A');
                break;
            case 0xC6: // (X), A
                this.store('regs.X', 'regs.A')
                break;
            case 0xC7: // [dp+X], A
                this.fetch_TA();
                this.addl('regs.TA += regs.X;');
                this.load16('regs.TA', 'regs.TA');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xC9: // !abs, X
                this.fetch16();
                this.write('regs.TA', 'regs.X');
                break;
            case 0xCB: // dp, Y
                this.fetch_TA();
                this.store('regs.TA', 'regs.Y');
                break;
            case 0xCC: // !a, Y
                this.fetch16();
                this.write('regs.TA', 'regs.Y');
                break;
            case 0xCD: // X, #imm
                test = 'regs.X';
                this.fetch_TR();
                this.addl('regs.X = regs.TR;');
                break;
            case 0xD4: // dp+X, A
                this.fetch_TA();
                this.store('regs.TA + regs.X', 'regs.A');
                break;
            case 0xD5: // !abs+X, A
                this.fetch16();
                this.addl('regs.TA += regs.X;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD6: // !abs+Y, A
                this.fetch16();
                this.addl('regs.TA += regs.Y;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD7: // [dp]+Y, A
                this.fetch_TR();
                this.load16('regs.TR', 'regs.TA');
                this.addl('regs.TA = (regs.TA + regs.Y) & 0xFFFF;');
                this.write('regs.TA', 'regs.A');
                break;
            case 0xD8: // dp, X
                this.fetch_TA();
                this.store('regs.TA', 'regs.X');
                break;
            case 0xD9: // dp+Y, X
                this.fetch_TA();
                this.store('regs.TA + regs.Y', 'regs.X');
                break;
            case 0xDB: // dp+X, Y
                this.fetch_TA();
                this.store('regs.TA + regs.X', 'regs.Y');
                break;
            case 0xDD: // A, Y
                test = 'regs.A';
                this.addl('regs.A = regs.Y;');
                break;
            case 0xE4: // A, d
                test = 'regs.A';
                this.fetch_TA();
                this.load('regs.TA', 'regs.A');
                break;
            case 0xE5: // A, !abs
                test = 'regs.A';
                this.fetch16();
                this.read('regs.TA', 'regs.A');
                break;
            case 0xE6: // A, (X)
                test = 'regs.A';
                this.load('regs.X', 'regs.A');
                break;
            case 0xE7: // A, [dp+X]
                test = 'regs.A';
                this.fetch_TA();
                this.load16('regs.TA + regs.X', 'regs.TA2');
                this.read('regs.TA2', 'regs.A');
                break;
            case 0xE8: // A, #imm
                test = 'regs.A';
                this.fetch('regs.A');
                break;
            case 0xE9: // X, !abs
                test = 'regs.X';
                this.fetch16();
                this.read('regs.TA', 'regs.X');
                break;
            case 0xEB: // Y, d
                test = 'regs.Y';
                this.fetch_TA();
                this.load('regs.TA', 'regs.Y');
                break;
            case 0xEC: // Y, !abs
                test = 'regs.Y';
                this.fetch16();
                this.read('regs.TA', 'regs.Y');
                break;
            case 0xF4: // A, dp+X
                test = 'regs.A';
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.A');
                break;
            case 0xF5: // A, !a+X
                test = 'regs.A';
                this.fetch16();
                this.read('(regs.TA + regs.X) & 0xFFFF', 'regs.A');
                break;
            case 0xF6: // A, !a+Y
                test = 'regs.A';
                this.fetch16();
                this.read('(regs.TA + regs.Y) & 0xFFFF', 'regs.A');
                break;
            case 0xF7: // A, [dp]+Y
                test = 'regs.A';
                this.fetch_TR();
                this.load16('regs.TR', 'regs.TA');
                this.addl('regs.TA = (regs.TA + regs.Y) & 0xFFFF;');
                this.read('regs.TA', 'regs.A');
                break;
            case 0xF8: // X, dp
                test = 'regs.X';
                this.fetch_TR();
                this.load('regs.TR', 'regs.X');
                break;
            case 0xF9: // X, dp+Y
                test = 'regs.X';
                this.fetch_TA();
                this.load('regs.TA + regs.Y', 'regs.X');
                break;
            case 0xFA: // TA, TR  dp, dp
                this.fetch_TR();
                this.fetch_TA();
                this.load('regs.TR', 'regs.TR');
                this.store('regs.TA', 'regs.TR');
                break;
            case 0xFB: // Y, dp+X
                test = 'regs.Y';
                this.fetch_TA();
                this.load('regs.TA + regs.X', 'regs.Y');
                break;
            case 0xFD: // Y, A
                test = 'regs.Y';
                this.addl('regs.Y = regs.A;');
                break;
        }
        if (test !== null) {
            this.setz(test);
            this.setn(test);
        }
    }

    MOVW(ins) {
        switch(ins) {
            case 0xBA: // YA, dp
                this.fetch_TA();
                this.load16_2D('regs.TA', 'regs.A', 'regs.Y');
                this.addl('regs.P.N = (regs.Y & 0x80) >>> 7;');
                this.addl('regs.P.Z = +(0 === regs.A === regs.Y);');
                break;
            case 0xDA: // dp, YA
                this.fetch_TA();
                this.store16_2D('regs.TA', 'regs.A', 'regs.Y');
                break;
        }
    }

    setn(who) {
        this.addl('regs.P.N = ((' + who + ') & 0x80) >>> 7;');
    }

    setz(who) {
        this.addl('regs.P.Z = +((' + who + ') === 0);');
    }

    addl1(what) {
        this.outstr += this.indent1 + what + '\n';
    }

    addl(what) {
        this.outstr += this.indent2 + what + '\n';
    }

    fetch_from_PC(who) {
        this.addl(who + ' = cpu.read8(regs.PC);');
    }

    fetch_from_PC_and_inc(who) {
        this.fetch_from_PC(who);
        this.addl('regs.PC = (regs.PC + 1) & 0xFFFF;');
    }

    finished() {
        this.addl('cpu.cycles -= regs.opc_cycles;');
        this.fetch_from_PC_and_inc('regs.IR');
        this.addl1('}')
        return this.outstr;
    }
}

function SPC_generate_instruction_function(indent, opcode) {
    let indent2 = indent + '    ';
    let opcode_info = SPC_INS[opcode];
    if (typeof opcode_info === 'undefined') {
        //console.log('SKIPPING OPCODE ' + hex0x2(opcode));
        return '';
    }
    let ag = new SPC_funcgen(indent2, opcode_info);
    switch(opcode_info.ins) {
        case SPC_MN.MOV:
            ag.MOV(opcode_info.opcode);
            break;
        case SPC_MN.MOVW:
            ag.MOVW(opcode_info.opcode);
            break;
        default:
            ag.ADDRINS(opcode_info.addr_mode, opcode_info.ins, opcode);
            break;
    }
    return ag.finished() + ',';
}

function SPC_decode_opcodes() {
    let outstr = '{\n';
    for (let i = 0; i < 256; i++) {
        outstr += SPC_generate_instruction_function('    ', i);
    }
    return outstr + '}';
}

function mainhere() {
    console.log(SPC_decode_opcodes());
    //console.log(SPC_generate_instruction_function('', 0x01));
}

function SPC_get_decoded_opcode(regs) {
    let opcf = SPC_decoded_opcodes[regs.IR];
    if (typeof opcf === 'undefined') return null;
    return opcf;
}