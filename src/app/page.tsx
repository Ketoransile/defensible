export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6">
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">
          sequa SME Support Scheme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Application reviewer
        </h1>
        <p className="max-w-xl text-sm leading-6 text-zinc-400">
          Types, fixtures, and field-path resolver are in. Engine and ranking
          screen come next.
        </p>
      </main>
    </div>
  );
}
