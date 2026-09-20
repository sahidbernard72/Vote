import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db, testDbConnection } from "./db";
import {
  kabupaten,
  kecamatan,
  desa,
  periodeRekap,
  rekapDesa,
} from "./db/schema";
import { eq, and } from "drizzle-orm";
import {
  initialKabupaten,
  initialKecamatan,
  initialDesa,
  initialPeriode,
  initialRekapDesa,
} from "./db/seed-data";

// Filter aktif: Sembunyikan Maros dan Barru terlebih dahulu, fokus pada Bulukumba
const ACTIVE_KABUPATEN_IDS = ["BLK"];

// Fallback in-memory stores (difilter untuk Bulukumba)
let mockKabupaten = initialKabupaten.filter((k) => ACTIVE_KABUPATEN_IDS.includes(k.id));
let mockKecamatan = initialKecamatan.filter((kc) => ACTIVE_KABUPATEN_IDS.includes(kc.kabupatenId));
const activeKecIds = mockKecamatan.map((kc) => kc.id);
let mockDesa = initialDesa.filter((d) => activeKecIds.includes(d.kecamatanId));
let mockPeriode = [...initialPeriode];
const activeDesaIds = mockDesa.map((d) => d.id);
let mockRekapDesa = initialRekapDesa.filter((r) => activeDesaIds.includes(r.desaId));

