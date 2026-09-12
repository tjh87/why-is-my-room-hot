import { readFileSync } from "node:fs";

let local:Record<string,string>={};
try{local=Object.fromEntries(readFileSync(new URL("../../.env",import.meta.url),"utf8").split(/\r?\n/).filter(line=>line.includes("=")&&!line.trimStart().startsWith("#")).map(line=>{const index=line.indexOf("=");return [line.slice(0,index).trim(),line.slice(index+1).trim()]}));}catch{}

export const env=(name:string)=>process.env[name]||local[name];
