# Command-center design contract

Visual thesis: a precise industrial robotics operations room organized around one fleet topology and one evidence timeline, with technical typography, dense readable instruments and restrained state-driven motion.

The semantic topology is the single signature visualization. It connects robot nodes to deployment sites and uses operational colors plus textual alternatives. It is Canvas-enhanced, while the fleet registry remains the fully accessible source of the same information.

Tokens use near-black mineral green, warm operational white, phosphor green, cyan, amber and critical coral. Components use hard instrument edges and varied density instead of generic rounded dashboard cards. Arabic RTL and English LTR share the same hierarchy.

No external visual library is required in this milestone. That keeps the install deterministic, bundle small and mobile fallback reliable. Motion is limited to direct hover/state feedback and is removed under `prefers-reduced-motion`.

The ingestion/provenance milestone has no new visual surface. Existing evidence-ledger composition, bilingual direction, mobile layout, semantic fallback and reduced-motion behavior remain the complete UI contract; provenance is available in the telemetry API for a later bounded inspector rather than exposed as decorative metadata.

The evidence rail now carries the complete operational decision sequence in place: observe → acknowledge → confirm maintenance ticket. State changes are expressed through text, border role and action hierarchy rather than new panels or animation. The cyan confirmation control remains a native 44px button; ticket state has a textual fallback and does not rely on color.


Incident replay reuses the existing evidence rail and native dialog instead of adding a second visualization engine. The text-first ordered timeline shows timestamps, event codes and measured values; position is supplementary and disappears truthfully when unsupported. It preserves the industrial instrument thesis, RTL/LTR reading order, visible focus, 44px targets, narrow-screen stacking and the existing reduced-motion fallback without adding package or rendering cost.


The diagnostic assistant extends the same evidence-first visual language rather than becoming a chat-shaped novelty. A native 44px action opens a semantic, keyboard-readable report: evidence window, working hypothesis, measured observations, alternative explanations and human inspection. Amber separates the absence of validated confidence from operational severity. The report stacks to one column on narrow screens, inherits RTL/LTR order and the global reduced-motion fallback, and adds no package or animation cost.

Mission history uses a flight-recorder composition: one current-mission strip, a chronological transition spine and compact evidence records. Status is expressed with text plus square signal marks rather than color alone. Unsupported and partial lifecycles stay visible. The native dialog transfers focus to its heading, stacks to one column on mobile, preserves RTL/LTR order and adds no animation, renderer or package cost.

Fleet mission analytics extend that flight-recorder language into an evidence ledger rather than generic dashboard cards. Four rate cells pair status typography with visible numerator/denominator text; a separate rail exposes capability coverage, duration/distance contributors, exclusions, formula version and disabled control. The layout collapses from four to two to one evidence region without horizontal scrolling, inherits RTL/LTR and reduced-motion behavior, and adds no dependency or animation cost.

AJR-M5A changes the product foundation and public history contract without adding a decorative visual surface. Existing robot-detail history keeps the industrial evidence language, Arabic/English directionality, native keyboard behavior, responsive stacking and reduced-motion fallback. A future history inspector must render repository-provided timestamps, retention and pagination state; it must not introduce decorative charts or inferred samples.
