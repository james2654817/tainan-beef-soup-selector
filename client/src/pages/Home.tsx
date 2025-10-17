import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Clock, Search, Calendar, Zap } from "lucide-react";

// 模擬店家資料
const MOCK_STORES = [
  {
    id: 1,
    name: "文章牛肉湯",
    district: "安平區",
    address: "台南市安平區安平路590號",
    rating: 4.5,
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
  const [minRating, setMinRating] = useState(0);
  const [timeFilterMode, setTimeFilterMode] = useState<"now" | "custom">("now");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  // 初始化日期和時間為當前值
  useState(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
  });

  // 檢查店家在指定時間是否營業
  const isStoreOpenAtTime = (openingHours: string, checkTime: string) => {
    const [start, end] = openingHours.split('-').map(t => t.trim());
    return checkTime >= start && checkTime <= end;
  };

  // 篩選邏輯
  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === "全部區域" || store.district === selectedDistrict;
      const matchesRating = store.rating >= minRating;
      
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
    <div className="min-h-screen bg-background">
      {/* 科技感背景網格 */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      {/* Header with gradient glow */}
      <header className="relative border-b border-border/50 backdrop-blur-xl bg-card/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-pulse" />
        <div className="container relative py-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,107,0,0.7)]" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              台南牛肉湯選擇器
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">AI 智能推薦 · 即時更新 · 精準定位</p>
        </div>
      </header>

      <div className="container relative py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側篩選區 - 玻璃擬態效果 */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-[0_0_30px_rgba(255,107,0,0.1)]">
              <CardContent className="pt-6 space-y-6">
                {/* 搜尋 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                    <Search className="w-4 h-4" />
                    搜尋店家
                  </h2>
                  <div className="relative">
                    <Input
                      placeholder="輸入店名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 pl-4"
                    />
                  </div>
                </div>

                {/* 區域選擇 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent">
                    <MapPin className="w-4 h-4" />
                    選擇區域
                  </h2>
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

                {/* 評價篩選 */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                    <Star className="w-4 h-4" />
                    評價篩選
                  </h2>
                  <div className="space-y-2">
                    {[0, 4.0, 4.3, 4.5].map(rating => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className={`w-full justify-start ${
                          minRating === rating 
                            ? "bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(255,107,0,0.5)] border-0" 
                            : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/10"
                        }`}
                      >
                        {rating === 0 ? "全部評價" : `${rating}★ 以上`}
                      </Button>
                    ))}
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
                      <div className="space-y-3 pt-3 border-t border-border/50">
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
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
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
              <Card className="backdrop-blur-xl bg-card/50 border-border/50">
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
                  className={`backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group ${
                    selectedStore === store.id ? "border-primary shadow-[0_0_30px_rgba(255,107,0,0.3)] scale-[1.02]" : ""
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <CardContent className="p-0">
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
                        
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                          <span className="font-bold text-xl text-yellow-400">{store.rating}</span>
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
                  </CardContent>
                </Card>
              ))
            )}
          </main>

          {/* 右側地圖區 */}
          <aside className="lg:col-span-4">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 sticky top-6 overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.1)]">
              <CardContent className="p-0">
                <div className="relative h-[600px] bg-gradient-to-br from-muted/20 to-accent/10 flex items-center justify-center">
                  {/* 背景動態網格 */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
                  
                  {selectedStore ? (
                    <div className="relative z-10 text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary shadow-[0_0_30px_rgba(255,107,0,0.5)] animate-pulse">
                        <MapPin className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {MOCK_STORES.find(s => s.id === selectedStore)?.name}
                      </h3>
                      <p className="text-muted-foreground mb-6 text-sm">
                        {MOCK_STORES.find(s => s.id === selectedStore)?.address}
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(255,107,0,0.5)] border-0">
                        <MapPin className="w-4 h-4 mr-2" />
                        在 Google Maps 中開啟
                      </Button>
                    </div>
                  ) : (
                    <div className="relative z-10 text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center border-2 border-border/50">
                        <MapPin className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-foreground text-lg font-semibold mb-2">點選左側店家</p>
                      <p className="text-muted-foreground text-sm">在地圖上顯示位置</p>
                    </div>
                  )}
                  
                  {/* 模擬地圖標記 - 霓虹效果 */}
                  <div className="absolute inset-0 pointer-events-none">
                    {filteredStores.slice(0, 6).map((store, idx) => (
                      <div
                        key={store.id}
                        className="absolute w-4 h-4 rounded-full bg-primary animate-pulse"
                        style={{
                          left: `${15 + idx * 14}%`,
                          top: `${25 + idx * 12}%`,
                          boxShadow: '0 0 20px rgba(255, 107, 0, 0.8), 0 0 40px rgba(255, 107, 0, 0.4)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

