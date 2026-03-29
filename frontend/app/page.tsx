import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFAF6] text-[#1C1917]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E07B54] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">CareVo</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Features
          </a>
          <a href="#nonprofits" className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Who it's for
          </a>
          <a href="#pricing" className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors">
            Pricing
          </a>
          <Link href="/login"
            className="bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917] text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#FEF3EC] border border-[#F5C5A3] text-[#E07B54] text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#E07B54] rounded-full animate-pulse" />
            Built at Opportunity Hack 2026 · WiCS x OHack
          </div>

          <h1 className="text-6xl font-bold leading-[1.08] tracking-tight mb-6">
            Case management
            <br />
            nonprofits can
            <br />
            <span className="text-[#E07B54]">actually afford.</span>
          </h1>

          <p className="text-xl text-[#78716C] leading-relaxed mb-10 max-w-xl">
            CareVo replaces spreadsheets and $150/user/month enterprise tools with an AI-native platform that runs for under $30/month — built for food banks, shelters, clinics, and everyone in between.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/login"
              className="bg-[#1C1917] hover:bg-[#292524] text-[#1C1917] font-semibold px-7 py-3.5 rounded-xl transition-colors text-base">
              Get Started Free
            </Link>
            <a href="#features"
              className="flex items-center gap-2 text-[#78716C] hover:text-[#1C1917] font-medium transition-colors">
              See how it works
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-4 gap-6">
          {[
            { value: '$0/mo', label: 'to get started', sub: 'Free tier forever' },
            { value: '3 roles', label: 'built in', sub: 'Admin · Org Admin · Staff' },
            { value: '8+', label: 'AI features', sub: 'Voice, vision, search' },
            { value: '9', label: 'nonprofits served', sub: 'Across 7 hackathons' },
          ].map(stat => (
            <div key={stat.label}
              className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
              <p className="text-3xl font-bold text-[#E07B54]">{stat.value}</p>
              <p className="text-sm font-medium text-[#1C1917] mt-1">{stat.label}</p>
              <p className="text-xs text-[#A8A29E] mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-[#1C1917] text-[#1C1917] py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#E07B54] text-sm font-semibold uppercase tracking-widest mb-4">
                The Problem
              </p>
              <h2 className="text-4xl font-bold leading-tight mb-6">
                92% of nonprofits can't afford the tools they need.
              </h2>
              <p className="text-[#A8A29E] leading-relaxed">
                Bonterra Apricot costs $50–150/user/month. CharityTracker runs $20/user/month.
                So nonprofits use spreadsheets, paper forms, and disconnected Google Forms — losing
                data, duplicating clients, and spending hours on grant reports that should take minutes.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { before: 'Paper intake forms → 15 min manual entry', after: 'Snap a photo → AI fills the form in seconds' },
                { before: 'Ctrl+F through hundreds of case notes', after: 'Ask in plain English, get instant answers' },
                { before: '$2,500–7,500/month for enterprise tools', after: '$0–30/month with full feature parity' },
                { before: '3–5 days writing quarterly grant reports', after: 'One click, AI generates the narrative' },
              ].map((item, i) => (
                <div key={i} className="bg-[#292524] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[#78716C] text-xs mt-0.5 shrink-0">Before</span>
                    <p className="text-[#A8A29E] text-sm line-through">{item.before}</p>
                  </div>
                  <div className="flex items-start gap-3 mt-2">
                    <span className="text-[#E07B54] text-xs mt-0.5 shrink-0">After</span>
                    <p className="text-[#1C1917] text-sm font-medium">{item.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-8">
        <div className="text-center mb-16">
          <p className="text-[#E07B54] text-sm font-semibold uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl font-bold">Everything your team needs.</h2>
          <p className="text-[#78716C] mt-4 max-w-xl mx-auto">
            Built from 9+ years of OHack nonprofit partnerships. Every feature solves a real pain point.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: '📸',
              title: 'Photo-to-Intake',
              desc: 'Snap a paper intake form with your phone. Claude Vision extracts every field and pre-populates the client record. Zero typing.',
              tag: 'AI',
            },
            {
              icon: '🎙️',
              title: 'Voice Intake',
              desc: 'Speak client details in English, Spanish, or French. AI extracts and maps every field automatically. Works on any device.',
              tag: 'AI · Multilingual',
            },
            {
              icon: '🔍',
              title: 'Semantic Search',
              desc: 'Ask "which clients needed housing last month?" and get results — even if the notes said "applied for Section 8". Powered by pgvector.',
              tag: 'AI',
            },
            {
              icon: '📊',
              title: 'Analytics Dashboard',
              desc: 'Demographics by service type, age groups, language breakdowns, weekly trends. Exportable to PDF for funders.',
              tag: 'Reporting',
            },
            {
              icon: '❓',
              title: 'Ask Analytics',
              desc: 'Type "how many male clients attended food distribution?" and get the answer instantly. No SQL, no exports.',
              tag: 'AI',
            },
            {
              icon: '🏢',
              title: 'Multi-Org Support',
              desc: 'One platform, multiple nonprofits. Super admin sees everything. Org admins see their own. Staff see only their events.',
              tag: 'Access Control',
            },
            {
              icon: '📅',
              title: 'Event Management',
              desc: 'Create events, assign staff, track clients served per event. Separate views for upcoming and past events.',
              tag: 'Core',
            },
            {
              icon: '🌐',
              title: 'Multilingual Forms',
              desc: 'Toggle between English, Spanish, and French on any intake form. Client data stored in both languages.',
              tag: 'Accessibility',
            },
            {
              icon: '⚠️',
              title: 'Duplicate Detection',
              desc: 'Automatically flags clients registered multiple times across workers. Admin resolves before data gets messy.',
              tag: 'Data Quality',
            },
          ].map(f => (
            <div key={f.title}
              className="bg-white border border-[#E7E5E4] rounded-2xl p-6 hover:border-[#E07B54] hover:shadow-sm transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-[#1C1917]">{f.title}</h3>
                <span className="text-xs bg-[#FEF3EC] text-[#E07B54] px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {f.tag}
                </span>
              </div>
              <p className="text-sm text-[#78716C] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section id="nonprofits"
        className="py-20 bg-[#F5F3F0]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-[#E07B54] text-sm font-semibold uppercase tracking-widest mb-3">
              Who it's for
            </p>
            <h2 className="text-4xl font-bold">Built for every kind of nonprofit.</h2>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'ICM Food & Clothing Bank', type: 'Food Assistance', icon: '🥫' },
              { name: 'Chandler CARE Center', type: 'Crisis Intervention', icon: '🏠' },
              { name: 'Will2Walk Foundation', type: 'Medical Rehabilitation', icon: '♿' },
              { name: 'NMTSA', type: 'Music Therapy', icon: '🎵' },
              { name: 'Sunshine Acres', type: 'Youth Services', icon: '☀️' },
              { name: 'Lost Our Home', type: 'Pet Rescue', icon: '🐾' },
              { name: 'Tranquility Trail', type: 'Animal Sanctuary', icon: '🌿' },
              { name: 'Seed Spot', type: 'Entrepreneur Support', icon: '🌱' },
            ].map(org => (
              <div key={org.name}
                className="bg-white border border-[#E7E5E4] rounded-xl p-4">
                <div className="text-2xl mb-2">{org.icon}</div>
                <p className="font-medium text-[#1C1917] text-sm">{org.name}</p>
                <p className="text-xs text-[#A8A29E] mt-0.5">{org.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-8">
        <div className="text-center mb-16">
          <p className="text-[#E07B54] text-sm font-semibold uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-bold">Honest pricing for nonprofits.</h2>
          <p className="text-[#78716C] mt-4">
            Compare to Bonterra Apricot at $2,500–7,500/month.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              desc: 'For small nonprofits just getting started',
              features: [
                'Up to 50 clients',
                'Unlimited events',
                'Photo-to-Intake AI',
                'Voice intake (EN)',
                'Basic analytics',
                '2 staff accounts',
              ],
              cta: 'Get Started',
              highlight: false,
            },
            {
              name: 'Nonprofit',
              price: '$29',
              period: 'per month',
              desc: 'For growing organizations with multiple programs',
              features: [
                'Unlimited clients',
                'Unlimited events',
                'All AI features',
                'Multilingual forms (EN/ES/FR)',
                'Advanced analytics + PDF export',
                'Semantic search',
                'Ask Analytics (AI queries)',
                'Unlimited staff accounts',
                'Multi-program support',
              ],
              cta: 'Start Free Trial',
              highlight: true,
            },
            {
              name: 'Network',
              price: '$99',
              period: 'per month',
              desc: 'For umbrella orgs managing multiple chapters',
              features: [
                'Everything in Nonprofit',
                'Multi-org management',
                'Cross-org analytics',
                'Super admin dashboard',
                'Priority support',
                'Custom service types + AI forms',
                'API access',
              ],
              cta: 'Contact Us',
              highlight: false,
            },
          ].map(plan => (
            <div key={plan.name}
              className={`rounded-2xl p-7 border ${
                plan.highlight
                  ? 'bg-[#1C1917] text-[#1C1917] border-[#1C1917]'
                  : 'bg-white text-[#1C1917] border-[#E7E5E4]'
              }`}>
              {plan.highlight && (
                <div className="inline-block bg-[#E07B54] text-[#1C1917] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Most Popular
                </div>
              )}
              <p className={`text-sm font-semibold ${plan.highlight ? 'text-[#A8A29E]' : 'text-[#78716C]'}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? 'text-[#A8A29E]' : 'text-[#78716C]'}`}>
                  /{plan.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-[#A8A29E]' : 'text-[#78716C]'}`}>
                {plan.desc}
              </p>
              <Link href="/login"
                className={`block text-center py-2.5 rounded-xl font-medium text-sm transition-colors mb-6 ${
                  plan.highlight
                    ? 'bg-[#E07B54] hover:bg-[#C96B44] text-[#1C1917]'
                    : 'bg-[#1C1917] hover:bg-[#292524] text-[#1C1917]'
                }`}>
                {plan.cta}
              </Link>
              <ul className="space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg className={`w-4 h-4 mt-0.5 shrink-0 ${
                      plan.highlight ? 'text-[#E07B54]' : 'text-[#E07B54]'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? 'text-[#D4CFC9]' : 'text-[#78716C]'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#E07B54] py-20">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-[#1C1917] mb-4">
            Ready to replace your spreadsheets?
          </h2>
          <p className="text-[#FDDCC8] text-lg mb-8">
            Join the nonprofits already using CareVo to serve more clients, cut admin time, and write better grant reports.
          </p>
          <Link href="/login"
            className="inline-block bg-white hover:bg-[#FDFAF6] text-[#E07B54] font-bold px-8 py-4 rounded-xl transition-colors text-lg">
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C1917] text-[#78716C] py-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#E07B54] rounded-md flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <span className="text-[#1C1917] font-semibold">CareVo</span>
          </div>
          <p className="text-sm">
            Built with ❤️ at{' '}
            <a href="https://ohack.dev" className="text-[#E07B54] hover:text-[#F5A87A]">
              Opportunity Hack 2026
            </a>
            {' '}· WiCS x OHack
          </p>
          <p className="text-sm">Open source · MIT License</p>
        </div>
      </footer>

    </div>
  )
}