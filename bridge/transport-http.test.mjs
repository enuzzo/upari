import {it,expect} from 'vitest';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createTransport} from './transports.mjs';
import {createScheduler} from './core.mjs';

it('uses real loopback HTTP, persists partial failures and cancels without duplicate delivery after restart',async()=>{
  const received=[],server=createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);received.push({path:req.url,body,authorization:req.headers.authorization,key:req.headers['x-gotify-key']});res.writeHead(body.id==='upari-fail'?503:200);res.end('{}');});
  const dir=await mkdtemp(join(tmpdir(),'upari-http-'));let started=false;
  try{
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{started=true;resolve();});});
    const base='http://127.0.0.1:'+server.address().port,common={UPARI_ALLOWED_ORIGIN:'https://upari.example'},event={id:'upari-success',at:1000,expires:3000,message:'Technical loopback fixture'};
    await createTransport({...common,UPARI_CHANNEL:'gotify',UPARI_GOTIFY_URL:base+'/gotify',UPARI_GOTIFY_TOKEN:'synthetic-test-key'}).send(event);
    await createTransport({...common,UPARI_HA_URL:base,UPARI_HA_TOKEN:'synthetic-test-key',UPARI_HA_SERVICE:'notify.mobile_app_test'}).send(event);
    expect(received[0].path).toBe('/gotify/message');expect(received[0].key).toBe('synthetic-test-key');expect(received[1].path).toBe('/api/services/notify/mobile_app_test');
    received.length=0;let now=Date.parse('2026-10-11T16:00:00Z');const start=now,transport=createTransport({...common,UPARI_CHANNEL:'webhook',UPARI_WEBHOOK_URL:base+'/hook',UPARI_WEBHOOK_TOKEN:'synthetic-test-key'});
    const make=()=>createScheduler({file:join(dir,'state.json'),now:()=>now,send:transport.send});let scheduler=await make();
    const plan={version:1,epoch:new Date(start).toISOString(),expires:new Date(start+48*3600000).toISOString(),events:['fail','success','cancelled'].map((name,i)=>({id:'upari-'+name,at:start+(i<2?1000:120000),expires:start+300000,message:'Technical loopback fixture'}))};
    await scheduler.replace(plan);now+=1000;await scheduler.tick();expect(received.map(e=>e.body.id)).toEqual(['upari-fail','upari-success']);expect(scheduler.status.delivered.map(e=>e.status)).toEqual(['failed','sent']);
    scheduler=await make();await scheduler.tick();expect(received).toHaveLength(2);await scheduler.cancel();now+=120000;await scheduler.tick();expect(received).toHaveLength(2);expect(scheduler.status.pending).toBe(0);
    expect(received.every(e=>e.path==='/hook'&&e.authorization==='Bearer synthetic-test-key')).toBe(true);
  }finally{if(started)await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
},10000);
