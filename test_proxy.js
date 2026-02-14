
fetch('http://localhost:5173/api/notifications/read-all', { method: 'PATCH' })
    .then(res => console.log('Status:', res.status))
    .catch(err => console.error('Error:', err));
