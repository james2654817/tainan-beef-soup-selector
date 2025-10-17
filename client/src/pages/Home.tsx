import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Clock, Search, Calendar, Navigation, MessageSquare, User, Heart } from "lucide-react";

// 模擬評論資料
const MOCK_REVIEWS = {
  1: [
    { author: "美食獵人", rating: 5, text: "牛肉超級新鮮，湯頭清甜不膩，早上來一碗真的很幸福！", date: "2天前" },
    { author: "台南在地人", rating: 4, text: "老字號了，品質穩定，就是人有點多要排隊", date: "5天前" },
    { author: "觀光客小王", rating: 5, text: "第一次吃台南牛肉湯就選這家，沒有失望！", date: "1週前" }
  ],
  2: [
    { author: "吃貨日記", rating: 5, text: "六千真的名不虛傳，牛肉切得很厚實，湯頭濃郁", date: "1天前" },
    { author: "美食部落客", rating: 5, text: "凌晨來吃宵夜的好選擇，停車也方便", date: "3天前" },
    { author: "在地老饕", rating: 4, text: "價格稍高但物有所值，推薦綜合湯", date: "1週前" }
  ],
  3: [
    { author: "路過遊客", rating: 4, text: "湯頭不錯，但肉質普通，整體還可以", date: "2天前" },
    { author: "小吃愛好者", rating: 4, text: "CP值高，份量足夠，適合當早餐", date: "4天前" },
    { author: "美食探險家", rating: 5, text: "意外的好吃！下次還會再來", date: "1週前" }
  ],
  4: [
    { author: "台南通", rating: 4, text: "在地人推薦的店，不會踩雷", date: "1天前" },
    { author: "觀光客", rating: 4, text: "位置有點難找，但值得一試", date: "3天前" },
    { author: "牛肉湯控", rating: 5, text: "湯頭清爽，牛肉鮮嫩，讚！", date: "5天前" }
  ],
  5: [
    { author: "早餐達人", rating: 4, text: "安平區的好選擇，觀光完可以來吃", date: "2天前" },
    { author: "在地居民", rating: 4, text: "住附近常來，品質穩定", date: "1週前" },
    { author: "美食評論家", rating: 4, text: "中規中矩，不會讓人失望", date: "2週前" }
  ],
  6: [
    { author: "牛肉湯狂熱者", rating: 5, text: "我心中的第一名！每次來台南必吃", date: "1天前" },
    { author: "食尚玩家", rating: 5, text: "超級推薦！湯頭、肉質都是頂級", date: "3天前" },
    { author: "老饕", rating: 5, text: "旗哥真的強，難怪評價這麼高", date: "1週前" }
  ],
  7: [
    { author: "夜貓族", rating: 5, text: "凌晨4點半就開了，宵夜首選", date: "1天前" },
    { author: "上班族", rating: 4, text: "上班前來一碗，整天都有精神", date: "4天前" },
    { author: "美食家", rating: 5, text: "康樂街這家真的很讚", date: "1週前" }
  ],
  8: [
    { author: "北區居民", rating: 4, text: "住北區的好選擇，不用跑市區", date: "2天前" },
    { author: "學生", rating: 4, text: "價格親民，學生族群友善", date: "5天前" },
    { author: "路人甲", rating: 4, text: "普通好吃，會再回訪", date: "1週前" }
  ]
};

