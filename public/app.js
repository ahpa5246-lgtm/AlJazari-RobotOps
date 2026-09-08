const copy = {
  en: { product: "ROBOT OPERATIONS INTELLIGENCE", liveOperations: "LIVE OPERATIONS / BAGHDAD", title: "Fleet command, without vendor blind spots.", lede: "Twenty virtual robots report through one capability-aware interface. Unsupported signals stay visibly unsupported.", topologyEyebrow: "FLEET TOPOLOGY", topology: "Operational field", evidenceEyebrow: "EXPLAINABLE EVIDENCE", evidence: "Why the system is concerned", registryEyebrow: "UNIVERSAL ROBOT REGISTRY", registry: "Fleet identities", search: "Search", state: "State", all: "All states", noEvidence: "No active anomaly evidence. Values remain simulated and this prototype makes no prediction accuracy claim.", updated: "Telemetry received", health: "health", inject: "Inject confirmed demo fault", noResults: "No robots match these filters.", unsupported: "Unsupported", total: "Total", online: "Online", working: "Working", idle: "Idle", warning: "Warning", critical: "Critical", completed: "Completed", failed: "Failed", cancelled: "Cancelled", acknowledge: "Acknowledge", acknowledged: "Acknowledged", occurrences: "occurrences", suppressed: "duplicates suppressed", recommendInspection: "Human inspection is recommended. No automatic physical action is permitted.", confirmTicket: "Confirm maintenance ticket", ticketOpen: "Maintenance ticket open", inspectWithin: "rule-based inspection window", hours: "hours", replayIncident: "Replay incident", incidentReplay: "Incident replay", replayWindow: "Replay window", noSpatialReplay: "Position was not supplied by this robot; the evidence timeline remains available without a spatial animation.", readOnlyReplay: "Read-only reconstruction from recorded simulator telemetry. It issues no physical command and makes no causal conclusion.", samples: "samples", diagnosticAssistant: "Review evidence", diagnosticTitle: "Evidence assistant", evidenceWindow: "Evidence window", workingHypothesis: "Working hypothesis", alternatives: "Alternative explanations", inspectionSteps: "Human inspection", noConfidence: "No validated probability model is available; no confidence percentage is shown.", diagnosticSafety: "Decision support only. This does not confirm a root cause and cannot issue a physical command.", missionTimeline: "Mission timeline", missionHistory: "Mission history", currentMission: "Current mission", noMission: "No recorded mission evidence is available for this robot.", missionSafety: "Read-only lifecycle from adapter telemetry. Missing starts, distance and reasons remain unavailable; no command is issued.", incompleteLifecycle: "Incomplete lifecycle evidence", duration: "Duration", distance: "Distance", seconds: "seconds" },
  ar: { product: "ذكاء عمليات الروبوتات", liveOperations: "عمليات مباشرة / بغداد", title: "قيادة أسطول بلا نقاط عمياء بين الشركات.", lede: "عشرون روبوتًا افتراضيًا ترسل بياناتها عبر واجهة موحّدة تراعي القدرات. ما لا يدعمه الروبوت يبقى ظاهرًا بوضوح على أنه غير مدعوم.", topologyEyebrow: "طوبولوجيا الأسطول", topology: "المجال التشغيلي", evidenceEyebrow: "أدلة قابلة للتفسير", evidence: "لماذا يشعر النظام بالقلق؟", registryEyebrow: "السجل الموحّد للروبوتات", registry: "هويات الأسطول", search: "بحث", state: "الحالة", all: "كل الحالات", noEvidence: "لا توجد أدلة شذوذ نشطة. البيانات محاكاة ولا يدّعي هذا النموذج دقة تنبؤية.", updated: "وصلت التليمترية", health: "الصحة", inject: "حقن عطل تجريبي مؤكد", noResults: "لا توجد روبوتات تطابق المرشحات.", unsupported: "غير مدعوم", total: "الإجمالي", online: "متصل", working: "يعمل", idle: "خامل", warning: "تحذير", critical: "حرج", completed: "مكتملة", failed: "فاشلة", cancelled: "ملغاة", acknowledge: "إقرار بشري", acknowledged: "تم الإقرار", occurrences: "مرات الرصد", suppressed: "تنبيهات مكررة حُجبت", recommendInspection: "يُنصح بفحص بشري. لا يُسمح بأي إجراء مادي تلقائي.", confirmTicket: "تأكيد تذكرة الصيانة", ticketOpen: "تذكرة الصيانة مفتوحة", inspectWithin: "مهلة الفحص حسب القاعدة", hours: "ساعة", replayIncident: "إعادة الحادثة", incidentReplay: "إعادة الحادثة", replayWindow: "نافذة الإعادة", noSpatialReplay: "لم يرسل هذا الروبوت موقعًا؛ يبقى تسلسل الأدلة متاحًا دون حركة مكانية.", readOnlyReplay: "إعادة بناء للقراءة فقط من تليمترية المحاكي المسجلة. لا تصدر أمرًا ماديًا ولا تستنتج سببًا قاطعًا.", samples: "عينات", diagnosticAssistant: "مراجعة الأدلة", diagnosticTitle: "مساعد الأدلة", evidenceWindow: "نافذة الأدلة", workingHypothesis: "فرضية العمل", alternatives: "تفسيرات بديلة", inspectionSteps: "فحص بشري", noConfidence: "لا يتوفر نموذج احتمالي مُعتمد؛ لذلك لا تظهر نسبة ثقة.", diagnosticSafety: "دعم قرار فقط. لا يؤكد سببًا جذريًا ولا يستطيع إصدار أمر مادي.", missionTimeline: "الخط الزمني للمهام", missionHistory: "سجل المهام", currentMission: "المهمة الحالية", noMission: "لا تتوفر أدلة مهام مسجلة لهذا الروبوت.", missionSafety: "دورة مهام للقراءة فقط من تليمترية المحوّل. تبقى البدايات والمسافات والأسباب المفقودة غير متاحة ولا يصدر أي أمر.", incompleteLifecycle: "أدلة دورة المهمة غير مكتملة", duration: "المدة", distance: "المسافة", seconds: "ثانية" }
};

