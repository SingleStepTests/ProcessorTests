# 68000 Opcode list

68000.official.json lists a decoding of all officially-defined opcodes, subject to caveats as below:

* `MOVE USP`, `MOVE SR` and `MOVE CCR` are treated as specialised operations rather than as instances of MOVE; they are therefore listed variously as `MOVEfromUSP`, `MOVEtoUSP`, `MOVEfromSR`, `MOVEtoSR`, `MOVEfromCCR` and `MOVEtoCCR`; and
* the conditions for Bcc, Scc and DBcc aren't recorded, leading to multiple seemingly-repetitive instances of each.