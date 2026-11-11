import * as THREE from 'three';

const canvas = document.querySelector('#world');
const ui = Object.fromEntries(['start-screen','pause-screen','end-screen','start-button','resume-button','restart-button','again-button','pause-button','objective-card','distance','detection-fill','threat-state','threat-note','health-fill','health-value','ammo-count','weapon-item','mission-label','center-warning','damage-flash','toast','reticle','end-kicker','end-title','end-copy','end-emblem','touch-controls','joystick','joy-knob','touch-crouch','touch-fire'].map(id=>[id,document.getElementById(id)]));
const isTouch = matchMedia('(pointer: coarse)').matches;
if(isTouch) ui['touch-controls'].style.display='flex';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a2a292');
scene.fog = new THREE.FogExp2('#9d9c8b', 0.0125);
const camera = new THREE.PerspectiveCamera(54, innerWidth/innerHeight, .1, 150);
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
scene.add(new THREE.HemisphereLight('#d5d0b6','#34352c',2.15));
const sun=new THREE.DirectionalLight('#f0d7b1',2.35); sun.position.set(-18,34,24); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-42; sun.shadow.camera.right=42; sun.shadow.camera.top=42; sun.shadow.camera.bottom=-42; sun.shadow.bias=-.0002; scene.add(sun);
const fill=new THREE.DirectionalLight('#bcc3b0',.7); fill.position.set(12,12,-24); scene.add(fill);
const mat=(color,rough=.9)=>new THREE.MeshStandardMaterial({color,roughness:rough});
const earth=mat('#45443a'), mud1=mat('#565247'), mud2=mat('#393a32'), darkMud=mat('#292b26'), sandbagMat=mat('#81765d'), olive=mat('#4b5142'), coatMat=mat('#3f4639'), skin=mat('#784d38'), beardMat=mat('#d7d1bd'), hatMat=mat('#343c33'), bootMat=mat('#292a24'), metal=mat('#343932',.62), wood=mat('#59452f'), brass=mat('#9e8151');
const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),earth); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
// Mud scuffs and shallow shell holes break up the open ground.
let seed=417; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let i=0;i<165;i++){
  const r=.18+rand()*.95, x=(rand()-.5)*68, z=(rand()-.5)*58;
  const patch=new THREE.Mesh(new THREE.CircleGeometry(r,7),i%3?mud1:mud2); patch.rotation.x=-Math.PI/2; patch.rotation.z=rand()*Math.PI; patch.position.set(x,-.105+rand()*.006,z); patch.scale.set(1+rand()*1.5,.65+rand()*.8,1); scene.add(patch);
}
const worldBounds={minX:-34,maxX:34,minZ:-31,maxZ:30};
const blockers=[];
function box(name,x,y,z,sx,sy,sz,material,collide=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);if(collide) blockers.push({x,z,hx:sx/2+.24,hz:sz/2+.24,top:y+sy/2});return o;}
function sphere(x,y,z,sx,sy,sz,material){const o=new THREE.Mesh(new THREE.SphereGeometry(1,9,7),material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
function makeBag(x,z,rotation=0){const b=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.48,3,7),sandbagMat);b.position.set(x,.26,z);b.rotation.z=Math.PI/2;b.rotation.y=rotation;b.castShadow=true;b.receiveShadow=true;scene.add(b);blockers.push({x,z,hx:.52,hz:.32,top:.58});return b;}
// Ruined trench lips: low sacks are cover, with obvious gaps to slip through.
for(const z of [8,-7,-19]){
  for(let x=-28;x<28;x+=1.15){if(Math.abs(x-(z===8?-7:z===-7?7:-2))<2.1)continue;makeBag(x,z,0);if((Math.floor(x*2)%3)===0)makeBag(x,z-.36,0);}
  for(let x=-29;x<29;x+=2.9){box('trench timber',x,.13,z-.75,2.4,.24,.14,wood,false);}
}
// Shell craters. Their inner shadow reads as shallow cover without trapping the player.
for(const [x,z,r] of [[-13,15,2.2],[11,4,2.1],[1,-3,2.4],[-14,-12,1.8],[17,-17,2.1],[24,18,1.7],[-24,-22,2]]){
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.28,5,16),mud1);rim.rotation.x=Math.PI/2;rim.position.set(x,-.02,z);rim.scale.y=.68;rim.receiveShadow=true;scene.add(rim);
  const pit=new THREE.Mesh(new THREE.CircleGeometry(r*.82,14),darkMud);pit.rotation.x=-Math.PI/2;pit.position.set(x,-.09,z);pit.scale.set(1,.7,1);scene.add(pit);
}
// Broken stakes and crooked barbed-wire silhouettes.
for(const [x,z] of [[-24,1],[-20,1],[-16,1],[19,12],[23,12],[27,12],[-28,-15],[-24,-15]]){
  const post=box('wire stake',x,.62,z,.09,1.25,.09,wood,false);post.rotation.z=(rand()-.5)*.24;
  const wire=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,4,5),metal);wire.rotation.z=Math.PI/2;wire.position.set(x+1.6,.64,z);scene.add(wire);
  const barb=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.3,4),metal);barb.rotation.z=.6;barb.position.set(x+.8,.65,z);scene.add(barb);
}
// Distant blasted tree trunks and ruined posts.
for(const [x,z,h] of [[-31,-14,5],[-29,17,4],[32,-4,6],[28,24,4],[-34,-26,5],[33,-26,4]]){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.11,.2,h,6),wood);trunk.position.set(x,h/2,z);trunk.rotation.z=(rand()-.5)*.3;trunk.castShadow=true;scene.add(trunk);
  for(let b=0;b<2;b++){const limb=new THREE.Mesh(new THREE.CylinderGeometry(.045,.1,2.4,5),wood);limb.position.set(x+(rand()-.5)*1.5,h*.65-b*.7,z);limb.rotation.z=(rand()-.5)*1.6;scene.add(limb);}
}
// Distant command post and the warm lantern marking the destination.
const bunker=box('command bunker',0,.85,-29,8,1.7,3,mat('#555344'));
for(let x=-3;x<=3;x+=1.3)makeBag(x,-27.1,0);
const bunkerRoof=box('bunker roof',0,1.82,-29,8.5,.22,3.5,mat('#34372f'),false);
const door=box('command entrance',0,.68,-27.43,1.4,1.35,.08,mat('#282d28'),false);
const lamp=new THREE.PointLight('#efb66e',2.4,10);lamp.position.set(0,2.45,-26.8);scene.add(lamp);
const beacon=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),new THREE.MeshBasicMaterial({color:'#ffd99a'}));beacon.position.copy(lamp.position);scene.add(beacon);

