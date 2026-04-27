var reviewItems = [];

function openReview(items) {
  reviewItems = items.map(function(it) {
    return { item: it, state: 'pending', edited: JSON.parse(JSON.stringify(it)) };
  });
  renderReview();
  document.getElementById('reviewOverlay').classList.add('open');
  document.getElementById('reviewOverlay').scrollTop = 0;
}

window.closeReview = function() {
  document.getElementById('reviewOverlay').classList.remove('open');
};

function updateReviewProgress() {
  var total    = reviewItems.length;
  var accepted = reviewItems.filter(function(r){ return r.state === 'accepted'; }).length;
  var rejected = reviewItems.filter(function(r){ return r.state === 'rejected'; }).length;
  var reviewed = accepted + rejected;
  var pct      = total ? Math.round(reviewed / total * 100) : 0;

  document.getElementById('revProgressTxt').textContent  = reviewed + ' of ' + total + ' reviewed';
  document.getElementById('revAcceptedTxt').textContent  = accepted + ' accepted';
  document.getElementById('revProgressFill').style.width = pct + '%';

  var btnLbl = 'Add Accepted to FMEA';
  if (accepted > 0) btnLbl = '✅ Add ' + accepted + ' to FMEA';
  document.getElementById('reviewConfirmBtn').textContent = btnLbl;
  document.getElementById('reviewConfirmBtn').disabled = accepted === 0;

  document.getElementById('reviewFooterStats').innerHTML =
    '<strong>'+accepted+'</strong> accepted &nbsp;·&nbsp; ' +
    '<strong>'+rejected+'</strong> rejected &nbsp;·&nbsp; ' +
    '<strong>'+(total-reviewed)+'</strong> pending';
}

function rpnClsRev(v){ return v>=200?'rpn-critical':v>=100?'rpn-high':v>=50?'rpn-med':'rpn-low'; }

