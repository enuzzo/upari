import {expect,it} from 'vitest';
// @ts-expect-error Server-side module is plain ESM.
import {createTransport} from './transports.mjs';
const base={UPARI_APP_URL:'https://upari.example/app/',UPARI_ALLOWED_ORIGIN:'https://upari.example'};
it('sends Gotify auth in a header with a stable event ID, never URL parameters',async()=>{
  const calls:any[]=[];const t=createTransport({...base,UPARI_CHANNEL:'gotify',UPARI_GOTIFY_URL:'https://gotify.example/sub',UPARI_GOTIFY_TOKEN:'test-token'},async(url:any,options:any)=>{calls.push({url:String(url),...options});return {ok:true};});
  await t.send({id:'upari-event',message:'Test fixture',at:1,expires:2});expect(calls[0].url).toBe('https://gotify.example/sub/message');expect(calls[0].headers['X-Gotify-Key']).toBe('test-token');expect(JSON.parse(calls[0].body).extras['upari::event'].id).toBe('upari-event');expect(calls[0].redirect).toBe('error');
});
it('webhook schema and failures are bounded and do not log a server body or token',async()=>{
  let body:any;const t=createTransport({...base,UPARI_CHANNEL:'webhook',UPARI_WEBHOOK_URL:'https://hook.example/notify'},async(_:any,o:any)=>{body=JSON.parse(o.body);return {ok:false,status:503};});
  await expect(t.send({id:'upari-event',message:'Test fixture',at:1,expires:2})).rejects.toThrow('503');expect(body.version).toBe(1);expect(body.url).toBe('https://upari.example/app/?view=sky');
  expect(()=>createTransport({...base,UPARI_CHANNEL:'webhook',UPARI_WEBHOOK_URL:'https://hook.example/?token=secret'})).toThrow();expect(()=>createTransport({...base,UPARI_CHANNEL:'gotify',UPARI_PRESENCE_ENTITY:'person.fixture'})).toThrow();
});
