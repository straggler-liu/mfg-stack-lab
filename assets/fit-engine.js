function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)));}
function val(fd,k){return String(fd.get(k)||'');}
function add(scores,key,n){scores[key]+=n;}
function buildFit(){
  const form=document.getElementById('fit-form'); if(!form)return;
  const fd=new FormData(form); const required=['company','email','employees','model','stack','channels','bom','planning','traceability','locations','inventory','qbo','shopify','budget','timeline'];
  const missing=required.filter(k=>!val(fd,k)); const out=document.getElementById('fit-result');
  if(missing.length){out.style.display='block';out.innerHTML='<b>Complete all required fields.</b><p>No answers are transmitted until you choose to send the generated email.</p>';return;}
  const scores={Katana:50,MRPeasy:50,inFlow:50,Intuit:50};
  let complexity=0; const reasons=[]; const gates=[];
  const model=val(fd,'model'),stack=val(fd,'stack'),channels=val(fd,'channels'),bom=val(fd,'bom'),planning=val(fd,'planning'),trace=val(fd,'traceability'),locations=val(fd,'locations'),inventory=val(fd,'inventory'),qbo=val(fd,'qbo'),shopify=val(fd,'shopify');

  if(model==='dtc'){add(scores,'Katana',16);add(scores,'inFlow',10);add(scores,'MRPeasy',6);reasons.push('Commerce-led manufacturing raises the value of sales-channel and production synchronization.');complexity+=2;}
  if(model==='mto'){add(scores,'MRPeasy',18);add(scores,'Katana',7);add(scores,'inFlow',2);reasons.push('Make-to-order/job-shop work raises the value of routings, work orders and production scheduling.');complexity+=4;}
  if(model==='batch'){add(scores,'MRPeasy',12);add(scores,'Katana',10);add(scores,'inFlow',6);complexity+=3;}
  if(model==='contract'){add(scores,'Katana',12);add(scores,'MRPeasy',9);add(scores,'inFlow',5);reasons.push('Contract/co-manufacturing raises material, outsourced-production and traceability requirements.');complexity+=4;}
  if(model==='mixed'){add(scores,'MRPeasy',12);add(scores,'Katana',11);add(scores,'inFlow',8);complexity+=4;}

  if(bom==='none'){add(scores,'inFlow',8);add(scores,'Intuit',8);complexity+=0;}
  if(bom==='single'){add(scores,'Katana',10);add(scores,'inFlow',6);add(scores,'Intuit',5);add(scores,'MRPeasy',6);complexity+=2;}
  if(bom==='multi'){add(scores,'MRPeasy',18);add(scores,'Katana',12);add(scores,'inFlow',4);add(scores,'Intuit',-28);complexity+=5;gates.push('Multi-level BOMs are a hard decision boundary: Intuit Enterprise Suite currently documents that subassembly multi-level BOMs are not supported.');}
  if(bom==='deep'){add(scores,'MRPeasy',24);add(scores,'Katana',11);add(scores,'inFlow',2);add(scores,'Intuit',-38);complexity+=7;gates.push('Deep multi-level BOMs materially reduce the fit of an Intuit-only manufacturing path; dedicated MRP testing should be mandatory.');}

  if(planning==='simple'){add(scores,'inFlow',6);add(scores,'Katana',5);add(scores,'Intuit',5);complexity+=1;}
  if(planning==='workorders'){add(scores,'Katana',8);add(scores,'MRPeasy',10);add(scores,'inFlow',5);complexity+=3;}
  if(planning==='routing'){add(scores,'MRPeasy',18);add(scores,'Katana',8);add(scores,'inFlow',3);complexity+=6;gates.push('Routing/capacity requirements should be proven in a real pilot rather than inferred from a feature list.');}

  if(trace==='some'){add(scores,'MRPeasy',7);add(scores,'Katana',7);add(scores,'inFlow',6);complexity+=2;}
  if(trace==='mandatory'){add(scores,'MRPeasy',12);add(scores,'Katana',12);add(scores,'inFlow',9);add(scores,'Intuit',-10);complexity+=5;gates.push('Mandatory lot/serial/expiry traceability requires workflow-level validation before purchase.');}

  if(locations==='multi'){add(scores,'inFlow',12);add(scores,'Katana',8);add(scores,'MRPeasy',7);complexity+=3;}
  if(locations==='many'){add(scores,'inFlow',15);add(scores,'Katana',8);add(scores,'MRPeasy',9);complexity+=5;}

  if(inventory==='unreliable'){add(scores,'inFlow',11);add(scores,'Katana',8);add(scores,'MRPeasy',7);complexity+=3;}
  if(inventory==='critical'){add(scores,'inFlow',14);add(scores,'Katana',10);add(scores,'MRPeasy',10);complexity+=5;gates.push('Do not migrate until item master and opening inventory can be reconciled to a controlled baseline.');}

  if(shopify==='yes'){add(scores,'Katana',16);add(scores,'MRPeasy',11);add(scores,'inFlow',14);add(scores,'Intuit',-3);reasons.push('Shopify is a high-value integration boundary; Katana, MRPeasy and inFlow all document current Shopify connections.');}
  if(qbo==='yes'){add(scores,'inFlow',15);add(scores,'Intuit',18);add(scores,'Katana',5);add(scores,'MRPeasy',6);reasons.push('Keeping accounting in QuickBooks favors a controlled operational-system integration rather than duplicating the accounting source of truth.');}
  if(stack==='quickbooks'){add(scores,'Intuit',10);add(scores,'inFlow',7);}
  if(stack==='spreadsheets'){add(scores,'MRPeasy',5);add(scores,'Katana',5);add(scores,'inFlow',5);}
  if(stack==='dedicated'){add(scores,'MRPeasy',2);add(scores,'Katana',2);add(scores,'inFlow',2);complexity+=2;}
  if(channels==='multi'){add(scores,'Katana',8);add(scores,'inFlow',10);add(scores,'MRPeasy',7);complexity+=3;}
  if(channels==='b2b'){add(scores,'MRPeasy',5);add(scores,'inFlow',6);}

  if(bom==='multi'||bom==='deep') scores.Intuit=Math.min(scores.Intuit,45);
  Object.keys(scores).forEach(k=>scores[k]=clamp(scores[k]));
  const ranking=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const top=ranking[0],second=ranking[1];
  let stage='Lightweight operations'; if(complexity>=20)stage='Controlled ERP/MRP selection'; else if(complexity>=13)stage='Strong MRP candidate'; else if(complexity>=7)stage='Inventory / light MRP candidate';
  const note1=`Your current profile is ${stage.toLowerCase()}. The preliminary leader is ${top[0]} (${top[1]}/100), with ${second[0]} (${second[1]}/100) close enough to keep in the pilot set.`;
  const note2=gates[0]||reasons[0]||'The next decision should be based on one end-to-end operating workflow, not a generic feature checklist.';
  const note3='Pilot one representative product/order family. Test item/BOM setup, purchasing, one production cycle, inventory movement, accounting/channel integration and export before committing to migration.';
  const company=val(fd,'company'),email=val(fd,'email'),consent=fd.get('vendor_intro')?'yes':'no';
  const params=new URLSearchParams(location.search); const source=params.get('utm_source')||params.get('source')||'website';
  const machine=[
    'MFGFIT/1',`company=${company}`,`contact_email=${email}`,`employees=${val(fd,'employees')}`,`manufacturing_model=${model}`,`current_stack=${stack}`,`sales_channels=${channels}`,`bom=${bom}`,`planning=${planning}`,`traceability=${trace}`,`locations=${locations}`,`inventory_reliability=${inventory}`,`quickbooks_required=${qbo}`,`shopify_required=${shopify}`,`budget=${val(fd,'budget')}`,`timeline=${val(fd,'timeline')}`,`top_path=${top[0]}`,`top_score=${top[1]}`,`second_path=${second[0]}`,`second_score=${second[1]}`,`complexity_stage=${stage}`,`vendor_intro_consent=${consent}`,`source=${source}`,'---','Automated 3-point fit note:',`1. ${note1}`,`2. ${note2}`,`3. ${note3}`,'','I understand this is a preliminary decision aid. If vendor_intro_consent=yes, MFG Stack Lab may introduce this request to matching software vendors and may receive compensation; compensation does not change fit scoring.'
  ];
  const subject=`MFGFIT | ${company} | ${top[0]} ${top[1]}`;
  const mail='mailto:liuambition982+mfgstacklab@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(machine.join('\n'));
  out.style.display='block';out.innerHTML=`<span class="tag">${esc(stage)} · complexity ${complexity}</span><h2>Your preliminary software paths</h2><table><tr><th>Path</th><th>Fit</th></tr>${ranking.map(([k,v])=>`<tr><td>${esc(k==='Intuit'?'Intuit path (QBO / Enterprise Suite)':k)}</td><td><b>${v}/100</b></td></tr>`).join('')}</table><h3>Free 3-point fit note</h3><ol><li>${esc(note1)}</li><li>${esc(note2)}</li><li>${esc(note3)}</li></ol><div class="evidence"><b>Independence control:</b> commercial relationships are checked only after these scores are calculated. Money cannot change fit score or recommendation order.</div><div class="actions"><a class="btn btn-primary" href="${mail}">Email this profile for the free fit review</a><a class="btn btn-secondary" href="services/software-fit-diagnostic.html">Get the $149 deep diagnostic</a></div><p class="fine">Nothing was transmitted by this calculation. Data is sent only if you choose to send the generated email.</p>`;out.scrollIntoView({behavior:'smooth',block:'start'});
}
