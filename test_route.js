
fetch('http://localhost:8083/api/notifications/read-all', { method: 'PATCH' })
    .then(res => console.log('Status:', res.status))
    .catch(err => console.error('Error:', err));
