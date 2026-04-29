// ── Version & Metadata ──
var APP_VERSION = '1.2.5';
var COMPILE_TIME = '2026-04-29T00:00:00.000000000Z';

// ── Shared mutable state ──
var currentUser = null;
var currentProjectId = null;
var currentMode = 'simple';
var currentProvider = 'groq';
var hiddenCols = {};
var rows = [];
var fileTexts = [];
var fileNames = [];
var incidents = [];
var saveTimer = null;
var confirmCb = null;

// ── Storage abstraction (Supabase-aware) ──
var Storage = {
  get: async function(key) {
    // Try Claude.ai storage first
    if (window.storage && window.storage.get) {
      try { return await window.storage.get(key); } catch(e) {}
    }

    // Try Supabase
    if (typeof supabase !== 'undefined' && currentUserId) {
      try {
        // Parse key pattern to determine table and query
        if (key.startsWith('proj:')) {
          // proj:[user]:[id] → projects table
          var parts = key.split(':');
          var projectId = parts[2];
          var result = await supabaseGet(
            supabase.from('projects').select('*').eq('id', projectId).eq('user_id', currentUserId).single()
          );
          if (result) {
            return { key: key, value: JSON.stringify(result) };
          }
        } else if (key === 'projlist:' + currentUser) {
          // projlist:[user] → list of project IDs
          var projects = await supabaseGet(
            supabase.from('projects').select('id').eq('user_id', currentUserId)
          );
          if (projects) {
            var ids = projects.map(function(p) { return p.id; });
            return { key: key, value: JSON.stringify(ids) };
          }
        } else if (key.startsWith('incidents:')) {
          // incidents:[user]:[projectId] → incidents table
          var parts = key.split(':');
          var projectId = parts[2];
          var incidents = await supabaseGet(
            supabase.from('incidents').select('*').eq('project_id', projectId).eq('user_id', currentUserId)
          );
          if (incidents) {
            return { key: key, value: JSON.stringify(incidents) };
          }
        } else if (key.startsWith('apikey:')) {
          // apikey:[user]:[provider] → api_keys table (decrypted)
          var parts = key.split(':');
          var provider = parts[2];
          var apiKey = await supabaseGet(
            supabase.from('api_keys').select('api_key_encrypted').eq('user_id', currentUserId).eq('provider', provider).single()
          );
          if (apiKey && apiKey.api_key_encrypted) {
            return { key: key, value: decryptApiKey(apiKey.api_key_encrypted) };
          }
        } else if (key.startsWith('provider:') || key.startsWith('groqModel:') || key.startsWith('groqMaxTokens:')) {
          // provider/groqModel/groqMaxTokens → provider_settings table
          var settingName = '';
          if (key.startsWith('provider:')) {
            settingName = 'provider';
          } else if (key.startsWith('groqModel:')) {
            settingName = 'groq_model';
          } else if (key.startsWith('groqMaxTokens:')) {
            settingName = 'groq_max_tokens';
          }

          var setting = await supabaseGet(
            supabase.from('provider_settings')
              .select('setting_value')
              .eq('user_id', currentUserId)
              .eq('setting_name', settingName)
              .single()
          );
          if (setting) {
            return { key: key, value: setting.setting_value };
          }
        }
      } catch (e) {
        console.log('Supabase get error for key', key, ':', e.message);
      }
    }

    // Fallback to localStorage
    var v = localStorage.getItem(key);
    return v !== null ? { key: key, value: v } : null;
  },

  set: async function(key, value) {
    // Try Claude.ai storage first
    if (window.storage && window.storage.set) {
      try { return await window.storage.set(key, value); } catch(e) {}
    }

    // Try Supabase
    if (typeof supabase !== 'undefined' && currentUserId) {
      try {
        if (key.startsWith('proj:')) {
          // proj:[user]:[id] → projects table (upsert)
          // Note: rows are stored in fmea_rows table, not here
          var proj = JSON.parse(value);
          var result = await supabaseQuery(
            supabase.from('projects').upsert({
              id: proj.id,
              user_id: currentUserId,
              name: proj.name,
              mode: proj.mode,
              description: proj.description,
              fmea_id: proj.fmeaId,
              company: proj.company,
              location: proj.location,
              customer: proj.customer,
              program: proj.program,
              owner: proj.owner,
              confidentiality: proj.confidentiality,
              team: proj.team,
              hidden_cols: proj.hiddenCols,
              created_at: proj.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          );
          return { key: key, value: value };
        } else if (key === 'projlist:' + currentUser) {
          // projlist is computed dynamically, don't need to save
          return { key: key, value: value };
        } else if (key.startsWith('apikey:')) {
          // apikey:[user]:[provider] → api_keys table (encrypted)
          var parts = key.split(':');
          var provider = parts[2];
          await supabaseQuery(
            supabase.from('api_keys').upsert({
              user_id: currentUserId,
              provider: provider,
              api_key_encrypted: encryptApiKey(value)
            })
          );
          return { key: key, value: value };
        } else if (key.startsWith('provider:') || key.startsWith('groqModel:') || key.startsWith('groqMaxTokens:')) {
          // provider/groqModel/groqMaxTokens → provider_settings table
          var settingName = '';
          var provider = 'default';
          if (key.startsWith('provider:')) {
            settingName = 'provider';
          } else if (key.startsWith('groqModel:')) {
            settingName = 'groq_model';
            provider = 'groq';
          } else if (key.startsWith('groqMaxTokens:')) {
            settingName = 'groq_max_tokens';
            provider = 'groq';
          }

          await supabaseQuery(
            supabase.from('provider_settings').upsert({
              user_id: currentUserId,
              provider: provider,
              setting_name: settingName,
              setting_value: value
            })
          );
          return { key: key, value: value };
        }
      } catch (e) {
        console.log('Supabase set error for key', key, ':', e.message);
      }
    }

    // Fallback to localStorage
    localStorage.setItem(key, value);
    return { key: key, value: value };
  },

  delete: async function(key) {
    // Try Claude.ai storage first
    if (window.storage && window.storage.delete) {
      try { return await window.storage.delete(key); } catch(e) {}
    }

    // Try Supabase
    if (typeof supabase !== 'undefined' && currentUserId) {
      try {
        if (key.startsWith('proj:')) {
          var parts = key.split(':');
          var projectId = parts[2];
          await supabaseQuery(supabase.from('projects').delete().eq('id', projectId).eq('user_id', currentUserId));
          return { key: key, deleted: true };
        }
      } catch (e) {
        console.log('Supabase delete error for key', key, ':', e.message);
      }
    }

    // Fallback to localStorage
    localStorage.removeItem(key);
    return { key: key, deleted: true };
  }
};

// ── API key helpers (Supabase-aware) ──
function getProvider() {
  return currentProvider || 'groq';
}
function setProvider(provider) {
  currentProvider = provider || 'groq';
  (async function() {
    await Storage.set('provider:' + (currentUser || ''), currentProvider);
  })();
}
function getApiKeyForProvider(provider) {
  provider = provider || getProvider();
  var key = 'apikey:' + (currentUser || '') + ':' + provider;
  // Read from localStorage synchronously (fast, used by analyze/projects)
  return localStorage.getItem(key) || '';
}
function setApiKeyForProvider(provider, key) {
  provider = provider || getProvider();
  var k = 'apikey:' + (currentUser || '') + ':' + provider;
  // Save to localStorage immediately for synchronous reads
  localStorage.setItem(k, key);
  // Also sync to Supabase in background
  (async function() {
    await Storage.set(k, key);
  })();
}
function getApiKey() {
  return getApiKeyForProvider(getProvider());
}
function setApiKey(key) {
  setApiKeyForProvider(getProvider(), key);
}

// Load API keys from Supabase into localStorage cache — runs in background, never blocks login
window.loadApiKeysFromSupabase = function() {
  if (typeof supabase === 'undefined' || !currentUserId) return;
  // Fetch all keys for this user in one query instead of 4 sequential requests
  supabase.from('api_keys')
    .select('provider, api_key_encrypted')
    .eq('user_id', currentUserId)
    .then(function(result) {
      if (result.error || !result.data) return;
      result.data.forEach(function(row) {
        var k = 'apikey:' + (currentUser || '') + ':' + row.provider;
        var decrypted = decryptApiKey(row.api_key_encrypted);
        if (decrypted) localStorage.setItem(k, decrypted);
      });
    });
  // returns immediately — no await
};

// ── Storage key helpers ──
function projKey(id) { return 'proj:' + currentUser + ':' + id; }
function projListKey() { return 'projlist:' + currentUser; }

async function getProjectList() {
  try {
    var r = await Storage.get(projListKey());
    return r ? JSON.parse(r.value) : [];
  } catch(e) {
    console.error('Error getting project list:', e);
    return [];
  }
}
async function saveProjectList(list) {
  // Project list is dynamically computed from projects table, no need to save
  return;
}
async function getProject(id) {
  try {
    var r = await Storage.get(projKey(id));
    if (!r || !r.value) return null;

    var proj = JSON.parse(r.value);
    return proj;
  } catch(e) {
    console.error('Error getting project:', e);
    return null;
  }
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

