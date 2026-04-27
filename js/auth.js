var USERS = { admin: 'fmea2024' };

window.toggleColumn = function(key) {
  hiddenCols[key] = !hiddenCols[key];
  (async function(){
    var proj = await getProject(currentProjectId);
    if (proj) { proj.hiddenCols = hiddenCols; await saveProject(proj); }
  })();
  updateColToggleButtons();
  buildHeader();
  renderTable();
};

function updateColToggleButtons() {
  var causeBtn  = document.getElementById('toggleCauseBtn');
  var actionBtn = document.getElementById('toggleActionBtn');
  if (causeBtn) {
    causeBtn.textContent  = hiddenCols.cause  ? 'Cause ✗' : 'Cause ✓';
    causeBtn.classList.toggle('col-hidden', !!hiddenCols.cause);
  }
  if (actionBtn) {
    actionBtn.textContent = hiddenCols.action ? 'Action ✗' : 'Action ✓';
    actionBtn.classList.toggle('col-hidden', !!hiddenCols.action);
  }
}

window.selectMode = function(mode) {
  currentMode = mode;
  document.getElementById('modeSimple').checked   = (mode === 'simple');
  document.getElementById('modeAdvanced').checked = (mode === 'advanced');
  document.getElementById('modeSimpleCard').classList.toggle('mode-card-active',   mode === 'simple');
  document.getElementById('modeAdvancedCard').classList.toggle('mode-card-active', mode === 'advanced');
};

window.doLogin = function () {
  var u = document.getElementById('loginUser').value.trim();
  var p = document.getElementById('loginPass').value;
  if (USERS[u] && USERS[u] === p) {
    currentUser = u;
    // Read provider selection
    var providerSel = document.getElementById('loginProvider');
    if (providerSel) {
      setProvider(providerSel.value);
    }
    // Read API key if provided on login screen
    var apiField = document.getElementById('loginApiKey');
    if (apiField && apiField.value.trim()) {
      setApiKey(apiField.value.trim());
    }
    document.getElementById('loginErr').textContent = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('dashUserLabel').textContent = '👤 ' + u;
    document.getElementById('workUserLabel').textContent = '👤 ' + u;
    showScreen('screenDash');
    loadDashboard();
  } else {
    document.getElementById('loginErr').textContent = 'Invalid username or password.';
  }
};

window.doLogout = function () {
  currentUser = null;
  currentProjectId = null;
  rows = []; fileTexts = []; fileNames = [];
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showScreen('screenLogin');
};

window.toggleApiKeyVisibility = function(inputId) {
  var input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.updateLoginApiKeyUI = function() {
  var provider = document.getElementById('loginProvider').value;
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

  var keyField = document.getElementById('loginApiKeyField');
  var keyInput = document.getElementById('loginApiKey');
  var label = document.getElementById('loginApiLabel');
  var hint = document.getElementById('loginProviderHint');

  if (provider === 'ollama') {
    keyField.style.display = 'block';
    keyInput.placeholder = placeholders[provider];
    label.textContent = 'Ollama Model (optional — defaults to mistral)';
  } else {
    keyField.style.display = 'block';
    keyInput.placeholder = placeholders[provider];
    label.innerHTML = labels[provider] + ' <span style="font-size:0.72rem;color:#a0aec0;font-weight:400">(optional)</span>';
  }
  if (hint) hint.textContent = hints[provider];
};
