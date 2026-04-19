import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InterestPickerProps {
  predefinedOptions: string[];
  selected: string[];
  onAdd: (interest: string) => void;
  onRemove: (interest: string) => void;
  hasError?: boolean;
}

/**
 * Multi-select chip picker for interests.
 *
 * Predefined options are shown as toggleable chips. An "Otro" button
 * reveals a free-text input to add a custom interest.
 */
export function InterestPicker({
  predefinedOptions,
  selected,
  onAdd,
  onRemove,
  hasError = false,
}: InterestPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const customInterests = selected.filter((s) => !predefinedOptions.includes(s));

  const togglePredefined = (option: string) => {
    if (selected.includes(option)) {
      onRemove(option);
    } else {
      onAdd(option);
    }
  };

  const confirmCustom = () => {
    const trimmed = customText.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onAdd(trimmed);
    }
    setCustomText('');
    setShowCustomInput(false);
  };

  return (
    <View>
      {/* Predefined chips */}
      <View className="flex-row flex-wrap gap-2 mb-2">
        {predefinedOptions.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              onPress={() => togglePredefined(option)}
              activeOpacity={0.75}
              className={`rounded-full px-3 py-1.5 border ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-white border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-text-muted'
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Otro button */}
        <TouchableOpacity
          onPress={() => setShowCustomInput(true)}
          activeOpacity={0.75}
          className="rounded-full px-3 py-1.5 border border-dashed border-primary/50 bg-primary/5"
        >
          <Text className="text-sm font-medium text-primary">+ Otro</Text>
        </TouchableOpacity>
      </View>

      {/* Custom interests (added by the user) */}
      {customInterests.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-2">
          {customInterests.map((interest) => (
            <TouchableOpacity
              key={interest}
              onPress={() => onRemove(interest)}
              activeOpacity={0.75}
              className="flex-row items-center gap-1 bg-primary border border-primary rounded-full px-3 py-1.5"
            >
              <Text className="text-sm font-medium text-white">{interest}</Text>
              <Ionicons name="close-circle" size={14} color="white" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Custom text input */}
      {showCustomInput && (
        <View className="flex-row gap-2 mt-1">
          <TextInput
            className={`flex-1 bg-white border rounded-xl px-4 py-3 text-base text-text-primary ${
              hasError ? 'border-red-400' : 'border-border'
            }`}
            placeholder="Escribe tu interés"
            value={customText}
            onChangeText={setCustomText}
            onSubmitEditing={confirmCustom}
            returnKeyType="done"
            autoFocus
          />
          <TouchableOpacity
            onPress={confirmCustom}
            activeOpacity={0.85}
            className="bg-primary rounded-xl px-4 justify-center"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
