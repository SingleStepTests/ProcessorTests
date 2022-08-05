"use strict";

const DO_PT_SPC700_TRACING = true;
let SPC_PT_cycle_mismatches = [];


function SPC_FMT_P(val) {
    let outstr = '';
    outstr += val & 0x80 ? 'N' : 'n';
    outstr += val & 0x40 ? 'V' : 'v';
    outstr += val & 0x20 ? 'P' : 'p';
    outstr += val & 0x10 ? 'B' : 'b';
    outstr += val & 0x08 ? 'H' : 'h';
    outstr += val & 0x04 ? 'I' : 'i';
    outstr += val & 0x02 ? 'Z' : 'z';
    outstr += val & 0x01 ? 'C' : 'c';
    return outstr;
}

function spc_fmt_test(tst) {
    console.log('BEFORE', tst);
    let oute = JSON.parse(JSON.stringify(tst));
    oute.initial.pc = hex4(oute.initial.pc);
    oute.initial.a = hex2(oute.initial.a);
    oute.initial.sp = hex2(oute.initial.sp);
    oute.initial.x = hex2(oute.initial.x);
    oute.initial.y = hex2(oute.initial.y);
    oute.initial.psw = SPC_FMT_P(oute.initial.psw);
    for (let j in oute.initial.ram) {
        let ro = oute.initial.ram[j]
        ro[0] = hex4(ro[0]);
        if (ro[1] !== null) ro[1] = hex2(ro[1]);
    }
    for (let j in oute.final.ram) {
        let ro = oute.final.ram[j]
        ro[0] = hex4(ro[0]);
        if (ro[1] !== null) ro[1] = hex2(ro[1]);
    }
    for (let ci in oute.cycles) {
        let cycle = oute.cycles[ci];
        if (cycle[0] !== null) cycle[0] = hex4(cycle[0]);
        if (cycle[1] !== null) cycle[1] = hex2(cycle[1]);
    }
    oute.final.pc = hex4(oute.final.pc);
    oute.final.a = hex2(oute.final.a);
    oute.final.sp = hex2(oute.final.sp);
    oute.final.x = hex2(oute.final.x);
    oute.final.y = hex2(oute.final.y);
    oute.final.psw = SPC_FMT_P(oute.final.psw);
    return oute;
}


class SPC_test_mem_map {
    constructor() {
        this.read_apu = function(){};
        this.write_apu = function(){};
    }
}

class SPC_test_clock {
    constructor() {
        this.apu_has = 0;
        this.apu_deficit = 0;
    }

    set_apu() {}
}

