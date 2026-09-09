import { escapeHtml, groupSites, comparisonRows, toggleComparison } from './fleet-view.js';

const copy = {
  en: { product: "DELIVERY FLEET INTELLIGENCE", liveOperations: "LIVE OPERATIONS / FICTIONAL NETWORK", title: "Parcel routes, without evidence gaps.", lede: "Twenty fictional delivery units report parcels and routes through one capability-aware interface. Unsupported signals stay visibly unsupported.", topologyEyebrow: "FLEET TOPOLOGY", topology: "Operational field", evidenceEyebrow: "EXPLAINABLE EVIDENCE", evidence: "Why the system is concerned", registryEyebrow: "UNIVERSAL ROBOT REGISTRY", registry: "Fleet identities", search: "Search", state: "State", all: "All states", noEvidence: "No active anomaly evidence. Values remain simulated and this prototype makes no prediction accuracy claim.", updated: "Telemetry received", health: "health", inject: "Inject confirmed demo fault", noResults: "No robots match these filters.", unsupported: "Unsupported", total: "Total", online: "Online", working: "Working", idle: "Idle", warning: "Warning", critical: "Critical", completed: "Completed", failed: "Failed", cancelled: "Cancelled", acknowledge: "Acknowledge", acknowledged: "Acknowledged", occurrences: "occurrences", suppressed: "duplicates suppressed", recommendInspection: "Human inspection is recommended. No automatic physical action is permitted.", confirmTicket: "Confirm maintenance ticket", ticketOpen: "Maintenance ticket open", inspectWithin: "rule-based inspection window", hours: "hours", replayIncident: "Replay incident", incidentReplay: "Incident replay", replayWindow: "Replay window", noSpatialReplay: "Position was not supplied by this robot; the evidence timeline remains available without a spatial animation.", readOnlyReplay: "Read-only reconstruction from recorded simulator telemetry. It issues no physical command and makes no causal conclusion.", samples: "samples", diagnosticAssistant: "Review evidence", diagnosticTitle: "Evidence assistant", evidenceWindow: "Evidence window", workingHypothesis: "Working hypothesis", alternatives: "Alternative explanations", inspectionSteps: "Human inspection", noConfidence: "No validated probability model is available; no confidence percentage is shown.", diagnosticSafety: "Decision support only. This does not confirm a root cause and cannot issue a physical command.", missionTimeline: "Mission timeline", missionHistory: "Mission history", currentMission: "Current mission", noMission: "No recorded mission evidence is available for this robot.", missionSafety: "Read-only lifecycle from adapter telemetry. Missing starts, distance and reasons remain unavailable; no command is issued.", incompleteLifecycle: "Incomplete lifecycle evidence", duration: "Duration", distance: "Distance", seconds: "seconds", missionPerformanceEyebrow: "RECORDED MISSION PERFORMANCE", missionPerformance: "Fleet mission ledger", completionRate: "Completion rate", failureRate: "Failure rate", cancellationRate: "Cancellation rate", utilizationRate: "Observed utilization", terminalBasis: "observed terminal outcomes", sampleBasis: "reported mission-state samples", averageDuration: "Average evidenced duration", totalDistance: "Total evidenced distance", contributing: "contributing", excluded: "excluded", robotCoverage: "robots report mission telemetry", noRatedEvidence: "No eligible denominator; rate unavailable", confidenceUnavailable: "confidence unavailable", physicalControlOff: "physical control off" },
  ar: { product: "ذكاء أسطول توصيل الطرود", liveOperations: "عمليات مباشرة / شبكة خيالية", title: "مسارات طرود بلا فجوات في الأدلة.", lede: "عشرون وحدة توصيل خيالية ترسل بيانات الطرود والمسارات عبر واجهة موحّدة تراعي القدرات. ما لا يدعمه الروبوت يبقى ظاهرًا بوضوح على أنه غير مدعوم.", topologyEyebrow: "طوبولوجيا الأسطول", topology: "المجال التشغيلي", evidenceEyebrow: "أدلة قابلة للتفسير", evidence: "لماذا يشعر النظام بالقلق؟", registryEyebrow: "السجل الموحّد للروبوتات", registry: "هويات الأسطول", search: "بحث", state: "الحالة", all: "كل الحالات", noEvidence: "لا توجد أدلة شذوذ نشطة. البيانات محاكاة ولا يدّعي هذا النموذج دقة تنبؤية.", updated: "وصلت التليمترية", health: "الصحة", inject: "حقن عطل تجريبي مؤكد", noResults: "لا توجد روبوتات تطابق المرشحات.", unsupported: "غير مدعوم", total: "الإجمالي", online: "متصل", working: "يعمل", idle: "خامل", warning: "تحذير", critical: "حرج", completed: "مكتملة", failed: "فاشلة", cancelled: "ملغاة", acknowledge: "إقرار بشري", acknowledged: "تم الإقرار", occurrences: "مرات الرصد", suppressed: "تنبيهات مكررة حُجبت", recommendInspection: "يُنصح بفحص بشري. لا يُسمح بأي إجراء مادي تلقائي.", confirmTicket: "تأكيد تذكرة الصيانة", ticketOpen: "تذكرة الصيانة مفتوحة", inspectWithin: "مهلة الفحص حسب القاعدة", hours: "ساعة", replayIncident: "إعادة الحادثة", incidentReplay: "إعادة الحادثة", replayWindow: "نافذة الإعادة", noSpatialReplay: "لم يرسل هذا الروبوت موقعًا؛ يبقى تسلسل الأدلة متاحًا دون حركة مكانية.", readOnlyReplay: "إعادة بناء للقراءة فقط من تليمترية المحاكي المسجلة. لا تصدر أمرًا ماديًا ولا تستنتج سببًا قاطعًا.", samples: "عينات", diagnosticAssistant: "مراجعة الأدلة", diagnosticTitle: "مساعد الأدلة", evidenceWindow: "نافذة الأدلة", workingHypothesis: "فرضية العمل", alternatives: "تفسيرات بديلة", inspectionSteps: "فحص بشري", noConfidence: "لا يتوفر نموذج احتمالي مُعتمد؛ لذلك لا تظهر نسبة ثقة.", diagnosticSafety: "دعم قرار فقط. لا يؤكد سببًا جذريًا ولا يستطيع إصدار أمر مادي.", missionTimeline: "الخط الزمني للمهام", missionHistory: "سجل المهام", currentMission: "المهمة الحالية", noMission: "لا تتوفر أدلة مهام مسجلة لهذا الروبوت.", missionSafety: "دورة مهام للقراءة فقط من تليمترية المحوّل. تبقى البدايات والمسافات والأسباب المفقودة غير متاحة ولا يصدر أي أمر.", incompleteLifecycle: "أدلة دورة المهمة غير مكتملة", duration: "المدة", distance: "المسافة", seconds: "ثانية", missionPerformanceEyebrow: "أداء المهام المسجّل", missionPerformance: "دفتر مهام الأسطول", completionRate: "معدل الإكمال", failureRate: "معدل الفشل", cancellationRate: "معدل الإلغاء", utilizationRate: "الاستفادة المرصودة", terminalBasis: "نتائج نهائية مرصودة", sampleBasis: "عينات أبلغت حالة المهمة", averageDuration: "متوسط المدة المثبتة", totalDistance: "إجمالي المسافة المثبتة", contributing: "مساهمة", excluded: "مستبعدة", robotCoverage: "روبوتات ترسل تليمترية المهام", noRatedEvidence: "لا يوجد مقام مؤهل؛ المعدل غير متاح", confidenceUnavailable: "الثقة غير متاحة", physicalControlOff: "التحكم الفيزيائي متوقف" }
};