let language = localStorage.getItem("robotops-language") || "en";
let snapshot = null;
const canvas = document.querySelector("#topology");
const context = canvas.getContext("2d");
const dialog = document.querySelector("#robot-dialog");
const search = document.querySelector("#search");
const status = document.querySelector("#status");

function t(key) { return copy[language][key] ?? key; }

async function load() {
  const params = new URLSearchParams({ search: search.value, status: status.value });
  const response = await fetch(`/api/fleet?${params}`);
  if (!response.ok) throw new Error("Fleet request failed");
  snapshot = await response.json();
  render();
}

function render() {
  renderCopy();
  document.querySelector("#metrics").innerHTML = ["total", "online", "working", "idle", "warning", "critical"].map((key) => `<div class="metric" data-tone="${key}"><strong>${snapshot.totals[key]}</strong><span>${t(key)}</span></div>`).join("");
  document.querySelector("#updated").textContent = `${t("updated")} · ${new Date(snapshot.generatedAt).toLocaleTimeString(language === "ar" ? "ar-IQ" : "en-GB", { timeZone: "UTC" })} UTC`;
  document.querySelector("#fleet").innerHTML = snapshot.robots.length ? snapshot.robots.map(robotCard).join("") : `<p class="empty">${t("noResults")}</p>`;
  document.querySelectorAll(".robot-row").forEach((button) => button.addEventListener("click", () => openRobot(button.dataset.id)));
  const alerts = snapshot.alerts ?? [];
  document.querySelector("#evidence-list").innerHTML = alerts.length ? alerts.slice(0, 8).map(alertCard).join("") : `<p class="empty">${t("noEvidence")}</p>`;
  document.querySelectorAll(".ack-alert").forEach((button) => button.addEventListener("click", () => acknowledgeAlert(button.dataset.alertId, button)));
  document.querySelectorAll(".create-ticket").forEach((button) => button.addEventListener("click", () => createMaintenanceTicket(button.dataset.alertId, button)));
  document.querySelectorAll(".replay-incident").forEach((button) => button.addEventListener("click", () => openIncident(button.dataset.incidentId)));
  drawTopology();
}

function renderCopy() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelector("#language").textContent = language === "en" ? "العربية" : "English";
}

