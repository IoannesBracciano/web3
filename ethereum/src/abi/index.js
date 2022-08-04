/**
 * A JavaScript implementation of Ethereum ABI encoding/decoding.
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html
 */

import { Keccak } from "sha3"

/**
 * Encode an ethereum address.
 * 
 * @param {string} X
 * Ethereum address given as a string. May or may not be prepended by
 * "0x".
 * 
 * @returns {string}
 * The encoded ethereum address.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
 export function encodeAddress(X) {
    return X.replace(/^0x/, "").padStart(64, '0')
}

/**
 * Encode a boolean value.
 * 
 * @param {boolean} X
 * The boolean value.
 * 
 * @returns {string}
 * The encoded boolean value.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
export function encodeBool(X) {
    return encodeUint(+X)
}

/**
 * Encode a sequence of bytes.
 * 
 * @param {string|Uint8Array} textOrByteArray
 * Sequence of bytes as a UTF8 string or a uint array.
 * 
 * @returns {string}
 * The encoded sequence of bytes.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
 export function encodeBytes(textOrByteArray, dynamicLength = false) {
    function fromByteArray(X) {
        const k = X.length
        const mod = k % 32
        const padding = mod !== 0 ? 32 - mod : 0
        const staticEncoding = X.reduce(
            (enc, byte) => enc + byte.toString(16).padStart(2, '0'),
            "",
        ).padEnd((k + padding) * 2, '0')
        return (dynamicLength ? encodeUint(k) : "") + staticEncoding
    }
    if (typeof textOrByteArray === "string") {
        const encoder = new TextEncoder()
        return fromByteArray(encoder.encode(textOrByteArray))
    }
    return fromByteArray(textOrByteArray)
}

/**
 * Encode a variable-length array.
 * 
 * @param {any[]} X
 * The elements of the array.
 * 
 * @param {string} T
 * The type of the elements in the array.
 * 
 * @returns {string}
 * The encoded array.
 */
export function encodeDynamicArray(X, T) {
    const k = X.length
    const T_static = T.replace(/\[\]$/, `[${k}]`)
    return encodeUint(k) + encodeStaticArray(X, T_static)
}

/**
 * Encode a fixed-point decimal value.
 * 
 * @param {string} X
 * A string representing a fixed-point decimal number, e.g. "2.27".
 * 
 * @returns {string}
 * The encoded decimal.
 *
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
export function encodeFixed(X) {
    return encodeInt(X.replace('.', ''))
}

/**
 * Encode an integer value.
 * 
 * @param {BigInt|number|string} value
 * A string representing an integer number, e.g. "-128".
 * 
 * @returns {string}
 * The encoded integer.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
export function encodeInt(value) {
    return BigInt.asUintN(256, BigInt(value)).toString(16).padStart(64, '0')
}

/**
 * 
 * @param {any[]} X 
 * @param {string} T 
 */
export function encodeStaticArray(X, T) {
    const { arrayType, k } = T.match(/^(?<arrayType>.+)\[(?<k>[0-9]+)\]$/).groups
    const tuple = "(" + Array(+k).fill(arrayType).join(',') + ")"
    return encodeTuple(X, tuple)
}

/**
 * Encode a string.
 * 
 * @param {string} X
 * The string to encode.
 * 
 * @returns {string}
 * The encoded string.
 */
export function encodeString(X) {
    // const encoder = new TextEncoder()
    // return encodeBytes(encoder.encode(X))
    return encodeBytes(X)
}

/**
 * Encode data into a tuple.
 * 
 * @param {any[]} X
 * A collection of mixed-type values representing the data.
 * 
 * @param {string} tuple
 * The type of each element in the collection given as a string
 * formatted as a comma separated list of the types (no spaces)
 * enclosed in parentheses.
 * 
 * @returns {string}
 * The encoded tuple.
 */
