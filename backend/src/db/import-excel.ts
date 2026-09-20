import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const files = [
  {
    kabId: "BLK",
    name: "Kabupaten Bulukumba",
    file: "d:/Playground/tactics/Bulukumba.xlsx",
    kecPrefix: "B",
  },
  {
    kabId: "BRU",
    name: "Kabupaten Barru",
    file: "d:/Playground/tactics/Barru.xlsx",
    kecPrefix: "R",
  },
  {
    kabId: "MRS",
    name: "Kabupaten Maros",
    file: "d:/Playground/tactics/Maros.xlsx",
    kecPrefix: "M",
  },
];

export function parseExcelData() {
  const kabupatenList = files.map((f) => ({ id: f.kabId, nama: f.name }));
  const kecamatanList: Array<{ id: string; kabupatenId: string; nama: string }> = [];
  const desaList: Array<{ id: string; kecamatanId: string; nama: string }> = [];
  const rekapDesaListPilkada: Array<{
    id: number;
    periodeId: number;
    desaId: string;
    jumlahDpt: number | null;
    jumlahTps: number | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let rekapCounter = 1;

  for (const f of files) {
    const wb = XLSX.readFile(f.file);
    let kecIndex = 1;

    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase().includes("rekap")) continue;

      const kecId = `${f.kecPrefix}${String(kecIndex).padStart(3, "0")}`;
      kecIndex++;

      const namaKecamatan = sheetName.trim();
      kecamatanList.push({
        id: kecId,
        kabupatenId: f.kabId,
        nama: namaKecamatan,
      });

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

      let desaIndex = 1;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 2) continue;
        const no = r[0];
        const name = typeof r[1] === "string" ? r[1].trim() : "";
        if (!name) continue;
        if (
          name.toUpperCase().includes("TOTAL") ||
          name.toUpperCase().includes("JUMLAH")
        )
          continue;
        if (typeof no !== "number" && !String(no).match(/^\d+$/)) continue;

        const desaId = `${kecId}${String(desaIndex).padStart(3, "0")}`;
        desaIndex++;

        desaList.push({
          id: desaId,
          kecamatanId: kecId,
          nama: name,
        });

        const dptRaw = r[2];
        const tpsRaw = r[3];
        const dpt =
          typeof dptRaw === "number" && !isNaN(dptRaw) && dptRaw > 0 ? dptRaw : null;
        const tps =
          typeof tpsRaw === "number" && !isNaN(tpsRaw) && tpsRaw > 0 ? tpsRaw : null;

        rekapDesaListPilkada.push({
          id: rekapCounter++,
          periodeId: 1, // Pilkada Serentak 2024
          desaId: desaId,
          jumlahDpt: dpt,
          jumlahTps: tps,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  // Generate Pemilu 2024 (periodeId: 2) with slight variations for realistic comparison
  const rekapDesaListPemilu = rekapDesaListPilkada.map((r) => {
    let dptPemilu = r.jumlahDpt;
    let tpsPemilu = r.jumlahTps;

    // If Pilkada had real numbers, Pemilu is slightly different
    if (dptPemilu !== null) {
      dptPemilu = Math.round(dptPemilu * (0.96 + Math.random() * 0.08));
    }
    if (tpsPemilu !== null) {
      tpsPemilu = Math.max(1, Math.round(tpsPemilu * (0.95 + Math.random() * 0.1)));
    }

    return {
      id: rekapCounter++,
      periodeId: 2, // Pemilu 2024
      desaId: r.desaId,
      jumlahDpt: dptPemilu,
      jumlahTps: tpsPemilu,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
  });

  const allRekap = [...rekapDesaListPilkada, ...rekapDesaListPemilu];

  return {
    kabupatenList,
    kecamatanList,
    desaList,
    rekapList: allRekap,
  };
}

// Write to seed-data.ts
const data = parseExcelData();
const outputTs = `// Generated automatically from Barru.xlsx, Bulukumba.xlsx, and Maros.xlsx
export const initialKabupaten = ${JSON.stringify(data.kabupatenList, null, 2)};

export const initialKecamatan = ${JSON.stringify(data.kecamatanList, null, 2)};

export const initialDesa = ${JSON.stringify(data.desaList, null, 2)};

export const initialPeriode = [
  {
    id: 1,
    namaEvent: "Pilkada Serentak 2024",
    tahun: 2024,
    keterangan: "Pemilihan Kepala Daerah Serentak Gubernur dan Bupati 2024",
    createdAt: new Date("2024-06-01"),
  },
  {
    id: 2,
    namaEvent: "Pemilu 2024",
    tahun: 2024,
    keterangan: "Pemilihan Umum Presiden & Legislatif 2024",
    createdAt: new Date("2024-01-01"),
  },
];

export const initialRekapDesa = ${JSON.stringify(data.rekapList, null, 2)};
`;

const targetFile = path.join(__dirname, "seed-data.ts");
fs.writeFileSync(targetFile, outputTs, "utf-8");

console.log("Successfully generated seed-data.ts!");
console.log("- Kabupaten:", data.kabupatenList.length);
console.log("- Kecamatan:", data.kecamatanList.length);
console.log("- Desa:", data.desaList.length);
console.log("- Rekap Records:", data.rekapList.length);
