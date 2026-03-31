const API_URL = '/usuarios';

// Element Selectors
const form = document.getElementById('user-form');
const userIdInput = document.getElementById('user-id');
const nomeInput = document.getElementById('nome');
const sexoSelect = document.getElementById('sexo');
const telefoneInput = document.getElementById('telefone');
const chavePixInput = document.getElementById('chave_pix');
const sugestoesInput = document.getElementById('sugestoes');
const btnSubmit = document.getElementById('btn-submit');
const btnCancel = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');
const usersTbody = document.getElementById('users-tbody');
const emptyState = document.getElementById('empty-state');
const tableEl = document.getElementById('users-table');
const userCountBadge = document.getElementById('user-count-badge');
const toastContainer = document.getElementById('toast-container');
const fotoInput = document.getElementById('foto');
const fotoPreview = document.getElementById('foto-preview');
const removeFotoBtn = document.getElementById('remove-foto');

let currentFotoBase64 = '';

// Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteUserNameInfo = document.getElementById('delete-user-name');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
let userIdToDelete = null;

// Phone mask logic ((XX) XXXXX-XXXX)
telefoneInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Apply mask
    if (value.length > 0) {
        value = '(' + value;
    }
    if (value.length > 3) {
        value = value.slice(0, 3) + ') ' + value.slice(3);
    }
    if (value.length > 10) {
        value = value.slice(0, 10) + '-' + value.slice(10, 14);
    }
    
    e.target.value = value;
});

// --- PHOTO UPLOAD LOGIC ---
fotoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('A imagem deve ter no máximo 2MB.', 'error');
            resetFoto();
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            currentFotoBase64 = event.target.result;
            fotoPreview.style.backgroundImage = `url(${currentFotoBase64})`;
            fotoPreview.classList.add('has-image');
            removeFotoBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

removeFotoBtn.addEventListener('click', resetFoto);

function setFotoPreview(base64str) {
    currentFotoBase64 = base64str || '';
    if (currentFotoBase64) {
        fotoPreview.style.backgroundImage = `url(${currentFotoBase64})`;
        fotoPreview.classList.add('has-image');
        removeFotoBtn.style.display = 'block';
    } else {
        resetFoto();
    }
}

function resetFoto() {
    fotoInput.value = '';
    currentFotoBase64 = '';
    fotoPreview.style.backgroundImage = 'none';
    fotoPreview.classList.remove('has-image');
    removeFotoBtn.style.display = 'none';
}
// ----------------------------

// Create Badge CSS Class based on Sexo
function getSexoBadgeClass(sexo) {
    switch (sexo.toLowerCase()) {
        case 'masculino': return 'badge-masculino';
        case 'feminino': return 'badge-feminino';
        default: return 'badge-outro';
    }
}

// Fetch and Render Users
async function loadUsers() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Falha ao buscar usuários');
        
        const users = await res.json();
        renderTable(users);
        
    } catch (error) {
        showToast('Erro ao carregar os dados. Verifique a conexão.', 'error');
        console.error(error);
    }
}

