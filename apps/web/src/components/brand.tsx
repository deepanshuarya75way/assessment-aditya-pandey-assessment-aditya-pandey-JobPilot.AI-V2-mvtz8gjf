import Link from "next/link";

export default function Brand() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2"
    >
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 text-white shadow-lg shadow-black/10 dark:bg-white dark:text-black">
        <span className="absolute h-5 w-5 rotate-45 rounded-md border border-white/30 dark:border-black/20" />

        <span className="relative text-sm font-bold">
          J
        </span>
      </div>

      <span className="text-lg font-semibold tracking-tight">
        JobPilot
        <span className="text-neutral-500 dark:text-neutral-400">
          .AI
        </span>
      </span>
    </Link>
  );
}