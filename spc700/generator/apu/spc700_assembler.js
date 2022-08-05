
class spc700_assembler {
    constructor() {
        this.output = '';
        this.lnum = 0;
        this.labels = {};
        this.section = '';
        this.ROM_SIZE = 0;
        this.lines_to_addr = {};
        this.addr = 0;
        this.instructions = [];
        this.enable_console = true;
        this.rom_start = 0;
        this.vectors = { [VEC.RESET]: 0xFFEF }
    }

    writeinstruction(ins) {

    }

    write8(addr, val) {
        this.output[addr & 0xFFFF] = val & 0xFF;
    }

    write16(addr, val) {
        this.output[addr] = val & 0xFF;
        this.output[(addr + 1) & 0xFFFF] = (val >>> 8) & 0xFF;
    }

    interpret_number(instr) {
        return assembly_interpret_number(instr);
    }

    warningmsg(msg) {
        console.log('(' + this.lnum + ') WARNING ' + msg);
    }
    errormsg(msg) {
        console.log('(' + this.lnum + ')   ERROR ' + msg);
    }

    getvecfrom(line) {
        let vec = line.split(' ');
        if (vec.length !== 2) {
            this.errormsg('Error parsing vector on line: ' + line);
            return null;
        }
        vec = this.interpret_number(vec[1]);
        if (vec.kind === VT.invalid) {
            this.errormsg('Error parsing vector address ' + vec[1]);
            return null;
        }
        return vec;
    }

    set_vector(line) {
        let VW = -1;
        if (line.slice(0, 5) === 'RESET')
            VW = VEC.RESET;

        if (VW === -1) {
            this.errormsg('Did not understand vector: ' + line);
            return;
        }
        let vec = this.getvecfrom(line);
        if (vec === null)
            return;
        if (vec.kind === VT.int)
            this.vectors[VW].set_to_addr(vec.value);
        else if (vec.kind === VT.label)
            this.vectors[VW].set_to_label(vec.value);
        else if (vec.kind === VT.accumulator) {
            this.errormsg('Did not understand vector: ' + line);
        }

    }

    determine_label_addr(li, addr) {
        for (let i in this.labels) {
            let label = this.labels[i];
            if ((label.addr === null) && (label.line === li)) {
                //if (this.enable_console) console.log('Assigning address ' + hex0x6(addr) + ' to ' + i);
                label.addr = addr;
                break;
            }
        }
    }

    get_labels(line) {
        if (line[0] === '.') {
            let section = line.slice(1);
            // We have a section...
            if (section === 'config' || section === 'vectors') {
                this.section = section;
            } else {
                // We have a code label
                let parts = section.split(':');
                if (parts.length > 2 || parts.length < 1) {
                    this.errormsg('Error parsing line: ' + line);
                    return;
                }
                let label = parts[0].trim();
                if (!/^[a-zA-Z]+[a-zA-Z0-9_]*$/.test(label)) {
                    this.errormsg('Invalid label2: ' + label);
                    return;
                }
                if (parts.length === 1) {
                    if (this.labels.hasOwnProperty(label)) {
                        this.errormsg('Duplicate label ' + label);
                        return;
                    }
                    this.labels[label] = new label_t(label, null, this.lnum);
                } else {
                    let addr = this.interpret_number(parts[1]);
                    if (addr.kind === VT.int) {
                        this.labels[label] = new label_t(label, addr.value, this.lnum);
                    } else if (addr.kind === VT.label) {
                        this.errormsg('Error parsing line: ' + line);
                        return;
                    } else if (addr.kidn === VT.accumulator) {
                        this.errormsg('Cannot have label named A')
                        return;
                    }
                }
            } // code label
        } // .
    }

    get_config_lines(line) {
        if (line[0] === '.') {
            let section = line.slice(1);
            // We have a section...
            if (section === 'config' || section === 'vectors') {
                this.section = section;
            }
            else {
                this.section = "code";
            }
            return;
        }
        if (this.section === 'config') {
            if (line.slice(0,8) === 'ROM_SIZE') {
                let romsize = line.split(' ');
                if (romsize.length !== 2) {
                    this.errormsg('Error 1 parsing line: ' + line);
                    return;
                }
                romsize = this.interpret_number(romsize[1]);
                if (romsize.kind !== VT.int) {
                    this.errormsg('Error parsing ROM size: ' + romsize.value);
                    return;
                }
                this.ROM_SIZE = romsize.value;
            }
        }
        else if (this.section === 'vectors') {
            this.set_vector(line);
        }
        let mn = line.slice(0,3);
    }

