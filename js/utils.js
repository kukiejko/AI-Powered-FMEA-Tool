// ── Version & Metadata ──
var APP_VERSION = '1.1.1';
var COMPILE_TIME = '2026-04-27T18:47:42.3947744Z';

// ── Shared mutable state ──
var currentUser = null;
var currentProjectId = null;
var currentMode = 'simple';
var currentProvider = 'claude';
var hiddenCols = {};
var rows = [];
var fileTexts = [];
var fileNames = [];
var incidents = [];
var saveTimer = null;
var confirmCb = null;

// ── Storage abstraction ──
var Storage = {
  get: async function(key) {
    if (window.storage && window.storage.get) {
      try { return await window.storage.get(key); } catch(e) { return null; }
    }
    var v = localStorage.getItem(key);
    return v !== null ? { key: key, value: v } : null;
  },
  set: async function(key, value) {
    if (window.storage && window.storage.set) {
      return await window.storage.set(key, value);
    }
    localStorage.setItem(key, value);
    return { key: key, value: value };
  },
  delete: async function(key) {
    if (window.storage && window.storage.delete) {
      return await window.storage.delete(key);
    }
    localStorage.removeItem(key);
    return { key: key, deleted: true };
  }
};

// ── API key helpers ──
function getProvider() {
  return currentProvider || 'claude';
}
function setProvider(provider) {
  currentProvider = provider || 'claude';
  localStorage.setItem('provider:' + (currentUser || ''), currentProvider);
}
function getApiKeyForProvider(provider) {
  provider = provider || getProvider();
  var key = 'apikey:' + (currentUser || '') + ':' + provider;
  return localStorage.getItem(key) || '';
}
function setApiKeyForProvider(provider, key) {
  provider = provider || getProvider();
  var k = 'apikey:' + (currentUser || '') + ':' + provider;
  localStorage.setItem(k, key);
}
function getApiKey() {
  return getApiKeyForProvider(getProvider());
}
function setApiKey(key) {
  setApiKeyForProvider(getProvider(), key);
}

// ── Storage key helpers ──
function projKey(id) { return 'proj:' + currentUser + ':' + id; }
function projListKey() { return 'projlist:' + currentUser; }

async function getProjectList() {
  try {
    var r = await Storage.get(projListKey());
    return r ? JSON.parse(r.value) : [];
  } catch(e) { return []; }
}
async function saveProjectList(list) {
  await Storage.set(projListKey(), JSON.stringify(list));
}
async function getProject(id) {
  try {
    var r = await Storage.get(projKey(id));
    return r ? JSON.parse(r.value) : null;
  } catch(e) { return null; }
}
async function saveProject(proj) {
  proj.updatedAt = new Date().toISOString();
  await Storage.set(projKey(proj.id), JSON.stringify(proj));
}

// ── Screen management ──
function showScreen(id) {
  ['screenLogin','screenDash','screenWork'].forEach(function(s){
    document.getElementById(s).classList.toggle('active', s === id);
  });
}

// ── Tab switcher ──
window.switchTab = function(name) {
  ['upload','fmea','incidents','guide'].forEach(function(t){
    var panel = document.getElementById('panel-'+t);
    var tab   = document.getElementById('tab-'+t);
    if(panel) panel.style.display = (t===name) ? 'block' : 'none';
    if(tab)   tab.classList.toggle('active', t===name);
  });
  if(name==='incidents' && typeof renderIncidents==='function') renderIncidents();
};

// ── Help tab switcher ──
window.switchHelpTab = function(name) {
  ['overview','simple','advanced','incidents-help'].forEach(function(t) {
    var panel = document.getElementById('help-' + t);
    var btn   = document.getElementById('help-tab-' + t);
    if(panel) panel.style.display = (t === name) ? 'block' : 'none';
    if(btn)   btn.classList.toggle('help-tab-active', t === name);
  });
};

