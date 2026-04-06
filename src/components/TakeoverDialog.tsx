import React from 'react';
import { ShieldCheck } from 'lucide-react-native';
import DialogX from './DialogX';

type TakeoverDialogProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TakeoverDialog({ visible, onCancel, onConfirm }: TakeoverDialogProps) {
  return (
    <DialogX
      visible={visible}
      tone="default"
      icon={ShieldCheck}
      title="Continue On This Device?"
      message="This account is already active on another device. Continue here and log out the old device?"
      onRequestClose={onCancel}
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onPress: onCancel,
        },
        {
          label: 'Continue Here',
          variant: 'primary',
          onPress: onConfirm,
        },
      ] as any}
    />
  );
}
