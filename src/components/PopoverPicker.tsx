import { HexColorPicker } from "react-colorful";

import { Popover } from "@base-ui/react/popover";

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
  onChangeEnd?: (color: string) => void;
}

export const PopoverPicker = ({ color, onChange, onChangeEnd }: PopoverPickerProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="h-7 w-7 cursor-pointer rounded-lg border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className="rounded-lg border border-gray-200/10 shadow-lg">
            <HexColorPicker color={color} onChange={onChange} onChangeEnd={onChangeEnd} />
            <input
              type="text"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-b-lg border-t border-gray-200/10 bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