function renderReview() {
  var body = document.getElementById('reviewBody');
  body.innerHTML = reviewItems.map(function(ri, idx) {
    var it  = ri.edited;
    var rpn = (it.sev||5) * (it.occ||5) * (it.det||5);
    var cls = ri.state === 'accepted' ? 'accepted' : ri.state === 'rejected' ? 'rejected' : '';
    var isEditing = ri.state === 'editing';
    if (isEditing) cls = 'editing';

    var acceptActive = ri.state === 'accepted' ? 'active' : '';
    var editActive   = isEditing               ? 'active' : '';
    var rejectActive = ri.state === 'rejected' ? 'active' : '';

    var bodyHtml;
    if (isEditing) {
      bodyHtml =
        '<div class="review-card-body" style="grid-template-columns:1fr 1fr 1fr">' +
          '<div class="review-field review-field-edit"><div class="review-field-label">Process Step</div><textarea id="re_step_'+idx+'" rows="2">'+esc(it.step||'')+'</textarea></div>' +
          '<div class="review-field review-field-edit"><div class="review-field-label">Failure Mode</div><textarea id="re_fm_'+idx+'" rows="2">'+esc(it.failureMode||'')+'</textarea></div>' +
          '<div class="review-field review-field-edit"><div class="review-field-label">Effect</div><textarea id="re_eff_'+idx+'" rows="2">'+esc(it.effect||'')+'</textarea></div>' +
          '<div class="review-field review-field-edit"><div class="review-field-label">Cause</div><textarea id="re_cause_'+idx+'" rows="2">'+esc(it.cause||'')+'</textarea></div>' +
          '<div class="review-field review-field-edit"><div class="review-field-label">Action</div><textarea id="re_act_'+idx+'" rows="2">'+esc(it.action||'')+'</textarea></div>' +
          '<div class="review-field review-field-edit"><div class="review-field-label">S / O / D</div>' +
            '<div class="review-scores">' +
              'S<input class="review-score-inp" type="number" min="1" max="10" id="re_sev_'+idx+'" value="'+(it.sev||5)+'">' +
              'O<input class="review-score-inp" type="number" min="1" max="10" id="re_occ_'+idx+'" value="'+(it.occ||5)+'">' +
              'D<input class="review-score-inp" type="number" min="1" max="10" id="re_det_'+idx+'" value="'+(it.det||5)+'">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:8px 16px 14px;display:flex;justify-content:flex-end;gap:8px">' +
          '<button class="rbtn" style="background:#e2e8f0;color:#4a5568" onclick="reviewCancelEdit('+idx+')">Cancel</button>' +
          '<button class="rbtn rbtn-accept" onclick="reviewSaveEdit('+idx+')">✓ Save &amp; Accept</button>' +
        '</div>';
    } else {
      bodyHtml =
        '<div class="review-card-body">' +
          '<div class="review-field"><div class="review-field-label">Process Step</div><div class="review-field-val">'+esc(it.step||'—')+'</div></div>' +
          '<div class="review-field"><div class="review-field-label">Failure Mode</div><div class="review-field-val">'+esc(it.failureMode||'—')+'</div></div>' +
          '<div class="review-field"><div class="review-field-label">Effect</div><div class="review-field-val">'+esc(it.effect||'—')+'</div></div>' +
          '<div class="review-field"><div class="review-field-label">Cause</div><div class="review-field-val">'+esc(it.cause||'—')+'</div></div>' +
          '<div class="review-field"><div class="review-field-label">Action</div><div class="review-field-val">'+esc(it.action||'—')+'</div></div>' +
        '</div>';
    }

    return '<div class="review-card '+cls+'" id="rcard_'+idx+'">' +
      '<div class="review-card-header">' +
        '<div class="review-card-num">'+(idx+1)+'</div>' +
        '<div class="review-card-title">'+esc(it.failureMode||'Unnamed failure mode')+'</div>' +
        '<span class="review-card-rpn '+rpnClsRev(rpn)+'" style="border-radius:5px;padding:2px 8px;font-size:0.75rem;font-weight:700">RPN '+rpn+'</span>' +
        '<div class="review-card-btns">' +
          '<button class="rbtn rbtn-accept '+acceptActive+'" onclick="reviewSetState('+idx+',\'accepted\')">✓ Accept</button>' +
          '<button class="rbtn rbtn-edit '+editActive+'"   onclick="reviewStartEdit('+idx+')">✏ Edit</button>' +
          '<button class="rbtn rbtn-reject '+rejectActive+'" onclick="reviewSetState('+idx+',\'rejected\')">&#x2715; Reject</button>' +
        '</div>' +
      '</div>' +
      bodyHtml +
    '</div>';
  }).join('');

  updateReviewProgress();
}

function renderReviewCard(idx) {
  var ri = reviewItems[idx];
  var it = ri.edited;
  var rpn = (it.sev||5)*(it.occ||5)*(it.det||5);
  var cls = ri.state === 'accepted' ? 'accepted' : ri.state === 'rejected' ? 'rejected' : '';
  var acceptActive = ri.state==='accepted'?'active':'';
  var rejectActive = ri.state==='rejected'?'active':'';
  return '<div class="review-card '+cls+'" id="rcard_'+idx+'">' +
    '<div class="review-card-header">' +
      '<div class="review-card-num">'+(idx+1)+'</div>' +
      '<div class="review-card-title">'+esc(it.failureMode||'Unnamed')+'</div>' +
      '<span class="review-card-rpn '+rpnClsRev(rpn)+'" style="border-radius:5px;padding:2px 8px;font-size:0.75rem;font-weight:700">RPN '+rpn+'</span>' +
      '<div class="review-card-btns">' +
        '<button class="rbtn rbtn-accept '+acceptActive+'" onclick="reviewSetState('+idx+',\'accepted\')">✓ Accept</button>' +
        '<button class="rbtn rbtn-edit" onclick="reviewStartEdit('+idx+')">✏ Edit</button>' +
        '<button class="rbtn rbtn-reject '+rejectActive+'" onclick="reviewSetState('+idx+',\'rejected\')">&#x2715; Reject</button>' +
      '</div>' +
    '</div>' +
    '<div class="review-card-body">' +
      '<div class="review-field"><div class="review-field-label">Process Step</div><div class="review-field-val">'+esc(it.step||'—')+'</div></div>' +
      '<div class="review-field"><div class="review-field-label">Failure Mode</div><div class="review-field-val">'+esc(it.failureMode||'—')+'</div></div>' +
      '<div class="review-field"><div class="review-field-label">Effect</div><div class="review-field-val">'+esc(it.effect||'—')+'</div></div>' +
      '<div class="review-field"><div class="review-field-label">Cause</div><div class="review-field-val">'+esc(it.cause||'—')+'</div></div>' +
      '<div class="review-field"><div class="review-field-label">Action</div><div class="review-field-val">'+esc(it.action||'—')+'</div></div>' +
    '</div>' +
  '</div>';
}

