/** Exactly one configured outbound channel. Secrets and destinations remain server-side. */
export function channelURL(raw){
  const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw new Error('Invalid channel URL');return u;
}
export function createTransport(env,request=fetch){
  const channel=env.UPARI_CHANNEL??'ha',app=channelURL(env.UPARI_APP_URL??env.UPARI_ALLOWED_ORIGIN);
  const open=new URL(app);open.searchParams.set('view','sky');
  const post=async(url,headers,body)=>{const r=await request(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw new Error('Notification rejected: '+r.status);};
  if(channel==='ha'){
    const ha=channelURL(env.UPARI_HA_URL),token=env.UPARI_HA_TOKEN,service=env.UPARI_HA_SERVICE;
    if(!token||!/^notify\.mobile_app_[a-z0-9_]+$/.test(service??''))throw new Error('Configure Home Assistant token and mobile_app service');
    const headers={Authorization:'Bearer '+token};const [,name]=service.split('.');
    return {channel,entity:async id=>{const r=await request(new URL('/api/states/'+encodeURIComponent(id),ha),{headers,signal:AbortSignal.timeout(10000),redirect:'error'});if(!r.ok)throw new Error('HA entity filter unavailable');return (await r.json()).state;},send:e=>post(new URL('/api/services/notify/'+name,ha),headers,{title:'Upari · ISS',message:e.message,data:{tag:e.id,url:open.href,actions:[{action:'URI',title:'Apri il cielo',uri:open.href}]}})};
  }
  if(env.UPARI_PRESENCE_ENTITY||env.UPARI_WEATHER_ENTITY)throw new Error('Presence/weather filters require the HA channel');
  if(channel==='gotify'){
    const base=channelURL(env.UPARI_GOTIFY_URL);if(!env.UPARI_GOTIFY_TOKEN)throw new Error('Configure Gotify application token');
    return {channel,send:e=>post(new URL(base.href.replace(/\/$/,'')+'/message'),{'X-Gotify-Key':env.UPARI_GOTIFY_TOKEN},{title:'Upari · ISS',message:e.message,priority:5,extras:{'client::notification':{click:{url:open.href}},'upari::event':{id:e.id,expires:e.expires}}})};
  }
  if(channel==='webhook'){
    const endpoint=channelURL(env.UPARI_WEBHOOK_URL);if(endpoint.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(endpoint.hostname))throw new Error('Webhook must use HTTPS (except loopback tests)');
    return {channel,send:e=>post(endpoint,env.UPARI_WEBHOOK_TOKEN?{Authorization:'Bearer '+env.UPARI_WEBHOOK_TOKEN}:{},{version:1,id:e.id,at:e.at,expires:e.expires,title:'Upari · ISS',message:e.message,url:open.href})};
  }
  throw new Error('Choose one UPARI_CHANNEL: ha, gotify or webhook');
}
