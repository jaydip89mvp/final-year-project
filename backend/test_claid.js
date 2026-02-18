import axios from 'axios';

const IMAGE_API_BASE = 'https://api.claid.ai';
const IMAGE_API_TOKEN = '1393ae63210f43a7891b28ef33abfd8d';

async function testGenerate() {
    console.log('Testing Claid API (Fixed Logic)...');

    try {
        console.log('\n--- Attempt: WITHOUT output field (simulating fix) ---');
        const res = await axios.post(
            `${IMAGE_API_BASE}/v1/image/generate`,
            {
                input: "A simple blue square",
                options: { number_of_images: 1, guidance_scale: 5 }
            },
            {
                headers: {
                    Authorization: `Bearer ${IMAGE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            }
        );
        console.log('SUCCESS!');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('FAILED!');
        console.error('Status:', err.response ? err.response.status : 'N/A');
        console.error('Data:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

testGenerate();