// 模擬店家資料
const MOCK_STORES = [
  {
    id: 1,
    name: "文章牛肉湯",
    district: "安平區",
    address: "台南市安平區安平路590號",
    rating: 4.5,
    reviewCount: 1250,
    openingHours: "05:00-13:30",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
    lat: 23.001,
    lng: 120.165
  },
  {
    id: 2,
    name: "六千牛肉湯",
    district: "中西區",
    address: "台南市中西區海安路一段63號",
    rating: 4.6,
    reviewCount: 2100,
    openingHours: "05:30-12:30",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1603073163308-9c4f5d3f2a3f?w=400&h=300&fit=crop",
    lat: 22.997,
    lng: 120.197
  },
  {
    id: 3,
    name: "阿村牛肉湯",
    district: "中西區",
    address: "台南市中西區保安路41號",
    rating: 4.4,
    reviewCount: 890,
    openingHours: "06:00-14:00",
    isOpen: false,
    image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&h=300&fit=crop",
    lat: 22.992,
    lng: 120.200
  },
  {
    id: 4,
    name: "石精臼牛肉湯",
    district: "中西區",
    address: "台南市中西區國華街三段16巷2號",
    rating: 4.3,
    reviewCount: 756,
    openingHours: "05:00-12:00",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1588347818036-8e6c7c1e8e0f?w=400&h=300&fit=crop",
    lat: 22.995,
    lng: 120.198
  },
  {
    id: 5,
    name: "阿財牛肉湯",
    district: "安平區",
    address: "台南市安平區安平路422號",
    rating: 4.2,
    reviewCount: 620,
    openingHours: "06:30-13:00",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop",
    lat: 23.003,
    lng: 120.163
  },
  {
    id: 6,
    name: "旗哥牛肉湯",
    district: "東區",
    address: "台南市東區崇學路55號",
    rating: 4.7,
    reviewCount: 1580,
    openingHours: "05:00-11:30",
    isOpen: false,
    image: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=400&h=300&fit=crop",
    lat: 22.985,
    lng: 120.225
  },
  {
    id: 7,
    name: "康樂街牛肉湯",
    district: "中西區",
    address: "台南市中西區康樂街410號",
    rating: 4.5,
    reviewCount: 1120,
    openingHours: "04:30-12:00",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1600555379765-f82335a05f0e?w=400&h=300&fit=crop",
    lat: 22.990,
    lng: 120.195
  },
  {
    id: 8,
    name: "助仔牛肉湯",
    district: "北區",
    address: "台南市北區開元路247號",
    rating: 4.1,
    reviewCount: 450,
    openingHours: "06:00-13:30",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1603073163308-9c4f5d3f2a3f?w=400&h=300&fit=crop",
    lat: 23.010,
    lng: 120.210
  }
];

