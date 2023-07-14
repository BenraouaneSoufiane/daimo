import { Octicons } from "@expo/vector-icons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { useCallback, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  View,
} from "react-native";

import { color, ss } from "./style";

export type OctName = typeof Octicons extends Icon<infer G, any> ? G : never;

export function InputBig({
  value,
  onChange,
  placeholder,
  icon,
  center,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View style={isFocused ? styles.inputRowFocused : styles.inputRow}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={color.gray}
        value={value}
        onChangeText={onChange}
        style={center ? styles.inputCentered : styles.input}
        multiline
        numberOfLines={1}
        autoCapitalize="none"
        autoCorrect={false}
        {...{ onFocus, onBlur }}
      />
      {icon && <Octicons name={icon} size={16} color="gray" />}
    </View>
  );
}

export function AmountInput({
  value,
  onChange,
  onSubmitEditing,
  innerRef,
}: {
  value: number;
  onChange: (amount: number) => void;
  onSubmitEditing?: () => void;
  innerRef?: React.Ref<TextInput>;
}) {
  if (value < 0) throw new Error("AmountPicker value can't be negative");

  const [strVal, setStrVal] = useState(value === 0 ? "" : value.toFixed(2));

  // On blur, round value to 2 decimal places
  const blur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const value = e.nativeEvent.text;
      let newVal = parseFloat(value);
      if (!(newVal >= 0)) {
        newVal = 0;
      }
      const newStrVal = newVal.toFixed(2);
      setStrVal(newVal > 0 ? newStrVal : "");
      onChange(parseFloat(newStrVal));
    },
    []
  );

  const change = useCallback((text: string) => {
    setStrVal(text);
    const newVal = parseFloat(text);
    // Handle invalid or entry, NaN etc
    if (newVal > 0) onChange(newVal);
    else onChange(0);
  }, []);

  return (
    <TextInput
      ref={innerRef}
      style={styles.amountInput}
      keyboardType="numeric"
      placeholder="0.00"
      placeholderTextColor={color.gray}
      numberOfLines={1}
      autoFocus
      value={strVal}
      selectTextOnFocus
      onBlur={blur}
      onChangeText={change}
      onSubmitEditing={onSubmitEditing}
      returnKeyType="done"
    />
  );
}

const inputRow = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: color.bg.lightGray,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;

const input = {
  ...ss.text.body,
  flexGrow: 1,
  paddingTop: 0,
  paddingVertical: 0,
} as const;

const styles = StyleSheet.create({
  inputRow,
  inputRowFocused: {
    ...inputRow,
    backgroundColor: color.bg.blue,
  },
  input,
  inputCentered: {
    ...input,
    textAlign: "center",
  },
  amountInput: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomColor: color.gray,
    borderBottomWidth: 1,
  },
});
