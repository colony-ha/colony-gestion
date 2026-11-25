export interface Env { DB: D1Database; ADMIN_BOOTSTRAP_SECRET: string; APP_ORIGIN?: string }
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
const enc=new TextEncoder();
const b64=(b:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=(n=32)=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return b64(b.buffer)};
async function digest(s:string){return b64(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
async function hash(p:string,salt=random(16)){const key=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(atob(salt.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)),iterations:210000,hash:'SHA-256'},key,256);return {salt,hash:b64(bits)}}
async function verify(p:string,salt:string,expected:string){return (await hash(p,salt)).hash===expected}
const schema=[
`CREATE TABLE IF NOT EXISTS cgx_users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,email_norm TEXT NOT NULL UNIQUE,phone TEXT NOT NULL,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS cgx_admins(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,email_norm TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS cgx_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT,admin_id TEXT,role TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS cgx_sessions_expiry ON cgx_sessions(expires_at)`
];
async function init(db:D1Database){for(const q of schema)await db.prepare(q).run()}
const now=()=>new Date().toISOString();
async function body(r:Request){try{return await r.json() as any}catch{return {}}}
function cors(req:Request,env:Env){const origin=req.headers.get('Origin')||'';const allowed=[env.APP_ORIGIN||'https://colony-gestion.pages.dev','https://colony-gestion.pages.dev'];return {'Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Vary':'Origin'}}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const headers=cors(req,env);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(req.url).pathname;const send=(d:any,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
 try{
 await init(env.DB);
 if(path==='/'||path==='/health')return send({success:true,message:'COLONY GESTION API is running',database:'Connected'});
 if(path==='/auth/register'&&req.method==='POST'){
  const b=await body(req),name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),phone=String(b.phone||'').trim(),password=String(b.password||'');
  if(!name||!email||!phone||password.length<10)return send({success:false,message:'أكمل جميع المعلومات، وكلمة المرور 10 أحرف على الأقل'},400);
  const id=crypto.randomUUID(),h=await hash(password);
  try{await env.DB.prepare('INSERT INTO cgx_users(id,name,email,email_norm,phone,password_hash,password_salt,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,name,email,email,phone,h.hash,h.salt,'pending',now()).run()}catch{return send({success:false,message:'هذا البريد الإلكتروني مسجل من قبل'},409)}
  const token=random(40);await env.DB.prepare('INSERT INTO cgx_sessions(token_hash,user_id,role,expires_at,created_at) VALUES(?,?,?,?,?)').bind(await digest(token),id,'user',new Date(Date.now()+30*86400000).toISOString(),now()).run();
  return send({success:true,message:'تم إنشاء الحساب. يمكنك معاينة لوحة التحكم حتى تفعيل الحساب.',token,user:{id,name,email,role:'user',status:'pending'}},201)
 }
 if(path==='/auth/login'&&req.method==='POST'){
  const b=await body(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');const u=await env.DB.prepare('SELECT * FROM cgx_users WHERE email_norm=?').bind(email).first<any>();
  if(!u||!(await verify(password,u.password_salt,u.password_hash)))return send({success:false,message:'البريد الإلكتروني أو كلمة المرور غير صحيحة'},401);
  const token=random(40);await env.DB.prepare('INSERT INTO cgx_sessions(token_hash,user_id,role,expires_at,created_at) VALUES(?,?,?,?,?)').bind(await digest(token),u.id,'user',new Date(Date.now()+30*86400000).toISOString(),now()).run();
  return send({success:true,token,user:{id:u.id,name:u.name,email:u.email,role:'user',status:u.status}})
 }
 if(path==='/admin/bootstrap'&&req.method==='POST'){
  const b=await body(req);if(!env.ADMIN_BOOTSTRAP_SECRET||b.secret!==env.ADMIN_BOOTSTRAP_SECRET)return send({success:false,message:'رمز إعداد المدير غير صحيح'},403);
  const email='haniMr_hp@hotmail.com',exists=await env.DB.prepare('SELECT id FROM cgx_admins WHERE email_norm=?').bind(email.toLowerCase()).first();
  if(exists)return send({success:false,message:'تم إعداد حساب المدير مسبقاً. استعمل تسجيل الدخول.'},409);
  const password=String(b.password||'');if(password.length<10)return send({success:false,message:'كلمة المرور يجب أن تكون 10 أحرف على الأقل'},400);
  const h=await hash(password);await env.DB.prepare('INSERT INTO cgx_admins(id,email,email_norm,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),email,email.toLowerCase(),h.hash,h.salt,now()).run();
  return send({success:true,message:'تم إنشاء حساب المدير. سجل الدخول الآن.'},201)
 }
 if(path==='/admin/login'&&req.method==='POST'){
  const b=await body(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
  if(email!=='haniMr_hp@hotmail.com'.toLowerCase())return send({success:false,message:'بيانات المدير غير صحيحة'},401);
  const a=await env.DB.prepare('SELECT * FROM cgx_admins WHERE email_norm=?').bind(email).first<any>();
  if(!a||!(await verify(password,a.password_salt,a.password_hash)))return send({success:false,message:'بيانات المدير غير صحيحة'},401);
  const token=random(40);await env.DB.prepare('INSERT INTO cgx_sessions(token_hash,admin_id,role,expires_at,created_at) VALUES(?,?,?,?,?)').bind(await digest(token),a.id,'admin',new Date(Date.now()+12*3600000).toISOString(),now()).run();
  return send({success:true,token,user:{id:a.id,email:a.email,role:'admin'}})
 }
 if(path==='/auth/me'&&req.method==='GET'){
  const raw=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return send({success:false,message:'غير مسجل الدخول'},401);
  const s=await env.DB.prepare('SELECT * FROM cgx_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(raw),now()).first<any>();if(!s)return send({success:false,message:'انتهت الجلسة'},401);
  const u=s.role==='admin'?await env.DB.prepare('SELECT id,email FROM cgx_admins WHERE id=?').bind(s.admin_id).first():await env.DB.prepare('SELECT id,name,email,status FROM cgx_users WHERE id=?').bind(s.user_id).first();
  return send({success:true,user:{...u,role:s.role}})
 }
 return send({success:false,message:'المسار غير موجود'},404)
 }catch(e){return send({success:false,message:'حدث خطأ داخلي. حاول مجدداً.'},500)}
}};
