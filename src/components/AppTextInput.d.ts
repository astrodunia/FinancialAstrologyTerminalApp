import type React from 'react';
import type { TextInput, TextInputProps } from 'react-native';

declare const AppTextInput: React.ForwardRefExoticComponent<
  TextInputProps & React.RefAttributes<TextInput>
>;

export default AppTextInput;
