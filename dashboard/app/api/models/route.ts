import { NextResponse } from "next/server";

export async function GET() {
  const mlflowUri = process.env.MLFLOW_TRACKING_URI || "http://localhost:5000";

  try {
    // Step 1: Search registered models
    const searchRes = await fetch(`${mlflowUri}/api/2.0/mlflow/registered-models/search`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!searchRes.ok) {
      // Return mock data if MLflow is unreachable (dev/fallback mode)
      return NextResponse.json(getMockModels());
    }

    const searchData = await searchRes.json();
    return NextResponse.json(searchData.registered_models || []);
  } catch {
    // MLflow not reachable — return mock data for dashboard development
    return NextResponse.json(getMockModels());
  }
}

function getMockModels() {
  return [
    {
      name: "credit_champion",
      latest_versions: [
        {
          version: 7,
          current_stage: "Production",
          run_id: "run_a1b2c3",
          creation_timestamp: Date.now(),
        },
      ],
    },
  ];
}
