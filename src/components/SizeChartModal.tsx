import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ruler } from "lucide-react";

type SizeRow = { size: string; [key: string]: number | string };

type ChartColumn = {
  key: string;
  label: string;
  /** If true, show both in/cm side-by-side instead of toggling */
  showBoth?: boolean;
};

interface ChartConfig {
  title: string;
  subtitle: string;
  sizes: SizeRow[];
  columns: ChartColumn[];
  note: string;
}

const standardSizes: SizeRow[] = [
  { size: "Small", chest: 18, length: 26 },
  { size: "Medium", chest: 20, length: 28 },
  { size: "Large", chest: 22, length: 30 },
  { size: "X-Large", chest: 24, length: 31 },
  { size: "2X-Large", chest: 26, length: 33 },
  { size: "3X-Large", chest: 27, length: 34 },
  { size: "4X-Large", chest: 28, length: 35 },
  { size: "5X-Large", chest: 29, length: 36 },
];

const premiumSizes: SizeRow[] = [
  { size: "Small", chest: 17, length: 28 },
  { size: "Medium", chest: 18, length: 29 },
  { size: "Large", chest: 21.5, length: 30 },
  { size: "X-Large", chest: 23, length: 31 },
  { size: "2X-Large", chest: 24.5, length: 32 },
  { size: "3X-Large", chest: 26, length: 33 },
  { size: "4X-Large", chest: 27.5, length: 34 },
  { size: "5X-Large", chest: 29, length: 35 },
];

const oneTonSizes: SizeRow[] = [
  { size: "Small", chest: 18, length: 27 },
  { size: "Medium", chest: 20, length: 28 },
  { size: "Large", chest: 22, length: 29 },
  { size: "X-Large", chest: 24, length: 30 },
  { size: "2X-Large", chest: 26, length: 31 },
  { size: "3X-Large", chest: 28, length: 32 },
  { size: "4X-Large", chest: 30, length: 33 },
  { size: "5X-Large", chest: 32, length: 34 },
];

const babyDollSizes: SizeRow[] = [
  { size: "X-Small - 0", chest: 12.75, length: 25 },
  { size: "Small - 2-4", chest: 13.25, length: 26 },
  { size: "Medium - 5-7", chest: 13.75, length: 27 },
  { size: "Large - 10", chest: 14.25, length: 28 },
  { size: "X-Large - 12-14", chest: 14.75, length: 29 },
  { size: "2X-Large - 16", chest: 15.25, length: 30 },
];

const bikiniTopSizes: SizeRow[] = [
  { size: "X-Small", chest: 32 },
  { size: "Small", chest: 34 },
  { size: "Medium", chest: 36 },
  { size: "Large", chest: 38 },
  { size: "X-Large", chest: 40 },
];

const bikiniBottomSizes: SizeRow[] = [
  { size: "X-Small", waist: 27.5 },
  { size: "Small", waist: 28.5 },
  { size: "Medium", waist: 29.5 },
  { size: "Large", waist: 30.5 },
  { size: "X-Large", waist: 32 },
];

const boyShortsizes: SizeRow[] = [
  { size: "X-Small", waist: "24-25" },
  { size: "Small", waist: "26-27" },
  { size: "Medium", waist: "28-29" },
  { size: "Large", waist: "30-31" },
  { size: "X-Large", waist: "32-33" },
];

const braletteSizes: SizeRow[] = [
  { size: "X-Small", chest: "32-33" },
  { size: "Small", chest: "34-35" },
  { size: "Medium", chest: "36-37" },
  { size: "Large", chest: "38-39" },
  { size: "X-Large", chest: "40-41" },
];

const mensBoxersSizes: SizeRow[] = [
  { size: "Small", waist: "28-30", waist_cm: "71.1 - 76.2", length: 14.5, inseam: 7.5 },
  { size: "Medium", waist: "30-32", waist_cm: "76.2 - 81.2", length: 14.5, inseam: 7.5 },
  { size: "Large", waist: "33-35", waist_cm: "83.8 - 88.9", length: 14.5, inseam: 7.5 },
  { size: "X-Large", waist: "36-38", waist_cm: "91.4 - 96.5", length: 15.5, inseam: 7.5 },
  { size: "2X-Large", waist: "40-42", waist_cm: "101.6 - 106.6", length: 15.5, inseam: 7.5 },
];

