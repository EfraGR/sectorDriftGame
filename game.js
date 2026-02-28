const W = 800, H = 600;


const F = (() => {
  let ctx = null;
  const init = () => {
    if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.state==='suspended') ctx.resume();
  };

  
  let master = null;
  const getMaster = () => {
    init();
    if(!master){ master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination); }
    return master;
  };

  const osc = (type, freq, gainVal, duration, freqEnd, detune=0) => {
    const ac = ctx;
    const g = ac.createGain();
    g.gain.setValueAtTime(gainVal, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    g.connect(getMaster());
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if(freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration);
    o.detune.value = detune;
    o.connect(g);
    o.start();
    o.stop(ac.currentTime + duration);
  };

  const noise = (gainVal, duration, filterFreq=2000) => {
    init();
    const bufSize = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<bufSize;i++) data[i] = Math.random()*2-1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = filterFreq;
    filt.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filt); filt.connect(g); g.connect(getMaster());
    src.start(); src.stop(ctx.currentTime + duration);
  };

  let engineNode = null, engineGain = null;
  let enginePlaying = false;

  return {
    
    startEngine() {
      init();
      if(enginePlaying) return;
      enginePlaying = true;
      engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0.001, ctx.currentTime);
      engineGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
      engineGain.connect(getMaster());
      engineNode = ctx.createOscillator();
      engineNode.type = 'sawtooth';
      engineNode.frequency.value = 80;
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 14;
      lfoGain.gain.value = 18;
      lfo.connect(lfoGain); lfoGain.connect(engineNode.frequency);
      lfo.start(); engineNode.connect(engineGain); engineNode.start();
      this._engineLfo = lfo;
    },
    stopEngine() {
      if(!enginePlaying || !engineGain) return;
      enginePlaying = false;
      engineGain.gain.setValueAtTime(engineGain.gain.value, ctx.currentTime);
      engineGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      const n = engineNode, g = engineGain, lfo = this._engineLfo;
      setTimeout(()=>{ try{n.stop();g.disconnect();lfo.stop();}catch(e){} }, 180);
      engineNode = null; engineGain = null;
    },

    shoot() {
      init();
      osc('square', 680, 0.22, 0.08, 180);
      noise(0.12, 0.06, 3000);
    },

    towerActivate() {
      init();
      
      [330, 440, 660, 880].forEach((f,i) => {
        setTimeout(()=>{ osc('sine', f, 0.28, 0.55, f*1.2); }, i*55);
      });
    },

    allTowersActivated() {
      init();
      
      [262,330,392,523,659,784].forEach((f,i)=>{
        setTimeout(()=>{ osc('triangle', f, 0.35, 0.7, f*1.05); }, i*70);
      });
    },

    portalSpawn() {
      init();
      
      osc('sawtooth', 55, 0.4, 1.8, 28);
      osc('sine',    110, 0.25, 1.4, 220);
      setTimeout(()=>{ noise(0.2, 0.6, 400); }, 400);
    },

    portalEnter() {
      init();
      
      osc('sawtooth', 120, 0.5, 1.2, 2400);
      noise(0.3, 1.0, 1200);
      osc('sine', 220, 0.3, 1.2, 3000);
    },

    collectItem() {
      init();
      osc('sine', 523, 0.25, 0.25, 880);
      osc('sine', 659, 0.18, 0.2, 1046, 0);
    },

    damage() {
      init();
      noise(0.35, 0.18, 180);
      osc('sawtooth', 90, 0.3, 0.2, 60);
    },

    land() {
      init();
      osc('sine', 200, 0.15, 0.3, 120);
      noise(0.08, 0.15, 600);
    },

    enemyDie() {
      init();
      noise(0.28, 0.3, 350);
      osc('sawtooth', 150, 0.2, 0.3, 55);
    },

    sectorStart() {
      init();
      
      [880, 660, 440, 880].forEach((f,i)=>{
        setTimeout(()=>{ osc('square', f, 0.22, 0.18); }, i*90);
      });
    },

    brake() {
      init();
      noise(0.1, 0.12, 800);
    },

    shipDestroy() {
      init();
      
      osc('sine', 60, 0.6, 1.4, 20);
      
      osc('sawtooth', 180, 0.45, 0.9, 40);
      
      noise(0.5, 0.25, 2200);
      
      setTimeout(()=>{ noise(0.3, 0.4, 600); }, 120);
      setTimeout(()=>{ osc('sawtooth', 90, 0.25, 0.7, 30); }, 200);
      
      setTimeout(()=>{ noise(0.18, 0.8, 200); }, 350);
      setTimeout(()=>{ osc('sine', 45, 0.2, 1.0, 18); }, 400);
    },

    
    _musicGain: null,
    _musicNodes: [],
    _musicRunning: false,

    startMusic() {
      init();
      if(this._musicRunning) return;
      this._musicRunning = true;

      
      const musicBus = ctx.createGain();
      musicBus.gain.value = 0; 
      musicBus.connect(ctx.destination);
      this._musicGain = musicBus;

      
      musicBus.gain.linearRampToValueAtTime(2.18, ctx.currentTime + 4);

      
      
      const chords = [
        [110, 165, 220, 277],   
        [87,  130, 174, 220],   
        [65,  98,  130, 196],   
        [98,  147, 196, 247],   
      ];
      const chordDur = 8; 
      let chordIdx = 0;
      const nodes = [];

      const playChord = () => {
        if(!this._musicRunning) return;
        const freqs = chords[chordIdx % chords.length];
        freqs.forEach((freq, fi) => {
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.06 - fi*0.008, ctx.currentTime + 2.5);
          g.gain.setValueAtTime(0.06 - fi*0.008, ctx.currentTime + chordDur - 2);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + chordDur);
          g.connect(musicBus);

          const o = ctx.createOscillator();
          o.type = fi===0 ? 'sine' : 'triangle';
          o.frequency.value = freq;
          
          const lfo = ctx.createOscillator();
          const lfoG = ctx.createGain();
          lfo.frequency.value = 0.18 + fi*0.04;
          lfoG.gain.value = freq * 0.006;
          lfo.connect(lfoG); lfoG.connect(o.frequency);
          lfo.start(); o.connect(g); o.start();
          o.stop(ctx.currentTime + chordDur + 0.1);
          lfo.stop(ctx.currentTime + chordDur + 0.1);
          nodes.push(o, lfo, g);
        });
        chordIdx++;
      };

      
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type = 'sine';
      drone.frequency.value = 36.7; 
      droneGain.gain.value = 0.04;
      drone.connect(droneGain); droneGain.connect(musicBus);
      drone.start();
      nodes.push(drone, droneGain);

      
      const breathLfo = ctx.createOscillator();
      const breathGain = ctx.createGain();
      breathLfo.frequency.value = 0.07;
      breathGain.gain.value = 0.025;
      breathLfo.connect(breathGain); breathGain.connect(droneGain.gain);
      breathLfo.start();
      nodes.push(breathLfo, breathGain);

      
      const shimmerFreqs = [880, 1108, 1320, 1760, 987, 1174];
      const playShimmer = () => {
        if(!this._musicRunning) return;
        const freq = shimmerFreqs[Math.floor(Math.random()*shimmerFreqs.length)];
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.8);
        g2.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.5);
        g2.connect(musicBus);
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = freq;
        o2.connect(g2); o2.start(); o2.stop(ctx.currentTime + 3.6);
        nodes.push(o2, g2);
        const nextShimmer = 4000 + Math.random()*8000;
        setTimeout(playShimmer, nextShimmer);
      };
      setTimeout(playShimmer, 6000);

      
      playChord();
      const chordInterval = setInterval(()=>{
        if(!this._musicRunning){ clearInterval(chordInterval); return; }
        playChord();
      }, chordDur * 1000);
      nodes.push({ stop: ()=> clearInterval(chordInterval) });

      this._musicNodes = nodes;
    },

    stopMusic(fadeDur=2) {
      if(!this._musicRunning || !this._musicGain) return;
      this._musicRunning = false;
      const g = this._musicGain;
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeDur);
      setTimeout(()=>{
        this._musicNodes.forEach(n=>{ try{ if(n.stop) n.stop(); if(n.disconnect) n.disconnect(); }catch(e){} });
        this._musicNodes = [];
        try{ g.disconnect(); }catch(e){}
        this._musicGain = null;
      }, (fadeDur+0.3)*1000);
    },

    unlock() { this.init = init; }
  };
})();


function dist(x1,y1,x2,y2){ return Math.sqrt((x2-x1)**2+(y2-y1)**2); }
function angleTo(x1,y1,x2,y2){ return Math.atan2(y2-y1,x2-x1); }
function lerp(a,b,t){ return a+(b-a)*t; }

function hasLineOfSight(x1,y1,x2,y2,planets){
  for(const p of planets){

    const dx=x2-x1, dy=y2-y1;
    const len2=dx*dx+dy*dy;
    if(len2===0) return true;
    let t=((p.x-x1)*dx+(p.y-y1)*dy)/len2;
    t=Math.max(0,Math.min(1,t));
    const cx=x1+t*dx, cy=y1+t*dy;
    if(dist(cx,cy,p.x,p.y)<p.radius-2) return false;
  }
  return true;
}

