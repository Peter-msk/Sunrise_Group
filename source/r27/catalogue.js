function setupCatalogue(){
 const input=outlet.querySelector('#product-search');if(!input)return;
 const groups=[...outlet.querySelectorAll('.catalog-group')],rows=[...outlet.querySelectorAll('.catalog-line')],count=outlet.querySelector('.r07-result'),empty=outlet.querySelector('.r07-no-results'),clear=outlet.querySelector('.r27-search-clear');
 const normalize=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('ko').trim();
 const compact=value=>normalize(value).replace(/\s+/g,'');
 const statuses=new Set(['개발중','개발완료','개발중지','정식배포','상태확인중','웹서비스운영중']);
 const entries=rows.map(row=>({row,text:normalize(row.textContent),name:compact(row.querySelector('h3')?.textContent),status:compact(row.querySelector('.r08-state')?.textContent||row.querySelector('.catalog-line-meta')?.textContent)}));
 function filter(){
  const query=normalize(input.value),terms=query.split(/\s+/).filter(Boolean),stateQuery=compact(query);let visible=0;
  for(const {row,text,name,status} of entries){
   const hit=statuses.has(stateQuery)?(stateQuery==='개발중'?status.includes('개발중')&&!status.includes('개발중지'):status.includes(stateQuery)):terms.every(term=>text.includes(term))||(terms.length===1&&name.includes(stateQuery));
   row.hidden=!hit;if(hit)visible++;
  }
  groups.forEach(group=>group.hidden=!group.querySelector('.catalog-line:not([hidden])'));
  if(count)count.textContent=`${visible}개 / 전체 ${rows.length}개`;
  if(empty)empty.hidden=visible!==0;
  if(clear)clear.disabled=input.value.length===0;
 }
 function reset(focus=false){if(focus)input.focus();input.value='';filter();}
 input.addEventListener('input',filter);
 clear?.addEventListener('click',()=>reset(true));
 outlet.querySelectorAll('.r07-category-link').forEach(link=>link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(input.value)reset();
 }));
 filter();
}