window.reviewSetState = function(idx, state) {
  if (reviewItems[idx].state === 'editing') return;
  reviewItems[idx].state = state;
  var tmp = document.createElement('div');
  tmp.innerHTML = renderReviewCard(idx);
  var card = document.getElementById('rcard_'+idx);
  if (card) card.replaceWith(tmp.firstChild);
  updateReviewProgress();
};

window.reviewStartEdit = function(idx) {
  reviewItems[idx].state = 'editing';
  renderReview();
  setTimeout(function(){ var el=document.getElementById('re_step_'+idx); if(el) el.focus(); }, 50);
};

window.reviewCancelEdit = function(idx) {
  reviewItems[idx].state = 'pending';
  renderReview();
};

window.reviewSaveEdit = function(idx) {
  var ri = reviewItems[idx];
  ri.edited.step        = document.getElementById('re_step_'+idx).value.trim();
  ri.edited.failureMode = document.getElementById('re_fm_'+idx).value.trim();
  ri.edited.effect      = document.getElementById('re_eff_'+idx).value.trim();
  ri.edited.cause       = document.getElementById('re_cause_'+idx).value.trim();
  ri.edited.action      = document.getElementById('re_act_'+idx).value.trim();
  ri.edited.sev = Math.min(10,Math.max(1,parseInt(document.getElementById('re_sev_'+idx).value)||5));
  ri.edited.occ = Math.min(10,Math.max(1,parseInt(document.getElementById('re_occ_'+idx).value)||5));
  ri.edited.det = Math.min(10,Math.max(1,parseInt(document.getElementById('re_det_'+idx).value)||5));
  ri.state = 'accepted';
  renderReview();
};

window.reviewAcceptAll = function() {
  reviewItems.forEach(function(ri){ if(ri.state !== 'editing') ri.state = 'accepted'; });
  renderReview();
};

window.reviewRejectAll = function() {
  reviewItems.forEach(function(ri){ if(ri.state !== 'editing') ri.state = 'rejected'; });
  renderReview();
};

window.confirmReview = function() {
  var accepted = reviewItems.filter(function(ri){ return ri.state === 'accepted'; });
  if (!accepted.length) return;

  var existing = rows.length;
  if (existing > 0) {
    showConfirm(
      'Add to FMEA',
      'Add ' + accepted.length + ' accepted failure modes to the existing ' + existing + ' rows?  (Cancel to replace all existing rows)',
      function() {
        accepted.forEach(function(ri){ rows.push(newRow(ri.edited)); });
        finishReview(accepted.length, 'appended');
      }
    );
    document.getElementById('confirmNo').textContent = 'Replace All';
    document.getElementById('confirmNo').onclick = function() {
      document.getElementById('confirmOverlay').classList.remove('open');
      rows = accepted.map(function(ri){ return newRow(ri.edited); });
      finishReview(accepted.length, 'replaced');
    };
  } else {
    rows = accepted.map(function(ri){ return newRow(ri.edited); });
    finishReview(accepted.length, 'added');
  }
};

