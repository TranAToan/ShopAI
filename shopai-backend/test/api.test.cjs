const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const path=require('node:path');
const crypto=require('node:crypto');
const {JwtService}=require('@nestjs/jwt');
const {PrismaClient}=require('@prisma/client');
const secret=crypto.randomBytes(40).toString('hex');
const database=path.resolve('test',`api-${Date.now()}.db`).replaceAll('\\','/');
const env={...process.env,PORT:'3101',DATABASE_URL:`file:${database}`,JWT_SECRET:secret,RATE_LIMIT:'1000',GEMINI_API_KEY:'',PRISMA_SCHEMA_ENGINE_BINARY:path.resolve('node_modules/@prisma/engines/schema-engine-windows.exe')};
let server,token,otherToken,orderId,userId;
const base='http://127.0.0.1:3101';
async function request(route,method='GET',body,bearer=token,headers={}) {
  const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(bearer?{Authorization:`Bearer ${bearer}`} : {}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  let data;try {data=await res.json();} catch {data={};}
  return {status:res.status,data,headers:res.headers};
}
async function start() {
  server=spawn(process.execPath,['dist/src/main.js'],{env,stdio:'ignore'});
  for(let i=0;i<100;i++) {
    if(server.exitCode!==null) throw new Error('Backend exited during test startup');
    try {if((await fetch(base+'/api/health')).ok) return;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('Backend health timeout');
}
async function stop() { if(server && server.exitCode===null) { const exited=new Promise(r=>server.once('exit',r));server.kill();await exited; } }
before(async()=>{
  const db=new (require('node:sqlite').DatabaseSync)(database);db.exec('PRAGMA user_version=0');db.close();
  execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env,stdio:'pipe'});
  await start();
});
after(stop);
test('catalog has 20 stable IDs, detail/404, strict validation, Helmet and Swagger',async()=>{
  const a=await request('/api/products'); const b=await request('/api/products');
  assert.equal(a.status,200);assert.equal(a.data.length,20);assert.deepEqual(a.data,b.data);
  assert.equal((await request('/api/products/backend_prod_0')).status,200);
  assert.equal((await request('/api/products/missing')).status,404);
  assert.equal((await request('/api/products','POST',{name:'',price:-100,image:'invalid'})).status,400);
  assert.equal(a.headers.get('x-content-type-options'),'nosniff');
  assert.equal((await fetch(base+'/api/docs')).status,200);
  const schema=await (await fetch(base+'/api/docs-json')).json();
  assert.ok(schema.paths['/api/orders/{id}/pay']);
});
test('register/login uses bcrypt and JWT; duplicate 409, wrong password 401',async()=>{
  const result=await request('/api/auth/register','POST',{email:'test@shopai.com',password:'123456',name:'Test user'},null);
  assert.equal(result.status,201);token=result.data.accessToken;userId=result.data.user.id;
  assert.equal((await request('/api/auth/register','POST',{email:'test@shopai.com',password:'123456'},null)).status,409);
  assert.equal((await request('/api/auth/login','POST',{email:'test@shopai.com',password:'wrongpassword'},null)).status,401);
  const login=await request('/api/auth/login','POST',{email:'TEST@SHOPAI.COM',password:'123456'},null);
  assert.equal(login.status,200);assert.equal(new JwtService({secret}).verify(login.data.accessToken).sub,userId);
  const db=new PrismaClient({datasourceUrl:env.DATABASE_URL});
  const user=await db.user.findUnique({where:{id:userId}});assert.match(user.password,/^\$2[ab]\$/);await db.$disconnect();
  otherToken=(await request('/api/auth/register','POST',{email:'other@shopai.com',password:'123456'},null)).data.accessToken;
});
test('missing, forged and expired JWT rejected',async()=>{
  const jwt=new JwtService({secret});
  for(const bad of [null,'mock_token_123',jwt.sign({sub:userId,exp:1}),new JwtService({secret:'wrong'}).sign({sub:userId})]) {
    assert.equal((await request('/api/orders','GET',undefined,bad)).status,401);
  }
});
const valid={items:[{productId:'backend_prod_0',quantity:2}],total:2000000};
test('reject forged total, fractional/negative quantities, missing products and extra fields',async()=>{
  for(const bad of [{...valid,total:1},{items:[{productId:'backend_prod_0',quantity:1.5}],total:1500000},{items:[{productId:'backend_prod_0',quantity:-1}],total:1},{items:[{productId:'missing',quantity:1}],total:1},{...valid,isAdmin:true},{items:[],total:1}]) {
    assert.equal((await request('/api/orders','POST',bad)).status,400);
  }
});
test('create PENDING with snapshot, concurrent replay idempotent, mismatched replay 409',async()=>{
  const key={'Idempotency-Key':'test_order_request_001'};
  const [a,b]=await Promise.all([request('/api/orders','POST',valid,token,key),request('/api/orders','POST',valid,token,key)]);
  assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(a.data.id,b.data.id);
  orderId=a.data.id;assert.equal(a.data.status,'PENDING');assert.equal(a.data.items[0].price,1000000);
  assert.equal((await request('/api/orders')).data.length,1);
  assert.equal((await request('/api/orders','POST',{...valid,total:5},token,key)).status,409);
});
test('ownership enforced for history, detail and pay; payment is idempotent',async()=>{
  assert.equal((await request('/api/orders','GET',undefined,otherToken)).data.length,0);
  assert.equal((await request('/api/orders/'+orderId,'GET',undefined,otherToken)).status,404);
  assert.equal((await request('/api/orders/'+orderId+'/pay','POST',undefined,otherToken)).status,404);
  assert.equal((await request('/api/orders/'+orderId+'/pay','POST')).data.status,'PAID');
  assert.equal((await request('/api/orders/'+orderId+'/pay','POST')).data.status,'PAID');
});
test('database persists after actual backend process restart',async()=>{
  await stop();await start();
  const result=await request('/api/orders/'+orderId);
  assert.equal(result.status,200);assert.equal(result.data.status,'PAID');assert.equal(result.data.items[0].quantity,2);
});
test('AI requires auth, validates body/history, and fails honestly without key',async()=>{
  assert.equal((await request('/api/ai/chat','POST',{message:'hello'},null)).status,401);
  assert.equal((await request('/api/ai/chat','POST',{message:'',history:[]})).status,400);
  assert.equal((await request('/api/ai/chat','POST',{message:'test',history:[{role:'admin',text:'x'}]})).status,400);
  assert.equal((await request('/api/ai/chat','POST',{message:'hello',history:[]})).status,503);
});
test('AI endpoint enforces rate limit with HTTP 429',async()=>{
  const statuses=[];
  for(let i=0;i<7;i++) statuses.push((await request('/api/ai/chat','POST',{message:'test'})).status);
  assert.ok(statuses.includes(429));
});
