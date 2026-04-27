var ALL_COLS = {
  '#':           { key:'#',            label:'#',               px:48,  min:36 },
  'step':        { key:'step',         label:'Process Step',    px:140, min:60 },
  'failureMode': { key:'failureMode',  label:'Failure Mode',    px:160, min:60 },
  'effect':      { key:'effect',       label:'Effect',          px:150, min:60 },
  'cause':       { key:'cause',        label:'Cause',           px:140, min:60 },
  'sev':         { key:'sev',          label:'S',               px:54,  min:40 },
  'occ':         { key:'occ',          label:'O',               px:54,  min:40 },
  'det':         { key:'det',          label:'D',               px:54,  min:40 },
  'rpn':         { key:'rpn',          label:'RPN',             px:64,  min:44 },
  'incCount':    { key:'incCount',     label:'Inc.',            px:52,  min:42, title:'Incidents linked' },
  'sxo':         { key:'sxo',          label:'S×O',             px:52,  min:40, title:'Severity × Occurrence (risk exposure)', adv:true },
  'ap':          { key:'ap',           label:'AP',              px:54,  min:44, title:'Action Priority (AIAG/VDA)', adv:true },
  'source':      { key:'source',       label:'Source',          px:140, min:80, adv:true },
  'currPC':      { key:'currPC',       label:'Current Prevention Control',  px:170, min:80, title:'Existing controls that prevent the failure cause from occurring', adv:true },
  'currDC':      { key:'currDC',       label:'Current Detection Control',   px:170, min:80, title:'Existing controls that detect the failure cause or failure mode', adv:true },
  'prevAction':  { key:'prevAction',   label:'Prevention Action',  px:160, min:60, adv:true },
  'detAction':   { key:'detAction',    label:'Detection Action',   px:160, min:60, adv:true },
  'action':      { key:'action',       label:'Action',             px:160, min:60 },
  'owner':       { key:'owner',        label:'Action Owner',       px:120, min:60 },
  'dueDate':     { key:'dueDate',      label:'Action Due Date',    px:110, min:70 },
  'status':      { key:'status',       label:'Status',             px:120, min:90, adv:true },
  'pctComplete': { key:'pctComplete',  label:'% Complete',         px:90,  min:60 },
  'rsev':        { key:'rsev',         label:'rS',              px:54,  min:40, title:'Revised Severity after action', adv:true },
  'rocc':        { key:'rocc',         label:'rO',              px:54,  min:40, title:'Revised Occurrence after action', adv:true },
  'rdet':        { key:'rdet',         label:'rD',              px:54,  min:40, title:'Revised Detection after action', adv:true },
  'rrpn':        { key:'rrpn',         label:'rRPN',            px:64,  min:44, title:'Revised RPN after action', adv:true },
  'comment':     { key:'comment',      label:'Notes',              px:150, min:60 },
  'incidents':   { key:'incidents',    label:'Incidents',          px:130, min:80 },
  'del':         { key:'del',          label:'',                   px:38,  min:28 },
};

var SIMPLE_ORDER   = ['#','step','failureMode','effect','cause','sev','occ','det','rpn','incCount','action','owner','dueDate','pctComplete','incidents','del'];
var ADVANCED_ORDER = ['#','step','failureMode','effect','cause','currPC','sev','currDC','occ','det','rpn','sxo','ap','incCount','source','prevAction','detAction','action','owner','dueDate','status','pctComplete','rsev','rocc','rdet','rrpn','comment','incidents','del'];

var GREEN_COLS_SIMPLE   = ['action','owner','dueDate','pctComplete'];
var GREEN_COLS_ADVANCED = ['prevAction','detAction','action','owner','dueDate','status','pctComplete','rsev','rocc','rdet','rrpn','comment'];

function getCols() {
  var order = currentMode === 'advanced' ? ADVANCED_ORDER : SIMPLE_ORDER;
  return order
    .filter(function(k){
      if (k === 'cause'  && hiddenCols.cause)  return false;
      if (hiddenCols.action && (k === 'action' || k === 'prevAction' || k === 'detAction')) return false;
      return true;
    })
    .map(function(k){ return ALL_COLS[k]; });
}
function getGreenCols() {
  return currentMode === 'advanced' ? GREEN_COLS_ADVANCED : GREEN_COLS_SIMPLE;
}

