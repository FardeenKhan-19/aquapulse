const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:8000/api/auth/login', {
            email: 'admin@jalsatya.ai',
            password: 'ChangeThisInProduction@2026'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Success:", res.status);
        console.log("Data:", res.data);
    } catch (e) {
        console.log("Error:", e.response ? e.response.status : e.message);
        if (e.response) console.log(e.response.data);
    }
}
test();
