(() => {
  const STORAGE_KEY = 'studentTaskManager.tasks';

  const seedTasks = () => ([
    { id: cryptoId(), name: 'Math Assignment 3 — Ch. 6 problems', date: '2026-08-06', priority: 'high', notes: 'Bring calculator + formula sheet', completed: false },
    { id: cryptoId(), name: 'Group Project Meeting Notes', date: '2026-08-09', priority: 'medium', notes: 'Confirm room booking with Priya', completed: false },
    { id: cryptoId(), name: 'Read Chapter 5 — Biology', date: '2026-08-07', priority: 'medium', notes: '', completed: false },
    { id: cryptoId(), name: 'Submit Lab Report 2', date: '2026-08-03', priority: 'low', notes: '', completed: false },
    { id: cryptoId(), name: 'Register for Fall Electives', date: '2026-08-01', priority: 'high', notes: 'Check prerequisite for MATH204', completed: true },
  ]);

  function cryptoId(){
    return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  }

  function loadTasks(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return seedTasks();
    try{
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
    }catch(e){}
    return seedTasks();
  }

  function saveTasks(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  let tasks = loadTasks();
  let statusFilter = 'all'; // all | incomplete | completed
  let priorityFilter = 'all'; // all | high | medium | low
  let editingId = null;

  const els = {
    form: document.getElementById('taskForm'),
    nameInput: document.getElementById('taskName'),
    dateInput: document.getElementById('taskDate'),
    priorityInput: document.getElementById('taskPriority'),
    notesInput: document.getElementById('taskNotes'),
    priorityDot: document.getElementById('priorityDot'),
    list: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    tabs: document.getElementById('filterTabs'),
    priorityBar: document.getElementById('priorityFilterBar'),
    dialogOverlay: document.getElementById('confirmOverlay'),
    dialogBody: document.getElementById('dialogBody'),
    dialogCancel: document.getElementById('dialogCancel'),
    dialogConfirm: document.getElementById('dialogConfirm'),
    statTotal: document.getElementById('statTotal'),
    statCompleted: document.getElementById('statCompleted'),
    statOverdue: document.getElementById('statOverdue'),
    progressFill: document.getElementById('progressFill'),
    progressLabel: document.getElementById('progressLabel'),
    todayLabel: document.getElementById('todayLabel'),
  };

  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
  const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

  function todayISO(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function isOverdue(task){
    return !task.completed && !!task.date && task.date < todayISO();
  }

  function formatDate(iso){
    if(!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function updateTodayLabel(){
    if(!els.todayLabel) return;
    els.todayLabel.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function iconEdit(){
    return `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M11 2.5l2.5 2.5L5 13.5l-3 .5.5-3L11 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  }
  function iconDelete(){
    return `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  }
  function iconCheck(){
    return `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function iconConfirm(){
    return `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function iconNotes(){
    return `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10a1 1 0 0 1 1 1V13l-3 2H3.5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.3"/></svg>`;
  }
  function iconDrag(){
    return `<span></span><span></span><span></span>`;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Promise-based confirm dialog — replaces the blocking native confirm().
  function confirmAsync(message){
    els.dialogBody.textContent = message;
    els.dialogOverlay.hidden = false;
    els.dialogConfirm.focus();

    return new Promise(resolve => {
      function cleanup(result){
        els.dialogOverlay.hidden = true;
        els.dialogConfirm.removeEventListener('click', onConfirm);
        els.dialogCancel.removeEventListener('click', onCancel);
        els.dialogOverlay.removeEventListener('click', onOverlay);
        resolve(result);
      }
      function onConfirm(){ cleanup(true); }
      function onCancel(){ cleanup(false); }
      function onOverlay(e){ if(e.target === els.dialogOverlay) cleanup(false); }

      els.dialogConfirm.addEventListener('click', onConfirm);
      els.dialogCancel.addEventListener('click', onCancel);
      els.dialogOverlay.addEventListener('click', onOverlay);
    });
  }

  function filteredTasks(){
    let list = tasks.slice();
    if(statusFilter === 'incomplete') list = list.filter(t => !t.completed);
    if(statusFilter === 'completed') list = list.filter(t => t.completed);
    if(priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
    // auto-sort by priority (high → low), stable within same priority
    list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    return list;
  }

  function renderItem(task){
    const overdue = isOverdue(task);
    const dateChip = task.date
      ? (overdue
          ? `<span class="chip overdue">Overdue · ${formatDate(task.date)}</span>`
          : `<span class="chip date">Due ${formatDate(task.date)}</span>`)
      : '';

    if(editingId === task.id){
      return `
        <li class="item p-${task.priority} editing" data-id="${task.id}">
          ${iconDrag() ? `<button type="button" class="drag-handle" aria-label="Reorder task">${iconDrag()}</button>` : ''}
          <button type="button" class="chk${task.completed ? ' on' : ''}" role="checkbox" aria-checked="${task.completed}" aria-label="Mark ${task.completed ? 'incomplete' : 'complete'}">${task.completed ? iconCheck() : ''}</button>
          <div class="item-body">
            <div class="fld name" style="margin-bottom:6px;">
              <input type="text" class="edit-name" value="${escapeHtml(task.name)}" aria-label="Task name">
            </div>
            <div class="notes-fld" style="margin-bottom:0;">
              ${iconNotes()}
              <textarea class="edit-notes" rows="1" placeholder="Notes (optional)…" aria-label="Notes">${escapeHtml(task.notes || '')}</textarea>
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="icon-btn save-btn" aria-label="Save changes">${iconConfirm()}</button>
            <button type="button" class="icon-btn danger cancel-btn" aria-label="Cancel edit">${iconDelete()}</button>
          </div>
        </li>`;
    }

    return `
      <li class="item p-${task.priority}${task.completed ? ' done' : ''}" data-id="${task.id}">
        <button type="button" class="drag-handle" aria-label="Reorder task">${iconDrag()}</button>
        <button type="button" class="chk${task.completed ? ' on' : ''}" role="checkbox" aria-checked="${task.completed}" aria-label="Mark ${task.completed ? 'incomplete' : 'complete'}">${task.completed ? iconCheck() : ''}</button>
        <div class="item-body">
          <div class="item-top"><span class="item-name${task.completed ? ' strike' : ''}">${escapeHtml(task.name)}</span></div>
          ${task.notes ? `<div class="item-notes">${iconNotes()}${escapeHtml(task.notes)}</div>` : ''}
          <div class="item-meta">
            ${dateChip}
            <span class="chip p-${task.priority}">${PRIORITY_LABEL[task.priority]}</span>
          </div>
        </div>
        <div class="item-actions">
          <button type="button" class="icon-btn edit-btn" aria-label="Edit task">${iconEdit()}</button>
          <button type="button" class="icon-btn danger delete-btn" aria-label="Delete task">${iconDelete()}</button>
        </div>
      </li>`;
  }

  function render(){
    const list = filteredTasks();
    els.list.innerHTML = list.map(renderItem).join('');
    els.list.hidden = list.length === 0;
    els.emptyState.hidden = list.length !== 0;

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    els.statTotal.textContent = total;
    els.statCompleted.textContent = completed;
    els.statOverdue.textContent = overdue;
    els.progressFill.style.width = total ? `${Math.round((completed / total) * 100)}%` : '0%';
    els.progressLabel.textContent = `${completed} of ${total} completed`;

    const incomplete = total - completed;
    els.tabs.querySelectorAll('.tab').forEach(tab => {
      const f = tab.dataset.filter;
      const count = f === 'all' ? total : f === 'incomplete' ? incomplete : completed;
      const label = f === 'all' ? 'All' : f === 'incomplete' ? 'Incomplete' : 'Completed';
      tab.textContent = `${label} (${count})`;
      const isActive = f === statusFilter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    els.priorityBar.querySelectorAll('.pf').forEach(btn => {
      const isActive = btn.dataset.priority === priorityFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    saveTasks();
  }

  function updatePriorityDot(){
    const val = els.priorityInput.value;
    els.priorityDot.className = `dot ${val}`;
  }

  els.priorityInput.addEventListener('change', updatePriorityDot);

  els.form.addEventListener('submit', e => {
    e.preventDefault();
    const name = els.nameInput.value.trim();
    if(!name) return;
    tasks.push({
      id: cryptoId(),
      name,
      date: els.dateInput.value || '',
      priority: els.priorityInput.value,
      notes: els.notesInput.value.trim(),
      completed: false,
    });
    els.form.reset();
    updatePriorityDot();
    render();
  });

  els.tabs.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if(!btn) return;
    statusFilter = btn.dataset.filter;
    render();
  });

  els.priorityBar.addEventListener('click', e => {
    const btn = e.target.closest('.pf');
    if(!btn) return;
    priorityFilter = btn.dataset.priority;
    render();
  });

  els.list.addEventListener('click', async e => {
    const item = e.target.closest('.item');
    if(!item) return;
    const id = item.dataset.id;
    const task = tasks.find(t => t.id === id);
    if(!task) return;

    if(e.target.closest('.chk')){
      task.completed = !task.completed;
      render();
      return;
    }
    if(e.target.closest('.delete-btn')){
      const ok = await confirmAsync(`Delete "${task.name}"? This can't be undone.`);
      if(ok){
        tasks = tasks.filter(t => t.id !== id);
        render();
      }
      return;
    }
    if(e.target.closest('.edit-btn')){
      editingId = id;
      render();
      const input = els.list.querySelector('.edit-name');
      if(input){ input.focus(); input.select(); }
      return;
    }
    if(e.target.closest('.save-btn')){
      const nameInput = item.querySelector('.edit-name');
      const notesInput = item.querySelector('.edit-notes');
      const newName = nameInput.value.trim();
      if(newName){
        task.name = newName;
        task.notes = notesInput.value.trim();
      }
      editingId = null;
      render();
      return;
    }
    if(e.target.closest('.cancel-btn')){
      editingId = null;
      render();
      return;
    }
  });

  els.list.addEventListener('keydown', e => {
    if(e.key === 'Enter' && e.target.classList.contains('edit-name')){
      e.preventDefault();
      e.target.closest('.item').querySelector('.save-btn').click();
    }
    if(e.key === 'Escape' && (e.target.classList.contains('edit-name') || e.target.classList.contains('edit-notes'))){
      e.preventDefault();
      e.target.closest('.item').querySelector('.cancel-btn').click();
    }
  });

  updateTodayLabel();
  updatePriorityDot();
  render();
})();
