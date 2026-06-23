import type { QuantMethod } from "@/quantize";
import type { CanvasType, ImageFitMode } from "@/types";
import type { RGB } from "@/palette";
import type { ResizeFilter } from "@/preprocess";
import { DEFAULT_PADDING_COLOR } from "@/preprocess";
import { CANVAS_TYPES } from "@/types";

export interface AppState {
  originalUrl: string | null;
  preprocessedUrl: string | null;
  quantizedUrl: string | null;
  adaptivePalette: readonly RGB[];
  loading: boolean;
  error: string | null;
  selectedCanvas: CanvasType;
  showGrid: boolean;
  quantMethod: QuantMethod;
  fitMode: ImageFitMode;
  paddingColor: RGB;
  paddingColorPreview: RGB;
  quantizationEnabled: boolean;
  adaptiveColorCount: number;
  includeFixedPalette: boolean;
  resizeFilter: ResizeFilter;
  unsharpAmount: number;
  title: string;
  author: string;
  signed: boolean;
}

export type AppAction =
  | { type: "SET_ORIGINAL"; url: string }
  | {
      type: "SET_RESULT";
      preprocessed: string;
      processed: string;
      adaptive: readonly RGB[];
    }
  | {
      type: "IMPORT_PAINT";
      canvas: CanvasType;
      title: string;
      author: string;
      signed: boolean;
      preprocessed: string;
      processed: string;
    }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_CANVAS"; canvas: CanvasType }
  | { type: "SET_SHOW_GRID"; show: boolean }
  | { type: "SET_QUANT_METHOD"; method: QuantMethod }
  | { type: "SET_FIT_MODE"; mode: ImageFitMode }
  | { type: "SET_PADDING_COLOR"; color: RGB }
  | { type: "SET_PADDING_PREVIEW"; color: RGB }
  | { type: "SET_QUANTIZATION_ENABLED"; enabled: boolean }
  | { type: "SET_ADAPTIVE_COLOR_COUNT"; count: number }
  | { type: "SET_INCLUDE_FIXED_PALETTE"; include: boolean }
  | { type: "SET_RESIZE_FILTER"; filter: ResizeFilter }
  | { type: "SET_UNSHARP_AMOUNT"; amount: number }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_AUTHOR"; author: string }
  | { type: "SET_SIGNED"; signed: boolean }
  | { type: "RESET" };

export const initialState: AppState = {
  originalUrl: null,
  preprocessedUrl: null,
  quantizedUrl: null,
  adaptivePalette: [],
  loading: false,
  error: null,
  selectedCanvas: CANVAS_TYPES[0],
  showGrid: false,
  quantMethod: "median-cut",
  fitMode: "contain",
  paddingColor: DEFAULT_PADDING_COLOR,
  paddingColorPreview: DEFAULT_PADDING_COLOR,
  quantizationEnabled: false,
  adaptiveColorCount: 12,
  includeFixedPalette: false,
  resizeFilter: "box",
  unsharpAmount: 0,
  title: "",
  author: "",
  signed: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ORIGINAL":
      return { ...state, originalUrl: action.url, error: null };
    case "SET_RESULT":
      return {
        ...state,
        preprocessedUrl: action.preprocessed,
        quantizedUrl: action.processed,
        adaptivePalette: action.adaptive,
        loading: false,
      };
    case "IMPORT_PAINT":
      return {
        ...state,
        selectedCanvas: action.canvas,
        title: action.title,
        author: action.author,
        signed: action.signed,
        preprocessedUrl: action.preprocessed,
        quantizedUrl: action.processed,
        originalUrl: action.preprocessed,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_CANVAS":
      return { ...state, selectedCanvas: action.canvas };
    case "SET_SHOW_GRID":
      return { ...state, showGrid: action.show };
    case "SET_QUANT_METHOD":
      return { ...state, quantMethod: action.method };
    case "SET_FIT_MODE":
      return { ...state, fitMode: action.mode };
    case "SET_PADDING_COLOR":
      return { ...state, paddingColor: action.color, paddingColorPreview: action.color };
    case "SET_PADDING_PREVIEW":
      return { ...state, paddingColorPreview: action.color };
    case "SET_QUANTIZATION_ENABLED":
      return { ...state, quantizationEnabled: action.enabled };
    case "SET_ADAPTIVE_COLOR_COUNT":
      return { ...state, adaptiveColorCount: action.count };
    case "SET_INCLUDE_FIXED_PALETTE":
      return { ...state, includeFixedPalette: action.include };
    case "SET_RESIZE_FILTER":
      return { ...state, resizeFilter: action.filter };
    case "SET_UNSHARP_AMOUNT":
      return { ...state, unsharpAmount: action.amount };
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SET_AUTHOR":
      return { ...state, author: action.author };
    case "SET_SIGNED":
      return { ...state, signed: action.signed };
    case "RESET":
      return initialState;
  }
}