function renderTable(users) {
    usersTbody.innerHTML = '';
    userCountBadge.innerText = users.length;
    
    if (users.length === 0) {
        emptyState.style.display = 'block';
        tableEl.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tableEl.style.display = 'table';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        const badgeClass = getSexoBadgeClass(user.sexo);
        const avatarHtml = user.foto 
            ? `<img src="${user.foto}" class="avatar-thumb" alt="Foto">` 
            : `<div class="avatar-thumb"><i class="fa-solid fa-user"></i></div>`;
        
        tr.innerHTML = `
            <td>${avatarHtml}</td>
            <td>#${user.id}</td>
            <td><strong>${user.nome}</strong></td>
            <td><span class="badge ${badgeClass}">${user.sexo}</span></td>
            <td>${user.telefone}</td>
            <td>${user.chave_pix}</td>
            <td>
                <span title="${escapeQuote(user.sugestoes || 'Nenhuma')}">
                    ${user.sugestoes ? (user.sugestoes.substring(0, 15) + (user.sugestoes.length > 15 ? '...' : '')) : '-'}
                </span>
            </td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button type="button" class="action-btn edit-btn" onclick="editUser(${user.id}, '${escapeQuote(user.nome)}', '${user.sexo}', '${user.telefone}', '${escapeQuote(user.chave_pix)}', '${escapeQuote(user.foto || '')}', '${escapeQuote(user.sugestoes || '')}')" title="Editar Usuário">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="action-btn delete-btn" onclick="openDeleteModal(${user.id}, '${escapeQuote(user.nome)}')" title="Excluir Usuário">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        usersTbody.appendChild(tr);
    });
}

// Utility to escape quotes for inline JS parameters
function escapeQuote(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Handle Form Submission (Create / Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = userIdInput.value;
    const userData = {
        nome: nomeInput.value.trim(),
        sexo: sexoSelect.value,
        telefone: telefoneInput.value.trim(),
        chave_pix: chavePixInput.value.trim(),
        foto: currentFotoBase64,
        sugestoes: sugestoesInput.value.trim()
    };

    // Very basic phone validation (must have at least 14 chars with mask)
    if (telefoneInput.value.length < 14) {
        showToast('Por favor, informe um número de telefone válido.', 'error');
        telefoneInput.focus();
        return;
    }

    // Set Loading State
    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    btnSubmit.disabled = true;

    try {
        let res;
        if (id) {
            // Edit context
            res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (res.ok) showToast('Usuário atualizado com sucesso!');
        } else {
            // Create context
            res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (res.ok) showToast('Novo usuário cadastrado com sucesso!');
        }

        if (res.ok) {
            resetForm();
            loadUsers();
        } else {
            const data = await res.json();
            showToast(data.error || 'Ocorreu um erro ao salvar o registro.', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão com o servidor.', 'error');
        console.error(error);
    } finally {
        // Reset Loading State
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.disabled = false;
    }
});

// Pre-fill Form for Edit
window.editUser = function(id, nome, sexo, telefone, chave_pix, fotoBase64, sugestoes) {
    formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Usuário';
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';
    btnCancel.style.display = 'block';
    
    userIdInput.value = id;
    nomeInput.value = nome;
    sexoSelect.value = sexo;
    telefoneInput.value = telefone;
    chavePixInput.value = chave_pix;
    sugestoesInput.value = sugestoes || '';
    
    setFotoPreview(fotoBase64);
    
    // Smooth scroll to top for mobile mostly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    nomeInput.focus();
};

// Reset Form State
btnCancel.addEventListener('click', resetForm);

function resetForm() {
    form.reset();
    userIdInput.value = '';
    formTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Novo Usuário';
    btnSubmit.innerHTML = 'Cadastrar';
    btnCancel.style.display = 'none';
    resetFoto();
    nomeInput.focus();
}

// Modal Functions - Open/Close
window.openDeleteModal = function(id, name) {
    userIdToDelete = id;
    deleteUserNameInfo.innerText = name;
    deleteModal.classList.add('active'); // triggers animation
};

window.closeModal = function() {
    deleteModal.classList.remove('active');
    userIdToDelete = null;
};

// Close modal if user clicks outside content
window.onclick = function(event) {
    if (event.target == deleteModal) {
        closeModal();
    }
};

// Handle Deletion Confirmation
confirmDeleteBtn.addEventListener('click', async () => {
    if (!userIdToDelete) return;
    
    const originalText = confirmDeleteBtn.innerHTML;
    confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
    confirmDeleteBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/${userIdToDelete}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast('Usuário removido com sucesso!');
            loadUsers();
            
            // If the user being edited is the same being deleted, reset form
            if (userIdInput.value == userIdToDelete) {
                resetForm();
            }
        } else {
            showToast('Erro ao tentar excluir usuário.', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão com o servidor.', 'error');
        console.error(error);
    } finally {
        confirmDeleteBtn.innerHTML = originalText;
        confirmDeleteBtn.disabled = false;
        closeModal();
    }
});

// Toast / Snackbar Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check success-icon"></i>' 
        : '<i class="fa-solid fa-circle-exclamation error-icon"></i>';
    
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Use requestAnimationFrame to let the DOM settle before adding the 'show' class for animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for CSS transition finish before removing element
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Init Setup: Load data from Server
document.addEventListener('DOMContentLoaded', () => {
    nomeInput.focus();
    loadUsers();
});
