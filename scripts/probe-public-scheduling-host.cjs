require("dotenv").config();

const DEFAULT_BASE_URL = process.argv[2] || process.env.PUBLIC_BASE_URL || "https://luxaiautomation.com";
const DEFAULT_ORG_ID =
  process.argv[3] ||
  process.env.SCHEDULING_TEST_ORG_ID ||
  "5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8";

async function request(target) {
  const init = {
    method: target.method,
    headers: target.headers ?? {},
  };

  if (target.body !== undefined) {
    init.body = target.body;
  }

  try {
    const response = await fetch(target.url, init);
    const text = await response.text();
    return {
      url: target.url,
      method: target.method,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentLength: text.length,
      bodyPreview: text.slice(0, 240),
    };
  } catch (error) {
    return {
      url: target.url,
      method: target.method,
      ok: false,
      status: null,
      statusText: error instanceof Error ? error.message : String(error),
      contentLength: null,
      bodyPreview: null,
    };
  }
}

async function main() {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, "");
  const targets = [
    {
      method: "GET",
      url: `${baseUrl}/`,
    },
    {
      method: "POST",
      url: `${baseUrl}/api/scheduling/internal/reconcile`,
      headers: {
        authorization: "Bearer invalid",
        "content-type": "application/json",
      },
      body: "{}",
    },
    {
      method: "GET",
      url: `${baseUrl}/api/scheduling/payment/status`,
    },
    {
      method: "POST",
      url: `${baseUrl}/api/scheduling/payment/resume`,
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    },
    {
      method: "POST",
      url: `${baseUrl}/api/scheduling/payment/checkout`,
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    },
    {
      method: "POST",
      url: `${baseUrl}/api/scheduling/webhooks/stripe/${DEFAULT_ORG_ID}`,
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    },
  ];

  const results = [];
  for (const target of targets) {
    results.push(await request(target));
  }

  console.log(
    JSON.stringify(
      {
        checkedAtUtc: new Date().toISOString(),
        baseUrl,
        orgId: DEFAULT_ORG_ID,
        results,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("probe-public-scheduling-host failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
