import { describe, it, expect } from "vitest"
import { getWindDirectionName, getWindName, knotsToKmh, getShoreType, formatDate } from "@/lib/utils"

describe("getWindDirectionName", () => {
  it("returns N for 0°", () => expect(getWindDirectionName(0)).toBe("N"))
  it("returns N for 350°", () => expect(getWindDirectionName(350)).toBe("N"))
  it("returns NE for 45°", () => expect(getWindDirectionName(45)).toBe("NE"))
  it("returns E for 90°", () => expect(getWindDirectionName(90)).toBe("E"))
  it("returns SE for 135°", () => expect(getWindDirectionName(135)).toBe("SE"))
  it("returns S for 180°", () => expect(getWindDirectionName(180)).toBe("S"))
  it("returns SW for 225°", () => expect(getWindDirectionName(225)).toBe("SW"))
  it("returns W for 270°", () => expect(getWindDirectionName(270)).toBe("W"))
  it("returns NW for 315°", () => expect(getWindDirectionName(315)).toBe("NW"))
  it("handles boundary 337.5° as N", () => expect(getWindDirectionName(337.5)).toBe("N"))
  it("handles boundary 22.5° as N", () => expect(getWindDirectionName(22.4)).toBe("N"))
  it("handles boundary 22.5° as NE", () => expect(getWindDirectionName(22.5)).toBe("NE"))
})

describe("getWindName", () => {
  it("returns Tramuntana for N", () => expect(getWindName(0)).toBe("Tramuntana"))
  it("returns Gregal for NE", () => expect(getWindName(45)).toBe("Gregal"))
  it("returns Llevant for E", () => expect(getWindName(90)).toBe("Llevant"))
  it("returns Xaloc for SE", () => expect(getWindName(135)).toBe("Xaloc"))
  it("returns Migjorn for S", () => expect(getWindName(180)).toBe("Migjorn"))
  it("returns Llebeig for SW", () => expect(getWindName(225)).toBe("Llebeig"))
  it("returns Ponent for W", () => expect(getWindName(270)).toBe("Ponent"))
  it("returns Mestral for NW", () => expect(getWindName(315)).toBe("Mestral"))
})

describe("knotsToKmh", () => {
  it("converts 0 knots to 0 km/h", () => expect(knotsToKmh(0)).toBe(0))
  it("converts 10 knots to 19 km/h", () => expect(knotsToKmh(10)).toBe(19))
  it("converts 20 knots to 37 km/h", () => expect(knotsToKmh(20)).toBe(37))
  it("converts 1 knot to 2 km/h", () => expect(knotsToKmh(1)).toBe(2))
})

describe("getShoreType", () => {
  it("returns Onshore for E (90°)", () => {
    const r = getShoreType(90)
    expect(r.label).toBe("Onshore")
  })
  it("returns Onshore for SE (135°)", () => {
    const r = getShoreType(135)
    expect(r.label).toBe("Onshore")
  })
  it("returns Side for NE (45°)", () => {
    const r = getShoreType(45)
    expect(r.label).toBe("Side")
  })
  it("returns Side for S (180°)", () => {
    const r = getShoreType(180)
    expect(r.label).toBe("Side")
  })
  it("returns Offshore for N (0°)", () => {
    const r = getShoreType(0)
    expect(r.label).toBe("Offshore")
  })
  it("returns Offshore for W (270°)", () => {
    const r = getShoreType(270)
    expect(r.label).toBe("Offshore")
  })
  it("returns Offshore for NW (315°)", () => {
    const r = getShoreType(315)
    expect(r.label).toBe("Offshore")
  })
})

describe("formatDate", () => {
  it("formats date string correctly", () => {
    const result = formatDate("2026-06-10")
    expect(result).toContain("juny")
    expect(result).toContain("10")
  })
})
