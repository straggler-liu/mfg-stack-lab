
const menu=document.querySelector('.menu');const nav=document.querySelector('nav');if(menu){menu.addEventListener('click',()=>nav.classList.toggle('open'))}
document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
function runReadiness(){
 const form=document.getElementById('readiness-form'); if(!form)return;
 let score=0,answered=0; new FormData(form).forEach(v=>{score+=Number(v);answered++});
 const out=document.getElementById('readiness-result');
 if(answered<12){out.style.display='block';out.innerHTML='<b>Complete all 12 questions.</b><p>Your answers stay in this browser and are not transmitted.</p>';return}
 let band,title,copy,links;
 if(score<=10){band='Stage 1';title='Spreadsheets may still be sufficient';copy='Your workflow is still relatively simple. Improve item naming, ownership and inventory routines before buying an MRP system.';links='Start with the migration checklist and item-master template.'}
 else if(score<=22){band='Stage 2';title='Inventory software is the next likely step';copy='Your main problem appears to be inventory visibility rather than production complexity. Test an inventory-first system before committing to full MRP.';links='Review inFlow Manufacturing and compare it with MRPeasy.'}
 else if(score<=34){band='Stage 3';title='You are a strong MRP candidate';copy='BOM, shortages, purchasing and production coordination are likely creating material operating costs. Run a structured MRP pilot using one product family.';links='Compare MRPeasy and Katana, then use the migration guide.'}
 else {band='Stage 4';title='You need a controlled ERP/MRP selection';copy='Your multi-site, traceability, capacity or governance needs justify a formal selection process. Avoid buying from a feature checklist alone.';links='Use the full selection scorecard and test at least three systems.'}
 out.style.display='block';out.innerHTML=`<span class="tag">${band} · Score ${score}/48</span><h2>${title}</h2><p>${copy}</p><p><b>Next action:</b> ${links}</p>`;out.scrollIntoView({behavior:'smooth',block:'center'});
}
function calcTCO(){
 const product=document.getElementById('product');if(!product)return;
 const years=Number(document.getElementById('years').value);const users=Number(document.getElementById('users').value||1);const extras=Number(document.getElementById('extras').value||0);const annual=document.getElementById('annual').checked;
 let monthly=0,explain='';
 if(product.value==='mrp-starter'||product.value==='mrp-pro'||product.value==='mrp-enterprise'){
   const rates={'mrp-starter':49,'mrp-pro':69,'mrp-enterprise':99};const rate=rates[product.value];
   const baseUsers=Math.min(users,10);const bundles=Math.max(0,Math.ceil((users-10)/10));monthly=baseUsers*rate+bundles*79;
   explain=`MRPeasy estimate: first 10 active users at $${rate}/user/month, then $79 per additional 10-user bundle.`;
 } else if(product.value==='katana-core'){monthly=299;explain='Katana Core published starting price only. Sales-order usage, additional locations, add-ons and onboarding can increase the quote.'}
 else if(product.value==='inflow-start'){monthly=179;explain='inFlow Manufacturing Start Up published annual-billing starting price.'}
 else if(product.value==='inflow-growth'){monthly=449;explain='inFlow Manufacturing Growth published annual-billing price.'}
 else if(product.value==='inflow-scale'){monthly=899;explain='inFlow Manufacturing Scale published annual-billing price.'}
 let months=years*12;let subscription=monthly*months;if(annual && product.value.startsWith('mrp-'))subscription=monthly*11*years;
 const total=subscription+extras*years;document.getElementById('tco-number').textContent='$'+Math.round(total).toLocaleString();document.getElementById('tco-monthly').textContent='$'+Math.round(total/months).toLocaleString();document.getElementById('tco-explain').textContent=explain+' This is a planning estimate, not a vendor quote.';
}