function test_spc700_automated(cpu, tests) {
    cpu.trace_cycles = 1;
    let ins;
    let messages = [];
    let addr_io_mismatched = 0;
    let length_mismatch = 0;
    for (let i in tests) {
        let initial = tests[i].initial;
        let final = tests[i].final;
        cpu.regs.PC = (initial.pc+1) & 0xFFFF;
        cpu.regs.SP = initial.sp;
        cpu.regs.A = initial.a;
        cpu.regs.X = initial.x;
        cpu.regs.Y = initial.y;
        cpu.regs.P.setbyte(initial.psw);
        for (let j in initial.ram) {
            cpu.RAM[initial.ram[j][0]] = initial.ram[j][1];
        }
        cpu.clock.cycles = 0;
        cpu.regs.IR = cpu.RAM[(cpu.regs.PC - 1) & 0xFFFF];
        ins = cpu.regs.IR;
        let passed = true;
        // Will do an entire operation
        cpu.cycles = 0;
        cpu.cycle(2);
        if (cpu.regs.opc_cycles !== tests[i].cycles.length) {
            console.log('WRONG!', hex2(ins), tests[i].cycles.length, cpu.regs.opc_cycles);
            length_mismatch++;
        }
        if ((cpu.regs.A !== final.a) || (cpu.regs.X !== final.x) || (cpu.regs.Y !== final.y) ||
            (cpu.regs.SP !== final.sp) || (((cpu.regs.PC - 1) & 0xFFFF) !== final.pc) || (cpu.regs.P.getbyte() !== final.psw)) {
            console.log('WRONG REGISTERS!', cpu.regs, final);
            if (cpu.regs.A !== final.a) console.log('A', hex2(cpu.regs.A), hex2(final.a));
            if (cpu.regs.X !== final.x) console.log('X', hex2(cpu.regs.X), hex2(final.x));
            if (cpu.regs.Y !== final.y) console.log('Y', hex2(cpu.regs.Y), hex2(final.y));
            if (cpu.regs.SP !== final.sp) console.log('SP', hex2(cpu.regs.SP), hex2(final.sp));
            if (cpu.regs.PC !== final.pc) console.log('PC', hex4(cpu.regs.PC), hex4(final.pc));
            if (cpu.regs.P.getbyte() !== final.psw) console.log('PSW', '1', cpu.regs.P.getbyte(), '2', final.psw);
            passed = false;
            messages.push('FAILED for registers wrong!');
        }
        for (let j in final.ram) {
            if (cpu.RAM[final.ram[j][0]] !== final.ram[j][1]) {
                passed = false;
                messages.push('RAM failed! ' + hex0x4(final.ram[j][0]) + ': ' + hex0x2(cpu.RAM[final.ram[j][0]]) + ' should be ' + hex0x2(final.ram[j][1]));
            }
        }
        if (!passed) {
            messages.push('P: ' + SPC_FMT_P(final.psw));
            return new test_return(false, ins, messages, addr_io_mismatched, length_mismatch, spc_fmt_test(tests[i]));
        }
    }
    return new test_return(true, ins, messages, addr_io_mismatched, length_mismatch, null);
}

async function test_pt_spc700_ins(cpu, ins) {
    let opc = hex2(ins).toLowerCase();
    let data = await getJSON(local_server_url + opc + '.json');
    let result = test_spc700_automated(cpu, data);
    if (!result.passed) {
        tconsole.addl(null, 'TEST FOR ' + hex2(ins) + ' FAILED! ');
        console.log(result.failed_test_struct);
    }
    if (result.messages.length !== 0) {
        tconsole.addl(null, '------Messages:');
        for (let i in result.messages) {
            tconsole.addl(result.messages[i]);
        }
    }
    if (result.addr_io_mismatches !== 0) {
        tconsole.addl(txf('{r}CYCLE MISMATCHES: {/}' + result.addr_io_mismatches))
        SPC_PT_cycle_mismatches.push(hex0x2(ins));
    }
    if (!result.passed) {
        console.log('TRACES DRAW', dbg.traces.traces);
        dbg.traces.draw(dconsole);
    }
    dbg.traces.clear();
    return result.passed;
}

async function test_pt_spc700() {
    dconsole.addl(null, 'Workin on tests...')
    let read8 = function(addr) {
        return testRAM[addr];
    }
    let mm = new SPC_test_mem_map();
    let clk = new SPC_test_clock();
    let cpu = new spc700(mm, clk);

    if (DO_PT_SPC700_TRACING) {
        dbg.add_cpu(D_RESOURCE_TYPES.SPC700, cpu);
        dbg.enable_tracing_for(D_RESOURCE_TYPES.SPC700);
        dbg.enable_tracing();
    }
    let skip_tests = [0xEF, 0xFF]; // WAIT and STOP
    let start_test = 0x0; // 0
    let end_test = 0xFF; // 255

    cpu.enable_test_mode();
    if (DO_TRACING) cpu.enable_tracing();
    for (let opcode = start_test; opcode <= end_test; opcode++) {
        if (skip_tests.indexOf(opcode) !== -1) {
            tconsole.addl(null, 'Text for ' + hex2(opcode) + ' skipped!');
            continue;
        }
        let result = await test_pt_spc700_ins(cpu, opcode);
        if (!result) break;
        tconsole.addl(null, 'Test for ' + hex2(opcode) + ' passed!');
    }
    if (SPC_PT_cycle_mismatches.length > 0) console.log('IO mismatches occurred for', SPC_PT_cycle_mismatches);
}