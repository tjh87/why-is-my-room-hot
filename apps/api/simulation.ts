export type Room = { temperature:number; target_temp:number; sunlight:"high"|"medium"|"low"; electronics:"on"|"off"; blinds:"open"|"closed"; fan:"off"|"low"|"high"; ac_on:boolean; ac_seconds:number; ac_max_seconds:number|null; ac_max_cents:number|null; rate_cents_per_hour:number; };
export const charge = (seconds:number, rate=120) => Math.floor((seconds * rate + 1800) / 3600);
export const comfortScore = (room:Room) => +(room.temperature - (room.fan === "high" ? 1.2 : room.fan === "low" ? .55 : 0)).toFixed(2);
export function advance(room:Room, seconds:number) {
  let used=0; let current={...room};
  while (used < seconds && current.ac_on) {
    const remainingByDuration=current.ac_max_seconds===null ? Infinity : current.ac_max_seconds-current.ac_seconds;
    const remainingByMoney=current.ac_max_cents===null ? Infinity : Math.max(0, Math.ceil((current.ac_max_cents*3600-1800)/current.rate_cents_per_hour)-current.ac_seconds);
    const step=Math.min(10, seconds-used, Math.max(0,remainingByDuration),Math.max(0,remainingByMoney));
    if (!step) { current.ac_on=false; break; }
    current.ac_seconds+=step; used+=step;
    const sun=current.sunlight === "high" ? .012 : current.sunlight === "medium" ? .006 : .002;
    const heat=(current.blinds === "closed" ? sun*.25 : sun)+(current.electronics === "on"?.003:0);
    current.temperature=Math.max(18,Math.min(38,current.temperature+(heat-.025)*step));
  }
  if (!current.ac_on && used < seconds) {
    const sun=current.sunlight === "high" ? .012 : current.sunlight === "medium" ? .006 : .002;
    const heat=(current.blinds === "closed" ? sun*.25 : sun)+(current.electronics === "on"?.003:0);
    current.temperature=Math.max(18,Math.min(38,current.temperature+heat*(seconds-used)));
  }
  return {...current,temperature:+current.temperature.toFixed(2), stoppedAtCap: room.ac_on && !current.ac_on};
}
