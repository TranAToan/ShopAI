const fs=require('node:fs');
async function main() {
  const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo@shopai.com',password:'123456'})});
  const auth=await login.json();
  if(!login.ok) throw new Error('Demo login failed');
  const res=await fetch(base+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth.accessToken}`},body:JSON.stringify({message:'Điện thoại ShopAI 1 giá bao nhiêu? Chỉ báo giá trong catalog.',history:[]}),signal:AbortSignal.timeout(35000)});
  const data=await res.json();
  const result={testedAt:new Date().toISOString(),base,loginStatus:login.status,aiStatus:res.status,reply:res.ok?data.reply:undefined,error:res.ok?undefined:data.message};
  fs.writeFileSync('../artifacts/chapter9-10/gemini-live.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));if(!res.ok) process.exitCode=2;
}
main().catch(()=>{console.error('Live smoke failed: local/backend/provider connectivity.');process.exitCode=2;});
