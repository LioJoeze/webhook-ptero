import fetch from "node-fetch";
import crypto from "crypto";

export default async function handler(req,res){

if(req.method !== "POST")
  return res.status(405).json({error:"Method not allowed"});

const data = req.body;
if(data.status !== "PAID")
  return res.status(200).json({ignored:true});

const note = data.note.split("|");
const type = note[0];

const sendTG = async(method,body)=>{
 await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`,{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify(body)
 });
};

const waktu = new Date().toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})+" WIB";

// ================= PANEL =================
if(type === "PANEL"){

 const ram = note[1];
 const userId = note[2];
 const username = note[3];

 const password = crypto.randomBytes(5).toString("hex");
 const email = `${username}@gmail.com`;

 // CREATE USER
 const userRes = await fetch(`${process.env.PTERO_DOMAIN}/api/application/users`,{
  method:"POST",
  headers:{
    "Authorization":`Bearer ${process.env.PTERO_API_KEY}`,
    "Content-Type":"application/json",
    "Accept":"application/json"
  },
  body:JSON.stringify({
    email,
    username,
    first_name:username,
    last_name:"Panel",
    password
  })
 });

 const userData = await userRes.json();

 // CREATE SERVER
 await fetch(`${process.env.PTERO_DOMAIN}/api/application/servers`,{
  method:"POST",
  headers:{
    "Authorization":`Bearer ${process.env.PTERO_API_KEY}`,
    "Content-Type":"application/json",
    "Accept":"application/json"
  },
  body:JSON.stringify({
    name: username,
    user: userData.attributes.id,
    egg: process.env.PTERO_EGG_ID,
    docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
    startup: "npm start",
    limits:{
      memory: ram==="unli"?0:ram*1024,
      swap:0,
      disk:ram==="unli"?0:ram*1024,
      io:500,
      cpu:0
    },
    feature_limits:{databases:1,backups:1,allocations:1},
    deploy:{locations:[process.env.PTERO_LOCATION_ID],dedicated_ip:false,port_range:[]}
  })
 });

 await sendTG("sendMessage",{
  chat_id:userId,
  parse_mode:"HTML",
  text:
`<b>🎉 PANEL BERHASIL DIBUAT</b>

<blockquote>
🌐 Login  : <code>${process.env.PTERO_DOMAIN}</code>
👤 User   : <code>${username}</code>
📧 Email  : <code>${email}</code>
🔐 Pass   : <code>${password}</code>
💾 RAM    : <b>${ram==="unli"?"UNLIMITED":ram+"GB"}</b>
</blockquote>

Simpan data ini dengan baik.`
 });
}

// ================= LOG CHANNEL =================
await sendTG("sendMessage",{
 chat_id:process.env.CHANNEL_ID,
 parse_mode:"HTML",
 text:
`<b>🛒 𝙩𝙧𝙖𝙣𝙨𝙖𝙠𝙨𝙞 𝙨𝙪𝙘𝙘𝙚𝙨</b>

<blockquote>
👤 User      : <b>${data.customer_name||"-"}</b>
🧾 Invoice   : <code>${data.transaction_id}</code>
💰 Harga     : <b>Rp ${data.amount}</b>
⏰ Waktu     : ${waktu}
</blockquote>

<b>Ingin buy click here? 👇</b>
@${process.env.BOT_USERNAME}`,
 reply_markup:{
  inline_keyboard:[
   [{text:"🛒 ORDER SEKARANG",url:`https://t.me/${process.env.BOT_USERNAME}`}]
  ]
 }
});

return res.status(200).json({success:true});
}
