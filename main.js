/* Voxel Dungeon: Mobile Starter (Three.js) */
const canvas = document.getElementById('c');
const roomLabel = document.getElementById('roomLabel');

// ----- Three.js setup -----
const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0b0d, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x09090b, 0.035);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 4);

const ambient = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambient);

// Player light (torch-like)
const plLight = new THREE.PointLight(0xffbd6a, 0.9, 12);
plLight.position.set(0, 1.6, 0);
scene.add(plLight);

// Voxel materials
const MAT = {
  floor: new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.9, metalness: 0 }),
  wall:  new THREE.MeshStandardMaterial({ color: 0x1f1f26, roughness: 0.95 }),
  plat:  new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.8 }),
  portalFrame: new THREE.MeshStandardMaterial({ color: 0x3aa675, emissive: 0x1eaa78, emissiveIntensity: 0.2 }),
  portalCore:  new THREE.MeshStandardMaterial({ color: 0x6fe8c2, emissive: 0x7dffe0, emissiveIntensity: 0.8, transparent:true, opacity:0.7 })
};

// Simple grid helper (1m cubes)
const unit = 1;
const geoCube = new THREE.BoxGeometry(unit, unit, unit);

// World root
let roomRoot = new THREE.Group();
scene.add(roomRoot);

// ----- Player movement (mobile) -----
const state = {
  roomIndex: 1,
  pos: new THREE.Vector3(0, 1.6, 4),
  yaw: 0, pitch: 0,   // radians
  speed: 2.9,         // m/s
  joystick: { active:false, cx:0, cy:0, dx:0, dy:0, el:null, stick:null }
};

// Joystick setup
const joy = document.getElementById('joyL');
const stick = joy.querySelector('.stick');
state.joystick.el = joy; state.joystick.stick = stick;

const joyRect = () => joy.getBoundingClientRect();
function joySet(dx, dy){
  const r = 56; // max stick offset
  const len = Math.hypot(dx, dy);
  const k = len > r ? r/len : 1;
  stick.style.transform = `translate(calc(-50% + ${dx*k}px), calc(-50% + ${dy*k}px))`;
  // normalized -1..1
  state.joystick.dx = (dx*k)/r;
  state.joystick.dy = (dy*k)/r;
}
function joyReset(){ state.joystick.dx=0; state.joystick.dy=0; stick.style.transform = 'translate(-50%,-50%)'; }
joy.addEventListener('touchstart', (e)=>{
  e.preventDefault();
  state.joystick.active = true;
  const r = joyRect(); const t = e.touches[0];
  state.joystick.cx = t.clientX - (r.left + r.width/2);
  state.joystick.cy = t.clientY - (r.top + r.height/2);
  joySet(state.joystick.cx, state.joystick.cy);
}, {passive:false});
joy.addEventListener('touchmove', (e)=>{
  e.preventDefault();
  const r = joyRect(); const t = e.touches[0];
  const dx = t.clientX - (r.left + r.width/2);
  const dy = t.clientY - (r.top + r.height/2);
  joySet(dx, dy);
}, {passive:false});
joy.addEventListener('touchend', (e)=>{ e.preventDefault(); state.joystick.active=false; joyReset(); }, {passive:false});

// Look (swipe on right side)
const lookZone = document.getElementById('lookZone');
let lookActive=false, lastLookX=0, lastLookY=0;
lookZone.addEventListener('touchstart', (e)=>{ e.preventDefault(); lookActive=true; lastLookX=e.touches[0].clientX; lastLookY=e.touches[0].clientY; }, {passive:false});
lookZone.addEventListener('touchmove', (e)=>{
  e.preventDefault(); if(!lookActive) return;
  const x=e.touches[0].clientX, y=e.touches[0].clientY;
  const dx=(x-lastLookX), dy=(y-lastLookY);
  lastLookX=x; lastLookY=y;
  // sensitivity
  state.yaw   -= dx * 0.0042;
  state.pitch -= dy * 0.0035;
  state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
}, {passive:false});
lookZone.addEventListener('touchend', ()=>{ lookActive=false; }, {passive:true});

// ----- Room generation -----
const solids = new Set(); // "x,y,z" strings for collision
function keyOf(x,y,z){ return `${x}|${y}|${z}`; }

function clearRoom(){
  scene.remove(roomRoot);
  roomRoot.traverse(obj=>{ if(obj.isMesh){ obj.geometry.dispose?.(); obj.material.dispose?.(); } });
  roomRoot = new THREE.Group();
  scene.add(roomRoot);
  solids.clear();
}

function addBlock(x,y,z, mat){
  const m = new THREE.Mesh(geoCube, mat);
  m.position.set(x+0.5, y+0.5, z+0.5);
  m.castShadow=false; m.receiveShadow=false;
  roomRoot.add(m);
  solids.add(keyOf(x,y,z));
  return m;
}