class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }

  create(){
    this._page = 'main'; 
    this._objs = [];
    this.drawBg();
    this.showMain();
    
    this.input.once('pointerdown', ()=>{ try{ F.startEngine(); F.stopEngine(); }catch(e){} });
    
    this.input.keyboard.on('keydown', e => {
      if(e.key==='START1') this.scene.start('g');
    });
  }

  drawBg(){
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x000000,1); g.fillRect(0,0,W,H);
    
    for(let y=0;y<H;y+=4){ g.fillStyle(0x000011,0.3); g.fillRect(0,y,W,2); }
    
    for(let i=0;i<220;i++){
      const sz=Math.random()<0.04?2:0.8;
      g.fillStyle(0xffffff,Phaser.Math.FloatBetween(0.1,0.7));
      g.fillCircle(Phaser.Math.Between(0,W),Phaser.Math.Between(0,H),sz);
    }
    
    g.lineStyle(1,0x001133,0.4);
    for(let x=0;x<=W;x+=28){ g.lineBetween(x,H,W/2,H*0.72); }
    g.lineStyle(1,0x001133,0.25);
    for(let i=0;i<8;i++){
      const t=i/8, y=H*0.72+t*(H-H*0.72);
      g.lineBetween(0,y,W,y);
    }
    this._bgGfx = g;
  }

  clearPage(){
    this._objs.forEach(o=>{ try{ o.destroy(); }catch(e){} });
    this._objs = [];
  }

  addObj(o){ this._objs.push(o); return o; }

  btn(x, y, label, color, cb){
    const t = this.addObj(
        this.add.text(x, y, label, {
          fontSize:'22px', fontFamily:'Courier New', color, stroke:'#000000', strokeThickness:2
        }).setOrigin(0.5).setInteractive().setDepth(10)
    );
    t.on('pointerover', ()=>{ t.setColor('#ffffff'); t.setScale(1.06); });
    t.on('pointerout',  ()=>{ t.setColor(color); t.setScale(1); });
    t.on('pointerdown', cb);
    return t;
  }

  showMain(){
    this.clearPage();
    
    const t1 = this.addObj(this.add.text(W/2,148,'SECTOR',{fontSize:'72px',fontFamily:'Courier New',color:'#00ffff',stroke:'#003366',strokeThickness:4}).setOrigin(0.5).setDepth(5));
    const t2 = this.addObj(this.add.text(W/2,222,'DRIFT', {fontSize:'72px',fontFamily:'Courier New',color:'#ff6600',stroke:'#330000',strokeThickness:4}).setOrigin(0.5).setDepth(5));
    this.addObj(this.add.text(W/2,285,'Navigate · Land · Activate · Escape',{fontSize:'13px',fontFamily:'Courier New',color:'#556677'}).setOrigin(0.5).setDepth(5));

    this.tweens.add({targets:[t1,t2],alpha:{from:0.5,to:1},duration:1400,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    this.btn(W/2, 355, '▶  PLAY',          '#ffff00', ()=>this.scene.start('g'));
    this.btn(W/2, 405, '?  INSTRUCTIONS',  '#44ccff', ()=>this.showInstructions());
    this.btn(W/2, 455, '★  LEADERBOARD',   '#ffcc44', ()=>this.showLeaderboard());

    
    this.addObj(this.add.text(W-8,H-10,'v1.0',{fontSize:'9px',fontFamily:'Courier New',color:'#223344'}).setOrigin(1,1).setDepth(5));
  }

  showInstructions(){
    this.clearPage();

    
    this.addObj(this.add.text(W/2,28,'INSTRUCTIONS',{fontSize:'20px',fontFamily:'Courier New',color:'#44ccff',stroke:'#001133',strokeThickness:2,letterSpacing:4}).setOrigin(0.5).setDepth(5));
    const lineG = this.addObj(this.add.graphics().setDepth(5));
    lineG.lineStyle(1,0x224466,1); lineG.lineBetween(40,44,W-40,44);

    const sections = [
      { title:'✦ OBJECTIVE', color:'#ffff00', items:[
          'Land near each antenna for 2s to activate it.',
          'Activate them all and a black hole appears — enter it to advance.',
        ]},
      { title:'✦ CONTROLS', color:'#44ccff', items:[
          'WASD / Arrows  →  Rotate and thrust',
          'SPACE            →  Emergency brake',
          'K / P1A           →  Shoot  (uses energy)',
        ]},
      { title:'✦ RESOURCES', color:'#00ff88', items:[
          'Land on planets to absorb FUEL, ENERGY and HEALTH.',
          'Collect floating fuel depots ⛽ to refuel.',
          'If fuel hits 0 in space you have 3s before g over.',
        ]},
      { title:'✦ UPGRADES  (Floating debris)', color:'#ffaa44', items:[
          '⚡ WEAPON      →  Lv1:1 shot  Lv2:2 shots  Lv3:3 shots (more dmg)',
          '⛽ EXTRA TANK  →  +15 max fuel per level',
          '🔧 HEALTH       →  Restores +30 HP on pickup (max 3 times)',
        ]},
      { title:'✦ ENEMIES', color:'#ff4444', items:[
          '🔴 Fighter   – 1 red shot. Sector 1+',
          '🟠 D.Fighter – 2 orange spread shots. Sector 3+',
          '🔵 Drone     – rapid cyan burst. Sector 5+',
          '🟣 Bomber    – slow triple purple shot. Sector 7+',
          'Enemies dodge planets and chase your last known position.',
        ]},
      { title:'✦ PHYSICS', color:'#aa88ff', items:[
          'Each planet has gravity: the closer you are the stronger the pull.',
          'Landing at speed >80 damages the ship.',
          'Asteroids bounce off planets and split when shot.',
          'Bullets do not pass through planets.',
        ]},
    ];

    let y = 60;
    sections.forEach(sec=>{
      this.addObj(this.add.text(30,y,sec.title,{fontSize:'12px',fontFamily:'Courier New',color:sec.color,letterSpacing:2}).setDepth(5));
      y+=18;
      sec.items.forEach(item=>{
        this.addObj(this.add.text(44,y,'· '+item,{fontSize:'10px',fontFamily:'Courier New',color:'#7788aa',wordWrap:{width:W-80}}).setDepth(5));
        y+=14;
      });
      y+=6;
    });

    lineG.lineBetween(40,y,W-40,y);
    this.btn(W/2, y+30, '←  BACK', '#aaaaaa', ()=>this.showMain());
  }

  showLeaderboard(){
    this.clearPage();

    this.addObj(this.add.text(W/2,28,'✦  HALL OF FAME  ✦',{fontSize:'22px',fontFamily:'Courier New',color:'#ffdd00',stroke:'#443300',strokeThickness:3}).setOrigin(0.5).setDepth(5));

    const lineG = this.addObj(this.add.graphics().setDepth(5));
    lineG.lineStyle(1,0x334455,0.8);
    lineG.lineBetween(40,50,W-40,50);

    
    this.addObj(this.add.text(W/2-130,64,'#',      {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0.5).setDepth(5));
    this.addObj(this.add.text(W/2-88, 64,'NAME', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    this.addObj(this.add.text(W/2+16, 64,'PUNTOS', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    this.addObj(this.add.text(W/2+108,64,'SECT',   {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    lineG.lineBetween(40,74,W-40,74);

    let scores = [];
    try{ scores = JSON.parse(localStorage.getItem('spaceSectorsLB')||'[]'); }catch(e){}

    const medals = ['🥇','🥈','🥉'];
    if(scores.length===0){
      this.addObj(this.add.text(W/2,200,'NO RECORDS YET\nPlay to appear here',{fontSize:'14px',fontFamily:'Courier New',color:'#223344',align:'center'}).setOrigin(0.5).setDepth(5));
    } else {
      scores.slice(0,10).forEach((s,i)=>{
        const y = 90+i*34;
        const isTop = i<3;
        const rankCol = i===0?0xffdd00:i===1?0xcccccc:i===2?0xcc8844:0x445566;
        const rankHex = '#'+rankCol.toString(16).padStart(6,'0');

        if(isTop){
          const rg = this.addObj(this.add.graphics().setDepth(4));
          rg.fillStyle(rankCol,0.07); rg.fillRect(40,y-13,W-80,28);
        }

        this.addObj(this.add.text(W/2-130,y, i<3?medals[i]:`${i+1}.`, {fontSize:isTop?'16px':'12px',fontFamily:'Courier New',color:rankHex}).setOrigin(0.5).setDepth(5));
        this.addObj(this.add.text(W/2-88,  y, s.name,                   {fontSize:'18px',fontFamily:'Courier New',color:isTop?'#ffffff':'#7788aa'}).setOrigin(0,0.5).setDepth(5));
        this.addObj(this.add.text(W/2+16,  y, String(s.score).padStart(7), {fontSize:'15px',fontFamily:'Courier New',color:rankHex}).setOrigin(0,0.5).setDepth(5));
        this.addObj(this.add.text(W/2+112, y, `${s.sector}`,              {fontSize:'12px',fontFamily:'Courier New',color:'#445566'}).setOrigin(0,0.5).setDepth(5));
      });
    }

    const clearBtn = this.addObj(this.add.text(W/2-70,H-55,'[ CLEAR ]',{fontSize:'13px',fontFamily:'Courier New',color:'#553333'}).setOrigin(0.5).setDepth(5).setInteractive());
    clearBtn.on('pointerover',()=>clearBtn.setColor('#ff4444'));
    clearBtn.on('pointerout', ()=>clearBtn.setColor('#553333'));
    clearBtn.on('pointerdown',()=>{
      try{ localStorage.removeItem('spaceSectorsLB'); }catch(e){}
      this.showLeaderboard();
    });

    this.btn(W/2+70, H-55, '←  BACK', '#aaaaaa', ()=>this.showMain());
  }
}

class GameOverScene extends Phaser.Scene {
  constructor(){ super('GameOver'); }
  init(data){ this.finalScore=data.score||0; this.sector=data.sector||1; this.reason=data.reason||'hull'; }

  create(){
    this.nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    this.nameIdx = [0,0,0]; 
    this.cursor = 0;
    this.submitted = false;
    this.scores = this.loadScores();
    this.phase = 'entry'; 

    this.drawBg();
    this.buildEntryUI();

    
    this.input.keyboard.on('keydown', e => this.handleKey(e));
  }

  drawBg(){
    const g = this.add.graphics();
    g.fillStyle(0x000000,1); g.fillRect(0,0,W,H);
    
    for(let y=0;y<H;y+=4){
      g.fillStyle(0x000011, 0.35); g.fillRect(0,y,W,2);
    }
    
    for(let i=0;i<200;i++){
      const sz=Math.random()<0.05?1.5:0.8;
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1,0.6));
      g.fillCircle(Phaser.Math.Between(0,W), Phaser.Math.Between(0,H), sz);
    }
    
    g.lineStyle(1,0x001133,0.5);
    for(let x=0;x<W;x+=32) g.lineBetween(x,H*0.7,W/2,H);
    for(let x=0;x<W;x+=32) g.lineBetween(x,H,W/2,H*0.7);
  }

  buildEntryUI(){
    const msg = this.reason==='fuel' ? '★  OUT OF FUEL  ★' : '★  SHIP DESTROYED  ★';
    const col = this.reason==='fuel' ? '#ffaa00' : '#ff4422';

    
    const title = this.add.text(W/2, 55, msg, {
      fontSize:'22px', fontFamily:'Courier New', color:col,
      stroke:'#000000', strokeThickness:3
    }).setOrigin(0.5);
    this.tweens.add({targets:title, alpha:{from:0.6,to:1}, duration:180, yoyo:true, repeat:-1});

    
    this.add.text(W/2, 98, `SCORE`, {fontSize:'11px', fontFamily:'Courier New', color:'#445566', letterSpacing:4}).setOrigin(0.5);
    this.add.text(W/2, 118, `${this.finalScore}`, {fontSize:'36px', fontFamily:'Courier New', color:'#ffff00', stroke:'#555500', strokeThickness:3}).setOrigin(0.5);
    this.add.text(W/2, 158, `SECTOR ${this.sector}`, {fontSize:'14px', fontFamily:'Courier New', color:'#4488aa'}).setOrigin(0.5);

    
    this.add.text(W/2, 200, 'ENTER YOUR NAME', {fontSize:'13px', fontFamily:'Courier New', color:'#aaccff', letterSpacing:3}).setOrigin(0.5);
    this.add.text(W/2, 218, '↑↓ CHANGE  ←→ CURSOR  ENTER CONFIRM', {fontSize:'8px', fontFamily:'Courier New', color:'#334455', letterSpacing:1}).setOrigin(0.5);

    
    this._letterObjs = [];
    this._cursorGfx = this.add.graphics().setDepth(5);
    for(let i=0;i<3;i++){
      const x = W/2 + (i-1)*52;
      const ltr = this.add.text(x, 258, this.nameChars[this.nameIdx[i]], {
        fontSize:'42px', fontFamily:'Courier New', color:'#ffffff',
        stroke:'#000033', strokeThickness:4
      }).setOrigin(0.5);
      this._letterObjs.push(ltr);
    }
    this.redrawCursor();

    
    this._lbGroup = [];
    this.drawLeaderboardPreview();

    
    this._submitHint = this.add.text(W/2, 320, '▶  PRESS ENTER TO SUBMIT  ◀', {
      fontSize:'12px', fontFamily:'Courier New', color:'#44ff88', letterSpacing:2
    }).setOrigin(0.5);
    this.tweens.add({targets:this._submitHint, alpha:{from:0.3,to:1}, duration:600, yoyo:true, repeat:-1});
  }

  redrawCursor(){
    const g = this._cursorGfx;
    g.clear();
    const x = W/2 + (this.cursor-1)*52;
    g.lineStyle(3, 0x00ffff, 0.8);
    g.strokeRect(x-22, 238, 44, 50);
    
    g.lineStyle(2, 0x00ffff, 0.5);
    [[x-22,238],[x+22,238],[x-22,288],[x+22,288]].forEach(([cx,cy],i)=>{
      const sx=i%2===0?1:-1, sy=i<2?1:-1;
      g.lineBetween(cx,cy,cx+sx*8,cy);
      g.lineBetween(cx,cy,cx,cy+sy*8);
    });
  }

  drawLeaderboardPreview(){
    this._lbGroup.forEach(o=>o.destroy());
    this._lbGroup=[];
    const scores = this.scores.slice(0,8);

    const hdr = this.add.text(W/2, 340, '—  HALL OF FAME  —', {fontSize:'11px', fontFamily:'Courier New', color:'#335566', letterSpacing:4}).setOrigin(0.5);
    this._lbGroup.push(hdr);

    scores.forEach((s,i)=>{
      const y = 360 + i*22;
      const rankCol = i===0?'#ffdd00':i===1?'#cccccc':i===2?'#cc8844':'#445566';
      const rank = this.add.text(W/2-120, y, `${i+1}.`.padStart(3), {fontSize:'12px', fontFamily:'Courier New', color:rankCol}).setOrigin(0,0.5);
      const name = this.add.text(W/2-95, y, s.name, {fontSize:'13px', fontFamily:'Courier New', color:i<3?'#ffffff':'#8899aa'}).setOrigin(0,0.5);
      const sc = this.add.text(W/2+30, y, String(s.score).padStart(7,' '), {fontSize:'13px', fontFamily:'Courier New', color:rankCol}).setOrigin(0,0.5);
      const sec = this.add.text(W/2+105, y, `S${s.sector}`, {fontSize:'10px', fontFamily:'Courier New', color:'#334455'}).setOrigin(0,0.5);
      this._lbGroup.push(rank,name,sc,sec);
    });

    if(scores.length===0){
      const empty = this.add.text(W/2,380,'NO RECORDS YET',{fontSize:'12px',fontFamily:'Courier New',color:'#223344'}).setOrigin(0.5);
      this._lbGroup.push(empty);
    }
  }

  handleKey(e){
    if(this.submitted) return;
    const k = e.key;
    if(k==='ArrowUp'||k==='w'||k==='W'||k==='P1U'){
      this.nameIdx[this.cursor]=(this.nameIdx[this.cursor]+1)%this.nameChars.length;
      this._letterObjs[this.cursor].setText(this.nameChars[this.nameIdx[this.cursor]]);
    } else if(k==='ArrowDown'||k==='s'||k==='S'||k==='P1D'){
      this.nameIdx[this.cursor]=(this.nameIdx[this.cursor]-1+this.nameChars.length)%this.nameChars.length;
      this._letterObjs[this.cursor].setText(this.nameChars[this.nameIdx[this.cursor]]);
    } else if(k==='ArrowRight'||k==='d'||k==='D'||k==='P1R'){
      this.cursor=Math.min(2,this.cursor+1); this.redrawCursor();
    } else if(k==='ArrowLeft'||k==='a'||k==='A'||k==='P1L'){
      this.cursor=Math.max(0,this.cursor-1); this.redrawCursor();
    } else if(k==='Enter'||k===' '||k==='P1A'||k==='P1B'||k==='START1'){
      this.submitScore();
    }
  }

  submitScore(){
    if(this.submitted) return;
    this.submitted=true;
    const name = this.nameIdx.map(i=>this.nameChars[i]).join('');
    this.saveScore(name, this.finalScore, this.sector);
    this.scores = this.loadScores();

    
    this._submitHint.setText('✦  SUBMITTED  ✦').setColor('#ffff00');
    this._cursorGfx.clear();
    this._letterObjs.forEach((l,i)=>{ l.setColor('#ffff00'); });

    this.time.delayedCall(900, ()=>{ this.showFullBoard(); });
  }

  showFullBoard(){
    
    this.children.list.slice(0).forEach(o=>{
      if(o.type==='Graphics'||o.type==='Text') try{ o.destroy(); }catch(e){}
    });

    this.drawBg();
    const scores = this.scores;

    this.add.text(W/2, 32, '✦  HALL OF FAME  ✦', {
      fontSize:'26px', fontFamily:'Courier New', color:'#ffdd00',
      stroke:'#443300', strokeThickness:3
    }).setOrigin(0.5);

    const lineG = this.add.graphics();
    lineG.lineStyle(1,0x334455,0.8); lineG.lineBetween(W/2-160,58,W/2+160,58);

    
    this.add.text(W/2-130, 70, '#', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0.5);
    this.add.text(W/2-85, 70, 'NAME', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    this.add.text(W/2+20, 70, 'PUNTOS', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    this.add.text(W/2+105, 70, 'SECT', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    lineG.lineBetween(W/2-160,80,W/2+160,80);

    const medals = ['🥇','🥈','🥉'];
    scores.slice(0,10).forEach((s,i)=>{
      const y = 96 + i*34;
      const isTop = i<3;
      const rankCol = i===0?0xffdd00:i===1?0xcccccc:i===2?0xcc8844:0x334455;
      const rankHex = '#'+rankCol.toString(16).padStart(6,'0');

      
      if(isTop){
        const rowG = this.add.graphics();
        rowG.fillStyle(rankCol, 0.06);
        rowG.fillRect(W/2-160, y-12, 320, 28);
      }

      const rankTxt = i<3 ? medals[i] : `${i+1}.`;
      this.add.text(W/2-130, y, rankTxt, {fontSize:isTop?'16px':'12px', fontFamily:'Courier New', color:rankHex}).setOrigin(0.5);
      this.add.text(W/2-85, y, s.name, {fontSize:'18px', fontFamily:'Courier New', color:isTop?'#ffffff':'#7788aa'}).setOrigin(0,0.5);
      this.add.text(W/2+20, y, String(s.score).padStart(7), {fontSize:'16px', fontFamily:'Courier New', color:rankHex}).setOrigin(0,0.5);
      this.add.text(W/2+112, y, `${s.sector}`, {fontSize:'13px', fontFamily:'Courier New', color:'#445566'}).setOrigin(0,0.5);
    });

    lineG.lineBetween(W/2-160, 96+10*34-8, W/2+160, 96+10*34-8);

    const retry = this.add.text(W/2-80, H-60, '[ RETRY ]', {fontSize:'16px', fontFamily:'Courier New', color:'#44ff88', stroke:'#002200', strokeThickness:2}).setOrigin(0.5).setInteractive();
    retry.on('pointerover',()=>retry.setColor('#ffffff'));
    retry.on('pointerout',()=>retry.setColor('#44ff88'));
    retry.on('pointerdown',()=>this.scene.start('g'));

    const menu = this.add.text(W/2+80, H-60, '[ MENU ]', {fontSize:'16px', fontFamily:'Courier New', color:'#aaaaaa'}).setOrigin(0.5).setInteractive();
    menu.on('pointerover',()=>menu.setColor('#ffffff'));
    menu.on('pointerout',()=>menu.setColor('#aaaaaa'));
    menu.on('pointerdown',()=>this.scene.start('Menu'));

    
    this.tweens.add({targets:[retry,menu], alpha:{from:0.7,to:1}, duration:800, yoyo:true, repeat:-1});
  }

  loadScores(){
    try{
      const raw = localStorage.getItem('spaceSectorsLB');
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  saveScore(name, score, sector){
    try{
      let scores = this.loadScores();
      scores.push({name, score, sector});
      scores.sort((a,b)=>b.score-a.score);
      scores = scores.slice(0,10);
      localStorage.setItem('spaceSectorsLB', JSON.stringify(scores));
    }catch(e){}
  }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('g'); }

  init(){
    this.sector = 1;
    this.score = 0;

    this.upgrades = { weapon:0, extraTank:0 };
  }

  create(){
    this.cameras.main.setBackgroundColor('#00000f');
    this.generateSector();
    this.createShip();
    this.createUI();
    this.createInput();
    this.sectorTransition = false;
    F.startMusic();
  }

  generateSector(){

    if(this.fuelDepots) this.fuelDepots.forEach(f=>{ if(f.gfx) f.gfx.destroy(); if(f.label) f.label.destroy(); });
    if(this.asteroids) this.asteroids.forEach(a=>{ if(a.gfx) a.gfx.destroy(); });
    if(this.planets) this.planets.forEach(p=>{ if(p.gfx) p.gfx.destroy(); if(p.label) p.label.destroy(); if(p.ring) p.ring.destroy(); });
    if(this.towers) this.towers.forEach(t=>{ if(t.gfx) t.gfx.destroy(); if(t.beam) t.beam.destroy(); if(t.timer) t.timer.destroy(); });
    if(this.enemies) this.enemies.forEach(e=>{ if(e.gfx) e.gfx.destroy(); });
    if(this.bullets) this.bullets.forEach(b=>{ if(b.gfx) b.gfx.destroy(); });
    if(this.enemyBullets) this.enemyBullets.forEach(b=>{ if(b.gfx) b.gfx.destroy(); });
    if(this.wrecks) this.wrecks.forEach(w=>{ if(w.gfx) w.gfx.destroy(); if(w.label) w.label.destroy(); });
    if(this.portalGfx){ this.portalGfx.destroy(); this.portalGfx=null; }
    if(this.starfield) this.starfield.destroy();
    if(this.sectorLabel) this.sectorLabel.destroy();
    if(this.particles) this.particles.destroy();
    if(this.planetTurrets) this.planetTurrets.forEach(t=>{ if(t.gfx) t.gfx.destroy(); });

    const s = this.sector;
    const g = this.add.graphics();
    this.starfield = g;

    for(let i=0;i<180;i++){
      const x=Phaser.Math.Between(0,W), y=Phaser.Math.Between(0,H);
      const r=Phaser.Math.FloatBetween(0.5,1.8);
      const bright = Phaser.Math.FloatBetween(0.2,0.9);
      g.fillStyle(0xffffff, bright);
      g.fillCircle(x,y,r);
    }

    for(let i=0;i<4;i++){
      const x=Phaser.Math.Between(50,W-50), y=Phaser.Math.Between(50,H-50);
      const col = [0x001133,0x110022,0x001122,0x002211][i%4];
      g.fillStyle(col, 0.3);
      g.fillEllipse(x,y,Phaser.Math.Between(80,200),Phaser.Math.Between(60,150));
    }

    this.sectorLabel = this.add.text(W/2, 18, `SECTOR ${s}`, {fontSize:'14px',fontFamily:'Courier New',color:'#335577'}).setOrigin(0.5).setDepth(10);

    
    if(this._hintBg) this._hintBg.forEach(o=>{ try{o.destroy();}catch(e){} });
    this._hintBg = [];
    if(s===1){
      const panelX = W - 148;
      const panelY = H/2 - 110;
      const panelW = 138;
      const panelH = 266;

      
      const panelGfx = this.add.graphics().setDepth(8);
      panelGfx.fillStyle(0x001122, 0.82);
      panelGfx.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
      panelGfx.lineStyle(1, 0x0055aa, 0.7);
      panelGfx.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);
      this._hintBg.push(panelGfx);

      
      const header = this.add.text(panelX + panelW/2, panelY + 14, '[ TUTORIAL ]', {
        fontSize:'9px', fontFamily:'Courier New', color:'#44ccff', letterSpacing:3
      }).setOrigin(0.5).setDepth(9);
      this._hintBg.push(header);

      
      const divG = this.add.graphics().setDepth(9);
      divG.lineStyle(1, 0x003366, 0.8);
      divG.lineBetween(panelX+8, panelY+24, panelX+panelW-8, panelY+24);
      this._hintBg.push(divG);

      const steps = [
        { icon:'🚀', text:'Move the ship\nwith WASD' },
        { icon:'🪐', text:'Land on\nthe planet' },
        { icon:'📡', text:'Activate the\nantenna (2s)' },
        { icon:'🌀', text:'Enter the\nBlack Hole' },
        { icon:'⚡', text:'With weapon:\npress K to shoot' },
      ];

      steps.forEach((step, i) => {
        const sy = panelY + 38 + i * 46;
        const iconObj = this.add.text(panelX + 14, sy + 4, step.icon, {
          fontSize:'18px'
        }).setOrigin(0, 0.5).setDepth(9);
        const textObj = this.add.text(panelX + 38, sy, step.text, {
          fontSize:'10px', fontFamily:'Courier New', color:'#88bbdd',
          lineSpacing: 3, wordWrap:{width: panelW - 46}
        }).setOrigin(0, 0.5).setDepth(9);
        
        const numG = this.add.graphics().setDepth(9);
        numG.fillStyle(0x0055aa, 0.7);
        numG.fillCircle(panelX + 14, sy + 4, 9);
        numG.lineStyle(1, 0x0088ff, 0.6);
        numG.strokeCircle(panelX + 14, sy + 4, 9);
        const numTxt = this.add.text(panelX + 14, sy + 4, `${i+1}`, {
          fontSize:'9px', fontFamily:'Courier New', color:'#ffffff'
        }).setOrigin(0.5).setDepth(10);
        this._hintBg.push(iconObj, textObj, numG, numTxt);
      });

      
      this.time.delayedCall(16000, ()=>{
        if(this._hintBg && this.sector===1){
          this._hintBg.forEach(o=>{ this.tweens.add({targets:o, alpha:0, duration:3000}); });
        }
      });
    }

    const numPlanets = s===1 ? 1 : Math.min(2+Math.floor(s/2.5), 6);
    const numTowers  = s===1 ? 1 : Math.min(1+Math.ceil(s*0.92), numPlanets*2);

    this.planets = [];
    this.towers = [];
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.wrecks = [];
    this.fuelDepots = [];
    this.asteroids = [];
    this.portalGfx = null;
    this.portalActive = false;
    this.planetTurrets = [];
    this.landingTimer = 0;
    this.landingTower = null;
    this.activeTowers = 0;

    const positions = [];
    for(let i=0;i<numPlanets;i++){
      let x,y,tries=0;
      if(s===1 && i===0){
        
        x = Phaser.Math.Between(Math.floor(W*0.25), Math.floor(W*0.5));
        y = Phaser.Math.Between(Math.floor(H*0.35), Math.floor(H*0.65));
      } else {
        do {
          x = Phaser.Math.Between(80,W-80);
          y = Phaser.Math.Between(80,H-80);
          tries++;
        } while(tries<50 && positions.some(p=>dist(p.x,p.y,x,y)<180));
      }
      positions.push({x,y});
      this.createPlanet(x,y,i);
    }

    
    if(s>=4){
      const numTurrets = Math.min(1 + Math.floor((s-3)*0.9), 6);
      for(let ti=0;ti<numTurrets;ti++){
        const planet = this.planets[ti % this.planets.length];
        
        
        const baseAngle = (ti/Math.max(numTurrets,1))*Math.PI*2 + Math.PI + Math.random()*0.4 - 0.2;
        this.createPlanetTurret(planet, baseAngle);
      }
    }

    
    for(let i=0;i<Math.min(numTowers,numPlanets*2);i++){
      const planet = this.planets[i % this.planets.length];
      const turretAnglesOnPlanet = this.planetTurrets
          .filter(t=>t.planet===planet)
          .map(t=>t.angle);
      let angle = (i/numTowers)*Math.PI*2 + Math.random()*0.5;
      
      for(let attempt=0; attempt<24; attempt++){
        const candidate = angle + attempt*(Math.PI/12);
        const tooClose = turretAnglesOnPlanet.some(ta=>{
          let da = Math.abs(candidate - ta);
          if(da > Math.PI) da = Math.PI*2 - da;
          return da < Math.PI/2;
        });
        if(!tooClose){ angle = candidate; break; }
      }
      this.createTower(planet, angle);
    }

    if(s>1){
      
      const blockedPositions = [
        ...this.towers.map(t=>({x:t.x,y:t.y})),
        ...this.planetTurrets.map(t=>({x:t.bx+Math.cos(t.angle)*12, y:t.by+Math.sin(t.angle)*12})),
      ];
      const isFarFromTowers = (x,y) => blockedPositions.every(t=>dist(x,y,t.x,t.y)>36);

      const spawnItemOnPlanet = (planet, angleHint) => {
        for(let attempt=0; attempt<12; attempt++){
          const a = angleHint + attempt*(Math.PI*2/12);
          const ix = planet.x + Math.cos(a)*(planet.radius+22);
          const iy = planet.y + Math.sin(a)*(planet.radius+22);
          if(isFarFromTowers(ix,iy)) return {x:ix, y:iy};
        }
        return null;
      };

      
      
      const allUpgrades = ['weapon','extraTank'].filter(t=>(this.upgrades[t]||0)<3);
      const itemPool = [{kind:'fuel'}, {kind:'health'}];
      if(s===3 && (this.upgrades.weapon||0)===0){
        
        itemPool.push({kind:'upgrade', type:'weapon'});
      } else if(allUpgrades.length>0){
        const upg = allUpgrades[Phaser.Math.Between(0,allUpgrades.length-1)];
        itemPool.push({kind:'upgrade', type:upg});
      } else {
        itemPool.push({kind:'fuel'});
      }
      
      for(let i=itemPool.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [itemPool[i],itemPool[j]]=[itemPool[j],itemPool[i]];
      }
      let spawned=0;
      for(let ii=0;ii<itemPool.length&&spawned<3;ii++){
        const item=itemPool[ii];
        const planet=this.planets[spawned%this.planets.length];
        const baseAngle=(spawned/3)*Math.PI*2+Math.random()*0.5;
        const pos=spawnItemOnPlanet(planet,baseAngle);
        if(!pos) continue;
        if(item.kind==='fuel') this.createFuelDepot(pos.x,pos.y,planet);
        else this.createWreck(pos.x,pos.y,item.kind==='health'?'health':item.type);
        spawned++;
      }
    }

    if(s>=3){
      const numEnemies = Math.min(Math.floor((s-2)*1.38), 7);
      for(let i=0;i<numEnemies;i++){
        const px = Phaser.Math.Between(50,W-50);
        const py = Phaser.Math.Between(50,H-50);
        this.createEnemy(px,py);
      }
    }
    const numAsteroids = s===1 ? 0 : 3 + Math.floor(s * 1.1);
    for(let ai=0; ai<numAsteroids; ai++){
      let ax, ay, tries=0;
      do {
        ax = Phaser.Math.Between(30, W-30);
        ay = Phaser.Math.Between(30, H-30);
        tries++;
      } while(tries<80 && this.planets.some(p=>dist(ax,ay,p.x,p.y)<p.radius+40));

      const minR = s>=5 ? 6 : 4;
      const maxR = s>=7 ? 22 : s>=4 ? 16 : 10;
      const radius = Phaser.Math.Between(minR, maxR);
      const speed  = Phaser.Math.FloatBetween(14, 32 + s*2.76);
      const angle  = Phaser.Math.FloatBetween(0, Math.PI*2);
      const spin   = Phaser.Math.FloatBetween(-1.5, 1.5);
      const g = this.add.graphics().setDepth(3);
      const ast = {x:ax, y:ay, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, radius, spin, rot:0, gfx:g, hp: Math.ceil(radius/4)};
      this.drawAsteroid(ast);
      this.asteroids.push(ast);
    }
  }

  createPlanet(x,y,idx){
    const colors = [0x3366cc,0x66aa33,0xcc6633,0x9933cc,0x33aacc,0xaa3366];
    const color = colors[idx%colors.length];
    const radius = Phaser.Math.Between(25,50);
    const gravity = Phaser.Math.FloatBetween(40, 88) * (1 + this.sector * 0.0276);
    const gravRadius = radius*4.5;
    const hasResources = Math.random()>0.4;
    const resourceType = ['fuel','energy','health'][Phaser.Math.Between(0,2)];
    let resourceAmt = hasResources ? Phaser.Math.Between(20,60) : 0;

    const g = this.add.graphics();
    g.setDepth(1);

    g.fillStyle(color, 0.04);
    g.fillCircle(x,y,gravRadius);
    g.lineStyle(1, color, 0.15);
    g.strokeCircle(x,y,gravRadius);

    g.fillStyle(color, 1);
    g.fillCircle(x,y,radius);

    g.fillStyle(0xffffff,0.15);
    g.fillCircle(x-radius*0.3, y-radius*0.3, radius*0.4);

    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(x,y,radius);

    let ring = null;
    if(hasResources){
      ring = this.add.graphics().setDepth(2);
      const rc = {fuel:0xffaa00, energy:0x00ffff, health:0x00ff44}[resourceType];
      ring.lineStyle(2, rc, 0.6);
      ring.strokeCircle(x,y,radius+5);
    }

    const label = this.add.text(x,y+radius+8, hasResources?resourceType.toUpperCase():'', {fontSize:'9px',fontFamily:'Courier New',color:'#aaaaaa'}).setOrigin(0.5).setDepth(3);

    this.planets.push({x,y,radius,gravity,gravRadius,color,hasResources,resourceType,resourceAmt,gfx:g,ring,label});
  }

  createTower(planet, angle){
    
    const baseX = planet.x + Math.cos(angle) * planet.radius;
    const baseY = planet.y + Math.sin(angle) * planet.radius;
    
    const antennaLen = 22;
    const tipX = planet.x + Math.cos(angle) * (planet.radius + antennaLen);
    const tipY = planet.y + Math.sin(angle) * (planet.radius + antennaLen);

    const g = this.add.graphics().setDepth(4);
    const beam = this.add.graphics().setDepth(3);
    const timerBar = this.add.graphics().setDepth(5);

    
    const ix = planet.x + Math.cos(angle) * (planet.radius + 14);
    const iy = planet.y + Math.sin(angle) * (planet.radius + 14);

    const tower = {
      x: ix, y: iy,          
      baseX, baseY,           
      tipX, tipY,             
      angle,                  
      planet, gfx:g, beam, timer:timerBar,
      active:false, activationProgress:0,
      tickPhase: Math.random()*Math.PI*2  
    };
    this.drawTowerGfx(tower);
    this.towers.push(tower);
  }

  drawTowerGfx(t){
    const g = t.gfx;
    g.clear();
    const {baseX,baseY,tipX,tipY,angle,active} = t;
    const dx = tipX-baseX, dy = tipY-baseY;
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = dx/len, ny = dy/len;   
    const rx = -ny, ry = nx;          

    
    const bw = 7;
    g.fillStyle(0x445566, 1);
    g.fillTriangle(
        baseX + rx*bw,  baseY + ry*bw,
        baseX - rx*bw,  baseY - ry*bw,
        baseX + nx*5,   baseY + ny*5
    );
    g.lineStyle(1, 0x667788, 0.8);
    g.strokeTriangle(
        baseX + rx*bw,  baseY + ry*bw,
        baseX - rx*bw,  baseY - ry*bw,
        baseX + nx*5,   baseY + ny*5
    );

    
    const midX = baseX + nx*12, midY = baseY + ny*12;
    g.lineStyle(2, active ? 0x00cc88 : 0x556677, 1);
    g.lineBetween(baseX+nx*4, baseY+ny*4, tipX, tipY);

    
    const cbLen = 5;
    g.lineStyle(1, active ? 0x00aa66 : 0x445566, 0.9);
    g.lineBetween(midX+rx*cbLen, midY+ry*cbLen, midX-rx*cbLen, midY-ry*cbLen);

    
    const cb2X = baseX+nx*18, cb2Y = baseY+ny*18;
    const cb2Len = 3;
    g.lineStyle(1, active ? 0x00aa66 : 0x445566, 0.7);
    g.lineBetween(cb2X+rx*cb2Len, cb2Y+ry*cb2Len, cb2X-rx*cb2Len, cb2Y-ry*cb2Len);

    if(!active){
      
      g.fillStyle(0xffff00, 0.25);
      g.fillCircle(tipX, tipY, 3);
      g.lineStyle(1, 0x888800, 0.4);
      g.strokeCircle(tipX, tipY, 3);
    } else {
      
      g.fillStyle(0x00ffcc, 0.3);
      g.fillCircle(tipX, tipY, 8);
      g.fillStyle(0x00ffff, 0.9);
      g.fillCircle(tipX, tipY, 4);
      g.lineStyle(1, 0x00ffff, 0.5);
      g.strokeCircle(tipX, tipY, 10);
    }
  }

  drawFuelDepotGfx(g, x, y, level){
    g.clear();

    const colors = [0xffaa00, 0xff7700, 0xff3300];
    const col = colors[Math.min(level-1,2)];
    const sz = 6 + level*2;

    g.fillStyle(col, 1);
    g.fillRect(x-sz, y-sz-2, sz*2, sz*2+2);

    g.fillStyle(0xffffff, 0.4);
    g.fillRect(x-sz*0.6, y-sz-6, sz*1.2, 5);
    g.lineStyle(1, 0x000000, 0.6);
    g.strokeRect(x-sz, y-sz-2, sz*2, sz*2+2);

    for(let i=0;i<level;i++){
      g.lineStyle(2, 0xffffff, 0.35);
      g.lineBetween(x-sz+2, y-sz+4+i*5, x+sz-2, y-sz+4+i*5);
    }

    g.lineStyle(1+level, col, 0.45);
    g.strokeCircle(x, y, sz+8+level*2);

    if(level>=3){
      g.lineStyle(1, 0xff8800, 0.7);
      g.strokeTriangle(x,y-sz-8, x-6,y-sz-2, x+6,y-sz-2);
    }
  }

  createFuelDepot(x, y, planet){
    const level = Math.min(1 + Math.floor((this.sector-1)/2), 3);
    const g = this.add.graphics().setDepth(4);
    const amount = 25 + level*15 + Phaser.Math.Between(0, 15);
    this.drawFuelDepotGfx(g, x, y, level);
    const label = this.add.text(x, y + 22 + level*2, `⛽ +${amount}`, {fontSize:'8px', fontFamily:'Courier New', color:'#ffaa00'}).setOrigin(0.5).setDepth(5);
    this.fuelDepots = this.fuelDepots || [];
    this.fuelDepots.push({x, y, gfx:g, label, amount, collected:false, level});
  }

  createWreck(x,y,type){
    const curLvl = this.upgrades[type]||0;
    const nextLvl = curLvl+1;
    const g = this.add.graphics().setDepth(4);

    const typeConf = {
      weapon:     {col:0xffdd00, col2:0xff8800},
      shield:     {col:0x44aaff, col2:0x0055ff},
      extraTank:  {col:0xff8800, col2:0xff4400},
      armor:{col:0x00ff88, col2:0x00aaff},
    };
    const {col,col2} = typeConf[type]||{col:0xffa500,col2:0xff5500};
    const sz = 7 + nextLvl*2;

    g.lineStyle(2, col, 0.9);
    if(type==='weapon'){

      g.lineBetween(x-sz,y-sz,x+sz,y+sz);
      g.lineBetween(x+sz,y-sz,x-sz,y+sz);
      for(let i=0;i<nextLvl;i++){
        g.fillStyle(col,0.7); g.fillCircle(x+(i-1)*6,y,3);
      }
    } else if(type==='extraTank'){

      for(let i=0;i<nextLvl;i++){
        const ox = (i-(nextLvl-1)/2)*9;
        g.fillStyle(col,0.7); g.fillRect(x+ox-3,y-sz+2,6,sz*2-4);
        g.fillStyle(col2,0.5); g.fillRect(x+ox-3,y-sz+2,6,4);
        g.lineStyle(1,col,0.9); g.strokeRect(x+ox-3,y-sz+2,6,sz*2-4);
      }
    } else {
      
      g.fillStyle(col, 1);
      
      g.fillRect(x-2, y-sz+2, 4, sz*2-6);
      
      g.fillCircle(x, y-sz+4, 5+nextLvl);
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(x, y-sz+4, 2+nextLvl*0.5);
      
      g.fillStyle(col, 1);
      g.fillRect(x-4, y+sz-8, 4, 6);
      g.fillRect(x, y+sz-8, 4, 6);
      
      g.lineStyle(1, col2, 0.8);
      g.strokeCircle(x, y-sz+4, 5+nextLvl);
      g.strokeRect(x-2, y-sz+2, 4, sz*2-6);
      g.lineStyle(1,col,0.3); g.strokeCircle(x,y,sz+4);
    }

    g.lineStyle(1,col,0.3); g.strokeCircle(x,y,sz+10);
    const wlabel = curLvl>0 ? `${type.toUpperCase()} Lv${nextLvl}` : type.toUpperCase();
    const label = this.add.text(x,y-sz-14,wlabel,{fontSize:'8px',fontFamily:'Courier New',color:'#'+col.toString(16).padStart(6,'0')}).setOrigin(0.5).setDepth(5);
    this.wrecks.push({x,y,type,gfx:g,label,collected:false});
  }

  createEnemy(x,y){

    
    
    
    
    
    const maxType = this.sector>=7 ? 3 : this.sector>=5 ? 2 : this.sector>=3 ? 1 : 0;
    const type = Phaser.Math.Between(0, maxType);
    const g = this.add.graphics().setDepth(6);
    const hp = ([3,4,2,6][type]||3) + Math.ceil(this.sector*0.92);
    const spd = type===2 ? 55 : 40;
    this.drawEnemyShip(g,x,y,0,false,false,type,hp,hp);
    this.enemies.push({
      x,y,
      vx:Phaser.Math.FloatBetween(-spd,spd),
      vy:Phaser.Math.FloatBetween(-spd,spd),
      gfx:g, hp, maxHp:hp, fireTimer:0, state:'patrol', targetAngle:0,
      type,
    });
  }
  createPlanetTurret(planet, angle){
    const bx = planet.x + Math.cos(angle)*planet.radius;
    const by = planet.y + Math.sin(angle)*planet.radius;
    const g = this.add.graphics().setDepth(5);
    const hp = 2 + Math.floor(this.sector*0.5);
    const turret = { planet, angle, bx, by, gfx:g, hp, maxHp:hp, fireTimer: Math.random()*3, aimAngle:0 };
    this.drawPlanetTurretGfx(turret, 0);
    this.planetTurrets.push(turret);
  }

  drawPlanetTurretGfx(t, aimAngle){
    const g = t.gfx;
    g.clear();
    const {bx,by,planet,angle} = t;
    const nx = Math.cos(angle), ny = Math.sin(angle);
    const rx = -ny, ry = nx;
    const hpRatio = t.hp/t.maxHp;

    
    const baseCol  = hpRatio>0.6 ? 0xdd3300 : hpRatio>0.3 ? 0xff7700 : 0xff2200;
    const glowCol  = hpRatio>0.6 ? 0xff4400 : hpRatio>0.3 ? 0xffaa00 : 0xff6600;
    const darkCol  = 0x1a0800;

    
    const hw = 10, hd = 6;
    const pts = [];
    for(let i=0;i<6;i++){
      const a = (i/6)*Math.PI*2 + angle;
      const sx2 = hw * Math.cos(a), sy2 = hd * Math.sin(a);
      
      pts.push({ x: bx + rx*sx2 + nx*sy2*0.4, y: by + ry*sx2 + ny*sy2*0.4 });
    }
    g.fillStyle(0x2a1500,1);
    g.beginPath(); g.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) g.lineTo(pts[i].x,pts[i].y);
    g.closePath(); g.fillPath();
    g.lineStyle(1, baseCol, 0.7);
    g.beginPath(); g.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++) g.lineTo(pts[i].x,pts[i].y);
    g.closePath(); g.strokePath();

    
    const strutBase = { x: bx + nx*2,  y: by + ny*2  };
    const strutTop  = { x: bx + nx*10, y: by + ny*10 };
    g.lineStyle(4, darkCol, 1);
    g.lineBetween(strutBase.x, strutBase.y, strutTop.x, strutTop.y);
    g.lineStyle(2, baseCol, 0.5);
    g.lineBetween(strutBase.x, strutBase.y, strutTop.x, strutTop.y);

    
    const tx = bx + nx*12, ty = by + ny*12;
    g.fillStyle(darkCol,1);       g.fillCircle(tx,ty,9);
    g.fillStyle(baseCol,0.9);     g.fillCircle(tx,ty,7);
    g.lineStyle(2, glowCol, 0.8); g.strokeCircle(tx,ty,7);
    
    g.lineStyle(1, 0xffffff, 0.15); g.strokeCircle(tx,ty,4);

    
    const barLen = 14;
    const offsets = [-2.5, 2.5];
    offsets.forEach(off => {
      const bsx = tx + rx*off, bsy = ty + ry*off;
      const bex = bsx + Math.cos(aimAngle)*barLen, bey = bsy + Math.sin(aimAngle)*barLen;
      
      g.lineStyle(4, darkCol, 1);   g.lineBetween(bsx,bsy,bex,bey);
      g.lineStyle(2, baseCol, 1);   g.lineBetween(bsx,bsy,bex,bey);
      
      g.fillStyle(glowCol,1);
      g.fillCircle(bex, bey, 2.5);
    });
    
    const bridgeX = tx + Math.cos(aimAngle)*6, bridgeY = ty + Math.sin(aimAngle)*6;
    g.lineStyle(3, baseCol, 0.7);
    g.lineBetween(bridgeX + rx*2.5, bridgeY + ry*2.5, bridgeX - rx*2.5, bridgeY - ry*2.5);

    
    const pulse = 0.5 + 0.5*Math.sin(Date.now()/200 + t.angle*10);
    const lightCol = hpRatio>0.6 ? 0x00ff88 : hpRatio>0.3 ? 0xffcc00 : 0xff2200;
    g.fillStyle(lightCol, 0.4 + 0.6*pulse);
    g.fillCircle(tx + rx*5, ty + ry*5, 2.5);
    g.lineStyle(1, lightCol, pulse);
    g.strokeCircle(tx + rx*5, ty + ry*5, 3.5);

    
    const bw=28, bh=4;
    const barX = tx - bw/2, barY = ty - 20;
    
    g.fillStyle(0x1a0000,1);     g.fillRect(barX, barY, bw, bh);
    g.fillStyle(baseCol, 1);     g.fillRect(barX, barY, bw*hpRatio, bh);
    
    g.fillStyle(0xffffff, 0.15); g.fillRect(barX, barY, bw*hpRatio, 2);
    g.lineStyle(1, glowCol, 0.6);g.strokeRect(barX, barY, bw, bh);
    
    for(let p=1;p<t.maxHp;p++){
      const pipX = barX + (bw/t.maxHp)*p;
      g.lineStyle(1, darkCol, 0.8); g.lineBetween(pipX, barY, pipX, barY+bh);
    }
  }

  updatePlanetTurrets(dt){
    for(let i=this.planetTurrets.length-1;i>=0;i--){
      const t = this.planetTurrets[i];
      const tx = t.bx + Math.cos(t.angle)*8;
      const ty = t.by + Math.sin(t.angle)*8;
      const toShip = angleTo(tx,ty,this.ship.x,this.ship.y);
      
      let da = toShip - t.aimAngle;
      while(da> Math.PI) da-=Math.PI*2;
      while(da<-Math.PI) da+=Math.PI*2;
      t.aimAngle += da * Math.min(1, dt*2.5);
      this.drawPlanetTurretGfx(t, t.aimAngle);
      
      const ds = dist(tx,ty,this.ship.x,this.ship.y);
      const fireRate = 2.5 - Math.min(1.5, this.sector*0.15);
      t.fireTimer -= dt;
      if(t.fireTimer<=0 && ds<280 && !this.ship.landed &&
          hasLineOfSight(tx,ty,this.ship.x,this.ship.y,this.planets)){
        t.fireTimer = fireRate;
        const spd = 200;
        const g2 = this.add.graphics().setDepth(8);
        g2.fillStyle(0xff2200,1); g2.fillCircle(0,0,4);
        g2.fillStyle(0xff8800,0.5); g2.fillCircle(0,0,7);
        g2.x=tx; g2.y=ty;
        this.enemyBullets.push({x:tx,y:ty,vx:Math.cos(t.aimAngle)*spd,vy:Math.sin(t.aimAngle)*spd,gfx:g2,life:3});
      }
    }
  }

  drawEnemyShip(g,x,y,angle,alerted,canSee,type=0,hp=1,maxHp=1){
    g.clear();

    if(alerted){
      const indCol = canSee ? 0xff2200 : 0xff9900;
      const pulse = 0.5+0.5*Math.sin(this.time.now/150);
      g.fillStyle(indCol, 0.6+0.4*pulse);
      g.fillTriangle(x,y-22, x-5,y-13, x+5,y-13);
      g.fillStyle(0xffffff,1);
      g.fillRect(x-1,y-20,2,5);
      g.fillRect(x-1,y-13,2,2);
    }
    g.save();
    g.translateCanvas(x,y);
    g.rotateCanvas(angle);

    if(type===0){
      
      const bc = alerted ? 0xff1100 : 0xff3333;
      g.fillStyle(bc,1);
      g.fillTriangle(14,0,-8,-7,-8,7);
      g.lineStyle(1,0xff8888,1);
      g.strokeTriangle(14,0,-8,-7,-8,7);
      g.fillStyle(alerted?0xff8800:0xff6600,0.8);
      g.fillCircle(0,0,4);
    } else if(type===1){
      
      const bc = alerted ? 0xff6600 : 0xff8800;
      g.fillStyle(bc,1);
      g.fillTriangle(13,-4,-7,-9,-7,0);
      g.fillTriangle(13, 4,-7, 0,-7,9);
      g.lineStyle(1,0xffcc44,0.9);
      g.strokeTriangle(13,-4,-7,-9,-7,0);
      g.strokeTriangle(13, 4,-7, 0,-7,9);
      g.fillStyle(0xffff88,0.7); g.fillRect(10,-5,5,2); g.fillRect(10,3,5,2);
    } else if(type===2){
      
      const bc = alerted ? 0x00ffcc : 0x00aaaa;
      g.fillStyle(bc,0.9); g.fillCircle(0,0,9);
      g.lineStyle(2,0x00ffff,0.8); g.strokeCircle(0,0,9);
      g.fillStyle(0x000022,0.8); g.fillCircle(0,0,4);
      g.lineStyle(2,bc,0.7);
      g.lineBetween(-12,0,-9,0); g.lineBetween(9,0,12,0);
      g.lineBetween(0,-12,0,-9); g.lineBetween(0,9,0,12);
    } else {
      
      const bc = alerted ? 0xcc00ff : 0x9900cc;
      g.fillStyle(bc,1);
      g.fillTriangle(0,-13, 13,0, 0,13);
      g.fillTriangle(0,-13,-13,0, 0,13);
      g.lineStyle(2,0xdd88ff,0.9);
      g.strokeTriangle(0,-13, 13,0, 0,13);
      g.strokeTriangle(0,-13,-13,0, 0,13);
      g.fillStyle(0xffffff,0.5); g.fillCircle(0,0,4);
      g.fillStyle(bc,0.8); g.fillRect(-3,-16,6,4); g.fillRect(-3,12,6,4);
    }
    g.restore();

    
    const hpRatio = Math.max(0, hp/maxHp);
    const bw=24, bh=3;
    const barX = x - bw/2, barY = y - 26;
    const hpCol = hpRatio>0.6 ? 0x00ff44 : hpRatio>0.3 ? 0xffaa00 : 0xff3300;
    g.fillStyle(0x111111,0.8); g.fillRect(barX-1, barY-1, bw+2, bh+2);
    g.fillStyle(0x001100,1);   g.fillRect(barX, barY, bw, bh);
    g.fillStyle(hpCol,1);      g.fillRect(barX, barY, bw*hpRatio, bh);
    g.fillStyle(0xffffff,0.2); g.fillRect(barX, barY, bw*hpRatio, 1);
    g.lineStyle(1, hpCol, 0.5);g.strokeRect(barX, barY, bw, bh);
  }

  findSafeSpawn(){

    let bx = W/2, by = H/2, bestScore = -1;
    for(let attempt=0; attempt<300; attempt++){
      const tx = Phaser.Math.Between(60, W-60);
      const ty = Phaser.Math.Between(60, H-60);

      let minPlanetDist = 9999;
      for(const p of this.planets){
        const d = dist(tx,ty,p.x,p.y) - p.radius;
        if(d < minPlanetDist) minPlanetDist = d;
      }

      let minEnemyDist = 9999;
      for(const e of (this.enemies||[])){
        const d = dist(tx,ty,e.x,e.y);
        if(d < minEnemyDist) minEnemyDist = d;
      }

      if(minPlanetDist < 70) continue;

      const score = Math.min(minPlanetDist, 300) + Math.min(minEnemyDist, 300)*0.8;
      if(score > bestScore){
        bestScore = score;
        bx = tx; by = ty;

        if(minPlanetDist > 120 && minEnemyDist > 200) break;
      }
    }
    return {x: bx, y: by};
  }

  createShip(){
    this.ship = {
      x: W/2, y: H/2,
      vx: 0, vy: 0,
      angle: 0,
      fuel: 100,
      energy: 100,
      health: 100,
      landed: false,
      landedPlanet: null,
      thrusting: false
    };
    this.shipGfx = this.add.graphics().setDepth(10);
    this.thrustGfx = this.add.graphics().setDepth(9);

    const spawn = this.findSafeSpawn();
    this.ship.x = spawn.x;
    this.ship.y = spawn.y;
    this.drawShip();
  }

  drawShip(){
    const {x,y,angle,health} = this.ship;
    const sg = this.shipGfx;
    sg.clear();
    sg.save();
    sg.translateCanvas(x,y);
    sg.rotateCanvas(angle);

    const col = health>50?0x00ccff:health>25?0xffaa00:0xff4400;
    sg.fillStyle(col,1);
    sg.fillTriangle(14,0,-8,-6,-8,6);
    sg.lineStyle(1,0xffffff,0.5);
    sg.strokeTriangle(14,0,-8,-6,-8,6);

    sg.fillStyle(0x99eeff,0.9);
    sg.fillCircle(4,0,4);

    sg.fillStyle(col,0.7);
    sg.fillTriangle(-2,-6,-10,-12,-10,0);
    sg.fillTriangle(-2,6,-10,12,-10,0);


    const wlv = this.upgrades.weapon||0;
    if(wlv>=1){

      sg.fillStyle(0xffdd00,1);
      sg.fillRect(12,-1, 8, 2);
      if(wlv>=2){
        sg.fillStyle(0xff9900,1);
        sg.fillRect(10,-5, 6, 2);
      }
      if(wlv>=3){
        sg.fillStyle(0xff4400,1);
        sg.fillRect(10, 3, 6, 2);
      }
    }
    sg.restore();
  }

  drawThrust(){
    const tg = this.thrustGfx;
    tg.clear();
    if(!this.ship.thrusting || this.ship.landed || this.ship.fuel<=0) return;
    const {x,y,angle} = this.ship;
    tg.save();
    tg.translateCanvas(x,y);
    tg.rotateCanvas(angle);
    tg.fillStyle(0xff6600, Phaser.Math.FloatBetween(0.5,1));
    tg.fillTriangle(-8,0,-18,-4,-18,4);
    tg.fillStyle(0xffff00,0.6);
    tg.fillTriangle(-8,0,-14,-2,-14,2);
    tg.restore();
  }

  createInput(){
    
    this.keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w:     Phaser.Input.Keyboard.KeyCodes.W,
      a:     Phaser.Input.Keyboard.KeyCodes.A,
      s:     Phaser.Input.Keyboard.KeyCodes.S,
      d:     Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fire:  Phaser.Input.Keyboard.KeyCodes.K,
    });

    
    this._arcade = { up:false, down:false, left:false, right:false, fire:false, brake:false };
    const arcadeMap = {
      'P1U':'up', 'P1D':'down', 'P1L':'left', 'P1R':'right',
      'P1A':'fire', 'P1B':'fire', 'P1C':'fire',
      'P1X':'brake','P1Y':'brake','P1Z':'brake',
    };
    this.input.keyboard.on('keydown', e => {
      if(arcadeMap[e.key]) this._arcade[arcadeMap[e.key]] = true;
    });
    this.input.keyboard.on('keyup', e => {
      if(arcadeMap[e.key]) this._arcade[arcadeMap[e.key]] = false;
    });

    this.fireTimer = 0;
    this.input.on('pointerdown', ()=>{ this._clickFire = true; });
    this.input.on('pointerup',   ()=>{ this._clickFire = false; });
  }

  createUI(){
    if(this.uiGfx) this.uiGfx.destroy();
    if(this.uiTexts) this.uiTexts.forEach(t=>t.destroy());
    if(this.upgradePanel) this.upgradePanel.destroy();
    if(this._panelTitle) this._panelTitle.destroy();
    if(this.upgradeIcons) Object.values(this.upgradeIcons).forEach(ic=>{ ic.ico.destroy(); ic.lbl.destroy(); if(ic.stars) ic.stars.destroy(); });
    if(this.barLabels){ this.barLabels.forEach(l=>l.destroy()); this.barLabels=null; }
    if(this._barVals){ this._barVals.forEach(l=>l.destroy()); this._barVals=null; }

    this.uiGfx = this.add.graphics().setDepth(20);
    this.uiTexts = [];

    
    this.scoreText  = this.add.text(10, 10, 'SCORE: 0',   {fontSize:'12px',fontFamily:'Courier New',color:'#aaddff'}).setDepth(20);
    this.sectorText = this.add.text(10, 26, 'SECTOR: 1',  {fontSize:'12px',fontFamily:'Courier New',color:'#aaddff'}).setDepth(20);
    this.towersText = this.add.text(10, 42, 'TOWERS: 0/0',{fontSize:'12px',fontFamily:'Courier New',color:'#ffff88'}).setDepth(20);

    
    this.msgText = this.add.text(W/2, H-22, '', {fontSize:'13px',fontFamily:'Courier New',color:'#ffff00',stroke:'#333300',strokeThickness:2}).setOrigin(0.5).setDepth(20);

    this.uiTexts = [this.scoreText, this.sectorText, this.towersText, this.msgText];

    
    this.upgradePanel = this.add.graphics().setDepth(20);
    this.upgradeIcons = {};
    const upgDefs = [
      { key:'weapon',    icon:'⚡', label:'WEAPON',   color:'#ffdd00' },
      { key:'extraTank', icon:'⛽', label:'TANK', color:'#ff8800' },
    ];
    this._upgDefs = upgDefs;

    
    this._panelTitle = this.add.text(W-8, H-86, 'MODULES', {
      fontSize:'8px', fontFamily:'Courier New', color:'#334455', letterSpacing:2
    }).setOrigin(1, 0.5).setDepth(22);

    upgDefs.forEach((u, i) => {
      const ux = W - 90 + i * 46;  
      const uy = H - 60;
      const ico   = this.add.text(ux, uy,    u.icon,  {fontSize:'18px'}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      const lbl   = this.add.text(ux, uy+16, u.label, {fontSize:'7px',fontFamily:'Courier New',color:u.color}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      const stars = this.add.text(ux, uy-14, '○○○',   {fontSize:'8px',fontFamily:'Courier New',color:u.color}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      this.upgradeIcons[u.key] = {ico, lbl, stars, color:u.color, ux, uy};
    });
  }

  updateUI(){
    const s = this.ship;
    const g = this.uiGfx;
    g.clear();

    
    
    const bx = 10, bw = 100, bh = 7, gap = 14;
    const maxFuel = 100 + (this.upgrades.extraTank||0)*15;

    const bars = [
      { label:'FUEL', val:s.fuel,   max:maxFuel, fill:0xffaa00, bg:0x332200, border:0x664400 },
      { label:'ENRG', val:s.energy, max:100,     fill:0x00ddff, bg:0x002233, border:0x005566 },
      { label:'HP', val:s.health, max:100,
        fill: s.health>50 ? 0x00ff44 : s.health>25 ? 0xffaa00 : 0xff3300,
        bg:0x220000, border:0x550000 },
    ];

    
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(bx-4, H-66, bw+70, 58, 4);

    bars.forEach((b, i) => {
      const by = H - 58 + i * gap;
      const ratio = Math.min(1, b.val / b.max);
      g.fillStyle(b.bg, 1);    g.fillRect(bx+28, by, bw, bh);
      g.fillStyle(b.fill, 1);  g.fillRect(bx+28, by, bw*ratio, bh);
      g.lineStyle(1, b.border, 1); g.strokeRect(bx+28, by, bw, bh);
    });

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.sectorText.setText(`SECTOR: ${this.sector}`);
    this.towersText.setText(`TOWERS: ${this.activeTowers}/${this.towers.length}`);

    if(!this.barLabels){
      this.barLabels = [
        this.add.text(bx, H-59, 'FUEL', {fontSize:'7px',fontFamily:'Courier New',color:'#ffaa00'}).setDepth(21),
        this.add.text(bx, H-59+gap, 'ENRG', {fontSize:'7px',fontFamily:'Courier New',color:'#00ddff'}).setDepth(21),
        this.add.text(bx, H-59+gap*2, 'HP', {fontSize:'7px',fontFamily:'Courier New',color:'#00ff44'}).setDepth(21),
      ];
      
      this._barVals = [
        this.add.text(bx+132, H-59,       '', {fontSize:'7px',fontFamily:'Courier New',color:'#ffaa00'}).setDepth(21),
        this.add.text(bx+132, H-59+gap,   '', {fontSize:'7px',fontFamily:'Courier New',color:'#00ddff'}).setDepth(21),
        this.add.text(bx+132, H-59+gap*2, '', {fontSize:'7px',fontFamily:'Courier New',color:'#00ff44'}).setDepth(21),
      ];
    }
    
    if(this._barVals){
      this._barVals[0].setText(Math.ceil(s.fuel)+'/'+maxFuel);
      this._barVals[1].setText(Math.ceil(s.energy)+'/100');
      this._barVals[2].setText(Math.ceil(s.health)+'/100');
    }

    
    const pg = this.upgradePanel;
    pg.clear();
    const hasAny = (this.upgrades.weapon||0)+(this.upgrades.extraTank||0) > 0;

    
    pg.fillStyle(0x000000, 0.45);
    pg.fillRoundedRect(W-110, H-80, 104, 72, 4);
    pg.lineStyle(1, 0x223344, 0.8);
    pg.strokeRoundedRect(W-110, H-80, 104, 72, 4);

    this._upgDefs.forEach(u => {
      const lvl = this.upgrades[u.key] || 0;
      const ic  = this.upgradeIcons[u.key];
      const alpha = lvl > 0 ? 1 : 0.22;
      ic.ico.setAlpha(alpha);
      ic.lbl.setAlpha(alpha);

      
      const starStr = '●'.repeat(lvl) + '○'.repeat(3-lvl);
      ic.stars.setText(starStr).setAlpha(alpha);

      const hx = parseInt(u.color.replace('#','0x'));
      if(lvl > 0){
        pg.lineStyle(1, hx, 0.5);
        pg.strokeRoundedRect(ic.ux-20, ic.uy-18, 40, 42, 4);
      }
    });
  }

  startTutorial(){
    if(this.sector!==1) return;
    const msgs = [
      { t:1000,  txt:'⬆ USE WASD / ARROWS to thrust and rotate the ship',  dur:3500 },
      { t:5000,  txt:'📡 Land near antennas to activate them (2s)', dur:3800 },
      { t:9500,  txt:'⚡ Activate ALL antennas in the sector',                dur:3200 },
      { t:13500, txt:'🌀 A BLACK HOLE appears — enter it to advance!', dur:3800 },
      { t:18000, txt:'🔧 Collect floating debris to upgrade your ship',        dur:3200 },
      { t:22000, txt:'⛽ Land on planets to recharge fuel and energy', dur:3500 },
      { t:26000, txt:'⚡ Got a weapon? Press K to shoot and defend yourself from turrets and enemies', dur:4200 },
    ];
    msgs.forEach(m=>{
      this.time.delayedCall(m.t, ()=>{
        if(this.sector===1) this.showMsg(m.txt, m.dur);
      });
    });
  }

  showMsg(txt, duration=2000){
    this.msgText.setText(txt);
    if(this._msgTimer) clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(()=>this.msgText.setText(''), duration);
  }

  showUpgradePopup(type, level=1){
    const names = {weapon:'ARMAMENT', extraTank:'EXTRA TANK', health:'HEALTH'};
    const stars = '★'.repeat(level)+'☆'.repeat(3-level);
    this.showMsg(`✦ ${names[type]||type}  ${stars}  ACQUIRED`, 2500);
    if(type==='weapon'){
      this.time.delayedCall(2600, ()=>{
        this.showMsg('⚡ Press K to shoot!', 3000);
      });
    }
    this.score += 50;
  }

  update(time, delta){
    if(this.sectorTransition) return;
    const dt = delta/1000;
    this.updateShip(dt);
    this.updateTowers(dt);
    this.updateAsteroids(dt);
    this.updateEnemies(dt,time);
    this.updatePlanetTurrets(dt);
    this.updateBullets(dt);
    this.updatePortal(dt);
    this.updateUI();
    this.drawShip();
    this.drawThrust();
    this.fireTimer = Math.max(0, this.fireTimer-dt);
  }

  updateShip(dt){
    const s = this.ship;
    const k = this.keys;
    if(s.health<=0){
      if(this._engineOn){ this._engineOn=false; F.stopEngine(); }
      F.stopMusic(0.5);
      F.shipDestroy();
      this.scene.start('GameOver',{score:this.score,sector:this.sector,reason:'hull'});
      return;
    }
    if(s.fuel<=0){
      if(this._engineOn){ this._engineOn=false; F.stopEngine(); }
      if(!this._fuelEmptyTimer) this._fuelEmptyTimer=0;
      this._fuelEmptyTimer+=dt;
      this.msgText.setText('⚠ OUT OF FUEL — ADRIFT (' + Math.ceil(3-this._fuelEmptyTimer) + 's)');
      this.msgText.setColor('#ff4400');
      if(this._fuelEmptyTimer>=3){ F.stopMusic(0.5); F.shipDestroy(); this.scene.start('GameOver',{score:this.score,sector:this.sector,reason:'fuel'}); return; }
    } else {
      if(this._fuelEmptyTimer){ this._fuelEmptyTimer=0; this.msgText.setColor('#ffff00'); }
    }

    const thrustPressed = k.up.isDown||k.w.isDown||this._arcade.up;
    const rotLeft  = k.left.isDown||k.a.isDown||this._arcade.left;
    const rotRight = k.right.isDown||k.d.isDown||this._arcade.right;
    const braking  = (k.space.isDown||this._arcade.brake) && !s.landed;

    if(s.landed && thrustPressed && s.fuel>0){
      const p = s.landedPlanet;
      s.landed = false;
      s.landedPlanet = null;
      s.vx = 0;
      s.vy = 0;

      if(p){
        const ang = angleTo(p.x, p.y, s.x, s.y);
        s.x = p.x + Math.cos(ang) * (p.radius + 20);
        s.y = p.y + Math.sin(ang) * (p.radius + 20);

        s.angle = ang;
      }
      this.landingTimer = 0;
      this.landingTower = null;
    }

    const thrusting = thrustPressed && !s.landed;
    s.thrusting = thrusting;

    
    if(thrusting && s.fuel>0 && !this._engineOn){ this._engineOn=true; F.startEngine(); }
    if((!thrusting || s.fuel<=0) && this._engineOn){ this._engineOn=false; F.stopEngine(); }

    if(!s.landed){
      if(rotLeft) s.angle -= dt*2.5;
      if(rotRight) s.angle += dt*2.5;
    }

    const enginePower = 180;

    if(thrusting && s.fuel>0){
      s.vx += Math.cos(s.angle)*enginePower*dt;
      s.vy += Math.sin(s.angle)*enginePower*dt;
      s.fuel = Math.max(0, s.fuel - dt*8);
    }

    if(braking){
      s.vx *= (1 - dt*3);
      s.vy *= (1 - dt*3);
      s.fuel = Math.max(0, s.fuel - dt*4);
      if(!this._brakeSound){ this._brakeSound=true; F.brake(); }
    } else { this._brakeSound=false; }

    if(!s.landed){
      for(const p of this.planets){
        const d = dist(s.x,s.y,p.x,p.y);
        if(d<p.gravRadius){
          const force = p.gravity * (1 - d/p.gravRadius);
          const angle = angleTo(s.x,s.y,p.x,p.y);
          s.vx += Math.cos(angle)*force*dt;
          s.vy += Math.sin(angle)*force*dt;
        }
      }
    }

    if(!s.landed){
      s.x += s.vx*dt;
      s.y += s.vy*dt;

      if(s.x<-20) s.x=W+20;
      if(s.x>W+20) s.x=-20;
      if(s.y<-20) s.y=H+20;
      if(s.y>H+20) s.y=-20;
    }

    let onPlanet = false;
    for(const p of this.planets){
      const d = dist(s.x,s.y,p.x,p.y);
      const landDist = p.radius + 12;
      if(d<=landDist+5){
        const speed = Math.sqrt(s.vx**2+s.vy**2);
        if(speed>80){

          let cdmg = (speed-80)*0.3 * dt * 60;
          s.health = Math.max(0, s.health - cdmg);
          const dmg = cdmg;

          const norm = angleTo(p.x,p.y,s.x,s.y);
          s.vx = Math.cos(norm)*speed*0.3;
          s.vy = Math.sin(norm)*speed*0.3;
        } else {

          onPlanet = true;
          if(!s.landed) F.land();
          s.landed = true;
          s.landedPlanet = p;
          s.vx = 0; s.vy = 0;

          const ang = angleTo(p.x,p.y,s.x,s.y);
          s.x = p.x + Math.cos(ang)*landDist;
          s.y = p.y + Math.sin(ang)*landDist;
          s.angle = ang;

          if(p.hasResources && p.resourceAmt>0 && dt>0){
            const absorb = Math.min(p.resourceAmt, dt*15);
            p.resourceAmt -= absorb;
            const maxFuelP = 100 + this.upgrades.extraTank*15;
            if(p.resourceType==='fuel') s.fuel = Math.min(maxFuelP, s.fuel+absorb);
            if(p.resourceType==='energy') s.energy = Math.min(100, s.energy+absorb);
            if(p.resourceType==='health') s.health = Math.min(100, s.health+absorb);
            if(p.resourceAmt<=0){ p.ring&&p.ring.clear(); p.label.setText(''); }
          }

          if(this.fuelDepots){
            for(const fd of this.fuelDepots){
              if(!fd.collected && dist(s.x,s.y,fd.x,fd.y)<28){
                const maxFuel = 100 + this.upgrades.extraTank*15;
                s.fuel = Math.min(maxFuel, s.fuel + fd.amount);
                fd.collected = true;
                fd.gfx.clear();
                fd.label.setText('');
                F.collectItem();
                this.showMsg(`+${fd.amount} FUEL`, 1500);
                this.score += 10;
              }
            }
          }

          for(const w of this.wrecks){
            if(!w.collected && dist(s.x,s.y,w.x,w.y)<30){
              F.collectItem();
              if(w.type==='health'){
                
                this.ship.health = Math.min(100, this.ship.health + 30);
                this.showMsg('🔧 +30 HEALTH RESTORED', 2000);
                this.score += 30;
              } else {
                this.upgrades[w.type] = Math.min(3, (this.upgrades[w.type]||0)+1);
                this.showUpgradePopup(w.type, this.upgrades[w.type]);
                this.score += 50;
              }
              w.collected = true;
              w.gfx.clear(); w.label.destroy();
            }
          }
        }
        break;
      }
    }
    if(!onPlanet && s.landed){
      s.landed = false;
      s.landedPlanet = null;
      this.landingTimer = 0;
      this.landingTower = null;
    }

    if(this.portalActive && this.portalGfx){
      const pd = dist(s.x,s.y,this.portalX,this.portalY);
      if(pd<35){
        this.nextSector();
        return;
      }
    }

    const wlvl = this.upgrades.weapon;
    const fireRate = wlvl>=3 ? 0.12 : wlvl>=2 ? 0.20 : 0.30;
    const energyCost = wlvl>=3 ? 4 : wlvl>=2 ? 3 : 2;
    if(wlvl>0 && (k.fire.isDown||this._arcade.fire) && this.fireTimer<=0){
      if(s.energy>=energyCost){
        s.energy = Math.max(0, s.energy - energyCost);
        this.fireBullet();
        if(wlvl>=2) this.fireBullet(0.18);
        if(wlvl>=3) this.fireBullet(-0.18);
        this.fireTimer = fireRate;
      } else {

        if(!this._noEnergyFlash || this._noEnergyFlash<=0){
          this.showMsg('⚡ NOT ENOUGH ENERGY TO SHOOT', 1200);
          this._noEnergyFlash = 1.5;
        }
      }
    }
    if(this._noEnergyFlash>0) this._noEnergyFlash -= dt;
  }

  fireBullet(spread=0){
    const s = this.ship;
    const wlvl = this.upgrades.weapon;
    if(spread===0) F.shoot();
    const speed = 320 + wlvl*30;
    const a = s.angle + spread;
    const g = this.add.graphics().setDepth(8);
    const bcolor = wlvl>=3 ? 0xff4400 : wlvl>=2 ? 0xff9900 : 0xffff00;
    const bsize  = wlvl>=3 ? 4 : wlvl>=2 ? 3.5 : 3;
    g.fillStyle(bcolor,1); g.fillCircle(0,0,bsize);
    g.fillStyle(0xffffff,0.4); g.fillCircle(0,0,bsize*0.5);
    g.x = s.x; g.y = s.y;
    const dmg = wlvl>=3 ? 1.5 : wlvl>=2 ? 1 : 0.5;
    this.bullets.push({ x:s.x, y:s.y, vx:Math.cos(a)*speed+s.vx, vy:Math.sin(a)*speed+s.vy, gfx:g, life:2, dmg });
  }

  updateBullets(dt){
    for(let i=this.bullets.length-1;i>=0;i--){
      const b = this.bullets[i];
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      b.gfx.x = b.x; b.gfx.y = b.y;
      if(b.life<=0 || b.x<0||b.x>W||b.y<0||b.y>H){
        b.gfx.destroy(); this.bullets.splice(i,1); continue;
      }

      let bulletHitPlanet = false;
      for(const p of this.planets){
        if(dist(b.x,b.y,p.x,p.y)<p.radius+2){
          b.gfx.destroy(); this.bullets.splice(i,1);
          bulletHitPlanet = true; break;
        }
      }
      if(bulletHitPlanet) continue;

      for(let j=this.enemies.length-1;j>=0;j--){
        const e = this.enemies[j];
        if(dist(b.x,b.y,e.x,e.y)<14){
          e.hp -= b.dmg||1;

          e.alerted = true;
          e.alertTimer = 6 + Math.random()*4;
          e.lastKnownX = this.ship.x;
          e.lastKnownY = this.ship.y;
          b.gfx.destroy(); this.bullets.splice(i,1);
          if(e.hp<=0){
            F.enemyDie();
            e.gfx.destroy(); this.enemies.splice(j,1);
            this.score += 100;
            this.showMsg('+100 ENEMY DESTROYED!');
          }
          break;
        }
      }
      
      if(!this.bullets[i]) continue;
      for(let j=this.planetTurrets.length-1;j>=0;j--){
        const t = this.planetTurrets[j];
        const tx = t.bx+Math.cos(t.angle)*8, ty = t.by+Math.sin(t.angle)*8;
        if(dist(b.x,b.y,tx,ty)<12){
          t.hp -= b.dmg||1;
          b.gfx.destroy(); this.bullets.splice(i,1);
          if(t.hp<=0){
            t.gfx.destroy(); this.planetTurrets.splice(j,1);
            this.score += 75;
            this.showMsg("+75 TURRET DESTROYED!");
          }
          break;
        }
      }
    }

    for(let i=this.enemyBullets.length-1;i>=0;i--){
      const b = this.enemyBullets[i];
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      b.gfx.x = b.x; b.gfx.y = b.y;
      if(b.life<=0 || b.x<0||b.x>W||b.y<0||b.y>H){
        b.gfx.destroy(); this.enemyBullets.splice(i,1); continue;
      }

      let eHitPlanet=false;
      for(const p of this.planets){
        if(dist(b.x,b.y,p.x,p.y)<p.radius+2){
          b.gfx.destroy(); this.enemyBullets.splice(i,1);
          eHitPlanet=true; break;
        }
      }
      if(eHitPlanet) continue;
      if(dist(b.x,b.y,this.ship.x,this.ship.y)<12){
        let dmg = 10;
        F.damage();
        this.ship.health = Math.max(0, this.ship.health-dmg);
        b.gfx.destroy(); this.enemyBullets.splice(i,1);
      }
    }
  }

  drawAsteroid(a){
    a.gfx.clear();
    a.gfx.x = a.x; a.gfx.y = a.y;
    const r = a.radius;

    const pts = 7 + Math.floor(r/3);
    const verts = [];
    for(let i=0;i<pts;i++){
      const ang = (i/pts)*Math.PI*2 + a.rot;
      const jag = 0.65 + 0.35*Math.abs(Math.sin(i*2.3+a.rot*0.5));
      verts.push({ x: Math.cos(ang)*r*jag, y: Math.sin(ang)*r*jag });
    }

    const grey = 0x556677;
    a.gfx.fillStyle(grey, 1);
    a.gfx.beginPath();
    a.gfx.moveTo(verts[0].x, verts[0].y);
    for(let i=1;i<verts.length;i++) a.gfx.lineTo(verts[i].x, verts[i].y);
    a.gfx.closePath();
    a.gfx.fillPath();

    a.gfx.lineStyle(1, 0x8899aa, 0.7);
    a.gfx.beginPath();
    a.gfx.moveTo(verts[0].x, verts[0].y);
    for(let i=1;i<verts.length;i++) a.gfx.lineTo(verts[i].x, verts[i].y);
    a.gfx.closePath();
    a.gfx.strokePath();

    a.gfx.lineStyle(1, 0x334455, 0.5);
    a.gfx.lineBetween(-r*0.3, -r*0.1, r*0.1, r*0.3);
  }

  spawnAsteroid(){
    const s = this.sector;
    
    let ax, ay;
    const edge = Math.floor(Math.random()*4);
    if(edge===0){ ax=Phaser.Math.Between(0,W); ay=-20; }
    else if(edge===1){ ax=W+20; ay=Phaser.Math.Between(0,H); }
    else if(edge===2){ ax=Phaser.Math.Between(0,W); ay=H+20; }
    else { ax=-20; ay=Phaser.Math.Between(0,H); }

    const minR = s>=5 ? 6 : 4;
    const maxR = s>=7 ? 22 : s>=4 ? 16 : 10;
    const radius = Phaser.Math.Between(minR, maxR);
    const speed  = Phaser.Math.FloatBetween(14, 32+s*2.76);
    
    const baseAngle = angleTo(ax, ay, W/2+Phaser.Math.Between(-150,150), H/2+Phaser.Math.Between(-150,150));
    const spin = Phaser.Math.FloatBetween(-1.5,1.5);
    const g = this.add.graphics().setDepth(3);
    const ast = {x:ax, y:ay, vx:Math.cos(baseAngle)*speed, vy:Math.sin(baseAngle)*speed, radius, spin, rot:0, gfx:g, hp:Math.ceil(radius/4)};
    this.drawAsteroid(ast);
    this.asteroids.push(ast);
  }

  updateAsteroids(dt){
    const s = this.sector;
    const targetCount = 3 + Math.floor(s*1.1);

    
    this._astRespawnTimer = (this._astRespawnTimer||0) - dt;
    if(this._astRespawnTimer<=0 && this.asteroids.length < targetCount){
      this.spawnAsteroid();
      this._astRespawnTimer = 2.5; 
    }

    for(let i=this.asteroids.length-1;i>=0;i--){
      const a = this.asteroids[i];
      let destroyed = false;

      for(const p of this.planets){
        const dp = dist(a.x,a.y,p.x,p.y);
        
        if(dp < p.gravRadius){
          const ag = angleTo(a.x,a.y,p.x,p.y);
          const force = p.gravity*(1-dp/p.gravRadius);
          a.vx += Math.cos(ag)*force*0.3*dt;
          a.vy += Math.sin(ag)*force*0.3*dt;
        }
        
        if(dp < p.radius + a.radius){
          a.gfx.destroy();
          this.asteroids.splice(i,1);
          destroyed = true;
          break;
        }
      }
      if(destroyed) continue;

      const aspd = Math.sqrt(a.vx**2+a.vy**2);
      const maxAspd = 80;
      if(aspd>maxAspd){ a.vx=(a.vx/aspd)*maxAspd; a.vy=(a.vy/aspd)*maxAspd; }

      a.rot += a.spin*dt;
      a.x += a.vx*dt; a.y += a.vy*dt;

      if(a.x<-30) a.x=W+30; else if(a.x>W+30) a.x=-30;
      if(a.y<-30) a.y=H+30; else if(a.y>H+30) a.y=-30;
      this.drawAsteroid(a);

      const ds = dist(a.x,a.y,this.ship.x,this.ship.y);
      if(ds < a.radius+10 && !this.ship.landed){
        const impactSpd = Math.sqrt((a.vx-this.ship.vx)**2+(a.vy-this.ship.vy)**2);
        if(impactSpd>20){
          let dmg = impactSpd*0.012*a.radius*0.12;
          this.ship.health = Math.max(0, this.ship.health-dmg);

          const ba = angleTo(a.x,a.y,this.ship.x,this.ship.y);
          this.ship.vx += Math.cos(ba)*impactSpd*0.4;
          this.ship.vy += Math.sin(ba)*impactSpd*0.4;
        }

        a.hp -= 0.5;
      }

      for(let bi=this.bullets.length-1;bi>=0;bi--){
        const b = this.bullets[bi];
        if(dist(b.x,b.y,a.x,a.y)<a.radius+3){
          a.hp -= b.dmg||1;
          b.gfx.destroy(); this.bullets.splice(bi,1);
          if(a.hp<=0){

            if(a.radius>8){
              for(let si=0;si<2;si++){
                const sa = Math.random()*Math.PI*2;
                const sg2 = this.add.graphics().setDepth(3);
                const frag = {
                  x:a.x+Math.cos(sa)*a.radius*0.5,
                  y:a.y+Math.sin(sa)*a.radius*0.5,
                  vx:a.vx+Math.cos(sa)*25, vy:a.vy+Math.sin(sa)*25,
                  radius:Math.floor(a.radius*0.55),
                  spin:Phaser.Math.FloatBetween(-2,2), rot:0,
                  gfx:sg2, hp:1
                };
                this.drawAsteroid(frag);
                this.asteroids.push(frag);
              }
            }
            a.gfx.destroy();
            this.asteroids.splice(i,1);
            this.score += Math.ceil(a.radius)*3;
            break;
          }
        }
      }
    }
  }

  updateEnemies(dt, time){
    const maxSpd = 82 + this.sector*2.76;

    for(const e of this.enemies){
      const ds = dist(e.x,e.y,this.ship.x,this.ship.y);

      const canSee = hasLineOfSight(e.x,e.y,this.ship.x,this.ship.y,this.planets);

      if(canSee && ds<220){
        e.alerted = true;
        e.alertTimer = Math.max(e.alertTimer||0, 0.5);
        e.lastKnownX = this.ship.x;
        e.lastKnownY = this.ship.y;
      }
      if(e.alertTimer>0){
        e.alertTimer -= dt;
        if(e.alertTimer<=0){
          e.alerted = false;
        }
      }

      let avoidX=0, avoidY=0;
      for(const p of this.planets){
        const dp = dist(e.x,e.y,p.x,p.y);
        const avoidR = p.radius + 55;
        if(dp < avoidR){
          const strength = (1 - dp/avoidR) * 320;
          const ang = angleTo(p.x,p.y,e.x,e.y);
          avoidX += Math.cos(ang)*strength;
          avoidY += Math.sin(ang)*strength;
        }
      }

      let desiredVx=0, desiredVy=0;
      if(e.alerted){

        const targetX = canSee ? this.ship.x : e.lastKnownX;
        const targetY = canSee ? this.ship.y : e.lastKnownY;
        const a = angleTo(e.x,e.y,targetX,targetY);
        const dTarget = dist(e.x,e.y,targetX,targetY);
        const chaseSpd = 72 + this.sector*1.84;
        desiredVx = Math.cos(a)*chaseSpd;
        desiredVy = Math.sin(a)*chaseSpd;
        e.targetAngle = a;
        e.state = 'chase';

        if(canSee && ds<190){
          e.fireTimer -= dt;

          const fRate = e.type===3 ? 3.0 : e.type===2 ? 0.6 : e.type===1 ? 1.5 : 1.8 + Math.random()*1.0;
          if(e.fireTimer<=0){
            e.fireTimer = fRate;
            const shootA = angleTo(e.x,e.y,this.ship.x,this.ship.y);
            const bspd = 195 + this.sector*4.6;
            if(e.type===3){
              for(let sp=-1;sp<=1;sp++){
                const g2=this.add.graphics().setDepth(8);
                g2.fillStyle(0xcc44ff,1); g2.fillCircle(0,0,5);
                g2.x=e.x; g2.y=e.y;
                const sa=shootA+sp*0.28;
                this.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(sa)*(bspd*0.65),vy:Math.sin(sa)*(bspd*0.65),gfx:g2,life:3});
              }
            } else if(e.type===1){
              for(let sp=-1;sp<=1;sp+=2){
                const g2=this.add.graphics().setDepth(8);
                g2.fillStyle(0xff8800,1); g2.fillCircle(0,0,3);
                g2.x=e.x; g2.y=e.y;
                const sa=shootA+sp*0.12;
                this.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(sa)*bspd,vy:Math.sin(sa)*bspd,gfx:g2,life:2.2});
              }
            } else if(e.type===2){
              const g2=this.add.graphics().setDepth(8);
              g2.fillStyle(0x00ffcc,1); g2.fillCircle(0,0,2);
              g2.x=e.x; g2.y=e.y;
              this.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(shootA)*(bspd*1.3),vy:Math.sin(shootA)*(bspd*1.3),gfx:g2,life:1.8});
            } else {
              const g2=this.add.graphics().setDepth(8);
              g2.fillStyle(0xff4400,1); g2.fillCircle(0,0,3);
              g2.x=e.x; g2.y=e.y;
              this.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(shootA)*bspd,vy:Math.sin(shootA)*bspd,gfx:g2,life:2.5});
            }
          }
        }

        if(!canSee && dTarget < 25){
          e.alerted = false;
          e.alertTimer = 0;
        }
      } else {
        e.state = 'patrol';
        if(!e.wanderAngle || Math.random()<dt*0.8) e.wanderAngle = Math.random()*Math.PI*2;
        desiredVx = Math.cos(e.wanderAngle)*35;
        desiredVy = Math.sin(e.wanderAngle)*35;
        e.targetAngle = e.wanderAngle;
      }

      e.vx = lerp(e.vx, desiredVx + avoidX, dt*2.5);
      e.vy = lerp(e.vy, desiredVy + avoidY, dt*2.5);

      for(const p of this.planets){
        const dp = dist(e.x,e.y,p.x,p.y);
        if(dp < p.radius + 14){
          const na = angleTo(p.x,p.y,e.x,e.y);
          e.vx = Math.cos(na)*60;
          e.vy = Math.sin(na)*60;
          e.x = p.x + Math.cos(na)*(p.radius+15);
          e.y = p.y + Math.sin(na)*(p.radius+15);
        }
      }

      const spd = Math.sqrt(e.vx**2+e.vy**2);
      if(spd>maxSpd){ e.vx=(e.vx/spd)*maxSpd; e.vy=(e.vy/spd)*maxSpd; }
      if(spd>5) e.targetAngle = lerp(e.targetAngle, Math.atan2(e.vy,e.vx), dt*5);

      e.x += e.vx*dt; e.y += e.vy*dt;
      if(e.x<-20) e.x=W+20; if(e.x>W+20) e.x=-20;
      if(e.y<-20) e.y=H+20; if(e.y>H+20) e.y=-20;

      this.drawEnemyShip(e.gfx, e.x, e.y, e.targetAngle, e.alerted, canSee, e.type||0, e.hp, e.maxHp);

      if(ds<15){
        let rdmg = 20*dt;
        this.ship.health = Math.max(0, this.ship.health - rdmg);
      }
    }
  }

  updateTowers(dt){
    const s = this.ship;
    let nearTower = null;
    let minDist = 999;

    for(const t of this.towers){
      if(t.active) continue;
      const d = dist(s.x,s.y,t.x,t.y);
      if(d<minDist){ minDist=d; if(d<30) nearTower=t; }
    }

    if(s.landed && nearTower){
      if(this.landingTower !== nearTower){
        this.landingTower = nearTower;
        this.landingTimer = 0;
      }
      this.landingTimer += dt;
      nearTower.activationProgress = this.landingTimer/2;

      nearTower.timer.clear();
      const tbx = nearTower.tipX - 15;
      const tby = nearTower.tipY - 14;
      nearTower.timer.fillStyle(0x001100, 0.7);
      nearTower.timer.fillRect(tbx, tby, 30, 5);
      nearTower.timer.fillStyle(0x00ff88,1);
      nearTower.timer.fillRect(tbx, tby, 30*(this.landingTimer/2), 5);
      nearTower.timer.lineStyle(1,0x00aa44,1);
      nearTower.timer.strokeRect(tbx, tby, 30, 5);

      if(this.landingTimer>=2){
        this.activateTower(nearTower);
        this.landingTimer=0;
        this.landingTower=null;
      }
    } else {
      if(this.landingTower && !s.landed){
        this.landingTower.activationProgress=0;
        this.landingTower.timer.clear();
        this.landingTimer=0;
        this.landingTower=null;
      }
    }

    for(const t of this.towers){
      const now = this.time.now;
      if(t.active){
        
        t.beam.clear();
        const pulse = 0.4+0.4*Math.sin(now/180);
        const bLen = 30 + 10*Math.sin(now/220);
        t.beam.lineStyle(2, 0x00ffff, pulse);
        t.beam.lineBetween(
            t.tipX, t.tipY,
            t.tipX + Math.cos(t.angle)*bLen,
            t.tipY + Math.sin(t.angle)*bLen
        );
        t.beam.lineStyle(1, 0x00ffcc, pulse*0.4);
        t.beam.strokeCircle(t.tipX, t.tipY, 6+4*pulse);
        this.drawTowerGfx(t);
      } else {
        
        t.beam.clear();
        const tickRate = 1200; 
        const phase = (now + t.tickPhase*1000) % tickRate;
        const on = phase < tickRate*0.18; 
        if(on){
          t.beam.fillStyle(0xffff00, 0.9);
          t.beam.fillCircle(t.tipX, t.tipY, 4);
          t.beam.lineStyle(1, 0xffff00, 0.5);
          t.beam.strokeCircle(t.tipX, t.tipY, 7);
        }
        this.drawTowerGfx(t);
      }
    }
  }

  activateTower(t){
    t.active = true;
    t.timer.clear();
    this.activeTowers++;
    this.score += 150;
    if(this.activeTowers >= this.towers.length){
      F.allTowersActivated();
    } else {
      F.towerActivate();
    }
    this.showMsg(`ANTENNA ACTIVATED! ${this.activeTowers}/${this.towers.length}`, 2000);
    if(this.activeTowers >= this.towers.length){
      this.spawnPortal();
    }
  }

  spawnPortal(){
    this.portalActive = true;
    this.portalGfx = this.add.graphics().setDepth(7);

    let px, py, tries=0;
    do {
      px = Phaser.Math.Between(60, W-60);
      py = Phaser.Math.Between(60, H-60);
      tries++;
    } while(
        tries < 200 &&
        this.planets.some(p => dist(px, py, p.x, p.y) < p.radius + 50)
        );
    this.portalX = px;
    this.portalY = py;
    F.portalSpawn();
    this.showMsg('BLACK HOLE SPAWNED! Enter it.', 3000);
    this.score += 200;
  }

  updatePortal(dt){
    if(!this.portalActive || !this.portalGfx) return;
    const pg = this.portalGfx;
    pg.clear();
    const t = this.time.now/1000;
    const px=this.portalX, py=this.portalY;

    for(let r=35;r>0;r-=5){
      const a = (r/35)*0.15;
      pg.fillStyle(0x6600cc, a);
      pg.fillCircle(px,py,r);
    }

    for(let i=0;i<8;i++){
      const angle = (i/8)*Math.PI*2+t*2;
      const r1=8,r2=34;
      pg.lineStyle(1,0xaa44ff,0.6);
      pg.lineBetween(px+Math.cos(angle)*r1,py+Math.sin(angle)*r1,
          px+Math.cos(angle+0.5)*r2,py+Math.sin(angle+0.5)*r2);
    }
    pg.fillStyle(0x000000,1);
    pg.fillCircle(px,py,10);

    if(!this.portalLabel){
      this.portalLabel = this.add.text(this.portalX,this.portalY-45,'BLACK HOLE',{fontSize:'10px',fontFamily:'Courier New',color:'#aa44ff'}).setOrigin(0.5).setDepth(8);
    }
  }

  nextSector(){
    if(this.sectorTransition) return;
    this.sectorTransition = true;
    this.score += 500 + this.sector*100;
    this.sector++;
    F.portalEnter();
    F.stopMusic(1.2);
    if(this._engineOn){ this._engineOn=false; F.stopEngine(); }

    const flash = this.add.graphics().setDepth(50);
    flash.fillStyle(0xffffff,1); flash.fillRect(0,0,W,H);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 800,
      onComplete: ()=>{
        flash.destroy();
        this.sectorTransition = false;
        if(this.portalLabel){ this.portalLabel.destroy(); this.portalLabel=null; }
        this.generateSector();
        this.createUI();
        if(this.sector===1) this.startTutorial();

        const maxFuelSect = 100 + (this.upgrades.extraTank||0)*15;
        this.ship.fuel = Math.min(maxFuelSect, this.ship.fuel+20);
        this.ship.energy = Math.min(100, this.ship.energy+15);
        this.ship.health = Math.min(100, this.ship.health+20);
        const sp = this.findSafeSpawn();
        this.ship.x = sp.x; this.ship.y = sp.y;
        this.ship.vx = 0; this.ship.vy = 0;
        this.ship.landed = false;
        this.activeTowers = 0;
        this.landingTimer = 0;
        this.landingTower = null;
        F.sectorStart();
        F.startMusic();
        this.showMsg(`SECTOR ${this.sector} STARTED!`, 2500);

        
        this.spawnShipBeacon(sp.x, sp.y);
      }
    });
  }

  spawnShipBeacon(sx, sy){
    
    const rings = this.add.graphics().setDepth(30);
    let ringAge = 0;
    const ringEvent = this.time.addEvent({ delay: 16, loop: true, callback: ()=>{
        ringAge += 0.016;
        rings.clear();
        for(let i=0;i<3;i++){
          const t = (ringAge*0.9 - i*0.25);
          if(t<0) continue;
          const r = t * 120;
          const alpha = Math.max(0, 0.7 - t*0.9);
          rings.lineStyle(2, 0x00ffff, alpha);
          rings.strokeCircle(sx, sy, r);
        }
        if(ringAge > 3.5){ ringEvent.remove(); rings.destroy(); }
      }});

    
    const arrowGfx = this.add.graphics().setDepth(31);
    const arrowLabel = this.add.text(sx, sy-38, '◆ SHIP ◆', {
      fontSize:'10px', fontFamily:'Courier New', color:'#00ffff', stroke:'#003333', strokeThickness:2
    }).setOrigin(0.5).setDepth(31);

    
    this.tweens.add({ targets: arrowLabel, alpha:{from:0.2,to:1}, duration:300, yoyo:true, repeat:13,
      onComplete: ()=>{ arrowLabel.destroy(); }
    });

    let arrowAge = 0;
    const arrowEvent = this.time.addEvent({ delay: 16, loop: true, callback: ()=>{
        arrowAge += 0.016;
        arrowGfx.clear();
        if(arrowAge > 4){ arrowEvent.remove(); arrowGfx.destroy(); return; }

        
        const corners = [
          {cx: 30,   cy: H/2,  ang: 0         },   
          {cx: W-30, cy: H/2,  ang: Math.PI   },   
          {cx: W/2,  cy: 30,   ang: Math.PI/2 },   
          {cx: W/2,  cy: H-30, ang: -Math.PI/2},   
        ];

        const pulse = 0.5 + 0.5*Math.sin(arrowAge * 8);
        corners.forEach(c=>{
          
          const dx = sx - c.cx, dy = sy - c.cy;
          const edgeAng = Math.atan2(dy, dx);
          
          const diff = Math.abs(edgeAng - c.ang);
          const normDiff = Math.min(diff, Math.PI*2 - diff);
          if(normDiff > Math.PI * 0.6) return;

          arrowGfx.save();
          arrowGfx.translateCanvas(c.cx, c.cy);
          arrowGfx.rotateCanvas(edgeAng);
          arrowGfx.fillStyle(0x00ffff, 0.5 + 0.4*pulse);
          
          for(let k=0;k<3;k++){
            const ox = k*10;
            arrowGfx.fillTriangle(12+ox,0, -2+ox,-7, -2+ox,7);
          }
          arrowGfx.restore();
        });
      }});
  }
}

const c = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#00000f',
  parent: 'game-container',
  scene: [MenuScene, GameScene, GameOverScene],
  render: { antialias: true }
};

const g = new Phaser.Game(c);