Object.assign(copy.en, { product: "DELIVERY FLEET INTELLIGENCE", title: "Every parcel has a path.", lede: "Follow pickup, route and drop-off evidence across a fictional parcel-delivery fleet. Unsupported signals remain visibly unavailable.", liveOperations: "SIMULATED DELIVERY NETWORK / MONITORING", navOverview: "Network", navFleet: "Delivery units", navEvidence: "Exception desk", navMissions: "Parcel ledger", monitorOnly: "READ-ONLY MONITOR", sessionTitle: "ROUTE OPERATIONS / FICTIONAL NETWORK", explore: "Follow the route", specimen: "DELIVERY UNIT / 01", illustration: "Illustrative parcel carrier · not hardware geometry", selectedRobot: "SELECTED DELIVERY UNIT", openPassport: "Open delivery passport ↗", topology: "Routes grouped by delivery zone", topologyEyebrow: "PICKUP → ROUTE → DROP-OFF", evidence: "Delivery exception evidence", registry: "Parcel-delivery fleet", registryEyebrow: "DELIVERY UNIT REGISTRY", missionPerformanceEyebrow: "RECORDED DELIVERY PERFORMANCE", missionPerformance: "Parcel delivery ledger", missionTimeline: "Parcel route timeline", missionHistory: "Delivery history", currentMission: "Current parcel run", analyticsScope: "Delivery metrics cover the full fictional fleet; registry filters do not change this observation window.", compareHint: "Choose two delivery units to compare their measured signals.", clearComparison: "Clear selection", compare: "Compare", selectCompare: "Add to comparison", selectedCompare: "Selected for comparison", footerSafety: "Independent fictional prototype · SIMULATED DATA · No affiliation · No physical control", pause: "Pause updates", resume: "Resume updates", refresh: "Refresh", paused: "Display paused", live: "Auto-refresh · 5s", loading: "Loading delivery telemetry…", offline: "Refresh failed. Displaying the last snapshot; retry Refresh.", batteryLabel: "Battery", networkLabel: "Network latency", motorLabel: "Motor current", temperatureLabel: "Motor temperature", observedLabel: "Observed at (UTC)", comparisonTitle: "Delivery evidence, side by side.", comparisonSafety: "Snapshot comparison, not a ranking. Missing capabilities remain unavailable. Health is a documented heuristic, not a failure probability.", atlasNote: "Grouped by fictional delivery zone, not live physical position. Select a unit to inspect its delivery passport.", robotCount: "delivery units", filteredScope: "Filtered fleet", metricLabel: "Signal", close: "Close evidence", searchPlaceholder: "Unit, model, client, delivery zone" });
Object.assign(copy.ar, { product: "ذكاء أسطول توصيل الطرود", title: "لكل طرد مسار.", lede: "تابعي أدلة الاستلام والمسار والتسليم ضمن أسطول خيالي لروبوتات توصيل الطرود. تبقى الإشارات غير المدعومة ظاهرة بوضوح.", liveOperations: "شبكة توصيل محاكاة / مراقبة", navOverview: "الشبكة", navFleet: "وحدات التوصيل", navEvidence: "مكتب الاستثناءات", navMissions: "دفتر الطرود", monitorOnly: "مراقبة للقراءة فقط", sessionTitle: "عمليات المسار / شبكة خيالية", explore: "تتبّعي المسار", specimen: "وحدة توصيل / ٠١", illustration: "ناقل طرود توضيحي · لا يمثل هندسة جهاز", selectedRobot: "وحدة التوصيل المختارة", openPassport: "افتحي ملف التوصيل ↗", topology: "المسارات حسب منطقة التوصيل", topologyEyebrow: "استلام ← مسار ← تسليم", evidence: "أدلة استثناءات التوصيل", registry: "أسطول توصيل الطرود", registryEyebrow: "سجل وحدات التوصيل", missionPerformanceEyebrow: "أداء التوصيل المسجّل", missionPerformance: "دفتر توصيل الطرود", missionTimeline: "الخط الزمني لمسار الطرد", missionHistory: "سجل التوصيل", currentMission: "رحلة الطرد الحالية", analyticsScope: "مؤشرات التوصيل تخص الأسطول الخيالي كاملًا؛ مرشحات السجل لا تغيّر نافذة الرصد.", compareHint: "اختاري وحدتي توصيل لمقارنة إشاراتهما المقاسة.", clearComparison: "مسح الاختيار", compare: "مقارنة", selectCompare: "إضافة للمقارنة", selectedCompare: "مختارة للمقارنة", footerSafety: "نموذج خيالي مستقل · SIMULATED DATA · بلا انتساب · دون تحكم فيزيائي", pause: "إيقاف التحديث مؤقتًا", resume: "استئناف التحديث", refresh: "تحديث", paused: "العرض متوقف مؤقتًا", live: "تحديث تلقائي · ٥ ثوانٍ", loading: "جارٍ تحميل تليمترية التوصيل…", offline: "تعذّر التحديث. تُعرض آخر لقطة؛ أعيدي المحاولة بزر تحديث.", batteryLabel: "البطارية", networkLabel: "تأخير الشبكة", motorLabel: "تيار المحرك", temperatureLabel: "حرارة المحرك", observedLabel: "وقت الرصد (UTC)", comparisonTitle: "أدلة التوصيل، جنبًا إلى جنب.", comparisonSafety: "مقارنة لقطة وليست ترتيبًا. تبقى القدرات المفقودة غير متاحة؛ الصحة مؤشر بقواعد موثقة وليست احتمال عطل.", atlasNote: "التجميع حسب منطقة توصيل خيالية وليس موقعًا حيًا. اختاري وحدة لفحص ملف التوصيل.", robotCount: "وحدات توصيل", filteredScope: "الأسطول المرشّح", metricLabel: "الإشارة", close: "إغلاق الأدلة", searchPlaceholder: "الوحدة، الموديل، العميل، منطقة التوصيل" });

