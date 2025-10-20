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
import { MenuDialog } from "@/components/MenuDialog";
import { OpenStreetMapView } from "@/components/OpenStreetMapView";

const DISTRICTS = [
  "全部區域",
  "中西區", "東區", "南區", "北區", "安平區", "安南區",
  "永康區", "仁德區", "歸仁區", "關廟區",
  "新營區", "鹽水區", "白河區", "柳營區", "後壁區", "東山區",
  "麻豆區", "下營區", "六甲區", "官田區", "大內區",
  "佳里區", "學甲區", "西港區", "七股區", "將軍區", "北門區",
  "新化區", "善化區", "新市區", "安定區", "山上區", "玉井區",
  "楠西區", "南化區", "左鎮區", "龍崎區"
];

export default function Home() {
  const { user } = useAuth();

  // 從後端取得所有店家資料
  const { data: storesData, isLoading } = trpc.stores.list.useQuery();

  // 取得所有店家的照片資料 (用於顯示店家卡片圖片)
  const { data: allPhotosData } = trpc.photos.allStores.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("全部區域");
  const [minRating, setMinRating] = useState([0]);
  const [timeFilterMode, setTimeFilterMode] = useState<"all" | "now" | "custom">("all");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 1=週一, 7=週日
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [selectedMenuStoreId, setSelectedMenuStoreId] = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showLocationNotice, setShowLocationNotice] = useState(false);

  // 取得選中店家的評論
  const { data: selectedStoreReviews } = trpc.reviews.byStoreId.useQuery(
    { storeId: selectedStoreId!, limit: 3 },
    { enabled: !!selectedStoreId }
  );

  useEffect(() => {
    // 使用台灣時區 (GMT+8)
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const timeStr = taiwanTime.toTimeString().slice(0, 5);
    const dayOfWeek = taiwanTime.getDay(); // 0=週日, 1=週一, ...
    setSelectedDayOfWeek(dayOfWeek === 0 ? 7 : dayOfWeek); // 轉換為 1-7
    setSelectedTime(timeStr);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLoc);
          setTimeFilterMode("now"); // 自動切換到「現在營業中」篩選
          setShowLocationNotice(true); // 顯示提示訊息
          setTimeout(() => setShowLocationNotice(false), 5000); // 5秒後自動隱藏
        },
        (error) => {
          console.error("定位失敗:", error);
          let errorMsg = "無法取得您的位置";
          if (error.code === 1) {
            errorMsg += "\n請在瀏覽器設定中允許定位權限";
          } else if (error.code === 2) {
            errorMsg += "\n定位服務不可用";
          } else if (error.code === 3) {
            errorMsg += "\n定位請求逾時";
          }
          alert(errorMsg);
        }
      );
    } else {
      alert("您的瀏覽器不支援定位功能");
    }
  };

  // 檢查店家是否在指定時間營業
  const isStoreOpenAtTime = (openingHours: any[] | null, dayOfWeek: number, timeStr: string) => {
    if (!openingHours || openingHours.length === 0) return true;

    // 處理新格式: [{open: "0:0430", close: "0:1300"}, ...]
    // 或舊格式: ["週一 09:00-17:00", ...]
    
    // 找到對應星期的營業時間
    const dayIndex = dayOfWeek === 7 ? 0 : dayOfWeek; // Google API: 0=週日, 1=週一, ..., 6=週六
    const daySchedule = openingHours.find((period: any) => {
      if (typeof period === 'string') {
        // 舊格式，使用索引
        return openingHours.indexOf(period) === (dayOfWeek === 7 ? 6 : dayOfWeek - 1);
      } else if (period.open) {
        // 新格式，檢查 day
        const openParts = period.open.split(':');
        if (openParts.length < 1) return false;
        const openDay = parseInt(openParts[0]);
        return openDay === dayIndex;
      }
      return false;
    });
    
    if (!daySchedule) return true; // 沒有該天的資料，預設營業

    // 處理舊格式
    if (typeof daySchedule === 'string') {
      if (daySchedule.includes("休息") || daySchedule.includes("Closed")) {
        return false;
      }
      const timeMatch = daySchedule.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
      if (!timeMatch) return true;
      const [_, openHour, openMin, closeHour, closeMin] = timeMatch;
      const openTime = parseInt(openHour) * 60 + parseInt(openMin);
      const closeTime = parseInt(closeHour) * 60 + parseInt(closeMin);
      const currentTime = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
      return currentTime >= openTime && currentTime <= closeTime;
    }

    // 處理新格式: {open: "0:0430", close: "0:1300"}
    if (daySchedule.open && daySchedule.close) {
      const openParts = daySchedule.open.split(':');
      const closeParts = daySchedule.close.split(':');
      
      if (openParts.length < 2 || closeParts.length < 2) return true;
      
      const openTime = openParts[1]; // "0430"
      const closeTime = closeParts[1]; // "1300"
      
      const openHour = parseInt(openTime.substring(0, 2));
      const openMin = parseInt(openTime.substring(2, 4));
      const closeHour = parseInt(closeTime.substring(0, 2));
      const closeMin = parseInt(closeTime.substring(2, 4));
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      const currentMinutes = parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1]);
      
      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }

    return true; // 無法判斷，預設營業
  };

  // 計算兩點間距離 (公里)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // 地球半徑 (公里)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 計算每個區域的店家數量
  const districtCounts = useMemo(() => {
    if (!storesData) return {};
    const counts: Record<string, number> = {};
    storesData.forEach(store => {
      const district = store.district || '未知';
      counts[district] = (counts[district] || 0) + 1;
    });
    return counts;
  }, [storesData]);

  // 只顯示有店家的區域
  const availableDistricts = useMemo(() => {
    const districts = ['全部區域'];
    DISTRICTS.slice(1).forEach(district => {
      if (districtCounts[district] && districtCounts[district] > 0) {
        districts.push(district);
      }
    });
    return districts;
  }, [districtCounts]);

  // 篩選店家
  const filteredStores = useMemo(() => {
    if (!storesData) return [];

    let filtered = storesData.filter(store => {
      // 搜尋篩選
      if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 區域篩選
      if (selectedDistrict !== "全部區域" && selectedDistrict !== "附近") {
        if (store.district !== selectedDistrict) return false;
      }

      // 評分篩選
      const rating = store.rating || 0; // 後端API已經處理過除以10的轉換
      if (rating < minRating[0]) return false;

      // 營業時間篩選
      if (timeFilterMode === "now") {
        // 現在營業中 (使用台灣時區)
        const now = new Date();
        const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        const nowDayOfWeek = taiwanTime.getDay() === 0 ? 7 : taiwanTime.getDay();
        const nowTime = taiwanTime.toTimeString().slice(0, 5);
        if (!isStoreOpenAtTime(store.openingHours, nowDayOfWeek, nowTime)) {
          return false;
        }
      } else if (timeFilterMode === "custom" && selectedTime) {
        // 自訂時間
        if (!isStoreOpenAtTime(store.openingHours, selectedDayOfWeek, selectedTime)) {
          return false;
        }
      }

      return true;
    });

    // 如果有用戶位置，按距離排序
    if (userLocation) {
      filtered = filtered.map(store => ({
        ...store,
        distance: store.lat && store.lng 
          ? calculateDistance(userLocation.lat, userLocation.lng, parseFloat(store.lat), parseFloat(store.lng))
          : 999999
      })).sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
    }

    return filtered;
  }, [storesData, searchTerm, selectedDistrict, minRating, timeFilterMode, selectedDayOfWeek, selectedTime, userLocation]);

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
        <div className="container mx-auto px-4 py-3">
          {/* 第一排: Logo + 標題 */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7z" fill="currentColor" opacity="0.3"/>
                <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                <path d="M8 14c0 2 1.5 4 4 5 2.5-1 4-3 4-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              24Hr台南牛肉湯選擇器
            </h1>
          </div>
          {/* 第二排: 副標題 + 按鈕 */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              尋找最適合你的那碗溫暖 🍜
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowDonateDialog(true)}
                className="h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-yellow-100 to-amber-100 hover:from-yellow-200 hover:to-amber-200 text-amber-800 shadow-lg border border-amber-200 text-xs sm:text-sm"
              >
                <span className="text-sm sm:text-base">🧋</span>
                <span className="hidden sm:inline ml-2">感謝板主，</span><span className="ml-1 sm:ml-0">抖內珍奶</span>
              </Button>
              <a
                href="https://lin.ee/gO8R6rH"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors shadow-sm"
                title="聯絡我們 / 回報問題"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm font-medium">聯絡我們</span>
              </a>
            </div>
          </div>
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
            <Card className="sticky top-6 border-2 border-border shadow-xl bg-card/95 backdrop-blur max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                  selectedDayOfWeek={selectedDayOfWeek}
                  setSelectedDayOfWeek={setSelectedDayOfWeek}
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                  getUserLocation={getUserLocation}
                  filteredCount={filteredStores.length}
                  availableDistricts={availableDistricts}
                  districtCounts={districtCounts}
                  storesData={storesData}
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
                  onClick={() => {
                    setSelectedStoreId(store.id);
                    // 在手機版開啟地圖對話框
                    if (window.innerWidth < 1024) {
                      setShowMobileMap(true);
                    }
                  }}
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
                  <OpenStreetMapView store={storesData.find((s: any) => s.id === selectedStoreId)!} />
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
                selectedDayOfWeek={selectedDayOfWeek}
                setSelectedDayOfWeek={setSelectedDayOfWeek}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                getUserLocation={getUserLocation}
                filteredCount={filteredStores.length}
                availableDistricts={availableDistricts}
                districtCounts={districtCounts}
                storesData={storesData}
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
      <MenuDialog 
        storeId={selectedMenuStoreId} 
        storeName={selectedMenuStoreId && storesData?.find((s: any) => s.id === selectedMenuStoreId)?.name}
        open={showMenuDialog}
        onOpenChange={setShowMenuDialog}
      />

      {/* 手機版地圖對話框 */}
      <Dialog open={showMobileMap} onOpenChange={setShowMobileMap}>
        <DialogContent className="sm:max-w-[95vw] max-w-[100vw] h-[90vh] p-0 border-2 border-primary/20 flex flex-col">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle>
              {selectedStoreId && storesData?.find((s: any) => s.id === selectedStoreId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedStoreId && storesData ? (
              <OpenStreetMapView store={storesData.find((s: any) => s.id === selectedStoreId)!} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">無法顯示地圖</p>
              </div>
            )}
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
  selectedDayOfWeek, setSelectedDayOfWeek,
  selectedTime, setSelectedTime,
  getUserLocation,
  filteredCount,
  availableDistricts,
  districtCounts,
  storesData
}: any) {
  const WEEKDAYS = [
    { value: 1, label: "週一" },
    { value: 2, label: "週二" },
    { value: 3, label: "週三" },
    { value: 4, label: "週四" },
    { value: 5, label: "週五" },
    { value: 6, label: "週六" },
    { value: 7, label: "週日" },
  ];
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
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="w-full px-3 py-2 border-2 border-border rounded-md bg-background hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          {availableDistricts.map((district) => (
            <option key={district} value={district}>
              {district === '全部區域' 
                ? `全部區域 (${storesData?.length || 0})` 
                : `${district} (${districtCounts[district] || 0})`}
            </option>
          ))}
        </select>
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
            variant={timeFilterMode === "all" ? "default" : "outline"}
            onClick={() => setTimeFilterMode("all")}
            className="w-full border-2"
          >
            <Clock className="w-4 h-4 mr-2" />
            顯示全部
          </Button>
          <Button
            variant={timeFilterMode === "now" ? "default" : "outline"}
            onClick={() => setTimeFilterMode("now")}
            className="w-full border-2"
          >
            <Clock className="w-4 h-4 mr-2 fill-primary" />
            現在營業中
          </Button>
          <Button
            variant={timeFilterMode === "custom" ? "default" : "outline"}
            onClick={() => setTimeFilterMode("custom")}
            className="w-full border-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            自訂時間
          </Button>
          {timeFilterMode === "custom" && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">選擇星期</Label>
                <div className="grid grid-cols-4 gap-1">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.value}
                      variant={selectedDayOfWeek === day.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDayOfWeek(day.value)}
                      className={`text-xs ${selectedDayOfWeek === day.value ? "bg-primary" : ""}`}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">選擇時間</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="border-2"
                />
              </div>
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

  const rating = store.rating || 0; // 後端API已經處理過除以10的轉換
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
            {(() => {
              // 從 allPhotosData 中找到這家店的第一張照片
              const storePhotos = allPhotosData?.filter((p: any) => p.storeId === store.id) || [];
              const firstPhoto = storePhotos[0];
              const photoReference = firstPhoto?.photoUrl; // 實際上是 photo_reference
              
              // 如果有 photo_reference,使用 Google Maps API 生成照片 URL
              const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
              const photoUrl = photoReference && googleMapsApiKey
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${googleMapsApiKey}`
                : null;
              
              return photoUrl ? (
                <img
                  src={photoUrl}
                  alt={store.name}
                  className="w-full h-full object-cover transition-transform hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"><span class="text-4xl">🍜</span></div>';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <span className="text-4xl">🍜</span>
                </div>
              );
            })()}
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
                  <Badge variant="secondary" className="bg-green-500/20 text-green-700 border border-green-500">
                    營業中
                  </Badge>
                  {store.distance && (
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      <Navigation className="w-3 h-3 mr-1" />
                      {store.distance < 1 
                        ? `${(store.distance * 1000).toFixed(0)}m` 
                        : `${store.distance.toFixed(1)}km`}
                    </Badge>
                  )}
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
                  <span>營業時間：
                    {(() => {
                      if (!store.openingHours || store.openingHours.length === 0) return '請洽店家';
                      
                      const today = new Date().getDay(); // 0=週日, 1=週一, ...
                      const todaySchedule = store.openingHours.find((period: any) => {
                        if (!period.open) return false;
                        const openParts = period.open.split(':');
                        if (openParts.length < 1) return false;
                        const dayIndex = parseInt(openParts[0]);
                        return dayIndex === today;
                      });
                      
                      if (todaySchedule && todaySchedule.open && todaySchedule.close) {
                        const openParts = todaySchedule.open.split(':');
                        const closeParts = todaySchedule.close.split(':');
                        
                        if (openParts.length >= 2 && closeParts.length >= 2) {
                          const openTime = openParts[1]; // "0430"
                          const closeTime = closeParts[1]; // "1300"
                          const openHour = openTime.substring(0, 2);
                          const openMin = openTime.substring(2, 4);
                          const closeHour = closeTime.substring(0, 2);
                          const closeMin = closeTime.substring(2, 4);
                          return `${openHour}:${openMin} - ${closeHour}:${closeMin}`;
                        }
                      }
                      return '請洽店家';
                    })()}
                  </span>
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

      {/* 位置排序提示訊息 */}
      {showLocationNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <Navigation className="w-5 h-5" />
            <div>
              <p className="font-semibold">已完成距離排序！</p>
              <p className="text-sm">現在顯示營業中且距離最近的店家</p>
            </div>
            <button 
              onClick={() => setShowLocationNotice(false)}
              className="ml-2 hover:bg-green-600 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

