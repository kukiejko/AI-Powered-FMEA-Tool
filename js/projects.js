async function loadDashboard() {
  var list = await getProjectList();
  var grid = document.getElementById('projGrid');
  var empty = document.getElementById('emptyDash');
  if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  var projects = await Promise.all(list.map(function(id){ return getProject(id); }));
  projects = projects.filter(Boolean);
  grid.innerHTML = projects.map(function(p) {
    var d = new Date(p.updatedAt);
    var dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    return '<div class="proj-card" onclick="openProject(\'' + p.id + '\')">' +
      '<div class="proj-card-name">📋 ' + esc(p.name) + '</div>' +
      '<div class="proj-card-desc">' + esc(p.description || '—') + '</div>' +
      '<div class="proj-card-meta">' +
        '<span>📊 ' + (p.rows ? p.rows.length : 0) + ' failure modes</span>' +
        '<span>'+(p.mode==='advanced'?'🔬 Advanced':'⚡ Simplified')+'</span>' +
        '<span>🕒 ' + dateStr + '</span>' +
      '</div>' +
      '<div class="proj-card-actions" onclick="event.stopPropagation()">' +
        '<button class="btn-xs btn-xs-open" onclick="openProject(\'' + p.id + '\')">Open →</button>' +
        '<button class="btn-xs btn-xs-del"  onclick="deleteProject(\'' + p.id + '\',\'' + esc(p.name) + '\')">Delete</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.openNewProjectModal = function () {
  ['newProjName','newProjId','newProjCompany','newProjLocation','newProjCustomer',
   'newProjProgram','newProjOwner','newProjTeam','newProjDesc'].forEach(function(id){
    document.getElementById(id).value = '';
  });
  document.getElementById('newProjConfidentiality').value = 'Business Use';
  selectMode('simple');
  document.getElementById('newProjModal').classList.add('open');
  setTimeout(function(){ document.getElementById('newProjName').focus(); }, 100);
};
window.closeNewProjectModal = function () { document.getElementById('newProjModal').classList.remove('open'); };

window.createProject = async function () {
  var name = document.getElementById('newProjName').value.trim();
  if (!name) { alert('Project name is required.'); return; }
  var id = 'p' + Date.now();
  var mode = document.querySelector('input[name="fmeaMode"]:checked').value;
  var proj = {
    id: id, name: name, mode: mode, rows: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    description:     document.getElementById('newProjDesc').value.trim(),
    fmeaId:          document.getElementById('newProjId').value.trim(),
    company:         document.getElementById('newProjCompany').value.trim(),
    location:        document.getElementById('newProjLocation').value.trim(),
    customer:        document.getElementById('newProjCustomer').value.trim(),
    program:         document.getElementById('newProjProgram').value.trim(),
    owner:           document.getElementById('newProjOwner').value.trim(),
    confidentiality: document.getElementById('newProjConfidentiality').value,
    team:            document.getElementById('newProjTeam').value.trim(),
  };
  await saveProject(proj);
  var list = await getProjectList();
  list.unshift(id);
  await saveProjectList(list);
  closeNewProjectModal();
  openProject(id);
};

window.openProject = async function (id) {
  var proj = await getProject(id);
  if (!proj) return;
  currentProjectId = id;
  currentMode = proj.mode || 'simple';
  hiddenCols = proj.hiddenCols || {};
  rows = (proj.rows || []).map(function(r){ return Object.assign({ _rowH: 52 }, r); });
  fileTexts = []; fileNames = [];
  document.getElementById('bannerName').textContent = proj.name;
  document.getElementById('bannerDesc').textContent = proj.description || '';
  document.getElementById('bannerSave').textContent = '';
  document.getElementById('manualText').value = '';
  document.getElementById('fileList').innerHTML = '';
  var badge = document.getElementById('modeBadge');
  if (badge) badge.textContent = currentMode === 'advanced' ? '🔬 Advanced' : '⚡ Simplified';
  showScreen('screenWork');
  buildHeader();
  renderTable();
  updateColToggleButtons();
  incidents = [];
  loadIncidents();
  switchTab('upload');
};

window.deleteProject = function (id, name) {
  showConfirm('Delete Project', 'Delete "' + name + '"? This cannot be undone.', async function () {
    var list = await getProjectList();
    list = list.filter(function(x){ return x !== id; });
    await saveProjectList(list);
    try { await Storage.delete(projKey(id)); } catch(e){}
    loadDashboard();
  });
};

window.goToDashboard = function () {
  showScreen('screenDash');
  loadDashboard();
};

async function autoSave() {
  if (!currentProjectId) return;
  var proj = await getProject(currentProjectId);
  if (!proj) return;
  proj.hiddenCols = hiddenCols;
  proj.rows = rows.map(function(r){ return { id:r.id, step:r.step, failureMode:r.failureMode, effect:r.effect, cause:r.cause, sev:r.sev, occ:r.occ, det:r.det, action:r.action, owner:r.owner, dueDate:r.dueDate, pctComplete:r.pctComplete, currPC:r.currPC, currDC:r.currDC, prevAction:r.prevAction, detAction:r.detAction, actionStatus:r.actionStatus, rsev:r.rsev, rocc:r.rocc, rdet:r.rdet, sourceFile:r.sourceFile, sourcePage:r.sourcePage, comment:r.comment, _rowH:r._rowH }; });
  await saveProject(proj);
  var el = document.getElementById('bannerSave');
  el.textContent = '✓ Saved ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  setTimeout(function(){ if(el.textContent.startsWith('✓')) el.textContent = ''; }, 3000);
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(autoSave, 800); }

window.openProjectSettings = async function() {
  var proj = await getProject(currentProjectId);
  if (!proj) return;
  var fields = {
    setProjName: proj.name || '',
    setProjFmeaId: proj.fmeaId || '',
    setProjCompany: proj.company || '',
    setProjLocation: proj.location || '',
    setProjCustomer: proj.customer || '',
    setProjProgram: proj.program || '',
    setProjOwner: proj.owner || '',
    setProjTeam: proj.team || '',
    setProjDesc: proj.description || '',
  };
  Object.keys(fields).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = fields[id];
  });
  document.getElementById('setProjConfidentiality').value = proj.confidentiality || 'Business Use';

  // Populate provider selection
  var providerSel = document.getElementById('settingsProvider');
  if (providerSel) {
    providerSel.value = getProvider();
  }

  // Populate API key field if present
  var apiField = document.getElementById('settingsApiKey');
  if (apiField) apiField.value = getApiKey();

  // Load saved Groq model and max_tokens if applicable
  var groqModelResult = await Storage.get('groqModel:' + (currentUser || ''));
  var groqMaxTokensResult = await Storage.get('groqMaxTokens:' + (currentUser || ''));
  var groqModel = groqModelResult ? groqModelResult.value : '';
  var groqMaxTokens = groqMaxTokensResult ? groqMaxTokensResult.value : '8192';
  var modelSel = document.getElementById('groqModelSelect');
  var tokensSel = document.getElementById('groqMaxTokens');
  if (modelSel && groqModel) {
    modelSel.value = groqModel;
    setTimeout(updateGroqModelPricing, 50);
  }
  if (tokensSel) {
    tokensSel.value = groqMaxTokens;
  }

  // Update UI based on provider
  if (typeof updateSettingsApiKeyUI === 'function') {
    updateSettingsApiKeyUI();
  }

  var d = document.getElementById('setProjDates');
  function rptFmtDate(iso){ if(!iso)return '—'; var d=new Date(iso); return isNaN(d)?iso:d.toLocaleDateString(); }
  function rptFmtDateTime(iso){ if(!iso)return '—'; var d=new Date(iso); if(isNaN(d))return iso; return d.toLocaleString([],{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
  if (d) d.innerHTML = ' FMEA Start: <strong>' + rptFmtDate(proj.createdAt) + '</strong> &nbsp;|&nbsp; Last Revised: <strong>' + rptFmtDateTime(proj.updatedAt) + '</strong> &nbsp;|&nbsp; Mode: <strong>' + (proj.mode === 'advanced' ? '🔬 Advanced' : '⚡ Simplified') + '</strong>';
  document.getElementById('projSettingsModal').classList.add('open');
};

window.closeProjSettings = function() {
  document.getElementById('projSettingsModal').classList.remove('open');
};

window.saveProjSettings = async function() {
  var name = document.getElementById('setProjName').value.trim();
  if (!name) { alert('Project name is required.'); return; }
  var proj = await getProject(currentProjectId);
  if (!proj) return;
  proj.name            = name;
  proj.fmeaId          = document.getElementById('setProjFmeaId').value.trim();
  proj.company         = document.getElementById('setProjCompany').value.trim();
  proj.location        = document.getElementById('setProjLocation').value.trim();
  proj.customer        = document.getElementById('setProjCustomer').value.trim();
  proj.program         = document.getElementById('setProjProgram').value.trim();
  proj.owner           = document.getElementById('setProjOwner').value.trim();
  proj.confidentiality = document.getElementById('setProjConfidentiality').value;
  proj.team            = document.getElementById('setProjTeam').value.trim();
  proj.description     = document.getElementById('setProjDesc').value.trim();

  // Save provider selection
  var providerSel = document.getElementById('settingsProvider');
  if (providerSel) {
    setProvider(providerSel.value);
  }

  // Save API key if field present
  var apiField = document.getElementById('settingsApiKey');
  if (apiField) setApiKey(apiField.value.trim());

  // Save Groq model selection and max_tokens
  var modelSel = document.getElementById('groqModelSelect');
  var tokensSel = document.getElementById('groqMaxTokens');
  if (modelSel && modelSel.value) {
    await Storage.set('groqModel:' + (currentUser || ''), modelSel.value);
  }
  if (tokensSel && tokensSel.value) {
    var tokens = parseInt(tokensSel.value);
    if (tokens > 0 && tokens <= 8192) {
      await Storage.set('groqMaxTokens:' + (currentUser || ''), String(tokens));
    }
  }

  await saveProject(proj);
  document.getElementById('bannerName').textContent = proj.name;
  document.getElementById('bannerDesc').textContent = proj.description || '';
  closeProjSettings();
  var el = document.getElementById('bannerSave');
  el.textContent = '✓ Header saved';
  setTimeout(function(){ el.textContent = ''; }, 2500);
};

window.getGroqModelPricing = function(modelId) {
  var groqModels = {
    'mixtral-8x7b-32768': { inM: 0.24, outM: 0.24, name: 'Mixtral 8x7B (32k)' },
    'llama-3.1-70b-versatile': { inM: 0.59, outM: 0.79, name: 'Llama 3.1 70B' },
    'llama-3.1-8b-instant': { inM: 0.05, outM: 0.1, name: 'Llama 3.1 8B' },
    'llama-3.2-90b-vision-preview': { inM: 0.90, outM: 0.90, name: 'Llama 3.2 90B Vision' },
    'llama-3.2-11b-vision-preview': { inM: 0.06, outM: 0.06, name: 'Llama 3.2 11B Vision' },
    'gemma-7b-it': { inM: 0.07, outM: 0.07, name: 'Gemma 7B' },
    'default': { inM: 0.50, outM: 0.50, name: 'Groq Model' }
  };
  return groqModels[modelId] || groqModels['default'];
};

window.loadGroqModels = async function() {
  var apiField = document.getElementById('settingsApiKey');
  var key = apiField ? apiField.value.trim() : '';
  if (!key) { alert('Enter your Groq API key first to fetch available models.'); return; }

  var modelSel = document.getElementById('groqModelSelect');
  if (modelSel) modelSel.innerHTML = '<option value="">Fetching models...</option>';

  try {
    var resp = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key }
    });
    if (!resp.ok) { alert('❌ Failed to fetch models. Check your API key.'); return; }
    var data = await resp.json();
    if (!data.data || !Array.isArray(data.data)) { alert('❌ Unexpected response format.'); return; }

    if (modelSel) {
      modelSel.innerHTML = '';
      data.data.forEach(function(m) {
        var opt = document.createElement('option');
        opt.value = m.id;
        var pricing = getGroqModelPricing(m.id);
        var priceStr = '$' + pricing.inM.toFixed(2) + '/$' + pricing.outM.toFixed(2);
        opt.textContent = m.id + ' (' + priceStr + '/1M tokens)';
        modelSel.appendChild(opt);
      });
      if (modelSel.options.length === 0) { modelSel.innerHTML = '<option value="">No models available</option>'; }
    }
  } catch(e) {
    alert('❌ Error fetching models: ' + e.message);
    if (modelSel) modelSel.innerHTML = '<option value="">Error loading models</option>';
  }
};

