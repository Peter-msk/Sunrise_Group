function openProductPreview(event,link){
 if(event.defaultPrevented||(event.type==='click'&&event.button!==0)||(event.type==='auxclick'&&event.button!==1))return;
 event.preventDefault();
 const notify=message=>{
  let status=link.parentElement.querySelector('.r27-preview-status');
  if(!status){status=document.createElement('p');status.className='r27-preview-status';status.setAttribute('role','status');link.after(status);}
  status.textContent=message;status.hidden=!message;
 };
 let target;
 try{
  target=new URL(link.getAttribute('href')||'',location.href);
  if(target.origin!==location.origin||!target.pathname.startsWith('/assets/r28/'))throw new Error('untrusted image path');
 }catch{notify('이미지 경로를 확인할 수 없습니다.');return;}
 let preview;
 try{
  preview=window.open('about:blank','_blank');
  if(!preview)throw new Error('popup blocked');
  preview.opener=null;
  preview.location.replace(target.href);
  notify('');
 }catch{
  try{preview?.close();}catch{}
  notify('확대 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인한 뒤 다시 선택해 주세요.');
 }
}
