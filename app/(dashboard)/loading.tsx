export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="space-y-4">
        <div className="ui-skeleton h-3 w-28" />
        <div className="ui-skeleton h-10 w-56" />
        <div className="ui-skeleton h-6 max-w-2xl" />
      </div>

      <div className="ui-surface-primary p-7">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="ui-skeleton h-3 w-24" />
              <div className="ui-skeleton h-10 w-72" />
              <div className="ui-skeleton h-5 w-[32rem] max-w-full" />
            </div>
            <div className="ui-skeleton h-8 w-24 rounded-full" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="ui-surface-secondary p-5">
              <div className="space-y-3">
                <div className="ui-skeleton h-3 w-28" />
                <div className="ui-skeleton h-7 w-4/5" />
                <div className="ui-skeleton h-5 w-full" />
                <div className="ui-skeleton h-5 w-3/4" />
              </div>
            </div>
            <div className="ui-surface-secondary p-5">
              <div className="space-y-3">
                <div className="ui-skeleton h-3 w-24" />
                <div className="ui-skeleton h-10 w-20" />
                <div className="ui-skeleton h-2 w-full" />
                <div className="ui-skeleton h-5 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="ui-surface-primary p-6">
            <div className="space-y-4">
              <div className="ui-skeleton h-3 w-28" />
              <div className="ui-skeleton h-7 w-40" />
              <div className="space-y-3">
                <div className="ui-skeleton h-20 w-full" />
                <div className="ui-skeleton h-20 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