window.updateGroqModelPricing = function() {
  var modelSel = document.getElementById('groqModelSelect');
  var priceDisplay = document.getElementById('groqModelPrice');
  if (!modelSel || !priceDisplay) return;

  var modelId = modelSel.value;
  if (!modelId) {
    priceDisplay.textContent = '';
    return;
  }

  var pricing = getGroqModelPricing(modelId);
  priceDisplay.textContent = pricing.name + ': $' + pricing.inM.toFixed(2) + ' input / $' + pricing.outM.toFixed(2) + ' output per 1M tokens';
};

window.updateSettingsApiKeyUI = function() {
  var provider = document.getElementById('settingsProvider').value;
  var hints = {
    'claude': 'Get free credits at console.anthropic.com',
    'gemini': 'Get free $300 credits at console.cloud.google.com',
    'groq': 'Get free API key at console.groq.com',
    'ollama': 'No API key needed — runs on your machine'
  };
  var labels = {
    'claude': 'Claude API Key',
    'gemini': 'Gemini API Key',
    'groq': 'Groq API Key',
    'ollama': 'Ollama Model'
  };
  var placeholders = {
    'claude': 'sk-ant-…',
    'gemini': 'AIza…',
    'groq': 'gsk_…',
    'ollama': 'mistral'
  };

  var groqModelField = document.getElementById('groqModelField');
  var keyField = document.getElementById('settingsApiKeyField');
  var keyInput = document.getElementById('settingsApiKey');
  var label = document.getElementById('settingsApiLabel');
  var hint = document.getElementById('settingsProviderHint');
  var ollamaNote = document.getElementById('ollamaNote');

  if (provider === 'groq') {
    if (groqModelField) groqModelField.style.display = 'block';
    // Auto-load Groq models if API key is already present
    if (keyInput && keyInput.value.trim()) {
      setTimeout(loadGroqModels, 100);
    }
  } else {
    if (groqModelField) groqModelField.style.display = 'none';
  }

  keyInput.placeholder = placeholders[provider];
  label.textContent = labels[provider];
  if (hint) hint.textContent = hints[provider];
  if (ollamaNote) {
    ollamaNote.style.display = (provider === 'ollama') ? 'block' : 'none';
  }
};

