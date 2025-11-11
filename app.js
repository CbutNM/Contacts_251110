// API基础URL
const API_BASE_URL = 'http://localhost:3000/api/contacts';

// DOM元素
const contactForm = document.getElementById('contact-form');
const contactIdInput = document.getElementById('contact-id');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const refreshBtn = document.getElementById('refresh-btn');
const contactsList = document.getElementById('contacts-list');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// 页面加载时获取联系人列表
document.addEventListener('DOMContentLoaded', () => {
    loadContacts();
    
    // 表单提交事件
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', resetForm);
    
    // 刷新按钮事件
    refreshBtn.addEventListener('click', loadContacts);
});

// 加载联系人列表
async function loadContacts() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();
        
        if (result.success) {
            displayContacts(result.data);
        } else {
            showError(result.message || '加载联系人列表失败');
        }
    } catch (error) {
        console.error('加载联系人失败:', error);
        showError('网络错误，请检查后端服务是否启动');
    } finally {
        showLoading(false);
    }
}

// 显示联系人列表
function displayContacts(contacts) {
    if (contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-state">暂无联系人</div>';
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => `
        <div class="contact-item" data-id="${contact.id}">
            <div class="contact-header">
                <div class="contact-name">${escapeHtml(contact.name)}</div>
                <div class="contact-actions">
                    <button class="btn btn-edit" onclick="editContact(${contact.id})">编辑</button>
                    <button class="btn btn-delete" onclick="deleteContact(${contact.id})">删除</button>
                </div>
            </div>
            <div class="contact-phone">📱 ${escapeHtml(contact.phone)}</div>
            ${contact.email ? `<div class="contact-email">📧 ${escapeHtml(contact.email)}</div>` : ''}
            ${contact.address ? `<div class="contact-address">📍 ${escapeHtml(contact.address)}</div>` : ''}
        </div>
    `).join('');
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim()
    };
    
    const id = contactIdInput.value;
    
    showLoading(true);
    hideError();
    
    try {
        const url = id ? `${API_BASE_URL}/${id}` : API_BASE_URL;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            resetForm();
            loadContacts();
            alert(id ? '联系人更新成功！' : '联系人添加成功！');
        } else {
            showError(result.message || '操作失败');
        }
    } catch (error) {
        console.error('提交失败:', error);
        showError('网络错误，请检查后端服务是否启动');
    } finally {
        showLoading(false);
    }
}

// 编辑联系人（从数据库读取，不使用缓存）
async function editContact(id) {
    showLoading(true);
    hideError();
    
    try {
        // 从后端数据库读取数据（不使用缓存）
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const contact = result.data;
            
            // 填充表单
            contactIdInput.value = contact.id;
            document.getElementById('name').value = contact.name;
            document.getElementById('phone').value = contact.phone;
            document.getElementById('email').value = contact.email || '';
            document.getElementById('address').value = contact.address || '';
            
            // 更新UI
            formTitle.textContent = '编辑联系人';
            submitBtn.textContent = '更新';
            cancelBtn.style.display = 'inline-block';
            
            // 滚动到表单
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        } else {
            showError(result.message || '获取联系人信息失败');
        }
    } catch (error) {
        console.error('获取联系人失败:', error);
        showError('网络错误，请检查后端服务是否启动');
    } finally {
        showLoading(false);
    }
}

// 删除联系人（基于数据库操作）
async function deleteContact(id) {
    if (!confirm('确定要删除这个联系人吗？')) {
        return;
    }
    
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadContacts();
            alert('联系人删除成功！');
        } else {
            showError(result.message || '删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        showError('网络错误，请检查后端服务是否启动');
    } finally {
        showLoading(false);
    }
}

// 重置表单
function resetForm() {
    contactForm.reset();
    contactIdInput.value = '';
    formTitle.textContent = '添加联系人';
    submitBtn.textContent = '添加';
    cancelBtn.style.display = 'none';
}

// 显示/隐藏加载状态
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// 隐藏错误信息
function hideError() {
    errorMessage.style.display = 'none';
}

// HTML转义，防止XSS攻击
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

