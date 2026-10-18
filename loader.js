(function(){
'use strict';
var SALT=hex('e0a21ce0f07494cf3ea7d0d9c3ee0007'),ITER=600000;
function hex(h){var a=new Uint8Array(h.length/2);for(var i=0;i<a.length;i++)a[i]=parseInt(h.substr(i*2,2),16);return a}
function b64e(u){var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function b64d(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
var subtle=window.crypto&&window.crypto.subtle;
var $=function(i){return document.getElementById(i)};
var key=null,fails=0,idleT=null;
function derive(pw){return subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']).then(function(km){return subtle.deriveKey({name:'PBKDF2',salt:SALT,iterations:ITER,hash:'SHA-256'},km,{name:'AES-GCM',length:256},true,['decrypt'])})}
function decBuf(k,buf){var u=new Uint8Array(buf);return subtle.decrypt({name:'AES-GCM',iv:u.slice(0,12)},k,u.slice(12))}
function fetchBuf(path,onp,size){
  return fetch(path,{credentials:'omit'}).then(function(r){
    if(!r.ok)throw new Error('http '+r.status);
    var total=+r.headers.get('content-length')||size||0;
    if(!onp||!r.body||!total)return r.arrayBuffer();
    var rd=r.body.getReader(),chunks=[],got=0;
    return (function pump(){return rd.read().then(function(x){if(x.done){var out=new Uint8Array(got),o=0;chunks.forEach(function(c){out.set(c,o);o+=c.length});return out.buffer}chunks.push(x.value);got+=x.value.length;onp(Math.min(1,got/total));return pump()})})();
  });
}
function boot(b,k){
  key=k;
  var st=document.createElement('style');st.textContent=b.css;document.head.appendChild(st);
  document.title='Bharat Cloud Shiksha';
  document.body.innerHTML=b.html;
  window.__BCS={data:b.data,dec:function(p,onp,size){return fetchBuf(p,onp,size).then(function(buf){return decBuf(key,buf)})},logout:logout};
  var s=document.createElement('script');s.src=URL.createObjectURL(new Blob([b.js],{type:'text/javascript'}));document.body.appendChild(s);
  ['pointerdown','keydown','touchstart','play'].forEach(function(e){document.addEventListener(e,idle,true)});idle();
}
function idle(){clearTimeout(idleT);idleT=setTimeout(logout,45*60*1000)}
function logout(){try{sessionStorage.removeItem('bcs_k');sessionStorage.removeItem('bcs_intro')}catch(e){}location.reload()}
function unlock(k){return fetchBuf('d/app.bin').catch(function(e){e.net=true;throw e}).then(function(buf){return decBuf(k,buf)}).then(function(plain){var b=JSON.parse(new TextDecoder().decode(plain));boot(b,k);return subtle.exportKey('raw',k).then(function(raw){try{sessionStorage.setItem('bcs_k',b64e(new Uint8Array(raw)))}catch(e){}})})}
function msg(t){var m=$('msg');if(m)m.textContent=t}
function init(){
  if(!subtle){msg('This browser cannot open the course securely. Use a current browser over HTTPS.');return}
  if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(function(){})}
  var saved=null;try{saved=sessionStorage.getItem('bcs_k')}catch(e){}
  if(saved){subtle.importKey('raw',b64d(saved),{name:'AES-GCM'},true,['decrypt']).then(unlock).catch(function(){try{sessionStorage.removeItem('bcs_k')}catch(e){}})}
  var f=$('lf'),pw=$('pw'),go=$('go');
  $('eye').onclick=function(){var s=pw.type==='password';pw.type=s?'text':'password';this.textContent=s?'Hide':'Show'};
  var lockUntil=0;
  f.onsubmit=function(e){
    e.preventDefault();
    var now=Date.now();if(now<lockUntil){msg('Please wait '+Math.ceil((lockUntil-now)/1000)+' s and try again.');return}
    if(!pw.value){msg('Enter the password.');return}
    go.disabled=true;go.textContent='Unlocking…';msg('');
    derive(pw.value.trim()).then(unlock).catch(function(e){
      go.disabled=false;go.textContent='Unlock the course';
      if(e&&e.net){msg('Could not load the course files ('+(e.message||'network error')+'). The site may be only partly uploaded, or you are offline. Open it over https and make sure the d/ folder was uploaded.');return}
      fails++;pw.value='';pw.focus();
      if(fails>=3){lockUntil=Date.now()+Math.min(30,Math.pow(2,fails-2))*1000}
      msg('That password did not work. It is case-sensitive: check capital letters and extra spaces.');
    });
  };
  pw.focus();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
