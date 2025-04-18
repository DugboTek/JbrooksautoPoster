export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <header className="bg-white shadow animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto py-8 px-4 sm:px-6">
        {/* Developer Controls Placeholder */}
        <div className="mb-6 bg-gray-100 p-4 rounded-lg animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="flex space-x-8">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Post Generator Placeholder */}
          <section className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded mb-6"></div>
              <div className="flex flex-wrap gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-24"></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </section>

          {/* Posts Section Placeholder */}
          <section>
            {/* Tab Navigation Placeholder */}
            <div className="bg-white rounded-lg shadow mb-6 animate-pulse">
              <div className="flex border-b">
                <div className="flex-1 py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                </div>
                <div className="flex-1 py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Create Button Placeholder */}
            <div className="mb-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
            </div>

            {/* Posts Placeholder */}
            <div className="space-y-6 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-5 bg-gray-200 rounded w-40"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
