import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectInputProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  otherLabel?: string;
  hasError?: boolean;
}

type Mode = 'idle' | 'open' | 'other';

/**
 * Combo-box input that shows a predefined option list and falls back
 * to a free-text field when the user selects "Otro".
 */
export function SelectInput({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  otherLabel = 'Otro',
  hasError = false,
}: SelectInputProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [otherText, setOtherText] = useState('');

  const isOtherActive = mode === 'other';
  const displayValue = isOtherActive ? otherText : value;

  const handleSelect = (option: string) => {
    if (option === otherLabel) {
      setMode('other');
      setOtherText('');
      onChange('');
    } else {
      setMode('idle');
      onChange(option);
    }
  };

  const handleOtherChange = (text: string) => {
    setOtherText(text);
    onChange(text);
  };

  const backToList = () => {
    setMode('idle');
    setOtherText('');
    onChange('');
  };

  const allOptions = [...options, otherLabel];

  if (isOtherActive) {
    return (
      <View className="flex-row gap-2">
        <TextInput
          className={`flex-1 bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
            hasError ? 'border-red-400' : 'border-border'
          }`}
          placeholder="Escribe tu opción"
          value={otherText}
          onChangeText={handleOtherChange}
          autoFocus
          autoCapitalize="words"
        />
        <TouchableOpacity
          onPress={backToList}
          activeOpacity={0.75}
          className="bg-gray-100 border border-border rounded-xl px-3.5 justify-center"
        >
          <Ionicons name="list-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setMode('open')}
        activeOpacity={0.8}
        className={`bg-white border rounded-xl px-4 py-3.5 flex-row items-center justify-between ${
          hasError ? 'border-red-400' : 'border-border'
        }`}
      >
        <Text
          className={`text-base flex-1 mr-2 ${
            displayValue ? 'text-text-primary' : 'text-gray-400'
          }`}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={mode === 'open'} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setMode('idle')}
        >
          <SafeAreaView className="bg-white rounded-t-2xl" style={{ maxHeight: '65%' }}>
            <View className="px-4 pt-4 pb-3 border-b border-border flex-row justify-between items-center">
              <Text className="text-base font-semibold text-text-primary">
                Selecciona una opción
              </Text>
              <TouchableOpacity onPress={() => setMode('idle')}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allOptions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isOtherItem = item === otherLabel;
                const isSelected = item === value;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className="px-5 py-4 border-b border-border/40 flex-row items-center justify-between"
                  >
                    <Text
                      className={`text-base ${
                        isOtherItem
                          ? 'text-primary font-semibold'
                          : 'text-text-primary'
                      }`}
                    >
                      {item}
                    </Text>
                    {isSelected && !isOtherItem && (
                      <Ionicons name="checkmark" size={18} color="#006A75" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
