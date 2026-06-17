# app/modules/jd_match/learning_resources.py
# Curated learning resource database for ~50 common skills.
# Real course URLs — not generated links that look spammy.
# Each skill maps to free and paid options with platform, title, URL, cost, and duration.

from __future__ import annotations
from typing import Any

# ── RESOURCE DATABASE ─────────────────────────────────────────────────────────

LEARNING_RESOURCES: dict[str, list[dict[str, str]]] = {
    "python": [
        {"platform": "Python.org", "title": "Official Python Tutorial", "url": "https://docs.python.org/3/tutorial/", "cost": "free", "duration": "10 hours"},
        {"platform": "Coursera", "title": "Python for Everybody", "url": "https://www.coursera.org/specializations/python", "cost": "free audit", "duration": "25 hours"},
        {"platform": "YouTube", "title": "Python Crash Course", "url": "https://youtu.be/rfscVS0vtbw", "cost": "free", "duration": "4 hours"},
    ],
    "java": [
        {"platform": "Coursera", "title": "Java Programming and Software Engineering Fundamentals", "url": "https://www.coursera.org/specializations/java-programming", "cost": "free audit", "duration": "40 hours"},
        {"platform": "YouTube", "title": "Java Full Course", "url": "https://youtu.be/xk4_1vDrzzo", "cost": "free", "duration": "6 hours"},
        {"platform": "Codecademy", "title": "Learn Java", "url": "https://www.codecademy.com/learn/learn-java", "cost": "free", "duration": "25 hours"},
    ],
    "javascript": [
        {"platform": "MDN", "title": "JavaScript Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "cost": "free", "duration": "15 hours"},
        {"platform": "freeCodeCamp", "title": "JavaScript Algorithms and Data Structures", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "cost": "free", "duration": "300 hours"},
        {"platform": "YouTube", "title": "JavaScript Tutorial for Beginners", "url": "https://youtu.be/W6NZfCO5SIk", "cost": "free", "duration": "3 hours"},
    ],
    "typescript": [
        {"platform": "TypeScriptLang", "title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/", "cost": "free", "duration": "5 hours"},
        {"platform": "YouTube", "title": "TypeScript Full Course", "url": "https://youtu.be/gieEQFIfgYc", "cost": "free", "duration": "4 hours"},
    ],
    "react": [
        {"platform": "React.dev", "title": "Learn React", "url": "https://react.dev/learn", "cost": "free", "duration": "10 hours"},
        {"platform": "freeCodeCamp", "title": "React for Beginners", "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/#react", "cost": "free", "duration": "50 hours"},
    ],
    "node.js": [
        {"platform": "Node.js Docs", "title": "Node.js Getting Started Guide", "url": "https://nodejs.org/en/docs/guides/getting-started-guide/", "cost": "free", "duration": "2 hours"},
        {"platform": "YouTube", "title": "Node.js Crash Course", "url": "https://youtu.be/fBNz5xF-Kx4", "cost": "free", "duration": "2 hours"},
    ],
    "sql": [
        {"platform": "Khan Academy", "title": "Intro to SQL", "url": "https://www.khanacademy.org/computing/computer-programming/sql", "cost": "free", "duration": "5 hours"},
        {"platform": "YouTube", "title": "SQL Tutorial for Beginners", "url": "https://youtu.be/7S_tz1z_5bA", "cost": "free", "duration": "4 hours"},
        {"platform": "Coursera", "title": "SQL for Data Science", "url": "https://www.coursera.org/learn/sql-for-data-science", "cost": "free audit", "duration": "14 hours"},
    ],
    "postgresql": [
        {"platform": "PostgreSQL Docs", "title": "Official PostgreSQL Tutorial", "url": "https://www.postgresql.org/docs/current/tutorial.html", "cost": "free", "duration": "3 hours"},
        {"platform": "YouTube", "title": "PostgreSQL Crash Course", "url": "https://youtu.be/qw--VYLpxG4", "cost": "free", "duration": "1.5 hours"},
    ],
    "mongodb": [
        {"platform": "MongoDB University", "title": "MongoDB Basics", "url": "https://learn.mongodb.com/courses/mongodb-basics", "cost": "free", "duration": "4 hours"},
        {"platform": "YouTube", "title": "MongoDB Crash Course", "url": "https://youtu.be/-bt_y4LoWGg", "cost": "free", "duration": "1.5 hours"},
    ],
    "redis": [
        {"platform": "Redis University", "title": "Redis 101", "url": "https://university.redis.com/courses/ru101/", "cost": "free", "duration": "6 hours"},
    ],
    "docker": [
        {"platform": "Docker Docs", "title": "Docker Get Started Guide", "url": "https://docs.docker.com/get-started/", "cost": "free", "duration": "2 hours"},
        {"platform": "YouTube", "title": "Docker Crash Course", "url": "https://youtu.be/3c-iBn73dDE", "cost": "free", "duration": "2 hours"},
    ],
    "kubernetes": [
        {"platform": "K8s Docs", "title": "Kubernetes Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "cost": "free", "duration": "4 hours"},
        {"platform": "Coursera", "title": "Kubernetes for Developers", "url": "https://www.coursera.org/learn/kubernetes-development", "cost": "free audit", "duration": "12 hours"},
        {"platform": "YouTube", "title": "Kubernetes Tutorial for Beginners", "url": "https://youtu.be/X48VuDVv0do", "cost": "free", "duration": "3 hours"},
    ],
    "aws": [
        {"platform": "AWS Skill Builder", "title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/cloud-practitioner-essentials/", "cost": "free", "duration": "6 hours"},
        {"platform": "YouTube", "title": "AWS Certified Cloud Practitioner Course", "url": "https://youtu.be/SOTamWNgDKc", "cost": "free", "duration": "5 hours"},
    ],
    "azure": [
        {"platform": "Microsoft Learn", "title": "Azure Fundamentals", "url": "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/", "cost": "free", "duration": "8 hours"},
    ],
    "gcp": [
        {"platform": "Google Cloud Skills Boost", "title": "GCP Fundamentals", "url": "https://www.cloudskillsboost.google/course_templates/60", "cost": "free", "duration": "8 hours"},
    ],
    "fastapi": [
        {"platform": "FastAPI Docs", "title": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "cost": "free", "duration": "5 hours"},
        {"platform": "YouTube", "title": "FastAPI Crash Course", "url": "https://youtu.be/7t2alSnE2-I", "cost": "free", "duration": "1.5 hours"},
    ],
    "django": [
        {"platform": "Django Docs", "title": "Django Tutorial", "url": "https://docs.djangoproject.com/en/stable/intro/tutorial01/", "cost": "free", "duration": "6 hours"},
        {"platform": "YouTube", "title": "Django for Beginners", "url": "https://youtu.be/rHux0gMZ1Eg", "cost": "free", "duration": "6 hours"},
    ],
    "flask": [
        {"platform": "Flask Docs", "title": "Flask Quickstart", "url": "https://flask.palletsprojects.com/en/stable/quickstart/", "cost": "free", "duration": "1 hour"},
    ],
    "git": [
        {"platform": "Git Docs", "title": "Git Pro Book", "url": "https://git-scm.com/book/en/v2", "cost": "free", "duration": "8 hours"},
        {"platform": "YouTube", "title": "Git and GitHub for Beginners", "url": "https://youtu.be/RGOj5yH7evk", "cost": "free", "duration": "1.5 hours"},
    ],
    "linux": [
        {"platform": "Linux Journey", "title": "Linux Journey", "url": "https://linuxjourney.com/", "cost": "free", "duration": "10 hours"},
        {"platform": "YouTube", "title": "Linux for DevOps", "url": "https://youtu.be/ROjZy1Wb0IA", "cost": "free", "duration": "4 hours"},
    ],
    "terraform": [
        {"platform": "Hashicorp Learn", "title": "Terraform Basics", "url": "https://developer.hashicorp.com/terraform/tutorials/aws-get-started", "cost": "free", "duration": "3 hours"},
        {"platform": "YouTube", "title": "Terraform Crash Course", "url": "https://youtu.be/SLB_c_ayRMo", "cost": "free", "duration": "2 hours"},
    ],
    "ci/cd": [
        {"platform": "GitHub", "title": "GitHub Actions Docs", "url": "https://docs.github.com/en/actions/learn-github-actions", "cost": "free", "duration": "3 hours"},
        {"platform": "YouTube", "title": "CI/CD Pipeline Tutorial", "url": "https://youtu.be/qP8zwTR2h0c", "cost": "free", "duration": "1.5 hours"},
    ],
    "machine learning": [
        {"platform": "Coursera", "title": "Machine Learning Specialization", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "cost": "free audit", "duration": "40 hours"},
        {"platform": "YouTube", "title": "Machine Learning for Beginners", "url": "https://youtu.be/NWONeJKn6kc", "cost": "free", "duration": "8 hours"},
    ],
    "deep learning": [
        {"platform": "Coursera", "title": "Deep Learning Specialization", "url": "https://www.coursera.org/specializations/deep-learning", "cost": "free audit", "duration": "50 hours"},
    ],
    "tensorflow": [
        {"platform": "TensorFlow", "title": "TensorFlow Core Tutorials", "url": "https://www.tensorflow.org/tutorials", "cost": "free", "duration": "10 hours"},
    ],
    "pytorch": [
        {"platform": "PyTorch", "title": "PyTorch Tutorials", "url": "https://pytorch.org/tutorials/", "cost": "free", "duration": "10 hours"},
    ],
    "langchain": [
        {"platform": "LangChain Docs", "title": "LangChain Getting Started", "url": "https://python.langchain.com/docs/get_started/introduction", "cost": "free", "duration": "3 hours"},
        {"platform": "YouTube", "title": "LangChain Crash Course", "url": "https://youtu.be/Lb4IcCF5FCo", "cost": "free", "duration": "2 hours"},
    ],
    "llm": [
        {"platform": "DeepLearning.AI", "title": "ChatGPT Prompt Engineering for Developers", "url": "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/", "cost": "free", "duration": "1.5 hours"},
        {"platform": "YouTube", "title": "LLM Crash Course", "url": "https://youtu.be/lWyg2BYmRk0", "cost": "free", "duration": "1 hour"},
    ],
    "graphql": [
        {"platform": "GraphQL.org", "title": "Learn GraphQL", "url": "https://graphql.org/learn/", "cost": "free", "duration": "2 hours"},
    ],
    "rest api": [
        {"platform": "REST API Tutorial", "title": "REST API Best Practices", "url": "https://restfulapi.net/", "cost": "free", "duration": "2 hours"},
    ],
    "microservices": [
        {"platform": "Microsoft Docs", "title": "Microservices Architecture Guide", "url": "https://learn.microsoft.com/en-us/azure/architecture/microservices/", "cost": "free", "duration": "3 hours"},
        {"platform": "YouTube", "title": "Microservices Explained", "url": "https://youtu.be/4n1AhI1mEGk", "cost": "free", "duration": "1 hour"},
    ],
    "kafka": [
        {"platform": "Confluent", "title": "Apache Kafka 101", "url": "https://developer.confluent.io/courses/apache-kafka-101/", "cost": "free", "duration": "3 hours"},
    ],
    "elasticsearch": [
        {"platform": "Elastic", "title": "Elasticsearch Fundamentals", "url": "https://www.elastic.co/training/elasticsearch-fundamentals", "cost": "free", "duration": "4 hours"},
    ],
    "prometheus": [
        {"platform": "Prometheus Docs", "title": "Getting Started with Prometheus", "url": "https://prometheus.io/docs/introduction/overview/", "cost": "free", "duration": "2 hours"},
    ],
    "docker compose": [
        {"platform": "Docker Docs", "title": "Docker Compose Guide", "url": "https://docs.docker.com/compose/gettingstarted/", "cost": "free", "duration": "1 hour"},
    ],
    "react native": [
        {"platform": "React Native Docs", "title": "React Native Tutorial", "url": "https://reactnative.dev/docs/tutorial", "cost": "free", "duration": "4 hours"},
    ],
    "next.js": [
        {"platform": "Next.js Docs", "title": "Next.js Learn", "url": "https://nextjs.org/learn", "cost": "free", "duration": "6 hours"},
    ],
    "tailwind": [
        {"platform": "Tailwind Docs", "title": "Tailwind CSS Documentation", "url": "https://tailwindcss.com/docs", "cost": "free", "duration": "3 hours"},
    ],
    "pandas": [
        {"platform": "Pandas Docs", "title": "Pandas Getting Started", "url": "https://pandas.pydata.org/docs/getting_started/", "cost": "free", "duration": "4 hours"},
    ],
    "numpy": [
        {"platform": "NumPy Docs", "title": "NumPy Quickstart", "url": "https://numpy.org/doc/stable/user/quickstart.html", "cost": "free", "duration": "2 hours"},
    ],
    "spark": [
        {"platform": "Databricks", "title": "Apache Spark Tutorial", "url": "https://www.databricks.com/resources/learn/training/apache-spark", "cost": "free", "duration": "5 hours"},
    ],
    "airflow": [
        {"platform": "Airflow Docs", "title": "Apache Airflow Tutorial", "url": "https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html", "cost": "free", "duration": "3 hours"},
    ],
    "tableau": [
        {"platform": "Tableau", "title": "Tableau Free Training Videos", "url": "https://www.tableau.com/learn/training", "cost": "free", "duration": "10 hours"},
    ],
    "prompt engineering": [
        {"platform": "OpenAI", "title": "Prompt Engineering Guide", "url": "https://platform.openai.com/docs/guides/prompt-engineering", "cost": "free", "duration": "1 hour"},
    ],
    "rust": [
        {"platform": "Rust Book", "title": "The Rust Programming Language", "url": "https://doc.rust-lang.org/book/", "cost": "free", "duration": "20 hours"},
    ],
    "go": [
        {"platform": "Go Docs", "title": "A Tour of Go", "url": "https://go.dev/tour/", "cost": "free", "duration": "4 hours"},
        {"platform": "YouTube", "title": "Go Crash Course", "url": "https://youtu.be/YS4e4q9oBaU", "cost": "free", "duration": "1.5 hours"},
    ],
    "kubernetes": [
        {"platform": "K8s Docs", "title": "Kubernetes Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "cost": "free", "duration": "4 hours"},
        {"platform": "Coursera", "title": "Kubernetes for Developers", "url": "https://www.coursera.org/learn/kubernetes-development", "cost": "free audit", "duration": "12 hours"},
    ],
    "docker": [
        {"platform": "Docker Docs", "title": "Docker Get Started Guide", "url": "https://docs.docker.com/get-started/", "cost": "free", "duration": "2 hours"},
        {"platform": "YouTube", "title": "Docker Crash Course", "url": "https://youtu.be/3c-iBn73dDE", "cost": "free", "duration": "2 hours"},
    ],
}

# ── IMPROVEMENT SUGGESTIONS ───────────────────────────────────────────────────
# For skills not in the resource DB, generate a helpful study path suggestion.

HOW_TO_ACQUIRE_TEMPLATES: dict[str, str] = {
    "default": (
        "Start with the official documentation and tutorials. "
        "Then build a small project that demonstrates practical proficiency. "
        "Contribute to an open-source project using this technology to gain real-world experience."
    ),
    "framework": (
        "Begin with the official getting-started guide, then build a sample application. "
        "Review best practices and common patterns used in production applications. "
        "Study real-world implementations on GitHub."
    ),
    "language": (
        "Start with the official language tutorial to learn syntax and core concepts. "
        "Practice with coding challenges on LeetCode or HackerRank. "
        "Build a small project to apply what you've learned."
    ),
    "cloud": (
        "Create a free-tier account on the cloud platform and follow their getting-started tutorials. "
        "Complete a hands-on lab or certification path. "
        "Deploy a sample application to learn the deployment workflow."
    ),
    "database": (
        "Read the official documentation for core concepts and data modelling. "
        "Practice writing queries and designing schemas. "
        "Set up a local instance and build a small data-driven application."
    ),
    "devops": (
        "Follow official tutorials for setup and configuration. "
        "Set up a practice environment locally. "
        "Implement a sample CI/CD pipeline or infrastructure-as-code project."
    ),
    "ai": (
        "Start with foundational concepts through online courses. "
        "Implement classic algorithms from scratch to understand the mechanics. "
        "Apply techniques to a real dataset using popular frameworks."
    ),
}


def get_resources(skill_name: str) -> list[dict[str, str]]:
    """Returns curated learning resources for a skill. Case-insensitive."""
    key = skill_name.lower().strip()
    return LEARNING_RESOURCES.get(key, [])


def get_how_to_acquire(skill_name: str) -> str:
    """Returns a study path suggestion for a skill."""
    key = skill_name.lower().strip()
    if key in HOW_TO_ACQUIRE_TEMPLATES:
        return HOW_TO_ACQUIRE_TEMPLATES[key]

    # Auto-detect category from skill name
    frameworks = ["react", "angular", "vue", "django", "flask", "spring", "express", "next.js"]
    languages = ["python", "java", "javascript", "typescript", "go", "rust", "kotlin", "swift", "ruby", "php", "scala"]
    clouds = ["aws", "azure", "gcp", "google cloud", "amazon web services", "microsoft azure"]
    databases = ["sql", "postgresql", "mongodb", "redis", "mysql", "cassandra", "dynamodb", "elasticsearch"]
    devops = ["docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "github actions", "prometheus", "grafana"]
    ai = ["machine learning", "deep learning", "tensorflow", "pytorch", "llm", "langchain", "nlp", "computer vision"]

    lower = key
    if any(f in lower for f in frameworks):
        return HOW_TO_ACQUIRE_TEMPLATES["framework"]
    elif any(l in lower for l in languages):
        return HOW_TO_ACQUIRE_TEMPLATES["language"]
    elif any(c in lower for c in clouds):
        return HOW_TO_ACQUIRE_TEMPLATES["cloud"]
    elif any(d in lower for d in databases):
        return HOW_TO_ACQUIRE_TEMPLATES["database"]
    elif any(do in lower for do in devops):
        return HOW_TO_ACQUIRE_TEMPLATES["devops"]
    elif any(a in lower for a in ai):
        return HOW_TO_ACQUIRE_TEMPLATES["ai"]
    else:
        return HOW_TO_ACQUIRE_TEMPLATES["default"]


def estimate_acquisition_time(skill_name: str) -> str:
    """Returns estimated time to gain proficiency in a skill."""
    # Rough estimates based on skill complexity
    easy = ["git", "sql", "docker", "fastapi", "flask", "rest api", "graphql",
            "pandas", "numpy", "tailwind", "next.js", "react native", "ci/cd"]
    medium = ["python", "javascript", "typescript", "react", "node.js", "django",
              "mongodb", "redis", "aws", "gcp", "azure", "linux", "terraform",
              "airflow", "tableau", "postgresql", "docker compose", "prometheus"]
    hard = ["java", "kubernetes", "spring boot", "spark", "kafka", "elasticsearch",
            "machine learning", "deep learning", "langchain", "microservices"]
    expert = ["tensorflow", "pytorch", "rust", "go", "prompt engineering", "llm"]

    key = skill_name.lower().strip()
    if key in easy:
        return "1-2 weeks"
    elif key in medium:
        return "2-4 weeks"
    elif key in hard:
        return "4-8 weeks"
    elif key in expert:
        return "6-12 weeks"
    else:
        return "3-6 weeks"
