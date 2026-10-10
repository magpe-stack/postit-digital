const COLOR_PALETTES = [
    { id: 'yellow', name: 'Amarelo', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-950', circleBg: 'bg-amber-200' },
    { id: 'blue', name: 'Azul', bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-950', circleBg: 'bg-sky-200' },
    { id: 'green', name: 'Verde', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-950', circleBg: 'bg-emerald-200' },
    { id: 'pink', name: 'Rosa', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-950', circleBg: 'bg-pink-200' },
    { id: 'purple', name: 'Roxo', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-950', circleBg: 'bg-purple-200' },
    { id: 'orange', name: 'Laranja', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-950', circleBg: 'bg-orange-200' },
    { id: 'slate', name: 'Cinza', bg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-900', circleBg: 'bg-slate-300' }
];

let state = { 
    notes: [], 
    viewMode: 'grid', 
    selectedColor: 'yellow', 
    useHandwritingFont: false, 
    filterQuery: '' 
};

let deferredPrompt = null;

const notesContainer = document.getElementById('notesContainer');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const noteCountEl = document.getElementById('noteCount');
const btnViewGrid = document.getElementById('btnViewGrid');
const btnViewInline = document.getElementById('btnViewInline');

window.addEventListener('DOMContentLoaded', () => {
    loadState(); 
    renderColorSelectors(); 
    renderNotes(); 
    setupPWA();
});

function loadState() {
    try {
        const saved = localStorage.getItem('postit_notes');
        if (saved) { 
            state.notes = JSON.parse(saved); 
        } else {
            state.notes = [{ id: 'demo-1', content: '✨ Bem-vindo ao seu Post-it Digital!', color: 'yellow', date: formatDate() }];
            saveNotes();
        }
    } catch(e) {}
}

function saveNotes() { 
    localStorage.setItem('postit_notes', JSON.stringify(state.notes)); 
}

function formatDate() { 
    const d = new Date(); 
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; 
}

function renderColorSelectors() {
    document.getElementById('colorSelectorContainer').innerHTML = COLOR_PALETTES.map(p => 
        `<button onclick="selectDefaultColor('${p.id}')" class="w-6 h-6 rounded-full ${p.circleBg} border-2 ${state.selectedColor === p.id ? 'border-slate-800 scale-110' : 'border-transparent'} transition-all" title="${p.name}"></button>`
    ).join('');
}

function selectDefaultColor(id) { 
    state.selectedColor = id; 
    renderColorSelectors(); 
}

function createNewNote() {
    const n = { id: 'note-' + Date.now(), content: '', color: state.selectedColor, date: formatDate() };
    state.notes.unshift(n); 
    saveNotes(); 
    renderNotes();
    
    setTimeout(() => {
        const el = document.querySelector(`[data-id="${n.id}"] textarea`);
        if (el) el.focus();
    }, 50);
}

function updateNoteContent(id, val) { 
    const n = state.notes.find(x => x.id === id); 
    if(n) { 
        n.content = val; 
        saveNotes(); 
    } 
}

function changeNoteColor(id, colorId) {
    const n = state.notes.find(x => x.id === id);
    if (n) {
        n.color = colorId;
        saveNotes();
        renderNotes();
    }
}

function copyNoteContent(id) {
    const n = state.notes.find(x => x.id === id);
    if (n && n.content) {
        navigator.clipboard.writeText(n.content).then(() => {
            showToast("Conteúdo copiado!");
        });
    }
}

function deleteNote(id) { 
    state.notes = state.notes.filter(x => x.id !== id); 
    saveNotes(); 
    renderNotes(); 
    showToast("Post-it removido.");
}

function clearAllNotes() { 
    if(confirm('Tem certeza de que deseja apagar todas as notas?')) { 
        state.notes = []; 
        saveNotes(); 
        renderNotes(); 
        showToast("Todas as notas foram apagadas.");
    } 
}

function setViewMode(m) { 
    state.viewMode = m; 
    
    if (m === 'grid') {
        btnViewGrid.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
        btnViewGrid.classList.remove('text-slate-600');
        btnViewInline.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
        btnViewInline.classList.add('text-slate-600');
    } else {
        btnViewInline.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
        btnViewInline.classList.remove('text-slate-600');
        btnViewGrid.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
        btnViewGrid.classList.add('text-slate-600');
    }
    
    renderNotes(); 
}

function toggleFont() { 
    state.useHandwritingFont = !state.useHandwritingFont; 
    renderNotes(); 
}

function filterNotes() { 
    state.filterQuery = searchInput.value.toLowerCase(); 
    renderNotes(); 
}

function getColorObj(id) { 
    return COLOR_PALETTES.find(c => c.id === id) || COLOR_PALETTES[0]; 
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = msg;
        toast.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'pointer-events-none');
        }, 2500);
    }
}

function renderNotes() {
    const list = state.notes.filter(n => n.content.toLowerCase().includes(state.filterQuery));
    noteCountEl.textContent = `${list.length} post-its`;
    
    if(!list.length) { 
        notesContainer.innerHTML = ''; 
        emptyState.classList.remove('hidden'); 
        return; 
    } 
    
    emptyState.classList.add('hidden');
    notesContainer.className = state.viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-20" 
        : "flex flex-nowrap overflow-x-auto gap-5 pb-8 custom-scrollbar";
        
    const fontClass = state.useHandwritingFont ? 'font-handwriting text-xl' : 'text-sm';
    
    notesContainer.innerHTML = list.map(n => {
        const c = getColorObj(n.color);
        
        const colorPickerDots = COLOR_PALETTES.map(p => 
            `<button onclick="changeNoteColor('${n.id}', '${p.id}')" class="w-3.5 h-3.5 rounded-full ${p.circleBg} border ${n.color === p.id ? 'border-slate-800 scale-125' : 'border-transparent'} hover:scale-110 transition-all" title="${p.name}"></button>`
        ).join('');

        return `
        <div data-id="${n.id}" class="${state.viewMode === 'inline' ? 'w-[300px] flex-shrink-0' : 'w-full'} flex flex-col justify-between rounded-xl ${c.bg} ${c.text} border ${c.border} postit-shadow postit-shadow-hover transition-all p-4 min-h-[240px]">
            <div class="flex justify-between items-center text-xs opacity-80 mb-2 pb-2 border-b border-black/10">
                <span class="font-medium text-[10px] tracking-tight">${n.date}</span>
                <div class="flex items-center gap-1.5">
                    ${colorPickerDots}
                </div>
            </div>
            <textarea oninput="updateNoteContent('${n.id}', this.value)" class="w-full flex-1 bg-transparent resize-none outline-none ${fontClass} placeholder-black/30" placeholder="Digite sua nota...">${n.content}</textarea>
            <div class="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-black/5">
                <button onclick="copyNoteContent('${n.id}')" class="p-1 hover:bg-black/5 rounded text-slate-700 transition" title="Copiar texto">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="deleteNote('${n.id}')" class="p-1 hover:bg-black/5 rounded text-red-700 transition" title="Excluir nota">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>`;
    }).join('');
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('Erro ao registrar Service Worker:', err);
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const btnDesktop = document.getElementById('pwaInstallBtn');
        const btnMobile = document.getElementById('pwaInstallBtnMobile');
        if (btnDesktop) { btnDesktop.classList.remove('hidden'); btnDesktop.classList.add('flex'); }
        if (btnMobile) { btnMobile.classList.remove('hidden'); }
    });
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                const btnDesktop = document.getElementById('pwaInstallBtn');
                const btnMobile = document.getElementById('pwaInstallBtnMobile');
                if (btnDesktop) btnDesktop.classList.add('hidden');
                if (btnMobile) btnMobile.classList.add('hidden');
            }
            deferredPrompt = null;
        });
    }
}

// --- FUNÇÕES DE BACKUP LOCAL PARA O POST-IT DIGITAL ---

// Exportar/Baixar Backup de todas as notas do Post-it Digital em arquivo .json
function exportBackupFile() {
    const dataToExport = {
        notes: state.notes || []
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `postit_digital_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Backup salvo com sucesso!");
}

// Importar/Restaurar Backup do arquivo .json salvo na sua pasta
function importBackupFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Suporta tanto o formato { notes: [...] } quanto uma lista direta de notas
            const notesList = importedData.notes || (Array.isArray(importedData) ? importedData : null);

            if (notesList && Array.isArray(notesList)) {
                state.notes = notesList;
                saveNotes();
                renderNotes();
                showToast("Backup restaurado com sucesso!");
            } else {
                alert('⚠️ O arquivo selecionado não contém um backup válido do Post-it.');
            }
        } catch (err) {
            alert('⚠️ Ocorreu um erro ao ler o arquivo de backup.');
        }
    };
    reader.readAsText(file);
}