const chinoPantsSizes: SizeRow[] = [
  { size: "Small", waist: 30, thigh: 24.5, leg_opening: 14.5, inseam: 32 },
  { size: "Medium", waist: 32, thigh: 25.5, leg_opening: 15, inseam: 32 },
  { size: "Large", waist: 34, thigh: 26.5, leg_opening: 15.5, inseam: 32 },
  { size: "X-Large", waist: 36, thigh: 27.5, leg_opening: 16, inseam: 32 },
  { size: "2X-Large", waist: 38, thigh: 28.5, leg_opening: 16.5, inseam: 32 },
  { size: "3X-Large", waist: 40, thigh: 29.5, leg_opening: 17, inseam: 32 },
  { size: "4X-Large", waist: 42, thigh: 30.5, leg_opening: 17.5, inseam: 32 },
];

const eWaistPantsSizes: SizeRow[] = [
  { size: "Small", waist: "28-30", waist_cm: "71.1 - 76.2", inseam: 32 },
  { size: "Medium", waist: "30-32", waist_cm: "76.2 - 81.2", inseam: 32 },
  { size: "Large", waist: "33-35", waist_cm: "83.8 - 88.9", inseam: 32 },
  { size: "X-Large", waist: "36-38", waist_cm: "91.4 - 96.5", inseam: 32 },
  { size: "2X-Large", waist: "40-42", waist_cm: "101.6 - 106.6", inseam: 32 },
  { size: "3X-Large", waist: "44-46", waist_cm: "111.76 - 116.84", inseam: 32 },
];

const cargoPantSizes: SizeRow[] = [
  { size: "Small", waist: 30, thigh: 25.5, leg_opening: 15.5, inseam: 32 },
  { size: "Medium", waist: 32, thigh: 26.5, leg_opening: 16, inseam: 32 },
  { size: "Large", waist: 34, thigh: 27.5, leg_opening: 16.5, inseam: 32 },
  { size: "X-Large", waist: 36, thigh: 28.5, leg_opening: 17, inseam: 32 },
  { size: "2X-Large", waist: 38, thigh: 29.5, leg_opening: 17.5, inseam: 32 },
  { size: "3X-Large", waist: 40, thigh: 30.5, leg_opening: 18, inseam: 32 },
  { size: "4X-Large", waist: 42, thigh: 31.5, leg_opening: 18.5, inseam: 32 },
];

const eWaistShortsSizes: SizeRow[] = [
  { size: "Small", waist: "28-30", waist_cm: "71.1 - 76.2" },
  { size: "Medium", waist: "30-32", waist_cm: "76.2 - 81.2" },
  { size: "Large", waist: "33-35", waist_cm: "83.8 - 88.9" },
  { size: "X-Large", waist: "36-38", waist_cm: "91.4 - 96.5" },
  { size: "2X-Large", waist: "40-42", waist_cm: "101.6 - 106.6" },
];

const flannelSizes: SizeRow[] = [
  { size: "Small", chest: 20.5, body_length: 28.5, sleeve: 27 },
  { size: "Medium", chest: 22.5, body_length: 29.5, sleeve: 27.5 },
  { size: "Large", chest: 23.5, body_length: 30.5, sleeve: 28 },
  { size: "X-Large", chest: 24.5, body_length: 31.5, sleeve: 28.5 },
  { size: "2X-Large", chest: 25.5, body_length: 32.5, sleeve: 29 },
  { size: "3X-Large", chest: 26.5, body_length: 33.5, sleeve: 29.5 },
  { size: "4X-Large", chest: 27.5, body_length: 34.5, sleeve: 30 },
  { size: "5X-Large", chest: 28.5, body_length: 35.5, sleeve: 30.5 },
];

