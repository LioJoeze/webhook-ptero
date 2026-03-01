// webhook.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { addUserRole } = require('./functions'); // fungsi addUserRole dari script utama kamu
const USER_DB_PATH = './src/database/users.json';
const activeTransactions = require('./activeTransactions'); // object global.activeTransactions, bisa export dari script utama

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/callback', async (req, res) => {
    try {
        const data = req.body;

        // Pakasir biasanya ngirim order_id & status
        const orderId = data.order_id;
        const status = data.status;

        if (!orderId || !status) {
            return res.status(400).send('Bad Request');
        }

        // Cek transaksi aktif
        const trx = activeTransactions[orderId];
        if (!trx) {
            return res.status(404).send('Transaction not found');
        }

        // Hanya proses jika pending
        if (trx.status !== 'pending') {
            return res.status(200).send('Already processed');
        }

        // Status PAID
        if (status === 'PAID') {

            trx.status = 'paid';

            // Tambah role jika tipe reseller
            if (trx.type === 'reseller') {
                addUserRole(trx.userId, 'reseller');
            }

            // Jika tipe panel, buat panel otomatis
            if (trx.type === 'panel' && trx.data) {
                const { server, username, ram, sendType, target } = trx.data;
                const { createPanel } = require('./functions'); // fungsi createPanel dari script utama
                await createPanel(null, trx.chatId, trx.userId, server, ram, username, target, sendType);
            }

            // Kirim konfirmasi via bot
            const { bot } = require('./bot'); // export bot dari script utama
            await bot.sendMessage(trx.chatId, `✅ Pembayaran berhasil! Order ${orderId} sudah diproses.`);

            // Hapus transaksi
            delete activeTransactions[orderId];
        }

        res.status(200).send('OK');

    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Webhook server running on port ${PORT}`);
});
