export const add = (a,b) => a + b
export const subtract = (a,b) => a - b
export const multiply = (a,b) => a * b
export const divide = (a,b) => a / b
export const sum = (arr) => arr.reduce(add)
export const mean = (arr) => sum(add) / arr.length

// export const _parseProperFormat = (val) => {
//     if (typeof val === 'boolean') val = val ? 1 : 0;
//     else val = Number.parseFloat(val)
//     return val
// }