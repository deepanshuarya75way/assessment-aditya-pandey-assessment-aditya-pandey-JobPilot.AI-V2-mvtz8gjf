"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { DragEvent } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

const COLUMNS = [
  { id: "saved", title: "Saved", headerColor: "bg-slate-800 text-white", bodyColor: "bg-slate-100/50" },
  { id: "applied", title: "Applied", headerColor: "bg-blue-600 text-white", bodyColor: "bg-blue-50/50" },
  { id: "assessment", title: "Assessment", headerColor: "bg-yellow-500 text-white", bodyColor: "bg-yellow-50/50" },
  { id: "interview", title: "Interview", headerColor: "bg-purple-600 text-white", bodyColor: "bg-purple-50/50" },
  { id: "offer", title: "Offer", headerColor: "bg-emerald-600 text-white", bodyColor: "bg-emerald-50/50" },
  { id: "rejected", title: "Rejected", headerColor: "bg-red-500 text-white", bodyColor: "bg-red-50/50" },
] as const;


type Filters = {
  search: string;
  status: string;
  minMatch: string;
  maxMatch: string;
  minTrust: string;
  maxTrust: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};


const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "",
  minMatch: "",
  maxMatch: "",
  minTrust: "",
  maxTrust: "",
  sortBy: "updated_at",
  sortOrder: "desc",
  page: 1,
  pageSize: 10,
};


type SavedView = {
  _id: string;
  name: string;
  filters: {
    search?: string;
    status?: string;
    min_match?: number | string | null;
    max_match?: number | string | null;
    min_trust?: number | string | null;
    max_trust?: number | string | null;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    page?: number;
    page_size?: number;
  };
};


const VALID_SORT_FIELDS = [
  "updated_at",
  "created_at",
  "fit_score",
  "company",
  "title",
  "company_trust_score",
];


function readFiltersFromUrl(): Filters {

  const params = new URLSearchParams(
    window.location.search
  );

  const page = Number(
    params.get("page") || 1
  );

  const pageSize = Number(
    params.get("page_size") || 10
  );

  const validStatuses = COLUMNS.map(
    (column) => column.id
  );

  

  const readScore = (key: string): string => {

    const value = params.get(key);

    if (value === null || value === "") {
      return "";
    }

    const number = Number(value);

    return Number.isFinite(number) &&
      number >= 0 &&
      number <= 100
      ? value
      : "";
  };

  return {

    search: (
      params.get("search") || ""
    ).slice(0, 120),

    status: validStatuses.includes(
      params.get("status") as any
    )
      ? params.get("status")!
      : "",

    minMatch: readScore("min_match"),

    maxMatch: readScore("max_match"),

    minTrust: readScore("min_trust"),

    maxTrust: readScore("max_trust"),

    sortBy: VALID_SORT_FIELDS.includes(
      params.get("sort_by") || ""
    )
      ? params.get("sort_by")!
      : DEFAULT_FILTERS.sortBy,

    sortOrder:
      params.get("sort_order") === "asc"
        ? "asc"
        : "desc",

    page:
      Number.isInteger(page) && page > 0
        ? page
        : 1,

    pageSize:
      [5, 10, 20, 50].includes(pageSize)
        ? pageSize
        : 10,
  };
}


function buildQuery(filters: Filters): string {

  const params = new URLSearchParams();

  params.set("page", String(filters.page));

  params.set("page_size", String(filters.pageSize));

  params.set("sort_by", filters.sortBy);

  params.set("sort_order", filters.sortOrder);

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.minMatch !== "") {
    params.set("min_match", filters.minMatch);
  }

  if (filters.maxMatch !== "") {
    params.set("max_match", filters.maxMatch);
  }

  if (filters.minTrust !== "") {
    params.set("min_trust", filters.minTrust);
  }

  if (filters.maxTrust !== "") {
    params.set("max_trust", filters.maxTrust);
  }

  return params.toString();
}


function toSavedViewFilters(filters: Filters) {

  return {

    search: filters.search,

    status: filters.status,

    min_match:
      filters.minMatch === ""
        ? null
        : Number(filters.minMatch),

    max_match:
      filters.maxMatch === ""
        ? null
        : Number(filters.maxMatch),

    min_trust:
      filters.minTrust === ""
        ? null
        : Number(filters.minTrust),

    max_trust:
      filters.maxTrust === ""
        ? null
        : Number(filters.maxTrust),

    sort_by: filters.sortBy,

    sort_order: filters.sortOrder,

    page: filters.page,

    page_size: filters.pageSize,

  };
}


