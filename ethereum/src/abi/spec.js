import {
    encode,
    encodeArgument,
} from "./index"

describe("encoder", () => {

    test("encodes arguments of type address correctly", () => {
        const T = "address"
        const X = "0xf00000000000000000000000000000000000000f"
        const X_enc = "000000000000000000000000f00000000000000000000000000000000000000f"
        expect(encodeArgument(X, T)).toBe(X_enc)
    })

    test("encodes arguments of type bool correctly", () => {
        const T = "bool"
        const Xtrue_enc = "0000000000000000000000000000000000000000000000000000000000000001"
        expect(encodeArgument(true, T)).toBe(Xtrue_enc)
        const Xfalse_enc = "0000000000000000000000000000000000000000000000000000000000000000"
        expect(encodeArgument(false, T)).toBe(Xfalse_enc)
    })

    test("encodes byte array arguments of dynamic length correctly", () => {
        const T = "bytes"
        const X = Uint8Array.from([0, 127, 255])
        const X_enc = [
            "0000000000000000000000000000000000000000000000000000000000000003",
            "007fff0000000000000000000000000000000000000000000000000000000000",
        ].join('')
        expect(encodeArgument(X, T)).toBe(X_enc)
    })

    test("encodes typed array arguments of dynamic length correctly", () => {
        const T = "uint8[]"
        const X = [31, 16, 1]
        const X_enc = [
            "0000000000000000000000000000000000000000000000000000000000000003",
            "000000000000000000000000000000000000000000000000000000000000001f",
            "0000000000000000000000000000000000000000000000000000000000000010",
            "0000000000000000000000000000000000000000000000000000000000000001",
        ].join('')
        expect(encodeArgument(X, T)).toBe(X_enc)
    })

    test("encodes arguments of type fixed correctly", () => {
        const T = "fixed64x2"
        const X = "10.24"
        const X_enc = "0000000000000000000000000000000000000000000000000000000000000400"
        expect(encodeArgument(X, T)).toBe(X_enc)
    })

    test("encodes call to method 'baz(uint32,bool)' correctly", () => {
        const singature = "baz(uint32,bool)"
        const args = [69, true]
        const encoding = [
            "0xcdcd77c0",
            "0000000000000000000000000000000000000000000000000000000000000045",
            "0000000000000000000000000000000000000000000000000000000000000001",
        ].join('')
        expect(encode(singature, ...args)).toBe(encoding)
    })

    test("encodes call to method 'bar(bytes3[2])' correctly", () => {
        const signature = "bar(bytes3[2])"
        const args = [["abc", "def"]]
        const encoding = [
            "0xfce353f6",
            "6162630000000000000000000000000000000000000000000000000000000000",
            "6465660000000000000000000000000000000000000000000000000000000000",
        ].join('')
        expect(encode(signature, ...args)).toBe(encoding)
    })

    test("encodes call to method 'sam(bytes,bool,uint256[])' correctly", () => {
        const signature = "sam(bytes,bool,uint256[])"
        const args = ["dave", true, [1, 2, 3]]
        const encoding = [
            "0xa5643bf2",
            "0000000000000000000000000000000000000000000000000000000000000060",
            "0000000000000000000000000000000000000000000000000000000000000001",
            "00000000000000000000000000000000000000000000000000000000000000a0",
            "0000000000000000000000000000000000000000000000000000000000000004",
            "6461766500000000000000000000000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000000000000000000000003",
            "0000000000000000000000000000000000000000000000000000000000000001",
            "0000000000000000000000000000000000000000000000000000000000000002",
            "0000000000000000000000000000000000000000000000000000000000000003",
        ].join('')
        expect(encode(signature, ...args)).toBe(encoding)
    })

})
