"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createJob } from "@/actions/jobs";
import type { ExtractedJob } from "@/lib/types";

interface ReviewExtractedJobProps {
  data: ExtractedJob;
  sourceUrl: string;
  onBack: () => void;
}

export function ReviewExtractedJob({ data, sourceUrl, onBack }: ReviewExtractedJobProps) {
  const [form, setForm] = useState({
    job_role: data.job_role,
    company_name: data.company_name,
    experience_years: data.experience_years ?? "",
    location: data.location ?? "",
    date_posted: data.date_posted ?? "",
    salary_min: data.salary_min?.toString() ?? "",
    salary_max: data.salary_max?.toString() ?? "",
    description_summary: data.description_summary ?? "",
    required_skills: data.required_skills.join(", "),
  });
  const [isPending, startTransition] = useTransition();

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      await createJob({
        source_url: sourceUrl,
        job_role: form.job_role,
        company_name: form.company_name,
        experience_years: form.experience_years || null,
        location: form.location || null,
        date_posted: form.date_posted || null,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        description_summary: form.description_summary || null,
        required_skills: form.required_skills
          ? form.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Extracted Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Edit any fields before saving. AI extraction may not be perfect.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Job Role *</label>
            <Input
              value={form.job_role}
              onChange={(e) => update("job_role", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company *</label>
            <Input
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Experience Required</label>
            <Input
              value={form.experience_years}
              onChange={(e) => update("experience_years", e.target.value)}
              placeholder="e.g. 3-5, Entry level"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Salary Min ($)</label>
            <Input
              type="number"
              value={form.salary_min}
              onChange={(e) => update("salary_min", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Salary Max ($)</label>
            <Input
              type="number"
              value={form.salary_max}
              onChange={(e) => update("salary_max", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date Posted</label>
            <Input
              type="date"
              value={form.date_posted}
              onChange={(e) => update("date_posted", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Summary</label>
          <Textarea
            value={form.description_summary}
            onChange={(e) => update("description_summary", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Required Skills</label>
          <Input
            value={form.required_skills}
            onChange={(e) => update("required_skills", e.target.value)}
            placeholder="React, TypeScript, Node.js (comma-separated)"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.job_role || !form.company_name || isPending}
          >
            {isPending ? "Saving..." : "Save Job"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