function fromSavedViewFilters(
  saved: SavedView["filters"]
): Filters {

  const status = COLUMNS.some(
    (column) => column.id === saved.status
  )
    ? saved.status || ""
    : "";

  return {

    search: saved.search || "",

    status,

    minMatch:
      saved.min_match === null ||
      saved.min_match === undefined
        ? ""
        : String(saved.min_match),

    maxMatch:
      saved.max_match === null ||
      saved.max_match === undefined
        ? ""
        : String(saved.max_match),

    minTrust:
      saved.min_trust === null ||
      saved.min_trust === undefined
        ? ""
        : String(saved.min_trust),

    maxTrust:
      saved.max_trust === null ||
      saved.max_trust === undefined
        ? ""
        : String(saved.max_trust),

    sortBy: VALID_SORT_FIELDS.includes(
      saved.sort_by || ""
    )
      ? saved.sort_by!
      : DEFAULT_FILTERS.sortBy,

    sortOrder:
      saved.sort_order === "asc"
        ? "asc"
        : "desc",

    page:
      Number.isInteger(saved.page) &&
      Number(saved.page) > 0
        ? Number(saved.page)
        : 1,

    pageSize:
      [5, 10, 20, 50].includes(
        Number(saved.page_size)
      )
        ? Number(saved.page_size)
        : 10,
  };
}


function getApplicationFitScore(app: any): number {

  const report = app?.application || app;

  const analysis =
    report?.analysis || app?.analysis;

  const value =
    analysis?.fit_score ??
    analysis?.overall_score ??
    app?.fit_score;

  const score = Number(value);

  return Number.isFinite(score) ? score : 0;
}


function getCompanyTrustScore(app: any): number | null {

  const value =
    app?.company_trust_score ??
    app?.company_trust?.trust_score;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const score = Number(value);

  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100
  ) {
    return null;
  }

  return score;
}


