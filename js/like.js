import { db } from './firebase-config.js';
import { doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
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
                await updateDoc(doc(db, 'comments', id), { likes: increment(-1) });
                likes.unset(id);

                heart.classList.remove('fa-solid', 'text-danger');
                heart.classList.add('fa-regular');

                info.setAttribute('data-count-like', String(Math.max(0, getCount() - 1)));
            } else {
                await updateDoc(doc(db, 'comments', id), { likes: increment(1) });
                likes.set(id, true);

                heart.classList.remove('fa-regular');
                heart.classList.add('fa-solid', 'text-danger');

                info.setAttribute('data-count-like', String(getCount() + 1));
            }
        } catch (err) {
            console.error('L\u1ed7i like:', err);
        }

        info.innerText = `${getCount()} like`;
        button.disabled = false;
    };

    return { like };
})();
