import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { createTransport } from './transports.mjs';
import { createScheduler } from './core.mjs';
const key=process.env.UPARI_BRIDGE_TOKEN,origin=process.env.UPARI_ALLOWED_ORIGIN;
if(!key||key.length<32||!origin)throw new Error('Set UPARI_BRIDGE_TOKEN (32+ characters) and UPARI_ALLOWED_ORIGIN.');
const transport=createTransport(process.env);
const scheduler=await createScheduler({file:process.env.UPARI_STATE_FILE??'./bridge-data/state.json',filters:async()=>{
  if(process.env.UPARI_PRESENCE_ENTITY&&(await transport.entity(process.env.UPARI_PRESENCE_ENTITY))!=='home')return false;
  if(process.env.UPARI_WEATHER_ENTITY&&['rainy','pouring','snowy','lightning','lightning-rainy'].includes(await transport.entity(process.env.UPARI_WEATHER_ENTITY)))return false;
  return true;
},send:transport.send});
const authorized=req=>{const supplied=Buffer.from(req.headers.authorization??''),expected=Buffer.from('Bearer '+key);return supplied.length===expected.length&&timingSafeEqual(supplied,expected);};
const server=createServer(async(req,res)=>{
  if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403).end();return;}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, PUT, DELETE, OPTIONS');res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  if(!authorized(req)){res.writeHead(401).end(JSON.stringify({error:'Unauthorized'}));return;}
  // May be mounted under /upari by a reverse proxy that strips the prefix.
  const path=new URL(req.url,'http://localhost').pathname;
  try{
    if(req.method==='GET'&&path==='/status'){res.end(JSON.stringify({...scheduler.status,channel:transport.channel}));return;}
    if(req.method==='DELETE'&&path==='/plan'){res.end(JSON.stringify(await scheduler.cancel()));return;}
    if(req.method==='PUT'&&path==='/plan'){
      let text='';for await(const part of req){text+=part.toString();if(text.length>20000){res.writeHead(413).end();return;}}
      res.end(JSON.stringify(await scheduler.replace(JSON.parse(text))));return;
    }
    res.writeHead(404).end(JSON.stringify({error:'Not found'}));
  }catch(e){res.writeHead(400).end(JSON.stringify({error:e.message}));}
});
const timer=setInterval(()=>scheduler.tick().catch(e=>console.error('Scheduler error:',e.message)),5000);
server.listen(+(process.env.UPARI_PORT??8787),process.env.UPARI_HOST??'127.0.0.1',()=>console.log('Upari bridge listening.'));
function shutdown(){clearInterval(timer);server.close();}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
