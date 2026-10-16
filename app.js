const $=s=>document.querySelector(s);
let saved=+localStorage.getItem('pa_saved')||0, history=[];
const getKey=()=>localStorage.getItem('pa_key')||'';
const MIN={email:8,notes:15,plan:10,research:20,chat:3};

function bump(f){saved+=MIN[f];localStorage.setItem('pa_saved',saved);$('#saved').textContent=saved;}
function mode(){$('#mode').textContent=getKey()?'Live AI mode: powered by Google Gemini.':'Demo mode (offline templates). Add a free Gemini API key in Settings for full AI.';}
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function md(t){
  let h=esc(t).replace(/^## (.*)$/gm,'<h4>$1</h4>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  h=h.replace(/(^|\n)((?:[-*] .*(?:\n|$))+)/g,(_,a,b)=>a+'<ul>'+b.trim().split('\n').map(x=>'<li>'+x.replace(/^[-*] /,'')+'</li>').join('')+'</ul>');
  return h.replace(/<\/(h4|ul)>\n/g,'</$1>');
}
function pii(text){
  const hits=[];
  if(/\b\d{13}\b/.test(text))hits.push('a possible ID number');
  if(/\b(?:\d[ -]?){15}\d\b/.test(text))hits.push('a possible card number');
  if(/[\w.+-]+@[\w-]+\.[\w.]+/.test(text))hits.push('an email address');
  if(/(\+27|\b0)[6-8]\d[ -]?\d{3}[ -]?\d{4}\b/.test(text))hits.push('a phone number');
  const w=$('#pii');w.hidden=!hits.length;
  if(hits.length)w.textContent='⚠️ Your text may contain '+hits.join(', ')+'. Remove personal or confidential data before sending to an AI service.';
}
async function callAI(system,msgs){
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${$('#model').value}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':getKey()},
    body:JSON.stringify({systemInstruction:{parts:[{text:system}]},
      contents:msgs.map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.text}]})),
      generationConfig:{temperature:.6,maxOutputTokens:1200}})});
  if(!r.ok)throw new Error('API error '+r.status);
  const d=await r.json();
  return (d.candidates?.[0]?.content?.parts||[]).map(p=>p.text).join('')||'(empty response)';
}
async function ask(system,user,fallback){
  if(getKey()){try{return {text:await callAI(system,[{role:'user',text:user}]),live:true};}
    catch(e){return {text:fallback(),live:false,err:e.message};}}
  return {text:fallback(),live:false};
}
async function run(feat,btn,out,system,user,fallback,rawInput){
  pii(rawInput);btn.disabled=true;const old=btn.textContent;btn.textContent='Working...';
  const r=await ask(system,user,fallback);
  out.innerHTML=`<span class="tag ${r.live?'':'demo'}">${r.live?'Gemini':'Demo mode'}</span>${r.err?`<span class="tag demo">${esc(r.err)}, used demo</span>`:''}<button class="ghost copy">Copy</button><div class="res">${md(r.text)}</div><small>Draft only. Review before use.</small>`;
  out.querySelector('.copy').onclick=e=>{navigator.clipboard.writeText(r.text);e.target.textContent='Copied';};
  bump(feat);btn.disabled=false;btn.textContent=old;
}
const need=(v,el,msg)=>{if(!v.trim()){alert(msg);el.focus();return false}return true};

$('#e-go').onclick=()=>{
  const f={aud:$('#e-aud').value,tone:$('#e-tone').value,rec:$('#e-rec').value,me:$('#e-me').value,purpose:$('#e-purpose').value,points:$('#e-points').value};
  if(!need(f.purpose,$('#e-purpose'),'Please enter the purpose of the email.'))return;
  run('email',$('#e-go'),$('#e-out'),PROMPTS.email(f),`Purpose: ${f.purpose}\nKey points:\n${f.points}`,()=>localEmail(f),f.purpose+f.points);
};
$('#n-go').onclick=()=>{const t=$('#n-in').value;if(!need(t,$('#n-in'),'Paste some notes first.'))return;
  run('notes',$('#n-go'),$('#n-out'),PROMPTS.notes,t,()=>localNotes(t),t);};
$('#n-sample').onclick=()=>{$('#n-in').value=`Weekly collections review, 14 Oct. Attendees: Thandi, Sipho, Lerato. Arrears on student loan accounts rose 4% this month. Lerato will contact the 30 highest-balance accounts by Friday. The team agreed to trial SMS reminders before calling. Sipho needs to update the script and share it by Wednesday. Decided that promise-to-pay follow-ups happen within 24 hours. Thandi to report results at the next review on 21 Oct. Risk: call volumes may spike at month end.`;};
$('#p-go').onclick=()=>{const t=$('#p-in').value;if(!need(t,$('#p-in'),'Add at least one task.'))return;
  const f={start:$('#p-start').value||'08:00',hours:+$('#p-hours').value||8,text:t};
  run('plan',$('#p-go'),$('#p-out'),PROMPTS.plan(f),t,()=>localPlan(f),t);};
$('#r-go').onclick=()=>{const t=$('#r-in').value;if(!need(t,$('#r-in'),'Paste text or enter a topic.'))return;
  const f={level:$('#r-level').value,text:t};
  run('research',$('#r-go'),$('#r-out'),PROMPTS.research(f),t,()=>localResearch(f),t);};

function bubble(t,who){const d=document.createElement('div');d.className='msg '+who;d.textContent=t;$('#c-log').append(d);$('#c-log').scrollTop=1e9;return d;}
async function send(){
  const q=$('#c-in').value.trim();if(!q)return;$('#c-in').value='';pii(q);
  bubble(q,'me');history.push({role:'user',text:q});const b=bubble('...','bot');let a;
  try{a=getKey()?await callAI(PROMPTS.chat,history.slice(-10)):localChat(q);}catch(e){a=localChat(q)+'\n(API error, demo reply)';}
  b.textContent=a;history.push({role:'model',text:a});bump('chat');
}
$('#c-go').onclick=send;$('#c-in').onkeydown=e=>{if(e.key==='Enter')send();};
$('#c-clear').onclick=()=>{history=[];$('#c-log').innerHTML='';bubble('Chat cleared. How can I help?','bot');};

document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button,.panel').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');$('#'+b.dataset.tab).classList.add('on');$('#pii').hidden=true;});
$('#s-key').value=getKey();
$('#s-save').onclick=()=>{localStorage.setItem('pa_key',$('#s-key').value.trim());mode();alert('Saved.');};
$('#s-clear').onclick=()=>{localStorage.removeItem('pa_key');$('#s-key').value='';mode();};
$('#saved').textContent=saved;mode();
