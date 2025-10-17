import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Clock, Search, Calendar, Zap, Navigation, MessageSquare, User } from "lucide-react";

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

// 模擬店家資料（加入評論數）
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

  // 初始化日期和時間
  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
  }, []);

  // 獲取使用者定位
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

  // 檢查店家在指定時間是否營業
  const isStoreOpenAtTime = (openingHours: string, checkTime: string) => {
    const [start, end] = openingHours.split('-').map(t => t.trim());
    return checkTime >= start && checkTime <= end;
  };

  // 篩選邏輯
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 動態背景層 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 網格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        
        {/* 漸層光暈動畫 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}} />
        
        {/* 流動漸層 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-[gradient-shift_15s_ease_infinite]" 
               style={{backgroundSize: '400% 400%'}} />
        </div>
      </div>
      
      {/* Header */}
      <header className="relative border-b border-border/50 backdrop-blur-xl bg-card/30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <div className="container relative py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Zap className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-primary/50 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              台南牛肉湯選擇器
            </h1>
          </div>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            AI 智能推薦 · 即時更新 · 精準定位
          </p>
        </div>
      </header>

      <div className="container relative py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側篩選區 */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="backdrop-blur-xl bg-card/40 border-border/50 shadow-[0_0_30px_rgba(255,107,0,0.1)]">
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
                    className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20"
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
                      className="w-full bg-accent/10 border-accent/50 hover:bg-accent/20 hover:border-accent text-accent"
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
                          ? "bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(255,107,0,0.5)] border-0" 
                          : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"}
                      >
                        {district}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 評價篩選 - 改為滑桿 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                    <Star className="w-4 h-4" />
                    評價篩選
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">最低評分</span>
                      <span className="text-yellow-400 font-bold">{minRating[0].toFixed(1)}★</span>
                    </div>
                    <Slider
                      value={minRating}
                      onValueChange={setMinRating}
                      max={5}
                      min={0}
                      step={0.1}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-[0_0_10px_rgba(255,107,0,0.5)]"
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
                          ? "bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(255,107,0,0.5)] border-0" 
                          : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"
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
                          ? "bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(255,107,0,0.5)] border-0" 
                          : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      預計用餐時間
                    </Button>

                    {timeFilterMode === "custom" && (
                      <div className="space-y-3 pt-3 border-t border-border/50 animate-in slide-in-from-top">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">日期</Label>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">時間</Label>
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground bg-accent/10 p-2 rounded border border-accent/20">
                          將顯示在 <span className="font-bold text-accent">{selectedTime}</span> 營業的店家
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 結果統計 */}
                <div className="pt-4 border-t border-border/50">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse" />
                    <p className="text-sm text-foreground relative z-10">
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
              <Card className="backdrop-blur-xl bg-card/40 border-border/50">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
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
                  className={`backdrop-blur-xl bg-card/40 border-border/50 hover:border-primary/50 transition-all cursor-pointer group ${
                    selectedStore === store.id ? "border-primary shadow-[0_0_30px_rgba(255,107,0,0.3)] scale-[1.01]" : ""
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
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                        </div>
                        <div className="flex-1 p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {store.name}
                            </h3>
                            <Badge 
                              variant={store.isOpen ? "default" : "secondary"} 
                              className={store.isOpen 
                                ? "bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                : "bg-muted/20 text-muted-foreground border-border/50"}
                            >
                              {store.isOpen ? "營業中" : "休息中"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                              <span className="font-bold text-xl text-yellow-400">{store.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">({store.reviewCount}則評論)</span>
                          </div>

                          <div className="flex items-start gap-2 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                            <span>{store.address}</span>
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="w-4 h-4 flex-shrink-0 text-accent" />
                            <span>營業時間：<span className="text-foreground font-mono">{store.openingHours}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* 評論區 - 橫向三欄 */}
                      <div className="border-t border-border/50 p-4 bg-muted/5">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-semibold text-foreground">近期評論</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {MOCK_REVIEWS[store.id as keyof typeof MOCK_REVIEWS]?.map((review, idx) => (
                            <div key={idx} className="bg-background/50 rounded-lg p-3 border border-border/30 hover:border-primary/30 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-3 h-3 text-primary" />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground truncate">{review.author}</span>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  {Array.from({length: review.rating}).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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
            <Card className="backdrop-blur-xl bg-card/40 border-border/50 sticky top-6 overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.1)]">
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
                  <div className="relative h-[600px] bg-gradient-to-br from-muted/20 to-accent/10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
                    
                    <div className="relative z-10 text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center border-2 border-border/50 animate-pulse">
                        <MapPin className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-foreground text-lg font-semibold mb-2">點選左側店家</p>
                      <p className="text-muted-foreground text-sm">在地圖上顯示位置</p>
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none">
                      {filteredStores.slice(0, 6).map((store, idx) => (
                        <div
                          key={store.id}
                          className="absolute w-4 h-4 rounded-full bg-primary animate-pulse"
                          style={{
                            left: `${15 + idx * 14}%`,
                            top: `${25 + idx * 12}%`,
                            boxShadow: '0 0 20px rgba(255, 107, 0, 0.8)',
                            animationDelay: `${idx * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
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

