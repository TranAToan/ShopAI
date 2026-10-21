import 'dotenv/config';
async function main() {
  const key=process.env.GEMINI_API_KEY;
  const model=process.env.GEMINI_MODEL;
  if(!key || !model) { console.log(JSON.stringify({configured:false}));process.exitCode=2;return; }
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`,{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(15000)});
  const data=await res.json() as {supportedGenerationMethods?:string[]};
  const supported=res.ok && !!data.supportedGenerationMethods?.includes('generateContent');
  console.log(JSON.stringify({model,httpStatus:res.status,generateContentSupported:supported}));
  if(!supported) process.exitCode=2;
}
main().catch(()=>{console.log(JSON.stringify({networkError:true}));process.exitCode=2;});