// Auto-seed function for MySQL if connected
async function autoSeedDatabase() {
  try {
    const dbStatus = await testDbConnection();
    if (!dbStatus.connected) return;

    const existingKab = await db.select().from(kabupaten);
    if (existingKab.length === 0) {
      console.log("🌱 Auto-seeding database master wilayah: Bulukumba, Barru, Maros...");
      for (const k of initialKabupaten) {
        await db.insert(kabupaten).values(k).onDuplicateKeyUpdate({ set: { nama: k.nama } });
      }
      for (const kc of initialKecamatan) {
        await db.insert(kecamatan).values(kc).onDuplicateKeyUpdate({ set: { nama: kc.nama } });
      }
      for (const d of initialDesa) {
        await db.insert(desa).values(d).onDuplicateKeyUpdate({ set: { nama: d.nama } });
      }
      for (const p of initialPeriode) {
        await db.insert(periodeRekap).values(p).onDuplicateKeyUpdate({ set: { namaEvent: p.namaEvent } });
      }
      for (const r of initialRekapDesa) {
        await db.insert(rekapDesa).values(r).onDuplicateKeyUpdate({
          set: {
            jumlahDpt: r.jumlahDpt,
            jumlahTps: r.jumlahTps,
          },
        });
      }
      console.log("✅ Auto-seeding selesai!");
    }
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
}

// Trigger initial seed check
autoSeedDatabase();

const app = new Elysia()
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Sistem Rekapitulasi DPT & TPS Wilayah (Bulukumba, Barru, Maros)",
          version: "2.1.0",
          description:
            "Agregasi Berjenjang Single Source of Truth dari Desa -> Kecamatan -> Kabupaten (Bulukumba, Barru, Maros)",
        },
      },
    })
  )
  .get("/", () => ({
    message: "DPT Rekap API Server (Bulukumba, Barru, Maros) berjalan dengan ElysiaJS",
    docs: "/swagger",
    health: "/api/health",
  }))

  // 1. Health Check & Seed Trigger
  .get("/api/health", async () => {
    const dbStatus = await testDbConnection();
    return {
      status: "online",
      serverTime: new Date().toISOString(),
      database: dbStatus,
    };
  })
  .post("/api/seed", async ({ set }) => {
    const dbStatus = await testDbConnection();
    if (!dbStatus.connected) {
      set.status = 503;
      return { success: false, message: "MySQL belum terhubung. " + dbStatus.message };
    }

    try {
      await autoSeedDatabase();
      return { success: true, message: "Data master wilayah Bulukumba, Barru, Maros berhasil disemai ke MySQL!" };
    } catch (e: any) {
      set.status = 500;
      return { success: false, error: e.message };
    }
  })

  // 2. Master Wilayah (Cascading: Kabupaten -> Kecamatan -> Desa)
  .group("/api/wilayah", (w) =>
    w
      .get("/kabupaten", async () => {
        const dbStatus = await testDbConnection();
        if (dbStatus.connected) {
          try {
            const data = await db.select().from(kabupaten);
            if (data.length > 0) {
              const filtered = data.filter((k) => ACTIVE_KABUPATEN_IDS.includes(k.id));
              return { success: true, source: "mysql", data: filtered };
            }
          } catch (e) {
            console.error("DB error:", e);
          }
        }
        return { success: true, source: "mock", data: mockKabupaten };
      })
      .get("/kecamatan", async ({ query }) => {
        const kabId = query.kabupaten_id;
        const dbStatus = await testDbConnection();
        if (dbStatus.connected) {
          try {
            const q = kabId
              ? db.select().from(kecamatan).where(eq(kecamatan.kabupatenId, kabId))
              : db.select().from(kecamatan);
            const data = await q;
            if (data.length > 0) {
              const filtered = data.filter((k) => ACTIVE_KABUPATEN_IDS.includes(k.kabupatenId));
              return { success: true, source: "mysql", data: filtered };
            }
          } catch (e) {
            console.error("DB error:", e);
          }
        }

        const filtered = kabId
          ? mockKecamatan.filter((k) => k.kabupatenId === kabId)
          : mockKecamatan;
        return { success: true, source: "mock", data: filtered };
      })
      .get("/desa", async ({ query }) => {
        const kecId = query.kecamatan_id;
        const dbStatus = await testDbConnection();
        if (dbStatus.connected) {
          try {
            const q = kecId
              ? db.select().from(desa).where(eq(desa.kecamatanId, kecId))
              : db.select().from(desa);
            const data = await q;
            if (data.length > 0) return { success: true, source: "mysql", data };
          } catch (e) {
            console.error("DB error:", e);
          }
        }

        const filtered = kecId
          ? mockDesa.filter((d) => d.kecamatanId === kecId)
          : mockDesa;
        return { success: true, source: "mock", data: filtered };
      })
  )

  // 3. Periode Event
  .group("/api/periode", (p) =>
    p
      .get("/", async () => {
        const dbStatus = await testDbConnection();
        if (dbStatus.connected) {
          try {
            const data = await db.select().from(periodeRekap);
            if (data.length > 0) return { success: true, source: "mysql", data };
          } catch (e) {
            console.error("DB error:", e);
          }
        }
        return { success: true, source: "mock", data: mockPeriode };
      })
      .post(
        "/",
        async ({ body, set }) => {
          const dbStatus = await testDbConnection();
          if (dbStatus.connected) {
            try {
              await db.insert(periodeRekap).values({
                namaEvent: body.namaEvent,
                tahun: Number(body.tahun),
                keterangan: body.keterangan || null,
              });
              set.status = 201;
              return { success: true, message: "Periode rekap berhasil ditambahkan ke MySQL" };
            } catch (e: any) {
              set.status = 500;
              return { success: false, error: e.message };
            }
          }

          const newId = mockPeriode.length ? Math.max(...mockPeriode.map((x) => x.id)) + 1 : 1;
          const newP = {
            id: newId,
            namaEvent: body.namaEvent,
            tahun: Number(body.tahun),
            keterangan: body.keterangan || "",
            createdAt: new Date(),
          };
          mockPeriode.push(newP);
          set.status = 201;
          return { success: true, message: "Periode rekap berhasil ditambahkan (mock)", data: newP };
        },
        {
          body: t.Object({
            namaEvent: t.String({ minLength: 3 }),
            tahun: t.Numeric(),
            keterangan: t.Optional(t.String()),
          }),
        }
      )
  )

  // 4. Rekapitulasi Desa (Single Source of Truth)
  .group("/api/rekap", (r) =>
    r
      // Daftar seluruh desa dan status rekapitulasi pada periode tertentu
      .get("/", async ({ query }) => {
        const periodeId = Number(query.periode_id) || 1;
        const dbStatus = await testDbConnection();

        if (dbStatus.connected) {
          try {
            const results = await db
              .select({
                desaId: desa.id,
                namaDesa: desa.nama,
                kecamatanId: kecamatan.id,
                namaKecamatan: kecamatan.nama,
                kabupatenId: kabupaten.id,
                namaKabupaten: kabupaten.nama,
                rekapId: rekapDesa.id,
                jumlahDpt: rekapDesa.jumlahDpt,
                jumlahTps: rekapDesa.jumlahTps,
                updatedAt: rekapDesa.updatedAt,
              })
              .from(desa)
              .innerJoin(kecamatan, eq(desa.kecamatanId, kecamatan.id))
              .innerJoin(kabupaten, eq(kecamatan.kabupatenId, kabupaten.id))
              .leftJoin(
                rekapDesa,
                and(eq(rekapDesa.desaId, desa.id), eq(rekapDesa.periodeId, periodeId))
              );

            if (results.length > 0) {
              const filtered = results.filter((r) => ACTIVE_KABUPATEN_IDS.includes(r.kabupatenId));
              return { success: true, source: "mysql", periodeId, data: filtered };
            }
          } catch (e) {
            console.error("DB error in /rekap:", e);
          }
        }

        // Mock mode: gabungkan data mock desa, kec, kab, dan rekap
        const results = mockDesa.map((d) => {
          const kec = mockKecamatan.find((k) => k.id === d.kecamatanId);
          const kab = mockKabupaten.find((b) => b.id === kec?.kabupatenId);
          const rkp = mockRekapDesa.find(
            (r) => r.desaId === d.id && r.periodeId === periodeId
          );

          return {
            desaId: d.id,
            namaDesa: d.nama,
            kecamatanId: kec?.id || "",
            namaKecamatan: kec?.nama || "",
            kabupatenId: kab?.id || "",
            namaKabupaten: kab?.nama || "",
            rekapId: rkp?.id || null,
            jumlahDpt: rkp ? rkp.jumlahDpt : null,
            jumlahTps: rkp ? rkp.jumlahTps : null,
            updatedAt: rkp ? rkp.updatedAt : null,
          };
        });

        return { success: true, source: "mock", periodeId, data: results };
      })

      // Input / Update Rekapitulasi Desa (Mendukung Simpan NULL sesuai proses bisnis)
      .post(
        "/",
        async ({ body, set }) => {
          const periodeId = Number(body.periodeId);
          const desaId = body.desaId;
          const jumlahDpt =
            body.jumlahDpt !== undefined && body.jumlahDpt !== null && body.jumlahDpt !== ""
              ? Number(body.jumlahDpt)
              : null;
          const jumlahTps =
            body.jumlahTps !== undefined && body.jumlahTps !== null && body.jumlahTps !== ""
              ? Number(body.jumlahTps)
              : null;

          const dbStatus = await testDbConnection();
          if (dbStatus.connected) {
            try {
              await db
                .insert(rekapDesa)
                .values({
                  periodeId,
                  desaId,
                  jumlahDpt,
                  jumlahTps,
                })
                .onDuplicateKeyUpdate({
                  set: {
                    jumlahDpt,
                    jumlahTps,
                    updatedAt: new Date(),
                  },
                });

              return {
                success: true,
                message:
                  jumlahDpt !== null
                    ? `Data DPT & TPS Desa ${desaId} berhasil disimpan ke MySQL.`
                    : `Desa ${desaId} berhasil ditandai 'Data Belum Masuk' (NULL) di MySQL.`,
              };
            } catch (e: any) {
              set.status = 500;
              return { success: false, error: e.message };
            }
          }

          // Mock Upsert
          const existingIndex = mockRekapDesa.findIndex(
            (r) => r.periodeId === periodeId && r.desaId === desaId
          );
          if (existingIndex >= 0) {
            mockRekapDesa[existingIndex].jumlahDpt = jumlahDpt;
            mockRekapDesa[existingIndex].jumlahTps = jumlahTps;
            mockRekapDesa[existingIndex].updatedAt = new Date();
          } else {
            const nextId = mockRekapDesa.length
              ? Math.max(...mockRekapDesa.map((r) => r.id)) + 1
              : 1;
            mockRekapDesa.push({
              id: nextId,
              periodeId,
              desaId,
              jumlahDpt,
              jumlahTps,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          return {
            success: true,
            message:
              jumlahDpt !== null
                ? `Data DPT & TPS Desa ${desaId} berhasil disimpan (mock state).`
                : `Desa ${desaId} berhasil ditandai 'Data Belum Masuk' (NULL) (mock state).`,
          };
        },
        {
          body: t.Object({
            periodeId: t.Numeric(),
            desaId: t.String(),
            jumlahDpt: t.Optional(t.Nullable(t.Any())),
            jumlahTps: t.Optional(t.Nullable(t.Any())),
          }),
        }
      )

      // Agregasi Otomatis Berjenjang (Kecamatan, Kabupaten, dan Drill-Down Hierarchy)
      .get("/stats", async ({ query }) => {
        const periodeId = Number(query.periode_id) || 1;
        const dbStatus = await testDbConnection();

        let list: Array<{
          desaId: string;
          namaDesa: string;
          kecamatanId: string;
          namaKecamatan: string;
          kabupatenId: string;
          namaKabupaten: string;
          jumlahDpt: number | null;
          jumlahTps: number | null;
        }> = [];

        if (dbStatus.connected) {
          try {
            const results = await db
              .select({
                desaId: desa.id,
                namaDesa: desa.nama,
                kecamatanId: kecamatan.id,
                namaKecamatan: kecamatan.nama,
                kabupatenId: kabupaten.id,
                namaKabupaten: kabupaten.nama,
                jumlahDpt: rekapDesa.jumlahDpt,
                jumlahTps: rekapDesa.jumlahTps,
              })
              .from(desa)
              .innerJoin(kecamatan, eq(desa.kecamatanId, kecamatan.id))
              .innerJoin(kabupaten, eq(kecamatan.kabupatenId, kabupaten.id))
              .leftJoin(
                rekapDesa,
                and(eq(rekapDesa.desaId, desa.id), eq(rekapDesa.periodeId, periodeId))
              );

            if (results.length > 0) {
              list = results.filter((r) => ACTIVE_KABUPATEN_IDS.includes(r.kabupatenId));
            }
          } catch (e) {
            console.error("DB error in stats:", e);
          }
        }

        if (list.length === 0) {
          list = mockDesa.map((d) => {
            const kec = mockKecamatan.find((k) => k.id === d.kecamatanId);
            const kab = mockKabupaten.find((b) => b.id === kec?.kabupatenId);
            const rkp = mockRekapDesa.find(
              (r) => r.desaId === d.id && r.periodeId === periodeId
            );
            return {
              desaId: d.id,
              namaDesa: d.nama,
              kecamatanId: kec?.id || "",
              namaKecamatan: kec?.nama || "",
              kabupatenId: kab?.id || "",
              namaKabupaten: kab?.nama || "",
              jumlahDpt: rkp ? rkp.jumlahDpt : null,
              jumlahTps: rkp ? rkp.jumlahTps : null,
            };
          });
        }

        // Kalkulasi Agregasi Keseluruhan & Berjenjang
        let totalDpt = 0;
        let totalTps = 0;
        let totalDesa = list.length;
        let desaTerlapor = 0;
        let desaBelumMasuk = 0;

        // Peta Kabupaten
        const kabupatenMap: Record<
          string,
          {
            kabupatenId: string;
            namaKabupaten: string;
            totalDpt: number;
            totalTps: number;
            totalDesa: number;
            desaTerlapor: number;
            desaBelumMasuk: number;
            progressPercent: number;
            kecamatanMap: Record<
              string,
              {
                kecamatanId: string;
                namaKecamatan: string;
                kabupatenId: string;
                totalDpt: number;
                totalTps: number;
                desaCount: number;
                desaTerlapor: number;
                desaBelumMasuk: number;
                desasList: Array<{
                  desaId: string;
                  namaDesa: string;
                  jumlahDpt: number | null;
                  jumlahTps: number | null;
                  status: "TERISI" | "BELUM_MASUK";
                }>;
              }
            >;
          }
        > = {};

        for (const item of list) {
          const hasRealData = item.jumlahDpt !== null && item.jumlahDpt !== undefined;
          if (hasRealData) {
            desaTerlapor++;
          } else {
            desaBelumMasuk++;
          }

          const dpt = item.jumlahDpt || 0;
          const tps = item.jumlahTps || 0;

          totalDpt += dpt;
          totalTps += tps;

          // Inisialisasi Kabupaten jika belum ada
          if (!kabupatenMap[item.kabupatenId]) {
            kabupatenMap[item.kabupatenId] = {
              kabupatenId: item.kabupatenId,
              namaKabupaten: item.namaKabupaten,
              totalDpt: 0,
              totalTps: 0,
              totalDesa: 0,
              desaTerlapor: 0,
              desaBelumMasuk: 0,
              progressPercent: 0,
              kecamatanMap: {},
            };
          }

          const kabObj = kabupatenMap[item.kabupatenId];
          kabObj.totalDesa++;
          if (hasRealData) {
            kabObj.desaTerlapor++;
            kabObj.totalDpt += dpt;
            kabObj.totalTps += tps;
          } else {
            kabObj.desaBelumMasuk++;
          }

          // Inisialisasi Kecamatan di dalam Kabupaten
          if (!kabObj.kecamatanMap[item.kecamatanId]) {
            kabObj.kecamatanMap[item.kecamatanId] = {
              kecamatanId: item.kecamatanId,
              namaKecamatan: item.namaKecamatan,
              kabupatenId: item.kabupatenId,
              totalDpt: 0,
              totalTps: 0,
              desaCount: 0,
              desaTerlapor: 0,
              desaBelumMasuk: 0,
              desasList: [],
            };
          }

          const kecObj = kabObj.kecamatanMap[item.kecamatanId];
          kecObj.desaCount++;
          if (hasRealData) {
            kecObj.desaTerlapor++;
            kecObj.totalDpt += dpt;
            kecObj.totalTps += tps;
          } else {
            kecObj.desaBelumMasuk++;
          }

          // Tambah ke daftar desa
          kecObj.desasList.push({
            desaId: item.desaId,
            namaDesa: item.namaDesa,
            jumlahDpt: item.jumlahDpt,
            jumlahTps: item.jumlahTps,
            status: hasRealData ? "TERISI" : "BELUM_MASUK",
          });
        }

        // Format array kabupaten dan hitung persentase
        const byKabupaten = Object.values(kabupatenMap).map((k) => {
          k.progressPercent =
            k.totalDesa > 0 ? Number(((k.desaTerlapor / k.totalDesa) * 100).toFixed(1)) : 0;
          return {
            ...k,
            kecamatanList: Object.values(k.kecamatanMap),
          };
        });

        // Flat array seluruh kecamatan
        const byKecamatan = byKabupaten.flatMap((k) => k.kecamatanList);

        const progressPercent = totalDesa > 0 ? Number(((desaTerlapor / totalDesa) * 100).toFixed(1)) : 0;

        return {
          periodeId,
          totalDpt,
          totalTps,
          totalDesa,
          desaTerlapor,
          desaBelumMasuk,
          progressPercent,
          byKabupaten,
          byKecamatan,
        };
      })
  )
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: "0.0.0.0",
  });

console.log(
  `🚀 Elysia server berjalan di http://0.0.0.0:${Number(process.env.PORT) || 3000}`
);
