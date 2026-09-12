import { useEffect } from "react";

const api="http://127.0.0.1:3000/api";

export default function RoomIndicators(){useEffect(()=>{let active=true;const update=async()=>{try{const data=await fetch(`${api}/rooms`).then(response=>response.json());if(!active)return;(data.rooms??[]).forEach((room:any,index:number)=>{const label=document.querySelector<HTMLElement>(`.badge.b${index} span`);if(!label)return;const indicators=[room.ac_on?"❄ AC on":"",room.fan!=="off"?"✣ Fan on":"",room.blinds==="closed"?"▤ Blinds closed":""].filter(Boolean);label.textContent=indicators.join(" · ")||(room.temperature>room.target_temp?"Too warm":"Comfortable");});}catch{}};void update();const timer=window.setInterval(()=>void update(),2000);return()=>{active=false;window.clearInterval(timer)};},[]);return null;}
