var incFileDataTemp = '';

function incKey() { return 'incidents:' + currentUser + ':' + currentProjectId; }

async function loadIncidents() {
  try {
    var r = await Storage.get(incKey());
    incidents = r ? JSON.parse(r.value) : [];
    var maxNum = 0;
    incidents.forEach(function(i){ if(i.num && i.num > maxNum) maxNum = i.num; });
    incidents.forEach(function(i){ if(!i.num){ maxNum++; i.num = maxNum; } });
  } catch(e) { incidents = []; }
  renderIncidents();
}

async function saveIncidents() {
  if (!currentProjectId) return;
  try {
    var toStore = incidents.map(function(i){ return Object.assign({}, i, {fileData: ''}); });
    await Storage.set(incKey(), JSON.stringify(toStore));
    var el = document.getElementById('bannerSave');
    if (el) {
      el.textContent = '✓ Saved ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      setTimeout(function(){ if(el && el.textContent.startsWith('✓')) el.textContent = ''; }, 3000);
    }
  } catch(e) { console.warn('saveIncidents error:', e); }
}

function renderIncidents() {
  var list = document.getElementById('incList');
  if (!list) return;
  var badge = document.getElementById('incBadge');
  var countLabel = document.getElementById('incCountLabel');

  if (badge) badge.textContent = incidents.length;
  if (countLabel) countLabel.textContent = incidents.length + ' incident' + (incidents.length !== 1 ? 's' : '');

  Array.from(list.querySelectorAll('.inc-card')).forEach(function(el){ el.remove(); });
  var empty = document.getElementById('incEmpty');

  if (!incidents.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  var sorted = incidents.slice().sort(function(a,b){ return new Date(b.timestamp) - new Date(a.timestamp); });

  sorted.forEach(function(inc) {
    var linkedRow = inc.fmeaRowId ? rows.find(function(r){ return r.id === inc.fmeaRowId; }) : null;
    var linkHtml = linkedRow
      ? '<span class="inc-link-badge">🔗 #' + (rows.indexOf(linkedRow)+1) + ' — ' + esc(linkedRow.failureMode || linkedRow.step || 'Row') + '</span>'
      : '<span class="inc-link-none">Not linked</span>';

    var card = document.createElement('div');
    card.className = 'inc-card';
    card.dataset.id = inc.id;
    card.innerHTML =
      '<div><div class="inc-field-label">Incident #</div><div class="inc-ts" style="font-size:1rem;color:#e53e3e">#' + (inc.num||'—') + '</div><div style="font-size:0.75rem;color:#718096;margin-top:2px">' + esc(formatTs(inc.timestamp)) + '</div></div>' +
      '<div><div class="inc-field-label">Description</div><div class="inc-desc">' + esc(inc.description) + '</div>' +
        (inc.fileName ? '<div style="margin-top:5px;font-size:0.74rem;color:#2b6cb0">📎 ' + esc(inc.fileName) + '</div>' : '') +
      '</div>' +
      '<div><div class="inc-field-label">Linked FMEA Row</div>' + linkHtml + '</div>' +
      '<div><div class="inc-field-label">Actions</div><div class="inc-actions">' +
        '<button class="inc-edit-btn" onclick="editIncident(\'' + inc.id + '\')">✏️ Edit</button>' +
        '<button class="inc-del-btn" onclick="deleteIncident(\'' + inc.id + '\')">✕ Delete</button>' +
      '</div></div>';
    list.appendChild(card);
  });
}

function formatTs(ts) {
  if (!ts) return '—';
  var d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleString([], {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

window.openIncidentModal = function(prefillFmeaId) {
  document.getElementById('incModalTitle').textContent = '⚠️ Log Incident';
  document.getElementById('incEditId').value = '';
  var now = new Date();
  now.setSeconds(0,0);
  document.getElementById('incTimestamp').value = now.toISOString().slice(0,16);
  document.getElementById('incDescription').value = '';
  document.getElementById('incFileName').textContent = '';
  document.getElementById('incFileInput').value = '';
  document.getElementById('incErr').textContent = '';
  incFileDataTemp = '';
  populateFmeaLinkSelect(prefillFmeaId || '');
  document.getElementById('incidentModal').classList.add('open');
  setTimeout(function(){ document.getElementById('incDescription').focus(); }, 100);
};

window.closeIncidentModal = function() {
  document.getElementById('incidentModal').classList.remove('open');
};

window.editIncident = function(id) {
  var inc = incidents.find(function(i){ return i.id === id; });
  if (!inc) return;
  document.getElementById('incModalTitle').textContent = '✏️ Edit Incident';
  document.getElementById('incEditId').value = id;
  document.getElementById('incTimestamp').value = inc.timestamp ? inc.timestamp.slice(0,16) : '';
  document.getElementById('incDescription').value = inc.description || '';
  document.getElementById('incFileName').textContent = inc.fileName ? '📎 ' + inc.fileName : '';
  document.getElementById('incErr').textContent = '';
  incFileDataTemp = '';
  populateFmeaLinkSelect(inc.fmeaRowId || '');
  document.getElementById('incidentModal').classList.add('open');
};

function populateFmeaLinkSelect(selectedId) {
  var sel = document.getElementById('incFmeaLink');
  sel.innerHTML = '<option value="">— Not linked —</option>';
  rows.forEach(function(r, idx) {
    var linkedCount = incidents.filter(function(i){ return i.fmeaRowId === r.id; }).length;
    var label = '#' + (idx+1) + ' — ' + (r.failureMode || r.step || 'Row ' + (idx+1));
    var opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = label + (linkedCount ? ' (' + linkedCount + ' incident' + (linkedCount>1?'s':'') + ')' : '');
    if (r.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
  updateFmeaPreview();
}

window.updateFmeaPreview = function() {
  var sel = document.getElementById('incFmeaLink');
  var preview = document.getElementById('incFmeaPreview');
  var rowId = sel.value;
  if (!rowId) { preview.textContent = ''; return; }
  var r = rows.find(function(x){ return x.id === rowId; });
  if (!r) { preview.textContent = ''; return; }
  var rpn = r.sev * r.occ * r.det;
  preview.textContent = 'Step: ' + (r.step||'—') + ' | Effect: ' + (r.effect||'—') + ' | RPN: ' + rpn;
};

window.handleIncFile = function(input) {
  var file = input.files[0];
  if (!file) return;
  document.getElementById('incFileName').textContent = '📎 ' + file.name;
  var reader = new FileReader();
  reader.onload = function(e) { incFileDataTemp = e.target.result; };
  reader.readAsDataURL(file);
};

window.saveIncident = function() {
  try {
    var editId = document.getElementById('incEditId').value;
    var ts = document.getElementById('incTimestamp').value;
    var desc = document.getElementById('incDescription').value.trim();
    var fmeaRowId = document.getElementById('incFmeaLink').value;
    var errEl = document.getElementById('incErr');

    if (!ts) { errEl.textContent = 'Timestamp is required.'; return; }
    if (!desc) { errEl.textContent = 'Description is required.'; return; }

    var fileNameVal = document.getElementById('incFileName').textContent.replace('📎 ','').trim();

    if (editId) {
      var inc = incidents.find(function(i){ return i.id === editId; });
      if (inc) {
        inc.timestamp = ts;
        inc.description = desc;
        inc.fmeaRowId = fmeaRowId || '';
        if (fileNameVal) { inc.fileName = fileNameVal; inc.fileData = incFileDataTemp || inc.fileData; }
      }
    } else {
      var nextNum = incidents.reduce(function(m,i){ return Math.max(m, i.num||0); }, 0) + 1;
      incidents.push({
        id: 'inc' + Date.now(),
        num: nextNum,
        timestamp: ts,
        description: desc,
        fmeaRowId: fmeaRowId || '',
        fileName: fileNameVal || '',
        fileData: incFileDataTemp || ''
      });
    }

    incFileDataTemp = '';
    document.getElementById('incFileInput').value = '';
    closeIncidentModal();
    renderIncidents();
    renderTable();
    saveIncidents();
  } catch(e) { console.error('saveIncident error:', e); }
};

window.deleteIncident = function(id) {
  showConfirm('Delete Incident', 'Remove this incident from the log?', function() {
    incidents = incidents.filter(function(i){ return i.id !== id; });
    renderIncidents();
    renderTable();
    saveIncidents();
  });
};

window.addIncidentFromRow = function(rowId) {
  switchTab('incidents');
  setTimeout(function(){ openIncidentModal(rowId); }, 100);
};

window.exportIncidentsCSV = function() {
  var h = ['Timestamp','Description','Linked FMEA Row','Failure Mode','Effect','RPN','File Attached'];
  var b = incidents.map(function(inc) {
    var r = inc.fmeaRowId ? rows.find(function(x){ return x.id === inc.fmeaRowId; }) : null;
    return [
      '"' + formatTs(inc.timestamp) + '"',
      '"' + (inc.description||'').replace(/"/g,'""') + '"',
      r ? '"#' + (rows.indexOf(r)+1) + '"' : '""',
      r ? '"' + (r.failureMode||'').replace(/"/g,'""') + '"' : '""',
      r ? '"' + (r.effect||'').replace(/"/g,'""') + '"' : '""',
      r ? (r.sev*r.occ*r.det) : '',
      inc.fileName ? '"' + inc.fileName + '"' : '""'
    ].join(',');
  });
  dl([h.join(',')].concat(b).join('\n'), 'Incidents.csv', 'text/csv');
};

window.triggerIncidentImport = function() {
  document.getElementById('incImportInput').value = '';
  document.getElementById('incImportInput').click();
};

window.importIncidents = function(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var parsed = [];

    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        var raw = JSON.parse(text);
        var arr = Array.isArray(raw) ? raw : (raw.incidents || raw.rows || []);
        arr.forEach(function(item) {
          var ts = item.timestamp || item.Timestamp || item.time || item.date || '';
          if (!ts || !isValidTs(ts)) return;
          parsed.push({
            id:          'inc' + Date.now() + Math.random(),
            num:         0,
            timestamp:   normaliseTs(ts),
            description: item.description || item.Description || item.desc || '',
            fmeaRowId:   '',
            fileName:    item.fileName || item.file || '',
            fileData:    ''
          });
        });
      } else {
        var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){ return l.trim(); });
        if (!lines.length) { showImportResult(0, 0, 'File appears empty.'); return; }
        var startRow = 0;
        var headers = lines[0].split(',').map(function(h){ return h.replace(/^"|"$/g,'').trim().toLowerCase(); });
        var tsIdx   = findColIdx(headers, ['timestamp','time','date','datetime']);
        var descIdx = findColIdx(headers, ['description','desc','detail','notes','text','comment']);
        var fileIdx = findColIdx(headers, ['file attached','file','filename','attachment']);
        if (tsIdx !== -1) { startRow = 1; }
        else { tsIdx = 0; descIdx = 1; }

        for (var i = startRow; i < lines.length; i++) {
          var cols = parseCsvLine(lines[i]);
          var ts   = (cols[tsIdx] || '').replace(/^"|"$/g,'').trim();
          if (!ts || !isValidTs(ts)) continue;
          var desc = descIdx !== -1 ? (cols[descIdx] || '').replace(/^"|"$/g,'').trim() : '';
          var fname = fileIdx !== -1 ? (cols[fileIdx] || '').replace(/^"|"$/g,'').trim() : '';
          parsed.push({
            id:          'inc' + Date.now() + Math.random(),
            num:         0,
            timestamp:   normaliseTs(ts),
            description: desc,
            fmeaRowId:   '',
            fileName:    fname && fname !== '""' ? fname : '',
            fileData:    ''
          });
        }
      }
    } catch(err) {
      showImportResult(0, 0, 'Could not parse file: ' + err.message);
      return;
    }

    var skipped = (file.name.toLowerCase().endsWith('.json')
      ? (JSON.parse(text).length || 0)
      : text.replace(/\r/g,'\n').split('\n').filter(Boolean).length - 1) - parsed.length;

    if (!parsed.length) {
      showImportResult(0, skipped, 'No valid incidents found. Every incident must have a timestamp.');
      return;
    }

    showConfirm(
      'Import Incidents',
      'Import ' + parsed.length + ' incident' + (parsed.length !== 1 ? 's' : '') +
      (skipped > 0 ? ' (' + skipped + ' skipped — no valid timestamp)' : '') +
      '? They will be added to existing incidents.',
      function() {
        var maxNum = incidents.reduce(function(m, i){ return Math.max(m, i.num || 0); }, 0);
        parsed.forEach(function(inc) { maxNum++; inc.num = maxNum; });
        incidents = incidents.concat(parsed);
        renderIncidents();
        renderTable();
        saveIncidents();
        showImportResult(parsed.length, skipped, '');
      }
    );
  };
  reader.readAsText(file);
};

function isValidTs(ts) {
  if (!ts || typeof ts !== 'string') return false;
  var d = new Date(ts);
  return !isNaN(d.getTime());
}
function normaliseTs(ts) {
  var d = new Date(ts);
  if (isNaN(d)) return ts;
  var pad = function(n){ return String(n).padStart(2,'0'); };
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
         'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function findColIdx(headers, candidates) {
  for (var c = 0; c < candidates.length; c++) {
    var idx = headers.indexOf(candidates[c]);
    if (idx !== -1) return idx;
  }
  return -1;
}
function parseCsvLine(line) {
  var cols = [], cur = '', inQ = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
    else { cur += ch; }
  }
  cols.push(cur);
  return cols;
}
function showImportResult(imported, skipped, errMsg) {
  var msg = errMsg ||
    '✅ Imported ' + imported + ' incident' + (imported !== 1 ? 's' : '') +
    (skipped > 0 ? '. ' + skipped + ' row' + (skipped !== 1 ? 's' : '') + ' skipped (no valid timestamp).' : '.');
  var label = document.getElementById('incCountLabel');
  if (label) {
    label.textContent = msg;
    label.style.color = errMsg ? '#fc8181' : '#68d391';
    setTimeout(function(){ label.style.color = ''; }, 4000);
  }
}
