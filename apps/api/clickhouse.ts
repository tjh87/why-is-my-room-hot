import { createClient } from "@clickhouse/client";
import crypto from "node:crypto";
import { env } from "./env.js";

const configured=Boolean(env("CLICKHOUSE_URL"));
const client=createClient({url:env("CLICKHOUSE_URL")??"http://localhost:8123",username:env("CLICKHOUSE_USER")??"default",password:env("CLICKHOUSE_PASSWORD"),database:env("CLICKHOUSE_DATABASE")??"hotroom",request_timeout:1500,application:"why-is-my-room-hot"});
let prepared=false;

async function prepare(){if(prepared)return;await client.command({query:"CREATE TABLE IF NOT EXISTS apartment_events (event_id UUID, room_id String, event_type LowCardinality(String), temperature Nullable(Float64), action Nullable(String), amount_cents Nullable(Int64), payload String, occurred_at DateTime64(3, 'UTC')) ENGINE = MergeTree() ORDER BY (room_id, occurred_at)"});prepared=true;}

export async function clickhouseHealth(){const probe=await client.ping({select:true});return {configured,status:probe.success?"available":"unavailable"};}

export async function event(room_id:string,event_type:string,data:Record<string,unknown>={}){const event_id=crypto.randomUUID();try{await prepare();await client.insert({table:"apartment_events",format:"JSONEachRow",values:[{event_id,room_id,event_type,temperature:data.temperature??null,action:data.action??null,amount_cents:data.amount_cents??null,payload:JSON.stringify(data),occurred_at:new Date().toISOString()}]});return {event_id,status:"recorded"};}catch{return {event_id,status:"unavailable"};}}

export async function history(room_id:string){try{await prepare();const q=await client.query({query:"SELECT event_id,room_id,event_type,temperature,action,payload,occurred_at FROM apartment_events WHERE room_id = {room_id:String} ORDER BY occurred_at DESC LIMIT 20",query_params:{room_id},format:"JSONEachRow",clickhouse_settings:{max_execution_time:3,max_rows_to_read:"10000",max_result_rows:"20",timeout_before_checking_execution_speed:0}});const rows=await q.json<any>();return {source:"clickhouse",query_time:new Date().toISOString(),events:Array.from(new Map(rows.map((x:any)=>[x.event_id,x])).values()),status:"available"};}catch{return {source:"clickhouse",query_time:new Date().toISOString(),events:[],status:"unavailable"};}}

export async function closeClickHouse(){await client.close();}