let language = "en";
try { language = localStorage.getItem("parcel-grid-language") === "ar" ? "ar" : "en"; } catch { /* Private browsing can deny storage. */ }
let snapshot = null;
let missionAnalytics = null;
let selectedRobotId = null;
let comparisonIds = [];
let paused = false;
let loading = false;
let failed = false;
let reloadRequested = false;
const dialog = document.querySelector("#robot-dialog");
const search = document.querySelector("#search");
const status = document.querySelector("#status");

function t(key) { return copy[language][key] ?? key; }

Object.assign(copy.en, { inspecting: 'Reading mode · automatic updates held', capabilitiesLabel: 'Capability discovery', battery: 'Battery', motors: 'Motors', sensors: 'Sensors', network: 'Network', pose: 'Position', missions: 'Missions', connectivity: 'Connectivity', healthBasis: 'Inside the health score', healthExplanation: 'health-v1 · weighted mean: battery 30%, motors 30%, sensors 20%, connectivity 20%. Unsupported components are excluded; the remaining weights are normalized. Not a failure probability.', faultSafety: 'This changes simulator data only. It cannot control a physical robot.', confirmFault: 'Inject a network fault into this simulated robot?', backRobot: '← Robot passport', actionFailed: 'The action failed. No success has been confirmed. Close and retry.', metric: 'Signal', threshold: 'Value / threshold', baseline: 'Baseline mean', zscore: 'Z-score' });
Object.assign(copy.ar, { inspecting: 'وضع القراءة · التحديث التلقائي معلّق', capabilitiesLabel: 'اكتشاف القدرات', battery: 'البطارية', motors: 'المحركات', sensors: 'الحساسات', network: 'الشبكة', pose: 'الموقع', missions: 'المهام', connectivity: 'الاتصال', healthBasis: 'داخل مؤشر الصحة', healthExplanation: 'health-v1 · متوسط مرجّح: البطارية ٣٠٪، المحركات ٣٠٪، الحساسات ٢٠٪، الاتصال ٢٠٪. تُستبعد المكونات غير المدعومة وتُعاد موازنة البقية. ليس احتمال عطل.', faultSafety: 'يغيّر هذا بيانات المحاكي فقط؛ لا يمكنه التحكم بروبوت حقيقي.', confirmFault: 'هل تؤكدين حقن عطل شبكة في هذا الروبوت المحاكى؟', backRobot: '← ملف الروبوت', actionFailed: 'تعذّر الإجراء ولم يُؤكَّد نجاحه. أغلقي النافذة وأعيدي المحاولة.', metric: 'الإشارة', threshold: 'القيمة / العتبة', baseline: 'متوسط الأساس', zscore: 'درجة Z' });
Object.assign(copy.en, { parcel: 'Parcel', route: 'Route', pickup: 'Pickup', dropoff: 'Drop-off', payload: 'Payload', capacity: 'Capacity', deliveryException: 'Delivery exception', routeProgress: 'Route progress' });
Object.assign(copy.ar, { parcel: 'الطرد', route: 'المسار', pickup: 'الاستلام', dropoff: 'التسليم', payload: 'الحمولة', capacity: 'السعة', deliveryException: 'استثناء التوصيل', routeProgress: 'تقدم المسار' });