export function encodeTuple(X, tuple) {
    const k = X.length
    // Heads are always 32 bytes each
    const lengthHeads = BigInt(k) * 32n
    const T = tuple.slice(1, -1).split(',')
    const tails = T.map((T_i, i) => (
        isDynamic(T_i) ? encodeArgument(X[i], T_i) : ""
    ))
    const tailOffsets = tails.map((_, i) => (
        lengthHeads + BigInt(tails.slice(0, i).join('').length) / 2n
    ))
    const heads = T.map((T_i, i) => (
        isDynamic(T_i)
            ? encodeUint(tailOffsets[i])
            : encodeArgument(X[i], T_i)
    ))
    return [...heads, ...tails].join('')
}

/**
 * Encode an unsigned fixed-point decimal value.
 * 
 * @param {string} X
 * A string representing an unsigned (positive) fixed-point decimal
 * number, e.g. "1.14".
 * 
 * @returns {string}
 * The encoded unsigned decimal.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
export function encodeUfixed(X) {
    return encodeUint(X.replace('.', ''))
}

/**
 * Encode an unsigned integer value.
 * 
 * @param {BigInt|number|string} X
 * A string representing an unsigned (positive) integer number,
 * e.g. "255".
 * 
 * @returns {string}
 * The encoded unsigned integer.
 * 
 * @see https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding
 */
export function encodeUint(X) {
    return BigInt(X).toString(16).padStart(64, '0')
}

/**
 * Encode a value of arbitrary type.
 * 
 * @param {any} value
 * The thing to encode.
 * 
 * @param {string} type
 * The type of the thing.
 * 
 * @returns
 * The encoded thing.
 */
export function encodeArgument(value, type) {
    switch(true) {
        case /\[[0-9]+\]$/.test(type):
            return encodeStaticArray(value, type)
        case /\[\]$/.test(type):
            return encodeDynamicArray(value, type)
        case type === "address":
            return encodeAddress(value)
        case type === "bool":
            return encodeBool(value)
        case type === "bytes":
            return encodeBytes(value, true)
        case type.startsWith("bytes"):
            return encodeBytes(value)
        case type.startsWith("fixed"):
            return encodeFixed(value)
        case type.startsWith("int"):
            return encodeInt(value)
        case type === "string":
            return encodeString(value)
        case type.startsWith("ufixed"):
            return encodeUfixed(value)
        case type.startsWith("uint"):
            return encodeUint(value)
        case type.startsWith('('): // tuple
            return encodeTuple(value, type)
        default:
            throw new Error(`Argument type not supported: ${type}`)
    }
}

/**
 * Encode an Ethereum ABI function call.
 * 
 * @param {string} signature
 * The function signature.
 *
 * @param  {...any} argValues
 * The values to pass down as arguments.
 * 
 * @returns {string}
 * The encoded function call.
 */
export function encode(signature, ...argValues) {
    const selector = calculateFunctionSelector(signature)
    const argsTuple = parseArgsFromSignature(signature)
    const encodedArgs = encodeArgument(argValues, argsTuple)
    return `0x${selector}${encodedArgs}`
}

/**
 * Get the unique function selector from its signature.
 * 
 * @param {string} signature
 * 
 * @returns {string}
 */
export function calculateFunctionSelector(signature) {
    const hash = new Keccak(256)
    return hash
        .update(signature)
        .digest("hex")
        .substring(0, 8)
}

export function parseArgsFromSignature(signature) {
    return signature.match(/(?<args>\(.*\)$)/, signature).groups.args
}

/**
 * Check if the given type is "dynamic".
 *
 * @param {string} type
 * The name of the type as found in the Ethereum ABI docs.
 * 
 * @returns {boolean}
 */
export function isDynamic(type) {
    return type.startsWith('(')
        ? type.replace(/^\(|\)$/, '').split(',').some(T => isDynamic(T))
        : /(^((bytes|string)(\[[0-9]+\])?)$)|(\[\]$)/.test(type)
}