window.testApiConnection = async function() {
  var provider = document.getElementById('settingsProvider').value;
  var apiField = document.getElementById('settingsApiKey');
  if (!apiField) return;
  var key = apiField.value.trim();
  var btn = document.getElementById('testApiBtn');
  if (btn) { btn.textContent = 'Testing…'; btn.disabled = true; }

  try {
    if (provider === 'claude') {
      if (!key) { alert('Enter your Claude API key first.'); return; }
      var resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] })
      });
      var data = await resp.json();
      if (data.error) { alert('❌ Claude API error: ' + data.error.message); }
      else { alert('✅ Claude API key is valid!'); setApiKey(key); }
    } else if (provider === 'gemini') {
      if (!key) { alert('Enter your Gemini API key first.'); return; }
      var resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
      });
      var data = await resp.json();
      if (data.error) { alert('❌ Gemini API error: ' + data.error.message); }
      else { alert('✅ Gemini API key is valid!'); setApiKey(key); }
    } else if (provider === 'groq') {
      if (!key) { alert('Enter your Groq API key first.'); return; }
      var modelSel = document.getElementById('groqModelSelect');
      var model = (modelSel && modelSel.value) ? modelSel.value : 'mixtral-8x7b-32768';
      var resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({ model: model, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] })
      });
      var data = await resp.json();
      if (data.error) { alert('❌ Groq API error: ' + data.error.message); }
      else { alert('✅ Groq API key is valid! Using model: ' + model); setApiKey(key); }
    } else if (provider === 'ollama') {
      var model = key.trim() || 'mistral';
      try {
        var resp = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, prompt: 'Hi', stream: false })
        });
        if (!resp.ok) { alert('❌ Ollama error: ' + resp.statusText); return; }
        var data = await resp.json();
        alert('✅ Ollama is running and model "' + model + '" is available!');
        setApiKey(model);
      } catch(e) {
        alert('❌ Ollama not running at localhost:11434\n\nStart it with: ollama serve');
      }
    }
  } catch(e) {
    alert('❌ Connection failed: ' + e.message);
  } finally {
    if (btn) { btn.textContent = 'Test'; btn.disabled = false; }
  }
};
