export default function PlaceCardSkeleton() {
  return (
    <div className="bg-white">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* 카테고리 아이콘 */}
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 animate-pulse" />
          {/* 텍스트 */}
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-48 rounded-full bg-gray-100 animate-pulse" />
          </div>
          {/* 버튼 */}
          <div className="h-7 w-16 flex-shrink-0 rounded-full bg-gray-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