function createCharacter(isPlayer=false){
  const root=new THREE.Group(); scene.add(root);
  const body=new THREE.Group();body.position.y=0;root.add(body);
  const shirt=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,4,8),isPlayer?coatMat:olive);shirt.position.y=1.22;shirt.castShadow=true;body.add(shirt);
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.12,8),wood);belt.position.y=.95;body.add(belt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.255,12,10),skin);head.position.set(0,2.04,-.015);head.castShadow=true;body.add(head);
  const beard=new THREE.Mesh(new THREE.ConeGeometry(.235,.48,9),beardMat);beard.rotation.x=Math.PI;beard.position.set(0,1.82,-.12);beard.castShadow=true;body.add(beard);
  const moustache=new THREE.Mesh(new THREE.SphereGeometry(.17,10,7),beardMat);moustache.scale.set(1,.48,.52);moustache.position.set(0,1.99,-.237);body.add(moustache);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.25,.28,.2,9),isPlayer?hatMat:mat('#3c4035'));cap.position.y=2.28;cap.castShadow=true;body.add(cap);
  const brim=new THREE.Mesh(new THREE.BoxGeometry(.4,.055,.28),isPlayer?hatMat:olive);brim.position.set(0,2.21,-.19);body.add(brim);
  for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),mat('#191a16'));eye.position.set(s*.085,2.07,-.24);body.add(eye);}
  const limbs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.39,1.58,0);body.add(arm);
    const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.38,3,6),isPlayer?coatMat:olive);upper.position.y=-.22;upper.rotation.z=side*-.12;upper.castShadow=true;arm.add(upper);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.09,7,6),skin);hand.position.set(side*-.04,-.51,-.015);arm.add(hand);limbs.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.19,.83,0);body.add(leg);
    const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.46,3,7),isPlayer?coatMat:olive);thigh.position.y=-.3;thigh.castShadow=true;leg.add(thigh);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(.2,.14,.34),bootMat);boot.position.set(0,-.61,-.07);leg.add(boot);limbs.push(leg);
  }
  // Rifle silhouette on the player's back and in every sentry's hands.
  const rifle=new THREE.Group();rifle.position.set(.32,1.27,-.18);rifle.rotation.x=-.22;body.add(rifle);
  const stock=new THREE.Mesh(new THREE.BoxGeometry(.09,.1,.76),wood);stock.position.z=.15;rifle.add(stock);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.78,6),metal);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.01,-.54);rifle.add(barrel);
  const sight=new THREE.Mesh(new THREE.BoxGeometry(.05,.08,.08),metal);sight.position.set(0,.07,-.3);rifle.add(sight);
  root.userData={body,limbs,rifle}; return root;
}
const player=createCharacter(true);player.position.set(-2,0,24);player.rotation.y=0;
const enemies=[];
function addEnemy(x,z,waypoints,speed=.7){const group=createCharacter(false);group.position.set(x,0,z);group.rotation.y=Math.PI;const cone=new THREE.Mesh(new THREE.ConeGeometry(1,1,16,1,true),new THREE.MeshBasicMaterial({color:'#d2b37c',transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));cone.position.set(0,1.8,-4.2);cone.scale.set(3.2,8.4,1);cone.rotation.x=-Math.PI/2;group.add(cone);enemies.push({group,waypoints,index:0,speed,cone,alive:true,stun:0,look:0});return group;}
addEnemy(-15,1,[[-15,1],[-9,1],[-9,-1],[-15,-1]],.65);
addEnemy(13,9,[[13,9],[18,9],[18,5],[13,5]],.7);
addEnemy(-8,-11,[[-8,-11],[-3,-11],[-3,-14],[-8,-14]],.58);
addEnemy(9,-20,[[9,-20],[14,-20],[14,-23],[9,-23]],.62);
// A tank patrols the open east flank; its searchlight sweeps a visible danger arc.
const tank=new THREE.Group();tank.position.set(23,0,0);scene.add(tank);
const tankHull=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.15,5.2),mat('#4a4b3b'));tankHull.position.y=.95;tankHull.castShadow=true;tank.add(tankHull);
const turret=new THREE.Mesh(new THREE.BoxGeometry(2.1,.72,2.5),mat('#555644'));turret.position.set(0,1.72,-.3);turret.castShadow=true;tank.add(turret);
const cannon=new THREE.Mesh(new THREE.CylinderGeometry(.15,.21,2.6,8),metal);cannon.rotation.x=Math.PI/2;cannon.position.set(0,1.77,-2.25);tank.add(cannon);
for(const side of [-1,1]){const track=new THREE.Mesh(new THREE.BoxGeometry(.38,.72,5.5),bootMat);track.position.set(side*1.78,.53,0);tank.add(track);for(let z=-2;z<=2;z+=.8){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.28,10),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(side*2,.45,z);tank.add(wheel);}}
const spotlight=new THREE.SpotLight('#e7c992',1.8,25,Math.PI/5,.8,1);spotlight.position.set(0,2.3,-1.7);spotlight.target.position.set(0,0,-12);tank.add(spotlight,spotlight.target);

