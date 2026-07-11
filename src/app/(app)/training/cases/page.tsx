"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Product {
  name: string;
  enName: string;
  description: string;
  articleCount: number;
  isCustom?: boolean;
}

interface Scenario {
  title: string;
  product: string;
  role: string;
  context: string;
  decision: string;
  constraints: string[];
  success_metrics: string[];
  hidden_risks: string[];
}

interface Evaluation {
  overall_score: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  next_practice: string;
}

function ProductButton({
  product,
  active,
  onSelect,
}: {
  product: Product;
  active: boolean;
  onSelect: (product: Product) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        "w-full px-4 py-3 text-left transition-colors",
        active
          ? "bg-primary-soft"
          : "bg-white hover:bg-surface"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body-md font-semibold text-ink">
            {product.name}
          </p>
          <p className="truncate text-body-sm text-ink-muted">
            {product.enName || "自定义案例"}
          </p>
        </div>
        <Badge variant={product.articleCount > 0 ? "default" : "neutral"}>
          {product.articleCount > 0 ? `${product.articleCount} 篇` : "待拆"}
        </Badge>
      </div>
    </button>
  );
}

function ScenarioPanel({
  scenario,
  loading,
}: {
  scenario: Scenario | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card size="lg" className="min-h-[360px]">
        <div className="flex h-full min-h-[300px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
            <p className="mt-3 text-body-sm text-ink-muted">
              正在生成决策推演...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!scenario) {
    return (
      <Card size="lg" className="min-h-[360px]">
        <div className="flex h-full min-h-[300px] items-center justify-center text-center">
          <div>
            <BrainCircuit className="mx-auto h-9 w-9 text-ink-faint" />
            <p className="mt-3 text-body-md font-semibold text-ink">
              选择产品后开始推演
            </p>
            <p className="mt-1 text-body-sm text-ink-muted">
              系统会生成一个具体决策场景，并把你的作答归档到训练记录。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card size="lg" className="min-h-[360px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>决策推演</Badge>
        <Badge variant="neutral">{scenario.product}</Badge>
        <Badge variant="outline">{scenario.role}</Badge>
      </div>
      <h2 className="mt-4 text-heading-lg font-bold text-ink">
        {scenario.title}
      </h2>
      <p className="mt-3 text-body-md leading-relaxed text-ink-muted">
        {scenario.context}
      </p>

      <div className="mt-5 rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-label font-bold text-primary">你要做的决策</p>
        <p className="mt-2 text-body-md leading-relaxed text-ink">
          {scenario.decision}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-label font-bold text-ink-muted">约束条件</p>
          <div className="space-y-2">
            {scenario.constraints.map((item) => (
              <div className="flex gap-2 text-body-sm text-ink" key={item}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-label font-bold text-ink-muted">成功指标</p>
          <div className="space-y-2">
            {scenario.success_metrics.map((item) => (
              <div className="flex gap-2 text-body-sm text-ink" key={item}>
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function CasesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [query, setQuery] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cases?action=list-products")
      .then((response) => response.json())
      .then((data) => {
        const list = data.products || [];
        setProducts(list);
        setSelectedProduct(list[0] || null);
      })
      .catch(() => setError("案例列表加载失败，请稍后重试。"))
      .finally(() => setLoadingProducts(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) => {
      return [product.name, product.enName, product.description]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [products, query]);

  const totalArticles = products.reduce(
    (sum, product) => sum + product.articleCount,
    0
  );

  async function generateScenario(productName = selectedProduct?.name) {
    if (!productName) return;
    setScenarioLoading(true);
    setError(null);
    setEvaluation(null);
    setRecordId(null);
    setAnswer("");
    try {
      const response = await fetch("/api/cases/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", product: productName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");
      setScenario(data.scenario);
    } catch (err: any) {
      setError(err.message || "生成推演失败，请稍后重试。");
    } finally {
      setScenarioLoading(false);
    }
  }

  async function submitSimulation() {
    if (!selectedProduct || !scenario || answer.trim().length < 20) return;
    setEvaluating(true);
    setError(null);
    try {
      const response = await fetch("/api/cases/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          product: selectedProduct.name,
          scenario,
          userAnswer: answer,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "提交失败");
      setEvaluation(data.evaluation);
      setRecordId(data.recordId);
    } catch (err: any) {
      setError(err.message || "提交推演失败，请稍后重试。");
    } finally {
      setEvaluating(false);
    }
  }

  function addCustomProduct() {
    const name = customProduct.trim();
    if (!name) return;
    const product: Product = {
      name,
      enName: "",
      description: "自定义产品推演",
      articleCount: 0,
      isCustom: true,
    };
    setProducts((current) => [product, ...current]);
    setSelectedProduct(product);
    setCustomProduct("");
    generateScenario(name);
  }

  function openSelectedProduct() {
    if (!selectedProduct) return;
    router.push(`/training/cases/${encodeURIComponent(selectedProduct.name)}`);
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product);
    setScenario(null);
    setEvaluation(null);
    setRecordId(null);
  }

  return (
    <>
      <PageHeader
        title="产品案例"
        subtitle="选择产品，做决策推演或阅读拆解。"
        actions={
          <>
            <Button
              onClick={() => generateScenario()}
              disabled={!selectedProduct || scenarioLoading}
              icon={
                scenarioLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )
              }
            >
              生成推演
            </Button>
            <Button
              variant="secondary"
              onClick={openSelectedProduct}
              disabled={!selectedProduct}
              icon={<BookOpen className="h-4 w-4" />}
            >
              阅读拆解
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        {error && (
          <div role="alert" className="mb-5 rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-body-sm text-danger">
            {error}
          </div>
        )}

        <div className="mb-4 lg:hidden">
          <label className="block text-label font-semibold text-ink-muted" htmlFor="mobile-case-product">
            当前产品
          </label>
          <select
            id="mobile-case-product"
            value={selectedProduct?.name || ""}
            onChange={(event) => {
              const product = products.find((item) => item.name === event.target.value);
              if (product) selectProduct(product);
            }}
            className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3 text-body-md font-semibold text-ink outline-none focus:border-primary"
          >
            {filteredProducts.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name} · {product.articleCount > 0 ? `${product.articleCount} 篇` : "待拆"}
              </option>
            ))}
          </select>
        </div>

        <section className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden space-y-4 lg:block">
            <div>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索产品或场景..."
                className="pl-10"
                wrapperClassName="relative"
              />
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-faint" />
            </div>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-label font-bold text-ink-muted">
                    产品列表
                  </p>
                  <p className="mt-0.5 text-label text-ink-faint">{products.length} 个产品 · {totalArticles} 篇拆解</p>
                </div>
                <Badge variant="neutral">{filteredProducts.length}</Badge>
              </div>

              <div className="max-h-[430px] divide-y divide-line border-y border-line overflow-auto bg-white">
                {loadingProducts ? (
                  <>
                    <SkeletonCard className="h-24" />
                    <SkeletonCard className="h-24" />
                    <SkeletonCard className="h-24" />
                  </>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductButton
                      key={`${product.name}-${product.enName || "custom"}`}
                      product={product}
                      active={selectedProduct?.name === product.name}
                      onSelect={selectProduct}
                    />
                  ))
                )}
              </div>

            </section>

            <section className="border-t border-line pt-4">
              <p className="text-label font-bold text-ink-muted">
                自定义产品
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={customProduct}
                  onChange={(event) => setCustomProduct(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addCustomProduct();
                  }}
                  placeholder="例如 Linear"
                  wrapperClassName="flex-1"
                />
                <Button size="sm" onClick={addCustomProduct}>
                  添加
                </Button>
              </div>
            </section>
          </aside>

          <main className="space-y-4">
            <ScenarioPanel scenario={scenario} loading={scenarioLoading} />

            <Card size="lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-heading-sm font-semibold text-ink">
                    写下你的决策
                  </p>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    建议按“目标 - 证据 - 方案 - 取舍 - 验证”组织答案。
                  </p>
                </div>
                <Badge variant={answer.trim().length >= 20 ? "success" : "neutral"}>
                  {answer.trim().length} 字
                </Badge>
              </div>
              <Textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={!scenario || evaluating}
                className="mt-4 min-h-[180px]"
                placeholder="例如：我会先定义这个决策影响的核心客户和业务指标，再比较两个方案..."
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={submitSimulation}
                  loading={evaluating}
                  disabled={!scenario || answer.trim().length < 20}
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  提交并归档
                </Button>
                {recordId && (
                  <Link
                    href={`/training/history/${recordId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-body-md font-semibold text-ink transition-all hover:bg-surface"
                  >
                    查看复盘记录
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </Card>
          </main>

          <aside className={cn("space-y-4 lg:col-start-2", !evaluation && "hidden")}>
            <Card size="lg">
              <p className="text-heading-sm font-semibold text-ink">
                AI 教练反馈
              </p>
              {evaluation ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-primary-soft px-4 py-3">
                    <p className="text-label font-bold text-primary">综合评分</p>
                    <p className="mt-1 font-mono text-data-md font-bold text-ink">
                      {evaluation.overall_score}/10
                    </p>
                  </div>
                  <p className="text-body-sm leading-relaxed text-ink-muted">
                    {evaluation.feedback}
                  </p>
                  <div>
                    <p className="mb-2 text-label font-bold text-ink-muted">
                      关键盲区
                    </p>
                    <div className="space-y-2">
                      {evaluation.gaps.slice(0, 3).map((gap) => (
                        <p
                          key={gap}
                          className="rounded-lg bg-surface px-3 py-2 text-body-sm text-ink"
                        >
                          {gap}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-label font-bold text-ink-muted">
                      下一步练习
                    </p>
                    <p className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-body-sm text-ink">
                      {evaluation.next_practice}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-body-sm leading-relaxed text-ink-muted">
                  提交推演后，这里会展示评分、盲区和下一步练习。完整内容会进入训练记录详情页。
                </p>
              )}
            </Card>

            <Card size="lg">
              <p className="text-heading-sm font-semibold text-ink">
                高阶 PM 作答检查
              </p>
              <div className="mt-4 space-y-3">
                {["业务目标是否明确", "证据链是否足够", "方案取舍是否有标准", "风险和验证是否闭环"].map(
                  (item) => (
                    <div key={item} className="flex gap-2 text-body-sm text-ink-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span>{item}</span>
                    </div>
                  )
                )}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </>
  );
}