var COLS = getCols();
var colResizing = null, rowResizing = null, ROW_MIN_H = 36;

document.addEventListener('DOMContentLoaded', function() {
  var resizeLine = document.getElementById('resizeLine');

  // ── File upload wiring ──
  var dropZone  = document.getElementById('dropZone');
  var fileInput = document.getElementById('fileInput');
  dropZone.addEventListener('click', function(){ fileInput.click(); });
  dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.classList.add('drag'); });
  dropZone.addEventListener('dragleave', function(){ dropZone.classList.remove('drag'); });
  dropZone.addEventListener('drop', function(e){ e.preventDefault(); dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', function(){ handleFiles(fileInput.files); });

  // ── Document size control initialization ──
  if (typeof updateDocSizeDisplay === 'function') {
    updateDocSizeDisplay();
  }

  // ── Column/row resize mouse handlers ──
  document.addEventListener('mousemove', function(e){
    if(colResizing){
      var col = COLS[colResizing.idx];
      col.px = Math.max(col.min, colResizing.startPx + (e.clientX - colResizing.startX));
      resizeLine.style.left = e.clientX + 'px';
      applyColWidths();
      var ths = document.getElementById('headerRow').querySelectorAll('th');
      if(ths[colResizing.idx]) ths[colResizing.idx].style.width = col.px + 'px';
    }
    if(rowResizing){
      var newH = Math.max(ROW_MIN_H, rowResizing.startH + (e.clientY - rowResizing.startY));
      var r = rows.find(function(x){ return x.id === rowResizing.id; });
      if(r) r._rowH = newH;
      var tr = document.querySelector('tr[data-id="' + rowResizing.id + '"]');
      if(tr) tr.querySelectorAll('textarea').forEach(function(ta){ ta.style.minHeight = newH + 'px'; ta.style.height = newH + 'px'; });
    }
  });
  document.addEventListener('mouseup', function(){
    if(colResizing){ colResizing = null; resizeLine.style.display = 'none'; document.body.style.cursor = ''; document.body.style.userSelect = ''; document.querySelectorAll('.col-resizer').forEach(function(h){ h.classList.remove('resizing'); }); }
    if(rowResizing){ rowResizing = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });
});

function applyColWidths(){
  document.getElementById('colGroup').innerHTML = COLS.map(function(c){ return '<col style="width:'+c.px+'px;min-width:'+c.min+'px">'; }).join('');
}

window.startRowResize = function(id, e){
  e.preventDefault(); e.stopPropagation();
  var r = rows.find(function(x){ return x.id === id; });
  rowResizing = { id: id, startY: e.clientY, startH: r ? (r._rowH||52) : 52 };
  document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none';
};

function buildHeader() {
  COLS = getCols();
  var greenCols = getGreenCols();
  var adv = currentMode === 'advanced';
  var tr = document.getElementById('headerRow');
  tr.innerHTML = '';
  var resizeLine = document.getElementById('resizeLine');
  COLS.forEach(function(col, i){
    var th = document.createElement('th');
    th.style.width = col.px + 'px';
    th.style.position = 'sticky';
    th.style.top = '0';
    th.style.zIndex = '10';
    if(greenCols.indexOf(col.key) !== -1){ th.style.background = '#276749'; }
    if(col.adv && adv){ th.classList.add('adv-col'); }
    var lbl = document.createElement('span'); lbl.className = 'th-label'; lbl.textContent = col.label; lbl.title = col.title || col.label;
    th.appendChild(lbl);
    if(i < COLS.length-1){
      var h = document.createElement('div'); h.className = 'col-resizer';
      h.addEventListener('mousedown', function(e){
        e.preventDefault();
        colResizing = { idx: i, startX: e.clientX, startPx: col.px };
        h.classList.add('resizing');
        resizeLine.style.left = e.clientX + 'px'; resizeLine.style.display = 'block';
        document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
      });
      th.appendChild(h);
    }
    tr.appendChild(th);
  });
  applyColWidths();
}

// ── File upload handlers ──
function handleFiles(files){
  Array.from(files).forEach(function(file){
    if(file.type === 'application/pdf'){
      fileNames.push(file.name);
      var r = new FileReader();
      r.onload = function(e){
        var txt = e.target.result || '';
        var readable = txt.replace(/[^\x20-\x7E\n\r\t]/g,'').trim();
        if(readable.length > 200){
          fileTexts.push(readable);
          setStatus('📄 PDF text extracted. Review quality before analyzing.','');
        } else {
          fileTexts.push('');
          setStatus('⚠️ Could not extract text from "'+file.name+'". Please paste the document text manually below.','error');
        }
        renderFileList();
      };
      r.readAsText(file);
    } else {
      var r = new FileReader();
      r.onload = function(e){ fileTexts.push(e.target.result); fileNames.push(file.name); renderFileList(); };
      r.readAsText(file);
    }
  });
}
function renderFileList(){
  document.getElementById('fileList').innerHTML = fileNames.map(function(n,i){
    return '<div class="file-chip">📄 '+esc(n)+'<button onclick="removeFile('+i+')">×</button></div>';
  }).join('');
  updateCostEstimator();
}
window.removeFile = function(i){ fileTexts.splice(i,1); fileNames.splice(i,1); renderFileList(); };

// ── Document size control ──
window.getDocumentSizeLimit = function() {
  var input = document.getElementById('docSizeInput');
  return input ? parseInt(input.value) || 150000 : 150000;
};

window.getDocumentStartChar = function() {
  var input = document.getElementById('docStartChar');
  return input ? Math.max(0, parseInt(input.value) || 0) : 0;
};

window.getAnalysisRange = function() {
  var content = getContent();
  var startChar = getDocumentStartChar();
  var limit = getDocumentSizeLimit();
  var endChar = Math.min(content.length, startChar + limit);
  return {
    start: Math.min(startChar, content.length),
    end: endChar,
    total: content.length,
    text: content.substring(Math.min(startChar, content.length), endChar)
  };
};

window.updateDocSizeDisplay = function() {
  var slider = document.getElementById('docSizeSlider');
  var input = document.getElementById('docSizeInput');
  var startInput = document.getElementById('docStartChar');
  var info = document.getElementById('docSizeInfo');
  var warning = document.getElementById('docSizeWarning');
  var rangeInfo = document.getElementById('docRangeInfo');

  if (!slider || !input) return;
  var limit = parseInt(slider.value);
  input.value = limit;
  var startChar = startInput ? Math.max(0, parseInt(startInput.value) || 0) : 0;

  var range = getAnalysisRange();
  var willTruncate = range.end < range.total;

  if (info) {
    var pct = limit === 150000 ? '100%' : ((limit / 150000) * 100).toFixed(0) + '%';
    info.textContent = 'Total: ' + range.total.toLocaleString() + ' | Analyzing: ' + range.text.length.toLocaleString();
  }

  if (rangeInfo) {
    rangeInfo.textContent = 'Analyzing characters ' + range.start.toLocaleString() + '-' + range.end.toLocaleString() + ' of ' + range.total.toLocaleString();
  }

  if (warning) warning.style.display = willTruncate ? 'block' : 'none';

  updateCostEstimator();
};

window.syncDocSizeInput = function() {
  var input = document.getElementById('docSizeInput');
  var slider = document.getElementById('docSizeSlider');
  if (!input || !slider) return;
  var val = Math.max(1000, Math.min(150000, parseInt(input.value) || 150000));
  input.value = val;
  slider.value = val;
  updateDocSizeDisplay();
};

// ── AP calculation ──
function calcAP(s,o,d){
  if(s>=9){return o>=4?'H':(d>=5?'H':'H');}
  if(s>=7){return o>=4?'H':(d>=7?'H':'M');}
  if(s>=5){if(o>=7)return 'H'; if(o>=4)return(d>=6?'H':'M'); return(d>=8?'M':'L');}
  if(s>=3){if(o>=7)return(d>=8?'H':'M'); if(o>=4)return(d>=8?'M':'L'); return 'L';}
  return 'L';
}
function apBadge(s,o,d){
  var ap = calcAP(s,o,d);
  return '<span class="ap-'+ap.toLowerCase()+'">'+ap+'</span>';
}
function statusSel(id,val){
  var opts=[['open','Open'],['pending','Decision Pending'],['impl','Implementation Pending'],['done','Completed'],['na','Not Implemented']];
  return '<select class="status-sel status-'+val+'" onchange="upd(\''+id+'\',\'actionStatus\',this.value);this.className=\'status-sel status-\'+this.value">'+
    opts.map(function(o){return '<option value="'+o[0]+'"'+(val===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+
  '</select>';
}
function pctCell(r){
  var v=Math.min(100,Math.max(0,parseInt(r.pctComplete)||0));
  var color=v>=100?'#38a169':v>=50?'#ecc94b':'#4299e1';
  return '<div style="display:flex;flex-direction:column;gap:3px">'+
    '<div style="display:flex;align-items:center;gap:4px">'+
      '<input type="number" min="0" max="100" value="'+v+'" style="width:44px;border:1px solid transparent;border-radius:4px;padding:2px 4px;font-size:0.77rem;font-family:inherit;background:transparent;text-align:center" onchange="upd(\''+r.id+'\',\'pctComplete\',this.value)" onfocus="this.style.borderColor=\'#2d6a9f\';this.style.background=\'white\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'">'+
      '<span style="font-size:0.72rem;color:#718096">%</span>'+
    '</div>'+
    '<div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden">'+
      '<div style="height:100%;width:'+v+'%;background:'+color+';border-radius:3px;transition:width 0.3s"></div>'+
    '</div>'+
  '</div>';
}
function rRpnCell(r){
  var rs=r.rsev||0,ro=r.rocc||0,rd=r.rdet||0;
  if(!rs&&!ro&&!rd) return '<div style="color:#a0aec0;font-size:0.74rem;text-align:center">—</div>';
  var rv2=rs*ro*rd;
  return '<div class="rpn-cell '+rpnCls(rv2)+'">'+rv2+'</div>';
}
function numInp(id,field,val,isRevised){
  var minVal=isRevised?0:1;
  var placeholder=isRevised&&!val?'—':'';
  return '<input class="num-input" type="number" min="'+minVal+'" max="10" value="'+(val||'')+'" placeholder="'+placeholder+'" onchange="upd(\''+id+'\',\''+field+'\',this.value)">';
}

function rowIncidents(rowId){ return incidents.filter(function(i){ return i.fmeaRowId === rowId; }); }
function incCountCell(rowId){
  var cnt=rowIncidents(rowId).length;
  if(!cnt) return '<div style="text-align:center;color:#a0aec0;font-size:0.75rem">—</div>';
  var bg=cnt>=5?'#e53e3e':cnt>=3?'#ed8936':cnt>=1?'#ecc94b':'#e2e8f0';
  var fg=cnt>=1?'white':'#4a5568';
  return '<div style="text-align:center"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:'+bg+';color:'+fg+';font-size:0.82rem;font-weight:700;cursor:default" title="'+cnt+' incident'+(cnt!==1?'s':'')+' linked">'+cnt+'</span></div>';
}
function incListCell(rowId){
  var incs=rowIncidents(rowId);
  if(!incs.length) return '<div style="color:#a0aec0;font-size:0.74rem;text-align:center">—</div>';
  return incs.sort(function(a,b){return (a.num||0)-(b.num||0);}).map(function(i){
    return '<span onclick="switchTab(&quot;incidents&quot;)" title="'+esc(i.description)+'" style="display:inline-flex;align-items:center;gap:2px;background:#fff5f5;border:1px solid #fed7d7;border-radius:4px;padding:2px 6px;font-size:0.71rem;font-weight:700;color:#c53030;cursor:pointer;margin:1px 2px 1px 0;white-space:nowrap">⚠️ INC-'+(i.num||'?')+'</span>';
  }).join('');
}

function renderTable(){
  COLS = getCols();
  document.getElementById('emptyState').style.display = rows.length ? 'none' : 'block';
  document.getElementById('rowBadge').textContent = rows.length;
  var adv = currentMode === 'advanced';
  document.getElementById('fmeaBody').innerHTML = rows.map(function(r,i){
    var rv=rpnVal(r), h=r._rowH||52;
    var ta=function(f,v){ return '<textarea onchange="upd(\''+r.id+'\',\''+f+'\',this.value)" style="min-height:'+h+'px;height:'+h+'px">'+esc(v)+'</textarea>'; };
    var cells = '';
    cells += '<td class="row-num"><div class="row-num-inner"><span>'+(i+1)+'</span><div class="row-resizer" onmousedown="startRowResize(\''+r.id+'\',event)" title="Drag to resize">⠿</div></div></td>';
    cells += '<td class="editable">'+ta('step',r.step)+'</td>';
    cells += '<td class="editable">'+ta('failureMode',r.failureMode)+'</td>';
    cells += '<td class="editable">'+ta('effect',r.effect)+'</td>';
    if(!hiddenCols.cause){ cells += '<td class="editable">'+ta('cause',r.cause)+'</td>'; }
    if(adv){ cells += '<td class="editable" style="background:#f0fff4">'+ta('currPC',r.currPC)+'</td>'; }
    cells += '<td class="editable"><input class="num-input" type="number" min="1" max="10" value="'+r.sev+'" onchange="upd(\''+r.id+'\',\'sev\',this.value)"></td>';
    if(adv){ cells += '<td class="editable" style="background:#f0fff4">'+ta('currDC',r.currDC)+'</td>'; }
    cells += '<td class="editable"><input class="num-input" type="number" min="1" max="10" value="'+r.occ+'" onchange="upd(\''+r.id+'\',\'occ\',this.value)"></td>';
    cells += '<td class="editable"><input class="num-input" type="number" min="1" max="10" value="'+r.det+'" onchange="upd(\''+r.id+'\',\'det\',this.value)"></td>';
    cells += '<td><div class="rpn-cell '+rpnCls(rv)+'">'+rv+'</div></td>';
    if(adv){
      cells += '<td class="sxo-cell" style="text-align:center;padding:4px">'+(r.sev*r.occ)+'</td>';
      cells += '<td style="text-align:center;padding:4px">'+apBadge(r.sev,r.occ,r.det)+'</td>';
    }
    cells += '<td style="text-align:center;vertical-align:middle;padding:6px 4px">'+incCountCell(r.id)+'</td>';
    if(adv){
      cells += '<td><div class="source-wrap"><select onchange="upd(\''+r.id+'\',\'sourceFile\',this.value)">'+fileOpts(r.sourceFile)+'</select><div class="source-page">p.<input type="text" placeholder="e.g.14" value="'+esc(r.sourcePage)+'" onchange="upd(\''+r.id+'\',\'sourcePage\',this.value)"></div></div></td>';
      if(!hiddenCols.action){ cells += '<td class="editable">'+ta('prevAction',r.prevAction)+'</td>'; }
      if(!hiddenCols.action){ cells += '<td class="editable">'+ta('detAction',r.detAction)+'</td>'; }
    }
    if(!hiddenCols.action){ cells += '<td class="editable">'+ta('action',r.action)+'</td>'; }
    cells += '<td class="editable">'+ta('owner',r.owner)+'</td>';
    cells += '<td class="editable"><input type="date" style="width:100%;border:1px solid transparent;border-radius:4px;padding:3px 5px;font-size:0.77rem;font-family:inherit;background:transparent;" value="'+esc(r.dueDate)+'" onchange="upd(\''+r.id+'\',\'dueDate\',this.value)"></td>';
    if(adv){ cells += '<td>'+statusSel(r.id,r.actionStatus||'open')+'</td>'; }
    cells += '<td class="editable">'+pctCell(r)+'</td>';
    if(adv){
      cells += '<td class="editable">'+numInp(r.id,'rsev',r.rsev,true)+'</td>';
      cells += '<td class="editable">'+numInp(r.id,'rocc',r.rocc,true)+'</td>';
      cells += '<td class="editable">'+numInp(r.id,'rdet',r.rdet,true)+'</td>';
      cells += '<td>'+rRpnCell(r)+'</td>';
      cells += '<td class="editable">'+ta('comment',r.comment)+'</td>';
    }
    cells += '<td style="vertical-align:top;padding:6px 4px"><div style="display:flex;flex-wrap:wrap;align-content:flex-start;gap:2px">'+incListCell(r.id)+'</div></td>';
    cells += '<td style="vertical-align:top;padding-top:6px"><div style="display:flex;flex-direction:column;gap:3px;align-items:center">';
    cells += '<button class="del-btn" onclick="askDel(\''+r.id+'\')">×</button>';
    cells += '<button style="background:none;border:1px solid #fbd38d;cursor:pointer;color:#b7791f;font-size:0.65rem;padding:2px 4px;border-radius:3px;white-space:nowrap;font-weight:600" onclick="addIncidentFromRow(\''+r.id+'\')">⚠️</button>';
    cells += '</div></td>';
    return '<tr data-id="'+r.id+'">'+cells+'</tr>';
  }).join('');
  if(typeof applySearch === 'function') applySearch();
}

window.upd = function(id, field, val){
  var r = rows.find(function(x){ return x.id === id; });
  if(!r) return;
  r[field] = ['sev','occ','det','rsev','rocc','rdet'].includes(field) ? clamp(val, field.startsWith('r')?0:5) : val;
  if(['sev','occ','det','rsev','rocc','rdet'].includes(field)) renderTable();
  scheduleSave();
};
window.askDel = function(id){
  showConfirm('Delete Row','Remove this failure mode from the FMEA?',function(){
    rows = rows.filter(function(x){ return x.id !== id; });
    renderTable(); scheduleSave();
  });
};
window.addRow = function(){ rows.push(newRow({})); renderTable(); scheduleSave(); };
window.clearAll = function(){
  showConfirm('Clear All','Remove all failure modes from this project?',function(){
    rows = []; renderTable(); scheduleSave(); setStatus('','');
  });
};

var currentRpnFilter = 'all';

window.setRpnFilter = function(filter) {
  currentRpnFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.filter === filter);
  });
  applySearch();
};

window.applySearch = function() {
  var query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  var clearBtn = document.getElementById('searchClearBtn');
  clearBtn.style.display = query ? 'block' : 'none';
  var trs = document.querySelectorAll('#fmeaBody tr');
  var visible = 0, total = rows.length;
  trs.forEach(function(tr){
    var id = tr.dataset.id;
    var row = rows.find(function(r){ return r.id === id; });
    if(!row){ tr.classList.add('search-hidden'); return; }
    var rpn = rpnVal(row);
    var passesRpn = currentRpnFilter === 'all' || rpnCategory(rpn) === currentRpnFilter;
    var passesText = true;
    if(query){
      var haystack = [row.step,row.failureMode,row.effect,row.cause,row.action,row.owner,row.comment,row.sourceFile,row.sourcePage,String(row.sev),String(row.occ),String(row.det),String(rpn)].join(' ').toLowerCase();
      passesText = haystack.indexOf(query) !== -1;
    }
    var show = passesRpn && passesText;
    tr.classList.toggle('search-hidden', !show);
    if(show) visible++;
  });
  var countEl = document.getElementById('searchCount');
  if(query || currentRpnFilter !== 'all'){
    countEl.textContent = visible + ' of ' + total + ' rows';
  } else {
    countEl.textContent = '';
  }
};

window.clearSearch = function() {
  document.getElementById('searchInput').value = '';
  currentRpnFilter = 'all';
  document.querySelectorAll('.filter-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.filter === 'all');
  });
  applySearch();
};
