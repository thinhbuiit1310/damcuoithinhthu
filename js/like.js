import { api } from './api.js';
import { storage } from './storage.js';

export const like = (() => {

    const likes = storage('likes');

    const like = async (button) => {
        const id = button.getAttribute('data-uuid');

        const heart = button.firstElementChild.lastElementChild;
        const info = button.firstElementChild.firstElementChild;

        button.disabled = true;
        const tmp = info.innerText;
        info.innerText = 'Loading..';

        const getCount = () => {
            const parsed = parseInt(info.getAttribute('data-count-like') ?? '0', 10);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        try {
            if (likes.has(id)) {
                await api.update((data) => {
                    const c = data.comments.find((c) => c.id === id);
                    if (c) c.likes = Math.max(0, (c.likes || 0) - 1);
                    return data;
                });
                likes.unset(id);

                heart.classList.remove('fa-solid', 'text-danger');
                heart.classList.add('fa-regular');

                info.setAttribute('data-count-like', String(Math.max(0, getCount() - 1)));
            } else {
                await api.update((data) => {
                    const c = data.comments.find((c) => c.id === id);
                    if (c) c.likes = (c.likes || 0) + 1;
                    return data;
                });
                likes.set(id, true);

                heart.classList.remove('fa-regular');
                heart.classList.add('fa-solid', 'text-danger');

                info.setAttribute('data-count-like', String(getCount() + 1));
            }
        } catch (err) {
            console.error('Lỗi like:', err);
        }

        info.innerText = `${getCount()} like`;
        button.disabled = false;
    };

    return { like };
})();
