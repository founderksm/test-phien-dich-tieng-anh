import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhraseCard } from "@/components/PhraseCard";
import { getRepo } from "@/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }> };

async function load(raw: string) {
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) return null;
  const repo = await getRepo();
  const category = await repo.getCategoryByNumber(number);
  if (!category) return null;
  return { category, phrases: await repo.listPhrasesByCategory(number) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  const data = await load(number);
  return { title: data ? `${data.category.number}. ${data.category.title}` : "Không tìm thấy" };
}

export default async function CategoryPage({ params }: Props) {
  await requireUser();
  const { number } = await params;
  const data = await load(number);
  if (!data) notFound();

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-accent">← Tất cả nhóm</Link>
      <h1 className="text-2xl font-semibold">
        {data.category.number}. {data.category.title}
      </h1>
      <p className="text-sm text-muted">{data.phrases.length} câu</p>
      <div className="space-y-3">
        {data.phrases.map((p) => (
          <PhraseCard key={p.id} phrase={p} />
        ))}
      </div>
    </div>
  );
}
