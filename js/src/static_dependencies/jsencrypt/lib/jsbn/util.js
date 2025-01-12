const BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
export function int2char(n) {
    return BI_RM.charAt(n);
}
//#region BIT_OPERATIONS
// (public) this & a
export function op_and(x, y) {
    return x & y;
}
// (public) this | a
export function op_or(x, y) {
    return x | y;
}
// (public) this ^ a
export function op_xor(x, y) {
    return x ^ y;
}
// (public) this & ~a
export function op_andnot(x, y) {
    return x & ~y;
}
// return index of lowest 1-bit in x, x < 2^31
export function lbit(x) {
    if (x == 0) {
        return -1;
    }
    let r = 0;
    if ((x & 0xffff) == 0) {
        x >>= 16;
        r += 16;
    }
    if ((x & 0xff) == 0) {
        x >>= 8;
        r += 8;
    }
    if ((x & 0xf) == 0) {
        x >>= 4;
        r += 4;
    }
    if ((x & 3) == 0) {
        x >>= 2;
        r += 2;
    }
    if ((x & 1) == 0) {
        ++r;
    }
    return r;
}
// return number of 1 bits in x
export function cbit(x) {
    let r = 0;
    while (x != 0) {
        x &= x - 1;
        ++r;
    }
    return r;
}
//#endregion BIT_OPERATIONS
