import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. MASTER WILAYAH
// ==========================================

export const kabupaten = mysqlTable("kabupaten", {
  id: varchar("id", { length: 3 }).primaryKey(), // e.g., '001' atau 'BLK'
  nama: varchar("nama", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const kecamatan = mysqlTable("kecamatan", {
  id: varchar("id", { length: 4 }).primaryKey(), // e.g., '0101' atau 'K001'
  kabupatenId: varchar("kabupaten_id", { length: 3 })
    .notNull()
    .references(() => kabupaten.id, { onDelete: "cascade" }),
  nama: varchar("nama", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const desa = mysqlTable("desa", {
  id: varchar("id", { length: 7 }).primaryKey(), // e.g., '0101001'
  kecamatanId: varchar("kecamatan_id", { length: 4 })
    .notNull()
    .references(() => kecamatan.id, { onDelete: "cascade" }),
  nama: varchar("nama", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==========================================
// 2. PERIODE EVENT
// ==========================================

export const periodeRekap = mysqlTable("periode_rekap", {
  id: int("id").autoincrement().primaryKey(),
  namaEvent: varchar("nama_event", { length: 100 }).notNull(), // e.g., 'Pemilu 2024', 'Pilkada 2024'
  tahun: int("tahun").notNull(),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 3. TRANSAKSI REKAP (SINGLE SOURCE OF TRUTH)
// ==========================================

export const rekapDesa = mysqlTable(
  "rekap_desa",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    periodeId: int("periode_id")
      .notNull()
      .references(() => periodeRekap.id, { onDelete: "cascade" }),
    desaId: varchar("desa_id", { length: 7 })
      .notNull()
      .references(() => desa.id, { onDelete: "cascade" }),
    jumlahDpt: int("jumlah_dpt"), // Nullable jika data pemilih desa belum tersedia
    jumlahTps: int("jumlah_tps"), // Nullable jika data TPS desa belum tersedia
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_periode_desa").on(table.periodeId, table.desaId),
  ]
);

// ==========================================
// RELASI (Drizzle ORM Relations)
// ==========================================

export const kabupatenRelations = relations(kabupaten, ({ many }) => ({
  kecamatanList: many(kecamatan),
}));

export const kecamatanRelations = relations(kecamatan, ({ one, many }) => ({
  kabupaten: one(kabupaten, {
    fields: [kecamatan.kabupatenId],
    references: [kabupaten.id],
  }),
  desaList: many(desa),
}));

export const desaRelations = relations(desa, ({ one, many }) => ({
  kecamatan: one(kecamatan, {
    fields: [desa.kecamatanId],
    references: [kecamatan.id],
  }),
  rekapList: many(rekapDesa),
}));

export const periodeRekapRelations = relations(periodeRekap, ({ many }) => ({
  rekapList: many(rekapDesa),
}));

export const rekapDesaRelations = relations(rekapDesa, ({ one }) => ({
  periode: one(periodeRekap, {
    fields: [rekapDesa.periodeId],
    references: [periodeRekap.id],
  }),
  desa: one(desa, {
    fields: [rekapDesa.desaId],
    references: [desa.id],
  }),
}));

export type Kabupaten = typeof kabupaten.$inferSelect;
export type Kecamatan = typeof kecamatan.$inferSelect;
export type Desa = typeof desa.$inferSelect;
export type PeriodeRekap = typeof periodeRekap.$inferSelect;
export type RekapDesa = typeof rekapDesa.$inferSelect;