async function load() {
  if (loading) { reloadRequested = true; return; }
  loading = true;
  document.querySelector('#refresh-now').disabled = true;
  updateConnection();
  try {
  const params = new URLSearchParams({ search: search.value, status: status.value });
  const response = await fetch(`/api/fleet?${params}`);
  if (!response.ok) throw new Error("Fleet request failed");
  const nextSnapshot = await response.json();
  const analyticsResponse = await fetch("/api/analytics/missions");
  if (!analyticsResponse.ok) throw new Error("Mission analytics request failed");
  missionAnalytics = await analyticsResponse.json();
  snapshot = nextSnapshot;
  failed = false;
  comparisonIds = comparisonIds.filter(id => snapshot.robots.some(robot => robot.id === id));
  render();
  } catch (error) {
    failed = true;
    if (!snapshot) document.querySelector('#fleet').innerHTML = `<p class="empty">${t('offline')}</p>`;
  } finally {
    loading = false;
    document.querySelector('#refresh-now').disabled = false;
    updateConnection();
    if (reloadRequested) { reloadRequested = false; load(); }
  }
}

function render() {
  renderCopy();
  if (!snapshot) return;
  const active = document.activeElement;
  const focusKey = active?.dataset?.id ?? active?.dataset?.compareId ?? active?.dataset?.atlasId;
  const focusKind = active?.classList.contains('compare-toggle') ? '.compare-toggle' : active?.classList.contains('atlas-node') ? '.atlas-node' : '.robot-row';
  document.querySelector("#metrics").innerHTML = ["total", "online", "working", "idle", "warning", "critical"].map((key) => `<div class="metric" data-tone="${key}"><strong>${snapshot.totals[key]}</strong><span>${t(key)}</span></div>`).join("");
  document.querySelector("#updated").textContent = `${t("updated")} · ${new Date(snapshot.generatedAt).toLocaleTimeString(language === "ar" ? "ar-IQ" : "en-GB", { timeZone: "UTC" })} UTC`;
  document.querySelector("#fleet").innerHTML = snapshot.robots.length ? snapshot.robots.map(robotCard).join("") : `<p class="empty">${t("noResults")}</p>`;
  document.querySelectorAll(".robot-row").forEach((button) => button.addEventListener("click", () => runAction(() => openRobot(button.dataset.id))));
  const alerts = snapshot.alerts ?? [];
  document.querySelector("#evidence-list").innerHTML = alerts.length ? alerts.slice(0, 8).map(alertCard).join("") : `<p class="empty">${t("noEvidence")}</p>`;
  document.querySelectorAll(".ack-alert").forEach((button) => button.addEventListener("click", () => runAction(() => acknowledgeAlert(button.dataset.alertId, button), button)));
  document.querySelectorAll(".create-ticket").forEach((button) => button.addEventListener("click", () => runAction(() => createMaintenanceTicket(button.dataset.alertId, button), button)));
  document.querySelectorAll(".replay-incident").forEach((button) => button.addEventListener("click", () => runAction(() => openIncident(button.dataset.incidentId))));
  renderMissionAnalytics();
  drawTopology();
  renderSelection();
  updateComparison();
  if (focusKey) [...document.querySelectorAll(focusKind)].find(el => (el.dataset.id ?? el.dataset.compareId ?? el.dataset.atlasId) === focusKey)?.focus({ preventScroll: true });
}