const fleeceSizes: SizeRow[] = [
  { size: "Small", chest: 21.5, length: 28 },
  { size: "Medium", chest: 22.5, length: 29 },
  { size: "Large", chest: 23.5, length: 30 },
  { size: "X-Large", chest: 25, length: 31 },
  { size: "2X-Large", chest: 26.5, length: 32 },
  { size: "3X-Large", chest: 28, length: 33.5 },
  { size: "4X-Large", chest: 29.5, length: 35 },
  { size: "5X-Large", chest: 31, length: 36.5 },
];

const frenchTerryLSSizes: SizeRow[] = [
  { size: "Small", chest: 18, length: 27, sleeve: 25 },
  { size: "Medium", chest: 20, length: 28, sleeve: 25.5 },
  { size: "Large", chest: 21, length: 29, sleeve: 26 },
  { size: "X-Large", chest: 23, length: 30, sleeve: 26.5 },
  { size: "2X-Large", chest: 24, length: 31, sleeve: 27 },
  { size: "3X-Large", chest: 26, length: 32, sleeve: 27.5 },
  { size: "4X-Large", chest: 27, length: 33, sleeve: 28 },
  { size: "5X-Large", chest: 29, length: 34, sleeve: 28.5 },
];

const hwPulloverSizes: SizeRow[] = [
  { size: "Small", chest: 20.5, length: 28 },
  { size: "Medium", chest: 22.5, length: 29 },
  { size: "Large", chest: 24.5, length: 30 },
  { size: "X-Large", chest: 26.5, length: 31 },
  { size: "2X-Large", chest: 28.5, length: 32 },
  { size: "3X-Large", chest: 30.5, length: 33 },
  { size: "4X-Large", chest: 32.5, length: 34 },
  { size: "5X-Large", chest: 34.5, length: 35 },
];

const jacketSizes: SizeRow[] = [
  { size: "Small", chest: 20.5, body_length: 28.5, sleeve: 27 },
  { size: "Medium", chest: 22.5, body_length: 29.5, sleeve: 27.5 },
  { size: "Large", chest: 23.5, body_length: 30.5, sleeve: 28 },
  { size: "X-Large", chest: 24.5, body_length: 31.5, sleeve: 28.5 },
  { size: "2X-Large", chest: 25.5, body_length: 32.5, sleeve: 29 },
  { size: "3X-Large", chest: 26.5, body_length: 33.5, sleeve: 29.5 },
  { size: "4X-Large", chest: 27.5, body_length: 34.5, sleeve: 30 },
  { size: "5X-Large", chest: 28.5, body_length: 35.5, sleeve: 30.5 },
];

const jerseyShortsizes: SizeRow[] = [
  { size: "Small", waist: 26, inseam: 8.5 },
  { size: "Medium", waist: 28, inseam: 8.5 },
  { size: "Large", waist: 30, inseam: 8.5 },
  { size: "X-Large", waist: 32, inseam: 8.5 },
  { size: "2X-Large", waist: 34, inseam: 8.5 },
  { size: "3X-Large", waist: 36, inseam: 8.5 },
];

const tankJerseySizes: SizeRow[] = [
  { size: "Small", chest: 20.25, length: 28 },
  { size: "Medium", chest: 21.25, length: 29 },
  { size: "Large", chest: 22.25, length: 30 },
  { size: "X-Large", chest: 23.75, length: 31 },
  { size: "2X-Large", chest: 25.25, length: 32 },
  { size: "3X-Large", chest: 26.75, length: 33.5 },
  { size: "4X-Large", chest: 28.25, length: 35 },
  { size: "5X-Large", chest: 29.75, length: 36.5 },
];

const beltSizes: SizeRow[] = [
  { size: "Small", waist: "30-32", length: "39" },
  { size: "Medium", waist: "32-35", length: "41" },
  { size: "Large", waist: "36-38", length: "44" },
  { size: "X-Large", waist: "39-41", length: "46" },
  { size: "2X-Large", waist: "42-42", length: "50" },
];

