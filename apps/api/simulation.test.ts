import { describe, expect, it } from "vitest";
import { advance, charge, type Room } from "./simulation.js";
const room:Room={temperature:31,target_temp:26,sunlight:"high",electronics:"on",blinds:"open",fan:"off",ac_on:true,ac_seconds:0,ac_max_seconds:1800,ac_max_cents:60,rate_cents_per_hour:120};
describe("billing",()=>{it("uses source rounding",()=>{expect(charge(1440)).toBe(48);expect(charge(1800)).toBe(60);expect(charge(3600)).toBe(120)});it("stops at cap",()=>{expect(advance({...room,ac_max_seconds:100},1000).ac_seconds).toBe(100)});it("keeps bounds",()=>{expect(advance(room,99999).temperature).toBeGreaterThanOrEqual(18)})});
