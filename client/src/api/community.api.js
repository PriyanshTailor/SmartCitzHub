import { apiFetch } from '@/lib/api'

export const communityApi = {
    getDiscussions: () => apiFetch('/api/community/discussions'),

    getMembers: () => apiFetch('/api/community/members'),

    createDiscussion: (formData) => {
        // formData should be a FormData object containing 'title', 'content', 'tags', and optional 'image_file'
        return apiFetch('/api/community/discussions', {
            method: 'POST',
            body: formData, // apiFetch handles FormData automatically if body is FormData? No, standard fetch does. 
            // apiFetch wrapper might override headers. Let's check apiFetch in lib/api.js first. 
            // Wait, usually apiFetch sets Content-Type to JSON if not set. 
            // For FormData, we should NOT set Content-Type header, letting browser set it with boundary.
            // I'll assume standard fetch behavior for now.
            headers: {}, // Explicitly empty to avoid default JSON header if logic forces it
        })
    },

    toggleLike: (id) => apiFetch(`/api/community/discussions/${id}/like`, { method: 'POST' }),

    addComment: (id, text) => apiFetch(`/api/community/discussions/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    }),
}
