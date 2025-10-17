import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 店家 API
  stores: router({
    // 取得所有店家
    list: publicProcedure.query(async () => {
      const stores = await db.getAllStores();
      return stores.map(store => ({
        ...store,
        rating: store.rating ? store.rating / 10 : null, // 45 -> 4.5
      }));
    }),

    // 依 ID 取得店家
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const store = await db.getStoreById(input.id);
        if (!store) return null;
        return {
          ...store,
          rating: store.rating ? store.rating / 10 : null,
        };
      }),

    // 依行政區篩選
    byDistrict: publicProcedure
      .input(z.object({ district: z.string() }))
      .query(async ({ input }) => {
        const stores = await db.getStoresByDistrict(input.district);
        return stores.map(store => ({
          ...store,
          rating: store.rating ? store.rating / 10 : null,
        }));
      }),

    // 搜尋店家
    search: publicProcedure
      .input(z.object({ term: z.string() }))
      .query(async ({ input }) => {
        const stores = await db.searchStores(input.term);
        return stores.map(store => ({
          ...store,
          rating: store.rating ? store.rating / 10 : null,
        }));
      }),

    // 依評分篩選
    byRating: publicProcedure
      .input(z.object({ minRating: z.number() }))
      .query(async ({ input }) => {
        const stores = await db.getStoresByRating(input.minRating);
        return stores.map(store => ({
          ...store,
          rating: store.rating ? store.rating / 10 : null,
        }));
      }),
  }),

  // 評論 API
  reviews: router({
    // 取得店家評論
    byStoreId: publicProcedure
      .input(z.object({ storeId: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getReviewsByStoreId(input.storeId, input.limit);
      }),
  }),

  // 照片 API
  photos: router({
    // 取得店家照片
    byStoreId: publicProcedure
      .input(z.object({ storeId: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPhotosByStoreId(input.storeId, input.limit);
      }),
  }),

  // 菜單 API
  menu: router({
    // 取得店家菜單
    byStoreId: publicProcedure
      .input(z.object({ storeId: z.string() }))
      .query(async ({ input }) => {
        return await db.getMenuItems(input.storeId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