function finishReview(count, mode) {
  closeReview();
  buildHeader();
  renderTable();
  scheduleSave();
  var usage = window._lastAnalyzeUsage || {};
  var actualIn  = usage.input_tokens  || 0;
  var actualOut = usage.output_tokens || 0;
  var actualCost = ((actualIn/1e6)*3.00) + ((actualOut/1e6)*15.00);
  function fmtC(c){ return c<0.001?'<$0.001':c<0.01?'$'+c.toFixed(4):c<0.1?'$'+c.toFixed(3):'$'+c.toFixed(2); }
  var costStr = actualIn ? ' · Tokens: '+actualIn.toLocaleString()+' in / '+actualOut.toLocaleString()+' out · Cost: '+fmtC(actualCost) : '';
  setStatus('✅ '+count+' failure modes '+mode+' to FMEA.'+costStr, '');
  switchTab('fmea');
}

// ── Cost Estimator ──
var PROMPT_OVERHEAD_CHARS = 680;
var DOC_CAP_CHARS = 150000;
var EST_OUTPUT_TOKENS = 20 * 120;

function getGroqModelPricing(modelId) {
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
}

function getPricingForProvider(provider) {
  var pricing = {
    'claude':  { inM: 3.00, outM: 15.00, model: 'claude-sonnet-4-20250514' },
    'gemini':  { inM: 1.25, outM: 5.00,  model: 'gemini-1.5-flash' },
    'groq':    { inM: 0.00, outM: 0.00,  model: 'selected model (free tier)' },
    'ollama':  { inM: 0.00, outM: 0.00,  model: 'local (free)' }
  };
  return pricing[provider] || pricing['claude'];
}

function getMaxTokensForProvider(provider) {
  var limits = {
    'claude':  12000,
    'gemini':  8192,
    'groq':    parseInt(localStorage.getItem('groqMaxTokens:' + (currentUser || '')) || '8192'),
    'ollama':  12000
  };
  return limits[provider] || 12000;
}

function getGroqModel() {
  var modelSel = document.getElementById('groqModelSelect');
  return (modelSel && modelSel.value) ? modelSel.value : 'mixtral-8x7b-32768';
}

function charsToTokens(chars) { return Math.ceil(chars / 4); }