const DISTRICTS = ["全部區域", "中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區"];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("全部區域");
  const [minRating, setMinRating] = useState([0]);
  const [timeFilterMode, setTimeFilterMode] = useState<"now" | "custom">("now");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showDonateDialog, setShowDonateDialog] = useState(false);

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
          alert("無法取得您的位置，請確認已開啟定位權限");
        }
      );
    } else {
      alert("您的瀏覽器不支援定位功能");
    }
  };

  const isStoreOpenAtTime = (openingHours: string, checkTime: string) => {
    const [start, end] = openingHours.split('-').map(t => t.trim());
    return checkTime >= start && checkTime <= end;
  };

  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === "全部區域" || selectedDistrict === "附近" || store.district === selectedDistrict;
      const matchesRating = store.rating >= minRating[0];
      
      let matchesTime = true;
      if (timeFilterMode === "now") {
        matchesTime = store.isOpen;
      } else if (timeFilterMode === "custom" && selectedTime) {
        matchesTime = isStoreOpenAtTime(store.openingHours, selectedTime);
      }
      
      return matchesSearch && matchesDistrict && matchesRating && matchesTime;
    });
  }, [searchTerm, selectedDistrict, minRating, timeFilterMode, selectedTime]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* 文青風格背景裝飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        {/* 手繪風格圓點 */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 right-20 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-secondary/10 blur-3xl" />
        
        {/* 插畫元素 - 蒸氣效果 */}
        <svg className="absolute top-10 right-10 w-24 h-24 text-primary/20" viewBox="0 0 100 100">
          <path d="M20,80 Q20,60 30,60 T40,80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M50,80 Q50,55 60,55 T70,80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M35,80 Q35,50 45,50 T55,80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      
      {/* Header */}
      <header className="relative border-b-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {/* 牛肉湯碗圖示 */}
                <svg className="w-10 h-10 text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="60" r="35" fill="currentColor" opacity="0.2"/>
                  <ellipse cx="50" cy="55" rx="38" ry="12" fill="currentColor" opacity="0.3"/>
                  <path d="M15 55 Q15 75 50 80 Q85 75 85 55" stroke="currentColor" strokeWidth="3" fill="none"/>
                  <path d="M30 55 Q30 45 40 45 T50 55" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                  <path d="M50 55 Q50 40 60 40 T70 55" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                </svg>
                <h1 className="text-4xl font-bold text-primary">台南牛肉湯選擇器</h1>
              </div>
              <p className="text-muted-foreground text-base">尋找最適合你的那碗溫暖 🍜</p>
            </div>
            
            {/* 贊助按鈕 */}
            <Button
              onClick={() => setShowDonateDialog(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base font-semibold"
            >
              <Heart className="w-5 h-5 mr-2 animate-pulse" />
              🧋 請我喝杯珍奶
            </Button>
          </div>
        </div>
      </header>

      {/* 贊助彈窗 */}
      {showDonateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDonateDialog(false)}>
          <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* 關閉按鈕 */}
            <button
              onClick={() => setShowDonateDialog(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            
            {/* 裝飾性插畫 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="w-20 h-20 text-primary" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="60" r="35" fill="currentColor" opacity="0.2"/>
                  <ellipse cx="50" cy="55" rx="38" ry="12" fill="currentColor" opacity="0.3"/>
                  <path d="M15 55 Q15 75 50 80 Q85 75 85 55" stroke="currentColor" strokeWidth="3" fill="none"/>
                  <path d="M30 55 Q30 45 40 45 T50 55" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                  <path d="M50 55 Q50 40 60 40 T70 55" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
                </svg>
                <Heart className="w-6 h-6 text-red-500 absolute -top-2 -right-2 animate-pulse" fill="currentColor" />
              </div>
            </div>
            
            {/* 標題 */}
            <h3 className="text-2xl font-bold text-center text-foreground mb-2">
              喜歡這個選擇器嗎？
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              請我喝杯珍奶，讓我繼續維護更新 🐮
            </p>
            
            {/* BobaMe 按鈕 */}
            <div className="flex justify-center mb-6">
              <a
                href="https://hiyewei.bobaboba.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full h-12 px-6 bg-white hover:bg-gray-50 text-[#C07C62] border-2 border-[#C4C4C4] hover:border-[#C07C62] rounded-xl transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
              >
                <img
                  src="https://s3.ap-southeast-1.amazonaws.com/media.anyonelab.com/images/boba/boba-embed-icon.png"
                  alt="boba-icon"
                  className="h-6 mr-3"
                />
                請我喝珍奶！
              </a>
            </div>
            
            {/* 感謝文字 */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                您的每一份支持都是我持續優化的動力！
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                💝 感謝您的慷慨贊助
              </p>
            </div>
          </div>
        </div>
      )}


      <div className="container relative py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側篩選區 */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="border-2 border-border shadow-lg bg-card">
              <CardContent className="pt-6 space-y-6">
                {/* 搜尋 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Search className="w-4 h-4" />
                    搜尋店家
                  </h2>
                  <Input
                    placeholder="輸入店名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-2 border-border focus:border-primary"
                  />
                </div>

                {/* 區域選擇 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent">
                    <MapPin className="w-4 h-4" />
                    選擇區域
                  </h2>
                  <div className="mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getUserLocation}
                      className="w-full border-2 border-accent/50 hover:bg-accent/10 hover:border-accent text-accent"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      使用我的位置
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DISTRICTS.map(district => (
                      <Button
                        key={district}
                        variant={selectedDistrict === district ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDistrict(district)}
                        className={selectedDistrict === district 
                          ? "bg-primary hover:bg-primary/90 border-0 shadow-md" 
                          : "border-2 border-border hover:border-primary/50 hover:bg-primary/5"}
                      >
                        {district}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 評價篩選 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                    <Star className="w-4 h-4" />
                    評價篩選
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">最低評分</span>
                      <span className="text-yellow-600 font-bold">{minRating[0].toFixed(1)}★</span>
                    </div>
                    <Slider
                      value={minRating}
                      onValueChange={setMinRating}
                      max={5}
                      min={0}
                      step={0.1}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0★</span>
                      <span>5★</span>
                    </div>
                  </div>
                </div>

                {/* 營業時間篩選 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent">
                    <Clock className="w-4 h-4" />
                    營業時間篩選
                  </h2>
                  <div className="space-y-3">
                    <Button
                      variant={timeFilterMode === "now" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilterMode("now")}
                      className={`w-full ${
                        timeFilterMode === "now" 
                          ? "bg-primary hover:bg-primary/90 border-0 shadow-md" 
                          : "border-2 border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      現在營業中
                    </Button>
                    
                    <Button
                      variant={timeFilterMode === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFilterMode("custom")}
                      className={`w-full ${
                        timeFilterMode === "custom" 
                          ? "bg-primary hover:bg-primary/90 border-0 shadow-md" 
                          : "border-2 border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      預計用餐時間
                    </Button>

                    {timeFilterMode === "custom" && (
                      <div className="space-y-3 pt-3 border-t-2 border-border animate-in slide-in-from-top">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">日期</Label>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border-2 border-border focus:border-accent"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">時間</Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="border-2 border-border focus:border-accent"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground bg-accent/10 p-2 rounded border-2 border-accent/20">
                          將顯示在 <span className="font-bold text-accent">{selectedTime}</span> 營業的店家
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 結果統計 */}
                <div className="pt-4 border-t-2 border-border">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3">
                    <p className="text-sm text-foreground">
                      找到 <span className="font-bold text-primary text-xl">{filteredStores.length}</span> 家店
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* 中間列表區 */}
          <main className="lg:col-span-5 space-y-4">
            {filteredStores.length === 0 ? (
              <Card className="border-2 border-border shadow-lg bg-card">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-foreground text-lg font-semibold mb-2">沒有符合條件的店家</p>
                  <p className="text-muted-foreground text-sm">試試調整篩選條件</p>
                </CardContent>
              </Card>
            ) : (
              filteredStores.map(store => (
                <Card
                  key={store.id}
                  className={`border-2 border-border hover:border-primary/50 transition-all cursor-pointer group shadow-lg bg-card ${
                    selectedStore === store.id ? "border-primary shadow-xl ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* 店家基本資訊 */}
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-48 sm:h-auto overflow-hidden relative">
                          <img
                            src={store.image}
                            alt={store.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {store.name}
                            </h3>
                            <Badge 
                              variant={store.isOpen ? "default" : "secondary"} 
                              className={store.isOpen 
                                ? "bg-green-500 text-white border-0" 
                                : "bg-muted text-muted-foreground border-2 border-border"}
                            >
                              {store.isOpen ? "營業中" : "休息中"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                              <span className="font-bold text-xl text-yellow-600">{store.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">({store.reviewCount}則評論)</span>
                          </div>

                          <div className="flex items-start gap-2 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                            <span>{store.address}</span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="w-4 h-4 flex-shrink-0 text-accent" />
                            <span>營業時間：<span className="text-foreground font-semibold">{store.openingHours}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* 評論區 - 橫向三欄 */}
                      <div className="border-t-2 border-border p-4 bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">近期評論</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {MOCK_REVIEWS[store.id as keyof typeof MOCK_REVIEWS]?.map((review, idx) => (
                            <div key={idx} className="bg-card rounded-lg p-3 border-2 border-border hover:border-primary/30 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-3 h-3 text-primary" />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground truncate">{review.author}</span>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  {Array.from({length: review.rating}).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{review.text}</p>
                              <span className="text-xs text-muted-foreground/70">{review.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </main>

          {/* 右側地圖區 */}
          <aside className="lg:col-span-4">
            <Card className="border-2 border-border sticky top-6 overflow-hidden shadow-lg bg-card">
              <CardContent className="p-0">
                {selectedStore ? (
                  <div className="h-[600px]">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{border: 0}}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(MOCK_STORES.find(s => s.id === selectedStore)?.address || '')}&zoom=16`}
                    />
                  </div>
                ) : (
                  <div className="relative h-[600px] bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                    <div className="relative z-10 text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <MapPin className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-foreground text-lg font-semibold mb-2">點選左側店家</p>
                      <p className="text-muted-foreground text-sm">在地圖上顯示位置</p>
                    </div>
                    
                    {/* 裝飾性插畫元素 */}
                    <svg className="absolute bottom-10 right-10 w-32 h-32 text-primary/10" viewBox="0 0 100 100">
                      <circle cx="50" cy="70" r="25" fill="currentColor"/>
                      <path d="M30,70 Q30,50 40,50 T50,70" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M50,70 Q50,45 60,45 T70,70" fill="none" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

