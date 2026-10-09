import os
from django.core.management.base import BaseCommand
from portfolio.models import Project


class Command(BaseCommand):
    help = 'Seeds initial portfolio case studies with realistic, high-impact data.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding portfolio case studies...')

        projects_data = [
            {
                'title': 'Autonomous Invoice Processing & Accounts Payable Agent',
                'slug': 'autonomous-invoice-processing-agent',
                'industry': 'Logistics & Supply Chain',
                'service_category': 'ai-automation',
                'is_featured': True,
                'order': 1,
                'short_description': 'An intelligent document processing pipeline that extracts line-item data from 12,000+ monthly vendor invoices with 99.4% accuracy, eliminating 280 manual hours monthly.',
                'challenge': 'A multi-regional freight carrier processed over 12,000 vendor invoices each month manually. Accounts payable staff spent an average of 14 minutes per invoice validating line items against purchase orders, leading to payment delays, vendor disputes, and costly duplicate disbursements.',
                'objectives': '1. Reduce manual invoice review time by at least 70%.\n2. Achieve >99% line-item extraction accuracy across varying PDF layouts.\n3. Implement automated two-way matching against existing ERP databases.\n4. Ensure full audit compliance with human-in-the-loop review for anomalous totals.',
                'solution': 'Ijaz_Solutions engineered an asynchronous multi-stage AI extraction engine. The pipeline normalizes unstructured PDFs, utilizes a vision-language model with deterministic schema validation to parse tabular data, and validates calculated line items against purchase orders via database webhooks.',
                'implementation': 'Built on Python, FastAPI, and Celery with Redis for distributed task queues. Uses pgvector for semantic vendor matching and an intuitive web dashboard where human reviewers only intervene on confidence scores under 92%.',
                'features': 'Zero-shot table extraction from messy and scanned PDFs\nAutomated 2-way and 3-way PO matching\nReal-time fraud and duplicate invoice detection\nHuman-in-the-loop exception review portal\nBi-directional SAP and NetSuite synchronization',
                'technologies': 'Python, FastAPI, Celery, Redis, PostgreSQL, pgvector, Docker, AWS S3',
                'outcomes': '• 78% reduction in invoice cycle processing time (from 14 mins to 18 seconds)\n• 99.4% field extraction accuracy verified across 35,000+ test documents\n• $140,000 annual operational cost savings in staffing overhead\n• 100% elimination of duplicate vendor payouts',
                'lessons': 'Enforcing strict Pydantic JSON schemas with deterministic mathematical balance checks proved far superior to unconstrained LLM outputs, preventing 100% of hallucinations.',
            },
            {
                'title': 'PulseOps — Multi-Tenant Fleet Logistics & Dispatch SaaS',
                'slug': 'pulseops-fleet-logistics-saas',
                'industry': 'Transportation',
                'service_category': 'software-development',
                'is_featured': True,
                'order': 2,
                'short_description': 'A high-throughput SaaS platform managing live telemetry, dynamic route optimization, and driver dispatch across 1,800 active commercial transport vehicles.',
                'challenge': 'A mid-size fleet operator struggled with fragmented legacy tools, uncoordinated phone dispatching, and lack of real-time visibility into driver routes, resulting in high fuel wastage and delivery delays.',
                'objectives': '1. Consolidate dispatching, driver routing, and client tracking into a unified SaaS.\n2. Handle high-frequency GPS telemetry (100k events/min) without lag.\n3. Provide sub-second dynamic route recalculation based on live traffic.',
                'solution': 'We architected PulseOps from the ground up as a cloud-native, multi-tenant SaaS application. We engineered an event-driven telemetry ingest layer paired with WebSockets for instantaneous real-time dispatch updates.',
                'implementation': 'Leveraged Django with TimescaleDB for time-series geospatial tracking, Redis Pub/Sub for live driver coordinate broadcasting, and modern responsive interfaces with interactive Mapbox integration.',
                'features': 'Real-time vehicle map tracking with live status indicators\nDynamic shortest-path route recalculation with traffic avoidance\nAutomated SMS/Email client arrival ETA notifications\nComprehensive driver safety and idling analytics\nTenant data isolation with custom branding',
                'technologies': 'Django, Python, PostgreSQL, TimescaleDB, Redis, WebSockets, Mapbox GL, Docker',
                'outcomes': '• 22% reduction in fleet fuel consumption via route optimization\n• 99.98% platform uptime during peak operational transit hours\n• Scaled to 1,800 concurrent active vehicles with sub-50ms API response\n• 40% reduction in customer support dispatch check-in calls',
                'lessons': 'Partitioning time-series telemetry into time-bucket tables in TimescaleDB kept historical query performance constant regardless of multi-gigabyte monthly growth.',
            },
            {
                'title': 'OmniCare — Patient Telehealth & Clinic Booking Portal',
                'slug': 'omnicare-patient-telehealth-portal',
                'industry': 'Healthcare & HealthTech',
                'service_category': 'web-mobile',
                'is_featured': True,
                'order': 3,
                'short_description': 'A secure, HIPAA-compliant patient portal and telehealth PWA featuring encrypted video consultations, digital intake forms, and automated calendar synchronization.',
                'challenge': 'A regional medical clinic group faced high patient no-show rates (18%) and an overwhelmed front-desk phone staff burdened with booking appointments and manual paper intake documentation.',
                'objectives': '1. Create an intuitive mobile-first web app requiring zero patient app store downloads.\n2. Implement end-to-end encrypted WebRTC video visits.\n3. Automate pre-visit patient medical history intake.',
                'solution': 'We designed and engineered a Progressive Web App (PWA) with a focus on simplicity and accessibility. Patients access virtual appointment rooms and digital medical records with one-tap magic links without password friction.',
                'implementation': 'Built with high-performance responsive web technologies, WebRTC for encrypted audio/video peer connections, and deep two-way integration with clinic electronic health record (EHR) systems.',
                'features': 'One-click video room access with no client install required\nPre-appointment digital symptom questionnaire & signature collection\nAutomated SMS/WhatsApp appointment reminders with confirmation buttons\nWCAG 2.1 AA accessible typography and high-contrast ergonomics\nHIPAA compliant audit logging and data encryption at rest',
                'technologies': 'JavaScript, WebRTC, Django, PostgreSQL, Twilio API, AWS KMS, Docker',
                'outcomes': '• Patient appointment no-show rate plummeted from 18% to 4.2%\n• 65% reduction in front-desk scheduling phone calls\n• 98% patient satisfaction score across 8,000+ completed visits\n• Perfect 100/100 Google Lighthouse Accessibility & SEO scores',
                'lessons': 'Eliminating account creation passwords in favor of time-limited cryptographic magic links raised elderly patient digital completion rates by over 300%.',
            },
            {
                'title': 'FinCloud — Cloud Migration & Zero-Trust Infrastructure Hardening',
                'slug': 'fincloud-infrastructure-modernization',
                'industry': 'Financial Technology',
                'service_category': 'it-consulting',
                'is_featured': False,
                'order': 4,
                'short_description': 'Complete infrastructure overhaul migrating a legacy on-premises financial platform to an automated, containerized cloud stack with 42% cost reduction.',
                'challenge': 'A fintech firm faced escalating hosting costs, slow manual bi-weekly deployments, and compliance anxiety ahead of an institutional SOC2 Type II audit due to unmonitored infrastructure sprawl.',
                'objectives': '1. Migrate from unmanaged virtual servers to declarative Infrastructure as Code (Terraform).\n2. Implement a zero-trust network with strict role-based access control.\n3. Slash redundant monthly cloud expenditures by at least 30%.',
                'solution': 'Ijaz_Solutions performed a comprehensive architecture audit, identified zombie assets, and constructed a fully automated CI/CD deployment pipeline on AWS using Docker containers and automated staging environments.',
                'implementation': 'Implemented Terraform for reproducible environments, automated Prometheus and Grafana metrics dashboards, Sentry application telemetry, and strict encrypted data pipelines.',
                'features': 'Infrastructure as Code (Terraform) across Staging & Production\nZero-downtime rolling deployments via GitHub Actions\nContinuous vulnerability scanning and automated security patches\nGranular AWS IAM least-privilege role policies\n24/7 automated alerting via Slack and PagerDuty',
                'technologies': 'AWS, Terraform, Docker, GitHub Actions, Prometheus, Grafana, PostgreSQL, Nginx',
                'outcomes': '• 42% immediate reduction in monthly cloud infrastructure expenses\n• Deployment frequency increased from bi-weekly to multiple daily zero-downtime releases\n• 100% compliance pass on initial SOC2 Type II security audit\n• Zero unauthorized access attempts or production outages over 12 months',
                'lessons': 'Containerizing the application and adopting strict ephemeral staging environments eliminated "it works on my machine" defects permanently.',
            },
            {
                'title': 'LegalDoc AI — Intelligent Contract Extraction & Redlining',
                'slug': 'legaldoc-ai-contract-extraction',
                'industry': 'Legal & Corporate Governance',
                'service_category': 'ai-automation',
                'is_featured': False,
                'order': 5,
                'short_description': 'An intelligent legal assistant that analyzes 50+ page vendor contracts in under 30 seconds, highlighting non-standard liability clauses and compliance risks.',
                'challenge': 'Corporate legal counsel was backlogged by 3 weeks reviewing routine non-disclosure agreements, master service agreements, and software licenses, stalling strategic vendor onboarding.',
                'objectives': '1. Accelerate first-pass contract reviews from 4 hours to under 2 minutes.\n2. Standardize clause risk classifications against internal legal playbooks.\n3. Export highlighted redlines directly back into Word and PDF formats.',
                'solution': 'We engineered a private retrieval-augmented model grounded strictly in the firm’s proprietary approved clause database, flagging non-compliant clauses with suggested redline revisions.',
                'implementation': 'Utilized hybrid lexical and vector search with local privacy-preserving embeddings, ensuring no confidential contract data was ever shared with external training sets.',
                'features': 'Instant clause comparison against company standard language\nRed-Amber-Green risk scoring for liability, indemnification, and IP terms\nAutomated DOCX redline export with tracked comments\nStrict confidential data isolation with zero data retention policies',
                'technologies': 'Python, LangChain, PostgreSQL, FastAPI, Celery, Docker',
                'outcomes': '• 84% reduction in first-pass contract review duration\n• Legal backlog cleared from 21 days down to same-day turnaround\n• 100% data confidentiality compliance maintained across 1,200 contracts',
                'lessons': 'Grounding models on structured clause taxonomies with strict citation references eliminated false positive warnings and earned immediate trust from legal counsel.',
            },
            {
                'title': 'TradeDesk — B2B Wholesale Commerce Platform',
                'slug': 'tradedesk-b2b-commerce-platform',
                'industry': 'Wholesale & Distribution',
                'service_category': 'software-development',
                'is_featured': False,
                'order': 6,
                'short_description': 'A high-speed B2B wholesale ordering platform featuring tiered corporate pricing, bulk CSV ordering, Net-30 credit lines, and instant ERP inventory sync.',
                'challenge': 'A national distributor handled wholesale buyer orders via PDF order forms and phone calls. Errors in stock levels, pricing tiers, and credit authorizations cost thousands in lost orders and administrative friction.',
                'objectives': '1. Provide self-service wholesale ordering with custom negotiated buyer price lists.\n2. Enable rapid 1-click re-ordering and bulk SKU CSV imports.\n3. Integrate live inventory levels with on-premises warehouse ERP.',
                'solution': 'We designed and deployed TradeDesk, a high-performance wholesale commerce platform optimized for B2B procurement workflows with fast keyboard navigation and instant quote generation.',
                'implementation': 'Architected with Django, PostgreSQL, Redis caching, and an administrative order management console with real-time stock reservations.',
                'features': 'Tiered pricing matrix supporting thousands of custom account contracts\nBulk order matrix with instantaneous SKU search and CSV uploads\nAutomated Net-30 trade credit application and approval workflow\nWarehouse ERP bi-directional inventory synchronization every 60 seconds',
                'technologies': 'Django, Python, PostgreSQL, Redis, Celery, Tailwind/Vanilla CSS, Docker',
                'outcomes': '• 310% increase in digital wholesale order volume within 90 days\n• 92% decrease in order processing errors\n• Reduced average buyer checkout duration from 35 minutes to under 3 minutes',
                'lessons': 'Prioritizing keyboard shortcuts and instant SKU table filtering allowed high-volume corporate buyers to place 50-item replenishment orders in seconds.',
            }
        ]

        for p_data in projects_data:
            project, created = Project.objects.update_or_create(
                slug=p_data['slug'],
                defaults=p_data
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f"  {status}: {project.title}")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(projects_data)} projects!'))