let started=false,paused=false,ended=false,health=100,ammo=3,detection=0,alarm=0,elapsed=0,walkPhase=0,fireCooldown=0,damageCooldown=0,toastTimer=0,warningTimer=0,aiming=false,crouched=false;
let moveX=0,moveZ=0,mouseDown=false,keys=Object.create(null),yaw=0,pitch=.19;
const clock=new THREE.Clock();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function showToast(message){ui.toast.textContent=message;ui.toast.classList.add('show');toastTimer=2.2;}
function showWarning(message){ui['center-warning'].textContent=message;ui['center-warning'].classList.add('show');warningTimer=1.5;}
function setDetection(value){detection=clamp(value,0,100);ui['detection-fill'].style.width=`${detection}%`;const level=detection>78?'EXPOSED':detection>42?'SUSPICIOUS':'UNSEEN';ui['threat-state'].textContent=level;ui['threat-state'].style.color=detection>78?'#dc8062':detection>42?'#d7ad69':'#b4bd8e';ui['detection-fill'].style.background=detection>78?'#d56b51':detection>42?'#d1a462':'#b9b77f';ui['threat-note'].textContent=detection>78?'They have your position — move!':detection>42?'A sentry is searching the field.':'Keep low. Stay out of the open.';}
function updateVitals(){ui['health-fill'].style.width=`${health}%`;ui['health-value'].textContent=Math.ceil(health);ui['ammo-count'].textContent=String(ammo).padStart(2,'0');ui['weapon-item'].classList.toggle('empty',ammo===0);}
function startGame(){started=true;paused=false;ended=false;ui['start-screen'].classList.add('hidden');ui['pause-screen'].classList.add('hidden');ui['end-screen'].classList.add('hidden');clock.getDelta();}
function pauseGame(){if(!started||ended)return;paused=true;ui['pause-screen'].classList.remove('hidden');document.exitPointerLock?.();}
function resumeGame(){paused=false;ui['pause-screen'].classList.add('hidden');clock.getDelta();}
function resetGame(){health=100;ammo=3;detection=0;alarm=0;player.position.set(-2,0,24);player.rotation.y=0;yaw=0;pitch=.19;elapsed=0;ended=false;paused=false;started=true;enemies.forEach((e,i)=>{e.alive=true;e.group.visible=true;e.stun=0;e.index=0;e.group.position.set(...[[ -15,1],[13,9],[-8,-11],[9,-20]][i]);});tank.position.set(23,0,0);setDetection(0);updateVitals();ui['mission-label'].textContent="CROSS NO MAN'S LAND";ui['end-screen'].classList.add('hidden');ui['pause-screen'].classList.add('hidden');clock.getDelta();}
function finish(success){ended=true;paused=false;document.exitPointerLock?.();ui['end-screen'].classList.remove('hidden');ui['end-kicker'].innerHTML=success?'FIELD DISPATCH <span>—</span> DELIVERED':'FIELD DISPATCH <span>—</span> LOST';ui['end-title'].textContent=success?'The letter arrived.':'The crossing is over.';ui['end-copy'].textContent=success?'The commander breaks the seal. For a moment, the guns seem very far away.':'The message never reached the command post. The front will remember Elias Bell.';ui['end-emblem'].textContent=success?'✉':'✕';}
ui['start-button'].addEventListener('click',startGame);ui['resume-button'].addEventListener('click',resumeGame);ui['restart-button'].addEventListener('click',resetGame);ui['again-button'].addEventListener('click',resetGame);ui['pause-button'].addEventListener('click',()=>paused?resumeGame():pauseGame());
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&started&&!ended){paused?resumeGame():pauseGame();}if(e.code==='ShiftLeft'||e.code==='ShiftRight'){crouched=true;}if(e.code==='KeyF')aiming=true;if(e.code==='Space'&&started&&!paused&&!ended)fire();});
window.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='ShiftLeft'||e.code==='ShiftRight')crouched=false;if(e.code==='KeyF')aiming=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{if(e.button===2){aiming=true;return;}if(e.button===0){mouseDown=true;if(started&&!paused&&!ended){if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.();else fire();}}});
window.addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;if(e.button===2)aiming=false;});
canvas.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas){yaw-=e.movementX*.0022;pitch=clamp(pitch+e.movementY*.0015,-.05,.65);}});
document.addEventListener('pointerlockchange',()=>ui.reticle.classList.toggle('show',document.pointerLockElement===canvas));
window.addEventListener('blur',()=>{keys=Object.create(null);crouched=false;});
ui['touch-crouch'].addEventListener('pointerdown',e=>{e.preventDefault();crouched=true;ui['touch-crouch'].setPointerCapture(e.pointerId);});ui['touch-crouch'].addEventListener('pointerup',()=>crouched=false);ui['touch-fire'].addEventListener('pointerdown',e=>{e.preventDefault();fire();});
let joyPointer=null,joyOrigin={x:0,y:0};
ui.joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;const r=ui.joystick.getBoundingClientRect();joyOrigin={x:r.left+r.width/2,y:r.top+r.height/2};ui.joystick.setPointerCapture(e.pointerId);updateJoy(e);});
ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e);});
function updateJoy(e){const dx=e.clientX-joyOrigin.x,dy=e.clientY-joyOrigin.y,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,31/len);moveX=dx/31*scale;moveZ=dy/31*scale;ui['joy-knob'].style.transform=`translate(${moveX*28}px,${moveZ*28}px)`;}
function releaseJoy(){joyPointer=null;moveX=0;moveZ=0;ui['joy-knob'].style.transform='';}ui.joystick.addEventListener('pointerup',releaseJoy);ui.joystick.addEventListener('pointercancel',releaseJoy);

