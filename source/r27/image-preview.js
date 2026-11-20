function openProductPreview(event,link){
 if(event.defaultPrevented||(event.type==='click'&&event.button!==0)||(event.type==='auxclick'&&event.button!==1))return;
 event.preventDefault();
 const notify=message=>{
  let status=link.parentElement.querySelector('.r27-preview-status');
  if(!status){status=document.createElement('p');status.className='r27-preview-status';status.setAttribute('role','status');link.after(status);}
  status.textContent=message;status.hidden=!message;
 };
 const source=link.getAttribute('href')||'';
 const match=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(source);
 if(!match||match[2].length>32*1024*1024){notify('이미지 형식을 확인할 수 없습니다.');return;}
 let url;
 try{
  const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
  const png=match[1].toLowerCase()==='image/png';
  const signature=png?[137,80,78,71,13,10,26,10]:[255,216,255];
  if(!signature.every((v,i)=>bytes[i]===v))throw new Error('invalid image signature');
  url=URL.createObjectURL(new Blob([bytes],{type:match[1].toLowerCase()}));
 }catch{notify('이미지를 열 수 없습니다.');return;}
 let preview;
 try{
  preview=window.open('about:blank','_blank');
  if(!preview)throw new Error('popup blocked');
  preview.opener=null;
  preview.location.replace(url);
  notify('');
  setTimeout(()=>URL.revokeObjectURL(url),120000);
 }catch{
  try{preview?.close();}catch{}
  URL.revokeObjectURL(url);
  notify('확대 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인한 뒤 다시 선택해 주세요.');
 }
}
