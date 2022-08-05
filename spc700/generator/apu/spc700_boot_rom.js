"use strict";
/*
$CD $EF $BD $E8 $00 $C6 $1D $D0 $FC $8F $AA $F4 $8F $BB $F5 $78
$CC $F4 $D0 $FB $2F $19 $EB $F4 $D0 $FC $7E $F4 $D0 $0B $E4 $F5
$CB $F4 $D7 $00 $FC $D0 $F3 $AB $01 $10 $EF $7E $F4 $10 $EB $BA
$F6 $DA $00 $BA $F4 $C4 $F4 $DD $5D $D0 $DB $1F $00 $00 $C0 $FF
 */


const SPC700_BOOT_IPL_ASM = `
; Commented SPC-700 IPL ROM
; by eKid
; Changed to JSMoo assembly format

; Original disassembly from SID-SPC written by Alfatech/Triad

; This code assembles with JSMoo SPC700 assembler

;-------------------------------------------------------------------------------
; DEFINITIONS
;-------------------------------------------------------------------------------

.config
ROM_SIZE 64     ; 64 bytes to fit in
ORG $FFC0       ; we load up at 0xFFC0

.vectors
RESET ResetVector

.WriteAdr:$00    ; Write address during transfers
.Port0:$F4    ; I/O ports
.Port1:$F5
.Port2:$F6
.Port3:$F7

.ORG:$FFC0
;-------------------------------------------------------------------------------
.Start
;-------------------------------------------------------------------------------

; set stack pointer to $EF
;   "why EF? page1 has 256 memory bytes!"
;   because the value in X is reused in the page0 clear (saves 2 bytes)
;   the higher 16 bytes of page0 contain hardware registers.

    mov x, #$EF
    mov sp, x

; clear zero-page memory

    mov a, #$00
.clrpg0
    mov (x), a
    dec x
    bne clrpg0

; indicate ready signal, write 0BBAAh to ports 0/1

    mov Port0, #$AA
    mov Port1, #$BB

; idle until the SNES sends the transfer signal to port0 ($CC)
; and then process data

.wait1
    cmp $F4, #$CC
    bne wait1

    bra ProcessData

;-------------------------------------------------------------------------------
.TransferData
;-------------------------------------------------------------------------------

; wait until Port0 gets zero written to it

.wait2
    mov y, Port0
    bne wait2

; this is the main transfer loop

.transfer_bytes
    cmp y, Port0    ; check for data
    bne check_end

    mov a, Port1    ; read byte of data
    mov Port0, y    ; reply to SNES (snes can write new data now)
    mov [WriteAdr]+Y, A ; write data to memory
    inc y       ; increment index
    bne transfer_bytes  ; loop

; index overflowed, increment high byte of WriteAdr
    inc WriteAdr+1

.check_end

; if y - port0 < 0 then the transfer is complete (SNES added 2 or more)

    bpl transfer_bytes

; confirm this! we may have checked with invalid data
; also, this is used when the "inc WriteAdr+1" path is taken
;         (when transferring to $8000 or higher)

    cmp y, Port0
    bpl transfer_bytes

; transfer is finished, process data again

;-------------------------------------------------------------------------------
.ProcessData
;-------------------------------------------------------------------------------

; read word from ports 2/3
; word may be data write address,
; or program entry point (depending on port0)

    movw    ya, Port2
    movw    WriteAdr, ya
    movw    ya, $F4
    mov Port0, a    ; reply to SNES with PT0 data
    mov a, y
    mov x, a

; if port1 wasn't zero, then start the transfer

    bne TransferData

; otherwise...
; jump to program entry point
; X is zero in this case, so this
; is an effective "movw pc, WriteAdr"
    jmp [WriteAdr+X]

;-------------------------------------------------------------------------------
.ResetVector
;-------------------------------------------------------------------------------
    di
    stop

; When program flow is passed to the user code, the Accumulator
; and X/Y index registers are zero, and the SP is initialized to $EF.
; Also, page0 memory is cleared. (EXCEPT for the word at $00)
`

const SPC700_BOOT_ROM = Object.freeze([
0xCD, 0xEF, 0xBD, 0xE8, 0x00, 0xC6, 0x1D, 0xD0, 0xFC, 0x8F, 0xAA, 0xF4, 0x8F, 0xBB, 0xF5, 0x78,
0xCC, 0xF4, 0xD0, 0xFB, 0x2F, 0x19, 0xEB, 0xF4, 0xD0, 0xFC, 0x7E, 0xF4, 0xD0, 0x0B, 0xE4, 0xF5,
0xCB, 0xF4, 0xD7, 0x00, 0xFC, 0xD0, 0xF3, 0xAB, 0x01, 0x10, 0xEF, 0x7E, 0xF4, 0x10, 0xEB, 0xBA,
0xF6, 0xDA, 0x00, 0xBA, 0xF4, 0xC4, 0xF4, 0xDD, 0x5D, 0xD0, 0xDB, 0x1F, 0x00, 0x00, 0xC0, 0xFF
]);