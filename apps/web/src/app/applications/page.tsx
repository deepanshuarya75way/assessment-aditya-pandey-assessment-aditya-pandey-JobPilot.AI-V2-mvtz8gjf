"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";

const COLUMNS = [
  { id: "saved", title: "Saved", headerColor: "bg-slate-800 text-white", bodyColor: "bg-slate-100/50" },
  { id: "applied", title: "Applied", headerColor: "bg-blue-600 text-white", bodyColor: "bg-blue-50/50" },
  { id: "assessment", title: "Assessment", headerColor: "bg-yellow-500 text-white", bodyColor: "bg-yellow-50/50" },
  { id: "interview", title: "Interview", headerColor: "bg-purple-600 text-white", bodyColor: "bg-purple-50/50" },
  { id: "offer", title: "Offer", headerColor: "bg-emerald-600 text-white", bodyColor: "bg-emerald-50/50" },
  { id: "rejected", title: "Rejected", headerColor: "bg-red-500 text-white", bodyColor: "bg-red-50/50" },
] as const;


const DEFAULT_FILTERS = {
  search: "",
  status: "",
  minMatch: "",
  maxMatch: "",
  sortBy: "updated_at",
  sortOrder: "desc" as "asc" | "desc",
  page: 1,
  pageSize: 10,
};


type Filters = typeof DEFAULT_FILTERS;


type SavedView = {
  _id: string;
  name: string;

  filters: {
    search?: string;
    status?: string;
    min_match?: number | string | null;
    max_match?: number | string | null;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    page?: number;
    page_size?: number;
  };
};


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

  const minMatch = params.get("min_match") || "";

  const maxMatch = params.get("max_match") || "";

  const validStatuses = COLUMNS.map(
    (column) => column.id
  );

  const validSortFields = [
    "updated_at",
    "created_at",
    "fit_score",
    "company",
    "title",
  ];

  return {

    search: (
      params.get("search") || ""
    ).slice(0, 120),

    status: validStatuses.includes(
      params.get("status") as any
    )
      ? params.get("status")!
      : "",

    minMatch:
      minMatch !== "" &&
      Number(minMatch) >= 0 &&
      Number(minMatch) <= 100
        ? minMatch
        : "",

    maxMatch:
      maxMatch !== "" &&
      Number(maxMatch) >= 0 &&
      Number(maxMatch) <= 100
        ? maxMatch
        : "",

    sortBy: validSortFields.includes(
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

  const validSortFields = [
    "updated_at",
    "created_at",
    "fit_score",
    "company",
    "title",
  ];

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

    sortBy: validSortFields.includes(
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


export default function Applications() {

  const [applications, setApplications] = useState<any[]>([]);

  const [filters, setFilters] = useState<Filters>(
    DEFAULT_FILTERS
  );

  const [initialized, setInitialized] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [reloadKey, setReloadKey] = useState(0);


  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const [selectedViewId, setSelectedViewId] = useState("");

  const [viewBusy, setViewBusy] = useState(false);

  const [viewMessage, setViewMessage] = useState<string | null>(
    null
  );


  const minMatchNumber =
    filters.minMatch === ""
      ? null
      : Number(filters.minMatch);

  const maxMatchNumber =
    filters.maxMatch === ""
      ? null
      : Number(filters.maxMatch);


  const validationError = useMemo(() => {

    if (
      filters.minMatch !== "" &&
      (
        !Number.isFinite(minMatchNumber) ||
        minMatchNumber! < 0 ||
        minMatchNumber! > 100
      )
    ) {
      return "Minimum match score must be between 0 and 100.";
    }

    if (
      filters.maxMatch !== "" &&
      (
        !Number.isFinite(maxMatchNumber) ||
        maxMatchNumber! < 0 ||
        maxMatchNumber! > 100
      )
    ) {
      return "Maximum match score must be between 0 and 100.";
    }

    if (
      minMatchNumber !== null &&
      maxMatchNumber !== null &&
      minMatchNumber > maxMatchNumber
    ) {
      return "Minimum match score cannot exceed maximum match score.";
    }

    return null;

  }, [
    filters.minMatch,
    filters.maxMatch,
    minMatchNumber,
    maxMatchNumber,
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

    // Keep filter state in the browser URL.
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


        // Correct an old bookmarked page if records
        // have since been removed or changed.
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

  const updateFilter = <K extends Exclude<keyof Filters, "page">>(
    key: K,
    value: Filters[K]
  ) => {

    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));

  };


  const clearFilters = () => {

    setFilters({
      ...DEFAULT_FILTERS,
    });

    setSelectedViewId("");

    setViewMessage(null);

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

    // Optimistic UI update.
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

      // Reload the current filtered page after a successful update.
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

            <button
              onClick={clearFilters}
              className="text-sm font-bold text-indigo-700 hover:text-indigo-900 self-start lg:self-auto"
            >
              Clear filters
            </button>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">

            {/* KEYWORD SEARCH */}

            <label className="sm:col-span-2 xl:col-span-2">

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

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">

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
            Salary and company trust filters are not shown because those values are not currently stored with tracked applications.
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
                Save your search, stage, match range, sorting and page size.
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
                Selected: {selectedView.name}. Choose another view to switch pipelines.
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


        {/* EXISTING KANBAN BOARD */}

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
                      report.analysis || app.analysis;

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


                        <div className="flex justify-between items-center mt-2 border-t pt-4 gap-2">

                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-xs border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                            Fit: {fitScore}%
                          </span>

                          <Link
                            href={`/applications/${appId}`}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
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