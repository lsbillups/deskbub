// DeskBub — Animated sprite pet using processed transparent image
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');

var petImg = null, hasPet = false;
var anim = 'idle', animT = 0, animDur = Infinity, idleT = 0, nextIdle = 5000;
var px = 50, py = 50, vx = 0, vy = 0, dir = 1, breathP = 0, lastTS = 0;
var PET_W = 120, PET_H = 160;

window.addEventListener('dblclick', function(e){ if(e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'){urlBar.classList.remove('hidden');hint.style.opacity='1';} });
window.addEventListener('keydown', function(e){ if(e.key==='Escape'){urlBar.classList.add('hidden');hint.style.opacity='0';} });
function status(m,d){ statusEl.textContent=m;statusEl.style.display='block';clearTimeout(status.timer);if(d>0)status.timer=setTimeout(function(){statusEl.style.display='none';},d); }

window.loadMedia = function(){
  var url = input.value.trim(); if(!url) return;
  status('Loading...',0);
  var img = new Image(); img.crossOrigin='anonymous';
  img.onload = function(){ petImg=img;hasPet=true;status('🐾',1500);urlBar.classList.add('hidden');hint.style.opacity='0';input.style.borderColor='#4ECDC4'; };
  img.onerror = function(){ status('Failed to load',4000); };
  img.src = url;
};
window.toggleMode = function(){};

function setAnim(n){
  anim=n;animT=0;
  switch(n){
    case 'idle':animDur=Infinity;break;
    case 'walk':animDur=5000+Math.random()*3000;vx=(0.5+Math.random()*0.6)*(Math.random()>0.5?1:-1);vy=(Math.random()-0.5)*0.3;dir=vx>0?1:-1;break;
    case 'sit':animDur=1000;break;
    case 'sleep':animDur=10000;break;
    case 'stretch':animDur=1800;break;
    case 'excited':animDur=2000;break;
    case 'hop':animDur=1500;vy=-3;vx=0;break;
  }
}
function randomAnim(){var a=['walk','sit','sleep','stretch','excited','hop'];setAnim(a[Math.floor(Math.random()*a.length)]);}

function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize',resize);resize();

function loop(ts){
  requestAnimationFrame(loop);
  if(!lastTS)lastTS=ts;
  var dt=Math.min(ts-lastTS,100);lastTS=ts;animT+=dt;idleT+=dt;
  if(anim==='idle'&&idleT>nextIdle){idleT=0;nextIdle=5000+Math.random()*12000;randomAnim();}
  var scale=1,bounce=0,rotate=0;
  switch(anim){
    case 'idle':breathP+=dt*0.003;scale=1+Math.sin(breathP)*0.04;break;
    case 'walk':px+=vx*(dt/16);py+=vy*(dt/16);if(px<-10||px>canvas.width-PET_W+10){vx*=-1;dir=vx>0?1:-1;}if(py<-10||py>canvas.height-PET_H+10)vy*=-1;bounce=Math.abs(Math.sin(animT*0.012))*8;rotate=dir*3;if(animT>animDur)setAnim('idle');break;
    case 'sit':scale=1-Math.min(1,animT/animDur)*0.1;if(animT>animDur+4000)setAnim('idle');break;
    case 'sleep':scale=0.75;if(animT>animDur+7000)setAnim('idle');break;
    case 'stretch':var t=Math.min(1,animT/animDur);scale=1+Math.sin(t*Math.PI)*0.16;if(animT>animDur)setAnim('idle');break;
    case 'excited':bounce=Math.abs(Math.sin(animT*0.025))*12;rotate=Math.sin(animT*0.03)*5;if(animT>animDur)setAnim('idle');break;
    case 'hop':py+=vy*(dt/16);vy+=0.15;if(py>canvas.height-PET_H-10){py=canvas.height-PET_H-10;vy=-2.5;}if(animT>animDur){py=50;setAnim('idle');}break;
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  var cx=px+PET_W/2,cy=py+PET_H*0.65+bounce;
  ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.rotate(rotate*Math.PI/180);
  if(anim==='walk'&&dir===-1)ctx.scale(-1,1);
  ctx.fillStyle='rgba(0,0,0,0.08)';ctx.beginPath();ctx.ellipse(0,PET_H*0.32,PET_W*0.28,6,0,0,Math.PI*2);ctx.fill();
  if(hasPet&&petImg){ctx.drawImage(petImg,-PET_W/2,-PET_H*0.55,PET_W,PET_H);}
  else{ctx.font=(PET_W*0.6)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐱',0,0);}
  if(anim==='sleep'&&animT>1500){ctx.font='bold 14px sans-serif';ctx.fillStyle='#636E72';ctx.globalAlpha=Math.min(1,(animT-1500)/1000);['z','Z','Z'].forEach(function(z,i){ctx.fillText(z,PET_W*0.25+i*12,-PET_H*0.3-i*14);});ctx.globalAlpha=1;}
  ctx.restore();
}
requestAnimationFrame(loop);

var dragging=false,sx=0,sy=0;
document.addEventListener('mousedown',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='BUTTON')return;dragging=true;sx=e.screenX;sy=e.screenY;});
window.addEventListener('mousemove',function(e){if(!dragging)return;window.moveBy(e.screenX-sx,e.screenY-sy);sx=e.screenX;sy=e.screenY;});
window.addEventListener('mouseup',function(){dragging=false;});

var bubbleTimer=null;
function showBubble(m){bubble.textContent=m;bubble.classList.add('show');clearTimeout(bubbleTimer);bubbleTimer=setTimeout(function(){bubble.classList.remove('show');},8000);}
setTimeout(function(){showBubble('Stretch break! 🧘');},30000);
setInterval(function(){if(Math.random()<0.2)showBubble(['Water! 💧','Eye break! 👀','Stretch! 🧘'][Math.floor(Math.random()*3)]);},60000);

canvas.style.display='block';urlBar.classList.remove('hidden');
status('👆 Paste processed image URL → Load',10000);