function fire(){if(!started||paused||ended||fireCooldown>0)return;if(ammo<=0){showToast('RIFLE EMPTY — MAKE THIS SHOT COUNT');fireCooldown=.35;return;}ammo--;fireCooldown=.42;aiming=true;updateVitals();alarm=2.5;
  const forward=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);let target=null,best=13;
  for(const enemy of enemies){if(!enemy.alive)continue;const delta=new THREE.Vector3(enemy.group.position.x-player.position.x,0,enemy.group.position.z-player.position.z);const dist=delta.length();if(dist<best&&forward.dot(delta.normalize())>.93){target=enemy;best=dist;}}
  if(target){target.alive=false;target.group.visible=false;showToast('SENTRY DOWN — THE SHOT CARRIES');alarm=4;}
  else showToast('SHOT FIRED — FIND COVER');
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.09,6,6),new THREE.MeshBasicMaterial({color:'#ffd693'}));muzzle.position.copy(player.position).add(new THREE.Vector3(0,1.35,0)).add(forward.clone().multiplyScalar(1.05));scene.add(muzzle);setTimeout(()=>scene.remove(muzzle),80);
}
function nearCover(){if(!crouched)return false;const p=player.position;if([[-13,15,2.4],[11,4,2.4],[1,-3,2.7],[-14,-12,2.2],[17,-17,2.4],[24,18,2],[-24,-22,2.3]].some(([x,z,r])=>Math.hypot(p.x-x,p.z-z)<r))return true;return [8,-7,-19].some(z=>Math.abs(p.z-z)<1.25);}
function clearShot(a,b){for(const block of blockers){const vx=b.x-a.x,vz=b.z-a.z,den=vx*vx+vz*vz;if(den<.001)continue;const t=clamp(((block.x-a.x)*vx+(block.z-a.z)*vz)/den,0,1);const dx=a.x+vx*t-block.x,dz=a.z+vz*t-block.z;if(dx*dx/(block.hx*block.hx)+dz*dz/(block.hz*block.hz)<1&&block.top>1.1)return false;}return true;}
function movePlayer(dt){let ix=moveX,iz=moveZ;if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyW||keys.ArrowUp)iz+=1;if(keys.KeyS||keys.ArrowDown)iz-=1;let length=Math.hypot(ix,iz);if(length>1){ix/=length;iz/=length;}if(!length)return;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const v=forward.multiplyScalar(iz).add(right.multiplyScalar(ix));const speed=crouched?1.55:3.15;v.multiplyScalar(speed*dt);const nx=clamp(player.position.x+v.x,worldBounds.minX,worldBounds.maxX),nz=clamp(player.position.z+v.z,worldBounds.minZ,worldBounds.maxZ);
  function blocked(x,z){return blockers.some(b=>Math.abs(x-b.x)<b.hx&&Math.abs(z-b.z)<b.hz);}
  if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;
  player.rotation.y=yaw;walkPhase+=dt*(crouched?5:9);const {body,limbs}=player.userData;body.position.y=crouched?-.36:Math.abs(Math.sin(walkPhase))*.045;limbs.forEach((limb,i)=>{limb.rotation.x=(i%2===0?1:-1)*Math.sin(walkPhase)*(crouched?.14:.38);});
}
function updateEnemies(dt){let threat=0;let noticed=null;
  enemies.forEach(enemy=>{if(!enemy.alive)return;if(enemy.stun>0){enemy.stun-=dt;return;}
    const [wx,wz]=enemy.waypoints[enemy.index],dx=wx-enemy.group.position.x,dz=wz-enemy.group.position.z,d=Math.hypot(dx,dz);
    if(d<.4)enemy.index=(enemy.index+1)%enemy.waypoints.length;else{enemy.group.position.x+=dx/d*enemy.speed*dt;enemy.group.position.z+=dz/d*enemy.speed*dt;enemy.group.rotation.y=Math.atan2(dx,-dz);}
    const ex=player.position.x-enemy.group.position.x,ez=player.position.z-enemy.group.position.z,dist=Math.hypot(ex,ez);if(dist>22) return;
    const facing=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),enemy.group.rotation.y);const dot=facing.dot(new THREE.Vector3(ex,0,ez).normalize());
    const obstructed=!clearShot(enemy.group.position,player.position);const hidden=nearCover();const range=crouched?11:18;const inSight=dist<range&&dot>.22&&!obstructed&&!(hidden&&dist>2.6);
    if(inSight){const power=(crouched?.23:1)*(dist<7?1.4:1);threat=Math.max(threat,24*power);noticed=enemy;}
  });
  // Tank searchlight makes the east side especially dangerous; its turret sweeps, not locks on.
  const tx=player.position.x-tank.position.x,tz=player.position.z-tank.position.z,td=Math.hypot(tx,tz);const tankYaw=Math.sin(elapsed*.37)*.5;turret.rotation.y=tankYaw;cannon.rotation.y=tankYaw;tankBeam.rotation.z=Math.sin(elapsed*.37)*.19;
  const tankFacing=new THREE.Vector3(Math.sin(tankYaw),0,-Math.cos(tankYaw));const tankDot=tankFacing.dot(new THREE.Vector3(tx,0,tz).normalize());const tankActive=td<15&&tankDot>.45&&!nearCover();if(tankActive){threat=Math.max(threat,36);noticed='tank';}
  if(alarm>0){threat=Math.max(threat,alarm>2?15:7);alarm-=dt;}
  if(threat>0){setDetection(detection+threat*dt);if(detection>52&&warningTimer<=0){showWarning(noticed==='tank'?'SEARCHLIGHT ON YOUR POSITION':'A SOLDIER HAS SEEN YOU');}}
  else setDetection(detection-13*dt);
  if(detection>=100){if(damageCooldown<=0){health-=28;damageCooldown=1.1;ui['damage-flash'].classList.remove('hit');void ui['damage-flash'].offsetWidth;ui['damage-flash'].classList.add('hit');showWarning('UNDER FIRE — BREAK THEIR SIGHTLINE');if(health<=0)finish(false);}setDetection(72);}
}
function updateTank(dt){tank.position.x=23+Math.sin(elapsed*.16)*4;tank.rotation.y=Math.sin(elapsed*.16)*.12;}
function updateCamera(dt){const target=new THREE.Vector3(player.position.x,player.position.y+(crouched?1.3:1.55),player.position.z);const distance=aiming?4.7:7.8;const horizontal=Math.cos(pitch)*distance;const ideal=new THREE.Vector3(target.x+Math.sin(yaw)*horizontal,target.y+2.35+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*horizontal);camera.position.lerp(ideal,1-Math.exp(-dt*5.2));camera.lookAt(target.x+Math.sin(yaw)*1.6,target.y+.25,target.z-Math.cos(yaw)*1.6);}
function updateUI(){const meters=Math.max(0,Math.round((player.position.z+27)*1.45));ui.distance.textContent=meters>0?`${String(meters).padStart(2,'0')} M TO COMMAND`:'COMMAND POST AHEAD';if(player.position.z<=-25&&Math.abs(player.position.x)<5)finish(true);}
function update(dt){if(!started||paused||ended)return;elapsed+=dt;fireCooldown=Math.max(0,fireCooldown-dt);damageCooldown=Math.max(0,damageCooldown-dt);toastTimer-=dt;warningTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');if(warningTimer<=0)ui['center-warning'].classList.remove('show');movePlayer(dt);updateEnemies(dt);updateTank(dt);updateCamera(dt);updateUI();}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);if(!started){const t=performance.now()*.00008;camera.position.set(-.6+Math.sin(t)*.5,5.3,33);camera.lookAt(0,0,-5);}renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});

const tankBeam=new THREE.Mesh(new THREE.ConeGeometry(1,1,16,1,true),new THREE.MeshBasicMaterial({color:'#d8bf8d',transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false}));tankBeam.position.set(0,1.9,-8);tankBeam.scale.set(4.5,16,1);tankBeam.rotation.x=-Math.PI/2;tank.add(tankBeam);