function renderMissionAnalytics() {
  const locale = language === "ar" ? "ar-IQ" : "en-GB";
  const windowStart = missionAnalytics.observationWindow.startedAt;
  const windowEnd = missionAnalytics.observationWindow.endedAt;
  document.querySelector("#mission-window").textContent = windowStart && windowEnd
    ? `${new Date(windowStart).toLocaleTimeString(locale)} — ${new Date(windowEnd).toLocaleTimeString(locale)} · ${missionAnalytics.observationWindow.telemetrySampleCount} ${t("samples")}`
    : t("noRatedEvidence");
  const rates = [
    ["completionRate", missionAnalytics.outcomes.completion, "completion"],
    ["failureRate", missionAnalytics.outcomes.failure, "failure"],
    ["cancellationRate", missionAnalytics.outcomes.cancellation, "cancellation"],
    ["utilizationRate", missionAnalytics.utilization, "utilization"]
  ];
  const cards = rates.map(([label, metric, toneName]) => `<article data-tone="${toneName}"><span>${t(label)}</span><strong>${metric.valuePercent === null ? "—" : `${metric.valuePercent}%`}</strong><small>${metric.numerator} / ${metric.denominator} · ${toneName === "utilization" ? t("sampleBasis") : t("terminalBasis")}</small></article>`).join("");
  const coverage = `${missionAnalytics.coverage.missionCapableRobots}/${missionAnalytics.coverage.totalRobots} ${t("robotCoverage")}`;
  const duration = `${t("averageDuration")}: ${missionAnalytics.duration.value === null ? "—" : `${missionAnalytics.duration.value} ${t("seconds")}`} · ${missionAnalytics.duration.contributingRecords} ${t("contributing")} / ${missionAnalytics.duration.excludedRecords} ${t("excluded")}`;
  const distance = `${t("totalDistance")}: ${missionAnalytics.distance.value === null ? "—" : `${missionAnalytics.distance.value} m`} · ${missionAnalytics.distance.contributingRecords} ${t("contributing")} / ${missionAnalytics.distance.excludedRecords} ${t("excluded")}`;
  document.querySelector("#mission-analytics").innerHTML = `<div class="mission-rate-grid">${cards}</div><div class="mission-ledger-evidence"><span>${coverage}</span><span>${duration}</span><span>${distance}</span><span>SIMULATED DATA · ${missionAnalytics.formulaVersion} · ${t("confidenceUnavailable")} · ${t("physicalControlOff")}</span></div>`;
}

