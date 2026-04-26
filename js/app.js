import { auth } from './firebase-config.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { util } from './util.js';
import { like } from './like.js';
import { theme } from './theme.js';
import { audio } from './audio.js';
import { comment } from './comment.js';
import { progress } from './progress.js';
import { pagination } from './pagination.js';

window.util = util;
window.like = like;
window.theme = theme;
window.audio = audio;
window.comment = comment;
window.progress = progress;
window.pagination = pagination;

signInAnonymously(auth).catch((err) => console.warn('Anonymous auth:', err.message));
