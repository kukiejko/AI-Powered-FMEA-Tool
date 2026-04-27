window.closeReport = function() {
  document.getElementById('reportOverlay').style.display = 'none';
};

function rptEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function rptRpnCls(v) {
  return v>=200?'rpt-rpn-crit':v>=100?'rpt-rpn-high':v>=50?'rpt-rpn-med':'rpt-rpn-low';
}
function rptApBadge(s,o,d) {
  var ap = calcAP(s,o,d);
  return '<span class="rpt-ap-'+ap.toLowerCase()+'">'+ap+'</span>';
}
function rptFormatDate(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString();
}
function rptFormatDateTime(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString([], {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function rptFormatTs(ts) {
  if (!ts) return '—';
  var d = new Date(ts);
  return isNaN(d) ? ts : d.toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

function calcAP(s,o,d){
  if(s>=9){return o>=4?'H':(d>=5?'H':'H');}
  if(s>=7){return o>=4?'H':(d>=7?'H':'M');}
  if(s>=5){if(o>=7)return 'H'; if(o>=4)return(d>=6?'H':'M'); return(d>=8?'M':'L');}
  if(s>=3){if(o>=7)return(d>=8?'H':'M'); if(o>=4)return(d>=8?'M':'L'); return 'L';}
  return 'L';
}

function buildFmeaTableHtml(projRows, projIncidents, mode) {
  var adv = mode === 'advanced';
  var hdrs = ['#','Process Step','Failure Mode','Effect','Cause'];
  if (adv) hdrs.push('Current Prevention Control');
  hdrs.push('S');
  if (adv) hdrs.push('Current Detection Control');
  hdrs.push('O','D','RPN');
  if (adv) hdrs.push('AP');
  hdrs.push('Inc.','Action','Owner','Due Date','% Done');
  if (adv) hdrs.push('Status','rS','rO','rD','rRPN');

  var thead = '<tr>' + hdrs.map(function(h){ return '<th>'+h+'</th>'; }).join('') + '</tr>';

  var tbody = projRows.map(function(r, idx) {
    var rv = r.sev*r.occ*r.det;
    var incCount = projIncidents.filter(function(i){ return i.fmeaRowId === r.id; }).length;
    var incNums  = projIncidents.filter(function(i){ return i.fmeaRowId === r.id; })
                    .sort(function(a,b){return(a.num||0)-(b.num||0);})
                    .map(function(i){ return 'INC-'+(i.num||'?'); }).join(', ');
    var rRpn = (r.rsev&&r.rocc&&r.rdet) ? r.rsev*r.rocc*r.rdet : 0;

    var cells = [ idx+1, rptEsc(r.step), rptEsc(r.failureMode), rptEsc(r.effect), rptEsc(r.cause) ];
    if (adv) cells.push(rptEsc(r.currPC||''));
    cells.push(r.sev);
    if (adv) cells.push(rptEsc(r.currDC||''));
    cells.push(r.occ, r.det, '<span class="td-rpn '+rptRpnCls(rv)+'">'+rv+'</span>');
    if (adv) cells.push(rptApBadge(r.sev,r.occ,r.det));
    cells.push(
      incCount ? '<span style="font-weight:700;color:#c05621">'+incCount+(incNums?' ('+incNums+')':'')+'</span>' : '—',
      rptEsc(r.action||r.prevAction||''),
      rptEsc(r.owner||''),
      rptFormatDate(r.dueDate),
      (r.pctComplete||0)+'%'
    );
    if (adv) {
      var statusLabels = {open:'Open',pending:'Decision Pending',impl:'Impl. Pending',done:'Completed',na:'Not Impl.'};
      cells.push(
        statusLabels[r.actionStatus]||r.actionStatus||'Open',
        r.rsev||'—', r.rocc||'—', r.rdet||'—',
        rRpn ? '<span class="td-rpn '+rptRpnCls(rRpn)+'">'+rRpn+'</span>' : '—'
      );
    }
    return '<tr>'+cells.map(function(c){ return '<td>'+c+'</td>'; }).join('')+'</tr>';
  }).join('');

  return '<table class="rpt-table"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>';
}

function buildIncTableHtml(projIncidents, projRows) {
  if (!projIncidents.length) return '<p style="color:#a0aec0;font-size:0.82rem">No incidents recorded.</p>';
  var sorted = projIncidents.slice().sort(function(a,b){ return new Date(a.timestamp)-new Date(b.timestamp); });
  var rowsHtml = sorted.map(function(inc) {
    var linked = inc.fmeaRowId ? projRows.find(function(r){ return r.id===inc.fmeaRowId; }) : null;
    return '<tr>'+
      '<td><strong>INC-'+(inc.num||'?')+'</strong></td>'+
      '<td>'+rptFormatTs(inc.timestamp)+'</td>'+
      '<td>'+rptEsc(inc.description)+'</td>'+
      '<td>'+(linked ? '#'+(projRows.indexOf(linked)+1)+' '+rptEsc(linked.failureMode||linked.step||'') : '—')+'</td>'+
      '<td>'+(inc.fileName?rptEsc(inc.fileName):'—')+'</td>'+
    '</tr>';
  }).join('');
  return '<table class="rpt-inc-table"><thead><tr><th>INC #</th><th>Timestamp</th><th>Description</th><th>Linked FMEA Row</th><th>File</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>';
}

function buildRpnDonutChart(projRows, chartId) {
  var low    = projRows.filter(function(r){ var v=r.sev*r.occ*r.det; return v<50; }).length;
  var med    = projRows.filter(function(r){ var v=r.sev*r.occ*r.det; return v>=50&&v<100; }).length;
  var high   = projRows.filter(function(r){ var v=r.sev*r.occ*r.det; return v>=100&&v<200; }).length;
  var crit   = projRows.filter(function(r){ var v=r.sev*r.occ*r.det; return v>=200; }).length;
  var total  = projRows.length;

  if (!total) return '<div style="color:#a0aec0;font-size:0.82rem;padding:20px;text-align:center">No failure modes to chart.</div>';

  var segments = [
    { label:'Critical ≥200', count:crit, color:'#e53e3e' },
    { label:'High 100–199',  count:high, color:'#ed8936' },
    { label:'Medium 50–99',  count:med,  color:'#ecc94b' },
    { label:'Low <50',       count:low,  color:'#48bb78' }
  ];

  var cx=90, cy=90, r=70, inner=42;
  var svgParts = [];
  var startAngle = -Math.PI/2;

  segments.forEach(function(seg) {
    if (!seg.count) return;
    var angle = (seg.count / total) * 2 * Math.PI;
    var endAngle = startAngle + angle;
    var x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
    var x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
    var ix1=cx+inner*Math.cos(startAngle), iy1=cy+inner*Math.sin(startAngle);
    var ix2=cx+inner*Math.cos(endAngle),   iy2=cy+inner*Math.sin(endAngle);
    var largeArc = angle > Math.PI ? 1 : 0;
    if (total === seg.count) {
      svgParts.push(
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+seg.color+'"/>'+
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+inner+'" fill="white"/>'
      );
    } else {
      svgParts.push(
        '<path d="M '+x1+' '+y1+' A '+r+' '+r+' 0 '+largeArc+' 1 '+x2+' '+y2+
        ' L '+ix2+' '+iy2+' A '+inner+' '+inner+' 0 '+largeArc+' 0 '+ix1+' '+iy1+' Z"'+
        ' fill="'+seg.color+'" stroke="white" stroke-width="2"/>'
      );
    }
    startAngle = endAngle;
  });

  svgParts.push(
    '<text x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" font-size="18" font-weight="700" fill="#1e3a5f">'+total+'</text>'+
    '<text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" font-size="9" fill="#718096">total</text>'
  );

  var svg = '<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">'+svgParts.join('')+'</svg>';

  var legend = segments.map(function(seg) {
    var pct = total ? Math.round(seg.count/total*100) : 0;
    return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">'+
      '<div style="width:13px;height:13px;border-radius:3px;background:'+seg.color+';flex-shrink:0"></div>'+
      '<div style="font-size:0.78rem;color:#2d3748">'+
        '<span style="font-weight:700">'+seg.count+'</span>'+
        '<span style="color:#718096"> ('+pct+'%) </span>'+
        seg.label+
      '</div>'+
    '</div>';
  }).join('');

  return '<div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">'+
    '<div style="flex-shrink:0">'+svg+'</div>'+
    '<div>'+
      '<div style="font-size:0.8rem;font-weight:700;color:#1e3a5f;margin-bottom:10px">RPN Distribution</div>'+
      legend+
    '</div>'+
  '</div>';
}

function buildKpiHtml(projRows, projIncidents) {
  var total    = projRows.length;
  var critical = projRows.filter(function(r){ return r.sev*r.occ*r.det>=200; }).length;
  var highRpn  = projRows.filter(function(r){ var v=r.sev*r.occ*r.det; return v>=100&&v<200; }).length;
  var openAct  = projRows.filter(function(r){ return r.action&&(r.pctComplete||0)<100; }).length;
  var done     = projRows.filter(function(r){ return (r.pctComplete||0)>=100; }).length;
  var incCount = projIncidents.length;
  var avgRpn   = total ? Math.round(projRows.reduce(function(s,r){ return s+r.sev*r.occ*r.det; },0)/total) : 0;
  var maxRpn   = total ? projRows.reduce(function(mx,r){ return Math.max(mx,r.sev*r.occ*r.det); },0) : 0;

  var kpis = '<div class="rpt-kpi-grid">'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+total+'</div><div class="rpt-kpi-lbl">Failure Modes</div></div>'+
    '<div class="rpt-kpi kpi-crit"><div class="rpt-kpi-val">'+critical+'</div><div class="rpt-kpi-lbl">Critical RPN ≥200</div></div>'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+highRpn+'</div><div class="rpt-kpi-lbl">High RPN 100–199</div></div>'+
    '<div class="rpt-kpi kpi-inc"><div class="rpt-kpi-val">'+incCount+'</div><div class="rpt-kpi-lbl">Incidents</div></div>'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+openAct+'</div><div class="rpt-kpi-lbl">Open Actions</div></div>'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+done+'</div><div class="rpt-kpi-lbl">Completed Actions</div></div>'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+avgRpn+'</div><div class="rpt-kpi-lbl">Avg RPN</div></div>'+
    '<div class="rpt-kpi"><div class="rpt-kpi-val">'+maxRpn+'</div><div class="rpt-kpi-lbl">Max RPN</div></div>'+
  '</div>';

  var chart = '<div style="border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px;margin-top:14px;background:#fafafa">'+
    buildRpnDonutChart(projRows)+
  '</div>';

  return kpis + chart;
}

window.printProjectReport = async function() {
  var proj = await getProject(currentProjectId);
  if (!proj) return;

  var storedInc = [];
  try {
    var r = await Storage.get('incidents:'+currentUser+':'+currentProjectId);
    storedInc = r ? JSON.parse(r.value) : [];
    var mx=0; storedInc.forEach(function(i){if(i.num>mx)mx=i.num;}); storedInc.forEach(function(i){if(!i.num){mx++;i.num=mx;}});
  } catch(e){}

  var projRows = (proj.rows||[]);
  var mode = proj.mode || 'simple';
  var now  = new Date().toLocaleString();
  var hdr  = proj;

  var html =
    '<div class="rpt-cover">'+
      '<div style="font-size:2.2rem">📋</div>'+
      '<h1>'+rptEsc(proj.name)+'</h1>'+
      (proj.description ? '<p style="color:#4a5568;max-width:600px;margin:6px auto">'+rptEsc(proj.description)+'</p>' : '')+
      '<div class="rpt-mode-badge" style="margin:10px auto 16px">'+(mode==='advanced'?'🔬 Advanced':'⚡ Simplified')+' Mode &nbsp;|&nbsp; '+(hdr.confidentiality||'Business Use')+'</div>'+
      '<table style="margin:0 auto;border-collapse:collapse;font-size:0.8rem;text-align:left;min-width:420px">'+
        (hdr.fmeaId     ? '<tr><td style="color:#718096;padding:3px 12px 3px 0;white-space:nowrap">FMEA ID</td><td style="font-weight:600;padding:3px 0">'+rptEsc(hdr.fmeaId)+'</td></tr>' : '')+
        (hdr.company    ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Company</td><td style="font-weight:600;padding:3px 0">'+rptEsc(hdr.company)+'</td></tr>' : '')+
        (hdr.location   ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Location</td><td style="padding:3px 0">'+rptEsc(hdr.location)+'</td></tr>' : '')+
        (hdr.customer   ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Customer / Product</td><td style="padding:3px 0">'+rptEsc(hdr.customer)+'</td></tr>' : '')+
        (hdr.program    ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Model / Program</td><td style="padding:3px 0">'+rptEsc(hdr.program)+'</td></tr>' : '')+
        (hdr.owner      ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Process Responsibility</td><td style="font-weight:600;padding:3px 0">'+rptEsc(hdr.owner)+'</td></tr>' : '')+
        (hdr.team       ? '<tr><td style="color:#718096;padding:3px 12px 3px 0">Cross-Functional Team</td><td style="padding:3px 0">'+rptEsc(hdr.team)+'</td></tr>' : '')+
        '<tr><td style="color:#718096;padding:3px 12px 3px 0">FMEA Start Date</td><td style="padding:3px 0">'+rptFormatDate(proj.createdAt)+'</td></tr>'+
        '<tr><td style="color:#718096;padding:3px 12px 3px 0;font-weight:600;color:#c05621">Last Revised</td><td style="font-weight:700;color:#c05621;padding:3px 0">'+rptFormatDateTime(proj.updatedAt)+'</td></tr>'+
      '</table>'+
      '<p style="margin-top:14px;font-size:0.78rem;color:#a0aec0">Report generated: '+now+' &nbsp;|&nbsp; Author: '+rptEsc(currentUser)+'</p>'+
    '</div>'+

    '<div class="rpt-section rpt-avoid-break">'+
      '<div class="rpt-section-title">📊 Summary</div>'+
      buildKpiHtml(projRows, storedInc)+
    '</div>'+

    '<div class="rpt-section">'+
      '<div class="rpt-section-title">🔴 Critical &amp; High Priority Failure Modes (RPN ≥ 100)</div>'+
      (function(){
        var critical = projRows.filter(function(r){ return r.sev*r.occ*r.det>=100; });
        return critical.length ? buildFmeaTableHtml(critical, storedInc, mode) : '<p style="color:#a0aec0;font-size:0.82rem">No critical or high-RPN items.</p>';
      })()+
    '</div>'+

    '<div class="rpt-section rpt-page-break">'+
      '<div class="rpt-section-title">📋 All Failure Modes</div>'+
      (projRows.length ? buildFmeaTableHtml(projRows, storedInc, mode) : '<p style="color:#a0aec0;font-size:0.82rem">No failure modes recorded.</p>')+
    '</div>'+

    '<div class="rpt-section rpt-page-break">'+
      '<div class="rpt-section-title">⚠️ Incident Log ('+storedInc.length+')</div>'+
      buildIncTableHtml(storedInc, projRows)+
    '</div>'+

    '<div class="rpt-footer">'+
      '<span>AI-Powered FMEA Tool — Designed by Andrzej Grzegorczyk</span>'+
      '<span>'+rptEsc(proj.name)+' | Generated '+now+'</span>'+
    '</div>';

  document.getElementById('reportContent').innerHTML = html;
  document.getElementById('reportOverlay').style.display = 'block';
  window.scrollTo(0,0);
};

window.printAllProjectsReport = async function() {
  var list = await getProjectList();
  if (!list.length) { alert('No projects to report on.'); return; }

  var projects = await Promise.all(list.map(function(id){ return getProject(id); }));
  projects = projects.filter(Boolean);

  var now = new Date().toLocaleString();
  var totalRows=0, totalCrit=0, totalInc=0, totalOpen=0;

  var allProjData = await Promise.all(projects.map(async function(p) {
    var incs = [];
    try {
      var r = await Storage.get('incidents:'+currentUser+':'+p.id);
      incs = r ? JSON.parse(r.value) : [];
      var mx=0; incs.forEach(function(i){if(i.num>mx)mx=i.num;}); incs.forEach(function(i){if(!i.num){mx++;i.num=mx;}});
    } catch(e){}
    return { proj: p, rows: p.rows||[], incs: incs };
  }));

  allProjData.forEach(function(d){
    totalRows += d.rows.length;
    totalCrit += d.rows.filter(function(r){ return r.sev*r.occ*r.det>=200; }).length;
    totalInc  += d.incs.length;
    totalOpen += d.rows.filter(function(r){ return r.action&&(r.pctComplete||0)<100; }).length;
  });

  var html =
    '<div class="rpt-cover">'+
      '<div style="font-size:2.2rem">🏭</div>'+
      '<h1>All Projects — FMEA Summary Report</h1>'+
      '<p>Report generated: '+now+' &nbsp;|&nbsp; Author: '+rptEsc(currentUser)+'</p>'+
      '<p>'+projects.length+' projects | '+totalRows+' total failure modes</p>'+
    '</div>'+

    '<div class="rpt-section rpt-avoid-break">'+
      '<div class="rpt-section-title">📊 Global Summary</div>'+
      '<div class="rpt-kpi-grid">'+
        '<div class="rpt-kpi"><div class="rpt-kpi-val">'+projects.length+'</div><div class="rpt-kpi-lbl">Projects</div></div>'+
        '<div class="rpt-kpi"><div class="rpt-kpi-val">'+totalRows+'</div><div class="rpt-kpi-lbl">Total Failure Modes</div></div>'+
        '<div class="rpt-kpi kpi-crit"><div class="rpt-kpi-val">'+totalCrit+'</div><div class="rpt-kpi-lbl">Critical (RPN≥200)</div></div>'+
        '<div class="rpt-kpi kpi-inc"><div class="rpt-kpi-val">'+totalInc+'</div><div class="rpt-kpi-lbl">Total Incidents</div></div>'+
        '<div class="rpt-kpi"><div class="rpt-kpi-val">'+totalOpen+'</div><div class="rpt-kpi-lbl">Open Actions</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="rpt-section">'+
      '<div class="rpt-section-title">📁 Project Overview</div>'+
      allProjData.map(function(d) {
        var p = d.proj, prows = d.rows, pincs = d.incs;
        var crit = prows.filter(function(r){ return r.sev*r.occ*r.det>=200; }).length;
        var high = prows.filter(function(r){ var v=r.sev*r.occ*r.det; return v>=100&&v<200; }).length;
        var open = prows.filter(function(r){ return r.action&&(r.pctComplete||0)<100; }).length;
        var done = prows.filter(function(r){ return (r.pctComplete||0)>=100; }).length;
        return '<div class="rpt-proj-card rpt-avoid-break">'+
          '<div class="rpt-proj-name">📋 '+rptEsc(p.name)+'</div>'+
          '<div class="rpt-proj-meta">'+(p.mode==='advanced'?'🔬 Advanced':'⚡ Simplified')+' &nbsp;|&nbsp; Last updated: <strong>'+rptFormatDateTime(p.updatedAt)+'</strong>'+(p.description?' &nbsp;|&nbsp; '+rptEsc(p.description):'')+' </div>'+
          '<div class="rpt-proj-stats">'+
            '<div><div class="rpt-proj-stat-lbl">Failure Modes</div><div class="rpt-proj-stat-val">'+prows.length+'</div></div>'+
            '<div><div class="rpt-proj-stat-lbl">Critical ≥200</div><div class="rpt-proj-stat-val" style="color:#c53030">'+crit+'</div></div>'+
            '<div><div class="rpt-proj-stat-lbl">High 100–199</div><div class="rpt-proj-stat-val" style="color:#c05621">'+high+'</div></div>'+
            '<div><div class="rpt-proj-stat-lbl">Open Actions</div><div class="rpt-proj-stat-val">'+open+'</div></div>'+
            '<div><div class="rpt-proj-stat-lbl">Completed</div><div class="rpt-proj-stat-val" style="color:#276749">'+done+'</div></div>'+
            '<div><div class="rpt-proj-stat-lbl">Incidents</div><div class="rpt-proj-stat-val" style="color:#b7791f">'+pincs.length+'</div></div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>'+

    allProjData.map(function(d) {
      var p = d.proj, prows = d.rows, pincs = d.incs;
      var mode = p.mode || 'simple';
      var critRows = prows.filter(function(r){ return r.sev*r.occ*r.det>=100; });
      return '<div class="rpt-section rpt-page-break">'+
        '<div class="rpt-section-title">📋 '+rptEsc(p.name)+' — Failure Modes</div>'+
        '<p style="font-size:0.78rem;color:#718096;margin-bottom:12px">Last updated: <strong style="color:#c05621">'+rptFormatDateTime(p.updatedAt)+'</strong> &nbsp;|&nbsp; '+(p.mode==='advanced'?'🔬 Advanced':'⚡ Simplified')+' Mode</p>'+
        buildKpiHtml(prows, pincs)+
        (critRows.length ?
          '<p style="font-size:0.78rem;font-weight:700;color:#c53030;margin-bottom:6px">🔴 High/Critical items (RPN≥100):</p>'+
          buildFmeaTableHtml(critRows, pincs, mode) : '')+
        (prows.length ?
          '<p style="font-size:0.78rem;font-weight:700;color:#2d6a9f;margin:12px 0 6px">All failure modes:</p>'+
          buildFmeaTableHtml(prows, pincs, mode) :
          '<p style="color:#a0aec0;font-size:0.82rem">No failure modes.</p>')+
        (pincs.length ?
          '<p style="font-size:0.78rem;font-weight:700;color:#744210;margin:12px 0 6px">⚠️ Incidents ('+pincs.length+'):</p>'+
          buildIncTableHtml(pincs, prows) : '')+
      '</div>';
    }).join('')+

    '<div class="rpt-footer">'+
      '<span>AI-Powered FMEA Tool — Designed by Andrzej Grzegorczyk</span>'+
      '<span>All Projects Report | Generated '+now+'</span>'+
    '</div>';

  document.getElementById('reportContent').innerHTML = html;
  document.getElementById('reportOverlay').style.display = 'block';
  window.scrollTo(0,0);
};
