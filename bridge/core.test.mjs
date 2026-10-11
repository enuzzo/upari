import { describe,it,expect } from 'vitest';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createScheduler,validatePlan } from './core.mjs';
const start=Date.parse('2026-10-11T16:00:00Z');
const plan=()=>({version:1,expires:new Date(start+48*3600000).toISOString(),epoch:new Date(start-3600000).toISOString(),events:[{id:'upari-one',at:start+60000,expires:start+300000,message:'ISS tra poco'}]});
describe('Persistent bridge scheduler',()=>{
  it('validates the bounded queue, epoch and duplicate IDs',()=>{expect(()=>validatePlan(plan(),start)).not.toThrow();expect(()=>validatePlan({...plan(),epoch:'2020-01-01'},start)).toThrow();expect(()=>validatePlan({...plan(),events:[...plan().events,...plan().events]},start)).toThrow();});
  it('survives a restart without duplicate delivery and skips late events',async()=>{const dir=await mkdtemp(join(tmpdir(),'upari-test-'));try{let now=start,calls=0;const make=()=>createScheduler({file:join(dir,'state.json'),now:()=>now,send:async()=>{calls++;}});let s=await make();await s.replace(plan());now+=60000;await s.tick();expect(calls).toBe(1);s=await make();await s.tick();expect(calls).toBe(1);await s.cancel();expect(s.status.pending).toBe(0);const p=plan();p.events[0].id='upari-late';p.events[0].at=now;await s.replace(p);now+=70000;await s.tick();expect(calls).toBe(1);expect(s.status.delivered.at(-1).status).toBe('expired');}finally{await rm(dir,{recursive:true,force:true});}});
  it('keeps a filter rejection from being sent again',async()=>{const dir=await mkdtemp(join(tmpdir(),'upari-filter-'));try{let now=start,calls=0;const s=await createScheduler({file:join(dir,'s.json'),now:()=>now,filters:async()=>false,send:async()=>{calls++;}});await s.replace(plan());now+=60000;await s.tick();await s.tick();expect(calls).toBe(0);expect(s.status.delivered.at(-1).status).toBe('filtered');}finally{await rm(dir,{recursive:true,force:true});}});
});