function updateCostEstimator() {
  var bar = document.getElementById('costBar');
  if (!bar) return;
  var content = getContent();
  if (!content) {
    bar.innerHTML = '<span class="cost-bar-empty">Add a document above to see estimated token usage and cost.</span>';
    return;
  }
  var provider = getProvider();
  var pricing = getPricingForProvider(provider);

  // For Groq, use selected model's pricing
  if (provider === 'groq' && typeof getGroqModel === 'function') {
    var groqModel = getGroqModel();
    var groqPricing = getGroqModelPricing(groqModel);
    pricing = groqPricing;
  }

  var analysisRange = typeof getAnalysisRange === 'function' ? getAnalysisRange() : null;
  var docChars = analysisRange ? analysisRange.text.length : Math.min(content.length, 150000);
  var totalChars  = PROMPT_OVERHEAD_CHARS + docChars;
  var inputTokens = charsToTokens(totalChars);
  var outputTokens = EST_OUTPUT_TOKENS;
  var totalTokens = inputTokens + outputTokens;
  var inputCost   = (inputTokens  / 1e6) * pricing.inM;
  var outputCost  = (outputTokens / 1e6) * pricing.outM;
  var totalCost   = inputCost + outputCost;
  var coverage    = analysisRange ? Math.min(100, Math.round((analysisRange.text.length / content.length) * 100)) : 100;
  var fillColor   = coverage >= 100 ? '#48bb78' : coverage >= 60 ? '#ecc94b' : '#fc8181';
  var truncated   = analysisRange ? (analysisRange.end < analysisRange.total) : false;
  var docLimit = analysisRange ? (analysisRange.end - analysisRange.start) : 150000;
  function fmtCost(c){ if(c<0.001)return '<$0.001'; if(c<0.01)return '$'+c.toFixed(4); if(c<0.1)return '$'+c.toFixed(3); return '$'+c.toFixed(2); }
  function fmtTokens(t){ return t>=1000?(t/1000).toFixed(1)+'k':String(t); }
  var modelDisplay = pricing.name || pricing.model;
  var rateDisplay = (pricing.inM === 0 && pricing.outM === 0) ? '(Free)' : '$' + pricing.inM.toFixed(2) + ' / M input · $' + pricing.outM.toFixed(2) + ' / M output';
  bar.innerHTML =
    '<div class="cost-stat"><div class="cost-stat-val">'+fmtTokens(inputTokens)+'</div><div class="cost-stat-lbl">Input tokens</div></div>'+
    '<div class="cost-divider"></div>'+
    '<div class="cost-stat"><div class="cost-stat-val">'+fmtTokens(outputTokens)+'</div><div class="cost-stat-lbl">Est. output tokens</div></div>'+
    '<div class="cost-divider"></div>'+
    '<div class="cost-stat"><div class="cost-stat-val" style="color:#2d6a9f">'+fmtTokens(totalTokens)+'</div><div class="cost-stat-lbl">Total tokens</div></div>'+
    '<div class="cost-divider"></div>'+
    '<div class="cost-stat"><div class="cost-stat-val" style="color:#276749;font-size:1.2rem">'+fmtCost(totalCost)+'</div><div class="cost-stat-lbl">Est. cost (USD)</div></div>'+
    '<div class="cost-meter">'+
      '<div class="cost-meter-label"><span>Document coverage</span><span style="font-weight:700;color:'+fillColor+'">'+coverage+'%</span></div>'+
      '<div class="cost-meter-bar"><div class="cost-meter-fill" style="width:'+coverage+'%;background:'+fillColor+'"></div></div>'+
    '</div>'+
    '<div class="cost-tip">'+
      '<strong>Provider:</strong> ' + provider + ' · <strong>Model:</strong> ' + modelDisplay + ' · <strong>Rate:</strong> ' + rateDisplay +
      (truncated
        ? ' &nbsp;|&nbsp; <span style="color:#e53e3e">⚠ Document exceeds ' + docLimit.toLocaleString() + ' characters. Only the first ' + docLimit.toLocaleString() + ' characters will be analyzed.</span>'
        : ' &nbsp;|&nbsp; <span style="color:#276749">✓ Full document fits within limit.</span>')+
    '</div>';
}
window.updateCostEstimator = updateCostEstimator;