function robotCard(robot) {
  return `<button class="robot-row" type="button" role="listitem" data-id="${robot.id}">
    <span class="robot-head"><span class="robot-id">${robot.id}</span><span class="status ${robot.operationalState}">${t(robot.operationalState)}</span></span>
    <h3>${robot.model}</h3><p>${robot.clientName} / ${robot.siteName}</p>
    <span class="health-line"><strong>${robot.health.overall ?? "—"}</strong><span>${t("health")} / 100</span></span>
  </button>`;
}

function alertCard(alert) {
  const anomaly = alert.evidence;
  const suggestion = snapshot.maintenance?.suggestions.find((item) => item.sourceAlertId === alert.id);
  const ticket = snapshot.maintenance?.tickets.find((item) => item.sourceAlertId === alert.id);
  const incident = snapshot.incidents?.find((item) => item.sourceAlertId === alert.id);
  let action = `<button class="ack-alert" type="button" data-alert-id="${alert.id}">${t("acknowledge")}</button>`;
  if (ticket) {
    action = `<span class="ticket-open">${t("ticketOpen")} · ${ticket.id}</span>`;
  } else if (suggestion) {
    action = `<div class="ticket-action"><span class="acknowledged">${t("acknowledged")} · ${alert.acknowledgement.actor}</span><span class="maintenance-window">${t("inspectWithin")}: ${suggestion.inspectWithinHours} ${t("hours")}</span><button class="create-ticket" type="button" data-alert-id="${alert.id}">${t("confirmTicket")}</button></div>`;
  } else if (alert.status === "acknowledged") {
    action = `<span class="acknowledged">${t("acknowledged")} · ${alert.acknowledgement.actor}</span>`;
  }
  return `<article class="evidence" data-severity="${alert.severity}" data-status="${alert.status}">
    <strong>${alert.robotId} · ${alert.code}</strong><p>${t("recommendInspection")}</p>
    <dl><div><dt>metric</dt><dd>${anomaly.metric}</dd></div><div><dt>value / threshold</dt><dd>${anomaly.value} / ${anomaly.threshold}</dd></div><div><dt>baseline mean</dt><dd>${anomaly.baselineMean}</dd></div><div><dt>z-score</dt><dd>${anomaly.zScore}</dd></div></dl>
    <div class="alert-meta"><span>${alert.occurrences} ${t("occurrences")}</span><span>${alert.suppressedOccurrences} ${t("suppressed")}</span></div>
    <div class="incident-action">${action}${incident ? `<button class="replay-incident" type="button" data-incident-id="${incident.id}">${t("replayIncident")}</button>` : ""}</div>
  </article>`;
}

async function acknowledgeAlert(alertId, button) {
  button.disabled = true;
  const response = await fetch(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actor: "demo-technician", confirmed: true })
  });
  if (!response.ok) {
    button.disabled = false;
    throw new Error("Alert acknowledgement failed");
  }
  await load();
}

async function createMaintenanceTicket(alertId, button) {
  button.disabled = true;
  const response = await fetch("/api/maintenance/tickets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ alertId, actor: "demo-technician", confirmed: true })
  });
  if (!response.ok) {
    button.disabled = false;
    throw new Error("Maintenance ticket confirmation failed");
  }
  await load();
}

