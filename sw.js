var V='bcs-v1',SHELL=['./','index.html','login.css','loader.js','manifest.webmanifest','fonts/Poppins-Regular.ttf','fonts/Poppins-Medium.ttf','fonts/Poppins-Bold.ttf','logo-login.png','favicon.png','d/app.bin'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(V).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);if(u.origin!==location.origin)return;
  var big=/\/d\/[0-9a-f]{24}\.bin$/.test(u.pathname);
  if(big){e.respondWith(caches.match(r).then(function(h){return h||fetch(r).then(function(n){if(n.ok){var cp=n.clone();caches.open(V).then(function(c){c.put(r,cp)})}return n})}));return}
  e.respondWith(fetch(r).then(function(n){if(n.ok){var cp=n.clone();caches.open(V).then(function(c){c.put(r,cp)})}return n}).catch(function(){return caches.match(r)}));
});
