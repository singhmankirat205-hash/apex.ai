# ⬡ APEX — Textile Quality Intelligence

AI-powered fabric defect detection, batch risk prediction, and dye-bath
analysis for the textile shop floor and QA office.

Built on **Claude (Anthropic API)** · **FastAPI** · Vanilla JS frontend

---

## ✅ Features

| Capability | Details |
|---|---|
| **Defect diagnosis** | Text or image → root cause ranking |
| **Batch risk prediction** | Pre-inspection reject risk (Low/Medium/High) |
| **Shade / dye-bath check** | Delta E vs buyer spec + adjustment range |
| **Shift report** | Top defects, worst machines, open escalations |
| **Tool integration** | 10 plant API hooks (batch, machine, buyer spec, ML model…) |
| **Role-aware** | Operator → short answers; Manager → full reports |
| **Streaming** | Real-time SSE streaming from Claude |
| **Audit log** | Every case logged via `log_case()` |
| **Safety-first** | Auto-escalate on critical events |
| **Data protection** | DPDP Act 2023 + buyer NDA compliant |

---

## 🗂️ Project Structure

```
apex-textile-chatbot/
├── backend/
│   ├── main.py              ← FastAPI app (routes, SSE streaming)
│   ├── agent.py             ← Claude agentic loop
│   ├── system_prompt.py     ← APEX system prompt (fully parameterised)
│   └── tools/
│       ├── plant_tools.py   ← 10 plant integration functions (wire these up)
│       └── tool_schemas.py  ← Claude tool-use schemas
├── frontend/
│   ├── templates/
│   │   └── index.html       ← Chat UI
│   └── static/
│       ├── css/style.css    ← Dark industrial theme
│       └── js/app.js        ← SSE streaming client
├── .env.example             ← Config template
├── requirements.txt
├── run.py                   ← Entry point
├── Dockerfile
└── docker-compose.yml
```

---

## 🚀 Quick Start

### 1. Install Python 3.11+

Download from [python.org](https://www.python.org/downloads/) and check
**"Add Python to PATH"** during installation.

### 2. Clone / open the project

```powershell
cd C:\Users\singh\.gemini\antigravity\scratch\apex-textile-chatbot
```

### 3. Create a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```powershell
pip install -r requirements.txt
```

### 5. Configure environment

```powershell
Copy-Item .env.example .env
notepad .env
```

Fill in **at minimum**:
- `ANTHROPIC_API_KEY` — get from [console.anthropic.com](https://console.anthropic.com/)
- `PLANT_NAME`, `UNIT_LIST`, `QA_HEAD`

### 6. Run APEX

```powershell
python run.py
```

Open **http://localhost:5000** in a browser.

---

## 🔌 Wiring Up Plant Data (Critical Step)

All plant integrations are in [`backend/tools/plant_tools.py`](backend/tools/plant_tools.py).

Every function has a `TODO` block showing exactly what to connect:

| Function | What to wire |
|---|---|
| `get_batch()` | ERP / MES / SQL database |
| `get_machine_status()` | SCADA / OPC-UA / MQTT / CMMS |
| `get_buyer_spec()` | Buyer spec database / document system |
| `get_dye_optimum()` | Dye recipe management system |
| `classify_defect_image()` | Vision AI model (cloud or local) |
| `predict_rejection()` | ML model endpoint |
| `get_similar_cases()` | Quality log database |
| `log_case()` | Quality log database |
| `escalate()` | SMS / WhatsApp / Teams / pager system |
| `stop_line_request()` | Supervisor notification system |

**Until you wire these up, all tools return realistic stub data** and
log a warning. The chatbot is fully functional for demos and testing.

---

## 🐳 Docker Deployment

```powershell
# Copy and fill in .env first
Copy-Item .env.example .env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

Access APEX at **http://YOUR_PLANT_SERVER_IP:5000**

---

## 👥 User Roles

Select your role in the sidebar before chatting:

| Role | Access level |
|---|---|
| OPERATOR | Short, action-first answers |
| INSPECTOR | Standard QC guidance |
| DYEHOUSE | Dye chemistry detail |
| SUPERVISOR | Shift report access |
| MAINTENANCE | Machine diagnostics |
| MANAGER | Full reports + trend analysis |

> ⚠️ In production, roles should come from your authentication system
> (Active Directory, SSO, etc.), not from the UI dropdown.

---

## 🔒 Security Notes

- **Never commit `.env`** — it contains your API key
- Tighten CORS in `backend/main.py` to your plant's IP range
- Add proper authentication (OAuth2 / LDAP) before production deployment
- Role assignment must come from your auth system, not user self-selection

---

## 📝 APEX Quick Commands

Type these in chat or use the sidebar buttons:

- `PREDICT` — batch rejection risk
- `SHADE` — dye-bath / Delta E check  
- `SHIFT REPORT` — current shift summary (Supervisor/Manager)
- `TREND` — weekly/monthly defect trends (Manager only)
- Paste a **batch ID** — APEX fetches all data automatically
- Upload a **fabric photo** — triggers defect image classification

---

## 📞 Support

For plant integration questions, contact your IT/MES team with the
`TODO` comments in `backend/tools/plant_tools.py` — they describe
exactly what API endpoints or database queries are needed.