function renderCopy() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelector("#language").textContent = language === "en" ? "العربية" : "English";
  document.querySelector('#search').placeholder = t('searchPlaceholder');
  document.querySelector('.dialog-close').setAttribute('aria-label', t('close'));
  document.querySelector('#robot-dialog').setAttribute('aria-label', t('evidence'));
  for (const option of status.options) option.textContent = t(option.value || 'all');
  updateConnection();
}

function robotCard(robot) {
  const mission = robot.telemetry.mission;
  const routeLine = mission?.parcelId ? `${escapeHtml(mission.parcelId)} · ${mission.routeProgress}% ${t('routeProgress')}` : `${robot.payloadCapacityKg} kg ${t('capacity')}`;
  return `<div class="robot-specimen" role="listitem"><button class="robot-row" type="button" data-id="${escapeHtml(robot.id)}">
    <span class="robot-head"><span class="robot-id">${escapeHtml(robot.id)}</span><span class="status ${robot.operationalState}">${t(robot.operationalState)}</span></span>
    <span class="robot-mini" aria-hidden="true"></span><h3>${escapeHtml(robot.model)}</h3><p>${escapeHtml(robot.clientName)} / ${escapeHtml(robot.siteName)}</p><p class="route-line">${routeLine}</p>
    <span class="health-line"><strong>${robot.health.overall ?? "—"}</strong><span>${t("health")} / 100</span></span>
  </button><button class="compare-toggle" type="button" data-compare-id="${escapeHtml(robot.id)}" aria-pressed="${comparisonIds.includes(robot.id)}">${t(comparisonIds.includes(robot.id) ? 'selectedCompare' : 'selectCompare')}</button></div>`;
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
    <dl><div><dt>${t('metric')}</dt><dd>${escapeHtml(anomaly.metric)}</dd></div><div><dt>${t('threshold')}</dt><dd>${anomaly.value} / ${anomaly.threshold}</dd></div><div><dt>${t('baseline')}</dt><dd>${anomaly.baselineMean}</dd></div><div><dt>${t('zscore')}</dt><dd>${anomaly.zScore}</dd></div></dl>
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
  if (!response.ok) throw new Error(t('actionFailed'));
  const robot = await response.json();
  const capabilities = Object.entries(robot.capabilities).map(([key, supported]) => `<span class="${supported ? "" : "unsupported"}">${t(key)}: ${supported ? "✓" : t("unsupported")}</span>`).join("");
  const componentBars = Object.entries(robot.health.components).map(([key, value]) => `<label><span>${t(key)}</span><meter min="0" max="100" value="${value}">${value}/100</meter><b>${value}</b></label>`).join('');
  const mission = robot.telemetry.mission;
  const deliveryDetails = mission?.parcelId ? `<section class="delivery-strip" aria-label="${t('route')}"><div><span>${t('parcel')}</span><strong>${escapeHtml(mission.parcelId)}</strong></div><div class="delivery-stops"><span>${t('pickup')} ${escapeHtml(mission.pickupStop)}</span><i aria-hidden="true">→</i><span>${t('dropoff')} ${escapeHtml(mission.dropoffStop)}</span></div><div><span>${t('routeProgress')}</span><strong>${mission.routeProgress}%</strong></div><div><span>${t('payload')}</span><strong>${mission.payloadKg} / ${robot.payloadCapacityKg} kg</strong></div><progress max="100" value="${mission.routeProgress}">${mission.routeProgress}%</progress></section>` : `<section class="delivery-strip delivery-strip--idle"><div><span>${t('capacity')}</span><strong>${robot.payloadCapacityKg} kg</strong></div><div><span>${t('route')}</span><strong>${t('idle')}</strong></div></section>`;
  document.querySelector("#robot-detail").innerHTML = `<article class="detail"><p class="eyebrow">SIMULATED DATA / ${escapeHtml(robot.manufacturer)}</p><h2 id="passport-title" tabindex="-1">${escapeHtml(robot.id)}</h2><p>${escapeHtml(robot.model)} · ${escapeHtml(robot.clientName)} · ${escapeHtml(robot.siteName)}</p>${deliveryDetails}<dl class="detail-grid"><div><dt>${t('health')}</dt><dd>${robot.health.overall ?? "—"}/100</dd></div><div><dt>${t('batteryLabel')}</dt><dd>${robot.telemetry.batteryPercentage ?? '—'}%</dd></div><div><dt>${t('networkLabel')}</dt><dd>${robot.telemetry.networkLatency ?? '—'} ms</dd></div><div><dt>${t('currentMission')}</dt><dd>${robot.telemetry.mission?.state ? t(robot.telemetry.mission.state) : t("unsupported")}</dd></div><div><dt>${t('motorLabel')}</dt><dd>${robot.telemetry.motorCurrent ?? t("unsupported")}</dd></div><div><dt>${t('observedLabel')}</dt><dd>${new Date(robot.telemetry.observedAt).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-GB', {timeZone:'UTC'})}</dd></div></dl><section class="health-explainer"><h3>${t('healthBasis')}</h3><div class="health-components">${componentBars}</div><p>${t('healthExplanation')}</p></section><h3>${t('capabilitiesLabel')}</h3><div class="capabilities">${capabilities}</div><div class="diagnostic-action"><button type="button" data-diagnostic>${t("diagnosticAssistant")}</button><button type="button" data-missions>${t("missionTimeline")}</button><p>${t("diagnosticSafety")}</p></div><div class="fault-controls"><p>${t('faultSafety')}</p><button type="button" data-fault="network-instability">${t("inject")}: ${t('network')}</button></div></article>`;
  if (!dialog.open) dialog.showModal();
  document.querySelector('#passport-title').focus();
  dialog.querySelector("[data-diagnostic]").addEventListener("click", () => runAction(() => openDiagnostic(robotId)));
  dialog.querySelector("[data-missions]").addEventListener("click", () => runAction(() => openMissionTimeline(robotId)));
  dialog.querySelector("[data-fault]").addEventListener("click", async (event) => {
    if (!window.confirm(t('confirmFault'))) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await fetch("/api/simulator/faults", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ robotId, fault: button.dataset.fault, confirmed: true }) });
      if (!result.ok) throw new Error(t('actionFailed'));
      dialog.close(); await load();
    } catch { showActionError(); } finally { button.disabled = false; }
  });
}

