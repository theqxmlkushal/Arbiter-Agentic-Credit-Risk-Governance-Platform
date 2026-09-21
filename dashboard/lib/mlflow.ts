// MLflow REST API helpers — server-side only (used in API routes).

const MLFLOW_URI = process.env.MLFLOW_TRACKING_URI || "http://localhost:5000";

export async function fetchRegisteredModels() {
  const res = await fetch(`${MLFLOW_URI}/api/2.0/mlflow/registered-models/search`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`MLflow API error: ${res.status}`);
  return res.json();
}
