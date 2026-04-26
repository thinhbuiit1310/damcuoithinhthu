import { api } from './api.js';

// ==================== AUTH ====================
const dashboardAuth = (() => {
    const login = async () => {
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('login-error');
        const btn = document.getElementById('btn-login');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xác thực...';
        errorEl.style.display = 'none';

        try {
            const hash = await api.sha256(password);
            if (hash === api.getAdminHash()) {
                sessionStorage.setItem('isAdmin', 'true');
                initDashboard();
            } else {
                errorEl.textContent = 'Mật khẩu không đúng';
                errorEl.style.display = 'block';
            }
        } catch (err) {
            errorEl.textContent = 'Lỗi đăng nhập. Vui lòng thử lại.';
            errorEl.style.display = 'block';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-1"></i>Đăng nhập';
    };

    const logout = () => {
        if (!confirm('Bạn chắc chắn muốn đăng xuất?')) return;
        sessionStorage.removeItem('isAdmin');
        document.getElementById('app-container').style.display = 'none';
        (new bootstrap.Modal(document.getElementById('loginModal'))).show();
    };

    return { login, logout };
})();

// ==================== STATS ====================
const dashboardStats = (() => {
    const load = async () => {
        try {
            const data = await api.read(true);
            const comments = data.comments || [];

            let totalComments = comments.length;
            let totalLikes = 0;
            let present = 0;
            let absent = 0;

            comments.forEach((c) => {
                totalLikes += c.likes || 0;
                if (!c.parentId) {
                    if (c.presence === true) present++;
                    else absent++;
                }
            });

            document.getElementById('stat-comments').textContent = totalComments;
            document.getElementById('stat-likes').textContent = totalLikes;
            document.getElementById('stat-present').textContent = present;
            document.getElementById('stat-absent').textContent = absent;
        } catch (err) {
            console.error('Lỗi tải stats:', err);
        }
    };

    return { load };
})();

// ==================== COMMENTS MANAGEMENT ====================
const dashboardComments = (() => {
    let allComments = [];

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const load = async () => {
        try {
            const data = await api.read(true);
            allComments = (data.comments || [])
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            renderTable(allComments);
            renderRecent(allComments.slice(0, 5));
        } catch (err) {
            console.error('Lỗi tải comments:', err);
        }
    };

    const renderTable = (comments) => {
        const tbody = document.getElementById('comments-table-body');
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-4">Chưa có lời chúc nào</td></tr>';
            return;
        }

        tbody.innerHTML = comments.map((c) => `
            <tr>
                <td class="ps-4">
                    <span class="fw-semibold">${escapeHtml(c.name)}</span>
                    ${c.isAdmin ? '<i class="fa-solid fa-certificate text-primary ms-1"></i>' : ''}
                    ${c.parentId ? '<span class="badge bg-secondary ms-1">Trả lời</span>' : ''}
                </td>
                <td style="max-width: 300px;">
                    <span class="text-truncate d-inline-block" style="max-width: 280px;">${escapeHtml(c.comment)}</span>
                </td>
                <td class="text-center">
                    ${c.parentId ? '<span class="text-muted">-</span>' : (c.presence ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>')}
                </td>
                <td class="text-center">${c.likes || 0}</td>
                <td><small class="text-muted">${formatDate(c.createdAt)}</small></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger rounded-3 py-0" onclick="dashboardComments.remove('${c.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    const renderRecent = (comments) => {
        const container = document.getElementById('recent-comments');
        if (comments.length === 0) {
            container.innerHTML = '<div class="text-center text-muted p-4">Chưa có lời chúc nào</div>';
            return;
        }

        container.innerHTML = '<div class="list-group list-group-flush">' +
            comments.map((c) => `
                <div class="list-group-item px-4 py-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${escapeHtml(c.name)}</strong>
                            ${c.isAdmin ? '<i class="fa-solid fa-certificate text-primary ms-1"></i>' : ''}
                            ${!c.parentId ? (c.presence ? '<i class="fa-solid fa-circle-check text-success ms-1"></i>' : '<i class="fa-solid fa-circle-xmark text-danger ms-1"></i>') : ''}
                        </div>
                        <small class="text-muted">${formatDate(c.createdAt)}</small>
                    </div>
                    <p class="mb-0 mt-1 text-muted" style="font-size: 0.9rem;">${escapeHtml(c.comment)}</p>
                </div>
            `).join('') +
            '</div>';
    };

    const remove = async (id) => {
        if (!confirm('Bạn chắc chắn muốn xóa lời chúc này?')) return;

        try {
            await api.update((data) => {
                data.comments = data.comments.filter((c) => c.id !== id && c.parentId !== id);
                return data;
            });

            allComments = allComments.filter((c) => c.id !== id && c.parentId !== id);
            renderTable(allComments);
            renderRecent(allComments.slice(0, 5));
            dashboardStats.load();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const search = (keyword) => {
        const kw = keyword.toLowerCase().trim();
        if (!kw) {
            renderTable(allComments);
            return;
        }
        const filtered = allComments.filter((c) =>
            c.name?.toLowerCase().includes(kw) || c.comment?.toLowerCase().includes(kw)
        );
        renderTable(filtered);
    };

    const refresh = async () => {
        await load();
        dashboardStats.load();
    };

    const exportCSV = () => {
        if (allComments.length === 0) {
            alert('Không có dữ liệu để xuất');
            return;
        }

        const header = 'Tên,Lời chúc,Tham dự,Likes,Thời gian\n';
        const rows = allComments
            .filter((c) => !c.parentId)
            .map((c) => {
                const name = `"${(c.name || '').replace(/"/g, '""')}"`;
                const comment = `"${(c.comment || '').replace(/"/g, '""')}"`;
                const presence = c.presence ? 'Có' : 'Không';
                const likes = c.likes || 0;
                const date = formatDate(c.createdAt);
                return `${name},${comment},${presence},${likes},${date}`;
            }).join('\n');

        const bom = '\uFEFF';
        const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `loichuc_thinhthu_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return { load, remove, search, refresh, exportCSV };
})();

// ==================== GUESTS ====================
const dashboardGuests = (() => {
    let allGuests = [];
    let currentFilter = 'all';

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const load = async () => {
        try {
            const data = await api.read(true);
            allGuests = (data.comments || [])
                .filter((c) => !c.parentId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            renderTable(allGuests);
        } catch (err) {
            console.error('Lỗi tải guests:', err);
        }
    };

    const renderTable = (guests) => {
        const tbody = document.getElementById('guests-table-body');
        if (guests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">Chưa có khách mời nào</td></tr>';
            return;
        }

        tbody.innerHTML = guests.map((g, i) => `
            <tr>
                <td class="ps-4 text-muted">${i + 1}</td>
                <td class="fw-semibold">${escapeHtml(g.name)}</td>
                <td class="text-center">
                    ${g.presence
                        ? '<span class="badge rounded-pill bg-success-subtle text-success">Sẽ tham dự</span>'
                        : '<span class="badge rounded-pill bg-danger-subtle text-danger">Chưa chắc</span>'
                    }
                </td>
                <td><small class="text-muted">${formatDate(g.createdAt)}</small></td>
            </tr>
        `).join('');
    };

    const filter = (type, evt) => {
        currentFilter = type;

        document.querySelectorAll('#tab-guests .nav-link').forEach((btn) => btn.classList.remove('active'));
        evt.target.closest('.nav-link').classList.add('active');

        if (type === 'all') {
            renderTable(allGuests);
        } else if (type === 'present') {
            renderTable(allGuests.filter((g) => g.presence === true));
        } else {
            renderTable(allGuests.filter((g) => g.presence !== true));
        }
    };

    return { load, filter };
})();

// ==================== SETTINGS ====================
const dashboardSettings = (() => {
    const load = async () => {
        try {
            const data = await api.read();
            const config = data.config || {};
            document.getElementById('setting-reply').checked = config.can_reply !== false;
            document.getElementById('setting-edit').checked = config.can_edit !== false;
            document.getElementById('setting-delete').checked = config.can_delete !== false;
        } catch (err) {
            console.error('Lỗi tải settings:', err);
        }
    };

    const save = async () => {
        try {
            await api.update((data) => {
                data.config = {
                    can_reply: document.getElementById('setting-reply').checked,
                    can_edit: document.getElementById('setting-edit').checked,
                    can_delete: document.getElementById('setting-delete').checked
                };
                return data;
            });
            alert('Đã lưu cài đặt!');
        } catch (err) {
            alert('Lỗi lưu cài đặt: ' + err.message);
        }
    };

    const clearAllComments = async () => {
        if (!confirm('Bạn chắc chắn muốn XÓA TẤT CẢ bình luận? Hành động này KHÔNG THỂ hoàn tác!')) return;
        if (!confirm('Xác nhận lần cuối: Xóa tất cả?')) return;

        try {
            await api.update((data) => {
                data.comments = [];
                return data;
            });

            alert('Đã xóa tất cả bình luận!');
            dashboardComments.refresh();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    return { load, save, clearAllComments };
})();

// ==================== INIT ====================
const initDashboard = () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) modal.hide();

    document.getElementById('app-container').style.display = 'block';
    document.getElementById('admin-email').textContent = 'Admin';

    dashboardStats.load();
    dashboardComments.load();
    dashboardGuests.load();
    dashboardSettings.load();
};

// Check session on load
if (sessionStorage.getItem('isAdmin') === 'true') {
    initDashboard();
} else {
    document.getElementById('app-container').style.display = 'none';
    (new bootstrap.Modal(document.getElementById('loginModal'))).show();
}

// ==================== EXPOSE TO WINDOW ====================
window.dashboardAuth = dashboardAuth;
window.dashboardComments = dashboardComments;
window.dashboardGuests = dashboardGuests;
window.dashboardSettings = dashboardSettings;
