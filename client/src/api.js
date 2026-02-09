const API = import.meta.env.VITE_API_URL;

export const getComplaints = async () => {
    const res = await fetch(`${API}/api/complaints`);
    return res.json();
};
