import React, { useEffect, useState, useRef } from 'react';
import './AlgoVisualizer.css';

export default function AlgoVisualizer({ standaloneAlgo = null, isTraining = false }) {
  const [activeTab, setActiveTab] = useState(standaloneAlgo || 'lr');

  // We use standard React state to trigger UI updates for metrics
  const [lrMetrics, setLrMetrics] = useState({ r2: '—', mse: '—', slope: '—', int: '—', status: 'READY' });
  const [knnMetrics, setKnnMetrics] = useState({ k: 3, vote: '—', a: '—', b: '—', status: 'CLICK GRID' });
  const [dtMetrics, setDtMetrics] = useState({ depth: 0, nodes: 0, leaves: 0, splits: 0, status: 'DEPTH 0' });
  const [rfMetrics, setRfMetrics] = useState({ trees: 5, pred: '—', va: '—', vb: '—', status: 'READY' });

  // Component refs for DOM manipulation within the specific canvas scripts
  const cvLR = useRef(null);
  const cvKNN = useRef(null);
  const cvDT = useRef(null);
  const cvRF = useRef(null);

  // Global-ish state for the algorithms, stored in refs so they persist across renders without causing re-renders directly when animating
  const g = useRef({
    // LR
    lrPts: [], lrAnimId: null, lrAnimT: 0, lrNoise: 22, lrPtsCount: 28,
    // KNN
    knnData: [], knnQuery: null, knnK: 3,
    // DT
    DT_NODES: [
      {id:0,parent:null,depth:0,x:0.5,y:0.12,label:'x₁ > 0.5',type:'decision',newest:false,children:[1,2]},
      {id:1,parent:0,depth:1,x:0.25,y:0.34,label:'x₂ > 0.3',type:'decision',newest:false,children:[3,4]},
      {id:2,parent:0,depth:1,x:0.75,y:0.34,label:'x₁ > 0.8',type:'decision',newest:false,children:[5,6]},
      {id:3,parent:1,depth:2,x:0.13,y:0.56,label:'Class A',type:'leaf-a',newest:false,children:[]},
      {id:4,parent:1,depth:2,x:0.37,y:0.56,label:'x₂ > 0.7',type:'decision',newest:false,children:[7,8]},
      {id:5,parent:2,depth:2,x:0.63,y:0.56,label:'Class B',type:'leaf-b',newest:false,children:[]},
      {id:6,parent:2,depth:2,x:0.87,y:0.56,label:'Class A',type:'leaf-a',newest:false,children:[]},
      {id:7,parent:4,depth:3,x:0.28,y:0.78,label:'Class B',type:'leaf-b',newest:false,children:[]},
      {id:8,parent:4,depth:3,x:0.46,y:0.78,label:'Class A',type:'leaf-a',newest:false,children:[]},
    ],
    dtVisible: 0, dtAutoId: null,
    // RF
    rfVotes: [], rfTreeCount: 5, rfAnimId: null
  });

  // Helper bindings
  const rd = (n, d = 2) => +n.toFixed(d);
  const rng = (a, b) => a + Math.random() * (b - a);

  const BG2 = '#0d1120', BG4 = '#1a2035';
  const LR = '#38bdf8', KNN = '#f472b6', DTColor = '#facc15', RF = '#4ade80', KNB = '#a78bfa';
  const KNNG = 'rgba(244,114,182,0.35)', DTG = 'rgba(250,204,21,0.35)', KNNDIM = 'rgba(244,114,182,0.15)', RFDIM = 'rgba(74,222,128,0.15)';

  const drawRoundRect = (ctx, x, y, width, height, radius) => {
    let r = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + width - r[1], y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
    ctx.lineTo(x + width, y + height - r[2]);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
    ctx.lineTo(x + r[3], y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
    ctx.lineTo(x, y + r[0]);
    ctx.quadraticCurveTo(x, y, x + r[0], y);
  };


  // ===================================
  // 1. Linear Regression Logic
  // ===================================
  const lrGenData = () => {
    const s = g.current;
    const n = s.lrPtsCount;
    const noise = s.lrNoise / 100;
    s.lrPts = [];
    for (let i = 0; i < n; i++) {
        const x = rng(0.05, 0.95);
        s.lrPts.push({ x, y: Math.min(0.95, Math.max(0.05, 0.15 + 0.7 * x + (Math.random() - 0.5) * noise * 1.8)) });
    }
  };

  const lrFit = (pts) => {
    const n = pts.length;
    const mx = pts.reduce((s, d) => s + d.x, 0) / n;
    const my = pts.reduce((s, d) => s + d.y, 0) / n;
    const num = pts.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0);
    const den = pts.reduce((s, d) => s + (d.x - mx) ** 2, 0);
    const m = den === 0 ? 0 : num / den; 
    const b = my - m * mx;
    return { m, b };
  };

  const lrMetricsCalc = (pts, m, b) => {
    const n = pts.length;
    const my = pts.reduce((s, d) => s + d.y, 0) / n;
    const ss_res = pts.reduce((s, d) => s + (d.y - (m * d.x + b)) ** 2, 0);
    const ss_tot = pts.reduce((s, d) => s + (d.y - my) ** 2, 0);
    const r2 = ss_tot === 0 ? 0 : 1 - ss_res / ss_tot;
    const mse = ss_res / n;
    return { r2, mse };
  };

  const lrDraw = (progress = 1) => {
      const cv = cvLR.current;
      if (!cv) return;
      const W = cv.offsetWidth || 620; cv.width = W; cv.height = 380;
      const ctx = cv.getContext('2d');
      const pad = 40;
      const sx = x => pad + x * (W - 2 * pad);
      const sy = y => 380 - pad - y * (380 - 2 * pad);

      ctx.fillStyle = BG2; ctx.fillRect(0, 0, W, 380);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const gx = pad + i * (W - 2 * pad) / 4;
        const gy = 380 - pad - i * (380 - 2 * pad) / 4;
        ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, 380 - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      }

      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, 380 - pad); ctx.lineTo(W - pad, 380 - pad); ctx.stroke();

      const s = g.current;
      if (!s.lrPts.length) return;
      const { m, b } = lrFit(s.lrPts);

      const x0 = 0.0, x1 = progress;
      const lx0 = sx(x0), ly0 = sy(b), lx1 = sx(x1), ly1 = sy(m * x1 + b);

      if (progress > 0.02) {
          ctx.save();
          ctx.shadowColor = LR; ctx.shadowBlur = 18;
          ctx.strokeStyle = LR; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1); ctx.stroke();
          ctx.restore();
      }

      // residuals
      if (progress > 0.5) {
          const alpha = Math.min(1, (progress - 0.5) * 2);
          s.lrPts.forEach(p => {
              const px = sx(p.x), py = sy(p.y), fy = sy(m * p.x + b);
              ctx.strokeStyle = `rgba(56,189,248,${0.35 * alpha})`;
              ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
              ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, fy); ctx.stroke();
              ctx.setLineDash([]);
          });
      }

      // points
      s.lrPts.forEach(p => {
          const px = sx(p.x), py = sy(p.y);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
      });

      if (progress >= 1) {
          const { r2, mse } = lrMetricsCalc(s.lrPts, m, b);
          setLrMetrics(prev => ({ ...prev, r2: rd(r2, 3), mse: rd(mse, 4), slope: rd(m, 2), int: rd(b, 2), status: 'FITTED' }));
      }
  };

  const lrAnimate = () => {
      const s = g.current;
      if (s.lrAnimId) cancelAnimationFrame(s.lrAnimId);
      s.lrAnimT = 0;
      setLrMetrics(prev => ({ ...prev, status: 'FITTING...' }));
      const step = () => {
          s.lrAnimT = Math.min(1, s.lrAnimT + 0.018);
          lrDraw(s.lrAnimT);
          if (s.lrAnimT < 1) s.lrAnimId = requestAnimationFrame(step);
      };
      step();
  };

  const lrReset = () => {
      const s = g.current;
      if (s.lrAnimId) cancelAnimationFrame(s.lrAnimId);
      lrGenData();
      setLrMetrics(prev => ({ ...prev, r2: '—', mse: '—', slope: '—', int: '—', status: 'READY' }));
      lrDraw(0);
  };

  // ===================================
  // 2. KNN Logic
  // ===================================
  const knnGenData = () => {
    const s = g.current;
    s.knnData = [];
    for (let i = 0; i < 30; i++) {
        const cls = Math.random() < 0.5 ? 'A' : 'B';
        const cx = cls === 'A' ? 0.28 : 0.68, cy = cls === 'A' ? 0.65 : 0.35;
        s.knnData.push({ x: cx + rng(-0.22, 0.22), y: cy + rng(-0.22, 0.22), cls });
    }
    s.knnData.forEach(d => { d.x = Math.min(0.95, Math.max(0.05, d.x)); d.y = Math.min(0.95, Math.max(0.05, d.y)); });
    
    setKnnMetrics(prev => ({
        ...prev,
        a: s.knnData.filter(d => d.cls === 'A').length,
        b: s.knnData.filter(d => d.cls === 'B').length
    }));
  };

  const knnDraw = () => {
    const cv = cvKNN.current;
    if (!cv) return;
    const W = cv.offsetWidth || 620; cv.width = W; cv.height = 380;
    const ctx = cv.getContext('2d');
    const pad = 30;
    const sx = x => pad + x * (W - 2 * pad);
    const sy = y => 380 - pad - y * (380 - 2 * pad);
    const s = g.current;
    const K = s.knnK;

    ctx.fillStyle = BG2; ctx.fillRect(0, 0, W, 380);

    const res = 30;
    for (let i = 0; i < res; i++) {
        for (let j = 0; j < res; j++) {
            const qx = i / res + 0.5 / res, qy = j / res + 0.5 / res;
            const dists = s.knnData.map(p => ({ d: Math.hypot(p.x - qx, p.y - qy), cls: p.cls }));
            dists.sort((a, b) => a.d - b.d);
            const neighbors = dists.slice(0, K);
            const vA = neighbors.filter(n => n.cls === 'A').length;
            const win = vA > K / 2 ? 'A' : 'B';
            const cellW = (W - 2 * pad) / res, cellH = (380 - 2 * pad) / res;
            ctx.fillStyle = win === 'A' ? `rgba(244,114,182,0.07)` : `rgba(167,139,250,0.07)`;
            ctx.fillRect(sx(qx) - cellW / 2, sy(qy) - cellH / 2, cellW + 1, cellH + 1);
        }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
        const gx = pad + i * (W - 2 * pad) / 4, gy = 380 - pad - i * (380 - 2 * pad) / 4;
        ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, 380 - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
    }

    let neighbors = [];
    if (s.knnQuery) {
        const dists = s.knnData.map(p => ({ ...p, d: Math.hypot(p.x - s.knnQuery.x, p.y - s.knnQuery.y) }));
        dists.sort((a, b) => a.d - b.d);
        neighbors = dists.slice(0, K);
        const radius = neighbors[neighbors.length - 1].d;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(244,114,182,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(sx(s.knnQuery.x), sy(s.knnQuery.y), (W - 2 * pad) * radius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        neighbors.forEach(n => {
            ctx.strokeStyle = KNN; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55;
            ctx.beginPath(); ctx.moveTo(sx(s.knnQuery.x), sy(s.knnQuery.y)); ctx.lineTo(sx(n.x), sy(n.y)); ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }

    s.knnData.forEach(p => {
        const isNeighbor = neighbors.some(n => n === p || (n.x === p.x && n.y === p.y));
        const px = sx(p.x), py = sy(p.y);
        if (isNeighbor) {
            ctx.save(); ctx.shadowColor = p.cls === 'A' ? KNN : KNB; ctx.shadowBlur = 14; ctx.restore();
        }
        ctx.fillStyle = p.cls === 'A' ? KNN : KNB;
        ctx.globalAlpha = isNeighbor ? 1 : 0.5;
        ctx.beginPath(); ctx.arc(px, py, isNeighbor ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (isNeighbor) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.stroke();
        }
    });

    if (s.knnQuery) {
        const qx = sx(s.knnQuery.x), qy = sy(s.knnQuery.y);
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(qx, qy, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(qx, qy, 3, 0, Math.PI * 2); ctx.fill();
        
        const vA = neighbors.filter(n => n.cls === 'A').length;
        const vB = K - vA;
        const pred = vA > vB ? 'A' : 'B';
        setKnnMetrics(prev => ({ ...prev, vote: pred, status: `VOTED: ${pred}` }));
    }
  };

  const knnReset = () => { 
      g.current.knnQuery = null; 
      knnGenData(); 
      knnDraw(); 
      setKnnMetrics(prev => ({ ...prev, vote: '—', status: 'CLICK GRID' })); 
  };
  
  const knnCanvasClick = (e) => {
    const cv = cvKNN.current;
    if(!cv) return;
    const r = cv.getBoundingClientRect();
    const W = cv.offsetWidth, H = 380, pad = 30;
    const mx = (e.clientX - r.left) / r.width;
    const my = 1 - (e.clientY - r.top) / H;
    
    g.current.knnQuery = { x: (mx * (W - 2 * pad) - pad) / (W - 2 * pad), y: (my * (H - 2 * pad)) / (H - 2 * pad) };
    g.current.knnQuery.x = Math.min(0.95, Math.max(0.05, g.current.knnQuery.x));
    g.current.knnQuery.y = Math.min(0.95, Math.max(0.05, g.current.knnQuery.y));
    knnDraw();
  }

  // ===================================
  // 3. Decision Tree Logic
  // ===================================
  const dtDraw = () => {
    const cv = cvDT.current;
    if (!cv) return;
    const W = cv.offsetWidth || 620; cv.width = W; cv.height = 380;
    const ctx = cv.getContext('2d');
    const s = g.current;
    
    ctx.fillStyle = BG2; ctx.fillRect(0, 0, W, 380);
    const pad = 30;
    const nx = x => pad + x * (W - 2 * pad);
    const ny = y => pad + y * (380 - 2 * pad);

    const shown = s.DT_NODES.slice(0, s.dtVisible + 1).filter(n => n.id <= s.dtVisible);

    shown.forEach(n => {
        if (n.parent === null) return;
        const par = s.DT_NODES[n.parent];
        if (par.id > s.dtVisible) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(nx(par.x), ny(par.y) + 18); ctx.lineTo(nx(n.x), ny(n.y) - 18); ctx.stroke();
        
        const mx = (nx(par.x) + nx(n.x)) / 2, my = (ny(par.y) + 18 + ny(n.y) - 18) / 2;
        const isLeft = n.x < par.x;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isLeft ? 'Yes' : 'No', mx, my - 4);
    });

    shown.forEach(n => {
        const cx = nx(n.x), cy = ny(n.y);
        const isLeaf = n.type !== 'decision';
        const w = isLeaf ? 72 : 96, h = 34, rx = isLeaf ? 17 : 8;
        const col = n.type === 'leaf-a' ? KNN : n.type === 'leaf-b' ? KNB : DTColor;
        const glow = n.type === 'leaf-a' ? KNNG : n.type === 'leaf-b' ? 'rgba(167,139,250,0.5)' : DTG;
        const isNewest = n.id === s.dtVisible;

        if (isNewest) {
            ctx.save();
            ctx.shadowColor = col; ctx.shadowBlur = 28;
        }

        const bg = n.type === 'leaf-a' ? 'rgba(244,114,182,0.18)' : n.type === 'leaf-b' ? 'rgba(167,139,250,0.18)' : 'rgba(250,204,21,0.15)';
        ctx.fillStyle = bg;
        ctx.strokeStyle = col; ctx.lineWidth = isNewest ? 2 : 1.2;
        ctx.beginPath();
        drawRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, rx);
        ctx.fill(); ctx.stroke();

        if (isNewest) ctx.restore();

        ctx.fillStyle = col;
        ctx.font = `${isLeaf ? 11 : 10}px Space Mono, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.label, cx, cy);
    });

    const nodes = s.dtVisible + 1;
    const leaves = s.DT_NODES.slice(0, nodes).filter(n => n.type !== 'decision').length;
    const splits = s.DT_NODES.slice(0, nodes).filter(n => n.type === 'decision').length;
    const depth = Math.max(...s.DT_NODES.slice(0, nodes).map(n => n.depth));
    setDtMetrics(prev => ({...prev, nodes, leaves, splits, depth, status: `DEPTH ${depth}`}));
  };

  const dtGrow = () => {
    const s = g.current;
    if(s.dtVisible < s.DT_NODES.length - 1) { 
        s.dtVisible++; 
        dtDraw(); 
    }
  };

  const dtAutoGrow = () => {
    const s = g.current;
    if (s.dtAutoId) { clearInterval(s.dtAutoId); s.dtAutoId = null; return; }
    s.dtAutoId = setInterval(() => { 
        if (s.dtVisible >= s.DT_NODES.length - 1) { 
            clearInterval(s.dtAutoId); s.dtAutoId = null; return; 
        } 
        s.dtVisible++;
        dtDraw(); 
    }, 700);
  };

  const dtReset = () => { 
    const s = g.current;
    s.dtVisible = 0; 
    if (s.dtAutoId) { clearInterval(s.dtAutoId); s.dtAutoId = null; } 
    dtDraw(); 
  };


  // ===================================
  // 4. Random Forest Logic
  // ===================================
  const rfDraw = () => {
    const cv = cvRF.current;
    if (!cv) return;
    const W = cv.offsetWidth || 620; cv.width = W; cv.height = 380;
    const ctx = cv.getContext('2d');
    const s = g.current;
    
    ctx.fillStyle = BG2; ctx.fillRect(0, 0, W, 380);

    const n = s.rfTreeCount;
    const treeW = Math.min(100, (W - 60) / n - 14);
    const treeH = 220;
    const startX = W / 2 - (n * (treeW + 14)) / 2 + treeW / 2;

    const vA = s.rfVotes.filter(v => v === 'A').length;
    const vB = s.rfVotes.filter(v => v === 'B').length;
    
    if (s.rfVotes.length > 0) {
        const barY = 340, barH = 18, barW = W - 80;
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); drawRoundRect(ctx, 40, barY, barW, barH, 4); ctx.fill();
        const propA = vA / n;
        ctx.fillStyle = KNN;
        if (propA > 0) { ctx.beginPath(); drawRoundRect(ctx, 40, barY, barW * propA, barH, 4); ctx.fill(); }
        ctx.fillStyle = KNB;
        if (1 - propA > 0) { ctx.beginPath(); drawRoundRect(ctx, 40 + barW * propA, barY, barW * (1 - propA), barH, propA > 0 ? [0, 4, 4, 0] : [4, 4, 4, 4]); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${vA} vs ${vB}`, W / 2, barY + barH + 14);
    }

    for (let i = 0; i < n; i++) {
        const tx = startX + i * (treeW + 14);
        const ty = 50;
        const voted = i < s.rfVotes.length;
        const vote = s.rfVotes[i];
        const isActive = i === s.rfVotes.length - 1;

        const col = voted ? (vote === 'A' ? KNN : KNB) : RF;
        ctx.save();
        if (isActive) { ctx.shadowColor = col; ctx.shadowBlur = 24; }

        ctx.strokeStyle = voted ? col : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(tx, ty + treeH); ctx.lineTo(tx, ty + treeH * 0.55); ctx.stroke();

        const levels = 3;
        const drawLevel = (lx, ly, lw, depth) => {
            if (depth > levels) return;
            const nodeR = depth === 1 ? 5 : 3.5;
            ctx.fillStyle = voted ? (vote === 'A' ? `rgba(244,114,182,${0.2 + depth * 0.15})` : `rgba(167,139,250,${0.2 + depth * 0.15})`) : RF;
            ctx.strokeStyle = voted ? col : `rgba(74,222,128,0.4)`;
            ctx.lineWidth = isActive ? 1.5 : 0.8;
            ctx.beginPath(); ctx.arc(lx, ly, nodeR, 0, Math.PI * 2);
            if (voted || isActive) { ctx.fill(); ctx.stroke(); } else { ctx.fillStyle = BG4; ctx.fill(); ctx.strokeStyle = 'rgba(74,222,128,0.25)'; ctx.stroke(); }
            if (depth < levels) {
                const childY = ly + (treeH * 0.28);
                const childX = lw * 0.35;
                [[lx - childX, childY], [lx + childX, childY]].forEach(([cx, cy]) => {
                    ctx.strokeStyle = voted ? `rgba(${vote === 'A' ? '244,114,182' : '167,139,250'},0.25)` : 'rgba(74,222,128,0.15)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.moveTo(lx, ly + nodeR); ctx.lineTo(cx, cy - nodeR); ctx.stroke();
                    drawLevel(cx, cy, childX, depth + 1);
                });
            } else {
                ctx.fillStyle = voted ? (vote === 'A' ? KNN : KNB) : 'rgba(74,222,128,0.4)';
                ctx.fillRect(lx - 8, ly + 12, 16, 5);
            }
        };
        drawLevel(tx, ty + 30, treeW * 0.5, 1);
        ctx.restore();

        if (voted) {
            const badgeY = ty + treeH + 12;
            ctx.fillStyle = vote === 'A' ? KNNDIM : 'rgba(167,139,250,0.18)';
            ctx.strokeStyle = vote === 'A' ? KNN : KNB; ctx.lineWidth = 1;
            ctx.beginPath(); drawRoundRect(ctx, tx - 18, badgeY, 36, 18, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = vote === 'A' ? KNN : KNB;
            ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(vote, tx, badgeY + 9);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(`T${i + 1}`, tx, ty + treeH + 32 + (voted ? 20 : 0));
    }

    if (s.rfVotes.length === n) {
        const pred = vA > vB ? 'A' : 'B';
        const col = vA > vB ? KNN : KNB;
        ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 30;
        ctx.fillStyle = col;
        ctx.font = 'bold 13px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`→ Prediction: Class ${pred} (${Math.max(vA, vB)}/${n} votes)`, W / 2, 318);
        ctx.restore();
        setRfMetrics(prev => ({...prev, pred, status: 'VOTED'}));
    }
  };

  const rfVote = () => {
    const s = g.current;
    if (s.rfVotes.length >= s.rfTreeCount) return;
    const remaining = s.rfTreeCount - s.rfVotes.length;
    if (remaining === 0) return;
    if (s.rfAnimId) clearInterval(s.rfAnimId);
    s.rfAnimId = setInterval(() => {
        if (s.rfVotes.length >= s.rfTreeCount) { 
            clearInterval(s.rfAnimId); s.rfAnimId = null;
            const vA = s.rfVotes.filter(v => v === 'A').length;
            setRfMetrics(prev => ({...prev, va: vA, vb: s.rfTreeCount - vA}));
            return;
        }
        s.rfVotes.push(Math.random() < 0.55 ? 'A' : 'B');
        rfDraw();
    }, 500);
  };

  const rfReset = () => { 
    const s = g.current;
    s.rfVotes = []; 
    if (s.rfAnimId) clearInterval(s.rfAnimId); 
    setRfMetrics(prev => ({...prev, pred: '—', va: '—', vb: '—', status: 'READY'})); 
    rfDraw(); 
  };


  // Make sure we initialize when tabs change
  useEffect(() => {
      if (activeTab === 'lr') {
          lrReset();
          if (standaloneAlgo && isTraining) lrAnimate();
      } else if (activeTab === 'knn') {
          knnReset();
      } else if (activeTab === 'dt') {
          dtReset();
          if (standaloneAlgo && isTraining) dtAutoGrow();
      } else if (activeTab === 'rf') {
          rfReset();
          if (standaloneAlgo && isTraining) rfVote();
      }
      
      // Cleanup animations
      return () => {
          const s = g.current;
          if(s.lrAnimId) cancelAnimationFrame(s.lrAnimId);
          if(s.dtAutoId) clearInterval(s.dtAutoId);
          if(s.rfAnimId) clearInterval(s.rfAnimId);
      }
      // eslint-disable-next-line
  }, [activeTab, standaloneAlgo, isTraining]);


  return (
    <div className={`algo-visualizer ${standaloneAlgo ? 'standalone' : ''}`}>
      <div className="algo-app pt-0">
        {!standaloneAlgo && (
          <>
            <header>
              <div className="header-left">
                <h1>
                  <span className="w-lr">Learn</span> by<br/>
                  <span className="w-knn">seeing</span> the<br/>
                  <span className="w-dt">algo</span><span className="w-rf">rithm</span>
                </h1>
                <p className="subtitle">Interactive visualizations for Linear Regression, KNN, Decision Trees, and Random Forests. Built for the MERN stack ML pipeline.</p>
              </div>
              <div className="badge-row">
                <span className="badge lr">Regression</span>
                <span className="badge knn">Classification</span>
                <span className="badge dt">Tree</span>
                <span className="badge rf">Ensemble</span>
              </div>
            </header>

            <div className="pipeline">
              <span className="pipe-step">Data</span>
              <span className="pipe-arrow">→</span>
              <span className="pipe-step">Preprocess</span>
              <span className="pipe-arrow">→</span>
              <span className="pipe-step">Split</span>
              <span className="pipe-arrow">→</span>
              <span className={`pipe-step active-step ${activeTab}-step`}>Train</span>
              <span className="pipe-arrow">→</span>
              <span className={`pipe-step active-step ${activeTab}-step`}>Evaluate</span>
            </div>

            <div className="tab-nav">
              <button className={`tab-btn lr ${activeTab==='lr'?'active':''}`} onClick={() => setActiveTab('lr')}>
                <span><span className="tab-dot"></span>Linear Regression</span>
              </button>
              <button className={`tab-btn knn ${activeTab==='knn'?'active':''}`} onClick={() => setActiveTab('knn')}>
                <span><span className="tab-dot"></span>KNN</span>
              </button>
              <button className={`tab-btn dt ${activeTab==='dt'?'active':''}`} onClick={() => setActiveTab('dt')}>
                <span><span className="tab-dot"></span>Decision Tree</span>
              </button>
              <button className={`tab-btn rf ${activeTab==='rf'?'active':''}`} onClick={() => setActiveTab('rf')}>
                <span><span className="tab-dot"></span>Random Forest</span>
              </button>
            </div>
          </>
        )}

        {/* LINEAR REGRESSION */}
        <div className={`panel panel-lr ${activeTab==='lr'?'active':''}`}>
          <div className="viz-card">
            <div className="viz-header">
              <span className="viz-title"><span className="live-dot"></span>Linear Regression — Gradient Descent</span>
              <span className="viz-status">{lrMetrics.status}</span>
            </div>
            <canvas ref={cvLR} height="380"></canvas>
          </div>
          <div className="sidebar">
            <div className="side-card">
              <h3>Metrics</h3>
              <div className="metrics-grid">
                <div className="metric"><div className="metric-label">R² Score</div><div className="metric-value">{lrMetrics.r2}</div></div>
                <div className="metric"><div className="metric-label">MSE</div><div className="metric-value">{lrMetrics.mse}</div></div>
                <div className="metric"><div className="metric-label">Slope</div><div className="metric-value">{lrMetrics.slope}</div></div>
                <div className="metric"><div className="metric-label">Intercept</div><div className="metric-value">{lrMetrics.int}</div></div>
              </div>
            </div>
            <div className="side-card">
              <h3>Controls</h3>
              <div className="controls-group">
                <button className="btn" onClick={lrAnimate}>▶ Animate Fit</button>
                <button className="btn" onClick={lrReset}>↺ New Dataset</button>
                <div className="slider-row">
                  <label>Noise</label>
                  <input type="range" min="5" max="70" value={g.current.lrNoise} onChange={(e) => { g.current.lrNoise = +e.target.value; lrReset(); }} />
                  <span className="slider-val">{g.current.lrNoise}</span>
                </div>
                <div className="slider-row">
                  <label>Points</label>
                  <input type="range" min="10" max="60" value={g.current.lrPtsCount} onChange={(e) => { g.current.lrPtsCount = +e.target.value; lrReset(); }} />
                  <span className="slider-val">{g.current.lrPtsCount}</span>
                </div>
              </div>
            </div>
            <div className="side-card">
              <h3>Legend</h3>
              <div className="legend">
                <div className="legend-item"><div className="legend-dot" style={{background:'#38bdf8'}}></div>Fitted line</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#ffffff',opacity:0.7}}></div>Data points</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#38bdf8',opacity:0.4}}></div>Residuals</div>
              </div>
            </div>
            <div className="side-card">
              <h3>How it works</h3>
              <p className="desc-text">The cyan line fits iteratively to minimize the sum of squared residuals. Each vertical line shows the error — gradient descent adjusts slope & intercept each epoch.</p>
            </div>
          </div>
        </div>

        {/* KNN */}
        <div className={`panel panel-knn ${activeTab==='knn'?'active':''}`}>
          <div className="viz-card">
            <div className="viz-header">
              <span className="viz-title"><span className="live-dot"></span>K-Nearest Neighbors — Click to Classify</span>
              <span className="viz-status">{knnMetrics.status}</span>
            </div>
            <canvas ref={cvKNN} height="380" onClick={knnCanvasClick}></canvas>
          </div>
          <div className="sidebar">
            <div className="side-card">
              <h3>Metrics</h3>
              <div className="metrics-grid">
                <div className="metric"><div className="metric-label">K Value</div><div className="metric-value">{knnMetrics.k}</div></div>
                <div className="metric"><div className="metric-label">Vote</div><div className="metric-value">{knnMetrics.vote}</div></div>
                <div className="metric"><div className="metric-label">Class A</div><div className="metric-value">{knnMetrics.a}</div></div>
                <div className="metric"><div className="metric-label">Class B</div><div className="metric-value">{knnMetrics.b}</div></div>
              </div>
            </div>
            <div className="side-card">
              <h3>Controls</h3>
              <div className="controls-group">
                <button className="btn" onClick={knnReset}>↺ Shuffle Data</button>
                <div className="slider-row">
                  <label>K =</label>
                  <input type="range" min="1" max="11" step="2" value={g.current.knnK} onChange={(e) => { g.current.knnK = +e.target.value; setKnnMetrics(p => ({...p, k: g.current.knnK})); knnDraw(); }} />
                  <span className="slider-val">{g.current.knnK}</span>
                </div>
              </div>
            </div>
            <div className="side-card">
              <h3>Legend</h3>
              <div className="legend">
                <div className="legend-item"><div className="legend-dot" style={{background:'#f472b6'}}></div>Class A points</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#a78bfa'}}></div>Class B points</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#ffffff'}}></div>Query point</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#f472b6',opacity:0.4}}></div>K-radius</div>
              </div>
            </div>
            <div className="side-card">
              <h3>How it works</h3>
              <p className="desc-text">Click anywhere on the canvas to place a query point. The K nearest neighbors are highlighted with pink connection lines. Majority class wins the vote.</p>
            </div>
          </div>
        </div>

        {/* DECISION TREE */}
        <div className={`panel panel-dt ${activeTab==='dt'?'active':''}`}>
          <div className="viz-card">
            <div className="viz-header">
              <span className="viz-title"><span className="live-dot"></span>Decision Tree — Grows Node by Node</span>
              <span className="viz-status">{dtMetrics.status}</span>
            </div>
            <canvas ref={cvDT} height="380"></canvas>
          </div>
          <div className="sidebar">
            <div className="side-card">
              <h3>Metrics</h3>
              <div className="metrics-grid">
                <div className="metric"><div className="metric-label">Depth</div><div className="metric-value">{dtMetrics.depth}</div></div>
                <div className="metric"><div className="metric-label">Nodes</div><div className="metric-value">{dtMetrics.nodes}</div></div>
                <div className="metric"><div className="metric-label">Leaves</div><div className="metric-value">{dtMetrics.leaves}</div></div>
                <div className="metric"><div className="metric-label">Splits</div><div className="metric-value">{dtMetrics.splits}</div></div>
              </div>
            </div>
            <div className="side-card">
              <h3>Controls</h3>
              <div className="controls-group">
                <button className="btn" onClick={dtGrow}>+ Grow Node</button>
                <button className="btn" onClick={dtAutoGrow}>▶ Auto Grow</button>
                <button className="btn" onClick={dtReset}>↺ Reset Tree</button>
              </div>
            </div>
            <div className="side-card">
              <h3>Legend</h3>
              <div className="legend">
                <div className="legend-item"><div className="legend-dot" style={{background:'#facc15'}}></div>Decision node</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#4ade80'}}></div>Leaf — Class A</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#f472b6'}}></div>Leaf — Class B</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#facc15',opacity:0.3}}></div>Newest node</div>
              </div>
            </div>
            <div className="side-card">
              <h3>How it works</h3>
              <p className="desc-text">The tree splits on the best feature threshold at each node. Yellow glow highlights the newest split. Leaves show the final predicted class.</p>
            </div>
          </div>
        </div>

        {/* RANDOM FOREST */}
        <div className={`panel panel-rf ${activeTab==='rf'?'active':''}`}>
          <div className="viz-card">
            <div className="viz-header">
              <span className="viz-title"><span className="live-dot"></span>Random Forest — Ensemble Voting</span>
              <span className="viz-status">{rfMetrics.status}</span>
            </div>
            <canvas ref={cvRF} height="380"></canvas>
          </div>
          <div className="sidebar">
            <div className="side-card">
              <h3>Metrics</h3>
              <div className="metrics-grid">
                <div className="metric"><div className="metric-label">Trees</div><div className="metric-value">{rfMetrics.trees}</div></div>
                <div className="metric"><div className="metric-label">Prediction</div><div className="metric-value">{rfMetrics.pred}</div></div>
                <div className="metric"><div className="metric-label">A Votes</div><div className="metric-value">{rfMetrics.va}</div></div>
                <div className="metric"><div className="metric-label">B Votes</div><div className="metric-value">{rfMetrics.vb}</div></div>
              </div>
            </div>
            <div className="side-card">
              <h3>Controls</h3>
              <div className="controls-group">
                <button className="btn" onClick={rfVote}>▶ Run Vote</button>
                <button className="btn" onClick={rfReset}>↺ New Sample</button>
                <div className="slider-row">
                  <label>Trees</label>
                  <input type="range" min="3" max="9" step="2" value={g.current.rfTreeCount} onChange={(e) => { g.current.rfTreeCount = +e.target.value; setRfMetrics(p => ({...p, trees: g.current.rfTreeCount})); rfReset(); }} />
                  <span className="slider-val">{g.current.rfTreeCount}</span>
                </div>
              </div>
            </div>
            <div className="side-card">
              <h3>Legend</h3>
              <div className="legend">
                <div className="legend-item"><div className="legend-dot" style={{background:'#4ade80'}}></div>Active / voting tree</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#1e2535'}}></div>Idle tree</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#4ade80',opacity:0.3}}></div>Vote — Class A</div>
                <div className="legend-item"><div className="legend-dot" style={{background:'#f472b6',opacity:0.6}}></div>Vote — Class B</div>
              </div>
            </div>
            <div className="side-card">
              <h3>How it works</h3>
              <p className="desc-text">Each tree independently classifies the sample using a random subset of features (bagging). Votes are aggregated — majority class is the final prediction.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
