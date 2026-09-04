# PolarNav — Gemini AI Navigation Copilot

## 1. Role as an Explanation Layer
Gemini operates strictly as an **Explanation and Advisory Layer**. 

Gemini **never** independently computes routes, waypoints, fuel consumption, or risk scores. The data pipeline guarantees absolute truth:
```
Real Data / Sensors / ML
           ↓
   Polar Risk Engine
           ↓
 Polar A* Route Optimizer
           ↓
 Structured Decision Context JSON
           ↓
   Gemini Copilot
           ↓
 Grounded Human Explanation
```

## 2. Low-Latency Model Architecture
- **Model**: `gemini-flash-lite-latest`
- **Timeout**: 8.0s strict network timeout
- **Benchmark Latency**: **2.18 seconds** (down from 25+ seconds on legacy flash models)
- **Token Efficiency**: Grounded system prompts limit output to concise, high-density tactical summaries suitable for bridge officers.

## 3. Security & Zero Key Leakage
- **Backend-Only Storage**: `GEMINI_API_KEY` is loaded exclusively on the Render backend via environment variables.
- **Frontend Isolation**: The Vercel frontend has zero knowledge of the API key and communicates exclusively through `POST /api/copilot`.
- **Deterministic Fallback**: If Gemini encounters rate limits or network issues, `FallbackProvider` generates structured algorithmic explainability directly from the routing engine metrics, ensuring navigational decision support never halts.
