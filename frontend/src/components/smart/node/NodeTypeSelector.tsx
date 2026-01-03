import StyledButton from '../../atomic/StylizedButton';
import clsx from 'clsx';

interface NodeTypeSelectorProps {
  selectedType: string;
  nodeTypes: string[];
  mode: 'create' | 'edit';
  onTypeSelect: (type: string) => void;
}

export default function NodeTypeSelector({ selectedType, nodeTypes, mode, onTypeSelect }: NodeTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        Node Type
      </label>
      <div className="grid gap-2">
        {nodeTypes.map((t) => (
          <StyledButton
            key={t}
            variant={selectedType === t ? "primary" : "secondary"}
            size="sm"
            className={clsx(
              "justify-center w-full text-center py-2",
              mode === "edit" && selectedType !== t && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => mode === "create" && onTypeSelect(t)}
            disabled={mode === "edit"}
          >
            {t.toUpperCase()}
          </StyledButton>
        ))}
      </div>
    </div>
  );
}
