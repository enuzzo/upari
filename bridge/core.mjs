import { mkdir,readFile,writeFile,rename } from 'node:fs/promises';
import { dirname } from 'node:path';
export function validatePlan(body,now=Date.now()) {
  if(!body||body.version!==1||!Array.isArray(body.events)||body.events.length>12)throw new Error('Invalid plan schema');
  const expires=Date.parse(body.expires),epoch=Date.parse(body.epoch);
  if(!Number.isFinite(expires)||expires<=now||expires>now+48*3600000+60000)throw new Error('Plan expires outside the permitted window');
  if(!Number.isFinite(epoch)||epoch>now+86400000||now-epoch>48*3600000)throw new Error('Orbital epoch too old for notifications');
  const ids=new Set();
  const events=body.events.map(e=>{
    if(!e||typeof e.id!=='string'||!/^upari-[A-Za-z0-9_-]{1,100}$/.test(e.id)||ids.has(e.id)||!Number.isFinite(e.at)||e.at>expires||e.at<now-60000||!Number.isFinite(e.expires)||e.expires<=e.at||e.expires>now+49*3600000||typeof e.message!=='string'||!e.message.length||e.message.length>700)throw new Error('Invalid notification event');
    ids.add(e.id);return {id:e.id,at:e.at,expires:e.expires,message:e.message};
  });
  return {version:1,generatedAt:new Date(now).toISOString(),expires:new Date(expires).toISOString(),epoch:body.epoch,placeId:String(body.placeId??'').slice(0,100),events};
}
export async function createScheduler({file,send,now=()=>Date.now(),filters=async()=>true}) {
  let state={plan:null,delivered:[]};
  try{state=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(state.delivered))throw new Error('Invalid stored state');}catch(e){if(e.code!=='ENOENT')throw e;}
  let work=Promise.resolve();
  const save=async()=>{await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(state),{mode:0o600});await rename(file+'.tmp',file);};
  const locked=fn=>{const next=work.catch(()=>{}).then(fn);work=next;return next;};
  return {
    get status(){return {version:1,expires:state.plan?.expires??null,pending:state.plan?.events.filter(e=>!state.delivered.some(x=>x.id===e.id)).length??0,delivered:state.delivered.slice(-20)};},
    replace:body=>locked(async()=>{state.plan=validatePlan(body,now());await save();return {accepted:state.plan.events.length,expires:state.plan.expires};}),
    cancel:()=>locked(async()=>{state.plan=null;await save();return {cancelled:true};}),
    tick:()=>locked(async()=>{
      if(!state.plan||Date.parse(state.plan.expires)<=now())return;
      for(const e of state.plan.events){if(e.at>now()||state.delivered.some(x=>x.id===e.id))continue;
        const item={id:e.id,at:now(),status:'claimed'};state.delivered.push(item);state.delivered=state.delivered.slice(-200);await save();
        // Claim before sending: at-most-once delivery, even if the process dies after HTTP submission.
        if(now()-e.at>60000||now()>e.expires){item.status='expired';await save();continue;}
        try{if(!(await filters())){item.status='filtered';await save();continue;}await send(e);item.status='sent';}catch(err){item.status='failed';item.error=String(err.message??err).slice(0,120);}
        await save();
      }
    })
  };
}
