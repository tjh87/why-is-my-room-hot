import { env } from "./env.js";
const allowedSpeeds=[1,10,60] as const;
let paused=false;
let speed=60;
const cents=(value:string|undefined,fallback:number)=>{const parsed=Number(value);return Number.isInteger(parsed)&&parsed>=0?parsed:fallback};
let acRateCents=cents(env("SIMULATION_AC_RATE_CENTS"),120);
let fanRateCents=cents(env("SIMULATION_FAN_RATE_CENTS"),12);

export function simulationState(){return {paused,speed};}
export function pricing(){return {ac_rate_cents_per_hour:acRateCents,fan_rate_cents_per_hour:fanRateCents};}
export function setPricing(acRate:number,fanRate:number){acRateCents=cents(String(acRate),acRateCents);fanRateCents=cents(String(fanRate),fanRateCents);return pricing();}
export function setPaused(value:boolean){paused=value;return simulationState();}
export function setSpeed(value:number){if(!allowedSpeeds.includes(value as typeof allowedSpeeds[number]))throw new Error("Unsupported simulation speed");speed=value;return simulationState();}
export function resetSimulation(){paused=false;speed=60;return simulationState();}
export function isPaused(){return paused;}
export function simulationSpeed(){return speed;}
