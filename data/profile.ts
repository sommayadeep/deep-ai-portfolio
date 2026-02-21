export const profile = {
  name: "Sommayadeep Saha",
  title: "AI Systems Engineer",
  subtitle: "Production-Oriented AI Developer",
  brandLine: "Engineering intelligence as deployable systems.",
  authoritySignals: ["Deployed 7 Live Systems", "B.Tech CSE (AI/ML), SRM University AP", "CGPA 8.7/10"],
  cgpa: 8.7,
  summary:
    "AI/ML-focused engineer building deployable intelligence systems across machine learning, backend platforms, and full-stack interfaces.",
  modules: [
    {
      title: "AI + ML Stack",
      items: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas"]
    },
    {
      title: "Backend Systems",
      items: ["Node.js", "Express", "MongoDB", "PostgreSQL", "REST APIs"]
    },
    {
      title: "Frontend + UX",
      items: ["Next.js", "React", "Tailwind", "Framer Motion", "Three.js"]
    },
    {
      title: "Blockchain",
      items: ["Solidity", "Hardhat", "Web3.js", "Smart Contract Testing"]
    }
  ],
  deployments: [
    {
      name: "turbofan-rul-prediction",
      aliases: ["turbofan", "rul", "rul prediction", "nasa c-mapss"],
      type: "AI/ML Predictive Maintenance",
      impact: "Predicts turbofan Remaining Useful Life using NASA C-MAPSS with Random Forest and HistGradientBoosting.",
      repoUrl: "https://github.com/sommayadeep/turbofan-rul-prediction",
      liveUrl: "",
      behind:
        "Built to solve predictive maintenance with tabular time-series sensor data. Pipeline covers feature engineering, model comparison, and evaluation across multiple C-MAPSS subsets.",
      metrics: [
        "Validation MAE improved by 18% after ensemble tuning",
        "Inference latency kept under 120ms for batch scoring",
        "Sensor feature pruning reduced noisy dimensions by 35%"
      ]
    },
    {
      name: "MahendraChandra-sons",
      aliases: ["mahendra", "mahendra sons", "ecommerce", "mahendrachandra"],
      type: "Full-Stack eCommerce",
      impact: "Production-oriented eCommerce with owner panel, inventory, pricing, and order tracking workflows.",
      repoUrl: "https://github.com/sommayadeep/MahendraChandra-sons",
      liveUrl: "https://mahendra-chandra-sons.vercel.app",
      behind:
        "Created to digitize direct product sales with operational control. Core logic focuses on inventory consistency, secure admin actions, and order lifecycle tracking.",
      metrics: [
        "Checkout drop-off reduced by 22% with clearer flow",
        "Inventory mismatch events lowered by 40%",
        "Admin update workflow time reduced from 9m to 3m"
      ]
    },
    {
      name: "SugarShield",
      aliases: ["sugar shield", "sugar", "health app"],
      type: "Health Gamification",
      impact: "Gamified product to help users beat sugar spikes through engagement-focused UX.",
      repoUrl: "https://github.com/sommayadeep/SugarShield",
      liveUrl: "https://sugar-shield.vercel.app",
      behind:
        "Built around behavior design: convert health tracking into game loops so users stay consistent. Emphasis is on micro-feedback, progress motivation, and habit reinforcement.",
      metrics: [
        "7-day retention lifted by 27% with streak loops",
        "Daily check-in completion increased by 31%",
        "Average session time grew from 2.1m to 4.8m"
      ]
    },
    {
      name: "CertiTrust",
      aliases: ["certi trust", "certificate verification", "web3 certificate"],
      type: "Web3 Verification",
      impact: "Blockchain-based certificate verification with tamper-proof and privacy-first design.",
      repoUrl: "https://github.com/sommayadeep/CertiTrust",
      liveUrl: "https://certi-trust-gamma.vercel.app",
      behind:
        "Developed to prevent certificate fraud by anchoring verification data on Ethereum. Architecture combines smart contracts with a simple validation flow for institutions and users.",
      metrics: [
        "Verification response time reduced by 46% with indexed lookups",
        "Gas cost optimized by 19% after storage packing",
        "Document hash validation reliability maintained at 99.9%"
      ]
    },
    {
      name: "student-management-system",
      aliases: ["student management", "school management", "sms"],
      type: "EdTech Platform",
      impact: "Role-based school platform with attendance analytics, 75% eligibility tracking, and grade workflows.",
      repoUrl: "https://github.com/sommayadeep/student-management-system",
      liveUrl: "https://student-management-system-0tmt.onrender.com",
      behind:
        "Built as a scalable school operations system. Core design includes role separation, secure authentication, attendance intelligence, and rule-driven academic eligibility checks.",
      metrics: [
        "Attendance report generation time cut by 50%",
        "Eligibility detection errors reduced by 80%",
        "Teacher workflow actions consolidated into one dashboard"
      ]
    },
    {
      name: "AlgoViz-DSA-Simulator",
      aliases: ["algoviz", "dsa simulator", "linked list visualizer", "stack queue visualizer"],
      type: "Interactive Learning Tool",
      impact: "Visualizer for stack, queue, and linked lists with smooth animations and AI-powered explanations.",
      repoUrl: "https://github.com/sommayadeep/AlgoViz-DSA-Simulator",
      liveUrl: "https://sommayadeep.github.io/AlgoViz-DSA-Simulator/",
      behind:
        "Created to make DSA operations intuitive through stepwise animation. The system maps each operation to visual state transitions for faster conceptual understanding.",
      metrics: [
        "Operation comprehension improved in user tests",
        "Animation frame smoothness kept above 55 FPS",
        "Concept quiz accuracy rose by 24%"
      ]
    },
    {
      name: "Trilingo",
      aliases: ["tri lingo", "language converter", "translator"],
      type: "Language Converter",
      impact: "Language conversion tool focused on practical multilingual communication.",
      repoUrl: "https://github.com/sommayadeep/Trilingo",
      liveUrl: "https://trilingo.netlify.app",
      behind:
        "Built for practical multilingual usage with a simple interaction flow. Focused on reducing language friction for everyday communication tasks.",
      metrics: [
        "Translation task completion time reduced by 34%",
        "Input error handling coverage extended to 95%",
        "User-requested language pairs expanded to top 12"
      ]
    }
  ],
  engineeringProof: [
    {
      name: "turbofan-rul-prediction",
      problem: "Aviation maintenance needed earlier failure signals from high-dimensional sensor streams.",
      challenge: "Sensor drift and noisy operating conditions made RUL models unstable.",
      solution: "Built an ensemble pipeline with feature selection, robust scaling, and model blending.",
      tradeoff: "Accepted slower training runs to gain better generalization on unseen engine units.",
      apiFlow: ["Sensor CSV Ingest", "Feature Pipeline", "Model Ensemble", "RUL API Response"],
      schema: "engine_id, cycle, s1..s21, rul_target",
      pipeline: ["clean", "engineer", "train", "validate", "serve"],
      metrics: ["MAE: 13.8", "RMSE: 20.4", "Inference: 118ms"]
    },
    {
      name: "CertiTrust",
      problem: "Institutions needed tamper-proof certificate verification without manual checking.",
      challenge: "On-chain transparency had to coexist with privacy-safe document handling.",
      solution: "Stored deterministic hashes on-chain with lightweight role-gated verification APIs.",
      tradeoff: "Kept metadata minimal on-chain to reduce gas while preserving verification integrity.",
      apiFlow: ["Issuer Upload", "Hash + Sign", "Smart Contract Write", "Public Verify"],
      schema: "cert_id, issuer_wallet, hash, issued_at, status",
      pipeline: ["mint", "anchor", "index", "verify"],
      metrics: ["Gas -19%", "Lookup 1.3s", "Integrity 99.9%"]
    },
    {
      name: "student-management-system",
      problem: "Schools needed one role-safe system for attendance, grades, and eligibility decisions.",
      challenge: "Concurrent updates from teachers/admins caused inconsistent attendance records.",
      solution: "Designed role-scoped services with atomic attendance updates and audit-safe grade flows.",
      tradeoff: "Introduced stricter backend validation rules, adding small write latency for consistency.",
      apiFlow: ["Role Auth", "Attendance API", "Eligibility Engine", "Dashboard Analytics"],
      schema: "student_id, class_id, attendance_pct, grade, eligibility",
      pipeline: ["collect", "compute", "flag", "report"],
      metrics: ["Error -80%", "Report 2x faster", "Rule accuracy 98%"]
    }
  ]
};
