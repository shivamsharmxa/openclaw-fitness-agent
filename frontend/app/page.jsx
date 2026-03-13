import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xl font-bold text-brand-600">FitCoach</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <span className="rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold text-brand-700">
          Powered by AI
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900">
          Your personal fitness coach,{' '}
          <span className="text-brand-600">available 24/7</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
          Get AI-generated workout plans, personalized nutrition advice, and intelligent
          progress tracking — all in one place, or via Telegram.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">Everything you need</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🏋️',
                title: 'Workout Plans',
                desc: 'AI-generated plans tailored to your goals, equipment, and schedule',
              },
              {
                icon: '🥗',
                title: 'Nutrition Advice',
                desc: 'Personalized calorie and macro targets with meal suggestions',
              },
              {
                icon: '📈',
                title: 'Progress Tracking',
                desc: 'Log workouts and weight, visualize trends, get weekly summaries',
              },
              {
                icon: '💬',
                title: 'Telegram Bot',
                desc: 'Access your coach from anywhere through Telegram messaging',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        FitCoach — AI Fitness Coach
      </footer>
    </div>
  );
}