// ── Confirm dialog ──
function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  confirmCb = cb;
  document.getElementById('confirmOverlay').classList.add('open');
}
document.addEventListener('DOMContentLoaded', function() {
  // Display version and compilation time
  var verEl = document.getElementById('versionDisplay');
  var tsEl = document.getElementById('timestampDisplay');
  if (verEl) verEl.textContent = APP_VERSION;
  if (tsEl) {
    var d = new Date(COMPILE_TIME);
    tsEl.textContent = d.toLocaleString([], {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'}) + ' UTC';
  }

  document.getElementById('confirmYes').onclick = function () {
    document.getElementById('confirmOverlay').classList.remove('open');
    if (confirmCb) { confirmCb(); confirmCb = null; }
  };
  document.getElementById('confirmNo').onclick = function () {
    document.getElementById('confirmOverlay').classList.remove('open');
    confirmCb = null;
  };
  document.getElementById('confirmOverlay').onclick = function(e) {
    if(e.target===this){ this.classList.remove('open'); confirmCb=null; }
  };
  // Hide all panels on init
  ['upload','fmea','incidents','guide'].forEach(function(t){
    var p = document.getElementById('panel-'+t);
    if(p) p.style.display = 'none';
  });
});

// ── Shared helpers ──
function clamp(v,d){var n=parseInt(v);return isNaN(n)?(d!==undefined?d:5):Math.min(10,Math.max(1,n));}
function rpnVal(r){return r.sev*r.occ*r.det;}
function rpnCls(v){return v>=200?'rpn-critical':v>=100?'rpn-high':v>=50?'rpn-med':'rpn-low';}
function rpnCategory(rpn){if(rpn<50)return 'low';if(rpn<100)return 'med';if(rpn<200)return 'high';return 'crit';}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function setStatus(m,t){var el=document.getElementById('status');el.innerHTML=m;el.className='status '+(t||'');}
function getContent(){return fileTexts.concat([document.getElementById('manualText').value.trim()]).filter(Boolean).join('\n\n---\n\n');}
function parseJson(text){var c=text.replace(/```json|```/g,'').trim();try{return JSON.parse(c);}catch(e){var lb=c.lastIndexOf('},');try{return JSON.parse(lb!==-1?c.substring(0,lb+1)+']':'[]');}catch(e2){return [];}}}
function fileOpts(sel){var o='<option value="">— none —</option>';fileNames.forEach(function(n){o+='<option value="'+esc(n)+'"'+(sel===n?' selected':'')+'>'+esc(n)+'</option>';});if(sel&&fileNames.indexOf(sel)===-1&&sel)o+='<option value="'+esc(sel)+'" selected>'+esc(sel)+'</option>';return o;}
function newRow(d){
  d=d||{};
  return{
    id:String(Date.now()+Math.random()),
    step:d.step||'',failureMode:d.failureMode||'',effect:d.effect||'',cause:d.cause||'',
    sev:clamp(d.sev!==undefined?d.sev:5,5),occ:clamp(d.occ!==undefined?d.occ:5,5),det:clamp(d.det!==undefined?d.det:5,5),
    action:d.action||'',owner:d.owner||'',dueDate:d.dueDate||'',pctComplete:d.pctComplete||0,
    currPC:d.currPC||'',currDC:d.currDC||'',
    prevAction:d.prevAction||'',detAction:d.detAction||'',
    actionStatus:d.actionStatus||'open',
    rsev:clamp(d.rsev!==undefined?d.rsev:0,0),rocc:clamp(d.rocc!==undefined?d.rocc:0,0),rdet:clamp(d.rdet!==undefined?d.rdet:0,0),
    sourceFile:d.sourceFile||'',sourcePage:d.sourcePage||'',comment:d.comment||'',
    _rowH:d._rowH||52
  };
}
function dl(content, name, type) {
  try {
    var bytes = new TextEncoder().encode(content);
    var blob  = new Blob([bytes], { type: type + ';charset=utf-8' });
    var url   = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  } catch(e) {
    try {
      var a2 = document.createElement('a');
      a2.href = 'data:' + type + ';charset=utf-8,' + encodeURIComponent(content);
      a2.download = name;
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
    } catch(e2) { console.error('Download failed:', e2); }
  }
}

