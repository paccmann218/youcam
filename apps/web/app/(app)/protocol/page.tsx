"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Face } from "@/components/illustrations/Face";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";

export default function ProtocolPage() {
  const { view, refresh } = useProof();
  const [protocol, setProtocol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ product: string; active: string; concern: string } | null>(null);

  // Arriving from the shop ("Bought it? Test it") fills in the product.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const product = query.get("product");
    if (product) setPrefill({ product, active: query.get("active") ?? "", concern: query.get("concern") ?? "acne" });
  }, []);

  if (!view) return null;
  return (
    <main className="space-y-8">
      <PageTitle kicker="Set up product" icon="protocol" title="What are you testing?">
        Tell WorthIt the product and what it should improve. For a single leave-on product, test it on one side of your face: the other side shows what sleep and stress did on their own.
      </PageTitle>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-6 md:p-8">
          {prefill ? (
            <Callout kind="success" className="mb-5">
              From the shop: <span className="font-medium">{prefill.product}</span>. Check the details and start.
            </Callout>
          ) : null}
          <form
            key={prefill ? prefill.product : "blank"}
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const res = await fetch("/api/trial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productName: data.get("productName"),
                  active: data.get("active"),
                  concern: data.get("concern"),
                  design: data.get("design"),
                  startedOn: data.get("startedOn"),
                }),
              });
              const json = await res.json();
              if (!res.ok) setError(json.error || "Could not start.");
              else {
                setProtocol(json.protocol);
                setError(null);
                await refresh();
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product">
                <Input name="productName" required defaultValue={prefill?.product} />
              </Field>
              <Field label="Active">
                <Input name="active" placeholder="niacinamide" defaultValue={prefill?.active} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Concern">
                <Select name="concern" defaultValue={prefill?.concern ?? "acne"}>
                  <option value="acne">Acne</option>
                  <option value="pore">Pores</option>
                  <option value="redness">Redness</option>
                  <option value="texture">Texture</option>
                </Select>
              </Field>
              <Field label="Design">
                <Select name="design">
                  <option value="split_face">One side</option>
                  <option value="before_after">Before and after</option>
                </Select>
              </Field>
            </div>
            <Field label="First day">
              <Input name="startedOn" type="date" />
            </Field>
            <Button type="submit" variant="accent" size="lg" className="w-full">
              <Icon name="protocol" size={18} />
              Start my test
            </Button>
          </form>
          {error ? <Callout kind="danger" className="mt-4">{error}</Callout> : null}
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-sage/10 via-card to-card p-6 md:p-8">
          <p className="kicker text-clay">Why one side</p>
          <h2 className="mt-2 font-serif text-2xl">Both halves lived through the same night.</h2>
          <Face variant="split" className="mx-auto mt-4 h-60 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-quiet">
            Apply the product to one side only. Sleep, stress and humidity hit both halves, so the left-minus-right difference keeps the product and drops the rest.
          </p>
        </Card>
      </section>

      {protocol ? (
        <Card tone="clay" className="p-6 md:p-8">
          <p className="kicker text-clay">Your plan</p>
          <blockquote className="mt-3 border-l-2 border-clay/50 pl-5 font-serif text-xl leading-relaxed md:text-2xl">{protocol}</blockquote>
        </Card>
      ) : null}
    </main>
  );
}