export default function Applications() {

  const [applications, setApplications] = useState<any[]>([]);

  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
  });

  const [initialized, setInitialized] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [reloadKey, setReloadKey] = useState(0);

  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const [selectedViewId, setSelectedViewId] = useState("");

  const [viewBusy, setViewBusy] = useState(false);

  const [viewMessage, setViewMessage] = useState<string | null>(null);

  const [backfillBusy, setBackfillBusy] = useState(false);


  const validationError = useMemo(() => {

    const ranges = [
      {
        min: filters.minMatch,
        max: filters.maxMatch,
        label: "Resume match",
      },
      {
        min: filters.minTrust,
        max: filters.maxTrust,
        label: "Company trust",
      },
    ];

    for (const range of ranges) {

      const min = range.min === ""
        ? null
        : Number(range.min);

      const max = range.max === ""
        ? null
        : Number(range.max);

      if (
        min !== null &&
        (!Number.isFinite(min) || min < 0 || min > 100)
      ) {
        return `${range.label} minimum must be between 0 and 100.`;
      }

      if (
        max !== null &&
        (!Number.isFinite(max) || max < 0 || max > 100)
      ) {
        return `${range.label} maximum must be between 0 and 100.`;
      }

      if (
        min !== null &&
        max !== null &&
        min > max
      ) {
        return `${range.label} minimum cannot exceed maximum.`;
      }
    }

    return null;

  }, [
    filters.minMatch,
    filters.maxMatch,
    filters.minTrust,
    filters.maxTrust,
  ]);


  // ============================================================
  // INITIALIZE FILTERS FROM URL
  // ============================================================

  useEffect(() => {

    setFilters(
      readFiltersFromUrl()
    );

    setInitialized(true);

  }, []);


  // ============================================================
  // FETCH SERVER-SIDE FILTERED APPLICATIONS
  // ============================================================

  useEffect(() => {

    if (!initialized) return;

    const query = buildQuery(filters);

    const nextUrl =
      `${window.location.pathname}?${query}`;

    window.history.replaceState(
      null,
      "",
      nextUrl
    );


    if (validationError) {

      setApplications([]);

      setTotalCount(0);

      setTotalPages(0);

      setError(null);

      setLoading(false);

      return;
    }


    const controller = new AbortController();


    const timer = window.setTimeout(async () => {

      setLoading(true);

      setError(null);

      try {

        const data = await fetchAPI(
          `/applications/pipeline?${query}`,
          {
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        setApplications(
          data.applications || []
        );

        setTotalCount(
          Number(data.total_count || 0)
        );

        setTotalPages(
          Number(data.total_pages || 0)
        );


        const lastValidPage = Math.max(
          1,
          Number(data.total_pages || 0)
        );

        if (filters.page > lastValidPage) {

          setFilters((current) => ({
            ...current,
            page: lastValidPage,
          }));

        }

      } catch (err: any) {

        if (!controller.signal.aborted) {

          setError(
            err?.message || "Failed to load applications."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }

    }, 250);


    return () => {

      window.clearTimeout(timer);

      controller.abort();

    };

  }, [
    filters,
    initialized,
    reloadKey,
    validationError,
  ]);


  // ============================================================
  // LOAD SAVED VIEWS
  // ============================================================

  const refreshSavedViews = useCallback(async () => {

    const data = await fetchAPI(
      "/applications/views"
    );

    setSavedViews(
      data.views || []
    );

  }, []);


  useEffect(() => {

    if (!initialized) return;

    let active = true;

    refreshSavedViews().catch((err: any) => {

      if (active) {

        setViewMessage(
          err?.message || "Could not load saved views."
        );

      }

    });

    return () => {
      active = false;
    };

  }, [
    initialized,
    refreshSavedViews,
  ]);


  // ============================================================
  // FILTER UPDATE
  // Every filter change resets page to one.
  // ============================================================

  const updateFilter = <K extends keyof Omit<Filters, "page">>(
    key: K,
    value: Filters[K]
  ) => {

    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));

    setSelectedViewId("");

  };


  const clearFilters = () => {

    setFilters({
      ...DEFAULT_FILTERS,
    });

    setSelectedViewId("");

    setViewMessage(null);

  };


  // ============================================================
  // BACKFILL COMPANY TRUST SCORES FOR OLD APPLICATIONS
  // ============================================================

  const backfillMissingTrustScores = async () => {

    const confirmed = window.confirm(
      "Calculate missing company trust scores for your existing applications? This may take some time because companies without cached scores need to be analyzed."
    );

    if (!confirmed) return;

    setBackfillBusy(true);

    setViewMessage(null);

    try {

      const result = await fetchAPI(
        "/applications/trust/backfill",
        {
          method: "POST",
        }
      );

      const updated = Number(
        result.updated_applications || 0
      );

      const failed = Array.isArray(
        result.failed_jobs
      )
        ? result.failed_jobs.length
        : 0;

      setViewMessage(
        `${updated} application(s) updated. ` +
        (failed > 0
          ? `${failed} job(s) could not be analyzed. You can retry.`
          : "Company trust scores are ready.")
      );

      setReloadKey((current) => current + 1);

    } catch (err: any) {

      setViewMessage(
        err?.message || "Unable to calculate missing trust scores."
      );

    } finally {

      setBackfillBusy(false);

    }

  };


  // ============================================================
  // CREATE SAVED VIEW
  // ============================================================

  const saveCurrentView = async () => {

    const name = window.prompt(
      "Name this saved pipeline view:"
    );

    if (!name?.trim()) return;

    setViewBusy(true);

    setViewMessage(null);

    try {

      const data = await fetchAPI(
        "/applications/views",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            filters: toSavedViewFilters(filters),
          }),
        }
      );

      await refreshSavedViews();

      if (data.view?._id) {
        setSelectedViewId(data.view._id);
      }

      setViewMessage(
        "View saved successfully."
      );

    } catch (err: any) {

      setViewMessage(
        err?.message || "Could not save this view."
      );

    } finally {

      setViewBusy(false);

    }

  };


  // ============================================================
  // UPDATE SAVED VIEW
  // ============================================================

  const updateSelectedView = async () => {

    if (!selectedViewId) return;

    setViewBusy(true);

    setViewMessage(null);

    try {

      await fetchAPI(
        `/applications/views/${selectedViewId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            filters: toSavedViewFilters(filters),
          }),
        }
      );

      await refreshSavedViews();

      setViewMessage(
        "Saved view updated."
      );

    } catch (err: any) {

      setViewMessage(
        err?.message || "Could not update this view."
      );

    } finally {

      setViewBusy(false);

    }

  };


  // ============================================================
  // RENAME SAVED VIEW
  // ============================================================

  const renameSelectedView = async () => {

    const selected = savedViews.find(
      (view) => view._id === selectedViewId
    );

    if (!selected) return;

    const name = window.prompt(
      "Enter a new name:",
      selected.name
    );

    if (
      !name?.trim() ||
      name.trim() === selected.name
    ) return;

    setViewBusy(true);

    setViewMessage(null);

    try {

      await fetchAPI(
        `/applications/views/${selectedViewId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
          }),
        }
      );

      await refreshSavedViews();

      setViewMessage(
        "Saved view renamed."
      );

    } catch (err: any) {

      setViewMessage(
        err?.message || "Could not rename this view."
      );

    } finally {

      setViewBusy(false);

    }

  };


  // ============================================================
  // DELETE SAVED VIEW
  // ============================================================

  const deleteSelectedView = async () => {

    if (!selectedViewId) return;

    const selected = savedViews.find(
      (view) => view._id === selectedViewId
    );

    if (
      !window.confirm(
        `Delete the saved view "${selected?.name || "this view"}"?`
      )
    ) return;

    setViewBusy(true);

    setViewMessage(null);

    try {

      await fetchAPI(
        `/applications/views/${selectedViewId}`,
        {
          method: "DELETE",
        }
      );

      setSavedViews((current) =>
        current.filter(
          (view) => view._id !== selectedViewId
        )
      );

      setSelectedViewId("");

      setViewMessage(
        "Saved view deleted."
      );

    } catch (err: any) {

      setViewMessage(
        err?.message || "Could not delete this view."
      );

    } finally {

      setViewBusy(false);

    }

  };


  // ============================================================
  // DRAG AND DROP
  // Existing status API is preserved.
  // ============================================================

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    appId: string
  ) => {

    event.dataTransfer.setData(
      "applicationId",
      appId
    );

    event.dataTransfer.effectAllowed = "move";

  };


  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

  };


  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    newStatus: string
  ) => {

    event.preventDefault();

    const appId = event.dataTransfer.getData(
      "applicationId"
    );

    if (!appId) return;

    const previousApplications = [
      ...applications
    ];

    setApplications((current) =>
      current.map((app) =>
        app._id === appId || app.id === appId
          ? { ...app, status: newStatus }
          : app
      )
    );

    try {

      await fetchAPI(
        `/jobs/applications/${appId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      setReloadKey((current) => current + 1);

    } catch (err: any) {

      setApplications(
        previousApplications
      );

      alert(
        `Failed to update status: ${
          err?.message || "Please try again."
        }`
      );

    }

  };


  // ============================================================
  // PAGINATION DATA
  // ============================================================

  const pageCountForUi = Math.max(
    1,
    totalPages
  );

  const firstVisible = totalCount === 0
    ? 0
    : (filters.page - 1) * filters.pageSize + 1;

  const lastVisible = Math.min(
    filters.page * filters.pageSize,
    totalCount
  );

  const selectedView = savedViews.find(
    (view) => view._id === selectedViewId
  );


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="min-h-screen bg-slate-50 text-black">

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col">


        {/* HEADER */}

        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-5 mb-6 pt-4 shrink-0">

          <div>

            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900">
              Application Tracker
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Manage and organize your job application pipeline.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/analytics"
              className="bg-white border-2 border-indigo-100 text-indigo-700 px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all"
            >
              📊 View Analytics
            </Link>

            <Link
              href="/"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl hover:bg-indigo-700 transition-all"
            >
              &larr; Discover Jobs
            </Link>

          </div>

        </div>


        {/* FILTERS */}

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm mb-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">

            <div>

              <h2 className="font-extrabold text-slate-900 text-lg">
                Pipeline filters
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Filters are applied on the server and saved in the page URL.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                disabled={backfillBusy}
                onClick={backfillMissingTrustScores}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {backfillBusy
                  ? "Calculating trust scores..."
                  : "Calculate missing trust scores"
                }
              </button>

              <button
                onClick={clearFilters}
                className="text-sm font-bold text-indigo-700 hover:text-indigo-900 px-2"
              >
                Clear filters
              </button>

            </div>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

            {/* KEYWORD SEARCH */}

            <label className="sm:col-span-2">

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Search company, role or location
              </span>

              <input
                value={filters.search}
                maxLength={120}
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                placeholder="e.g. Software Engineer"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />

            </label>


            {/* APPLICATION STAGE */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Application stage
              </span>

              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >

                <option value="">
                  All stages
                </option>

                {COLUMNS.map((column) => (

                  <option
                    key={column.id}
                    value={column.id}
                  >
                    {column.title}
                  </option>

                ))}

              </select>

            </label>


            {/* MINIMUM MATCH */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Minimum match (%)
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={filters.minMatch}
                onChange={(event) =>
                  updateFilter("minMatch", event.target.value)
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

            </label>


            {/* MAXIMUM MATCH */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Maximum match (%)
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxMatch}
                onChange={(event) =>
                  updateFilter("maxMatch", event.target.value)
                }
                placeholder="100"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

            </label>


            {/* MINIMUM TRUST */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Minimum company trust (%)
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={filters.minTrust}
                onChange={(event) =>
                  updateFilter("minTrust", event.target.value)
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

            </label>


            {/* MAXIMUM TRUST */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Maximum company trust (%)
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxTrust}
                onChange={(event) =>
                  updateFilter("maxTrust", event.target.value)
                }
                placeholder="100"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />

            </label>


            {/* SORT FIELD */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Sort by
              </span>

              <select
                value={filters.sortBy}
                onChange={(event) =>
                  updateFilter("sortBy", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >

                <option value="updated_at">
                  Recently updated
                </option>

                <option value="created_at">
                  Date added
                </option>

                <option value="fit_score">
                  Resume match score
                </option>

                <option value="company_trust_score">
                  Company trust score
                </option>

                <option value="company">
                  Company
                </option>

                <option value="title">
                  Job title
                </option>

              </select>

            </label>


            {/* SORT ORDER */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Sort order
              </span>

              <select
                value={filters.sortOrder}
                onChange={(event) =>
                  updateFilter(
                    "sortOrder",
                    event.target.value as "asc" | "desc"
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >

                <option value="desc">
                  Descending
                </option>

                <option value="asc">
                  Ascending
                </option>

              </select>

            </label>


            {/* PAGE SIZE */}

            <label>

              <span className="block text-xs font-bold text-slate-600 mb-1.5">
                Applications per page
              </span>

              <select
                value={filters.pageSize}
                onChange={(event) =>
                  updateFilter(
                    "pageSize",
                    Number(event.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >

                {[5, 10, 20, 50].map((size) => (

                  <option key={size} value={size}>
                    {size}
                  </option>

                ))}

              </select>

            </label>


            {/* TOTAL COUNT */}

            <div className="flex items-end">

              <div className="w-full rounded-xl bg-indigo-50 px-3 py-2.5 text-sm text-indigo-800 font-semibold">

                {totalCount} matching application
                {totalCount === 1 ? "" : "s"}

              </div>

            </div>

          </div>


          {validationError && (

            <p
              className="mt-3 text-sm font-semibold text-red-600"
              role="alert"
            >
              {validationError}
            </p>

          )}


          <p className="mt-3 text-xs text-slate-400">
            Trust filters use the company's saved trust score. Applications without a score are excluded when a trust range is selected. Use the calculate button above to fill missing scores.
          </p>

        </section>


        {/* SAVED VIEWS */}

        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm mb-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

            <div>

              <h2 className="font-extrabold text-slate-900">
                Saved pipeline views
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Save your search, stage, match range, trust range, sorting and page size.
              </p>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                disabled={viewBusy}
                onClick={saveCurrentView}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Save current view
              </button>

              <button
                disabled={!selectedViewId || viewBusy}
                onClick={updateSelectedView}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Update
              </button>

              <button
                disabled={!selectedViewId || viewBusy}
                onClick={renameSelectedView}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Rename
              </button>

              <button
                disabled={!selectedViewId || viewBusy}
                onClick={deleteSelectedView}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                Delete
              </button>

            </div>

          </div>


          <div className="mt-3 max-w-xl">

            <select
              value={selectedViewId}
              onChange={(event) => {

                const id = event.target.value;

                setSelectedViewId(id);

                const view = savedViews.find(
                  (item) => item._id === id
                );

                if (view) {

                  setFilters(
                    fromSavedViewFilters(view.filters)
                  );

                }

              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >

              <option value="">
                Choose a saved view
              </option>

              {savedViews.map((view) => (

                <option
                  key={view._id}
                  value={view._id}
                >
                  {view.name}
                </option>

              ))}

            </select>


            {selectedView && (

              <p className="mt-1 text-xs text-slate-500">
                Selected: {selectedView.name}.
              </p>

            )}


            {viewMessage && (

              <p
                className="mt-2 text-xs font-semibold text-indigo-700"
                role="status"
              >
                {viewMessage}
              </p>

            )}

          </div>

        </section>


        {/* PAGINATION HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <p className="text-sm font-semibold text-slate-600">

            {loading
              ? "Updating results…"
              : `Showing ${firstVisible}–${lastVisible} of ${totalCount} applications`
            }

          </p>


          <div className="flex items-center gap-2">

            <button
              disabled={
                loading ||
                filters.page <= 1 ||
                Boolean(validationError)
              }
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  page: Math.max(1, current.page - 1),
                }))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>


            <span className="text-sm font-semibold text-slate-600">
              Page {filters.page} of {pageCountForUi}
            </span>


            <button
              disabled={
                loading ||
                filters.page >= pageCountForUi ||
                Boolean(validationError)
              }
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </div>

        )}


        {/* EMPTY RESULTS */}

        {!error &&
          !loading &&
          totalCount === 0 &&
          !validationError && (

            <div className="mb-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">

              <h3 className="font-bold text-slate-800">
                No matching applications
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters, or clear all filters to see your pipeline.
              </p>

              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Clear filters
              </button>

            </div>

          )}


        {/* KANBAN BOARD */}

        <div
          className={`flex gap-6 overflow-x-auto pb-8 items-start snap-x custom-scrollbar ${
            loading ? "opacity-60" : ""
          }`}
        >

          {COLUMNS.map((column) => {

            const columnJobs = applications.filter(
              (app) => (app.status || "saved") === column.id
            );


            return (

              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(event) =>
                  handleDrop(event, column.id)
                }
                className={`flex flex-col rounded-3xl w-[320px] min-w-[320px] min-h-[300px] h-[65vh] max-h-[760px] border border-white shadow-xl snap-center transition-colors duration-300 ${column.bodyColor} backdrop-blur-xl`}
              >

                {/* COLUMN HEADER */}

                <div
                  className={`px-6 py-4 rounded-t-3xl font-black tracking-wide flex justify-between items-center shadow-sm ${column.headerColor}`}
                >

                  <span className="uppercase text-sm tracking-widest">
                    {column.title}
                  </span>

                  <span
                    title="Applications shown on this page"
                    className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md"
                  >
                    {columnJobs.length}
                  </span>

                </div>


                {/* APPLICATION CARDS */}

                <div className="p-4 overflow-y-auto flex-1 space-y-4">

                  {columnJobs.map((app) => {

                    const appId = app._id || app.id;

                    const report = app.application || app;

                    const analysis =
                      report?.analysis || app?.analysis;

                    const jobTitle =
                      app.job?.title ||
                      analysis?.job_title ||
                      "Saved Job";

                    const companyName =
                      app.job?.company ||
                      analysis?.company ||
                      "Company";

                    const fitScore =
                      getApplicationFitScore(app);

                    const trustScore =
                      getCompanyTrustScore(app);


                    return (

                      <div
                        key={appId}
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(
                            event,
                            String(appId)
                          )
                        }
                        className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300"
                      >

                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-indigo-600 transition-colors">
                          {jobTitle}
                        </h3>

                        <p className="text-sm font-semibold text-slate-500 mb-4 truncate">
                          {companyName}
                        </p>


                        <div className="flex flex-wrap gap-2 mt-2 border-t pt-4">

                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-xs border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                            Fit: {fitScore}%
                          </span>

                          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-xs border border-emerald-100">
                            Trust: {
                              trustScore === null
                                ? "Not checked"
                                : `${trustScore}%`
                            }
                          </span>

                          <Link
                            href={`/applications/${appId}`}
                            className="ml-auto text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                          >
                            Details &rarr;
                          </Link>

                        </div>

                      </div>

                    );

                  })}


                  {/* EMPTY COLUMN */}

                  {columnJobs.length === 0 && (

                    <div className="text-center p-8 border-2 border-dashed border-slate-300/50 rounded-2xl text-slate-400 font-medium text-sm">

                      {totalCount === 0
                        ? "No matching applications"
                        : `No ${column.title.toLowerCase()} applications on this page`
                      }

                    </div>

                  )}

                </div>

              </div>

            );

          })}

        </div>


        {/* PAGINATION FOOTER */}

        <div className="flex justify-end items-center gap-2 pb-6">

          <button
            disabled={
              loading ||
              filters.page <= 1 ||
              Boolean(validationError)
            }
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: Math.max(1, current.page - 1),
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm font-semibold text-slate-600">
            Page {filters.page} of {pageCountForUi}
          </span>

          <button
            disabled={
              loading ||
              filters.page >= pageCountForUi ||
              Boolean(validationError)
            }
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: current.page + 1,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>

  );
}