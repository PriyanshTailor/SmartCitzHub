const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/chat`;

export const chatService = {
    async sendMessage(message, token) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Chat Service Error:', error);
            throw error;
        }
    }
};
