// Offline "demo mode" engines so the app works without an API key.
const sents = t => t.replace(/\s+/g,' ').split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>3);
const words = t => (t.toLowerCase().match(/[a-z']{4,}/g)||[]);
const STOP = new Set('that this with from have will were been they their there which about would could should into than then them what when your also more some very just over only like such'.split(' '));
function topSentences(t,n){
  const f={}; words(t).forEach(w=>{if(!STOP.has(w))f[w]=(f[w]||0)+1});
  const S=sents(t);
  const scored=S.map((s,i)=>({s,i,v:words(s).reduce((a,w)=>a+(f[w]||0),0)/Math.sqrt(words(s).length+1)}));
  return scored.sort((a,b)=>b.v-a.v).slice(0,n).sort((a,b)=>a.i-b.i).map(x=>x.s);
}
const li = a => a.length ? a.map(x=>'- '+x).join('\n') : '- None identified';

function localEmail(f){
  const t=f.tone, r=f.rec||(t==='formal'?'Sir/Madam':'there');
  const greet={formal:`Dear ${r},`,informal:`Hi ${r},`,persuasive:`Hi ${r},`}[t];
  const open={formal:'I hope this message finds you well.',informal:'Hope you are doing well!',persuasive:'I am writing because I believe this will be valuable for you.'}[t];
  const pts=f.points.split('\n').map(s=>s.trim()).filter(Boolean);
  const body=pts.length?'\n'+pts.map(p=>'• '+p).join('\n')+'\n':'';
  const cta={Client:'Please let me know a suitable time to discuss, or reply to confirm.',Manager:'Could you confirm how you would like me to proceed?',Team:'Please share your input by end of day so we can keep moving.'}[f.aud];
  const close={formal:'Kind regards,',informal:'Thanks,',persuasive:'Looking forward to working together,'}[t];
  return `Subject: ${f.purpose||'Quick update'}\n\n${greet}\n\n${open} ${f.purpose?`I am reaching out regarding: ${f.purpose.toLowerCase()}.`:''}\n${body}\n${cta}\n\n${close}\n${f.me||'[Your name]'}\n\nTone check: ${t} tone for a ${f.aud.toLowerCase()} audience.`;
}

function localNotes(t){
  const S=sents(t);
  const act=S.filter(s=>/\b(will|action|needs? to|must|should|assigned|follow up|please|to do)\b/i.test(s));
  const dec=S.filter(s=>/\b(decided|agreed|approved|confirmed|resolved)\b/i.test(s));
  const dl=S.filter(s=>/\b(by|before|due|deadline|until)\b/i.test(s)&&/(mon|tues|wednes|thurs|fri|satur|sun)day|\b\d{1,2}(st|nd|rd|th)?\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week|month|eod|eow/i.test(s));
  return `## Summary\n${topSentences(t,3).join(' ')}\n\n## Key Points\n${li(topSentences(t,5))}\n\n## Decisions\n${li(dec)}\n\n## Action Items\n${li(act)}\n\n## Deadlines & Risks\n${li(dl)}`;
}

function localPlan(f){
  const lines=f.text.split('\n').map(s=>s.trim()).filter(Boolean);
  const tasks=lines.map(l=>{
    const p=l.split('|').map(s=>s.trim());
    let u=+p[1],i=+p[2],m=+p[3];
    if(!u) u=/urgent|asap|today|now|overdue/i.test(l)?5:3;
    if(!i) i=/client|deadline|report|boss|manager|important|launch/i.test(l)?5:3;
    if(!m) m=30;
    return {name:p[0],u,i,m};
  }).filter(t=>t.name);
  const q=t=>t.u>=4&&t.i>=4?'Do now':t.i>=4?'Schedule':t.u>=4?'Delegate / quick-win':'Drop or defer';
  tasks.sort((a,b)=>(b.u+b.i*1.2)-(a.u+a.i*1.2));
  let [h,m]=f.start.split(':').map(Number), cur=h*60+m, end=cur+f.hours*60, run=0;
  const fmt=x=>String(Math.floor(x/60)%24).padStart(2,'0')+':'+String(x%60).padStart(2,'0');
  const sched=[],over=[];
  for(const t of tasks){
    if(run>=90){sched.push(`${fmt(cur)}-${fmt(cur+10)}  Break`);cur+=10;run=0;}
    if(cur+t.m>end){over.push(t.name);continue;}
    sched.push(`${fmt(cur)}-${fmt(cur+t.m)}  ${t.name}`);cur+=t.m;run+=t.m;
  }
  return `## Priority Matrix\n${tasks.map(t=>`- ${t.name}: ${q(t)} (urgency ${t.u}, importance ${t.i})`).join('\n')}\n\n## Time-Blocked Schedule\n${li(sched)}${over.length?`\n\n⚠️ Does not fit today: ${over.join(', ')}`:''}\n\n## Time Optimisation Tips\n- Put your highest-importance task in your first focused block.\n- Batch similar tasks (emails, calls) into one slot.\n- Silence notifications during deep-work blocks.`;
}

function localResearch(f){
  const t=f.text, S=topSentences(t,5);
  const short=t.trim().split(/\s+/).length<25;
  if(short) return `## TL;DR\nTopic: "${t.trim()}". Offline demo mode cannot research topics.\n\n## Next Step\nAdd a Gemini API key in Settings, or paste the article text to summarize.\n\n## Verify Before Use\nAlways check claims against a trusted source.`;
  return `## TL;DR\n${S.slice(0,2).join(' ')}\n\n## Key Insights\n${li(S)}\n\n## In Plain Language\nFor ${f.level}: ${S[0]}\n\n## Recommendations\n- Decide which insight affects your current goal.\n- Compare with a second source.\n- Note open questions to follow up.\n\n## Verify Before Use\n- Check any statistics, dates and names against the original source.`;
}

function localChat(q){
  const s=q.toLowerCase();
  if(/email|mail|message/.test(s)) return 'Open the ✉️ Email tab: pick audience and tone, add 2-3 key points, and I will draft it. Tip: put the request in the first two lines.';
  if(/meeting|minutes|notes/.test(s)) return 'Paste your notes in 📝 Meeting Notes and I will pull out decisions, owners and deadlines. Tip: end every meeting by reading the actions aloud.';
  if(/plan|schedule|prioriti|time|busy|overwhelm/.test(s)) return 'Try 🗓️ Planner: list tasks with urgency and importance. Rule of thumb: do important-and-urgent first, schedule important-not-urgent, delegate the rest.';
  if(/research|summar|article|report/.test(s)) return 'Use 🔎 Research: paste the text and choose your audience. I will give a TL;DR, key insights and what to verify.';
  return 'Demo mode gives guided help only. Add a Gemini API key in Settings for open-ended answers. Meanwhile, which task fits: email, meeting notes, planning or research?';
}
