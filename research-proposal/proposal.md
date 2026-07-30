# Research Proposal: Ontology-Driven Static Code Analysis and Marketplace Dynamics

## Problem Statement

The FLBS distributed automation platform processed 3M+ microtasks across 1,100+ task types for 750+ clients with 99.98% reliability over 8 years, a hidden infrastructure that operated at scale without formal code analysis, versioning discipline, or systematic evaluation of how task types evolved. The codebase grew organically, with 300K+ lines of JavaScript in a factory-based ecosystem alongside PHP and Python server-side utility code, 4,000+ git commits, and 500+ custom scripts tailored to specific tasks that apppeared in the marketplace.

The system generated a number of rich, under-analyzed datasets spanning the full 8-year lifecycle:

- **AMT_Batch (Nov 2013 – Jan 2019)**: ~480 intervals/day of marketplace state, including task title, requester, HIT count, reward, posting time, and qualifications. Reconstructed from a three-minute scraper.
- **AMT_Alerts (Oct 2013 – Jun 2018)**: Ground-truth ledger of final outcomes for all submitted, returned, or expired HITs, including account ID (anonymized), task, requester, reward, status, completion time, and optional requester feedback.
- **HITRecords (Jul 2014 – Aug 2018)**: Submitted task payloads: account ID, task, requester, HIT group ID, reward, and a JSON blob of requester-provided inputs. Answer fields are excluded (property of the requester/customer); per-field metadata (count, min/mean/median/max length) is provided instead.
- **IncomeRecords (Jul 2014 – Jan 2018)**: ~2.3M-row ledger of all accepted HITs capturing full task lifecycle (acceptance, completion, expiration, return/failure status) with second-level timestamps and MTurk identifiers. Enables analysis of rate-limiting (~2.3s intervals), task durations, effective hourly rates, and multi-account coordination.
- **Git log (2013–2018)**: 4,000+ commits spanning 300K+ lines of JavaScript, 500+ custom scripts, and a factory-based developer ecosystem built from scratch.
- **Requester Correspondence Log (Jan 2014 – 2018)**: ~80 message threads documenting clarification requests, rejection remediation efforts, qualification solicitations, and bug reports filed against requester HIT implementations. Worker PII (names, email addresses, phone numbers, and postal addresses) has been anonymized; requester names are retained as they appear in the marketplace. Internal draft annotations preserved as-is for additional context on message composition.

**Limitations**: Original HIT HTML was not systematically retained; ~150–200 representative interfaces are available for qualitative inspection.

No systematic analysis exists of how such systems evolve, i.e., how task types are created, modified, and deprecated; how code quality and reliability are maintained across a distributed marketplace; or how agentic systems could learn from this evolution to automate future workflow creation.

DoorDash operates a similar marketplace at even greater scale, matching Dashers, merchants, and consumers through a complex, evolving logistics network. The parallels are striking: both systems rely on human-in-the-loop decision-making, both involve rapid iteration and experimentation, and both generate rich data on how workflows and marketplaces evolve over time.

## Proposed Work

I propose to extend my FLBS analysis into two integrated directions:

### 1. LLM-Assisted Ontology Engineering for Code and Marketplace Evolution

The core challenge is that both the codebase and the marketplace evolved organically, without a formal ontology to describe their structure, relationships, or evolution over time. I propose to model these systems as an ontology integrating software artifacts (scripts, libraries, functions), marketplace entities (task types, clients, workers, accounts, tasks completed), and their temporal relationships, grounded in the FLBS data, and use LLMs to iteratively update it at minute-resolution over the roughly 5-year dataset.

**Ontology vs Knowledge Graph**: A clear distinction is important here. The ontology will define the schema, i.e., the types of entities, their attributes, and the relationships between them (e.g., "Script implements TaskType", "TaskType belongs to Client", "MarketplaceEvent influences ScriptEvolution"). The knowledge graph will instantiate that schema across the full dataset: the 185M+ marketplace records, the 3M+ completed task records, the 500+ script definitions, their execution traces, and the temporal relationships between all of them. The ontology provides the shape; the knowledge graph provides the data.

**Approach:**

- **Initial ontology design**: Define a core ontology covering code artifacts (scripts, functions, libraries), marketplace entities (task types, clients, workers), and their relationships (which scripts support which task types, how task types evolve over time).

- **Time-series ontology evolution**: Using the minute-resolution scrape data (AMT_Batch, 185M+ records) and the commit history (4,000+ commits), prompt an LLM to update the ontology at each time step, detecting new task types, deprecated scripts, shifting marketplace dynamics, and emergent patterns.

- **Knowledge graph construction**: Populate the ontology with the full dataset, including task availability records, completed tasks, script metadata, temporal relationships, and requester communications, to enable querying and analysis across all dimensions of the system.

- **Iterative refinement**: At each time step, the LLM proposes ontology updates, which are validated against the data (e.g., "Is this script actually used by this task type?") and then integrated into the ontology.

- **Tool support**: Leverage open-source ontology engineering tools such as the Open Ontologies MCP toolset (github.com/fabio-rovai/open-ontologies) to automate and standardize the ontology generation and validation process.

- **Dataset publication**: The dataset is currently undergoing final PII cleanup and will be published via Zenodo or Hugging Face Datasets, making it available for replication and extension by the research community.

