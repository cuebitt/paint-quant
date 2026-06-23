import { HexColorPicker } from "react-colorful";

import { Popover } from "@base-ui/react/popover";

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
  onChangeEnd?: (color: string) => void;
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export function PopoverPicker({ color, onChange, onChangeEnd }: PopoverPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="h-7 w-7 cursor-pointer rounded-lg border-2 border-border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="rounded-lg border border-border shadow-lg">
            <HexColorPicker color={color} onChange={onChange} onChangeEnd={onChangeEnd} />
            <input
              type="text"
              value={color}
              aria-label="Hex color"
              onChange={(e) => {
                const val = e.target.value;
                if (HEX_COLOR_RE.test(val)) {
                  onChange(val);
                }
              }}
              className="w-full rounded-b-lg border-t border-border bg-background px-3 py-2 text-sm focus:outline-none"
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
