import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { FleetService } from "./fleet-service.js";

const root = fileURLToPath(new URL("../public", import.meta.url));
const service = new FleetService();
const port = Number(process.env.PORT ?? 3000);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    if (request.method === "GET" && url.pathname === "/api/health") return json(response, 200, { status: "ok", mode: "simulated", physicalControl: false });
    if (request.method === "GET" && url.pathname === "/api/fleet") {
      return json(response, 200, service.snapshot({
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined,
        search: url.searchParams.get("search") || "",
        status: url.searchParams.get("status") || undefined
      }));
    }
    if (request.method === "GET" && url.pathname === "/api/analytics/missions") {
      return json(response, 200, service.missionAnalytics({
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      }));
    }
    if (request.method === "GET" && url.pathname === "/api/alerts") {
      return json(response, 200, {
        simulated: true,
        alerts: service.alerts({
          organizationId: "org-aljazari-demo",
          clientId: url.searchParams.get("clientId") || undefined
        })
      });
    }
    if (request.method === "GET" && url.pathname === "/api/maintenance") {
      return json(response, 200, service.maintenance({
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      }));
    }
    if (request.method === "GET" && url.pathname === "/api/incidents") {
      return json(response, 200, {
        simulated: true,
        incidents: service.incidents({
          organizationId: "org-aljazari-demo",
          clientId: url.searchParams.get("clientId") || undefined
        })
      });
    }
    if (request.method === "GET" && /^\/api\/incidents\/[^/]+\/replay$/.test(url.pathname)) {
      const incidentId = decodeURIComponent(url.pathname.split("/").at(-2));
      const incident = service.incident(incidentId, {
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      });
      return json(response, incident ? 200 : 404, incident ?? { error: "Incident not found in tenant" });
    }
    if (request.method === "GET" && /^\/api\/robots\/[^/]+\/diagnostics$/.test(url.pathname)) {
      const robotId = decodeURIComponent(url.pathname.split("/").at(-2));
      const diagnostic = service.diagnostic(robotId, {
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      }, url.searchParams.get("question") || "");
      return json(response, diagnostic ? 200 : 404, diagnostic ?? { error: "Robot not found in tenant" });
    }
    if (request.method === "GET" && /^\/api\/robots\/[^/]+\/missions$/.test(url.pathname)) {
      const robotId = decodeURIComponent(url.pathname.split("/").at(-2));
      const timeline = service.missionTimeline(robotId, {
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      });
      return json(response, timeline ? 200 : 404, timeline ?? { error: "Robot not found in tenant" });
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/robots/")) {
      const robot = service.robot(decodeURIComponent(url.pathname.split("/").at(-1)), {
        organizationId: "org-aljazari-demo",
        clientId: url.searchParams.get("clientId") || undefined
      });
      return json(response, robot ? 200 : 404, robot ?? { error: "Robot not found in tenant" });
    }
    if (request.method === "POST" && /^\/api\/alerts\/[^/]+\/acknowledge$/.test(url.pathname)) {
      const body = await readBody(request);
      const alertId = decodeURIComponent(url.pathname.split("/").at(-2));
      return json(response, 200, {
        simulated: true,
        alert: service.acknowledgeAlert(alertId, body, {
          organizationId: "org-aljazari-demo",
          clientId: url.searchParams.get("clientId") || undefined
        })
      });
    }
    if (request.method === "POST" && url.pathname === "/api/maintenance/tickets") {
      const body = await readBody(request);
      return json(response, 200, {
        simulated: true,
        ...service.confirmMaintenanceTicket(body.alertId, body, {
          organizationId: "org-aljazari-demo",
          clientId: url.searchParams.get("clientId") || undefined
        })
      });
    }
    if (request.method === "POST" && url.pathname === "/api/simulator/faults") {
      const body = await readBody(request);
      if (body.confirmed !== true) return json(response, 400, { error: "Explicit human confirmation is required" });
      return json(response, 200, service.injectFault(body.robotId, body.fault));
    }
    if (url.pathname.startsWith("/api/")) return json(response, 404, { error: "Not found" });
    return staticFile(url.pathname, response);
  } catch (error) {
    return json(response, 400, { error: error.message });
  }
});

async function staticFile(pathname, response) {
  const safePath = normalize(pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
  const filePath = join(root, safePath);
  const relativePath = relative(root, filePath);
  if (relativePath.startsWith("..") || relativePath.includes("/../") || relativePath.includes("\\..\\")) return json(response, 403, { error: "Forbidden" });
  try {
    const details = await stat(filePath);
    if (!details.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "content-type": types[extname(filePath)] ?? "application/octet-stream", "cache-control": "no-store" });
    response.end(await readFile(filePath));
  } catch { return json(response, 404, { error: "Not found" }); }
}

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16_384) throw new Error("Payload too large");
  }
  return JSON.parse(raw || "{}");
}

server.listen(port, () => console.log(`AlJazari RobotOps listening on http://localhost:${port}`));

export { server };