const poloSizes: SizeRow[] = [
  { size: "Small", chest: 20, length: 28 },
  { size: "Medium", chest: 21, length: 29 },
  { size: "Large", chest: 22, length: 30 },
  { size: "X-Large", chest: 23.5, length: 31 },
  { size: "2X-Large", chest: 25, length: 32 },
  { size: "3X-Large", chest: 26.5, length: 33.5 },
];

const pajamaPantsSizes: SizeRow[] = [
  { size: "Small", waist: "28-30", inseam: 28 },
  { size: "Medium", waist: "30-32", inseam: 29 },
  { size: "Large", waist: "34-36", inseam: 30 },
  { size: "X-Large", waist: "38-40", inseam: 31 },
  { size: "2X-Large", waist: "42-44", inseam: 32 },
];

const sweatshirtSizes: SizeRow[] = [
  { size: "Small", chest: 20, length: 28 },
  { size: "Medium", chest: 22, length: 29 },
  { size: "Large", chest: 24, length: 30 },
  { size: "X-Large", chest: 26, length: 31 },
  { size: "2X-Large", chest: 28, length: 32 },
  { size: "3X-Large", chest: 30, length: 33 },
  { size: "4X-Large", chest: 32, length: 34 },
  { size: "5X-Large", chest: 34, length: 35 },
];

const walkshortsSizes: SizeRow[] = [
  { size: "30", waist: "30-33", inseam: 11 },
  { size: "32", waist: "32-35", inseam: 11 },
  { size: "34", waist: "34-37", inseam: 11 },
  { size: "36", waist: "36-39", inseam: 11 },
  { size: "38", waist: "38-41", inseam: 11 },
  { size: "40", waist: "40-43", inseam: 11 },
  { size: "42", waist: "42-45", inseam: 11 },
];

const sweatpantsSizes: SizeRow[] = [
  { size: "Small", waist: "27-28", inseam: 29 },
  { size: "Medium", waist: "29-30", inseam: 29 },
  { size: "Large", waist: "31-32", inseam: 29 },
  { size: "X-Large", waist: "33-34", inseam: 29 },
  { size: "2X-Large", waist: "35-36", inseam: 29 },
  { size: "3X-Large", waist: "37-39", inseam: 29 },
  { size: "4X-Large", waist: "40-42", inseam: 29 },
];

const sweatshortsSizes: SizeRow[] = [
  { size: "Small", waist: "28-30" },
  { size: "Medium", waist: "30-32" },
  { size: "Large", waist: "33-35" },
  { size: "X-Large", waist: "36-38" },
  { size: "2X-Large", waist: "40-42" },
];

const mensTankSizes: SizeRow[] = [
  { size: "Small", chest: 20.25, length: 27 },
  { size: "Medium", chest: 21.25, length: 29 },
  { size: "Large", chest: 22.75, length: 31 },
  { size: "X-Large", chest: 24.25, length: 32 },
  { size: "2X-Large", chest: 26, length: 33 },
  { size: "3X-Large", chest: 27.5, length: 34 },
  { size: "4X-Large", chest: 29, length: 35 },
  { size: "5X-Large", chest: 30.5, length: 36 },
];

const thermalLSSizes: SizeRow[] = [
  { size: "Small", chest: 18, length: 27, sleeve: 25 },
  { size: "Medium", chest: 20, length: 28, sleeve: 25.5 },
  { size: "Large", chest: 21, length: 29, sleeve: 26 },
  { size: "X-Large", chest: 23, length: 30, sleeve: 26.5 },
  { size: "2X-Large", chest: 24, length: 31, sleeve: 27 },
  { size: "3X-Large", chest: 26, length: 32, sleeve: 27.5 },
  { size: "4X-Large", chest: 27, length: 33, sleeve: 28 },
  { size: "5X-Large", chest: 29, length: 34, sleeve: 28.5 },
];

