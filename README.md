<div align="center">

# 👁️ Sixth Sense

**AI-powered real-time vision assistance for the visually impaired**

Built with ❤️ at **DartHacks 2026**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-sixth--sense-blue?style=for-the-badge&logo=vercel)](https://sixth-sense-iota.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Sixth--Sense-181717?style=for-the-badge&logo=github)](https://github.com/aadityakumarsah/Sixth-Sense)

---

*Point your phone camera and let Kayla — your AI companion — describe the world around you.*

</div>

---

## 🌟 What is Sixth Sense?

Sixth Sense gives visually impaired users a **real-time AI narrator** for their surroundings. Using your phone's camera and a conversational AI avatar named **Kayla**, it describes what it sees, guides you through your environment, and keeps you safe — all through natural voice interaction.

> Best experienced on mobile Safari or Chrome. Grant camera and microphone permissions when prompted.

---

## ✨ Core Features

| Feature | Description |
|:---|:---|
| 🎥 **Live Vision Narration** | Camera captures your surroundings every 15 seconds; Claude AI describes what it sees |
| 🧭 **Navigation Guidance** | Kayla tells you what's ahead and which way to turn |
| 🎙️ **Voice Commands** | Hands-free control with the **"Hey Kayla"** wake word |
| 🚨 **SOS** | One tap calls 100 with a 15-second countdown |
| 📱 **Emergency Contacts** | Instantly SMS your contacts when you need help |
| 🧑‍💻 **AI Avatar** | Lip-synced avatar powered by HeyGen LiveAvatar for a human-like experience |

---

## 🗣️ Voice Commands

| Command | Action |
|:---|:---|
| `"Hey Kayla update"` | Immediate camera analysis |
| `"Hey Kayla pause"` | Pause narration |
| `"Hey Kayla resume"` | Resume narration |
| `"Hey Kayla SOS"` | Trigger SOS screen |
| `"Hey Kayla help"` | Alert emergency contacts |
| `"Hey Kayla cancel"` | Cancel SOS/help countdown |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React + Vite, deployed on Vercel |
| **Backend** | Node.js + Express, deployed on Railway |
| **AI Vision** | Claude claude-sonnet-4-6 (Anthropic) |
| **Avatar** | HeyGen LiveAvatar + LiveKit WebRTC |
| **Database** | MongoDB Atlas |
| **SMS Alerts** | Twilio |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** account
- API keys: **Anthropic**, **HeyGen**, **Twilio**

### Installation

```bash
git clone https://github.com/aadityakumarsah/Sixth-Sense
cd Sixth-Sense
```

**Frontend:**

```bash
npm install
npm run dev
```

**Backend:**

```bash
cd server
npm install
cp .env.example .env  # fill in your API keys
node server.js
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
CLAUDE_API_KEY=
ELEVENLABS_API_KEY=
HEYGEN_API_KEY=
MONGODB_URI=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
PORT=3001
```

---

## 🌐 Live Demo

👉 **[sixth-sense-iota.vercel.app](https://sixth-sense-iota.vercel.app)**

> Best experienced on mobile Safari or Chrome. Grant camera and microphone permissions when prompted.

---

## 👥 Team

Built at **DartHacks 2026** by:

- **Aaditya** — Developer

---

<div align="center">

Made with ❤️ for accessibility

*Because everyone deserves to see the world.*

</div>