    interpret_line(line) {
        let oline = line;
        this.E = this.EMX[this.lnum].E;
        this.M = this.EMX[this.lnum].M;
        this.X = this.EMX[this.lnum].X;
        //console.log(this.lnum, this.E, this.M, this.X);
        if (line[0] === '.') {
            let section = line.slice(1);
            if (section === 'config' || section === 'vectors') {
                this.section = section;
                //console.log('CONTINUE1');
                return;
            } else {
                this.section = 'code';
                // We have a code label
                let parts = section.split(':');
                if (parts.length > 2 || parts.length < 1) {
                    this.errormsg('Error 2 parsing line: ' + line);
                    return;
                }
                let label = parts[0].trim();
                if (!/^[a-zA-Z]+[a-zA-Z0-9_]*$/.test(label)) {
                    this.errormsg('Invalid label1: ' + label);
                    return;
                }
                if (parts.length === 2) {
                    let addr = this.interpret_number(parts[1]);
                    if (addr.kind === VT.int) {
                        this.addr = addr.value;
                        this.lines_to_addr[this.lnum] = this.addr;
                    } else {
                        this.errormsg('Error 3 parsing line: ' + line);
                        return;
                    }
                    return;
                }
                else {
                    // Determine if we can now assign an address to a label that needs it
                    this.determine_label_addr(this.lnum, this.addr);
                }
                return;
            } // code label
            return;
        }
        if (this.section === 'config' || this.section === 'vectors')
            return;

        // Attempt to find a mnemonic for the instruction
        if (line[0] === ':')
            return;
        if (line.length < 3) {
            if (this.enable_console) console.log('HEY! Whats up with this? ' + line);
            return;
        }
        let op = new a_ins_t();
        op.line = this.lnum;
        op.addr = this.addr;
        let mnemonic = line.slice(0, 3);
        let ins = -1;
        for (let j in opcode_MN) {
            if (opcode_MN[j] === mnemonic.toUpperCase()) {
                ins = j;
                break;
            }
        }
        if (ins === -1) {
            this.errormsg('Error 4 parsing line: ' + line);
            return;
        }
        op.ins = parseInt(ins);
        // Now attempt to find an addressing mode
        if (op.ins === OM.DCB) {
            op.needs_resolve = false;
            op.addr_mode = SPC_AM.DCB;
            let to_parse = line.slice(4).split(',');
            for (let i = 0; i < to_parse.length; i++) {
                let v = this.interpret_number(to_parse[i]);
                if (v.kind !== VT.int) {
                    this.errormsg('DCB only takes integer operands');
                    return;
                }
                op.bytecodes[i] = v.value;
            }
            this.instructions.push(op);
            this.addr += to_parse.length;
            return;
        }
        if (op.ins === OM.ASC) {
            console.log('ASC!!!', line)
            op.needs_resolve = false;
            op.addr_mode = SPC_AM.DCB;
            let to_parse = line.slice(5, line.length - 1);
            let j;
            for (let i = 0; i < to_parse.length; i++) {
                let v =
                op.bytecodes[i] = to_parse.charCodeAt(i);
                j = i;
            }
            op.bytecodes[j+1] = 0;
            this.instructions.push(op);
            this.addr += to_parse.length + 1;
            return;
        }

        // First knock out instructions with one-byte opcodes
        let ams = ins_AM[ins];
        if ((ams.length === 1) && (ONE_BYTE_ADDRESS_MODES.indexOf(ams[0]) !== -1)) {
            op.addr_mode = ams[0];
            op.bytecodes[0] = opcode_MN_R[op.ins][0];
            op.needs_resolve = false;
            this.instructions.push(op);
            this.addr += 1;
            return;
        }

        // Now handle MVN, MVP which have custom encodings and are easy to just do
        if (ins === OM.MVP || ins === OM.MVN) {
            op.bytecodes[0] = ins === OM.MVP ? 0x44 : 0x54;

            let operands = line.slice(4).trim();
            if (operands.indexOf(',') === -1) {
                this.errormsg('Error parsing operands ' + operands);
                return;
            }
            operands = operands.split(',');
            if (operands.length !== 2) {
                this.errormsg('Wrong number of operands for ' + operands);
                return;
            }
            let op1 = operands[0];
            let op2 = operands[1];
            op1 = this.interpret_number(op1);
            op2 = this.interpret_number(op2);
            if (op1.kind === VT.invalid || (op1.kind === VT.label && op1.value.addr === null)) {
                this.errormsg('Operand 1 cannot be parsed or cannot resolve address of from ' + operands);
                return;
            }
            if (op2.kind === VT.invalid || (op2.kind === VT.label && op2.value.addr === null)) {
                this.errormsg('Operand 2 cannot be parsed or cannot resolve address of from ' + operands);
                return;
            }
            if (op1.kind === VT.label) op1 = op1.value.addr;
            if (op2.kind === VT.label) op2 = op2.value.addr;
            op.bytecodes[1] = op1.value & 0xFF;
            op.bytecodes[2] = op2.value & 0xFF;

            this.instructions.push(op);
            this.addr += 3;
            return;
        }

        // Search through addressing modes based on operand format
        // First start with available modes
        let operand = line.slice(4).trim();
        //console.log('WERE STARTING WITH', ams);
        let candidate_ams1 = ams;
        // Now use regexes to trim them down
        let candidate_ams2 = [];
        for (let i in candidate_ams1) {
            let cam = candidate_ams1[i];
            let rx = AM_operand_regexes[cam];
            if (rx.test(operand)) {
                candidate_ams2.push(cam);
            }
        }
        candidate_ams1 = candidate_ams2;
        candidate_ams2 = [];

        //console.log('AFTER REGEXES', candidate_ams1);

        //console.log(operand, 'OK WE HAVE THIS LEFT:', candidate_ams1);
        let nummerthing = this.interpret_number(operand);
        // Now look if something is forced
        // < | > is d, a, al
        // if assembler cannot determine mode by context,
        // assembler should assume 2 bytes unless forced
        // a 3-byte hex value counts as "context" btw

        // So first check for forced mode
        let poperand = operand;

        let with_care = false;
        if (nummerthing.kind === VT.invalid) {
            this.errormsg('Error 1 interpreting operand ' + operand + ' ' + line);
            return;
        }
        else if (nummerthing.kind === VT.label) {
            op.label = nummerthing.value;
            if (nummerthing.value.addr === null) {
                // Assemble this op with care. Assume a 16-bit offset. Less code-dense but easier to make
                with_care = true;
                operand = 0;
                console.log('THIS IS AWAITING RESOLUTION', line);
                nummerthing.value.awaiting_resolution.push(op);
                //if (this.enable_console) console.log('Not sophisticated enough to resolve label "' + nummerthing.value.name + '" yet!');
                //if (this.enable_console) console.log('Yes I know how to build it so it can always resolve these but I just want to get this assembler done.');
            }
            else {
                //console.log('GOT HERE', nummerthing.value.addr)
                operand = nummerthing.value.addr;
            }
        }
        else {
            operand = nummerthing.value;
        }

        let valid_modes = [];
        /*if (nummerthing.kind === VT.accumulator) {
            valid_modes = [SPC_AM.ACCUM];
        }
        else if (with_care) {
            valid_modes = [SPC_AM.A, SPC_AM.Ab, SPC_AM.Ac, SPC_AM.Ad, SPC_AM.AL, SPC_AM.ALb, SPC_AM.ALc, SPC_AM.PC_R, AM.PC_RL]
        }
        else if (poperand.indexOf('#') !== -1) {
            // We are forced to immediate
            valid_modes = [AM.IMM];
        }
        else if (poperand.indexOf('<') !== -1) {
            // We are forced to direct page mode
            valid_modes = [AM.D, AM.Db, AM.D_INDEXED_X, AM.D_INDEXED_Xb,
            AM.D_INDEXED_Y, AM.D_IND, AM.D_IND_L, AM.D_INDEXED_IND, AM.D_IND_INDEXED, AM.D_IND_L_INDEXED];
        }
        else if (poperand.indexOf('|') !== -1 || poperand.indexOf('!') !== -1) {
            // We are forced to absolute
            valid_modes = [AM.A, AM.Ab, AM.Ac, AM.Ad, AM.A_INDEXED_X,
            AM.A_INDEXED_Xb, AM.A_INDEXED_Y, AM.A_IND, AM.A_INDb, AM.A_INDEXED_IND, AM.A_INDEXED_INDb];
        }
        else if (poperand.indexOf('>') !== -1) {
            // We are forced to 24-bit absolute long
            valid_modes = [AM.AL, AM.ALb, AM.ALc, AM.AL_INDEXED_X];
        }
        else {
            valid_modes = [AM.ACCUM, AM.D, AM.Db, AM.D_INDEXED_X, AM.D_INDEXED_Xb,
            AM.D_INDEXED_Y, AM.D_IND, AM.D_IND_L, AM.D_INDEXED_IND, AM.D_IND_INDEXED, AM.D_IND_L_INDEXED,
            AM.A, AM.Ab, AM.Ac, AM.Ad, AM.A_INDEXED_X,
            AM.A_INDEXED_Xb, AM.A_INDEXED_Y, AM.A_IND, AM.A_INDb, AM.A_INDEXED_IND, AM.A_INDEXED_INDb,
                AM.AL, AM.ALb, AM.ALc, AM.AL_INDEXED_X,
                AM.PC_R, AM.PC_RL
            ]
        }*/

        //console.log('AMS1h', with_care, candidate_ams1, valid_modes, line);
        //console.log('VALID MODES!', valid_modes, line);
        if (valid_modes.length !== 0) {
            //console.log(candidate_ams1, line);
            for (let i in valid_modes) {
                if (candidate_ams1.indexOf(valid_modes[i]) !== -1)
                    candidate_ams2.push(valid_modes[i]);
            }
            candidate_ams1 = candidate_ams2;
            candidate_ams2 = [];
        }

        //console.log(candidate_ams1)
        // OK we got here. Avengers, assemble!
        let candidate_encodings = collapse_AMs_to_encodings(candidate_ams1);
        //console.log('CANDIDATES!', candidate_encodings);
        if (candidate_encodings.length < 1) {
            if (this.enable_console) console.log(candidate_ams1);
            this.errormsg('Error parsing operand ' + poperand + ': cannot determine type ' + line);
            return;
        }

        let bytes_needed = 0;
        if (operand < 0x100)
            bytes_needed = 1;
        else if (operand < 0x10000)
            bytes_needed = 2;
        else if (operand < 0x100000)
            bytes_needed = 3;
        if (candidate_encodings.length > 1) {
            let possible_encodings = [];
            if (operand < 0x100) {
                possible_encodings.push(OPE.bytes1);
                possible_encodings.push(OPE.bymode);
            }
            if (operand < 0x10000) {
                possible_encodings.push(OPE.bytes2);
                if (possible_encodings.indexOf(OPE.bymode) === -1)
                    possible_encodings.push(OPE.bymode);
            }
            if (operand < 0x1000000)
                possible_encodings.push(OPE.bytes3);
            let ce = candidate_encodings;
            candidate_encodings = [];
            for (let i in possible_encodings) {
                if (ce.indexOf(possible_encodings[i]) !== -1) {
                    candidate_encodings.push(possible_encodings[i]);
                }
            }
        }

        if (candidate_encodings.length === 0) {
            this.errormsg('Error with determining encoding for ' + poperand);
            return;
        }

        // Now if we're using Immediate mode, we'll know it.
        let encoding = OPE.none;
        let amode = -1;
        if (candidate_encodings.indexOf(OPE.bymode) !== -1) {
            amode = AM.IMM;
            // BAD ASSUMPTION! TODO: fix it
            if (this.E)
                encoding = OPE.bytes1;
            else {
                // Check if it's A, M, X, or Y
                encoding = A_OR_M_X.has(ins) ? (this.X ? OPE.bytes1 : OPE.bytes2) : this.M ? OPE.bytes1 : OPE.bytes2;
                /*if ()
                    encoding =
                else
                    encoding =*/
            }
        }
        else {
            // Deobfuscate between DirectPage and Absolute
            if (candidate_ams1.length === 2) {
                if ((candidate_ams1.indexOf(AM.D) !== -1) &&
                    ((candidate_ams1.indexOf(AM.A) !== -1) || (candidate_ams1.indexOf(AM.Ad) !== -1))
                ) {
                    if (bytes_needed === 1) {
                        candidate_ams1 = [AM.D];
                        candidate_encodings = [OPE.bytes1];
                    }
                }
            }
            // Now pick 2 bytes if encoding is still unclear
            if (candidate_encodings.length > 1) {
                console.log('ENCODINGS:', candidate_encodings);
                console.log('CANDIDATE AMS:', candidate_ams1);
                if (candidate_encodings.indexOf(OPE.bytes2) !== -1) {
                    encoding = OPE.bytes2;
                    this.warningmsg('Assuming 16-bit encoding for operand ' + poperand + ' on line ' + line);
                }
                else {
                    this.errormsg('Cannot decide on encoding method for operand ' + poperand);
                    return;
                }
            }
            else {
                //console.log('USING THIS ENCODING!', candidate_encodings);
                encoding = candidate_encodings[0];
            }

            // Now we must find an addressing mode that matches our chosen encoding mode, and is in the candidates
            candidate_ams2 = [];
            for (let i in candidate_ams1) {
                let amode = candidate_ams1[i];
                if (AM_simplifier_by_encoding[amode] === encoding) {
                    candidate_ams2.push(amode);
                }
            }
            candidate_ams1 = candidate_ams2;
            candidate_ams2 = [];

            if (candidate_ams1.length > 1) {
                //console.log('NEED TO WINNOW IT FURTHER');
                alert('FIX THIS BRO!')
                for (let amn in candidate_ams1) {
                    let matches_d = false, matches_a = false, matches_al = false;
                    let minimum_bytes = 0;
                    let am = candidate_ams1[amn];
                    let bad = false;
                    if (am.length === 0) bad = true;
                    for (let i in AM_operand_allowed_types[am]) {
                        for (let j in AM_operand_allowed_types[i]) {
                            let flooper = AM_operand_allowed_types[i][j];
                        }
                        let a_ty = AM_operand_allowed_types[i];
                    }
                }
                console.log('HERES WINNOWED', candidate_ams2);
                //candidate_ams1 = candidate_ams2;
                //candidate_ams2 = [];
            }
            if (candidate_ams1.length !== 1) {
                this.errormsg("Could not deduce addressing mode for line " + line);
                return;
            }
            amode = candidate_ams1[0];
        }
        // Now we have addressing mode and encoding
        // Determine instruction opcode based on mnemonic and addressing mode using opcode_matrix
        op.addr_mode = amode;
        let foundcode = -1;
        ins = parseInt(ins);
        for (let opcode = 0; opcode <= MAX_OPCODE; opcode++) {
            let omi = opcode_matrix[opcode];
            if (omi.ins === ins && omi.addr_mode === amode) {
                foundcode = opcode;
                break;
            }
        }
        if (foundcode === -1) {
            this.errormsg('Could not match opcode for ' + line);
            alert('Could not match opcode for ' + line);
            return;
        }

        op.bytecodes[0] = foundcode;

        switch(op.ins) {
            case OM.REP:
                encoding = OPE.bytes1;
                //if (operand & 0x10) this.EMX[this.lnum+1].X = 0;
                //if (operand & 0x20) this.EMX[this.lnum+1].M = 0;
                break;
            case OM.SEP:
                encoding = OPE.bytes1;
                //if (operand & 0x10) this.EMX[this.lnum+1].X = 1;
                //if (operand & 0x20) this.EMX[this.lnum+1].M = 1;
                break;
            case OM.BNE: // X
            case OM.BCC: // X
            case OM.BCS: // X
            case OM.BEQ: // X
            case OM.BMI: // X
            case OM.BRA: // X
            case OM.BPL: // X
            case OM.BVS: // X
            case OM.BVC: // X
                this.addr += 2;
                if (operand === 0) {
                    op.needs_resolve = true;
                    op.addr_mode = AM.PC_R;
                    this.instructions.push(op);
                    return;
                }
                else {
                    let op_dist = (operand - this.addr);
                    if ((op_dist < -128) || (op_dist > 127)) {
                        this.errormsg('Jump too long (' + op_dist + '): ' + line);
                        return;
                    }
                    op.bytecodes[1] = op_dist & 0xFF;
                    op.needs_resolve = false;
                    this.instructions.push(op);
                    return;
                }
            case OM.BRL:
                this.addr += 3;
                if (operand === 0) {
                    console.log('BRL UNRESOLVED ' + line)
                    op.needs_resolve = true;
                    op.addr_mode = AM.PC_RL;
                    this.instructions.push(op);
                    return;
                }
                else {
                    let op_dist = (operand - this.addr);
                    if ((op_dist < -32768) || (op_dist > 32767)) {
                        this.errormsg('Jump too long: ' + line);
                        return;
                    }
                    op.bytecodes[1] = (op_dist & 0xFF);
                    op.bytecodes[2] = (op_dist & 0xFF) >>> 8;
                    op.needs_resolve = false;
                    this.instructions.push(op);
                    return;
                }
            case OM.JMP: // JMP a or al or (a) or (al)
                console.log('JMP ADDRMODE', op.addr_mode);
                switch(op.addr_mode) {
                    case AM.ALb: // al
                        this.addr += 4;
                        break;
                    case AM.Ab: // a
                        this.addr += 3;
                        break;
                    case AM.A_INDb: // (a)
                        this.addr += 3;
                        break;
                    case AM.A_INDEXED_IND: // (a, x)
                        this.addr += 3;
                        break;
                }
                op.needs_resolve = true;
                this.instructions.push(op);
                return;
            case OM.JML: // JML (al)
                console.log('JML addrmode', op.addr_mode)
                this.addr += 3;
                op.needs_resolve = true;
                this.instructions.push(op);
                return;
            case OM.JSL: // JSL al
                console.log('JSL addrmode', op.addr_mode)
                this.addr += 4;
                op.needs_resolve = true;
                this.instructions.push(op);
                return;
            case OM.JSR: // JSR a, (a,x)
                console.log('JSR addrmode', op.addr_mode)
                this.addr += 3;
                op.needs_resolve = true;
                this.instructions.push(op);
                return;

                // JMP JML JSL JSR
                // JMP a or al
                // JML (al)
                // JSL (al)
                // JSR a or (a, x)
        }

        // Now encode
        switch(encoding) {
            case OPE.none:
                this.addr += 1;
                //this.errormsg('NEVER SHOULDA GOT HERE!');
                break;
            case OPE.bytes1:
                this.addr += 2;
                op.bytecodes[1] = operand & 0xFF;
                break;
            case OPE.bytes2:
                this.addr += 3;
                op.bytecodes[1] = operand & 0xFF;
                op.bytecodes[2] = (operand & 0xFF00) >>> 8;
                break;
            case OPE.bytes3:
                this.addr += 4;
                op.bytecodes[1] = operand & 0xFF;
                op.bytecodes[2] = (operand & 0xFF00) >>> 8;
                op.bytecodes[3] = (operand & 0xFF0000) >>> 16;
                break;
            case OPE.bymode:
                this.errormsg('WHY ISNT THIS CHANGED?');
                break;
            case OPE.operands2:
                this.errormsg('THIS SHOULDA BEEN DONE ALREADY');
                break;
            default:
                this.errormsg('WHAT?' + encoding + ': ' + line);
                break;
        }
        if (!with_care) op.needs_resolve = false;
        this.instructions.push(op);
    }