// ── Analyze ──
window.analyze = function(){
  var combined = getContent();
  if(!combined){ setStatus('Please upload a file or paste text first.','error'); return; }

  var provider = getProvider();
  var apiKey = getApiKey();
  if(!apiKey && provider !== 'ollama'){
    setStatus('❌ Enter your ' + provider + ' API key in Settings (⚙ Header button) to enable AI analysis.','error');
    return;
  }

  setStatus('<span class="spinner"></span> Analyzing document...','loading');
  document.getElementById('analyzeBtn').disabled = true;

  var analysisRange = typeof getAnalysisRange === 'function' ? getAnalysisRange() : null;
  var docText = analysisRange ? analysisRange.text : combined.substring(0, 150000);
  var docLimit = analysisRange ? analysisRange.end - analysisRange.start : 150000;

  var prompt =
    'You are a senior FMEA engineer. Analyze the technical document below and identify failure modes.\n\n'+
    'Rules:\n'+
    '1. Find 15 to 25 failure modes covering all major subsystems.\n'+
    '2. For every DANGER, WARNING, CAUTION notice — create at least one failure mode.\n'+
    '3. Return ONLY a raw JSON array. No markdown. No explanation. No code fences. Start with [ and end with ].\n\n'+
    'Each array item must have exactly these keys:\n'+
    '{"step":"...","failureMode":"...","effect":"...","cause":"...","sev":7,"occ":5,"det":5,"action":"...","sourceFile":"","sourcePage":""}\n\n'+
    'Severity sev 1-10: 10=death or total loss, 7=major damage, 4=minor issue, 1=no effect.\n'+
    'Occurrence occ 1-10: 10=happens daily, 5=occasionally, 1=extremely rare.\n'+
    'Detection det 1-10: 10=impossible to detect, 5=needs effort, 1=automatic alarm.\n\n'+
    'DOCUMENT:\n'+docText;

  var maxTokens = getMaxTokensForProvider(provider);
  var fetchPromise;
  if (provider === 'claude') {
    fetchPromise = fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } else if (provider === 'gemini') {
    fetchPromise = fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
  } else if (provider === 'groq') {
    var groqModel = getGroqModel();
    fetchPromise = fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: groqModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } else if (provider === 'ollama') {
    var model = apiKey.trim() || 'mistral';
    fetchPromise = fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model, prompt: prompt, stream: false })
    });
  }

  fetchPromise
  .then(function(r){ return r.json(); })
  .then(function(d){
    var raw;
    if (provider === 'claude') {
      if(d.error){ setStatus('❌ Claude API error: '+d.error.message,'error'); return; }
      raw = d.content.map(function(b){ return b.text||''; }).join('').trim();
    } else if (provider === 'gemini') {
      if(d.error){ setStatus('❌ Gemini API error: '+d.error.message,'error'); return; }
      raw = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts && d.candidates[0].content.parts[0]) ? d.candidates[0].content.parts[0].text || '' : '';
    } else if (provider === 'groq') {
      if(d.error){ setStatus('❌ Groq API error: '+d.error.message,'error'); return; }
      raw = (d.choices && d.choices[0] && d.choices[0].message) ? d.choices[0].message.content || '' : '';
    } else if (provider === 'ollama') {
      if(d.error){ setStatus('❌ Ollama error: '+d.error,'error'); return; }
      raw = d.response || '';
    }

    raw = raw.replace(/^```[a-z]*\n?/i,'').replace(/\n?```$/,'').trim();
    var start = raw.indexOf('[');
    var end   = raw.lastIndexOf(']');
    if(start===-1||end===-1){ setStatus('❌ No JSON array found in response. Try again.','error'); console.error('Raw response:',raw); return; }
    raw = raw.substring(start, end+1);
    var items;
    try{ items = JSON.parse(raw); }
    catch(e){
      var lb = raw.lastIndexOf('},');
      if(lb!==-1){ try{ items=JSON.parse(raw.substring(0,lb+1)+']'); } catch(e2){ items=[]; } }
      else{ items=[]; }
    }
    if(!items||!items.length){ setStatus('❌ AI returned 0 items. Check console for details.','error'); console.error('Parsed empty. Raw:',raw); return; }

    var costMsg = '';
    if (provider === 'claude') {
      window._lastAnalyzeUsage = d.usage || {};
      var actualIn  = (d.usage||{}).input_tokens  || 0;
      var actualOut = (d.usage||{}).output_tokens || 0;
      var actualCost = ((actualIn/1e6)*3.00)+((actualOut/1e6)*15.00);
      function fmtC(c){ return c<0.001?'<$0.001':c<0.01?'$'+c.toFixed(4):c<0.1?'$'+c.toFixed(3):'$'+c.toFixed(2); }
      costMsg = ' · Tokens: '+actualIn.toLocaleString()+' in / '+actualOut.toLocaleString()+' out · Cost: '+fmtC(actualCost);
    }
    setStatus('✅ '+items.length+' failure modes generated ('+provider+')'+costMsg+'. Review before adding to FMEA →','');
    openReview(items);
  })
  .catch(function(e){ setStatus('❌ '+provider+' error: '+(e.message||'Unknown'),'error'); console.error(e); })
  .finally(function(){ document.getElementById('analyzeBtn').disabled = false; });
};
