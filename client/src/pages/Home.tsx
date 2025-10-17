import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Search } from "lucide-react";

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
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  // 篩選邏輯
  const filteredStores = useMemo(() => {
    return MOCK_STORES.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = selectedDistrict === "全部區域" || store.district === selectedDistrict;
      const matchesRating = store.rating >= minRating;
      const matchesOpen = !showOpenOnly || store.isOpen;
      
      return matchesSearch && matchesDistrict && matchesRating && matchesOpen;
    });
  }, [searchTerm, selectedDistrict, minRating, showOpenOnly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg">
        <div className="container py-6">
          <h1 className="text-4xl font-bold mb-2">🥩 台南牛肉湯選擇器</h1>
          <p className="text-orange-100">找到最適合你的那碗溫暖</p>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左側篩選區 */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="shadow-md border-orange-200">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-orange-600" />
                    搜尋店家
                  </h2>
                  <Input
                    placeholder="輸入店名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    選擇區域
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {DISTRICTS.map(district => (
                      <Button
                        key={district}
                        variant={selectedDistrict === district ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDistrict(district)}
                        className={selectedDistrict === district ? "bg-orange-600 hover:bg-orange-700" : "hover:bg-orange-50"}
                      >
                        {district}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-600" />
                    評價篩選
                  </h2>
                  <div className="space-y-2">
                    {[0, 4.0, 4.3, 4.5].map(rating => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className={`w-full justify-start ${minRating === rating ? "bg-orange-600 hover:bg-orange-700" : "hover:bg-orange-50"}`}
                      >
                        {rating === 0 ? "全部評價" : `${rating}★ 以上`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    營業狀態
                  </h2>
                  <Button
                    variant={showOpenOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOpenOnly(!showOpenOnly)}
                    className={`w-full ${showOpenOnly ? "bg-orange-600 hover:bg-orange-700" : "hover:bg-orange-50"}`}
                  >
                    {showOpenOnly ? "✓ 只顯示營業中" : "顯示全部"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-orange-200">
                  <p className="text-sm text-gray-600">
                    找到 <span className="font-bold text-orange-600">{filteredStores.length}</span> 家店
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* 中間列表區 */}
          <main className="lg:col-span-5 space-y-4">
            {filteredStores.length === 0 ? (
              <Card className="shadow-md">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 text-lg">沒有符合條件的店家</p>
                  <p className="text-gray-400 text-sm mt-2">試試調整篩選條件</p>
                </CardContent>
              </Card>
            ) : (
              filteredStores.map(store => (
                <Card
                  key={store.id}
                  className={`shadow-md hover:shadow-xl transition-all cursor-pointer border-2 ${
                    selectedStore === store.id ? "border-orange-500 bg-orange-50" : "border-transparent hover:border-orange-200"
                  }`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-40 h-40 sm:h-auto overflow-hidden">
                        <img
                          src={store.image}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
                          <Badge variant={store.isOpen ? "default" : "secondary"} className={store.isOpen ? "bg-green-600" : ""}>
                            {store.isOpen ? "營業中" : "休息中"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="font-semibold text-lg">{store.rating}</span>
                        </div>

                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{store.address}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>營業時間：{store.openingHours}</span>
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
            <Card className="shadow-md sticky top-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 h-[600px] flex items-center justify-center relative">
                  {selectedStore ? (
                    <div className="text-center p-6">
                      <MapPin className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {MOCK_STORES.find(s => s.id === selectedStore)?.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {MOCK_STORES.find(s => s.id === selectedStore)?.address}
                      </p>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        在 Google Maps 中開啟
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">點選左側店家</p>
                      <p className="text-gray-400 text-sm mt-2">在地圖上顯示位置</p>
                    </div>
                  )}
                  
                  {/* 模擬地圖標記 */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {filteredStores.slice(0, 5).map((store, idx) => (
                      <div
                        key={store.id}
                        className="absolute w-3 h-3 bg-orange-600 rounded-full"
                        style={{
                          left: `${20 + idx * 15}%`,
                          top: `${30 + idx * 10}%`
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