async function openIncident(incidentId) {
  const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/replay`);
  if (!response.ok) throw new Error("Incident replay request failed");
  const replay = await response.json();
  const locale = language === "ar" ? "ar-IQ" : "en-GB";
  const signal = (event) => [
    ["battery", event.telemetry.batteryPercentage, "%"],
    ["motor current", event.telemetry.motorCurrent, "A"],
    ["motor temperature", event.telemetry.motorTemperature, "°C"],
    ["network", event.telemetry.networkLatency, "ms"],
    ["localization", event.telemetry.localizationQuality, "%"]
  ].filter(([, value]) => value !== null && value !== undefined)
    .map(([label, value, unit]) => `<span><b>${label}</b> ${value}${unit}</span>`).join("");
  const timeline = replay.events.map((event) => {
    const position = event.position ? `<span><b>position</b> ${event.position.x.toFixed(2)}, ${event.position.y.toFixed(2)}</span>` : "";
    return `<li class="incident-event"><time datetime="${event.observedAt}">${new Date(event.observedAt).toLocaleTimeString(locale)}</time><strong>${event.codes.join(" · ")}</strong><div class="incident-signal-grid">${signal(event)}${position}</div></li>`;
  }).join("");
  document.querySelector("#robot-detail").innerHTML = `<article class="detail incident-detail"><p class="eyebrow">SIMULATED DATA / READ-ONLY</p><h2>${t("incidentReplay")}</h2><p>${replay.robotId} · ${replay.trigger.metric}: ${replay.trigger.value} / ${replay.trigger.threshold}</p><div class="replay-summary"><strong>${t("replayWindow")}</strong><span>${new Date(replay.windowStartAt).toLocaleString(locale)} — ${new Date(replay.windowEndAt).toLocaleString(locale)}</span><span>${replay.sampleCount} ${t("samples")}</span></div>${replay.spatialReplayAvailable ? "" : `<p class="capability-notice">${t("noSpatialReplay")}</p>`}<ol class="incident-timeline">${timeline}</ol><p class="replay-safety">${t("readOnlyReplay")}</p></article>`;
  dialog.showModal();
}


async function openDiagnostic(robotId) {
  const question = language === "ar" ? "لخّص الأدلة الحالية لهذا الروبوت" : "Summarize the current evidence for this robot";
  const params = new URLSearchParams({ question });
  const response = await fetch(`/api/robots/${encodeURIComponent(robotId)}/diagnostics?${params}`);
  if (!response.ok) throw new Error("Diagnostic evidence request failed");
  const diagnostic = await response.json();
  const locale = language === "ar" ? "ar-IQ" : "en-GB";
  const observations = diagnostic.observations.length
    ? diagnostic.observations.map((item) => `<li><strong>${item.code}</strong><span>${item.metric}: ${item.value} / ${item.threshold}</span><time datetime="${item.observedAt}">${new Date(item.observedAt).toLocaleString(locale)}</time></li>`).join("")
    : `<li><strong>${diagnostic.summaryCode}</strong><span>${t("noEvidence")}</span></li>`;
  const alternatives = diagnostic.alternatives.map((item) => `<li><strong>${item.code}</strong><span>${item.evidenceGap}</span></li>`).join("");
  const inspections = diagnostic.recommendedInspection.map((item) => `<li><strong>${item.code}</strong><span>${item.action}</span></li>`).join("");
  const hypothesis = diagnostic.primaryHypothesis
    ? `<strong>${diagnostic.primaryHypothesis.code}</strong><p>${diagnostic.primaryHypothesis.rationale}</p>`
    : `<strong>${diagnostic.summaryCode}</strong><p>${t("noEvidence")}</p>`;

  document.querySelector("#robot-detail").innerHTML = `<article class="detail diagnostic-detail">
    <p class="eyebrow">SIMULATED DATA / DECISION SUPPORT</p>
    <h2 id="diagnostic-title" tabindex="-1">${t("diagnosticTitle")}</h2>
    <p>${diagnostic.robotId} · ${question}</p>
    <section class="diagnostic-window" aria-labelledby="diagnostic-window-title">
      <h3 id="diagnostic-window-title">${t("evidenceWindow")}</h3>
      <span>${diagnostic.timeRange.startedAt ? new Date(diagnostic.timeRange.startedAt).toLocaleString(locale) : "—"} — ${diagnostic.timeRange.endedAt ? new Date(diagnostic.timeRange.endedAt).toLocaleString(locale) : "—"}</span>
      <span>${diagnostic.timeRange.sampleCount} ${t("samples")}</span>
    </section>
    <section class="diagnostic-hypothesis" aria-labelledby="diagnostic-hypothesis-title"><h3 id="diagnostic-hypothesis-title">${t("workingHypothesis")}</h3>${hypothesis}</section>
    <section aria-labelledby="diagnostic-evidence-title"><h3 id="diagnostic-evidence-title">${t("evidence")}</h3><ol class="diagnostic-list">${observations}</ol></section>
    <section aria-labelledby="diagnostic-alternatives-title"><h3 id="diagnostic-alternatives-title">${t("alternatives")}</h3><ul class="diagnostic-list">${alternatives}</ul></section>
    <section aria-labelledby="diagnostic-inspection-title"><h3 id="diagnostic-inspection-title">${t("inspectionSteps")}</h3><ol class="diagnostic-list">${inspections}</ol></section>
    <p class="confidence-notice">${t("noConfidence")}</p>
    <p class="replay-safety">${t("diagnosticSafety")}</p>
  </article>`;
  document.querySelector("#diagnostic-title").focus();
}

async function openMissionTimeline(robotId) {
  const response = await fetch(`/api/robots/${encodeURIComponent(robotId)}/missions`);
  if (!response.ok) throw new Error("Mission timeline request failed");
  const timeline = await response.json();
  const locale = language === "ar" ? "ar-IQ" : "en-GB";
  const current = timeline.currentMission
    ? `<div class="mission-current"><span>${t("currentMission")}</span><strong>${timeline.currentMission.id}</strong><b>${t(timeline.currentMission.status)}</b></div>`
    : "";
  const events = timeline.events.length
    ? timeline.events.map((event) => `<li data-state="${event.state}"><time datetime="${event.observedAt}">${new Date(event.observedAt).toLocaleString(locale)}</time><strong>${event.missionId}</strong><span>${t(event.state)}</span><small>${event.distanceMeters === null ? `${t("distance")}: —` : `${t("distance")}: ${event.distanceMeters} m`}${event.reasonCode ? ` · ${event.reasonCode}` : ""}</small></li>`).join("")
    : `<li class="mission-empty"><span>${t("noMission")}</span></li>`;
  const records = timeline.missions.length
    ? timeline.missions.map((mission) => `<article data-state="${mission.status}"><span class="status ${mission.status}">${t(mission.status)}</span><h3>${mission.id}</h3><dl><div><dt>${t("duration")}</dt><dd>${mission.durationSeconds === null ? "—" : `${mission.durationSeconds} ${t("seconds")}`}</dd></div><div><dt>${t("distance")}</dt><dd>${mission.distanceMeters === null ? "—" : `${mission.distanceMeters} m`}</dd></div></dl>${mission.incompleteEvidence ? `<p>${t("incompleteLifecycle")}</p>` : ""}</article>`).join("")
    : "";

  document.querySelector("#robot-detail").innerHTML = `<article class="detail mission-detail">
    <p class="eyebrow">SIMULATED DATA / READ-ONLY MISSION EVIDENCE</p>
    <h2 id="mission-timeline-title" tabindex="-1">${t("missionTimeline")}</h2>
    <p>${timeline.robotId}</p>
    ${timeline.capabilityNotice ? `<p class="capability-notice">${timeline.capabilityNotice}</p>` : ""}
    ${current}
    <section aria-labelledby="mission-events-title"><h3 id="mission-events-title">${t("missionTimeline")}</h3><ol class="mission-events">${events}</ol></section>
    <section aria-labelledby="mission-history-title"><h3 id="mission-history-title">${t("missionHistory")}</h3><div class="mission-records">${records}</div></section>
    <p class="replay-safety">${t("missionSafety")}</p>
  </article>`;
  document.querySelector("#mission-timeline-title").focus();
}

async function openRobot(robotId) {
  const response = await fetch(`/api/robots/${encodeURIComponent(robotId)}`);
  const robot = await response.json();
  const capabilities = Object.entries(robot.capabilities).map(([key, supported]) => `<span class="${supported ? "" : "unsupported"}">${key}: ${supported ? "✓" : t("unsupported")}</span>`).join("");
  document.querySelector("#robot-detail").innerHTML = `<article class="detail"><p class="eyebrow">SIMULATED DATA / ${robot.manufacturer}</p><h2>${robot.id}</h2><p>${robot.model} · ${robot.clientName} · ${robot.siteName}</p><dl class="detail-grid"><div><dt>Health</dt><dd>${robot.health.overall ?? "—"}/100</dd></div><div><dt>Battery</dt><dd>${robot.telemetry.batteryPercentage}%</dd></div><div><dt>Network</dt><dd>${robot.telemetry.networkLatency} ms</dd></div><div><dt>Mission</dt><dd>${robot.telemetry.mission?.state ?? t("unsupported")}</dd></div><div><dt>Motor current</dt><dd>${robot.telemetry.motorCurrent ?? t("unsupported")}</dd></div><div><dt>Observed</dt><dd>${new Date(robot.telemetry.observedAt).toLocaleTimeString()}</dd></div></dl><h3>Capability discovery</h3><div class="capabilities">${capabilities}</div><div class="diagnostic-action"><button type="button" data-diagnostic>${t("diagnosticAssistant")}</button><button type="button" data-missions>${t("missionTimeline")}</button><p>${t("diagnosticSafety")}</p></div><div class="fault-controls"><p>This action changes simulator data only. It cannot control a physical robot.</p><button type="button" data-fault="network-instability">${t("inject")}: network</button></div></article>`;
  dialog.showModal();
  dialog.querySelector("[data-diagnostic]").addEventListener("click", () => openDiagnostic(robotId));
  dialog.querySelector("[data-missions]").addEventListener("click", () => openMissionTimeline(robotId));
  dialog.querySelector("[data-fault]").addEventListener("click", async (event) => {
    await fetch("/api/simulator/faults", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ robotId, fault: event.currentTarget.dataset.fault, confirmed: true }) });
    dialog.close(); await load();
  });
}

function drawTopology() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  const sites = [...new Map(snapshot.robots.map((robot) => [robot.siteId, robot.siteName])).entries()];
  const centers = sites.map(([id, name], index) => ({ id, name, x: rect.width * (.22 + index * .28), y: rect.height * (.42 + (index % 2) * .18) }));
  context.strokeStyle = "#31564b"; context.setLineDash([5, 8]); context.lineWidth = 1;
  centers.forEach((center, index) => { if (index) { context.beginPath(); context.moveTo(centers[index - 1].x, centers[index - 1].y); context.lineTo(center.x, center.y); context.stroke(); } });
  context.setLineDash([]);
  snapshot.robots.forEach((robot, index) => {
    const center = centers.find((site) => site.id === robot.siteId);
    const sameSiteIndex = snapshot.robots.filter((item) => item.siteId === robot.siteId).findIndex((item) => item.id === robot.id);
    const angle = sameSiteIndex * .9 + index * .08;
    const radius = 46 + (sameSiteIndex % 3) * 19;
    const x = center.x + Math.cos(angle) * radius; const y = center.y + Math.sin(angle) * radius;
    context.beginPath(); context.moveTo(center.x, center.y); context.lineTo(x, y); context.strokeStyle = "#26473e"; context.stroke();
    context.beginPath(); context.arc(x, y, robot.operationalState === "critical" ? 7 : 5, 0, Math.PI * 2); context.fillStyle = tone(robot.operationalState); context.fill();
  });
  centers.forEach((center) => { context.fillStyle = "#edf4e9"; context.font = "700 11px ui-monospace"; context.textAlign = "center"; context.fillText(center.name.toUpperCase(), center.x, center.y - 9); });
  document.querySelector("#topology-key").innerHTML = ["working", "idle", "warning", "critical"].map((key) => `<span style="--key-color:${tone(key)}">${t(key)}</span>`).join("");
  document.querySelector("#canvas-summary").textContent = `${snapshot.totals.total} robots across ${sites.length} sites. ${snapshot.totals.warning} warnings and ${snapshot.totals.critical} critical.`;
}

function tone(state) { return ({ working: "#a7f06f", idle: "#58d8d1", warning: "#f2b84b", critical: "#ff665c" })[state] || "#91a79f"; }
function debounce(fn, delay = 250) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }

document.querySelector("#language").addEventListener("click", () => { language = language === "en" ? "ar" : "en"; localStorage.setItem("robotops-language", language); render(); });
document.querySelector("#filters").addEventListener("input", debounce(load));
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
window.addEventListener("resize", debounce(() => snapshot && drawTopology(), 100));
setInterval(() => { document.querySelector("#clock").textContent = `${new Date().toLocaleTimeString("en-GB", { timeZone: "UTC" })} UTC`; }, 1000);
load().catch((error) => { document.querySelector("#fleet").innerHTML = `<p class="empty" role="alert">${error.message}</p>`; });