**Example questions this would answer:**
- When did task type complexity increase, and which scripts were introduced to support it?
- Which marketplace changes (e.g., new clients, pricing shifts) preceded code changes?
- What patterns of code evolution are correlated with marketplace health and worker productivity?
- Can we predict task type success or failure based on code and marketplace signals?
- How did script inputs and outputs evolve over time in response to marketplace demands?
- Quantify script impact: How much did a given script improve worker productivity or earnings? Can we tie specific code changes to measurable marketplace outcomes (e.g., higher completion rates, faster task completion, increased worker retention)?
- Characterize automatable tasks: What types of tasks were successfully automated? What categories of tasks remained manual? Can we identify patterns in task structure, data availability, or client requirements that predict automation feasibility?
- API integration taxonomy: How many unique APIs were integrated (e.g., Google Maps API, Facebook API, Foursquare, Yelp, etc.), and what categories do they fall into (geospatial, social, business intelligence, e-commerce)? Which APIs were most frequently used, and which were most valuable in terms of task throughput?
- Measure script quality evolution: How did script quality (readability, maintainability, performance, error rate) evolve over time? Did quality correlate with marketplace outcomes?
- Quantify return on engineering effort: What was the ROI on engineering effort for the FLBS platform? Which scripts had the highest impact relative to the time invested in building them?

### 2. Static Code Analysis for Evolving Workflow Systems

Apply LLM-assisted static code analysis to the FLBS codebase to identify patterns in how task types were created, modified, and deprecated over 8 years, building a taxonomy of workflow evolution that could inform how DoorDash designs and maintains its own automation and orchestration systems.

**Approach:**
- Extract structural features from the codebase: function dependencies, library usage, code complexity, and changes over time.
- Correlate code changes with marketplace outcomes: Did specific code changes lead to increased worker productivity? Did they coincide with new task types or client onboarding?
- Build a predictive model of code evolution based on marketplace signals.

### 3. Marketplace Dynamics of Human-in-the-Loop Systems

Analyze the FLBS marketplace data (3M+ tasks completed, worker behavior, task type profitability) to understand how marketplace health, worker productivity, and task complexity co-evolve, insights that could inform DoorDash's own marketplace optimization (pricing, matching, and workforce management).

**Approach:**
- Analyze temporal patterns in task availability, pricing, and worker participation.
- Build models that predict marketplace health based on code and task type attributes.
- Identify leading indicators of marketplace shifts, both positive (growth) and negative (decline).

## Why DoorDash?

DoorDash is the ideal place for this work because:

1. **Scale**: DoorDash operates one of the world's largest real-world marketplaces, a complex system of logistics, pricing, matching, and human decision-making that mirrors many of the challenges I observed at FLBS.

2. **Research infrastructure**: DoorDash has both the scale (millions of daily interactions) and the research infrastructure (ML platform, data access, evaluation frameworks) to take these insights from retrospective analysis to active deployment.

3. **Agentic systems**: DoorDash is actively building agentic systems for logistics and local commerce, long-horizon planning, tool use, and evaluation methodologies for agents operating in physical-world marketplaces.

4. **The fellowship**: The fellowship offers dedicated time, compute resources, and mentorship to turn these research directions into publishable work that can also influence how DoorDash builds and optimizes its own agentic and human-in-the-loop systems.

5. **Relevance**: DoorDash's marketplace optimization challenges (pricing, matching, workforce management) are directly parallel to the dynamics I observed and measured at FLBS, making the insights from this research immediately applicable.

## Anticipated Outcomes

- An ontology of code and marketplace evolution in human-in-the-loop systems
- A reusable methodology for LLM-assisted static code analysis of marketplace codebases
- Insights into marketplace dynamics that could inform DoorDash's optimization efforts
- Publication at a top venue (KDD, WWW, or ICML/NeurIPS workshop)
- A research agenda that connects retrospective analysis to proactive optimization in marketplace systems
- Open-source release of the ontology, tools, and methodology
- Public release of the FLBS dataset (via Zenodo or Hugging Face Datasets)

## Prior Work

- **Preprint**: "Engineering a Quota-Constrained Human-in-the-Loop Data Platform: Marketplace-Aware Architecture over 3M+ Microtasks" (SSRN, 2026)
- **Publications**: Domain-adaptation and transfer learning models published at IEEE BigData 2024 and ES&T 2025; knowledge graph workflows published at WWW 2023
- **Open-source**: Browser extensions reaching 10K weekly users; Zoom video call round-robin breakout room organizer

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Weeks 1-2 | 2 weeks | Onboarding, data access, initial ontology design, dataset publication setup |
| Weeks 3-6 | 4 weeks | Ontology development and LLM-assisted evolution pipeline |
| Weeks 7-10 | 4 weeks | Static code analysis and marketplace dynamics analysis |
| Weeks 11-12 | 2 weeks | Write-up, internal presentation, publication preparation |

## Conclusion

This research bridges retrospective analysis of an 8-year human-in-the-loop marketplace with proactive optimization techniques applicable to DoorDash's logistics and marketplace systems. By building an ontology of code and marketplace evolution, I aim to create a reusable methodology for understanding how complex workflow systems evolve, and how agentic systems can learn from that evolution to automate future workflow creation.

The FLBS dataset, with its minute-resolution marketplace data and roughly 5-year code evolution history, offers a unique window into the dynamics of a human-in-the-loop marketplace. DoorDash provides the ideal environment to extend these insights into active deployment and to build systems that learn from the past to optimize the future.

---

**Contact:** David Shumway | davidshumway@gmail.com | 773-759-5970

**Links:**
- Preprint: [SSRN Abstract](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5233369)
- GitHub: [github.com/davidshumway](https://github.com/davidshumway)
- Open Ontologies MCP Toolset: [github.com/fabio-rovai/open-ontologies](https://github.com/fabio-rovai/open-ontologies)
- Dataset (pending): Zenodo or Hugging Face Datasets (link forthcoming)
