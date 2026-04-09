export default function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      {text && <p className="text-zinc-400">{text}</p>}
    </div>
  );
}