function genRoom(idx){
  clearRoom();

  // basic size (w x h x d) in blocks
  const W = 18 + Math.floor(Math.random()*6);   // width
  const D = 18 + Math.floor(Math.random()*6);   // depth
  const H = 6;                                   // height

  // floor layer
  for(let x=0;x<W;x++){
    for(let z=0;z<D;z++){
      addBlock(x,0,z, MAT.floor);
    }
  }
  // walls around
  for(let x=0;x<W;x++){
    for(let y=1;y<H;y++){
      addBlock(x,y,0, MAT.wall);
      addBlock(x,y,D-1, MAT.wall);
    }
  }
  for(let z=0;z<D;z++){
    for(let y=1;y<H;y++){
      addBlock(0,y,z, MAT.wall);
      addBlock(W-1,y,z, MAT.wall);
    }
  }
  // random interior pillars/platforms
  const pillars = 6 + Math.floor(Math.random()*6);
  for(let i=0;i<pillars;i++){
    const px = 2 + Math.floor(Math.random()*(W-4));
    const pz = 2 + Math.floor(Math.random()*(D-4));
    const ph = 2 + Math.floor(Math.random()*3);
    for(let y=1;y<=ph;y++) addBlock(px,y,pz, MAT.plat);
    // small platforms around
    if(Math.random()<0.5){
      addBlock(px+1, ph+1, pz, MAT.plat);
      if(Math.random()<0.5) addBlock(px+1, ph+1, pz+1, MAT.plat);
    }
  }

  // torches (point lights)
  for(let i=0;i<4;i++){
    const tx = 2 + Math.floor(Math.random()*(W-4));
    const tz = (i%2)? 1 : D-2;
    const ty = 3;
    const s = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color:0xffbd6a });
    const torch = new THREE.Mesh(s, mat);
    torch.position.set(tx+0.5, ty+0.5, tz+0.5);
    roomRoot.add(torch);
    const l = new THREE.PointLight(0xffbd6a, 0.8, 10);
    l.position.copy(torch.position);
    roomRoot.add(l);
  }

  // portal to next room
  const doorSide = Math.floor(Math.random()*4);
  const frameY = 1;
  let px = (doorSide===0)? Math.floor(W/2) : (doorSide===1? Math.floor(W/2) : (doorSide===2? 1 : W-2));
  let pz = (doorSide<2)? ((doorSide===0)? 1 : D-2) : Math.floor(D/2);
  if(doorSide>=2){ px = (doorSide===2)? 1 : W-2; }

  // frame
  for(let y=frameY; y<frameY+3; y++){
    addBlock(px-1,y,pz, MAT.portalFrame);
    addBlock(px+1,y,pz, MAT.portalFrame);
  }
  addBlock(px, frameY+3, pz, MAT.portalFrame);
  // core (flat pane)
  const plane = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.8), MAT.portalCore);
  plane.position.set(px+0.5, frameY+1.6, pz+0.5);
  roomRoot.add(plane);
  plane.userData.isPortal = true;

  // store bounds for simple collision
  roomRoot.userData.bounds = { W, D };
  // spawn player a few blocks inside
  if(doorSide===0) camera.position.set(px+0.5, 1.6, pz+4.5);
  if(doorSide===1) camera.position.set(px+0.5, 1.6, pz-4.5);
  if(doorSide===2) camera.position.set(px+4.5, 1.6, pz+0.5);
  if(doorSide===3) camera.position.set(px-4.5, 1.6, pz+0.5);
  state.pos.copy(camera.position);
  state.yaw = 0; state.pitch = 0;
}

// ----- movement & collision (starter-simple) -----
function tryMove(dx, dz, dt){
  const speed = state.speed * (1 + 0.25 * 0); // no buffs yet in starter
  let nx = state.pos.x + dx * speed * dt;
  let nz = state.pos.z + dz * speed * dt;

  // simple bounding box against walls: keep inside room bounds (leave 1-block wall)
  const b = roomRoot.userData.bounds || { W:30, D:30 };
  const pad = 1.2;
  nx = Math.min(b.W - pad, Math.max(pad, nx));
  nz = Math.min(b.D - pad, Math.max(pad, nz));

  state.pos.set(nx, 1.6, nz);
  camera.position.copy(state.pos);
  plLight.position.copy(state.pos);
}

function updateLook(){
  // apply yaw/pitch to camera
  camera.rotation.set(0, 0, 0);
  camera.rotateY(state.yaw);
  camera.rotateX(state.pitch);
}

// ----- portal check -----
function checkPortal(){
  let hitPortal = false;
  roomRoot.traverse(obj=>{
    if(hitPortal || !obj.userData?.isPortal) return;
    const d = obj.position.distanceTo(state.pos);
    if(d < 1.6) hitPortal = true;
  });
  if(hitPortal){
    state.roomIndex++;
    roomLabel.textContent = `Room ${state.roomIndex}`;
    genRoom(state.roomIndex);
  }
}

// ----- main loop -----
let last = performance.now();
function tick(){
  const now = performance.now();
  const dt = Math.min(0.05, (now - last)/1000); // seconds
  last = now;

  // joystick vector → camera space
  const jx = state.joystick.dx; // -1..1
  const jy = state.joystick.dy; // -1..1
  // forward is -jy, right is jx
  const cos = Math.cos(state.yaw), sin = Math.sin(state.yaw);
  const dx = ( jx * cos) + ( -jy * sin);
  const dz = ( jx * sin) + ( -jy * cos);
  tryMove(dx, dz, dt);
  updateLook();
  checkPortal();

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

window.addEventListener('resize', ()=>{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// Start
genRoom(state.roomIndex);
tick();
