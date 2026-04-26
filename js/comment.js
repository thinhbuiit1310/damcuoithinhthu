import { api } from './api.js';
import { card } from './card.js';
import { util } from './util.js';
import { theme } from './theme.js';
import { storage } from './storage.js';
import { pagination } from './pagination.js';

export const comment = (() => {

    const owns = storage('owns');
    const config = storage('config');

    const remove = async (button) => {
        if (!confirm('Bạn chắc chắn chưa?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');
        const btn = util.disableButton(button);

        try {
            await api.update((data) => {
                data.comments = data.comments.filter((c) => c.id !== id && c.parentId !== id);
                return data;
            });

            const el = document.getElementById(id);
            if (el) el.remove();
            owns.unset(id);
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message);
        }

        btn.restore();
    };

    const changeButton = (id, disabled) => {
        const buttonMethod = ['reply', 'edit', 'remove'];
        buttonMethod.forEach((v) => {
            const status = document.querySelector(`[onclick="comment.${v}(this)"][data-uuid="${id}"]`);
            if (status) {
                status.disabled = disabled;
            }
        });
    };

    const update = async (button) => {
        const id = button.getAttribute('data-uuid');

        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            presence.disabled = true;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        try {
            await api.update((data) => {
                const idx = data.comments.findIndex((c) => c.id === id);
                if (idx !== -1) {
                    data.comments[idx].comment = form.value;
                    data.comments[idx].updatedAt = new Date().toISOString();
                    if (presence) {
                        data.comments[idx].presence = presence.value === "1";
                    }
                }
                return data;
            });

            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();

            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('Lỗi khi cập nhật: ' + err.message);
        }
    };

    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        if (name.value.length == 0) {
            alert('Vui lòng điền tên của bạn');
            return;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value == "0") {
            alert('Vui lòng lựa chọn bạn có thể tham dự đám cưới của chúng tôi hay không?');
            return;
        }

        if (presence) presence.disabled = true;

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) cancel.disabled = true;

        const btn = util.disableButton(button);

        try {
            const commentId = api.generateId();
            const commentData = {
                id: commentId,
                name: name.value,
                comment: form.value,
                presence: presence ? presence.value === "1" : true,
                parentId: id || null,
                likes: 0,
                isAdmin: false,
                ownerId: api.getOwnerId(),
                createdAt: new Date().toISOString()
            };

            await api.update((data) => {
                data.comments.push(commentData);
                return data;
            });

            owns.set(commentId, true);

            form.value = '';
            if (presence) presence.value = "0";

            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();

            if (id) {
                changeButton(id, false);
                const innerEl = document.getElementById(`inner-${id}`);
                if (innerEl) innerEl.remove();
            }

            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('Lỗi khi gửi: ' + err.message);
        }
    };

    const cancel = (id) => {
        if (document.getElementById(`form-inner-${id}`).value.length === 0 || confirm('Bạn chắc chắn chưa?')) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
        }
    };

    const reply = (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);

        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        inner.innerHTML = `
        <label for="form-inner-${id}" class="form-label">Trả lời</label>
        <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nhập phản hồi lời chúc mừng"></textarea>
        <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">Hủy bỏ</button>
            <button style="font-size: 0.8rem;" onclick="comment.send(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">Gửi</button>
        </div>`;

        document.getElementById(`button-${id}`).insertAdjacentElement('afterend', inner);
    };

    const edit = async (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        const tmp = button.innerText;
        button.innerText = 'Loading..';

        try {
            const data = await api.read(true);
            const c = data.comments.find((c) => c.id === id);

            if (c) {
                const inner = document.createElement('div');
                inner.classList.add('my-2');
                inner.id = `inner-${id}`;
                inner.innerHTML = `
                <label for="form-inner-${id}" class="form-label">Sửa</label>
                ${document.getElementById(id).getAttribute('data-parent') === 'true' ? `
                <select class="form-select shadow-sm mb-2" id="form-inner-presence-${id}">
                    <option value="1" ${c.presence ? 'selected' : ''}>Chắc chắn có mặt</option>
                    <option value="2" ${c.presence ? '' : 'selected'}>Chưa chắc chắn</option>
                </select>` : ''}
                <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nhập nội dung cập nhật"></textarea>
                <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
                    <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">Hủy bỏ</button>
                    <button style="font-size: 0.8rem;" onclick="comment.update(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">Cập nhật</button>
                </div>`;

                document.getElementById(`button-${id}`).insertAdjacentElement('afterend', inner);
                document.getElementById(`form-inner-${id}`).value = c.comment;
            } else {
                changeButton(id, false);
                alert('Bình luận không còn tồn tại.');
            }
        } catch (err) {
            changeButton(id, false);
            alert('Lỗi: ' + err.message);
        }

        button.innerText = tmp;
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const fetchComments = async () => {
        card.renderLoading();

        try {
            const data = await api.read(true);
            const allComments = data.comments || [];

            const parentComments = allComments
                .filter((c) => !c.parentId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const perPage = pagination.getPer();
            const nextStart = pagination.getNext();

            const pageComments = parentComments.slice(nextStart, nextStart + perPage);
            pagination.setResultData(pageComments.length);

            const comments = document.getElementById('comments');

            if (pageComments.length === 0) {
                comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow">Hãy là người đầu tiên gửi lời chúc nhé!</div>`;
                return;
            }

            const rendered = pageComments.map((parent) => {
                const replies = allComments
                    .filter((c) => c.parentId === parent.id)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                return card.renderContent({
                    uuid: parent.id,
                    name: parent.name,
                    comment: parent.comment,
                    presence: parent.presence,
                    likes: parent.likes || 0,
                    like: { love: parent.likes || 0 },
                    is_admin: parent.isAdmin || false,
                    ownerId: parent.ownerId || null,
                    created_at: formatDate(parent.createdAt),
                    comments: replies.map((r) => ({
                        uuid: r.id,
                        name: r.name,
                        comment: r.comment,
                        presence: r.presence,
                        likes: r.likes || 0,
                        like: { love: r.likes || 0 },
                        is_admin: r.isAdmin || false,
                        ownerId: r.ownerId || null,
                        created_at: formatDate(r.createdAt),
                        comments: []
                    }))
                });
            });

            comments.innerHTML = rendered.join('');
        } catch (err) {
            console.error('Lỗi tải comments:', err);
            const comments = document.getElementById('comments');
            comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow text-danger">Lỗi tải dữ liệu. Vui lòng thử lại.</div>`;
        }
    };

    return {
        cancel,
        send,
        edit,
        reply,
        remove,
        update,
        comment: fetchComments,
        renderLoading: card.renderLoading,
    };
})();
