export default function AuthLayout({
  children
}) {

  return (
    <div className="min-h-screen bg-black lg:grid lg:grid-cols-2">

      <div className="hidden lg:flex relative items-center justify-center overflow-hidden bg-black">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(134,188,37,0.18),transparent_35%)]" />

        <div className="relative z-10 max-w-xl px-12">

          <div className="mb-8">

            <img
              src="/del_logo.png"
              alt="Deloitte"
              className="h-10 w-auto"
            />

          </div>

          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#86bc25]">
            DTP Operate
          </p>

          <h2 className="mt-4 text-5xl font-semibold leading-tight text-white">
            Intelligent operations powered by AI.
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Intelligent triage, incident analysis, knowledge search and AI-assisted service operations.
          </p>

          <img
            src="/agent-image.png"
            alt="AI Agent"
            className="mt-10 max-h-72 w-full object-contain"
          />

        </div>

      </div>


      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-6 py-10">

        <div className="w-full max-w-md">

          <div className="mb-8 lg:hidden">

            <img
              src="/del_logo.png"
              alt="Deloitte"
              className="h-8 w-auto"
            />

          </div>

          {children}

          <p className="mt-8 text-center text-xs text-slate-400">
            DTP Operate Agent
          </p>

        </div>

      </div>

    </div>
  );
}