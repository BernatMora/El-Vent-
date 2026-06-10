import { describe, it, expect } from "vitest"
import { getWindDirectionCategory } from "@/lib/calibration-service"

describe("getWindDirectionCategory", () => {
  it("returns N for 0°", () => expect(getWindDirectionCategory(0)).toBe("N"))
  it("returns N for 350°", () => expect(getWindDirectionCategory(350)).toBe("N"))
  it("returns NE for 45°", () => expect(getWindDirectionCategory(45)).toBe("NE"))
  it("returns E for 90°", () => expect(getWindDirectionCategory(90)).toBe("E"))
  it("returns SE for 135°", () => expect(getWindDirectionCategory(135)).toBe("SE"))
  it("returns S for 180°", () => expect(getWindDirectionCategory(180)).toBe("S"))
  it("returns SW for 225°", () => expect(getWindDirectionCategory(225)).toBe("SW"))
  it("returns W for 270°", () => expect(getWindDirectionCategory(270)).toBe("W"))
  it("returns NW for 315°", () => expect(getWindDirectionCategory(315)).toBe("NW"))
  it("handles negative degrees by wrapping", () => expect(getWindDirectionCategory(-90)).toBe("W"))
  it("handles >360 degrees by wrapping", () => expect(getWindDirectionCategory(450)).toBe("E"))
})
