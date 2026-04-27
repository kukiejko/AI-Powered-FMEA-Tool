window.exportCSV = function(){
  var h = ['#','Process Step','Failure Mode','Effect','Cause','S','O','D','RPN','Recommended Actions','Action Owner','Action Due Date','% Complete','Source File','Source Page','Notes'];
  var b = rows.map(function(r,i){
    return [i+1,'"'+r.step+'"','"'+r.failureMode+'"','"'+r.effect+'"','"'+r.cause+'"',r.sev,r.occ,r.det,rpnVal(r),'"'+r.action+'"','"'+(r.owner||'')+'"','"'+(r.dueDate||'')+'"',(r.pctComplete||0),'"'+r.sourceFile+'"','"'+r.sourcePage+'"','"'+(r.comment||'')+'"'].join(',');
  });
  dl([h.join(',')].concat(b).join('\n'), 'FMEA.csv', 'text/csv');
};

window.exportJSON = function(){
  dl(JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    rows: rows.map(function(r){
      return { step:r.step, failureMode:r.failureMode, effect:r.effect, cause:r.cause, sev:r.sev, occ:r.occ, det:r.det, rpn:rpnVal(r), action:r.action, owner:r.owner, dueDate:r.dueDate, pctComplete:r.pctComplete, sourceFile:r.sourceFile, sourcePage:r.sourcePage, comment:r.comment, _rowH:r._rowH };
    })
  }, null, 2), 'FMEA.json', 'application/json');
};

window.triggerImport = function(){ document.getElementById('importInput').click(); };

window.importJSON = function(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var p = JSON.parse(e.target.result), items = Array.isArray(p) ? p : (p.rows||[]);
      if(!items.length){ setStatus('⚠️ No rows found.','error'); return; }
      showConfirm('Import JSON','Replace current rows with imported data?',function(){
        rows = items.map(function(it){ return newRow(it); });
        renderTable(); scheduleSave(); setStatus('✅ Imported '+rows.length+' rows.','');
      });
    }catch(err){ setStatus('❌ Invalid JSON: '+err.message,'error'); }
    input.value = '';
  };
  reader.readAsText(file);
};