    assemble(instr, disable_console) {
        if (typeof(disable_console) === 'undefined')
            disable_console = false;
        this.enable_console = !disable_console;
        let lines = instr.split(/\r?\n/);
        if (this.enable_console) console.log('Pass 1: getting labels...');

        // Get vectors
        // Get labels
        let ctrl = this;
        lines.forEach(function(line, li) {
            ctrl.lnum = li;
            line = trim_comment(lines[li]);
            if (line.length === 0)
                return;
            ctrl.get_labels(line)
        });

        if (this.enable_console) console.log('Pass 2: getting config information...')
        // Now get config information
        lines.forEach(function(line, li) {
            ctrl.lnum = li;
            line = trim_comment(lines[li]);
            if (line.length === 0) {
                ctrl.EMX[ctrl.lnum] = new EMX_t(ctrl.E, ctrl.M, ctrl.X);
                ctrl.EMX[ctrl.lnum + 1] = new EMX_t(ctrl.E, ctrl.M, ctrl.X);
                return;
            }
            ctrl.get_config_lines(line);
            //console.log(ctrl.lnum, ctrl.E, ctrl.M, ctrl.X);
            ctrl.EMX[ctrl.lnum] = new EMX_t(ctrl.E, ctrl.M, ctrl.X);
            ctrl.EMX[ctrl.lnum+1] = new EMX_t(ctrl.E, ctrl.M, ctrl.X);
        });

        if (this.enable_console) console.log('Pass 3: Interpreting instructions')
        this.addr = 0;

        lines.forEach(function(line, li) {
            line = trim_comment(lines[li]);
            ctrl.lines_to_addr[li] = ctrl.addr;
            ctrl.lnum = li;
            if (line.length === 0) return;
            ctrl.interpret_line(line);
        });

        if (this.enable_console) console.log('Pass 3.5: Resolving any jumps to unknown places')
        for (let i in this.instructions) {
            let op = this.instructions[i];
            let dist;
            if (op.needs_resolve) {
                if (op.label.addr === null) {
                    this.errormsg("Still can't resolve label " + op.label.name);
                    continue;
                }
                switch(op.addr_mode) {
                    case SPC_AM.PC_R:
                        dist = op.label.addr - (op.addr + 2);
                        if ((dist < -128) || (dist > 127)) {
                            this.errormsg('Jump too long: ' + dist + ' ' + op.label.name);
                            continue;
                        }
                        op.bytecodes[1] = dist & 0xFF;
                        op.needs_resolve = false;
                        continue;
                    case SPC_AM.PC_RL:
                        dist = op.label.addr - (op.addr + 3);
                        if ((dist < -32768) || (dist > 32767)) {
                            this.errormsg('LJump too long: ' + dist + ' ' + op.label.name);
                            continue;
                        }
                        op.bytecodes[1] = dist & 0xFF;
                        op.bytecodes[2] = (dist & 0xFF00) >>> 8;
                        op.needs_resolve = false;
                        continue;
                    case SPC_AM.Ab: // JMP a
                        op.bytecodes[1] = op.label.addr & 0xFF;
                        op.bytecodes[2] = (op.label.addr & 0xFF00) >>> 8;
                        continue;
                    case SPC_AM.ALb: // JMP al
                    case SPC_AM.ALc: // JSL al
                        op.bytecodes[1] = op.label.addr & 0xFF;
                        op.bytecodes[2] = (op.label.addr & 0xFF00) >>> 8;
                        op.bytecodes[3] = (op.label.addr & 0xFF0000) >>> 16;
                        continue;
                    default:
                        console.log('OOPS MESSED UP WHAT ' + op.addr_mode + ': ' + hex0x2(op.bytecodes[0]));
                        continue;
                }
            }
        }

        for (let i in this.labels) {
            console.log(this.labels[i].name, hex0x6(this.labels[i].addr));
        }

        if (this.enable_console) console.log('Pass 4: Resolving vectors from labels')
        for (let addr in this.vectors) {
            let vec = this.vectors[addr];
            if (vec.addr === null && vec.label !== null && !vec.can_resolve()) {
                this.errormsg('Cannot resolve vector ' + hex4(addr));
                vec.addr = 0;
                continue;
            }
            if (vec.addr === null && vec.label !== null) {
                vec.addr = vec.resolve();
            }
            if (vec.addr === null) vec.addr = 0;
        }

        if (this.enable_console) console.log('Pass 5: building ROM');
        // Allocate ROM
        if (this.enable_console) console.log("Creating ROM size " + parseInt(this.ROM_SIZE / 1024) + 'k');
        this.output = new Uint8Array(this.ROM_SIZE);

        // Write vectors
        //console.log('Writing vector table...');
        for (let addr in this.vectors) {
            let vec = this.vectors[addr];
            if (this.enable_console) console.log(hex0x6(parseInt(addr)), hex0x4(vec.addr));
            this.write16(parseInt(addr), vec.addr);
        }

        if (this.enable_console) console.log('Writing instructions...');
        for (let i in this.instructions) {
            this.writeinstruction(this.instructions[i]);
        }

        if (this.enable_console) console.log('Done assembling!');
    }
}
