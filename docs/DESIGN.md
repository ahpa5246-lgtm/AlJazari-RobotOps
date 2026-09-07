# Command-center design contract

Visual thesis: a precise industrial robotics operations room organized around one fleet topology and one evidence timeline, with technical typography, dense readable instruments and restrained state-driven motion.

The semantic topology is the single signature visualization. It connects robot nodes to deployment sites and uses operational colors plus textual alternatives. It is Canvas-enhanced, while the fleet registry remains the fully accessible source of the same information.

Tokens use near-black mineral green, warm operational white, phosphor green, cyan, amber and critical coral. Components use hard instrument edges and varied density instead of generic rounded dashboard cards. Arabic RTL and English LTR share the same hierarchy.

No external visual library is required in this milestone. That keeps the install deterministic, bundle small and mobile fallback reliable. Motion is limited to direct hover/state feedback and is removed under `prefers-reduced-motion`.

The evidence rail now carries the complete operational decision sequence in place: observe → acknowledge → confirm maintenance ticket. State changes are expressed through text, border role and action hierarchy rather than new panels or animation. The cyan confirmation control remains a native 44px button; ticket state has a textual fallback and does not rely on color.