const thongSizes: SizeRow[] = [
  { size: "X-Small", waist: "24-25" },
  { size: "Small", waist: "26-27" },
  { size: "Medium", waist: "28-29" },
  { size: "Large", waist: "30-31" },
  { size: "X-Large", waist: "32-33" },
];

const womensBoyTeeSizes: SizeRow[] = [
  { size: "X-Small - 0", chest: 16, length: 26 },
  { size: "Small - 2-4", chest: 17, length: 27 },
  { size: "Medium - 5-7", chest: 18.5, length: 28 },
  { size: "Large - 10", chest: 20, length: 29 },
  { size: "X-Large - 12-14", chest: 21.5, length: 30 },
  { size: "2X-Large - 16", chest: 23, length: 31 },
];

const womensCropTopSizes: SizeRow[] = [
  { size: "X-Small", chest: 20, length: 17 },
  { size: "Small", chest: 21, length: 17.5 },
  { size: "Medium", chest: 22, length: 18 },
  { size: "Large", chest: 23, length: 18.5 },
  { size: "X-Large", chest: 24, length: 19 },
  { size: "2X-Large", chest: 25, length: 19.5 },
];

const womensSweatpantsSizes: SizeRow[] = [
  { size: "X-Small", waist: 25, inseam: "" },
  { size: "Small", waist: 27, inseam: 29 },
  { size: "Medium", waist: 29, inseam: 29 },
  { size: "Large", waist: 31, inseam: 29 },
  { size: "X-Large", waist: 33, inseam: 29 },
  { size: "2X-Large", waist: 35, inseam: 29 },
];

const wovenSizes: SizeRow[] = [
  { size: "Small", chest: 21.5, length: 29 },
  { size: "Medium", chest: 22.5, length: 30 },
  { size: "Large", chest: 23.5, length: 31 },
  { size: "X-Large", chest: 25, length: 32 },
  { size: "2X-Large", chest: 26.5, length: 33 },
  { size: "3X-Large", chest: 28, length: 34.5 },
  { size: "4X-Large", chest: 29.5, length: 36 },
  { size: "5X-Large", chest: 31, length: 37.5 },
];

const youthTeeSizes: SizeRow[] = [
  { size: "Small", chest: 16, length: 23 },
  { size: "Medium", chest: 17, length: 24 },
  { size: "Large", chest: 18, length: 25 },
  { size: "X-Large", chest: 19, length: 26 },
];

const teeColumns: ChartColumn[] = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Length" },
];

const babyDollColumns: ChartColumn[] = [
  { key: "chest", label: "Chest" },
  { key: "length", label: "Height" },
];

const waistColumns: ChartColumn[] = [
  { key: "waist", label: "Waist" },
];

const chestOnlyColumns: ChartColumn[] = [
  { key: "chest", label: "Chest" },
];

const boxersColumns: ChartColumn[] = [
  { key: "waist", label: "Waist", showBoth: true },
  { key: "length", label: "Length" },
  { key: "inseam", label: "Inseam" },
];

const chinoColumns: ChartColumn[] = [
  { key: "waist", label: "Waist" },
  { key: "thigh", label: "Thigh" },
  { key: "leg_opening", label: "Leg Opening" },
  { key: "inseam", label: "Inseam" },
];

