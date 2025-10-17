import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Utensils } from "lucide-react";

interface MenuDialogProps {
  storeId: string | null;
  storeName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuDialog({ storeId, storeName, open, onOpenChange }: MenuDialogProps) {
  const { data: menuItems, isLoading } = trpc.menu.byStoreId.useQuery(
    { storeId: storeId || "" },
    { enabled: !!storeId && open }
  );
  
  const { data: storeData } = trpc.stores.list.useQuery();
  const currentStore = storeData?.find((s: any) => s.id === storeId);
  
  // 從 store 的 photos 中取得菜單照片（前5張）
  const menuPhotos = (currentStore as any)?.photos?.slice(0, 5) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-2 border-primary/20 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary" />
            {storeName || "店家菜單"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 免責聲明 */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  ⚠️ 重要提醒
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  以下菜單資訊由系統從評論中自動提取，僅供參考。實際菜色、價格、供應狀況請以店家現場為準。
                </p>
              </div>
            </div>
          </div>

          {/* 菜單照片 */}
          {menuPhotos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                菜單照片
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {menuPhotos.map((photo: any, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-colors">
                    <img 
                      src={photo.url || photo.photoUrl} 
                      alt={`菜單 ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 菜單內容 */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>載入菜單中...</p>
            </div>
          ) : !menuItems || menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>目前尚無菜單資料</p>
              <p className="text-sm mt-2">建議查看 Google Maps 評論或直接前往店家了解詳情</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menuItems.map((item: any) => (
                <div
                  key={item.id}
                  className="border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-colors bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    {item.price && (
                      <span className="text-primary font-bold text-lg">
                        ${item.price}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.confidence && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      資料可信度: {item.confidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 底部提示 */}
          {menuItems && menuItems.length > 0 && (
            <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
              <p>共 {menuItems.length} 項菜色 • 資料來源：Google Maps 評論</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

