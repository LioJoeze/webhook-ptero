module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    console.log("WEBHOOK MASUK:", req.body);

    return res.status(200).json({ success: true });
};
