const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {AiService}=require('../dist/src/ai/ai.module');
const {ProductService}=require('../dist/src/product/product.module');
const original=global.fetch;
const originalTimeout=global.setTimeout;
const service=()=>new AiService({get:key=>({GEMINI_API_KEY:'private-test-key',GEMINI_MODEL:'test-model'})[key]},new ProductService());
afterEach(()=>{global.fetch=original;global.setTimeout=originalTimeout;});
test('server sends verified catalog and history, excludes thought text',async()=>{
  let payload;
  global.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'hidden',thought:true},{text:'1.000.000 VND'}]}}]})};};
  assert.deepEqual(await service().chat({message:'price?',history:[{role:'user',text:'previous'},{role:'model',text:'reply'}]}),{reply:'1.000.000 VND'});
  assert.equal(payload.contents.length,3);assert.equal(payload.contents[2].parts[0].text,'price?');
  assert.match(payload.systemInstruction.parts[0].text,/backend_prod_0/);
  assert.match(payload.systemInstruction.parts[0].text,/1000000/);
});
test('provider 429, safety block and offline become sanitized HTTP errors',async()=>{
  global.fetch=async()=>({ok:false,status:429});
  await assert.rejects(service().chat({message:'test'}),error=>error.getStatus()===429);
  global.fetch=async()=>({ok:true,status:200,json:async()=>({promptFeedback:{blockReason:'SAFETY'}})});
  await assert.rejects(service().chat({message:'test'}),error=>error.getStatus()===502);
  global.fetch=async()=>{throw new Error('secret-bearing-provider-details');};
  await assert.rejects(service().chat({message:'test'}),error=>error.getStatus()===502 && !error.message.includes('secret-bearing'));
});
test('invalid alternating history is rejected before contacting provider',async()=>{
  let calls=0;global.fetch=async()=>{calls++;};
  await assert.rejects(service().chat({message:'test',history:[{role:'model',text:'bad'}]}),error=>error.getStatus()===400);
  assert.equal(calls,0);
});
test('provider timeout aborts fetch and becomes HTTP 504',async()=>{
  global.setTimeout=(callback,ms,...args)=>originalTimeout(callback,ms===25000?1:ms,...args);
  global.fetch=async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))));
  await assert.rejects(service().chat({message:'test'}),error=>error.getStatus()===504);
});
