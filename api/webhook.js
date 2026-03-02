// api/webhook.js - Serverless Function untuk Vercel
export default async function handler(req, res) {
    // Hanya terima method POST (webhook dari Pakasir)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Terima data dari Pakasir
        const { order_id, amount, status } = req.body;
        
        console.log('Webhook received:', { order_id, amount, status });

        // 2. Validasi signature (opsional tapi disarankan)
        // const isValid = verifyPakasirSignature(req);
        // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

        // 3. Jika status completed, kirim notifikasi ke bot
        if (status === 'completed') {
            const botToken = '8359574452:AAFoNJwi19NmkvilcUJvMY_2ulWqcXtP6dI'; // Token Anda
            const chatId = '1490506422'; // ID owner/user
            
            // Kirim pesan ke Telegram
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `✅ Pembayaran diterima!\nOrder: ${order_id}\nAmount: Rp ${amount.toLocaleString()}`,
                    parse_mode: 'HTML'
                })
            });
        }

        // 4. Respon ke Pakasir (harus 200 OK)
        res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