const charts: Record<string, ChartConfig> = {
  standard: {
    title: "Standard Tee Size Chart",
    subtitle: "Standard Tee Sizing",
    sizes: standardSizes,
    columns: teeColumns,
    note: "Our standard 100% combed cotton tubular jersey tee and features 1 in. Neck ribbing.",
  },
  premium: {
    title: "Premium Tee Size Chart",
    subtitle: "Premium Tee Sizing",
    sizes: premiumSizes,
    columns: teeColumns,
    note: "Premium tee fit is slightly smaller than our standard which is true to size or one size up from your normal standard tee size.",
  },
  "1ton": {
    title: "1Ton Oversized Tee Size Chart",
    subtitle: "Oversized Tee Sizing",
    sizes: oneTonSizes,
    columns: teeColumns,
    note: "1ton tees fit is slightly larger than our standard which is relaxed fit or one size up from your normal standard tee size.",
  },
  babydoll: {
    title: "Baby Doll Women's Tee Size Chart",
    subtitle: "Baby Doll Tee Sizing",
    sizes: babyDollSizes,
    columns: babyDollColumns,
    note: "Baby Doll tees have a fitted women's cut. Please refer to the chest and height measurements for the best fit.",
  },
  "bikini-top": {
    title: "Bikini Top Size Chart",
    subtitle: "Bikini Top Sizing",
    sizes: bikiniTopSizes,
    columns: chestOnlyColumns,
    note: "Measurements are based on chest circumference in inches. Please refer to your bust measurement for the best fit.",
  },
  "bikini-bottom": {
    title: "Bikini Bottoms Size Chart",
    subtitle: "Bikini Bottoms Sizing",
    sizes: bikiniBottomSizes,
    columns: waistColumns,
    note: "Measurements are taken flat across the waist. Please refer to your natural waist measurement for the best fit.",
  },
  boyshorts: {
    title: "Boy Shorts Size Chart",
    subtitle: "Women's Boy Shorts Sizing",
    sizes: boyShortsizes,
    columns: waistColumns,
    note: "Waist is measured at the natural waistline. For the best fit, measure your waist and compare to the chart.",
  },
  bralette: {
    title: "Bralette Size Chart",
    subtitle: "Women's Bralette Sizing",
    sizes: braletteSizes,
    columns: chestOnlyColumns,
    note: "Chest is measured around the fullest part of the bust. For the best fit, measure your bust and compare to the chart.",
  },
  boxers: {
    title: "Men's Boxers Size Chart",
    subtitle: "Men's Boxers Sizing",
    sizes: mensBoxersSizes,
    columns: boxersColumns,
    note: "Waist is measured at the natural waistline. Length and inseam are measured flat. For the best fit, measure your waist and compare to the chart.",
  },
  chinos: {
    title: "Chino Pants Size Chart",
    subtitle: "Chino Pants Sizing",
    sizes: chinoPantsSizes,
    columns: chinoColumns,
    note: "All measurements are in inches. Inseam is 32\" across all sizes. For the best fit, measure your waist and compare to the chart.",
  },
  "e-waist": {
    title: "E-Waist Pants Size Chart",
    subtitle: "E-Waist Pants Sizing",
    sizes: eWaistPantsSizes,
    columns: [
      { key: "waist", label: "Waist", showBoth: true },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Elastic waistband for comfort. Waist is measured at the natural waistline. Inseam is 32\" across all sizes.",
  },
  "e-waist-shorts": {
    title: "E-Waist Shorts Size Chart",
    subtitle: "E-Waist Shorts Sizing",
    sizes: eWaistShortsSizes,
    columns: [
      { key: "waist", label: "Waist", showBoth: true },
    ],
    note: "Elastic waistband for comfort. Waist is measured at the natural waistline.",
  },
  "jersey-shorts": {
    title: "Jersey Shorts Size Chart",
    subtitle: "Jersey Shorts Sizing",
    sizes: jerseyShortsizes,
    columns: [
      { key: "waist", label: "Waist", showBoth: true },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Waist is measured at the natural waistline. Inseam is 8.5\" across all sizes.",
  },
  "tank-jersey": {
    title: "Tank / Jersey Top Size Chart",
    subtitle: "Tank & Jersey Top Sizing",
    sizes: tankJerseySizes,
    columns: teeColumns,
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
  belt: {
    title: "Men's Belt Size Chart",
    subtitle: "Belt Sizing",
    sizes: beltSizes,
    columns: [
      { key: "waist", label: "Waist" },
      { key: "length", label: "Length" },
    ],
    note: "Waist is the range of waist sizes the belt fits. Length is the total belt length in inches.",
  },
  polo: {
    title: "Polo Size Chart",
    subtitle: "Polo Sizing",
    sizes: poloSizes,
    columns: teeColumns,
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
  "pajama-pants": {
    title: "Pajama Pants Size Chart",
    subtitle: "Pajama Pants Sizing",
    sizes: pajamaPantsSizes,
    columns: [
      { key: "waist", label: "Waist" },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Waist is the range of waist sizes. Inseam is measured in inches.",
  },
  sweatshirt: {
    title: "Standard Sweatshirt Size Chart",
    subtitle: "Sweatshirt Sizing",
    sizes: sweatshirtSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  walkshorts: {
    title: "Walkshorts Size Chart",
    subtitle: "Walkshorts Sizing",
    sizes: walkshortsSizes,
    columns: [
      { key: "waist", label: "Waist" },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Waist is the range of waist sizes. Inseam is 11\" across all sizes.",
  },
  sweatpants: {
    title: "Sweatpants Size Chart",
    subtitle: "Sweatpants Sizing",
    sizes: sweatpantsSizes,
    columns: [
      { key: "waist", label: "Waist" },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Waist is the range of waist sizes. Inseam is 29\" across all sizes.",
  },
  sweatshorts: {
    title: "Sweatshorts Size Chart",
    subtitle: "Sweatshorts Sizing",
    sizes: sweatshortsSizes,
    columns: [
      { key: "waist", label: "Waist" },
    ],
    note: "Waist is the range of waist sizes in inches.",
  },
  "mens-tank": {
    title: "Men's Tank Top Size Chart",
    subtitle: "Men's Tank Top Sizing",
    sizes: mensTankSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  "thermal-ls": {
    title: "Thermal Long Sleeve Size Chart",
    subtitle: "Thermal Long Sleeve Sizing",
    sizes: thermalLSSizes,
    columns: [
      { key: "chest", label: "Chest" },
      { key: "length", label: "Length" },
      { key: "sleeve", label: "Sleeve" },
    ],
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
  thong: {
    title: "Thong Size Chart",
    subtitle: "Thong Sizing",
    sizes: thongSizes,
    columns: [
      { key: "waist", label: "Waist" },
    ],
    note: "Waist is the range of waist sizes in inches.",
  },
  "womens-boy-tee": {
    title: "Women's Boy Tee Size Chart",
    subtitle: "Women's Boy Tee Sizing",
    sizes: womensBoyTeeSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  "womens-crop": {
    title: "Women's Crop Top Size Chart",
    subtitle: "Women's Crop Top Sizing",
    sizes: womensCropTopSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  "womens-sweatpants": {
    title: "Women's Sweatpants Size Chart",
    subtitle: "Women's Sweatpants Sizing",
    sizes: womensSweatpantsSizes,
    columns: [
      { key: "waist", label: "Waist", showBoth: true },
      { key: "inseam", label: "Inseam" },
    ],
    note: "Waist is measured in inches. Inseam is 29\" across most sizes.",
  },
  woven: {
    title: "Wovens Size Chart",
    subtitle: "Woven Sizing",
    sizes: wovenSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  "youth-tee": {
    title: "Youth Tee Size Chart",
    subtitle: "Youth Tee Sizing",
    sizes: youthTeeSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across the chest and compare to the chart.",
  },
  fleece: {
    title: "Ever Crew Light Fleece Size Chart",
    subtitle: "Light Fleece Sizing",
    sizes: fleeceSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  cargo: {
    title: "Expedition Cargo Pant Size Chart",
    subtitle: "Cargo Pants Sizing",
    sizes: cargoPantSizes,
    columns: chinoColumns,
    note: "All measurements are in inches. Inseam is 32\" across all sizes. For the best fit, measure your waist and compare to the chart.",
  },
  flannel: {
    title: "Flannel Size Chart",
    subtitle: "Flannel Sizing",
    sizes: flannelSizes,
    columns: [
      { key: "chest", label: "Chest" },
      { key: "body_length", label: "Body Length" },
      { key: "sleeve", label: "Sleeve Length" },
    ],
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
  "french-terry-ls": {
    title: "French Terry Long Sleeve Size Chart",
    subtitle: "French Terry Long Sleeve Sizing",
    sizes: frenchTerryLSSizes,
    columns: [
      { key: "chest", label: "Chest" },
      { key: "length", label: "Length" },
      { key: "sleeve", label: "Sleeve" },
    ],
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
  "hw-pullover": {
    title: "Heavyweight Pullover Fleece Size Chart",
    subtitle: "Heavyweight Pullover Sizing",
    sizes: hwPulloverSizes,
    columns: babyDollColumns,
    note: "Chest and height measurements are taken flat. For the best fit, measure across your chest and compare to the chart.",
  },
  jacket: {
    title: "Jacket Size Chart",
    subtitle: "Jacket Sizing",
    sizes: jacketSizes,
    columns: [
      { key: "chest", label: "Chest" },
      { key: "body_length", label: "Body Length" },
      { key: "sleeve", label: "Sleeve Length" },
    ],
    note: "All measurements are in inches. For the best fit, measure across your chest and compare to the chart.",
  },
};

export type SizeChartType = keyof typeof charts;

const toCm = (inches: number) => Math.round(inches * 2.54 * 100) / 100;

const formatVal = (val: number | string, unit: "inches" | "cm"): string => {
  if (typeof val === "string") return val;
  return unit === "inches" ? String(val) : String(toCm(val));
};

type Unit = "inches" | "cm";

interface SizeChartModalProps {
  children: React.ReactNode;
  chartType?: SizeChartType;
}

export function SizeChartModal({ children, chartType = "standard" }: SizeChartModalProps) {
  const [unit, setUnit] = useState<Unit>("inches");
  const chart = charts[chartType];

  const hasMultipleColumns = chart.columns.length > 2;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={`bg-background border-border ${hasMultipleColumns ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Ruler className="h-5 w-5 text-primary" />
            <DialogTitle className="font-hudson text-xl uppercase tracking-[0.08em] text-center">
              {chart.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-body text-center -mt-1">
          {chart.subtitle}
        </p>

        {/* Unit toggle */}
        <div className="flex justify-center gap-0 border-b border-border mb-2">
          {(["inches", "cm"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-6 py-2 text-xs font-display uppercase tracking-[0.15em] transition-colors relative ${
                unit === u
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {u === "inches" ? "Inches" : "Centimeter"}
              {unit === u && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-3 px-3 text-left text-xs font-display uppercase tracking-[0.15em] text-foreground">
                  Size
                </th>
                {chart.columns.map((col) => (
                  <th key={col.key} className="py-3 px-3 text-center text-xs font-display uppercase tracking-[0.12em] text-foreground">
                    {col.showBoth ? (
                      <>{col.label}</>
                    ) : (
                      <>{col.label} <span className="text-muted-foreground font-normal">({unit === "inches" ? "in" : "cm"})</span></>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.sizes.map((row, i) => (
                <tr
                  key={row.size}
                  className={`border-b border-border/50 last:border-0 transition-colors ${
                    i % 2 === 0 ? "" : "bg-secondary/10"
                  }`}
                >
                  <td className="py-3 px-3 font-display uppercase tracking-wider text-xs text-foreground font-semibold whitespace-nowrap">
                    {row.size}
                  </td>
                  {chart.columns.map((col) => {
                    if (col.showBoth) {
                      const inVal = row[col.key];
                      const cmVal = row[`${col.key}_cm`];
                      return (
                        <td key={col.key} className="py-3 px-3 text-center text-muted-foreground whitespace-nowrap">
                          {unit === "inches"
                            ? String(inVal)
                            : String(cmVal ?? (typeof inVal === "number" ? toCm(inVal) : inVal))}
                        </td>
                      );
                    }
                    const val = row[col.key];
                    return (
                      <td key={col.key} className="py-3 px-3 text-center text-muted-foreground">
                        {typeof val === "number" ? formatVal(val, unit) : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-muted-foreground font-body text-center leading-relaxed mt-1">
          {chart.note}
        </p>
      </DialogContent>
    </Dialog>
  );
}
