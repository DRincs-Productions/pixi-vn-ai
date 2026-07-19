import { stepHistory, type NarrationHistory } from "@drincs/pixi-vn";
import {
    ai,
    DialogTemplate,
    PromptBuilder,
    WebLLMProvider,
    type GenerateOptions,
} from "@drincs/pixi-vn-ai";
import type { InitProgressReport } from "@mlc-ai/web-llm";
import { useEffect, useState } from "react";
import { runIntroLabel } from "./labels/introLabel";

const MODEL_OPTIONS = [
  "SmolLM2-360M-Instruct-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
];

const SPEAKER = { name: "King", mood: "anxious" };
const LISTENER = { name: "Advisor" };

const promptBuilder = new PromptBuilder();

function renderDialogueLine(item: NarrationHistory, index: number) {
  if (!item.dialogue) {
    return null;
  }
  const text = Array.isArray(item.dialogue.text)
    ? item.dialogue.text.join("")
    : item.dialogue.text;
  return (
    <p key={index}>
      <strong>{String(item.dialogue.character ?? "")}</strong>: {text}
    </p>
  );
}

export default function App() {
  const [history, setHistory] = useState<NarrationHistory[]>([]);

  const [modelId, setModelId] = useState(MODEL_OPTIONS[0]);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [modelReady, setModelReady] = useState(false);

  const [request, setRequest] = useState(
    "Generate a short line of dialogue where the advisor reassures the king.",
  );
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeSpeaker, setIncludeSpeaker] = useState(true);
  const [includeListeners, setIncludeListeners] = useState(true);
  const [scene, setScene] = useState(
    "The throne room, late at night, lit by torches.",
  );
  const [style, setStyle] = useState("");
  const [language, setLanguage] = useState("");
  const [context, setContext] = useState("");

  const [promptPreview, setPromptPreview] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    runIntroLabel().then(() => setHistory(stepHistory.currentLabelHistory));
  }, []);

  function buildOptions(): GenerateOptions {
    return {
      history: includeHistory,
      speaker: includeSpeaker ? SPEAKER : undefined,
      listeners: includeListeners ? [LISTENER] : undefined,
      scene: scene || undefined,
      style: style || undefined,
      language: language || undefined,
      context: context || undefined,
    };
  }

  async function handleLoadModel() {
    setLoadingModel(true);
    setError("");
    setLoadingProgress("Starting download…");
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          setLoadingProgress(report.text);
        },
      });
      ai.init({ provider: new WebLLMProvider(engine) });
      setModelReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingModel(false);
    }
  }

  function handlePreviewPrompt() {
    setPromptPreview(
      promptBuilder.build(DialogTemplate, request, buildOptions()),
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setResult("");
    try {
      const text = await ai.dialog.generate(request, buildOptions());
      setResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <section style={{ flex: "0 0 280px" }}>
        <h2>Story so far</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Played automatically on load via Pixi'VN's narration, this is the
          narrative history `ai.dialog.generate` can inject when `history:
          true`.
        </p>
        {history.map(renderDialogueLine)}
      </section>

      <section style={{ flex: 1, maxWidth: 640 }}>
        <h2>@drincs/pixi-vn-ai playground</h2>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>1. Load a WebLLM model</legend>
          <select
            value={modelId}
            disabled={loadingModel || modelReady}
            onChange={(e) => setModelId(e.target.value)}
          >
            {MODEL_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>{" "}
          <button
            type="button"
            onClick={handleLoadModel}
            disabled={loadingModel || modelReady}
          >
            {modelReady
              ? "Model ready"
              : loadingModel
                ? "Loading…"
                : "Load model"}
          </button>
          {loadingModel && (
            <p style={{ fontSize: 13, color: "#666" }}>{loadingProgress}</p>
          )}
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>2. Developer request</legend>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={2}
            style={{ width: "100%" }}
          />
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>3. Generate options</legend>
          <label>
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
            />{" "}
            Include narrative history
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={includeSpeaker}
              onChange={(e) => setIncludeSpeaker(e.target.checked)}
            />{" "}
            Speaker: {JSON.stringify(SPEAKER)}
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={includeListeners}
              onChange={(e) => setIncludeListeners(e.target.checked)}
            />{" "}
            Listeners: {JSON.stringify([LISTENER])}
          </label>
          <br />
          <label>
            Scene:{" "}
            <input
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <br />
          <label>
            Style:{" "}
            <input value={style} onChange={(e) => setStyle(e.target.value)} />
          </label>{" "}
          <label>
            Language:{" "}
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </label>
          <br />
          <label>
            Context:{" "}
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </fieldset>

        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={handlePreviewPrompt}>
            Preview prompt
          </button>{" "}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!modelReady || generating}
          >
            {generating ? "Generating…" : "Generate dialogue"}
          </button>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {promptPreview && (
          <>
            <h3>Prompt sent to the provider</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f4f4f4",
                padding: 12,
              }}
            >
              {promptPreview}
            </pre>
          </>
        )}

        {result && (
          <>
            <h3>Generated dialogue</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f4f4f4",
                padding: 12,
              }}
            >
              {result}
            </pre>
          </>
        )}
      </section>
    </div>
  );
}