function drawTopology() {
  const sites = groupSites(snapshot.robots);
  document.querySelector('#fleet-atlas').innerHTML = sites.map(site => `<section class="site-island"><h3>${escapeHtml(site.name)}</h3><p>${escapeHtml(site.client)}<br>${site.robots.length} ${t('robotCount')}</p><div class="site-nodes">${site.robots.map(robot => `<button class="atlas-node" type="button" data-atlas-id="${escapeHtml(robot.id)}" aria-pressed="${robot.id === selectedRobotId}" aria-label="${escapeHtml(robot.id)} · ${t(robot.operationalState)}" style="--node-color:${tone(robot.operationalState)}">${escapeHtml(robot.id.split('-').at(-1))}</button>`).join('')}</div></section>`).join('');
  document.querySelector("#topology-key").innerHTML = ["working", "idle", "warning", "critical"].map(key => `<span style="--key-color:${tone(key)}">${t(key)}</span>`).join("");
  document.querySelector("#canvas-summary").textContent = t('atlasNote');
}

function renderSelection() {
  const robot = snapshot.robots.find(r => r.id === selectedRobotId) ?? snapshot.robots[0];
  selectedRobotId = robot?.id ?? null;
  document.querySelector('#specimen-title').textContent = robot ? `${robot.model} / ${robot.id}` : t('noResults');
  const delivery = robot?.telemetry.mission?.parcelId ? `${robot.telemetry.mission.parcelId} · ${robot.telemetry.mission.routeProgress}%` : `${robot?.payloadCapacityKg ?? '—'} kg ${t('capacity')}`;
  document.querySelector('#specimen-subtitle').textContent = robot ? `${robot.siteName} · ${delivery} · ${t(robot.operationalState)}` : '';
  document.querySelector('#inspect-selected').disabled = !robot;
  document.querySelectorAll('[data-atlas-id]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atlasId === selectedRobotId)));
}

function updateComparison() {
  const button = document.querySelector('#compare');
  button.textContent = `${t('compare')} (${comparisonIds.length}/2)`;
  button.disabled = comparisonIds.length !== 2;
  document.querySelectorAll('[data-compare-id]').forEach(el => {
    const selected = comparisonIds.includes(el.dataset.compareId);
    el.setAttribute('aria-pressed', String(selected));
    el.textContent = t(selected ? 'selectedCompare' : 'selectCompare');
    el.disabled = !selected && comparisonIds.length === 2;
  });
}

function openComparison() {
  const robots = comparisonIds.map(id => snapshot.robots.find(r => r.id === id)).filter(Boolean);
  if (robots.length !== 2) return;
  const rows = comparisonRows(robots);
  document.querySelector('#robot-detail').innerHTML = `<article class="detail"><p class="eyebrow">SIMULATED DATA / READ ONLY</p><h2 id="comparison-title" tabindex="-1">${t('comparisonTitle')}</h2><p class="comparison-caption">${t('comparisonSafety')}</p><div class="comparison-scroll"><table class="comparison-table"><caption>${escapeHtml(snapshot.generatedAt)} · UTC</caption><thead><tr><th scope="col">${t('metricLabel')}</th>${robots.map(r=>`<th scope="col">${escapeHtml(r.id)}<br>${escapeHtml(r.model)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${t(row.key)}</th>${row.values.map(value=>`<td>${value === null ? t('unsupported') : escapeHtml(row.key === 'state' ? t(value) : value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="replay-safety">${t('physicalControlOff')} · health-v1</p></article>`;
  dialog.showModal();
  document.querySelector('#comparison-title').focus();
}

async function runAction(action, button) {
  document.querySelector('#action-error').hidden = true;
  try { await action(); } catch { showActionError(); }
  finally { if (button?.isConnected) button.disabled = false; }
}

function showActionError() {
  const message = document.querySelector('#action-error');
  message.textContent = t('actionFailed');
  message.hidden = false;
  if (!dialog.open) dialog.showModal();
}

function updateConnection() {
  document.querySelector('#refresh-mode').textContent = t(paused ? 'resume' : 'pause');
  document.querySelector('#refresh-mode').setAttribute('aria-pressed', String(paused));
  document.querySelector('#refresh-now').textContent = t('refresh');
  const message = t(failed ? 'offline' : loading ? 'loading' : paused ? 'paused' : dialog.open || document.querySelector('#main').contains(document.activeElement) ? 'inspecting' : 'live');
  const node = document.querySelector('#connection-state');
  if (node.textContent !== message) node.textContent = message;
}

function tone(state) { return ({ working: "#176b9b", idle: "#69747a", warning: "#9a5b00", critical: "#aa2d3b" })[state] || "#5e6970"; }
function debounce(fn, delay = 250) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }

document.querySelector("#language").addEventListener("click", () => {
  language = language === "en" ? "ar" : "en";
  try { localStorage.setItem("parcel-grid-language", language); } catch { /* Storage is optional. */ }
  render();
});
document.querySelector("#filters").addEventListener("submit", event => event.preventDefault());
document.querySelector("#filters").addEventListener("input", debounce(load));
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
document.querySelector('#refresh-mode').addEventListener('click', () => { paused = !paused; updateConnection(); if (!paused) load(); });
document.querySelector('#refresh-now').addEventListener('click', load);
document.querySelector('#inspect-selected').addEventListener('click', () => selectedRobotId && runAction(() => openRobot(selectedRobotId)));
document.querySelector('#fleet-atlas').addEventListener('click', event => {
  const button = event.target.closest('[data-atlas-id]');
  if (!button) return;
  selectedRobotId = button.dataset.atlasId;
  renderSelection();
});
document.querySelector('#fleet').addEventListener('click', event => {
  const button = event.target.closest('[data-compare-id]');
  if (!button) return;
  comparisonIds = toggleComparison(comparisonIds, button.dataset.compareId);
  updateComparison();
});
document.querySelector('#compare').addEventListener('click', openComparison);
document.querySelector('#clear-comparison').addEventListener('click', () => { comparisonIds = []; updateComparison(); });
setInterval(() => { if (!document.hidden) document.querySelector("#clock").textContent = `${new Date().toLocaleTimeString("en-GB", { timeZone: "UTC" })} UTC`; }, 1000);
// Do not replace focused controls or shift the user's reading position during inspection.
setInterval(() => { if (!paused && !document.hidden && !dialog.open && !document.querySelector('#main').contains(document.activeElement)) load(); }, 5000);
document.addEventListener('focusin', updateConnection);
document.addEventListener('focusout', () => queueMicrotask(updateConnection));
dialog.addEventListener('close', updateConnection);
renderCopy();
document.querySelector('#fleet').innerHTML = `<p class="empty">${t('loading')}</p>`;
load();
