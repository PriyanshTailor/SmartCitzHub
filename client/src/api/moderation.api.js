import { apiFetch } from '@/lib/api'

export const moderationApi = {
    flagContent: (data) => apiFetch('/api/moderation/flag', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getFlags: (status = 'all') => apiFetch(`/api/moderation${status !== 'all' ? `?status=${status}` : ''}`),

    resolveFlag: (id, action, comments) => apiFetch(`/api/moderation/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action, comments })
    })
}
