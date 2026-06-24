import { useReducer, useCallback, useRef } from "preact/hooks";
import type { AppState, AppAction } from "@/app/app-state";
import { appReducer, initialState } from "@/app/app-state";

interface UndoRedoState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

type UndoRedoAction = { type: "UNDO" } | { type: "REDO" } | { type: "DO"; state: AppState };

const MAX_HISTORY = 50;

function undoRedoReducer(state: UndoRedoState, action: UndoRedoAction): UndoRedoState {
  switch (action.type) {
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case "DO": {
      const newPast =
        state.past.length >= MAX_HISTORY
          ? [...state.past.slice(1), state.present]
          : [...state.past, state.present];
      return {
        past: newPast,
        present: action.state,
        future: [],
      };
    }
    default:
      return state;
  }
}

export function useUndoRedo() {
  const [undoRedoState, dispatch] = useReducer(undoRedoReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const stateRef = useRef(undoRedoState.present);
  stateRef.current = undoRedoState.present;

  const dispatchApp = useCallback((action: AppAction) => {
    dispatch({ type: "DO", state: appReducer(stateRef.current, action) });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  return {
    state: undoRedoState.present,
    dispatch: dispatchApp,
    undo,
    redo,
  };
}
