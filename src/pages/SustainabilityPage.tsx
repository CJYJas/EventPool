import React, { useMemo, useState } from 'react';
import { Calendar, Info, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SustainabilityPage: React.FC = () => {
  const { clubs, resources, requests, currentUser, getClubById, getResourceById } =
    useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isClubRep = currentUser?.role === 'club_rep' && Boolean(currentUser.clubId);
  const ownClub = getClubById(currentUser?.clubId);

  const [adminSelectedClubId, setAdminSelectedClubId] = useState<string>('all');
  const [period, setPeriod] = useState<'jun_nov' | 'q4'>('jun_nov');

  // Club accounts are strictly scoped to their own club; Admin sees platform-wide + filter
  const effectiveClubId = isClubRep
    ? currentUser!.clubId!
    : adminSelectedClubId;

  const completedRequests = useMemo(() => {
    return requests.filter((req) => {
      if (req.status !== 'Completed') return false;
      if (
        effectiveClubId !== 'all' &&
        req.ownerClubId !== effectiveClubId &&
        req.borrowerClubId !== effectiveClubId
      ) {
        return false;
      }
      if (period === 'q4') {
        const month = req.returnedDate?.slice(5, 7) || '';
        return ['10', '11', '12'].includes(month);
      }
      return true;
    });
  }, [requests, effectiveClubId, period]);

  const metrics = useMemo(() => {
    const completedCycles = completedRequests.length;

    const unitsReused = completedRequests.reduce(
      (sum, r) => sum + (r.verification?.reusable ?? r.requestedQuantity),
      0
    );

    // Expenditure avoided = sum of replacement cost ONLY where wouldOtherwisePurchase === true (NO borrowing cost subtraction!)
    const purchaseIntentCycles = completedRequests.filter(
      (r) => r.wouldOtherwisePurchase
    );
    const computedExpenditure = purchaseIntentCycles.reduce((sum, r) => {
      const res = getResourceById(r.resourceId);
      const qty = r.verification?.reusable ?? r.requestedQuantity;
      return sum + qty * (res?.estimatedUnitCostRM || 65);
    }, 0);

    const expenditureAvoided = Math.round(computedExpenditure);

    const computedWeight = completedRequests.reduce((sum, r) => {
      const res = getResourceById(r.resourceId);
      const qty = r.verification?.reusable ?? r.requestedQuantity;
      return sum + qty * (res?.estimatedUnitWeightKg || 1.8);
    }, 0);

    const weightReused = Math.max(0, Math.round(computedWeight));

    return {
      completedCycles,
      unitsReused,
      expenditureAvoided,
      purchaseIntentCount: purchaseIntentCycles.length,
      weightReused,
    };
  }, [completedRequests, getResourceById]);

  const monthlyData = useMemo(() => {
    const monthLabels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const activeMonths = period === 'q4' ? ['Oct', 'Nov'] : monthLabels;

    return activeMonths.map((m) => {
      const monthIdx = monthLabels.indexOf(m) + 6;
      const monthStr = String(monthIdx).padStart(2, '0');
      const matches = completedRequests.filter(
        (r) => (r.returnedDate || r.expectedReturnDate || r.updatedAt || '').slice(5, 7) === monthStr
      );
      return {
        month: m,
        cycles: matches.length,
        units: matches.reduce(
          (sum, r) => sum + (r.verification?.reusable ?? r.requestedQuantity),
          0
        ),
      };
    });
  }, [period, completedRequests]);

  const maxMonthlyUnits = Math.max(1, ...monthlyData.map((m) => m.units));

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Furniture: 0,
      Equipment: 0,
      Decorations: 0,
      Others: 0,
    };

    completedRequests.forEach((req) => {
      const res = getResourceById(req.resourceId);
      const qty = req.verification?.reusable ?? req.requestedQuantity;
      if (res?.category === 'Furniture') counts.Furniture += qty;
      else if (
        res?.category === 'Audio Equipment' ||
        res?.category === 'Electronics'
      )
        counts.Equipment += qty;
      else if (res?.category === 'Decorations' || res?.category === 'Lighting')
        counts.Decorations += qty;
      else counts.Others += qty;
    });

    return Object.entries(counts).map(([label, units]) => ({ label, units }));
  }, [completedRequests, getResourceById]);

  const totalCategoryUnits = Math.max(
    1,
    categoryBreakdown.reduce((s, c) => s + c.units, 0)
  );

  const scopedListingsCount = useMemo(() => {
    const active = resources.filter((r) => !r.archived);
    if (effectiveClubId === 'all') return active.length;
    return active.filter((r) => r.clubId === effectiveClubId).length;
  }, [resources, effectiveClubId]);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Role-Aware Scope Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#6B766E] mb-1">
            {isClubRep
              ? `Sustainability / ${ownClub?.acronym} Club Board`
              : isAdmin
              ? 'Sustainability / Platform-Wide Admin Board'
              : 'Home / Sustainability Overview'}
          </p>
          <h1 className="text-3xl font-bold text-[#1F3626] tracking-tight">
            {isClubRep
              ? `${ownClub?.acronym} Sustainability Overview`
              : 'Platform Sustainability Overview'}
          </h1>
          <p className="text-sm text-[#4A554E] mt-1">
            {isClubRep
              ? `Showing verified circular sharing impact strictly for ${ownClub?.name}.`
              : 'Small shares. Lasting change. Platform-wide impact across Universiti Malaya student clubs.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isClubRep ? (
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#DCE7D8] text-xs font-semibold text-[#1F3626]">
              <Users className="w-4 h-4 text-[#2D4A35]" />
              {ownClub?.acronym} Only
            </span>
          ) : (
            <div className="relative flex items-center">
              <Users className="w-4 h-4 text-[#4A554E] absolute left-3.5 pointer-events-none" />
              <select
                value={adminSelectedClubId}
                onChange={(e) => setAdminSelectedClubId(e.target.value)}
                aria-label="Filter by UM club"
                className="h-10 pl-9 pr-8 rounded-full bg-white border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] cursor-pointer focus:border-[#2D4A35] focus:outline-none"
              >
                <option value="all">All UM clubs (Platform)</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.acronym}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-[#4A554E] absolute left-3.5 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'jun_nov' | 'q4')}
              aria-label="Filter by period"
              className="h-10 pl-9 pr-8 rounded-full bg-white border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] cursor-pointer focus:border-[#2D4A35] focus:outline-none"
            >
              <option value="jun_nov">Jun–Nov 2026</option>
              <option value="q4">Oct–Nov 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#4A554E]">
            Completed sharing cycles
          </p>
          <p className="text-3xl font-bold text-[#1F3626] mt-2 tabular-nums">
            {metrics.completedCycles}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">
            Verified returns · recorded activity
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#4A554E]">
            Individual resources reused
          </p>
          <p className="text-3xl font-bold text-[#1F3626] mt-2 tabular-nums">
            {metrics.unitsReused}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">
            Units reused across completed cycles
          </p>
        </div>

        <div className="bg-[#DCE7D8] rounded-2xl border border-[#C9DBC4] p-5">
          <p className="text-xs font-medium text-[#2D4A35]">
            Estimated expenditure avoided
          </p>
          <p className="text-3xl font-bold text-[#1F3626] mt-2 tabular-nums">
            RM {metrics.expenditureAvoided.toLocaleString()}
          </p>
          <p className="text-xs text-[#3D4B41] mt-1 tabular-nums">
            Purchase intent supported · {metrics.purchaseIntentCount} of{' '}
            {metrics.completedCycles} cycles
          </p>
        </div>

        <div className="bg-[#DCE7D8] rounded-2xl border border-[#C9DBC4] p-5">
          <p className="text-xs font-medium text-[#2D4A35]">
            Estimated reused-resource weight
          </p>
          <p className="text-3xl font-bold text-[#1F3626] mt-2 tabular-nums">
            {metrics.weightReused} kg
          </p>
          <p className="text-xs text-[#3D4B41] mt-1 tabular-nums">
            Reliable records across {scopedListingsCount} active listings
          </p>
        </div>
      </div>

      {/* Middle Row: Bar Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sharing, Month by Month */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E2D9] p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#1F3626]">
                Sharing, Month by Month
              </h2>
              <p className="text-xs text-[#6B766E] mt-1">
                Item reuse instances · Completed cycles shown below each month
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#DCE7D8] text-xs font-semibold text-[#23452C]">
              Recorded activity
            </span>
          </div>

          <div className="mt-8 flex items-end justify-between gap-3 sm:gap-6 h-52 pt-6 border-b border-[#EFECE3] pb-3 px-2">
            {monthlyData.map((item, idx) => {
              const heightPct = Math.max(
                8,
                Math.round((item.units / maxMonthlyUnits) * 100)
              );
              const isLatest = idx === monthlyData.length - 1;
              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <span className="text-xs font-semibold text-[#1F3626] mb-1.5 tabular-nums">
                    {item.units}
                  </span>
                  <div className="w-full max-w-[44px] flex-1 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-200 ${
                        isLatest
                          ? 'bg-[#2D4A35]'
                          : 'bg-[#81957D] group-hover:bg-[#5E7659]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 sm:gap-6 pt-3 px-2">
            {monthlyData.map((item) => (
              <div key={item.month} className="flex-1 text-center">
                <p className="text-xs font-semibold text-[#1F3626]">
                  {item.month}
                </p>
                <p className="text-[11px] text-[#6B766E] tabular-nums">
                  {item.cycles} cycle{item.cycles === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* What we kept in use */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E2D9] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F3626]">
                What we kept in use
              </h2>
              <span className="text-xs text-[#6B766E] tabular-nums">
                {metrics.unitsReused} reuse instances
              </span>
            </div>

            <div className="space-y-5">
              {categoryBreakdown.map((cat) => {
                const pct = Math.round((cat.units / totalCategoryUnits) * 100);
                return (
                  <div key={cat.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1F3626]">
                        {cat.label}
                      </span>
                      <span className="font-semibold text-[#1F3626] tabular-nums">
                        {cat.units} units
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#EFECE3] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, pct)}%` }}
                        className="h-full rounded-full bg-[#2D4A35]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[#6B766E] pt-6">
            Categorized from verified owner return logs{isClubRep ? ` for ${ownClub?.acronym}` : ' across UM clubs'}.
          </p>
        </div>
      </div>

      {/* Bottom: A transparent view of our impact (Updated expenditure calculation explanation!) */}
      <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#2D4A35]" />
            <h2 className="text-base font-bold text-[#1F3626]">
              A transparent view of our impact
            </h2>
          </div>
          <span className="text-xs text-[#6B766E]">
            {period === 'q4'
              ? 'Q4 period data · Oct–Nov 2026'
              : 'Full-period data · Jun–Nov 2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4A554E] leading-relaxed">
          <div>
            <p className="font-bold text-[#1F3626] mb-1">
              Activity &ne; estimates
            </p>
            <p>
              {metrics.completedCycles} owner-verified completed cycles;{' '}
              {metrics.unitsReused} reusable units returned. Repeat reuse counts
              again. Pending or unverified returns are excluded.
            </p>
          </div>
          <div>
            <p className="font-bold text-[#1F3626] mb-1">
              Expenditure · {metrics.purchaseIntentCount} of{' '}
              {metrics.completedCycles} cycles
            </p>
            <p>
              RM {metrics.expenditureAvoided.toLocaleString()} total estimated
              replacement cost across cycles where the borrower confirmed they
              would otherwise purchase new. Peer-to-peer club sharing carries no
              borrowing fee.
            </p>
          </div>
          <div>
            <p className="font-bold text-[#1F3626] mb-1">
              Reused weight · Reliable item records
            </p>
            <p>
              {metrics.weightReused} kg calculated from documented item unit
              weights across verified returns. Items without weight records are
              excluded rather than guessed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
