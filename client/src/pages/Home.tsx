import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Star, Clock, Search, Calendar, Navigation, MessageSquare, User, Heart, Menu, Filter, X } from "lucide-react";

const DISTRICTS = ["全部區域", "中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區"];

export default function Home() {
  const { user } = useAuth();

  // 從後端取得所有店家資料
  const { data: storesData, isLoading } = trpc.stores.list.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("全部區域");
  const [minRating, setMinRating] = useState([0]);
  const [timeFilterMode, setTimeFilterMode] = useState<"now" | "custom">("now");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [selectedMenuStoreId, setSelectedMenuStoreId] = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // 取得選中店家的評論
  const { data: selectedStoreReviews } = trpc.reviews.byStoreId.useQuery(
    { storeId: selectedStoreId!, limit: 3 },
    { enabled: !!selectedStoreId }
  );

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSelectedDistrict("附近");
        },
        (error) => {
          console.error("定位失敗:", error);
          alert("無法取得您的位置，請確認已開啟定位權限");
        }
      );
    } else {
      alert("您的瀏覽器不支援定位功能");
    }
  };

  // 檢查店家是否在指定時間營業
  const isStoreOpenAtTime = (openingHours: string[] | null, dateStr: string, timeStr: string) => {
    if (!openingHours || openingHours.length === 0) return true;

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ...
    
    const daySchedule = openingHours[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
    
    if (!daySchedule || daySchedule.includes("休息") || daySchedule.includes("Closed")) {
      return false;
    }

    const timeMatch = daySchedule.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
    if (!timeMatch) return true;

    const [_, openHour, openMin, closeHour, closeMin] = timeMatch;
    const openTime = parseInt(openHour) * 60 + parseInt(openMin);
    const closeTime = parseInt(closeHour) * 60 + parseInt(closeMin);
    const currentTime = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);

    return currentTime >= openTime && currentTime <= closeTime;
  };

  // 篩選店家
  const filteredStores = useMemo(() => {
    if (!storesData) return [];

    return storesData.filter(store => {
      // 搜尋篩選
      if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 區域篩選
      if (selectedDistrict !== "全部區域" && selectedDistrict !== "附近") {
        if (store.district !== selectedDistrict) return false;
      }

      // 評分篩選
      const rating = store.rating || 0;
      if (rating < minRating[0]) return false;

      // 營業時間篩選
      if (timeFilterMode === "custom" && selectedDate && selectedTime) {
        if (!isStoreOpenAtTime(store.openingHours, selectedDate, selectedTime)) {
          return false;
        }
      }

      return true;
    });
  }, [storesData, searchTerm, selectedDistrict, minRating, timeFilterMode, selectedDate, selectedTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* 動態背景裝飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative border-b-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z" fill="currentColor" opacity="0.3"/>
                <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                <path d="M8 14c0 2 1.5 4 4 5 2.5-1 4-3 4-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                台南牛肉湯選擇器
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                尋找最適合你的那碗溫暖 🍜
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowDonateDialog(true)}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
          >
            <Heart className="w-4 h-4 mr-2 animate-pulse" />
            請我喝杯珍奶
          </Button>
        </div>
      </header>

      {/* 手機版篩選按鈕 */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setShowMobileFilter(true)}
          className="rounded-full w-14 h-14 bg-gradient-to-br from-primary to-accent shadow-2xl hover:scale-110 transition-transform"
        >
          <Filter className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* 主要內容區 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側篩選區 - 桌面版 */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="sticky top-6 border-2 border-border shadow-xl bg-card/95 backdrop-blur">
              <CardContent className="p-6 space-y-6">
                <FilterContent
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  timeFilterMode={timeFilterMode}
                  setTimeFilterMode={setTimeFilterMode}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                  getUserLocation={getUserLocation}
                  filteredCount={filteredStores.length}
                />
              </CardContent>
            </Card>
          </aside>

          {/* 中間店家列表 */}
          <main className="lg:col-span-6 space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              找到 <span className="font-bold text-primary">{filteredStores.length}</span> 間店家
            </div>

            {filteredStores.length === 0 ? (
              <Card className="border-2 border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">沒有符合條件的店家，請調整篩選條件</p>
              </Card>
            ) : (
              filteredStores.map((store: any) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  isSelected={selectedStoreId === store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                  onMenuClick={() => {
                    setSelectedMenuStoreId(store.id);
                    setShowMenuDialog(true);
                  }}
                />
              ))
            )}
          </main>

          {/* 右側地圖區 */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="sticky top-6 border-2 border-border shadow-xl bg-card/95 backdrop-blur overflow-hidden h-[calc(100vh-8rem)]">
              <CardContent className="p-0 h-full">
                {selectedStoreId && storesData ? (
                  <MapView store={storesData.find((s: any) => s.id === selectedStoreId)!} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">點選左側店家</p>
                    <p className="text-sm text-muted-foreground/70">在地圖上顯示位置</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* 手機版篩選側邊欄 */}
      {showMobileFilter && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-left">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">篩選條件</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowMobileFilter(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <FilterContent
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={setSelectedDistrict}
                minRating={minRating}
                setMinRating={setMinRating}
                timeFilterMode={timeFilterMode}
                setTimeFilterMode={setTimeFilterMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                getUserLocation={getUserLocation}
                filteredCount={filteredStores.length}
              />
              <Button
                onClick={() => setShowMobileFilter(false)}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                查看 {filteredStores.length} 間店家
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 贊助對話框 */}
      <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
        <DialogContent className="sm:max-w-md border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">喜歡這個選擇器嗎？</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="text-6xl mb-4">🍜</div>
              <p className="text-muted-foreground">請我喝杯珍奶，讓我繼續維護更新</p>
              <p className="text-sm text-muted-foreground/70">您的每一份支持都是我持續優化的動力！</p>
            </div>
            <div className="flex justify-center">
              <a
                href="https://hiyewei.bobaboba.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Heart className="w-5 h-5 mr-2" />
                前往贊助頁面
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 菜單對話框 */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="sm:max-w-2xl border-2 border-primary/20 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedMenuStoreId && storesData?.find((s: any) => s.id === selectedMenuStoreId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                ⚠️ 菜單資訊僅供參考，實際價格和品項請以店家現場為準
              </p>
            </div>
            <div className="text-center text-muted-foreground">
              <p>菜單資料整理中...</p>
              <p className="text-sm mt-2">建議直接前往店家或查看 Google Maps 評論了解詳情</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 篩選內容組件
function FilterContent({
  searchTerm, setSearchTerm,
  selectedDistrict, setSelectedDistrict,
  minRating, setMinRating,
  timeFilterMode, setTimeFilterMode,
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  getUserLocation,
  filteredCount
}: any) {
  return (
    <>
      {/* 搜尋店名 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Search className="w-4 h-4 text-primary" />
          搜尋店名
        </Label>
        <Input
          placeholder="輸入店名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-2 focus:border-primary"
        />
      </div>

      {/* 選擇區域 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          選擇區域
        </Label>
        <Button
          onClick={getUserLocation}
          variant="outline"
          className="w-full mb-2 border-2 border-accent hover:bg-accent/10"
        >
          <Navigation className="w-4 h-4 mr-2" />
          使用我的位置
        </Button>
        <div className="grid grid-cols-3 gap-2">
          {DISTRICTS.map((district) => (
            <Button
              key={district}
              variant={selectedDistrict === district ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDistrict(district)}
              className={selectedDistrict === district ? "bg-primary" : "border-2"}
            >
              {district}
            </Button>
          ))}
        </div>
      </div>

      {/* 評價篩選 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Star className="w-4 h-4 text-primary fill-primary" />
          評價篩選
        </Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">最低評分</span>
            <span className="font-bold text-primary">{minRating[0].toFixed(1)} ★</span>
          </div>
          <Slider
            value={minRating}
            onValueChange={setMinRating}
            min={0}
            max={5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0★</span>
            <span>5★</span>
          </div>
        </div>
      </div>

      {/* 營業狀況篩選 */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-primary" />
          營業狀況篩選
        </Label>
        <div className="space-y-2">
          <Button
            variant={timeFilterMode === "now" ? "default" : "outline"}
            onClick={() => setTimeFilterMode("now")}
            className="w-full border-2"
          >
            <Clock className="w-4 h-4 mr-2" />
            顯示全部
          </Button>
          <Button
            variant={timeFilterMode === "custom" ? "default" : "outline"}
            onClick={() => setTimeFilterMode("custom")}
            className="w-full border-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            預計用餐時間
          </Button>
          {timeFilterMode === "custom" && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-2"
              />
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="border-2"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 店家卡片組件
function StoreCard({ store, isSelected, onClick, onMenuClick }: { store: any, isSelected: boolean, onClick: () => void, onMenuClick: () => void }) {
  const { data: reviews } = trpc.reviews.byStoreId.useQuery(
    { storeId: store.id, limit: 3 },
    { enabled: isSelected }
  );

  const rating = store.rating || 0;
  const reviewCount = store.reviewCount || 0;

  return (
    <Card
      className={`border-2 transition-all cursor-pointer hover:shadow-xl ${
        isSelected ? "border-primary shadow-2xl ring-4 ring-primary/20" : "border-border hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* 店家圖片 */}
          <div className="sm:w-1/3 h-48 sm:h-auto bg-muted relative overflow-hidden">
            {store.photoUrl ? (
              <img
                src={store.photoUrl}
                alt={store.name}
                className="w-full h-full object-cover transition-transform hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <span className="text-4xl">🍜</span>
              </div>
            )}
          </div>

          {/* 店家資訊 */}
          <div className="flex-1 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{store.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({reviewCount}則評論)</span>
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border border-accent">
                    營業中
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick();
                }}
                className="border-2 border-primary/50 hover:bg-primary/10"
              >
                📋 查看菜單
              </Button>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{store.address}</span>
              </div>
              {store.openingHours && store.openingHours.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>營業時間：{store.openingHours[0]}</span>
                </div>
              )}
            </div>

            {/* 近期評論 */}
            {isSelected && reviews && reviews.length > 0 && (
              <div className="border-t border-border/50 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">近期評論</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reviews.map((review: any, idx: number) => (
                    <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{review.authorName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{review.text}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">{review.relativeTime}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 地圖視圖組件
function MapView({ store }: { store: any }) {
  const lat = parseFloat(store.lat || "0");
  const lng = parseFloat(store.lng || "0");
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD80kuCrJFFj2zsxRTrmxPTbRbVrqEAn3U'}&q=${encodeURIComponent(store.name)},${encodeURIComponent(store.address)}`;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <h3 className="font-bold text-lg mb-2">{store.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {store.address}
        </p>
        {store.googleMapsUrl && (
          <a
            href={store.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Navigation className="w-4 h-4" />
            在 Google Maps 中開啟
          </a>
        )}
      </div>
      <div className="flex-1 relative">
        <iframe
          src={mapUrl}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

