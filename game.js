const W = 800, H = 600;

function dist(x1,y1,x2,y2){ return Math.sqrt((x2-x1)**2+(y2-y1)**2); }
function gr(x1,y1,x2,y2){ return Math.atan2(y2-y1,x2-x1); }
function lerp(a,b,t){ return a+(b-a)*t; }

function dk(x1,y1,x2,y2,cm){
  for(const p of cm){

    const dx=x2-x1, dy=y2-y1;
    const len2=dx*dx+dy*dy;
    if(len2===0) return true;
    let t=((p.x-x1)*dx+(p.y-y1)*dy)/len2;
    t=Math.max(0,Math.min(1,t));
    const cx=x1+t*dx, cy=y1+t*dy;
    if(dist(cx,cy,p.x,p.y)<p.fy-2) return false;
  }
  return true;
}

class ba extends Phaser.Scene {
  constructor(){ super('Menu'); }

  create(){
    this.ga = 'main'; // 'main' | 'instructions' | 'leaderboard'
    this.aq = [];
    this.drawBg();
    this.showMain();
  }

  drawBg(){
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x000000,1); g.fillRect(0,0,W,H);
    // Scanlines
    for(let y=0;y<H;y+=4){ g.fillStyle(0x000011,0.3); g.fillRect(0,y,W,2); }
    // Stars
    for(let i=0;i<220;i++){
      const sz=Math.random()<0.04?2:0.8;
      g.fillStyle(0xffffff,Phaser.Math.FloatBetween(0.1,0.7));
      g.fillCircle(Phaser.Math.Between(0,W),Phaser.Math.Between(0,H),sz);
    }
    // Bottom perspective grid
    g.lineStyle(1,0x001133,0.4);
    for(let x=0;x<=W;x+=28){ g.lineBetween(x,H,W/2,H*0.72); }
    g.lineStyle(1,0x001133,0.25);
    for(let i=0;i<8;i++){
      const t=i/8, y=H*0.72+t*(H-H*0.72);
      g.lineBetween(0,y,W,y);
    }
    this.am = g;
  }

  clearPage(){
    this.aq.forEach(o=>{ try{ o.destroy(); }catch(e){} });
    this.aq = [];
  }

  addObj(o){ this.aq.push(o); return o; }

  btn(x, y, bk, color, cb){
    const t = this.addObj(
      this.add.text(x, y, bk, {
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
    // Title
    const t1 = this.addObj(this.add.text(W/2,148,'SECTOR',{fontSize:'72px',fontFamily:'Courier New',color:'#00ffff',stroke:'#003366',strokeThickness:4}).setOrigin(0.5).setDepth(5));
    const t2 = this.addObj(this.add.text(W/2,222,'DRIFT', {fontSize:'72px',fontFamily:'Courier New',color:'#ff6600',stroke:'#330000',strokeThickness:4}).setOrigin(0.5).setDepth(5));
    this.addObj(this.add.text(W/2,285,'Navigate · Land · Activate · Escape',{fontSize:'13px',fontFamily:'Courier New',color:'#556677'}).setOrigin(0.5).setDepth(5));

    this.tweens.add({targets:[t1,t2],alpha:{from:0.5,to:1},duration:1400,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    this.btn(W/2, 355, '▶  JUGAR',          '#ffff00', ()=>this.scene.start('Game'));
    this.btn(W/2, 405, '?  INSTRUCCIONES',  '#44ccff', ()=>this.showInstructions());
    this.btn(W/2, 455, '★  LEADERBOARD',   '#ffcc44', ()=>this.showLeaderboard());

    // Version blip
    this.addObj(this.add.text(W-8,H-10,'v1.0',{fontSize:'9px',fontFamily:'Courier New',color:'#223344'}).setOrigin(1,1).setDepth(5));
  }

  showInstructions(){
    this.clearPage();

    // Title bar
    this.addObj(this.add.text(W/2,28,'INSTRUCCIONES',{fontSize:'20px',fontFamily:'Courier New',color:'#44ccff',stroke:'#001133',strokeThickness:2,letterSpacing:4}).setOrigin(0.5).setDepth(5));
    const du = this.addObj(this.add.graphics().setDepth(5));
    du.lineStyle(1,0x224466,1); du.lineBetween(40,44,W-40,44);

    const bz = [
      { gj:'OBJETIVO', color:'#ffff00', items:[
        'Aterriza junto a cada antena 2s para activarla. Al activar todas, entra al agujero negro.',
      ]},
      { gj:'CONTROLES', color:'#44ccff', items:[
        'WASD/Flechas: rotar y propulsar  |  ESPACIO: freno  |  F/Ctrl/Clic: disparar',
      ]},
      { gj:'RECURSOS', color:'#00ff88', items:[
        'Aterriza en planetas: recarga combustible, energia y salud. Sin combustible tienes 3s.',
      ]},
      { gj:'MEJORAS (restos flotantes)', color:'#ffaa44', items:[
        'ARMA: +1 bala por nivel (max 3)  |  TANQUE: +15 combustible max  |  SALUD: +30 HP',
      ]},
      { gj:'ENEMIGOS', color:'#ff4444', items:[
        'Fighter S1+ | D.Fighter S3+ | Drone S5+ | Bomber S7+  — persiguen tu ultima posicion',
      ]},
      { gj:'FISICA', color:'#aa88ff', items:[
        'Gravedad planetaria. Aterrizaje >80 dania. Asteroides se parten al dispararlos.',
      ]},
    ];

    let y = 60;
    bz.forEach(sec=>{
      this.addObj(this.add.text(30,y,sec.gj,{fontSize:'11px',fontFamily:'Courier New',color:sec.color,letterSpacing:2}).setDepth(5));
      y+=15;
      sec.items.forEach(item=>{
        this.addObj(this.add.text(44,y,'· '+item,{fontSize:'10px',fontFamily:'Courier New',color:'#7788aa',wordWrap:{width:W-80}}).setDepth(5));
        y+=13;
      });
      y+=5;
    });

    du.lineBetween(40,y,W-40,y);
    this.btn(W/2, y+30, '←  VOLVER', '#aaaaaa', ()=>this.showMain());
  }

  showLeaderboard(){
    this.clearPage();

    this.addObj(this.add.text(W/2,28,'✦  HALL OF FAME  ✦',{fontSize:'22px',fontFamily:'Courier New',color:'#ffdd00',stroke:'#443300',strokeThickness:3}).setOrigin(0.5).setDepth(5));

    const du = this.addObj(this.add.graphics().setDepth(5));
    du.lineStyle(1,0x334455,0.8);
    du.lineBetween(40,50,W-40,50);

    // Column headers
    this.addObj(this.add.text(W/2-130,64,'#',      {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0.5).setDepth(5));
    this.addObj(this.add.text(W/2-88, 64,'NOMBRE', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    this.addObj(this.add.text(W/2+16, 64,'PUNTOS', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    this.addObj(this.add.text(W/2+108,64,'SECT',   {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5).setDepth(5));
    du.lineBetween(40,74,W-40,74);

    let ac = [];
    try{ ac = JSON.parse(localStorage.getItem('spaceSectorsLB')||'[]'); }catch(e){}

    const gg = ['🥇','🥈','🥉'];
    if(ac.length===0){
      this.addObj(this.add.text(W/2,200,'SIN REGISTROS AÚN\nJuega para aparecer aquí',{fontSize:'14px',fontFamily:'Courier New',color:'#223344',align:'center'}).setOrigin(0.5).setDepth(5));
    } else {
      ac.slice(0,10).forEach((s,i)=>{
        const y = 90+i*34;
        const ae = i<3;
        const gb = i===0?0xffdd00:i===1?0xcccccc:i===2?0xcc8844:0x445566;
        const fm = '#'+gb.toString(16).padStart(6,'0');

        if(ae){
          const rg = this.addObj(this.add.graphics().setDepth(4));
          rg.fillStyle(gb,0.07); rg.fillRect(40,y-13,W-80,28);
        }

        this.addObj(this.add.text(W/2-130,y, i<3?gg[i]:`${i+1}.`, {fontSize:ae?'16px':'12px',fontFamily:'Courier New',color:fm}).setOrigin(0.5).setDepth(5));
        this.addObj(this.add.text(W/2-88,  y, s.name,                   {fontSize:'18px',fontFamily:'Courier New',color:ae?'#ffffff':'#7788aa'}).setOrigin(0,0.5).setDepth(5));
        this.addObj(this.add.text(W/2+16,  y, String(s.cj).padStart(7), {fontSize:'15px',fontFamily:'Courier New',color:fm}).setOrigin(0,0.5).setDepth(5));
        this.addObj(this.add.text(W/2+112, y, `${s.dy}`,              {fontSize:'12px',fontFamily:'Courier New',color:'#445566'}).setOrigin(0,0.5).setDepth(5));
      });
    }

    const cz = this.addObj(this.add.text(W/2-70,H-55,'[ BORRAR ]',{fontSize:'13px',fontFamily:'Courier New',color:'#553333'}).setOrigin(0.5).setDepth(5).setInteractive());
    cz.on('pointerover',()=>cz.setColor('#ff4444'));
    cz.on('pointerout', ()=>cz.setColor('#553333'));
    cz.on('pointerdown',()=>{
      try{ localStorage.removeItem('spaceSectorsLB'); }catch(e){}
      this.showLeaderboard();
    });

    this.btn(W/2+70, H-55, '←  VOLVER', '#aaaaaa', ()=>this.showMain());
  }
}

class gm extends Phaser.Scene {
  constructor(){ super('GameOver'); }
  init(data){ this.dj=data.cj||0; this.dy=data.dy||1; this.al=data.al||'hull'; }

  create(){
    this.cr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    this.ek = [0,0,0]; // 3 char name
    this.fh = 0;
    this.dq = false;
    this.ac = this.loadScores();
    this.gf = 'entry'; // 'entry' | 'board'

    this.drawBg();
    this.buildEntryUI();

    // Keyboard input
    this.input.keyboard.on('keydown', e => this.handleKey(e));
  }

  drawBg(){
    const g = this.add.graphics();
    g.fillStyle(0x000000,1); g.fillRect(0,0,W,H);
    // Scanlines
    for(let y=0;y<H;y+=4){
      g.fillStyle(0x000011, 0.35); g.fillRect(0,y,W,2);
    }
    // Stars
    for(let i=0;i<200;i++){
      const sz=Math.random()<0.05?1.5:0.8;
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1,0.6));
      g.fillCircle(Phaser.Math.Between(0,W), Phaser.Math.Between(0,H), sz);
    }
    // Retro grid lines at bottom
    g.lineStyle(1,0x001133,0.5);
    for(let x=0;x<W;x+=32) g.lineBetween(x,H*0.7,W/2,H);
    for(let x=0;x<W;x+=32) g.lineBetween(x,H,W/2,H*0.7);
  }

  buildEntryUI(){
    const msg = this.al==='fuel' ? '★  SIN COMBUSTIBLE  ★' : '★  NAVE DESTRUIDA  ★';
    const col = this.al==='fuel' ? '#ffaa00' : '#ff4422';

    // Death al — glitchy flicker
    const gj = this.add.text(W/2, 55, msg, {
      fontSize:'22px', fontFamily:'Courier New', color:col,
      stroke:'#000000', strokeThickness:3
    }).setOrigin(0.5);
    this.tweens.add({targets:gj, alpha:{from:0.6,to:1}, duration:180, yoyo:true, repeat:-1});

    // Score
    this.add.text(W/2, 98, `PUNTUACIÓN`, {fontSize:'11px', fontFamily:'Courier New', color:'#445566', letterSpacing:4}).setOrigin(0.5);
    this.add.text(W/2, 118, `${this.dj}`, {fontSize:'36px', fontFamily:'Courier New', color:'#ffff00', stroke:'#555500', strokeThickness:3}).setOrigin(0.5);
    this.add.text(W/2, 158, `SECTOR ${this.dy}`, {fontSize:'14px', fontFamily:'Courier New', color:'#4488aa'}).setOrigin(0.5);

    // Entry prompt
    this.add.text(W/2, 200, 'INGRESA TU NOMBRE', {fontSize:'13px', fontFamily:'Courier New', color:'#aaccff', letterSpacing:3}).setOrigin(0.5);
    this.add.text(W/2, 218, '↑↓ CAMBIAR  ←→ CURSOR  ENTER CONFIRMAR', {fontSize:'8px', fontFamily:'Courier New', color:'#334455', letterSpacing:1}).setOrigin(0.5);

    // 3-char letter picker
    this.ha = [];
    this.aj = this.add.graphics().setDepth(5);
    for(let i=0;i<3;i++){
      const x = W/2 + (i-1)*52;
      const ltr = this.add.text(x, 258, this.cr[this.ek[i]], {
        fontSize:'42px', fontFamily:'Courier New', color:'#ffffff',
        stroke:'#000033', strokeThickness:4
      }).setOrigin(0.5);
      this.ha.push(ltr);
    }
    this.redrawCursor();

    // Leaderboard preview (bottom half)
    this.er = [];
    this.drawLeaderboardPreview();

    // Submit button hint
    this.bs = this.add.text(W/2, 320, '▶  ENTER PARA REGISTRAR  ◀', {
      fontSize:'12px', fontFamily:'Courier New', color:'#44ff88', letterSpacing:2
    }).setOrigin(0.5);
    this.tweens.add({targets:this.bs, alpha:{from:0.3,to:1}, duration:600, yoyo:true, repeat:-1});
  }

  redrawCursor(){
    const g = this.aj;
    g.clear();
    const x = W/2 + (this.fh-1)*52;
    g.lineStyle(3, 0x00ffff, 0.8);
    g.strokeRect(x-22, 238, 44, 50);
    // Corner accents
    g.lineStyle(2, 0x00ffff, 0.5);
    [[x-22,238],[x+22,238],[x-22,288],[x+22,288]].forEach(([cx,cy],i)=>{
      const sx=i%2===0?1:-1, sy=i<2?1:-1;
      g.lineBetween(cx,cy,cx+sx*8,cy);
      g.lineBetween(cx,cy,cx,cy+sy*8);
    });
  }

  drawLeaderboardPreview(){
    this.er.forEach(o=>o.destroy());
    this.er=[];
    const ac = this.ac.slice(0,8);

    const hdr = this.add.text(W/2, 340, '—  HALL OF FAME  —', {fontSize:'11px', fontFamily:'Courier New', color:'#335566', letterSpacing:4}).setOrigin(0.5);
    this.er.push(hdr);

    ac.forEach((s,i)=>{
      const y = 360 + i*22;
      const gb = i===0?'#ffdd00':i===1?'#cccccc':i===2?'#cc8844':'#445566';
      const rank = this.add.text(W/2-120, y, `${i+1}.`.padStart(3), {fontSize:'12px', fontFamily:'Courier New', color:gb}).setOrigin(0,0.5);
      const name = this.add.text(W/2-95, y, s.name, {fontSize:'13px', fontFamily:'Courier New', color:i<3?'#ffffff':'#8899aa'}).setOrigin(0,0.5);
      const sc = this.add.text(W/2+30, y, String(s.cj).padStart(7,' '), {fontSize:'13px', fontFamily:'Courier New', color:gb}).setOrigin(0,0.5);
      const sec = this.add.text(W/2+105, y, `S${s.dy}`, {fontSize:'10px', fontFamily:'Courier New', color:'#334455'}).setOrigin(0,0.5);
      this.er.push(rank,name,sc,sec);
    });

    if(ac.length===0){
      const bj = this.add.text(W/2,380,'SIN REGISTROS AÚN',{fontSize:'12px',fontFamily:'Courier New',color:'#223344'}).setOrigin(0.5);
      this.er.push(bj);
    }
  }

  handleKey(e){
    if(this.dq) return;
    const k = e.key;
    if(k==='ArrowUp'||k==='w'||k==='W'){
      this.ek[this.fh]=(this.ek[this.fh]+1)%this.cr.length;
      this.ha[this.fh].setText(this.cr[this.ek[this.fh]]);
    } else if(k==='ArrowDown'||k==='s'||k==='S'){
      this.ek[this.fh]=(this.ek[this.fh]-1+this.cr.length)%this.cr.length;
      this.ha[this.fh].setText(this.cr[this.ek[this.fh]]);
    } else if(k==='ArrowRight'||k==='d'||k==='D'){
      this.fh=Math.min(2,this.fh+1); this.redrawCursor();
    } else if(k==='ArrowLeft'||k==='a'||k==='A'){
      this.fh=Math.max(0,this.fh-1); this.redrawCursor();
    } else if(k==='Enter'||k===' '){
      this.submitScore();
    }
  }

  submitScore(){
    if(this.dq) return;
    this.dq=true;
    const name = this.ek.map(i=>this.cr[i]).join('');
    this.saveScore(name, this.dj, this.dy);
    this.ac = this.loadScores();

    // Flash dq
    this.bs.setText('✦  REGISTRADO  ✦').setColor('#ffff00');
    this.aj.clear();
    this.ha.forEach((l,i)=>{ l.setColor('#ffff00'); });

    this.time.delayedCall(900, ()=>{ this.showFullBoard(); });
  }

  showFullBoard(){
    // Clear everything, show full leaderboard
    this.children.list.slice(0).forEach(o=>{
      if(o.type==='Graphics'||o.type==='Text') try{ o.destroy(); }catch(e){}
    });

    this.drawBg();
    const ac = this.ac;

    this.add.text(W/2, 32, '✦  HALL OF FAME  ✦', {
      fontSize:'26px', fontFamily:'Courier New', color:'#ffdd00',
      stroke:'#443300', strokeThickness:3
    }).setOrigin(0.5);

    const du = this.add.graphics();
    du.lineStyle(1,0x334455,0.8); du.lineBetween(W/2-160,58,W/2+160,58);

    // Column headers
    this.add.text(W/2-130, 70, '#', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0.5);
    this.add.text(W/2-85, 70, 'NOMBRE', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    this.add.text(W/2+20, 70, 'PUNTOS', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    this.add.text(W/2+105, 70, 'SECT', {fontSize:'10px',fontFamily:'Courier New',color:'#334455',letterSpacing:2}).setOrigin(0,0.5);
    du.lineBetween(W/2-160,80,W/2+160,80);

    const gg = ['🥇','🥈','🥉'];
    ac.slice(0,10).forEach((s,i)=>{
      const y = 96 + i*34;
      const ae = i<3;
      const gb = i===0?0xffdd00:i===1?0xcccccc:i===2?0xcc8844:0x334455;
      const fm = '#'+gb.toString(16).padStart(6,'0');

      // Row highlight for top 3
      if(ae){
        const rowG = this.add.graphics();
        rowG.fillStyle(gb, 0.06);
        rowG.fillRect(W/2-160, y-12, 320, 28);
      }

      const dd = i<3 ? gg[i] : `${i+1}.`;
      this.add.text(W/2-130, y, dd, {fontSize:ae?'16px':'12px', fontFamily:'Courier New', color:fm}).setOrigin(0.5);
      this.add.text(W/2-85, y, s.name, {fontSize:'18px', fontFamily:'Courier New', color:ae?'#ffffff':'#7788aa'}).setOrigin(0,0.5);
      this.add.text(W/2+20, y, String(s.cj).padStart(7), {fontSize:'16px', fontFamily:'Courier New', color:fm}).setOrigin(0,0.5);
      this.add.text(W/2+112, y, `${s.dy}`, {fontSize:'13px', fontFamily:'Courier New', color:'#445566'}).setOrigin(0,0.5);
    });

    du.lineBetween(W/2-160, 96+10*34-8, W/2+160, 96+10*34-8);

    const cg = this.add.text(W/2-80, H-60, '[ REINTENTAR ]', {fontSize:'16px', fontFamily:'Courier New', color:'#44ff88', stroke:'#002200', strokeThickness:2}).setOrigin(0.5).setInteractive();
    cg.on('pointerover',()=>cg.setColor('#ffffff'));
    cg.on('pointerout',()=>cg.setColor('#44ff88'));
    cg.on('pointerdown',()=>this.scene.start('Game'));

    const menu = this.add.text(W/2+80, H-60, '[ MENÚ ]', {fontSize:'16px', fontFamily:'Courier New', color:'#aaaaaa'}).setOrigin(0.5).setInteractive();
    menu.on('pointerover',()=>menu.setColor('#ffffff'));
    menu.on('pointerout',()=>menu.setColor('#aaaaaa'));
    menu.on('pointerdown',()=>this.scene.start('Menu'));

    // Blinking fh on buttons
    this.tweens.add({targets:[cg,menu], alpha:{from:0.7,to:1}, duration:800, yoyo:true, repeat:-1});
  }

  loadScores(){
    try{
      const raw = localStorage.getItem('spaceSectorsLB');
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  saveScore(name, cj, dy){
    try{
      let ac = this.loadScores();
      ac.push({name, cj, dy});
      ac.sort((a,b)=>b.cj-a.cj);
      ac = ac.slice(0,10);
      localStorage.setItem('spaceSectorsLB', JSON.stringify(ac));
    }catch(e){}
  }
}

class eq extends Phaser.Scene {
  constructor(){ super('Game'); }

  init(){
    this.dy = 1;
    this.cj = 0;

    this.gy = { weapon:0, extraTank:0 };
  }

  create(){
    this.cameras.main.setBackgroundColor('#00000f');
    this.generateSector();
    this.createShip();
    this.createUI();
    this.createInput();
    this.de = false;
  }

  generateSector(){

    if(this.dv) this.dv.forEach(f=>{ if(f.gfx) f.gfx.destroy(); if(f.bk) f.bk.destroy(); });
    if(this.ft) this.ft.forEach(a=>{ if(a.gfx) a.gfx.destroy(); });
    if(this.cm) this.cm.forEach(p=>{ if(p.gfx) p.gfx.destroy(); if(p.bk) p.bk.destroy(); if(p.ring) p.ring.destroy(); });
    if(this.eg) this.eg.forEach(t=>{ if(t.gfx) t.gfx.destroy(); if(t.beam) t.beam.destroy(); if(t.timer) t.timer.destroy(); });
    if(this.gx) this.gx.forEach(e=>{ if(e.gfx) e.gfx.destroy(); });
    if(this.da) this.da.forEach(b=>{ if(b.gfx) b.gfx.destroy(); });
    if(this.co) this.co.forEach(b=>{ if(b.gfx) b.gfx.destroy(); });
    if(this.fd) this.fd.forEach(w=>{ if(w.gfx) w.gfx.destroy(); if(w.bk) w.bk.destroy(); });
    if(this.ad){ this.ad.destroy(); this.ad=null; }
    if(this.he) this.he.destroy();
    if(this.em) this.em.destroy();
    if(this.particles) this.particles.destroy();
    if(this.gt) this.gt.forEach(t=>{ if(t.gfx) t.gfx.destroy(); });

    const s = this.dy;
    const g = this.add.graphics();
    this.he = g;

    for(let i=0;i<180;i++){
      const x=Phaser.Math.Between(0,W), y=Phaser.Math.Between(0,H);
      const r=Phaser.Math.FloatBetween(0.5,1.8);
      const gs = Phaser.Math.FloatBetween(0.2,0.9);
      g.fillStyle(0xffffff, gs);
      g.fillCircle(x,y,r);
    }

    for(let i=0;i<4;i++){
      const x=Phaser.Math.Between(50,W-50), y=Phaser.Math.Between(50,H-50);
      const col = [0x001133,0x110022,0x001122,0x002211][i%4];
      g.fillStyle(col, 0.3);
      g.fillEllipse(x,y,Phaser.Math.Between(80,200),Phaser.Math.Between(60,150));
    }

    this.em = this.add.text(W/2, 18, `SECTOR ${s}`, {fontSize:'14px',fontFamily:'Courier New',color:'#335577'}).setOrigin(0.5).setDepth(10);

    // Sector 1: sidebar hint panel on the right
    if(this.fq) this.fq.forEach(o=>{ try{o.destroy();}catch(e){} });
    this.fq = [];
    if(s===1){
      const gc = W - 148;
      const fc = H/2 - 110;
      const ab = 138;
      const gi = 220;

      // Panel background
      const gh = this.add.graphics().setDepth(8);
      gh.fillStyle(0x001122, 0.82);
      gh.fillRoundedRect(gc, fc, ab, gi, 6);
      gh.lineStyle(1, 0x0055aa, 0.7);
      gh.strokeRoundedRect(gc, fc, ab, gi, 6);
      this.fq.push(gh);

      // Header
      const fg = this.add.text(gc + ab/2, fc + 14, '[ TUTORIAL ]', {
        fontSize:'9px', fontFamily:'Courier New', color:'#44ccff', letterSpacing:3
      }).setOrigin(0.5).setDepth(9);
      this.fq.push(fg);

      // Divider
      const divG = this.add.graphics().setDepth(9);
      divG.lineStyle(1, 0x003366, 0.8);
      divG.lineBetween(gc+8, fc+24, gc+ab-8, fc+24);
      this.fq.push(divG);

      const ay = [
        { icon:'🚀', text:'Mueve la nave\ncon WASD' },
        { icon:'🪐', text:'Aterriza en\nel planeta' },
        { icon:'📡', text:'Activa la\nantena (2 seg)' },
        { icon:'🌀', text:'Entra al\nAgujero Negro' },
      ];

      ay.forEach((step, i) => {
        const sy = fc + 38 + i * 46;
        const gz = this.add.text(gc + 14, sy + 4, step.icon, {
          fontSize:'18px'
        }).setOrigin(0, 0.5).setDepth(9);
        const ev = this.add.text(gc + 38, sy, step.text, {
          fontSize:'10px', fontFamily:'Courier New', color:'#88bbdd',
          lineSpacing: 3, wordWrap:{width: ab - 46}
        }).setOrigin(0, 0.5).setDepth(9);
        // Step number circle
        const numG = this.add.graphics().setDepth(9);
        numG.fillStyle(0x0055aa, 0.7);
        numG.fillCircle(gc + 14, sy + 4, 9);
        numG.lineStyle(1, 0x0088ff, 0.6);
        numG.strokeCircle(gc + 14, sy + 4, 9);
        const bc = this.add.text(gc + 14, sy + 4, `${i+1}`, {
          fontSize:'9px', fontFamily:'Courier New', color:'#ffffff'
        }).setOrigin(0.5).setDepth(10);
        this.fq.push(gz, ev, numG, bc);
      });

      // Fade out after 20s
      this.time.delayedCall(16000, ()=>{
        if(this.fq && this.dy===1){
          this.fq.forEach(o=>{ this.tweens.add({targets:o, alpha:0, duration:3000}); });
        }
      });
    }

    const gq = s===1 ? 1 : Math.min(2+Math.floor(s/2.5), 6);
    const ao  = s===1 ? 1 : Math.min(1+Math.ceil(s*0.92), gq*2);

    this.cm = [];
    this.eg = [];
    this.gx = [];
    this.da = [];
    this.co = [];
    this.fd = [];
    this.dv = [];
    this.ft = [];
    this.ad = null;
    this.bh = false;
    this.gt = [];
    this.bi = 0;
    this.fr = null;
    this.an = 0;

    const ai = [];
    for(let i=0;i<gq;i++){
      let x,y,tries=0;
      do {
        x = Phaser.Math.Between(80,W-80);
        y = Phaser.Math.Between(80,H-80);
        tries++;
      } while(tries<50 && ai.some(p=>dist(p.x,p.y,x,y)<180));
      ai.push({x,y});
      this.createPlanet(x,y,i);
    }

    for(let i=0;i<Math.min(ao,gq*2);i++){
      const dn = this.cm[i % this.cm.length];
      const bv = (i/ao)*Math.PI*2 + Math.random()*0.5;
      this.createTower(dn, bv);
    }

    if(s>1){
      // Max 3 items total (consumables + gy). Never bd on top of antenna eg.
      const dg = this.eg.map(t=>({x:t.x,y:t.y}));
      const be = (x,y) => dg.every(t=>dist(x,y,t.x,t.y)>34);

      const fi = (dn, eu) => {
        for(let cs=0; cs<12; cs++){
          const a = eu + cs*(Math.PI*2/12);
          const ix = dn.x + Math.cos(a)*(dn.fy+22);
          const iy = dn.y + Math.sin(a)*(dn.fy+22);
          if(be(ix,iy)) return {x:ix, y:iy};
        }
        return null;
      };

      // Build pool: 1 fuel + 1 health + 1 upgrade (or 2nd fuel if maxed)
      const gn = ['weapon','extraTank'].filter(t=>(this.gy[t]||0)<3);
      const ar = [{kind:'fuel'}, {kind:'health'}];
      if(gn.length>0){
        const upg = gn[Phaser.Math.Between(0,gn.length-1)];
        ar.push({kind:'upgrade', type:upg});
      } else {
        ar.push({kind:'fuel'});
      }
      // Shuffle
      for(let i=ar.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [ar[i],ar[j]]=[ar[j],ar[i]];
      }
      let en=0;
      for(let ii=0;ii<ar.length&&en<3;ii++){
        const item=ar[ii];
        const dn=this.cm[en%this.cm.length];
        const ge=(en/3)*Math.PI*2+Math.random()*0.5;
        const pos=fi(dn,ge);
        if(!pos) continue;
        if(item.kind==='fuel') this.createFuelDepot(pos.x,pos.y,dn);
        else this.createWreck(pos.x,pos.y,item.kind==='health'?'health':item.type);
        en++;
      }
    }

    if(s>=3){
      const cx = Math.min(Math.floor((s-2)*1.38), 7);
      for(let i=0;i<cx;i++){
        const px = Phaser.Math.Between(50,W-50);
        const py = Phaser.Math.Between(50,H-50);
        this.createEnemy(px,py);
      }
    }
    // Planet turrets — dy 5+
    if(s>=5){
      const cu = Math.min(Math.floor((s-4)*0.8), 4);
      for(let ti=0;ti<cu;ti++){
        const dn = this.cm[ti % this.cm.length];
        const bv = (ti/Math.max(cu,1))*Math.PI*2 + Math.random()*0.6;
        this.createPlanetTurret(dn, bv);
      }
    }

    const fk = s===1 ? 0 : 3 + Math.floor(s * 1.1);
    for(let ai=0; ai<fk; ai++){
      let ax, ay, tries=0;
      do {
        ax = Phaser.Math.Between(30, W-30);
        ay = Phaser.Math.Between(30, H-30);
        tries++;
      } while(tries<80 && this.cm.some(p=>dist(ax,ay,p.x,p.y)<p.fy+40));

      const minR = s>=5 ? 6 : 4;
      const maxR = s>=7 ? 22 : s>=4 ? 16 : 10;
      const fy = Phaser.Math.Between(minR, maxR);
      const gl  = Phaser.Math.FloatBetween(14, 32 + s*2.76);
      const bv  = Phaser.Math.FloatBetween(0, Math.PI*2);
      const spin   = Phaser.Math.FloatBetween(-1.5, 1.5);
      const g = this.add.graphics().setDepth(3);
      const ast = {x:ax, y:ay, vx:Math.cos(bv)*gl, vy:Math.sin(bv)*gl, fy, spin, rot:0, gfx:g, hp: Math.ceil(fy/4)};
      this.drawAsteroid(ast);
      this.ft.push(ast);
    }
  }

  createPlanet(x,y,idx){
    const bl = [0x3366cc,0x66aa33,0xcc6633,0x9933cc,0x33aacc,0xaa3366];
    const color = bl[idx%bl.length];
    const fy = Phaser.Math.Between(25,50);
    const fe = Phaser.Math.FloatBetween(40, 88) * (1 + this.dy * 0.0276);
    const ck = fy*4.5;
    const ch = Math.random()>0.4;
    const dz = ['fuel','energy','health'][Phaser.Math.Between(0,2)];
    let eh = ch ? Phaser.Math.Between(20,60) : 0;

    const g = this.add.graphics();
    g.setDepth(1);

    g.fillStyle(color, 0.04);
    g.fillCircle(x,y,ck);
    g.lineStyle(1, color, 0.15);
    g.strokeCircle(x,y,ck);

    g.fillStyle(color, 1);
    g.fillCircle(x,y,fy);

    g.fillStyle(0xffffff,0.15);
    g.fillCircle(x-fy*0.3, y-fy*0.3, fy*0.4);

    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(x,y,fy);

    let ring = null;
    if(ch){
      ring = this.add.graphics().setDepth(2);
      const rc = {fuel:0xffaa00, energy:0x00ffff, health:0x00ff44}[dz];
      ring.lineStyle(2, rc, 0.6);
      ring.strokeCircle(x,y,fy+5);
    }

    const bk = this.add.text(x,y+fy+8, ch?dz.toUpperCase():'', {fontSize:'9px',fontFamily:'Courier New',color:'#aaaaaa'}).setOrigin(0.5).setDepth(3);

    this.cm.push({x,y,fy,fe,ck,color,ch,dz,eh,gfx:g,ring,bk});
  }

  createTower(dn, bv){
    // Base sits exactly on dn surface, antenna points outward
    const fo = dn.x + Math.cos(bv) * dn.fy;
    const dc = dn.y + Math.sin(bv) * dn.fy;
    // Tip position (antenna extends outward from surface)
    const ew = 22;
    const tipX = dn.x + Math.cos(bv) * (dn.fy + ew);
    const tipY = dn.y + Math.sin(bv) * (dn.fy + ew);

    const g = this.add.graphics().setDepth(4);
    const beam = this.add.graphics().setDepth(3);
    const fj = this.add.graphics().setDepth(5);

    // Store interaction point slightly above surface
    const ix = dn.x + Math.cos(bv) * (dn.fy + 14);
    const iy = dn.y + Math.sin(bv) * (dn.fy + 14);

    const ea = {
      x: ix, y: iy,          // interaction/collision point
      fo, dc,           // where it meets the dn
      tipX, tipY,             // antenna tip
      bv,                  // outward bv from dn center
      dn, gfx:g, beam, timer:fj,
      active:false, activationProgress:0,
      tickPhase: Math.random()*Math.PI*2  // stagger blink timing
    };
    this.drawTowerGfx(ea);
    this.eg.push(ea);
  }

  drawTowerGfx(t){
    const g = t.gfx;
    g.clear();
    const {fo,dc,tipX,tipY,bv,active} = t;
    const dx = tipX-fo, dy = tipY-dc;
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = dx/len, ny = dy/len;   // outward normal
    const rx = -ny, ry = nx;          // tangent

    // Base plate (flat on dn surface)
    const bw = 7;
    g.fillStyle(0x445566, 1);
    g.fillTriangle(
      fo + rx*bw,  dc + ry*bw,
      fo - rx*bw,  dc - ry*bw,
      fo + nx*5,   dc + ny*5
    );
    g.lineStyle(1, 0x667788, 0.8);
    g.strokeTriangle(
      fo + rx*bw,  dc + ry*bw,
      fo - rx*bw,  dc - ry*bw,
      fo + nx*5,   dc + ny*5
    );

    // Main antenna shaft
    const midX = fo + nx*12, midY = dc + ny*12;
    g.lineStyle(2, active ? 0x00cc88 : 0x556677, 1);
    g.lineBetween(fo+nx*4, dc+ny*4, tipX, tipY);

    // Cross-bar (horizontal strut)
    const fw = 5;
    g.lineStyle(1, active ? 0x00aa66 : 0x445566, 0.9);
    g.lineBetween(midX+rx*fw, midY+ry*fw, midX-rx*fw, midY-ry*fw);

    // Second smaller cross-bar closer to tip
    const cb2X = fo+nx*18, cb2Y = dc+ny*18;
    const ap = 3;
    g.lineStyle(1, active ? 0x00aa66 : 0x445566, 0.7);
    g.lineBetween(cb2X+rx*ap, cb2Y+ry*ap, cb2X-rx*ap, cb2Y-ry*ap);

    if(!active){
      // Inactive: small dim bulb at tip
      g.fillStyle(0xffff00, 0.25);
      g.fillCircle(tipX, tipY, 3);
      g.lineStyle(1, 0x888800, 0.4);
      g.strokeCircle(tipX, tipY, 3);
    } else {
      // Active: gs glowing orb at tip
      g.fillStyle(0x00ffcc, 0.3);
      g.fillCircle(tipX, tipY, 8);
      g.fillStyle(0x00ffff, 0.9);
      g.fillCircle(tipX, tipY, 4);
      g.lineStyle(1, 0x00ffff, 0.5);
      g.strokeCircle(tipX, tipY, 10);
    }
  }

  drawFuelDepotGfx(g, x, y, ez){
    g.clear();

    const bl = [0xffaa00, 0xff7700, 0xff3300];
    const col = bl[Math.min(ez-1,2)];
    const sz = 6 + ez*2;

    g.fillStyle(col, 1);
    g.fillRect(x-sz, y-sz-2, sz*2, sz*2+2);

    g.fillStyle(0xffffff, 0.4);
    g.fillRect(x-sz*0.6, y-sz-6, sz*1.2, 5);
    g.lineStyle(1, 0x000000, 0.6);
    g.strokeRect(x-sz, y-sz-2, sz*2, sz*2+2);

    for(let i=0;i<ez;i++){
      g.lineStyle(2, 0xffffff, 0.35);
      g.lineBetween(x-sz+2, y-sz+4+i*5, x+sz-2, y-sz+4+i*5);
    }

    g.lineStyle(1+ez, col, 0.45);
    g.strokeCircle(x, y, sz+8+ez*2);

    if(ez>=3){
      g.lineStyle(1, 0xff8800, 0.7);
      g.strokeTriangle(x,y-sz-8, x-6,y-sz-2, x+6,y-sz-2);
    }
  }

  createFuelDepot(x, y, dn){
    const ez = Math.min(1 + Math.floor((this.dy-1)/2), 3);
    const g = this.add.graphics().setDepth(4);
    const cy = 25 + ez*15 + Phaser.Math.Between(0, 15);
    this.drawFuelDepotGfx(g, x, y, ez);
    const bk = this.add.text(x, y + 22 + ez*2, `⛽ +${cy}`, {fontSize:'8px', fontFamily:'Courier New', color:'#ffaa00'}).setOrigin(0.5).setDepth(5);
    this.dv = this.dv || [];
    this.dv.push({x, y, gfx:g, bk, cy, collected:false, ez});
  }

  createWreck(x,y,type){
    const gk = this.gy[type]||0;
    const fb = gk+1;
    const g = this.add.graphics().setDepth(4);

    const cn = {
      weapon:     {col:0xffdd00, col2:0xff8800},
      shield:     {col:0x44aaff, col2:0x0055ff},
      extraTank:  {col:0xff8800, col2:0xff4400},
      armor:{col:0x00ff88, col2:0x00aaff},
    };
    const {col,col2} = cn[type]||{col:0xffa500,col2:0xff5500};
    const sz = 7 + fb*2;

    g.lineStyle(2, col, 0.9);
    if(type==='weapon'){

      g.lineBetween(x-sz,y-sz,x+sz,y+sz);
      g.lineBetween(x+sz,y-sz,x-sz,y+sz);
      for(let i=0;i<fb;i++){
        g.fillStyle(col,0.7); g.fillCircle(x+(i-1)*6,y,3);
      }
    } else if(type==='extraTank'){

      for(let i=0;i<fb;i++){
        const ox = (i-(fb-1)/2)*9;
        g.fillStyle(col,0.7); g.fillRect(x+ox-3,y-sz+2,6,sz*2-4);
        g.fillStyle(col2,0.5); g.fillRect(x+ox-3,y-sz+2,6,4);
        g.lineStyle(1,col,0.9); g.strokeRect(x+ox-3,y-sz+2,6,sz*2-4);
      }
    } else {
      // HEALTH: wrench shape (mechanic key)
      g.fillStyle(col, 1);
      // Handle
      g.fillRect(x-2, y-sz+2, 4, sz*2-6);
      // Head circle (socket part)
      g.fillCircle(x, y-sz+4, 5+fb);
      g.fillStyle(0x000000, 0.5);
      g.fillCircle(x, y-sz+4, 2+fb*0.5);
      // Tail fork
      g.fillStyle(col, 1);
      g.fillRect(x-4, y+sz-8, 4, 6);
      g.fillRect(x, y+sz-8, 4, 6);
      // Outline
      g.lineStyle(1, col2, 0.8);
      g.strokeCircle(x, y-sz+4, 5+fb);
      g.strokeRect(x-2, y-sz+2, 4, sz*2-6);
      g.lineStyle(1,col,0.3); g.strokeCircle(x,y,sz+4);
    }

    g.lineStyle(1,col,0.3); g.strokeCircle(x,y,sz+10);
    const ei = gk>0 ? `${type.toUpperCase()} Lv${fb}` : type.toUpperCase();
    const bk = this.add.text(x,y-sz-14,ei,{fontSize:'8px',fontFamily:'Courier New',color:'#'+col.toString(16).padStart(6,'0')}).setOrigin(0.5).setDepth(5);
    this.fd.push({x,y,type,gfx:g,bk,collected:false});
  }

  createEnemy(x,y){

    // Type progression:
    // dy 1-2: type 0 (fighter, 1 shot)
    // dy 3-4: type 0 or type 1 (double-shot fighter)
    // dy 5-6: + type 2 (drone, rapid)
    // dy 7+:  + type 3 (bomber, triple spread)
    const ct = this.dy>=7 ? 3 : this.dy>=5 ? 2 : this.dy>=3 ? 1 : 0;
    const type = Phaser.Math.Between(0, ct);
    const g = this.add.graphics().setDepth(6);
    const hp = ([3,4,2,6][type]||3) + Math.ceil(this.dy*0.92);
    const spd = type===2 ? 55 : 40;
    this.drawEnemyShip(g,x,y,0,false,false,type);
    this.gx.push({
      x,y,
      vx:Phaser.Math.FloatBetween(-spd,spd),
      vy:Phaser.Math.FloatBetween(-spd,spd),
      gfx:g, hp, ca:0, state:'patrol', targetAngle:0,
      type,
    });
  }
  createPlanetTurret(dn, bv){
    const bx = dn.x + Math.cos(bv)*dn.fy;
    const by = dn.y + Math.sin(bv)*dn.fy;
    const g = this.add.graphics().setDepth(5);
    const hp = 2 + Math.floor(this.dy*0.5);
    const ah = { dn, bv, bx, by, gfx:g, hp, maxHp:hp, ca: Math.random()*3, af:0 };
    this.drawPlanetTurretGfx(ah, 0);
    this.gt.push(ah);
  }

  drawPlanetTurretGfx(t, af){
    const g = t.gfx;
    g.clear();
    const {bx,by,dn,bv} = t;
    const nx = Math.cos(bv), ny = Math.sin(bv);
    const rx = -ny, ry = nx;
    const bm = t.hp/t.maxHp;
    const bf = bm>0.6 ? 0xcc2200 : bm>0.3 ? 0xff6600 : 0xff9900;
    // Base pad
    g.fillStyle(0x331100,1);
    g.fillTriangle(bx+rx*8,by+ry*8, bx-rx*8,by-ry*8, bx+nx*6,by+ny*6);
    g.lineStyle(1,bf,0.8);
    g.strokeTriangle(bx+rx*8,by+ry*8, bx-rx*8,by-ry*8, bx+nx*6,by+ny*6);
    // Turret body (rotates to aim)
    const tx = bx+nx*8, ty = by+ny*8;
    g.fillStyle(bf,1);
    g.fillCircle(tx,ty,7);
    g.lineStyle(1,0xff4400,0.6);
    g.strokeCircle(tx,ty,7);
    // Barrel (points toward aim bv)
    const ej = 12;
    g.lineStyle(3, bf, 1);
    g.lineBetween(tx, ty, tx+Math.cos(af)*ej, ty+Math.sin(af)*ej);
    g.lineStyle(1,0xff8800,0.5);
    g.lineBetween(tx, ty, tx+Math.cos(af)*ej, ty+Math.sin(af)*ej);
    // HP bar
    const bw=20, bh=3;
    g.fillStyle(0x330000,1); g.fillRect(tx-bw/2, ty-14, bw, bh);
    g.fillStyle(bf,1);  g.fillRect(tx-bw/2, ty-14, bw*bm, bh);
    g.lineStyle(1,0xff2200,0.5); g.strokeRect(tx-bw/2,ty-14,bw,bh);
  }

  updatePlanetTurrets(dt){
    for(let i=this.gt.length-1;i>=0;i--){
      const t = this.gt[i];
      const tx = t.bx + Math.cos(t.bv)*8;
      const ty = t.by + Math.sin(t.bv)*8;
      const hb = gr(tx,ty,this.ship.x,this.ship.y);
      // Smoothly rotate barrel toward ship
      let da = hb - t.af;
      while(da> Math.PI) da-=Math.PI*2;
      while(da<-Math.PI) da+=Math.PI*2;
      t.af += da * Math.min(1, dt*2.5);
      this.drawPlanetTurretGfx(t, t.af);
      // Fire at player if in range and has line of sight
      const ds = dist(tx,ty,this.ship.x,this.ship.y);
      const di = 2.5 - Math.min(1.5, this.dy*0.15);
      t.ca -= dt;
      if(t.ca<=0 && ds<280 && !this.ship.landed &&
         dk(tx,ty,this.ship.x,this.ship.y,this.cm)){
        t.ca = di;
        const spd = 200;
        const g2 = this.add.graphics().setDepth(8);
        g2.fillStyle(0xff2200,1); g2.fillCircle(0,0,4);
        g2.fillStyle(0xff8800,0.5); g2.fillCircle(0,0,7);
        g2.x=tx; g2.y=ty;
        this.co.push({x:tx,y:ty,vx:Math.cos(t.af)*spd,vy:Math.sin(t.af)*spd,gfx:g2,life:3});
      }
    }
  }

  drawEnemyShip(g,x,y,bv,eb,cd,type=0){
    g.clear();

    if(eb){
      const bg = cd ? 0xff2200 : 0xff9900;
      const ef = 0.5+0.5*Math.sin(this.time.now/150);
      g.fillStyle(bg, 0.6+0.4*ef);
      g.fillTriangle(x,y-22, x-5,y-13, x+5,y-13);
      g.fillStyle(0xffffff,1);
      g.fillRect(x-1,y-20,2,5);
      g.fillRect(x-1,y-13,2,2);
    }
    g.save();
    g.translateCanvas(x,y);
    g.rotateCanvas(bv);

    if(type===0){
      // FIGHTER: red triangle — 1 shot
      const bc = eb ? 0xff1100 : 0xff3333;
      g.fillStyle(bc,1);
      g.fillTriangle(14,0,-8,-7,-8,7);
      g.lineStyle(1,0xff8888,1);
      g.strokeTriangle(14,0,-8,-7,-8,7);
      g.fillStyle(eb?0xff8800:0xff6600,0.8);
      g.fillCircle(0,0,4);
    } else if(type===1){
      // DOUBLE FIGHTER: orange twin-hull — 2 shots spread
      const bc = eb ? 0xff6600 : 0xff8800;
      g.fillStyle(bc,1);
      g.fillTriangle(13,-4,-7,-9,-7,0);
      g.fillTriangle(13, 4,-7, 0,-7,9);
      g.lineStyle(1,0xffcc44,0.9);
      g.strokeTriangle(13,-4,-7,-9,-7,0);
      g.strokeTriangle(13, 4,-7, 0,-7,9);
      g.fillStyle(0xffff88,0.7); g.fillRect(10,-5,5,2); g.fillRect(10,3,5,2);
    } else if(type===2){
      // DRONE: cyan circle — rapid single
      const bc = eb ? 0x00ffcc : 0x00aaaa;
      g.fillStyle(bc,0.9); g.fillCircle(0,0,9);
      g.lineStyle(2,0x00ffff,0.8); g.strokeCircle(0,0,9);
      g.fillStyle(0x000022,0.8); g.fillCircle(0,0,4);
      g.lineStyle(2,bc,0.7);
      g.lineBetween(-12,0,-9,0); g.lineBetween(9,0,12,0);
      g.lineBetween(0,-12,0,-9); g.lineBetween(0,9,0,12);
    } else {
      // BOMBER (type 3): purple diamond — triple spread, slow+tanky
      const bc = eb ? 0xcc00ff : 0x9900cc;
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
  }

  findSafeSpawn(){

    let bx = W/2, by = H/2, bestScore = -1;
    for(let cs=0; cs<300; cs++){
      const tx = Phaser.Math.Between(60, W-60);
      const ty = Phaser.Math.Between(60, H-60);

      let dt = 9999;
      for(const p of this.cm){
        const d = dist(tx,ty,p.x,p.y) - p.fy;
        if(d < dt) dt = d;
      }

      let az = 9999;
      for(const e of (this.gx||[])){
        const d = dist(tx,ty,e.x,e.y);
        if(d < az) az = d;
      }

      if(dt < 70) continue;

      const cj = Math.min(dt, 300) + Math.min(az, 300)*0.8;
      if(cj > bestScore){
        bestScore = cj;
        bx = tx; by = ty;

        if(dt > 120 && az > 200) break;
      }
    }
    return {x: bx, y: by};
  }

  createShip(){
    this.ship = {
      x: W/2, y: H/2,
      vx: 0, vy: 0,
      bv: 0,
      fuel: 100,
      energy: 100,
      health: 100,
      landed: false,
      landedPlanet: null,
      dx: false
    };
    this.gd = this.add.graphics().setDepth(10);
    this.db = this.add.graphics().setDepth(9);

    const bd = this.findSafeSpawn();
    this.ship.x = bd.x;
    this.ship.y = bd.y;
    this.drawShip();
  }

  drawShip(){
    const {x,y,bv,health} = this.ship;
    const sg = this.gd;
    sg.clear();
    sg.save();
    sg.translateCanvas(x,y);
    sg.rotateCanvas(bv);

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


    const wlv = this.gy.weapon||0;
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
    const tg = this.db;
    tg.clear();
    if(!this.ship.dx || this.ship.landed || this.ship.fuel<=0) return;
    const {x,y,bv} = this.ship;
    tg.save();
    tg.translateCanvas(x,y);
    tg.rotateCanvas(bv);
    tg.fillStyle(0xff6600, Phaser.Math.FloatBetween(0.5,1));
    tg.fillTriangle(-8,0,-18,-4,-18,4);
    tg.fillStyle(0xffff00,0.6);
    tg.fillTriangle(-8,0,-14,-2,-14,2);
    tg.restore();
  }

  createInput(){
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fire: Phaser.Input.Keyboard.KeyCodes.F,
      ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });
    this.ca = 0;

    this.input.on('pointerdown', ()=>{ this.ds = true; });
    this.input.on('pointerup',   ()=>{ this.ds = false; });
  }

  createUI(){
    if(this.bq) this.bq.destroy();
    if(this.dl) this.dl.forEach(t=>t.destroy());
    if(this.fl) this.fl.destroy();
    if(this.dr) this.dr.destroy();
    if(this.dp) Object.values(this.dp).forEach(ic=>{ ic.ico.destroy(); ic.lbl.destroy(); if(ic.cf) ic.cf.destroy(); });
    if(this.ak){ this.ak.forEach(l=>l.destroy()); this.ak=null; }
    if(this.et){ this.et.forEach(l=>l.destroy()); this.et=null; }

    this.bq = this.add.graphics().setDepth(20);
    this.dl = [];

    // Top-left: cj, dy, eg
    this.cw  = this.add.text(10, 10, 'SCORE: 0',   {fontSize:'12px',fontFamily:'Courier New',color:'#aaddff'}).setDepth(20);
    this.bt = this.add.text(10, 26, 'SECTOR: 1',  {fontSize:'12px',fontFamily:'Courier New',color:'#aaddff'}).setDepth(20);
    this.fp = this.add.text(10, 42, 'TORRES: 0/0',{fontSize:'12px',fontFamily:'Courier New',color:'#ffff88'}).setDepth(20);

    // Bottom-center: messages
    this.fa = this.add.text(W/2, H-22, '', {fontSize:'13px',fontFamily:'Courier New',color:'#ffff00',stroke:'#333300',strokeThickness:2}).setOrigin(0.5).setDepth(20);

    this.dl = [this.cw, this.bt, this.fp, this.fa];

    // Bottom-right: upgrade modules panel (weapon + extraTank only)
    this.fl = this.add.graphics().setDepth(20);
    this.dp = {};
    const aa = [
      { key:'weapon',    icon:'⚡', bk:'ARMA',   color:'#ffdd00' },
      { key:'extraTank', icon:'⛽', bk:'TANQUE', color:'#ff8800' },
    ];
    this.ff = aa;

    // Panel gj
    this.dr = this.add.text(W-8, H-86, 'MÓDULOS', {
      fontSize:'8px', fontFamily:'Courier New', color:'#334455', letterSpacing:2
    }).setOrigin(1, 0.5).setDepth(22);

    aa.forEach((u, i) => {
      const ux = W - 90 + i * 46;  // two slots side by side, bottom-right
      const uy = H - 60;
      const ico   = this.add.text(ux, uy,    u.icon,  {fontSize:'18px'}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      const lbl   = this.add.text(ux, uy+16, u.bk, {fontSize:'7px',fontFamily:'Courier New',color:u.color}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      const cf = this.add.text(ux, uy-14, '○○○',   {fontSize:'8px',fontFamily:'Courier New',color:u.color}).setOrigin(0.5).setDepth(22).setAlpha(0.2);
      this.dp[u.key] = {ico, lbl, cf, color:u.color, ux, uy};
    });
  }

  updateUI(){
    const s = this.ship;
    const g = this.bq;
    g.clear();

    // ── Bottom-left resource bars ──────────────────────────────
    // Layout: icon | bar | value, stacked vertically
    const bx = 10, bw = 100, bh = 7, gap = 14;
    const dw = 100 + (this.gy.extraTank||0)*15;

    const bars = [
      { bk:'FUEL', val:s.fuel,   max:dw, fill:0xffaa00, bg:0x332200, border:0x664400 },
      { bk:'ENRG', val:s.energy, max:100,     fill:0x00ddff, bg:0x002233, border:0x005566 },
      { bk:'VIDA', val:s.health, max:100,
        fill: s.health>50 ? 0x00ff44 : s.health>25 ? 0xffaa00 : 0xff3300,
        bg:0x220000, border:0x550000 },
    ];

    // Semi-transparent backing for bar area
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(bx-4, H-66, bw+70, 58, 4);

    bars.forEach((b, i) => {
      const by = H - 58 + i * gap;
      const br = Math.min(1, b.val / b.max);
      g.fillStyle(b.bg, 1);    g.fillRect(bx+28, by, bw, bh);
      g.fillStyle(b.fill, 1);  g.fillRect(bx+28, by, bw*br, bh);
      g.lineStyle(1, b.border, 1); g.strokeRect(bx+28, by, bw, bh);
    });

    this.cw.setText(`SCORE: ${this.cj}`);
    this.bt.setText(`SECTOR: ${this.dy}`);
    this.fp.setText(`TORRES: ${this.an}/${this.eg.length}`);

    if(!this.ak){
      this.ak = [
        this.add.text(bx, H-59, 'FUEL', {fontSize:'7px',fontFamily:'Courier New',color:'#ffaa00'}).setDepth(21),
        this.add.text(bx, H-59+gap, 'ENRG', {fontSize:'7px',fontFamily:'Courier New',color:'#00ddff'}).setDepth(21),
        this.add.text(bx, H-59+gap*2, 'VIDA', {fontSize:'7px',fontFamily:'Courier New',color:'#00ff44'}).setDepth(21),
      ];
      // numeric values as dynamic texts
      this.et = [
        this.add.text(bx+132, H-59,       '', {fontSize:'7px',fontFamily:'Courier New',color:'#ffaa00'}).setDepth(21),
        this.add.text(bx+132, H-59+gap,   '', {fontSize:'7px',fontFamily:'Courier New',color:'#00ddff'}).setDepth(21),
        this.add.text(bx+132, H-59+gap*2, '', {fontSize:'7px',fontFamily:'Courier New',color:'#00ff44'}).setDepth(21),
      ];
    }
    // Update numeric values
    if(this.et){
      this.et[0].setText(Math.ceil(s.fuel)+'/'+dw);
      this.et[1].setText(Math.ceil(s.energy)+'/100');
      this.et[2].setText(Math.ceil(s.health)+'/100');
    }

    // ── Bottom-right upgrade panel ─────────────────────────────
    const pg = this.fl;
    pg.clear();
    const df = (this.gy.weapon||0)+(this.gy.extraTank||0) > 0;

    // Panel backing
    pg.fillStyle(0x000000, 0.45);
    pg.fillRoundedRect(W-110, H-80, 104, 72, 4);
    pg.lineStyle(1, 0x223344, 0.8);
    pg.strokeRoundedRect(W-110, H-80, 104, 72, 4);

    this.ff.forEach(u => {
      const lvl = this.gy[u.key] || 0;
      const ic  = this.dp[u.key];
      const alpha = lvl > 0 ? 1 : 0.22;
      ic.ico.setAlpha(alpha);
      ic.lbl.setAlpha(alpha);

      // Stars: filled vs bj
      const bp = '●'.repeat(lvl) + '○'.repeat(3-lvl);
      ic.cf.setText(bp).setAlpha(alpha);

      const hx = parseInt(u.color.replace('#','0x'));
      if(lvl > 0){
        pg.lineStyle(1, hx, 0.5);
        pg.strokeRoundedRect(ic.ux-20, ic.uy-18, 40, 42, 4);
      }
    });
  }

  startTutorial(){
    if(this.dy!==1) return;
    const msgs = [
      { t:1000,  txt:'⬆ USA WASD / FLECHAS para propulsar y rotar la nave',  dur:3500 },
      { t:5000,  txt:'📡 Aterriza cerca de las antenas para activarlas (2 seg)', dur:3800 },
      { t:9500,  txt:'⚡ Activa TODAS las antenas del dy',                dur:3200 },
      { t:13500, txt:'🌀 Luego aparece un AGUJERO NEGRO — ¡entra para avanzar!', dur:3800 },
      { t:18000, txt:'🔧 Recoge restos flotantes para mejorar tu nave',        dur:3200 },
      { t:22000, txt:'⛽ Aterriza en planetas para recargar combustible y energía', dur:3500 },
    ];
    msgs.forEach(m=>{
      this.time.delayedCall(m.t, ()=>{
        if(this.dy===1) this.showMsg(m.txt, m.dur);
      });
    });
  }

  showMsg(txt, duration=2000){
    this.fa.setText(txt);
    if(this.fv) clearTimeout(this.fv);
    this.fv = setTimeout(()=>this.fa.setText(''), duration);
  }

  showUpgradePopup(type, ez=1){
    const ed = {weapon:'ARMAMENTO', extraTank:'TANQUE EXTRA', health:'SALUD'};
    const cf = '★'.repeat(ez)+'☆'.repeat(3-ez);
    this.showMsg(`✦ ${ed[type]||type}  ${cf}  ADQUIRIDO`, 2500);
    this.cj += 50;
  }

  update(time, bn){
    if(this.de) return;
    const dt = bn/1000;
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
    this.ca = Math.max(0, this.ca-dt);
  }

  updateShip(dt){
    const s = this.ship;
    const k = this.keys;
    if(s.health<=0){
      this.scene.start('GameOver',{cj:this.cj,dy:this.dy,al:'hull'});
      return;
    }
    if(s.fuel<=0){
      if(!this.aw) this.aw=0;
      this.aw+=dt;
      this.fa.setText('⚠ SIN COMBUSTIBLE — A LA DERIVA (' + Math.ceil(3-this.aw) + 's)');
      this.fa.setColor('#ff4400');
      if(this.aw>=3){ this.scene.start('GameOver',{cj:this.cj,dy:this.dy,al:'fuel'}); return; }
    } else {
      if(this.aw){ this.aw=0; this.fa.setColor('#ffff00'); }
    }

    const gu = k.up.isDown||k.w.isDown;
    const ep = k.left.isDown||k.a.isDown;
    const cl = k.right.isDown||k.d.isDown;
    const cc = k.space.isDown && !s.landed;

    if(s.landed && gu && s.fuel>0){
      const p = s.landedPlanet;
      s.landed = false;
      s.landedPlanet = null;
      s.vx = 0;
      s.vy = 0;

      if(p){
        const ang = gr(p.x, p.y, s.x, s.y);
        s.x = p.x + Math.cos(ang) * (p.fy + 20);
        s.y = p.y + Math.sin(ang) * (p.fy + 20);

        s.bv = ang;
      }
      this.bi = 0;
      this.fr = null;
    }

    const dx = gu && !s.landed;
    s.dx = dx;

    if(!s.landed){
      if(ep) s.bv -= dt*2.5;
      if(cl) s.bv += dt*2.5;
    }

    const cp = 180;

    if(dx && s.fuel>0){
      s.vx += Math.cos(s.bv)*cp*dt;
      s.vy += Math.sin(s.bv)*cp*dt;
      s.fuel = Math.max(0, s.fuel - dt*8);
    }

    if(cc){
      s.vx *= (1 - dt*3);
      s.vy *= (1 - dt*3);
      s.fuel = Math.max(0, s.fuel - dt*4);
    }

    if(!s.landed){
      for(const p of this.cm){
        const d = dist(s.x,s.y,p.x,p.y);
        if(d<p.ck){
          const ci = p.fe * (1 - d/p.ck);
          const bv = gr(s.x,s.y,p.x,p.y);
          s.vx += Math.cos(bv)*ci*dt;
          s.vy += Math.sin(bv)*ci*dt;
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

    let gv = false;
    for(const p of this.cm){
      const d = dist(s.x,s.y,p.x,p.y);
      const ax = p.fy + 12;
      if(d<=ax+5){
        const gl = Math.sqrt(s.vx**2+s.vy**2);
        if(gl>80){

          let cdmg = (gl-80)*0.3 * dt * 60;
          s.health = Math.max(0, s.health - cdmg);
          const dmg = cdmg;

          const norm = gr(p.x,p.y,s.x,s.y);
          s.vx = Math.cos(norm)*gl*0.3;
          s.vy = Math.sin(norm)*gl*0.3;
        } else {

          gv = true;
          s.landed = true;
          s.landedPlanet = p;
          s.vx = 0; s.vy = 0;

          const ang = gr(p.x,p.y,s.x,s.y);
          s.x = p.x + Math.cos(ang)*ax;
          s.y = p.y + Math.sin(ang)*ax;
          s.bv = ang;

          if(p.ch && p.eh>0 && dt>0){
            const by = Math.min(p.eh, dt*15);
            p.eh -= by;
            const bo = 100 + this.gy.extraTank*15;
            if(p.dz==='fuel') s.fuel = Math.min(bo, s.fuel+by);
            if(p.dz==='energy') s.energy = Math.min(100, s.energy+by);
            if(p.dz==='health') s.health = Math.min(100, s.health+by);
            if(p.eh<=0){ p.ring&&p.ring.clear(); p.bk.setText(''); }
          }

          if(this.dv){
            for(const fd of this.dv){
              if(!fd.collected && dist(s.x,s.y,fd.x,fd.y)<28){
                const dw = 100 + this.gy.extraTank*15;
                s.fuel = Math.min(dw, s.fuel + fd.cy);
                fd.collected = true;
                fd.gfx.clear();
                fd.bk.setText('');
                this.showMsg(`+${fd.cy} COMBUSTIBLE`, 1500);
                this.cj += 10;
              }
            }
          }

          for(const w of this.fd){
            if(!w.collected && dist(s.x,s.y,w.x,w.y)<30){
              if(w.type==='health'){
                // consumable: just restore HP
                this.ship.health = Math.min(100, this.ship.health + 30);
                this.showMsg('🔧 +30 SALUD RESTAURADA', 2000);
                this.cj += 30;
              } else {
                this.gy[w.type] = Math.min(3, (this.gy[w.type]||0)+1);
                this.showUpgradePopup(w.type, this.gy[w.type]);
                this.cj += 50;
              }
              w.collected = true;
              w.gfx.clear(); w.bk.destroy();
            }
          }
        }
        break;
      }
    }
    if(!gv && s.landed){
      s.landed = false;
      s.landedPlanet = null;
      this.bi = 0;
      this.fr = null;
    }

    if(this.bh && this.ad){
      const pd = dist(s.x,s.y,this.fu,this.bw);
      if(pd<35){
        this.nextSector();
        return;
      }
    }

    const wlvl = this.gy.weapon;
    const di = wlvl>=3 ? 0.12 : wlvl>=2 ? 0.20 : 0.30;
    const ag = wlvl>=3 ? 4 : wlvl>=2 ? 3 : 2;
    if(wlvl>0 && (k.fire.isDown||k.ctrl.isDown||k.shift.isDown||this.ds) && this.ca<=0 && !s.landed){
      if(s.energy>=ag){
        s.energy = Math.max(0, s.energy - ag);
        this.fireBullet();
        if(wlvl>=2) this.fireBullet(0.18);
        if(wlvl>=3) this.fireBullet(-0.18);
        this.ca = di;
      } else {

        if(!this.fn || this.fn<=0){
          this.showMsg('⚡ SIN ENERGÍA PARA DISPARAR', 1200);
          this.fn = 1.5;
        }
      }
    }
    if(this.fn>0) this.fn -= dt;
  }

  fireBullet(spread=0){
    const s = this.ship;
    const wlvl = this.gy.weapon;
    const gl = 320 + wlvl*30;
    const a = s.bv + spread;
    const g = this.add.graphics().setDepth(8);
    const ee = wlvl>=3 ? 0xff4400 : wlvl>=2 ? 0xff9900 : 0xffff00;
    const ec  = wlvl>=3 ? 4 : wlvl>=2 ? 3.5 : 3;
    g.fillStyle(ee,1); g.fillCircle(0,0,ec);
    g.fillStyle(0xffffff,0.4); g.fillCircle(0,0,ec*0.5);
    g.x = s.x; g.y = s.y;
    const dmg = wlvl>=3 ? 1.5 : wlvl>=2 ? 1 : 0.5;
    this.da.push({ x:s.x, y:s.y, vx:Math.cos(a)*gl+s.vx, vy:Math.sin(a)*gl+s.vy, gfx:g, life:2, dmg });
  }

  updateBullets(dt){
    for(let i=this.da.length-1;i>=0;i--){
      const b = this.da[i];
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      b.gfx.x = b.x; b.gfx.y = b.y;
      if(b.life<=0 || b.x<0||b.x>W||b.y<0||b.y>H){
        b.gfx.destroy(); this.da.splice(i,1); continue;
      }

      let ex = false;
      for(const p of this.cm){
        if(dist(b.x,b.y,p.x,p.y)<p.fy+2){
          b.gfx.destroy(); this.da.splice(i,1);
          ex = true; break;
        }
      }
      if(ex) continue;

      for(let j=this.gx.length-1;j>=0;j--){
        const e = this.gx[j];
        if(dist(b.x,b.y,e.x,e.y)<14){
          e.hp -= b.dmg||1;

          e.eb = true;
          e.alertTimer = 6 + Math.random()*4;
          e.lastKnownX = this.ship.x;
          e.lastKnownY = this.ship.y;
          b.gfx.destroy(); this.da.splice(i,1);
          if(e.hp<=0){
            e.gfx.destroy(); this.gx.splice(j,1);
            this.cj += 100;
            this.showMsg('+100 ENEMIGO DESTRUIDO!');
          }
          break;
        }
      }
      // Check bullet vs dn turrets
      if(!this.da[i]) continue;
      for(let j=this.gt.length-1;j>=0;j--){
        const t = this.gt[j];
        const tx = t.bx+Math.cos(t.bv)*8, ty = t.by+Math.sin(t.bv)*8;
        if(dist(b.x,b.y,tx,ty)<12){
          t.hp -= b.dmg||1;
          b.gfx.destroy(); this.da.splice(i,1);
          if(t.hp<=0){
            t.gfx.destroy(); this.gt.splice(j,1);
            this.cj += 75;
            this.showMsg("+75 TORRETA DESTRUIDA!");
          }
          break;
        }
      }
    }

    for(let i=this.co.length-1;i>=0;i--){
      const b = this.co[i];
      b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
      b.gfx.x = b.x; b.gfx.y = b.y;
      if(b.life<=0 || b.x<0||b.x>W||b.y<0||b.y>H){
        b.gfx.destroy(); this.co.splice(i,1); continue;
      }

      let ce=false;
      for(const p of this.cm){
        if(dist(b.x,b.y,p.x,p.y)<p.fy+2){
          b.gfx.destroy(); this.co.splice(i,1);
          ce=true; break;
        }
      }
      if(ce) continue;
      if(dist(b.x,b.y,this.ship.x,this.ship.y)<12){
        let dmg = 10;
        this.ship.health = Math.max(0, this.ship.health-dmg);
        b.gfx.destroy(); this.co.splice(i,1);
      }
    }
  }

  drawAsteroid(a){
    a.gfx.clear();
    a.gfx.x = a.x; a.gfx.y = a.y;
    const r = a.fy;

    const pts = 7 + Math.floor(r/3);
    const hd = [];
    for(let i=0;i<pts;i++){
      const ang = (i/pts)*Math.PI*2 + a.rot;
      const jag = 0.65 + 0.35*Math.abs(Math.sin(i*2.3+a.rot*0.5));
      hd.push({ x: Math.cos(ang)*r*jag, y: Math.sin(ang)*r*jag });
    }

    const grey = 0x556677;
    a.gfx.fillStyle(grey, 1);
    a.gfx.beginPath();
    a.gfx.moveTo(hd[0].x, hd[0].y);
    for(let i=1;i<hd.length;i++) a.gfx.lineTo(hd[i].x, hd[i].y);
    a.gfx.closePath();
    a.gfx.fillPath();

    a.gfx.lineStyle(1, 0x8899aa, 0.7);
    a.gfx.beginPath();
    a.gfx.moveTo(hd[0].x, hd[0].y);
    for(let i=1;i<hd.length;i++) a.gfx.lineTo(hd[i].x, hd[i].y);
    a.gfx.closePath();
    a.gfx.strokePath();

    a.gfx.lineStyle(1, 0x334455, 0.5);
    a.gfx.lineBetween(-r*0.3, -r*0.1, r*0.1, r*0.3);
  }

  spawnAsteroid(){
    const s = this.dy;
    // Spawn from a random edge of the screen
    let ax, ay;
    const edge = Math.floor(Math.random()*4);
    if(edge===0){ ax=Phaser.Math.Between(0,W); ay=-20; }
    else if(edge===1){ ax=W+20; ay=Phaser.Math.Between(0,H); }
    else if(edge===2){ ax=Phaser.Math.Between(0,W); ay=H+20; }
    else { ax=-20; ay=Phaser.Math.Between(0,H); }

    const minR = s>=5 ? 6 : 4;
    const maxR = s>=7 ? 22 : s>=4 ? 16 : 10;
    const fy = Phaser.Math.Between(minR, maxR);
    const gl  = Phaser.Math.FloatBetween(14, 32+s*2.76);
    // Aim roughly toward screen center with some spread
    const ge = gr(ax, ay, W/2+Phaser.Math.Between(-150,150), H/2+Phaser.Math.Between(-150,150));
    const spin = Phaser.Math.FloatBetween(-1.5,1.5);
    const g = this.add.graphics().setDepth(3);
    const ast = {x:ax, y:ay, vx:Math.cos(ge)*gl, vy:Math.sin(ge)*gl, fy, spin, rot:0, gfx:g, hp:Math.ceil(fy/4)};
    this.drawAsteroid(ast);
    this.ft.push(ast);
  }

  updateAsteroids(dt){
    const s = this.dy;
    const at = 3 + Math.floor(s*1.1);

    // Respawn timer — trickle in new ft to replace cq ones
    this.dm = (this.dm||0) - dt;
    if(this.dm<=0 && this.ft.length < at){
      this.spawnAsteroid();
      this.dm = 2.5; // new one every 2.5s when below target
    }

    for(let i=this.ft.length-1;i>=0;i--){
      const a = this.ft[i];
      let cq = false;

      for(const p of this.cm){
        const dp = dist(a.x,a.y,p.x,p.y);
        // Gravity pull
        if(dp < p.ck){
          const ag = gr(a.x,a.y,p.x,p.y);
          const ci = p.fe*(1-dp/p.ck);
          a.vx += Math.cos(ag)*ci*0.3*dt;
          a.vy += Math.sin(ag)*ci*0.3*dt;
        }
        // Crash into dn — destroy asteroid
        if(dp < p.fy + a.fy){
          a.gfx.destroy();
          this.ft.splice(i,1);
          cq = true;
          break;
        }
      }
      if(cq) continue;

      const aspd = Math.sqrt(a.vx**2+a.vy**2);
      const gw = 80;
      if(aspd>gw){ a.vx=(a.vx/aspd)*gw; a.vy=(a.vy/aspd)*gw; }

      a.rot += a.spin*dt;
      a.x += a.vx*dt; a.y += a.vy*dt;

      if(a.x<-30) a.x=W+30; else if(a.x>W+30) a.x=-30;
      if(a.y<-30) a.y=H+30; else if(a.y>H+30) a.y=-30;
      this.drawAsteroid(a);

      const ds = dist(a.x,a.y,this.ship.x,this.ship.y);
      if(ds < a.fy+10 && !this.ship.landed){
        const bu = Math.sqrt((a.vx-this.ship.vx)**2+(a.vy-this.ship.vy)**2);
        if(bu>20){
          let dmg = bu*0.012*a.fy*0.12;
          this.ship.health = Math.max(0, this.ship.health-dmg);

          const ba = gr(a.x,a.y,this.ship.x,this.ship.y);
          this.ship.vx += Math.cos(ba)*bu*0.4;
          this.ship.vy += Math.sin(ba)*bu*0.4;
        }

        a.hp -= 0.5;
      }

      for(let bi=this.da.length-1;bi>=0;bi--){
        const b = this.da[bi];
        if(dist(b.x,b.y,a.x,a.y)<a.fy+3){
          a.hp -= b.dmg||1;
          b.gfx.destroy(); this.da.splice(bi,1);
          if(a.hp<=0){

            if(a.fy>8){
              for(let si=0;si<2;si++){
                const sa = Math.random()*Math.PI*2;
                const sg2 = this.add.graphics().setDepth(3);
                const frag = {
                  x:a.x+Math.cos(sa)*a.fy*0.5,
                  y:a.y+Math.sin(sa)*a.fy*0.5,
                  vx:a.vx+Math.cos(sa)*25, vy:a.vy+Math.sin(sa)*25,
                  fy:Math.floor(a.fy*0.55),
                  spin:Phaser.Math.FloatBetween(-2,2), rot:0,
                  gfx:sg2, hp:1
                };
                this.drawAsteroid(frag);
                this.ft.push(frag);
              }
            }
            a.gfx.destroy();
            this.ft.splice(i,1);
            this.cj += Math.ceil(a.fy)*3;
            break;
          }
        }
      }
    }
  }

  updateEnemies(dt, time){
    const cb = 82 + this.dy*2.76;

    for(const e of this.gx){
      const ds = dist(e.x,e.y,this.ship.x,this.ship.y);

      const cd = dk(e.x,e.y,this.ship.x,this.ship.y,this.cm);

      if(cd && ds<220){
        e.eb = true;
        e.alertTimer = Math.max(e.alertTimer||0, 0.5);
        e.lastKnownX = this.ship.x;
        e.lastKnownY = this.ship.y;
      }
      if(e.alertTimer>0){
        e.alertTimer -= dt;
        if(e.alertTimer<=0){
          e.eb = false;
        }
      }

      let es=0, avoidY=0;
      for(const p of this.cm){
        const dp = dist(e.x,e.y,p.x,p.y);
        const av = p.fy + 55;
        if(dp < av){
          const hc = (1 - dp/av) * 320;
          const ang = gr(p.x,p.y,e.x,e.y);
          es += Math.cos(ang)*hc;
          avoidY += Math.sin(ang)*hc;
        }
      }

      let dh=0, desiredVy=0;
      if(e.eb){

        const gp = cd ? this.ship.x : e.lastKnownX;
        const au = cd ? this.ship.y : e.lastKnownY;
        const a = gr(e.x,e.y,gp,au);
        const eo = dist(e.x,e.y,gp,au);
        const go = 72 + this.dy*1.84;
        dh = Math.cos(a)*go;
        desiredVy = Math.sin(a)*go;
        e.targetAngle = a;
        e.state = 'chase';

        if(cd && ds<190){
          e.ca -= dt;

          const el = e.type===3 ? 3.0 : e.type===2 ? 0.6 : e.type===1 ? 1.5 : 1.8 + Math.random()*1.0;
          if(e.ca<=0){
            e.ca = el;
            const fx = gr(e.x,e.y,this.ship.x,this.ship.y);
            const bspd = 195 + this.dy*4.6;
            if(e.type===3){
              for(let sp=-1;sp<=1;sp++){
                const g2=this.add.graphics().setDepth(8);
                g2.fillStyle(0xcc44ff,1); g2.fillCircle(0,0,5);
                g2.x=e.x; g2.y=e.y;
                const sa=fx+sp*0.28;
                this.co.push({x:e.x,y:e.y,vx:Math.cos(sa)*(bspd*0.65),vy:Math.sin(sa)*(bspd*0.65),gfx:g2,life:3});
              }
            } else if(e.type===1){
              for(let sp=-1;sp<=1;sp+=2){
                const g2=this.add.graphics().setDepth(8);
                g2.fillStyle(0xff8800,1); g2.fillCircle(0,0,3);
                g2.x=e.x; g2.y=e.y;
                const sa=fx+sp*0.12;
                this.co.push({x:e.x,y:e.y,vx:Math.cos(sa)*bspd,vy:Math.sin(sa)*bspd,gfx:g2,life:2.2});
              }
            } else if(e.type===2){
              const g2=this.add.graphics().setDepth(8);
              g2.fillStyle(0x00ffcc,1); g2.fillCircle(0,0,2);
              g2.x=e.x; g2.y=e.y;
              this.co.push({x:e.x,y:e.y,vx:Math.cos(fx)*(bspd*1.3),vy:Math.sin(fx)*(bspd*1.3),gfx:g2,life:1.8});
            } else {
              const g2=this.add.graphics().setDepth(8);
              g2.fillStyle(0xff4400,1); g2.fillCircle(0,0,3);
              g2.x=e.x; g2.y=e.y;
              this.co.push({x:e.x,y:e.y,vx:Math.cos(fx)*bspd,vy:Math.sin(fx)*bspd,gfx:g2,life:2.5});
            }
          }
        }

        if(!cd && eo < 25){
          e.eb = false;
          e.alertTimer = 0;
        }
      } else {
        e.state = 'patrol';
        if(!e.wanderAngle || Math.random()<dt*0.8) e.wanderAngle = Math.random()*Math.PI*2;
        dh = Math.cos(e.wanderAngle)*35;
        desiredVy = Math.sin(e.wanderAngle)*35;
        e.targetAngle = e.wanderAngle;
      }

      e.vx = lerp(e.vx, dh + es, dt*2.5);
      e.vy = lerp(e.vy, desiredVy + avoidY, dt*2.5);

      for(const p of this.cm){
        const dp = dist(e.x,e.y,p.x,p.y);
        if(dp < p.fy + 14){
          const na = gr(p.x,p.y,e.x,e.y);
          e.vx = Math.cos(na)*60;
          e.vy = Math.sin(na)*60;
          e.x = p.x + Math.cos(na)*(p.fy+15);
          e.y = p.y + Math.sin(na)*(p.fy+15);
        }
      }

      const spd = Math.sqrt(e.vx**2+e.vy**2);
      if(spd>cb){ e.vx=(e.vx/spd)*cb; e.vy=(e.vy/spd)*cb; }
      if(spd>5) e.targetAngle = lerp(e.targetAngle, Math.atan2(e.vy,e.vx), dt*5);

      e.x += e.vx*dt; e.y += e.vy*dt;
      if(e.x<-20) e.x=W+20; if(e.x>W+20) e.x=-20;
      if(e.y<-20) e.y=H+20; if(e.y>H+20) e.y=-20;

      this.drawEnemyShip(e.gfx, e.x, e.y, e.targetAngle, e.eb, cd, e.type||0);

      if(ds<15){
        let rdmg = 20*dt;
        this.ship.health = Math.max(0, this.ship.health - rdmg);
      }
    }
  }

  updateTowers(dt){
    const s = this.ship;
    let fz = null;
    let bx = 999;

    for(const t of this.eg){
      if(t.active) continue;
      const d = dist(s.x,s.y,t.x,t.y);
      if(d<bx){ bx=d; if(d<30) fz=t; }
    }

    if(s.landed && fz){
      if(this.fr !== fz){
        this.fr = fz;
        this.bi = 0;
      }
      this.bi += dt;
      fz.activationProgress = this.bi/2;

      fz.timer.clear();
      const tbx = fz.tipX - 15;
      const tby = fz.tipY - 14;
      fz.timer.fillStyle(0x001100, 0.7);
      fz.timer.fillRect(tbx, tby, 30, 5);
      fz.timer.fillStyle(0x00ff88,1);
      fz.timer.fillRect(tbx, tby, 30*(this.bi/2), 5);
      fz.timer.lineStyle(1,0x00aa44,1);
      fz.timer.strokeRect(tbx, tby, 30, 5);

      if(this.bi>=2){
        this.activateTower(fz);
        this.bi=0;
        this.fr=null;
      }
    } else {
      if(this.fr && !s.landed){
        this.fr.activationProgress=0;
        this.fr.timer.clear();
        this.bi=0;
        this.fr=null;
      }
    }

    for(const t of this.eg){
      const now = this.time.now;
      if(t.active){
        // Activated: pulsing beam from tip outward + redraw
        t.beam.clear();
        const ef = 0.4+0.4*Math.sin(now/180);
        const bLen = 30 + 10*Math.sin(now/220);
        t.beam.lineStyle(2, 0x00ffff, ef);
        t.beam.lineBetween(
          t.tipX, t.tipY,
          t.tipX + Math.cos(t.bv)*bLen,
          t.tipY + Math.sin(t.bv)*bLen
        );
        t.beam.lineStyle(1, 0x00ffcc, ef*0.4);
        t.beam.strokeCircle(t.tipX, t.tipY, 6+4*ef);
        this.drawTowerGfx(t);
      } else {
        // Inactive: tick/blink animation on the bulb
        t.beam.clear();
        const cv = 1200; // ms per full blink cycle
        const gf = (now + t.tickPhase*1000) % cv;
        const on = gf < cv*0.18; // short bb
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
    this.an++;
    this.cj += 150;
    this.showMsg(`TORRE ACTIVADA! ${this.an}/${this.eg.length}`, 2000);
    if(this.an >= this.eg.length){
      this.spawnPortal();
    }
  }

  spawnPortal(){
    this.bh = true;
    this.ad = this.add.graphics().setDepth(7);

    let px, py, tries=0;
    do {
      px = Phaser.Math.Between(60, W-60);
      py = Phaser.Math.Between(60, H-60);
      tries++;
    } while(
      tries < 200 &&
      this.cm.some(p => dist(px, py, p.x, p.y) < p.fy + 50)
    );
    this.fu = px;
    this.bw = py;
    this.showMsg('¡AGUJERO NEGRO GENERADO! Entra en él.', 3000);
    this.cj += 200;
  }

  updatePortal(dt){
    if(!this.bh || !this.ad) return;
    const pg = this.ad;
    pg.clear();
    const t = this.time.now/1000;
    const px=this.fu, py=this.bw;

    for(let r=35;r>0;r-=5){
      const a = (r/35)*0.15;
      pg.fillStyle(0x6600cc, a);
      pg.fillCircle(px,py,r);
    }

    for(let i=0;i<8;i++){
      const bv = (i/8)*Math.PI*2+t*2;
      const r1=8,r2=34;
      pg.lineStyle(1,0xaa44ff,0.6);
      pg.lineBetween(px+Math.cos(bv)*r1,py+Math.sin(bv)*r1,
                     px+Math.cos(bv+0.5)*r2,py+Math.sin(bv+0.5)*r2);
    }
    pg.fillStyle(0x000000,1);
    pg.fillCircle(px,py,10);

    if(!this.fs){
      this.fs = this.add.text(this.fu,this.bw-45,'AGUJERO NEGRO',{fontSize:'10px',fontFamily:'Courier New',color:'#aa44ff'}).setOrigin(0.5).setDepth(8);
    }
  }

  nextSector(){
    if(this.de) return;
    this.de = true;
    this.cj += 500 + this.dy*100;
    this.dy++;

    const bb = this.add.graphics().setDepth(50);
    bb.fillStyle(0xffffff,1); bb.fillRect(0,0,W,H);
    this.tweens.add({
      targets: bb, alpha: 0, duration: 800,
      onComplete: ()=>{
        bb.destroy();
        this.de = false;
        if(this.fs){ this.fs.destroy(); this.fs=null; }
        this.generateSector();
        this.createUI();
        if(this.dy===1) this.startTutorial();

        const ey = 100 + (this.gy.extraTank||0)*15;
        this.ship.fuel = Math.min(ey, this.ship.fuel+20);
        this.ship.energy = Math.min(100, this.ship.energy+15);
        this.ship.health = Math.min(100, this.ship.health+20);
        const sp = this.findSafeSpawn();
        this.ship.x = sp.x; this.ship.y = sp.y;
        this.ship.vx = 0; this.ship.vy = 0;
        this.ship.landed = false;
        this.an = 0;
        this.bi = 0;
        this.fr = null;
        this.showMsg(`SECTOR ${this.dy} INICIADO!`, 2500);
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#00000f',
  parent: 'game-container',
  scene: [ba, eq, gm],
  render: { antialias: true }
};

const game = new Phaser.Game(config);
